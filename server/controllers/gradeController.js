const Grade = require('../models/Grade');
const CourseOffering = require('../models/CourseOffering');
const Enrollment = require('../models/Enrollment');
const Lesson = require('../models/Lesson');
const Quiz = require('../models/Quiz');
const QuizAttempt = require('../models/QuizAttempt');
const StudentProfile = require('../models/StudentProfile');

// @desc    Get student's full academic record across all courses
// @route   GET /api/grades/my-record
// @access  Student
const getStudentAcademicRecord = async (req, res) => {
  try {
    const studentId = req.user._id;

    const enrollments = await Enrollment.find({
      student: studentId,
      status: 'active',
    }).populate({
      path: 'courseOffering',
      populate: [
        { path: 'course' },
        { path: 'academicYear' },
        { path: 'semester' },
        { path: 'faculty', select: 'firstName lastName email' },
      ],
    });

    const records = await Promise.all(
      enrollments.map(async (enr) => {
        const offering = enr.courseOffering;
        if (!offering) return null;

        let grade = await Grade.findOne({
          student: studentId,
          courseOffering: offering._id,
        }).populate('quizGrades.quiz', 'title totalPoints passingPercentage');

        const totalLessons = await Lesson.countDocuments({
          courseOffering: offering._id,
          isPublished: true,
        });

        return {
          enrollmentId: enr._id,
          courseOffering: offering,
          grade: grade || null,
          totalLessons,
        };
      })
    );

    res.status(200).json({ success: true, data: records.filter(Boolean) });
  } catch (error) {
    console.error('getStudentAcademicRecord error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get faculty gradebook for a course offering
// @route   GET /api/grades/gradebook/:courseOfferingId
// @access  Faculty
const getFacultyGradebook = async (req, res) => {
  try {
    const { courseOfferingId } = req.params;

    const offering = await CourseOffering.findById(courseOfferingId)
      .populate('course')
      .populate('academicYear')
      .populate('semester');

    if (!offering) {
      return res.status(404).json({ success: false, message: 'Course offering not found' });
    }

    if (offering.faculty.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized for this course' });
    }

    // Get all quizzes in this course offering
    const lessons = await Lesson.find({
      courseOffering: courseOfferingId,
      isPublished: true,
    }).sort({ order: 1 });

    const quizzes = await Quiz.find({
      lesson: { $in: lessons.map((l) => l._id) },
    }).populate('lesson', 'title order');

    // Get all enrolled students
    const enrollments = await Enrollment.find({
      courseOffering: courseOfferingId,
      status: 'active',
    }).populate('student', 'firstName middleName lastName email');

    // Compile gradebook data for each student
    const studentGrades = await Promise.all(
      enrollments.map(async (enr) => {
        const student = enr.student;
        if (!student) return null;

        const profile = await StudentProfile.findOne({ user: student._id }).populate(
          'degreeProgram'
        );

        // Fetch student's Grade doc or create if missing
        let gradeDoc = await Grade.findOne({
          student: student._id,
          courseOffering: courseOfferingId,
        });

        // Get attempts for all quizzes in this offering
        const quizResults = await Promise.all(
          quizzes.map(async (q) => {
            const attempts = await QuizAttempt.find({
              quiz: q._id,
              student: student._id,
            }).sort({ score: -1 });

            const bestAttempt = attempts[0] || null;

            return {
              quizId: q._id,
              quizTitle: q.title,
              lessonTitle: q.lesson?.title || 'Lesson',
              lessonOrder: q.lesson?.order || 0,
              totalPoints: q.totalPoints,
              passingPercentage: q.passingPercentage,
              highestScore: bestAttempt ? bestAttempt.score : null,
              percentage: bestAttempt ? bestAttempt.percentage : null,
              passed: bestAttempt ? bestAttempt.passed : false,
              attemptsCount: attempts.length,
            };
          })
        );

        // Calculate average percentage
        const gradedQuizzes = quizResults.filter((q) => q.percentage !== null);
        const avgPercentage = gradedQuizzes.length
          ? Math.round(
              gradedQuizzes.reduce((acc, q) => acc + q.percentage, 0) /
                gradedQuizzes.length
            )
          : null;

        return {
          enrollmentId: enr._id,
          student: {
            _id: student._id,
            firstName: student.firstName,
            middleName: student.middleName,
            lastName: student.lastName,
            email: student.email,
            studentId: profile?.studentId || 'N/A',
            degreeProgram: profile?.degreeProgram?.programCode || 'N/A',
            section: profile?.section || '',
          },
          gradeId: gradeDoc?._id || null,
          quizResults,
          averageQuizPercentage: avgPercentage,
          additionalGrades: gradeDoc?.additionalGrades || [],
          overallGrade: gradeDoc?.overallGrade ?? avgPercentage,
          letterGrade: gradeDoc?.letterGrade || '',
          remarks: gradeDoc?.remarks || '',
        };
      })
    );

    res.status(200).json({
      success: true,
      data: {
        courseOffering: offering,
        quizzes,
        students: studentGrades.filter(Boolean),
      },
    });
  } catch (error) {
    console.error('getFacultyGradebook error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get grades for course offering
// @route   GET /api/grades/course-offering/:courseOfferingId
// @access  Faculty
const getGradesForCourseOffering = async (req, res) => {
  return getFacultyGradebook(req, res);
};

// @desc    Get single student grade for a course offering
// @route   GET /api/grades/student/:studentId/course-offering/:courseOfferingId
// @access  Authenticated
const getStudentGrade = async (req, res) => {
  try {
    const { studentId, courseOfferingId } = req.params;

    if (req.user.role === 'student' && req.user._id.toString() !== studentId) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    if (req.user.role === 'faculty') {
      const offering = await CourseOffering.findById(courseOfferingId);
      if (offering.faculty.toString() !== req.user._id.toString()) {
        return res.status(403).json({ success: false, message: 'Not authorized for this course' });
      }
    }

    let grade = await Grade.findOne({
      student: studentId,
      courseOffering: courseOfferingId,
    })
      .populate('quizGrades.quiz', 'title totalPoints passingPercentage')
      .populate('quizGrades.lesson', 'title order');

    const attempts = await QuizAttempt.find({
      student: studentId,
      courseOffering: courseOfferingId,
    })
      .populate('quiz', 'title totalPoints passingPercentage')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: {
        grade,
        attempts,
      },
    });
  } catch (error) {
    console.error('getStudentGrade error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update grade (Faculty)
// @route   PUT /api/grades/:id
// @access  Faculty
const updateGrade = async (req, res) => {
  try {
    let grade = await Grade.findById(req.params.id);
    if (!grade) {
      // If it wasn't created yet, check if student & courseOffering passed in body
      const { student, courseOffering } = req.body;
      if (student && courseOffering) {
        grade = new Grade({ student, courseOffering });
      } else {
        return res.status(404).json({ success: false, message: 'Grade document not found' });
      }
    }

    const offering = await CourseOffering.findById(grade.courseOffering);
    if (offering.faculty.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized for this course' });
    }

    const { additionalGrades, overallGrade, letterGrade, remarks } = req.body;

    if (additionalGrades !== undefined) grade.additionalGrades = additionalGrades;
    if (overallGrade !== undefined) grade.overallGrade = Number(overallGrade);
    if (letterGrade !== undefined) grade.letterGrade = letterGrade;
    if (remarks !== undefined) grade.remarks = remarks;
    grade.gradedBy = req.user._id;
    grade.lastUpdated = new Date();

    await grade.save();

    res.status(200).json({ success: true, data: grade });
  } catch (error) {
    console.error('updateGrade error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getStudentAcademicRecord,
  getFacultyGradebook,
  getGradesForCourseOffering,
  getStudentGrade,
  updateGrade,
};


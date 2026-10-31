const StudentProfile = require('../models/StudentProfile');
const Enrollment = require('../models/Enrollment');
const CourseOffering = require('../models/CourseOffering');
const Lesson = require('../models/Lesson');
const Quiz = require('../models/Quiz');
const QuizAttempt = require('../models/QuizAttempt');
const StudentProgress = require('../models/StudentProgress');
const AcademicYear = require('../models/AcademicYear');
const Semester = require('../models/Semester');

// @desc    Get student profile
// @route   GET /api/students/profile
// @access  Student
const getStudentProfile = async (req, res) => {
  try {
    const profile = await StudentProfile.findOne({ user: req.user._id }).populate(
      'degreeProgram'
    );
    res.status(200).json({
      success: true,
      data: {
        user: req.user,
        profile,
      },
    });
  } catch (error) {
    console.error('getStudentProfile error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update student profile
// @route   PUT /api/students/profile
// @access  Student
const updateStudentProfile = async (req, res) => {
  try {
    const { section } = req.body;

    const profile = await StudentProfile.findOne({ user: req.user._id });
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Profile not found' });
    }

    if (section !== undefined) profile.section = section;
    await profile.save();

    res.status(200).json({ success: true, data: profile });
  } catch (error) {
    console.error('updateStudentProfile error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get student dashboard
// @route   GET /api/students/dashboard
// @access  Student
const getStudentDashboard = async (req, res) => {
  try {
    const studentId = req.user._id;

    const profile = await StudentProfile.findOne({ user: studentId }).populate(
      'degreeProgram'
    );

    // Current Academic Year and Semester
    const currentAcademicYear = await AcademicYear.findOne({ isCurrent: true });
    const currentSemester = await Semester.findOne({ isCurrent: true }).populate('academicYear');

    // Active enrollments
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

    const enrolledOfferings = enrollments.map((e) => e.courseOffering).filter(Boolean);
    const offeringIds = enrolledOfferings.map((o) => o._id);

    // Lessons count & progress
    const totalPublishedLessons = await Lesson.countDocuments({
      courseOffering: { $in: offeringIds },
      isPublished: true,
    });

    const completedProgress = await StudentProgress.find({
      student: studentId,
      courseOffering: { $in: offeringIds },
      status: 'completed',
    });
    const completedLessonCount = completedProgress.length;

    const lockedProgress = await StudentProgress.countDocuments({
      student: studentId,
      courseOffering: { $in: offeringIds },
      status: 'locked',
    });

    // Per course progress
    const coursesWithProgress = await Promise.all(
      enrolledOfferings.map(async (offering) => {
        const totalLessons = await Lesson.countDocuments({
          courseOffering: offering._id,
          isPublished: true,
        });

        const completed = await StudentProgress.countDocuments({
          student: studentId,
          courseOffering: offering._id,
          status: 'completed',
        });

        const percent = totalLessons > 0 ? Math.round((completed / totalLessons) * 100) : 0;

        return {
          offering,
          totalLessons,
          completedLessons: completed,
          progressPercentage: percent,
        };
      })
    );

    // Recent quiz results (last 5)
    const recentQuizResults = await QuizAttempt.find({
      student: studentId,
    })
      .populate('quiz', 'title passingPercentage totalPoints')
      .populate({
        path: 'courseOffering',
        populate: { path: 'course', select: 'courseCode courseTitle' },
      })
      .sort({ createdAt: -1 })
      .limit(5);

    // Upcoming assessments (quizzes in enrolled courses that student hasn't passed)
    const publishedLessons = await Lesson.find({
      courseOffering: { $in: offeringIds },
      isPublished: true,
    });
    const publishedLessonIds = publishedLessons.map((l) => l._id);

    const availableQuizzes = await Quiz.find({
      lesson: { $in: publishedLessonIds },
      isPublished: true,
    }).populate({
      path: 'lesson',
      select: 'title order courseOffering',
      populate: {
        path: 'courseOffering',
        populate: { path: 'course', select: 'courseCode courseTitle' },
      },
    });

    const upcomingAssessments = [];
    for (const q of availableQuizzes) {
      const hasPassed = await QuizAttempt.findOne({
        quiz: q._id,
        student: studentId,
        passed: true,
      });

      if (!hasPassed) {
        const attemptsUsed = await QuizAttempt.countDocuments({
          quiz: q._id,
          student: studentId,
        });

        upcomingAssessments.push({
          quizId: q._id,
          title: q.title,
          lessonTitle: q.lesson?.title,
          course: q.lesson?.courseOffering?.course,
          passingPercentage: q.passingPercentage,
          totalPoints: q.totalPoints,
          timeLimit: q.timeLimit,
          attemptsUsed,
          maxAttempts: q.maxAttempts,
          availableUntil: q.availableUntil,
        });
      }
    }

    const overallProgressPercent =
      totalPublishedLessons > 0
        ? Math.round((completedLessonCount / totalPublishedLessons) * 100)
        : 0;

    res.status(200).json({
      success: true,
      data: {
        studentId: profile?.studentId || 'N/A',
        fullName: `${req.user.firstName} ${req.user.lastName}`,
        degreeProgram: profile?.degreeProgram,
        currentYearLevel: profile?.currentYearLevel || 1,
        section: profile?.section || '',
        currentAcademicYear: currentAcademicYear?.displayName || '2026-2027',
        currentSemester: currentSemester?.name || 'First Semester',
        enrolledCourses: coursesWithProgress,
        overallAcademicProgress: {
          totalLessons: totalPublishedLessons,
          completedLessons: completedLessonCount,
          lockedLessons: lockedProgress,
          percentage: overallProgressPercent,
        },
        recentQuizResults,
        upcomingAssessments: upcomingAssessments.slice(0, 5),
      },
    });
  } catch (error) {
    console.error('getStudentDashboard error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get student progress for a course offering
// @route   GET /api/progress/course/:courseOfferingId
// @access  Authenticated
const getStudentCourseProgress = async (req, res) => {
  try {
    const { courseOfferingId } = req.params;
    const studentId = req.user.role === 'student' ? req.user._id : req.query.studentId;

    if (!studentId) {
      return res.status(400).json({ success: false, message: 'Student ID is required' });
    }

    const lessons = await Lesson.find({
      courseOffering: courseOfferingId,
      isPublished: true,
    }).sort({ order: 1 });

    const progressRecords = await StudentProgress.find({
      student: studentId,
      courseOffering: courseOfferingId,
    });

    const quizzes = await Quiz.find({
      lesson: { $in: lessons.map((l) => l._id) },
    });

    const detailedProgress = lessons.map((lesson, idx) => {
      const progress = progressRecords.find(
        (p) => p.lessonId.toString() === lesson._id.toString()
      );
      const quiz = quizzes.find((q) => q.lesson.toString() === lesson._id.toString());

      return {
        lessonId: lesson._id,
        title: lesson.title,
        order: lesson.order,
        status: progress?.status || (idx === 0 ? 'available' : 'locked'),
        quizPassed: progress?.quizPassed || false,
        highestQuizScore: progress?.highestQuizScore || null,
        quiz: quiz
          ? {
              _id: quiz._id,
              title: quiz.title,
              passingPercentage: quiz.passingPercentage,
              totalPoints: quiz.totalPoints,
            }
          : null,
      };
    });

    res.status(200).json({ success: true, data: detailedProgress });
  } catch (error) {
    console.error('getStudentCourseProgress error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getStudentProfile,
  updateStudentProfile,
  getStudentDashboard,
  getStudentCourseProgress,
};


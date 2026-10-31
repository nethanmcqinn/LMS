const CourseOffering = require('../models/CourseOffering');
const Enrollment = require('../models/Enrollment');
const Lesson = require('../models/Lesson');
const Quiz = require('../models/Quiz');
const QuizAttempt = require('../models/QuizAttempt');
const StudentProgress = require('../models/StudentProgress');
const User = require('../models/User');
const StudentProfile = require('../models/StudentProfile');

// @desc    Get faculty dashboard statistics
// @route   GET /api/course-offerings/dashboard/stats
// @access  Faculty
const getFacultyDashboardStats = async (req, res) => {
  try {
    const facultyId = req.user._id;

    // Get all course offerings assigned to this faculty
    const offerings = await CourseOffering.find({ faculty: facultyId });
    const offeringIds = offerings.map((o) => o._id);

    // Total assigned courses
    const totalCourses = offerings.length;

    // Total unique students enrolled in these offerings
    const enrollments = await Enrollment.find({
      courseOffering: { $in: offeringIds },
      status: 'active',
    });
    const uniqueStudentIds = [
      ...new Set(enrollments.map((e) => e.student.toString())),
    ];
    const totalStudents = uniqueStudentIds.length;

    // Total lessons
    const lessons = await Lesson.find({ courseOffering: { $in: offeringIds } });
    const totalLessons = lessons.length;
    const lessonIds = lessons.map((l) => l._id);

    // Total quizzes
    const quizzes = await Quiz.find({ lesson: { $in: lessonIds } });
    const totalQuizzes = quizzes.length;

    // Quiz attempts for these offerings
    const attempts = await QuizAttempt.find({
      courseOffering: { $in: offeringIds },
    })
      .populate('student', 'firstName lastName email')
      .populate({
        path: 'quiz',
        select: 'title passingPercentage',
      })
      .sort({ createdAt: -1 });

    // Passed / failed stats based on student progress / attempts
    const passedAttempts = attempts.filter((a) => a.passed);
    const failedAttempts = attempts.filter((a) => !a.passed);

    // Count students with passing vs failing overall
    const studentPassedSet = new Set(passedAttempts.map((a) => a.student?._id?.toString()));
    const studentFailedSet = new Set(
      failedAttempts
        .filter((a) => !studentPassedSet.has(a.student?._id?.toString()))
        .map((a) => a.student?._id?.toString())
    );

    // Incomplete students: enrolled students who haven't completed all published lessons
    let incompleteCount = 0;
    for (const studentId of uniqueStudentIds) {
      // count active enrollments
      const studentOfferings = enrollments
        .filter((e) => e.student.toString() === studentId)
        .map((e) => e.courseOffering);

      const requiredLessons = await Lesson.countDocuments({
        courseOffering: { $in: studentOfferings },
        isPublished: true,
      });

      const completedLessons = await StudentProgress.countDocuments({
        student: studentId,
        courseOffering: { $in: studentOfferings },
        status: 'completed',
      });

      if (completedLessons < requiredLessons) {
        incompleteCount++;
      }
    }

    res.status(200).json({
      success: true,
      data: {
        totalCourses,
        totalStudents,
        totalLessons,
        totalQuizzes,
        passedStudents: studentPassedSet.size,
        failedStudents: studentFailedSet.size,
        incompleteStudents: incompleteCount,
        recentActivity: attempts.slice(0, 10),
      },
    });
  } catch (error) {
    console.error('getFacultyDashboardStats error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create course offering
// @route   POST /api/course-offerings
// @access  Faculty
const createCourseOffering = async (req, res) => {
  try {
    const {
      course,
      academicYear,
      semester,
      section,
      yearLevel,
      degreeProgram,
      maxStudents,
    } = req.body;

    const offering = await CourseOffering.create({
      course,
      academicYear,
      semester,
      faculty: req.user._id,
      section: section || 'Section A',
      yearLevel: yearLevel || 1,
      degreeProgram: degreeProgram || null,
      maxStudents: maxStudents || 50,
      isActive: true,
    });

    const populated = await CourseOffering.findById(offering._id)
      .populate('course')
      .populate('academicYear')
      .populate('semester')
      .populate('degreeProgram')
      .populate('faculty', 'firstName lastName email');

    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    console.error('createCourseOffering error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get course offerings (Faculty: owned; Student: enrolled)
// @route   GET /api/course-offerings
// @access  Authenticated
const getCourseOfferings = async (req, res) => {
  try {
    const { academicYear, semester } = req.query;
    const filter = {};
    if (academicYear) filter.academicYear = academicYear;
    if (semester) filter.semester = semester;

    if (req.user.role === 'faculty') {
      filter.faculty = req.user._id;
      const offerings = await CourseOffering.find(filter)
        .populate('course')
        .populate('academicYear')
        .populate('semester')
        .populate('degreeProgram')
        .sort({ createdAt: -1 });

      // Attach counts
      const results = await Promise.all(
        offerings.map(async (offering) => {
          const doc = offering.toObject();
          doc.enrolledCount = await Enrollment.countDocuments({
            courseOffering: offering._id,
            status: 'active',
          });
          doc.lessonCount = await Lesson.countDocuments({
            courseOffering: offering._id,
          });
          return doc;
        })
      );

      return res.status(200).json({ success: true, data: results });
    } else {
      // Student: find active enrollments
      const enrollments = await Enrollment.find({
        student: req.user._id,
        status: 'active',
      }).select('courseOffering');

      const offeringIds = enrollments.map((e) => e.courseOffering);
      filter._id = { $in: offeringIds };
      filter.isActive = true;

      const offerings = await CourseOffering.find(filter)
        .populate('course')
        .populate('academicYear')
        .populate('semester')
        .populate('faculty', 'firstName lastName email')
        .populate('degreeProgram')
        .sort({ createdAt: -1 });

      const results = await Promise.all(
        offerings.map(async (offering) => {
          const doc = offering.toObject();
          doc.lessonCount = await Lesson.countDocuments({
            courseOffering: offering._id,
            isPublished: true,
          });
          doc.completedLessons = await StudentProgress.countDocuments({
            student: req.user._id,
            courseOffering: offering._id,
            status: 'completed',
          });
          return doc;
        })
      );

      return res.status(200).json({ success: true, data: results });
    }
  } catch (error) {
    console.error('getCourseOfferings error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single course offering
// @route   GET /api/course-offerings/:id
// @access  Authenticated
const getCourseOffering = async (req, res) => {
  try {
    const offering = await CourseOffering.findById(req.params.id)
      .populate('course')
      .populate('academicYear')
      .populate('semester')
      .populate('degreeProgram')
      .populate('faculty', 'firstName lastName email');

    if (!offering) {
      return res
        .status(404)
        .json({ success: false, message: 'Course offering not found' });
    }

    // Role verification
    if (req.user.role === 'faculty') {
      if (offering.faculty._id.toString() !== req.user._id.toString()) {
        return res
          .status(403)
          .json({ success: false, message: 'Not authorized for this course offering' });
      }
    } else if (req.user.role === 'student') {
      const isEnrolled = await Enrollment.findOne({
        student: req.user._id,
        courseOffering: offering._id,
        status: 'active',
      });
      if (!isEnrolled) {
        return res
          .status(403)
          .json({ success: false, message: 'You are not enrolled in this course' });
      }
    }

    const doc = offering.toObject();
    doc.enrolledCount = await Enrollment.countDocuments({
      courseOffering: offering._id,
      status: 'active',
    });
    doc.lessonCount = await Lesson.countDocuments({
      courseOffering: offering._id,
      ...(req.user.role === 'student' ? { isPublished: true } : {}),
    });

    res.status(200).json({ success: true, data: doc });
  } catch (error) {
    console.error('getCourseOffering error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update course offering
// @route   PUT /api/course-offerings/:id
// @access  Faculty
const updateCourseOffering = async (req, res) => {
  try {
    const offering = await CourseOffering.findById(req.params.id);
    if (!offering) {
      return res
        .status(404)
        .json({ success: false, message: 'Course offering not found' });
    }

    if (offering.faculty.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ success: false, message: 'Not authorized to modify this course offering' });
    }

    const updatable = [
      'section',
      'yearLevel',
      'degreeProgram',
      'maxStudents',
      'isActive',
    ];
    updatable.forEach((field) => {
      if (req.body[field] !== undefined) offering[field] = req.body[field];
    });

    await offering.save();

    const populated = await CourseOffering.findById(offering._id)
      .populate('course')
      .populate('academicYear')
      .populate('semester')
      .populate('degreeProgram')
      .populate('faculty', 'firstName lastName email');

    res.status(200).json({ success: true, data: populated });
  } catch (error) {
    console.error('updateCourseOffering error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete course offering
// @route   DELETE /api/course-offerings/:id
// @access  Faculty
const deleteCourseOffering = async (req, res) => {
  try {
    const offering = await CourseOffering.findById(req.params.id);
    if (!offering) {
      return res
        .status(404)
        .json({ success: false, message: 'Course offering not found' });
    }

    if (offering.faculty.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ success: false, message: 'Not authorized to delete this course offering' });
    }

    // Soft delete or remove
    offering.isActive = false;
    await offering.save();

    res.status(200).json({ success: true, message: 'Course offering archived successfully' });
  } catch (error) {
    console.error('deleteCourseOffering error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get enrolled students for a course offering
// @route   GET /api/course-offerings/:id/students
// @access  Faculty
const getOfferingStudents = async (req, res) => {
  try {
    const offering = await CourseOffering.findById(req.params.id);
    if (!offering) {
      return res
        .status(404)
        .json({ success: false, message: 'Course offering not found' });
    }

    if (offering.faculty.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ success: false, message: 'Not authorized to view these students' });
    }

    const enrollments = await Enrollment.find({
      courseOffering: offering._id,
    })
      .populate({
        path: 'student',
        select: 'firstName middleName lastName email',
      })
      .sort({ createdAt: -1 });

    const studentList = await Promise.all(
      enrollments.map(async (enr) => {
        const student = enr.student;
        if (!student) return null;
        const profile = await StudentProfile.findOne({ user: student._id }).populate(
          'degreeProgram'
        );
        const progressCount = await StudentProgress.countDocuments({
          student: student._id,
          courseOffering: offering._id,
          status: 'completed',
        });
        const totalLessons = await Lesson.countDocuments({
          courseOffering: offering._id,
          isPublished: true,
        });

        return {
          enrollmentId: enr._id,
          enrollmentStatus: enr.status,
          enrollmentDate: enr.enrollmentDate,
          student: {
            _id: student._id,
            firstName: student.firstName,
            middleName: student.middleName,
            lastName: student.lastName,
            email: student.email,
            studentId: profile?.studentId || 'N/A',
            degreeProgram: profile?.degreeProgram || null,
            currentYearLevel: profile?.currentYearLevel || 1,
            section: profile?.section || '',
          },
          completedLessons: progressCount,
          totalLessons,
          progressPercentage:
            totalLessons > 0 ? Math.round((progressCount / totalLessons) * 100) : 0,
        };
      })
    );

    res.status(200).json({
      success: true,
      data: studentList.filter(Boolean),
    });
  } catch (error) {
    console.error('getOfferingStudents error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getFacultyDashboardStats,
  createCourseOffering,
  getCourseOfferings,
  getCourseOffering,
  updateCourseOffering,
  deleteCourseOffering,
  getOfferingStudents,
};


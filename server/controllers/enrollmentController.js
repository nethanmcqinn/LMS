const Enrollment = require('../models/Enrollment');
const CourseOffering = require('../models/CourseOffering');
const StudentProgress = require('../models/StudentProgress');
const Lesson = require('../models/Lesson');
const User = require('../models/User');

// Helper to initialize student progress on enrollment
const initializeStudentProgress = async (studentId, courseOfferingId) => {
  // Find all published lessons sorted by order
  const lessons = await Lesson.find({
    courseOffering: courseOfferingId,
  }).sort({ order: 1 });

  if (lessons.length === 0) return;

  for (let i = 0; i < lessons.length; i++) {
    const lesson = lessons[i];
    const initialStatus = i === 0 ? 'available' : 'locked';

    await StudentProgress.findOneAndUpdate(
      {
        student: studentId,
        courseOffering: courseOfferingId,
        lessonId: lesson._id,
      },
      {
        $setOnInsert: {
          status: initialStatus,
          quizPassed: false,
        },
      },
      { upsert: true, new: true }
    );
  }
};

// @desc    Enroll single student
// @route   POST /api/enrollments
// @access  Faculty
const enrollStudent = async (req, res) => {
  try {
    const { student, courseOffering } = req.body;

    const targetStudent = await User.findById(student);
    if (!targetStudent || targetStudent.role !== 'student') {
      return res.status(404).json({ success: false, message: 'Valid student user not found' });
    }

    const offering = await CourseOffering.findById(courseOffering);
    if (!offering) {
      return res.status(404).json({ success: false, message: 'Course offering not found' });
    }

    if (offering.faculty.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized for this course' });
    }

    let enrollment = await Enrollment.findOne({
      student,
      courseOffering,
    });

    if (enrollment) {
      if (enrollment.status === 'active') {
        return res.status(400).json({ success: false, message: 'Student is already actively enrolled' });
      }
      enrollment.status = 'active';
      enrollment.enrollmentDate = new Date();
      await enrollment.save();
    } else {
      enrollment = await Enrollment.create({
        student,
        courseOffering,
        status: 'active',
      });
    }

    // Initialize progress
    await initializeStudentProgress(student, courseOffering);

    const populated = await Enrollment.findById(enrollment._id)
      .populate('student', 'firstName lastName email')
      .populate('courseOffering');

    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    console.error('enrollStudent error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Bulk enroll students
// @route   POST /api/enrollments/bulk
// @access  Faculty
const bulkEnroll = async (req, res) => {
  try {
    const { studentIds, courseOffering } = req.body;

    if (!Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(400).json({ success: false, message: 'studentIds array is required' });
    }

    const offering = await CourseOffering.findById(courseOffering);
    if (!offering) {
      return res.status(404).json({ success: false, message: 'Course offering not found' });
    }

    if (offering.faculty.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized for this course' });
    }

    const results = [];
    for (const sId of studentIds) {
      let enrollment = await Enrollment.findOne({
        student: sId,
        courseOffering,
      });

      if (!enrollment) {
        enrollment = await Enrollment.create({
          student: sId,
          courseOffering,
          status: 'active',
        });
      } else {
        enrollment.status = 'active';
        await enrollment.save();
      }

      await initializeStudentProgress(sId, courseOffering);
      results.push(enrollment);
    }

    res.status(200).json({
      success: true,
      message: `Enrolled ${results.length} students successfully`,
      data: results,
    });
  } catch (error) {
    console.error('bulkEnroll error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get enrollments
// @route   GET /api/enrollments
// @access  Authenticated
const getEnrollments = async (req, res) => {
  try {
    const { courseOffering } = req.query;

    if (req.user.role === 'faculty') {
      const filter = {};
      if (courseOffering) filter.courseOffering = courseOffering;

      const enrollments = await Enrollment.find(filter)
        .populate('student', 'firstName lastName email')
        .populate('courseOffering');

      res.status(200).json({ success: true, data: enrollments });
    } else {
      // Student: view own enrollments
      const enrollments = await Enrollment.find({
        student: req.user._id,
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

      res.status(200).json({ success: true, data: enrollments });
    }
  } catch (error) {
    console.error('getEnrollments error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Drop enrollment
// @route   PUT /api/enrollments/:id/drop
// @access  Faculty
const dropEnrollment = async (req, res) => {
  try {
    const enrollment = await Enrollment.findById(req.params.id).populate('courseOffering');
    if (!enrollment) {
      return res.status(404).json({ success: false, message: 'Enrollment not found' });
    }

    if (enrollment.courseOffering.faculty.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized for this course' });
    }

    enrollment.status = 'dropped';
    await enrollment.save();

    res.status(200).json({ success: true, message: 'Student dropped successfully', data: enrollment });
  } catch (error) {
    console.error('dropEnrollment error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  initializeStudentProgress,
  enrollStudent,
  bulkEnroll,
  getEnrollments,
  dropEnrollment,
};


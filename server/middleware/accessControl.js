const Enrollment = require('../models/Enrollment');
const CourseOffering = require('../models/CourseOffering');
const StudentProgress = require('../models/StudentProgress');
const Lesson = require('../models/Lesson');

// Verify student is enrolled in a course offering
const verifyEnrollment = async (req, res, next) => {
  try {
    const studentId = req.user._id;
    const courseOfferingId = req.params.courseOfferingId || req.body.courseOffering;

    if (!courseOfferingId) {
      return res.status(400).json({ success: false, message: 'Course offering ID is required' });
    }

    const enrollment = await Enrollment.findOne({
      student: studentId,
      courseOffering: courseOfferingId,
      status: 'active'
    });

    if (!enrollment) {
      return res.status(403).json({ 
        success: false, 
        message: 'You are not enrolled in this course' 
      });
    }

    req.enrollment = enrollment;
    next();
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error verifying enrollment' });
  }
};

// Verify faculty owns a course offering
const verifyFacultyOwnership = async (req, res, next) => {
  try {
    const facultyId = req.user._id;
    const courseOfferingId = req.params.courseOfferingId || req.params.id || req.body.courseOffering;

    if (!courseOfferingId) {
      return next();
    }

    const courseOffering = await CourseOffering.findById(courseOfferingId);

    if (!courseOffering) {
      return res.status(404).json({ success: false, message: 'Course offering not found' });
    }

    if (courseOffering.faculty.toString() !== facultyId.toString()) {
      return res.status(403).json({ 
        success: false, 
        message: 'You are not authorized to manage this course' 
      });
    }

    req.courseOffering = courseOffering;
    next();
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error verifying ownership' });
  }
};

// Verify lesson access (student progression check)
const verifyLessonAccess = async (req, res, next) => {
  try {
    const studentId = req.user._id;
    const lessonId = req.params.lessonId || req.params.id;

    if (!lessonId) {
      return res.status(400).json({ success: false, message: 'Lesson ID is required' });
    }

    const lesson = await Lesson.findById(lessonId);
    if (!lesson) {
      return res.status(404).json({ success: false, message: 'Lesson not found' });
    }

    // Check enrollment
    const enrollment = await Enrollment.findOne({
      student: studentId,
      courseOffering: lesson.courseOffering,
      status: 'active'
    });

    if (!enrollment) {
      return res.status(403).json({ 
        success: false, 
        message: 'You are not enrolled in this course' 
      });
    }

    // Check if this is the first lesson (always accessible)
    const firstLesson = await Lesson.findOne({ 
      courseOffering: lesson.courseOffering, 
      isPublished: true 
    }).sort({ order: 1 });

    if (firstLesson && firstLesson._id.toString() === lessonId) {
      // First lesson is always accessible — ensure progress record exists
      await StudentProgress.findOneAndUpdate(
        { student: studentId, courseOffering: lesson.courseOffering, lessonId: lesson._id },
        { $setOnInsert: { status: 'available' } },
        { upsert: true, new: true }
      );
      req.lesson = lesson;
      return next();
    }

    // For other lessons, check progress
    const progress = await StudentProgress.findOne({
      student: studentId,
      courseOffering: lesson.courseOffering,
      lessonId: lesson._id
    });

    if (!progress || progress.status === 'locked') {
      return res.status(403).json({ 
        success: false, 
        message: 'This lesson is locked. Complete the previous lesson quiz to unlock it.' 
      });
    }

    req.lesson = lesson;
    next();
  } catch (error) {
    console.error('Lesson access verification error:', error);
    res.status(500).json({ success: false, message: 'Server error verifying lesson access' });
  }
};

module.exports = { verifyEnrollment, verifyFacultyOwnership, verifyLessonAccess };


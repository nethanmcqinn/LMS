const Course = require('../models/Course');
const CourseOffering = require('../models/CourseOffering');

const createCourse = async (req, res) => {
  try {
    const { courseCode, courseTitle, description } = req.body;

    const existing = await Course.findOne({ courseCode: courseCode.toUpperCase() });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Course code already exists' });
    }

    const course = await Course.create({
      courseCode,
      courseTitle,
      description: description || '',
    });

    res.status(201).json({ success: true, data: course });
  } catch (error) {
    console.error('createCourse error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Course code already exists' });
    }
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ success: false, message: messages.join(', ') });
    }
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const getCourses = async (req, res) => {
  try {
    const courses = await Course.find().sort({ courseCode: 1 });
    res.status(200).json({ success: true, data: courses });
  } catch (error) {
    console.error('getCourses error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const getCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }
    res.status(200).json({ success: true, data: course });
  } catch (error) {
    console.error('getCourse error:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const updateCourse = async (req, res) => {
  try {
    const { courseCode, courseTitle, description } = req.body;

    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    if (courseCode !== undefined) course.courseCode = courseCode;
    if (courseTitle !== undefined) course.courseTitle = courseTitle;
    if (description !== undefined) course.description = description;

    await course.save();

    res.status(200).json({ success: true, data: course });
  } catch (error) {
    console.error('updateCourse error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Course code already exists' });
    }
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ success: false, message: messages.join(', ') });
    }
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const deleteCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    const offeringCount = await CourseOffering.countDocuments({ course: course._id });
    if (offeringCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete course with existing offerings. Remove offerings first.',
      });
    }

    await Course.findByIdAndDelete(course._id);

    res.status(200).json({ success: true, message: 'Course deleted successfully' });
  } catch (error) {
    console.error('deleteCourse error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { createCourse, getCourses, getCourse, updateCourse, deleteCourse };

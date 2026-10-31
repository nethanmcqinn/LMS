const FacultyProfile = require('../models/FacultyProfile');
const User = require('../models/User');
const StudentProfile = require('../models/StudentProfile');
const Enrollment = require('../models/Enrollment');
const CourseOffering = require('../models/CourseOffering');
const QuizAttempt = require('../models/QuizAttempt');
const StudentProgress = require('../models/StudentProgress');

// @desc    Get faculty profile
// @route   GET /api/faculty/profile
// @access  Faculty
const getFacultyProfile = async (req, res) => {
  try {
    const profile = await FacultyProfile.findOne({ user: req.user._id });
    res.status(200).json({
      success: true,
      data: {
        user: req.user,
        profile: profile || null,
      },
    });
  } catch (error) {
    console.error('getFacultyProfile error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update faculty profile
// @route   PUT /api/faculty/profile
// @access  Faculty
const updateFacultyProfile = async (req, res) => {
  try {
    const { department, specialization, facultyId } = req.body;

    let profile = await FacultyProfile.findOne({ user: req.user._id });

    if (!profile) {
      profile = await FacultyProfile.create({
        user: req.user._id,
        department,
        specialization,
        facultyId,
      });
    } else {
      if (department !== undefined) profile.department = department;
      if (specialization !== undefined) profile.specialization = specialization;
      if (facultyId !== undefined) profile.facultyId = facultyId;
      await profile.save();
    }

    res.status(200).json({ success: true, data: profile });
  } catch (error) {
    console.error('updateFacultyProfile error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all students in institution with filters
// @route   GET /api/faculty/students
// @access  Faculty
const getAllStudents = async (req, res) => {
  try {
    const { degreeProgram, yearLevel, search } = req.query;

    const profileFilter = {};
    if (degreeProgram) profileFilter.degreeProgram = degreeProgram;
    if (yearLevel) profileFilter.currentYearLevel = Number(yearLevel);

    const profiles = await StudentProfile.find(profileFilter)
      .populate('user', 'firstName middleName lastName email isActive')
      .populate('degreeProgram');

    let students = profiles
      .filter((p) => p.user)
      .map((p) => ({
        _id: p.user._id,
        studentProfileId: p._id,
        studentId: p.studentId,
        firstName: p.user.firstName,
        middleName: p.user.middleName,
        lastName: p.user.lastName,
        email: p.user.email,
        degreeProgram: p.degreeProgram,
        enrollmentYear: p.enrollmentYear,
        currentYearLevel: p.currentYearLevel,
        section: p.section,
        isActive: p.user.isActive,
      }));

    if (search) {
      const q = search.toLowerCase();
      students = students.filter(
        (s) =>
          s.firstName.toLowerCase().includes(q) ||
          s.lastName.toLowerCase().includes(q) ||
          s.email.toLowerCase().includes(q) ||
          s.studentId.toLowerCase().includes(q)
      );
    }

    res.status(200).json({ success: true, data: students });
  } catch (error) {
    console.error('getAllStudents error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get student details across faculty's courses
// @route   GET /api/faculty/students/:id
// @access  Faculty
const getStudentDetails = async (req, res) => {
  try {
    const student = await User.findById(req.params.id);
    if (!student || student.role !== 'student') {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    const profile = await StudentProfile.findOne({ user: student._id }).populate('degreeProgram');

    // Get courses this student is enrolled in that belong to THIS faculty
    const facultyOfferings = await CourseOffering.find({ faculty: req.user._id });
    const facultyOfferingIds = facultyOfferings.map((o) => o._id);

    const enrollments = await Enrollment.find({
      student: student._id,
      courseOffering: { $in: facultyOfferingIds },
    }).populate({
      path: 'courseOffering',
      populate: [{ path: 'course' }, { path: 'academicYear' }, { path: 'semester' }],
    });

    const coursesData = await Promise.all(
      enrollments.map(async (enr) => {
        const offering = enr.courseOffering;
        const progress = await StudentProgress.find({
          student: student._id,
          courseOffering: offering._id,
        }).populate('lessonId', 'title order');

        const attempts = await QuizAttempt.find({
          student: student._id,
          courseOffering: offering._id,
        })
          .populate('quiz', 'title totalPoints passingPercentage')
          .sort({ createdAt: -1 });

        return {
          enrollment: enr,
          courseOffering: offering,
          progress,
          attempts,
        };
      })
    );

    res.status(200).json({
      success: true,
      data: {
        student: {
          _id: student._id,
          firstName: student.firstName,
          middleName: student.middleName,
          lastName: student.lastName,
          email: student.email,
        },
        profile,
        enrolledCourses: coursesData,
      },
    });
  } catch (error) {
    console.error('getStudentDetails error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getFacultyProfile,
  updateFacultyProfile,
  getAllStudents,
  getStudentDetails,
};


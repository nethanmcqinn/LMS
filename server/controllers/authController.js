const User = require('../models/User');
const StudentProfile = require('../models/StudentProfile');
const FacultyProfile = require('../models/FacultyProfile');
const StudentIdCounter = require('../models/StudentIdCounter');
const DegreeProgram = require('../models/DegreeProgram');
const { generateToken } = require('../middleware/auth');

const registerStudent = async (req, res) => {
  try {
    const { firstName, middleName, lastName, email, password, degreeProgram, enrollmentYear, yearLevel, section } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email is already in use' });
    }

    const program = await DegreeProgram.findById(degreeProgram);
    if (!program) {
      return res.status(404).json({ success: false, message: 'Degree program not found' });
    }

    const user = await User.create({
      firstName,
      middleName: middleName || '',
      lastName,
      email,
      password,
      role: 'student',
    });

    const studentId = await StudentIdCounter.getNextId(enrollmentYear, program.programCode);

    const studentProfile = await StudentProfile.create({
      user: user._id,
      studentId,
      degreeProgram: program._id,
      enrollmentYear,
      currentYearLevel: yearLevel || 1,
      section: section || '',
    });

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      token,
      user: user.toJSON(),
      studentId: studentProfile.studentId,
      profile: studentProfile,
      data: {
        user: user.toJSON(),
        studentId: studentProfile.studentId,
        profile: studentProfile,
        token,
      },
    });
  } catch (error) {
    console.error('registerStudent error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Duplicate field value entered' });
    }
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ success: false, message: messages.join(', ') });
    }
    res.status(500).json({ success: false, message: 'Server error during registration' });
  }
};

const registerFaculty = async (req, res) => {
  try {
    const { firstName, middleName, lastName, email, password, department, specialization } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email is already in use' });
    }

    const user = await User.create({
      firstName,
      middleName: middleName || '',
      lastName,
      email,
      password,
      role: 'faculty',
    });

    const facultyProfile = await FacultyProfile.create({
      user: user._id,
      department: department || '',
      specialization: specialization || '',
    });

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      token,
      user: user.toJSON(),
      profile: facultyProfile,
      data: {
        user: user.toJSON(),
        profile: facultyProfile,
        token,
      },
    });
  } catch (error) {
    console.error('registerFaculty error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Duplicate field value entered' });
    }
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ success: false, message: messages.join(', ') });
    }
    res.status(500).json({ success: false, message: 'Server error during registration' });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    if (!user.isActive) {
      return res.status(401).json({ success: false, message: 'Account is deactivated' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    let profile = null;
    if (user.role === 'student') {
      profile = await StudentProfile.findOne({ user: user._id }).populate('degreeProgram');
    } else if (user.role === 'faculty') {
      profile = await FacultyProfile.findOne({ user: user._id });
    }

    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      token,
      user: user.toJSON(),
      profile,
      role: user.role,
      data: {
        user: user.toJSON(),
        profile,
        role: user.role,
        token,
      },
    });
  } catch (error) {
    console.error('login error:', error);
    res.status(500).json({ success: false, message: 'Server error during login' });
  }
};

const getMe = async (req, res) => {
  try {
    const user = req.user;

    let profile = null;
    if (user.role === 'student') {
      profile = await StudentProfile.findOne({ user: user._id }).populate('degreeProgram');
    } else if (user.role === 'faculty') {
      profile = await FacultyProfile.findOne({ user: user._id });
    }

    res.status(200).json({
      success: true,
      data: {
        user: user.toJSON(),
        profile,
      },
    });
  } catch (error) {
    console.error('getMe error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { registerStudent, registerFaculty, login, getMe };

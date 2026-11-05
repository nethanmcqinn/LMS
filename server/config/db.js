const mongoose = require('mongoose');

const seedInitialData = async () => {
  try {
    const DegreeProgram = require('../models/DegreeProgram');
    const AcademicYear = require('../models/AcademicYear');
    const Semester = require('../models/Semester');
    const Course = require('../models/Course');

    // Check if degree programs exist
    const programCount = await DegreeProgram.countDocuments();
    if (programCount === 0) {
      console.log('Seeding initial academic structure...');

      const itProgram = await DegreeProgram.create({
        programName: 'Bachelor of Science in Information Technology',
        programCode: 'BSIT',
        description: 'Comprehensive IT program covering software development, networking, and systems administration.',
        availableYearLevels: [1, 2, 3, 4],
        isActive: true,
      });

      const csProgram = await DegreeProgram.create({
        programName: 'Bachelor of Science in Computer Science',
        programCode: 'BSCS',
        description: 'Computer science program emphasizing algorithms, data structures, and computing theory.',
        availableYearLevels: [1, 2, 3, 4],
        isActive: true,
      });

      await DegreeProgram.create({
        programName: 'Bachelor of Science in Information Systems',
        programCode: 'BSIS',
        description: 'Focuses on integrating information technology solutions with enterprise business processes.',
        availableYearLevels: [1, 2, 3, 4],
        isActive: true,
      });

      // Seed Academic Year
      const acadYear = await AcademicYear.create({
        yearStart: 2026,
        yearEnd: 2027,
        isCurrent: true,
      });

      // Seed Semesters
      const firstSem = await Semester.create({
        name: 'First Semester',
        academicYear: acadYear._id,
        isCurrent: true,
      });

      await Semester.create({
        name: 'Second Semester',
        academicYear: acadYear._id,
        isCurrent: false,
      });

      // Seed initial courses
      const it101 = await Course.create({
        courseCode: 'IT101',
        courseTitle: 'Introduction to Computing & Programming',
        description: 'Foundations of computer systems, programming fundamentals, and problem-solving.',
      });

      await Course.create({
        courseCode: 'CS102',
        courseTitle: 'Data Structures and Algorithms',
        description: 'Analysis and implementation of lists, stacks, queues, trees, and graphs.',
      });

      await Course.create({
        courseCode: 'IT201',
        courseTitle: 'Database Management Systems',
        description: 'Relational database design, SQL querying, normalization, and database architecture.',
      });

      // Seed Default Faculty Demo Account
      const User = require('../models/User');
      const FacultyProfile = require('../models/FacultyProfile');
      const StudentProfile = require('../models/StudentProfile');
      const StudentIdCounter = require('../models/StudentIdCounter');
      const CourseOffering = require('../models/CourseOffering');
      const Enrollment = require('../models/Enrollment');
      const Lesson = require('../models/Lesson');
      const Quiz = require('../models/Quiz');
      const StudentProgress = require('../models/StudentProgress');

      const facultyUser = await User.create({
        firstName: 'Alan',
        lastName: 'Turing',
        email: 'faculty@demo.edu',
        password: 'Password123!',
        role: 'faculty',
      });

      await FacultyProfile.create({
        user: facultyUser._id,
        department: 'College of Information and Communications Technology',
        specialization: 'Computer Science & Software Architecture',
      });

      // Seed Default Student Demo Account
      const studentUser = await User.create({
        firstName: 'Juan',
        middleName: 'Reyes',
        lastName: 'Dela Cruz',
        email: 'student@demo.edu',
        password: 'Password123!',
        role: 'student',
      });

      const studentId = await StudentIdCounter.getNextId(2026, 'BSIT');

      await StudentProfile.create({
        user: studentUser._id,
        studentId,
        degreeProgram: itProgram._id,
        enrollmentYear: 2026,
        currentYearLevel: 1,
        section: '1-A',
      });

      // Create a Course Offering taught by Faculty and enroll Student
      const offering = await CourseOffering.create({
        course: it101._id,
        academicYear: acadYear._id,
        semester: firstSem._id,
        faculty: facultyUser._id,
        section: 'BSIT 1-A',
        yearLevel: 1,
        degreeProgram: itProgram._id,
        maxStudents: 45,
      });

      await Enrollment.create({
        student: studentUser._id,
        courseOffering: offering._id,
        status: 'active',
      });

      // Create Lesson 1 & Lesson 2 with Quiz
      const lesson1 = await Lesson.create({
        courseOffering: offering._id,
        title: 'Module 1: Introduction to Computing',
        description: 'Covers binary systems, basic computer architecture, and algorithms.',
        content: 'Welcome to Module 1! In this lesson, we explore how digital computers store and process data using binary logic gates and arithmetic algorithms.',
        order: 1,
        isPublished: true,
        requiresQuiz: true,
      });

      const lesson2 = await Lesson.create({
        courseOffering: offering._id,
        title: 'Module 2: Variables & Control Flow',
        description: 'Variables, conditional logic, and looping structures.',
        content: 'Welcome to Module 2! This module covers control flow: if/else branching, while and for loops.',
        order: 2,
        isPublished: true,
        requiresQuiz: true,
      });

      await Quiz.create({
        lesson: lesson1._id,
        title: 'Module 1 Assessment',
        description: 'Complete this quiz with at least 75% to unlock Module 2.',
        passingPercentage: 75,
        totalPoints: 10,
        maxAttempts: 3,
        questions: [
          {
            questionText: 'Is binary a base-2 numbering system consisting of 0s and 1s?',
            questionType: 'true_false',
            points: 5,
            choices: [
              { text: 'True', isCorrect: true },
              { text: 'False', isCorrect: false },
            ],
            explanation: 'Binary is base-2, using digits 0 and 1.',
          },
          {
            questionText: 'What term describes a finite sequence of well-defined instructions to solve a problem?',
            questionType: 'identification',
            points: 5,
            correctAnswer: 'algorithm',
            explanation: 'An algorithm is a step-by-step procedure for solving problems.',
          },
        ],
      });

      // Initialize progression for student (Lesson 1 available, Lesson 2 locked)
      await StudentProgress.create({
        student: studentUser._id,
        courseOffering: offering._id,
        lessonId: lesson1._id,
        status: 'available',
        quizPassed: false,
      });

      await StudentProgress.create({
        student: studentUser._id,
        courseOffering: offering._id,
        lessonId: lesson2._id,
        status: 'locked',
        quizPassed: false,
      });

      console.log('Demo accounts (faculty@demo.edu and student@demo.edu) and sample curriculum seeded successfully!');

      console.log('Initial academic programs, academic years, semesters, and courses seeded successfully!');
    }
  } catch (err) {
    console.error('Data seeding note:', err.message);
  }
};

const connectDB = async () => {
  const configuredUri = process.env.MONGODB_URI;

  if (configuredUri) {
    try {
      console.log('Attempting connection to configured MongoDB instance...');
      const conn = await mongoose.connect(configuredUri, {
        serverSelectionTimeoutMS: 10000,
      });
      console.log(`MongoDB Connected: ${conn.connection.host}`);
      await seedInitialData();
      return;
    } catch (error) {
      console.error(`MongoDB connection error: ${error.message}`);
      process.exit(1);
    }
  }

  if (process.env.NODE_ENV === 'production') {
    console.error('MONGODB_URI is required when NODE_ENV is production.');
    process.exit(1);
  }

  try {
    // Use local MongoDB when configured locally, then fall back to an in-memory database for development.
    console.log('Attempting connection to local MongoDB at mongodb://localhost:27017/lms');
    const conn = await mongoose.connect('mongodb://localhost:27017/lms', {
      serverSelectionTimeoutMS: 2000,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    await seedInitialData();
  } catch (error) {
    console.log('Local MongoDB not reachable. Initializing embedded MongoMemoryServer for development...');
    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      const mongod = await MongoMemoryServer.create();
      const uri = mongod.getUri();
      console.log(`Embedded MongoMemoryServer started at: ${uri}`);

      const conn = await mongoose.connect(uri);
      console.log(`Connected to MongoMemoryServer: ${conn.connection.host}`);
      await seedInitialData();
    } catch (memErr) {
      console.error(`Database connection error: ${memErr.message}`);
      process.exit(1);
    }
  }
};

module.exports = connectDB;

const Quiz = require('../models/Quiz');
const Lesson = require('../models/Lesson');
const CourseOffering = require('../models/CourseOffering');
const Enrollment = require('../models/Enrollment');
const QuizAttempt = require('../models/QuizAttempt');
const StudentProgress = require('../models/StudentProgress');

// @desc    Create a quiz
// @route   POST /api/quizzes
// @access  Faculty
const createQuiz = async (req, res) => {
  try {
    const {
      lesson,
      title,
      description,
      questions,
      passingPercentage,
      timeLimit,
      maxAttempts,
      availableFrom,
      availableUntil,
      randomizeQuestions,
      randomizeChoices,
      isPublished,
    } = req.body;

    const targetLesson = await Lesson.findById(lesson);
    if (!targetLesson) {
      return res.status(404).json({ success: false, message: 'Lesson not found' });
    }

    const offering = await CourseOffering.findById(targetLesson.courseOffering);
    if (offering.faculty.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized for this course' });
    }

    const existingQuiz = await Quiz.findOne({ lesson });
    if (existingQuiz) {
      return res.status(400).json({ success: false, message: 'A quiz already exists for this lesson' });
    }

    const totalPoints = (questions || []).reduce(
      (sum, q) => sum + (Number(q.points) || 1),
      0
    );

    const quiz = await Quiz.create({
      lesson,
      title,
      description,
      questions: questions || [],
      passingPercentage: passingPercentage !== undefined ? Number(passingPercentage) : 75,
      totalPoints,
      timeLimit: timeLimit ? Number(timeLimit) : null,
      maxAttempts: maxAttempts !== undefined ? Number(maxAttempts) : 3,
      availableFrom: availableFrom || null,
      availableUntil: availableUntil || null,
      randomizeQuestions: !!randomizeQuestions,
      randomizeChoices: !!randomizeChoices,
      isPublished: isPublished !== undefined ? !!isPublished : true,
    });

    res.status(201).json({ success: true, data: quiz });
  } catch (error) {
    console.error('createQuiz error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get quiz details
// @route   GET /api/quizzes/:id
// @access  Authenticated
const getQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id).populate('lesson');
    if (!quiz) {
      return res.status(404).json({ success: false, message: 'Quiz not found' });
    }

    const offering = await CourseOffering.findById(quiz.lesson.courseOffering);

    if (req.user.role === 'faculty') {
      if (offering.faculty.toString() !== req.user._id.toString()) {
        return res.status(403).json({ success: false, message: 'Not authorized for this quiz' });
      }
      return res.status(200).json({ success: true, data: quiz });
    }

    // Student: sanitize answers
    const enrollment = await Enrollment.findOne({
      student: req.user._id,
      courseOffering: offering._id,
      status: 'active',
    });

    if (!enrollment) {
      return res.status(403).json({ success: false, message: 'Not enrolled in this course' });
    }

    const doc = quiz.toObject();
    doc.questions = doc.questions.map((q) => {
      const sanitizedQ = { ...q };
      delete sanitizedQ.correctAnswer;
      if (sanitizedQ.choices) {
        sanitizedQ.choices = sanitizedQ.choices.map((c) => ({
          _id: c._id,
          text: c.text,
        }));
      }
      return sanitizedQ;
    });

    // Attach student attempt count
    const attemptCount = await QuizAttempt.countDocuments({
      quiz: quiz._id,
      student: req.user._id,
    });
    doc.attemptsUsed = attemptCount;
    doc.remainingAttempts = Math.max(0, (quiz.maxAttempts || 3) - attemptCount);

    res.status(200).json({ success: true, data: doc });
  } catch (error) {
    console.error('getQuiz error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get quiz for student taking attempt
// @route   GET /api/quizzes/:id/attempt
// @access  Student
const getQuizForAttempt = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id).populate('lesson');
    if (!quiz) {
      return res.status(404).json({ success: false, message: 'Quiz not found' });
    }

    const offering = await CourseOffering.findById(quiz.lesson.courseOffering);
    const enrollment = await Enrollment.findOne({
      student: req.user._id,
      courseOffering: offering._id,
      status: 'active',
    });

    if (!enrollment) {
      return res.status(403).json({ success: false, message: 'Not enrolled in this course' });
    }

    // Check availability
    const now = new Date();
    if (quiz.availableFrom && now < new Date(quiz.availableFrom)) {
      return res.status(400).json({ success: false, message: 'This quiz is not yet available' });
    }
    if (quiz.availableUntil && now > new Date(quiz.availableUntil)) {
      return res.status(400).json({ success: false, message: 'This quiz deadline has passed' });
    }

    // Check attempts
    const attempts = await QuizAttempt.find({
      quiz: quiz._id,
      student: req.user._id,
    });

    if (attempts.length >= (quiz.maxAttempts || 3)) {
      return res.status(400).json({
        success: false,
        message: `Maximum attempts (${quiz.maxAttempts || 3}) reached for this quiz`,
      });
    }

    const doc = quiz.toObject();
    let questions = doc.questions.map((q, idx) => {
      let choices = q.choices ? q.choices.map((c, cIdx) => ({
        originalIndex: cIdx,
        text: c.text,
      })) : [];

      if (quiz.randomizeChoices && choices.length > 0) {
        choices = choices.sort(() => Math.random() - 0.5);
      }

      return {
        originalIndex: idx,
        questionText: q.questionText,
        questionType: q.questionType,
        points: q.points,
        choices,
      };
    });

    if (quiz.randomizeQuestions) {
      questions = questions.sort(() => Math.random() - 0.5);
    }

    res.status(200).json({
      success: true,
      data: {
        _id: quiz._id,
        title: quiz.title,
        description: quiz.description,
        timeLimit: quiz.timeLimit,
        totalPoints: quiz.totalPoints,
        passingPercentage: quiz.passingPercentage,
        maxAttempts: quiz.maxAttempts,
        currentAttemptNumber: attempts.length + 1,
        questions,
      },
    });
  } catch (error) {
    console.error('getQuizForAttempt error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Preview quiz with answers (Faculty only)
// @route   GET /api/quizzes/:id/preview
// @access  Faculty
const previewQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id).populate('lesson');
    if (!quiz) {
      return res.status(404).json({ success: false, message: 'Quiz not found' });
    }

    const offering = await CourseOffering.findById(quiz.lesson.courseOffering);
    if (offering.faculty.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized for this quiz' });
    }

    res.status(200).json({ success: true, data: quiz });
  } catch (error) {
    console.error('previewQuiz error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update quiz
// @route   PUT /api/quizzes/:id
// @access  Faculty
const updateQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id).populate('lesson');
    if (!quiz) {
      return res.status(404).json({ success: false, message: 'Quiz not found' });
    }

    const offering = await CourseOffering.findById(quiz.lesson.courseOffering);
    if (offering.faculty.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized for this quiz' });
    }

    const {
      title,
      description,
      questions,
      passingPercentage,
      timeLimit,
      maxAttempts,
      availableFrom,
      availableUntil,
      randomizeQuestions,
      randomizeChoices,
      isPublished,
    } = req.body;

    if (title !== undefined) quiz.title = title;
    if (description !== undefined) quiz.description = description;
    if (passingPercentage !== undefined) quiz.passingPercentage = Number(passingPercentage);
    if (timeLimit !== undefined) quiz.timeLimit = timeLimit ? Number(timeLimit) : null;
    if (maxAttempts !== undefined) quiz.maxAttempts = Number(maxAttempts);
    if (availableFrom !== undefined) quiz.availableFrom = availableFrom || null;
    if (availableUntil !== undefined) quiz.availableUntil = availableUntil || null;
    if (randomizeQuestions !== undefined) quiz.randomizeQuestions = !!randomizeQuestions;
    if (randomizeChoices !== undefined) quiz.randomizeChoices = !!randomizeChoices;
    if (isPublished !== undefined) quiz.isPublished = !!isPublished;

    if (questions) {
      quiz.questions = questions;
      quiz.totalPoints = questions.reduce(
        (sum, q) => sum + (Number(q.points) || 1),
        0
      );
    }

    await quiz.save();

    res.status(200).json({ success: true, data: quiz });
  } catch (error) {
    console.error('updateQuiz error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete quiz
// @route   DELETE /api/quizzes/:id
// @access  Faculty
const deleteQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id).populate('lesson');
    if (!quiz) {
      return res.status(404).json({ success: false, message: 'Quiz not found' });
    }

    const offering = await CourseOffering.findById(quiz.lesson.courseOffering);
    if (offering.faculty.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized for this quiz' });
    }

    await QuizAttempt.deleteMany({ quiz: quiz._id });
    await Quiz.findByIdAndDelete(quiz._id);

    res.status(200).json({ success: true, message: 'Quiz deleted successfully' });
  } catch (error) {
    console.error('deleteQuiz error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createQuiz,
  getQuiz,
  getQuizForAttempt,
  previewQuiz,
  updateQuiz,
  deleteQuiz,
};


const QuizAttempt = require('../models/QuizAttempt');
const Quiz = require('../models/Quiz');
const Lesson = require('../models/Lesson');
const CourseOffering = require('../models/CourseOffering');
const Enrollment = require('../models/Enrollment');
const StudentProgress = require('../models/StudentProgress');
const ProgressResetLog = require('../models/ProgressResetLog');
const Grade = require('../models/Grade');

// @desc    Submit a quiz attempt
// @route   POST /api/quiz-attempts
// @access  Student
const submitQuizAttempt = async (req, res) => {
  try {
    const { quizId, answers, timeSpentSeconds } = req.body;

    const quiz = await Quiz.findById(quizId).populate('lesson');
    if (!quiz) {
      return res.status(404).json({ success: false, message: 'Quiz not found' });
    }

    const lesson = quiz.lesson;
    const courseOfferingId = lesson.courseOffering;

    // Check student enrollment
    const enrollment = await Enrollment.findOne({
      student: req.user._id,
      courseOffering: courseOfferingId,
      status: 'active',
    });

    if (!enrollment) {
      return res.status(403).json({ success: false, message: 'Not enrolled in this course' });
    }

    // Check attempts limit
    const existingAttempts = await QuizAttempt.countDocuments({
      quiz: quiz._id,
      student: req.user._id,
    });

    if (existingAttempts >= (quiz.maxAttempts || 3)) {
      return res.status(400).json({
        success: false,
        message: `Maximum attempts (${quiz.maxAttempts || 3}) reached for this quiz`,
      });
    }

    // SERVER-SIDE EVALUATION
    let totalScore = 0;
    const gradedAnswers = [];

    quiz.questions.forEach((question, idx) => {
      // Find submitted answer matching original index or index
      const submitted = (answers || []).find(
        (a) => a.questionIndex === idx || a.originalIndex === idx
      );

      let isCorrect = false;
      let pointsEarned = 0;
      const questionPoints = Number(question.points) || 1;

      if (submitted) {
        if (question.questionType === 'multiple_choice' || question.questionType === 'true_false') {
          // Find the choice index that has isCorrect: true
          const correctChoiceIdx = question.choices.findIndex((c) => c.isCorrect);
          if (
            correctChoiceIdx !== -1 &&
            Number(submitted.selectedChoiceIndex) === correctChoiceIdx
          ) {
            isCorrect = true;
            pointsEarned = questionPoints;
          }
        } else if (question.questionType === 'identification') {
          const submittedText = (submitted.textAnswer || '').trim().toLowerCase();
          const targetCorrect = (question.correctAnswer || '').trim().toLowerCase();
          if (submittedText && submittedText === targetCorrect) {
            isCorrect = true;
            pointsEarned = questionPoints;
          }
        }
      }

      totalScore += pointsEarned;

      gradedAnswers.push({
        questionIndex: idx,
        questionText: question.questionText,
        questionType: question.questionType,
        selectedChoiceIndex: submitted?.selectedChoiceIndex,
        textAnswer: submitted?.textAnswer,
        isCorrect,
        pointsEarned,
        maxPoints: questionPoints,
        explanation: question.explanation || '',
      });
    });

    const percentage =
      quiz.totalPoints > 0 ? Math.round((totalScore / quiz.totalPoints) * 100) : 0;
    const passed = percentage >= quiz.passingPercentage;
    const attemptNumber = existingAttempts + 1;

    const quizAttempt = await QuizAttempt.create({
      quiz: quiz._id,
      student: req.user._id,
      courseOffering: courseOfferingId,
      answers: gradedAnswers,
      score: totalScore,
      totalPoints: quiz.totalPoints,
      percentage,
      passed,
      attemptNumber,
      submittedAt: new Date(),
      timeSpentSeconds: timeSpentSeconds || 0,
    });

    // UPDATE STUDENT PROGRESSION
    let progress = await StudentProgress.findOne({
      student: req.user._id,
      courseOffering: courseOfferingId,
      lessonId: lesson._id,
    });

    const prevHighest = progress?.highestQuizScore || 0;
    const newHighest = Math.max(prevHighest, percentage);
    const hasAlreadyPassed = progress?.quizPassed || false;
    const nowPassed = hasAlreadyPassed || passed;

    if (!progress) {
      progress = await StudentProgress.create({
        student: req.user._id,
        courseOffering: courseOfferingId,
        lessonId: lesson._id,
        status: nowPassed ? 'completed' : 'in_progress',
        quizPassed: nowPassed,
        highestQuizScore: newHighest,
        completedAt: nowPassed ? new Date() : null,
      });
    } else {
      progress.quizPassed = nowPassed;
      progress.highestQuizScore = newHighest;
      if (nowPassed) {
        progress.status = 'completed';
        if (!progress.completedAt) progress.completedAt = new Date();
      } else if (progress.status === 'locked' || progress.status === 'available') {
        progress.status = 'in_progress';
      }
      await progress.save();
    }

    // UNLOCK NEXT LESSON IF PASSED
    let nextLessonUnlocked = null;
    if (nowPassed) {
      const allLessons = await Lesson.find({
        courseOffering: courseOfferingId,
        isPublished: true,
      }).sort({ order: 1 });

      const currentIdx = allLessons.findIndex(
        (l) => l._id.toString() === lesson._id.toString()
      );

      if (currentIdx !== -1 && currentIdx < allLessons.length - 1) {
        const nextLesson = allLessons[currentIdx + 1];

        // Unlock next lesson
        await StudentProgress.findOneAndUpdate(
          {
            student: req.user._id,
            courseOffering: courseOfferingId,
            lessonId: nextLesson._id,
          },
          {
            $set: { status: 'available' },
          },
          { upsert: true, new: true }
        );

        nextLessonUnlocked = {
          _id: nextLesson._id,
          title: nextLesson.title,
          order: nextLesson.order,
        };
      }
    }

    // UPDATE OR CREATE GRADE DOCUMENT
    try {
      let studentGrade = await Grade.findOne({
        student: req.user._id,
        courseOffering: courseOfferingId,
      });

      if (!studentGrade) {
        studentGrade = new Grade({
          student: req.user._id,
          courseOffering: courseOfferingId,
          quizGrades: [],
        });
      }

      const existingQuizGradeIdx = studentGrade.quizGrades.findIndex(
        (qg) => qg.quiz.toString() === quiz._id.toString()
      );

      if (existingQuizGradeIdx !== -1) {
        const currentEntry = studentGrade.quizGrades[existingQuizGradeIdx];
        if (totalScore > currentEntry.highestScore) {
          studentGrade.quizGrades[existingQuizGradeIdx].highestScore = totalScore;
          studentGrade.quizGrades[existingQuizGradeIdx].percentage = percentage;
          studentGrade.quizGrades[existingQuizGradeIdx].passed = nowPassed;
        }
      } else {
        studentGrade.quizGrades.push({
          quiz: quiz._id,
          lesson: lesson._id,
          highestScore: totalScore,
          totalPoints: quiz.totalPoints,
          percentage,
          passed: nowPassed,
        });
      }

      // Compute overall grade from quizzes
      const sumQuizPercent = studentGrade.quizGrades.reduce(
        (acc, q) => acc + q.percentage,
        0
      );
      const avgQuizPercent = studentGrade.quizGrades.length
        ? Math.round(sumQuizPercent / studentGrade.quizGrades.length)
        : 0;

      studentGrade.overallGrade = avgQuizPercent;
      studentGrade.lastUpdated = new Date();
      await studentGrade.save();
    } catch (gradeErr) {
      console.error('Grade update error:', gradeErr);
    }

    res.status(200).json({
      success: true,
      data: {
        attemptId: quizAttempt._id,
        score: totalScore,
        totalPoints: quiz.totalPoints,
        percentage,
        passed,
        passingPercentage: quiz.passingPercentage,
        attemptNumber,
        maxAttempts: quiz.maxAttempts,
        nextLessonUnlocked,
        gradedAnswers,
      },
    });
  } catch (error) {
    console.error('submitQuizAttempt error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get quiz attempts for a quiz
// @route   GET /api/quiz-attempts/quiz/:quizId
// @access  Authenticated
const getQuizAttempts = async (req, res) => {
  try {
    const { quizId } = req.params;

    const quiz = await Quiz.findById(quizId).populate('lesson');
    if (!quiz) {
      return res.status(404).json({ success: false, message: 'Quiz not found' });
    }

    const offering = await CourseOffering.findById(quiz.lesson.courseOffering);

    if (req.user.role === 'faculty') {
      if (offering.faculty.toString() !== req.user._id.toString()) {
        return res.status(403).json({ success: false, message: 'Not authorized for this course' });
      }

      const attempts = await QuizAttempt.find({ quiz: quizId })
        .populate('student', 'firstName lastName email')
        .sort({ createdAt: -1 });

      return res.status(200).json({ success: true, data: attempts });
    }

    // Student: view own attempts
    const attempts = await QuizAttempt.find({
      quiz: quizId,
      student: req.user._id,
    }).sort({ attemptNumber: 1 });

    res.status(200).json({ success: true, data: attempts });
  } catch (error) {
    console.error('getQuizAttempts error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get student attempts for a course offering
// @route   GET /api/quiz-attempts/student/:studentId/course-offering/:courseOfferingId
// @access  Authenticated
const getStudentAttempts = async (req, res) => {
  try {
    const { studentId, courseOfferingId } = req.params;

    if (req.user.role === 'student' && req.user._id.toString() !== studentId) {
      return res.status(403).json({ success: false, message: 'Not authorized to view other students records' });
    }

    if (req.user.role === 'faculty') {
      const offering = await CourseOffering.findById(courseOfferingId);
      if (offering.faculty.toString() !== req.user._id.toString()) {
        return res.status(403).json({ success: false, message: 'Not authorized for this course' });
      }
    }

    const attempts = await QuizAttempt.find({
      student: studentId,
      courseOffering: courseOfferingId,
    })
      .populate('quiz', 'title totalPoints passingPercentage')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: attempts });
  } catch (error) {
    console.error('getStudentAttempts error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Reset student progress for a lesson (Faculty only)
// @route   POST /api/quiz-attempts/reset
// @access  Faculty
const resetStudentProgress = async (req, res) => {
  try {
    const { studentId, courseOfferingId, lessonId, reason } = req.body;

    const offering = await CourseOffering.findById(courseOfferingId);
    if (!offering) {
      return res.status(404).json({ success: false, message: 'Course offering not found' });
    }

    if (offering.faculty.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized for this course' });
    }

    const lesson = await Lesson.findById(lessonId);
    if (!lesson) {
      return res.status(404).json({ success: false, message: 'Lesson not found' });
    }

    // Capture previous progress for audit log
    const prevProgress = await StudentProgress.findOne({
      student: studentId,
      courseOffering: courseOfferingId,
      lessonId,
    });

    const quiz = await Quiz.findOne({ lesson: lessonId });

    // Log the reset
    await ProgressResetLog.create({
      student: studentId,
      courseOffering: courseOfferingId,
      lesson: lessonId,
      quiz: quiz?._id || null,
      resetBy: req.user._id,
      reason: reason || 'Faculty reset progress',
      previousProgress: prevProgress ? prevProgress.toObject() : {},
    });

    // Reset this lesson's progress to available
    if (prevProgress) {
      prevProgress.quizPassed = false;
      prevProgress.status = 'available';
      prevProgress.highestQuizScore = null;
      prevProgress.completedAt = null;
      await prevProgress.save();
    }

    // Delete or clear attempts for this student on this quiz so they can retake
    if (quiz) {
      await QuizAttempt.deleteMany({
        quiz: quiz._id,
        student: studentId,
      });
    }

    // Lock all subsequent lessons in this course offering
    const allLessons = await Lesson.find({
      courseOffering: courseOfferingId,
      isPublished: true,
    }).sort({ order: 1 });

    const currentOrder = lesson.order;
    const subsequentLessons = allLessons.filter((l) => l.order > currentOrder);

    for (const subLesson of subsequentLessons) {
      await StudentProgress.findOneAndUpdate(
        {
          student: studentId,
          courseOffering: courseOfferingId,
          lessonId: subLesson._id,
        },
        {
          status: 'locked',
          quizPassed: false,
          highestQuizScore: null,
          completedAt: null,
        }
      );
    }

    res.status(200).json({
      success: true,
      message: 'Student progress reset successfully. Subsequent lessons have been locked.',
    });
  } catch (error) {
    console.error('resetStudentProgress error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  submitQuizAttempt,
  getQuizAttempts,
  getStudentAttempts,
  resetStudentProgress,
};


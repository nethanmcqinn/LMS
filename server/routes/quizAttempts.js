const router = require('express').Router();
const { protect, authorize } = require('../middleware/auth');
const quizAttemptController = require('../controllers/quizAttemptController');

router.post(
  '/',
  protect,
  authorize('student'),
  quizAttemptController.submitQuizAttempt
);

router.post(
  '/reset',
  protect,
  authorize('faculty'),
  quizAttemptController.resetStudentProgress
);

router.get('/quiz/:quizId', protect, quizAttemptController.getQuizAttempts);

router.get(
  '/student/:studentId/course-offering/:courseOfferingId',
  protect,
  quizAttemptController.getStudentAttempts
);

module.exports = router;

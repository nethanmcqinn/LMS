const router = require('express').Router();
const { protect, authorize } = require('../middleware/auth');
const quizController = require('../controllers/quizController');

router.post('/', protect, authorize('faculty'), quizController.createQuiz);

router
  .route('/:id')
  .get(protect, quizController.getQuiz)
  .put(protect, authorize('faculty'), quizController.updateQuiz)
  .delete(protect, authorize('faculty'), quizController.deleteQuiz);

router.get(
  '/:id/attempt',
  protect,
  authorize('student'),
  quizController.getQuizForAttempt
);

router.get(
  '/:id/preview',
  protect,
  authorize('faculty'),
  quizController.previewQuiz
);

module.exports = router;

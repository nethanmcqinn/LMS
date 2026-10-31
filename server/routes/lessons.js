const router = require('express').Router();
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');
const lessonController = require('../controllers/lessonController');

router.post(
  '/',
  protect,
  authorize('faculty'),
  upload.array('attachments', 10),
  lessonController.createLesson
);

router.get(
  '/course-offering/:courseOfferingId',
  protect,
  lessonController.getLessons
);

router.put(
  '/reorder/:courseOfferingId',
  protect,
  authorize('faculty'),
  lessonController.reorderLessons
);

router
  .route('/:id')
  .get(protect, lessonController.getLesson)
  .put(
    protect,
    authorize('faculty'),
    upload.array('attachments', 10),
    lessonController.updateLesson
  )
  .delete(protect, authorize('faculty'), lessonController.deleteLesson);

router.delete(
  '/:id/attachment/:fileName',
  protect,
  authorize('faculty'),
  lessonController.removeAttachment
);

module.exports = router;

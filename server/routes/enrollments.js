const router = require('express').Router();
const { body } = require('express-validator');
const { protect, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const enrollmentController = require('../controllers/enrollmentController');

router.post(
  '/',
  protect,
  authorize('faculty'),
  [
    body('student').trim().notEmpty().withMessage('Student is required'),
    body('courseOffering')
      .trim()
      .notEmpty()
      .withMessage('Course offering is required'),
  ],
  validate,
  enrollmentController.enrollStudent
);

router.post(
  '/bulk',
  protect,
  authorize('faculty'),
  enrollmentController.bulkEnroll
);

router.get('/', protect, enrollmentController.getEnrollments);

router.put(
  '/:id/drop',
  protect,
  authorize('faculty'),
  enrollmentController.dropEnrollment
);

module.exports = router;

const router = require('express').Router();
const { body } = require('express-validator');
const { protect, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const courseOfferingController = require('../controllers/courseOfferingController');

// Static routes MUST come before parameterized routes
router.get(
  '/dashboard/stats',
  protect,
  authorize('faculty'),
  courseOfferingController.getFacultyDashboardStats
);

router
  .route('/')
  .post(
    protect,
    authorize('faculty'),
    [
      body('course').trim().notEmpty().withMessage('Course is required'),
      body('academicYear')
        .trim()
        .notEmpty()
        .withMessage('Academic year is required'),
      body('semester').trim().notEmpty().withMessage('Semester is required'),
    ],
    validate,
    courseOfferingController.createCourseOffering
  )
  .get(protect, courseOfferingController.getCourseOfferings);

router
  .route('/:id')
  .get(protect, courseOfferingController.getCourseOffering)
  .put(
    protect,
    authorize('faculty'),
    courseOfferingController.updateCourseOffering
  )
  .delete(
    protect,
    authorize('faculty'),
    courseOfferingController.deleteCourseOffering
  );

router.get(
  '/:id/students',
  protect,
  authorize('faculty'),
  courseOfferingController.getOfferingStudents
);

module.exports = router;

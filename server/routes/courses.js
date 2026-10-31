const router = require('express').Router();
const { body } = require('express-validator');
const { protect, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const courseController = require('../controllers/courseController');

router
  .route('/')
  .post(
    protect,
    authorize('faculty'),
    [
      body('courseCode')
        .trim()
        .notEmpty()
        .withMessage('Course code is required'),
      body('courseTitle')
        .trim()
        .notEmpty()
        .withMessage('Course title is required'),
    ],
    validate,
    courseController.createCourse
  )
  .get(protect, courseController.getCourses);

router
  .route('/:id')
  .get(protect, courseController.getCourse)
  .put(protect, authorize('faculty'), courseController.updateCourse)
  .delete(protect, authorize('faculty'), courseController.deleteCourse);

module.exports = router;

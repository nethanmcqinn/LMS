const router = require('express').Router();
const { body } = require('express-validator');
const { protect, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const semesterController = require('../controllers/semesterController');

router
  .route('/')
  .post(
    protect,
    authorize('faculty'),
    [
      body('name')
        .trim()
        .notEmpty()
        .withMessage('Semester name is required')
        .isIn(['1st Semester', '2nd Semester', 'Summer'])
        .withMessage(
          'Semester name must be 1st Semester, 2nd Semester, or Summer'
        ),
      body('academicYear')
        .trim()
        .notEmpty()
        .withMessage('Academic year is required'),
    ],
    validate,
    semesterController.createSemester
  )
  .get(protect, semesterController.getSemesters);

router
  .route('/:id')
  .get(protect, semesterController.getSemester)
  .put(protect, authorize('faculty'), semesterController.updateSemester);

router.put(
  '/:id/set-current',
  protect,
  authorize('faculty'),
  semesterController.setCurrentSemester
);

module.exports = router;

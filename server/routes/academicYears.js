const router = require('express').Router();
const { body } = require('express-validator');
const { protect, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const academicYearController = require('../controllers/academicYearController');

router
  .route('/')
  .post(
    protect,
    authorize('faculty'),
    [
      body('yearStart')
        .isNumeric()
        .withMessage('Year start is required and must be a number'),
    ],
    validate,
    academicYearController.createAcademicYear
  )
  .get(protect, academicYearController.getAcademicYears);

router
  .route('/:id')
  .get(protect, academicYearController.getAcademicYear)
  .put(protect, authorize('faculty'), academicYearController.updateAcademicYear);

router.put(
  '/:id/set-current',
  protect,
  authorize('faculty'),
  academicYearController.setCurrentAcademicYear
);

module.exports = router;

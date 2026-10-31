const router = require('express').Router();
const { body } = require('express-validator');
const { protect, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const programController = require('../controllers/programController');

router
  .route('/')
  .post(
    protect,
    authorize('faculty'),
    [
      body('programName')
        .trim()
        .notEmpty()
        .withMessage('Program name is required'),
      body('programCode')
        .trim()
        .notEmpty()
        .withMessage('Program code is required'),
    ],
    validate,
    programController.createProgram
  )
  .get(programController.getPrograms);

router
  .route('/:id')
  .get(programController.getProgram)
  .put(protect, authorize('faculty'), programController.updateProgram)
  .delete(protect, authorize('faculty'), programController.deleteProgram);

module.exports = router;

const router = require('express').Router();
const { protect, authorize } = require('../middleware/auth');
const gradeController = require('../controllers/gradeController');

router.get(
  '/my-record',
  protect,
  authorize('student'),
  gradeController.getStudentAcademicRecord
);

router.get(
  '/gradebook/:courseOfferingId',
  protect,
  authorize('faculty'),
  gradeController.getFacultyGradebook
);

router.get(
  '/course-offering/:courseOfferingId',
  protect,
  authorize('faculty'),
  gradeController.getGradesForCourseOffering
);

router.get(
  '/student/:studentId/course-offering/:courseOfferingId',
  protect,
  gradeController.getStudentGrade
);

router.put(
  '/:id',
  protect,
  authorize('faculty'),
  gradeController.updateGrade
);

module.exports = router;

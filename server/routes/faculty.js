const router = require('express').Router();
const { protect, authorize } = require('../middleware/auth');
const facultyController = require('../controllers/facultyController');

router
  .route('/profile')
  .get(protect, authorize('faculty'), facultyController.getFacultyProfile)
  .put(protect, authorize('faculty'), facultyController.updateFacultyProfile);

router.get(
  '/students',
  protect,
  authorize('faculty'),
  facultyController.getAllStudents
);

router.get(
  '/students/:id',
  protect,
  authorize('faculty'),
  facultyController.getStudentDetails
);

module.exports = router;

const router = require('express').Router();
const { protect, authorize } = require('../middleware/auth');
const studentController = require('../controllers/studentController');

router
  .route('/profile')
  .get(protect, authorize('student'), studentController.getStudentProfile)
  .put(protect, authorize('student'), studentController.updateStudentProfile);

router.get(
  '/dashboard',
  protect,
  authorize('student'),
  studentController.getStudentDashboard
);

module.exports = router;

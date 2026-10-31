const router = require('express').Router();
const { protect } = require('../middleware/auth');
const {
  getStudentCourseProgress,
} = require('../controllers/studentController');

router.get('/course/:courseOfferingId', protect, getStudentCourseProgress);

module.exports = router;

const Lesson = require('../models/Lesson');
const CourseOffering = require('../models/CourseOffering');
const Enrollment = require('../models/Enrollment');
const StudentProgress = require('../models/StudentProgress');
const Quiz = require('../models/Quiz');
const QuizAttempt = require('../models/QuizAttempt');
const fs = require('fs');
const path = require('path');

// @desc    Create a new lesson
// @route   POST /api/lessons
// @access  Faculty
const createLesson = async (req, res) => {
  try {
    const { courseOffering, title, description, content, videoLinks, isPublished, requiresQuiz } =
      req.body;

    const offering = await CourseOffering.findById(courseOffering);
    if (!offering) {
      return res.status(404).json({ success: false, message: 'Course offering not found' });
    }

    if (offering.faculty.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized for this course' });
    }

    // Determine order
    let order = req.body.order;
    if (order === undefined || order === null) {
      const highestLesson = await Lesson.findOne({ courseOffering }).sort({ order: -1 });
      order = highestLesson ? highestLesson.order + 1 : 1;
    }

    // Parse video links if passed as string/JSON
    let parsedVideoLinks = [];
    if (videoLinks) {
      if (Array.isArray(videoLinks)) {
        parsedVideoLinks = videoLinks;
      } else {
        try {
          parsedVideoLinks = JSON.parse(videoLinks);
        } catch {
          parsedVideoLinks = [videoLinks];
        }
      }
    }

    // Process file attachments from multer
    const attachments = [];
    if (req.files && req.files.length > 0) {
      req.files.forEach((file) => {
        attachments.push({
          fileName: file.filename,
          fileUrl: `/uploads/lessons/${file.filename}`,
          fileType: file.mimetype,
          fileSize: file.size,
        });
      });
    }

    const lesson = await Lesson.create({
      courseOffering,
      title,
      description,
      content,
      attachments,
      videoLinks: parsedVideoLinks,
      order: Number(order),
      isPublished: isPublished === 'true' || isPublished === true,
      requiresQuiz: requiresQuiz === undefined ? true : requiresQuiz === 'true' || requiresQuiz === true,
    });

    // Auto-update student progress if this is the first published lesson
    if (lesson.isPublished) {
      const activeEnrollments = await Enrollment.find({
        courseOffering,
        status: 'active',
      });
      const allLessons = await Lesson.find({ courseOffering, isPublished: true }).sort({
        order: 1,
      });

      if (allLessons.length === 1 && allLessons[0]._id.toString() === lesson._id.toString()) {
        for (const enr of activeEnrollments) {
          await StudentProgress.findOneAndUpdate(
            {
              student: enr.student,
              courseOffering,
              lessonId: lesson._id,
            },
            { $setOnInsert: { status: 'available', quizPassed: false } },
            { upsert: true }
          );
        }
      }
    }

    res.status(201).json({ success: true, data: lesson });
  } catch (error) {
    console.error('createLesson error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get lessons for a course offering
// @route   GET /api/lessons/course-offering/:courseOfferingId
// @access  Authenticated
const getLessons = async (req, res) => {
  try {
    const { courseOfferingId } = req.params;

    const offering = await CourseOffering.findById(courseOfferingId);
    if (!offering) {
      return res.status(404).json({ success: false, message: 'Course offering not found' });
    }

    if (req.user.role === 'faculty') {
      if (offering.faculty.toString() !== req.user._id.toString()) {
        return res.status(403).json({ success: false, message: 'Not authorized for this course' });
      }

      const lessons = await Lesson.find({ courseOffering: courseOfferingId }).sort({ order: 1 });
      const quizzes = await Quiz.find({ lesson: { $in: lessons.map((l) => l._id) } });

      const lessonsWithQuiz = lessons.map((l) => {
        const doc = l.toObject();
        doc.quiz = quizzes.find((q) => q.lesson.toString() === l._id.toString()) || null;
        return doc;
      });

      return res.status(200).json({ success: true, data: lessonsWithQuiz });
    }

    // Student role
    const enrollment = await Enrollment.findOne({
      student: req.user._id,
      courseOffering: courseOfferingId,
      status: 'active',
    });

    if (!enrollment) {
      return res.status(403).json({ success: false, message: 'Not enrolled in this course' });
    }

    // Published lessons only
    const lessons = await Lesson.find({
      courseOffering: courseOfferingId,
      isPublished: true,
    }).sort({ order: 1 });

    const progressRecords = await StudentProgress.find({
      student: req.user._id,
      courseOffering: courseOfferingId,
    });

    const quizzes = await Quiz.find({
      lesson: { $in: lessons.map((l) => l._id) },
    }).select('-questions.choices.isCorrect -questions.correctAnswer');

    // Make sure 1st published lesson is available
    if (lessons.length > 0) {
      const firstLesson = lessons[0];
      const hasFirstProgress = progressRecords.find(
        (p) => p.lessonId.toString() === firstLesson._id.toString()
      );
      if (!hasFirstProgress) {
        const firstProgress = await StudentProgress.create({
          student: req.user._id,
          courseOffering: courseOfferingId,
          lessonId: firstLesson._id,
          status: 'available',
          quizPassed: false,
        });
        progressRecords.push(firstProgress);
      }
    }

    const result = lessons.map((lesson, index) => {
      const progress = progressRecords.find(
        (p) => p.lessonId.toString() === lesson._id.toString()
      );
      const quiz = quizzes.find((q) => q.lesson.toString() === lesson._id.toString());

      // Progression calculation
      let status = 'locked';
      if (index === 0) {
        status = progress?.status || 'available';
      } else {
        // Look at previous lesson progress
        const prevLesson = lessons[index - 1];
        const prevProgress = progressRecords.find(
          (p) => p.lessonId.toString() === prevLesson._id.toString()
        );

        if (prevProgress?.status === 'completed' || prevProgress?.quizPassed) {
          status = progress?.status || 'available';
        } else {
          status = 'locked';
        }
      }

      const doc = lesson.toObject();
      doc.status = status;
      doc.quizPassed = progress?.quizPassed || false;
      doc.highestQuizScore = progress?.highestQuizScore || null;
      doc.quiz = quiz || null;

      // Strip content and attachments if locked to prevent URL bypassing
      if (status === 'locked') {
        doc.content = null;
        doc.attachments = [];
        doc.videoLinks = [];
      }

      return doc;
    });

    res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.error('getLessons error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single lesson
// @route   GET /api/lessons/:id
// @access  Authenticated
const getLesson = async (req, res) => {
  try {
    const lesson = await Lesson.findById(req.params.id);
    if (!lesson) {
      return res.status(404).json({ success: false, message: 'Lesson not found' });
    }

    const offering = await CourseOffering.findById(lesson.courseOffering);
    if (!offering) {
      return res.status(404).json({ success: false, message: 'Course offering not found' });
    }

    if (req.user.role === 'faculty') {
      if (offering.faculty.toString() !== req.user._id.toString()) {
        return res.status(403).json({ success: false, message: 'Not authorized for this course' });
      }
      const quiz = await Quiz.findOne({ lesson: lesson._id });
      const doc = lesson.toObject();
      doc.quiz = quiz;
      return res.status(200).json({ success: true, data: doc });
    }

    // Student role
    const enrollment = await Enrollment.findOne({
      student: req.user._id,
      courseOffering: lesson.courseOffering,
      status: 'active',
    });

    if (!enrollment) {
      return res.status(403).json({ success: false, message: 'Not enrolled in this course' });
    }

    if (!lesson.isPublished) {
      return res.status(403).json({ success: false, message: 'This lesson is not published' });
    }

    // Progression check on backend
    const allPublished = await Lesson.find({
      courseOffering: lesson.courseOffering,
      isPublished: true,
    }).sort({ order: 1 });

    const lessonIndex = allPublished.findIndex((l) => l._id.toString() === lesson._id.toString());
    if (lessonIndex > 0) {
      const prevLesson = allPublished[lessonIndex - 1];
      const prevProgress = await StudentProgress.findOne({
        student: req.user._id,
        courseOffering: lesson.courseOffering,
        lessonId: prevLesson._id,
      });

      if (!prevProgress || (!prevProgress.quizPassed && prevProgress.status !== 'completed')) {
        return res.status(403).json({
          success: false,
          message: 'This lesson is locked. You must complete the previous lesson quiz first.',
        });
      }
    }

    // Ensure progress record exists
    let progress = await StudentProgress.findOne({
      student: req.user._id,
      courseOffering: lesson.courseOffering,
      lessonId: lesson._id,
    });

    if (!progress) {
      progress = await StudentProgress.create({
        student: req.user._id,
        courseOffering: lesson.courseOffering,
        lessonId: lesson._id,
        status: 'available',
        quizPassed: false,
      });
    }

    const quiz = await Quiz.findOne({ lesson: lesson._id }).select(
      '-questions.choices.isCorrect -questions.correctAnswer'
    );

    const doc = lesson.toObject();
    doc.quiz = quiz;
    doc.status = progress.status;
    doc.quizPassed = progress.quizPassed;
    doc.highestQuizScore = progress.highestQuizScore;

    res.status(200).json({ success: true, data: doc });
  } catch (error) {
    console.error('getLesson error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update lesson
// @route   PUT /api/lessons/:id
// @access  Faculty
const updateLesson = async (req, res) => {
  try {
    const lesson = await Lesson.findById(req.params.id);
    if (!lesson) {
      return res.status(404).json({ success: false, message: 'Lesson not found' });
    }

    const offering = await CourseOffering.findById(lesson.courseOffering);
    if (offering.faculty.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to modify this lesson' });
    }

    const { title, description, content, videoLinks, isPublished, requiresQuiz, order } = req.body;

    if (title !== undefined) lesson.title = title;
    if (description !== undefined) lesson.description = description;
    if (content !== undefined) lesson.content = content;
    if (order !== undefined) lesson.order = Number(order);
    if (isPublished !== undefined) lesson.isPublished = isPublished === 'true' || isPublished === true;
    if (requiresQuiz !== undefined)
      lesson.requiresQuiz = requiresQuiz === 'true' || requiresQuiz === true;

    if (videoLinks) {
      if (Array.isArray(videoLinks)) {
        lesson.videoLinks = videoLinks;
      } else {
        try {
          lesson.videoLinks = JSON.parse(videoLinks);
        } catch {
          lesson.videoLinks = [videoLinks];
        }
      }
    }

    if (req.files && req.files.length > 0) {
      req.files.forEach((file) => {
        lesson.attachments.push({
          fileName: file.filename,
          fileUrl: `/uploads/lessons/${file.filename}`,
          fileType: file.mimetype,
          fileSize: file.size,
        });
      });
    }

    await lesson.save();

    res.status(200).json({ success: true, data: lesson });
  } catch (error) {
    console.error('updateLesson error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete lesson
// @route   DELETE /api/lessons/:id
// @access  Faculty
const deleteLesson = async (req, res) => {
  try {
    const lesson = await Lesson.findById(req.params.id);
    if (!lesson) {
      return res.status(404).json({ success: false, message: 'Lesson not found' });
    }

    const offering = await CourseOffering.findById(lesson.courseOffering);
    if (offering.faculty.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized for this course' });
    }

    // Clean up files
    lesson.attachments.forEach((att) => {
      const filePath = path.join(__dirname, '..', 'uploads', 'lessons', att.fileName);
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch (e) {
          console.error('File cleanup error:', e);
        }
      }
    });

    // Delete associated quiz and attempts
    const quiz = await Quiz.findOne({ lesson: lesson._id });
    if (quiz) {
      await QuizAttempt.deleteMany({ quiz: quiz._id });
      await Quiz.findByIdAndDelete(quiz._id);
    }

    // Delete progress records
    await StudentProgress.deleteMany({ lessonId: lesson._id });

    await Lesson.findByIdAndDelete(lesson._id);

    // Re-index order of remaining lessons
    const remaining = await Lesson.find({ courseOffering: offering._id }).sort({ order: 1 });
    for (let i = 0; i < remaining.length; i++) {
      remaining[i].order = i + 1;
      await remaining[i].save();
    }

    res.status(200).json({ success: true, message: 'Lesson deleted successfully' });
  } catch (error) {
    console.error('deleteLesson error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Reorder lessons
// @route   PUT /api/lessons/reorder/:courseOfferingId
// @access  Faculty
const reorderLessons = async (req, res) => {
  try {
    const { courseOfferingId } = req.params;
    const { orders } = req.body; // Array of { lessonId, order }

    const offering = await CourseOffering.findById(courseOfferingId);
    if (!offering) {
      return res.status(404).json({ success: false, message: 'Course offering not found' });
    }

    if (offering.faculty.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized for this course' });
    }

    if (!Array.isArray(orders)) {
      return res.status(400).json({ success: false, message: 'Orders array is required' });
    }

    for (const item of orders) {
      await Lesson.findOneAndUpdate(
        { _id: item.lessonId, courseOffering: courseOfferingId },
        { order: item.order }
      );
    }

    const updated = await Lesson.find({ courseOffering: courseOfferingId }).sort({ order: 1 });

    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    console.error('reorderLessons error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Remove attachment from lesson
// @route   DELETE /api/lessons/:id/attachment/:fileName
// @access  Faculty
const removeAttachment = async (req, res) => {
  try {
    const { id, fileName } = req.params;
    const lesson = await Lesson.findById(id);
    if (!lesson) {
      return res.status(404).json({ success: false, message: 'Lesson not found' });
    }

    const offering = await CourseOffering.findById(lesson.courseOffering);
    if (offering.faculty.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized for this course' });
    }

    lesson.attachments = lesson.attachments.filter((a) => a.fileName !== fileName);
    await lesson.save();

    const filePath = path.join(__dirname, '..', 'uploads', 'lessons', fileName);
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (e) {
        console.error('File cleanup error:', e);
      }
    }

    res.status(200).json({ success: true, data: lesson });
  } catch (error) {
    console.error('removeAttachment error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createLesson,
  getLessons,
  getLesson,
  updateLesson,
  deleteLesson,
  reorderLessons,
  removeAttachment,
};


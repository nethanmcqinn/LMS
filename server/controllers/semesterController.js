const Semester = require('../models/Semester');

const createSemester = async (req, res) => {
  try {
    const { name, academicYear, isCurrent, startDate, endDate } = req.body;

    if (isCurrent) {
      await Semester.updateMany({ academicYear }, { isCurrent: false });
    }

    const semester = await Semester.create({
      name,
      academicYear,
      isCurrent: isCurrent || false,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    });

    const populated = await Semester.findById(semester._id).populate('academicYear');

    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    console.error('createSemester error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Semester already exists for this academic year' });
    }
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ success: false, message: messages.join(', ') });
    }
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const getSemesters = async (req, res) => {
  try {
    const filter = {};
    if (req.query.academicYear) {
      filter.academicYear = req.query.academicYear;
    }

    const semesters = await Semester.find(filter)
      .populate('academicYear')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: semesters });
  } catch (error) {
    console.error('getSemesters error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const getSemester = async (req, res) => {
  try {
    const semester = await Semester.findById(req.params.id).populate('academicYear');
    if (!semester) {
      return res.status(404).json({ success: false, message: 'Semester not found' });
    }
    res.status(200).json({ success: true, data: semester });
  } catch (error) {
    console.error('getSemester error:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ success: false, message: 'Semester not found' });
    }
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const updateSemester = async (req, res) => {
  try {
    const { name, academicYear, isCurrent, startDate, endDate } = req.body;

    const semester = await Semester.findById(req.params.id);
    if (!semester) {
      return res.status(404).json({ success: false, message: 'Semester not found' });
    }

    if (name !== undefined) semester.name = name;
    if (academicYear !== undefined) semester.academicYear = academicYear;
    if (isCurrent !== undefined) semester.isCurrent = isCurrent;
    if (startDate !== undefined) semester.startDate = startDate;
    if (endDate !== undefined) semester.endDate = endDate;

    await semester.save();

    const populated = await Semester.findById(semester._id).populate('academicYear');

    res.status(200).json({ success: true, data: populated });
  } catch (error) {
    console.error('updateSemester error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Semester already exists for this academic year' });
    }
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ success: false, message: messages.join(', ') });
    }
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const setCurrentSemester = async (req, res) => {
  try {
    const semester = await Semester.findById(req.params.id);
    if (!semester) {
      return res.status(404).json({ success: false, message: 'Semester not found' });
    }

    await Semester.updateMany({ academicYear: semester.academicYear }, { isCurrent: false });

    semester.isCurrent = true;
    await semester.save();

    const populated = await Semester.findById(semester._id).populate('academicYear');

    res.status(200).json({ success: true, data: populated, message: 'Current semester updated' });
  } catch (error) {
    console.error('setCurrentSemester error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { createSemester, getSemesters, getSemester, updateSemester, setCurrentSemester };

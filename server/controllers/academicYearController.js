const AcademicYear = require('../models/AcademicYear');

const createAcademicYear = async (req, res) => {
  try {
    const { yearStart, yearEnd, isCurrent } = req.body;

    const existing = await AcademicYear.findOne({ yearStart, yearEnd: yearEnd || yearStart + 1 });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Academic year already exists' });
    }

    if (isCurrent) {
      await AcademicYear.updateMany({}, { isCurrent: false });
    }

    const academicYear = await AcademicYear.create({
      yearStart,
      yearEnd: yearEnd || yearStart + 1,
      isCurrent: isCurrent || false,
    });

    res.status(201).json({ success: true, data: academicYear });
  } catch (error) {
    console.error('createAcademicYear error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Academic year already exists' });
    }
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ success: false, message: messages.join(', ') });
    }
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const getAcademicYears = async (req, res) => {
  try {
    const academicYears = await AcademicYear.find().sort({ yearStart: -1 });
    res.status(200).json({ success: true, data: academicYears });
  } catch (error) {
    console.error('getAcademicYears error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const getAcademicYear = async (req, res) => {
  try {
    const academicYear = await AcademicYear.findById(req.params.id);
    if (!academicYear) {
      return res.status(404).json({ success: false, message: 'Academic year not found' });
    }
    res.status(200).json({ success: true, data: academicYear });
  } catch (error) {
    console.error('getAcademicYear error:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ success: false, message: 'Academic year not found' });
    }
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const updateAcademicYear = async (req, res) => {
  try {
    const { yearStart, yearEnd, isCurrent } = req.body;

    const academicYear = await AcademicYear.findById(req.params.id);
    if (!academicYear) {
      return res.status(404).json({ success: false, message: 'Academic year not found' });
    }

    if (yearStart !== undefined) academicYear.yearStart = yearStart;
    if (yearEnd !== undefined) academicYear.yearEnd = yearEnd;
    if (isCurrent !== undefined) academicYear.isCurrent = isCurrent;

    await academicYear.save();

    res.status(200).json({ success: true, data: academicYear });
  } catch (error) {
    console.error('updateAcademicYear error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Academic year already exists' });
    }
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ success: false, message: messages.join(', ') });
    }
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const setCurrentAcademicYear = async (req, res) => {
  try {
    const academicYear = await AcademicYear.findById(req.params.id);
    if (!academicYear) {
      return res.status(404).json({ success: false, message: 'Academic year not found' });
    }

    await AcademicYear.updateMany({}, { isCurrent: false });

    academicYear.isCurrent = true;
    await academicYear.save();

    res.status(200).json({ success: true, data: academicYear, message: 'Current academic year updated' });
  } catch (error) {
    console.error('setCurrentAcademicYear error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { createAcademicYear, getAcademicYears, getAcademicYear, updateAcademicYear, setCurrentAcademicYear };

const DegreeProgram = require('../models/DegreeProgram');

const createProgram = async (req, res) => {
  try {
    const { programName, programCode, description, availableYearLevels } = req.body;

    const existing = await DegreeProgram.findOne({ programCode: programCode.toUpperCase() });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Program code already exists' });
    }

    const program = await DegreeProgram.create({
      programName,
      programCode,
      description: description || '',
      availableYearLevels: availableYearLevels || [1, 2, 3, 4],
    });

    res.status(201).json({ success: true, data: program });
  } catch (error) {
    console.error('createProgram error:', error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ success: false, message: messages.join(', ') });
    }
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const getPrograms = async (req, res) => {
  try {
    const programs = await DegreeProgram.find({ isActive: true }).sort({ programName: 1 });
    res.status(200).json({ success: true, data: programs });
  } catch (error) {
    console.error('getPrograms error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const getProgram = async (req, res) => {
  try {
    const program = await DegreeProgram.findById(req.params.id);
    if (!program) {
      return res.status(404).json({ success: false, message: 'Program not found' });
    }
    res.status(200).json({ success: true, data: program });
  } catch (error) {
    console.error('getProgram error:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ success: false, message: 'Program not found' });
    }
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const updateProgram = async (req, res) => {
  try {
    const { programName, programCode, description, availableYearLevels } = req.body;

    const program = await DegreeProgram.findById(req.params.id);
    if (!program) {
      return res.status(404).json({ success: false, message: 'Program not found' });
    }

    if (programName !== undefined) program.programName = programName;
    if (programCode !== undefined) program.programCode = programCode;
    if (description !== undefined) program.description = description;
    if (availableYearLevels !== undefined) program.availableYearLevels = availableYearLevels;

    await program.save();

    res.status(200).json({ success: true, data: program });
  } catch (error) {
    console.error('updateProgram error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Program code already exists' });
    }
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ success: false, message: messages.join(', ') });
    }
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const deleteProgram = async (req, res) => {
  try {
    const program = await DegreeProgram.findById(req.params.id);
    if (!program) {
      return res.status(404).json({ success: false, message: 'Program not found' });
    }

    program.isActive = false;
    await program.save();

    res.status(200).json({ success: true, message: 'Program deactivated successfully' });
  } catch (error) {
    console.error('deleteProgram error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { createProgram, getPrograms, getProgram, updateProgram, deleteProgram };

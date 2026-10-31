const mongoose = require('mongoose');

const studentIdCounterSchema = new mongoose.Schema(
  {
    enrollmentYear: {
      type: Number,
      required: [true, 'Enrollment year is required'],
    },
    programCode: {
      type: String,
      required: [true, 'Program code is required'],
      uppercase: true,
      trim: true,
    },
    sequence: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function (_doc, ret) {
        delete ret.__v;
        return ret;
      },
    },
    toObject: {
      virtuals: true,
      transform: function (_doc, ret) {
        delete ret.__v;
        return ret;
      },
    },
  }
);

studentIdCounterSchema.index({ enrollmentYear: 1, programCode: 1 }, { unique: true });

studentIdCounterSchema.statics.getNextId = async function (enrollmentYear, programCode) {
  const counter = await this.findOneAndUpdate(
    { enrollmentYear, programCode: programCode.toUpperCase() },
    { $inc: { sequence: 1 } },
    { new: true, upsert: true }
  );
  const paddedSequence = String(counter.sequence).padStart(4, '0');
  return `${enrollmentYear}-${programCode.toUpperCase()}-${paddedSequence}`;
};

const StudentIdCounter = mongoose.model('StudentIdCounter', studentIdCounterSchema);

module.exports = StudentIdCounter;

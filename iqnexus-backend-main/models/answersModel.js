import mongoose from 'mongoose';

const scoringSectionSchema = new mongoose.Schema(
  {
    index: { type: Number, required: true },
    from: { type: Number, required: true },
    to: { type: Number, required: true },
    marksPerQuestion: { type: Number, required: true },
    label: { type: String, default: "" },
    isAchiever: { type: Boolean, default: false },
  },
  { _id: false }
);

const answerSchema = new mongoose.Schema(
  {
    examLevel: {
      type: String,
      required: true,
    },
    subject: {
      type: String,
      required: true,
    },
    class: {
      type: String,
      required: true,
    },
    questions: {
      type: Object,
      required: true,
    },
    /** Optional 1…N section / marks layout used by KG auto-scoring */
    scoringPattern: {
      totalQuestions: { type: Number },
      sections: { type: [scoringSectionSchema], default: undefined },
    },
  },
  { timestamps: true }
);

export const answersModel = mongoose.model('Question', answerSchema);

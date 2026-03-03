import mongoose from 'mongoose';

const answerSchema = new mongoose.Schema({
    examLevel: {
        type: String,
        required: true
    },
    subject: {
        type: String,
        required: true
    },
    class: {
        type: String,
        required: true
    },
    questions: {
        type: Object,
        required: true
    },
}, { timestamps: true });

export const answersModel= mongoose.model('Question', answerSchema);
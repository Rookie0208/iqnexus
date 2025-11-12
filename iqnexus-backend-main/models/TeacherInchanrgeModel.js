import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

mongoose.connect(process.env.MONGO_URI);

const teacherInchargeSchema = new mongoose.Schema({
  no: {
    type: Number,
    unique: true,
  },
  schoolCode: {
    type: Number,
    required: true,
  },
  class: {
    type: String,
    required: true,
    trim: true,
  },
  section: {
    type: String,
    required: true,
    trim: true,
  },
  classTeacher: {
    type: String,

    trim: true,
  },
  classTeacherMobNo: {
    type: String,
   
    trim: true,
  },
  classTeacherEmail: {
    type: String,

    trim: true,
    lowercase: true,
  },
  classTeacherDob: {
    type: String,
    trim: true,
    default: "",
  },
  examInchargeName: {
    type: String,
    required: true,
    trim: true,
  },
  examInchargeMobNo: {
    type: String,
    required: true,
    trim: true,
  },
  examInchargeEmail: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
  },
  examInchargeDob: {
    type: String,
    trim: true,
    default: "",
  },
}, {
  timestamps: true,
});

const modelName = "teacher-incharge-data";

export const TeacherIncharge = mongoose.models[modelName] || mongoose.model(modelName, teacherInchargeSchema, modelName);
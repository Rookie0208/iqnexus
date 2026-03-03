import mongoose from "mongoose";

const schoolSchema = new mongoose.Schema({
  schoolCode: { type: Number, required: true, unique: true, index: true },
  schoolName: { type: String, index: true },
  schoolEmail: String,
  fax: String,
  area: String,
  city: String,
  country: String,
  incharge: String,
  inchargeDob: String,
  schoolMobNo: String,
  principalName: String,
  principalDob: String,
  principalMobNo: String,
  remark: String,
});


const modelName = "schools-datas";

export const School = mongoose.models[modelName] || mongoose.model(modelName, schoolSchema, modelName);
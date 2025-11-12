import mongoose from "mongoose";
import dotenv from "dotenv"
dotenv.config()


mongoose.connect(process.env.MONGO_URI);

const schoolSchema = new mongoose.Schema({
  schoolCode: Number,
  schoolName: String,
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
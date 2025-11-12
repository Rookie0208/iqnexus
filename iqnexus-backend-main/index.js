import express from "express";
import cors from "cors";
import multer from "multer";
import fs from "fs/promises";
import mongoose from "mongoose";
import dotenv from "dotenv";

import routes from "./routes/index.js";

const app = express();
dotenv.config();

const PORT = process.env.PORT || 3000;
const uploadDir = "uploads";
if (!fs.stat(uploadDir).catch(() => fs.mkdir(uploadDir))) {
  console.log("Uploads directory created");
}

app.use(cors({ origin: "*" }));
app.use(express.json());
app.use(multer({ dest: "uploads/" }).single("file"));

if (!process.env.MONGO_URI) {
  console.error("Error: MONGO_URI is not defined in .env file");
  process.exit(1);
}

mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Attach all routes
app.use("/", routes);

app.get("/health", (_, res) => {
  res.status(200).json({ message: "Server is Healthy" });
});

app.listen(PORT, () => {
  console.log(`Server is UP and RUNNING on port ${PORT}`);
});


export default app;

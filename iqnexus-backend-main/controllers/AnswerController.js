import {answersModel} from "../models/answersModel.js";
import { STUDENT_LATEST } from "../models/newStudentModel.model.js";

export const uploadAnswers = async (req, res) => {
    try {
        const { examLevel, subject, class: className, questions } = req.body;

        if (!examLevel || !subject || !className || !questions) {
            return res.status(400).json({ message: "Missing required fields" });
        }

        const newAnswers = new answersModel({
            examLevel,
            subject,
            class: className,
            questions,
        });

        await newAnswers.save();

        res.status(200).json({ message: "Answers uploaded successfully" });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const getAnswers = async (req, res) => {
    const subjectsToFetch =[]
    try {
        const {rollNo, className,schoolCode } = req.body;
        console.log("Request body:", req.body);
            const studentData=await STUDENT_LATEST.findOne({ schoolCode: Number(schoolCode), class: className, rollNo: rollNo });
            

        if ( !rollNo|| !schoolCode || !className) {
            return res.status(400).json({ message: "Missing required query parameters" });
        }
        console.log("Student data fetched:", studentData);
        if(studentData.IAOL1 === "1" ) subjectsToFetch.push("IAOL1");
        if(studentData.ITSTL1 === "1") subjectsToFetch.push("ITSTL1");
        if(studentData.IMOL1 === "1" ) subjectsToFetch.push("IMOL1");
        if(studentData.IGKOL1 === "1" ) subjectsToFetch.push("IGKOL1");
        if(studentData.IENGOL1 === "1" ) subjectsToFetch.push("IENGOL1");
        if(studentData.IAOL2 === "1" ) subjectsToFetch.push("IAOL2");
        if(studentData.ITSTL2 === "1" ) subjectsToFetch.push("ITSTL2");
        if(studentData.IMOL2 === "1" ) subjectsToFetch.push("IMOL2");
        if(studentData.IENGOL2 === "1") subjectsToFetch.push("IENGOL2");

        const query = {
            subject: { $in: subjectsToFetch },
        };
        query.class = className;
        const answers = await answersModel.find({ ...query })
        console.log("Answers fetched:", answers);
        res.status(200).json({  answerKeys:answers });

        if (!answers) {
            return res.status(404).json({ message: "Answers List not available" });
        }

    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};


import { feedbackModel } from "../models/feedbackModel.js";

export async function storeFeedBack(req, res) {
    try {
        // Assuming you have a Feedback model imported
        // and your schema fields are: name, email, message, rating
        const { rollNo, category, message, status,mobileNo } = req.body;

        const feedback = new feedbackModel({
            category,
            rollNo,
            message,
            mobileNo,
            status
        });

        await feedback.save();

        res.status(201).json({ success: true, message: 'Feedback stored successfully.' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error storing feedback.', error: error.message });
    }
}
export async function getFeedback(req, res) {

    try {
        const feedbacks = await feedbackModel.find({});
        res.status(200).json({ success: true, data: feedbacks });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching feedbacks.', error: error.message });
    }
}
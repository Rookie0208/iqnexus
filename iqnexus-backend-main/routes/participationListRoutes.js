import { getParticipationFilteredList } from "../controllers/participationListController.js";
import express from "express";
const router = express.Router();
// Route to get participation filtered list
router.post("/participation-list-filtered", getParticipationFilteredList);
// Export the router
export default router;
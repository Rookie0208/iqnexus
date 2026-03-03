import express from "express";
import {
  getPrizeConfig,
  getAllPrizeConfigs,
  savePrizeConfig,
  deletePrizeConfig,
  clonePrizeConfig,
} from "../controllers/prizeConfigController.js";

const router = express.Router();

// GET  /prize-config?exam=IQGKOL1&classLevel=all&level=basic
router.get("/prize-config", getPrizeConfig);

// GET  /prize-configs?exam=IQGKOL1  (list all, optional filters)
router.get("/prize-configs", getAllPrizeConfigs);

// POST /prize-config  (create / update)
router.post("/prize-config", savePrizeConfig);

// POST /prize-config/clone
router.post("/prize-config/clone", clonePrizeConfig);

// DELETE /prize-config/:id
router.delete("/prize-config/:id", deletePrizeConfig);

export default router;

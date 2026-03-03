import { PrizeConfig } from "../models/prizeConfigModel.js";

/**
 * Default prize rules template based on the standard IQ Nexus prize structure.
 * These are used when creating a new config so the admin can start editing
 * from a sensible default.
 */
const defaultPrizeRules = [
  {
    priority: 1,
    prizeType: "INTERNATIONAL WINNER CUP;MEDAL OF EXCELLENCE(GOLD);CERTIFICATE",
    isTopperCategory: true,
    category: "NATIONALITY",
    show: true,
    totalPrizes: 1,
    excludeHigherPrizeWinners: true,
  },
  {
    priority: 2,
    prizeType: "INTERNATIONAL WINNER CUP;MEDAL OF EXCELLENCE(SILVER);CERTIFICATE",
    isTopperCategory: true,
    category: "NATIONALITY",
    show: true,
    totalPrizes: 1,
    excludeHigherPrizeWinners: true,
  },
  {
    priority: 3,
    prizeType: "INTERNATIONAL WINNER CUP;MEDAL OF EXCELLENCE(BRONZE);CERTIFICATE",
    isTopperCategory: true,
    category: "NATIONALITY",
    show: true,
    totalPrizes: 1,
    excludeHigherPrizeWinners: true,
  },
  {
    priority: 4,
    prizeType: "NATIONAL WINNER CUP;MEDAL OF EXCELLENCE(GOLD);CERTIFICATE",
    isTopperCategory: true,
    category: "COUNTRY",
    show: true,
    totalPrizes: 1,
    excludeHigherPrizeWinners: true,
  },
  {
    priority: 5,
    prizeType: "NATIONAL WINNER CUP;MEDAL OF EXCELLENCE(SILVER);CERTIFICATE",
    isTopperCategory: true,
    category: "COUNTRY",
    show: true,
    totalPrizes: 1,
    excludeHigherPrizeWinners: true,
  },
  {
    priority: 6,
    prizeType: "NATIONAL WINNER CUP;MEDAL OF EXCELLENCE(BRONZE);CERTIFICATE",
    isTopperCategory: true,
    category: "COUNTRY",
    show: true,
    totalPrizes: 1,
    excludeHigherPrizeWinners: true,
  },
  {
    priority: 7,
    prizeType: "ZONAL TOPPER CUP;MEDAL OF HONOUR;CERTIFICATE",
    isTopperCategory: true,
    category: "CITY",
    show: true,
    totalPrizes: 1,
    excludeHigherPrizeWinners: true,
  },
  {
    priority: 8,
    prizeType: "SHINING STAR OF THE SCHOOL WINNER TROPHY;MEDAL OF HONOUR;CERTIFICATE",
    isTopperCategory: true,
    category: "SCHOOL",
    show: true,
    totalPrizes: 1,
    excludeHigherPrizeWinners: true,
  },
  {
    priority: 9,
    prizeType: "CLASS TOPPER GOLD MEDAL;CERTIFICATE",
    isTopperCategory: true,
    category: "CLASS",
    show: true,
    totalPrizes: 1,
    excludeHigherPrizeWinners: true,
  },
  {
    priority: 10,
    prizeType: "CLASS TOPPER SILVER MEDAL;CERTIFICATE",
    isTopperCategory: true,
    category: "CLASS",
    show: true,
    totalPrizes: 1,
    excludeHigherPrizeWinners: true,
  },
  {
    priority: 11,
    prizeType: "CLASS TOPPER BRONZE MEDAL;CERTIFICATE",
    isTopperCategory: true,
    category: "CLASS",
    show: true,
    totalPrizes: 1,
    excludeHigherPrizeWinners: true,
  },
  {
    priority: 12,
    prizeType: "MEDAL OF DISTINCTION;CERTIFICATE",
    isTopperCategory: true,
    category: "SECTION",
    show: true,
    totalPrizes: 2,
    excludeHigherPrizeWinners: true,
  },
  {
    priority: 13,
    prizeType: "CERTIFICATE",
    isTopperCategory: false,
    category: "all",
    show: true,
    totalPrizes: 10000,
    excludeHigherPrizeWinners: false,
  },
];


/**
 * Get prize config for a given exam + classLevel + level
 */
export const getPrizeConfig = async (req, res) => {
  try {
    const { exam, classLevel, batchId = "2024-25", level = "basic" } = req.query;

    if (!exam) {
      return res.status(400).json({ success: false, error: "exam is required" });
    }

    const config = await PrizeConfig.findOne({
      exam,
      classLevel: classLevel || "all",
      batchId,
      level,
    });

    return res.status(200).json({
      success: true,
      config: config || null,
    });
  } catch (error) {
    console.error("Error fetching prize config:", error);
    return res.status(500).json({ success: false, error: "Failed to fetch prize configuration" });
  }
};


/**
 * Get ALL prize configs (optionally filtered by exam or batchId)
 */
export const getAllPrizeConfigs = async (req, res) => {
  try {
    const { exam, batchId, level } = req.query;
    const filter = {};
    if (exam) filter.exam = exam;
    if (batchId) filter.batchId = batchId;
    if (level) filter.level = level;

    const configs = await PrizeConfig.find(filter).sort({ exam: 1, classLevel: 1, level: 1 });

    return res.status(200).json({ success: true, configs });
  } catch (error) {
    console.error("Error fetching all prize configs:", error);
    return res.status(500).json({ success: false, error: "Failed to fetch prize configurations" });
  }
};


/**
 * Create or update a prize config (upsert)
 */
export const savePrizeConfig = async (req, res) => {
  try {
    const {
      exam,
      classLevel = "all",
      batchId = "2024-25",
      level = "basic",
      prizeRules,
      excludeHigherWinners = true,
      isActive = true,
    } = req.body;

    if (!exam) {
      return res.status(400).json({ success: false, error: "exam is required" });
    }

    const updateData = {
      exam,
      classLevel,
      batchId,
      level,
      excludeHigherWinners,
      isActive,
    };

    // If prizeRules were provided use them, otherwise use defaults for new docs
    if (prizeRules && Array.isArray(prizeRules)) {
      updateData.prizeRules = prizeRules;
    }

    const config = await PrizeConfig.findOneAndUpdate(
      { exam, classLevel, batchId, level },
      { $set: updateData },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    // If created fresh and no prizeRules were sent, seed with defaults
    if ((!prizeRules || prizeRules.length === 0) && config.prizeRules.length === 0) {
      config.prizeRules = defaultPrizeRules;
      await config.save();
    }

    return res.status(200).json({ success: true, config });
  } catch (error) {
    console.error("Error saving prize config:", error);
    return res.status(500).json({ success: false, error: "Failed to save prize configuration" });
  }
};


/**
 * Delete a prize config
 */
export const deletePrizeConfig = async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await PrizeConfig.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ success: false, error: "Prize configuration not found" });
    }

    return res.status(200).json({ success: true, message: "Prize configuration deleted" });
  } catch (error) {
    console.error("Error deleting prize config:", error);
    return res.status(500).json({ success: false, error: "Failed to delete prize configuration" });
  }
};


/**
 * Clone a prize config from one exam/class to another
 */
export const clonePrizeConfig = async (req, res) => {
  try {
    const { sourceExam, sourceClassLevel, sourceBatchId = "2024-25", sourceLevel = "basic",
            targetExam, targetClassLevel, targetBatchId = "2024-25", targetLevel = "basic" } = req.body;

    if (!sourceExam || !targetExam) {
      return res.status(400).json({ success: false, error: "sourceExam and targetExam are required" });
    }

    const source = await PrizeConfig.findOne({
      exam: sourceExam,
      classLevel: sourceClassLevel || "all",
      batchId: sourceBatchId,
      level: sourceLevel,
    });

    if (!source) {
      return res.status(404).json({ success: false, error: "Source prize config not found" });
    }

    const cloneData = {
      exam: targetExam,
      classLevel: targetClassLevel || "all",
      batchId: targetBatchId,
      level: targetLevel,
      prizeRules: source.prizeRules,
      excludeHigherWinners: source.excludeHigherWinners,
      isActive: source.isActive,
    };

    const config = await PrizeConfig.findOneAndUpdate(
      { exam: targetExam, classLevel: targetClassLevel || "all", batchId: targetBatchId, level: targetLevel },
      { $set: cloneData },
      { new: true, upsert: true }
    );

    return res.status(200).json({ success: true, config });
  } catch (error) {
    console.error("Error cloning prize config:", error);
    return res.status(500).json({ success: false, error: "Failed to clone prize configuration" });
  }
};

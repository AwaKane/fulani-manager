// routes/soinsRoutes.js
import express from "express";
import {
  getSoins,
  getSoinsByClient,
  addSoin,
  updateSoin,
  deleteSoin,
} from "../controllers/soinsController.js";

const router = express.Router();

// ➤ /api/soins
router.get("/", getSoins);
router.get("/client/:client_id", getSoinsByClient);
router.post("/", addSoin);
router.put("/:id", updateSoin);
router.delete("/:id", deleteSoin);

export default router;

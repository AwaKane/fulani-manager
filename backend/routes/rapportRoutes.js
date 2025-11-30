import express from "express";
import {
  getMonthlyReports,
  getMonthlyReportByMonth,
} from "../controllers/rapportController.js";

const router = express.Router();

router.get("/", getMonthlyReports);
router.get("/:month", getMonthlyReportByMonth);

export default router;

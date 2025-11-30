// routes/produitsRoutes.js
import express from "express";
import {
  getProduits,
  getProduit,
  createProduit,
  updateProduit,
  deleteProduit,
} from "../controllers/produitsController.js";

const router = express.Router();

router.get("/", getProduits);
router.get("/:id", getProduit);
router.post("/", createProduit);
router.put("/:id", updateProduit);
router.delete("/:id", deleteProduit);

export default router;

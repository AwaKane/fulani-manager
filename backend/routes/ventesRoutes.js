// routes/ventesRoutes.js
import express from "express";
import {
  createVente,
  getAllVentes,
  getVenteById,
  updateVente,
  deleteVente,
} from "../controllers/ventesController.js";

const router = express.Router();

router.post("/", createVente);
router.get("/", getAllVentes);
router.get("/:id", getVenteById);
router.put("/:id", updateVente);
router.delete("/:id", deleteVente);

export default router;

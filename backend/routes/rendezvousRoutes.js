import express from "express";
import {
  getRendezvous,
  getRendezvousById,
  createRendezvous,
  updateRendezvous,
  deleteRendezvous,
} from "../controllers/rendezvousController.js";

const router = express.Router();

router.get("/", getRendezvous);
router.get("/:id", getRendezvousById);
router.post("/", createRendezvous);
router.put("/:id", updateRendezvous);
router.delete("/:id", deleteRendezvous);

export default router;

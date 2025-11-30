// backend/routes/clientRoutes.js
import express from "express";
import {
  getClients,
  getClientById,
  addClient,
  updateClient,
  deleteClient,
} from "../controllers/clientController.js";

const router = express.Router();

router.get("/", getClients); // GET /api/clients
router.get("/:id", getClientById); // GET /api/clients/:id
router.post("/", addClient); // POST /api/clients
router.put("/:id", updateClient); // PUT /api/clients/:id
router.delete("/:id", deleteClient); // DELETE /api/clients/:id

export default router;

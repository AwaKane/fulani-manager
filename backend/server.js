import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import clientRoutes from "./routes/clientRoutes.js";
import produitsRoutes from "./routes/produitsRoutes.js";
import soinsRoutes from "./routes/soinsRoutes.js";
import ventesRoutes from "./routes/ventesRoutes.js";
import rapportRoutes from "./routes/rapportRoutes.js";
import rendezvousRoutes from "./routes/rendezvousRoutes.js";

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/clients", clientRoutes);
app.use("/api/produits", produitsRoutes);
app.use("/api/soins", soinsRoutes);
app.use("/api/ventes", ventesRoutes);
app.use("/api/rapports", rapportRoutes);
app.use("/api/rendezvous", rendezvousRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`Serveur backend démarré sur le port ${PORT}`)
);

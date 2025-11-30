import { Routes, Route } from "react-router-dom";
import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Clientes from "./pages/Clientes.jsx";
import NewCliente from "./pages/NewCliente";
import Soins from "./pages/Soins.jsx";
import NewSoin from "./pages/NewSoin.jsx";
import Services from "./pages/Services";
import NewService from "./pages/NewService";
import EditService from "./pages/EditService";
import ClienteDetails from "./pages/ClienteDetails.jsx";
import Produits from "./pages/Produits";
import ProduitForm from "./pages/ProduitForm";
import Ventes from "./pages/Ventes";
import VenteForm from "./pages/NouvelleVente.jsx";
import Reporting from "./pages/Reporting.jsx";
import Prestations from "./pages/Prestations.jsx";
import NouvellePrestation from "./pages/NouvellePrestation.jsx";
import Rendezvous from "./pages/Rendezvous.jsx";
import RendezvousForm from "./pages/RendezvousForm.jsx";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/clientes" element={<Clientes />} />
      <Route path="/clientes/new" element={<NewCliente />} />
      <Route path="/soins" element={<Soins />} />
      <Route path="/soins/new" element={<NewSoin />} />
      <Route path="/services" element={<Services />} />
      <Route path="/services/new" element={<NewService />} />
      <Route path="/services/edit/:id" element={<EditService />} />
      <Route path="/clientes/:id" element={<ClienteDetails />} />
      <Route path="/produits" element={<Produits />} />
      <Route path="/produits/new" element={<ProduitForm />} />
      <Route path="/produits/edit/:id" element={<ProduitForm />} />
      <Route path="/ventes" element={<Ventes />} />
      <Route path="/ventes/new" element={<VenteForm />} />
      <Route path="/reporting" element={<Reporting />} />
      <Route path="/prestations" element={<Prestations />} />
      <Route path="/prestations/new" element={<NouvellePrestation />} />
      <Route path="/rendezvous" element={<Rendezvous />} />
      <Route path="/rendezvous/new" element={<RendezvousForm />} />
      <Route path="/rendezvous/edit/:id" element={<RendezvousForm />} />
    </Routes>
  );
}

export default App;

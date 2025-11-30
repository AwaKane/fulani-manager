import React, { useState, useEffect } from "react";
import supabase from "../supabase/clientdb";
import Header from "../components/Header";
import { useNavigate } from "react-router-dom";

export default function NewSoin() {
  const [clients, setClients] = useState([]);
  const [clientId, setClientId] = useState("");
  const [serviceName, setServiceName] = useState("");
  const [prix, setPrix] = useState("");
  const [praticien, setPraticien] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const fetchClients = async () => {
    const { data, error } = await supabase
      .from("clients")
      .select("id, nom, prenom")
      .order("prenom", { ascending: true });

    if (error) {
      console.log(error);
    } else {
      setClients(data);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!clientId) {
      alert("Veuillez sélectionner une cliente.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.from("soins").insert([
      {
        client_id: clientId,
        service_name: serviceName,
        prix: Number(prix),
        praticien,
        notes,
      },
    ]);

    setLoading(false);

    if (error) {
      alert("Erreur lors de l'enregistrement du soin.");
      console.log(error);
    } else {
      navigate("/soins"); // redirection après enregistrement
    }
  };

  return (
    <>
      <Header />

      <div
        style={{
          maxWidth: "500px",
          margin: "40px auto",
          background: "white",
          padding: "30px",
          borderRadius: "12px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
        }}
      >
        <h2 style={{ color: "var(--brown-dark)", marginBottom: "20px" }}>
          Nouveau soin
        </h2>

        <form onSubmit={handleSubmit}>
          {/* Sélection de la cliente */}
          <label style={labelStyle}>Cliente *</label>
          <select
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            required
            style={inputStyle}
          >
            <option value="">Sélectionnez une cliente</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.prenom} {client.nom}
              </option>
            ))}
          </select>

          {/* Nom du soin */}
          <label style={labelStyle}>Nom du soin *</label>
          <input
            type="text"
            value={serviceName}
            onChange={(e) => setServiceName(e.target.value)}
            required
            placeholder="Ex : Massage relaxant"
            style={inputStyle}
          />

          {/* Prix */}
          <label style={labelStyle}>Prix (FCFA) *</label>
          <input
            type="number"
            value={prix}
            onChange={(e) => setPrix(e.target.value)}
            required
            placeholder="Ex : 15000"
            style={inputStyle}
          />

          {/* Praticien */}
          <label style={labelStyle}>Praticien</label>
          <input
            type="text"
            value={praticien}
            onChange={(e) => setPraticien(e.target.value)}
            placeholder="Nom de la praticienne"
            style={inputStyle}
          />

          {/* Notes */}
          <label style={labelStyle}>Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Informations supplémentaires..."
            style={{ ...inputStyle, height: "90px", resize: "vertical" }}
          ></textarea>

          {/* Bouton Valider */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              marginTop: "15px",
              padding: "12px",
              border: "none",
              backgroundColor: "var(--brown)",
              color: "white",
              borderRadius: "8px",
              fontSize: "16px",
              cursor: "pointer",
            }}
          >
            {loading ? "Enregistrement..." : "Enregistrer le soin"}
          </button>
        </form>
      </div>
    </>
  );
}

const labelStyle = {
  display: "block",
  color: "var(--brown-dark)",
  marginBottom: "6px",
  marginTop: "14px",
};

const inputStyle = {
  width: "100%",
  padding: "10px",
  borderRadius: "8px",
  border: "1px solid #ccc",
  marginBottom: "10px",
  fontSize: "15px",
};

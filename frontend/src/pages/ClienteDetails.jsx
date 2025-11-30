import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import supabase from "../supabase/clientdb";
import Header from "../components/Header";

export default function ClienteDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [cliente, setCliente] = useState(null);
  const [prestations, setPrestations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAll();
  }, [id]);

  const fetchAll = async () => {
    setLoading(true);

    // ===== 1) Infos de la cliente =====
    const { data: clientData, error: errClient } = await supabase
      .from("clients")
      .select("*")
      .eq("id", id)
      .single();

    if (!errClient) setCliente(clientData);

    // ===== 2) Toutes les prestations de la cliente =====
    const { data: prestaData, error: errPresta } = await supabase
      .from("prestations")
      .select("*")
      .eq("client_id", id)
      .order("date", { ascending: false });

    if (errPresta) {
      setPrestations([]);
      setLoading(false);
      return;
    }

    // ===== 3) Récupérer les services de chaque prestation =====
    const prestationsAvecServices = [];

    for (let presta of prestaData) {
      const { data: servicesData } = await supabase
        .from("prestation_services")
        .select(
          `
            id,
            prix,
            quantite,
            service_id,
            services (
              nom,
              description,
              prix
            )
          `
        )
        .eq("prestation_id", presta.id);

      prestationsAvecServices.push({
        ...presta,
        services: servicesData || [],
      });
    }

    setPrestations(prestationsAvecServices);
    setLoading(false);
  };

  if (loading) return <p style={{ padding: 30 }}>Chargement...</p>;
  if (!cliente) return <p style={{ padding: 30 }}>Cliente introuvable.</p>;

  return (
    <>
      <Header />

      <div style={styles.container}>
        <button style={styles.backBtn} onClick={() => navigate(-1)}>
          ← Retour
        </button>

        <h1 style={styles.title}>
          {cliente.nom} {cliente.prenom}
        </h1>

        {/* ------- INFOS CLIENTE ------- */}
        <div style={styles.card}>
          <p>
            <strong>Téléphone :</strong> {cliente.telephone || "—"}
          </p>
          <p>
            <strong>Email :</strong> {cliente.email || "—"}
          </p>
          <p>
            <strong>Adresse :</strong> {cliente.adresse || "—"}
          </p>
          <p>
            <strong>Date de naissance :</strong> {cliente.date_naissance || "—"}
          </p>
          <p>
            <strong>Enceinte :</strong> {cliente.enceinte ? "Oui" : "Non"}
          </p>
          <p>
            <strong>Type de peau :</strong> {cliente.type_peau || "—"}
          </p>
          <p>
            <strong>Allergies :</strong> {cliente.allergies || "—"}
          </p>
          <p>
            <strong>Antécédents :</strong> {cliente.antecedents || "—"}
          </p>
        </div>

        {/* ------- HISTORIQUE ------- */}
        <h2 style={styles.subtitle}>Historique des prestations</h2>

        {prestations.length === 0 ? (
          <p>Aucune prestation enregistrée.</p>
        ) : (
          prestations.map((p) => (
            <div key={p.id} style={styles.prestaCard}>
              <div style={styles.prestaHeader}>
                <p style={styles.prestaDate}>
                  {new Date(p.date).toLocaleDateString("fr-FR")}
                </p>
                <p style={styles.prestaTotal}>{p.total} F CFA</p>
              </div>

              {/* Services */}
              {p.services.length === 0 ? (
                <p>Aucun service lié.</p>
              ) : (
                p.services.map((s) => (
                  <div key={s.id} style={styles.serviceLine}>
                    <p>
                      • {s.services?.nom || "Service supprimé"}
                      {s.quantite > 1 ? ` × ${s.quantite}` : ""}
                    </p>
                    <p>{s.prix} F</p>
                  </div>
                ))
              )}

              {/* Notes */}
              {p.notes && <p style={styles.notes}>📝 {p.notes}</p>}
            </div>
          ))
        )}
      </div>
    </>
  );
}

const styles = {
  container: { padding: "30px" },
  backBtn: {
    marginBottom: "20px",
    padding: "10px 15px",
    background: "#eee",
    borderRadius: "8px",
    cursor: "pointer",
  },
  title: {
    fontSize: "24px",
    color: "var(--brown-dark)",
    marginBottom: "20px",
  },
  card: {
    background: "white",
    padding: "20px",
    borderRadius: "12px",
    boxShadow: "0 3px 10px rgba(0,0,0,0.08)",
    marginBottom: "40px",
    lineHeight: "1.7",
  },
  subtitle: {
    fontSize: "20px",
    marginBottom: "15px",
    color: "var(--brown-dark)",
  },
  prestaCard: {
    background: "white",
    padding: "15px",
    borderRadius: "10px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.07)",
    marginBottom: "20px",
  },
  prestaHeader: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "10px",
  },
  prestaDate: { color: "gray" },
  prestaTotal: { fontWeight: "bold", color: "var(--brown)" },
  serviceLine: {
    display: "flex",
    justifyContent: "space-between",
    padding: "5px 0",
    borderBottom: "1px solid #eee",
  },
  notes: {
    marginTop: "10px",
    fontStyle: "italic",
    color: "gray",
  },
};

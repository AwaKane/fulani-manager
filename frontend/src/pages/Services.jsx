import React, { useEffect, useState } from "react";
import supabase from "../supabase/clientdb";
import Header from "../components/Header";
import { useNavigate } from "react-router-dom";

export default function Services() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    const { data, error } = await supabase.from("services").select("*");
    if (!error) setServices(data);
    setLoading(false);
  };

  const deleteService = async (id) => {
    if (!window.confirm("Supprimer ce service ?")) return;

    const { error } = await supabase.from("services").delete().eq("id", id);
    if (!error) fetchServices();
  };

  return (
    <>
      <Header />

      <div style={{ padding: "30px" }}>
        <h1 style={styles.title}>Services</h1>

        <button
          style={styles.addButton}
          onClick={() => navigate("/services/new")}
        >
          ➕ Ajouter un service
        </button>

        {loading ? (
          <p>Chargement...</p>
        ) : (
          <div style={styles.list}>
            {services.map((s) => (
              <div key={s.id} style={styles.card}>
                <div>
                  <h3>{s.nom}</h3>
                  <p>{s.description}</p>
                  <strong>{s.prix} FCFA</strong>
                </div>

                <div style={styles.actions}>
                  <button
                    style={styles.editBtn}
                    onClick={() => navigate(`/services/edit/${s.id}`)}
                  >
                    ✏️ Modifier
                  </button>

                  <button
                    style={styles.deleteBtn}
                    onClick={() => deleteService(s.id)}
                  >
                    🗑️ Supprimer
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

const styles = {
  title: { color: "var(--brown-dark)", marginBottom: "20px" },
  addButton: {
    padding: "12px 20px",
    background: "var(--brown)",
    color: "white",
    borderRadius: "8px",
    border: "none",
    cursor: "pointer",
    marginBottom: "20px",
  },
  list: {
    display: "flex",
    flexDirection: "column",
    gap: "15px",
  },
  card: {
    padding: "15px",
    background: "white",
    borderRadius: "10px",
    boxShadow: "0 4px 10px rgba(0,0,0,0.08)",
    display: "flex",
    justifyContent: "space-between",
  },
  actions: {
    display: "flex",
    gap: "10px",
  },
  editBtn: {
    background: "#E0A800",
    color: "white",
    padding: "8px 12px",
    borderRadius: "6px",
    border: "none",
    cursor: "pointer",
  },
  deleteBtn: {
    background: "#C0392B",
    color: "white",
    padding: "8px 12px",
    borderRadius: "6px",
    border: "none",
    cursor: "pointer",
  },
};

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import supabase from "../supabase/clientdb";
import Header from "../components/Header";

export default function Clientes() {
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    const { data, error } = await supabase
      .from("clients")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error) setClients(data);
  };

  const filtered = clients.filter((c) => {
    const value = search.toLowerCase();
    return (
      c.nom.toLowerCase().includes(value) ||
      c.prenom.toLowerCase().includes(value) ||
      (c.telephone && c.telephone.includes(value)) ||
      (c.date_naissance && c.date_naissance.includes(value))
    );
  });

  return (
    <>
      <Header />

      <div style={styles.container}>
        <div style={styles.headerRow}>
          <input
            type="text"
            placeholder="Rechercher (nom, téléphone, date)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={styles.search}
          />

          <button
            style={styles.newButton}
            onClick={() => navigate("/clientes/new")}
          >
            + Nouvelle cliente
          </button>
        </div>

        {/* LISTE DES CLIENTES */}
        <div style={styles.list}>
          {filtered.length === 0 ? (
            <p>Aucune cliente trouvée.</p>
          ) : (
            filtered.map((c) => (
              <div
                key={c.id}
                style={styles.clientCard}
                onClick={() => navigate(`/clientes/${c.id}`)}
              >
                <h3 style={styles.name}>
                  {c.nom} {c.prenom}
                </h3>

                <p style={styles.sub}>📞 {c.telephone || "—"}</p>

                <p style={styles.sub}>🎂 {c.date_naissance || "—"}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}

const styles = {
  container: { padding: "30px" },
  headerRow: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "20px",
  },
  search: {
    width: "60%",
    padding: "12px",
    border: "1px solid #ccc",
    borderRadius: "8px",
  },
  newButton: {
    padding: "12px 20px",
    background: "var(--brown)",
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontWeight: "bold",
    cursor: "pointer",
  },
  list: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
    gap: "15px",
  },
  clientCard: {
    background: "white",
    padding: "20px",
    borderRadius: "12px",
    boxShadow: "0 3px 10px rgba(0,0,0,0.08)",
    cursor: "pointer",
    transition: "0.2s",
  },
  name: {
    margin: 0,
    color: "var(--brown-dark)",
  },
  sub: {
    margin: "5px 0",
    fontSize: "14px",
    color: "gray",
  },
};

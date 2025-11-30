import React, { useEffect, useState } from "react";
import supabase from "../supabase/clientdb";
import Header from "../components/Header";
import { useNavigate } from "react-router-dom";

export default function Rendezvous() {
  const navigate = useNavigate();
  const [rendezvous, setRendezvous] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState("a_venir"); // a_venir, passes, tous

  // Charger les rendez-vous
  const fetchRendezvous = async () => {
    const { data, error } = await supabase
      .from("rendezvous")
      .select("*")
      .order("date_rdv", { ascending: true })
      .order("heure", { ascending: true });

    if (!error && data) {
      setRendezvous(data);
      applyFilter(data, dateFilter);
    } else {
      console.error("Erreur chargement RDV:", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchRendezvous();
  }, []);

  // Filtrer par date
  const applyFilter = (data, filter) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let results = [...data];

    if (filter === "a_venir") {
      results = results.filter((rdv) => new Date(rdv.date_rdv) >= today);
    } else if (filter === "passes") {
      results = results.filter((rdv) => new Date(rdv.date_rdv) < today);
    }

    setFiltered(results);
  };

  useEffect(() => {
    applyFilter(rendezvous, dateFilter);
  }, [dateFilter, rendezvous]);

  // Supprimer un rendez-vous
  const handleDelete = async (rdv) => {
    if (
      !window.confirm(
        `Voulez-vous vraiment supprimer le rendez-vous de ${
          rdv.nom_client
        } le ${new Date(rdv.date_rdv).toLocaleDateString("fr-FR")} ?`
      )
    )
      return;

    const { error } = await supabase
      .from("rendezvous")
      .delete()
      .eq("id", rdv.id);

    if (!error) {
      alert("Rendez-vous supprimé !");
      fetchRendezvous();
    } else {
      alert("Erreur : " + error.message);
    }
  };

  // Grouper par date
  const rdvGroupesParDate = filtered.reduce((acc, rdv) => {
    const dateKey = rdv.date_rdv;
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(rdv);
    return acc;
  }, {});

  return (
    <>
      <Header />

      <div style={{ padding: "30px" }}>
        <div style={styles.topBar}>
          <h1 style={styles.title}>📅 Rendez-vous</h1>

          <button
            style={styles.newBtn}
            onClick={() => navigate("/rendezvous/new")}
          >
            + Nouveau RDV
          </button>
        </div>

        {/* Filtres */}
        <div style={styles.filterBar}>
          <button
            style={{
              ...styles.filterBtn,
              ...(dateFilter === "a_venir" && styles.filterBtnActive),
            }}
            onClick={() => setDateFilter("a_venir")}
          >
            🔜 À venir (
            {
              rendezvous.filter((r) => new Date(r.date_rdv) >= new Date())
                .length
            }
            )
          </button>
          <button
            style={{
              ...styles.filterBtn,
              ...(dateFilter === "passes" && styles.filterBtnActive),
            }}
            onClick={() => setDateFilter("passes")}
          >
            ✅ Passés (
            {rendezvous.filter((r) => new Date(r.date_rdv) < new Date()).length}
            )
          </button>
          <button
            style={{
              ...styles.filterBtn,
              ...(dateFilter === "tous" && styles.filterBtnActive),
            }}
            onClick={() => setDateFilter("tous")}
          >
            📋 Tous ({rendezvous.length})
          </button>
        </div>

        {/* Liste des RDV groupés par date */}
        {loading ? (
          <p>Chargement...</p>
        ) : filtered.length === 0 ? (
          <p style={styles.noData}>Aucun rendez-vous trouvé.</p>
        ) : (
          <div style={styles.rdvByDate}>
            {Object.keys(rdvGroupesParDate)
              .sort((a, b) => new Date(a) - new Date(b))
              .map((dateKey) => {
                const date = new Date(dateKey);
                const isToday =
                  date.toDateString() === new Date().toDateString();
                const isPast = date < new Date().setHours(0, 0, 0, 0);

                return (
                  <div key={dateKey} style={styles.dateGroup}>
                    {/* En-tête de date */}
                    <div
                      style={{
                        ...styles.dateHeader,
                        ...(isToday && styles.dateHeaderToday),
                      }}
                    >
                      <span style={styles.dateText}>
                        {isToday && "🔥 AUJOURD'HUI - "}
                        {date.toLocaleDateString("fr-FR", {
                          weekday: "long",
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </span>
                      <span style={styles.dateCount}>
                        {rdvGroupesParDate[dateKey].length} RDV
                      </span>
                    </div>

                    {/* Liste des RDV de cette date */}
                    <div style={styles.rdvCards}>
                      {rdvGroupesParDate[dateKey].map((rdv) => (
                        <div
                          key={rdv.id}
                          style={{
                            ...styles.rdvCard,
                            ...(isPast && styles.rdvCardPast),
                          }}
                        >
                          {/* Heure */}
                          <div style={styles.rdvTime}>
                            <div style={styles.rdvTimeIcon}>🕐</div>
                            <div style={styles.rdvTimeText}>
                              {rdv.heure.substring(0, 5)}
                            </div>
                          </div>

                          {/* Infos */}
                          <div style={styles.rdvInfo}>
                            <div style={styles.rdvClient}>
                              👤 {rdv.nom_client}
                              {rdv.nombre_personnes > 1 && (
                                <span style={styles.rdvPersonnes}>
                                  {" "}
                                  +{rdv.nombre_personnes - 1}
                                </span>
                              )}
                            </div>
                            <div style={styles.rdvPhone}>
                              📞 {rdv.numero_client}
                            </div>
                            <div style={styles.rdvSoins}>
                              💅 {rdv.soins?.join(", ") || "Aucun soin précisé"}
                            </div>
                            {rdv.acompte > 0 && (
                              <div style={styles.rdvAcompte}>
                                💰 Acompte : {rdv.acompte.toLocaleString()} FCFA
                              </div>
                            )}
                          </div>

                          {/* Actions */}
                          <div style={styles.rdvActions}>
                            <button
                              style={styles.editBtn}
                              onClick={() =>
                                navigate(`/rendezvous/edit/${rdv.id}`)
                              }
                            >
                              ✏️
                            </button>
                            <button
                              style={styles.deleteBtn}
                              onClick={() => handleDelete(rdv)}
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </div>
    </>
  );
}

const styles = {
  title: {
    color: "var(--brown-dark)",
    marginBottom: 0,
  },
  topBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "30px",
  },
  newBtn: {
    backgroundColor: "var(--brown)",
    color: "white",
    padding: "12px 20px",
    borderRadius: "8px",
    border: "none",
    cursor: "pointer",
    fontSize: "15px",
    fontWeight: "bold",
  },
  filterBar: {
    display: "flex",
    gap: "10px",
    marginBottom: "30px",
  },
  filterBtn: {
    padding: "10px 20px",
    borderRadius: "8px",
    border: "1px solid #ddd",
    backgroundColor: "white",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "600",
    transition: "all 0.2s",
  },
  filterBtnActive: {
    backgroundColor: "var(--gold)",
    color: "var(--brown-dark)",
    border: "1px solid var(--gold)",
  },
  rdvByDate: {
    display: "flex",
    flexDirection: "column",
    gap: "30px",
  },
  dateGroup: {
    backgroundColor: "white",
    borderRadius: "12px",
    overflow: "hidden",
    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
  },
  dateHeader: {
    padding: "20px",
    backgroundColor: "#f9f9f9",
    borderBottom: "2px solid #eee",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dateHeaderToday: {
    backgroundColor: "#fff3e0",
    borderBottom: "2px solid #ff9800",
  },
  dateText: {
    fontSize: "18px",
    fontWeight: "700",
    color: "var(--brown-dark)",
    textTransform: "capitalize",
  },
  dateCount: {
    padding: "6px 12px",
    backgroundColor: "var(--gold)",
    color: "var(--brown-dark)",
    borderRadius: "12px",
    fontSize: "13px",
    fontWeight: "700",
  },
  rdvCards: {
    padding: "15px",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  rdvCard: {
    display: "flex",
    gap: "20px",
    padding: "20px",
    backgroundColor: "#f9f9f9",
    borderRadius: "12px",
    border: "2px solid #e0e0e0",
    transition: "all 0.2s",
  },
  rdvCardPast: {
    opacity: 0.6,
  },
  rdvTime: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minWidth: "80px",
    padding: "15px",
    backgroundColor: "var(--gold)",
    borderRadius: "12px",
  },
  rdvTimeIcon: {
    fontSize: "28px",
    marginBottom: "5px",
  },
  rdvTimeText: {
    fontSize: "20px",
    fontWeight: "bold",
    color: "var(--brown-dark)",
  },
  rdvInfo: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  rdvClient: {
    fontSize: "18px",
    fontWeight: "700",
    color: "var(--brown-dark)",
  },
  rdvPersonnes: {
    fontSize: "14px",
    padding: "2px 8px",
    backgroundColor: "#e3f2fd",
    borderRadius: "12px",
    fontWeight: "600",
    color: "#1976d2",
  },
  rdvPhone: {
    fontSize: "15px",
    color: "#666",
  },
  rdvSoins: {
    fontSize: "15px",
    color: "#ec4899",
    fontWeight: "600",
  },
  rdvAcompte: {
    fontSize: "14px",
    color: "#4caf50",
    fontWeight: "600",
  },
  rdvActions: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    justifyContent: "center",
  },
  editBtn: {
    padding: "10px",
    backgroundColor: "#e3f2fd",
    color: "#1976d2",
    border: "none",
    borderRadius: "8px",
    fontSize: "18px",
    cursor: "pointer",
    fontWeight: "600",
  },
  deleteBtn: {
    padding: "10px",
    backgroundColor: "#ffebee",
    color: "#c62828",
    border: "none",
    borderRadius: "8px",
    fontSize: "18px",
    cursor: "pointer",
    fontWeight: "600",
  },
  noData: {
    textAlign: "center",
    color: "#999",
    padding: "40px",
    fontSize: "16px",
  },
};

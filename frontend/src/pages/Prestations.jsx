import React, { useEffect, useState } from "react";
import supabase from "../supabase/clientdb";
import Header from "../components/Header";
import { useNavigate } from "react-router-dom";

export default function Prestations() {
  const navigate = useNavigate();
  const [prestations, setPrestations] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState("tous");

  // Charger les prestations avec leurs services
  const fetchPrestations = async () => {
    const { data, error } = await supabase
      .from("prestations")
      .select(
        `
        *,
        clients (nom, prenom, telephone)
      `
      )
      .order("date", { ascending: false });

    if (!error && data) {
      // Charger les services pour chaque prestation
      const prestationsAvecServices = await Promise.all(
        data.map(async (prestation) => {
          const { data: services } = await supabase
            .from("prestation_services")
            .select(
              `
              *,
              services (nom, prix)
            `
            )
            .eq("prestation_id", prestation.id);

          return {
            ...prestation,
            services: services || [],
          };
        })
      );

      setPrestations(prestationsAvecServices);
      setFiltered(prestationsAvecServices);
    } else {
      console.error("Erreur chargement prestations:", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPrestations();
  }, []);

  // Filtrer par date
  useEffect(() => {
    let results = [...prestations];
    const now = new Date();

    if (dateFilter === "aujourd'hui") {
      results = results.filter((p) => {
        const pDate = new Date(p.date);
        return pDate.toDateString() === now.toDateString();
      });
    } else if (dateFilter === "semaine") {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      results = results.filter((p) => new Date(p.date) >= weekAgo);
    } else if (dateFilter === "mois") {
      results = results.filter((p) => {
        const pDate = new Date(p.date);
        return (
          pDate.getMonth() === now.getMonth() &&
          pDate.getFullYear() === now.getFullYear()
        );
      });
    }

    setFiltered(results);
  }, [dateFilter, prestations]);

  // Supprimer une prestation
  const handleDelete = async (prestation) => {
    if (
      !window.confirm(
        `Voulez-vous vraiment supprimer cette prestation de ${prestation.total.toLocaleString()} FCFA ?`
      )
    )
      return;

    const { error } = await supabase
      .from("prestations")
      .delete()
      .eq("id", prestation.id);

    if (!error) {
      alert("Prestation supprimée avec succès !");
      fetchPrestations();
    } else {
      alert("Erreur : " + error.message);
    }
  };

  return (
    <>
      <Header />

      <div style={{ padding: "30px" }}>
        <div style={styles.topBar}>
          <h1 style={styles.title}>💅 Prestations & Soins</h1>

          <button
            style={styles.newBtn}
            onClick={() => navigate("/prestations/new")}
          >
            + Nouvelle prestation
          </button>
        </div>

        {/* Filtre période */}
        <div style={styles.filterBar}>
          <label style={styles.filterLabel}>Période :</label>
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            style={styles.filterSelect}
          >
            <option value="tous">Toutes</option>
            <option value="aujourd'hui">Aujourd'hui</option>
            <option value="semaine">Cette semaine</option>
            <option value="mois">Ce mois</option>
          </select>
        </div>

        {/* Liste des prestations */}
        {loading ? (
          <p>Chargement...</p>
        ) : filtered.length === 0 ? (
          <p style={styles.noData}>Aucune prestation trouvée.</p>
        ) : (
          <div style={styles.prestationsList}>
            {filtered.map((prestation) => {
              // Nom de la cliente
              const clientInfo = prestation.clients
                ? `${prestation.clients.nom} ${prestation.clients.prenom}`
                : "Cliente non enregistrée";

              const telephone = prestation.clients?.telephone;

              return (
                <div key={prestation.id} style={styles.prestationCard}>
                  {/* En-tête : Date, Client, Total */}
                  <div style={styles.prestationHeader}>
                    <div style={styles.prestationInfo}>
                      <span style={styles.prestationDate}>
                        📅{" "}
                        {new Date(prestation.date).toLocaleDateString("fr-FR", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      <span style={styles.prestationClient}>
                        👤 {clientInfo}
                      </span>
                      {telephone && (
                        <span style={styles.prestationPhone}>
                          📞 {telephone}
                        </span>
                      )}
                    </div>

                    <div style={styles.prestationTotal}>
                      <div style={styles.totalLabel}>Total</div>
                      <div style={styles.totalAmount}>
                        {prestation.total.toLocaleString()} FCFA
                      </div>
                    </div>
                  </div>

                  {/* Corps : Tableau des services */}
                  <div style={styles.prestationBody}>
                    {prestation.services.length === 0 ? (
                      <p style={styles.noServices}>Aucun service enregistré</p>
                    ) : (
                      <table style={styles.servicesTable}>
                        <thead>
                          <tr>
                            <th style={styles.th}>Service/Soin</th>
                            <th style={{ ...styles.th, textAlign: "center" }}>
                              Prix
                            </th>
                            <th style={{ ...styles.th, textAlign: "center" }}>
                              Qté
                            </th>
                            <th style={{ ...styles.th, textAlign: "right" }}>
                              Sous-total
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {prestation.services.map((ps) => {
                            const serviceNom =
                              ps.services?.nom || "Service supprimé";
                            const prix = parseFloat(ps.prix || 0);
                            const quantite = ps.quantite || 1;
                            const sousTotal = prix * quantite;

                            return (
                              <tr key={ps.id} style={styles.tr}>
                                <td style={styles.td}>
                                  <span style={styles.serviceNom}>
                                    💆 {serviceNom}
                                  </span>
                                </td>
                                <td
                                  style={{ ...styles.td, textAlign: "center" }}
                                >
                                  {prix.toLocaleString()} FCFA
                                </td>
                                <td
                                  style={{ ...styles.td, textAlign: "center" }}
                                >
                                  <span style={styles.quantiteBadge}>
                                    ×{quantite}
                                  </span>
                                </td>
                                <td
                                  style={{
                                    ...styles.td,
                                    textAlign: "right",
                                    fontWeight: "600",
                                    color: "var(--brown)",
                                  }}
                                >
                                  {sousTotal.toLocaleString()} FCFA
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    )}

                    {/* Notes */}
                    {prestation.notes && (
                      <div style={styles.notes}>
                        💬 <strong>Notes :</strong> {prestation.notes}
                      </div>
                    )}
                  </div>

                  {/* Footer : Bouton supprimer */}
                  <div style={styles.prestationFooter}>
                    <button
                      style={styles.deleteBtn}
                      onClick={() => handleDelete(prestation)}
                    >
                      🗑️ Supprimer cette prestation
                    </button>
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
    marginBottom: "25px",
  },
  filterLabel: {
    marginRight: "10px",
    color: "var(--brown-dark)",
    fontWeight: "600",
  },
  filterSelect: {
    padding: "8px 12px",
    borderRadius: "8px",
    border: "1px solid #ddd",
    fontSize: "14px",
  },
  prestationsList: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  prestationCard: {
    backgroundColor: "white",
    borderRadius: "12px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
    overflow: "hidden",
    border: "1px solid #f0f0f0",
  },
  prestationHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: "20px",
    backgroundColor: "#fafafa",
    borderBottom: "2px solid #eee",
  },
  prestationInfo: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    flex: 1,
  },
  prestationDate: {
    fontSize: "14px",
    color: "#666",
    fontWeight: "500",
  },
  prestationClient: {
    fontSize: "18px",
    fontWeight: "700",
    color: "var(--brown-dark)",
  },
  prestationPhone: {
    fontSize: "14px",
    color: "#666",
  },
  prestationTotal: {
    textAlign: "right",
  },
  totalLabel: {
    fontSize: "12px",
    color: "#999",
    marginBottom: "4px",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  totalAmount: {
    fontSize: "28px",
    fontWeight: "bold",
    color: "#ec4899",
  },
  prestationBody: {
    padding: "0",
  },
  servicesTable: {
    width: "100%",
    borderCollapse: "collapse",
  },
  th: {
    padding: "12px 20px",
    textAlign: "left",
    fontSize: "13px",
    fontWeight: "600",
    color: "#666",
    backgroundColor: "#f9f9f9",
    borderBottom: "2px solid #eee",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  tr: {
    borderBottom: "1px solid #f0f0f0",
  },
  td: {
    padding: "15px 20px",
    fontSize: "15px",
  },
  serviceNom: {
    fontWeight: "600",
    color: "var(--brown-dark)",
  },
  quantiteBadge: {
    padding: "4px 12px",
    backgroundColor: "#f5f5f5",
    borderRadius: "12px",
    fontWeight: "700",
    color: "#ec4899",
  },
  noServices: {
    textAlign: "center",
    color: "#999",
    padding: "30px",
    fontSize: "14px",
  },
  notes: {
    margin: "15px 20px",
    padding: "12px 15px",
    backgroundColor: "#fff3cd",
    borderRadius: "8px",
    fontSize: "14px",
    color: "#856404",
    borderLeft: "4px solid #ffc107",
  },
  prestationFooter: {
    padding: "15px 20px",
    backgroundColor: "#fafafa",
    borderTop: "1px solid #eee",
    display: "flex",
    justifyContent: "flex-end",
  },
  deleteBtn: {
    padding: "10px 20px",
    backgroundColor: "#ffebee",
    color: "#c62828",
    border: "none",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
  },
  noData: {
    textAlign: "center",
    color: "#999",
    padding: "40px",
    fontSize: "16px",
  },
};

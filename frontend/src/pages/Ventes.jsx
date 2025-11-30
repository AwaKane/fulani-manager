import React, { useEffect, useState } from "react";
import supabase from "../supabase/clientdb";
import Header from "../components/Header";
import { useNavigate } from "react-router-dom";

export default function Ventes() {
  const navigate = useNavigate();
  const [ventesGroupees, setVentesGroupees] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState("tous");

  // Charger et regrouper les ventes par date/client
  const fetchVentes = async () => {
    const { data, error } = await supabase
      .from("ventes")
      .select(
        `
        *,
        clients (nom, prenom, telephone),
        produits (nom, prix)
      `
      )
      .order("date", { ascending: false });

    if (!error && data) {
      // Grouper les ventes par transaction (même date + même client + même remarque)
      const grouped = groupVentesByTransaction(data);
      setVentesGroupees(grouped);
      setFiltered(grouped);
    } else {
      console.error("Erreur chargement ventes:", error);
    }
    setLoading(false);
  };

  // Regrouper les ventes qui font partie de la même transaction
  const groupVentesByTransaction = (ventes) => {
    const grouped = [];
    const processed = new Set();

    ventes.forEach((vente) => {
      if (processed.has(vente.id)) return;

      // Chercher toutes les ventes liées (même date, même client, dans un intervalle de 1 minute)
      const venteDate = new Date(vente.date).getTime();
      const relatedVentes = ventes.filter((v) => {
        const vDate = new Date(v.date).getTime();
        const timeDiff = Math.abs(vDate - venteDate);
        const sameClient =
          (v.client_id && v.client_id === vente.client_id) ||
          (v.client_nom && v.client_nom === vente.client_nom);
        return sameClient && timeDiff < 60000 && !processed.has(v.id); // 1 minute
      });

      // Marquer comme traité
      relatedVentes.forEach((v) => processed.add(v.id));

      // Créer l'objet transaction groupé
      const transaction = {
        id: vente.id, // ID de la première vente
        date: vente.date,
        client_id: vente.client_id,
        client_nom: vente.client_nom,
        client_telephone: vente.client_telephone,
        clients: vente.clients,
        prestation_id: vente.prestation_id,
        remarque: vente.remarque,
        lignes: relatedVentes.map((v) => ({
          id: v.id,
          produit_nom: v.produits?.nom || "Produit supprimé",
          produit_id: v.produit_id,
          quantite: v.quantite,
          prix_unitaire: v.produits?.prix || 0,
          montant: v.montant,
        })),
        montant_total: relatedVentes.reduce(
          (sum, v) => sum + parseFloat(v.montant),
          0
        ),
        vente_ids: relatedVentes.map((v) => v.id), // Pour la suppression
      };

      grouped.push(transaction);
    });

    return grouped;
  };

  useEffect(() => {
    fetchVentes();
  }, []);

  // Filtrer par date
  useEffect(() => {
    let results = [...ventesGroupees];
    const now = new Date();

    if (dateFilter === "aujourd'hui") {
      results = results.filter((v) => {
        const vDate = new Date(v.date);
        return vDate.toDateString() === now.toDateString();
      });
    } else if (dateFilter === "semaine") {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      results = results.filter((v) => new Date(v.date) >= weekAgo);
    } else if (dateFilter === "mois") {
      results = results.filter((v) => {
        const vDate = new Date(v.date);
        return (
          vDate.getMonth() === now.getMonth() &&
          vDate.getFullYear() === now.getFullYear()
        );
      });
    }

    setFiltered(results);
  }, [dateFilter, ventesGroupees]);

  // Supprimer une transaction complète
  const handleDelete = async (transaction) => {
    if (
      !window.confirm(
        `Voulez-vous vraiment supprimer cette vente de ${transaction.montant_total.toLocaleString()} FCFA ?\n(${
          transaction.lignes.length
        } produit(s) seront remis en stock)`
      )
    )
      return;

    try {
      // Remettre chaque produit en stock
      for (const ligne of transaction.lignes) {
        if (ligne.produit_id) {
          const { data: produit } = await supabase
            .from("produits")
            .select("quantite")
            .eq("id", ligne.produit_id)
            .single();

          if (produit) {
            await supabase
              .from("produits")
              .update({ quantite: produit.quantite + ligne.quantite })
              .eq("id", ligne.produit_id);
          }
        }
      }

      // Supprimer toutes les ventes de cette transaction
      const { error } = await supabase
        .from("ventes")
        .delete()
        .in("id", transaction.vente_ids);

      if (!error) {
        alert("Vente supprimée avec succès !");
        fetchVentes();
      } else {
        alert("Erreur : " + error.message);
      }
    } catch (error) {
      alert("Erreur lors de la suppression : " + error.message);
    }
  };

  return (
    <>
      <Header />

      <div style={{ padding: "30px" }}>
        <div style={styles.topBar}>
          <h1 style={styles.title}>💰 Historique des ventes</h1>

          <button style={styles.newBtn} onClick={() => navigate("/ventes/new")}>
            + Nouvelle vente
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

        {/* Liste des ventes */}
        {loading ? (
          <p>Chargement...</p>
        ) : filtered.length === 0 ? (
          <p style={styles.noData}>Aucune vente trouvée.</p>
        ) : (
          <div style={styles.ventesList}>
            {filtered.map((transaction) => {
              // Nom de la cliente
              const clientInfo = transaction.clients
                ? `${transaction.clients.nom} ${transaction.clients.prenom}`
                : transaction.client_nom || "Cliente non enregistrée";

              const telephone =
                transaction.clients?.telephone || transaction.client_telephone;

              return (
                <div key={transaction.id} style={styles.venteCard}>
                  {/* En-tête : Date, Client, Total */}
                  <div style={styles.venteHeader}>
                    <div style={styles.venteInfo}>
                      <div style={styles.venteDateRow}>
                        <span style={styles.venteDate}>
                          📅{" "}
                          {new Date(transaction.date).toLocaleDateString(
                            "fr-FR",
                            {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            }
                          )}
                        </span>
                        {transaction.prestation_id && (
                          <span style={styles.prestationBadge}>
                            📋 Avec prestation
                          </span>
                        )}
                      </div>
                      <span style={styles.venteClient}>👤 {clientInfo}</span>
                      {telephone && (
                        <span style={styles.ventePhone}>📞 {telephone}</span>
                      )}
                    </div>

                    <div style={styles.venteTotal}>
                      <div style={styles.totalLabel}>Total</div>
                      <div style={styles.totalAmount}>
                        {transaction.montant_total.toLocaleString()} FCFA
                      </div>
                    </div>
                  </div>

                  {/* Corps : Tableau des produits */}
                  <div style={styles.venteBody}>
                    <table style={styles.produitsTable}>
                      <thead>
                        <tr>
                          <th style={styles.th}>Produit</th>
                          <th style={{ ...styles.th, textAlign: "center" }}>
                            Prix unit.
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
                        {transaction.lignes.map((ligne, index) => (
                          <tr key={ligne.id} style={styles.tr}>
                            <td style={styles.td}>
                              <span style={styles.produitNom}>
                                🧴 {ligne.produit_nom}
                              </span>
                            </td>
                            <td style={{ ...styles.td, textAlign: "center" }}>
                              {ligne.prix_unitaire.toLocaleString()} FCFA
                            </td>
                            <td style={{ ...styles.td, textAlign: "center" }}>
                              <span style={styles.quantiteBadge}>
                                ×{ligne.quantite}
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
                              {ligne.montant.toLocaleString()} FCFA
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {/* Remarque */}
                    {transaction.remarque && (
                      <div style={styles.remarque}>
                        💬 <strong>Remarque :</strong> {transaction.remarque}
                      </div>
                    )}
                  </div>

                  {/* Footer : Bouton supprimer */}
                  <div style={styles.venteFooter}>
                    <button
                      style={styles.deleteBtn}
                      onClick={() => handleDelete(transaction)}
                    >
                      🗑️ Supprimer cette vente
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
  ventesList: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  venteCard: {
    backgroundColor: "white",
    borderRadius: "12px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
    overflow: "hidden",
    border: "1px solid #f0f0f0",
  },
  venteHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: "20px",
    backgroundColor: "#fafafa",
    borderBottom: "2px solid #eee",
  },
  venteInfo: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    flex: 1,
  },
  venteDateRow: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  venteDate: {
    fontSize: "14px",
    color: "#666",
    fontWeight: "500",
  },
  prestationBadge: {
    padding: "4px 10px",
    backgroundColor: "#e3f2fd",
    color: "#1976d2",
    borderRadius: "12px",
    fontSize: "12px",
    fontWeight: "600",
  },
  venteClient: {
    fontSize: "18px",
    fontWeight: "700",
    color: "var(--brown-dark)",
  },
  ventePhone: {
    fontSize: "14px",
    color: "#666",
  },
  venteTotal: {
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
    color: "var(--brown)",
  },
  venteBody: {
    padding: "0",
  },
  produitsTable: {
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
    transition: "background-color 0.2s",
  },
  td: {
    padding: "15px 20px",
    fontSize: "15px",
  },
  produitNom: {
    fontWeight: "600",
    color: "var(--brown-dark)",
  },
  quantiteBadge: {
    padding: "4px 12px",
    backgroundColor: "#f5f5f5",
    borderRadius: "12px",
    fontWeight: "700",
    color: "var(--brown)",
  },
  remarque: {
    margin: "15px 20px",
    padding: "12px 15px",
    backgroundColor: "#fff3cd",
    borderRadius: "8px",
    fontSize: "14px",
    color: "#856404",
    borderLeft: "4px solid #ffc107",
  },
  venteFooter: {
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
    transition: "all 0.2s",
  },
  noData: {
    textAlign: "center",
    color: "#999",
    padding: "40px",
    fontSize: "16px",
  },
};

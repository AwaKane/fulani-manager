import React, { useEffect, useState } from "react";
import supabase from "../supabase/clientdb";
import Header from "../components/Header";
import { useNavigate } from "react-router-dom";

export default function Produits() {
  const navigate = useNavigate();
  const [produits, setProduits] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("tous"); // tous, alerte, disponible

  // Charger les produits
  const fetchProduits = async () => {
    const { data, error } = await supabase
      .from("produits")
      .select("*")
      .order("nom", { ascending: true });

    if (!error) {
      setProduits(data);
      setFiltered(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchProduits();
  }, []);

  // Recherche et filtre
  useEffect(() => {
    let results = [...produits];

    // Filtrer par recherche
    if (search) {
      const s = search.toLowerCase();
      results = results.filter((p) => {
        return (
          p.nom.toLowerCase().includes(s) ||
          (p.sku && p.sku.toLowerCase().includes(s)) ||
          (p.description && p.description.toLowerCase().includes(s))
        );
      });
    }

    // Filtrer par statut stock
    if (filter === "alerte") {
      results = results.filter((p) => p.quantite <= p.seuil_alerte);
    } else if (filter === "disponible") {
      results = results.filter((p) => p.quantite > p.seuil_alerte);
    }

    setFiltered(results);
  }, [search, filter, produits]);

  // Supprimer un produit
  const handleDelete = async (id, nom) => {
    if (!window.confirm(`Voulez-vous vraiment supprimer "${nom}" ?`)) return;

    const { error } = await supabase.from("produits").delete().eq("id", id);

    if (!error) {
      alert("Produit supprimé avec succès !");
      fetchProduits();
    } else {
      alert("Erreur lors de la suppression : " + error.message);
    }
  };

  // Compter produits en alerte
  const alertCount = produits.filter(
    (p) => p.quantite <= p.seuil_alerte
  ).length;

  return (
    <>
      <Header />

      <div style={{ padding: "30px" }}>
        <div style={styles.topBar}>
          <h1 style={styles.title}>
            Produits{" "}
            {alertCount > 0 && (
              <span style={styles.alertBadge}>⚠️ {alertCount} en alerte</span>
            )}
          </h1>

          <button
            style={styles.newBtn}
            onClick={() => navigate("/produits/new")}
          >
            + Nouveau produit
          </button>
        </div>

        {/* Barre de recherche et filtres */}
        <div style={styles.filterBar}>
          <input
            type="text"
            placeholder="Rechercher par nom, SKU, description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={styles.search}
          />

          <div style={styles.filterButtons}>
            <button
              style={{
                ...styles.filterBtn,
                ...(filter === "tous" && styles.filterBtnActive),
              }}
              onClick={() => setFilter("tous")}
            >
              Tous ({produits.length})
            </button>
            <button
              style={{
                ...styles.filterBtn,
                ...(filter === "alerte" && styles.filterBtnActive),
              }}
              onClick={() => setFilter("alerte")}
            >
              ⚠️ En alerte ({alertCount})
            </button>
            <button
              style={{
                ...styles.filterBtn,
                ...(filter === "disponible" && styles.filterBtnActive),
              }}
              onClick={() => setFilter("disponible")}
            >
              ✅ Disponibles ({produits.length - alertCount})
            </button>
          </div>
        </div>

        {loading ? (
          <p>Chargement...</p>
        ) : filtered.length === 0 ? (
          <p style={styles.noData}>Aucun produit trouvé.</p>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                <th>Nom</th>
                <th>SKU</th>
                <th>Prix</th>
                <th>Stock</th>
                <th>Seuil alerte</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filtered.map((p) => {
                const isLowStock = p.quantite <= p.seuil_alerte;
                return (
                  <tr key={p.id} style={isLowStock ? styles.alertRow : {}}>
                    <td style={styles.tdBold}>{p.nom}</td>
                    <td>{p.sku || "-"}</td>
                    <td>{p.prix.toLocaleString()} FCFA</td>
                    <td style={styles.tdCenter}>
                      <span
                        style={{
                          ...styles.badge,
                          backgroundColor: isLowStock ? "#fee" : "#efe",
                          color: isLowStock ? "#c33" : "#363",
                        }}
                      >
                        {p.quantite}
                      </span>
                    </td>
                    <td style={styles.tdCenter}>{p.seuil_alerte}</td>
                    <td style={styles.tdCenter}>
                      {isLowStock ? (
                        <span style={styles.statusAlert}>⚠️ Stock faible</span>
                      ) : (
                        <span style={styles.statusOk}>✅ Disponible</span>
                      )}
                    </td>
                    <td>
                      <div style={styles.actions}>
                        <button
                          style={styles.editBtn}
                          onClick={() => navigate(`/produits/edit/${p.id}`)}
                        >
                          ✏️
                        </button>
                        <button
                          style={styles.deleteBtn}
                          onClick={() => handleDelete(p.id, p.nom)}
                        >
                          🗑️
                        </button>
                        <button
                          style={styles.sellBtn}
                          onClick={() =>
                            navigate(`/ventes/new?produit_id=${p.id}`)
                          }
                        >
                          💰 Vendre
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}

const styles = {
  title: {
    color: "var(--brown-dark)",
    marginBottom: 0,
    display: "flex",
    alignItems: "center",
    gap: "15px",
  },
  alertBadge: {
    backgroundColor: "#fee",
    color: "#c33",
    padding: "5px 12px",
    borderRadius: "20px",
    fontSize: "14px",
    fontWeight: "600",
  },
  topBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
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
  search: {
    width: "100%",
    padding: "12px",
    borderRadius: "10px",
    border: "1px solid #ccc",
    marginBottom: "15px",
    fontSize: "15px",
  },
  filterButtons: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
  },
  filterBtn: {
    padding: "8px 16px",
    borderRadius: "8px",
    border: "1px solid #ddd",
    backgroundColor: "white",
    cursor: "pointer",
    fontSize: "14px",
    transition: "all 0.2s",
  },
  filterBtnActive: {
    backgroundColor: "var(--gold)",
    color: "var(--brown-dark)",
    border: "1px solid var(--gold)",
    fontWeight: "bold",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    backgroundColor: "var(--white)",
    borderRadius: "12px",
    overflow: "hidden",
    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
  },
  alertRow: {
    backgroundColor: "#fff5f5",
  },
  tdBold: {
    fontWeight: "600",
    color: "var(--brown-dark)",
  },
  tdCenter: {
    textAlign: "center",
  },
  badge: {
    padding: "4px 12px",
    borderRadius: "12px",
    fontSize: "14px",
    fontWeight: "600",
  },
  statusAlert: {
    color: "#c33",
    fontSize: "13px",
    fontWeight: "600",
  },
  statusOk: {
    color: "#363",
    fontSize: "13px",
    fontWeight: "600",
  },
  actions: {
    display: "flex",
    gap: "8px",
    justifyContent: "center",
  },
  editBtn: {
    padding: "6px 12px",
    borderRadius: "6px",
    border: "none",
    backgroundColor: "#e3f2fd",
    cursor: "pointer",
    fontSize: "14px",
  },
  deleteBtn: {
    padding: "6px 12px",
    borderRadius: "6px",
    border: "none",
    backgroundColor: "#ffebee",
    cursor: "pointer",
    fontSize: "14px",
  },
  sellBtn: {
    padding: "6px 12px",
    borderRadius: "6px",
    border: "none",
    backgroundColor: "var(--gold)",
    color: "var(--brown-dark)",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: "600",
  },
  noData: {
    textAlign: "center",
    color: "#999",
    padding: "40px",
    fontSize: "16px",
  },
};

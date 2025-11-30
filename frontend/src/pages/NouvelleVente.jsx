import React, { useEffect, useState } from "react";
import supabase from "../supabase/clientdb";
import Header from "../components/Header";
import { useNavigate } from "react-router-dom";

export default function NouvelleVente() {
  const navigate = useNavigate();

  // État du panier
  const [panier, setPanier] = useState([]);

  // Données disponibles
  const [produits, setProduits] = useState([]);
  const [clients, setClients] = useState([]);

  // Sélection cliente
  const [clientType, setClientType] = useState("existant"); // existant ou nouveau
  const [selectedClientId, setSelectedClientId] = useState("");
  const [nouveauClient, setNouveauClient] = useState({
    nom: "",
    telephone: "",
  });

  // UI
  const [remarque, setRemarque] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Charger les données
  useEffect(() => {
    loadProduits();
    loadClients();
  }, []);

  const loadProduits = async () => {
    const { data } = await supabase
      .from("produits")
      .select("*")
      .order("nom", { ascending: true });
    if (data) setProduits(data);
  };

  const loadClients = async () => {
    const { data } = await supabase
      .from("clients")
      .select("id, nom, prenom, telephone")
      .order("nom", { ascending: true });
    if (data) setClients(data);
  };

  // Filtrer les produits selon la recherche
  const produitsFiltres = produits.filter(
    (p) =>
      p.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.sku && p.sku.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Ajouter un produit au panier
  const ajouterAuPanier = (produit) => {
    if (produit.quantite === 0) {
      alert("Produit en rupture de stock !");
      return;
    }

    const existant = panier.find((p) => p.produit_id === produit.id);

    if (existant) {
      // Vérifier le stock avant d'incrémenter
      if (existant.quantite >= produit.quantite) {
        alert(`Stock insuffisant ! Disponible : ${produit.quantite}`);
        return;
      }
      // Incrémenter la quantité
      setPanier(
        panier.map((p) =>
          p.produit_id === produit.id
            ? {
                ...p,
                quantite: p.quantite + 1,
                sous_total: (p.quantite + 1) * p.prix_unitaire,
              }
            : p
        )
      );
    } else {
      // Ajouter nouveau
      setPanier([
        ...panier,
        {
          produit_id: produit.id,
          nom: produit.nom,
          prix_unitaire: produit.prix,
          quantite: 1,
          sous_total: produit.prix,
          stock_disponible: produit.quantite,
        },
      ]);
    }
  };

  // Modifier la quantité d'un item
  const modifierQuantite = (index, nouvelleQte) => {
    const item = panier[index];

    if (nouvelleQte <= 0) {
      supprimerDuPanier(index);
      return;
    }

    // Vérifier le stock
    if (nouvelleQte > item.stock_disponible) {
      alert(`Stock insuffisant ! Disponible : ${item.stock_disponible}`);
      return;
    }

    setPanier(
      panier.map((p, i) =>
        i === index
          ? {
              ...p,
              quantite: nouvelleQte,
              sous_total: nouvelleQte * p.prix_unitaire,
            }
          : p
      )
    );
  };

  // Supprimer du panier
  const supprimerDuPanier = (index) => {
    setPanier(panier.filter((_, i) => i !== index));
  };

  // Vider le panier
  const viderPanier = () => {
    if (panier.length === 0) return;
    if (window.confirm("Voulez-vous vider le panier ?")) {
      setPanier([]);
    }
  };

  // Calculer le total
  const calculerTotal = () => {
    return panier.reduce((sum, item) => sum + item.sous_total, 0);
  };

  // Valider la vente
  const validerVente = async () => {
    // Validations
    if (panier.length === 0) {
      alert("Ajoutez au moins un produit au panier !");
      return;
    }

    if (clientType === "existant" && !selectedClientId) {
      alert("Veuillez sélectionner une cliente");
      return;
    }

    if (clientType === "nouveau") {
      if (!nouveauClient.nom || !nouveauClient.telephone) {
        alert("Veuillez renseigner le nom et le téléphone de la cliente");
        return;
      }
    }

    setLoading(true);

    try {
      // Insérer chaque ligne de vente séparément (car structure actuelle)
      for (const item of panier) {
        const venteData = {
          type: "produit",
          produit_id: item.produit_id,
          quantite: item.quantite,
          montant: item.sous_total,
          client_id: clientType === "existant" ? selectedClientId : null,
          client_nom: clientType === "nouveau" ? nouveauClient.nom : null,
          client_telephone:
            clientType === "nouveau" ? nouveauClient.telephone : null,
          prestation_id: null, // Vente seule (pas liée à une prestation)
          remarque: remarque || null,
        };

        const { error: venteError } = await supabase
          .from("ventes")
          .insert([venteData]);

        if (venteError) throw venteError;

        // Mettre à jour le stock
        const newStock = item.stock_disponible - item.quantite;
        await supabase
          .from("produits")
          .update({ quantite: newStock })
          .eq("id", item.produit_id);
      }

      setLoading(false);
      alert(
        `Vente enregistrée avec succès !\n${
          panier.length
        } produit(s) vendus\nTotal : ${calculerTotal().toLocaleString()} FCFA`
      );
      navigate("/ventes");
    } catch (error) {
      setLoading(false);
      alert("Erreur lors de l'enregistrement : " + error.message);
    }
  };

  return (
    <>
      <Header />

      <div style={{ padding: "30px" }}>
        <h1 style={styles.title}>🛒 Nouvelle vente (Produits)</h1>

        <div style={styles.container}>
          {/* COLONNE GAUCHE : Sélection produits */}
          <div style={styles.leftColumn}>
            <div style={styles.searchBar}>
              <input
                type="text"
                placeholder="🔍 Rechercher un produit..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={styles.searchInput}
              />
            </div>

            {/* Liste des produits */}
            <div style={styles.itemsList}>
              {produitsFiltres.length === 0 ? (
                <p style={styles.noData}>Aucun produit trouvé</p>
              ) : (
                produitsFiltres.map((p) => (
                  <div key={p.id} style={styles.itemCard}>
                    <div style={{ flex: 1 }}>
                      <h4 style={styles.itemName}>{p.nom}</h4>
                      {p.sku && <p style={styles.itemSku}>SKU: {p.sku}</p>}
                      <p style={styles.itemPrice}>
                        {p.prix.toLocaleString()} FCFA
                      </p>
                      <p
                        style={{
                          ...styles.itemStock,
                          color: p.quantite <= p.seuil_alerte ? "red" : "#666",
                        }}
                      >
                        Stock : {p.quantite}
                        {p.quantite <= p.seuil_alerte && (
                          <span style={styles.lowStock}> ⚠️</span>
                        )}
                      </p>
                    </div>
                    <button
                      style={{
                        ...styles.addBtn,
                        ...(p.quantite === 0 && styles.addBtnDisabled),
                      }}
                      onClick={() => ajouterAuPanier(p)}
                      disabled={p.quantite === 0}
                    >
                      {p.quantite === 0 ? "✕" : "+"}
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* COLONNE DROITE : Panier */}
          <div style={styles.rightColumn}>
            <div style={styles.panierHeader}>
              <h3 style={styles.sectionTitle}>🛒 Panier</h3>
              {panier.length > 0 && (
                <button style={styles.clearBtn} onClick={viderPanier}>
                  🗑️ Vider
                </button>
              )}
            </div>

            {panier.length === 0 ? (
              <p style={styles.emptyCart}>Le panier est vide</p>
            ) : (
              <div style={styles.cartItems}>
                {panier.map((item, index) => (
                  <div key={index} style={styles.cartItem}>
                    <div style={styles.cartItemHeader}>
                      <span style={styles.cartItemName}>{item.nom}</span>
                      <button
                        style={styles.removeBtn}
                        onClick={() => supprimerDuPanier(index)}
                      >
                        ✕
                      </button>
                    </div>
                    <div style={styles.cartItemDetails}>
                      <span style={styles.itemPriceUnit}>
                        {item.prix_unitaire.toLocaleString()} FCFA
                      </span>
                      <div style={styles.qtyControl}>
                        <button
                          style={styles.qtyBtn}
                          onClick={() =>
                            modifierQuantite(index, item.quantite - 1)
                          }
                        >
                          −
                        </button>
                        <input
                          type="number"
                          value={item.quantite}
                          onChange={(e) =>
                            modifierQuantite(
                              index,
                              parseInt(e.target.value) || 1
                            )
                          }
                          style={styles.qtyInput}
                          min="1"
                          max={item.stock_disponible}
                        />
                        <button
                          style={styles.qtyBtn}
                          onClick={() =>
                            modifierQuantite(index, item.quantite + 1)
                          }
                        >
                          +
                        </button>
                      </div>
                      <span style={styles.sousTotal}>
                        {item.sous_total.toLocaleString()} FCFA
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Total */}
            {panier.length > 0 && (
              <div style={styles.totalSection}>
                <span style={styles.totalLabel}>TOTAL</span>
                <span style={styles.totalAmount}>
                  {calculerTotal().toLocaleString()} FCFA
                </span>
              </div>
            )}

            {/* Cliente */}
            <div style={styles.clientSection}>
              <h4 style={styles.sectionSubtitle}>👤 Cliente</h4>

              <div style={styles.radioGroup}>
                <label style={styles.radioLabel}>
                  <input
                    type="radio"
                    value="existant"
                    checked={clientType === "existant"}
                    onChange={(e) => setClientType(e.target.value)}
                  />
                  <span>Cliente existante</span>
                </label>
                <label style={styles.radioLabel}>
                  <input
                    type="radio"
                    value="nouveau"
                    checked={clientType === "nouveau"}
                    onChange={(e) => setClientType(e.target.value)}
                  />
                  <span>Nouvelle cliente</span>
                </label>
              </div>

              {clientType === "existant" ? (
                <select
                  value={selectedClientId}
                  onChange={(e) => setSelectedClientId(e.target.value)}
                  style={styles.select}
                >
                  <option value="">-- Sélectionner une cliente --</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nom} {c.prenom} {c.telephone ? `- ${c.telephone}` : ""}
                    </option>
                  ))}
                </select>
              ) : (
                <div>
                  <input
                    type="text"
                    placeholder="Nom complet"
                    value={nouveauClient.nom}
                    onChange={(e) =>
                      setNouveauClient({
                        ...nouveauClient,
                        nom: e.target.value,
                      })
                    }
                    style={styles.input}
                  />
                  <input
                    type="tel"
                    placeholder="Téléphone"
                    value={nouveauClient.telephone}
                    onChange={(e) =>
                      setNouveauClient({
                        ...nouveauClient,
                        telephone: e.target.value,
                      })
                    }
                    style={{ ...styles.input, marginTop: "10px" }}
                  />
                </div>
              )}
            </div>

            {/* Remarque */}
            <textarea
              placeholder="Remarque (optionnel)..."
              value={remarque}
              onChange={(e) => setRemarque(e.target.value)}
              style={styles.textarea}
            />

            {/* Boutons */}
            <div style={styles.btnGroup}>
              <button
                style={styles.cancelBtn}
                onClick={() => navigate("/ventes")}
              >
                Annuler
              </button>
              <button
                style={styles.validateBtn}
                onClick={validerVente}
                disabled={loading || panier.length === 0}
              >
                {loading ? "Enregistrement..." : "💰 Valider la vente"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

const styles = {
  title: {
    color: "var(--brown-dark)",
    marginBottom: "30px",
  },
  container: {
    display: "grid",
    gridTemplateColumns: "1fr 420px",
    gap: "30px",
  },
  leftColumn: {
    backgroundColor: "white",
    padding: "20px",
    borderRadius: "12px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
  },
  rightColumn: {
    backgroundColor: "white",
    padding: "20px",
    borderRadius: "12px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
    position: "sticky",
    top: "20px",
    maxHeight: "calc(100vh - 100px)",
    overflow: "auto",
  },
  searchBar: {
    marginBottom: "20px",
  },
  searchInput: {
    width: "100%",
    padding: "12px 15px",
    borderRadius: "8px",
    border: "1px solid #ddd",
    fontSize: "15px",
    boxSizing: "border-box",
  },
  itemsList: {
    display: "grid",
    gap: "15px",
    maxHeight: "calc(100vh - 250px)",
    overflow: "auto",
    paddingRight: "10px",
  },
  itemCard: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "15px",
    border: "1px solid #eee",
    borderRadius: "8px",
    transition: "all 0.2s",
  },
  itemName: {
    margin: "0 0 5px 0",
    fontSize: "16px",
    fontWeight: "600",
    color: "var(--brown-dark)",
  },
  itemSku: {
    margin: "0 0 5px 0",
    fontSize: "12px",
    color: "#999",
  },
  itemPrice: {
    margin: "0 0 5px 0",
    fontSize: "15px",
    fontWeight: "600",
    color: "var(--brown)",
  },
  itemStock: {
    margin: 0,
    fontSize: "13px",
    color: "#666",
  },
  lowStock: {
    color: "red",
    fontWeight: "bold",
  },
  addBtn: {
    width: "45px",
    height: "45px",
    borderRadius: "50%",
    border: "none",
    backgroundColor: "var(--gold)",
    color: "var(--brown-dark)",
    fontSize: "24px",
    cursor: "pointer",
    fontWeight: "bold",
    transition: "transform 0.2s",
  },
  addBtnDisabled: {
    backgroundColor: "#ccc",
    cursor: "not-allowed",
  },
  panierHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "15px",
  },
  sectionTitle: {
    color: "var(--brown-dark)",
    margin: 0,
  },
  clearBtn: {
    padding: "6px 12px",
    backgroundColor: "#ffebee",
    color: "#c62828",
    border: "none",
    borderRadius: "6px",
    fontSize: "13px",
    cursor: "pointer",
    fontWeight: "600",
  },
  emptyCart: {
    textAlign: "center",
    color: "#999",
    padding: "40px 20px",
    fontSize: "15px",
  },
  cartItems: {
    marginBottom: "20px",
    maxHeight: "300px",
    overflow: "auto",
  },
  cartItem: {
    padding: "15px",
    borderBottom: "1px solid #eee",
  },
  cartItemHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "10px",
  },
  cartItemName: {
    fontWeight: "600",
    color: "var(--brown-dark)",
    fontSize: "15px",
  },
  removeBtn: {
    border: "none",
    background: "none",
    color: "#999",
    cursor: "pointer",
    fontSize: "20px",
    padding: "0 5px",
  },
  cartItemDetails: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontSize: "14px",
    gap: "10px",
  },
  itemPriceUnit: {
    color: "#666",
    fontSize: "13px",
  },
  qtyControl: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
  },
  qtyBtn: {
    width: "30px",
    height: "30px",
    borderRadius: "4px",
    border: "1px solid #ddd",
    backgroundColor: "white",
    cursor: "pointer",
    fontSize: "18px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  qtyInput: {
    width: "50px",
    textAlign: "center",
    border: "1px solid #ddd",
    borderRadius: "4px",
    padding: "4px",
    fontSize: "14px",
    fontWeight: "600",
  },
  sousTotal: {
    fontWeight: "700",
    color: "var(--brown)",
    fontSize: "15px",
  },
  totalSection: {
    display: "flex",
    justifyContent: "space-between",
    padding: "20px 0",
    borderTop: "2px solid #eee",
    borderBottom: "2px solid #eee",
    marginBottom: "20px",
  },
  totalLabel: {
    fontSize: "18px",
    fontWeight: "bold",
    color: "var(--brown-dark)",
  },
  totalAmount: {
    fontSize: "26px",
    fontWeight: "bold",
    color: "var(--brown)",
  },
  clientSection: {
    marginBottom: "20px",
  },
  sectionSubtitle: {
    color: "var(--brown-dark)",
    marginBottom: "12px",
    fontSize: "16px",
    fontWeight: "600",
  },
  radioGroup: {
    display: "flex",
    gap: "15px",
    marginBottom: "15px",
  },
  radioLabel: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    cursor: "pointer",
    fontSize: "14px",
  },
  select: {
    width: "100%",
    padding: "10px",
    borderRadius: "8px",
    border: "1px solid #ddd",
    fontSize: "14px",
    boxSizing: "border-box",
  },
  input: {
    width: "100%",
    padding: "10px",
    borderRadius: "8px",
    border: "1px solid #ddd",
    fontSize: "14px",
    boxSizing: "border-box",
  },
  textarea: {
    width: "100%",
    padding: "10px",
    borderRadius: "8px",
    border: "1px solid #ddd",
    fontSize: "14px",
    resize: "vertical",
    minHeight: "60px",
    marginBottom: "20px",
    boxSizing: "border-box",
  },
  btnGroup: {
    display: "flex",
    gap: "10px",
  },
  cancelBtn: {
    flex: 1,
    padding: "14px",
    backgroundColor: "#f5f5f5",
    color: "#666",
    border: "none",
    borderRadius: "8px",
    fontSize: "15px",
    fontWeight: "600",
    cursor: "pointer",
  },
  validateBtn: {
    flex: 2,
    padding: "14px",
    backgroundColor: "var(--brown)",
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontSize: "16px",
    fontWeight: "bold",
    cursor: "pointer",
  },
  noData: {
    textAlign: "center",
    color: "#999",
    padding: "30px",
  },
};

import React, { useEffect, useState } from "react";
import supabase from "../supabase/clientdb";
import Header from "../components/Header";
import { useNavigate, useParams } from "react-router-dom";

export default function PrestationForm() {
  const navigate = useNavigate();
  const { id } = useParams(); // Si on édite une prestation existante
  const isEdit = Boolean(id);

  // Panier de services
  const [panier, setPanier] = useState([]);

  // Données
  const [services, setServices] = useState([]);
  const [clients, setClients] = useState([]);
  const [clientsFiltres, setClientsFiltres] = useState([]);

  // Cliente sélectionnée
  const [selectedClientId, setSelectedClientId] = useState("");
  const [selectedClient, setSelectedClient] = useState(null);

  // UI
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchClient, setSearchClient] = useState("");
  const [showClientDropdown, setShowClientDropdown] = useState(false);

  useEffect(() => {
    loadServices();
    loadClients();

    if (isEdit) {
      loadPrestation();
    }
  }, [id]);

  // Charger la prestation existante (mode édition)
  const loadPrestation = async () => {
    const { data: prestation } = await supabase
      .from("prestations")
      .select(
        `
        *,
        clients (id, nom, prenom, telephone)
      `
      )
      .eq("id", id)
      .single();

    if (prestation) {
      setSelectedClientId(prestation.client_id);
      setSelectedClient(prestation.clients);
      setSearchClient(
        `${prestation.clients?.nom} ${prestation.clients?.prenom}`
      );
      setNotes(prestation.notes || "");

      // Charger les services de cette prestation
      const { data: prestationServices } = await supabase
        .from("prestation_services")
        .select(
          `
          *,
          services (nom, prix)
        `
        )
        .eq("prestation_id", id);

      if (prestationServices) {
        const panierExistant = prestationServices.map((ps) => ({
          service_id: ps.service_id,
          nom: ps.services?.nom || "Service supprimé",
          prix: parseFloat(ps.prix),
          quantite: ps.quantite,
          sous_total: parseFloat(ps.prix) * ps.quantite,
        }));
        setPanier(panierExistant);
      }
    }
  };

  const loadServices = async () => {
    const { data } = await supabase
      .from("services")
      .select("*")
      .order("nom", { ascending: true });
    if (data) setServices(data);
  };

  const loadClients = async () => {
    const { data } = await supabase
      .from("clients")
      .select("id, nom, prenom, telephone")
      .order("nom", { ascending: true });
    if (data) {
      setClients(data);
      setClientsFiltres(data);
    }
  };

  // Recherche cliente
  useEffect(() => {
    if (searchClient) {
      const search = searchClient.toLowerCase();
      const filtered = clients.filter(
        (c) =>
          c.nom.toLowerCase().includes(search) ||
          c.prenom.toLowerCase().includes(search) ||
          (c.telephone && c.telephone.includes(search))
      );
      setClientsFiltres(filtered);
    } else {
      setClientsFiltres(clients);
    }
  }, [searchClient, clients]);

  // Sélectionner une cliente
  const selectClient = (client) => {
    setSelectedClientId(client.id);
    setSelectedClient(client);
    setSearchClient(`${client.nom} ${client.prenom}`);
    setShowClientDropdown(false);
  };

  // Filtrer services
  const servicesFiltres = services.filter((s) =>
    s.nom.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Ajouter un service au panier
  const ajouterAuPanier = (service) => {
    const existant = panier.find((s) => s.service_id === service.id);

    if (existant) {
      setPanier(
        panier.map((s) =>
          s.service_id === service.id
            ? {
                ...s,
                quantite: s.quantite + 1,
                sous_total: (s.quantite + 1) * s.prix,
              }
            : s
        )
      );
    } else {
      setPanier([
        ...panier,
        {
          service_id: service.id,
          nom: service.nom,
          prix: service.prix,
          quantite: 1,
          sous_total: service.prix,
        },
      ]);
    }
  };

  // Modifier quantité
  const modifierQuantite = (index, nouvelleQte) => {
    if (nouvelleQte <= 0) {
      supprimerDuPanier(index);
      return;
    }

    setPanier(
      panier.map((s, i) =>
        i === index
          ? {
              ...s,
              quantite: nouvelleQte,
              sous_total: nouvelleQte * s.prix,
            }
          : s
      )
    );
  };

  // Supprimer du panier
  const supprimerDuPanier = (index) => {
    setPanier(panier.filter((_, i) => i !== index));
  };

  // Vider panier
  const viderPanier = () => {
    if (panier.length === 0) return;
    if (window.confirm("Vider le panier ?")) {
      setPanier([]);
    }
  };

  // Calculer total
  const calculerTotal = () => {
    return panier.reduce((sum, s) => sum + s.sous_total, 0);
  };

  // Valider la prestation
  const validerPrestation = async () => {
    // Validations
    if (panier.length === 0) {
      alert("Ajoutez au moins un service !");
      return;
    }

    if (!selectedClientId) {
      alert("Veuillez sélectionner une cliente");
      return;
    }

    setLoading(true);

    try {
      const prestationData = {
        client_id: selectedClientId,
        total: calculerTotal(),
        notes: notes || null,
      };

      if (isEdit) {
        // MODE ÉDITION
        // 1. Mettre à jour la prestation
        const { error: updateError } = await supabase
          .from("prestations")
          .update(prestationData)
          .eq("id", id);

        if (updateError) throw updateError;

        // 2. Supprimer les anciennes lignes
        await supabase
          .from("prestation_services")
          .delete()
          .eq("prestation_id", id);

        // 3. Créer les nouvelles lignes
        const lignes = panier.map((service) => ({
          prestation_id: id,
          service_id: service.service_id,
          prix: service.prix,
          quantite: service.quantite,
        }));

        const { error: lignesError } = await supabase
          .from("prestation_services")
          .insert(lignes);

        if (lignesError) throw lignesError;

        setLoading(false);
        alert("Prestation mise à jour avec succès !");
        navigate("/prestations");
      } else {
        // MODE CRÉATION
        // 1. Créer la prestation
        const { data: prestation, error: prestationError } = await supabase
          .from("prestations")
          .insert([prestationData])
          .select()
          .single();

        if (prestationError) throw prestationError;

        // 2. Créer les lignes de services
        const lignes = panier.map((service) => ({
          prestation_id: prestation.id,
          service_id: service.service_id,
          prix: service.prix,
          quantite: service.quantite,
        }));

        const { error: lignesError } = await supabase
          .from("prestation_services")
          .insert(lignes);

        if (lignesError) throw lignesError;

        setLoading(false);
        alert(
          `Prestation créée avec succès !\n${
            panier.length
          } service(s)\nTotal : ${calculerTotal().toLocaleString()} FCFA`
        );
        navigate("/prestations");
      }
    } catch (error) {
      setLoading(false);
      alert("Erreur : " + error.message);
    }
  };

  return (
    <>
      <Header />

      <div style={{ padding: "30px" }}>
        <h1 style={styles.title}>
          {isEdit ? "✏️ Modifier la prestation" : "💅 Nouvelle prestation"}
        </h1>

        <div style={styles.container}>
          {/* GAUCHE : Services */}
          <div style={styles.leftColumn}>
            <div style={styles.searchBar}>
              <input
                type="text"
                placeholder="🔍 Rechercher un service..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={styles.searchInput}
              />
            </div>

            <div style={styles.itemsList}>
              {servicesFiltres.length === 0 ? (
                <p style={styles.noData}>Aucun service trouvé</p>
              ) : (
                servicesFiltres.map((s) => (
                  <div key={s.id} style={styles.itemCard}>
                    <div style={{ flex: 1 }}>
                      <h4 style={styles.itemName}>{s.nom}</h4>
                      {s.description && (
                        <p style={styles.itemDesc}>{s.description}</p>
                      )}
                      <p style={styles.itemPrice}>
                        {s.prix.toLocaleString()} FCFA
                      </p>
                      {s.duree_minutes && (
                        <p style={styles.itemDuration}>
                          ⏱️ {s.duree_minutes} min
                        </p>
                      )}
                    </div>
                    <button
                      style={styles.addBtn}
                      onClick={() => ajouterAuPanier(s)}
                    >
                      +
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* DROITE : Panier */}
          <div style={styles.rightColumn}>
            <div style={styles.panierHeader}>
              <h3 style={styles.sectionTitle}>🛒 Services sélectionnés</h3>
              {panier.length > 0 && (
                <button style={styles.clearBtn} onClick={viderPanier}>
                  🗑️ Vider
                </button>
              )}
            </div>

            {panier.length === 0 ? (
              <p style={styles.emptyCart}>Aucun service sélectionné</p>
            ) : (
              <div style={styles.cartItems}>
                {panier.map((service, index) => (
                  <div key={index} style={styles.cartItem}>
                    <div style={styles.cartItemHeader}>
                      <span style={styles.cartItemName}>{service.nom}</span>
                      <button
                        style={styles.removeBtn}
                        onClick={() => supprimerDuPanier(index)}
                      >
                        ✕
                      </button>
                    </div>
                    <div style={styles.cartItemDetails}>
                      <span style={styles.itemPriceUnit}>
                        {service.prix.toLocaleString()} FCFA
                      </span>
                      <div style={styles.qtyControl}>
                        <button
                          style={styles.qtyBtn}
                          onClick={() =>
                            modifierQuantite(index, service.quantite - 1)
                          }
                        >
                          −
                        </button>
                        <input
                          type="number"
                          value={service.quantite}
                          onChange={(e) =>
                            modifierQuantite(
                              index,
                              parseInt(e.target.value) || 1
                            )
                          }
                          style={styles.qtyInput}
                          min="1"
                        />
                        <button
                          style={styles.qtyBtn}
                          onClick={() =>
                            modifierQuantite(index, service.quantite + 1)
                          }
                        >
                          +
                        </button>
                      </div>
                      <span style={styles.sousTotal}>
                        {service.sous_total.toLocaleString()} FCFA
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

            {/* Cliente avec recherche */}
            <div style={styles.clientSection}>
              <h4 style={styles.sectionSubtitle}>👤 Cliente</h4>

              {/* Barre de recherche cliente */}
              <div style={styles.clientSearchWrapper}>
                <input
                  type="text"
                  placeholder="🔍 Rechercher par nom, prénom ou téléphone..."
                  value={searchClient}
                  onChange={(e) => {
                    setSearchClient(e.target.value);
                    setShowClientDropdown(true);
                  }}
                  onFocus={() => setShowClientDropdown(true)}
                  style={styles.clientSearchInput}
                />

                {/* Dropdown des résultats */}
                {showClientDropdown && clientsFiltres.length > 0 && (
                  <div style={styles.dropdown}>
                    {clientsFiltres.slice(0, 5).map((client) => (
                      <div
                        key={client.id}
                        style={styles.dropdownItem}
                        onClick={() => selectClient(client)}
                      >
                        <div style={styles.dropdownItemName}>
                          {client.nom} {client.prenom}
                        </div>
                        <div style={styles.dropdownItemPhone}>
                          {client.telephone || "Pas de téléphone"}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Cliente sélectionnée */}
              {selectedClient && (
                <div style={styles.selectedClient}>
                  <div style={styles.selectedClientInfo}>
                    <strong>Cliente sélectionnée :</strong>
                    <br />
                    {selectedClient.nom} {selectedClient.prenom}
                    <br />
                    📞 {selectedClient.telephone || "N/A"}
                  </div>
                  <button
                    style={styles.clearClientBtn}
                    onClick={() => {
                      setSelectedClientId("");
                      setSelectedClient(null);
                      setSearchClient("");
                    }}
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>

            {/* Notes */}
            <textarea
              placeholder="Notes (optionnel)..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              style={styles.textarea}
            />

            {/* Boutons */}
            <div style={styles.btnGroup}>
              <button
                style={styles.cancelBtn}
                onClick={() => navigate("/prestations")}
              >
                Annuler
              </button>
              <button
                style={styles.validateBtn}
                onClick={validerPrestation}
                disabled={loading || panier.length === 0}
              >
                {loading
                  ? "Enregistrement..."
                  : isEdit
                  ? "💾 Mettre à jour"
                  : "✅ Valider la prestation"}
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
  },
  itemName: {
    margin: "0 0 5px 0",
    fontSize: "16px",
    fontWeight: "600",
    color: "var(--brown-dark)",
  },
  itemDesc: {
    margin: "0 0 8px 0",
    fontSize: "13px",
    color: "#666",
  },
  itemPrice: {
    margin: "0 0 5px 0",
    fontSize: "15px",
    fontWeight: "600",
    color: "#ec4899",
  },
  itemDuration: {
    margin: 0,
    fontSize: "13px",
    color: "#999",
  },
  addBtn: {
    width: "45px",
    height: "45px",
    borderRadius: "50%",
    border: "none",
    backgroundColor: "#ec4899",
    color: "white",
    fontSize: "24px",
    cursor: "pointer",
    fontWeight: "bold",
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
    maxHeight: "250px",
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
    color: "#ec4899",
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
    color: "#ec4899",
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
  clientSearchWrapper: {
    position: "relative",
  },
  clientSearchInput: {
    width: "100%",
    padding: "10px",
    borderRadius: "8px",
    border: "1px solid #ddd",
    fontSize: "14px",
    boxSizing: "border-box",
  },
  dropdown: {
    position: "absolute",
    top: "100%",
    left: 0,
    right: 0,
    backgroundColor: "white",
    border: "1px solid #ddd",
    borderRadius: "8px",
    marginTop: "5px",
    maxHeight: "200px",
    overflow: "auto",
    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
    zIndex: 1000,
  },
  dropdownItem: {
    padding: "12px",
    cursor: "pointer",
    borderBottom: "1px solid #f0f0f0",
    transition: "background-color 0.2s",
  },
  dropdownItemName: {
    fontWeight: "600",
    color: "var(--brown-dark)",
    marginBottom: "4px",
  },
  dropdownItemPhone: {
    fontSize: "13px",
    color: "#666",
  },
  selectedClient: {
    marginTop: "15px",
    padding: "12px",
    backgroundColor: "#e8f5e9",
    borderRadius: "8px",
    border: "1px solid #4caf50",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  selectedClientInfo: {
    fontSize: "13px",
    color: "#2e7d32",
  },
  clearClientBtn: {
    border: "none",
    background: "none",
    color: "#c62828",
    cursor: "pointer",
    fontSize: "18px",
    padding: "5px",
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
    backgroundColor: "#ec4899",
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

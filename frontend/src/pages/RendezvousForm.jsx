import React, { useEffect, useState } from "react";
import supabase from "../supabase/clientdb";
import Header from "../components/Header";
import { useNavigate, useParams } from "react-router-dom";

export default function RendezvousForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  // Données
  const [services, setServices] = useState([]);
  const [clients, setClients] = useState([]);
  const [clientsFiltres, setClientsFiltres] = useState([]);

  // Formulaire
  const [formData, setFormData] = useState({
    nom_client: "",
    numero_client: "",
    date_rdv: "",
    heure: "",
    acompte: 0,
    nombre_personnes: 1,
  });

  const [soinsSelectionnes, setSoinsSelectionnes] = useState([]);
  const [loading, setLoading] = useState(false);

  // Recherche cliente
  const [searchClient, setSearchClient] = useState("");
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [clientType, setClientType] = useState("nouvelle"); // nouvelle ou existante

  useEffect(() => {
    loadServices();
    loadClients();

    if (isEdit) {
      loadRendezvous();
    }
  }, [id]);

  const loadRendezvous = async () => {
    const { data } = await supabase
      .from("rendezvous")
      .select("*")
      .eq("id", id)
      .single();

    if (data) {
      setFormData({
        nom_client: data.nom_client,
        numero_client: data.numero_client,
        date_rdv: data.date_rdv,
        heure: data.heure,
        acompte: data.acompte || 0,
        nombre_personnes: data.nombre_personnes || 1,
      });
      setSoinsSelectionnes(data.soins || []);
      setSearchClient(data.nom_client);
    }
  };

  const loadServices = async () => {
    const { data } = await supabase
      .from("services")
      .select("nom")
      .order("nom", { ascending: true });
    if (data) setServices(data.map((s) => s.nom));
  };

  const loadClients = async () => {
    const { data } = await supabase
      .from("clients")
      .select("nom, prenom, telephone")
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

  const selectClient = (client) => {
    setFormData({
      ...formData,
      nom_client: `${client.nom} ${client.prenom}`,
      numero_client: client.telephone || "",
    });
    setSearchClient(`${client.nom} ${client.prenom}`);
    setShowClientDropdown(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Toggle soin
  const toggleSoin = (soin) => {
    if (soinsSelectionnes.includes(soin)) {
      setSoinsSelectionnes(soinsSelectionnes.filter((s) => s !== soin));
    } else {
      setSoinsSelectionnes([...soinsSelectionnes, soin]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validations
    if (!formData.nom_client || !formData.numero_client) {
      alert("Le nom et le numéro du client sont requis");
      return;
    }

    if (!formData.date_rdv || !formData.heure) {
      alert("La date et l'heure sont requises");
      return;
    }

    if (soinsSelectionnes.length === 0) {
      alert("Veuillez sélectionner au moins un soin");
      return;
    }

    setLoading(true);

    const dataToSave = {
      ...formData,
      soins: soinsSelectionnes,
      acompte: parseFloat(formData.acompte) || 0,
      nombre_personnes: parseInt(formData.nombre_personnes) || 1,
    };

    try {
      if (isEdit) {
        const { error } = await supabase
          .from("rendezvous")
          .update(dataToSave)
          .eq("id", id);

        if (error) throw error;
        alert("Rendez-vous mis à jour !");
      } else {
        const { error } = await supabase
          .from("rendezvous")
          .insert([dataToSave]);

        if (error) throw error;
        alert("Rendez-vous créé avec succès !");
      }

      setLoading(false);
      navigate("/rendezvous");
    } catch (error) {
      setLoading(false);
      alert("Erreur : " + error.message);
    }
  };

  return (
    <>
      <Header />

      <div style={{ padding: "30px", maxWidth: "900px", margin: "0 auto" }}>
        <h1 style={styles.title}>
          {isEdit ? "✏️ Modifier le rendez-vous" : "📅 Nouveau rendez-vous"}
        </h1>

        <div style={styles.formContainer}>
          {/* Type de cliente */}
          {!isEdit && (
            <div style={styles.section}>
              <h3 style={styles.sectionTitle}>👤 Cliente</h3>
              <div style={styles.radioGroup}>
                <label style={styles.radioLabel}>
                  <input
                    type="radio"
                    value="nouvelle"
                    checked={clientType === "nouvelle"}
                    onChange={(e) => setClientType(e.target.value)}
                  />
                  <span>Nouvelle cliente</span>
                </label>
                <label style={styles.radioLabel}>
                  <input
                    type="radio"
                    value="existante"
                    checked={clientType === "existante"}
                    onChange={(e) => setClientType(e.target.value)}
                  />
                  <span>Cliente existante</span>
                </label>
              </div>
            </div>
          )}

          {/* Recherche ou saisie */}
          <div style={styles.section}>
            {clientType === "existante" && !isEdit ? (
              <div style={styles.clientSearchWrapper}>
                <label style={styles.label}>Rechercher une cliente</label>
                <input
                  type="text"
                  placeholder="🔍 Nom, prénom ou téléphone..."
                  value={searchClient}
                  onChange={(e) => {
                    setSearchClient(e.target.value);
                    setShowClientDropdown(true);
                  }}
                  onFocus={() => setShowClientDropdown(true)}
                  style={styles.input}
                />

                {showClientDropdown && clientsFiltres.length > 0 && (
                  <div style={styles.dropdown}>
                    {clientsFiltres.slice(0, 5).map((client, i) => (
                      <div
                        key={i}
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
            ) : (
              <>
                <div style={styles.formGroup}>
                  <label style={styles.label}>
                    Nom complet <span style={styles.required}>*</span>
                  </label>
                  <input
                    type="text"
                    name="nom_client"
                    value={formData.nom_client}
                    onChange={handleChange}
                    style={styles.input}
                    placeholder="Ex: Aissatou Diallo"
                    required
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>
                    Numéro de téléphone <span style={styles.required}>*</span>
                  </label>
                  <input
                    type="tel"
                    name="numero_client"
                    value={formData.numero_client}
                    onChange={handleChange}
                    style={styles.input}
                    placeholder="Ex: +227 90 12 34 56"
                    required
                  />
                </div>
              </>
            )}
          </div>

          {/* Date et heure */}
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>📅 Date et heure</h3>
            <div style={styles.row}>
              <div style={styles.formGroup}>
                <label style={styles.label}>
                  Date <span style={styles.required}>*</span>
                </label>
                <input
                  type="date"
                  name="date_rdv"
                  value={formData.date_rdv}
                  onChange={handleChange}
                  style={styles.input}
                  required
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>
                  Heure <span style={styles.required}>*</span>
                </label>
                <input
                  type="time"
                  name="heure"
                  value={formData.heure}
                  onChange={handleChange}
                  style={styles.input}
                  required
                />
              </div>
            </div>
          </div>

          {/* Soins */}
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>
              💅 Soins <span style={styles.required}>*</span>
            </h3>
            <div style={styles.soinsGrid}>
              {services.map((soin, i) => (
                <div
                  key={i}
                  style={{
                    ...styles.soinChip,
                    ...(soinsSelectionnes.includes(soin) &&
                      styles.soinChipActive),
                  }}
                  onClick={() => toggleSoin(soin)}
                >
                  {soinsSelectionnes.includes(soin) ? "✅" : "⬜"} {soin}
                </div>
              ))}
            </div>
            {soinsSelectionnes.length > 0 && (
              <p style={styles.selectedCount}>
                {soinsSelectionnes.length} soin(s) sélectionné(s)
              </p>
            )}
          </div>

          {/* Informations complémentaires */}
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>ℹ️ Informations complémentaires</h3>
            <div style={styles.row}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Nombre de personnes</label>
                <input
                  type="number"
                  name="nombre_personnes"
                  value={formData.nombre_personnes}
                  onChange={handleChange}
                  style={styles.input}
                  min="1"
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Acompte (FCFA)</label>
                <input
                  type="number"
                  name="acompte"
                  value={formData.acompte}
                  onChange={handleChange}
                  style={styles.input}
                  min="0"
                  step="100"
                />
              </div>
            </div>
          </div>

          {/* Boutons */}
          <div style={styles.btnGroup}>
            <button
              type="button"
              onClick={() => navigate("/rendezvous")}
              style={styles.cancelBtn}
            >
              Annuler
            </button>
            <button
              onClick={handleSubmit}
              style={styles.submitBtn}
              disabled={loading}
            >
              {loading
                ? "Enregistrement..."
                : isEdit
                ? "💾 Mettre à jour"
                : "✅ Créer le rendez-vous"}
            </button>
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
  formContainer: {
    backgroundColor: "white",
    padding: "30px",
    borderRadius: "12px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
  },
  section: {
    marginBottom: "30px",
    paddingBottom: "25px",
    borderBottom: "1px solid #eee",
  },
  sectionTitle: {
    color: "var(--brown-dark)",
    marginTop: 0,
    marginBottom: "15px",
    fontSize: "18px",
  },
  radioGroup: {
    display: "flex",
    gap: "20px",
  },
  radioLabel: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    cursor: "pointer",
    fontSize: "15px",
  },
  clientSearchWrapper: {
    position: "relative",
  },
  formGroup: {
    marginBottom: "20px",
    flex: 1,
  },
  row: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "20px",
  },
  label: {
    display: "block",
    marginBottom: "8px",
    color: "var(--brown-dark)",
    fontWeight: "600",
    fontSize: "15px",
  },
  required: {
    color: "red",
  },
  input: {
    width: "100%",
    padding: "12px",
    borderRadius: "8px",
    border: "1px solid #ddd",
    fontSize: "15px",
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
  soinsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
    gap: "10px",
  },
  soinChip: {
    padding: "12px 16px",
    borderRadius: "8px",
    border: "2px solid #ddd",
    cursor: "pointer",
    textAlign: "center",
    fontSize: "14px",
    fontWeight: "600",
    transition: "all 0.2s",
    backgroundColor: "white",
  },
  soinChipActive: {
    backgroundColor: "#ec4899",
    color: "white",
    border: "2px solid #ec4899",
  },
  selectedCount: {
    marginTop: "15px",
    fontSize: "14px",
    color: "#ec4899",
    fontWeight: "600",
  },
  btnGroup: {
    display: "flex",
    gap: "15px",
    marginTop: "30px",
  },
  cancelBtn: {
    flex: 1,
    padding: "14px",
    backgroundColor: "#f5f5f5",
    color: "#666",
    border: "none",
    borderRadius: "8px",
    fontSize: "16px",
    fontWeight: "600",
    cursor: "pointer",
  },
  submitBtn: {
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
};

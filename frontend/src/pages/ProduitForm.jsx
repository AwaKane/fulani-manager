import React, { useEffect, useState } from "react";
import supabase from "../supabase/clientdb";
import Header from "../components/Header";
import { useNavigate, useParams } from "react-router-dom";

export default function ProduitForm() {
  const navigate = useNavigate();
  const { id } = useParams(); // Si on édite un produit existant
  const isEdit = Boolean(id);

  const [formData, setFormData] = useState({
    nom: "",
    sku: "",
    description: "",
    prix: "",
    quantite: 0,
    seuil_alerte: 5,
  });

  const [loading, setLoading] = useState(false);

  // Si mode édition, charger les données du produit
  useEffect(() => {
    if (isEdit) {
      loadProduit();
    }
  }, [id]);

  const loadProduit = async () => {
    const { data, error } = await supabase
      .from("produits")
      .select("*")
      .eq("id", id)
      .single();

    if (data) {
      setFormData({
        nom: data.nom,
        sku: data.sku || "",
        description: data.description || "",
        prix: data.prix,
        quantite: data.quantite,
        seuil_alerte: data.seuil_alerte,
      });
    } else if (error) {
      alert("Erreur lors du chargement : " + error.message);
      navigate("/produits");
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.nom || !formData.prix) {
      alert("Le nom et le prix sont obligatoires");
      return;
    }

    if (parseFloat(formData.prix) <= 0) {
      alert("Le prix doit être supérieur à 0");
      return;
    }

    setLoading(true);

    const dataToSave = {
      ...formData,
      prix: parseFloat(formData.prix),
      quantite: parseInt(formData.quantite) || 0,
      seuil_alerte: parseInt(formData.seuil_alerte) || 5,
    };

    let error;

    if (isEdit) {
      // Mise à jour
      const result = await supabase
        .from("produits")
        .update(dataToSave)
        .eq("id", id);
      error = result.error;
    } else {
      // Création
      const result = await supabase.from("produits").insert([dataToSave]);
      error = result.error;
    }

    setLoading(false);

    if (error) {
      alert("Erreur : " + error.message);
    } else {
      alert(
        isEdit
          ? "Produit mis à jour avec succès !"
          : "Produit créé avec succès !"
      );
      navigate("/produits");
    }
  };

  return (
    <>
      <Header />

      <div style={{ padding: "30px", maxWidth: "800px", margin: "0 auto" }}>
        <h1 style={styles.title}>
          {isEdit ? "Modifier le produit" : "Nouveau produit"}
        </h1>

        <form onSubmit={handleSubmit} style={styles.form}>
          {/* Nom du produit */}
          <div style={styles.formGroup}>
            <label style={styles.label}>
              Nom du produit <span style={styles.required}>*</span>
            </label>
            <input
              type="text"
              name="nom"
              value={formData.nom}
              onChange={handleChange}
              style={styles.input}
              placeholder="Ex: Encens de Sandalwood"
              required
            />
          </div>

          {/* SKU */}
          <div style={styles.formGroup}>
            <label style={styles.label}>SKU (Code produit)</label>
            <input
              type="text"
              name="sku"
              value={formData.sku}
              onChange={handleChange}
              style={styles.input}
              placeholder="Ex: ENC-001"
            />
            <small style={styles.hint}>
              Code unique pour identifier le produit
            </small>
          </div>

          {/* Description */}
          <div style={styles.formGroup}>
            <label style={styles.label}>Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              style={{
                ...styles.input,
                minHeight: "100px",
                resize: "vertical",
              }}
              placeholder="Description du produit..."
            />
          </div>

          {/* Ligne : Prix et Quantité */}
          <div style={styles.row}>
            <div style={styles.formGroup}>
              <label style={styles.label}>
                Prix unitaire (FCFA) <span style={styles.required}>*</span>
              </label>
              <input
                type="number"
                name="prix"
                value={formData.prix}
                onChange={handleChange}
                style={styles.input}
                placeholder="2500"
                min="0"
                step="0.01"
                required
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Quantité en stock</label>
              <input
                type="number"
                name="quantite"
                value={formData.quantite}
                onChange={handleChange}
                style={styles.input}
                placeholder="50"
                min="0"
              />
            </div>
          </div>

          {/* Seuil d'alerte */}
          <div style={styles.formGroup}>
            <label style={styles.label}>Seuil d'alerte stock</label>
            <input
              type="number"
              name="seuil_alerte"
              value={formData.seuil_alerte}
              onChange={handleChange}
              style={styles.input}
              placeholder="5"
              min="0"
            />
            <small style={styles.hint}>
              Une alerte s'affichera quand le stock sera inférieur ou égal à ce
              nombre
            </small>
          </div>

          {/* Boutons */}
          <div style={styles.btnGroup}>
            <button type="submit" style={styles.submitBtn} disabled={loading}>
              {loading
                ? "Enregistrement..."
                : isEdit
                ? "💾 Mettre à jour"
                : "✅ Créer le produit"}
            </button>

            <button
              type="button"
              onClick={() => navigate("/produits")}
              style={styles.cancelBtn}
            >
              Annuler
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

const styles = {
  title: {
    color: "var(--brown-dark)",
    marginBottom: "30px",
  },
  form: {
    backgroundColor: "white",
    padding: "30px",
    borderRadius: "12px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
  },
  formGroup: {
    marginBottom: "20px",
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
  hint: {
    display: "block",
    marginTop: "5px",
    color: "#999",
    fontSize: "13px",
  },
  btnGroup: {
    display: "flex",
    gap: "15px",
    marginTop: "30px",
  },
  submitBtn: {
    flex: 1,
    padding: "14px",
    backgroundColor: "var(--brown)",
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontSize: "16px",
    fontWeight: "bold",
    cursor: "pointer",
  },
  cancelBtn: {
    padding: "14px 30px",
    backgroundColor: "#f5f5f5",
    color: "#666",
    border: "none",
    borderRadius: "8px",
    fontSize: "16px",
    fontWeight: "600",
    cursor: "pointer",
  },
};

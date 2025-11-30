import React, { useState } from "react";
import supabase from "../supabase/clientdb";
import Header from "../components/Header";
import { useNavigate } from "react-router-dom";

export default function NewCliente() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    nom: "",
    prenom: "",
    date_naissance: "",
    telephone: "",
    adresse: "",
    email: "",
    allergies: "",
    antecedents: "",
    enceinte: "", // oui ou non
    type_peau: "", // sèche, grasse, mixte, normale…
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // conversion enceinte → boolean
    const payload = {
      ...form,
      enceinte: form.enceinte === "oui",
    };

    const { error } = await supabase.from("clients").insert([payload]);

    if (error) {
      setError(error.message);
    } else {
      navigate("/clientes");
    }

    setLoading(false);
  };

  return (
    <>
      <Header />

      <div style={styles.container}>
        <h1 style={styles.title}>Nouvelle cliente</h1>

        {error && <p style={styles.error}>{error}</p>}

        <form onSubmit={handleSubmit} style={styles.form}>
          {/* Ligne nom + prénom */}
          <div style={styles.row}>
            <div style={styles.field}>
              <label>Nom</label>
              <input
                type="text"
                name="nom"
                required
                value={form.nom}
                onChange={handleChange}
              />
            </div>

            <div style={styles.field}>
              <label>Prénom</label>
              <input
                type="text"
                name="prenom"
                required
                value={form.prenom}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Ligne naissance + téléphone */}
          <div style={styles.row}>
            <div style={styles.field}>
              <label>Date de naissance</label>
              <input
                type="date"
                name="date_naissance"
                value={form.date_naissance}
                onChange={handleChange}
              />
            </div>

            <div style={styles.field}>
              <label>Téléphone</label>
              <input
                type="text"
                name="telephone"
                value={form.telephone}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Enceinte + type peau */}
          <div style={styles.row}>
            <div style={styles.field}>
              <label>Enceinte ?</label>
              <select
                name="enceinte"
                value={form.enceinte}
                onChange={handleChange}
                required
              >
                <option value="">-- Sélectionner --</option>
                <option value="oui">Oui</option>
                <option value="non">Non</option>
              </select>
            </div>

            <div style={styles.field}>
              <label>Type de peau</label>
              <select
                name="type_peau"
                value={form.type_peau}
                onChange={handleChange}
                required
              >
                <option value="">-- Sélectionner --</option>
                <option value="sèche">Sèche</option>
                <option value="grasse">Grasse</option>
                <option value="mixte">Mixte</option>
                <option value="normale">Normale</option>
                <option value="sensible">Sensible</option>
              </select>
            </div>
          </div>

          {/* Adresse */}
          <div style={styles.field}>
            <label>Adresse</label>
            <input
              type="text"
              name="adresse"
              value={form.adresse}
              onChange={handleChange}
            />
          </div>

          {/* Email */}
          <div style={styles.field}>
            <label>Email</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
            />
          </div>

          {/* Allergies */}
          <div style={styles.field}>
            <label>Allergies</label>
            <textarea
              name="allergies"
              rows="2"
              value={form.allergies}
              onChange={handleChange}
            ></textarea>
          </div>

          {/* Antécédents */}
          <div style={styles.field}>
            <label>Antécédents médicaux</label>
            <textarea
              name="antecedents"
              rows="2"
              value={form.antecedents}
              onChange={handleChange}
            ></textarea>
          </div>

          <button type="submit" style={styles.button} disabled={loading}>
            {loading ? "Enregistrement..." : "Enregistrer"}
          </button>
        </form>
      </div>
    </>
  );
}

const styles = {
  container: {
    maxWidth: "600px",
    margin: "40px auto",
    background: "var(--white)",
    padding: "30px",
    borderRadius: "12px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
  },
  title: {
    color: "var(--brown-dark)",
    marginBottom: "25px",
    textAlign: "center",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  field: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  row: {
    display: "flex",
    gap: "20px",
  },
  button: {
    padding: "14px",
    backgroundColor: "var(--brown)",
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontSize: "16px",
    cursor: "pointer",
    fontWeight: "bold",
  },
  error: {
    color: "red",
    textAlign: "center",
    marginBottom: "10px",
  },
};

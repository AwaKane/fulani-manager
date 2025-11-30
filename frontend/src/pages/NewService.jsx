import React, { useState } from "react";
import supabase from "../supabase/clientdb";
import Header from "../components/Header";
import { useNavigate } from "react-router-dom";

export default function NewService() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    nom: "",
    prix: "",
    description: "",
  });

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();

    await supabase.from("services").insert([form]);
    navigate("/services");
  };

  return (
    <>
      <Header />
      <div style={styles.container}>
        <h1 style={styles.title}>Nouveau service</h1>

        <form onSubmit={handleSubmit} style={styles.form}>
          <input
            required
            name="nom"
            placeholder="Nom"
            onChange={handleChange}
          />

          <input
            name="prix"
            type="number"
            placeholder="Prix"
            onChange={handleChange}
          />
          <textarea
            name="description"
            placeholder="Description"
            onChange={handleChange}
          ></textarea>

          <button type="submit" style={styles.button}>
            Enregistrer
          </button>
        </form>
      </div>
    </>
  );
}

const styles = {
  container: { maxWidth: "600px", margin: "auto", padding: "20px" },
  title: { marginBottom: "20px" },
  form: { display: "flex", flexDirection: "column", gap: "15px" },
  button: {
    padding: "12px",
    background: "var(--brown)",
    color: "white",
    borderRadius: "8px",
  },
};

import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import supabase from "../supabase/clientdb";
import Header from "../components/Header";

export default function EditService() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(null);

  useEffect(() => {
    fetchService();
  }, []);

  const fetchService = async () => {
    const { data } = await supabase
      .from("services")
      .select("*")
      .eq("id", id)
      .single();
    setForm(data);
  };

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();

    await supabase.from("services").update(form).eq("id", id);
    navigate("/services");
  };

  if (!form) return <p>Chargement...</p>;

  return (
    <>
      <Header />
      <div style={styles.container}>
        <h1 style={styles.title}>Modifier le service</h1>

        <form onSubmit={handleSubmit} style={styles.form}>
          <input name="nom" value={form.nom} onChange={handleChange} />

          <input
            name="prix"
            type="number"
            value={form.prix}
            onChange={handleChange}
          />
          <textarea
            name="description"
            value={form.description}
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

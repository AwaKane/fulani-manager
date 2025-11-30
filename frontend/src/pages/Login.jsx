import React, { useState } from "react";
import supabase from "../supabase/clientdb";
import logo from "../assets/logo.jpg";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
    } else {
      window.location.href = "/dashboard";
    }

    setLoading(false);
  };

  return (
    <>
      <div
        style={{
          maxWidth: "400px",
          margin: "30px auto",
          backgroundColor: "var(--white)",
          padding: "35px",
          borderRadius: "12px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
        }}
      >
        {/* Logo centré */}
        <div style={{ textAlign: "center", marginTop: "40px" }}>
          <img
            src={logo} // 👉 remplace par ton vrai logo
            alt="Fulani"
            style={{ width: "120px", height: "auto" }}
          />
        </div>
        <h2 style={{ color: "var(--brown-dark)", textAlign: "center" }}>
          Connexion
        </h2>

        {error && (
          <p style={{ color: "red", fontSize: "14px", marginBottom: "10px" }}>
            {error}
          </p>
        )}

        <form onSubmit={handleLogin}>
          <label style={{ color: "var(--brown)" }}>Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={inputStyle}
          />

          <label style={{ color: "var(--brown)" }}>Mot de passe</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={inputStyle}
          />

          <button type="submit" style={buttonStyle} disabled={loading}>
            {loading ? "Connexion..." : "Se connecter"}
          </button>
        </form>
      </div>
    </>
  );
}

const inputStyle = {
  width: "100%",
  padding: "12px",
  margin: "8px 0 20px",
  borderRadius: "8px",
  border: "1px solid #ccc",
  fontSize: "15px",
};

const buttonStyle = {
  width: "100%",
  padding: "12px",
  backgroundColor: "var(--brown)",
  color: "white",
  border: "none",
  borderRadius: "8px",
  fontSize: "16px",
  cursor: "pointer",
};

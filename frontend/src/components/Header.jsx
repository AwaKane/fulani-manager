import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import supabase from "../supabase/clientdb";
import logo from "../assets/logo.jpg";

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);

  // Récupérer l'utilisateur connecté
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setUser(data.user);
      }
    });
  }, []);

  // Fonction de déconnexion
  const logout = async () => {
    if (window.confirm("Voulez-vous vraiment vous déconnecter ?")) {
      await supabase.auth.signOut();
      window.location.href = "/";
    }
  };

  const isDashboard = location.pathname === "/dashboard";

  // Obtenir les initiales de l'email
  const getInitials = (email) => {
    if (!email) return "U";
    return email.charAt(0).toUpperCase();
  };

  return (
    <header style={styles.header}>
      {/* Logo à gauche */}
      <img
        src={logo}
        alt="Institut Logo"
        style={styles.logo}
        onClick={() => navigate("/dashboard")}
      />

      {/* Section droite : User + Boutons */}
      <div style={styles.rightSection}>
        {/* Bouton Dashboard (si pas sur dashboard) */}

        {/* Avatar utilisateur */}
        {user && (
          <div style={styles.userAvatar} title={user.email}>
            {getInitials(user.email)}
          </div>
        )}

        {/* Bouton Déconnexion */}
        <button
          onClick={logout}
          style={styles.logoutBtn}
          title="Se déconnecter"
        >
          Déconnexion
        </button>
      </div>
    </header>
  );
}

const styles = {
  header: {
    backgroundColor: "var(--white)",
    padding: "10px 25px", // Réduit de 15px à 10px
    borderBottom: "1px solid #e0e0e0",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    boxShadow: "0 2px 4px rgba(0,0,0,0.04)", // Ombre subtile
  },
  logo: {
    height: "40px", // Hauteur fixe au lieu de width
    width: "auto",
    cursor: "pointer",
    transition: "transform 0.2s, opacity 0.2s",
  },
  rightSection: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  userAvatar: {
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    backgroundColor: "var(--brown)",
    color: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "16px",
    fontWeight: "700",
    cursor: "pointer",
    transition: "transform 0.2s, box-shadow 0.2s",
    boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
  },
  dashboardBtn: {
    backgroundColor: "transparent",
    color: "var(--brown)",
    padding: "8px 16px",
    borderRadius: "6px",
    border: "1px solid var(--brown)",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "600",
    transition: "all 0.2s",
    display: "flex",
    alignItems: "center",
    gap: "6px",
  },
  logoutBtn: {
    backgroundColor: "transparent",
    color: "#666",
    padding: "8px 14px", // Plus fin
    borderRadius: "6px",
    border: "1px solid #ddd",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: "600",
    transition: "all 0.2s",
  },
};

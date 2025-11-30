import React from "react";
import Header from "../components/Header";
import backgroundImg from "../assets/bg-spa.jpg"; // <-- Ajoute ton image dans /assets/

export default function Dashboard() {
  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundImage: `url(${backgroundImg})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <Header />

      <div style={{ padding: "30px" }}>
        <h1 style={styles.title}>Fulani Manager</h1>

        {/* ---- LES CARTES ---- */}
        <div style={styles.grid}>
          {menuItems.map((item) => (
            <div
              key={item.label}
              style={styles.card}
              onClick={() => (window.location.href = item.link)}
            >
              <span style={styles.cardIcon}>{item.icon}</span>
              <h3 style={styles.cardLabel}>{item.label}</h3>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* --- DATA --- */
const menuItems = [
  { label: "Clientes", link: "/clientes", icon: "👩‍🦰" },
  { label: "Services", link: "/services", icon: "💆‍♀️" }, // CHANGÉ
  { label: "Prestations", link: "/prestations", icon: "✨" }, // AJOUTÉ
  { label: "Produits", link: "/produits", icon: "🧴" },
  { label: "Ventes", link: "/ventes", icon: "💰" },
  { label: "Rendez-vous", link: "/rendezvous", icon: "📅" },
  { label: "Reporting", link: "/reporting", icon: "📊" },
];

/* --- STYLES INLINE --- */
const styles = {
  title: {
    color: "var(--brown-dark)",
    marginBottom: "30px",
    fontWeight: "600",
    textShadow: "1px 1px 3px rgba(0,0,0,0.2)",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "20px",
    marginTop: "20px",
  },
  card: {
    backgroundColor: "rgba(255, 255, 255, 0.85)", // un léger flou blanc
    padding: "25px",
    borderRadius: "14px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
    cursor: "pointer",
    textAlign: "center",
    backdropFilter: "blur(6px)",
    transition: "transform 0.2s, box-shadow 0.2s",
  },
  cardIcon: {
    fontSize: "32px",
    display: "block",
    marginBottom: "10px",
  },
  cardLabel: {
    fontSize: "17px",
    color: "var(--brown-dark)",
    margin: 0,
    fontWeight: "500",
  },
};

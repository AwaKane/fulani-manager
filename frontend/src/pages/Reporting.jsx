import React, { useEffect, useState } from "react";
import supabase from "../supabase/clientdb";
import Header from "../components/Header";

export default function Reporting() {
  const [stats, setStats] = useState({
    // Statistiques générales
    totalPrestations: 0,
    totalVentes: 0,
    totalSoinsRealises: 0,
    totalProduitsVendus: 0,

    // Chiffre d'affaires
    caSoins: 0,
    caProduits: 0,
    caTotal: 0,

    // Par période
    caMois: { soins: 0, produits: 0, total: 0 },
    caSemaine: { soins: 0, produits: 0, total: 0 },
    caAujourdhui: { soins: 0, produits: 0, total: 0 },
  });

  const [rapportsMensuels, setRapportsMensuels] = useState([]);
  const [topServices, setTopServices] = useState([]);
  const [topProduits, setTopProduits] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAllStats();
  }, []);

  const loadAllStats = async () => {
    await Promise.all([
      loadGeneralStats(),
      loadRapportsMensuels(),
      loadTopServices(),
      loadTopProduits(),
    ]);
    setLoading(false);
  };

  // Statistiques générales
  const loadGeneralStats = async () => {
    const now = new Date();
    const startOfDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );
    const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // 1. Prestations (Soins)
    const { data: prestations } = await supabase
      .from("prestations")
      .select("*");

    const totalPrestations = prestations?.length || 0;
    const caSoins =
      prestations?.reduce((sum, p) => sum + parseFloat(p.total || 0), 0) || 0;

    const caSoinsMois =
      prestations
        ?.filter((p) => new Date(p.date) >= startOfMonth)
        .reduce((sum, p) => sum + parseFloat(p.total || 0), 0) || 0;

    const caSoinsSemaine =
      prestations
        ?.filter((p) => new Date(p.date) >= startOfWeek)
        .reduce((sum, p) => sum + parseFloat(p.total || 0), 0) || 0;

    const caSoinsAujourdhui =
      prestations
        ?.filter((p) => new Date(p.date) >= startOfDay)
        .reduce((sum, p) => sum + parseFloat(p.total || 0), 0) || 0;

    // 2. Ventes (Produits)
    const { data: ventes } = await supabase.from("ventes").select("*");

    const totalVentes = ventes?.length || 0;
    const caProduits =
      ventes?.reduce((sum, v) => sum + parseFloat(v.montant || 0), 0) || 0;
    const totalProduitsVendus =
      ventes?.reduce((sum, v) => sum + (v.quantite || 0), 0) || 0;

    const caProduitsMois =
      ventes
        ?.filter((v) => new Date(v.date) >= startOfMonth)
        .reduce((sum, v) => sum + parseFloat(v.montant || 0), 0) || 0;

    const caProduitsSemaine =
      ventes
        ?.filter((v) => new Date(v.date) >= startOfWeek)
        .reduce((sum, v) => sum + parseFloat(v.montant || 0), 0) || 0;

    const caProduitsAujourdhui =
      ventes
        ?.filter((v) => new Date(v.date) >= startOfDay)
        .reduce((sum, v) => sum + parseFloat(v.montant || 0), 0) || 0;

    // 3. Nombre de soins réalisés
    const { data: prestationServices } = await supabase
      .from("prestation_services")
      .select("quantite");

    const totalSoinsRealises =
      prestationServices?.reduce((sum, ps) => sum + (ps.quantite || 1), 0) || 0;

    setStats({
      totalPrestations,
      totalVentes,
      totalSoinsRealises,
      totalProduitsVendus,
      caSoins,
      caProduits,
      caTotal: caSoins + caProduits,
      caMois: {
        soins: caSoinsMois,
        produits: caProduitsMois,
        total: caSoinsMois + caProduitsMois,
      },
      caSemaine: {
        soins: caSoinsSemaine,
        produits: caProduitsSemaine,
        total: caSoinsSemaine + caProduitsSemaine,
      },
      caAujourdhui: {
        soins: caSoinsAujourdhui,
        produits: caProduitsAujourdhui,
        total: caSoinsAujourdhui + caProduitsAujourdhui,
      },
    });
  };

  // Rapports mensuels (6 derniers mois)
  const loadRapportsMensuels = async () => {
    const months = [];
    const now = new Date();

    // Générer les 6 derniers mois
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const startOfMonth = new Date(d.getFullYear(), d.getMonth(), 1);
      const endOfMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0);

      // CA Soins du mois
      const { data: prestations } = await supabase
        .from("prestations")
        .select("total")
        .gte("date", startOfMonth.toISOString())
        .lte("date", endOfMonth.toISOString());

      const caSoins =
        prestations?.reduce((sum, p) => sum + parseFloat(p.total || 0), 0) || 0;

      // CA Produits du mois
      const { data: ventes } = await supabase
        .from("ventes")
        .select("montant")
        .gte("date", startOfMonth.toISOString())
        .lte("date", endOfMonth.toISOString());

      const caProduits =
        ventes?.reduce((sum, v) => sum + parseFloat(v.montant || 0), 0) || 0;

      months.push({
        mois: d.toLocaleDateString("fr-FR", {
          month: "short",
          year: "numeric",
        }),
        caSoins,
        caProduits,
        caTotal: caSoins + caProduits,
      });
    }

    setRapportsMensuels(months);
  };

  // Top 5 services
  const loadTopServices = async () => {
    const { data } = await supabase.from("prestation_services").select(
      `
        *,
        services (nom)
      `
    );

    if (!data) return;

    // Grouper par service
    const grouped = data.reduce((acc, ps) => {
      const nom = ps.services?.nom || "Service supprimé";
      const existing = acc.find((a) => a.nom === nom);

      if (existing) {
        existing.quantite += ps.quantite || 1;
        existing.ca += parseFloat(ps.prix || 0) * (ps.quantite || 1);
      } else {
        acc.push({
          nom,
          quantite: ps.quantite || 1,
          ca: parseFloat(ps.prix || 0) * (ps.quantite || 1),
        });
      }
      return acc;
    }, []);

    const top = grouped.sort((a, b) => b.quantite - a.quantite).slice(0, 5);
    setTopServices(top);
  };

  // Top 5 produits
  const loadTopProduits = async () => {
    const { data } = await supabase.from("ventes").select(
      `
        *,
        produits (nom)
      `
    );

    if (!data) return;

    // Grouper par produit
    const grouped = data.reduce((acc, v) => {
      const nom = v.produits?.nom || "Produit supprimé";
      const existing = acc.find((a) => a.nom === nom);

      if (existing) {
        existing.quantite += v.quantite || 1;
        existing.ca += parseFloat(v.montant || 0);
      } else {
        acc.push({
          nom,
          quantite: v.quantite || 1,
          ca: parseFloat(v.montant || 0),
        });
      }
      return acc;
    }, []);

    const top = grouped.sort((a, b) => b.ca - a.ca).slice(0, 5);
    setTopProduits(top);
  };

  if (loading) {
    return (
      <>
        <Header />
        <div style={{ padding: "30px" }}>Chargement...</div>
      </>
    );
  }

  return (
    <>
      <Header />

      <div style={{ padding: "30px" }}>
        <h1 style={styles.title}>📊 Reporting</h1>

        {/* CA par période */}
        <div style={styles.periodSection}>
          <h2 style={styles.sectionTitle}>💰 Chiffre d'affaires</h2>

          <div style={styles.periodGrid}>
            <PeriodCard
              label="Aujourd'hui"
              icon="⏰"
              soins={stats.caAujourdhui.soins}
              produits={stats.caAujourdhui.produits}
              total={stats.caAujourdhui.total}
            />
            <PeriodCard
              label="Cette semaine"
              icon="📆"
              soins={stats.caSemaine.soins}
              produits={stats.caSemaine.produits}
              total={stats.caSemaine.total}
            />
            <PeriodCard
              label="Ce mois"
              icon="📅"
              soins={stats.caMois.soins}
              produits={stats.caMois.produits}
              total={stats.caMois.total}
            />
            <PeriodCard
              label="Total"
              icon="💎"
              soins={stats.caSoins}
              produits={stats.caProduits}
              total={stats.caTotal}
              highlight
            />
          </div>
        </div>

        {/* Statistiques rapides */}
        <div style={styles.statsGrid}>
          <StatCard
            icon="💅"
            label="Prestations"
            value={stats.totalPrestations}
            subtitle={`${stats.totalSoinsRealises} soins réalisés`}
            color="#ec4899"
          />
          <StatCard
            icon="🧴"
            label="Ventes produits"
            value={stats.totalVentes}
            subtitle={`${stats.totalProduitsVendus} produits vendus`}
            color="#8b5cf6"
          />
        </div>

        {/* Évolution mensuelle */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>
            📈 Évolution mensuelle (6 derniers mois)
          </h2>

          {rapportsMensuels.length === 0 ? (
            <p style={styles.noData}>Aucune donnée disponible</p>
          ) : (
            <>
              {/* Graphique */}
              <div style={styles.chartContainer}>
                {rapportsMensuels.map((r, i) => {
                  const maxCa = Math.max(
                    ...rapportsMensuels.map((rm) => rm.caTotal)
                  );
                  const heightTotal = maxCa > 0 ? (r.caTotal / maxCa) * 100 : 0;
                  const heightSoins = maxCa > 0 ? (r.caSoins / maxCa) * 100 : 0;
                  const heightProduits =
                    maxCa > 0 ? (r.caProduits / maxCa) * 100 : 0;

                  return (
                    <div key={i} style={styles.barWrapper}>
                      <div style={styles.barStack}>
                        <div
                          style={{
                            ...styles.barSegment,
                            height: `${heightSoins}%`,
                            backgroundColor: "#ec4899",
                          }}
                          title={`Soins: ${r.caSoins.toLocaleString()} FCFA`}
                        />
                        <div
                          style={{
                            ...styles.barSegment,
                            height: `${heightProduits}%`,
                            backgroundColor: "#8b5cf6",
                          }}
                          title={`Produits: ${r.caProduits.toLocaleString()} FCFA`}
                        />
                      </div>
                      <span style={styles.barLabel}>{r.mois}</span>
                      <span style={styles.barValue}>
                        {(r.caTotal / 1000).toFixed(0)}k
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Légende */}
              <div style={styles.legend}>
                <div style={styles.legendItem}>
                  <div
                    style={{
                      ...styles.legendColor,
                      backgroundColor: "#ec4899",
                    }}
                  />
                  <span>Soins</span>
                </div>
                <div style={styles.legendItem}>
                  <div
                    style={{
                      ...styles.legendColor,
                      backgroundColor: "#8b5cf6",
                    }}
                  />
                  <span>Produits</span>
                </div>
              </div>

              {/* Tableau détaillé */}
              <table style={styles.monthlyTable}>
                <thead>
                  <tr>
                    <th>Mois</th>
                    <th>CA Soins</th>
                    <th>CA Produits</th>
                    <th>CA Total</th>
                  </tr>
                </thead>
                <tbody>
                  {rapportsMensuels.map((r, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight: "600" }}>{r.mois}</td>
                      <td style={{ color: "#ec4899", fontWeight: "600" }}>
                        {r.caSoins.toLocaleString()} FCFA
                      </td>
                      <td style={{ color: "#8b5cf6", fontWeight: "600" }}>
                        {r.caProduits.toLocaleString()} FCFA
                      </td>
                      <td style={{ fontWeight: "700", color: "var(--brown)" }}>
                        {r.caTotal.toLocaleString()} FCFA
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </div>

        {/* Top services et produits */}
        <div style={styles.twoColumns}>
          {/* Top Services */}
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>🏆 Top 5 Services</h2>
            {topServices.length === 0 ? (
              <p style={styles.noData}>Aucune donnée</p>
            ) : (
              <div style={styles.topList}>
                {topServices.map((s, i) => (
                  <div key={i} style={styles.topItem}>
                    <span
                      style={{ ...styles.topRank, backgroundColor: "#ec4899" }}
                    >
                      {i + 1}
                    </span>
                    <div style={styles.topInfo}>
                      <p style={styles.topName}>{s.nom}</p>
                      <p style={styles.topStats}>
                        {s.quantite} réalisés • {s.ca.toLocaleString()} FCFA
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Top Produits */}
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>🏆 Top 5 Produits</h2>
            {topProduits.length === 0 ? (
              <p style={styles.noData}>Aucune donnée</p>
            ) : (
              <div style={styles.topList}>
                {topProduits.map((p, i) => (
                  <div key={i} style={styles.topItem}>
                    <span
                      style={{ ...styles.topRank, backgroundColor: "#8b5cf6" }}
                    >
                      {i + 1}
                    </span>
                    <div style={styles.topInfo}>
                      <p style={styles.topName}>{p.nom}</p>
                      <p style={styles.topStats}>
                        {p.quantite} vendus • {p.ca.toLocaleString()} FCFA
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// Composant PeriodCard
const PeriodCard = ({ label, icon, soins, produits, total, highlight }) => (
  <div
    style={{
      ...styles.periodCard,
      ...(highlight && styles.periodCardHighlight),
    }}
  >
    <div style={styles.periodHeader}>
      <span style={styles.periodIcon}>{icon}</span>
      <span style={styles.periodLabel}>{label}</span>
    </div>
    <div style={styles.periodTotal}>{total.toLocaleString()} FCFA</div>
    <div style={styles.periodDetails}>
      <div style={styles.periodDetail}>
        <span style={styles.periodDetailLabel}>💅 Soins</span>
        <span style={styles.periodDetailValue}>{soins.toLocaleString()}</span>
      </div>
      <div style={styles.periodDetail}>
        <span style={styles.periodDetailLabel}>🧴 Produits</span>
        <span style={styles.periodDetailValue}>
          {produits.toLocaleString()}
        </span>
      </div>
    </div>
  </div>
);

// Composant StatCard
const StatCard = ({ icon, label, value, subtitle, color }) => (
  <div style={{ ...styles.statCard, borderLeft: `4px solid ${color}` }}>
    <div style={styles.statIcon}>{icon}</div>
    <div>
      <p style={styles.statLabel}>{label}</p>
      <p style={styles.statValue}>{value}</p>
      <p style={styles.statSubtitle}>{subtitle}</p>
    </div>
  </div>
);

const styles = {
  title: {
    color: "var(--brown-dark)",
    marginBottom: "30px",
  },
  periodSection: {
    marginBottom: "30px",
  },
  sectionTitle: {
    color: "var(--brown-dark)",
    fontSize: "20px",
    marginBottom: "20px",
  },
  periodGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: "20px",
  },
  periodCard: {
    backgroundColor: "white",
    padding: "20px",
    borderRadius: "12px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
  },
  periodCardHighlight: {
    background: "linear-gradient(135deg, var(--gold) 0%, var(--brown) 100%)",
    color: "white",
  },
  periodHeader: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginBottom: "15px",
  },
  periodIcon: {
    fontSize: "24px",
  },
  periodLabel: {
    fontSize: "14px",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  periodTotal: {
    fontSize: "28px",
    fontWeight: "bold",
    marginBottom: "15px",
  },
  periodDetails: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    fontSize: "13px",
    opacity: 0.9,
  },
  periodDetail: {
    display: "flex",
    justifyContent: "space-between",
  },
  periodDetailLabel: {
    fontWeight: "500",
  },
  periodDetailValue: {
    fontWeight: "700",
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "20px",
    marginBottom: "30px",
  },
  statCard: {
    backgroundColor: "white",
    padding: "20px",
    borderRadius: "12px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
    display: "flex",
    alignItems: "center",
    gap: "15px",
  },
  statIcon: {
    fontSize: "36px",
  },
  statLabel: {
    margin: "0 0 5px 0",
    fontSize: "13px",
    color: "#999",
    fontWeight: "600",
    textTransform: "uppercase",
  },
  statValue: {
    margin: "0 0 5px 0",
    fontSize: "28px",
    fontWeight: "bold",
    color: "var(--brown-dark)",
  },
  statSubtitle: {
    margin: 0,
    fontSize: "12px",
    color: "#666",
  },
  section: {
    backgroundColor: "white",
    padding: "25px",
    borderRadius: "12px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
    marginBottom: "30px",
  },
  chartContainer: {
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "space-around",
    height: "280px",
    padding: "20px 0",
    marginBottom: "20px",
    borderBottom: "2px solid #eee",
  },
  barWrapper: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "8px",
    flex: 1,
    maxWidth: "80px",
  },
  barStack: {
    width: "100%",
    height: "100%",
    display: "flex",
    flexDirection: "column-reverse",
    gap: "2px",
  },
  barSegment: {
    width: "100%",
    borderRadius: "4px 4px 0 0",
    transition: "height 0.3s",
    minHeight: "2px",
  },
  barLabel: {
    fontSize: "12px",
    color: "#666",
    fontWeight: "600",
  },
  barValue: {
    fontSize: "13px",
    color: "var(--brown)",
    fontWeight: "700",
  },
  legend: {
    display: "flex",
    justifyContent: "center",
    gap: "30px",
    marginBottom: "25px",
  },
  legendItem: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "14px",
    fontWeight: "600",
  },
  legendColor: {
    width: "20px",
    height: "20px",
    borderRadius: "4px",
  },
  monthlyTable: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: "14px",
  },
  twoColumns: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "30px",
  },
  topList: {
    display: "flex",
    flexDirection: "column",
    gap: "15px",
  },
  topItem: {
    display: "flex",
    alignItems: "center",
    gap: "15px",
    padding: "15px",
    backgroundColor: "#f9f9f9",
    borderRadius: "8px",
  },
  topRank: {
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    color: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "bold",
    fontSize: "18px",
  },
  topInfo: {
    flex: 1,
  },
  topName: {
    margin: "0 0 5px 0",
    fontSize: "15px",
    fontWeight: "600",
    color: "var(--brown-dark)",
  },
  topStats: {
    margin: 0,
    fontSize: "13px",
    color: "#666",
  },
  noData: {
    textAlign: "center",
    color: "#999",
    padding: "30px",
  },
};

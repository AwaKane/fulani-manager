import React, { useEffect, useState } from "react";
import supabase from "../supabase/clientdb";
import Header from "../components/Header";
import { Link, useNavigate } from "react-router-dom";

export default function Soins() {
  const [soins, setSoins] = useState([]);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  const fetchSoins = async () => {
    const { data, error } = await supabase
      .from("soins")
      .select(
        `
        id,
        date,
        service_name,
        prix,
        praticien,
        notes,
        clients:client_id ( nom, prenom )
      `
      )
      .order("date", { ascending: false });

    if (error) console.log(error);
    else setSoins(data);
  };

  useEffect(() => {
    fetchSoins();
  }, []);

  const filteredSoins = soins.filter((s) => {
    const query = search.toLowerCase();
    return (
      s.service_name.toLowerCase().includes(query) ||
      s.praticien?.toLowerCase().includes(query) ||
      s.clients?.nom.toLowerCase().includes(query) ||
      s.clients?.prenom.toLowerCase().includes(query) ||
      s.date.toLowerCase().includes(query)
    );
  });

  return (
    <>
      <Header />

      <div style={{ padding: "30px" }}>
        <h1 style={{ color: "var(--brown-dark)" }}>Soins</h1>

        {/* Recherche + bouton */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: "20px",
            gap: "10px",
          }}
        >
          <input
            type="text"
            placeholder="Rechercher (cliente, soin, praticien...)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              padding: "10px 15px",
              width: "100%",
              borderRadius: "8px",
              border: "1px solid #ccc",
            }}
          />

          <button
            onClick={() => navigate("/soins/new")}
            style={{
              backgroundColor: "var(--brown-dark)",
              color: "white",
              padding: "10px 20px",
              borderRadius: "8px",
              border: "none",
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            + Nouveau soin
          </button>
        </div>

        {/* Liste des soins */}
        <div
          style={{
            background: "white",
            padding: "20px",
            borderRadius: "12px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          }}
        >
          {filteredSoins.length === 0 ? (
            <p>Aucun soin trouvé.</p>
          ) : (
            filteredSoins.map((soin) => (
              <div
                key={soin.id}
                style={{
                  borderBottom: "1px solid #eee",
                  padding: "15px 0",
                }}
              >
                <h3 style={{ margin: "0", color: "var(--brown-dark)" }}>
                  {soin.service_name} — {soin.prix} FCFA
                </h3>

                <p style={{ margin: "5px 0" }}>
                  Cliente :{" "}
                  <strong>
                    {soin.clients?.prenom} {soin.clients?.nom}
                  </strong>
                </p>

                <p style={{ margin: "5px 0" }}>
                  Date : {new Date(soin.date).toLocaleDateString()}
                </p>

                {soin.praticien && (
                  <p style={{ margin: "5px 0" }}>
                    Praticien : <strong>{soin.praticien}</strong>
                  </p>
                )}

                {soin.notes && (
                  <p style={{ marginTop: "5px", fontStyle: "italic" }}>
                    Notes : {soin.notes}
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}

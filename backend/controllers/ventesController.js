// controllers/ventesController.js
import { supabase } from "../config/db.js";

// Create vente
export const createVente = async (req, res) => {
  try {
    const { type, produit_id, soin_id, quantite, montant, remarque } = req.body;

    if (!type || !montant) {
      return res.status(400).json({ error: "type et montant sont requis" });
    }

    const { data, error } = await supabase
      .from("ventes")
      .insert([
        {
          type,
          produit_id: produit_id || null,
          soin_id: soin_id || null,
          quantite: quantite || 1,
          montant,
          remarque: remarque || null,
        },
      ])
      .select();

    if (error) throw error;

    res.status(201).json(data[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get all ventes
export const getAllVentes = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("ventes")
      .select("*")
      .order("date", { ascending: false });

    if (error) throw error;

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get vente by id
export const getVenteById = async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from("ventes")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update vente
export const updateVente = async (req, res) => {
  try {
    const { id } = req.params;
    const { type, produit_id, soin_id, quantite, montant, remarque } = req.body;

    const { data, error } = await supabase
      .from("ventes")
      .update({
        type,
        produit_id: produit_id || null,
        soin_id: soin_id || null,
        quantite,
        montant,
        remarque,
      })
      .eq("id", id)
      .select();

    if (error) throw error;

    res.json(data[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete vente
export const deleteVente = async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase.from("ventes").delete().eq("id", id);

    if (error) throw error;

    res.json({ message: "Vente supprimée avec succès" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

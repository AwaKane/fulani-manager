// controllers/produitsController.js
import { supabase } from "../config/db.js";

// ➤ GET tous les produits
export const getProduits = async (req, res) => {
  const { data, error } = await supabase
    .from("produits")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
};

// ➤ GET produit par ID
export const getProduit = async (req, res) => {
  const { id } = req.params;

  const { data, error } = await supabase
    .from("produits")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return res.status(404).json({ error: "Produit non trouvé" });
  res.json(data);
};

// ➤ CREATE produit
export const createProduit = async (req, res) => {
  const { nom, sku, description, prix, quantite, seuil_alerte } = req.body;

  const { data, error } = await supabase
    .from("produits")
    .insert([{ nom, sku, description, prix, quantite, seuil_alerte }])
    .select();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data[0]);
};

// ➤ UPDATE produit
export const updateProduit = async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  const { data, error } = await supabase
    .from("produits")
    .update(updates)
    .eq("id", id)
    .select();

  if (error) return res.status(500).json({ error: error.message });
  if (!data.length)
    return res.status(404).json({ error: "Produit non trouvé" });

  res.json(data[0]);
};

// ➤ DELETE produit
export const deleteProduit = async (req, res) => {
  const { id } = req.params;

  const { error } = await supabase.from("produits").delete().eq("id", id);

  if (error) return res.status(500).json({ error: error.message });

  res.json({ message: "Produit supprimé" });
};

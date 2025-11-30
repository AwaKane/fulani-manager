// controllers/soinsController.js
import { supabase } from "../config/db.js";

// ➤ GET : tous les soins enregistrés
export const getSoins = async (req, res) => {
  const { data, error } = await supabase
    .from("soins")
    .select("*, clients(nom)")
    .order("date", { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
};

// ➤ GET : soins d’un client spécifique
export const getSoinsByClient = async (req, res) => {
  const { client_id } = req.params;

  const { data, error } = await supabase
    .from("soins")
    .select("*")
    .eq("client_id", client_id)
    .order("date", { ascending: false });

  if (error) return res.status(404).json({ error: error.message });
  res.json(data);
};

// ➤ CREATE : enregistrer un soin effectué
export const addSoin = async (req, res) => {
  const payload = req.body; // { client_id, service_name, prix, praticien, notes }

  const { data, error } = await supabase
    .from("soins")
    .insert([payload])
    .select();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data[0]);
};

// ➤ UPDATE : modifier un soin
export const updateSoin = async (req, res) => {
  const { id } = req.params;
  const payload = req.body;

  const { data, error } = await supabase
    .from("soins")
    .update(payload)
    .eq("id", id)
    .select();

  if (error) return res.status(400).json({ error: error.message });
  res.json(data[0]);
};

// ➤ DELETE : effacer un soin de l’historique
export const deleteSoin = async (req, res) => {
  const { id } = req.params;

  const { error } = await supabase.from("soins").delete().eq("id", id);

  if (error) return res.status(400).json({ error: error.message });
  res.json({ message: "Soin supprimé" });
};

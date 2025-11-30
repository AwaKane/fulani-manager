// backend/controllers/clientController.js
import { supabase } from "../config/db.js";

// GET /api/clients
export const getClients = async (req, res) => {
  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
};

// GET /api/clients/:id
export const getClientById = async (req, res) => {
  const { id } = req.params;
  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .eq("id", id)
    .single();
  if (error) return res.status(404).json({ error: error.message });
  res.json(data);
};

// POST /api/clients
export const addClient = async (req, res) => {
  const payload = req.body;
  const { data, error } = await supabase
    .from("clients")
    .insert([payload])
    .select();
  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json(data[0]);
};

// PUT /api/clients/:id
export const updateClient = async (req, res) => {
  const { id } = req.params;
  const payload = req.body;
  const { data, error } = await supabase
    .from("clients")
    .update(payload)
    .eq("id", id)
    .select();
  if (error) return res.status(400).json({ error: error.message });
  res.json(data[0]);
};

// DELETE /api/clients/:id
export const deleteClient = async (req, res) => {
  const { id } = req.params;
  const { error } = await supabase.from("clients").delete().eq("id", id);
  if (error) return res.status(400).json({ error: error.message });
  res.json({ message: "Client supprimé" });
};

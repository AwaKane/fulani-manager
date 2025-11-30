import { supabase } from "../config/db.js";

// Get all rendez-vous
export const getRendezvous = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("rendezvous")
      .select("*")
      .order("date_rdv", { ascending: true })
      .order("heure", { ascending: true });

    if (error) throw error;

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get one rendez-vous by ID
export const getRendezvousById = async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from("rendezvous")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Create a new rendez-vous
export const createRendezvous = async (req, res) => {
  try {
    const {
      nom_client,
      numero_client,
      soins,
      date_rdv,
      heure,
      acompte,
      nombre_personnes,
    } = req.body;

    const { data, error } = await supabase
      .from("rendezvous")
      .insert([
        {
          nom_client,
          numero_client,
          soins,
          date_rdv,
          heure,
          acompte,
          nombre_personnes,
        },
      ])
      .select();

    if (error) throw error;

    res.status(201).json(data[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update rendez-vous
export const updateRendezvous = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const { data, error } = await supabase
      .from("rendezvous")
      .update(updateData)
      .eq("id", id)
      .select();

    if (error) throw error;

    res.json(data[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete rendez-vous
export const deleteRendezvous = async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase.from("rendezvous").delete().eq("id", id);

    if (error) throw error;

    res.json({ message: "Rendez-vous supprimé" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

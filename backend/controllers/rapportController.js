// controllers/rapportController.js
import { supabase } from "../config/db.js";

// ➤ Get monthly reports (tous les mois)
export const getMonthlyReports = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("rapports_mensuels")
      .select("*")
      .order("month", { ascending: false });

    if (error) throw error;

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ➤ Get report for a specific month (ex: 2025-02)
export const getMonthlyReportByMonth = async (req, res) => {
  try {
    const { month } = req.params; // format: YYYY-MM

    const formattedMonth = `${month}-01`; // La vue retourne YYYY-MM-01

    const { data, error } = await supabase
      .from("rapports_mensuels")
      .select("*")
      .eq("month", formattedMonth)
      .single();

    if (error) throw error;

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

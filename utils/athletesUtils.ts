// athletesUtils.ts
import { supabase } from "./supabaseClient";

export const filterAthletesByTeam = (
  team: string,
  setSelectedTeam: (team: string) => void
) => {
  setSelectedTeam(team);
};

export const fetchAthletes = async (setAthletes: (athletes: any[]) => void) => {
  try {
    const { data, error } = await supabase.from("athletes").select("*");

    if (error) {
      throw error;
    }

    setAthletes(data || []);
  } catch (error) {
    console.error("Error fetching athletes:", error);
  }
};

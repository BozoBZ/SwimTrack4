import React, { useState } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { supabase } from "../../utils/supabaseClient";
import Ionicons from "@expo/vector-icons/Ionicons";

interface Athlete {
  fincode: number;
  name: string;
  photo?: string;
  presenze: number;
  giustificate: number;
  total_sessions: number;
  percent: number;
}

export default function StatsScreen() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [season, setSeason] = useState<string>("2025-26");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [athleteGroupFilter, setAthleteGroupFilter] = useState<string>("all");

  // Export function placeholder for React Native
  const exportToExcel = () => {
    if (athletes.length === 0) {
      Alert.alert("No Data", "No data to export. Please run a filter first.");
      return;
    }

    // In a real React Native app, you would use a library like react-native-fs
    // or expo-file-system to export data
    Alert.alert(
      "Export",
      "Export functionality would be implemented here using react-native-fs or similar library."
    );
  };

  // Fetch attendance summary using the get_attendance_stats_by_season function
  const handleFilter = async () => {
    setLoading(true);
    setError(null);

    let typeParam = typeFilter === "all" ? null : typeFilter;
    let groupParam = athleteGroupFilter === "all" ? null : athleteGroupFilter;

    try {
      // Debug logging
      console.log("Calling function with parameters:", {
        season: season,
        session_type: typeParam,
        group_name: groupParam,
      });

      // Call the get_attendance_stats_by_season function
      let query = supabase.rpc("get_attendance_stats_by_season", {
        season: season,
        session_type: typeParam,
        group_name: groupParam,
      });

      // Order by percent desc
      query = query.order("percent", { ascending: false });
      const { data, error } = await query;

      if (error) {
        setError(error.message);
        setAthletes([]);
      } else {
        setAthletes(data || []);
      }
    } catch (err: any) {
      setError(err.message || "Unknown error");
      setAthletes([]);
    }
    setLoading(false);
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Attendance Summary</Text>

      <View style={styles.filterContainer}>
        <View style={styles.filterRow}>
          <Text style={styles.label}>Season:</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={season}
              onValueChange={setSeason}
              style={styles.picker}
            >
              <Picker.Item label="2023-24" value="2023-24" />
              <Picker.Item label="2024-25" value="2024-25" />
              <Picker.Item label="2025-26" value="2025-26" />
            </Picker>
          </View>
        </View>

        <View style={styles.filterRow}>
          <Text style={styles.label}>Type:</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={typeFilter}
              onValueChange={setTypeFilter}
              style={styles.picker}
            >
              <Picker.Item label="All" value="all" />
              <Picker.Item label="Swim" value="Swim" />
              <Picker.Item label="Gym" value="Gym" />
            </Picker>
          </View>
        </View>

        <View style={styles.filterRow}>
          <Text style={styles.label}>Group:</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={athleteGroupFilter}
              onValueChange={setAthleteGroupFilter}
              style={styles.picker}
            >
              <Picker.Item label="All" value="all" />
              <Picker.Item label="ASS" value="ASS" />
              <Picker.Item label="EA" value="EA" />
              <Picker.Item label="EB" value="EB" />
              <Picker.Item label="PROP" value="PROP" />
            </Picker>
          </View>
        </View>

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={styles.filterButton}
            onPress={handleFilter}
            disabled={loading}
          >
            <Ionicons name="filter" size={20} color="#fff" />
            <Text style={styles.buttonText}>
              {loading ? "Loading..." : "Filter"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.exportButton,
              { opacity: athletes.length === 0 ? 0.5 : 1 },
            ]}
            onPress={exportToExcel}
            disabled={loading || athletes.length === 0}
          >
            <Ionicons name="download" size={20} color="#fff" />
            <Text style={styles.buttonText}>Export</Text>
          </TouchableOpacity>
        </View>
      </View>

      {error && <Text style={styles.errorText}>Error: {error}</Text>}

      {loading ? (
        <ActivityIndicator
          size="large"
          color="#007AFF"
          style={styles.loadingIndicator}
        />
      ) : (
        <>
          <Text style={styles.groupTitle}>
            Group: {athleteGroupFilter === "all" ? "All" : athleteGroupFilter}
          </Text>

          <View style={styles.tableContainer}>
            <View style={styles.tableHeader}>
              <Text style={styles.tableHeaderCell}>Ph</Text>
              <Text style={styles.tableHeaderCell}>Name</Text>
              <Text style={styles.tableHeaderCell}>P</Text>
              <Text style={styles.tableHeaderCell}>J</Text>
              <Text style={styles.tableHeaderCell}>T</Text>
              <Text style={styles.tableHeaderCell}>%</Text>
            </View>

            {athletes.length === 0 ? (
              <View style={styles.noDataContainer}>
                <Text style={styles.noDataText}>
                  No data available for the selected filters
                </Text>
              </View>
            ) : (
              athletes.map((ath, idx) => (
                <View key={ath.fincode || idx} style={styles.tableRow}>
                  <View style={styles.portraitCell}>
                    {ath.photo ? (
                      <Image
                        source={{ uri: ath.photo }}
                        style={styles.portrait}
                        onError={() => {}}
                      />
                    ) : (
                      <Image
                        source={{
                          uri: `https://ui-avatars.com/api/?name=${encodeURIComponent(
                            ath.name || "Avatar"
                          )}&background=cccccc&color=ffffff&size=50`,
                        }}
                        style={styles.portrait}
                      />
                    )}
                  </View>
                  <Text style={styles.tableCell}>{ath.name}</Text>
                  <Text style={styles.tableCell}>{ath.presenze}</Text>
                  <Text style={styles.tableCell}>{ath.giustificate}</Text>
                  <Text style={styles.tableCell}>{ath.total_sessions}</Text>
                  <Text style={styles.tableCell}>
                    {ath.percent != null ? ath.percent.toFixed(1) + "%" : ""}
                  </Text>
                </View>
              ))
            )}
          </View>

          {athletes.length > 0 && (
            <View style={styles.summaryContainer}>
              <Text style={styles.summaryText}>
                Showing {athletes.length} athletes
              </Text>
              <Text style={styles.noteText}>
                Note: Attendance percentages are calculated based on total
                sessions in the selected period
              </Text>
            </View>
          )}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f0f0f0",
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 20,
    textAlign: "center",
  },
  filterContainer: {
    backgroundColor: "#ffffff",
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  filterRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    width: 80,
  },
  pickerContainer: {
    flex: 1,
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    marginLeft: 10,
  },
  picker: {
    height: 50,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  filterButton: {
    backgroundColor: "#007AFF",
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    flex: 1,
    marginRight: 10,
    justifyContent: "center",
  },
  exportButton: {
    backgroundColor: "#28a745",
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    flex: 1,
    justifyContent: "center",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    marginLeft: 8,
  },
  errorText: {
    color: "red",
    fontSize: 16,
    textAlign: "center",
    marginVertical: 10,
    backgroundColor: "#ffebee",
    padding: 10,
    borderRadius: 8,
  },
  loadingIndicator: {
    marginTop: 50,
  },
  groupTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
    marginBottom: 15,
  },
  tableContainer: {
    backgroundColor: "#ffffff",
    borderRadius: 10,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#007AFF",
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  tableHeaderCell: {
    flex: 1,
    color: "#fff",
    fontWeight: "bold",
    textAlign: "center",
    fontSize: 12,
  },
  tableRow: {
    flexDirection: "row",
    backgroundColor: "#ffffff",
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    alignItems: "center",
  },
  tableCell: {
    flex: 1,
    color: "#333",
    textAlign: "center",
    fontSize: 12,
  },
  portraitCell: {
    flex: 1,
    alignItems: "center",
  },
  portrait: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#ccc",
  },
  noDataContainer: {
    padding: 40,
    alignItems: "center",
  },
  noDataText: {
    color: "#666",
    fontSize: 16,
    textAlign: "center",
  },
  summaryContainer: {
    marginTop: 20,
    padding: 15,
    backgroundColor: "#ffffff",
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  summaryText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  noteText: {
    fontSize: 14,
    color: "#666",
    fontStyle: "italic",
  },
});

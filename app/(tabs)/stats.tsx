import React, { useState } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  ScrollView,
  Image,
  TextInput,
  TouchableOpacity,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { supabase } from "../../utils/supabaseClient";

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
  const [period, setPeriod] = useState<string>("season");
  const [customStart, setCustomStart] = useState<string>("");
  const [customEnd, setCustomEnd] = useState<string>("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [athleteGroupFilter, setAthleteGroupFilter] = useState<string>("all");

  const handleFilter = async () => {
    setLoading(true);
    setError(null);
    let groupParam = athleteGroupFilter === "all" ? null : athleteGroupFilter;
    let startDate = "";
    let endDate = "";
    if (period === "season") {
      startDate = "2024-09-01";
      endDate = "2025-08-31";
    } else if (period === "month") {
      const now = new Date();
      startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        .toISOString()
        .slice(0, 10);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0)
        .toISOString()
        .slice(0, 10);
    } else if (period === "custom" && customStart && customEnd) {
      startDate = customStart;
      endDate = customEnd;
    }
    let typeParam = typeFilter === "all" ? null : typeFilter;
    try {
      let query = supabase.rpc("riepilogo_presenze", {
        gruppo: groupParam,
        start_date: startDate,
        end_date: endDate,
        session_type: typeParam,
      });
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
      <Text style={styles.title}>Attendance Filter</Text>
      <View style={styles.filterRow}>
        <Text style={styles.label}>Select period:</Text>
        <Picker
          selectedValue={period}
          style={styles.picker}
          onValueChange={setPeriod}
        >
          <Picker.Item
            label="Season (01.09.2024 - 31.08.2025)"
            value="season"
          />
          <Picker.Item label="Current Month" value="month" />
          <Picker.Item label="Custom Range" value="custom" />
        </Picker>
        {period === "custom" && (
          <View style={styles.customDateRow}>
            <Text style={styles.label}>From:</Text>
            <TextInput
              style={styles.input}
              value={customStart}
              onChangeText={setCustomStart}
              placeholder="YYYY-MM-DD"
            />
            <Text style={styles.label}>To:</Text>
            <TextInput
              style={styles.input}
              value={customEnd}
              onChangeText={setCustomEnd}
              placeholder="YYYY-MM-DD"
            />
          </View>
        )}
        <Text style={styles.label}>Filter Type:</Text>
        <Picker
          selectedValue={typeFilter}
          style={styles.picker}
          onValueChange={setTypeFilter}
        >
          <Picker.Item label="All" value="all" />
          <Picker.Item label="Swim" value="Swim" />
          <Picker.Item label="Gym" value="Gym" />
        </Picker>

        <Text style={styles.label}>Filter Group:</Text>
        <Picker
          selectedValue={athleteGroupFilter}
          style={styles.picker}
          onValueChange={setAthleteGroupFilter}
        >
          <Picker.Item label="All" value="all" />
          <Picker.Item label="ASS" value="ASS" />
          <Picker.Item label="EA" value="EA" />
          <Picker.Item label="EB" value="EB" />
          <Picker.Item label="PROP" value="PROP" />
        </Picker>
        <TouchableOpacity
          style={styles.button}
          onPress={handleFilter}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? "Filtering..." : "Filter"}
          </Text>
        </TouchableOpacity>
      </View>
      {error && <Text style={styles.errorText}>Error: {error}</Text>}
      <Text style={styles.title}>
        Group: {athleteGroupFilter === "all" ? "All" : athleteGroupFilter}
      </Text>
      <View style={styles.tableHeader}>
        <Text style={styles.tableHeaderCell}>Port</Text>
        <Text style={styles.tableHeaderCell}>Name</Text>
        <Text style={styles.tableHeaderCell}>Percent</Text>
      </View>
      {loading ? (
        <ActivityIndicator
          size="large"
          color="#ffd33d"
          style={{ marginTop: 20 }}
        />
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
            <Text style={styles.tableCell}>
              {ath.percent != null ? ath.percent.toFixed(1) + "%" : ""}
            </Text>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#25292e",
    padding: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#ffd33d",
    marginVertical: 10,
    textAlign: "center",
  },
  filterRow: {
    backgroundColor: "#333",
    borderRadius: 8,
    padding: 10,
    marginBottom: 16,
  },
  label: {
    color: "#fff",
    marginTop: 8,
  },
  picker: {
    color: "#fff",
    backgroundColor: "#444",
    marginVertical: 4,
  },
  input: {
    backgroundColor: "#fff",
    borderRadius: 4,
    padding: 6,
    marginHorizontal: 4,
    minWidth: 100,
  },
  customDateRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 8,
  },
  button: {
    backgroundColor: "#ffd33d",
    borderRadius: 6,
    padding: 10,
    marginTop: 12,
    alignItems: "center",
  },
  buttonText: {
    color: "#25292e",
    fontWeight: "bold",
  },
  errorText: {
    color: "red",
    marginVertical: 8,
    textAlign: "center",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#444",
    borderRadius: 6,
    marginTop: 20,
    padding: 6,
  },
  tableHeaderCell: {
    flex: 1,
    color: "#ffd33d",
    fontWeight: "bold",
    textAlign: "center",
  },
  tableRow: {
    flexDirection: "row",
    backgroundColor: "#333",
    borderRadius: 6,
    marginTop: 6,
    padding: 6,
    alignItems: "center",
  },
  tableCell: {
    flex: 1,
    color: "#fff",
    textAlign: "center",
  },
  portraitCell: {
    flex: 1,
    alignItems: "center",
  },
  portrait: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 10,
    backgroundColor: "#ccc",
  },
});

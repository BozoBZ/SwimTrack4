import {
  StyleSheet,
  View,
  Text,
  TextInput,
  Button,
  FlatList,
  Image,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { format } from "date-fns";
import React, { useState, useEffect } from "react";
import { supabase } from "../../utils/supabaseClient";
import Ionicons from "@expo/vector-icons/Ionicons";

interface Athlete {
  fincode?: number;
  name: string;
  photo?: string;
  birthdate?: string;
  gender?: string;
  email?: string;
  phone?: string;
  active?: boolean;
  groups?: string;
  [key: string]: any; // Allow additional properties from rosters
}

// Interface for season data
interface Season {
  seasonid: number;
  description: string;
  seasonstart: string;
  seasonend: string;
}

const AthletesScreen = () => {
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [filteredAthletes, setFilteredAthletes] = useState<Athlete[]>([]);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [selectedSeason, setSelectedSeason] = useState<string>("");
  const [selectedGroup, setSelectedGroup] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [seasonsLoading, setSeasonsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedAthlete, setSelectedAthlete] = useState<Athlete | null>(null);
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());

  const groupOptions = [
    { label: "Select a group...", value: "" },
    { label: "ASS", value: "ASS" },
    { label: "EA", value: "EA" },
    { label: "EB", value: "EB" },
    { label: "PROP", value: "PROP" },
  ];

  // Helper function to generate Supabase storage URL for athlete portraits
  const getPortraitUrl = (fincode: number | string): string | null => {
    if (!fincode) {
      return null;
    }

    // Generate the Supabase storage URL using fincode
    return `https://rxwlwfhytiwzvntpwlyj.supabase.co/storage/v1/object/public/PortraitPics/${fincode}.jpg`;
  };

  // Helper function to add timeout to database calls
  const withTimeout = (
    promise: PromiseLike<any>,
    timeoutMs: number = 30000
  ): Promise<any> => {
    return Promise.race([
      Promise.resolve(promise),
      new Promise((_, reject) =>
        setTimeout(
          () =>
            reject(
              new Error(`Database request timed out after ${timeoutMs}ms`)
            ),
          timeoutMs
        )
      ),
    ]);
  };

  // Helper function to handle image errors
  const handleImageError = (fincode: number | string) => {
    const key = fincode?.toString() || "unknown";
    setImageErrors((prev) => new Set([...prev, key]));
  };

  useEffect(() => {
    // Fetch seasons from the database
    const fetchSeasons = async () => {
      setSeasonsLoading(true);
      try {
        const { data, error } = await supabase
          .from("_seasons")
          .select("*")
          .order("seasonid", { ascending: false });

        if (error) {
          console.error("Error fetching seasons:", error);
        } else {
          setSeasons(data || []);
        }
      } catch (err) {
        console.error("Error fetching seasons:", err);
      }
      setSeasonsLoading(false);
    };

    fetchSeasons();
  }, []);

  // Fetch athletes when season or group changes
  useEffect(() => {
    if (selectedSeason && selectedGroup && selectedGroup !== "") {
      fetchAthletesForSeasonAndGroup(selectedSeason, selectedGroup);
    } else {
      setAthletes([]);
      setFilteredAthletes([]);
      setLoading(false);
    }
  }, [selectedSeason, selectedGroup]);

  const fetchAthletesForSeasonAndGroup = async (
    season: string,
    group: string
  ) => {
    // Prevent multiple simultaneous requests
    if (loading) {
      console.log("Request already in progress, skipping...");
      return;
    }

    setLoading(true);
    setError(null);
    setImageErrors(new Set()); // Clear previous image errors

    try {
      // Test basic connection first with timeout
      console.log("Testing database connection...");
      await withTimeout(
        supabase.from("athletes").select("count"),
        10000 // 10 second timeout for connection test
      );

      console.log("Fetching athletes data...");
      // Call the database function get_athletes_with_rosters with timeout
      const { data, error } = await withTimeout(
        supabase.rpc("get_athletes_with_rosters", {
          paramseason: season,
          paramgroups: group,
        }),
        30000 // 30 second timeout for main query
      );

      if (error) {
        console.error("Database error:", error);
        setError(`Database error: ${error.message}`);
        setAthletes([]);
        setFilteredAthletes([]);
        return; // Early return to prevent further processing
      }

      // Check if data exists and is valid
      if (!data) {
        setAthletes([]);
        setFilteredAthletes([]);
        return;
      }

      if (!Array.isArray(data)) {
        console.error("Data is not an array:", data);
        setError("Invalid data format received");
        setAthletes([]);
        setFilteredAthletes([]);
        return;
      }

      // Safely process the data
      const processed = data.map((item: any, index: number) => {
        // Ensure the item has required properties
        const rawGroups = item.groups || item.team || "";
        const normalizedGroups = rawGroups.trim().toUpperCase();

        const processedItem = {
          ...item,
          name: item.name || "Unnamed Athlete",
          fincode: item.fincode || index,
          // Map team field to groups for consistency and normalize the value
          groups: normalizedGroups,
        };

        return processedItem;
      });

      // Sort athletes by name alphabetically with safe comparison
      const sortedAthletes = processed.sort((a: any, b: any) => {
        try {
          const nameA = String(a.name || "");
          const nameB = String(b.name || "");
          return nameA.localeCompare(nameB);
        } catch (sortError) {
          console.error("Error during sorting:", sortError);
          return 0;
        }
      });

      setAthletes(sortedAthletes);
      setFilteredAthletes(sortedAthletes);
    } catch (err: any) {
      console.error("Catch block error:", err);

      // Handle specific error types
      let errorMessage = "Unknown error occurred";
      if (err?.message?.includes("timed out")) {
        errorMessage =
          "Database request timed out. Please check your connection and try again.";
      } else if (err?.message?.includes("network")) {
        errorMessage = "Network error. Please check your internet connection.";
      } else if (err?.code === "PGRST116") {
        errorMessage = "Database function not found. Please contact support.";
      } else if (err?.message) {
        errorMessage = `Error fetching athletes: ${err.message}`;
      }

      setError(errorMessage);
      setAthletes([]);
      setFilteredAthletes([]);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (athlete: Athlete) => {
    console.log("=== Opening modal for athlete ===");
    console.log("Full athlete object:", JSON.stringify(athlete, null, 2));
    console.log("Athlete groups field:", athlete.groups);
    console.log("Athlete groups type:", typeof athlete.groups);
    console.log("Athlete groups length:", athlete.groups?.length);
    console.log("=====================================");

    setSelectedAthlete(athlete);
    setModalVisible(true);
  };

  const closeModal = () => {
    setSelectedAthlete(null);
    setModalVisible(false);
  };

  const saveAthlete = async () => {
    if (!selectedAthlete) return;

    try {
      console.log("Saving athlete data...");
      const { error } = await withTimeout(
        supabase
          .from("athletes")
          .update(selectedAthlete)
          .eq("fincode", selectedAthlete.fincode),
        15000 // 15 second timeout for save operation
      );

      if (error) {
        throw error;
      }

      console.log("Athlete saved successfully");
      // Refetch data after saving
      if (selectedSeason && selectedGroup && selectedGroup !== "") {
        await fetchAthletesForSeasonAndGroup(selectedSeason, selectedGroup);
      }
      closeModal();
    } catch (error: any) {
      console.error("Error saving athlete:", error);
      const errorMsg = error?.message?.includes("timed out")
        ? "Save operation timed out. Please try again."
        : `Error saving athlete: ${error?.message || "Unknown error"}`;
      setError(errorMsg);
    }
  };

  const deleteAthlete = async () => {
    if (!selectedAthlete) return;

    try {
      console.log("Deleting athlete...");
      const { error } = await withTimeout(
        supabase
          .from("athletes")
          .delete()
          .eq("fincode", selectedAthlete.fincode),
        15000 // 15 second timeout for delete operation
      );

      if (error) {
        throw error;
      }

      console.log("Athlete deleted successfully");
      // Refetch data after deleting
      if (selectedSeason && selectedGroup && selectedGroup !== "") {
        await fetchAthletesForSeasonAndGroup(selectedSeason, selectedGroup);
      }
      closeModal();
    } catch (error: any) {
      console.error("Error deleting athlete:", error);
      const errorMsg = error?.message?.includes("timed out")
        ? "Delete operation timed out. Please try again."
        : `Error deleting athlete: ${error?.message || "Unknown error"}`;
      setError(errorMsg);
    }
  };

  const renderAthlete = ({ item, index }: { item: Athlete; index: number }) => {
    try {
      // Ensure item exists
      if (!item) {
        return (
          <View style={styles.athleteRow}>
            <Text>Invalid athlete data</Text>
          </View>
        );
      }

      const athleteKey = item.fincode?.toString() || item.name || "unknown";
      const hasImageError = imageErrors.has(athleteKey);

      // Get the portrait URL from Supabase storage using fincode
      const photoUrl = item.fincode ? getPortraitUrl(item.fincode) : null;

      // Simple image loading - let React Native handle optimization
      const shouldLoadImage = photoUrl && !hasImageError;

      return (
        <View style={styles.athleteRow}>
          {shouldLoadImage ? (
            <Image
              source={{ uri: photoUrl }}
              style={styles.portrait}
              onLoad={() => {
                // Image loaded successfully
              }}
              onError={(error) => {
                const errorMsg = error.nativeEvent?.error || "";
                // Handle various error codes that indicate file doesn't exist
                if (
                  errorMsg.includes("404") ||
                  errorMsg.includes("Not Found") ||
                  errorMsg.includes("400") ||
                  errorMsg.includes("Bad Request") ||
                  errorMsg.includes("Unexpected HTTP code")
                ) {
                  console.log(
                    `Portrait not found in Supabase storage for athlete ${item.name} (fincode: ${item.fincode}). Using default avatar.`
                  );
                } else {
                  console.error(
                    `Failed to load portrait for athlete ${item.name} (${athleteKey}):`,
                    "URL:",
                    photoUrl,
                    "Error:",
                    error.nativeEvent
                  );
                }
                handleImageError(athleteKey);
              }}
            />
          ) : (
            <Image
              source={require("@/assets/images/default-avatar.png")}
              style={styles.portrait}
            />
          )}
          <Text>{item.name || "No Name"}</Text>
          <View
            style={[styles.row, { flexDirection: "row", alignItems: "center" }]}
          >
            <Ionicons
              name="list-circle-outline"
              color="#333"
              size={24}
              onPress={() => {
                try {
                  openModal(item);
                } catch (modalError) {
                  console.error("Error opening modal:", modalError);
                }
              }}
            />
          </View>
        </View>
      );
    } catch (renderError) {
      console.error("Error rendering athlete:", renderError);
      return (
        <View style={styles.athleteRow}>
          <Text>Error displaying athlete</Text>
        </View>
      );
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Athletes</Text>

      {/* Dropdowns Row */}
      <View style={styles.dropdownRow}>
        <View style={styles.dropdownContainer}>
          <Text style={styles.label}>Season:</Text>
          <Picker
            selectedValue={selectedSeason}
            onValueChange={(itemValue) => setSelectedSeason(itemValue)}
            style={styles.picker}
            enabled={!seasonsLoading}
          >
            <Picker.Item label="Select a season..." value="" />
            {seasons.map((season) => (
              <Picker.Item
                key={season.seasonid}
                label={season.description}
                value={season.description}
              />
            ))}
          </Picker>
        </View>

        <View style={styles.dropdownContainer}>
          <Text style={styles.label}>Group:</Text>
          <Picker
            selectedValue={selectedGroup}
            onValueChange={(itemValue) => setSelectedGroup(itemValue)}
            style={styles.picker}
            enabled={!!selectedSeason && !loading}
          >
            {groupOptions.map((option) => (
              <Picker.Item
                key={option.value}
                label={option.label}
                value={option.value}
              />
            ))}
          </Picker>
        </View>
      </View>

      {/* Loading and Error States */}
      {seasonsLoading && <Text>Loading seasons...</Text>}
      {loading && selectedSeason && <Text>Loading athletes...</Text>}
      {error && <Text style={{ color: "red" }}>{error}</Text>}

      {/* Athletes List */}
      {!loading &&
        !error &&
        selectedSeason &&
        selectedGroup !== "" &&
        Array.isArray(filteredAthletes) &&
        filteredAthletes.length > 0 && (
          <FlatList
            data={filteredAthletes}
            keyExtractor={(item, index) => {
              try {
                if (item && typeof item === "object") {
                  return (
                    item.fincode?.toString() ||
                    item.name?.toString() ||
                    `athlete_${index}`
                  );
                }
                return `athlete_${index}`;
              } catch (keyError) {
                return `athlete_error_${index}`;
              }
            }}
            renderItem={({ item, index }) => renderAthlete({ item, index })}
            removeClippedSubviews={true}
            initialNumToRender={8}
            maxToRenderPerBatch={3}
            windowSize={10}
            getItemLayout={(data, index) => ({
              length: 80, // Approximate height of each row
              offset: 80 * index,
              index,
            })}
          />
        )}

      {/* Empty States */}
      {!loading && !error && selectedSeason === "" && (
        <Text style={styles.noSelectionText}>
          Please select a season from the dropdown to view athletes.
        </Text>
      )}
      {!loading && !error && selectedSeason && selectedGroup === "" && (
        <Text style={styles.noSelectionText}>
          Please select a group from the dropdown to view athletes.
        </Text>
      )}
      {!loading &&
        !error &&
        selectedSeason &&
        selectedGroup &&
        selectedGroup !== "" &&
        filteredAthletes.length === 0 && (
          <Text style={styles.noSelectionText}>
            No athletes found for the selected season and group combination.
          </Text>
        )}
      <Modal
        visible={modalVisible}
        animationType="slide"
        onRequestClose={closeModal}
      >
        <View style={styles.modalContent}>
          {selectedAthlete && (
            <>
              {/* Portrait and Name Header */}
              <View style={styles.modalHeader}>
                {(() => {
                  const athleteKey =
                    selectedAthlete.fincode?.toString() || "unknown";
                  const hasImageError = imageErrors.has(athleteKey);
                  const photoUrl = selectedAthlete.fincode
                    ? getPortraitUrl(selectedAthlete.fincode)
                    : null;
                  const shouldLoadImage = photoUrl && !hasImageError;

                  return shouldLoadImage ? (
                    <Image
                      source={{ uri: photoUrl }}
                      style={styles.modalPortrait}
                      onError={(error) => {
                        const errorMsg = error.nativeEvent?.error || "";
                        if (
                          errorMsg.includes("404") ||
                          errorMsg.includes("Not Found") ||
                          errorMsg.includes("400") ||
                          errorMsg.includes("Bad Request") ||
                          errorMsg.includes("Unexpected HTTP code")
                        ) {
                          console.log(
                            `Portrait not found in Supabase storage for athlete ${selectedAthlete.name} (fincode: ${selectedAthlete.fincode}). Using default avatar.`
                          );
                        }
                        handleImageError(selectedAthlete.fincode || 0);
                      }}
                    />
                  ) : (
                    <Image
                      source={require("@/assets/images/default-avatar.png")}
                      style={styles.modalPortrait}
                    />
                  );
                })()}
                <Text style={styles.modalTitle}>{selectedAthlete.name}</Text>
              </View>

              {/* Form Fields */}

              {/* Birthdate and Gender Row */}
              <View style={styles.inputRow}>
                <TextInput
                  style={styles.inputHalf}
                  value={
                    selectedAthlete.birthdate
                      ? format(
                          new Date(selectedAthlete.birthdate),
                          "yyyy-MM-dd"
                        )
                      : ""
                  }
                  onChangeText={(text) =>
                    setSelectedAthlete({ ...selectedAthlete, birthdate: text })
                  }
                  placeholder="Birthdate (YYYY-MM-DD)"
                />
                <TextInput
                  style={styles.inputHalf}
                  value={selectedAthlete.gender}
                  onChangeText={(text) =>
                    setSelectedAthlete({ ...selectedAthlete, gender: text })
                  }
                  placeholder="Gender"
                />
              </View>
              <TextInput
                style={styles.input}
                value={selectedAthlete.email}
                onChangeText={(text) =>
                  setSelectedAthlete({ ...selectedAthlete, email: text })
                }
                placeholder="Email"
              />
              <TextInput
                style={styles.input}
                value={selectedAthlete.phone}
                onChangeText={(text) =>
                  setSelectedAthlete({ ...selectedAthlete, phone: text })
                }
                placeholder="Phone"
              />

              {/* Group and Active Row */}
              <View style={styles.inputRow}>
                <TextInput
                  style={styles.inputHalf}
                  value={selectedAthlete.groups}
                  onChangeText={(text) =>
                    setSelectedAthlete({ ...selectedAthlete, groups: text })
                  }
                  placeholder="Group"
                />
                <View style={styles.activeContainer}>
                  <Text style={styles.activeLabel}>Active:</Text>
                  <TouchableOpacity
                    onPress={() =>
                      setSelectedAthlete({
                        ...selectedAthlete,
                        active: !selectedAthlete.active,
                      })
                    }
                    style={styles.activeCheckbox}
                  >
                    <View
                      style={[
                        styles.checkbox,
                        {
                          backgroundColor: selectedAthlete.active
                            ? "#4CAF50"
                            : "transparent",
                        },
                      ]}
                    >
                      {selectedAthlete.active && (
                        <Text style={styles.checkmark}>✔</Text>
                      )}
                    </View>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Removed duplicate Active row here */}
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  onPress={saveAthlete}
                  style={{ marginHorizontal: 8 }}
                >
                  <Ionicons name="save-outline" color="#333" size={24} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={closeModal}
                  style={{ marginHorizontal: 8 }}
                >
                  <Ionicons name="close-outline" color="#FF5722" size={24} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={deleteAthlete}
                  style={{ marginHorizontal: 8 }}
                >
                  <Ionicons name="trash-outline" color="#F44336" size={24} />
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
  },
  dropdownRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  dropdownContainer: {
    flex: 1,
    marginHorizontal: 4,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
    marginTop: 8,
  },
  athleteRow: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    backgroundColor: "#f9f9f9",
  },
  row: {
    justifyContent: "space-between",
  },
  portrait: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 8,
  },
  modalContent: {
    flex: 1,
    justifyContent: "flex-start",
    alignItems: "center",
    padding: 16,
    paddingTop: 60,
  },
  modalHeader: {
    alignItems: "center",
    marginBottom: 30,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    width: "100%",
  },
  modalPortrait: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 16,
    borderWidth: 3,
    borderColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    color: "#333",
  },
  input: {
    width: "100%",
    padding: 8,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    marginBottom: 16,
  },
  inputRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 16,
  },
  inputHalf: {
    width: "48%",
    padding: 8,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
  },
  pickerContainer: {
    width: "65%",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    backgroundColor: "#fff",
  },
  pickerHalf: {
    height: 40,
  },
  activeContainer: {
    width: "30%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  activeLabel: {
    fontSize: 16,
    marginRight: 8,
    color: "#333",
  },
  activeCheckbox: {
    marginLeft: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 1,
    borderColor: "#ccc",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 3,
  },
  checkmark: {
    color: "white",
    fontWeight: "bold",
    fontSize: 14,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  booleanRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  picker: {
    marginBottom: 16,
  },
  noSelectionText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginTop: 20,
    fontStyle: "italic",
  },
});

export default AthletesScreen;

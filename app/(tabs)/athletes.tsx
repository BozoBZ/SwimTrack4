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

  // Helper function to process photo URLs and handle problematic sources
  const processPhotoUrl = (photoUrl: string): string | null => {
    if (!photoUrl || typeof photoUrl !== "string") {
      return null;
    }

    // Handle various URL formats and potential issues
    try {
      // Trim whitespace and check for valid URL format
      const cleanUrl = photoUrl.trim();

      if (!cleanUrl || cleanUrl === "null" || cleanUrl === "undefined") {
        return null;
      }

      // Handle Google Drive URLs
      if (cleanUrl.includes("drive.google.com")) {
        const fileIdMatch = cleanUrl.match(/\/d\/([a-zA-Z0-9_-]+)/);
        if (fileIdMatch && fileIdMatch[1]) {
          return `https://drive.google.com/uc?id=${fileIdMatch[1]}`;
        }
        return null; // Invalid Google Drive URL format
      }

      // Allow Flickr URLs but add note about rate limiting
      if (
        cleanUrl.includes("flickr.com") ||
        cleanUrl.includes("staticflickr.com")
      ) {
        // Flickr URLs may hit rate limits (HTTP 429) when loading multiple images
        // The onError handler will gracefully fall back to default avatars
        return cleanUrl;
      }

      // Basic URL validation for other sources
      if (cleanUrl.startsWith("http://") || cleanUrl.startsWith("https://")) {
        return cleanUrl;
      }

      // Invalid URL format
      return null;
    } catch (error) {
      console.error("Error processing photo URL:", photoUrl, error);
      return null;
    }
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
    setLoading(true);
    setError(null);
    setImageErrors(new Set()); // Clear previous image errors

    try {
      // Test basic connection first
      const testConnection = await supabase.from("athletes").select("count");

      // Call the database function get_athletes_with_rosters with both parameters
      const { data, error } = await supabase.rpc("get_athletes_with_rosters", {
        paramseason: season,
        paramgroups: group,
      });

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
        const processedItem = {
          ...item,
          name: item.name || "Unnamed Athlete",
          fincode: item.fincode || index,
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
      setError(`Error fetching athletes: ${err?.message || "Unknown error"}`);
      setAthletes([]);
      setFilteredAthletes([]);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (athlete: Athlete) => {
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
      const { error } = await supabase
        .from("athletes")
        .update(selectedAthlete)
        .eq("fincode", selectedAthlete.fincode);

      if (error) {
        throw error;
      }

      // Refetch data after saving
      if (selectedSeason && selectedGroup && selectedGroup !== "") {
        await fetchAthletesForSeasonAndGroup(selectedSeason, selectedGroup);
      }
      closeModal();
    } catch (error) {
      console.error("Error saving athlete:", error);
    }
  };

  const deleteAthlete = async () => {
    if (!selectedAthlete) return;

    try {
      const { error } = await supabase
        .from("athletes")
        .delete()
        .eq("fincode", selectedAthlete.fincode);

      if (error) {
        throw error;
      }

      // Refetch data after deleting
      if (selectedSeason && selectedGroup && selectedGroup !== "") {
        await fetchAthletesForSeasonAndGroup(selectedSeason, selectedGroup);
      }
      closeModal();
    } catch (error) {
      console.error("Error deleting athlete:", error);
    }
  };

  const renderAthlete = ({ item }: { item: Athlete }) => {
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

      // Get the processed photo URL - now allows Flickr URLs but they may hit rate limits
      const photoUrl = item.photo ? processPhotoUrl(item.photo) : null;

      // Only try to load image if we have a valid URL and no previous error
      const shouldLoadImage = photoUrl && !hasImageError;

      return (
        <View style={styles.athleteRow}>
          {shouldLoadImage ? (
            <Image
              source={{ uri: photoUrl }}
              style={styles.portrait}
              onError={(error) => {
                const errorMsg = error.nativeEvent?.error || "";
                if (
                  errorMsg.includes("429") ||
                  errorMsg.includes("Too Many Requests")
                ) {
                  console.warn(
                    `Rate limited by image server for athlete ${item.name}. Using default avatar.`
                  );
                } else {
                  console.error(
                    `Image failed to load for athlete ${item.name} (${athleteKey}):`,
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
            renderItem={renderAthlete}
            removeClippedSubviews={false}
            initialNumToRender={5}
            maxToRenderPerBatch={5}
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
              <TextInput
                style={styles.input}
                value={selectedAthlete.name}
                onChangeText={(text) =>
                  setSelectedAthlete({ ...selectedAthlete, name: text })
                }
                placeholder="Name"
              />
              <TextInput
                style={styles.input}
                value={
                  selectedAthlete.birthdate
                    ? format(new Date(selectedAthlete.birthdate), "yyyy-MM-dd")
                    : ""
                }
                onChangeText={(text) =>
                  setSelectedAthlete({ ...selectedAthlete, birthdate: text })
                }
                placeholder="Birthdate (YYYY-MM-DD)"
              />
              <TextInput
                style={styles.input}
                value={selectedAthlete.gender}
                onChangeText={(text) =>
                  setSelectedAthlete({ ...selectedAthlete, gender: text })
                }
                placeholder="Gender"
              />
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
              <View style={styles.booleanRow}>
                <Text>Active:</Text>
                <TouchableOpacity
                  onPress={() =>
                    setSelectedAthlete({
                      ...selectedAthlete,
                      active: !selectedAthlete.active,
                    })
                  }
                  style={{
                    marginLeft: 8,
                    flexDirection: "row",
                    alignItems: "center",
                  }}
                >
                  <View
                    style={{
                      width: 20,
                      height: 20,
                      borderWidth: 1,
                      borderColor: "#ccc",
                      backgroundColor: selectedAthlete.active
                        ? "#4CAF50"
                        : "transparent",
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    {selectedAthlete.active && (
                      <Text style={{ color: "white", fontWeight: "bold" }}>
                        ✔
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>
              </View>
              <TextInput
                style={styles.input}
                value={selectedAthlete.groups}
                onChangeText={(text) =>
                  setSelectedAthlete({ ...selectedAthlete, groups: text })
                }
                placeholder="Team"
              />
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
    marginBottom: 16,
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
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  input: {
    width: "100%",
    padding: 8,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    marginBottom: 16,
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

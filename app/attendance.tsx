import React, { useEffect, useState } from "react";
import { View, Text, FlatList, StyleSheet, Image, Alert } from "react-native";
import { useRoute, RouteProp } from "@react-navigation/native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { supabase } from "../utils/supabaseClient";
import { useRouter } from "expo-router";

// Define the Athlete type
type Athlete = {
  name: string;
  fincode: number;
  photo?: string;
};

const AttendanceScreen = () => {
  type AttendanceRouteParams = {
    sessionId: number;
    sessionDate: string;
    selectedGroup: string;
  };

  // Define your navigation param list type
  type RootStackParamList = {
    attendance: AttendanceRouteParams;
    trainings: undefined;
    // add other routes if needed
  };

  const route =
    useRoute<RouteProp<{ params: AttendanceRouteParams }, "params">>();
  const router = useRouter();
  const { sessionId, sessionDate, selectedGroup } = route.params || {};
  const groups = Array.isArray(selectedGroup)
    ? selectedGroup[0]
    : selectedGroup; // Ensure selectedTeam is a string

  const [filteredAthletes, setFilteredAthletes] = useState<
    { name: string; fincode: string; status?: string }[]
  >([]);
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());

  // Helper function to generate Supabase storage URL for athlete portraits
  const getPortraitUrl = (fincode: number | string): string | null => {
    if (!fincode) {
      return null;
    }

    // Generate the Supabase storage URL using fincode
    return `https://rxwlwfhytiwzvntpwlyj.supabase.co/storage/v1/object/public/PortraitPics/${fincode}.jpg`;
  };

  // Helper function to handle image errors
  const handleImageError = (fincode: number | string) => {
    const key = fincode?.toString() || "unknown";
    setImageErrors((prev) => new Set([...prev, key]));
  };

  // Helper to cycle status
  const cycleStatus = (currentStatus?: string) => {
    switch (currentStatus) {
      case "N":
      case undefined:
        return "P"; // Present (green)
      case "P":
        return "J"; // Justified (light blue)
      case "J":
        return "A"; // Absent (red)
      case "A":
      default:
        return "N"; // Not set (gray)
    }
  };

  // Handler for clicking on swimmer name
  const handleNamePress = (fincode: number) => {
    setFilteredAthletes((prev) =>
      prev.map((athlete) =>
        Number(athlete.fincode) === Number(fincode)
          ? { ...athlete, status: cycleStatus(athlete.status) }
          : athlete
      )
    );
  };

  // Always reload athletes and attendance together when sessionId, groups, or sessionDate changes
  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      try {
        // Calculate season based on session date
        const sessionDateObj = new Date(sessionDate);
        const sessionYear = sessionDateObj.getFullYear();
        const sessionMonth = sessionDateObj.getMonth(); // 0-based (0 = January, 8 = September)

        // Swimming season typically runs Sept-Aug, so if month >= September (8), use current year as start
        // Otherwise, use previous year as start
        const seasonStartYear =
          sessionMonth >= 8 ? sessionYear : sessionYear - 1;
        const season = `${seasonStartYear}-${String(seasonStartYear + 1).slice(
          -2
        )}`;

        // Call the database function get_athletes_with_rosters with both parameters
        const { data: athletes, error: athletesError } = await supabase.rpc(
          "get_athletes_with_rosters",
          {
            paramseason: season,
            paramgroups: groups,
          }
        );
        if (athletesError) throw athletesError;

        const sortedAthletes = (athletes || []).sort((a: any, b: any) =>
          a.name.localeCompare(b.name)
        );

        // Fetch attendance for the session
        const { data: attendanceData, error: attendanceError } = await supabase
          .from("attendance")
          .select("fincode, status")
          .eq("session_id", sessionId);
        if (attendanceError) throw attendanceError;

        // Merge attendance status into athletes
        const merged = sortedAthletes.map((athlete: any) => {
          const attendance = attendanceData?.find(
            (a) => a.fincode === athlete.fincode
          );
          return { ...athlete, status: attendance ? attendance.status : "N" };
        });
        if (isMounted) setFilteredAthletes(merged);
      } catch (err) {
        console.error("Failed to fetch athletes or attendance:", err);
      }
    };
    fetchData();
    return () => {
      isMounted = false;
    };
  }, [groups, sessionId, sessionDate]);

  if (!sessionId || !sessionDate || !selectedGroup) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Error: Missing session details.</Text>
      </View>
    );
  }

  const renderAthlete = ({ item }: { item: any }) => {
    // Set background color based on status
    let rowStyle = { ...styles.athleteRow };
    if (item.status === "P")
      rowStyle.backgroundColor = "#b6eab6"; // light green
    else if (item.status === "A")
      rowStyle.backgroundColor = "#f7b6b6"; // light red
    else if (item.status === "J")
      rowStyle.backgroundColor = "#b3eaff"; // light blue
    else if (item.status === "N" || !item.status)
      rowStyle.backgroundColor = "#e0e0e0"; // light gray

    // Convert Google Drive URLs to direct links
    if (item.photo && item.photo.includes("drive.google.com")) {
      const fileIdMatch = item.photo.match(/\/d\/([a-zA-Z0-9_-]+)/);
      if (fileIdMatch) {
        item.photo = `https://drive.google.com/uc?id=${fileIdMatch[1]}`;
      }
    }

    return (
      <View style={rowStyle}>
        {(() => {
          const athleteKey = item.fincode?.toString() || "unknown";
          const hasImageError = imageErrors.has(athleteKey);

          // Get the portrait URL from Supabase storage using fincode
          const photoUrl = item.fincode ? getPortraitUrl(item.fincode) : null;

          // Simple image loading - let React Native handle optimization
          const shouldLoadImage = photoUrl && !hasImageError;

          return shouldLoadImage ? (
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
                }
                handleImageError(item.fincode);
              }}
            />
          ) : (
            <Image
              source={require("@/assets/images/default-avatar.png")}
              style={styles.portrait}
            />
          );
        })()}
        <Text
          onPress={() => handleNamePress(item.fincode)}
          style={{ fontWeight: "bold", fontSize: 16 }}
        >
          {item.name}
        </Text>
      </View>
    );
  };

  // Calculate status counts
  const getStatusCounts = () => {
    const counts = { P: 0, J: 0, A: 0, N: 0 };
    filteredAthletes.forEach((athlete) => {
      const status = athlete.status || "N";
      counts[status as keyof typeof counts]++;
    });
    return counts;
  };

  const statusCounts = getStatusCounts();

  return (
    <View style={styles.container}>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          marginBottom: 10,
        }}
      >
        <Text style={styles.title}>Date: {sessionDate}</Text>
        <Text style={styles.title}>Group: {selectedGroup}</Text>
      </View>

      {/* Live attendance counter */}
      <View style={styles.counterContainer}>
        <View style={[styles.counterItem, { backgroundColor: "#b6eab6" }]}>
          <Text style={styles.counterText}>P:{statusCounts.P}</Text>
        </View>
        <View style={[styles.counterItem, { backgroundColor: "#b3eaff" }]}>
          <Text style={styles.counterText}>J:{statusCounts.J}</Text>
        </View>
        <View style={[styles.counterItem, { backgroundColor: "#f7b6b6" }]}>
          <Text style={styles.counterText}>A:{statusCounts.A}</Text>
        </View>
        <View style={[styles.counterItem, { backgroundColor: "#e0e0e0" }]}>
          <Text style={styles.counterText}>N:{statusCounts.N}</Text>
        </View>
      </View>

      <FlatList
        data={filteredAthletes}
        keyExtractor={(item) => item.fincode.toString()}
        renderItem={renderAthlete}
      />
      <View style={styles.bottomButtonsContainer}>
        <Ionicons.Button
          name="save"
          backgroundColor="#4caf50"
          onPress={async () => {
            try {
              // Fetch current records for this session
              const { data: existingRecords, error: fetchError } =
                await supabase
                  .from("attendance")
                  .select("fincode")
                  .eq("session_id", sessionId);

              if (fetchError) throw fetchError;

              // Determine fincodes that need deletion
              const fincodesToDelete = filteredAthletes
                .filter(
                  (a) =>
                    a.status === "N" &&
                    existingRecords.some((r) => r.fincode === a.fincode)
                )
                .map((a) => a.fincode);

              // Delete the records with 'N' status
              if (fincodesToDelete.length > 0) {
                const { error: deleteError } = await supabase
                  .from("attendance")
                  .delete()
                  .in("fincode", fincodesToDelete)
                  .eq("session_id", sessionId);

                if (deleteError) throw deleteError;
              }
              // Prepare attendance records for upsert, excluding those with status 'N'
              const attendanceRecords = filteredAthletes
                .filter((athlete) => athlete.status && athlete.status !== "N")
                .map((athlete) => ({
                  session_id: sessionId,
                  fincode: athlete.fincode,
                  status: athlete.status,
                }));
              // Upsert attendance records (insert or update on conflict)
              const { error } = await supabase
                .from("attendance")
                .upsert(attendanceRecords, {
                  onConflict: "session_id,fincode",
                });
              if (error) {
                throw error;
              }
              // Show success alert and navigate on OK
              Alert.alert(
                "Attendance Saved",
                "Attendance has been saved successfully.",
                [
                  {
                    text: "OK",
                    onPress: () => router.push("/(tabs)/trainings"),
                  },
                ],
                { cancelable: false }
              );
            } catch (err) {
              console.error("Failed to save attendance:", err);
            }
          }}
          size={20}
          color="#fff"
        />
        <Ionicons.Button
          name="close"
          backgroundColor="#ff4336"
          onPress={() => router.push("/(tabs)/trainings")}
          size={20}
          color="#fff"
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f0f0f0",
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 10,
  },
  athleteItem: {
    padding: 10,
    backgroundColor: "#fff",
    marginBottom: 5,
    borderRadius: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    // For Android elevation
    elevation: 2,
  },
  athleteName: {
    fontSize: 16,
    fontWeight: "bold",
  },
  athleteDetails: {
    fontSize: 14,
    color: "#555",
  },
  errorText: {
    fontSize: 16,
    color: "red",
    textAlign: "center",
    marginTop: 20,
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
    marginRight: 10,
  },
  bottomButtonsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 20,
    paddingHorizontal: 20,
    marginBottom: 32, // Add extra bottom margin to avoid overlap with navigation bar
  },
  counterContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    marginBottom: 15,
    paddingHorizontal: 10,
  },
  counterItem: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    minWidth: 50,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  counterText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
  },
});

export default AttendanceScreen;

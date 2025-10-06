import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Dimensions,
  TouchableOpacity,
  Alert,
  Modal,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { supabase } from "../../utils/supabaseClient";
import Ionicons from "@expo/vector-icons/Ionicons";
import Svg, { Circle, Text as SvgText, Line, G } from "react-native-svg";
import * as ScreenOrientation from "expo-screen-orientation";

interface Athlete {
  fincode: number;
  name: string;
}

interface AttendanceData {
  month: string;
  attendance_percentage: number;
}

function getSeasonMonths(season: string) {
  const result: string[] = [];
  const [startYear, endYear] = season.split("-");

  // Generate months from September of start year to August of end year
  // For '2024-25': Sep 2024 to Aug 2025
  const startYearNum = parseInt(startYear);
  const endYearNum = parseInt("20" + endYear); // Convert '25' to '2025'

  // September to December of start year
  for (let month = 9; month <= 12; month++) {
    const monthStr = month.toString().padStart(2, "0");
    result.push(`${startYearNum}-${monthStr}`);
  }

  // January to August of end year
  for (let month = 1; month <= 8; month++) {
    const monthStr = month.toString().padStart(2, "0");
    result.push(`${endYearNum}-${monthStr}`);
  }

  return result;
}

function getSeasonDisplayText(season: string) {
  const [startYear, endYear] = season.split("-");
  return `Sep ${startYear} – Aug 20${endYear}`;
}

export default function TrendScreen() {
  const [season, setSeason] = useState<string>("2025-26");
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [selectedFincode, setSelectedFincode] = useState<"all" | number>("all");
  const [selectedType, setSelectedType] = useState<"Swim" | "Gym">("Swim");
  const [selectedGroup, setSelectedGroup] = useState<
    "all" | "ASS" | "EA" | "EB" | "PROP"
  >("all");
  const [chartData, setChartData] = useState<AttendanceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showChartModal, setShowChartModal] = useState(false);

  const months = getSeasonMonths(season);

  useEffect(() => {
    const fetchAthletes = async () => {
      if (selectedGroup === "all") {
        setAthletes([]);
        return;
      }

      try {
        const { data, error } = await supabase.rpc(
          "get_athletes_with_rosters",
          {
            paramseason: season,
            paramgroups: selectedGroup,
          }
        );

        if (error) {
          setError(error.message);
        } else {
          setAthletes(data || []);
        }
      } catch (err: any) {
        setError(err.message || "Unknown error");
      }
    };

    fetchAthletes();
  }, [selectedGroup, season]);

  useEffect(() => {
    const fetchAttendanceData = async () => {
      setLoading(true);
      setError(null);

      if (selectedFincode === "all") {
        setChartData([]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.rpc(
        "get_monthly_attendance_percentage",
        {
          fincode_input: selectedFincode,
          season_input: season,
          session_type_input: selectedType,
        }
      );

      if (error) {
        setError(error.message);
        setChartData([]);
      } else {
        setChartData(data || []);
      }
      setLoading(false);
    };

    fetchAttendanceData();
  }, [selectedFincode, selectedType, season]);

  // Export function placeholder for React Native
  const exportToExcel = () => {
    if (chartData.length === 0) {
      Alert.alert(
        "No Data",
        "No data to export. Please select an athlete and run the trend analysis first."
      );
      return;
    }

    // In a real React Native app, you would use a library like react-native-fs
    // or expo-file-system to export data
    Alert.alert(
      "Export",
      "Export functionality would be implemented here using react-native-fs or similar library."
    );
  };

  // Function to open chart modal and set landscape orientation
  const openChartModal = async () => {
    try {
      await ScreenOrientation.lockAsync(
        ScreenOrientation.OrientationLock.LANDSCAPE
      );
      setShowChartModal(true);
    } catch (error) {
      console.log("Could not change orientation:", error);
      setShowChartModal(true); // Show modal anyway even if orientation change fails
    }
  };

  // Function to close chart modal and reset orientation
  const closeChartModal = async () => {
    try {
      setShowChartModal(false);
      await ScreenOrientation.unlockAsync();
    } catch (error) {
      console.log("Could not reset orientation:", error);
      setShowChartModal(false); // Close modal anyway
    }
  };

  // Chart dimensions for line chart
  const chartTopPadding = 24;
  const chartHeight = 220;
  const pointSpacing = 60;
  const chartPadding = 40;
  const screenWidth = Dimensions.get("window").width;
  const chartWidth = Math.max(
    screenWidth - 40,
    (months.length - 1) * pointSpacing + 2 * chartPadding
  );

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Attendance Trend</Text>

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
              selectedValue={selectedType}
              onValueChange={(itemValue) =>
                setSelectedType(itemValue as "Swim" | "Gym")
              }
              style={styles.picker}
            >
              <Picker.Item label="Swim" value="Swim" />
              <Picker.Item label="Gym" value="Gym" />
            </Picker>
          </View>
        </View>

        <View style={styles.filterRow}>
          <Text style={styles.label}>Group:</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={selectedGroup}
              onValueChange={(itemValue) => setSelectedGroup(itemValue as any)}
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

        <View style={styles.filterRow}>
          <Text style={styles.label}>Athlete:</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={selectedFincode}
              onValueChange={(itemValue) =>
                setSelectedFincode(
                  itemValue === "all" ? "all" : Number(itemValue)
                )
              }
              style={styles.picker}
            >
              <Picker.Item label="Select an athlete" value="all" />
              {athletes
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((a) => (
                  <Picker.Item
                    key={a.fincode}
                    label={`${a.name} (${a.fincode})`}
                    value={a.fincode}
                  />
                ))}
            </Picker>
          </View>
        </View>

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => {
              // Trigger data refresh by updating loading state
              setLoading(true);
              setTimeout(() => setLoading(false), 100);
            }}
            disabled={loading}
          >
            <Ionicons name="trending-up" size={20} color="#fff" />
            <Text style={styles.buttonText}>
              {loading ? "Loading..." : "Analyze"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.exportButton,
              { opacity: chartData.length === 0 ? 0.5 : 1 },
            ]}
            onPress={exportToExcel}
            disabled={loading || chartData.length === 0}
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
            Athlete:{" "}
            {selectedFincode === "all"
              ? "Select an athlete"
              : athletes.find((a) => a.fincode === selectedFincode)?.name ||
                "Unknown"}
          </Text>

          {selectedFincode === "all" ? (
            <View style={styles.noDataContainer}>
              <Text style={styles.noDataText}>
                Please select an athlete to view their attendance trend
              </Text>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.chartPreviewButton}
              onPress={openChartModal}
            >
              <Ionicons name="analytics" size={40} color="#007AFF" />
              <Text style={styles.chartPreviewText}>View Full Chart</Text>
              <Text style={styles.chartPreviewSubtext}>
                Tap to open in landscape mode
              </Text>
            </TouchableOpacity>
          )}

          {/* Full Screen Chart Modal */}
          <Modal
            visible={showChartModal}
            animationType="slide"
            presentationStyle="fullScreen"
            onRequestClose={closeChartModal}
          >
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {athletes.find((a) => a.fincode === selectedFincode)?.name} -{" "}
                  {selectedType} Attendance
                </Text>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={closeChartModal}
                >
                  <Ionicons name="close" size={24} color="#333" />
                </TouchableOpacity>
              </View>

              <ScrollView
                horizontal
                style={styles.fullScreenChartScrollView}
                contentContainerStyle={{
                  minWidth: Dimensions.get("window").height - 120, // Account for header padding
                  paddingVertical: 10,
                  paddingHorizontal: 10,
                }}
                showsHorizontalScrollIndicator={true}
              >
                <Svg
                  width={Dimensions.get("window").height - 140} // Full landscape width minus padding
                  height={Dimensions.get("window").width - 140} // Full landscape height minus header and padding
                  style={styles.fullScreenChartSvg}
                >
                  {/* Y axis grid */}
                  {[0, 20, 40, 60, 80, 100].map((y) => {
                    const fullScreenHeight =
                      Dimensions.get("window").width - 200; // Available height minus header and padding
                    const fullScreenWidth =
                      Dimensions.get("window").height - 140; // Available width
                    const fullScreenPadding = 80;
                    return (
                      <G key={y}>
                        <Line
                          x1={fullScreenPadding}
                          x2={fullScreenWidth - fullScreenPadding}
                          y1={
                            50 + fullScreenHeight - (y / 100) * fullScreenHeight
                          }
                          y2={
                            50 + fullScreenHeight - (y / 100) * fullScreenHeight
                          }
                          stroke="#ddd"
                          strokeWidth={1}
                        />
                        <SvgText
                          x={fullScreenPadding - 15}
                          y={
                            50 +
                            fullScreenHeight -
                            (y / 100) * fullScreenHeight +
                            6
                          }
                          fontSize={18}
                          textAnchor="end"
                          fill="#333"
                          fontWeight="bold"
                        >
                          {y}%
                        </SvgText>
                      </G>
                    );
                  })}

                  {/* Line chart */}
                  {months.map((m, i) => {
                    const data = chartData.find((cd) => cd.month === m);
                    const val = data?.attendance_percentage || 0;
                    const pointColor = val >= 80 ? "#4caf50" : "#f44336";

                    const fullScreenHeight =
                      Dimensions.get("window").width - 200;
                    const fullScreenWidth =
                      Dimensions.get("window").height - 140;
                    const fullScreenPadding = 80;
                    const availableWidth =
                      fullScreenWidth - 2 * fullScreenPadding;
                    const fullScreenSpacing =
                      availableWidth / (months.length - 1);

                    const x = fullScreenPadding + i * fullScreenSpacing;
                    const y =
                      50 + fullScreenHeight - (val / 100) * fullScreenHeight;

                    return (
                      <G key={m}>
                        {/* Data point circle */}
                        <Circle
                          cx={x}
                          cy={y}
                          r={8}
                          fill={pointColor}
                          stroke="white"
                          strokeWidth={4}
                        />

                        {/* Line to next point */}
                        {i < months.length - 1 &&
                          (() => {
                            const nextData = chartData.find(
                              (cd) => cd.month === months[i + 1]
                            );
                            const nextVal =
                              nextData?.attendance_percentage || 0;
                            const nextX =
                              fullScreenPadding + (i + 1) * fullScreenSpacing;
                            const nextY =
                              50 +
                              fullScreenHeight -
                              (nextVal / 100) * fullScreenHeight;

                            return (
                              <Line
                                x1={x}
                                y1={y}
                                x2={nextX}
                                y2={nextY}
                                stroke="#666"
                                strokeWidth={4}
                              />
                            );
                          })()}

                        {/* Month label */}
                        <SvgText
                          x={x}
                          y={50 + fullScreenHeight + 35}
                          fontSize={16}
                          textAnchor="middle"
                          fill="#333"
                          fontWeight="bold"
                        >
                          {m.slice(5)}
                        </SvgText>

                        {/* Value label above point */}
                        {val > 0 && (
                          <SvgText
                            x={x}
                            y={y - 15}
                            fontSize={16}
                            textAnchor="middle"
                            fill="#333"
                            fontWeight="bold"
                          >
                            {`${val}%`}
                          </SvgText>
                        )}
                      </G>
                    );
                  })}
                </Svg>
              </ScrollView>
            </View>
          </Modal>

          {selectedFincode !== "all" && chartData.length > 0 && (
            <View style={styles.summaryContainer}>
              <Text style={styles.summaryText}>
                Showing attendance trend for{" "}
                <Text style={styles.boldText}>
                  {athletes.find((a) => a.fincode === selectedFincode)?.name}
                </Text>{" "}
                in <Text style={styles.boldText}>{selectedType}</Text> sessions
              </Text>
              <Text style={styles.noteText}>
                <Text style={styles.boldText}>Note:</Text> Green points indicate
                attendance ≥80%, red points indicate attendance &lt;80%
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
    paddingVertical: 5,
    justifyContent: "center",
  },
  picker: {
    backgroundColor: "transparent",
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
  noDataContainer: {
    padding: 40,
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 10,
    marginVertical: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  noDataText: {
    color: "#666",
    fontSize: 16,
    textAlign: "center",
  },
  chartScrollView: {
    backgroundColor: "#ffffff",
    borderRadius: 10,
    marginVertical: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  chartSvg: {
    backgroundColor: "#f8f8ff",
    borderRadius: 8,
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
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  noteText: {
    fontSize: 14,
    color: "#666",
  },
  boldText: {
    fontWeight: "bold",
    color: "#333",
  },
  chartPreviewButton: {
    backgroundColor: "#ffffff",
    borderRadius: 10,
    padding: 40,
    marginVertical: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    borderWidth: 2,
    borderColor: "#007AFF",
    borderStyle: "dashed",
  },
  chartPreviewText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#007AFF",
    marginTop: 10,
  },
  chartPreviewSubtext: {
    fontSize: 14,
    color: "#666",
    marginTop: 5,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "#f0f0f0",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#ffffff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    flex: 1,
  },
  closeButton: {
    padding: 8,
    backgroundColor: "#f8f9fa",
    borderRadius: 20,
  },
  fullScreenChartScrollView: {
    flex: 1,
    backgroundColor: "#ffffff",
    margin: 5,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  fullScreenChartSvg: {
    backgroundColor: "#f8f8ff",
    borderRadius: 8,
  },
});

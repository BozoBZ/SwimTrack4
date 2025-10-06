import {
  Text,
  FlatList,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
  View,
} from "react-native";
import { format, addDays, startOfWeek, isSameDay } from "date-fns";
import React, { useState } from "react";
import { Picker } from "@react-native-picker/picker"; // Import Picker for dropdown
import styled from "styled-components/native";
import { supabase } from "../../utils/supabaseClient";
import { filterAthletesByTeam, fetchAthletes } from "../../utils/athletesUtils";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";

type TrainingDay = {
  session_id: number;
  title: string;
  date: string;
  starttime: string;
  endtime: string;
  type: string;
  description: string;
  volume: number;
  location: string;
  poolname: string;
  poollength: number;
  groups: string;
};

type DateObject = {
  dateString: string;
};

const Container = styled.View`
  flex: 1;
  padding: 20px;
  background-color: #f0f0f0;
`;

const Heading = styled.Text`
  font-size: 18px;
  font-weight: bold;
  margin-vertical: 10px;
  text-align: center;
`;

const SessionItem = styled.View`
  padding: 10px;
  background-color: #ffffff;
  margin-bottom: 5px;
  border-radius: 5px;
  shadow-color: #000;
  shadow-offset: 0px 2px;
  shadow-opacity: 0.1;
  shadow-radius: 3px;
`;

const NoSessions = styled.View`
  align-items: center;
  margin-top: 20px;
`;

const ModalContainer = styled.View`
  flex: 1;
  justify-content: center;
  align-items: center;
  background-color: rgba(0, 0, 0, 0.5);
`;

const ModalContent = styled.View`
  width: 300px;
  padding: 20px;
  background-color: #fff;
  border-radius: 10px;
  shadow-color: #000;
  shadow-offset: 0px 2px;
  shadow-opacity: 0.2;
  shadow-radius: 4px;
`;

const ModalTitle = styled.Text`
  font-size: 20px;
  font-weight: bold;
  margin-bottom: 10px;
`;

const Input = styled.TextInput`
  border-width: 1px;
  border-color: #ccc;
  border-radius: 5px;
  padding: 10px;
  margin-bottom: 10px;
`;

const SaveButton = styled.TouchableOpacity`
  background-color: #4caf50;
  padding-vertical: 5px;
  padding-horizontal: 10px;
  border-radius: 5px;
  align-items: center;
`;

const CancelButton = styled.TouchableOpacity`
  background-color: #ff4336;
  padding-vertical: 5px;
  padding-horizontal: 10px;
  border-radius: 5px;
  align-items: center;
`;

const AddNewButton = styled.TouchableOpacity`
  background-color: #fab905;
  padding-vertical: 5px;
  padding-horizontal: 10px;
  border-radius: 5px;
  align-items: center;
`;

const AttendanceButton = styled.TouchableOpacity`
  background-color: #ffa500;
  padding: 5px;
  border-radius: 5px;
  justify-content: center;
  align-items: center;
`;

const AddNewButtonText = styled.Text`
  color: #fff;
  font-weight: bold;
`;

const EditButton = styled.TouchableOpacity`
  background-color: #0e7bff;
  padding: 5px;
  border-radius: 5px;
  margin-top: 5px;
  justify-content: center;
  align-items: center;
`;

const DeleteButton = styled.TouchableOpacity`
  background-color: #ff4336;
  padding: 5px;
  border-radius: 5px;
  margin-top: 5px;
  justify-content: center;
  align-items: center;
`;

const ButtonContainer = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  margin-top: 10px;
`;

const WeeklyCalendarContainer = styled.View`
  background-color: #ffffff;
  margin-bottom: 20px;
  border-radius: 10px;
  padding: 15px;
  shadow-color: #000;
  shadow-offset: 0px 2px;
  shadow-opacity: 0.1;
  shadow-radius: 3px;
  elevation: 3;
`;

const WeekNavigation = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
`;

const NavButton = styled.TouchableOpacity`
  padding: 10px;
  border-radius: 20px;
  background-color: #f8f9fa;
`;

const WeekTitle = styled.Text`
  font-size: 16px;
  font-weight: bold;
  color: #333;
`;

const WeekDaysContainer = styled.View`
  flex-direction: row;
  justify-content: space-between;
`;

const DayContainer = styled.View`
  align-items: center;
  flex: 1;
`;

const DayLabel = styled.Text`
  font-size: 12px;
  color: #666;
  margin-bottom: 8px;
  font-weight: 500;
`;

const DayButton = styled.TouchableOpacity<{
  isSelected?: boolean;
  isToday?: boolean;
}>`
  width: 40px;
  height: 40px;
  border-radius: 20px;
  justify-content: center;
  align-items: center;
  background-color: ${(props: { isSelected?: boolean; isToday?: boolean }) =>
    props.isSelected ? "#007AFF" : props.isToday ? "#E3F2FD" : "transparent"};
  border: ${(props: { isSelected?: boolean; isToday?: boolean }) =>
    props.isToday && !props.isSelected ? "2px solid #007AFF" : "none"};
`;

const DayText = styled.Text<{ isSelected?: boolean; isToday?: boolean }>`
  font-size: 16px;
  font-weight: ${(props: { isSelected?: boolean; isToday?: boolean }) =>
    props.isToday || props.isSelected ? "bold" : "normal"};
  color: ${(props: { isSelected?: boolean; isToday?: boolean }) =>
    props.isSelected ? "#FFFFFF" : props.isToday ? "#007AFF" : "#333"};
`;

const GroupFilterContainer = styled.View`
  background-color: #ffffff;
  margin-bottom: 15px;
  border-radius: 10px;
  padding: 15px;
  shadow-color: #000;
  shadow-offset: 0px 2px;
  shadow-opacity: 0.1;
  shadow-radius: 3px;
  elevation: 3;
`;

const FilterLabel = styled.Text`
  font-size: 16px;
  font-weight: bold;
  color: #333;
  margin-bottom: 10px;
`;

export default function TrainingsScreen() {
  const [selectedDay, setSelectedDay] = useState<DateObject | null>(null);
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [sessionsForDay, setSessionsForDay] = useState<TrainingDay[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isAttendanceModalVisible, setIsAttendanceModalVisible] =
    useState(false);
  const [athletesList, setAthletesList] = useState<any[]>([]);
  const [filteredAthletes, setFilteredAthletes] = useState<any[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string>("ALL");
  const [filterGroup, setFilterGroup] = useState<string>("ALL");

  const [newSession, setNewSession] = useState<Partial<TrainingDay>>({
    session_id: 0,
    title: "",
    date: "",
    starttime: "18:00", // Default value
    endtime: "20:00", // Default value
    type: "Swim", // Default value
    description: "",
    volume: 0,
    location: "Bolzano", // Default value
    poollength: 25, // Default value
    groups: "ASS", // Default value
  });

  const router = useRouter();

  const fetchSessionsForDay = async (dateString: string) => {
    try {
      const { data, error } = await supabase
        .from("sessions")
        .select("*")
        .eq("date", dateString);

      if (error) {
        throw error;
      }

      setSessionsForDay(data || []);
    } catch (err) {
      console.error("Failed to fetch sessions for the day:", err);
    }
  };

  const onDayPress = (day: DateObject) => {
    setSelectedDay(day);
    fetchSessionsForDay(day.dateString);
  };

  const toggleModal = () => {
    setNewSession({
      ...newSession,
      date: selectedDay?.dateString || "", // Autofill date with selected day
      groups: "ASS", // Ensure groups is initialized as a string
    });
    setIsModalVisible(!isModalVisible);
  };

  const handleInputChange = (
    field: keyof TrainingDay,
    value: string | number
  ) => {
    setNewSession({ ...newSession, [field]: value });
  };

  const saveSession = async () => {
    try {
      // Ensure time is in hh:mm format (not hh:mm:ss or longer)
      const formatTime = (time: string | undefined) => {
        if (!time) return "";
        // Only keep hh:mm
        return time.length > 5 ? time.slice(0, 5) : time;
      };
      // Exclude session_id from insert payload, but include for update
      const { session_id, ...fieldsToSave } = newSession;
      const formattedSession = {
        ...fieldsToSave,
        starttime: formatTime(newSession.starttime),
        endtime: formatTime(newSession.endtime),
        groups:
          typeof newSession.groups === "string"
            ? newSession.groups
            : newSession.groups?.[0] || "",
      };

      let response;
      if (newSession.session_id) {
        // For update, do not update session_id field
        response = await supabase
          .from("sessions")
          .update(formattedSession)
          .eq("session_id", newSession.session_id);
      } else {
        // For insert, just use formattedSession (session_id is not present)
        response = await supabase.from("sessions").insert([formattedSession]);
      }

      if (response.error) {
        throw response.error;
      }

      if (selectedDay?.dateString) {
        fetchSessionsForDay(selectedDay.dateString);
      }
    } catch (err) {
      console.error("Failed to save session:", err);
    } finally {
      setIsModalVisible(false);
      setNewSession({
        title: "",
        date: selectedDay?.dateString || "",
        starttime: "18:00",
        endtime: "20:00",
        type: "Swim",
        description: "",
        volume: 0,
        location: "Bolzano",
        poolname: "Maso della Pieve",
        poollength: 25,
        groups: "ASS",
      });
    }
  };

  const filterAthletesByTeamHandler = (team: string) => {
    filterAthletesByTeam(team, setSelectedGroup);
  };

  const renderAthlete = ({ item }: { item: any }) => <Text>{item.name}</Text>;

  const editSession = async (session_id: number) => {
    try {
      const { data, error } = await supabase
        .from("sessions")
        .select("*")
        .eq("session_id", session_id);

      if (error) {
        throw error;
      }

      if (Array.isArray(data) && data.length > 0) {
        const session = data[0];
        setNewSession({
          ...session,
          groups: session.groups || "", // Ensure groups is treated as a string
        });
        setIsModalVisible(true);
      }
    } catch (err) {
      console.error("Failed to fetch session details:", err);
    }
  };

  const deleteSession = async (session_id: number) => {
    try {
      const { error } = await supabase
        .from("sessions")
        .delete()
        .eq("session_id", session_id);

      if (error) {
        throw error;
      }

      setSessionsForDay((prevSessions) =>
        prevSessions.filter((session) => session.session_id !== session_id)
      );
    } catch (err) {
      console.error("Failed to delete session:", err);
    }
  };

  const getWeekDays = () => {
    const startDate = startOfWeek(currentWeek, { weekStartsOn: 1 }); // Monday start
    return Array.from({ length: 7 }, (_, i) => addDays(startDate, i));
  };

  const goToPreviousWeek = () => {
    setCurrentWeek(addDays(currentWeek, -7));
  };

  const goToNextWeek = () => {
    setCurrentWeek(addDays(currentWeek, 7));
  };

  const handleDayPress = (date: Date) => {
    const dayObj = {
      dateString: format(date, "yyyy-MM-dd"),
      day: date.getDate(),
      month: date.getMonth() + 1,
      year: date.getFullYear(),
    };
    setSelectedDay(dayObj);
    fetchSessionsForDay(dayObj.dateString);
  };

  return (
    <Container>
      <WeeklyCalendarContainer>
        <WeekNavigation>
          <NavButton onPress={goToPreviousWeek}>
            <Ionicons name="chevron-back" size={24} color="#007AFF" />
          </NavButton>
          <WeekTitle>
            {format(getWeekDays()[0], "MMM d")} -{" "}
            {format(getWeekDays()[6], "MMM d, yyyy")}
          </WeekTitle>
          <NavButton onPress={goToNextWeek}>
            <Ionicons name="chevron-forward" size={24} color="#007AFF" />
          </NavButton>
        </WeekNavigation>

        <WeekDaysContainer>
          {getWeekDays().map((date, index) => {
            const isSelected =
              selectedDay && isSameDay(date, new Date(selectedDay.dateString));
            const isToday = isSameDay(date, new Date());

            return (
              <DayContainer key={index}>
                <DayLabel>{format(date, "EEE")}</DayLabel>
                <DayButton
                  onPress={() => handleDayPress(date)}
                  isSelected={isSelected}
                  isToday={isToday}
                >
                  <DayText isSelected={isSelected} isToday={isToday}>
                    {format(date, "d")}
                  </DayText>
                </DayButton>
              </DayContainer>
            );
          })}
        </WeekDaysContainer>
      </WeeklyCalendarContainer>

      <GroupFilterContainer>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <FilterLabel>Group:</FilterLabel>
          <View style={{ flex: 1, marginLeft: 15 }}>
            <Picker
              selectedValue={filterGroup}
              onValueChange={(itemValue) => setFilterGroup(itemValue)}
              style={{
                backgroundColor: "#f8f9fa",
                borderRadius: 8,
              }}
              itemStyle={{
                height: 44,
              }}
            >
              <Picker.Item label="All Groups" value="ALL" />
              <Picker.Item label="ASS" value="ASS" />
              <Picker.Item label="EA" value="EA" />
              <Picker.Item label="EB" value="EB" />
              <Picker.Item label="PROP" value="PROP" />
            </Picker>
          </View>
        </View>
      </GroupFilterContainer>

      {selectedDay && (
        <>
          <Heading>{selectedDay.dateString}</Heading>
          <AddNewButton onPress={toggleModal}>
            <AddNewButtonText>+</AddNewButtonText>
          </AddNewButton>
          <FlatList
            data={sessionsForDay.filter(
              (session) =>
                filterGroup === "ALL" || session.groups?.includes(filterGroup)
            )}
            keyExtractor={(item) =>
              item.session_id
                ? item.session_id.toString()
                : Math.random().toString()
            }
            renderItem={({ item }) => (
              <SessionItem>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Text>Session ID: {item.session_id}</Text>
                  <Text>Type: {item.type}</Text>
                </View>
                <ButtonContainer>
                  <EditButton onPress={() => editSession(item.session_id)}>
                    <Ionicons name="create-outline" color="#333" size={24} />
                  </EditButton>
                  <AttendanceButton
                    onPress={() => {
                      router.push({
                        pathname: "/attendance",
                        params: {
                          sessionId: item.session_id,
                          sessionDate: item.date,
                          selectedGroup: filterGroup,
                        },
                      });
                    }}
                  >
                    <Ionicons name="people-outline" color="#333" size={24} />
                  </AttendanceButton>
                  <DeleteButton onPress={() => deleteSession(item.session_id)}>
                    <Ionicons name="trash-outline" color="#fff" size={24} />
                  </DeleteButton>
                </ButtonContainer>
              </SessionItem>
            )}
            ListEmptyComponent={
              <NoSessions>
                <Text>No sessions</Text>
              </NoSessions>
            }
            style={{ flexGrow: 1, minHeight: 100 }}
          />
        </>
      )}
      <Modal visible={isModalVisible} animationType="slide" transparent={true}>
        <ModalContainer>
          <ModalContent style={{ maxHeight: "80%" }}>
            <ScrollView>
              <ModalTitle>Add/Edit Session</ModalTitle>
              <Input
                placeholder="Title"
                value={newSession.title || ""}
                onChangeText={(text: string) =>
                  handleInputChange("title", text)
                }
              />
              <Text>Date: {newSession.date}</Text>
              <Input
                placeholder="Start Time (hh:mm)"
                value={newSession.starttime || ""}
                onChangeText={(text: string) =>
                  handleInputChange("starttime", text)
                }
              />
              <Input
                placeholder="End Time (hh:mm)"
                value={newSession.endtime || ""}
                onChangeText={(text: string) =>
                  handleInputChange("endtime", text)
                }
              />
              <Picker
                selectedValue={newSession.type}
                onValueChange={(itemValue) =>
                  handleInputChange("type", itemValue)
                }
              >
                <Picker.Item label="Swim" value="Swim" />
                <Picker.Item label="Gym" value="Gym" />
              </Picker>
              <Input
                placeholder="Description"
                value={newSession.description || ""}
                onChangeText={(text: string) =>
                  handleInputChange("description", text)
                }
                multiline={true}
                numberOfLines={6}
                textAlignVertical="top"
                scrollEnabled={true}
                style={{ height: 120, paddingTop: 10 }}
              />
              {/* Hide volume, poolname, poollength if type is Gym */}
              {newSession.type !== "Gym" && (
                <>
                  <Input
                    placeholder="Volume"
                    value={(newSession.volume ?? 0).toString()}
                    onChangeText={(text: string) =>
                      handleInputChange("volume", parseInt(text))
                    }
                    keyboardType="numeric"
                  />
                  <Input
                    placeholder="Pool Name"
                    value={newSession.poolname || ""}
                    onChangeText={(text: string) =>
                      handleInputChange("poolname", text)
                    }
                  />
                  <Input
                    placeholder="Pool Length"
                    value={(newSession.poollength ?? 0).toString()}
                    onChangeText={(text: string) =>
                      handleInputChange("poollength", parseInt(text))
                    }
                    keyboardType="numeric"
                  />
                </>
              )}
              <Input
                placeholder="Location"
                value={newSession.location || ""}
                onChangeText={(text: string) =>
                  handleInputChange("location", text)
                }
              />
              <Input
                placeholder="Groups"
                value={newSession.groups || ""}
                onChangeText={(text: string) =>
                  handleInputChange("groups", text)
                }
              />
              <ButtonContainer>
                <SaveButton onPress={saveSession}>
                  <Ionicons name="save-outline" color="#fff" size={24} />
                </SaveButton>
                <CancelButton onPress={toggleModal}>
                  <Ionicons name="expand-outline" color="#fff" size={24} />
                </CancelButton>
              </ButtonContainer>
            </ScrollView>
          </ModalContent>
        </ModalContainer>
      </Modal>
    </Container>
  );
}

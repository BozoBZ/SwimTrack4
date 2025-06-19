import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, Image, Alert } from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { supabase } from './supabaseClient';
import { useRouter } from 'expo-router';

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
    selectedTeam: string;
  };

  // Define your navigation param list type
  type RootStackParamList = {
    attendance: AttendanceRouteParams;
    trainings: undefined;
    // add other routes if needed
  };

  const route = useRoute<RouteProp<{ params: AttendanceRouteParams }, 'params'>>();
  const router = useRouter();
  const { sessionId, sessionDate, selectedTeam } = route.params || {};
  const team = Array.isArray(selectedTeam) ? selectedTeam[0] : selectedTeam; // Ensure selectedTeam is a string

  const [filteredAthletes, setFilteredAthletes] = useState<{ name: string; fincode: string; status?: string }[]>([]);

  // Helper to cycle status
  const cycleStatus = (currentStatus?: string) => {
    switch (currentStatus) {
      case 'N':
      case undefined:
        return 'P'; // Present (green)
      case 'P':
        return 'J'; // Justified (yellow)
      case 'J':
        return 'A'; // Absent (red)
      case 'A':
      default:
        return 'N'; // Not set (gray)
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

  // Always reload athletes and attendance together when sessionId, team, or sessionDate changes
  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      try {
        // Fetch athletes for the team
        const { data: athletes, error: athletesError } = await supabase
          .from('athletes')
          .select('*')
          .eq('team', team);
        if (athletesError) throw athletesError;
        const sortedAthletes = (athletes || []).sort((a, b) => a.name.localeCompare(b.name));

        // Fetch attendance for the session
        const { data: attendanceData, error: attendanceError } = await supabase
          .from('attendance')
          .select('fincode, status')
          .eq('session_id', sessionId);
        if (attendanceError) throw attendanceError;

        // Merge attendance status into athletes
        const merged = sortedAthletes.map((athlete) => {
          const attendance = attendanceData?.find((a) => a.fincode === athlete.fincode);
          return { ...athlete, status: attendance ? attendance.status : 'N' };
        });
        if (isMounted) setFilteredAthletes(merged);
      } catch (err) {
        console.error('Failed to fetch athletes or attendance:', err);
      }
    };
    fetchData();
    return () => { isMounted = false; };
  }, [team, sessionId, sessionDate]);

  if (!sessionId || !sessionDate || !selectedTeam) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Error: Missing session details.</Text>
      </View>
    );
  }

  const renderAthlete = ({ item }: { item: any }) => {
    // Set background color based on status
    let rowStyle = { ...styles.athleteRow };
    if (item.status === 'P') rowStyle.backgroundColor = '#b6eab6'; // light green
    else if (item.status === 'A') rowStyle.backgroundColor = '#f7b6b6'; // light red
    else if (item.status === 'J') rowStyle.backgroundColor = '#fff7b2'; // light yellow
    else if (item.status === 'N' || !item.status) rowStyle.backgroundColor = '#e0e0e0'; // light gray

    // Convert Google Drive URLs to direct links
    if (item.photo && item.photo.includes('drive.google.com')) {
      const fileIdMatch = item.photo.match(/\/d\/([a-zA-Z0-9_-]+)/);
      if (fileIdMatch) {
        item.photo = `https://drive.google.com/uc?id=${fileIdMatch[1]}`;
      }
    }

    return (
      <View style={rowStyle}>
        {item.photo ? (
          <Image
            source={{ uri: item.photo }}
            style={styles.portrait}
            onError={(error) => {
              console.error('Image failed to load:', error.nativeEvent);
              item.photo = undefined;
            }}
          />
        ) : (
        <Image
          source={require('@/assets/images/default-avatar.png')}
          style={styles.portrait}
        />
        )}
        <Text onPress={() => handleNamePress(item.fincode)} style={{ fontWeight: 'bold', fontSize: 16 }}>{item.name}</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Session ID: {sessionId}</Text>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
        <Text style={styles.subtitle}>Date: {sessionDate}</Text>
        <Text style={styles.subtitle}>Team: {selectedTeam}</Text>
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
              const { data: existingRecords, error: fetchError } = await supabase
                .from('attendance')
                .select('fincode')
                .eq('session_id', sessionId);

              if (fetchError) throw fetchError;

              // Determine fincodes that need deletion
              const fincodesToDelete = filteredAthletes
                .filter(a => a.status === 'N' && existingRecords.some(r => r.fincode === a.fincode))
                .map(a => a.fincode);

              // Delete the records with 'N' status
              if (fincodesToDelete.length > 0) {
                const { error: deleteError } = await supabase
                  .from('attendance')
                  .delete()
                  .in('fincode', fincodesToDelete)
                  .eq('session_id', sessionId);

                if (deleteError) throw deleteError;
}
              // Prepare attendance records for upsert, excluding those with status 'N'
              const attendanceRecords = filteredAthletes
                .filter((athlete) => athlete.status && athlete.status !== 'N')
                .map((athlete) => ({
                  session_id: sessionId,
                  fincode: athlete.fincode,
                  status: athlete.status,
                }));
              // Upsert attendance records (insert or update on conflict)
              const { error } = await supabase
                .from('attendance')
                .upsert(attendanceRecords, { onConflict: 'session_id,fincode' });
              if (error) {
                throw error;
              }
              // Show success alert and navigate on OK
              Alert.alert(
                'Attendance Saved',
                'Attendance has been saved successfully.',
                [
                  {
                    text: 'OK',
                    onPress: () => router.push('/(tabs)/trainings')
                  }
                ],
                { cancelable: false }
              );
            } catch (err) {
              console.error('Failed to save attendance:', err);
            }
          }}
          size={20}
          color="#fff"
        />
        <Ionicons.Button
          name="close"
          backgroundColor="#ff4336"
          onPress={() => router.push('/(tabs)/trainings')}
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
    backgroundColor: '#f0f0f0',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 10,
  },
  athleteItem: {
    padding: 10,
    backgroundColor: '#fff',
    marginBottom: 5,
    borderRadius: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    // For Android elevation
    elevation: 2,
  },
  athleteName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  athleteDetails: {
    fontSize: 14,
    color: '#555',
  },
  errorText: {
    fontSize: 16,
    color: 'red',
    textAlign: 'center',
    marginTop: 20,
  },
  athleteRow: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    padding: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
  },
  row: {
    justifyContent: 'space-between',
  },
  portrait: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 10,
  },
  bottomButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    paddingHorizontal: 20,
    marginBottom: 32, // Add extra bottom margin to avoid overlap with navigation bar
  },
});

export default AttendanceScreen;
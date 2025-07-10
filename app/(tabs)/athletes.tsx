import { StyleSheet, View, Text, TextInput, Button, FlatList, Image, Modal, TouchableOpacity } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { format } from 'date-fns';
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { filterAthletesByTeam, fetchAthletes } from '../athletesUtils';
import Ionicons from '@expo/vector-icons/Ionicons';

interface Athlete {
  fincode: number;
  name: string;
  photo?: string; // Optional property for the athlete's photo
  birthdate?: string;
  gender?: string;
  email?: string;
  phone?: string;
  active?: boolean;
  groups?: string;
}

const AthletesScreen = () => {
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedAthlete, setSelectedAthlete] = useState<Athlete | null>(null);
  const [selectedGroup, setSelectedGroup] = useState('ASS');

  useEffect(() => {
    fetchAthletes(setAthletes);
  }, []);

  const filteredAthletes = athletes
    .filter((athlete) => athlete.groups === selectedGroup)
    .sort((a, b) => (a.name || '').localeCompare(b.name || ''));

  const filterAthletesByTeamHandler = (groups: string) => {
    filterAthletesByTeam(groups, setSelectedGroup);
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
        .from('athletes')
        .update(selectedAthlete)
        .eq('fincode', selectedAthlete.fincode);

      if (error) {
        throw error;
      }

      await fetchAthletes(setAthletes);
      closeModal();
    } catch (error) {
      console.error('Error saving athlete:', error);
    }
  };

  const deleteAthlete = async () => {
    if (!selectedAthlete) return;

    try {
      const { error } = await supabase
        .from('athletes')
        .delete()
        .eq('fincode', selectedAthlete.fincode);

      if (error) {
        throw error;
      }

      await fetchAthletes(setAthletes);
      closeModal();
    } catch (error) {
      console.error('Error deleting athlete:', error);
    }
  };

  const renderAthlete = ({ item }: { item: Athlete }) => {

    // Convert Google Drive URLs to direct links
    if (item.photo && item.photo.includes('drive.google.com')) {
      const fileIdMatch = item.photo.match(/\/d\/([a-zA-Z0-9_-]+)/);
      if (fileIdMatch) {
        item.photo = `https://drive.google.com/uc?id=${fileIdMatch[1]}`;
      }
    }

    return (
      <View style={styles.athleteRow}>
        {item.photo ? (
          <Image
            source={{ uri: item.photo }}
            style={styles.portrait}
            onError={(error) => {
              console.error('Image failed to load:', error.nativeEvent);
              // Fallback to a default image
              item.photo = undefined;
            }}
          />
        ) : (
        <Image
          source={require('@/assets/images/default-avatar.png')}
          style={styles.portrait}
        />
        )}
        <Text>{item.name}</Text>
        <View style={[styles.row, { flexDirection: 'row', alignItems: 'center' }]}>
          <Ionicons name="list-circle-outline" color="#333" size={24}
            onPress={() => openModal(item)}
          />
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Picker
        selectedValue={selectedGroup}
        onValueChange={(itemValue) => filterAthletesByTeamHandler(itemValue)}
        style={styles.picker}
      >
        <Picker.Item label="ASS" value="ASS" />
        <Picker.Item label="EB" value="EB" />
        <Picker.Item label="EA" value="EA" />
        <Picker.Item label="Prop" value="Prop" />
      </Picker>
      <FlatList
        data={filteredAthletes}
        keyExtractor={(item) => item.fincode.toString()}
        renderItem={renderAthlete}
      />
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
                onChangeText={(text) => setSelectedAthlete({ ...selectedAthlete, name: text })}
                placeholder="Name"
              />
              <TextInput
                style={styles.input}
                value={selectedAthlete.birthdate ? format(new Date(selectedAthlete.birthdate), 'yyyy-MM-dd') : ''}
                onChangeText={(text) => setSelectedAthlete({ ...selectedAthlete, birthdate: text })}
                placeholder="Birthdate (YYYY-MM-DD)"
              />
              <TextInput
                style={styles.input}
                value={selectedAthlete.gender}
                onChangeText={(text) => setSelectedAthlete({ ...selectedAthlete, gender: text })}
                placeholder="Gender"
              />
              <TextInput
                style={styles.input}
                value={selectedAthlete.email}
                onChangeText={(text) => setSelectedAthlete({ ...selectedAthlete, email: text })}
                placeholder="Email"
              />
              <TextInput
                style={styles.input}
                value={selectedAthlete.phone}
                onChangeText={(text) => setSelectedAthlete({ ...selectedAthlete, phone: text })}
                placeholder="Phone"
              />
                <View style={styles.booleanRow}>
                  <Text>Active:</Text>
                  <TouchableOpacity
                    onPress={() => setSelectedAthlete({ ...selectedAthlete, active: !selectedAthlete.active })}
                    style={{
                      marginLeft: 8,
                      flexDirection: 'row',
                      alignItems: 'center',
                    }}
                  >
                    <View
                      style={{
                        width: 20,
                        height: 20,
                        borderWidth: 1,
                        borderColor: '#ccc',
                        backgroundColor: selectedAthlete.active ? '#4CAF50' : 'transparent',
                        justifyContent: 'center',
                        alignItems: 'center',
                      }}
                    >
                      {selectedAthlete.active && (
                        <Text style={{ color: 'white', fontWeight: 'bold' }}>✔</Text>
                      )}
                    </View>
                  </TouchableOpacity>
                </View>
              <TextInput
                style={styles.input}
                value={selectedAthlete.groups}
                onChangeText={(text) => setSelectedAthlete({ ...selectedAthlete, groups: text })}
                placeholder="Team"
              />
                <View style={styles.modalButtons}>
                <TouchableOpacity onPress={saveAthlete} style={{ marginHorizontal: 8 }}>
                  <Ionicons name="save-outline" color="#333" size={24} />
                </TouchableOpacity>
                <TouchableOpacity onPress={closeModal} style={{ marginHorizontal: 8 }}>
                  <Ionicons name="close-outline" color="#FF5722" size={24} />
                </TouchableOpacity>
                <TouchableOpacity onPress={deleteAthlete} style={{ marginHorizontal: 8 }}>
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
    marginRight: 8,
  },
  modalContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  input: {
    width: '100%',
    padding: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  booleanRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  picker: {
    marginBottom: 16,
  },
});

export default AthletesScreen;


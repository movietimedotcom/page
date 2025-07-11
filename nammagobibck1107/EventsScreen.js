import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, Image,
  ActivityIndicator, TouchableOpacity, Linking,
  TextInput, Modal, ScrollView
} from 'react-native';
import { ref, onValue } from 'firebase/database';
import { db } from '../firebase/firebase';

export default function EventsScreen() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adminWhatsapp, setAdminWhatsapp] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [location, setLocation] = useState('');
  const [image, setImage] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    const eventsRef = ref(db, 'events');
    onValue(eventsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const eventList = Object.keys(data)
          .filter(key => key !== 'settings')
          .map((key) => ({
            id: key,
            ...data[key],
          }));
        setEvents(eventList);
      } else {
        setEvents([]);
      }
      setLoading(false);
    });

    const adminRef = ref(db, 'events/settings/adminWhatsapp');
    onValue(adminRef, (snapshot) => {
      const number = snapshot.val();
      setAdminWhatsapp(number || '');
    });
  }, []);

  const sendWhatsAppRequest = () => {
    if (!title || !date || !location || !adminWhatsapp) {
      alert('Please fill all required fields');
      return;
    }

    const message = `*Event Submission Request*\n\n🎉 *Title*: ${title}\n📅 *Date*: ${date}\n📍 *Location*: ${location}\n📝 *Description*: ${description || '-'}\n🖼 *Image URL*: ${image || '-'}\n\nPlease review and publish this event.`;
    const encoded = encodeURIComponent(message);
    Linking.openURL(`https://wa.me/${adminWhatsapp}?text=${encoded}`);
    setModalVisible(false);
    setTitle('');
    setDate('');
    setLocation('');
    setImage('');
    setDescription('');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Upcoming Events</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#888" />
      ) : (
        <FlatList
          data={events}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.card}>
              {item.image && (
                <Image source={{ uri: item.image }} style={styles.image} />
              )}
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.detail}>📅 {item.date}</Text>
              <Text style={styles.detail}>📍 {item.location}</Text>
            </View>
          )}
        />
      )}

      {/* Floating Add Button */}
      <TouchableOpacity style={styles.addButton} onPress={() => setModalVisible(true)}>
        <Text style={styles.addButtonText}>＋</Text>
      </TouchableOpacity>

      {/* Modal for Event Submission */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <ScrollView contentContainerStyle={styles.modalContent}>
            <Text style={styles.modalHeading}>Request to Post New Event</Text>
            <TextInput
              style={styles.input}
              placeholder="Event Title*"
              value={title}
              onChangeText={setTitle}
            />
            <TextInput
              style={styles.input}
              placeholder="Date (e.g. 25 Aug 2025)*"
              value={date}
              onChangeText={setDate}
            />
            <TextInput
              style={styles.input}
              placeholder="Location*"
              value={location}
              onChangeText={setLocation}
            />
            <TextInput
              style={styles.input}
              placeholder="Description (optional)"
              value={description}
              onChangeText={setDescription}
              multiline
            />
    
            <TouchableOpacity style={styles.sendButton} onPress={sendWhatsAppRequest}>
              <Text style={styles.sendButtonText}>Send via WhatsApp</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Text style={styles.closeText}>Close</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 12,
    backgroundColor: '#f6f8fa',
  },
  heading: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  card: {
    backgroundColor: '#fff',
    padding: 8,
    marginBottom: 8,
    borderRadius: 6,
    shadowColor: '#aaa',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 1,
  },
  image: {
    width: '100%',
    height: 120,
    borderRadius: 4,
    marginBottom: 8,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  detail: {
    fontSize: 13,
    color: '#444',
    marginBottom: 1,
  },
  addButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#007bff',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 28,
    marginBottom: 2,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#00000088',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
  },
  modalHeading: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    marginBottom: 10,
    borderRadius: 6,
    fontSize: 14,
  },
  sendButton: {
    backgroundColor: '#25D366',
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  sendButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  closeText: {
    textAlign: 'center',
    color: '#007bff',
    marginTop: 10,
  },
});

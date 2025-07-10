import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Image, ActivityIndicator } from 'react-native';
import { ref, onValue } from 'firebase/database';
import { db } from '../firebase/firebase';

export default function EventsScreen() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const eventsRef = ref(db, 'events');
    onValue(eventsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const eventList = Object.keys(data).map((key) => ({
          id: key,
          ...data[key],
        }));
        setEvents(eventList);
      } else {
        setEvents([]);
      }
      setLoading(false);
    });
  }, []);

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
});

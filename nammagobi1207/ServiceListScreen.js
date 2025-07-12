import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, Image, TouchableOpacity, Linking
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ref, onValue } from 'firebase/database';
import { db } from '../firebase/firebase';

export default function ServiceSearchResultsScreen({ route }) {
  const { searchQuery = '', category = '' } = route.params || {};
  const [allProviders, setAllProviders] = useState([]);
  const [filtered, setFiltered] = useState([]);

  useEffect(() => {
    const providersRef = ref(db, 'services/providers');
    onValue(providersRef, (snapshot) => {
      const data = snapshot.val();
      const providers = data ? Object.values(data) : [];
      setAllProviders(providers);
    });
  }, []);

  useEffect(() => {
    const query = searchQuery?.toLowerCase() || '';
    const selectedCategory = category?.toLowerCase() || '';

    const result = allProviders.filter(item => {
      const nameMatch = item.name?.toLowerCase().includes(query);
      const categoryMatch = item.category?.toLowerCase().includes(query);
      const exactCategoryMatch = item.category?.toLowerCase() === selectedCategory;

      // If category param is sent, filter by category exactly
      if (category) return exactCategoryMatch;
      // Else, filter by search query in name or category
      return nameMatch || categoryMatch;
    });

    setFiltered(result);
  }, [searchQuery, category, allProviders]);

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <Image source={{ uri: item.image }} style={styles.image} />
      <View style={{ flex: 1 }}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.category}>{item.category}</Text>
        <TouchableOpacity
          style={styles.callButton}
          onPress={() => Linking.openURL(`tel:${item.phone}`)}
        >
          <Text style={styles.callText}>Call</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={filtered}
        keyExtractor={(item, index) => index.toString()}
        renderItem={renderItem}
        ListEmptyComponent={<Text style={styles.emptyText}>No services found</Text>}
        contentContainerStyle={{ padding: 10 }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  card: {
    flexDirection: 'row',
    backgroundColor: '#f9f9f9',
    marginBottom: 12,
    borderRadius: 10,
    padding: 10,
    elevation: 2,
  },
  image: {
    width: 64,
    height: 64,
    borderRadius: 10,
    marginRight: 12,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  category: {
    fontSize: 13,
    color: '#666',
    marginBottom: 6,
  },
  callButton: {
    backgroundColor: '#007bff',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  callText: {
    color: '#fff',
    fontWeight: '600',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 40,
    fontSize: 16,
    color: '#777',
  },
});

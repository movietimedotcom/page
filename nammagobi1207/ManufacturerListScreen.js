import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, Image, StyleSheet,
  ActivityIndicator, TouchableOpacity, Linking, Modal
} from 'react-native';
import { useRoute } from '@react-navigation/native';
import { ref, onValue } from 'firebase/database';
import { db } from '../firebase/firebase';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';

export default function ManufacturerList() {
  const route = useRoute();
  const { category = 'All' } = route.params || {};

  const [manufacturers, setManufacturers] = useState([]);
  const [filteredList, setFilteredList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortModalVisible, setSortModalVisible] = useState(false);
  const [filterModalVisible, setFilterModalVisible] = useState(false);

  useEffect(() => {
    const manufacturersRef = ref(db, 'manufacturers/products');
    return onValue(manufacturersRef, snapshot => {
      const data = snapshot.val();
      let list = data ? Object.values(data) : [];

      if (category && category !== 'All') {
        list = list.filter(item =>
          item.category?.toLowerCase() === category.toLowerCase()
        );
      }

      setManufacturers(list);
      setFilteredList(list);
      setLoading(false);
    });
  }, [category]);

  const openWhatsApp = number => Linking.openURL(`https://wa.me/${number}`);
  const makeCall = number => Linking.openURL(`tel:${number}`);

  const sortByPrice = (order = 'asc') => {
    const sorted = [...filteredList].sort((a, b) => {
      const priceA = parseFloat(a.price) || 0;
      const priceB = parseFloat(b.price) || 0;
      return order === 'asc' ? priceA - priceB : priceB - priceA;
    });
    setFilteredList(sorted);
    setSortModalVisible(false);
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <Image source={{ uri: item.image }} style={styles.image} />
      <View style={{ flex: 1 }}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.category}>{item.category}</Text>
        <Text style={styles.price}>₹{item.price}</Text>
        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.actionBtn} onPress={() => openWhatsApp(item.phone)}>
            <Ionicons name="logo-whatsapp" size={18} color="#25D366" />
            <Text style={styles.btnText}>WhatsApp</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={() => makeCall(item.phone)}>
            <Ionicons name="call-outline" size={18} color="#007bff" />
            <Text style={styles.btnText}>Call</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Manufacturers - {category}</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#007bff" />
      ) : (
        <FlatList
          data={filteredList}
          renderItem={renderItem}
          keyExtractor={(item, index) => item.id || index.toString()}
          contentContainerStyle={{ padding: 10, paddingBottom: 100 }}
        />
      )}

      {/* Bottom Bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.iconLabel} onPress={() => setSortModalVisible(true)}>
          <Ionicons name="swap-vertical-outline" size={26} color="#333" />
          <Text style={styles.iconText}>Sort</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.iconLabel} onPress={() => setFilterModalVisible(true)}>
          <Ionicons name="filter-outline" size={26} color="#333" />
          <Text style={styles.iconText}>Filter</Text>
        </TouchableOpacity>
      </View>

      {/* Sort Modal */}
      <Modal
        visible={sortModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setSortModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Sort By</Text>
            <TouchableOpacity onPress={() => sortByPrice('asc')}>
              <Text style={styles.modalOption}>Price: Low to High</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => sortByPrice('desc')}>
              <Text style={styles.modalOption}>Price: High to Low</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setSortModalVisible(false)}>
              <Text style={[styles.modalOption, { color: 'red', marginTop: 20 }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Filter Modal */}
      <Modal
        visible={filterModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Filter Options</Text>
            <Text style={{ color: '#555' }}>Coming soon...</Text>
            <TouchableOpacity onPress={() => setFilterModalVisible(false)}>
              <Text style={[styles.modalOption, { color: 'red', marginTop: 20 }]}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { fontSize: 20, fontWeight: 'bold', padding: 10 },
  card: {
    flexDirection: 'row',
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    marginBottom: 12,
    padding: 10,
    alignItems: 'center',
  },
  image: { width: 80, height: 80, borderRadius: 8, marginRight: 12 },
  name: { fontSize: 16, fontWeight: '600' },
  category: { fontSize: 14, color: '#666' },
  price: { fontSize: 14, color: '#000', fontWeight: '500', marginTop: 4 },
  buttonRow: { flexDirection: 'row', marginTop: 8, gap: 10 },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e9e9e9',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  btnText: { marginLeft: 6, fontSize: 13, color: '#333' },

  // Bottom Bar
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    paddingVertical: 10,
    zIndex: 10,
  },
  iconLabel: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    fontSize: 12,
    color: '#333',
    marginTop: 2,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: '#00000055',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  modalOption: {
    fontSize: 16,
    paddingVertical: 12,
    color: '#333',
  },
});

import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, Image, TouchableOpacity, StyleSheet,
  ActivityIndicator, Dimensions, Linking, Modal, Pressable
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute } from '@react-navigation/native';
import { ref, onValue } from 'firebase/database';
import { db } from '../firebase/firebase';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export default function PreOwnedList() {
  const route = useRoute();
  const { category, searchQuery } = route.params;
  const [allProducts, setAllProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortModalVisible, setSortModalVisible] = useState(false);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [brands, setBrands] = useState([]);
  const [selectedBrand, setSelectedBrand] = useState(null);

  useEffect(() => {
    const productsRef = ref(db, 'preowned/products');
    return onValue(productsRef, snapshot => {
      const data = snapshot.val();
      const list = data ? Object.values(data) : [];

      setAllProducts(list);
      applyFilters(list, searchQuery, category);
      setLoading(false);
    });
  }, [category, searchQuery]);

  const applyFilters = (list, query, cat) => {
    let filtered = [];

    if (query) {
      const q = query.toLowerCase();
      filtered = list.filter(item =>
        item.name?.toLowerCase().includes(q) ||
        item.category?.toLowerCase().includes(q) ||
        item.description?.toLowerCase().includes(q)
      );
    } else if (cat && cat !== 'All') {
      filtered = list.filter(item => item.category?.toLowerCase() === cat.toLowerCase());
    } else {
      filtered = list;
    }

    setFilteredProducts(filtered);

    // Extract brand list
    const brandSet = new Set(filtered.map(item => item.brand?.trim()).filter(Boolean));
    setBrands([...brandSet]);
  };

  const openWhatsApp = number => Linking.openURL(`https://wa.me/${number}`);
  const makeCall = number => Linking.openURL(`tel:${number}`);

  const sortBy = (type) => {
    const sorted = [...filteredProducts].sort((a, b) => {
      const priceA = parseFloat(a.price);
      const priceB = parseFloat(b.price);
      return type === 'low' ? priceA - priceB : priceB - priceA;
    });
    setFilteredProducts(sorted);
    setSortModalVisible(false);
  };

  const filterByBrand = (brand) => {
    setSelectedBrand(brand);
    const filtered = brand
      ? allProducts.filter(item =>
          (!searchQuery || (
            item.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.description?.toLowerCase().includes(searchQuery.toLowerCase())
          )) &&
          item.brand === brand
        )
      : allProducts.filter(item => {
          if (searchQuery) {
            const q = searchQuery.toLowerCase();
            return (
              item.name?.toLowerCase().includes(q) ||
              item.category?.toLowerCase().includes(q) ||
              item.description?.toLowerCase().includes(q)
            );
          } else if (category && category !== 'All') {
            return item.category?.toLowerCase() === category.toLowerCase();
          } else {
            return true;
          }
        });

    setFilteredProducts(filtered);
    setFilterModalVisible(false);
  };

  const screenTitle = searchQuery
    ? `Search Results for "${searchQuery}"`
    : `Category: ${category}`;

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>{screenTitle}</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#007bff" />
      ) : filteredProducts.length === 0 ? (
        <Text style={styles.noData}>No products found.</Text>
      ) : (
        <FlatList
          data={filteredProducts}
          keyExtractor={(_, index) => index.toString()}
          contentContainerStyle={styles.listContainer}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Image source={{ uri: item.image }} style={styles.image} />
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.category}>{item.category}</Text>
                <Text style={{ fontSize: 13, color: '#555' }}>₹{item.price}</Text>
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
          )}
        />
      )}

      {/* Bottom Sort & Filter Bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.barButton} onPress={() => setSortModalVisible(true)}>
          <Ionicons name="swap-vertical-outline" size={20} color="#000" />
          <Text style={styles.barText}>Sort</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.barButton} onPress={() => setFilterModalVisible(true)}>
          <Ionicons name="filter-outline" size={20} color="#000" />
          <Text style={styles.barText}>Filter</Text>
        </TouchableOpacity>
      </View>

      {/* Sort Modal */}
      <Modal transparent visible={sortModalVisible} animationType="slide">
        <Pressable style={styles.modalOverlay} onPress={() => setSortModalVisible(false)}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Sort By</Text>
            <TouchableOpacity onPress={() => sortBy('low')}><Text style={styles.option}>Price: Low to High</Text></TouchableOpacity>
            <TouchableOpacity onPress={() => sortBy('high')}><Text style={styles.option}>Price: High to Low</Text></TouchableOpacity>
          </View>
        </Pressable>
      </Modal>

      {/* Filter Modal */}
      <Modal transparent visible={filterModalVisible} animationType="slide">
        <Pressable style={styles.modalOverlay} onPress={() => setFilterModalVisible(false)}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Filter by Brand</Text>
            <TouchableOpacity onPress={() => filterByBrand(null)}>
              <Text style={styles.option}>All Brands</Text>
            </TouchableOpacity>
            {brands.map((brand, index) => (
              <TouchableOpacity key={index} onPress={() => filterByBrand(brand)}>
                <Text style={styles.option}>{brand}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  title: { fontSize: 18, fontWeight: 'bold', margin: 10, color: '#333' },
  noData: { marginTop: 20, textAlign: 'center', color: '#888' },
  listContainer: { paddingHorizontal: 10, paddingBottom: 70 },
  card: { flexDirection: 'row', backgroundColor: '#f8f8f8', borderRadius: 12, marginBottom: 12, padding: 10, alignItems: 'center' },
  image: { width: 80, height: 80, borderRadius: 8, marginRight: 12 },
  name: { fontSize: 16, fontWeight: '600' },
  category: { fontSize: 14, color: '#666', marginTop: 2 },
  buttonRow: { flexDirection: 'row', marginTop: 8, gap: 10 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#e9e9e9', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 6 },
  btnText: { marginLeft: 6, fontSize: 13, color: '#333' },

  // Bottom Bar
  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', justifyContent: 'space-around', backgroundColor: '#fff',
    borderTopWidth: 1, borderColor: '#ddd', paddingVertical: 10,
  },
  barButton: { alignItems: 'center' },
  barText: { fontSize: 13, color: '#333', marginTop: 2 },

  // Modal
  modalOverlay: {
    flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)'
  },
  modalBox: {
    backgroundColor: '#fff', padding: 20, borderTopLeftRadius: 16, borderTopRightRadius: 16
  },
  modalTitle: { fontSize: 16, fontWeight: '600', marginBottom: 10 },
  option: { fontSize: 15, paddingVertical: 8, color: '#007bff' },
});

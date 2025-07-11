import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, Image, StyleSheet, Dimensions, TouchableOpacity,
  ActivityIndicator, TextInput, ScrollView, Linking, FlatList
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ref, onValue } from 'firebase/database';
import { db } from '../firebase/firebase';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export default function PreOwnedScreen() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [banners, setBanners] = useState([]);
  const [search, setSearch] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [adminWhatsapp, setAdminWhatsapp] = useState('');

  const carouselRef = useRef(null);
  const navigation = useNavigation();

  useEffect(() => {
    const productsRef = ref(db, 'preowned/products');
    return onValue(productsRef, snapshot => {
      const data = snapshot.val();
      const list = data ? Object.values(data).sort((a, b) => b.timestamp - a.timestamp) : [];
      setProducts(list);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    const categoriesRef = ref(db, 'preowned/categories');
    return onValue(categoriesRef, snapshot => {
      const data = snapshot.val();
      setCategories(data ? Object.values(data) : []);
    });
  }, []);

  useEffect(() => {
    const bannersRef = ref(db, 'preowned/banners');
    return onValue(bannersRef, snapshot => {
      const data = snapshot.val();
      setBanners(data ? Object.values(data) : []);
    });
  }, []);

  useEffect(() => {
    const settingsRef = ref(db, 'preowned/settings/adminWhatsapp');
    return onValue(settingsRef, snapshot => {
      const number = snapshot.val();
      if (number) setAdminWhatsapp(number);
    });
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (!banners.length) return;
      const next = (currentIndex + 1) % banners.length;
      setCurrentIndex(next);
      if (carouselRef.current) {
        carouselRef.current.scrollTo({ x: width * next, animated: true });
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [currentIndex, banners]);

  const filteredProducts = products.filter(item => {
    const query = search.toLowerCase();
    return (
      item.name?.toLowerCase().includes(query) ||
      item.category?.toLowerCase().includes(query) ||
      item.description?.toLowerCase().includes(query)
    );
  });

  const keywordSuggestions = filteredProducts.slice(0, 5);

  const openWhatsApp = number => Linking.openURL(`https://wa.me/${number}`);
  const makeCall = number => Linking.openURL(`tel:${number}`);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search pre-owned products"
          value={search}
          onChangeText={(text) => {
            setSearch(text);
            setShowSuggestions(true);
          }}
        />

        {/* 🔍 Keyword Suggestions */}
        {search.length > 0 && showSuggestions && keywordSuggestions.length > 0 && (
          <View style={styles.suggestionBox}>
            {keywordSuggestions.map((item, index) => {
              const query = search.toLowerCase();
              const nameMatch = item.name?.toLowerCase().includes(query);
              const categoryMatch = item.category?.toLowerCase().includes(query);
              const descMatch = item.description?.toLowerCase().includes(query);

              let matchedWord = '';

              if (nameMatch) {
                matchedWord = item.name.split(' ').find(word => word.toLowerCase().includes(query)) || item.name;
              } else if (categoryMatch) {
                matchedWord = item.category.split(' ').find(word => word.toLowerCase().includes(query)) || item.category;
              } else if (descMatch) {
                matchedWord = item.description.split(' ').find(word => word.toLowerCase().includes(query)) || item.description;
              }

              return (
                <TouchableOpacity
                  key={index}
                  onPress={() => {
  setShowSuggestions(false);
  navigation.navigate('PreOwnedListScreen', {
    category: 'Search',
    searchQuery: matchedWord
  });
}}

                  style={styles.suggestionItem}
                >
                  <Text>{matchedWord}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        <Text style={styles.sectionTitle}>Browse Categories</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesContainer} contentContainerStyle={styles.categoriesScroll}>
          {categories.slice(0, 10).map((item, i) => (
            <TouchableOpacity key={i} style={styles.categoryItem} onPress={() => navigation.navigate('PreOwnedListScreen', { category: item.title })}>
              <View style={styles.iconWrapper}>
                <Image source={{ uri: item.icon }} style={styles.categoryIcon} />
              </View>
              <Text style={styles.categoryText}>{item.title}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <ScrollView
          horizontal
          pagingEnabled
          ref={carouselRef}
          showsHorizontalScrollIndicator={false}
          style={styles.carousel}
          onScroll={(e) => {
            const x = e.nativeEvent.contentOffset.x;
            setCurrentIndex(Math.round(x / width));
          }}
        >
          {banners.map((url, i) => (
            <Image key={i} source={{ uri: url }} style={styles.bannerImage} />
          ))}
        </ScrollView>

        <View style={styles.dotsContainer}>
          {banners.map((_, i) => (
            <View key={i} style={[styles.dot, { backgroundColor: i === currentIndex ? '#007bff' : '#ccc' }]} />
          ))}
        </View>

        <Text style={styles.sectionTitle}>Pre-Owned Products</Text>
        {loading ? (
          <ActivityIndicator size="large" color="#007bff" />
        ) : (
          <View style={styles.productList}>
            {filteredProducts.length > 0 ? (
              <>
                {filteredProducts.slice(0, 25).map((item, i) => (
                  <View key={i} style={styles.card}>
                    <Image source={{ uri: item.image }} style={styles.image} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.name}>{item.name}</Text>
                      <Text style={styles.category}>{item.category}</Text>
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
                ))}
                <TouchableOpacity
                  onPress={() => navigation.navigate('PreOwnedListScreen', { category: 'All' })}
                  style={{ alignSelf: 'center', marginVertical: 10 }}
                >
                  <Text style={{ color: '#007bff', fontWeight: '500' }}>View More Products</Text>
                </TouchableOpacity>
              </>
            ) : (
              <Text style={{ padding: 10, color: '#999' }}>No products found.</Text>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  searchInput: { margin: 10, padding: 10, backgroundColor: '#f1f1f1', borderRadius: 10 },
  suggestionBox: { marginHorizontal: 10, marginTop: -5, backgroundColor: '#fff', borderRadius: 6, elevation: 3, zIndex: 5 },
  suggestionItem: { padding: 10, borderBottomColor: '#eee', borderBottomWidth: 1 },
  sectionTitle: { fontSize: 18, fontWeight: '600', paddingHorizontal: 10, marginVertical: 10, color: '#333' },
  categoriesContainer: { marginBottom: 10 },
  categoriesScroll: { paddingHorizontal: 9 },
  categoryItem: { alignItems: 'center', width: 70, marginRight: 9 },
  iconWrapper: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#f2f2f2', justifyContent: 'center', alignItems: 'center', marginBottom: 6, elevation: 4 },
  categoryIcon: { width: 50, height: 50, borderRadius: 25 },
  categoryText: { fontSize: 12, textAlign: 'center', color: '#333' },
  carousel: { height: 180 },
  bannerImage: { width, height: 180 },
  dotsContainer: { flexDirection: 'row', justifyContent: 'center', marginTop: 6 },
  dot: { width: 8, height: 8, borderRadius: 4, marginHorizontal: 4 },
  productList: { paddingHorizontal: 10 },
  card: { flexDirection: 'row', backgroundColor: '#f8f8f8', borderRadius: 12, marginBottom: 12, padding: 10, alignItems: 'center' },
  image: { width: 80, height: 80, borderRadius: 8, marginRight: 12 },
  name: { fontSize: 16, fontWeight: '600' },
  category: { fontSize: 14, color: '#666', marginTop: 2 },
  buttonRow: { flexDirection: 'row', marginTop: 8, gap: 10 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#e9e9e9', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 6 },
  btnText: { marginLeft: 6, fontSize: 13, color: '#333' },
});

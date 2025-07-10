import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ref, onValue } from 'firebase/database';
import { db } from '../firebase/firebase';
import { useNavigation } from '@react-navigation/native';

const numColumns = 2;
const { width } = Dimensions.get('window');
const itemWidth = (width - 30) / numColumns;

export default function RetailScreen() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const carouselRef = useRef(null);
  const navigation = useNavigation();

  useEffect(() => {
    const retailRef = ref(db, 'retail');
    const unsubscribe = onValue(retailRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const bannerList = data.banners ? Object.values(data.banners) : [];
        const categoryList = data.categories ? Object.values(data.categories) : [];
        const productList = data.products ? Object.values(data.products) : [];
        setBanners(bannerList);
        setCategories(categoryList);
        setProducts(productList);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (banners.length === 0) return;
      const nextIndex = (currentIndex + 1) % banners.length;
      setCurrentIndex(nextIndex);
      if (carouselRef.current) {
        carouselRef.current.scrollTo({ x: width * nextIndex, animated: true });
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [currentIndex, banners]);

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Search */}
        <TextInput
          style={styles.searchInput}
          placeholder="Search for products"
          value={search}
          onChangeText={setSearch}
        />

        {/* Banner Carousel */}
        <ScrollView
          horizontal
          pagingEnabled
          ref={carouselRef}
          showsHorizontalScrollIndicator={false}
          style={styles.carousel}
          onScroll={(e) => {
            const offsetX = e.nativeEvent.contentOffset.x;
            const index = Math.round(offsetX / width);
            setCurrentIndex(index);
          }}
        >
          {banners.map((url, index) => (
            <Image
              key={index}
              source={{ uri: url }}
              style={styles.bannerImage}
              resizeMode="cover"
            />
          ))}
        </ScrollView>

        {/* Dots */}
        <View style={styles.dotsContainer}>
          {banners.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                { backgroundColor: currentIndex === index ? '#007bff' : '#ccc' },
              ]}
            />
          ))}
        </View>

        {/* Categories */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesScroll}
          style={styles.categoriesContainer}
        >
          {categories.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.categoryItem}
              activeOpacity={0.8}
              onPress={() =>
                navigation.navigate('ProductList', { category: item.title })
              }
            >
              <View style={styles.iconWrapper}>
                <Image source={{ uri: item.icon }} style={styles.categoryIcon} />
              </View>
              <Text style={styles.categoryText}>{item.title}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Products */}
        <Text style={styles.sectionTitle}>Popular Products</Text>
        {loading ? (
          <ActivityIndicator size="large" color="#007bff" />
        ) : (
          <View style={styles.productGrid}>
            {filteredProducts.length > 0 ? (
              filteredProducts.map((item) => (
                <TouchableOpacity key={item.id} style={styles.card}>
                  <Image source={{ uri: item.image }} style={styles.image} />
                  <Text style={styles.name}>{item.name}</Text>
                  <Text style={styles.price}>{item.price}</Text>
                </TouchableOpacity>
              ))
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
  searchInput: {
    margin: 10,
    padding: 10,
    backgroundColor: '#f1f1f1',
    borderRadius: 10,
  },
  carousel: { height: 180 },
  bannerImage: { width: width, height: 180 },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  categoriesContainer: { marginVertical: 6 },
  categoriesScroll: { paddingHorizontal: 9 },
  categoryItem: {
    alignItems: 'center',
    width: 70,
    marginRight: 5,
  },
  iconWrapper: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f3e8ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 4,
  },
  categoryIcon: { width: 50, height: 50, borderRadius: 25 },
  categoryText: { fontSize: 12, textAlign: 'center', color: '#333' },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    paddingHorizontal: 10,
    marginVertical: 10,
    color: '#333',
  },
  productGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
  },
  card: {
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    marginBottom: 10,
    width: itemWidth,
    padding: 10,
    alignItems: 'center',
  },
  image: {
    width: itemWidth - 30,
    height: itemWidth - 30,
    borderRadius: 8,
  },
  name: { fontSize: 14, marginTop: 6, fontWeight: '500' },
  price: { fontSize: 14, color: '#28a745', marginTop: 4 },
});

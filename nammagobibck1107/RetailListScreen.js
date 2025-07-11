import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Image,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useRoute } from '@react-navigation/native';
import { ref, onValue } from 'firebase/database';
import { db } from '../firebase/firebase';

const { width } = Dimensions.get('window');
const numColumns = 2;
const itemWidth = (width - 30) / numColumns;

export default function ProductListScreen() {
  const route = useRoute();
  const { category } = route.params;

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const productsRef = ref(db, 'products');
    const unsubscribe = onValue(productsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const allProducts = Object.values(data);
        const filtered = allProducts.filter(
          (item) => item.category?.toLowerCase() === category.toLowerCase()
        );
        setProducts(filtered);
      } else {
        setProducts([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [category]);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>{category}</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#007bff" />
      ) : products.length > 0 ? (
        <View style={styles.productGrid}>
          {products.map((item) => (
            <TouchableOpacity key={item.id} style={styles.card}>
              <Image source={{ uri: item.image }} style={styles.image} />
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.price}>{item.price}</Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : (
        <Text style={styles.noProducts}>No products found for this category.</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  title: {
    fontSize: 20,
    fontWeight: '600',
    margin: 10,
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
  noProducts: {
    textAlign: 'center',
    marginTop: 30,
    color: '#999',
    fontSize: 16,
  },
});
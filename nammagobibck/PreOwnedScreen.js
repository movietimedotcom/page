import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, Image, StyleSheet, Dimensions, TouchableOpacity,
  ActivityIndicator, TextInput, ScrollView, Linking, Modal, FlatList
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
  const [currentIndex, setCurrentIndex] = useState(0);
  const [modalVisible, setModalVisible] = useState(false);
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [adminWhatsapp, setAdminWhatsapp] = useState('');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

  const [newProduct, setNewProduct] = useState({
    name: '', price: '', category: '', description: '', phone: ''
  });

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

  const filteredProducts = products.filter(item =>
    item.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleWhatsAppRequest = () => {
    const { name, price, category, phone, description } = newProduct;
    if (!name || !price || !category || !phone) {
      alert('Please fill all required fields.');
      return;
    }

    if (!adminWhatsapp) {
      alert('Admin WhatsApp number not configured.');
      return;
    }

    const message = `*New Pre-Owned Product Request*\n\n📦 *Name*: ${name}\n💰 *Price*: ₹${price}\n📂 *Category*: ${category}\n📞 *Phone*: ${phone}\n📝 *Description*: ${description || '-'}\n\n📷 User will send image separately. Please verify and post this product.`;
    const encoded = encodeURIComponent(message);
    Linking.openURL(`https://wa.me/${adminWhatsapp}?text=${encoded}`);

    setModalVisible(false);
    setNewProduct({ name: '', price: '', category: '', description: '', phone: '' });
    setShowCategoryDropdown(false);
  };

  const openWhatsApp = number => Linking.openURL(`https://wa.me/${number}`);
  const makeCall = number => Linking.openURL(`tel:${number}`);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search pre-owned products"
          value={search}
          onChangeText={setSearch}
        />

        <Text style={styles.sectionTitle}>Browse Categories</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesContainer} contentContainerStyle={styles.categoriesScroll}>
          {categories.slice(0, 10).map((item, i) => (
            <TouchableOpacity key={i} style={styles.categoryItem} onPress={() => navigation.navigate('PreOwnedList', { category: item.title })}>
              <View style={styles.iconWrapper}>
                <Image source={{ uri: item.icon }} style={styles.categoryIcon} />
              </View>
              <Text style={styles.categoryText}>{item.title}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={styles.categoryItem} onPress={() => setCategoryModalVisible(true)}>
            <View style={styles.iconWrapper}>
              <Ionicons name="grid-outline" size={26} color="#007bff" />
            </View>
            <Text style={styles.categoryText}>All</Text>
          </TouchableOpacity>
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
              filteredProducts.map((item, i) => (
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
              ))
            ) : (
              <Text style={{ padding: 10, color: '#999' }}>No products found.</Text>
            )}
          </View>
        )}
      </ScrollView>

      <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
        <Ionicons name="add" size={30} color="#fff" />
      </TouchableOpacity>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlayCenter}>
          <View style={styles.modalForm}>
            <Text style={styles.modalTitle}>Post Requirement</Text>
            <Text style={{ color: 'red', fontSize: 13, marginBottom: 5 }}>
              Note: Your product request will be verified manually.
            </Text>

            <TextInput
              placeholder="Name"
              style={styles.input}
              value={newProduct.name}
              onChangeText={(val) => setNewProduct({ ...newProduct, name: val })}
            />
            <TextInput
              placeholder="Price"
              style={styles.input}
              value={newProduct.price}
              onChangeText={(val) => setNewProduct({ ...newProduct, price: val })}
            />

            {/* Category Dropdown */}
            <View style={styles.input}>
              <TouchableOpacity
                onPress={() => setShowCategoryDropdown(!showCategoryDropdown)}
                style={{
                  paddingVertical: 10,
                  paddingHorizontal: 10,
                  borderRadius: 6,
                  borderWidth: 1,
                  borderColor: '#ccc',
                  backgroundColor: '#f9f9f9',
                }}
              >
                <Text>{newProduct.category || 'Choose category'}</Text>
              </TouchableOpacity>

              {showCategoryDropdown && (
                <View style={{ marginTop: 5, backgroundColor: '#fff', borderWidth: 1, borderColor: '#ccc', borderRadius: 6 }}>
                  {categories.map((cat, idx) => (
                    <TouchableOpacity
                      key={idx}
                      onPress={() => {
                        setNewProduct({ ...newProduct, category: cat.title });
                        setShowCategoryDropdown(false);
                      }}
                      style={{ padding: 10, borderBottomColor: '#eee', borderBottomWidth: idx !== categories.length - 1 ? 1 : 0 }}
                    >
                      <Text style={{ color: newProduct.category === cat.title ? '#007bff' : '#000' }}>
                        {cat.title}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            <TextInput
              placeholder="Phone"
              style={styles.input}
              value={newProduct.phone}
              onChangeText={(val) => setNewProduct({ ...newProduct, phone: val })}
            />
            <TextInput
              placeholder="Description"
              style={[styles.input, { height: 70 }]}
              value={newProduct.description}
              onChangeText={(val) => setNewProduct({ ...newProduct, description: val })}
              multiline
            />

            <Text style={{ marginTop: 10, color: '#555', fontSize: 13 }}>
              📷 Please send your product image via WhatsApp after submitting.
            </Text>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 }}>
              <TouchableOpacity style={styles.modalAction} onPress={handleWhatsAppRequest}>
                <Text style={{ color: '#fff' }}>Send via WhatsApp</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalAction, { backgroundColor: '#888' }]} onPress={() => setModalVisible(false)}>
                <Text style={{ color: '#fff' }}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={categoryModalVisible} animationType="slide">
        <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
          <Text style={[styles.sectionTitle, { marginTop: 10 }]}>All Categories</Text>
          <FlatList
            data={categories}
            keyExtractor={(item, index) => index.toString()}
            numColumns={3}
            contentContainerStyle={{ padding: 10 }}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={{ flex: 1, alignItems: 'center', margin: 10 }}
                onPress={() => {
                  setCategoryModalVisible(false);
                  navigation.navigate('PreOwnedList', { category: item.title });
                }}
              >
                <Image source={{ uri: item.icon }} style={{ width: 60, height: 60, borderRadius: 30 }} />
                <Text style={{ marginTop: 5, fontSize: 13 }}>{item.title}</Text>
              </TouchableOpacity>
            )}
          />
          <TouchableOpacity style={[styles.modalAction, { margin: 20, backgroundColor: '#dc3545' }]} onPress={() => setCategoryModalVisible(false)}>
            <Text style={{ color: '#fff' }}>Close</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  searchInput: { margin: 10, padding: 10, backgroundColor: '#f1f1f1', borderRadius: 10 },
  sectionTitle: { fontSize: 18, fontWeight: '600', paddingHorizontal: 10, marginVertical: 10, color: '#333' },
  categoriesContainer: { marginBottom: 10 },
  categoriesScroll: { paddingHorizontal: 9 },
  categoryItem: { alignItems: 'center', width: 70, marginRight: 9 },
  iconWrapper: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#f2f2f2', justifyContent: 'center', alignItems: 'center', marginBottom: 6, elevation: 4 },
  categoryIcon: { width: 50, height: 50, borderRadius: 25 },
  categoryText: { fontSize: 12, textAlign: 'center', color: '#333' },
  carousel: { height: 180 },
  bannerImage: { width: width, height: 180 },
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
  fab: { position: 'absolute', bottom: 20, right: 20, backgroundColor: '#007bff', width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', elevation: 5 },
  modalOverlayCenter: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalForm: { backgroundColor: '#fff', width: '90%', borderRadius: 12, padding: 16, elevation: 10 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10, marginTop: 10 },
  modalAction: { backgroundColor: '#28a745', padding: 10, borderRadius: 8, alignItems: 'center', flex: 1, marginHorizontal: 5 },
});

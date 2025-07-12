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
  Linking,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ref, onValue } from 'firebase/database';
import { db } from '../firebase/firebase';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export default function ManufacturerScreen() {
  const [manufacturers, setManufacturers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [banners, setBanners] = useState([]);
  const [adminWhatsapp, setAdminWhatsapp] = useState('');
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);

  // Form modal states
  const [formVisible, setFormVisible] = useState(false);
  const [manufacturerName, setManufacturerName] = useState('');
  const [productType, setProductType] = useState('');
  const [price, setPrice] = useState('');
  const [note, setNote] = useState('');

  const carouselRef = useRef(null);
  const navigation = useNavigation();

  // Fetch manufacturers
  useEffect(() => {
    const manufacturersRef = ref(db, 'manufacturers/products');
    return onValue(manufacturersRef, (snapshot) => {
      const data = snapshot.val();
      setManufacturers(data ? Object.values(data) : []);
      setLoading(false);
    });
  }, []);

  // Fetch categories
  useEffect(() => {
    const categoriesRef = ref(db, 'manufacturers/categories');
    return onValue(categoriesRef, (snapshot) => {
      const data = snapshot.val();
      setCategories(data ? Object.values(data) : []);
    });
  }, []);

  // Fetch banners
  useEffect(() => {
    const bannersRef = ref(db, 'manufacturers/banners');
    return onValue(bannersRef, (snapshot) => {
      const data = snapshot.val();
      setBanners(data ? Object.values(data) : []);
    });
  }, []);

  // Fetch admin WhatsApp number
  useEffect(() => {
    const adminRef = ref(db, 'manufacturers/settings/adminWhatsapp');
    return onValue(adminRef, (snapshot) => {
      const number = snapshot.val();
      if (number) setAdminWhatsapp(number);
    });
  }, []);

  // Auto-slide banners
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

  const filteredManufacturers = manufacturers.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase())
  );

  const openWhatsApp = (number) => Linking.openURL(`https://wa.me/${number}`);
  const makeCall = (number) => Linking.openURL(`tel:${number}`);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search for manufacturers"
          value={search}
          onChangeText={setSearch}
        />

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
            <Image key={index} source={{ uri: url }} style={styles.bannerImage} />
          ))}
        </ScrollView>

        <View style={styles.dotsContainer}>
          {banners.map((_, index) => (
            <View
              key={index}
              style={[styles.dot, { backgroundColor: currentIndex === index ? '#007bff' : '#ccc' }]}
            />
          ))}
        </View>

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
              onPress={() => navigation.navigate('ManufacturerListScreen', { category: item.title })}
            >
              <View style={styles.iconWrapper}>
                <Image source={{ uri: item.icon }} style={styles.categoryIcon} />
              </View>
              <Text style={styles.categoryText}>{item.title}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            style={[styles.categoryItem, { justifyContent: 'center' }]}
            onPress={() => setCategoryModalVisible(true)}
          >
            <View style={styles.iconWrapper}>
              <Ionicons name="grid-outline" size={26} color="#007bff" />
            </View>
            <Text style={styles.categoryText}>All</Text>
          </TouchableOpacity>
        </ScrollView>

        <Text style={styles.sectionTitle}>Popular Manufacturers</Text>
        {loading ? (
          <ActivityIndicator size="large" color="#007bff" />
        ) : (
          <View style={styles.productList}>
            {filteredManufacturers.length > 0 ? (
              filteredManufacturers.map((item) => (
                <View key={item.id} style={styles.card}>
                  <Image source={{ uri: item.image }} style={styles.image} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.name}>{item.name}</Text>
                    <Text style={styles.category}>{item.category}</Text>
                    {item.rating && (
                      <View style={styles.ratingRow}>
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Ionicons
                            key={i}
                            name={i < item.rating ? 'star' : 'star-outline'}
                            size={16}
                            color="#f5a623"
                          />
                        ))}
                      </View>
                    )}
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
                    <TouchableOpacity
                      style={styles.detailsBtn}
                      onPress={() => navigation.navigate('ManufacturerDetails', { item })}
                    >
                      <Text style={styles.detailsText}>View Details</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            ) : (
              <Text style={{ padding: 10, color: '#999' }}>No manufacturers found.</Text>
            )}
          </View>
        )}
      </ScrollView>

      {/* Category Modal */}
      <Modal
        visible={categoryModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setCategoryModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.sidebar}>
            <Text style={styles.modalTitle}>All Categories</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              {categories.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.modalItem}
                  onPress={() => {
                    setCategoryModalVisible(false);
                    navigation.navigate('ManufacturerListScreen', { category: item.title });
                  }}
                >
                  <Image source={{ uri: item.icon }} style={styles.modalIcon} />
                  <Text style={styles.modalText}>{item.title}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
          <TouchableOpacity
            style={styles.modalOverlay}
            onPress={() => setCategoryModalVisible(false)}
          />
        </View>
      </Modal>

      {/* Floating + Button */}
      <TouchableOpacity
        style={styles.floatingButton}
        onPress={() => setFormVisible(true)}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      {/* Form Modal */}
      <Modal
        visible={formVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setFormVisible(false)}
      >
        <View style={styles.modalOverlayCenter}>
          <View style={styles.formContainer}>
            <Text style={styles.modalTitle}>Request New Manufacturer</Text>

            <TextInput
              style={styles.input}
              placeholder="Manufacturer Name"
              value={manufacturerName}
              onChangeText={setManufacturerName}
            />
            <TextInput
              style={styles.input}
              placeholder="Product Type"
              value={productType}
              onChangeText={setProductType}
            />
            <TextInput
              style={styles.input}
              placeholder="Price"
              value={price}
              onChangeText={setPrice}
              keyboardType="numeric"
            />
            <TextInput
              style={[styles.input, { height: 80 }]}
              placeholder="Description"
              multiline
              numberOfLines={3}
              value={note}
              onChangeText={setNote}
            />

            <TouchableOpacity
              style={styles.submitBtn}
              onPress={() => {
                if (!manufacturerName || !productType || !price) {
                  alert('Please fill all fields');
                  return;
                }

                const message = `🛠️ *New Manufacturer Request*\n\n📛 Name: ${manufacturerName}\n📦 Type: ${productType}\n💰 Price: ₹${price}\n📝 Note: ${note || 'N/A'}\n\n📸 Please send product image here.`;

                if (adminWhatsapp) {
                  Linking.openURL(`https://wa.me/${adminWhatsapp}?text=${encodeURIComponent(message)}`);
                } else {
                  alert('Admin WhatsApp number not available');
                }

                setFormVisible(false);
                setManufacturerName('');
                setProductType('');
                setPrice('');
                setNote('');
              }}
            >
              <Text style={{ color: '#fff', fontSize: 16 }}>Send via WhatsApp</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setFormVisible(false)} style={{ marginTop: 10 }}>
              <Text style={{ color: '#007bff', textAlign: 'center' }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  categoriesContainer: { marginVertical: 11 },
  categoriesScroll: { paddingHorizontal: 9 },
  categoryItem: {
    alignItems: 'center',
    width: 70,
    marginRight: 9,
  },
  iconWrapper: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f2f2f2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
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
  productList: { paddingHorizontal: 10 },
  card: {
    flexDirection: 'row',
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    marginBottom: 12,
    padding: 10,
    alignItems: 'center',
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 12,
  },
  name: { fontSize: 16, fontWeight: '600' },
  category: { fontSize: 14, color: '#666', marginTop: 2 },
  ratingRow: { flexDirection: 'row', marginTop: 5 },
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
  detailsBtn: {
    marginTop: 8,
    paddingVertical: 6,
    backgroundColor: '#007bff',
    borderRadius: 6,
    alignItems: 'center',
    width: 120,
  },
  detailsText: { color: '#fff', fontSize: 14, fontWeight: '500' },
  modalContainer: { flex: 1, flexDirection: 'row' },
  sidebar: {
    width: '70%',
    backgroundColor: '#fff',
    padding: 16,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  modalText: { fontSize: 16, color: '#333' },
  modalOverlay: {
    width: '30%',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  floatingButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#007bff',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
  },
  modalOverlayCenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  formContainer: {
    width: '90%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    elevation: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    marginTop: 10,
  },
  submitBtn: {
    marginTop: 15,
    backgroundColor: '#25D366',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
});

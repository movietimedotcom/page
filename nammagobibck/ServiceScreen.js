import React, { useEffect, useState } from 'react';
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
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ref, onValue } from 'firebase/database';
import { db } from '../firebase/firebase';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

const numColumns = 5;

export default function ServiceProviderScreen() {
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const navigation = useNavigation();

  useEffect(() => {
    const servicesRef = ref(db, 'services/providers');
    const unsubscribe = onValue(servicesRef, (snapshot) => {
      const data = snapshot.val();
      setServices(data ? Object.values(data) : []);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const categoriesRef = ref(db, 'services/categories');
    const unsubscribe = onValue(categoriesRef, (snapshot) => {
      const data = snapshot.val();
      setCategories(data ? Object.values(data) : []);
    });
    return () => unsubscribe();
  }, []);

  const filteredServices = services.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase())
  );

  const openWhatsApp = (number) => {
    Linking.openURL(`https://wa.me/${number}`);
  };

  const makeCall = (number) => {
    Linking.openURL(`tel:${number}`);
  };

  const renderCategoryItem = ({ item }) => (
    <TouchableOpacity
      style={styles.categoryItem}
      onPress={() => navigation.navigate('ServiceList', { category: item.title })}
    >
      <View style={[styles.iconWrapper, { backgroundColor: item.color || '#FFFFFF' }]}>
        <Image source={{ uri: item.icon }} style={styles.categoryIcon} />
      </View>
      <Text style={styles.categoryText} numberOfLines={2}>{item.title}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search for service providers"
          value={search}
          onChangeText={setSearch}
        />

        <Text style={styles.sectionTitle}>Service Categories</Text>
        <FlatList
          data={categories}
          renderItem={renderCategoryItem}
          keyExtractor={(_, index) => index.toString()}
          numColumns={numColumns}
          contentContainerStyle={styles.categoriesGrid}
          scrollEnabled={false}
        />

        <Text style={styles.sectionTitle}>Popular Services</Text>
        {loading ? (
          <ActivityIndicator size="large" color="#007bff" />
        ) : (
          <View style={styles.productList}>
            {filteredServices.length > 0 ? (
              filteredServices.map((item) => (
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
                      <TouchableOpacity
                        style={styles.actionBtn}
                        onPress={() => openWhatsApp(item.phone)}
                      >
                        <Ionicons name="logo-whatsapp" size={18} color="#25D366" />
                        <Text style={styles.btnText}>WhatsApp</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.actionBtn}
                        onPress={() => makeCall(item.phone)}
                      >
                        <Ionicons name="call-outline" size={18} color="#007bff" />
                        <Text style={styles.btnText}>Call</Text>
                      </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                      style={styles.detailsBtn}
                      onPress={() => navigation.navigate('ServiceDetails', { item })}
                    >
                      <Text style={styles.detailsText}>View Details</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            ) : (
              <Text style={{ padding: 10, color: '#999' }}>No services found.</Text>
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    paddingHorizontal: 10,
    marginVertical: 10,
    color: '#333',
  },
  categoriesGrid: {
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  categoryItem: {
    flex: 1,
    maxWidth: Dimensions.get('window').width / numColumns - 12,
    alignItems: 'center',
    margin: 6,
  },
  iconWrapper: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    marginBottom: 4,
  },
  categoryIcon: { width: 50, height: 50, borderRadius: 25 },
  categoryText: {
    fontSize: 11,
    textAlign: 'center',
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
  ratingRow: {
    flexDirection: 'row',
    marginTop: 5,
  },
  buttonRow: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 10,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e9e9e9',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  btnText: {
    marginLeft: 6,
    fontSize: 13,
    color: '#333',
  },
  detailsBtn: {
    marginTop: 8,
    paddingVertical: 6,
    backgroundColor: '#007bff',
    borderRadius: 6,
    alignItems: 'center',
    width: 120,
  },
  detailsText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
});

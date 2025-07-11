import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Linking,
  Dimensions,
  FlatList,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ref, onValue } from 'firebase/database';
import { db } from '../firebase/firebase';
import { useNavigation } from '@react-navigation/native';

const numColumns = 5;

export default function ServiceProviderScreen() {
  const [categories, setCategories] = useState([]);
  const [adminWhatsapp, setAdminWhatsapp] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [description, setDescription] = useState('');
  const navigation = useNavigation();

  useEffect(() => {
    const categoriesRef = ref(db, 'services/categories');
    onValue(categoriesRef, (snapshot) => {
      const data = snapshot.val();
      setCategories(data ? Object.values(data) : []);
    });

    const adminRef = ref(db, 'services/settings/adminWhatsapp');
    onValue(adminRef, (snapshot) => {
      const number = snapshot.val();
      setAdminWhatsapp(number || '');
    });
  }, []);

  const sendRequest = () => {
    if (!name || !phone) {
      alert('Please fill all required fields');
      return;
    }

    const message = `*New Service Request*\n\n🔧 *Service Name*: ${name}\n📞 *Phone*: ${phone}\n📝 *Description*: ${description || '-'}`;
    const encoded = encodeURIComponent(message);
    Linking.openURL(`https://wa.me/${adminWhatsapp}?text=${encoded}`);
    setModalVisible(false);
    setName('');
    setPhone('');
    setDescription('');
  };

  const renderCategoryItem = ({ item }) => (
    <TouchableOpacity
      style={styles.categoryItem}
      onPress={() => navigation.navigate('ServiceList', { category: item.title })}
    >
      <View style={[styles.iconWrapper, { backgroundColor: item.color || '#FFFFFF' }]}>
        <Image source={{ uri: item.icon }} style={styles.categoryIcon} />
      </View>
      <Text style={styles.categoryText} numberOfLines={2}>
        {item.title}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search for service providers"
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
      </ScrollView>

      {/* Floating Button */}
      <TouchableOpacity style={styles.floatingButton} onPress={() => setModalVisible(true)}>
        <Text style={styles.floatingText}>＋</Text>
      </TouchableOpacity>

      {/* Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalHeading}>Request New Service</Text>
            <TextInput
              style={styles.input}
              placeholder="Service Name*"
              value={name}
              onChangeText={setName}
            />
            <TextInput
              style={styles.input}
              placeholder="Phone*"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />
            <TextInput
              style={styles.input}
              placeholder="Description (optional)"
              value={description}
              onChangeText={setDescription}
              multiline
            />
            <Text style={styles.noteText}>
        📷 please send your product image on WhatsApp.
            </Text>
            <TouchableOpacity style={styles.sendButton} onPress={sendRequest}>
              <Text style={styles.sendButtonText}>Send via WhatsApp</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Text style={styles.closeText}>Close</Text>
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
  floatingButton: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    backgroundColor: '#007bff',
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
  },
  floatingText: {
    color: '#fff',
    fontSize: 28,
    marginBottom: 2,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#00000088',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 18,
    borderRadius: 10,
  },
  modalHeading: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 14,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    marginBottom: 12,
    borderRadius: 6,
    fontSize: 14,
  },
  sendButton: {
    backgroundColor: '#25D366',
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  sendButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  closeText: {
    textAlign: 'center',
    color: '#007bff',
    marginTop: 12,
    fontSize: 14,
  },
});

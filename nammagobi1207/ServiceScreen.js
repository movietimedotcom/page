import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity,
  Modal, Linking, Dimensions, FlatList, Image
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
  const [search, setSearch] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [providers, setProviders] = useState([]);

  const navigation = useNavigation();

  useEffect(() => {
    const categoriesRef = ref(db, 'services/categories');
    onValue(categoriesRef, (snapshot) => {
      const data = snapshot.val();
      const categoryList = data ? Object.values(data) : [];
      setCategories(categoryList);
    });

    const adminRef = ref(db, 'services/settings/adminWhatsapp');
    onValue(adminRef, (snapshot) => {
      setAdminWhatsapp(snapshot.val() || '');
    });

    const providersRef = ref(db, 'services/providers');
    onValue(providersRef, (snapshot) => {
      setProviders(snapshot.val() ? Object.values(snapshot.val()) : []);
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

  const getSuggestions = () => {
    const query = search.toLowerCase();
    const wordSet = new Set();
    const results = [];

    for (const item of providers) {
      if (item.name?.toLowerCase().includes(query)) {
        const words = item.name.toLowerCase().split(' ');
        words.forEach(word => {
          if (word.includes(query) && !wordSet.has(word)) {
            wordSet.add(word);
            results.push(word);
          }
        });
      }

      if (item.category?.toLowerCase().includes(query) && !wordSet.has(item.category.toLowerCase())) {
        wordSet.add(item.category.toLowerCase());
        results.push(item.category);
      }

      if (results.length >= 5) break;
    }

    return results.slice(0, 5);
  };

  const keywordSuggestions = getSuggestions();

  const groupCategoriesFromData = () => {
    const grouped = {};
    categories.forEach((category) => {
      const groupName = category.group || 'Others';
      if (!grouped[groupName]) {
        grouped[groupName] = [];
      }
      grouped[groupName].push(category);
    });
    return grouped;
  };

  const groupedCategories = groupCategoriesFromData();

  const renderCategoryItem = ({ item }) => (
    <TouchableOpacity
      style={styles.categoryItem}
      onPress={() => navigation.navigate('ServiceListScreen', { category: item.title })}
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
          value={search}
          onChangeText={(text) => {
            setSearch(text);
            setShowSuggestions(true);
          }}
        />

        {search.length > 0 && showSuggestions && keywordSuggestions.length > 0 && (
          <View style={styles.suggestionBox}>
            {keywordSuggestions.map((suggestion, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => {
                  setShowSuggestions(false);
                  navigation.navigate('ServiceListScreen', {
                    searchQuery: suggestion
                  });
                }}
                style={styles.suggestionItem}
              >
                <Text>{suggestion}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <Text style={styles.sectionTitle}>Service Categories</Text>

        {Object.entries(groupedCategories).map(([group, groupItems]) => (
          <View key={group}>
            <Text style={styles.groupTitle}>{group}</Text>
            <FlatList
              data={groupItems}
              renderItem={renderCategoryItem}
              keyExtractor={(item, index) => item.title + index}
              numColumns={numColumns}
              scrollEnabled={false}
              contentContainerStyle={styles.categoriesGrid}
            />
          </View>
        ))}
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
              📷 Please send your product image on WhatsApp.
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
  suggestionBox: {
    marginHorizontal: 10,
    marginTop: -5,
    backgroundColor: '#fff',
    borderRadius: 6,
    elevation: 3,
    zIndex: 5,
  },
  suggestionItem: {
    padding: 10,
    borderBottomColor: '#eee',
    borderBottomWidth: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    paddingHorizontal: 10,
    marginVertical: 10,
    color: '#333',
  },
  groupTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 12,
    marginBottom: 6,
    marginLeft: 10,
    color: '#444',
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
  noteText: {
    fontSize: 12,
    color: '#888',
    marginBottom: 10,
  },
});

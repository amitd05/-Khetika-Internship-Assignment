
import React, { useState, useEffect, useRef } from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet, ScrollView, FlatList,Platform ,Image} from 'react-native';
// Cross-platform alert
function showAlert(title: string, message: string, buttons?: any) {
  if (Platform.OS === 'web') {
    window.alert(`${title}\n${message}`);
    if (buttons && Array.isArray(buttons)) {
      // Simulate OK button action
      const okBtn = buttons.find((b: any) => b.text === 'OK' && typeof b.onPress === 'function');
      if (okBtn) okBtn.onPress();
    }
  } else {
    // @ts-ignore
    import('react-native').then(({ Alert }) => {
      Alert.alert(title, message, buttons);
    });
  }
}
import { Ionicons } from '@expo/vector-icons';
import { useCart } from '@/components/CartContext';
let Voice: any = undefined;
if (Platform.OS !== 'web') {
  // @ts-ignore
  Voice = require('react-native-voice');
}
const categories = ['dairy', 'breakfast', 'spices', 'grains', 'vegetables', 'batter','chutney'];
export default function DashboardScreen() {
  const { addToCart } = useCart();

  const [query, setQuery] = useState('');
  const [listening, setListening] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [recommendations, setRecommendations] = useState<{ [key: string]: string }>({});

  // Web Speech API for web
  const recognitionRef = useRef<any>(null);
  useEffect(() => {
    if (Platform.OS === 'web' && 'webkitSpeechRecognition' in window) {
      // @ts-ignore
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';
      recognitionRef.current.onresult = (event: any) => {
        if (event.results && event.results[0] && event.results[0][0]) {
          setQuery(event.results[0][0].transcript);
        }
        setListening(false);
      };
      recognitionRef.current.onstart = () => setListening(true);
      recognitionRef.current.onend = () => setListening(false);
    } else if (Voice) {
      Voice.onSpeechStart = onSpeechStart;
      Voice.onSpeechEnd = onSpeechEnd;
      Voice.onSpeechResults = onSpeechResults;
      return () => {
        Voice.destroy().then(Voice.removeAllListeners);
      };
    }
    const fetchAllProducts = async () => {
    try {
      const headers = { apikey: key, Authorization: `Bearer ${key}` };
      const res = await fetch(url, { headers });
      const data = await res.json();
      setAllProducts(data);
      setSearchResults(data); // show all products initially
       const recs: { [key: string]: string } = {};
      data.forEach((item: any) => {
        let recommendation: any = null;
        if (/idly|dosa|batter/i.test(item.name)) recommendation = data.find((p: any) => /chutney/i.test(p.name));
        else if (/bread|cornflakes/i.test(item.name)) recommendation = data.find((p: any) => /milk/i.test(p.name));
        else if (/rice/i.test(item.name)) recommendation = data.find((p: any) => /dal|lentil/i.test(p.name));
        else if (/curd|milk|butter|cheese/i.test(item.name)) recommendation = data.find((p: any) => /bread/i.test(p.name));
        else if (/rasam|sambar|chilli|turmeric/i.test(item.name)) recommendation = data.find((p: any) => /rice/i.test(p.name));
        else if (/tomato|onion|potato|coriander/i.test(item.name)) recommendation = data.find((p: any) => /wheat/i.test(p.name));

        if (recommendation) recs[item.id] = recommendation.name;
      });

      setRecommendations(recs);
    } catch (e) {
      console.log('Failed to fetch products:', e);
    }
  };
  fetchAllProducts();
  }, []);

  function onSpeechStart() {
    setListening(true);
  }

  function onSpeechEnd() {
    setListening(false);
  }

  function onSpeechResults(e: any) {
    if (e.value && e.value.length > 0) {
      setQuery(e.value[0]);
    }
    setListening(false);
  }

  const handleVoiceInput = async () => {
    if (Platform.OS === 'web') {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch (e) {
          showAlert('Voice Error', 'Could not start voice recognition.');
          setListening(false);
        }
      } else {
  showAlert('Not supported', 'Web Speech API is not supported in this browser.');
      }
      return;
    }
    if (!Voice) {
  showAlert('Not supported', 'Voice input is not supported in Expo Go.');
      return;
    }
    try {
      await Voice.start('en-US');
    } catch (e) {
  showAlert('Voice Error', 'Could not start voice recognition.');
      setListening(false);
    }
  };

  // Simple NLU: extract category and price from query
  function parseQuery(text: string) {
    // Extract quantity and product name robustly
    // e.g. "Order 2 packs of dosa batter" => quantity: 2, name: dosa batter
    let quantity = 1;
    let name = undefined;
    const quantityRegex = /(\d+)\s?(pack|kg|g|item|piece|pieces|packs)/i;
    const quantityMatch = text.match(quantityRegex);
    if (quantityMatch) {
      quantity = parseInt(quantityMatch[1]);
      // Remove quantity phrase from text for name extraction
      name = text.replace(quantityRegex, '').replace(/order|of|please|add|buy/gi, '').trim();
    } else {
      // Remove common verbs and extract name
      name = text.replace(/order|please|add|buy/gi, '').replace(/under \d+/i, '').trim();
    }
    // Remove trailing 'of', 'for', etc. and clean up non-alphabetic chars and extra spaces
    name = name.replace(/^(of|for|in)\s+/i, '').replace(/\s+(of|for|in)$/i, '').replace(/^[^a-zA-Z]+/, '').replace(/[^a-zA-Z0-9 ]+$/, '').replace(/\s{2,}/g, ' ').trim().toLowerCase();
    // Extract known categories
    const categoryMatch = text.match(/breakfast|lunch|dinner|snack|batter|grains|dairy|powder|spices|vegetables|chutney|ready[- ]?to[- ]?eat/i);
    const category = categoryMatch ? categoryMatch[0].toLowerCase() : undefined;
    if (category && /breakfast|lunch|dinner|snack|vegetables|grains|dairy|spices|powder|chutney|ready/.test(category)) {
    name = undefined;
  }
    const priceMatch = text.match(/under (\d+)/i);
    if (name) {
    name = name
      .replace(/^(of|for|in)\s+/i, "")
      .replace(/\s+(of|for|in)$/i, "")
      .replace(/^[^a-zA-Z]+/, "")
      .replace(/[^a-zA-Z0-9 ]+$/, "")
      .replace(/\s{2,}/g, " ")
      .trim()
      .toLowerCase();
  }
    return {
      name,
      category,
      price: priceMatch ? { max: parseInt(priceMatch[1]) } : undefined,
      quantity,
    };
  }
let url = process.env.EXPO_PUBLIC_SUPABASE_URL!+'/rest/v1/products?select=*';
      let key=process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;
   const handlecategorySelect=(cat:string)=>{

const newCategory = selectedCategory === cat ? null : cat;
        setSelectedCategory(newCategory);
         let filteredResults = [...allProducts];
if (newCategory) {
          filteredResults = filteredResults.filter((p) =>
            p.category?.toLowerCase().includes(newCategory.toLowerCase())
          );
        }
         const parsed = parseQuery(query);
         if (parsed.name) {
          filteredResults = filteredResults.filter((p) =>
            p.name?.toLowerCase().includes(parsed.name)
          );
        }
        if (parsed.price && parsed.price.max) {
          filteredResults = filteredResults.filter((p) => p.price <= parsed.price!.max);
        }

        setSearchResults(filteredResults);
              }  
  const handleSearch = async () => {
    const parsed = parseQuery(query);
     
    try {
      
      const headers = { apikey: key, Authorization: `Bearer ${key}` };
      const params = [];
  if (parsed.name) params.push(`name=ilike.%25${encodeURIComponent(parsed.name)}%25`);
  if (selectedCategory) {
    params.push(`category=ilike.%25${encodeURIComponent(selectedCategory.toLowerCase())}%25`);
  } else if (parsed.category) {
    params.push(`category=ilike.%25${encodeURIComponent(parsed.category.toLowerCase())}%25`);
  }
      if (parsed.price && typeof parsed.price.max === 'number') params.push(`price=lte.${parsed.price.max}`);
      if (params.length) url += '&' + params.join('&');
      console.log('handleSearch fetch url:', url);
      const response = await fetch(url, { headers });
      console.log('handleSearch response.ok:', response.ok);
      if (!response.ok) throw new Error('Network response was not ok');
      const text = await response.text();
      console.log('handleSearch raw response:', text);
      let results;
      try { results = JSON.parse(text); } catch (e) { results = []; }
      console.log('handleSearch results:', results);
      if (!results || results.length === 0) {
        setSearchResults([]);
  showAlert('No Results', 'No products found matching your search.');
      } else {
        setSearchResults(results);
      }
    } catch (error) {
      console.log('handleSearch error:', error);
  showAlert('Error', 'Failed to fetch products from backend.');
    }
  };

  // Add to cart using backend product search
   const handleAddToCart = async(item: any) => {
    const parsed = parseQuery(query);
    
    addToCart({ ...item, quantity: parsed.quantity || 1 });
    
      let recommendation = null;
      try {
        
        if (/idly|dosa|batter/i.test(item.name)) {
          recommendation = allProducts.find((p: any) => /chutney/i.test(p.name));
        } else if (/bread|cornflakes/i.test(item.name)) {
  // Suggest milk with bread or cornflakes
  recommendation = allProducts.find((p: any) => /milk/i.test(p.name));
} else if (/rice/i.test(item.name)) {
  // Suggest dal/lentils with rice
  recommendation = allProducts.find((p: any) => /dal|lentil/i.test(p.name));
} else if (/curd|milk|butter|cheese/i.test(item.name)) {
  // Suggest bread with dairy products
  recommendation = allProducts.find((p: any) => /bread/i.test(p.name));
} else if (/rasam|sambar|chilli|turmeric/i.test(item.name)) {
  // Suggest rice with spices
  recommendation = allProducts.find((p: any) => /rice/i.test(p.name));
} else if (/tomato|onion|potato|coriander/i.test(item.name)) {
  // Suggest wheat flour with vegetables
  recommendation = allProducts.find((p: any) => /wheat/i.test(p.name));
}
      } catch(e) {
        console.log('Recommendation fetch error:', e);
      }
      let alertMsg = `${item.name} x${parsed.quantity || 1}`;
      if (recommendation) {
        alertMsg += `\nYou might also like: ${recommendation.name}`;
      }
  showAlert('Added to Cart', alertMsg);
    
  };

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 24 }}>
    <View style={styles.container}>
      <Text style={styles.title}>Product Search</Text>
      <View style={styles.searchRow}>
        <TextInput
          style={styles.input}
          placeholder="Search for products (e.g. dosa batter under 200)"
          value={query}
          onChangeText={setQuery}
        />
        <TouchableOpacity onPress={handleVoiceInput} style={styles.micButton}>
          <Ionicons name={listening ? 'mic' : 'mic-outline'} size={28} color="#2563eb" />
        </TouchableOpacity>
      </View>
       <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipContainer}>
        {categories.map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[styles.chip, selectedCategory === cat ? styles.chipSelected : null]}
            onPress={() => {handlecategorySelect(cat)
             
        
        // Apply quick filter immediately
       
       

       
       
      }}
    >
            <Text style={[styles.chipText, selectedCategory === cat ? styles.chipTextSelected : null]}>{cat}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
        <Text style={styles.searchButtonText}>Search</Text>
      </TouchableOpacity>

     <FlatList
        data={searchResults}
        keyExtractor={(item) => item.id || item.name}
        numColumns={2}
        contentContainerStyle={{ marginTop: 16 }}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardContent}>
              <Image source={{ uri: item.image_url || 'https://via.placeholder.com/100' }} style={styles.cardImage} />
              <Text style={styles.cardName}>{item.name}</Text>
              <Text style={styles.cardPrice}>₹{item.price}</Text>
               {recommendations[item.id] && (
                  <View style={styles.recommendationBadge}>
                    <Text style={styles.recommendationText}>Recommended: {recommendations[item.id]}</Text>
                  </View>
                )}
              <TouchableOpacity style={styles.addButton} onPress={() => handleAddToCart(item)}>
                <Text style={styles.addButtonText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </View>
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#f9f9f9' },
  title: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 16 },
  searchRow: { flexDirection: 'row', alignItems: 'center' },
  input: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 30,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 5,
    elevation: 2,
  },
  micButton: { marginLeft: 8 },
  chipContainer: { marginTop: 12 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#fff',
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  chipSelected: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  chipText: { color: '#333' },
  chipTextSelected: { color: '#fff' },
  searchButton: {
    backgroundColor: '#2563eb',
    padding: 14,
    borderRadius: 30,
    alignItems: 'center',
    marginTop: 12,
  },
  searchButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  card: {
    flex: 1,
    backgroundColor: '#fff',
    margin: 8,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 5,
    elevation: 2,
    padding:12,
  },
  cardContent: { padding: 12, alignItems: 'center' },
  cardImage: { width: 100, height: 100, borderRadius: 8, marginBottom: 8 },
  cardName: { fontSize: 16, fontWeight: 'bold', textAlign: 'center' },
  cardPrice: { fontSize: 14, color: '#22c55e', marginVertical: 4 },
  addButton: { backgroundColor: '#22c55e', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20, marginTop: 8 },
  addButtonText: { color: '#fff', fontWeight: 'bold' },
  recommendationBadge: { marginTop: 4, backgroundColor: '#fde68a', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  recommendationText: { fontSize: 12, color: '#92400e', textAlign: 'center' },
});
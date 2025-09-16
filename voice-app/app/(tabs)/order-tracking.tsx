import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
} from 'react-native';

export default function OrderTrackingScreen() {
  const [orderId, setOrderId] = useState('');
  const [messages, setMessages] = useState<{ sender: 'user' | 'bot'; text?: string; orderData?: any }[]>([]);
  const [loading, setLoading] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const ORDER_STATUSES = ['Order received', 'Processing', 'In Transit', 'Delivered'];

  const handleTrackOrder = async () => {
    if (!orderId.trim()) return;

    // User message
    setMessages(prev => [...prev, { sender: 'user', text: orderId }]);
    setLoading(true);

    try {
      const url = `${process.env.EXPO_PUBLIC_SUPABASE_URL}/rest/v1/orders?order_no=eq.${encodeURIComponent(orderId.trim())}`;
      const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;
      const headers = { apikey: key, Authorization: `Bearer ${key}` };
      const response = await fetch(url, { headers });
      const data = await response.json();

      if (Array.isArray(data) && data.length > 0) {
        const order = data[0];
        setMessages(prev => [
          ...prev,
          { sender: 'bot', text: `Here’s the current status for Order #${order.order_no}:` },
          { sender: 'bot', orderData: order }, // push card as bot message
        ]);
      } else {
        setMessages(prev => [...prev, { sender: 'bot', text: `No order found for ID #${orderId}` }]);
      }
    } catch (e) {
      console.log('Error fetching order:', e);
      setMessages(prev => [...prev, { sender: 'bot', text: 'Error fetching order status.' }]);
    } finally {
      setLoading(false);
      setOrderId('');
    }
  };

  const renderProgressBar = (status: string | null) => {
    const index = ORDER_STATUSES.indexOf(status || '');
    return (
      <View style={styles.progressBarContainer}>
        {ORDER_STATUSES.map((s, i) => {
          const completed = i <= index;
          return (
            <View key={i} style={styles.progressStep}>
              <View style={[styles.circle, completed && styles.circleCompleted]} />
              <Text style={[styles.progressText, completed && styles.progressTextCompleted]}>{s}</Text>
              {i < ORDER_STATUSES.length - 1 && <View style={[styles.connector, i < index && styles.connectorCompleted]} />}
            </View>
          );
        })}
      </View>
    );
  };

  const renderOrderCard = (orderData: any) => {
    return (
      <View style={styles.card}>
        <Text style={styles.orderNo}>Order #{orderData.order_no}</Text>
        {orderData.items?.map((item: any, idx: number) => (
          <View key={idx} style={styles.productRow}>
            <Text style={styles.productName}>{item.name}</Text>
            <Text style={styles.productQty}>x{item.quantity}</Text>
            <Text style={styles.productPrice}>₹{item.price * item.quantity}</Text>
          </View>
        ))}
        {renderProgressBar(orderData.status)}
      </View>
    );
  };

  const renderMessage = ({ item }: any) => {
    if (item.orderData) {
      return renderOrderCard(item.orderData); // show card in chat
    }
    return (
      <View style={[styles.message, item.sender === 'user' ? styles.userMsg : styles.botMsg]}>
        <Text style={styles.msgText}>{item.text}</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Order Tracking Chat Bot</Text>

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(_, i) => i.toString()}
        renderItem={renderMessage}
        style={{ flex: 1 }}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />

      {loading && <ActivityIndicator size="large" color="#007AFF" style={{ marginVertical: 12 }} />}

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Enter Order ID (e.g., 123)"
          value={orderId}
          onChangeText={setOrderId}
        />
        <TouchableOpacity style={styles.sendButton} onPress={handleTrackOrder}>
          <Text style={styles.sendText}>Track</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#f9f9f9' },
  title: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 16 },
  inputRow: { flexDirection: 'row', marginBottom: 8 },
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
  sendButton: {
    backgroundColor: '#007AFF',
    borderRadius: 30,
    paddingHorizontal: 20,
    justifyContent: 'center',
    marginLeft: 8,
  },
  sendText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  message: { padding: 10, borderRadius: 8, marginVertical: 4, maxWidth: '80%' },
  userMsg: { backgroundColor: '#DCF8C6', alignSelf: 'flex-end' },
  botMsg: { backgroundColor: '#F1F0F0', alignSelf: 'flex-start' },
  msgText: { fontSize: 16 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 5,
    elevation: 3,
    alignSelf: 'flex-start', // aligns card like bot message
  },
  orderNo: { fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
  productRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  productName: { fontSize: 16, flex: 1 },
  productQty: { fontSize: 16, marginHorizontal: 8 },
  productPrice: { fontSize: 16, fontWeight: 'bold' },
  progressBarContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 16, flexWrap: 'wrap' },
  progressStep: { flexDirection: 'row', alignItems: 'center', marginRight: 4, marginBottom: 4 },
  circle: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#ccc', marginRight: 4 },
  circleCompleted: { backgroundColor: '#007AFF' },
  progressText: { fontSize: 12, color: '#888', marginRight: 8 },
  progressTextCompleted: { color: '#007AFF', fontWeight: 'bold' },
  connector: { width: 20, height: 2, backgroundColor: '#ccc', marginRight: 8 },
  connectorCompleted: { backgroundColor: '#007AFF' },
});

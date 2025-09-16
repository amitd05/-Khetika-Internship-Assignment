
import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Image,ScrollView,Alert, Platform } from 'react-native';
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
    Alert.alert(title, message, buttons);
  }
}
import { useCart } from '@/components/CartContext';
import { placeOrder } from '../../utils/placeOrder';
import { Ionicons } from '@expo/vector-icons';

const CartScreen: React.FC = () => {
  const { cart, clearCart, removeFromCart } = useCart();

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleCheckout = async () => {
    try {
      // Use a placeholder user_id (e.g., device ID, or 'guest-app')
      const userId = 'guest-app';
      const result = await placeOrder(cart, total, userId);
      console.log('placeOrder result:', result);
      const orderObj = Array.isArray(result) ? result[0] : result;
      const orderNo = orderObj?.order_no;
      const orderId = orderObj?.id;
      showAlert(
        'Order Placed',
        `Your order has been placed successfully!\nOrder No: ${orderNo || orderId || 'N/A'}`,
        [
          {
            text: 'OK',
            onPress: () => clearCart(),
          },
        ]
      );
    } catch (e) {
      console.log('placeOrder error:', e);
      showAlert('Error', 'Failed to place order in backend.');
    }
  };

  const renderItem = ({ item }: { item: { id: string; name: string; price: number; quantity: number ;image_url?:string} }) => (
    <View style={styles.card}>
      <Image source={{ uri: item.image_url || 'https://via.placeholder.com/80' }} style={styles.image} />
      <View style={styles.details}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.price}>₹{item.price} x {item.quantity}</Text>
        <Text style={styles.subtotal}>Subtotal: ₹{item.price * item.quantity}</Text>
      </View>
      <TouchableOpacity onPress={() => removeFromCart(item.id)} style={styles.removeButton}>
        <Ionicons name="trash-outline" size={24} color="#fff" />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your Cart</Text>
      {cart.length === 0 ? (
        <Text style={styles.empty}>Your cart is empty.</Text>
      ) : (
        <>
          <FlatList
            data={cart}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={{ paddingBottom: 24 }}
          />
          <View style={styles.totalContainer}>
            <Text style={styles.totalText}>Total: ₹{total}</Text>
            <TouchableOpacity style={styles.checkoutButton} onPress={handleCheckout}>
              <Text style={styles.checkoutText}>Place Order</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
}
const styles = StyleSheet.create({
   container: { flex: 1, padding: 16, backgroundColor: '#f9f9f9' },
  title: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 16 },
  card: { flexDirection: 'row', backgroundColor: '#fff', padding: 12, borderRadius: 12, marginBottom: 12, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowOffset: { width: 0, height: 2 }, shadowRadius: 5, elevation: 2 },
  image: { width: 80, height: 80, borderRadius: 8, marginRight: 12 },
  details: { flex: 1 },
  name: { fontSize: 16, fontWeight: 'bold' },
  price: { fontSize: 14, color: '#22c55e', marginTop: 4 },
  subtotal: { fontSize: 12, color: '#888', marginTop: 2 },
  removeButton: { backgroundColor: '#ef4444', padding: 8, borderRadius: 20 },
  totalContainer: { backgroundColor: '#fff', padding: 16, borderRadius: 12, marginTop: 12, alignItems: 'center' },
  totalText: { fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  checkoutButton: { backgroundColor: '#2563eb', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 30 },
  checkoutText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  empty: { textAlign: 'center', color: '#888', marginTop: 32, fontSize: 16 },
});

export default CartScreen;

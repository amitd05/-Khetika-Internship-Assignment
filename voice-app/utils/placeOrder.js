// Utility for placing an order in Supabase
export async function placeOrder(cart, total, userId = 'guest') {
  // Replace with your Supabase project details
  const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ;
  const SUPABASE_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ;
  const headers = {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json',
    Prefer: 'return=representation',
  };
  // Create order object
  const order = {
    items: cart,
    total,
    created_at: new Date().toISOString(),
    status: 'Order received',
    user_id: userId,
  };
  // POST to orders table
  const response = await fetch(`${SUPABASE_URL}/rest/v1/orders`, {
    method: 'POST',
    headers,
    body: JSON.stringify(order),
  });
  if (!response.ok) throw new Error('Failed to place order');
  // Some Supabase configs return 201 with no content, so check for content
  const text = await response.text();
  if (!text) return { id: undefined };
  try {
    return JSON.parse(text);
  } catch {
    return { id: undefined };
  }
}

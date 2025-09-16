// /categorize <product_name> - auto-categorize product by name

// ...existing code...
// Basic Telegram ordering bot using Node.js, Telegraf, and Supabase REST API
// 1. npm install telegraf node-fetch dotenv
// 2. Set TELEGRAM_BOT_TOKEN and SUPABASE_API_KEY in .env

require('dotenv').config();
const { Telegraf } = require('telegraf');
const fetch = require('node-fetch');

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);
const SUPABASE_URL = 'https://bwhjzybkyxxaqtpxndsm.supabase.co/rest/v1';
const SUPABASE_API_KEY = process.env.SUPABASE_API_KEY;

// In-memory cart per user (for demo)
const userCarts = {};
bot.command('categorize', async (ctx) => {
  const parts = ctx.message.text.split(' ');
  if (parts.length < 2) return ctx.reply('Usage: /categorize <product_name>');
  const name = parts.slice(1).join(' ').toLowerCase();
  let category = 'Other';
  if (/idly|dosa|uttapam|pongal|vada/.test(name)) category = 'batter';
  else if (/powder|masala|spice|spices|rasam|sambar/.test(name)) category = 'spices';
  else if (/chutney|sauce|dip/.test(name)) category = 'Condiments';
  else if (/rice|dal|lentil|grain/.test(name)) category = 'Staples';
  else if (/snack|chips|namkeen/.test(name)) category = 'Snacks';
  ctx.reply(`Category for "${name}": ${category}`);
});
// /products - list products
bot.command('products', async (ctx) => {
  const res = await fetch(`${SUPABASE_URL}/products`, {
    headers: { apikey: SUPABASE_API_KEY, Authorization: `Bearer ${SUPABASE_API_KEY}` },
  });
  const products = await res.json();
  if (Array.isArray(products) && products.length > 0) {
    let msg = 'Products:\n';
    products.forEach(p => {
      msg += `${p.id}: ${p.name} - ₹${p.price}\n`;
    });
    ctx.reply(msg);
  } else {
    ctx.reply('No products found.');
  }
});

// /addtocart <product_name> with recommendation
bot.command('addtocart', async (ctx) => {
  const parts = ctx.message.text.split(' ');
  if (parts.length < 2) return ctx.reply('Usage: /addtocart <product_name>');
  const nameQuery = parts.slice(1).join(' ').toLowerCase();
  // Fetch all products
  const res = await fetch(`${SUPABASE_URL}/products`, {
    headers: { apikey: SUPABASE_API_KEY, Authorization: `Bearer ${SUPABASE_API_KEY}` },
  });
  const products = await res.json();
  // Find product by name (case-insensitive, partial match)
  const match = products.find(p => p.name.toLowerCase().includes(nameQuery));
  if (!match) return ctx.reply(`No product found matching "${nameQuery}".`);
  const uid = ctx.from.id;
  userCarts[uid] = userCarts[uid] || [];
  userCarts[uid].push(match.id);
  let replyMsg = `Added ${match.name}  to your cart.`;
  // Simple recommendation rules
  let recommendation = null;
  if (/idly|dosa|batter/.test(match.name.toLowerCase())) {
    recommendation = products.find(p => /chutney/.test(p.name.toLowerCase()));
  } else if (/rice/.test(match.name.toLowerCase())) {
    recommendation = products.find(p => /dal|lentil/.test(p.name.toLowerCase()));
  }
  if (recommendation) {
    replyMsg += `\nYou might also like: ${recommendation.name}`;
  }
  ctx.reply(replyMsg);
});

// /checkout - place order (jsonb 'items' column)
bot.command('checkout', async (ctx) => {
  const uid = ctx.from.id;
  const cart = userCarts[uid] || [];
  if (cart.length === 0) return ctx.reply('Your cart is empty.');
  // Save product ids as 'items' (jsonb)
  // Fetch all products to get prices
  const pres = await fetch(`${SUPABASE_URL}/products`, {
    headers: { apikey: SUPABASE_API_KEY, Authorization: `Bearer ${SUPABASE_API_KEY}` },
  });
  const products = await pres.json();
  // Calculate total
  console.log('Cart (product IDs):', cart);
  console.log('Fetched products:', products);
  const total = cart.reduce((sum, pid) => {
    const prod = products.find(p => p.id === pid);
    if (!prod) console.log('Product not found for ID:', pid);
    return sum + (prod ? Number(prod.price) : 0);
  }, 0);
  console.log('Calculated total:', total);
  const orderBody = {
    user_id: uid,
    items: cart,
    total,
    status: 'Order received',
    created_at: new Date().toISOString(),
  };
  const res = await fetch(`${SUPABASE_URL}/orders`, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_API_KEY,
      Authorization: `Bearer ${SUPABASE_API_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: JSON.stringify(orderBody),
  });
  const data = await res.json();
  if (data && data[0]) {
    ctx.reply(`Order placed! Your order number is ${data[0].order_no}`);
    userCarts[uid] = [];
  } else {
    let errMsg = `Order failed. Status: ${res.status}`;
    errMsg += `\nRequest: ${JSON.stringify(orderBody)}`;
    errMsg += `\nResponse: ${JSON.stringify(data)}`;
    errMsg += `\nHeaders: ${JSON.stringify(Object.fromEntries(res.headers.entries()))}`;
    // Telegram has message length limits, so truncate if too long
    if (errMsg.length > 3500) errMsg = errMsg.slice(0, 3500) + '\n...truncated...';
    ctx.reply(errMsg);
    console.error('Order failed:', { status: res.status, statusText: res.statusText, body: data, request: orderBody, headers: Object.fromEntries(res.headers.entries()) });
  }
});

// Order tracking: /order <order_no>
bot.command('order', async (ctx) => {
  const parts = ctx.message.text.split(' ');
  if (parts.length < 2) return ctx.reply('Usage: /order <order_no>');
  const orderNo = parts[1];
  const res = await fetch(`${SUPABASE_URL}/orders?order_no=eq.${orderNo}`, {
    headers: { apikey: SUPABASE_API_KEY, Authorization: `Bearer ${SUPABASE_API_KEY}` },
  });
  const data = await res.json();
  if (Array.isArray(data) && data.length > 0) {
    ctx.reply(`Order #${orderNo} status: ${data[0].status}`);
  } else {
    ctx.reply('Order not found.');
  }
});

bot.launch();
console.log('Telegram bot running!');

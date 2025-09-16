# Voice Retail App (React Native + Telegram Bot)

A cross-platform voice-enabled retail app with product search, cart, checkout, order tracking, and a Telegram ordering bot. Backend powered by Supabase.

## Features

### App (React Native/Expo)
- Voice and text product search (NLU, regex-based)
- Add to cart, remove from cart, and checkout
- Order placement and order number display
- Order tracking chat bot (real backend)
- Product recommendations when adding to cart
- Auto-categorization of products (keyword rules)
- Cross-platform alerts (web/native)
- No sign-in required (guest mode)

### Telegram Bot
- /products — List all products
- /addtocart <product_name> — Add product to cart by name
- /checkout — Place order (saved to Supabase)
- /order <order_no> — Track order status
- /categorize <product_name> — Auto-categorize product 
- Product recommendations on add to cart

## Setup Instructions

### Prerequisites
- Node.js (v18+ recommended)
- Expo CLI (`npm install -g expo-cli`)
- Supabase account & project
- Telegram account (for bot)

### 1. Supabase Backend
- Create tables: `products`, `orders`
- `orders` table must have: `id`, `items` (jsonb), `total` (numeric), `created_at`, `status`, `order_no` (bigint), `user_id` (text)
- Get your Supabase project URL and anon key

### 2. App Setup
```sh
cd voice-app
npm install
npx expo start
```
- Update Supabase URL and key in `utils/placeOrder.js` and API calls if needed

### 3. Telegram Bot Setup
```sh
cd telegram-bot
npm install
# Set TELEGRAM_BOT_TOKEN and SUPABASE_API_KEY in .env
node bot.js
```
- Create bot with @BotFather, get token
- Use your Supabase anon key

## Usage Notes
- Product search supports both text and voice (Web Speech API/react-native-voice)
- Cart supports add, remove, and checkout
- Order tracking works with order number
- Telegram bot supports all major flows via chat commands
- No authentication: all orders are guest or Telegram user-based

## Customization
- Update product/category rules in `/categorize` and recommendations as needed
- Add user authentication for true personalization
- Extend backend for payment, inventory, etc.

## Screenshots/Demo
### 1. Dashboard
![Dashboard](Screenshot%202025-09-16%20135138.png)
### 2. Cart
![Cart](Screenshot%202025-09-16%20135214.png)
### 3. Order Tracking Chat Bot
![Order Tracking Chat Bot](Screenshot%202025-09-16%20135056.png)

---
Built with ❤️ using React Native, Expo, Supabase, and Telegraf.

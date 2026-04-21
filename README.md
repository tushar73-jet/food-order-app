# 🍔 FoodStore: Cross-Platform Food Delivery Ecosystem

A complete, production-ready MERN stack application with a **React Native Mobile App**. This ecosystem features a customer-facing web app, a restaurant admin dashboard with Kanban order management, and a dedicated mobile experience for both customers and delivery riders.

## 🚀 Key Features

### 💻 Web Platform
- **Customer Portal**: Browse menus, add to cart, and process secure payments via Razorpay.
- **Admin Dashboard**: Real-time Kanban board for restaurant owners. Manage orders through life-cycles: `Pending` ➔ `Preparing` ➔ `Out for Delivery`.
- **User Management**: Admins can promote regular users to **Riders** directly from the dashboard.

### 📱 Mobile App (React Native)
- **Customer View**: Smooth mobile ordering experience with real-time order tracking steps.
- **Rider Dashboard**: Dedicated interface for riders to see active deliveries and mark them as completed.
- **Role-Based Routing**: Automatic redirection to the correct dashboard (Customer vs. Rider) based on login credentials.
- **Socket.io Integration**: Live status updates without refreshing the app.

### 🛡️ Security & Reliability
- **Backend Price Validation**: Recalculates order totals on the server from DB records to prevent client-side hacks.
- **RBAC**: Strict Role-Based Access Control on both Web and Mobile.
- **JWT Authentication**: Secure persistent sessions using `AsyncStorage` and `localStorage`.

---

## 🛠️ Tech Stack

- **Frontend**: React (Vite), Chakra UI
- **Mobile**: React Native (Expo)
- **Backend**: Node.js, Express, Socket.io
- **Database**: PostgreSQL (Prisma ORM)
- **Payment**: Razorpay Integration

---

## ⚙️ Installation & Setup

### 1. Project Root
```bash
git clone https://github.com/tushar73-jet/food-order-app.git
cd food-order-app
```

### 2. Backend Setup
```bash
cd backend
npm install
# Configure .env: DATABASE_URL, JWT_SECRET, PORT, RAZORPAY_KEYS, CORS_ORIGINS
npx prisma migrate dev
npm run dev
```

### 3. Web Frontend Setup
```bash
cd ../frontend
npm install
# Configure .env: VITE_API_URL
npm run dev
```

### 4. Mobile App Setup
```bash
cd mobile
npm install
# Configure .env: API_URL (see .env.example)
npx expo start
```

---

## 🏍️ Role Workflow (Testing Guide)

1. **Admin**: Log in to the Web App. Promote a user to `RIDER` in the **User Management** tab.
2. **Customer**: Place an order on either the Web or Mobile app.
3. **Admin**: Accept the order and click **"Dispatch Rider"** in the Admin Kanban board.
4. **Rider**: Log in to the Mobile App. The order will automatically appear in the **Rider Dashboard**.
5. **Real-time**: Watch the **Order Tracking** screen update across all devices as the status changes!

---

## 🤝 Contributing

1. Fork the Project ➔ Create Branch ➔ Commit Changes ➔ Open Pull Request.

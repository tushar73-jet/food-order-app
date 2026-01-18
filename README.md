# 🍔 Food Order App

A full-stack food ordering application built with React, Node.js, and PostgreSQL. Features real-time order tracking, authentication, and secure payments via Razorpay.

## 🚀 Features

-   **User Authentication**: Secure Sign Up and Login (JWT-based).
-   **Restaurant Listings**: Browse various restaurants and their menus.
-   **Shopping Cart**: Add items to cart and manage quantities.
-   **Secure Payments**: Integrated with Razorpay for payment processing.
-   **Order Tracking**: Real-time updates on your order status.
-   **Order History**: View past orders and details.
-   **Responsive Design**: Optimized for both desktop and mobile users.

## 🛠️ Tech Stack

### Frontend
-   **React** (Vite)
-   **React Router** for navigation
-   **Axios** for API requests
-   **CSS** (Vanilla) for styling

### Backend
-   **Node.js & Express**
-   **Prisma ORM** for database management
-   **PostgreSQL** database
-   **Socket.io** for real-time updates
-   **Razorpay** for payment gateway

## ⚙️ Prerequisites

-   Node.js (v16+)
-   PostgreSQL installed and running

## 📦 Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/tushar73-jet/food-order-app.git
    cd food-order-app
    ```

2.  **Setup Backend**
    ```bash
    cd backend
    npm install
    ```
    
    Create a `.env` file in the `backend` directory:
    ```env
    PORT=3001
    DATABASE_URL="postgresql://user:password@localhost:5432/food_app_db?schema=public"
    JWT_SECRET="your_super_secret_jwt_key"
    RAZORPAY_KEY_ID="your_razorpay_key_id"
    RAZORPAY_KEY_SECRET="your_razorpay_key_secret"
    ```

    Run migrations to set up the database:
    ```bash
    npx prisma migrate dev --name init
    # Optional: Seed the database with dummy data
    npm run seed 
    ```

    Start the server:
    ```bash
    npm run dev
    ```

3.  **Setup Frontend**
    ```bash
    cd ../frontend
    npm install
    ```

    Create a `.env` file in the `frontend` directory:
    ```env
    VITE_API_URL=http://localhost:3001/api
    ```

    Start the React app:
    ```bash
    npm run dev
    ```

## 🏃‍♂️ Usage

1.  Open the backend server (default: `http://localhost:3001`).
2.  Open the frontend app (default: `http://localhost:5173`).
3.  Register a new account or login.
4.  Browse restaurants, add items to cart, and proceed to checkout.

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

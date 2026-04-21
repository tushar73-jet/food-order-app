// mobile/src/config.js

/**
 * 💡 Professional Tip:
 * In a production Expo app, you would use 'expo-constants' or 'react-native-dotenv'.
 * For this portfolio piece, we use a centralized config that pulls from environment
 * variables if available, falling back to a development IP.
 */

export const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3001/api";

// Socket URL derived from API_URL by removing the /api suffix
export const SOCKET_URL = process.env.EXPO_PUBLIC_SOCKET_URL || API_URL.replace("/api", "");

// src/utils/auth.js
import axios from "axios";
import { toast } from "react-toastify";

// ✅ Dynamically set Laravel API base URL — works in localhost, LAN, and production
const hostname = window.location.hostname;

const API_BASE_URL =
  hostname === "localhost" ||
  hostname.startsWith("192.168.") ||
  hostname.startsWith("10.")
    ? `http://${hostname}:8000/api` // Development or LAN
    : `${window.location.origin}/api`; // Production (same origin)

// ✅ Configure Axios instance with the computed API base URL
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Include credentials (cookies) in requests
});

// Function to handle login logic

export const loginUser = async (username, password) => {
  try {
    const response = await api.post("/login", { username, password });

    if (response.status === 200 && response.data.token) {
      return {
        success: true,
        message: "Login successful!",
        token: response.data.token,
        user: response.data.user,
      };
    } else {
      return { success: false, message: "Login failed! No token received." };
    }
  } catch (error) {
    console.error("Login error:", error.response || error);

    const errorMessage =
      error.response?.data?.message || // in case message is returned
      error.response?.data?.error || // handles { "error": "Invalid credentials" }
      "Login failed. Please try again.";

    toast.error(errorMessage, {
      style: {
        backgroundColor: "#ff4d4f", // bright red
        color: "white",
      },
      icon: "❌",

      autoClose: 5000,
    });
    return { success: false, message: errorMessage };
  }
};

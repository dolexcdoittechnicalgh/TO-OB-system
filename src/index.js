import React from "react";
import { createRoot } from "react-dom/client";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import App from "./App";
import Header from "./pages/Header";
import { NotificationProvider } from "./pages/NotificationContext"; // Import the NotificationProvider
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const theme = createTheme();

// Create root using React 18 API
const root = createRoot(document.getElementById("root"));

root.render(
  <ThemeProvider theme={theme}>
    <NotificationProvider>
      {" "}
      {/* ✅ Only wrap App */}
      <App />
    </NotificationProvider>

    {/* ✅ ToastContainer goes outside */}
    <ToastContainer
      position="top-center"
      autoClose={3000}
      hideProgressBar={false}
      newestOnTop={true}
      closeOnClick
      rtl={false}
      pauseOnFocusLoss
      draggable
      pauseOnHover
      theme="colored"
      toastStyle={{
        fontSize: "15px",
        fontFamily: '"Inter", "Segoe UI", "Helvetica", "Arial", sans-serif',
        borderRadius: "8px",
        padding: "12px 16px",
        boxShadow: "0 4px 12px rgba(0, 128, 0, 0.15)",
        background: "#2e7d32",
        color: "#ffffff",
      }}
      progressStyle={{
        background: "#a5d6a7",
        height: "4px",
        borderRadius: "2px",
      }}
    />
  </ThemeProvider>
);

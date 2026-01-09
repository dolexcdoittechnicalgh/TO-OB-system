import React, { createContext, useState, useEffect, useContext } from "react";
import Cookies from "js-cookie";
import axios from "axios";
import { toast } from "react-toastify";

// Dynamically set base URL depending on hostname (development, LAN, or production)
const hostname = window.location.hostname;

const API_BASE_URL =
  hostname === "localhost" ||
  hostname.startsWith("192.168.") ||
  hostname.startsWith("10.")
    ? `http://${hostname}:8000/api` // Dev or LAN
    : `${window.location.origin}/api`; // Production

const AppContext = createContext();
export const ContextProvider = ({ children }) => {
  const [token, setToken] = useState(Cookies.get("ACCESS_TOKEN") || null);
  const [userRole, setUserRole] = useState(Cookies.get("USER_ROLE") || null);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true); // Loading state for async tasks

  useEffect(() => {
    // Check if the token exists and is valid
    if (token && !userRole) {
      fetchUserRoleFromAPI();
    } else {
      setIsLoading(false); // End loading if userRole is already in context
    }
  }, [token, userRole]);

  // Fetch user role from API based on token
  const fetchUserRoleFromAPI = async () => {
    try {
      // Check if token exists before making the API request
      if (!token) {
        console.error("Token is not available");
        setIsLoading(false);
        return;
      }

      const response = await axios.get(`${API_BASE_URL}/user-role`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data && response.data.user_role) {
        setUserRole(response.data.user_role);
        setUser({ role: response.data.user_role });
        Cookies.set("USER_ROLE", response.data.user_role, { expires: 1 });
      } else {
        console.error("Failed to fetch user role from API");
      }
    } catch (error) {
      console.error("Error fetching user role:", error);
      // If there is an error, you can either log the error or handle it in another way.
    } finally {
      setIsLoading(false); // End loading after fetch attempt
    }
  };

  const login = (userData, userToken) => {
    if (!userData || !userToken) {
      console.error("Login: Missing user or token.");
      return;
    }

    setUser(userData);
    setToken(userToken);
    setUserRole(userData.user_role);

    // ✅ Use Cookies.set with proper path
    Cookies.set("ACCESS_TOKEN", userToken, { expires: 1, path: "/" });
    Cookies.set("USER_ROLE", userData.user_role, { expires: 1, path: "/" });

    console.log("Login successful. Token set:", userToken);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setUserRole(null);

    // Remove cookies on logout
    Cookies.remove("ACCESS_TOKEN");
    Cookies.remove("USER_ROLE");

    // Show logout success toast
    toast.success("Logout successful!");
  };
  return (
    <AppContext.Provider
      value={{
        user: user || null,
        token: token || null,
        userRole: userRole || null,
        login: (userData, userToken) => {
          if (!userData || !userToken) {
            console.error("ContextProvider: login() missing user or token");
            return;
          }

          setUser(userData);
          setToken(userToken);
          setUserRole(userData.user_role);

          // Set cookies with path for accessibility
          Cookies.set("ACCESS_TOKEN", userToken, { expires: 1, path: "/" });
          Cookies.set("USER_ROLE", userData.user_role, {
            expires: 1,
            path: "/",
          });
        },
        logout,
        isLoading,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => useContext(AppContext);

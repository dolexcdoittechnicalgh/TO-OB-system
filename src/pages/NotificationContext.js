import React, { createContext, useContext, useState, useEffect } from "react";
import echo from "../utils/echo"; // ✅ Adjust this path to your Echo instance

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  const addNotification = (notification) => {
    setNotifications((prev) => [
      ...prev,
      {
        ...notification,
        id: Date.now() + Math.random(),
        timestamp: new Date(),
      },
    ]);
  };

  const updateNotifications = (newNotifications) => {
    const notificationsWithIds = newNotifications.map((notification) => ({
      ...notification,
      id: notification.id || Date.now() + Math.random(),
      timestamp: notification.timestamp || new Date(),
    }));
    setNotifications(notificationsWithIds);
  };

  const removeNotification = (notificationId) => {
    setNotifications((prev) =>
      prev.filter((notification) => notification.id !== notificationId)
    );
  };

  const clearNotifications = () => setNotifications([]);

  const markAsRead = (notificationId) => {
    setNotifications((prev) =>
      prev.map((notification) =>
        notification.id === notificationId
          ? { ...notification, read: true }
          : notification
      )
    );
  };

  const unreadNotifications = notifications.filter(
    (notification) => !notification.read
  );

  // ✅ Setup Echo listener once on mount
  useEffect(() => {
    const channel = echo.channel("pending-counts");

    channel.listen(".PendingCountsUpdated", (event) => {
      console.log("📡 Event received:", event);

      const data = event.data || event;

      const obCount = data.pending_ob_count || 0;
      const toCount = data.pending_to_count || 0;
      const psCount = data.pending_ps_count || 0;

      console.log("🔢 Counts:", { obCount, toCount, psCount });
      const newNotifications = [
        obCount > 0 && {
          id: "ob-notification",
          title: "OB Requests",
          message: `${obCount} pending approval${obCount > 1 ? "s" : ""}`,
          count: obCount,
        },
        toCount > 0 && {
          id: "to-notification",
          title: "TO Requests",
          message: `${toCount} pending approval${toCount > 1 ? "s" : ""}`,
          count: toCount,
        },
        psCount > 0 && {
          id: "ps-notification",
          title: "Pass Slips",
          message: `${psCount} pending approval${psCount > 1 ? "s" : ""}`,
          count: psCount,
        },
      ].filter(Boolean);

      console.log("📋 Updating notifications:", newNotifications);
      updateNotifications(newNotifications);
    });

    return () => {
      echo.leave("pending-counts");
    };
  }, []);

  // 🔁 Log state changes for debugging
  useEffect(() => {}, [notifications]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadNotifications,
        addNotification,
        updateNotifications,
        removeNotification,
        clearNotifications,
        markAsRead,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      "useNotifications must be used within NotificationProvider"
    );
  }
  return context;
};

import { toast } from "react-toastify";
import axios from "axios";
import Cookies from "js-cookie";

// Dynamically set Laravel API base URL — works in localhost, LAN, and production
const hostname = window.location.hostname;

const API_BASE_URL =
  hostname === "localhost" ||
  hostname.startsWith("192.168.") ||
  hostname.startsWith("10.")
    ? `http://${hostname}:8000/api` // Development or LAN
    : `${window.location.origin}/api`; // Production (same origin)

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${Cookies.get("ACCESS_TOKEN") || ""}`, // Include token if needed
  },
});

// Function to fetch token from cookies
const getToken = () => {
  return Cookies.get("ACCESS_TOKEN");
};

/////////////////////////////////////////////////////////////POSITION-API/////
// Store Position function
export const storePosition = async (positionName) => {
  try {
    const token = getToken(); // Get the token (you can fetch this from context or cookies)
    if (!token) throw new Error("No token found. Please log in.");

    const response = await axios.post(
      `${API_BASE_URL}/positions`,
      { name: positionName },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    // ✅ Show success toast on successful creation
    toast.success("Position added successfully!");

    return response.data; // Return the data if successful
  } catch (error) {
    console.error("Error saving position:", error);
    toast.error(error.response?.data?.message || "An error occurred.");
    throw error; // Re-throw the error to handle it elsewhere if needed
  }
};

export const fetchPositions = async () => {
  try {
    const token = getToken();
    if (!token) throw new Error("No token found. Please log in.");

    // Make the API request with the token in the Authorization header
    const response = await axios.get(`${API_BASE_URL}/positions`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return response.data; // Return the fetched data (positions in this case)
  } catch (error) {
    console.error("Error fetching positions:", error);
    toast.error(error.response?.data?.message || "An error occurred.");
    throw error; // Rethrow the error to handle it in calling components
  }
};

export const updatePosition = async (id, positionData) => {
  try {
    const token = getToken();
    if (!token) throw new Error("No token found. Please log in.");

    const response = await axios.put(
      `${API_BASE_URL}/positions/${id}`, // Corrected endpoint to plural if needed
      positionData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    toast.success("Position updated successfully!");
    return response.data;
  } catch (error) {
    console.error("Error updating position:", error);
    toast.error("Failed to update position.");
    throw error;
  }
};
export const SoftDeletePosition = async (id) => {
  try {
    const token = getToken(); // Should return the auth token

    if (!token) throw new Error("No token found. Please log in.");

    if (!id) throw new Error("User ID is required for soft delete.");

    const response = await axios.post(
      `${API_BASE_URL}/positions-soft-delete/${id}`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return {
      success: true,
      message: response.data.message || "Position Deleted successfully.",
    };
  } catch (error) {
    console.error("Soft delete position error:", error.response || error);
    return {
      success: false,
      message: error.response?.data?.message || "Error deleting position.",
    };
  }
};

/////////////////////////////////////////////////////////////EMPLOYEE-API/////
// Fetch all employees
export const fetchEmployees = async () => {
  try {
    const token = getToken(); // Assuming you have a function to get the token
    if (!token) throw new Error("No token found. Please log in.");

    const response = await axios.get(`${API_BASE_URL}/employees`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching employees:", error);
    throw error;
  }
};

// Store employee function
export const storeEmployee = async (formData) => {
  try {
    const token = getToken();
    if (!token) throw new Error("No token found. Please log in.");

    const response = await axios.post(`${API_BASE_URL}/employees`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
        Authorization: `Bearer ${token}`, // Add your token if using authorization
      },
    });
    return response.data; // Handle the response
  } catch (error) {
    console.error("Error storing employee:", error);
    throw error;
  }
};

// Fetch employee by ID
export const fetchEmployeeById = async (id) => {
  try {
    const token = getToken(); // Assuming you have a function to get the token
    if (!token) throw new Error("No token found. Please log in.");

    const response = await axios.get(`${API_BASE_URL}/employees/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching employee by ID:", error);
    throw error;
  }
};

// Update an existing employee

export const updateEmployee = async (id, employeeData) => {
  try {
    const token = getToken();
    if (!token) throw new Error("No token found. Please log in.");
    if (!id) throw new Error("Employee ID is required");

    const isFormData = employeeData instanceof FormData;

    const config = {
      headers: {
        Authorization: `Bearer ${token}`,
        ...(isFormData
          ? {} // browser will set correct headers for FormData
          : {
              "Content-Type": "application/json",
              Accept: "application/json",
            }),
      },
    };

    const response = await axios.post(
      `${API_BASE_URL}/employees/${id}`,
      employeeData,
      config
    );

    toast.success("Employee updated successfully!");
    return response.data;
  } catch (error) {
    console.error("Update error:", error.response?.data || error.message);

    const backendError =
      error.response?.data?.message ||
      error.response?.data?.errors?.join("\n") ||
      "Failed to update employee";
    toast.error(backendError);

    throw error;
  }
};

// Delete an employee
export const SoftDeleteEmployee = async (id) => {
  try {
    const token = getToken(); // Should return the auth token

    if (!token) throw new Error("No token found. Please log in.");

    if (!id) throw new Error("User ID is required for soft delete.");

    const response = await axios.post(
      `${API_BASE_URL}/employees-soft-delete/${id}`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return {
      success: true,
      message: response.data.message || "Employee Deleted successfully.",
    };
  } catch (error) {
    console.error("Soft delete Employee error:", error.response || error);
    return {
      success: false,
      message: error.response?.data?.message || "Error deleting Employee.",
    };
  }
};
// Function to fetch employee names (id, first_name, middle_name, last_name)
export const fetchEmployeeNames = async () => {
  try {
    // Making the GET request to fetch employee names without token
    const response = await axios.get(`${API_BASE_URL}/get-employeeName`);

    // Returning the fetched employee data
    return response.data;
  } catch (error) {
    console.error("Error fetching employee names:", error);
    throw error; // Rethrow error for further handling in calling component
  }
};
//Travel Order --api
export const storeTravelOrder = async (formData) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/travel-orders`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data", // Keep the content type header
        },
      }
    );
    return response.data; // Handle the response
  } catch (error) {
    console.error("Error storing TravelOrder:", error);
    throw error;
  }
};
//Fetching travel order details api--
export const fetchToDetails = async () => {
  try {
    const token = getToken(); // Assuming you have a function to get the token
    if (!token) throw new Error("No token found. Please log in.");

    const response = await axios.get(`${API_BASE_URL}/travel-orders-detatils`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return response.data;
  } catch (error) {
    console.error("Error fetching travel orders:", error);
    throw error;
  }
};

// Function to update the status of a travel order
export const updateTravelOrderStatus = async (travelId, payload = {}) => {
  try {
    const token = getToken();
    if (!token) throw new Error("No token found. Please log in.");

    const validStatuses = ["pending", "approved", "declined", "pendingAdmin"];
    const status = payload.status;

    if (!status || !validStatuses.includes(status)) {
      throw new Error(`Invalid status value: ${status}`);
    }

    // ✅ Prepare request data with all relevant IDs
    const requestData = {
      status,
      chief_id: payload.chief_id ?? null, // Always include, allow null
      oic_id: payload.oic_id ?? null, // Always include, allow null
      regional_head_id: payload.regional_head_id ?? null,
      remarks: payload.remarks ?? null,
    };

    const response = await axios.put(
      `${API_BASE_URL}/travel-order/${travelId}/status`,
      requestData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error("❌ Error updating travel order status:", error);
    throw error;
  }
};

export const updateTravelOrderStatusAdmin = async (travelId, status) => {
  try {
    const token = getToken();
    if (!token) throw new Error("No token found. Please log in.");

    // ✅ Allow any of the valid statuses
    const allowedStatuses = ["pendingAdmin", "approved", "declined"];
    if (!allowedStatuses.includes(status)) {
      throw new Error(
        "Invalid status. Must be 'pendingAdmin', 'approved', or 'declined'."
      );
    }

    const response = await axios.put(
      `${API_BASE_URL}/travel-orderAdmin/${travelId}/status`,
      { status },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (response.data.success) {
      return response.data;
    } else {
      throw new Error(response.data.message || "Failed to update status");
    }
  } catch (error) {
    console.error("Error updating travel order status:", error);
    throw error;
  }
};

//Official Business api--

export const StoreOfficialBusiness = async (formData) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/official-businesses`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data", // Keep the content type header
        },
      }
    );
    return response.data; // Handle the response
  } catch (error) {
    console.error("Error storing TravelOrder:", error);
    throw error;
  }
};
export const fetchObDetails = async () => {
  try {
    const token = getToken(); // Get the token from local storage or other methods
    if (!token) throw new Error("No token found. Please log in.");

    const response = await axios.get(
      `${API_BASE_URL}/official-businesses/details`,
      {
        headers: {
          Authorization: `Bearer ${token}`, // Include token in request headers
        },
      }
    );

    return response.data; // Return the response data
  } catch (error) {
    console.error("Error fetching official business details:", error);
    throw error; // Rethrow the error so it can be handled by the calling function
  }
};

export const updateOfficialBusinessStatus = async (obId, payload = {}) => {
  try {
    const token = getToken();
    if (!token) throw new Error("No token found. Please log in.");

    // ✅ Valid statuses
    const validStatuses = ["pending", "approved", "declined", "pendingAdmin"];
    const status = payload?.status;

    if (!validStatuses.includes(status)) {
      throw new Error(`Invalid status value: ${status}`);
    }

    // ✅ Build request body
    const requestData = {
      status,
    };

    // ✅ Include chief_id if provided
    if (payload.chief_id != null) {
      requestData.chief_id = payload.chief_id;
    }

    // ✅ Include oic_id if provided
    if (payload.oic_id != null) {
      requestData.oic_id = payload.oic_id;
    }

    // ✅ Include regional_head_id if provided
    if (payload.regional_head_id != null) {
      requestData.regional_head_id = payload.regional_head_id;
    }

    // ✅ Include remarks if present
    if (payload.remarks) {
      requestData.remarks = payload.remarks;
    }

    // ✅ Send PUT request
    const response = await axios.put(
      `${API_BASE_URL}/official-businesses/${obId}/status`,
      requestData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error("❌ Error updating official business status:", error);
    throw error;
  }
};

//pass slips

export const fetchPassSlipDetails = async () => {
  try {
    const token = getToken();
    if (!token) throw new Error("No token found. Please log in.");

    const response = await axios.get(
      `${API_BASE_URL}/pass-slips`, // Updated endpoint to match your route
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error("Error fetching pass slip details:", error);
    throw error;
  }
};

export const storePassSlip = async (formData) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/pass-slips`, // POST to /pass-slips
      formData // Send form data directly
    );

    return response.data;
  } catch (error) {
    console.error("Error submitting pass slip:", error);
    throw error;
  }
};

export const updatePassSlipStatus = async (psId, payload = {}) => {
  try {
    const token = getToken();
    if (!token) throw new Error("No token found. Please log in.");

    const {
      status,
      remarks = "", // Default remarks to empty string
      chief_id = null, // Always include in payload
      oic_id = null, // ✅ Always include in payload
    } = payload;

    // ✅ Validate allowed status values
    const validStatuses = ["pending", "approved", "declined", "pendingAdmin"];
    if (!validStatuses.includes(status)) {
      throw new Error("Invalid status value");
    }

    // ✅ Remarks are required if status is declined
    if (status === "declined" && !remarks) {
      throw new Error("Remarks are required when status is 'declined'");
    }

    // ✅ Construct request payload (always include chief_id and oic_id)
    const requestData = {
      status,
      remarks,
      chief_id,
      oic_id,
    };

    // ✅ Debug log for inspection

    // ✅ Send update request to backend
    const response = await axios.put(
      `${API_BASE_URL}/pass-slip/${psId}/status`,
      requestData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error("❌ Error updating pass slip status:", error);
    throw error;
  }
};

// Update actual_time_departure with auth
export const updateActualTimeDeparture = async (id, actualTimeDeparture) => {
  try {
    const token = getToken();
    if (!token) throw new Error("No token found. Please log in.");

    // Ensure actualTimeDeparture is in the correct format (YYYY-MM-DD HH:mm:ss)
    const formattedTimeDeparture = new Date(actualTimeDeparture)
      .toLocaleString("en-US", { timeZone: "Asia/Manila" }) // Adjust the time zone as needed
      .replace(",", ""); // Format it to match backend, e.g. '2025-05-07 08:58:47'

    const response = await axios.put(
      `${API_BASE_URL}/update-pass-slip/${id}`,
      {
        actual_time_departure: formattedTimeDeparture, // Send the correctly formatted time
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return response.data; // Return the API response data
  } catch (error) {
    // Handle error appropriately
    console.error("API Error:", error.response?.data || error.message || error);
    throw error; // Throw the error after logging it
  }
};

export const markPassSlipAsDone = async (id, excessTimeFormatted) => {
  try {
    const token = getToken();
    if (!token) throw new Error("No token found. Please log in.");

    const response = await axios.put(
      `${API_BASE_URL}/pass-slips/${id}/mark-as-done`,
      { time_exceeded: excessTimeFormatted }, // Send formatted time
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    return response.data;
  } catch (error) {
    const errorMessage =
      error.response?.data?.message ||
      error.message ||
      "Failed to mark pass slip as done";

    console.error("API Error:", {
      endpoint: `${API_BASE_URL}/pass-slips/${id}/mark-as-done`,
      error: errorMessage,
      timestamp: new Date().toISOString(),
    });

    throw new Error(errorMessage);
  }
};

////////HistoryLogs --api
export const fetchHistoryLogs = async () => {
  try {
    const token = getToken();
    if (!token) throw new Error("No token found. Please log in.");

    const response = await axios.get(
      `${API_BASE_URL}/history-logs`, // Updated endpoint to match your route
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error("Error fetching History Logs:", error);
    throw error;
  }
};
////////Calendar --api
export const fetchCalendarEvents = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/events`);
    return response.data;
  } catch (error) {
    console.error("Error fetching calendar events:", error);
    throw error;
  }
};
//Get all users by admin USER--API
export const fetchAllUsers = async () => {
  try {
    const token = getToken();
    if (!token) throw new Error("No token found. Please log in.");

    const response = await axios.get(
      `${API_BASE_URL}/users`, // Use your API_BASE_URL constant
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (response.status === 200 && response.data.success) {
      return {
        success: true,
        users: response.data.users,
      };
    } else {
      return {
        success: false,
        message: response.data.message || "Failed to fetch users.",
      };
    }
  } catch (error) {
    console.error("Fetch users error:", error.response || error);
    return {
      success: false,
      message: error.response?.data?.message || "Error fetching users.",
    };
  }
};
export const StoreUser = async (payload) => {
  try {
    const token = getToken();
    if (!token) throw new Error("No token found. Please log in.");

    const response = await axios.post(`${API_BASE_URL}/users-store`, payload, {
      headers: { Authorization: `Bearer ${token}` },
    });
    await fetchHistoryLogs();
    // Return full data so you can check errors or success in your caller
    return response.data;
  } catch (error) {
    console.error("store users error:", error.response || error);
    // Return errors in the same shape as API response (or a fallback)
    return (
      error.response?.data || {
        success: false,
        message: "Error storing user.",
      }
    );
  }
};

export const UpdateUser = async (payload) => {
  try {
    const token = getToken(); // Should return the auth token

    if (!token) throw new Error("No token found. Please log in.");

    if (!payload.id) throw new Error("User ID is required for update.");

    const response = await axios.post(
      `${API_BASE_URL}/users-update/${payload.id}`, // pass id as URL param
      payload,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return {
      success: true,
      message: response.data.message || "User updated successfully.",
    };
  } catch (error) {
    console.error("update users error:", error.response || error);
    return {
      success: false,
      message: error.response?.data?.message || "Error updating user.",
    };
  }
};

export const SoftDeleteUser = async (id) => {
  try {
    const token = getToken(); // Should return the auth token

    if (!token) throw new Error("No token found. Please log in.");

    if (!id) throw new Error("User ID is required for soft delete.");

    const response = await axios.post(
      `${API_BASE_URL}/users-soft-delete/${id}`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return {
      success: true,
      message: response.data.message || "User Deleted successfully.",
    };
  } catch (error) {
    console.error("Soft delete users error:", error.response || error);
    return {
      success: false,
      message: error.response?.data?.message || "Error deleting user.",
    };
  }
};
//Head_positions --api

export const StoreHeadPosition = async (payload) => {
  try {
    const token = getToken();
    if (!token) {
      return {
        success: false,
        message: "No token found. Please log in.",
      };
    }

    const response = await axios.post(
      `${API_BASE_URL}/head-positions-store`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          // Only use this if you're sending JSON data.
          // For FormData (file uploads), don't include Content-Type—axios will set it.
          // 'Content-Type': 'application/json',
        },
      }
    );

    await fetchHistoryLogs();

    return response.data;
  } catch (error) {
    console.error("Store Head Position error:", error.response || error);
    return (
      error.response?.data || {
        success: false,
        message: "Error storing head position.",
      }
    );
  }
};
export const fetchnameandsignature = async () => {
  try {
    const token = getToken();
    if (!token) throw new Error("No token found. Please log in.");

    const response = await axios.get(`${API_BASE_URL}/head-position`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.status === 200 && response.data.success) {
      return {
        success: true,
        data: response.data.data, // ✅ Correct key for returned name and signature
      };
    } else {
      return {
        success: false,
        message: response.data.message || "Failed to fetch head position.",
      };
    }
  } catch (error) {
    console.error("Fetch head position error:", error.response || error);
    return {
      success: false,
      message: error.response?.data?.message || "Error fetching head position.",
    };
  }
};

export const FetchHeadPositions = async () => {
  try {
    const token = getToken();
    if (!token) throw new Error("No token found. Please log in.");

    const response = await axios.get(`${API_BASE_URL}/get-head-positions`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    });

    if (response.status === 200 && response.data.success) {
      return {
        success: true,
        data: response.data.data, // ✅ Return head positions
      };
    } else {
      return {
        success: false,
        message: response.data.message || "Failed to fetch head positions.",
      };
    }
  } catch (error) {
    console.error("❌ Fetch head positions error:", error);
    return {
      success: false,
      message:
        error.response?.data?.message ||
        "An error occurred while fetching head positions.",
    };
  }
};
export const UpdateHeadPosition = async (id, updatedData) => {
  try {
    const token = getToken();
    if (!token) throw new Error("No token found. Please log in.");

    // Check if updatedData is FormData (for file uploads)
    const isFormData = updatedData instanceof FormData;

    const headers = {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    };

    // Don't set Content-Type for FormData - let axios set it automatically
    if (!isFormData) {
      headers["Content-Type"] = "application/json";
    }

    const response = await axios.post(
      `${API_BASE_URL}/update-head-position/${id}`,
      updatedData,
      { headers }
    );

    if (response.status === 200 && response.data.success) {
      return {
        success: true,
        data: response.data.data,
        message: response.data.message || "Head position updated successfully.",
      };
    } else {
      return {
        success: false,
        message: response.data.message || "Failed to update head position.",
      };
    }
  } catch (error) {
    console.error("❌ Update head position error:", error);
    return {
      success: false,
      message:
        error.response?.data?.message ||
        "An error occurred while updating the head position.",
    };
  }
};
export const deleteHeadPosition = async (id) => {
  try {
    const token = getToken();
    if (!token) throw new Error("No token found. Please log in.");

    const response = await axios.delete(
      `${API_BASE_URL}/delete-head-position/${id}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      }
    );

    if (response.status === 200 && response.data.success) {
      return {
        success: true,
        message: response.data.message || "Head position deleted successfully.",
      };
    } else {
      return {
        success: false,
        message: response.data.message || "Failed to delete head position.",
      };
    }
  } catch (error) {
    console.error("❌ Delete head position error:", error);
    return {
      success: false,
      message:
        error.response?.data?.message ||
        "An error occurred while deleting the head position.",
    };
  }
};
export const updateHeadStatus = async (id, isActive) => {
  try {
    const token = getToken();
    if (!token) throw new Error("No token found. Please log in.");

    const response = await axios.put(
      `${API_BASE_URL}/heads/${id}/status`,
      { is_active: isActive ? 1 : 0 },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      }
    );

    if (response.status === 200 && response.data.success) {
      return {
        success: true,
        data: response.data.data,
        message: response.data.message || "Status updated successfully.",
      };
    } else {
      return {
        success: false,
        message: response.data.message || "Failed to update status.",
      };
    }
  } catch (error) {
    console.error("❌ Error updating status:", error);
    return {
      success: false,
      message:
        error.response?.data?.message ||
        "An error occurred while updating status.",
    };
  }
};

/**
 * Update is_officer_in_charge status
 */
export const updateOfficerInCharge = async (id, isOIC) => {
  try {
    const token = getToken();
    if (!token) throw new Error("No token found.");

    const response = await axios.put(
      `${API_BASE_URL}/heads/${id}/officer-in-charge`,
      { is_officer_in_charge: isOIC ? 1 : 0 },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      }
    );

    return {
      success: response.data.success,
      data: response.data.data,
      message: response.data.message,
    };
  } catch (error) {
    console.error("❌ OfficerInCharge update failed:", error);
    return {
      success: false,
      message:
        error.response?.data?.message || "Error updating officer-in-charge.",
    };
  }
};

export const updateDolexCDOChief = async (id, isChief) => {
  try {
    const token = getToken();
    if (!token) throw new Error("No token found.");

    const response = await axios.put(
      `${API_BASE_URL}/heads/${id}/dolex-cdo-chief`,
      { is_dolex_cdo_chief: isChief ? 1 : 0 },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      }
    );

    return {
      success: response.data.success,
      data: response.data.data,
      message: response.data.message,
    };
  } catch (error) {
    console.error("❌ DolexCDOChief update failed:", error);
    return {
      success: false,
      message:
        error.response?.data?.message || "Error updating DolexCDO Chief.",
    };
  }
};

//Notification --api
export const getPendingNotifications = async () => {
  try {
    const token = getToken();
    if (!token) throw new Error("No token found. Please log in.");

    const response = await axios.get(
      `${API_BASE_URL}/notifications/pending-counts`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      }
    );

    if (response.status === 200 && response.data.success) {
      return {
        success: true,
        data: {
          pending_ob_count: response.data.data.pending_ob_count,
          pending_to_count: response.data.data.pending_to_count,
          pending_ps_count: response.data.data.pending_ps_count,
        },
      };
    } else {
      return {
        success: false,
        message:
          response.data.message || "Failed to fetch notification counts.",
      };
    }
  } catch (error) {
    console.error("❌ Error fetching pending notifications:", error);
    return {
      success: false,
      message: error.response?.data?.message || error.message,
    };
  }
};

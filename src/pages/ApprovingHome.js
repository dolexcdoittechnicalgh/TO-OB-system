//Boncales | 02/12/25 | Approving Home
import * as React from "react";
import { useNavigate } from "react-router-dom";
import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { Box, Button } from "@mui/material";
import Container from "@mui/material/Container";
import Tab from "@mui/material/Tab";
import TabContext from "@mui/lab/TabContext";
import TabList from "@mui/lab/TabList";
import TabPanel from "@mui/lab/TabPanel";
import { InputBase, IconButton } from "@mui/material";
import { Search, FilterList, Logout } from "@mui/icons-material";
import "../pages/Approving.css";
import { useSearchParams } from "react-router-dom";
import { useNotifications } from "./NotificationContext";
import Swal from "sweetalert2"; // Import SweetAlert2
import { useAppContext } from "../contexts/ContextProvider";
import {
  fetchToDetails,
  fetchTOhistory,
  fetchObDetails,
  fetchPassSlipDetails,
  fetchHistoryLogs,
  fetchAllUsers,
  fetchnameandsignature,
  getPendingNotifications,
} from "../api"; // adjust path as needed
//02/17/2025 | Importing functions from Functions.js
import {
  ApprovingEmployee,
  ApprovingPending,
  ApprovingReports,
  ApprovingHistory,
  Header,
  StatisticsEmployee,
  UserProfile,
  Logs,
  ManageHead,
} from "./Functions";
import echo from "../utils/echo"; // 👈 Your configured Echo instance

import dayjs from "dayjs";
import isBetweenPlugin from "dayjs/plugin/isBetween";

// Extend dayjs with the isBetween plugin
dayjs.extend(isBetweenPlugin);
function ApprovingHome() {
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get("tab") || "pending";
  const [value, setValue] = React.useState(initialTab);
  const { logout } = useAppContext(); // Use context's logout function
  const handleChange = (event, newValue) => {
    setValue(newValue);
  };
  const navigate = useNavigate(); // Initialize navigate
  const { updateNotifications } = useNotifications();
  const handleLogout = () => {
    // Show confirmation dialog using Swal
    Swal.fire({
      title: "Are you sure?",
      text: "You will be logged out of your account!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, logout",
      cancelButtonText: "Cancel",
      reverseButtons: false, // Reverse the button order
    }).then((result) => {
      if (result.isConfirmed) {
        logout(); // Call the logout function from context
        navigate("/"); // Redirect to login page after logout
      } else {
        Swal.fire("Cancelled", "Your session is safe.", "info"); // Show cancel message
      }
    });
  };
  const [pendingData, setPendingData] = useState([]); // Initialize it as an empty array

  // Define state for combined pending data (TO + OB)
  const [combinedPendingData, setCombinedPendingData] = useState([]);
  const [isLoadingPending, setIsLoadingPending] = useState(true);
  const [error, setError] = useState(null);
  const { userRole } = useAppContext();
  const [employeeCountsOfficialBusiness, setEmployeeCountsOfficialBusiness] =
    useState({});
  const [employeeCountsTravelOrder, setEmployeeCountsTravelOrder] = useState(
    {}
  );
  const [employeeCountsPassSlip, setEmployeeCountsPassSlip] = useState({});
  const [headPosition, setHeadPosition] = useState(null);
  const [signatureUrl, setSignatureUrl] = useState(null);
  const headPositionId = headPosition?.data?.id;
  const [unreadNotifications, setUnreadNotifications] = useState([]);
  const [notifications, setNotifications] = useState([]);

  const filterByRole = (data, key, role) => {
    return data.filter((item) => {
      if (!item || typeof item !== "object") return false;

      // Ensure the key exists and the status is defined within the nested object or fallback to top-level status
      const status =
        item[key] && item[key].status !== undefined
          ? item[key].status
          : item.status;

      // If no status is found, skip the item
      if (!status) return false;

      // Always include "approved" and "declined" statuses
      if (status === "approved" || status === "declined") return true;

      // Role-based logic for pending statuses
      switch (role) {
        case "admin":
          // Admin can view "pendingAdmin" status
          return status === "pendingAdmin";
        case "evaluator":
          // Evaluator can view "pending" status
          return status === "pending";
        default:
          return false;
      }
    });
  };

  const getToDetails = async () => {
    try {
      setIsLoadingPending(true);

      const [toResponse, obResponse, psResponse, headResponse] =
        await Promise.all([
          fetchToDetails(),
          fetchObDetails(),
          fetchPassSlipDetails(),
          fetchnameandsignature(),
        ]);

      // console.log("✅ Head position Response:", headResponse);
      // console.log("TO API Response:", toResponse);
      // console.log("OB API Response:", obResponse);
      // console.log("PS API Response:", psResponse);

      const hostname = window.location.hostname;

      const API_BASE_URL =
        hostname === "localhost" ||
        hostname.startsWith("192.168.") ||
        hostname.startsWith("10.")
          ? `http://${hostname}:8000` // Local or LAN
          : window.location.origin; // Production

      const signaturePath = headResponse?.data?.signature;

      let fullSignatureUrl = null;

      if (signaturePath) {
        // ✅ Normalize path to avoid duplicate slashes
        const normalizedPath = signaturePath.replace(/^\/+/, "");
        fullSignatureUrl = `${API_BASE_URL}/${normalizedPath}`;

        setSignatureUrl(fullSignatureUrl);
      } else {
        // Optional fallback
        const fallbackUrl = "https://via.placeholder.com/150";
        setSignatureUrl(fallbackUrl);
        console.warn("⚠️ No signature found. Using fallback:", fallbackUrl);
      }

      setHeadPosition(headResponse?.data);
      // ----- TRAVEL ORDER -----
      const travelOrders = Array.isArray(toResponse?.data)
        ? toResponse.data
        : [];
      const filteredTO = filterByRole(travelOrders, "travel_order", userRole);

      const combinedPendingToData = filteredTO.map((order) => ({
        ...order,
        type: "TO",
        approved_at: order.travel_order?.approved_at || "",
      }));

      if (toResponse?.employee_countsTravelOrder) {
        setEmployeeCountsTravelOrder(toResponse.employee_countsTravelOrder);
      }

      // ----- OFFICIAL BUSINESS -----
      const obItems = Array.isArray(obResponse?.data) ? obResponse.data : [];
      const filteredOB = filterByRole(obItems, "official_business", userRole);

      const combinedPendingObData = filteredOB.map((order) => ({
        ...order,
        type: "OB",
        approved_at: order.official_business?.approved_at || "",
      }));

      if (obResponse?.employee_countsOfficialBusiness) {
        setEmployeeCountsOfficialBusiness(
          obResponse.employee_countsOfficialBusiness
        );
      }

      // ----- PASS SLIPS -----
      const psArray = Array.isArray(psResponse)
        ? psResponse
        : Array.isArray(psResponse?.data)
        ? psResponse.data
        : [];

      const filteredPS = filterByRole(psArray, "pass_slip", userRole);

      const combinedPendingPsData = filteredPS.map((ps) => {
        const employee = ps.employees?.[0] || {};
        return {
          ...ps,
          type: "PS",
          approved_at: ps.pass_slip?.approved_at || "",
          place_to_visit: ps.pass_slip?.place_to_visit || "",
          reason: ps.pass_slip?.reason || "",
          full_name: `${employee.first_name || ""} ${
            employee.middle_name ? employee.middle_name[0] + "." : ""
          } ${employee.last_name || ""}`.trim(),
        };
      });

      if (psResponse?.employee_countsPassSlip) {
        setEmployeeCountsPassSlip(psResponse.employee_countsPassSlip);
      }

      // ----- COMBINE ALL -----
      const combinedPendingAllData = [
        ...combinedPendingToData,
        ...combinedPendingObData,
        ...combinedPendingPsData,
      ];

      setCombinedPendingData(combinedPendingAllData);
    } catch (error) {
      console.error("❌ Error fetching data:", error);
      setError(error.message || "Unknown error occurred.");
    } finally {
      setIsLoadingPending(false);
    }
  };

  // ✅ Call on component mount
  useEffect(() => {
    getToDetails();
  }, []);

  const [searchTerm, setSearchTerm] = useState("");
  // In your parent component
  const [historyLogs, setHistoryLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const handleGetHistory = async () => {
    try {
      setLoading(true);
      const response = await fetchHistoryLogs();
      const rawData = response.data || response;

      const formattedData = Array.isArray(rawData)
        ? rawData.map((log) => ({
            ...log,
            date: log.date ? log.date.substring(0, 10) : "",
          }))
        : [];

      setHistoryLogs(formattedData);
    } catch (error) {
      console.error("Failed to fetch history logs:", error);
      setHistoryLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleGetHistory();
  }, []);

  const filteredLogs = useMemo(() => {
    if (!searchTerm.trim()) return null; // Return null when no search term

    const term = searchTerm.toLowerCase();
    return historyLogs.filter((log) => {
      // Safely handle potential missing properties
      const userName = String(log.user_name || "").toLowerCase();
      const action = String(log.action || "").toLowerCase();
      const date = String(log.date || "").toLowerCase();
      const remarks = String(log.remarks || "").toLowerCase();

      return (
        userName.includes(term) ||
        action.includes(term) ||
        date.includes(term) ||
        remarks.includes(term)
      );
    });
  }, [historyLogs, searchTerm]);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value.toLowerCase());
  };
  const [selectedRange, setSelectedRange] = useState({
    start: dayjs(),
    end: dayjs().add(6, "day"),
  });

  const filteredData = combinedPendingData?.filter((report) => {
    let reportDate = dayjs(report.date);
    if (!reportDate.isValid()) return false;

    const isWithinDateRange = reportDate.isBetween(
      selectedRange.start.startOf("day"),
      selectedRange.end.endOf("day"),
      null,
      "[]"
    );
    if (!isWithinDateRange) return false;

    const status =
      report.type === "OB" && report.official_business
        ? report.official_business.status
        : report.type === "TO" && report.travel_order
        ? report.travel_order.status
        : report.type === "PS" && report.pass_slip
        ? report.pass_slip.status
        : "";

    const combinedText = [
      report.type === "OB"
        ? "Official Business"
        : report.type === "TO"
        ? "Travel Order"
        : report.type === "PS"
        ? "Pass Slip"
        : "",

      status,

      reportDate.format("YYYY-MM-DD"),

      ...(report.employees?.map(
        (emp) => `${emp.first_name} ${emp.last_name}`
      ) || []),

      report.type === "OB"
        ? report.official_business?.travel_to
        : report.type === "TO"
        ? report.travel_order?.destination
        : report.type === "PS"
        ? report.pass_slip?.place_to_visit
        : "",
    ]
      .join(" ")
      .toLowerCase();

    return combinedText.includes(searchTerm.toLowerCase());
  });
  const handleNotificationResult = (result) => {
    if (result.success) {
      const obCount = result.data?.pending_ob_count || 0;
      const toCount = result.data?.pending_to_count || 0;
      const psCount = result.data?.pending_ps_count || 0;

      const newNotifications = [
        obCount > 0 && {
          id: "ob-notification",
          title: "OB Requests",
          message: `${obCount} pending approval${obCount > 1 ? "s" : ""}`,
        },
        toCount > 0 && {
          id: "to-notification",
          title: "TO Requests",
          message: `${toCount} pending approval${toCount > 1 ? "s" : ""}`,
        },
        psCount > 0 && {
          id: "ps-notification",
          title: "Pass Slips",
          message: `${psCount} pending approval${psCount > 1 ? "s" : ""}`,
        },
      ].filter(Boolean);

      updateNotifications(newNotifications);
    } else {
      console.warn("❌ Invalid result received:", result);
    }
  };

  const fetchNotifications = async () => {
    try {
      const result = await getPendingNotifications();
      handleNotificationResult(result);
    } catch (error) {
      console.error("❌ Failed to fetch notifications:", error);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const fetchAndListen = async () => {
      await fetchNotifications();

      const channel = echo.channel("travel-orders");

      channel.listen(".travel-order.status.updated", (event) => {
        if (isMounted) {
          fetchNotifications();
        }
      });
    };

    fetchAndListen();

    return () => {
      isMounted = false;
      echo.leaveChannel("travel-orders");
    };
  }, []);

  //filtering dont touch
  const [filteringDate, setFilteringDate] = useState("week"); // or "month"

  const filterDataByDate = (data, filteringDate) => {
    const today = dayjs();
    let startDate, endDate;

    // Determine the date range based on the filteringDate parameter (week or month)
    switch (filteringDate) {
      case "week":
        startDate = today.startOf("week");
        endDate = today.endOf("week");
        break;
      case "month":
        startDate = today.startOf("month");
        endDate = today.endOf("month");
        break;
      default:
        startDate = today.startOf("day");
        endDate = today.endOf("day");
    }

    // Filter the data based on the date range
    return data.filter((item) => {
      const itemDate = dayjs(item.date); // Assuming each item has a 'date' field
      return itemDate.isBetween(startDate, endDate, null, "[]"); // Filter the data within the date range
    });
  };

  const [users, setUsers] = useState([]);
  useEffect(() => {
    const loadUsers = async () => {
      const result = await fetchAllUsers();
      if (result.success) {
        setUsers(result.users);
      } else {
        console.error("Could not load users:", result.message);
      }
    };
    loadUsers();
  }, []);
  return (
    <Box
      sx={{
        backgroundImage: "url('bgimage1.webp')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        minHeight: "100vh",
        overflow: "auto",
        position: "relative", // <-- ADD THIS
      }}
    >
      <Header getToDetails={getToDetails} />

      <Container
        fixed
        sx={{
          p: 2,
          maxHeight: "calc(100vh - 64px)", // Subtract header height
        }}
      >
        {/* Search & Logout Layout */}
        <Box
          sx={{
            display: "flex",
            flexDirection: "column", // Default: Logout on top, Search below
            alignItems: "flex-end",
            gap: 1,
            mb: 2,
            "@media (max-width: 600px)": {
              flexDirection: "row", // Mobile: Side by side
              justifyContent: "space-between",
              alignItems: "center",
            },
          }}
        >
          {/* Logout Button */}
          <Button
            variant="contained"
            startIcon={<Logout />}
            onClick={handleLogout}
            sx={{
              fontSize: { xs: "10px", sm: "14px" },
              padding: { xs: "5px 10px", sm: "8px 16px" },
            }}
          >
            Logout
          </Button>

          {/* Search Bar */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              border: "1px solid black",
              borderRadius: "10px",
              px: 1,
              py: 0.5,
              backgroundColor: "white",
              width: "80%",
              maxWidth: "300px",
              "@media (max-width: 600px)": { width: "auto" }, // Mobile: Adjust width
            }}
          >
            <IconButton size="small">
              <Search fontSize="small" />
            </IconButton>
            <InputBase
              placeholder="Search..."
              value={searchTerm}
              onChange={handleSearchChange}
              sx={{ flex: 1, fontSize: "14px" }}
            />

            <IconButton size="small">
              <FilterList fontSize="small" />
            </IconButton>
          </Box>
        </Box>

        {/* Tabs */}
        <TabContext value={value}>
          <Box sx={{ borderBottom: 1, borderColor: "divider", width: "100%" }}>
            <TabList
              onChange={handleChange}
              variant="scrollable"
              scrollButtons="auto"
            >
              <Tab
                label="Pending"
                value="pending"
                sx={{ fontSize: { xs: "12px", sm: "14px" } }}
              />
              <Tab
                label="Approved"
                value="history"
                sx={{ fontSize: { xs: "12px", sm: "14px" } }}
              />
              <Tab
                label="Reports"
                value="reports"
                sx={{ fontSize: { xs: "12px", sm: "14px" } }}
              />
              <Tab
                label="Logs"
                value="logs"
                sx={{ fontSize: { xs: "12px", sm: "14px" } }}
              />
              <Tab
                label="Employee"
                value="employee"
                sx={{ fontSize: { xs: "12px", sm: "14px" } }}
              />
              <Tab
                label="Graphs"
                value="graphs"
                sx={{ fontSize: { xs: "12px", sm: "14px" } }}
              />
              {userRole !== "evaluator" && (
                <Tab
                  label="User Profile"
                  value="user-profile"
                  sx={{ fontSize: { xs: "12px", sm: "14px" } }}
                />
              )}
              {userRole !== "evaluator" && (
                <Tab
                  label="MANAGE HEAD"
                  value="manage-head"
                  sx={{ fontSize: { xs: "12px", sm: "14px" } }}
                />
              )}
            </TabList>
          </Box>

          <TabPanel value="pending">
            <ApprovingPending
              data={filteredData} // Pass filtered data instead of the original combinedPendingData
              isLoading={isLoadingPending}
              refetch={getToDetails}
              refreshHistoryLogs={handleGetHistory} // Pass the actual function
              userRole={userRole} // Pass the userRole prop
              Headposition={headPosition} // ✅ Pass the actual data here
              signatureUrl={signatureUrl} // ✅ pass this
              notifications={notifications} // ✅ Pass here
            />
          </TabPanel>

          <TabPanel value="history">
            <ApprovingHistory
              // data={approvedData}
              data={filteredData} // Pass filtered data instead of the original combinedPendingData
              isLoading={isLoadingPending}
              userRole={userRole} // ✅ added this line to pass the userRole prop
              Headposition={headPosition} // ✅ Pass the actual data here
              signatureUrl={signatureUrl} // ✅ pass this
            />
          </TabPanel>
          <TabPanel value="reports">
            <ApprovingReports
              data={filteredData}
              isLoading={isLoadingPending}
              userRole={userRole}
            />
          </TabPanel>

          <TabPanel value="logs">
            <Logs
              userRole={userRole}
              historyLogs={historyLogs}
              loading={loading}
              data={filteredLogs} // ✅ pass here
            />
          </TabPanel>

          <TabPanel value="employee">
            <ApprovingEmployee
              refreshHistoryLogs={handleGetHistory} // Pass the actual function
              setLoading={setLoading}
            />
          </TabPanel>

          <TabPanel value="graphs">
            <StatisticsEmployee
              userRole={userRole}
              data={employeeCountsOfficialBusiness} // ✅ pass here
              travelOrderData={employeeCountsTravelOrder}
              passSlipData={employeeCountsPassSlip}
              filter={filteringDate} // ✅ correctly passed as the filter prop
            />
          </TabPanel>

          <TabPanel value="user-profile">
            <UserProfile
              users={users}
              setUsers={setUsers}
              refreshHistoryLogs={handleGetHistory} // Pass the actual function
              setLoading={setLoading}
            />
          </TabPanel>
          <TabPanel value="manage-head">
            <ManageHead
              users={users}
              setUsers={setUsers}
              refreshHistoryLogs={handleGetHistory} // Pass the actual function
              setLoading={setLoading}
              refetch={getToDetails}
            />
          </TabPanel>
        </TabContext>
      </Container>
    </Box>
  );
}

export default ApprovingHome;

import React, { useState, useEffect, useMemo } from "react";
import {
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  Paper,
  Typography,
  Box,
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  Chip,
  DialogActions,
  IconButton,
  Divider,
  Grid,
  Card,
  Pagination,
  CardContent,
} from "@mui/material";
import { AccessTime, Person, LocationOn, Info } from "@mui/icons-material";

import { Logout } from "@mui/icons-material";
import { fetchPassSlipDetails } from "../api"; // adjust path as needed
import Swal from "sweetalert2"; // Make sure you have SweetAlert2 imported
import { updateActualTimeDeparture, markPassSlipAsDone } from "../api"; // or '../api/passSlipApi'
import { useSnackbar } from "notistack";
import { toast } from "react-toastify"; // This is the crucial import
import { useAppContext } from "../contexts/ContextProvider";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import CloseIcon from "@mui/icons-material/Close";
import ArchiveIcon from "@mui/icons-material/Archive";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
dayjs.extend(utc);
dayjs.extend(timezone);

const PassSlipInterface = () => {
  const [tableData, setTableData] = useState([]);
  const [doneModalOpen, setDoneModalOpen] = useState(false);
  const { logout } = useAppContext(); // Use context's logout function
  const navigate = useNavigate(); // For navigation
  const [loading, setLoading] = useState(true);
  // At the top of your component with other state declarations
  const [passSlips, setPassSlips] = useState([]); // Or your initial state
  //   const [searchQuery, setSearchQuery] = useState("");
  const [archiveModalOpen, setArchiveModalOpen] = useState(false);

  const calculateRemainingTime = (endTime) => {
    const endDate = new Date(endTime);
    const now = new Date();
    const timeDifference = endDate - now; // Difference in milliseconds

    // If time has passed, return 0 or some other value
    if (timeDifference <= 0) return 0;

    // Otherwise, return the remaining time in seconds
    return Math.floor(timeDifference / 1000); // Convert to seconds
  };
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const rowsPerPage = 5;

  const philippineToday = dayjs().tz("Asia/Manila").format("YYYY-MM-DD");

  const filteredDataArchive = useMemo(() => {
    return tableData
      .filter((item) => {
        return (
          item.is_done !== 1 &&
          dayjs(item.date_of_issue).isBefore(philippineToday)
        );
      })
      .filter((item) =>
        item.employee_name.toLowerCase().includes(search.toLowerCase())
      );
  }, [tableData, search, philippineToday]);

  const paginatedData = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    return filteredDataArchive.slice(start, start + rowsPerPage);
  }, [filteredDataArchive, page]);

  const totalPages = Math.ceil(filteredDataArchive.length / rowsPerPage);
  const handleGetPassSlipData = async () => {
    try {
      setLoading(true);

      const response = await fetchPassSlipDetails();

      if (!response.success) {
        console.error("Failed to fetch pass slip data");
        return;
      }

      const approvedPassSlips = response.data
        .filter((item) => item.pass_slip.status === "approved")
        .map((item) => {
          const employee = item.employees?.[0];
          if (!employee) return null;

          const departureStr = item.pass_slip.actual_time_departure;
          const arrivalStr = item.pass_slip.actual_time_arrival;
          const isDone = item.pass_slip.is_done;

          if (!departureStr) {
            return {
              id: item.pass_slip.pass_slip_id,
              employee_name: `${employee.first_name} ${
                employee.middle_name ? employee.middle_name + " " : ""
              }${employee.last_name}`,
              date_of_issue: item.pass_slip.created_at,
              reason_for_pass: item.pass_slip.reason,
              endTime: null,
              actual_time_arrival: null,
              status: item.pass_slip.status,
              is_done: isDone,
              activeButton: null,
              increment: 0,
              excessTime: 0,
              remainingTime: 0,
              countingUp: false,
            };
          }

          // Parse arrival time - handle both full datetime and time-only formats
          let arrivalTime;
          let arrivalDateStr;

          if (!arrivalStr) {
            console.error(
              "Missing arrival time for pass slip:",
              item.pass_slip.pass_slip_id
            );
            return null;
          }

          try {
            const trimmedArrival = arrivalStr.trim();

            // Check if it's a full datetime string (contains date)
            if (
              trimmedArrival.includes("-") &&
              (trimmedArrival.includes(" ") || trimmedArrival.includes("T"))
            ) {
              // Handle full datetime string (e.g., "2025-05-29 11:03:19" or "2025-05-29T11:03:19")
              arrivalDateStr = trimmedArrival.includes("T")
                ? trimmedArrival
                : trimmedArrival.replace(" ", "T");
              arrivalTime = new Date(arrivalDateStr).getTime();
            }
            // Check if it's just a time string (HH:MM:SS format)
            else if (/^\d{2}:\d{2}:\d{2}$/.test(trimmedArrival)) {
              // Use today's date with the specified time
              const today = new Date().toISOString().split("T")[0];
              arrivalDateStr = `${today}T${trimmedArrival}`;
              arrivalTime = new Date(arrivalDateStr).getTime();
            }
            // Try to parse as-is
            else {
              arrivalTime = new Date(trimmedArrival).getTime();
              arrivalDateStr = trimmedArrival;
            }

            if (isNaN(arrivalTime)) {
              console.error(
                "Invalid arrival time format:",
                arrivalStr,
                "for pass slip:",
                item.pass_slip.pass_slip_id
              );
              return null;
            }
          } catch (error) {
            console.error(
              "Error parsing arrival time:",
              error,
              "Input:",
              arrivalStr
            );
            return null;
          }

          const now = Date.now();
          const remaining = arrivalTime - now;
          const countingUp = remaining <= 0;
          const remainingSeconds = Math.abs(Math.floor(remaining / 1000));

          const hours = Math.floor(remainingSeconds / 3600);
          const minutes = Math.floor((remainingSeconds % 3600) / 60);
          const seconds = remainingSeconds % 60;

          const formattedTime = `${hours.toString().padStart(2, "0")}:${minutes
            .toString()
            .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;

          const formattedArrivalTime = new Date(arrivalTime).toLocaleTimeString(
            "en-PH",
            {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
              hour12: true,
              timeZone: "Asia/Manila",
            }
          );

          return {
            id: item.pass_slip.pass_slip_id,
            employee_name: `${employee.first_name} ${
              employee.middle_name ? employee.middle_name + " " : ""
            }${employee.last_name}`,
            date_of_issue: item.pass_slip.created_at,
            reason_for_pass: item.pass_slip.reason,
            endTime: arrivalTime,
            actual_time_arrival: formattedArrivalTime,
            status: item.pass_slip.status,
            is_done: isDone,
            activeButton: null,
            increment: countingUp ? remainingSeconds : 0,
            excessTime: countingUp ? remainingSeconds : 0,
            remainingTime: countingUp ? 0 : remainingSeconds,
            formattedTime,
            countingUp,
          };
        })
        .filter((item) => item !== null);

      setTableData(approvedPassSlips);
    } catch (error) {
      console.error("Error fetching pass slip data", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleGetPassSlipData();
  }, []); // Empty dependency array means this runs once when the component mounts

  const [searchQuery, setSearchQuery] = useState("");

  const handleStart = async (rowId) => {
    try {
      // Get the current local timestamp
      const currentTimestamp = new Date()
        .toLocaleString("en-US", { timeZone: "Asia/Manila" }) // Use your local timezone
        .replace(",", ""); // Format it to match the backend, e.g., '2025-05-07 08:58:47'

      const result = await updateActualTimeDeparture(rowId, currentTimestamp);

      if (result.success) {
        const arrivalTime = new Date(result.actual_time_arrival).getTime();

        setTableData((prevData) =>
          prevData.map((row) =>
            row.id === rowId
              ? {
                  ...row,
                  endTime: arrivalTime, // store the arrival time
                  status: "Active",
                  remainingTime: arrivalTime - Date.now(),
                  countingUp: false,
                  increment: 0,
                  excessTime: 0,
                }
              : row
          )
        );

        Swal.fire(
          "Action successful!",
          `Started the action for row with ID ${rowId}, and set actual time of departure to ${currentTimestamp}.`,
          "success"
        );
      } else {
        Swal.fire({
          title: "Error!",
          text: "There was an issue updating the actual time of departure.",
          icon: "error",
          confirmButtonColor: "#D33",
        });
      }
    } catch (error) {
      Swal.fire({
        title: "Error!",
        text: "An error occurred while updating the time.",
        icon: "error",
        confirmButtonColor: "#D33",
      });
      console.error("Error updating the time:", error);
    }
  };
  useEffect(() => {
    const interval = setInterval(() => {
      setTableData((prevData) => {
        return prevData.map((row) => {
          // If is_done is 1, maintain the current state without further counting
          if (row.is_done === 1) return row;

          // Check if the row has arrival time
          if (!row.endTime) return row; // Ensure endTime exists (arrival time is a timestamp)

          const now = Date.now(); // Current time
          const arrivalTime = row.endTime; // Arrival time as a timestamp (in ms)

          const remaining = arrivalTime - now; // Calculate remaining time (in ms)

          if (remaining > 0) {
            // Still time left (countdown)
            return {
              ...row,
              remainingTime: remaining,
              countingUp: false,
              formattedTime: formatTime(remaining), // Format the remaining time as hh:mm:ss
            };
          } else {
            // Increment the excess time manually
            const newExcess = (row.excessTime || 0) + 1;
            return {
              ...row,
              remainingTime: 0,
              countingUp: true,
              excessTime: newExcess,
              formattedTime: formatTime(newExcess * 1000),
            };
          }
        });
      });
    }, 1000); // Update every second

    return () => clearInterval(interval); // Clean up the interval when the component unmounts
  }, []); // Empty dependency array ensures this effect only runs once

  // Converts milliseconds to h:mm:ss format
  const formatTime = (milliseconds) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return [
      hours.toString().padStart(2, "0"),
      minutes.toString().padStart(2, "0"),
      seconds.toString().padStart(2, "0"),
    ].join(":");
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };
  const handleLogout = () => {
    Swal.fire({
      title: "Are you sure?",
      text: "You will be logged out of the system.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6", // blue
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, logout",
    }).then((result) => {
      if (result.isConfirmed) {
        console.log("Logging out...");
        logout(); // Call the context's logout function

        // Show success alert after logout
        Swal.fire("Logged Out!", "You have been logged out.", "success").then(
          () => {
            // Redirect to homepage after logout
            navigate("/");
          }
        );
      }
    });
  };

  const handleAction = (type, id) => {
    setTableData((prevData) =>
      prevData.map((row) => {
        if (row.id === id) {
          console.log("Current row:", row); // Log the current row before any changes

          if (type === "Start") {
            // Start the timer with a 5-second duration
            const startTime = new Date().getTime();
            const twoHoursLater = startTime + 2 * 60 * 60 * 1000;
            console.log("Starting timer at:", twoHoursLater);
            return {
              ...row,
              endTime: twoHoursLater,
              remainingTime: 1 * 1000, // Start from 5 seconds
              status: "Active",
              activeButton: "Start", // Set active button to Start
              increment: 1, // Initialize increment to 1 (for counting up)
              countingUp: false, // Flag to indicate if we are counting up or down
            };
          } else if (type === "Pause") {
            console.log("Pausing timer");
            // Pause the timer
            return {
              ...row,
              status: "Paused",
              activeButton: "Resume", // Change button to Resume after Pause
            };
          } else if (type === "Resume") {
            console.log("Resuming timer");
            // Resume the timer from where it was paused
            const resumeTime = new Date().getTime();
            const newEndTime = resumeTime + row.remainingTime;
            console.log("Resumed timer with end time:", newEndTime);
            return {
              ...row,
              endTime: newEndTime,
              remainingTime: newEndTime - resumeTime, // Calculate remaining time
              status: "Active",
              activeButton: "Resume", // Keep active button as Resume
            };
          } else if (type === "Done") {
            console.log("Timer completed");
            return {
              ...row,
              endTime: null,
              remainingTime: 0,
              status: "Completed",
              activeButton: "Done",
              countingUp: false, // Reset countingUp flag
              increment: 1, // Reset increment
            };
          } else if (type === "Cancel") {
            console.log("Canceling timer");
            return {
              ...row,
              endTime: null,
              remainingTime: 0,
              status: "Cancelled",
              activeButton: "Cancel",
              countingUp: false, // Reset countingUp flag
              increment: 1, // Reset increment
            };
          }
        }
        return row;
      })
    );
  };

  // Derive filtered data dynamically
  const filteredData = tableData.filter(
    (row) =>
      (row.employee_name &&
        row.employee_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (row.date_of_issue &&
        row.date_of_issue.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (row.reason_for_pass &&
        row.reason_for_pass.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleMarkAsDone = async (passSlipId, employeeName, excessTime) => {
    const hasExcess = excessTime > 0;
    const formattedExcess =
      excessTime >= 0 ? formatTime(excessTime * 1000) : null; // This will format 0 as "00:00:00"
    const result = await Swal.fire({
      title: "Confirm Completion",
      html: `
        <p>You are about to mark <strong>${employeeName}'s</strong> pass slip as done.</p>
        <p>This action cannot be undone.</p>
        ${
          hasExcess
            ? `<p style="color: red; font-weight: bold;">
                 Time exceeded by: ${formattedExcess}
               </p>`
            : ""
        }
      `,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, mark as done",
      cancelButtonText: "Cancel",
    });

    if (result.isConfirmed) {
      try {
        const response = await markPassSlipAsDone(passSlipId, formattedExcess);

        if (response.success) {
          // Refresh data from the backend
          await handleGetPassSlipData();

          Swal.fire(
            "Completed!",
            `${employeeName}'s pass slip has been marked as done.` +
              (hasExcess ? ` (Exceeded by: ${formattedExcess})` : ""),
            "success"
          );
        }
      } catch (error) {
        const message =
          error.response?.data?.message ||
          error.message ||
          "An error occurred.";
        Swal.fire(
          "Error!",
          `Failed to mark ${employeeName}'s pass slip: ${message}`,
          "error"
        );
      }
    }
  };

  return (
    <Box
      sx={{
        maxWidth: "100%",
        margin: "0 auto",
        padding: 3,
        backgroundImage: "url('bgimage1.webp')",
        backgroundSize: "cover",
        minHeight: "100vh",
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 3,
          backgroundColor: "rgba(255, 255, 255, 0.7)",
          padding: "10px",
          borderRadius: "8px",
        }}
      >
        <Typography variant="h4">Pass Slip Interface</Typography>
        <Box sx={{ display: "flex", gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<Logout />}
            onClick={handleLogout}
            sx={{
              color: "#1976d2",
              borderColor: "#1976d2",
              "&:hover": {
                backgroundColor: "#1976d2",
                color: "#fff",
                borderColor: "#1976d2",
              },
            }}
          >
            Logout
          </Button>
        </Box>
      </Box>

      {/* Search */}
      <Box sx={{ marginBottom: 2 }}>
        <TextField
          fullWidth
          label="Search"
          variant="outlined"
          value={searchQuery}
          onChange={handleSearchChange}
          placeholder="Search by employee name, date, or reason"
        />
      </Box>
      <Box
        sx={{ display: "flex", justifyContent: "flex-end", gap: 2, padding: 2 }}
      >
        <Button
          variant="contained"
          color="secondary"
          startIcon={<ArchiveIcon />}
          onClick={() => setArchiveModalOpen(true)}
        >
          Archive
        </Button>

        <Button
          variant="contained"
          color="success"
          startIcon={<CheckCircleIcon />}
          onClick={() => setDoneModalOpen(true)}
        >
          Done Pass Slips
        </Button>
      </Box>

      {/* Table */}
      <TableContainer
        component={Paper}
        sx={{
          boxShadow: 3,
          position: "relative", // ✅ Correctly placed inside the sx object
        }}
      >
        <Table sx={{ minWidth: 650 }}>
          <TableHead sx={{ backgroundColor: "#f0f0f0" }}>
            <TableRow>
              <TableCell sx={{ fontWeight: "bold" }}>Employee Name</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Date of Issue</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Reason for Pass</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Time Remaining</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Time Excess</TableCell>
              <TableCell sx={{ fontWeight: "bold" }} align="center">
                Actions
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  <Typography variant="body2" mt={1}>
                    Loading Pass Slip Data...
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              (() => {
                const todayPH = dayjs().tz("Asia/Manila").format("YYYY-MM-DD");
                const activeToday = filteredData.filter(
                  (row) => row.is_done === 0 && row.date_of_issue === todayPH
                );

                if (activeToday.length === 0) {
                  return (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        <Typography variant="h6" color="textSecondary">
                          No Active Pass Slips Today
                        </Typography>
                      </TableCell>
                    </TableRow>
                  );
                }

                return activeToday.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>{row.employee_name}</TableCell>
                    <TableCell>{row.date_of_issue}</TableCell>
                    <TableCell>{row.reason_for_pass}</TableCell>
                    <TableCell>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: "bold",
                          color: row.remainingTime <= 0 ? "red" : "black",
                        }}
                      >
                        {row.status === "Not Started" || row.status === "Paused"
                          ? "---"
                          : row.remainingTime <= 0
                          ? formatTime(0)
                          : formatTime(row.remainingTime)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: "bold",
                          color: row.excessTime > 0 ? "red" : "black",
                        }}
                      >
                        {formatTime(row.excessTime * 1000)}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Grid container spacing={1}>
                        <Grid item>
                          <Button
                            variant="contained"
                            size="small"
                            color="primary"
                            onClick={() => {
                              const employeeName = row?.employee_name;
                              if (employeeName) {
                                Swal.fire({
                                  title: "Are you sure?",
                                  text: `You are about to ${
                                    row.status === "Paused" ? "resume" : "start"
                                  } the row named "${employeeName}".`,
                                  icon: "warning",
                                  showCancelButton: true,
                                  confirmButtonColor: "#3085d6",
                                  cancelButtonColor: "#d33",
                                  confirmButtonText: "Yes, proceed!",
                                  cancelButtonText: "Cancel",
                                }).then((result) => {
                                  if (result.isConfirmed) {
                                    handleStart(row.id);
                                  }
                                });
                              } else {
                                Swal.fire({
                                  title: "Error!",
                                  text: "No employee data found.",
                                  icon: "error",
                                  confirmButtonColor: "#D33",
                                });
                              }
                            }}
                            disabled={
                              row.status === "Active" ||
                              row.actual_time_arrival !== null
                            }
                          >
                            {row.status === "Paused" ? "Resume" : "Start"}
                          </Button>
                        </Grid>
                        <Grid item>
                          <Button
                            variant="contained"
                            size="small"
                            color="success"
                            onClick={() =>
                              handleMarkAsDone(
                                row.id,
                                row.employee_name,
                                row.excessTime || 0
                              )
                            }
                            disabled={
                              row.status === "Completed" ||
                              row.status === "Cancelled"
                            }
                          >
                            Done
                          </Button>
                        </Grid>
                      </Grid>
                    </TableCell>
                  </TableRow>
                ));
              })()
            )}
          </TableBody>
        </Table>
      </TableContainer>
      {/* modal dialog for done pass_slip */}
      <Dialog
        open={doneModalOpen}
        onClose={() => setDoneModalOpen(false)}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          Done Pass Slips
          <IconButton
            aria-label="close"
            onClick={() => setDoneModalOpen(false)}
            sx={{
              color: (theme) => theme.palette.grey[500],
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: "bold" }}>
                    Employee Name
                  </TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>
                    Date of Issue
                  </TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>
                    Reason for Pass
                  </TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>
                    Arrival Time
                  </TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {tableData
                  .filter((slip) => slip.is_done === 1)
                  .map((slip) => (
                    <TableRow key={slip.id}>
                      <TableCell>{slip.employee_name}</TableCell>
                      <TableCell>
                        {new Date(slip.date_of_issue).toLocaleDateString()}
                      </TableCell>
                      <TableCell>{slip.reason_for_pass}</TableCell>
                      <TableCell>{slip.actual_time_arrival || "N/A"}</TableCell>
                      <TableCell>
                        <Chip
                          label={slip.is_done === 1 ? "Done" : slip.status}
                          color={
                            slip.is_done === 1
                              ? "success"
                              : slip.status === "approved"
                              ? "primary"
                              : slip.status === "pending"
                              ? "warning"
                              : "error"
                          }
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </TableContainer>

          {tableData.filter((slip) => slip.is_done === 1).length === 0 && (
            <Typography
              variant="body2"
              color="textSecondary"
              sx={{ textAlign: "center", py: 2 }}
            >
              No completed pass slips found
            </Typography>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setDoneModalOpen(false)} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>
      {/* Archive Pass Slips */}
      <Dialog
        open={archiveModalOpen}
        onClose={() => setArchiveModalOpen(false)}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          📁 Archived Pass Slips
          <IconButton
            aria-label="close"
            onClick={() => setArchiveModalOpen(false)}
            size="small"
            sx={{ color: (theme) => theme.palette.grey[500] }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers>
          <TextField
            fullWidth
            size="small"
            label="Search by employee name"
            variant="outlined"
            sx={{ mb: 2 }}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1); // Reset to first page on search
            }}
          />

          {paginatedData.length > 0 ? (
            paginatedData.map((item, index) => (
              <Card key={index} variant="outlined" sx={{ mb: 2 }}>
                <CardContent>
                  <Grid container spacing={1}>
                    <Grid item xs={12} sm={6}>
                      <Typography
                        variant="subtitle1"
                        fontWeight="bold"
                        color="primary"
                      >
                        <Box
                          component="span"
                          sx={{ verticalAlign: "middle", mr: 0.5 }}
                        >
                          <Person sx={{ fontSize: 18 }} />
                        </Box>
                        {item.employee_name}
                      </Typography>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="textSecondary">
                        <Box
                          component="span"
                          sx={{ verticalAlign: "middle", mr: 0.5 }}
                        >
                          <AccessTime sx={{ fontSize: 18 }} />
                        </Box>
                        Date Issued: {item.date_of_issue}
                      </Typography>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2">
                        <Box
                          component="span"
                          sx={{ verticalAlign: "middle", mr: 0.5 }}
                        >
                          <Info sx={{ fontSize: 18 }} />
                        </Box>
                        Reason: {item.reason_for_pass}
                      </Typography>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <Box display="flex" alignItems="center">
                        <Typography variant="body2" component="span" mr={1}>
                          Status:
                        </Typography>
                        <Chip
                          label={item.status.toUpperCase()}
                          color="info"
                          size="small"
                        />
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            ))
          ) : (
            <Typography
              variant="body2"
              color="textSecondary"
              sx={{ textAlign: "center", py: 4 }}
            >
              No archived pass slips found.
            </Typography>
          )}

          {totalPages > 1 && (
            <Box display="flex" justifyContent="center" mt={2}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={(e, val) => setPage(val)}
                color="primary"
              />
            </Box>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setArchiveModalOpen(false)} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PassSlipInterface;

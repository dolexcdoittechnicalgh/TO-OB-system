import React, { useEffect, useState } from "react";

import {
  TextField,
  Button,
  Typography,
  Grid,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Autocomplete,
} from "@mui/material";
import SignatureCanvas from "react-signature-canvas";
import { StoreOfficialBusiness } from "../api"; // Adjust the import path accordingly
import dayjs from "dayjs";
import Swal from "sweetalert2";

const OfficialBusinessForm = ({
  formData,
  handleChange,
  addEmployee,
  removeEmployee,
  sigCanvasRefOB,
  clearSignatureCanvasOB,
  handleSubmit,
  setFormData,
  employeeData, // Receive employee data as prop
}) => {
  const formatTo12HourTime = (timeString) => {
    if (!timeString) return "N/A";
    const date = new Date(timeString);
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const businessDate = formData.officialBusiness?.dateOfBusiness || "";

  const minDateTime = businessDate ? `${businessDate}T08:00` : "";
  const maxDateTime = businessDate ? `${businessDate}T17:00` : "";

  const handleSubmitOB = async (e) => {
    e.preventDefault();

    const ob = formData.officialBusiness;

    const payload = {
      office: "DOLE-X",
      division: "CDO-FO",
      date_of_business: ob.dateOfBusiness,
      travel_from: "DOLE-X",
      travel_to: ob.itineraryTo,
      departure_date: ob.departureDate,
      expected_return: ob.expectedReturn,
      purpose: ob.purpose,
      employees: ob.employees.map((emp) => ({
        id: emp.id,
        name: emp.name,
        position: emp.position,
        signature: emp.signature,
      })),
    };

    if (!payload.date_of_business || !payload.purpose) {
      Swal.fire(
        "Missing Fields",
        "Please fill in Date of Business and Purpose.",
        "warning"
      );
      return;
    }

    const formattedHTML = `
    <div style="text-align: left;">
      <p><strong>Office:</strong> ${payload.office}</p>
      <p><strong>Division:</strong> ${payload.division}</p>
      <p><strong>Date of Business:</strong> ${payload.date_of_business}</p>
      <p><strong>Destination:</strong> ${payload.travel_to}</p>
      <p><strong>Departure Date:</strong> ${formatTo12HourTime(
        payload.departure_date
      )}</p>
      <p><strong>Expected Return:</strong> ${formatTo12HourTime(
        payload.expected_return
      )}</p>
      <p><strong>Purpose:</strong> ${payload.purpose}</p>
      <p><strong>Employees:</strong> ${
        payload.employees.length > 0
          ? payload.employees
              .map((emp) => `${emp.name} (${emp.position})`)
              .join(", ")
          : "None"
      }</p>
    </div>
  `;

    const { isConfirmed } = await Swal.fire({
      title: "Confirm Official Business",
      html: formattedHTML,
      icon: "info",
      showCancelButton: true,
      confirmButtonText: "Submit",
      cancelButtonText: "Cancel",
      width: "50%",
    });

    if (!isConfirmed) return;

    try {
      const response = await StoreOfficialBusiness(payload);
      console.log("Submitted successfully:", response);

      Swal.fire(
        "Success",
        "Official business submitted successfully!",
        "success"
      );

      // Reset only officialBusiness part
      setFormData((prev) => ({
        ...prev,
        officialBusiness: {
          employees: [
            {
              name: "",
              position: "",
              firstName: "",
              lastName: "",
              signature: "",
            },
          ],
          office: "DOLE-X",
          division: "CDO-FO",

          travelFrom: "DOLE-X",
          travelTo: "",
          departureDate: "",
          expectedReturn: "",
          purpose: "",
          dateOfBusiness: "", // ✅ Add this line to fix the error
        },
      }));
    } catch (error) {
      console.error("Error submitting official business:", error);
      Swal.fire(
        "Error",
        "An error occurred while submitting the official business.",
        "error"
      );
    }
  };

  useEffect(() => {
    const now = new Date();
    const phTime = new Date(
      now.toLocaleString("en-US", { timeZone: "Asia/Manila" })
    );

    const dateStr = phTime.toISOString().split("T")[0]; // YYYY-MM-DD
    const timeStr = phTime.toTimeString().split(" ")[0].slice(0, 5); // HH:mm

    const defaultDateTime = `${dateStr}T${timeStr}`;

    setFormData((prev) => ({
      ...prev,
      officialBusiness: {
        ...prev.officialBusiness,
        departureDate: defaultDateTime,
        expectedReturn: defaultDateTime,
      },
    }));
  }, [setFormData]);

  const handleTimeChange = (e) => {
    const { name, value } = e.target; // value = "YYYY-MM-DDTHH:MM"
    const [date, time] = value.split("T");
    let [hour, minute] = time.split(":").map(Number);

    console.log(`Original selected time: ${value}`);

    // Auto-convert early morning hours (00 to 07) to PM
    if (hour >= 0 && hour < 8) {
      const newHour = hour + 12;
      console.log(`Auto-converting ${hour}:00 to ${newHour}:00 PM`);
      hour = newHour;
    }

    // Clamp to 17:00 (5 PM) if it goes past
    if (hour > 17 || (hour === 17 && minute > 0)) {
      console.log("Selected time is after 05:00 PM. Clamping to 17:00.");
      hour = 17;
      minute = 0;
    }

    const correctedTime = `${hour.toString().padStart(2, "0")}:${minute
      .toString()
      .padStart(2, "0")}`;
    const correctedDateTime = `${date}T${correctedTime}`;

    // Set AM/PM flag
    let meridiem = "";
    if (hour >= 8 && hour <= 11) {
      meridiem = "AM";
    } else if (hour >= 12 && hour <= 17) {
      meridiem = "PM";
    }

    console.log(`Meridiem: ${meridiem}`);

    setFormData((prev) => ({
      ...prev,
      officialBusiness: {
        ...prev.officialBusiness,
        [name]: correctedDateTime,
      },
      timeMeridiem: meridiem, // Optional, use this in UI to disable
    }));
  };

  // 1. Initialize on component mount
  useEffect(() => {
    const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
    const defaultDepartureTime = "T08:00";
    const defaultReturnTime = "T17:00";

    setFormData((prev) => ({
      ...prev,
      officialBusiness: {
        ...prev.officialBusiness,
        dateOfBusiness: today,
        departureDate: `${today}${defaultDepartureTime}`,
        expectedReturn: `${today}${defaultReturnTime}`,
      },
    }));
  }, []);

  // 2. Reactively update time fields when dateOfBusiness changes
  useEffect(() => {
    const businessDate = formData.officialBusiness?.dateOfBusiness || "";

    if (businessDate) {
      const defaultDepartureTime = "T08:00";
      const defaultReturnTime = "T17:00";

      setFormData((prev) => ({
        ...prev,
        officialBusiness: {
          ...prev.officialBusiness,
          departureDate: `${businessDate}${defaultDepartureTime}`,
          expectedReturn: `${businessDate}${defaultReturnTime}`,
        },
      }));
    }
  }, [formData.officialBusiness.dateOfBusiness]);

  const today = dayjs().format("YYYY-MM-DD");
  return (
    <form onSubmit={handleSubmit}>
      {/* Employee(s) Information */}
      <Typography
        variant="h6"
        className="section-title"
        sx={{ mt: 1, mb: { xs: 1, sm: 0 } }}
      >
        Employee(s) Information
      </Typography>

      <Grid container spacing={2}>
        {formData.officialBusiness.employees.map((employee, index) => (
          <Grid
            item
            xs={12}
            sm={formData.officialBusiness.employees.length > 5 ? 6 : 12}
            key={index}
          >
            <Box display="flex" alignItems="center" gap={1}>
              <Autocomplete
                freeSolo
                options={employeeData
                  .filter((emp) => {
                    // Filter out already selected employees (exclude current index)
                    return !formData.officialBusiness.employees.some(
                      (e, idx) => e.name === emp.name && idx !== index
                    );
                  })
                  .map((emp) => emp.name)} // Show employee names only
                value={employee.name}
                sx={{ flex: 1, minWidth: "250px", maxWidth: "350px" }}
                onChange={(e, value) => {
                  if (!value) {
                    // If cleared, reset the fields
                    setFormData((prev) => ({
                      ...prev,
                      officialBusiness: {
                        ...prev.officialBusiness,
                        employees: prev.officialBusiness.employees.map(
                          (emp, idx) =>
                            idx === index
                              ? {
                                  id: null,
                                  name: "",
                                  position: "",
                                  signature: "",
                                }
                              : emp
                        ),
                      },
                    }));
                    return;
                  }

                  // Find full employee data
                  const selectedEmployee = employeeData.find(
                    (emp) => emp.name === value
                  );

                  if (selectedEmployee) {
                    setFormData((prev) => ({
                      ...prev,
                      officialBusiness: {
                        ...prev.officialBusiness,
                        employees: prev.officialBusiness.employees.map(
                          (emp, idx) =>
                            idx === index
                              ? {
                                  id: selectedEmployee.id, // ✅ this is required
                                  name: selectedEmployee.name,
                                  position: selectedEmployee.position,
                                  signature: selectedEmployee.signature,
                                }
                              : emp
                        ),
                      },
                    }));
                  }
                }}
                onInputChange={(e, value) => {
                  handleChange(
                    { target: { name: "name", value: value || "" } },
                    "officialBusinessEmployees",
                    index
                  );
                }}
                renderInput={(params) => (
                  <TextField {...params} label="Name" required fullWidth />
                )}
              />

              <Button
                variant="contained"
                color="error"
                onClick={() => removeEmployee(index, "officialBusiness")}
                sx={{ whiteSpace: "nowrap" }}
              >
                Remove
              </Button>
            </Box>
          </Grid>
        ))}
      </Grid>

      {/* Position placed alone */}
      <Box
        sx={{
          mt: 2,
          p: 1.5,
          border: "1px solid #ccc",
          borderRadius: "4px",
          minHeight: "56px",
          backgroundColor: "#fafafa", // optional subtle background for a nicer outlined look
        }}
      >
        <Typography variant="body1" sx={{ fontStyle: "italic", color: "#888" }}>
          {formData.officialBusiness.employees.length > 0
            ? formData.officialBusiness.employees
                .map(
                  (emp) =>
                    `${emp.name} ${emp.position || "Position not available"}`
                )
                .join(", ")
            : "Position(s) will appear here automatically"}
        </Typography>
      </Box>

      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        marginTop={2}
      >
        <Button
          onClick={() => addEmployee("officialBusiness")}
          variant="contained"
          sx={{
            backgroundColor: "#1554D2",
            color: "white",
            marginTop: 10,
            width: { xs: "90%", sm: "30%" },
            display: "block",
            margin: "10px auto",
          }}
        >
          Add Employee
        </Button>
      </Box>

      <Typography variant="h6" className="section-title" sx={{ mt: 1 }}>
        Office and Date of Business
      </Typography>

      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          type="date"
          name="dateOfBusiness"
          value={formData.officialBusiness.dateOfBusiness}
          onChange={(e) => handleChange(e, "officialBusiness")}
          required
          inputProps={{
            min: today, // disables past dates
          }}
        />
      </Grid>

      <Typography variant="h6" className="section-title" sx={{ mt: 1 }}>
        Itinerary/Destination
      </Typography>
      <Grid container spacing={0.5} sx={{ mt: 2 }}>
        {/* From: static DOLE‑X */}
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="From"
            name="travelFrom"
            value="DOLE-X"
            disabled
            InputProps={{
              readOnly: true,
              sx: { color: "black" },
            }}
            InputLabelProps={{
              sx: { color: "black" },
            }}
            sx={{
              "& .Mui-disabled": {
                WebkitTextFillColor: "black",
              },
            }}
            required
          />
        </Grid>

        {/* To: bound to formData.officialBusiness.travelTo */}
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="To"
            name="itineraryTo" // Updated to match the key in the payload
            value={formData.officialBusiness.itineraryTo} // Match the key in the state
            onChange={(e) => handleChange(e, "officialBusiness")}
            required
          />
        </Grid>
      </Grid>

      <Typography variant="h6" className="section-title" sx={{ mt: 1 }}>
        Departure and Return
      </Typography>
      <Grid container spacing={0.5}>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            type="datetime-local"
            name="departureDate"
            value={formData.officialBusiness.departureDate}
            onChange={handleTimeChange}
            inputProps={{
              min: minDateTime,
              max: maxDateTime,
            }}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            type="datetime-local"
            name="expectedReturn"
            value={formData.officialBusiness.expectedReturn}
            onChange={handleTimeChange}
            inputProps={{
              min: minDateTime,
              max: maxDateTime,
            }}
            disabled={!businessDate}
          />
        </Grid>
      </Grid>

      <Typography variant="h6" className="section-title" sx={{ mt: 1 }}>
        Purpose
      </Typography>
      <TextField
        fullWidth
        multiline
        rows={3}
        name="purpose"
        value={formData.officialBusiness.purpose}
        onChange={(e) => handleChange(e, "officialBusiness")}
      />
      {/* <Typography variant="h6" className="section-title" sx={{ mt: 2 }}>
        E-Signature
      </Typography>
      <Box
        sx={{
          mt: 1,
          display: "flex",
          flexWrap: "wrap",
          gap: 2,
          border: "1px solid #d3d3d3",
          borderRadius: "8px",
          padding: 2,
          justifyContent: "center",
        }}
      >
        {formData.officialBusiness.employees.map((employee, index) =>
          employee.signature ? (
            <Box key={index} textAlign="center">
              <Typography variant="subtitle2">{employee.name}</Typography>
              <img
                src={employee.signature}
                alt="Signature"
                width={100}
                height={90}
                style={{ borderRadius: "3px" }}
              />
            </Box>
          ) : (
            <Typography key={index} color="textSecondary">
              No signature available for {employee.name || "employee"}
            </Typography>
          )
        )}
      </Box> */}

      <Button
        type="submit"
        variant="contained"
        sx={{
          backgroundColor: "#1554D2",
          color: "white",
          marginTop: 10,
          width: { xs: "90%", sm: "30%" },
          display: "block",
          margin: "10px auto",
        }}
        className="submit-button"
        onClick={handleSubmitOB} // Attach handleSubmitOB to the button click
      >
        Submit
      </Button>
    </form>
  );
};

export default OfficialBusinessForm;

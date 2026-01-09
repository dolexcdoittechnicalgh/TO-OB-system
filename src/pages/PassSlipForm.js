import React, { useState, useRef } from "react";
import {
  TextField,
  Button,
  Typography,
  Grid,
  Box,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import SignatureCanvas from "react-signature-canvas";
import Swal from "sweetalert2";
import { storePassSlip } from "../api"; // adjust path as needed

const PassSlipForm = ({ employeeData }) => {
  const [formData, setFormData] = useState({
    employee_id: "",
    startDate: "",
    endDate: "",
    placeToVisit: "",
    reason: "",
  });

  const sigCanvasRef = useRef(null);

  const clearSignature = () => {
    if (sigCanvasRef.current) {
      sigCanvasRef.current.clear();
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const formatTimeToDate = (timeString) => {
    if (!timeString) return null;
    const [hours, minutes] = timeString.split(":");
    const date = new Date();
    date.setUTCHours(hours, minutes, 0, 0);
    return date.toISOString().slice(0, 19).replace("T", " ");
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    let signatureData = null;
    if (sigCanvasRef.current && !sigCanvasRef.current.isEmpty()) {
      signatureData = sigCanvasRef.current.toDataURL();
    }

    if (!signatureData) {
      signatureData = null;
    }

    if (!formData.employee_id) {
      Swal.fire({
        title: "Error!",
        text: "Please select an employee first.",
        icon: "error",
        confirmButtonColor: "#D33",
      });
      return;
    }

    const formattedStartDate = formatTimeToDate(formData.startDate);
    const formattedEndDate = formatTimeToDate(formData.endDate);

    if (!formattedStartDate || !formattedEndDate) {
      Swal.fire({
        title: "Error!",
        text: "Please provide valid start and end times.",
        icon: "error",
        confirmButtonColor: "#D33",
      });
      return;
    }

    const formDataToSubmit = {
      employee_id: formData.employee_id,
      signature: signatureData,
      time_start: formattedStartDate,
      time_end: formattedEndDate,
      place_to_visit: formData.placeToVisit,
      reason: formData.reason,
      actual_time_departure: null,
      actual_time_arrival: null,
    };

    Swal.fire({
      title: "Are you sure?",
      text: "Please confirm that all information is correct.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#1554D2",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, submit it!",
      cancelButtonText: "No, cancel!",
    }).then((result) => {
      if (result.isConfirmed) {
        storePassSlip(formDataToSubmit)
          .then(() => {
            Swal.fire({
              title: "Submitted!",
              text: "Your pass slip has been successfully submitted.",
              icon: "success",
              confirmButtonColor: "#1554D2",
            }).then(() => {
              // Clear the form after successful submission
              setFormData({
                employee_id: "",
                startDate: "",
                endDate: "",
                placeToVisit: "",
                reason: "",
              });
              clearSignature();
            });
          })
          .catch(() => {
            Swal.fire({
              title: "Error!",
              text: "There was an error submitting your pass slip.",
              icon: "error",
              confirmButtonColor: "#D33",
            });
          });
      }
    });
  };

  const handleTimeChange = (e) => {
    const { name, value } = e.target;

    let startTime = formData.startDate;
    let endTime = formData.endDate;

    if (name === "startDate") {
      // Clamp start time between 08:00 and 17:00
      if (value < "08:00") {
        startTime = "08:00";
      } else if (value > "17:00") {
        startTime = "17:00";
      } else {
        startTime = value;
      }

      // Calculate end time as 2 hours after start time
      const [hours, minutes] = startTime.split(":").map(Number);
      let endHour = hours + 2;
      if (endHour > 17) endHour = 17; // Cap at 17:00

      endTime = `${endHour.toString().padStart(2, "0")}:${minutes
        .toString()
        .padStart(2, "0")}`;
    }

    // Log the selected times for debugging
    console.log("Selected start time:", startTime);
    console.log("Calculated end time:", endTime);

    // Use handleChange to propagate updates to parent
    handleChange({
      target: {
        name: "startDate",
        value: startTime,
      },
    });

    handleChange({
      target: {
        name: "endDate",
        value: endTime,
      },
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <Typography variant="h6" className="section-title" sx={{ mt: 1 }}>
        Employee Information
      </Typography>
      <Grid container spacing={0.5}>
        <Grid item xs={12}>
          <FormControl fullWidth required>
            <InputLabel id="pass-slip-name-label">Name</InputLabel>
            <Select
              labelId="pass-slip-name-label"
              id="pass-slip-name"
              name="employee_id" // Use employee_id as the name here
              value={formData.employee_id} // Bind to employee_id, not name
              onChange={(e) => handleChange(e, "passSlip", 0)}
              label="Name"
              sx={{ width: "100%" }}
            >
              {employeeData &&
                employeeData.map((employee) => (
                  <MenuItem key={employee.id} value={employee.id}>
                    {" "}
                    {/* Use employee.id as value */}
                    {employee.name}
                  </MenuItem>
                ))}
            </Select>
          </FormControl>
        </Grid>
      </Grid>

      <Grid container spacing={0.5}>
        <Grid item xs={12}>
          <Typography variant="h6" className="section-title" sx={{ mt: 1 }}>
            Date
          </Typography>
          <TextField
            fullWidth
            name="date"
            type="date"
            value={formData.date}
            onChange={handleChange}
            required
          />
        </Grid>
      </Grid>

      <Grid container spacing={0.5} alignItems="center">
        <Grid item xs={12}>
          <Typography variant="h6" className="section-title" sx={{ mt: 1 }}>
            Time
          </Typography>
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            name="startDate"
            type="time"
            value={formData.startDate}
            onChange={handleTimeChange}
            required
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            name="endDate"
            type="time"
            value={formData.endDate}
            onChange={handleTimeChange}
            required
            InputProps={{ readOnly: true }} // make end time not editable manually
          />
        </Grid>
      </Grid>

      <Grid container spacing={0.5}>
        <Grid item xs={12}>
          <Typography variant="h6" className="section-title" sx={{ mt: 1 }}>
            Place to Visit
          </Typography>
          <TextField
            fullWidth
            name="placeToVisit"
            value={formData.placeToVisit}
            onChange={handleChange}
            required
          />
        </Grid>
      </Grid>

      <Grid container spacing={0.5}>
        <Grid item xs={12}>
          <Typography variant="h6" className="section-title" sx={{ mt: 1 }}>
            Reason
          </Typography>
          <TextField
            fullWidth
            name="reason"
            multiline
            rows={3}
            value={formData.reason}
            onChange={handleChange}
            required
          />
        </Grid>
      </Grid>

      {/* <Typography variant="h6" className="section-title" sx={{ mt: 2 }}>
        E-Signature
      </Typography>
      <Paper elevation={2} sx={{ padding: 1, borderRadius: "8px" }}>
        <SignatureCanvas
          ref={sigCanvasRef}
          penColor="black"
          canvasProps={{
            width: 500,
            height: 150,
            className: "sigCanvas",
            style: { border: "1px solid #d3d3d3", borderRadius: "8px" },
          }}
        />
      </Paper>
      <Box mt={1} display="flex" justifyContent="flex-end">
        <Button
          size="small"
          onClick={clearSignature}
          variant="outlined"
          color="secondary"
        >
          Clear Signature
        </Button>
      </Box> */}

      <Box display="flex" justifyContent="center" marginTop={2}>
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
        >
          Submit
        </Button>
      </Box>
    </form>
  );
};

export default PassSlipForm;

import React from "react";
import {
  TextField,
  Button,
  Typography,
  Grid,
  Box,
  FormGroup,
  Checkbox,
  RadioGroup,
  FormControlLabel,
  Radio,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Autocomplete,
} from "@mui/material";
import Swal from "sweetalert2";

const TravelOrderForm = ({
  formData,
  handleChange,
  addEmployee,
  removeEmployee,
  handleTravelByChange,
  setFormData,
  handleSubmit,
  handleCreateTravelOrder,
  employeeData, // Receive employee data as prop
}) => {
  return (
    <form onSubmit={handleCreateTravelOrder}>
      <Typography variant="h6" className="section-title" sx={{ mt: 1 }}>
        Requester Information
      </Typography>
      <Grid container spacing={1}>
        {/* Name field */}
        <Grid item xs={12} sm={6}>
          <Autocomplete
            freeSolo
            options={employeeData.map((emp) => emp.name)} // List of employee names
            value={formData.requester.name || ""} // Prevent uncontrolled error
            onChange={(e, value) => {
              // Handle name change
              handleChange({ target: { name: "name", value } }, "requester");

              // If name is cleared, clear the fields
              if (!value) {
                setFormData((prev) => ({
                  ...prev,
                  requester: {
                    ...prev.requester,
                    name: "",
                    position: "",
                    id: null,
                  },
                }));
                console.log("Employee selection cleared.");
                return;
              }

              // Find the selected employee by name
              const selectedEmployee = employeeData.find(
                (emp) => emp.name === value
              );

              if (selectedEmployee) {
                setFormData((prev) => ({
                  ...prev,
                  requester: {
                    ...prev.requester,
                    id: selectedEmployee.id,
                    name: value,
                    position: selectedEmployee.position,
                  },
                }));
              } else {
                console.log("No matching employee found for:", value);
              }
            }}
            onInputChange={(e, value) =>
              handleChange({ target: { name: "name", value } }, "requester")
            }
            renderInput={(params) => (
              <TextField {...params} label="Name" required fullWidth />
            )}
          />
        </Grid>

        {/* Position field (read-only) */}
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Position"
            value={formData.requester.position}
            InputProps={{
              readOnly: true,
            }}
            InputLabelProps={{
              shrink: Boolean(formData.requester.position),
            }}
          />
        </Grid>

        {/* Re and Date fields in same row with top margin */}
        <Grid item xs={12} sm={6} sx={{ mt: 3 }}>
          <TextField
            fullWidth
            label="Re"
            value="REQUEST FOR AUTHORITY TO TRAVEL"
            disabled
            InputLabelProps={{
              shrink: true,
            }}
          />
        </Grid>

        <Grid item xs={12} sm={6} sx={{ mt: 3 }}>
          <TextField
            fullWidth
            label="Date"
            name="date"
            type="date"
            value={formData.date}
            onChange={async (e) => {
              const newDate = e.target.value;
              console.log("New Date selected: ", newDate); // Logs the new selected date

              // Show SweetAlert2 notice before proceeding with date change
              const result = await Swal.fire({
                title: "This date is not recommended to be changed.",
                text: "Are you sure you want to change it?",
                icon: "warning",
                showCancelButton: true,
                confirmButtonText: "Yes, change it",
                cancelButtonText: "Cancel",
              });

              if (result.isConfirmed) {
                // Even if the date is the same, force an update
                if (newDate !== formData.date) {
                  console.log(
                    "Updating date from",
                    formData.date,
                    "to",
                    newDate
                  );
                  setFormData((prev) => ({ ...prev, date: newDate }));
                } else {
                  console.log("Date is the same, still updating state...");
                  setFormData((prev) => ({ ...prev, date: newDate }));
                }
              }
            }}
            InputLabelProps={{ shrink: true }}
            required
          />
        </Grid>
      </Grid>

      <Box
        display="flex"
        justifyContent={{ xs: "flex-start", sm: "space-between" }}
        sx={{ flexDirection: { xs: "column", sm: "row" } }}
      >
        <Typography
          variant="h6"
          className="section-title"
          sx={{ mt: 1, mb: { xs: 1, sm: 0 } }}
        >
          Employee(s) Information
        </Typography>
      </Box>

      <Grid container spacing={1}>
        {formData.employees.map((employee, index) => {
          const availableEmployeeNames = employeeData
            .map((emp) => emp.name)
            .filter(
              (name) =>
                name !== formData.requester.name &&
                !formData.employees
                  .filter((emp, i) => i !== index)
                  .some((emp) => emp.name === name)
            );

          return (
            <Grid
              item
              xs={12}
              sm={formData.employees.length >= 5 ? 6 : 12}
              key={index}
            >
              <Box display="flex" alignItems="center" gap={2}>
                {/* Employee Name Column */}
                <FormControl fullWidth required>
                  <Autocomplete
                    freeSolo
                    options={availableEmployeeNames}
                    value={employee.name}
                    onChange={(e, value) => {
                      const selectedEmployee = employeeData.find(
                        (emp) => emp.name === value
                      );

                      handleChange(
                        { target: { name: "name", value } },
                        "employees",
                        index
                      );

                      if (selectedEmployee) {
                        handleChange(
                          {
                            target: {
                              name: "position",
                              value: selectedEmployee.position,
                            },
                          },
                          "employees",
                          index
                        );

                        // ✅ Save employee ID to formData and log
                        handleChange(
                          {
                            target: { name: "id", value: selectedEmployee.id },
                          },
                          "employees",
                          index
                        );
                      }
                    }}
                    onInputChange={(e, value) => {
                      handleChange(
                        { target: { name: "name", value } },
                        "employees",
                        index
                      );

                      const selectedEmployee = employeeData.find(
                        (emp) => emp.name === value
                      );

                      if (selectedEmployee) {
                        handleChange(
                          {
                            target: {
                              name: "position",
                              value: selectedEmployee.position,
                            },
                          },
                          "employees",
                          index
                        );

                        // ✅ Log employee ID as user types
                      }
                    }}
                    renderInput={(params) => (
                      <TextField {...params} label="Employee Name" required />
                    )}
                  />
                </FormControl>

                {/* Employee Position Column */}
                <FormControl fullWidth required>
                  <TextField
                    value={employee.position}
                    onChange={(e) =>
                      handleChange(
                        { target: { name: "position", value: e.target.value } },
                        "employees",
                        index
                      )
                    }
                    label="Position"
                    required
                  />
                </FormControl>

                {/* Remove Button */}
                <Button
                  onClick={() => removeEmployee(index, "travel")}
                  variant="contained"
                  color="error"
                  sx={{
                    minWidth: 0,
                    px: 2,
                    py: 1,
                    fontSize: "0.75rem", // Smaller text size
                  }}
                >
                  Remove
                </Button>
              </Box>
            </Grid>
          );
        })}
      </Grid>

      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        marginTop={2}
      >
        <Button
          onClick={() => addEmployee("travel")}
          variant="contained"
          sx={{
            backgroundColor: "#1554D2",
            color: "white",
            marginTop: 10,
            width: { xs: "90%", sm: "30%" },
            maxWidth: "200px",
            display: "block",
            margin: "10px auto",
          }}
        >
          Add Employee
        </Button>
      </Box>

      <Typography variant="h6" className="section-title" sx={{ mt: 1 }}>
        Travel Duration
      </Typography>
      <Grid container spacing={0.5}>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            type="datetime-local"
            name="travelFrom"
            value={formData.travelFrom}
            onChange={handleChange}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            type="datetime-local"
            name="travelTo"
            value={formData.travelTo}
            onChange={handleChange}
          />
        </Grid>
      </Grid>

      <Typography variant="h6" className="section-title" sx={{ mt: 1 }}>
        Travel By
      </Typography>
      <FormGroup row>
        <FormControlLabel
          control={
            <Checkbox
              checked={formData.travelBy.Land}
              onChange={handleTravelByChange}
              name="Land"
            />
          }
          label="Land"
        />
        <FormControlLabel
          control={
            <Checkbox
              checked={formData.travelBy.Water}
              onChange={handleTravelByChange}
              name="Water"
            />
          }
          label="Water"
        />
        <FormControlLabel
          control={
            <Checkbox
              checked={formData.travelBy.Air}
              onChange={handleTravelByChange}
              name="Air"
            />
          }
          label="Air"
        />
      </FormGroup>

      <Typography variant="h6" className="section-title" sx={{ mt: 1 }}>
        Destination
      </Typography>
      <TextField
        fullWidth
        multiline
        rows={1}
        name="destination"
        value={formData.destination}
        onChange={handleChange}
      />
      <Typography variant="h6" className="section-title" sx={{ mt: 1 }}>
        Purpose
      </Typography>
      <TextField
        fullWidth
        multiline
        rows={3}
        name="purpose"
        value={formData.purpose}
        onChange={handleChange}
      />

      <Typography variant="h6" className="section-title" sx={{ mt: 1 }}>
        Previous Travel Record
      </Typography>
      <RadioGroup
        row
        name="previousTravel"
        value={formData.previousTravel}
        onChange={handleChange}
      >
        <FormControlLabel value="Yes" control={<Radio />} label="Yes" />
        <FormControlLabel value="No" control={<Radio />} label="No" />
      </RadioGroup>

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
    </form>
  );
};

export default TravelOrderForm;

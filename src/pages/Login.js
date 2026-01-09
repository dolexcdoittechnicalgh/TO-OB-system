import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Login.css";
import {
  TextField,
  Button,
  Typography,
  Container,
  Box,
  InputAdornment,
} from "@mui/material"; // Import MUI components
import loginBg from "../assets/login-bg.webp";
import logo from "../assets/dole-logo.png";
import { loginUser } from "../auth"; // Import the login function
import { useAppContext } from "../contexts/ContextProvider"; // Import useAppContext hook
import { toast } from "react-toastify"; // Import toast from react-toastify
import "react-toastify/dist/ReactToastify.css"; // Import toast styles
import CircularProgress from "@mui/material/CircularProgress";

import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import { Visibility, VisibilityOff } from "@mui/icons-material";

// State variables for username and password inputs
function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate(); // Initialize navigate
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  // Get the login function from context
  const { login } = useAppContext();
  const notify = () => toast.success("Login successful!");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsLoggingIn(true); // start loading

    try {
      const response = await loginUser(username, password);

      if (response && response.token) {
        login(response.user, response.token);
        toast.success("Login successful!"); // This is okay since it's on success

        if (response.user.user_role === "guard") {
          navigate("/PassSlipInterface");
        } else {
          navigate("/approving-home");
        }
      }
      // No need for else block — loginUser already handles failure toasts
    } catch (error) {
      console.error("Login failed:", error);
      // No alert or toast here either
    } finally {
      setIsLoggingIn(false); // stop loading
    }
  };

  return (
    <div
      className="login-container"
      style={{ backgroundImage: `url(${loginBg})` }}
    >
      <Container
        className="login-form"
        style={{ position: "relative" }} // make container the relative parent
      >
        <IconButton
          aria-label="close"
          onClick={() => navigate("../")}
          style={{
            position: "absolute",
            top: 10,
            right: 10,
            color: "#fff",
            zIndex: 10,
          }}
        >
          <CloseIcon />
        </IconButton>
        <img src={logo} alt="Logo" className="login-logo" />
        <Typography variant="h5" className="login-title">
          Welcome to
        </Typography>
        <Typography variant="h5" className="login-bold-text">
          Travel Order and Official Business
        </Typography>
        <Typography variant="h5" className="login-subtitle">
          (TO/OB) System
        </Typography>

        <Box component="form" onSubmit={handleSubmit} noValidate>
          <TextField //username field
            fullWidth
            margin="dense"
            label="Username"
            variant="outlined"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter your username"
            required
            className="text-field"
            InputLabelProps={{ required: false, style: { color: "#ffffff" } }}
            InputProps={{ style: { color: "#ffffff" } }}
            sx={{
              "& .MuiOutlinedInput-root": {
                "& fieldset": { borderColor: "#ffffff" },
                "&:hover fieldset": { borderColor: "#ffffff" },
              },
            }}
          />
          <TextField
            fullWidth
            margin="dense"
            label="Password"
            type={showPassword ? "text" : "password"}
            variant="outlined"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            required
            className="text-field"
            InputLabelProps={{ required: false, style: { color: "#ffffff" } }}
            InputProps={{
              style: { color: "#ffffff" },
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="toggle password visibility"
                    onClick={() => setShowPassword((prev) => !prev)}
                    edge="end"
                    sx={{ color: "#ffffff" }}
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{
              "& .MuiOutlinedInput-root": {
                "& fieldset": { borderColor: "#ffffff" },
                "&:hover fieldset": { borderColor: "#ffffff" },
              },
            }}
          />
          <Box
            sx={{ display: "flex", justifyContent: "center", width: "100%" }}
          >
            <Button
              type="submit"
              variant="contained"
              disabled={isLoggingIn}
              sx={{
                marginTop: "30px",
                backgroundColor: "#1E1E1E",
                height: "40px",
                fontSize: "20px",
                fontWeight: "normal",
                width: "150px",
                textTransform: "uppercase",
                "&:disabled": {
                  backgroundColor: "#888", // dimmed when disabled
                },
              }}
              startIcon={
                isLoggingIn && <CircularProgress size={20} color="inherit" />
              }
            >
              {isLoggingIn ? "" : "Login"}
            </Button>
          </Box>
        </Box>
      </Container>
    </div>
  );
}

export default Login;

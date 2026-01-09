import React from "react";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import socotecLogo from "../assets/socotec logo.png";
import bagongPilipinasLogo from "../assets/bagong pilipinas logo.png";
import itdoleLogo from "../assets/IT-DOLEFO logo.png";
import { FaFacebook, FaInstagram, FaTiktok } from "react-icons/fa";
import "./calendar.css";

// Header Component
export function CalendarHeader() {
  return (
    <AppBar className="app-bar">
      <Toolbar className="toolbar">
        <Box className="logo-box">
          <img src="https://dolexportal.com/img/dole.png" alt="DOLE" />
        </Box>
        <Box className="text-box">
          <Typography variant="body1" className="light">
            Republic of the Philippines
          </Typography>
          <Typography variant="body1" className="bold">
            DEPARTMENT OF LABOR AND EMPLOYMENT
          </Typography>
          <Typography variant="body1" className="medium">
            Regional Office No. X
          </Typography>
          <Typography variant="body1" className="bold">
            Cagayan De Oro - Field Office
          </Typography>
        </Box>
      </Toolbar>
    </AppBar>
  );
}

// Footer Component
export function CalendarFooter() {
  return (
    <footer
      className="calendar-footer"
      style={{
        position: "fixed",
        left: 0,
        bottom: 0,
        width: "100%",
        textAlign: "center",
      }}
    >
      <div className="footer-left">
        <img src={socotecLogo} alt="SOCOTEC" className="footer-logo" />
        <img
          src={bagongPilipinasLogo}
          alt="Bagong Pilipinas"
          className="footer-logo"
        />
        <img src={itdoleLogo} alt="IT-DOLEFO" className="footer-logo" />
      </div>
      <div className="footer-right">
        <p className="footer-text">Find us here</p>
        <div className="footer-icons">
          <a
            href="https://www.facebook.com/dolexcdofo"
            target="_blank"
            rel="noopener noreferrer"
          >
            <FaFacebook color="black" />
          </a>
          <a
            href="https://www.instagram.com"
            target="_blank"
            rel="noopener noreferrer"
          >
            <FaInstagram color="black" />
          </a>
          <a
            href="https://www.tiktok.com"
            target="_blank"
            rel="noopener noreferrer"
          >
            <FaTiktok color="black" />
          </a>
        </div>
      </div>
    </footer>
  );
}

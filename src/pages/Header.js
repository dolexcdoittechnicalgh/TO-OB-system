import * as React from "react";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";

function Header() {
  const headerLogo = {
    image: "https://dolexportal.com/img/dole.png",
    name: "DOLE",
  };

  return (
    <AppBar
      position="static"
      sx={{
        backgroundColor: "#d9d9d9",
        boxShadow: 0,
        py: { xs: 1, sm: 2 },
      }}
    >
      <Toolbar
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          alignItems: "center",
          justifyContent: "center",
          gap: { xs: 1, sm: 2, md: 3 },
          textAlign: "center",
          px: { xs: 1, sm: 2 },
          minHeight: { xs: "auto", sm: 64 },
        }}
      >
        {/* Logo */}
        <Box
          sx={{
            flexShrink: 0,
          }}
        >
          <img
            src={headerLogo.image}
            alt={headerLogo.name}
            style={{
              width: "clamp(40px, 8vw, 60px)",
              height: "clamp(35px, 7vw, 55px)",
              objectFit: "contain",
            }}
          />
        </Box>

        {/* Text */}
        <Box
          sx={{
            maxWidth: { xs: "100%", sm: "none" },
          }}
        >
          <Typography
            variant="body2"
            sx={{
              color: "black",
              fontWeight: 400,
              fontSize: { xs: "0.7rem", sm: "0.8rem", md: "0.875rem" },
              lineHeight: { xs: 1.2, sm: 1.3 },
            }}
          >
            Republic of the Philippines
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: "black",
              fontWeight: 600,
              fontSize: { xs: "0.7rem", sm: "0.8rem", md: "0.875rem" },
              lineHeight: { xs: 1.2, sm: 1.3 },
            }}
          >
            DEPARTMENT OF LABOR AND EMPLOYMENT
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: "black",
              fontWeight: 500,
              fontSize: { xs: "0.7rem", sm: "0.8rem", md: "0.875rem" },
              lineHeight: { xs: 1.2, sm: 1.3 },
            }}
          >
            Regional Office No. X
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: "black",
              fontWeight: 600,
              fontSize: { xs: "0.7rem", sm: "0.8rem", md: "0.875rem" },
              lineHeight: { xs: 1.2, sm: 1.3 },
            }}
          >
            Cagayan De Oro - Field Office
          </Typography>
        </Box>
      </Toolbar>
    </AppBar>
  );
}

export default Header;

import { StrictMode, useEffect } from "react";
import { createRoot } from "react-dom/client";

import { Box, ThemeProvider, Typography } from "@mui/material";

import "./assets/main.css";
import { MainHeader } from "./components/Header.jsx";
import theme from "./components/Theme.jsx";
import { fetchWho } from "./js/departments.js";
import { isAdminAuthenticated } from "./utils/adminAuth.js";

import UNIVERSITY_LOGO from "./assets/cvsu-logo.png";

function App() {
  useEffect(() => {
    const redirectByRole = async () => {
      if (isAdminAuthenticated()) {
        window.location.href = "/departments/";
        return;
      }

      try {
        const who = await fetchWho();
        if (who !== "no one is logged in") {
          window.location.href = "/schedule/";
          return;
        }
      } catch {}

      window.location.href = "/login/";
    };

    redirectByRole();
  }, []);

  return (
    <>
      <MainHeader />
      <Box
        display={"flex"}
        flexDirection={"column"}
        alignItems={"center"}
        justifyContent={"center"}
        height={"80vh"}
      >
        <img src={UNIVERSITY_LOGO} height={"150px"} />
        <Typography variant="body1" fontWeight={"bold"} color="green">
          Cavite State University - Silang Campus
        </Typography>
        <Typography variant="h6" marginTop={2}>
          Subject Scheduling System Using Genetic Algorithm
        </Typography>
      </Box>
    </>
  );
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ThemeProvider theme={theme}>
      <App />
    </ThemeProvider>
  </StrictMode>,
);

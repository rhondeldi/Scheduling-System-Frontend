// ===================== IMPORTS =====================
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  Box,
  Typography,
  Button,
  Divider,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from "@mui/material";

import MenuIcon from "@mui/icons-material/Menu";
import MenuOpenIcon from "@mui/icons-material/MenuOpen";
import BusinessIcon from "@mui/icons-material/Business";
import SchoolIcon from "@mui/icons-material/School";
import SubjectIcon from "@mui/icons-material/Subject";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import MeetingRoomIcon from "@mui/icons-material/MeetingRoom";
import PeopleIcon from "@mui/icons-material/People";
import LogoutIcon from "@mui/icons-material/Logout";

import { Popup } from "../components/Loading";
import { getAdminAllowedPages, logoutAdmin } from "../utils/adminAuth.js";
import { logoutDepartment } from "../js/departments.js";

// ===================== CONSTANTS =====================
const departmentPages = ["schedule", "rooms", "instructors"];

const getPageDisplayInfo = (page) => {
  const pageInfo = {
    departments: { label: "Departments", icon: BusinessIcon },
    curriculums: { label: "Curriculums", icon: SchoolIcon },
    subjects: { label: "Subjects", icon: SubjectIcon },
    schedule: { label: "Schedule", icon: CalendarTodayIcon },
    rooms: { label: "Rooms", icon: MeetingRoomIcon },
    instructors: { label: "Instructors", icon: PeopleIcon },
  };

  return pageInfo[page] || { label: page, icon: null };
};

// ===================== MAIN COMPONENT =====================
export function MainHeader({ pageName, children, navigationDisabled = false }) {
  const navigate = useNavigate();

  // ---- STATE ----
  const [popupOptions, setPopupOptions] = useState(null);
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => {
    return localStorage.getItem("sidebarCollapsed") === "true";
  });

  // ---- DERIVED ----
  const departmentName = localStorage.getItem("departmentName");
  const adminPages = getAdminAllowedPages();
  const isDepartmentPage = departmentPages.includes(pageName);
  const pages = isDepartmentPage ? departmentPages : adminPages;
  const { label: pageLabel, icon: PageIcon } = getPageDisplayInfo(pageName);

  // ---- HANDLERS ----
  const toggleSidebar = () => {
    if (navigationDisabled) return;

    const newState = !collapsed;
    setCollapsed(newState);
    localStorage.setItem("sidebarCollapsed", newState);
  };

  const handleLogout = async () => {
    setLoggingOut(true);

    try {
      if (isDepartmentPage) {
        await logoutDepartment();
      } else {
        await logoutAdmin();
      }

      localStorage.removeItem("sidebarCollapsed");

      setTimeout(() => {
        navigate("/login", { replace: true });
      }, 800);
    } catch (err) {
      setPopupOptions({
        Heading: "Logout Failed",
        HeadingStyle: { background: "red", color: "white" },
        Message: `${err}`,
      });

      setLoggingOut(false);
    }
  };

  return (
    <>
      <Popup
        popupOptions={popupOptions}
        closeButtonActionHandler={() => setPopupOptions(null)}
      />

      {/* ===================== LOGOUT DIALOG ===================== */}
      <Dialog open={logoutConfirmOpen} onClose={() => setLogoutConfirmOpen(false)}>
        <DialogTitle sx={{ backgroundColor: "primary.dark" }}>
          Confirm Logout
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: "text.primary", mb: 2 }}>
            Are you sure you want to logout? You will need to sign in again.
          </DialogContentText>
          <Box
            sx={{
              px: 2,
              py: 1.5,
              borderRadius: 1.5,
              backgroundColor: "rgba(0, 87, 63, 0.06)",
              border: "1px solid",
              borderColor: "primary.light",
            }}
          >
            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: "primary.dark" }}>
              End current session
            </Typography>
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              Unsaved work on the current page may be lost after signing out.
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ justifyContent: "flex-end" }}>
          <Button
            color="secondary"
            variant="contained"
            onClick={() => setLogoutConfirmOpen(false)}
          >
            Cancel
          </Button>
          <Button
            color="error"
            variant="outlined"
            onClick={() => {
              setLogoutConfirmOpen(false);
              handleLogout();
            }}
          >
            Logout
          </Button>
        </DialogActions>
      </Dialog>

      {/* ===================== LAYOUT ===================== */}
      <Box display="flex" height="100vh" overflow="hidden">

        {/* ===================== SIDEBAR ===================== */}
        <Box
          sx={{
            width: collapsed ? 110 : 340,
            transition: "width 0.3s ease-in-out",
            overflow: "hidden",
            backgroundColor: "primary.dark",
            color: "white",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: 2,
          }}
        >

          {/* ===================== TOP ===================== */}
          <Box>

            {/* HEADER */}
            <Box
              display="flex"
              alignItems="center"
              sx={{ margin: "10px 10px 10px 20px" }}
              justifyContent="flex-start"
              gap={1}
            >
              <Box
                sx={{
                  width: 40,
                  minWidth: 40,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <IconButton
                  onClick={toggleSidebar}
                  disabled={navigationDisabled}
                  sx={{
                    color: "white",
                    padding: 0,
                    "&.Mui-disabled": {
                      color: "rgba(255,255,255,0.48)",
                    },
                  }}
                >
                  {collapsed ? <MenuIcon /> : <MenuOpenIcon />}
                </IconButton>
              </Box>

              <Box
                sx={{
                  width: collapsed ? 0 : 220,
                  opacity: collapsed ? 0 : 1,
                  overflow: "hidden",
                  whiteSpace: "nowrap",
                  transition: "width 0.3s ease-in-out, opacity 0.2s ease",
                }}
              >
                <Typography variant="h6" fontWeight="bold">
                  Cavite State University
                </Typography>
                <Typography variant="subtitle2">
                  Silang Campus
                </Typography>
              </Box>
            </Box>

            <Divider sx={{ my: 2, bgcolor: "rgba(220, 239, 229, 0.35)" }} />

            {/* ===================== NAV ITEMS ===================== */}
            <Box mt={collapsed ? 2 : 4} display="flex" flexDirection="column" gap={1} margin={1}>
              {pages.map((page) => {
                const { label, icon: Icon } = getPageDisplayInfo(page);
                const isActive = pageName === page;

                return (
                  <Button
                    key={page}
                    disabled={navigationDisabled}
                    onClick={() => navigate(`/${page}`)}
                    sx={{
                      width: "100%",
                      minHeight: 50,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "flex-start",
                      p: 1.5,
                      borderRadius: 2,
                      textTransform: "none",

                      color: isActive ? "primary.dark" : "white",
                      backgroundColor: isActive ? "secondary.light" : "transparent",

                      "&:hover": {
                        backgroundColor: isActive
                          ? "secondary.light"
                          : "#ffffff11",
                      },
                      "&.Mui-disabled": {
                        color: "rgba(255,255,255,0.48)",
                        backgroundColor: isActive ? "rgba(237,247,241,0.16)" : "transparent",
                      },
                    }}
                  >
                    {/* ICON */}
                    <Box
                      sx={{
                        width: 40,
                        minWidth: 40,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <Icon />
                    </Box>

                    {/* LABEL */}
                    <Box
                        sx={{
                            opacity: collapsed ? 0 : 1,
                            transform: collapsed
                            ? "translateX(-10px)"
                            : "translateX(0px)",

                            overflow: "hidden",
                            whiteSpace: "nowrap",

                            transition:
                            "opacity 0.25s ease, transform 0.25s ease",

                            pointerEvents: collapsed ? "none" : "auto",
                        }}
                    >
                    {label}
                    </Box>
                  </Button>
                );
              })}
            </Box>
          </Box>

          {/* ===================== LOGOUT ===================== */}
          <Button
            onClick={() => setLogoutConfirmOpen(true)}
            disabled={loggingOut || navigationDisabled}
            sx={{
                width: "calc(100% - 16px)",
                minHeight: 48,
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-start",
                p: 1.5,
                mx: 1,
                borderRadius: 2,
                textTransform: "none",

                color: "white",

                "&:hover": {
                backgroundColor: "#ffffff11",
                },
                "&.Mui-disabled": {
                color: "rgba(255,255,255,0.48)",
                },
            }}
            >
            {/* ICON */}
            <Box
                sx={{
                width: 40,
                minWidth: 40,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                }}
            >
                <LogoutIcon />
            </Box>

            {/* LABEL */}
            <Box
                sx={{
                opacity: collapsed ? 0 : 1,
                transform: collapsed
                    ? "translateX(-10px)"
                    : "translateX(0px)",

                overflow: "hidden",
                whiteSpace: "nowrap",

                transition:
                    "opacity 0.25s ease, transform 0.25s ease",

                pointerEvents: collapsed ? "none" : "auto",
                }}
            >
                {loggingOut ? "Logging out..." : "Logout"}
            </Box>
            </Button>
        </Box>

        {/* ===================== MAIN CONTENT ===================== */}
        <Box flex={1} sx={{ backgroundColor: "background.default", overflow: "auto" }}>

          {/* CONTENT */}
          <Box sx={{ px: 3, py: 2, flex: 1, overflow: "auto" }}>

            {/* ===================== TITLE ===================== */}
            <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5, mb: 1, minHeight: 58}}>

              {/* DIVIDER BAR */}
              <Box sx={{
                width: 5,
                minWidth: 5,
                height: collapsed ? 55 : 34,
                bgcolor: "primary.main",
                borderRadius: "50px",
                flexShrink: 0,
                transition: "height 0.3s ease",
              }} />

              {/* TITLE TEXT */}
              <Box sx={{ position: "relative" }}>
                <Typography variant="h5" fontWeight={700}>
                  {departmentName || "Administration Department"}
                </Typography>

                {/* SUBTITLE (visible when sidebar is collapsed) */}
                <Box sx={{
                  position: "absolute",
                  top: "100%",
                  left: 0,
                  mt: 0.4,
                  overflow: "hidden",
                  maxHeight: collapsed ? "30px" : "0px",
                  opacity: collapsed ? 1 : 0,
                  transition: "max-height 0.3s ease, opacity 0.25s ease",
                }}>
                  <Typography variant="body2" sx={{ color: "text.secondary", letterSpacing: "0.08em", textTransform: "uppercase", fontSize: "0.8rem", fontWeight: "bold" }}>
                    {pageLabel}
                  </Typography>
                </Box>
              </Box>
            </Box>

            {/* ===================== PAGE ===================== */}
            {children}
          </Box>
        </Box>
      </Box>
    </>
  );
}

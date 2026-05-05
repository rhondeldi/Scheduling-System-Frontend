import { useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  Box,
  Typography,
  Button,
  Divider,
  IconButton,
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
import {
  getAdminAllowedPages,
  logoutAdmin,
} from "../utils/adminAuth.js";

import { logoutDepartment } from "../js/departments.js";

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

export function MainHeader({ pageName, children }) {
  const navigate = useNavigate();

  const [popupOptions, setPopupOptions] = useState(null);
  const [loggingOut, setLoggingOut] = useState(false);

  const [collapsed, setCollapsed] = useState(() => {
    return localStorage.getItem("sidebarCollapsed") === "true";
  });

  const toggleSidebar = () => {
    const newState = !collapsed;
    setCollapsed(newState);
    localStorage.setItem("sidebarCollapsed", newState);
  };

  const departmentName = localStorage.getItem("departmentName");
  const adminPages = getAdminAllowedPages();

  const isDepartmentPage = departmentPages.includes(pageName);
  const pages = isDepartmentPage ? departmentPages : adminPages;

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

      <Box display="flex" minHeight="100vh">

        {/* SIDEBAR */}
        <Box
          sx={{
            width: collapsed ? 80 : 300,
            transition: "all 0.3s ease",
            backgroundColor: "#14400e",
            color: "white",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: 2,
          }}
        >
          {/* TOP */}
          <Box>

            {/* HEADER */}
            <Box
              display="flex"
              alignItems="center"
              justifyContent={collapsed ? "center" : "space-between"}
            >
              {!collapsed && (
                <Box>
                  <Typography variant="h6" fontWeight="bold">
                    Cavite State University
                  </Typography>
                  <Typography variant="body2">
                    Silang Campus
                  </Typography>
                </Box>
              )}

              <IconButton
                onClick={toggleSidebar}
                sx={{ color: "white" }}
              >
                {collapsed ? <MenuIcon /> : <MenuOpenIcon />}
              </IconButton>
            </Box>

            {!collapsed && (
              <Divider sx={{ my: 3, bgcolor: "#d5d5d5" }} />
            )}

            {/* NAV */}
            <Box
              mt={collapsed ? 2 : 4}
              display="flex"
              flexDirection="column"
              gap={1}
            >
              {pages.map((page) => {
                const { label, icon: Icon } = getPageDisplayInfo(page);
                const isActive = pageName === page;

                return (
                  <Button
                    key={page}
                    onClick={() => navigate(`/${page}`)}
                    startIcon={<Icon />}
                    sx={{
                      width: "100%",
                      justifyContent: collapsed
                        ? "center"
                        : "flex-start",
                      color: isActive ? "#0f660d" : "white",
                      backgroundColor: isActive
                        ? "#f9fff9"
                        : "transparent",
                      textTransform: "none",
                      fontSize: "0.9rem",
                      padding: collapsed
                        ? "16px 0"
                        : "16px",
                      borderRadius: 2,
                      minWidth: 0,

                      "& .MuiButton-startIcon": {
                        margin: collapsed ? 0 : undefined,
                      },

                      "&:hover": {
                        backgroundColor: isActive
                          ? "#f9fff9"
                          : "#ffffff11",
                      },
                    }}
                  >
                    {!collapsed && label}
                  </Button>
                );
              })}
            </Box>
          </Box>

          {/* LOGOUT */}
          <Button
            onClick={handleLogout}
            disabled={loggingOut}
            startIcon={<LogoutIcon />}
            sx={{
              color: "white",
              borderTop:
                "1px solid rgba(255,255,255,0.35)",
              justifyContent: collapsed
                ? "center"
                : "flex-start",
              borderRadius: 0,
              pt: 2,
              minWidth: 0,
              width: "100%",
            }}
          >
            {!collapsed &&
              (loggingOut
                ? "Logging out..."
                : "Logout")}
          </Button>
        </Box>

        {/* CONTENT */}
        <Box flex={1} sx={{ backgroundColor: "#f5f5f5", padding: 2 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Divider
                orientation="vertical"
                flexItem sx={{ height: 40,
                borderRightWidth: 5,
                borderColor: "#000",
                borderRadius: 50,
            }}
            />
            <Typography variant="h6" fontWeight="bold" mb={2}>
                {departmentName ||
                "Administration Department"}
            </Typography>
            </Box>
            {children}
          </Box>
      </Box>
    </>
  );
}
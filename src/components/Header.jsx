import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { Box, Typography, Button, Divider } from "@mui/material";

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
  const departmentName = localStorage.getItem("departmentName");
  const adminPages = getAdminAllowedPages();

  const [loggingOut, setLoggingOut] = useState(false);

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
            width: 300,
            backgroundColor: "#14400e",
            color: "white",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: 2,
          }}
        >
          <Box m={2}>
            <Typography variant="h6" fontWeight="bold">
              Cavite State University
            </Typography>

            <Typography variant="body2">Silang Campus</Typography>

            <Divider sx={{ my: 4, bgcolor: "#d5d5d5", height: 2 }} />

            <Box mt={4} display="flex" flexDirection="column" gap={1}>
              {pages.map((page) => {
                const { label, icon: Icon } = getPageDisplayInfo(page);
                const isActive = pageName === page;

                return (
                  <Box key={page} sx={{ display: "flex", alignItems: "center" }}>
                    <Divider
                      orientation="vertical"
                      flexItem
                      sx={{
                        width: 4,
                        mr: 1,
                        borderRadius: 2,
                        bgcolor: isActive ? "#f9fff9" : "transparent",
                      }}
                    />
                    <Button
                      onClick={() => navigate(`/${page}`)}
                      startIcon={Icon ? <Icon /> : null}
                      sx={{
                        width: "100%",
                        justifyContent: "flex-start",
                        color: isActive ? "#0f660d" : "white",
                        backgroundColor: isActive ? "#f9fff9" : "transparent",
                        textTransform: "none",
                        fontSize: "0.9rem",
                        padding: "16px",
                        margin: "2px",
                        borderRadius: 2,
                        "&:hover": {
                          backgroundColor: isActive ? "#f9fff9" : "#ffffff11",
                        },
                      }}
                    >
                      {label}
                    </Button>
                  </Box>
                );
              })}
            </Box>
          </Box>

          <Button
            sx={{
              color: "white",
              justifyContent: "flex-start",
              mx: 2,
              mb: 1,
              borderTop: "1px solid rgba(255,255,255,0.35)",
              borderRadius: 0,
              pt: 2,
            }}
            onClick={handleLogout}
            disabled={loggingOut}
            startIcon={<LogoutIcon />}
          >
            {loggingOut ? "Logging out..." : "Logout"}
          </Button>
        </Box>

        {/* CONTENT */}
        <Box flex={1} sx={{ backgroundColor: "#f5f5f5", padding: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Divider
              orientation="vertical"
              flexItem
              sx={{
                height: 40,
                borderRightWidth: 5,
                borderColor: "#000",
                borderRadius: 50,
              }}
            />

            <Typography variant="h6" fontWeight="bold">
                {departmentName || "Administration Department"}
            </Typography>
            </Box>

          {children}
        </Box>
      </Box>
    </>
  );
}

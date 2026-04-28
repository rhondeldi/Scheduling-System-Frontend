import { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Button,
  TextField,
} from "@mui/material";
import { Divider } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import BusinessIcon from "@mui/icons-material/Business";
import SchoolIcon from "@mui/icons-material/School";
import SubjectIcon from "@mui/icons-material/Subject";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import MeetingRoomIcon from "@mui/icons-material/MeetingRoom";
import PeopleIcon from "@mui/icons-material/People";

import { Popup } from "../components/Loading";
import {
  fetchAllDepartments,
  fetchWho,
  logoutDepartment,
} from "../js/departments.js";
import {
  getAdminAllowedPages,
  isAdminAuthenticated,
  isAllowedAdminPage,
  logoutAdmin,
} from "../utils/adminAuth.js";

const adminPages = getAdminAllowedPages();
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
  const [loggedInDepartmentLabel, setLoggedInDepartmentLabel] = useState("");
  const [popupOptions, setPopupOptions] = useState(null);

  const isAdminPage = pageName ? isAllowedAdminPage(pageName) : false;
  const isDepartmentPage = pageName
    ? departmentPages.includes(pageName)
    : false;

  const pages = isDepartmentPage ? departmentPages : adminPages;

  useEffect(() => {
    const validateAccess = async () => {
      if (!pageName) return;

      if (isAdminPage) {
        if (!isAdminAuthenticated()) {
          window.location.href = "/login/";
        }
        return;
      }

      if (isDepartmentPage) {
        try {
          const who = await fetchWho();
          if (who === "no one is logged in") {
            window.location.href = "/department_login/";
            return;
          }

          const loggedInDepartmentID = Number(who);
          if (!Number.isInteger(loggedInDepartmentID)) return;

          const allDepartments = await fetchAllDepartments();
          const loggedInDepartment = allDepartments.find(
            (d) => Number(d.DepartmentID) === loggedInDepartmentID
          );

          if (loggedInDepartment) {
            setLoggedInDepartmentLabel(
              `${loggedInDepartment.Code} - ${loggedInDepartment.Name}`
            );
          }
        } catch {
          window.location.href = "/department_login/";
        }
        return;
      }

      window.location.href = "/departments/";
    };

    validateAccess();
  }, [isAdminPage, isDepartmentPage, pageName]);

  const handleLogout = async () => {
    try {
      if (isDepartmentPage) {
        await logoutDepartment();
        window.location.href = "/department_login/";
        return;
      }

      await logoutAdmin();
      window.location.href = "/login/";
    } catch (err) {
      setPopupOptions({
        Heading: "Logout Failed",
        HeadingStyle: { background: "red", color: "white" },
        Message: `${err}`,
      });
    }
  };

  return (
    <>
      <Popup
        popupOptions={popupOptions}
        closeButtonActionHandler={() => setPopupOptions(null)}
      />

      {/* MAIN LAYOUT */}
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
            <Typography variant="body2">
              Silang Campus
            </Typography>

            <Divider
                sx={{
                    my: 4,
                    height: "2px",
                    backgroundColor: "#d5d5d5",
                }}
            />

            <Box mt={4} display="flex" flexDirection="column" gap={1}>
              {pages.map((page) => {
                const { label, icon: Icon } = getPageDisplayInfo(page);
                return (
                  <Button
                    key={page}
                    href={`/${page}/`}
                    startIcon={Icon ? <Icon /> : null}
                    sx={{
                      justifyContent: "flex-start",
                      color: "white",
                      backgroundColor:
                        pageName === page ? "#ffffff22" : "transparent",
                      textTransform: "none",
                      fontSize: "1rem",
                      padding: "8px 16px",
                      "&:hover": {
                        backgroundColor: "#ffffff11",
                      },
                    }}
                  >
                    {label}
                  </Button>
                );
              })}
            </Box>
          </Box>

          <Button
            sx={{ color: "white", justifyContent: "flex-start" }}
            onClick={handleLogout}
          >
            Logout
          </Button>
        </Box>

        {/* CONTENT AREA */}
        <Box
          flex={1}
          sx={{
            backgroundColor: "#f5f5f5",
            padding: 2,
          }}
        >
          {/* TOP HEADER */}
          <Box
            sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 1,
            }}
            >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Divider orientation="vertical" flexItem sx={{ height: 40, borderRightWidth: 5, borderColor: '#000000', borderRadius: 50}} />
                <Typography variant="h6" fontWeight="bold">
                {isDepartmentPage
                    ? loggedInDepartmentLabel || "Department"
                    : "Administration Department"}
                </Typography>
            </Box>
            </Box>
          {/* PAGE CONTENT */}
          {children}
        </Box>
      </Box>
    </>
  );
}
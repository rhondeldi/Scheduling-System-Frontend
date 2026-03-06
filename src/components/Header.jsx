import { useEffect, useState } from "react";

import { AppBar, Box, Container, Toolbar, Typography } from "@mui/material";
import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import Avatar from "@mui/material/Avatar";
import Button from "@mui/material/Button";
import Tooltip from "@mui/material/Tooltip";
import MenuItem from "@mui/material/MenuItem";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";

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

export function MainHeader({ pageName }) {
  const [anchorElUser, setAnchorElUser] = useState(null);
  const [loggedInDepartmentLabel, setLoggedInDepartmentLabel] = useState("");
  const isAdminPage = pageName ? isAllowedAdminPage(pageName) : false;
  const isDepartmentPage = pageName
    ? departmentPages.includes(pageName)
    : false;
  const pages = isDepartmentPage ? departmentPages : adminPages;

  useEffect(() => {
    const validateAccess = async () => {
      if (!pageName) {
        return;
      }

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
          if (!Number.isInteger(loggedInDepartmentID)) {
            setLoggedInDepartmentLabel("");
            return;
          }

          const allDepartments = await fetchAllDepartments();
          const loggedInDepartment = allDepartments.find(
            (department) =>
              Number(department.DepartmentID) === loggedInDepartmentID,
          );

          if (loggedInDepartment) {
            setLoggedInDepartmentLabel(
              `${loggedInDepartment.Code} - ${loggedInDepartment.Name}`,
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

  const [popupOptions, setPopupOptions] = useState(null);

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

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

      <AppBar position="static">
        <Container maxWidth="xl">
          <Toolbar disableGutters>
            <CalendarMonthIcon
              sx={{ display: { xs: "none", md: "flex" }, mr: 1 }}
            />
            <Typography
              variant="h6"
              noWrap
              component="a"
              href="/"
              sx={{
                mr: 2,
                display: { xs: "none", md: "flex" },
                fontFamily: "monospace",
                fontWeight: 700,
                letterSpacing: ".2rem",
                color: "inherit",
                textDecoration: "none",
              }}
            >
              Home
            </Typography>

            <CalendarMonthIcon
              sx={{ display: { xs: "flex", md: "none" }, mr: 1 }}
            />
            <Box
              gap={1}
              sx={{ flexGrow: 1, display: { xs: "none", md: "flex" } }}
            >
              {pages.map((page) => (
                <Button
                  key={page}
                  onClick={() => {}}
                  sx={{
                    my: 1,
                    color: "white",
                    display: "block",
                    backgroundColor: pageName === page ? "#00000032" : "",
                  }}
                  href={`/${page}/`}
                >
                  {page}
                </Button>
              ))}
            </Box>

            <Box sx={{ flexGrow: 0 }}>
              {isDepartmentPage ? (
                <Typography sx={{ mr: 2, fontSize: "0.85rem" }}>
                  {loggedInDepartmentLabel
                    ? `Department: ${loggedInDepartmentLabel}`
                    : "Department Account"}
                </Typography>
              ) : null}
              <Tooltip title="Open settings">
                <IconButton onClick={setAnchorElUser} sx={{ p: 0 }}>
                  <Avatar alt="Admin User Icon" />
                </IconButton>
              </Tooltip>
              <Menu
                sx={{ mt: "45px" }}
                id="menu-appbar"
                anchorEl={anchorElUser}
                anchorOrigin={{
                  vertical: "top",
                  horizontal: "right",
                }}
                keepMounted
                transformOrigin={{
                  vertical: "top",
                  horizontal: "right",
                }}
                open={Boolean(anchorElUser)}
                onClose={handleCloseUserMenu}
              >
                <MenuItem
                  key={"Logout"}
                  onClick={async (e, next) => {
                    console.log("logout");
                    await handleLogout();
                    handleCloseUserMenu(e, next);
                  }}
                >
                  <Typography sx={{ textAlign: "center" }}>
                    {"Logout"}
                  </Typography>
                </MenuItem>
              </Menu>
            </Box>
          </Toolbar>
        </Container>
      </AppBar>
      <Box minHeight={"0.25em"}></Box>
    </>
  );
}

MainHeader.propTypes = {
  pageName: () => null,
};

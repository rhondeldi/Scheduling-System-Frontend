import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Paper,
  Snackbar,
  TextField,
  Typography,
} from "@mui/material";

import LoginIcon from "@mui/icons-material/Login";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";

import { InputAdornment, IconButton } from "@mui/material";
import { isAdminAuthenticated, loginAdmin } from "../utils/adminAuth";
import { fetchAllDepartments, fetchWho, loginDepartment } from "../js/departments";
import { departmentMap } from "../utils/departmentsMap";
import { clearAuthData } from "../utils/authStorage";

import LOGIN_LOGO from "../assets/cvsu-silang.jpg";

export default function Login() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    account: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    severity: "error",
    message: "",
  });

  useEffect(() => {
    (async () => {
      const ok = await isAdminAuthenticated();
      if (ok) {
        navigate("/departments", { replace: true });
        return;
      }

      try {
        const who = await fetchWho();
        if (who !== "no one is logged in") {
          navigate("/schedule", { replace: true });
        }
      } catch {}
    })();
  }, [navigate]);

  const handleChange = (e) => {
    setForm((f) => ({
      ...f,
      [e.target.name]: e.target.value,
    }));
  };

  const handleCloseSnackbar = () => {
    setSnackbar((s) => ({ ...s, open: false }));
  };

   const handleSubmit = async (e) => {
     e.preventDefault();
     setLoading(true);

     if (!form.account || !form.password) {
       setSnackbar({
         open: true,
         severity: "warning",
         message: "All fields are required.",
       });
       setLoading(false);
       return;
     }

     try {
       const isAdminSuccess = await loginAdmin(form.account, form.password);

       if (isAdminSuccess) {
         clearAuthData();
         setSnackbar({
           open: true,
           severity: "success",
           message: "Login successful!",
         });

         setTimeout(() => {
           navigate("/departments");
         }, 600);

         return;
       }

       const departments = await fetchAllDepartments();
       const matchingDepartment = departments.find((department) => {
         return department.Code?.toLowerCase() === form.account.trim().toLowerCase();
       });

       if (!matchingDepartment) {
         setSnackbar({
           open: true,
           severity: "error",
           message: "Invalid username or password.",
         });
         return;
       }

       const response = await loginDepartment({
         id: Number(matchingDepartment.DepartmentID),
         code: matchingDepartment.Code,
         password: form.password,
       });

       if (response.status === 200 || response.status === 208) {
         const deptCode = matchingDepartment.Code;
         const deptName = departmentMap[deptCode]?.name;
      
         localStorage.setItem("departmentCode", deptCode);
         localStorage.setItem("departmentName", deptName);

         setSnackbar({
           open: true,
           severity: "success",
           message: "Login successful!",
         });

         setTimeout(() => {
           navigate("/schedule");
         }, 600);
       } else {
         setSnackbar({
           open: true,
           severity: "error",
           message: "Invalid username or password.",
         });
       }
     } catch (err) {
       setSnackbar({
         open: true,
         severity: "error",
         message: `Network error: ${err}`,
       });
     } finally {
       setLoading(false);
     }
   };

   const handleBlock = (e) => {
    e.preventDefault();
  };
  
    const handleKeyDown = (e) => {
        if (
        (e.ctrlKey || e.metaKey) &&
        ["a", "c", "x"].includes(e.key.toLowerCase())
        ) {
        e.preventDefault();
        }
    };

  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      minHeight="100vh"
      bgcolor="#1c3d0e"
      p={2}
    >
      <Paper elevation={3} sx={{ p: 4, maxWidth: 400, width: "100%" }}>
        <Box
          mb={2}
          display="flex"
          justifyContent="space-between"
          alignItems="center"
        >
          <img src={LOGIN_LOGO} height="50px" alt="Logo" />
          <Typography color="primary" fontWeight="bold">
            Login
          </Typography>
        </Box>

        <Box
          component="form"
          autoComplete="off"
          onSubmit={handleSubmit}
          sx={{ display: "flex", flexDirection: "column", gap: 2 }}
        >
          <TextField
            label="Username"
            name="account"
            value={form.account}
            onChange={handleChange}
            onCopy={handleBlock}
            onCut={handleBlock}
            onPaste={handleBlock}
            onContextMenu={handleBlock}
            onKeyDown={handleKeyDown}
            fullWidth
          />

          <TextField
            label="Password"
            name="password"
            type={showPassword ? "text" : "password"}
            value={form.password}
            onChange={handleChange}
            onCopy={handleBlock}
            onCut={handleBlock}
            onPaste={handleBlock}
            onContextMenu={handleBlock}
            onKeyDown={handleKeyDown}
            fullWidth
            InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      color="password"
                      onClick={() =>
                        setShowPassword((prev) => !prev)
                      }
                      edge="end"
                    >
                      {showPassword ? (
                        <Visibility />
                      ) : (
                        <VisibilityOff />
                      )}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

          <Button
            type="submit"
            variant="contained"
            size="large"
            disabled={loading}
            endIcon={
              loading ? (
                <CircularProgress size={20} />
              ) : (
                <LoginIcon />
              )
            }
            disabled={loading}
          >
            {loading ? "Logging in..." : "Login"}
          </Button>
        </Box>
      </Paper>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

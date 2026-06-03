// ===================== IMPORTS =====================
import { useEffect, useMemo, useState } from "react";

import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Divider,
  Paper,
  Snackbar,
  TextField,
  Typography,
} from "@mui/material";

import SaveIcon from "@mui/icons-material/Save";

import { MainHeader } from "./components/Header";
import { updateAdminAccount } from "./utils/adminAuth";
import {
  fetchAllDepartments,
  fetchWho,
  updateCurrentDepartmentPassword,
} from "./js/departments";

// ===================== CONSTANTS =====================
const emptyPasswordForm = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
};
const ADMIN_USERNAME_STORAGE_KEY = "gasss_admin_username";

// ===================== MAIN COMPONENT =====================
export default function AccountSettings({ accountType }) {
  // ---- STATE ----
  const [department, setDepartment] = useState(null);
  const [adminUsername, setAdminUsername] = useState(
    () => localStorage.getItem(ADMIN_USERNAME_STORAGE_KEY) || "admin",
  );
  const [passwordForm, setPasswordForm] = useState(emptyPasswordForm);
  const [hasAttemptedSave, setHasAttemptedSave] = useState(false);
  const [loading, setLoading] = useState(accountType === "department");
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    severity: "success",
    message: "",
  });

  // ---- DERIVED ----
  const isAdmin = accountType === "admin";
  const codeLabel = isAdmin ? "Admin Username" : "Department Code";
  const nameLabel = isAdmin ? "Account Name" : "Department Name";
  const accountName = isAdmin ? "Administration Department" : department?.Name || "";

  const validation = useMemo(() => {
    const currentPasswordEmpty = !passwordForm.currentPassword.trim();
    const newPasswordEmpty = !passwordForm.newPassword.trim();
    const confirmPasswordEmpty = !passwordForm.confirmPassword.trim();
    const passwordTooShort =
      Boolean(passwordForm.newPassword) && passwordForm.newPassword.length < 8;
    const passwordsMismatch =
      passwordForm.confirmPassword !== passwordForm.newPassword;
    const usernameEmpty = isAdmin && !adminUsername.trim();

    return {
      currentPasswordEmpty,
      newPasswordEmpty,
      confirmPasswordEmpty,
      passwordTooShort,
      passwordsMismatch,
      usernameEmpty,
      invalid:
        currentPasswordEmpty ||
        newPasswordEmpty ||
        confirmPasswordEmpty ||
        passwordTooShort ||
        passwordsMismatch ||
        usernameEmpty,
    };
  }, [adminUsername, isAdmin, passwordForm]);

  // ---- EFFECTS ----
  useEffect(() => {
    if (isAdmin) {
      setLoading(false);
      return;
    }

    (async () => {
      try {
        const who = await fetchWho();
        const departments = await fetchAllDepartments();
        const currentDepartment = departments.find(
          (item) => Number(item.DepartmentID) === Number(who),
        );

        if (!currentDepartment) {
          throw new Error("Unable to load the logged-in department account.");
        }

        setDepartment(currentDepartment);
      } catch (err) {
        setSnackbar({
          open: true,
          severity: "error",
          message: err.message,
        });
      } finally {
        setLoading(false);
      }
    })();
  }, [isAdmin]);

  // ---- HANDLERS ----
  const updatePasswordField = (field) => (event) => {
    setPasswordForm((current) => ({
      ...current,
      [field]: event.target.value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setHasAttemptedSave(true);

    if (validation.invalid || (!isAdmin && !department)) return;

    setSaving(true);
    try {
      if (isAdmin) {
        await updateAdminAccount({
          username: adminUsername,
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        });
        localStorage.setItem(ADMIN_USERNAME_STORAGE_KEY, adminUsername.trim());
      } else {
        await updateCurrentDepartmentPassword({
          department,
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
          confirmPassword: passwordForm.confirmPassword,
        });
      }

      setPasswordForm(emptyPasswordForm);
      setHasAttemptedSave(false);
      setSnackbar({
        open: true,
        severity: "success",
        message: "Account settings saved successfully.",
      });
    } catch (err) {
      setSnackbar({
        open: true,
        severity: "error",
        message: err.message,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <MainHeader pageName="account-settings" accountType={accountType}>
      <Box
        component="form"
        autoComplete="off"
        onSubmit={handleSubmit}
        sx={{ width: "100%", pt: 1 }}
      >
        <Paper
          elevation={1}
          sx={{
            p: 3,
            borderRadius: 1,
            border: "1px solid",
            borderColor: "divider",
          }}
        >
          <Typography variant="h6" fontWeight={800}>
            Account Details
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {isAdmin
              ? "Update the administrator login used for this system."
              : "Your department identity is managed from the Administrator page."}
          </Typography>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "minmax(240px, 1fr) minmax(240px, 1fr)" },
              gap: 2,
              mt: 3,
            }}
          >
            <TextField
              label={codeLabel}
              value={isAdmin ? adminUsername : department?.Code || ""}
              onChange={(event) => setAdminUsername(event.target.value)}
              disabled={!isAdmin || loading || saving}
              required={isAdmin}
              error={hasAttemptedSave && validation.usernameEmpty}
              helperText={
                hasAttemptedSave && validation.usernameEmpty
                  ? "Admin username is required"
                  : isAdmin
                    ? ""
                    : "Department code cannot be changed here"
              }
              fullWidth
            />

            <TextField
              label={nameLabel}
              value={accountName}
              disabled
              helperText={
                isAdmin
                  ? "Admin account name is fixed"
                  : "Department name cannot be changed here"
              }
              fullWidth
            />
          </Box>

          <Divider sx={{ my: 3 }} />

          <Typography variant="h6" fontWeight={800}>
            Change Password
          </Typography>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                md: "repeat(3, minmax(220px, 1fr))",
              },
              gap: 2,
              mt: 2,
            }}
          >
            <TextField
              label="Current Password"
              type="password"
              value={passwordForm.currentPassword}
              onChange={updatePasswordField("currentPassword")}
              disabled={loading || saving}
              required
              error={hasAttemptedSave && validation.currentPasswordEmpty}
              helperText={
                hasAttemptedSave && validation.currentPasswordEmpty
                  ? "Current password is required"
                  : ""
              }
              fullWidth
            />

            <TextField
              label="New Password"
              type="password"
              value={passwordForm.newPassword}
              onChange={updatePasswordField("newPassword")}
              disabled={loading || saving}
              required
              error={
                hasAttemptedSave &&
                (validation.newPasswordEmpty || validation.passwordTooShort)
              }
              helperText={
                hasAttemptedSave && validation.newPasswordEmpty
                  ? "New password is required"
                  : hasAttemptedSave && validation.passwordTooShort
                    ? "Password must be at least 8 characters long"
                    : "Use at least 8 characters"
              }
              fullWidth
            />

            <TextField
              label="Confirm Password"
              type="password"
              value={passwordForm.confirmPassword}
              onChange={updatePasswordField("confirmPassword")}
              disabled={loading || saving}
              required
              error={
                hasAttemptedSave &&
                (validation.confirmPasswordEmpty || validation.passwordsMismatch)
              }
              helperText={
                hasAttemptedSave && validation.confirmPasswordEmpty
                  ? "Confirm password is required"
                  : hasAttemptedSave && validation.passwordsMismatch
                    ? "Passwords do not match"
                    : ""
              }
              fullWidth
            />
          </Box>

          <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 3 }}>
            <Button
              type="submit"
              variant="contained"
              disabled={loading || saving}
              endIcon={
                saving ? <CircularProgress size={18} color="inherit" /> : <SaveIcon />
              }
            >
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </Box>
        </Paper>
      </Box>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={5000}
        onClose={() => setSnackbar((current) => ({ ...current, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar((current) => ({ ...current, open: false }))}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </MainHeader>
  );
}

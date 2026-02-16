import { StrictMode, useState, useEffect } from "react";
import { createRoot } from "react-dom/client";

import {
    Box,
    Paper,
    Typography,
    TextField,
    Button,
    CircularProgress,
    Snackbar,
    Alert,
    ThemeProvider
} from "@mui/material";

import LoginIcon from "@mui/icons-material/Login";
import { loginDepartment, fetchWho } from "../js/departments";
import theme from "../components/Theme";

import LOGIN_LOGO from '../assets/cvsu-silang.jpg'

export default function Login() {
    const [form, setForm] = useState({ id: "", code: "", password: "" });
    const [loading, setLoading] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, severity: "error", message: "" });

    useEffect(() => {

        const useEffectAsync = async () => {
            const who = await fetchWho();

            if (!(who == 'no one is logged in')) {
                window.location.href = '/';
            }
        }

        useEffectAsync();
    }, []);

    const handleChange = (e) => {
        setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    };

    const handleCloseSnackbar = () => {
        setSnackbar((s) => ({ ...s, open: false }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        // Validate required
        if (!form.id || !form.code || !form.password) {
            setSnackbar({ open: true, severity: "warning", message: "All fields are required." });
            setLoading(false);
            return;
        }

        try {
            const payload = {
                id: Number(form.id),
                code: form.code.trim(),
                password: form.password
            };
            const resp = await loginDepartment(payload);

            if (resp.status === 200) {
                setSnackbar({ open: true, severity: "success", message: "Login successful!" });
                window.location.href = '/';
            } else if (resp.status === 400) {
                setSnackbar({ open: true, severity: "error", message: "Bad request – please check your input." });
            } else if (resp.status === 404) {
                setSnackbar({ open: true, severity: "error", message: "Department not found or code incorrect." });
            } else if (resp.status === 401) {
                setSnackbar({ open: true, severity: "error", message: "Incorrect password." });
            } else if (resp.status === 208) {
                setSnackbar({ open: true, severity: "info", message: "Already logged in." });
                window.location.href = '/';
            } else {
                const text = await resp.text();
                setSnackbar({ open: true, severity: "error", message: text || "Unknown error." });
            }
        } catch (err) {
            setSnackbar({ open: true, severity: "error", message: `Network error: ${err}` });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            minHeight="100vh"
            bgcolor="#f5f5f5"
            p={2}
        >
            <Paper elevation={3} sx={{ p: 4, maxWidth: 400, width: "100%" }}>
                <Box marginBottom={2} display={'flex'} justifyContent={'space-between'} alignItems={'center'}>
                    <img src={LOGIN_LOGO} height={'50px'} />
                    <Typography color="purple" fontWeight={'bold'} variant="body1" gutterBottom align="center">
                        Department Login
                    </Typography>
                </Box>
                <Box
                    component="form"
                    onSubmit={handleSubmit}
                    sx={{ display: "flex", flexDirection: "column", gap: 2 }}
                >
                    <TextField
                        label="Department ID"
                        name="id"
                        type="number"
                        value={form.id}
                        onChange={handleChange}
                        required
                        fullWidth
                    />
                    <TextField
                        label="Department Code"
                        name="code"
                        value={form.code}
                        onChange={handleChange}
                        required
                        fullWidth
                    />
                    <TextField
                        label="Password"
                        name="password"
                        type="password"
                        value={form.password}
                        onChange={handleChange}
                        required
                        fullWidth
                    />

                    <Button
                        type="submit"
                        variant="contained"
                        size="large"
                        endIcon={loading ? <CircularProgress size={20} /> : <LoginIcon />}
                        disabled={loading}
                    >
                        {loading ? "Logging in…" : "Login"}
                    </Button>
                </Box>
            </Paper>

            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
            >
                <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: "100%" }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
}

const root = createRoot(document.getElementById("root"));
root.render(
    <StrictMode>
        <ThemeProvider theme={theme}>
            <Login />
        </ThemeProvider>
    </StrictMode>
);
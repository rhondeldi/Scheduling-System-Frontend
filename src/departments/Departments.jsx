// ===================== IMPORTS =====================
import { useState, useCallback, useEffect, useRef } from "react";

import {
  Box,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  CircularProgress,
  Skeleton,
  Dialog,
  DialogContent,
  DialogContentText,
  DialogTitle,
  DialogActions,
  IconButton,
  Typography,
} from "@mui/material";

import EditIcon from "@mui/icons-material/Edit";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";

import "../assets/main.css";

import {
  fetchDepartmentsPaginated,
  deleteRemoveDepartment,
  patchUpdateDepartment,
  postCreateDepartment,
} from "../js/departments";

import {
  Popup,
  POPUP_ERROR_COLOR,
  POPUP_SUCCESS_COLOR,
} from "../components/Loading";

import { MainHeader } from "../components/Header";

// ===================== HELPERS =====================
const truncateText = (text, maxLength) =>
  text
    ? text.length > maxLength
      ? text.substring(0, maxLength) + "..."
      : text
    : "";

// ===================== MAIN COMPONENT =====================
export default function Departments() {
  // ---- STATE ----
  const [mode, setMode] = useState("new");
  const [isDialogFormOpen, setIsDialogFormOpen] = useState(false);
  const [isDialogDeleteShow, setIsDialogDeleteShow] = useState(false);
  const [hasAttemptedSave, setHasAttemptedSave] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");

  const [popupOptions, setPopupOptions] = useState(null);
  const [isOperationLoading, setIsOperationLoading] = useState(false);
  const [department, setDepartment] = useState({
    DepartmentID: 0,
    Code: "",
    Name: "",
  });

  const [departmentToDelete, setDepartmentToDelete] = useState(null);

  const [departmentList, setDepartmentList] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isPaginating, setIsPaginating] = useState(false);

  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  const [searchTerm, setSearchTerm] = useState("");

  const skipAnimRef = useRef(false);

  // ---- HANDLERS ----
  const loadDepartments = useCallback(async (size, currentPage, search) => {
    try {
      const data = await fetchDepartmentsPaginated(
        size,
        currentPage,
        search,
        "",
      );

      setDepartmentList(data.Departments || []);
      setTotalCount(data.TotalDepartments || 0);
    } catch (err) {
      setPopupOptions({
        Heading: "Fetch Failed",
        HeadingStyle: { background: POPUP_ERROR_COLOR, color: "white" },
        Message: err.message,
      });
    }

    setIsLoading(false);
    setIsPaginating(false);
  }, []);

  // ---- EFFECTS ----
  useEffect(() => {
    if (!skipAnimRef.current) setIsLoading(true);
    skipAnimRef.current = false;
    const timer = setTimeout(() => {
      loadDepartments(pageSize, page, searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [loadDepartments, page, pageSize, searchTerm]);

  const handleDelete = async (id) => {
    setIsLoading(true);

    try {
      await deleteRemoveDepartment(id);

      await loadDepartments(pageSize, page, searchTerm);

      setPopupOptions({
        Heading: "Deleted",
        HeadingStyle: { background: POPUP_SUCCESS_COLOR, color: "white" },
        Message: "Department removed successfully",
      });
    } catch (err) {
      setPopupOptions({
        Heading: "Delete Failed",
        HeadingStyle: { background: POPUP_ERROR_COLOR, color: "white" },
        Message: err.message,
      });
    }

    setIsLoading(false);
    setIsDialogDeleteShow(false);
    setDepartmentToDelete(null);
  };

  const handleSave = async () => {
    setHasAttemptedSave(true);
    const password = (department.SaltedHashedPassword || "").trim();
    const passwordInvalid = mode === "new" && !password;
    const confirmInvalid = mode === "new" && (!confirmPassword.trim() || confirmPassword !== department.SaltedHashedPassword);
    if (!department.Code.trim() || !department.Name.trim() || passwordInvalid || confirmInvalid) return;

    try {
      if (mode === "new") {
        await postCreateDepartment(department);
      } else {
        await patchUpdateDepartment(department);
      }

      await loadDepartments(pageSize, page, searchTerm);

      setIsDialogFormOpen(false);

      setPopupOptions({
        Heading: "Success",
        HeadingStyle: { background: POPUP_SUCCESS_COLOR, color: "white" },
        Message: "Saved successfully",
      });
    } catch (err) {
      setPopupOptions({
        Heading: "Save Failed",
        HeadingStyle: { background: POPUP_ERROR_COLOR, color: "white" },
        Message: err.message,
      });
    }
  };

  return (
    <>
      <MainHeader pageName="departments">

        {/* ===================== POPUP ===================== */}
        <Popup
          popupOptions={popupOptions}
          closeButtonActionHandler={() => setPopupOptions(null)}
        />

        {/* ===================== PAGE ===================== */}
        <Box>
          {/* TOP BAR */}
          <Box sx={{ display: "flex", justifyContent: "space-between", py: 1.5 }}>
            <TextField
              size="small"
              label="Search department"
              value={searchTerm}
              onChange={(e) => {
                setPage(0);
                setSearchTerm(e.target.value);
              }}
            />

            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => {
                setMode("new");
                setDepartment({
                  DepartmentID: 0,
                  Code: "",
                  Name: "",
                  SaltedHashedPassword: "",
                });
                setConfirmPassword("");
                setHasAttemptedSave(false);
                setIsDialogFormOpen(true);
              }}
            >
              Add Department
            </Button>
          </Box>

          {/* TABLE */}
          <Box>
          <TableContainer component={Paper}>
            <Box
            sx={{
                flex: 1,
                overflowY: "auto",
                minHeight: 0,
            }}
            >
            <Table stickyHeader size="small" sx={{ tableLayout: "fixed" }}>
                <TableHead sx={{ "& .MuiTableCell-root": { bgcolor: "primary.main", color: "white", fontWeight: 700, letterSpacing: "0.05em" } }}>
                  <TableRow>
                    <TableCell sx={{ width: "22%" }}>DEPARTMENT CODE</TableCell>
                    <TableCell>DEPARTMENT NAME</TableCell>
                    <TableCell sx={{ width: "96px" }} />
                  </TableRow>
                </TableHead>

                <TableBody sx={{ opacity: isLoading ? 0 : 1, transform: isLoading ? "translateY(12px)" : "translateY(0)", transition: "opacity 0.25s ease, transform 0.25s ease" }}>
                  {isPaginating
                    ? Array.from({ length: pageSize }).map((_, i) => (
                        <TableRow key={i} sx={{ height: 50 }}>
                          <TableCell><Skeleton /></TableCell>
                          <TableCell><Skeleton /></TableCell>
                          <TableCell align="right">
                            <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1 }}>
                              <Skeleton variant="circular" width={32} height={32} />
                              <Skeleton variant="circular" width={32} height={32} />
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))
                    : departmentList.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={3}
                        align="center"
                        sx={{ fontStyle: "italic", color: "text.secondary", py: 2 }}
                      >
                        No departments found
                      </TableCell>
                    </TableRow>
                  ) : (
                    departmentList.map((d) => (
                      <TableRow key={d.DepartmentID}>
                        <TableCell sx={{ fontWeight: "bold" }}>
                          {d.Code}
                        </TableCell>
                        <TableCell sx={{ fontStyle: "italic" }}>
                          {truncateText(d.Name, 80)}
                        </TableCell>

                        <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "flex-end",
                              gap: 1,
                            }}
                          >
                            <IconButton
                              title="Edit"
                              color="edit"
                              onClick={() => {
                                setDepartment(d);
                                setMode("edit");
                                setHasAttemptedSave(false);
                                setIsDialogFormOpen(true);
                              }}
                            >
                              <EditIcon />
                            </IconButton>

                            <IconButton
                              title="Delete"
                              color="delete"
                              onClick={() => {
                                setDepartmentToDelete(d);
                                setIsDialogDeleteShow(true);
                              }}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))
                    )
                  }
                </TableBody>
              </Table>
              </Box>

              <TablePagination
                sx={{
                  borderTop: "1px solid",
                  borderColor: "divider",
                  bgcolor: "#f8f9fa",
                  "& .MuiTablePagination-displayedRows": { fontWeight: 600 },
                  "& .MuiTablePagination-select": { fontWeight: 500 },
                  "& .MuiIconButton-root": {
                    border: "1px solid",
                    borderColor: "divider",
                    borderRadius: "4px",
                    mx: 0.25,
                    "&:hover:not(.Mui-disabled)": {
                      bgcolor: "primary.main",
                      color: "white",
                      borderColor: "primary.main",
                    },
                  },
                  "& .MuiInputBase-root": {
                    border: "1px solid",
                    borderColor: "divider",
                    borderRadius: "4px",
                    px: 1,
                    "&:hover": { borderColor: "text.secondary" },
                  },
                }}
                component="div"
                count={totalCount}
                rowsPerPage={pageSize}
                page={page}
                rowsPerPageOptions={[5, 10, 25]}
                onPageChange={(_, newPage) => {
                  skipAnimRef.current = true;
                  setIsPaginating(true);
                  setPage(newPage);
                }}
                onRowsPerPageChange={(event) => {
                  skipAnimRef.current = true;
                  setIsPaginating(true);
                  setPageSize(Number.parseInt(event.target.value, 10));
                  setPage(0);
                }}
              />
            </TableContainer>
          </Box>
        </Box>

        {/* DELETE DIALOG */}
        <Dialog
          open={isDialogDeleteShow}
          onClose={() => {
            setIsDialogDeleteShow(false);
            setDepartmentToDelete(null);
          }}
        >
          <DialogTitle sx={{ backgroundColor: "error.dark" }}>
            Delete Department
          </DialogTitle>
          <DialogContent sx={{ pt: 3 }}>
            <DialogContentText sx={{ color: "text.primary", mb: 2 }}>
              This action cannot be undone.
            </DialogContentText>
            <Box
              sx={{
                px: 2,
                py: 1.5,
                borderRadius: 1.5,
                backgroundColor: "rgba(180, 35, 24, 0.06)",
                border: "1px solid",
                borderColor: "error.light",
              }}
            >
              <Typography variant="subtitle1" sx={{ fontWeight: 800, color: "error.dark" }}>
                {departmentToDelete?.Code || "Selected department"}
              </Typography>
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                All data associated with this department will be permanently removed.
              </Typography>
            </Box>
          </DialogContent>

          <DialogActions
            sx={{
              justifyContent: "flex-end",
            }}
          >
            <Button
              color="secondary"
              variant="contained"
              disabled={isOperationLoading}
              onClick={() => {
                setIsDialogDeleteShow(false);
                setDepartmentToDelete(null);
              }}
            >
              Cancel
            </Button>
            <Button
              color="error"
              variant="outlined"
              disabled={isOperationLoading}
              onClick={() => handleDelete(departmentToDelete?.DepartmentID)}
            >
              {isOperationLoading ? <CircularProgress size={20} color="inherit" /> : "Delete"}
            </Button>
          </DialogActions>
        </Dialog>

        {/* FORM DIALOG */}
        <Dialog
          open={isDialogFormOpen}
          onClose={() => {
            setIsDialogFormOpen(false);
            setHasAttemptedSave(false);
            setConfirmPassword("");
          }}
          onKeyDown={(e) => { if (e.key === "Enter") handleSave(); }}
        >
          <DialogTitle sx={{ backgroundColor: "primary.main" }}>
            {mode === "new" ? "Add Department" : "Edit Department"}
          </DialogTitle>

          <DialogContent>
            <TextField
              margin="dense"
              label="Department Code"
              fullWidth
              required
              value={department.Code}
              onChange={(e) =>
                setDepartment((p) => ({ ...p, Code: e.target.value }))
              }
              error={hasAttemptedSave && !department.Code.trim()}
              helperText={hasAttemptedSave && !department.Code.trim() ? "Department code is required" : ""}
            />

            <TextField
              margin="dense"
              label="Department Name"
              fullWidth
              required
              value={department.Name}
              onChange={(e) =>
                setDepartment((p) => ({ ...p, Name: e.target.value }))
              }
              error={hasAttemptedSave && !department.Name.trim()}
              helperText={hasAttemptedSave && !department.Name.trim() ? "Department name is required" : ""}
            />

            <TextField
              margin="dense"
              label="Department Password"
              type="password"
              fullWidth
              required={mode === "new"}
              value={department.SaltedHashedPassword || ""}
              onChange={(e) =>
                setDepartment((p) => ({
                  ...p,
                  SaltedHashedPassword: e.target.value,
                }))
              }
              error={
                mode === "new" &&
                hasAttemptedSave &&
                !(department.SaltedHashedPassword || "").trim()
              }
              helperText={
                mode === "new" &&
                hasAttemptedSave &&
                !(department.SaltedHashedPassword || "").trim()
                  ? "Password is required"
                  : "Password must be at least 8 characters long"
              }
            />

            {mode === "new" && (
              <TextField
                margin="dense"
                label="Confirm Password"
                type="password"
                fullWidth
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                error={
                  hasAttemptedSave &&
                  (!confirmPassword.trim() ||
                    confirmPassword !== department.SaltedHashedPassword)
                }
                helperText={
                  hasAttemptedSave && !confirmPassword.trim()
                    ? "Please confirm your password"
                    : hasAttemptedSave &&
                        confirmPassword !== department.SaltedHashedPassword
                      ? "Passwords do not match"
                      : ""
                }
              />
            )}
          </DialogContent>

          <DialogActions>
            <Button onClick={handleSave} variant="contained">
              Save
            </Button>
            <Button onClick={() => setIsDialogFormOpen(false)}>Cancel</Button>
          </DialogActions>
        </Dialog>
      </MainHeader>
    </>
  );
}

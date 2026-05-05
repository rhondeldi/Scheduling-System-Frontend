import { useState, useCallback, useEffect } from "react";

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
  Dialog,
  DialogContent,
  DialogContentText,
  DialogTitle,
  DialogActions,
  IconButton,
} from "@mui/material";

import EditIcon from "@mui/icons-material/Edit";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";

import warning from "../assets/warning.png";

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

const truncateText = (text, maxLength) =>
  text ? (text.length > maxLength ? text.substring(0, maxLength) + "..." : text) : "";

export default function Departments() {
  const [mode, setMode] = useState("new");
  const [isDialogFormOpen, setIsDialogFormOpen] = useState(false);
  const [isDialogDeleteShow, setIsDialogDeleteShow] = useState(false);

  const [popupOptions, setPopupOptions] = useState(null);
  const [isOperationLoading, setIsOperationLoading] = useState(false);
  const [department, setDepartment] = useState({
    DepartmentID: null,
    Code: "",
    Name: "",
  });

  const [departmentToDelete, setDepartmentToDelete] = useState(null);

  const [departmentList, setDepartmentList] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  const [searchTerm, setSearchTerm] = useState("");

  const loadDepartments = useCallback(async (size, currentPage, search) => {
    setIsLoading(true);

    try {
      const data = await fetchDepartmentsPaginated(size, currentPage, search, "");

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
  }, []);

  useEffect(() => {
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

      <Popup
        popupOptions={popupOptions}
        closeButtonActionHandler={() => setPopupOptions(null)}
      />

      <Box>
        <Box sx={{ display: "flex", justifyContent: "space-between", p: 2 }}>
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
              setDepartment({ Code: "", Name: "" });
              setIsDialogFormOpen(true);
            }}
          >
            Add Department
          </Button>
        </Box>

        <Box px={4}>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>CODE</TableCell>
                  <TableCell>NAME</TableCell>
                  <TableCell />
                </TableRow>
              </TableHead>

              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={3} align="center">
                      <CircularProgress />
                    </TableCell>
                  </TableRow>
                ) : departmentList.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={6} align="center" sx={{ fontWeight: 'bold', py: 15 }}>
                                No departments found.
                            </TableCell>
                        </TableRow>
                ) : (
                  departmentList.map((d) => (
                    <TableRow key={d.DepartmentID}>
                      <TableCell sx={{ fontWeight: "bold" }}>{d.Code}</TableCell>
                      <TableCell sx={{ fontStyle: "italic" }}>{truncateText(d.Name, 80)}</TableCell>

                      <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "flex-end",
                            gap: 1,
                          }}
                        >
                          <IconButton
                            color="edit"
                            onClick={() => {
                              setDepartment(d);
                              setMode("edit");
                              setIsDialogFormOpen(true);
                            }}
                          >
                            <EditIcon />
                          </IconButton>

                          <IconButton
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
                )}
              </TableBody>
            </Table>

            <TablePagination
              component="div"
              count={totalCount}
              rowsPerPage={pageSize}
              page={page}
              rowsPerPageOptions={[5, 10, 25]}
              onPageChange={(_, newPage) => {
                setPage(newPage);
              }}
              onRowsPerPageChange={(event) => {
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
        <DialogTitle sx={{backgroundColor: '#C62828',}}>Delete Department</DialogTitle>
        <DialogContent sx={{ textAlign: "center", pt: 3 }}>
          <img
            src={warning}
            alt="Warning"
            style={{
              width: 80,
              height: 80,
              marginBottom: 8,
            }}
          />
          <DialogContentText>
            {`This action cannot be undone. All data associated with ${departmentToDelete?.Code || "this department"} will be lost.`}
          </DialogContentText>
        </DialogContent>

        <DialogActions
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 1.5,
            pb: 3,
          }}
        >
          <Button
            color="error"
            variant="contained"
            disabled={isOperationLoading}
            onClick={() => handleDelete(departmentToDelete?.ID)}
            sx={{ width: "50%" }}
          >
            {isOperationLoading ? <CircularProgress size={20} /> : "Confirm"}
          </Button>
          <Button
            variant="outlined"
            disabled={isOperationLoading}
            sx={{ width: "50%" }}
            onClick={() => {
              setIsDialogDeleteShow(false);
              setDepartmentToDelete(null);
            }}
          >
            Cancel
          </Button>
        </DialogActions>
      </Dialog>

      {/* FORM DIALOG */}
      <Dialog open={isDialogFormOpen} onClose={() => setIsDialogFormOpen(false)}>
        <DialogTitle sx={{ backgroundColor: '#2e6417' }}>{mode === "new" ? "Add Department" : "Edit Department"}</DialogTitle>

        <DialogContent>
          <TextField
            margin="dense"
            label="Department Code"
            fullWidth
            value={department.Code}
            onChange={(e) =>
              setDepartment((p) => ({ ...p, Code: e.target.value }))
            }
          />

          <TextField
            margin="dense"
            label="Department Name"
            fullWidth
            value={department.Name}
            onChange={(e) =>
              setDepartment((p) => ({ ...p, Name: e.target.value }))
            }
          />
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

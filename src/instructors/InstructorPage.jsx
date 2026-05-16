import { useCallback, useEffect, useState, useRef } from "react";

import {
  Loading,
  Popup,
  POPUP_ERROR_COLOR,
  POPUP_SUCCESS_COLOR,
} from "../components/Loading";

import "../assets/main.css";
import "./TimeTable.css";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import IconButton from "@mui/material/IconButton";

import warning from "../assets/warning.png";

import "./TimeTableDropdowns.css";
import "./instructors.css";

import { fetchAllDepartments, fetchWho } from "../js/departments";
import {
  fetchInstructors,
  fetchInstructorResources,
} from "../js/instructors_v2";

import VisibilityIcon from "@mui/icons-material/Visibility";

import {
  Box,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Button,
  Paper,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  CircularProgress,
  Skeleton,
  TablePagination,
  Dialog,
  DialogTitle,
  DialogContentText,
  DialogContent,
  DialogActions,
  TextField,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";

import InstructorDataView from "./InstructorDataView";
import { deleteRemoveInsturctor } from "../js/instructors";

import { MainHeader } from "../components/Header";

function InstructorPage() {
  const [mode, setMode] = useState(""); // 3 mode - new, view, edit
  const [popupOptions, setPopupOptions] = useState(null);

  const [isOperationLoading, setIsOperationLoading] = useState(false);
  const [instructors, setInstructors] = useState([]); // load array of instructs when a department is selected
  const [selectedInstructor, setSelectedInstructor] = useState(null);

  /////////////////////////////////////////////////////////////////////////////////
  //                     LOAD GUARD COMPONENT STATES
  /////////////////////////////////////////////////////////////////////////////////

  const [IsLoading, setIsLoading] = useState(false);

  /////////////////////////////////////////////////////////////////////////////////
  //                       STATES FOR FETCHED DATA
  /////////////////////////////////////////////////////////////////////////////////

  const [departments, setDepartments] = useState([]); // fetch on page load

  useEffect(() => {
    const useEffectAsyncs = async () => {
      try {
        setIsLoading(true);

        const who = await fetchWho();
        const loggedInDepartmentID = Number(who);

        if (!Number.isInteger(loggedInDepartmentID)) {
          throw new Error("Unable to resolve logged-in department");
        }

        const all_departments = await fetchAllDepartments();
        const loggedInDepartment = all_departments.find(
          (department) =>
            Number(department.DepartmentID) === loggedInDepartmentID,
        );

        if (!loggedInDepartment) {
          throw new Error("Logged-in department data was not found");
        }

        setDepartments([loggedInDepartment]);
        setSelectedDepartment(loggedInDepartment);
        setDepartmentID(loggedInDepartment.DepartmentID);
        setIsLoading(false);
      } catch (err) {
        setPopupOptions({
          Heading: "Failed to Fetch All Department Data",
          HeadingStyle: { background: POPUP_ERROR_COLOR, color: "white" },
          Message: `${err}`,
        });
        setIsLoading(false);
      }
    };

    useEffectAsyncs();
  }, []);

  const skipAnimRef = useRef(false);

  const load_instructors = useCallback(async (
    department_id,
    page_size,
    new_page,
    search_term = "",
  ) => {
    try {
      let fetched_instructors;

      if (search_term) {
        const [firstnameResults, lastnameResults, initialResults] =
          await Promise.all([
            fetchInstructors(department_id, page_size, new_page, search_term, "", ""),
            fetchInstructors(department_id, page_size, new_page, "", "", search_term),
            fetchInstructors(department_id, page_size, new_page, "", search_term, ""),
          ]);

        const combined = [
          ...(firstnameResults.Instructors || []),
          ...(lastnameResults.Instructors || []),
          ...(initialResults.Instructors || []),
        ];

        const uniqueInstructors = [];
        const seenIds = new Set();
        for (const instructor of combined) {
          if (!seenIds.has(instructor.InstructorID)) {
            seenIds.add(instructor.InstructorID);
            uniqueInstructors.push(instructor);
          }
        }

        fetched_instructors = {
          Instructors: uniqueInstructors,
          TotalInstructors: uniqueInstructors.length,
        };
      } else {
        fetched_instructors = await fetchInstructors(
          department_id,
          page_size,
          new_page,
          "",
          "",
          "",
        );
      }

      setInstructors(fetched_instructors.Instructors);
      setTotalCount(fetched_instructors.TotalInstructors);
    } catch (err) {
      setPopupOptions({
        Heading: "Failed to fetch instructors",
        HeadingStyle: { background: POPUP_ERROR_COLOR, color: "white" },
        Message: `${err}`,
      });
    }

    setLoading(false);
    setIsPaginating(false);
  }, []);

  /////////////////////////////////////////////////////////////////////////////////
  //                       DROPDOWN SELECTION STATES
  /////////////////////////////////////////////////////////////////////////////////

  const [departmentID, setDepartmentID] = useState(""); // use for department selection drop down
  const [selectedDepartment, setSelectedDepartment] = useState(""); // will be use when viewing the instructor to display which department name is that instructor

  /////////////////////////////////////////////////////////////////////////////////
  //                       PAGE LOAD PROCESS
  /////////////////////////////////////////////////////////////////////////////////

  const [loading, setLoading] = useState(false);
  const [isPaginating, setIsPaginating] = useState(false);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(5);
  const [totalCount, setTotalCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");

  // Sanitize function to allow only letters, spaces, hyphens, and apostrophes
  const sanitizeSearchTerm = (value) => {
    return value.replace(/[^a-zA-Z\s\-']/g, '');
  };

  useEffect(() => {
    if (!Number.isInteger(Number.parseInt(departmentID, 10))) {
      return;
    }

    if (!skipAnimRef.current) setLoading(true);
    skipAnimRef.current = false;
    const debounceTimer = setTimeout(() => {
      load_instructors(departmentID, pageSize, page, searchTerm);
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [departmentID, load_instructors, page, pageSize, searchTerm]);

  const handleChangePage = (event, new_page) => {
    skipAnimRef.current = true;
    setIsPaginating(true);
    setPage(new_page);
  };

  const handleChangeRowsPerPage = (event) => {
    skipAnimRef.current = true;
    setIsPaginating(true);
    const new_page_size = parseInt(event.target.value, 10);
    setPageSize(new_page_size);
    setPage(0);
  };

  const [isDialogDeleteShow, setIsDialogDeleteShow] = useState(false);
  const [instructorToDelete, setInstructorToDelete] = useState(null);
  const handleInstructorDelete = async (instructor_id) => {
    setIsOperationLoading(true);

    try {
      await deleteRemoveInsturctor(instructor_id);
      await load_instructors(
        departmentID,
        pageSize,
        page,
        searchTerm,
      );
      setPopupOptions({
        Heading: "Delete Success",
        HeadingStyle: { background: POPUP_SUCCESS_COLOR, color: "white" },
        Message: "The instructor was successfully deleted.",
      });
    } catch (err) {
      setPopupOptions({
        Heading: "Delete Failed",
        HeadingStyle: { background: POPUP_ERROR_COLOR, color: "white" },
        Message: `${err}`,
      });
    }

    setInstructorToDelete(null);
    setIsOperationLoading(false);
    setIsDialogDeleteShow(false);

  };

  const handleDepartmentChange = (e) => {
    const nextDepartmentID = e.target.value;
    setDepartmentID(nextDepartmentID);
    const selected = departments.find((department) => {
      return department.DepartmentID === nextDepartmentID;
    });

    if (selected) {
      setSelectedDepartment(selected);
    }

    setPage(0);
  };

  return (
    <>
      <MainHeader pageName={"instructors"}>
        <Popup
          popupOptions={popupOptions}
          closeButtonActionHandler={() => {
            setPopupOptions(null);
          }}
        />

        <Loading IsLoading={IsLoading} />

        <Box display={!mode ? "block" : "none"}>
          <Box
            py={1}
            display={"flex"}
            justifyContent={"space-between"}
            alignItems={"center"}
          >
            <TextField
              disabled={!Number.isInteger(Number.parseInt(departmentID, 10))}
              sx={{ minWidth: 300 }}
              size="small"
              label="Search instructors"
              value={searchTerm}
              onChange={(e) => {
                setPage(0);
                setSearchTerm(e.target.value);
              }}
            />

            <Button
              disabled={!Number.isInteger(Number.parseInt(departmentID, 10))}
              endIcon={<AddIcon />}
              size="small"
              color="secondary"
              variant="contained"
              onClick={() => {
                setIsLoading(true);

                const new_instructor = {
                  DepartmentID: departmentID,
                  FirstName: "",
                  LastName: "",
                  MiddleInitial: "",
                };

                setSelectedInstructor(new_instructor);
                setIsLoading(false);

                setMode("new");
              }}
            >
              Add New Instructor
            </Button>
          </Box>
        </Box>

        <Box>
          {mode === "" ? (
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
                  <TableRow sx={{ height: 1 }}>
                    <TableCell sx={{ width: "32%" }}>LAST NAME</TableCell>
                    <TableCell sx={{ width: "32%" }}>FIRST NAME</TableCell>
                    <TableCell sx={{ width: "20%" }}>MIDDLE INITIAL</TableCell>
                    <TableCell sx={{ width: "112px" }}></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody sx={{ opacity: loading ? 0 : 1, transform: loading ? "translateY(12px)" : "translateY(0)", transition: "opacity 0.25s ease, transform 0.25s ease" }}>
                  {isPaginating
                    ? Array.from({ length: pageSize }).map((_, i) => (
                        <TableRow key={i} sx={{ height: 50 }}>
                          <TableCell><Skeleton /></TableCell>
                          <TableCell><Skeleton /></TableCell>
                          <TableCell><Skeleton /></TableCell>
                          <TableCell align="right">
                            <Box sx={{ display: "flex", justifyContent: "flex-end", gap: "0.5em" }}>
                              <Skeleton variant="circular" width={32} height={32} />
                              <Skeleton variant="circular" width={32} height={32} />
                              <Skeleton variant="circular" width={32} height={32} />
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))
                    : !departmentID ? (
                      <TableRow>
                        <TableCell colSpan={4} align="center" sx={{ fontStyle: "italic", color: "text.secondary", py: 2 }}>
                          Please select a department first
                        </TableCell>
                      </TableRow>
                    ) : instructors.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} align="center" sx={{ fontStyle: "italic", color: "text.secondary", py: 2 }}>
                          No instructors found
                        </TableCell>
                      </TableRow>
                    ) : (
                    instructors.map((instructor) => (
                      <TableRow key={instructor.InstructorID}>
                        <TableCell>{instructor.LastName}</TableCell>
                        <TableCell>{instructor.FirstName}</TableCell>
                        <TableCell>{instructor.MiddleInitial}</TableCell>
                        <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5em', flexWrap: 'nowrap' }}>
                            <IconButton
                              title="View"
                              color="view"
                              disabled={loading}
                              onClick={() => {
                                setSelectedInstructor(instructor);
                                setMode("view");
                              }}
                            >
                              <VisibilityIcon />
                            </IconButton>
                            <IconButton
                              title="Delete"
                              color="delete"
                              disabled={loading}
                              onClick={() => {
                                setInstructorToDelete(instructor);
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
              <Box
                sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    borderTop: "1px solid",
                    borderColor: "divider",
                    bgcolor: "#f8f9fa",
                    px: 1,
                    py: 0.5,
                }}
                >
                {/* LEFT SIDE */}
                <Button
                    variant="contained"
                    color="primary"
                    size="small"
                    endIcon={<OpenInNewIcon />}
                    onClick={() => window.open("/view_instructors/", "_blank")}
                >
                    Cross-Department Schedule View
                </Button>

                {/* RIGHT SIDE */}
                <TablePagination
                    component="div"
                    count={totalCount}
                    rowsPerPage={pageSize}
                    page={page}
                    rowsPerPageOptions={[5, 10, 25]}
                    onPageChange={handleChangePage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                    sx={{
                    "& .MuiTablePagination-toolbar": {
                        minHeight: "40px",
                    },
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
                />
                </Box>
            </TableContainer>
          ) : null}
        </Box>
        <Dialog
          open={isDialogDeleteShow}
          onClose={() => {
            setIsDialogDeleteShow(false);
            setInstructorToDelete(null);
          }}
          aria-labelledby="alert-dialog-title"
          aria-describedby="alert-dialog-description"
        >
          <DialogTitle id="alert-dialog-title">Remove Instructor</DialogTitle>

          <DialogContent>
            <DialogContentText id="alert-dialog-description">
              {`Are you sure you want to remove "${instructorToDelete?.FirstName} ${instructorToDelete?.MiddleInitial} ${instructorToDelete?.LastName}"?`}
            </DialogContentText>
          </DialogContent>

          <DialogActions>
            <Button
              variant="outlined"
              onClick={() => {
                handleInstructorDelete(instructorToDelete?.InstructorID);
              }}
            >
              Yes
            </Button>

            <Button
              variant="outlined"
              onClick={() => {
                setIsDialogDeleteShow(false);
                setInstructorToDelete(null);
              }}
            >
              No
            </Button>
          </DialogActions>
        </Dialog>

        {mode === "" ? null : (
          <InstructorDataView
            mode={mode}
            setMode={setMode}
            selectedDepartment={selectedDepartment}
            selectedInstructor={selectedInstructor}
            setSelectedInstructor={setSelectedInstructor}
            onInstructorDataViewClose={async () => {
              setMode("");
              setSelectedInstructor(null);
              await load_instructors(
                departmentID,
                pageSize,
                page,
                searchTerm,
              );
            }}
            reloadInstructorsTable={async () => {
              await load_instructors(
                departmentID,
                pageSize,
                page,
                searchTerm,
              );
            }}
            departments={departments}
            popupOptions={popupOptions}
            setPopupOptions={setPopupOptions}
          />
        )}
      </MainHeader>
    </>
  );
}

export default InstructorPage;

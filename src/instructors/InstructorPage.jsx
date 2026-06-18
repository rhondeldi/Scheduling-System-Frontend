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
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import IconButton from "@mui/material/IconButton";

import "./TimeTableDropdowns.css";
import "./instructors.css";

import { fetchAllDepartments, fetchWho } from "../js/departments";
import {
  fetchInstructors,
  fetchInstructorResources,
  fetchInstructorSubjects,
} from "../js/instructors_v2";

import PreviewIcon from "@mui/icons-material/Preview";

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
  Chip,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import Tooltip from "@mui/material/Tooltip";

import InstructorDataView from "./InstructorDataView";
import { deleteRemoveInsturctor } from "../js/instructors";

import { MainHeader } from "../components/Header";

// short labels for each supported semester, matching the backend's
// HeldUnitsPerSemester ordering (0 = 1st sem, 1 = 2nd sem, 2 = Mid-year).
const SEMESTER_SHORT_LABELS = ["1st", "2nd", "Mid-yr"];

// Renders an instructor's held units broken down per semester. Each semester's
// value sits beside its short label; the unit cap (MaxUnits) is shown once
// since it applies to every semester independently. A value exceeding the cap
// is highlighted. Falls back to the combined total if the backend response
// predates the per-semester breakdown.
function HeldUnitsPerSemesterCell({ instructor }) {
  const cap = instructor.MaxUnits ?? 32;
  const perSemester = instructor.HeldUnitsPerSemester;

  if (!Array.isArray(perSemester)) {
    return `${instructor.HeldUnits ?? 0} / ${cap}`;
  }

  return (
    <Box sx={{ display: "inline-flex", flexDirection: "column", minWidth: 64 }}>
      {perSemester.map((held, idx) => {
        const value = held ?? 0;
        return (
          <Box
            key={idx}
            sx={{
              display: "flex",
              justifyContent: "space-between",
              gap: 1.5,
              lineHeight: 1.4,
            }}
          >
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              {SEMESTER_SHORT_LABELS[idx] ?? `S${idx + 1}`}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                fontWeight: 600,
                color: value > cap ? "error.main" : "text.primary",
              }}
            >
              {value}
            </Typography>
          </Box>
        );
      })}
    </Box>
  );
}

function InstructorPage({ adminMode = false, pageName = "instructors" }) {
  const [mode, setMode] = useState(""); // 3 mode - new, view, edit
  const [popupOptions, setPopupOptions] = useState(null);

  const [isOperationLoading, setIsOperationLoading] = useState(false);
  const [instructors, setInstructors] = useState([]); // load array of instructs when a department is selected
  const [instructorSubjects, setInstructorSubjects] = useState({}); // map: InstructorID -> [{ SubjectID, Code, Name, Units }]
  const [subjectsLoading, setSubjectsLoading] = useState(false);
  const [selectedInstructor, setSelectedInstructor] = useState(null);
  const [autoOpenInstructorPrintDialog, setAutoOpenInstructorPrintDialog] =
    useState(false);

  /////////////////////////////////////////////////////////////////////////////////
  //                     LOAD GUARD COMPONENT STATES
  /////////////////////////////////////////////////////////////////////////////////

  const [IsLoading, setIsLoading] = useState(true);

  /////////////////////////////////////////////////////////////////////////////////
  //                       STATES FOR FETCHED DATA
  /////////////////////////////////////////////////////////////////////////////////

  const [departments, setDepartments] = useState([]); // fetch on page load

  useEffect(() => {
    const useEffectAsyncs = async () => {
      try {
        setIsLoading(true);

        const all_departments = await fetchAllDepartments();

        if (adminMode) {
          setDepartments(all_departments);
          setIsLoading(false);
        } else {
          const who = await fetchWho();
          const loggedInDepartmentID = Number(who);

          if (!Number.isInteger(loggedInDepartmentID)) {
            throw new Error("Unable to resolve logged-in department");
          }

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
          setLoading(true); // batch with setIsLoading so no gap renders between them
          setIsLoading(false);
        }
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
  }, [adminMode]);

  const skipAnimRef = useRef(false);

  const load_instructors = useCallback(
    async (department_id, page_size, new_page, search_term = "") => {
      try {
        let fetched_instructors;

        if (search_term) {
          const [firstnameResults, lastnameResults, initialResults] =
            await Promise.all([
              fetchInstructors(
                department_id,
                page_size,
                new_page,
                search_term,
                "",
                "",
              ),
              fetchInstructors(
                department_id,
                page_size,
                new_page,
                "",
                "",
                search_term,
              ),
              fetchInstructors(
                department_id,
                page_size,
                new_page,
                "",
                search_term,
                "",
              ),
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

        const sortedInstructors = [
          ...(fetched_instructors.Instructors || []),
        ].sort((a, b) => {
          const lastNameCompare = (a.LastName || "").localeCompare(
            b.LastName || "",
            undefined,
            { sensitivity: "base" },
          );

          if (lastNameCompare !== 0) {
            return lastNameCompare;
          }

          return (a.FirstName || "").localeCompare(
            b.FirstName || "",
            undefined,
            { sensitivity: "base" },
          );
        });

        setInstructors(sortedInstructors);
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
    },
    [],
  );

  // Fetch the designated (assigned) subjects for each instructor on the current
  // page. Runs whenever the displayed instructors change (page, search, reload).
  useEffect(() => {
    if (instructors.length === 0) {
      setInstructorSubjects({});
      return;
    }

    let cancelled = false;
    setSubjectsLoading(true);

    (async () => {
      const entries = await Promise.all(
        instructors.map(async (instructor) => {
          try {
            const subjects = await fetchInstructorSubjects(
              instructor.InstructorID,
            );
            return [
              instructor.InstructorID,
              Array.isArray(subjects) ? subjects : [],
            ];
          } catch {
            return [instructor.InstructorID, []];
          }
        }),
      );

      if (!cancelled) {
        setInstructorSubjects(Object.fromEntries(entries));
        setSubjectsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [instructors]);

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
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");

  // Sanitize function to allow only letters, spaces, hyphens, and apostrophes
  const sanitizeSearchTerm = (value) => {
    return value.replace(/[^a-zA-Z\s\-']/g, "");
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
      await load_instructors(departmentID, pageSize, page, searchTerm);
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

  // duplicate detection (admin mode)

  const [duplicateInstructorNames, setDuplicateInstructorNames] = useState(
    new Set(),
  );

  useEffect(() => {
    if (
      !adminMode ||
      !Number.isInteger(Number.parseInt(departmentID, 10)) ||
      departments.length === 0
    ) {
      setDuplicateInstructorNames(new Set());
      return;
    }

    const checkDuplicates = async () => {
      const otherDepts = departments.filter(
        (d) => Number(d.DepartmentID) !== Number(departmentID),
      );

      const results = await Promise.all(
        otherDepts.map((d) =>
          fetchInstructors(d.DepartmentID, 999, 0, "", "", "").catch(() => ({
            Instructors: [],
          })),
        ),
      );

      const otherNames = new Set();
      for (const result of results) {
        for (const instructor of result.Instructors || []) {
          otherNames.add(
            `${instructor.FirstName} ${instructor.LastName}`
              .toLowerCase()
              .trim(),
          );
        }
      }

      setDuplicateInstructorNames(otherNames);
    };

    checkDuplicates();
  }, [adminMode, departmentID, departments]);

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
      <MainHeader pageName={pageName}>
        <Popup
          popupOptions={popupOptions}
          closeButtonActionHandler={() => {
            setPopupOptions(null);
          }}
        />

        <Loading IsLoading={IsLoading} />

        <Box display={!mode ? "block" : "none"}>
          {adminMode && (
            <Box sx={{ mb: 2 }}>
              <FormControl size="small" sx={{ minWidth: 300 }}>
                <InputLabel id="admin-instructor-dept-label">
                  Select Department
                </InputLabel>
                <Select
                  labelId="admin-instructor-dept-label"
                  value={departmentID}
                  label="Select Department"
                  onChange={handleDepartmentChange}
                >
                  {departments.map((d) => (
                    <MenuItem key={d.DepartmentID} value={d.DepartmentID}>
                      {d.Code} — {d.Name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          )}
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              paddingBlock: "0.6em",
            }}
          >
            <TextField
              disabled={!Number.isInteger(Number.parseInt(departmentID, 10))}
              sx={{ minWidth: 300 }}
              size="small"
              label="Search instructors"
              value={searchTerm}
              onChange={(e) => {
                setPage(0);
                setSearchTerm(sanitizeSearchTerm(e.target.value));
              }}
            />

            {adminMode && (
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
                Add New Instructor to {selectedDepartment?.Code}
              </Button>
            )}
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
                  <TableHead
                    sx={{
                      "& .MuiTableCell-root": {
                        bgcolor: "primary.main",
                        color: "white",
                        fontWeight: 700,
                        letterSpacing: "0.05em",
                      },
                    }}
                  >
                    <TableRow sx={{ height: 1 }}>
                      <TableCell sx={{ width: "20%" }}>LAST NAME</TableCell>
                      <TableCell sx={{ width: "20%" }}>FIRST NAME</TableCell>
                      <TableCell sx={{ width: "10%" }}>
                        MIDDLE INITIAL
                      </TableCell>
                      <TableCell sx={{ width: "12%" }}>EMPLOYEE TYPE</TableCell>
                      <TableCell sx={{ width: "10%" }}>UNITS HELD</TableCell>
                      <TableCell sx={{ width: "auto" }}>
                        ASSIGNED SUBJECTS
                      </TableCell>
                      <TableCell
                        sx={{ width: adminMode ? "92px" : "54px" }}
                      ></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody
                    sx={{
                      opacity: IsLoading || loading ? 0 : 1,
                      transform:
                        IsLoading || loading
                          ? "translateY(12px)"
                          : "translateY(0)",
                      transition: "opacity 0.25s ease, transform 0.25s ease",
                    }}
                  >
                    {IsLoading || loading || isPaginating ? (
                      Array.from({ length: pageSize }).map((_, i) => (
                        <TableRow key={i} sx={{ height: 50 }}>
                          <TableCell>
                            <Skeleton />
                          </TableCell>
                          <TableCell>
                            <Skeleton />
                          </TableCell>
                          <TableCell>
                            <Skeleton />
                          </TableCell>
                          <TableCell>
                            <Skeleton />
                          </TableCell>
                          <TableCell>
                            <Skeleton />
                          </TableCell>
                          <TableCell>
                            <Skeleton />
                          </TableCell>
                          <TableCell align="right">
                            <Box
                              sx={{
                                display: "flex",
                                justifyContent: "flex-end",
                                gap: "0.5em",
                              }}
                            >
                              <Skeleton
                                variant="circular"
                                width={32}
                                height={32}
                              />
                              <Skeleton
                                variant="circular"
                                width={32}
                                height={32}
                              />
                              <Skeleton
                                variant="circular"
                                width={32}
                                height={32}
                              />
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : !selectedDepartment ? (
                      <TableRow>
                        <TableCell
                          colSpan={7}
                          align="center"
                          sx={{
                            fontStyle: "italic",
                            color: "text.secondary",
                            py: 2,
                          }}
                        >
                          Please select a department first
                        </TableCell>
                      </TableRow>
                    ) : instructors.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={7}
                          align="center"
                          sx={{
                            fontStyle: "italic",
                            color: "text.secondary",
                            py: 2,
                          }}
                        >
                          No instructors found
                        </TableCell>
                      </TableRow>
                    ) : (
                      instructors.map((instructor) => (
                        <TableRow key={instructor.InstructorID}>
                          <TableCell>
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 0.5,
                              }}
                            >
                              {instructor.LastName}
                              {adminMode &&
                                duplicateInstructorNames.has(
                                  `${instructor.FirstName} ${instructor.LastName}`
                                    .toLowerCase()
                                    .trim(),
                                ) && (
                                  <Tooltip title="An instructor with this name already exists in another department">
                                    <WarningAmberIcon
                                      color="warning"
                                      fontSize="small"
                                    />
                                  </Tooltip>
                                )}
                            </Box>
                          </TableCell>
                          <TableCell>{instructor.FirstName}</TableCell>
                          <TableCell>{instructor.MiddleInitial}</TableCell>
                          <TableCell>
                            {instructor.EmploymentType === "part-time"
                              ? "Part-time"
                              : "Regular"}
                          </TableCell>
                          <TableCell>
                            <HeldUnitsPerSemesterCell
                              instructor={instructor}
                            />
                          </TableCell>
                          <TableCell>
                            {subjectsLoading ? (
                              <Skeleton />
                            ) : instructorSubjects[instructor.InstructorID]
                                ?.length ? (
                              <Box
                                sx={{
                                  display: "flex",
                                  flexWrap: "wrap",
                                  gap: 0.5,
                                }}
                              >
                                {instructorSubjects[
                                  instructor.InstructorID
                                ].map((subject) => (
                                  <Tooltip
                                    key={subject.SubjectID}
                                    title={subject.Name || ""}
                                  >
                                    <Chip
                                      label={subject.Code}
                                      size="small"
                                      variant="outlined"
                                    />
                                  </Tooltip>
                                ))}
                              </Box>
                            ) : (
                              <Typography
                                variant="body2"
                                sx={{
                                  color: "text.secondary",
                                  fontStyle: "italic",
                                }}
                              >
                                No assigned subjects
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell
                            align="right"
                            sx={{ whiteSpace: "nowrap" }}
                          >
                            <Box
                              sx={{
                                display: "flex",
                                justifyContent: "flex-end",
                                alignItems: "center",
                                gap: 0.75,
                                flexWrap: "nowrap",
                              }}
                            >
                              <IconButton
                                title="View Schedule"
                                color="view"
                                disabled={loading}
                                onClick={() => {
                                  setAutoOpenInstructorPrintDialog(false);
                                  setSelectedInstructor(instructor);
                                  setMode("view");
                                }}
                              >
                                <PreviewIcon />
                              </IconButton>
                              {adminMode && (
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
                              )}
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </Box>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: !adminMode ? "space-between" : "flex-end",
                  borderTop: "1px solid",
                  borderColor: "divider",
                  bgcolor: "#f8f9fa",
                  px: 1,
                }}
              >
                {!adminMode && (
                  <Button
                    variant="contained"
                    color="primary"
                    size="small"
                    endIcon={<OpenInNewIcon />}
                    onClick={() => window.open("/view_instructors/", "_blank")}
                  >
                    Cross-Department Schedule View
                  </Button>
                )}
                <TablePagination
                  sx={{
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
                  onPageChange={handleChangePage}
                  onRowsPerPageChange={handleChangeRowsPerPage}
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
          <DialogTitle
            id="alert-dialog-title"
            sx={{ backgroundColor: "error.dark" }}
          >
            Delete Instructor
          </DialogTitle>

          <DialogContent>
            <DialogContentText
              id="alert-dialog-description"
              sx={{ color: "text.primary", mb: 2 }}
            >
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
              <Typography
                variant="subtitle1"
                sx={{ fontWeight: 800, color: "error.dark" }}
              >
                {`${instructorToDelete?.FirstName ?? ""} ${instructorToDelete?.MiddleInitial ?? ""} ${instructorToDelete?.LastName ?? ""}`.trim() ||
                  "Selected instructor"}
              </Typography>
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                This instructor record will be permanently removed.
              </Typography>
            </Box>
          </DialogContent>

          <DialogActions sx={{ justifyContent: "flex-end" }}>
            <Button
              color="secondary"
              variant="contained"
              onClick={() => {
                setIsDialogDeleteShow(false);
                setInstructorToDelete(null);
              }}
            >
              Cancel
            </Button>

            <Button
              color="error"
              variant="outlined"
              onClick={() => {
                handleInstructorDelete(instructorToDelete?.InstructorID);
              }}
            >
              Delete
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
              await load_instructors(departmentID, pageSize, page, searchTerm);
            }}
            reloadInstructorsTable={async () => {
              await load_instructors(departmentID, pageSize, page, searchTerm);
            }}
            departments={departments}
            popupOptions={popupOptions}
            setPopupOptions={setPopupOptions}
            autoOpenPrintDialog={autoOpenInstructorPrintDialog}
            onAutoOpenPrintDialogHandled={() =>
              setAutoOpenInstructorPrintDialog(false)
            }
          />
        )}
      </MainHeader>
    </>
  );
}

export default InstructorPage;

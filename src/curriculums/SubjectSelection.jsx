import { useState, useEffect, useCallback, useRef } from "react";

import "@fontsource/roboto/300.css";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";

import {
  Box,
  TextField,
  Button,
  Typography,
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
  Checkbox,
  Tooltip,
} from "@mui/material";

import {
  Popup,
  POPUP_ERROR_COLOR,
  POPUP_WARNING_COLOR,
} from "../components/Loading";

import { fetchSubjects } from "../js/subjects";

// ===================== HELPERS =====================

const truncateText = (text, maxLength) => {
  if (!text) return "";
  return text.length > maxLength
    ? text.substring(0, maxLength) + "..."
    : text;
};

const get_subject_location = (curriculum, subject_id) => {
  if (!curriculum?.YearLevels?.length) return null;

  for (let y = 0; y < curriculum.YearLevels.length; y++) {
    const yl = curriculum.YearLevels[y];

    for (let s = 0; s < (yl?.Semesters || []).length; s++) {
      const sem = yl.Semesters[s];

      for (const sub of sem?.Subjects || []) {
        if (sub.ID === subject_id) {
          return {
            yearLevel: y + 1,
            semester: s + 1,
          };
        }
      }
    }
  }

  return null;
};

// ===================== COMPONENT =====================

export default function SubjectSelection({
  open,
  onClose,
  curriculum,
  setEditedCurriculum,
  yearSemSubjectTarget,
}) {
  // ===================== STATE =====================

  const [popupOptions, setPopupOptions] = useState(null);

  const [subjectList, setSubjectList] = useState([]);
  const [isTableLoading, setIsTableLoading] = useState(false);

  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(5);
  const [totalCount, setTotalCount] = useState(0);

  const [searchTerm, setSearchTerm] = useState("");

  const [selectedSubjects, setSelectedSubjects] = useState(new Set());
  const [selectedSubjectsData, setSelectedSubjectsData] = useState(new Map());

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  const skipAnimRef = useRef(false);
  const [isPaginating, setIsPaginating] = useState(false);

  // ===================== FETCH =====================

  const load_subjects = useCallback(async () => {
    try {
      const data = await fetchSubjects(pageSize, page, searchTerm);

      setSubjectList(data.Subjects || []);
      setTotalCount(data.TotalSubjects || 0);
    } catch (err) {
      setPopupOptions({
        Heading: "Failed to Fetch Subjects",
        HeadingStyle: { background: POPUP_ERROR_COLOR, color: "white" },
        Message: err.message,
      });
    } finally {
      setIsTableLoading(false);
    }
  }, [page, pageSize, searchTerm]);

  // ===================== SEARCH + TRANSITION =====================

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsTableLoading(true);
      load_subjects();
    }, 250);

    return () => clearTimeout(timer);
  }, [load_subjects]);

  // ===================== HANDLERS =====================

  const handleSubjectToggle = (id, data) => {
    const newSet = new Set(selectedSubjects);
    const newMap = new Map(selectedSubjectsData);

    if (newSet.has(id)) {
      newSet.delete(id);
      newMap.delete(id);
    } else {
      newSet.add(id);
      newMap.set(id, data);
    }

    setSelectedSubjects(newSet);
    setSelectedSubjectsData(newMap);
  };

  const handleAddSelectedSubjects = () => {
    if (!selectedSubjects.size) {
      setPopupOptions({
        Heading: "No Subjects Selected",
        HeadingStyle: { background: POPUP_WARNING_COLOR, color: "white" },
        Message: "Select at least one subject.",
      });
      return;
    }

    if (!yearSemSubjectTarget) {
      setPopupOptions({
        Heading: "No Target Semester",
        HeadingStyle: { background: POPUP_WARNING_COLOR, color: "white" },
        Message: "Select a year level and semester first.",
      });
      return;
    }

    const newCurriculum = structuredClone(curriculum);
    const subjects = Array.from(selectedSubjectsData.values());

    const duplicates = [];

    for (const sub of subjects) {
      if (get_subject_location(curriculum, sub.ID)) {
        duplicates.push(sub.Code);
        continue;
      }

      newCurriculum.YearLevels[
        yearSemSubjectTarget.index_year_level
      ].Semesters[
        yearSemSubjectTarget.index_semester
      ].Subjects.push(sub);
    }

    setEditedCurriculum(newCurriculum);

    if (duplicates.length) {
      setPopupOptions({
        Heading: "Already Existing Subjects",
        HeadingStyle: { background: POPUP_WARNING_COLOR, color: "white" },
        Message: `${duplicates.join(", ")} already exist in the curriculum.`,
      });
    }

    setSelectedSubjects(new Set());
    setSelectedSubjectsData(new Map());
    onClose();
  };

  // ===================== RENDER =====================

  return (
    <>
      <Popup
        popupOptions={popupOptions}
        closeButtonActionHandler={() => setPopupOptions(null)}
      />

      <Dialog
        open={open}
        onClose={onClose}
        fullWidth
        maxWidth="md"
        PaperProps={{
          sx: {
            height: "85vh",
            display: "flex",
            flexDirection: "column",
          },
        }}
      >
        <DialogTitle sx={{ backgroundColor: "#2e6417", color: "white" }}>
          ADD SUBJECT
        </DialogTitle>

        <DialogContent sx={{ display: "flex", flexDirection: "column", flex: 1 }}>
          {/* SEARCH */}
          <Box display="flex" justifyContent="space-between" p={1}>
            <TextField
              size="small"
              label="Search"
              value={searchTerm}
              onChange={(e) => {
                setPage(0);
                setSearchTerm(e.target.value);
              }}
            />
            {/* NAVIGATION BUTTONS */}
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
          </Box>

          {/* TABLE */}
          <TableContainer
            component={Paper}
            sx={{
              flex: 1,
              position: "relative",
              overflowY: "auto",
            }}
          >
            <Table size="small" sx={{ tableLayout: "fixed" }}>
              <TableHead
                sx={{
                    position: "sticky",
                    top: 0,
                    zIndex: 3,
                    backgroundColor: "white",
                  }}
              >
                <TableRow>
                  <TableCell sx={{ width: "60px" }}>Select</TableCell>
                  <TableCell sx={{ width: "70px" }}>ID</TableCell>
                  <TableCell sx={{ width: "120px" }}>Code</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell sx={{ width: "80px" }}>Lec</TableCell>
                  <TableCell sx={{ width: "80px" }}>Lab</TableCell>
                </TableRow>
              </TableHead>

              <TableBody
                sx={{
                  opacity: isTableLoading ? 0 : 1,
                  transform: isTableLoading
                    ? "translateY(10px)"
                    : "translateY(0)",
                  transition: "opacity 0.25s ease, transform 0.25s ease",
                }}
              >
                {!isTableLoading && subjectList.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      align="center"
                      sx={{
                        py: 3,
                        fontStyle: "italic",
                        color: "text.secondary",
                      }}
                    >
                      No subjects found
                    </TableCell>
                  </TableRow>
                ) : (
                  subjectList.map((subject) => {
                    const location = get_subject_location(curriculum, subject.ID);
                    const isDisabled = !!location;

                    return (
                      <TableRow
                        key={subject.ID}
                        sx={{
                          opacity: isDisabled ? 0.5 : 1,
                          transition: "all 0.2s ease",
                        }}
                        title={
                          isDisabled
                            ? `Already in Year ${location.yearLevel}, Semester ${location.semester}`
                            : ""
                        }
                      >
                        <TableCell>
                          <Checkbox
                            checked={
                              selectedSubjects.has(subject.ID) || isDisabled
                            }
                            disabled={isDisabled}
                            onChange={() =>
                              handleSubjectToggle(subject.ID, subject)
                            }
                          />
                        </TableCell>

                        <TableCell>{subject.ID}</TableCell>
                        <TableCell>{subject.Code}</TableCell>

                        <TableCell>
                          <span>{truncateText(subject.Name, 50)}</span>
                        </TableCell>

                        <TableCell>{subject.LecHours}</TableCell>
                        <TableCell>{subject.LabHours}</TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>

        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>

          <Button
            variant="contained"
            disabled={!selectedSubjects.size}
            onClick={handleAddSelectedSubjects}
          >
            Add ({selectedSubjects.size})
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
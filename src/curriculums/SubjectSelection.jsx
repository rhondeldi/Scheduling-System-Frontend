// ===================== IMPORTS =====================
import { useState, useEffect, useCallback } from "react";

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
} from "@mui/material";
import {
  Popup,
  POPUP_ERROR_COLOR,
  POPUP_WARNING_COLOR,
} from "../components/Loading";
import { fetchSubjects } from "../js/subjects";

// ===================== HELPERS =====================
const truncateText = (text, maxLength) => {
  if (!text) {
    return "";
  }

  if (text.length > maxLength) {
    return text.substring(0, maxLength) + "...";
  }
  return text;
};

const has_subject = (curriculum, subject_id) => {
  if (!curriculum?.YearLevels?.length) {
    return false;
  }

  for (
    let idx_yrlvl = 0;
    idx_yrlvl < curriculum.YearLevels.length;
    idx_yrlvl++
  ) {
    const semesters = curriculum.YearLevels[idx_yrlvl]?.Semesters || [];
    for (let idx_sem = 0; idx_sem < semesters.length; idx_sem++) {
      const subjects = semesters[idx_sem]?.Subjects || [];
      for (let idx_sub = 0; idx_sub < subjects.length; idx_sub++) {
        const subject = subjects[idx_sub];
        if (subject.ID === subject_id) {
          return true;
        }
      }
    }
  }

  return false;
};

// ===================== MAIN COMPONENT =====================
export default function SubjectSelection({
  open,
  onClose,
  curriculum,
  setEditedCurriculum,
  yearSemSubjectTarget,
}) {
  // ---- STATE ----
  const [popupOptions, setPopupOptions] = useState(null);

  const [subjectList, setSubjectList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(7);
  const [totalCount, setTotalCount] = useState(0);

  const [searchTerm, setSearchTerm] = useState("");

  const [jumpToPage, setJumpToPage] = useState("");
  const [selectedSubjects, setSelectedSubjects] = useState(new Set());
  const [selectedSubjectsData, setSelectedSubjectsData] = useState(new Map());

  const TABLE_ROW_HEIGHT = 41;
  const TABLE_BODY_HEIGHT = TABLE_ROW_HEIGHT * pageSize;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const emptyRows = Math.max(0, pageSize - subjectList.length);

  // ---- HANDLERS ----
  const load_subjects = useCallback(async (
    page_size,
    new_page,
    search = "",
  ) => {
    setIsLoading(true);
    try {
      const subjectsData = await fetchSubjects(
        page_size,
        new_page,
        search,
        search,
      );
      setSubjectList(subjectsData.Subjects);
      setTotalCount(subjectsData.TotalSubjects);
    } catch (err) {
      setPopupOptions({
        Heading: "Failed to Fetch Subjects",
        HeadingStyle: { background: POPUP_ERROR_COLOR, color: "white" },
        Message: `${err.message}`,
      });
    }
    setIsLoading(false);
  }, []);

  const handleJumpToPage = () => {
    const pageNumber = parseInt(jumpToPage, 10);
    if (pageNumber > 0 && pageNumber <= totalPages) {
      setPage(pageNumber - 1);
      setJumpToPage("");
    } else {
      setPopupOptions({
        Heading: "Invalid Page",
        HeadingStyle: { background: POPUP_WARNING_COLOR, color: "white" },
        Message: `Please enter a page number between 1 and ${totalPages}`,
      });
    }
  };

  const handleSubjectToggle = (subjectId, subjectData = null) => {
    const newSelected = new Set(selectedSubjects);
    const newSelectedData = new Map(selectedSubjectsData);
    if (newSelected.has(subjectId)) {
      newSelected.delete(subjectId);
      newSelectedData.delete(subjectId);
    } else {
      newSelected.add(subjectId);
      if (subjectData) {
        newSelectedData.set(subjectId, subjectData);
      }
    }
    setSelectedSubjects(newSelected);
    setSelectedSubjectsData(newSelectedData);
  };

  const handleAddSelectedSubjects = () => {
    if (selectedSubjects.size === 0) {
      setPopupOptions({
        Heading: "No Subjects Selected",
        HeadingStyle: { background: POPUP_WARNING_COLOR, color: "white" },
        Message: "Please select at least one subject to add",
      });
      return;
    }

    if (!yearSemSubjectTarget) {
      setPopupOptions({
        Heading: "No Target Semester",
        HeadingStyle: { background: POPUP_WARNING_COLOR, color: "white" },
        Message: "Please select a valid year level and semester first",
      });
      return;
    }

    const new_curriculum = structuredClone(curriculum);
    const subjects_to_add = Array.from(selectedSubjectsData.values());
    let duplicates = [];

    for (const subject of subjects_to_add) {
      if (has_subject(curriculum, subject.ID)) {
        duplicates.push(subject.Code);
      } else {
        new_curriculum.YearLevels[
          yearSemSubjectTarget.index_year_level
        ].Semesters[yearSemSubjectTarget.index_semester].Subjects.push(subject);
      }
    }

    if (duplicates.length > 0) {
      setPopupOptions({
        Heading: "Some Subjects Already Exist",
        HeadingStyle: { background: POPUP_WARNING_COLOR, color: "white" },
        Message: `The following subjects are already in the curriculum: ${duplicates.join(", ")}. Other subjects have been added.`,
      });
    }

    setEditedCurriculum(new_curriculum);
    setSelectedSubjects(new Set());
    setSelectedSubjectsData(new Map());
    onClose();
  };

  // ---- EFFECTS ----
  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      load_subjects(pageSize, page, searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [load_subjects, pageSize, page, searchTerm]);

  return (
    <>
      {/* ===================== POPUP ===================== */}
      <Popup
        popupOptions={popupOptions}
        closeButtonActionHandler={() => setPopupOptions(null)}
      />

      {/* ===================== DIALOG ===================== */}
      <Dialog
        open={open}
        onClose={onClose}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
        fullWidth
        maxWidth="xl"
      >
        <DialogTitle id="alert-dialog-title">Add Subject</DialogTitle>
        <DialogContent>
          <Box
            display={"flex"}
            justifyContent={"space-between"}
            alignItems={"center"}
            padding={"0.5em"}
          >
            <DialogContentText id="alert-dialog-description">
              Search and select a subject to add
            </DialogContentText>

            <TextField
              sx={{ width: "16em" }}
              size="small"
              label="Search subject"
              value={searchTerm}
              variant="filled"
              onChange={(e) => { setPage(0); setSearchTerm(e.target.value); }}
            />
          </Box>

          <TableContainer
            component={Paper}
            sx={{
              minHeight: TABLE_BODY_HEIGHT + 56,
              position: "relative",
            }}
          >
            {isLoading && (
              <Box
                sx={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "rgba(255, 255, 255, 0.7)",
                  zIndex: 1,
                }}
              >
                <CircularProgress />
              </Box>
            )}
            <Table size="small" sx={{ tableLayout: "fixed" }}>
              <TableHead>
                <TableRow>
                  <TableCell align="center" sx={{ width: "70px" }}>
                    Select
                  </TableCell>
                  <TableCell sx={{ width: "55px" }}>ID</TableCell>
                  <TableCell sx={{ width: "110px" }}>Code</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell sx={{ width: "85px" }}>Lec Hours</TableCell>
                  <TableCell sx={{ width: "85px" }}>Lab Hours</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {subjectList
                  .filter((subject) => !has_subject(curriculum, subject.ID))
                  .map((subject) => (
                    <TableRow key={subject.ID}>
                      <TableCell align="center">
                        <Checkbox
                          checked={selectedSubjects.has(subject.ID)}
                          onChange={() =>
                            handleSubjectToggle(subject.ID, subject)
                          }
                        />
                      </TableCell>
                      <TableCell>{subject.ID}</TableCell>
                      <TableCell>{subject.Code}</TableCell>
                      <TableCell>
                        {truncateText(subject.Name, 50)}
                      </TableCell>
                      <TableCell>{subject.LecHours}</TableCell>
                      <TableCell>{subject.LabHours}</TableCell>
                    </TableRow>
                  ))}
                {Array.from({
                  length: Math.max(
                    0,
                    pageSize -
                      subjectList.filter(
                        (s) => !has_subject(curriculum, s.ID),
                      ).length,
                  ),
                }).map((_, index) => (
                  <TableRow
                    key={`empty-row-${index}`}
                    sx={{ height: TABLE_ROW_HEIGHT }}
                  >
                    <TableCell colSpan={6} />
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <TablePagination
                rowsPerPageOptions={[7]}
                component="div"
                count={totalCount}
                rowsPerPage={pageSize}
                page={page}
                onPageChange={(_, new_page) => setPage(new_page)}
                onRowsPerPageChange={(event) => {
                  setPageSize(parseInt(event.target.value, 10));
                  setPage(0);
                }}
              />
              {/* page jump controls */}
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Typography sx={{ minWidth: "3.5em", textAlign: "right" }}>
                  {`${page + 1}/${totalPages}`}
                </Typography>
                <TextField
                  label="Go to page"
                  type="number"
                  value={jumpToPage}
                  onChange={(e) => setJumpToPage(e.target.value)}
                  slotProps={{ htmlInput: { min: 1, max: totalPages } }}
                  size="small"
                  style={{ width: "100px" }}
                />
                <Button
                  variant="contained"
                  onClick={handleJumpToPage}
                  size="small"
                >
                  Go
                </Button>
              </Box>
            </Box>
          </TableContainer>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} color="inherit">
            Cancel
          </Button>
          <Button
            onClick={handleAddSelectedSubjects}
            variant="contained"
            color="primary"
            disabled={selectedSubjects.size === 0}
          >
            Add Selected ({selectedSubjects.size})
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

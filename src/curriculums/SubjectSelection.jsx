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
  if (!text) return "";
  return text.length > maxLength ? text.substring(0, maxLength) + "..." : text;
};

const has_subject = (curriculum, subject_id) => {
  if (!curriculum?.YearLevels?.length) return false;

  for (const yl of curriculum.YearLevels) {
    for (const sem of yl?.Semesters || []) {
      for (const sub of sem?.Subjects || []) {
        if (sub.ID === subject_id) return true;
      }
    }
  }

  return false;
};

// ===================== COMPONENT =====================

export default function SubjectSelection({
  open,
  onClose,
  curriculum,
  setEditedCurriculum,
  yearSemSubjectTarget,
}) {
  // state
  const [popupOptions, setPopupOptions] = useState(null);

  const [subjectList, setSubjectList] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const [page, setPage] = useState(0);
  const [pageSize] = useState(7);
  const [totalCount, setTotalCount] = useState(0);

  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [selectedSubjects, setSelectedSubjects] = useState(new Set());
  const [selectedSubjectsData, setSelectedSubjectsData] = useState(new Map());

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  // ===================== FIX 1: DEBOUNCE SEARCH =====================
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(0);
      setDebouncedSearch(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // ===================== FETCH =====================
  const load_subjects = useCallback(async () => {
    setIsLoading(true);

    try {
      const data = await fetchSubjects(
        pageSize,
        page,
        debouncedSearch
      );

      setSubjectList(data.Subjects || []);
      setTotalCount(data.TotalSubjects || 0);
    } catch (err) {
      setPopupOptions({
        Heading: "Failed to Fetch Subjects",
        HeadingStyle: { background: POPUP_ERROR_COLOR, color: "white" },
        Message: err.message,
      });
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, debouncedSearch]);

  useEffect(() => {
    load_subjects();
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
      if (has_subject(curriculum, sub.ID)) {
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
        Heading: "Duplicates Found",
        HeadingStyle: { background: POPUP_WARNING_COLOR, color: "white" },
        Message: `${duplicates.join(", ")} already exist.`,
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

      <Dialog open={open} onClose={onClose} fullWidth maxWidth="xl">
        <DialogTitle>Add Subject</DialogTitle>

        <DialogContent>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <DialogContentText>
              Search and select subjects
            </DialogContentText>

            <TextField
              size="small"
              label="Search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </Box>

          <TableContainer component={Paper} sx={{ mt: 2, position: "relative" }}>
            {isLoading && (
              <Box
                sx={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "rgba(255,255,255,0.6)",
                  zIndex: 1,
                }}
              >
                <CircularProgress />
              </Box>
            )}

            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Select</TableCell>
                  <TableCell>ID</TableCell>
                  <TableCell>Code</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Lec</TableCell>
                  <TableCell>Lab</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {subjectList.map((s) => (
                  <TableRow key={s.ID}>
                    <TableCell>
                      <Checkbox
                        checked={selectedSubjects.has(s.ID)}
                        onChange={() => handleSubjectToggle(s.ID, s)}
                      />
                    </TableCell>
                    <TableCell>{s.ID}</TableCell>
                    <TableCell>{s.Code}</TableCell>
                    <TableCell>{truncateText(s.Name, 50)}</TableCell>
                    <TableCell>{s.LecHours}</TableCell>
                    <TableCell>{s.LabHours}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Box display="flex" justifyContent="space-between" alignItems="center" mt={2}>
            <TablePagination
              component="div"
              count={totalCount}
              page={page}
              rowsPerPage={pageSize}
              rowsPerPageOptions={[7]}
              onPageChange={(_, p) => setPage(p)}
            />

            <Typography>
              {page + 1} / {totalPages}
            </Typography>
          </Box>
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
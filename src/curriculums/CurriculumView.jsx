import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

import "@fontsource/roboto/300.css";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";

import "../assets/main.css";

import {
  Box, Button, Typography, TextField, Dialog, DialogTitle,
  DialogContent, DialogActions, Accordion, AccordionSummary,
  AccordionDetails, CircularProgress, Checkbox,
  FormControlLabel, Table, TableHead, TableRow, TableCell,
  TableBody, TableContainer, Paper, Chip, Tooltip,
  FormControl, InputLabel, Select, MenuItem
} from "@mui/material";

import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import EditIcon from "@mui/icons-material/Edit";
import SaveIcon from "@mui/icons-material/Save";
import CancelIcon from "@mui/icons-material/Cancel";
import ClearIcon from "@mui/icons-material/Clear";

import {
  loadCurriculum,
  postCreateCurriculum,
  patchUpdateCurriculum
} from "../js/curriculums";

import {
  fetchInstructorBasic
} from "../js/instructors_v2";

import {
  Loading,
  Popup,
  POPUP_ERROR_COLOR,
  POPUP_WARNING_COLOR
} from "../components/Loading";

import SubjectSelection from "./SubjectSelection";
import InstructorSelection from "./InstructorSelection";

const YEAR_LEVEL_NAMES = [
  "1st Year","2nd Year","3rd Year","4th Year",
  "5th Year","6th Year","7th Year","8th Year"
];

const SEMESTER_NAMES = [
  "1st Semester",
  "2nd Semester",
  "Mid-year"
];

export default function CurriculumView({
  mode: initialMode,
  setMode,
  popupOptions,
  setPopupOptions,
  reloadList,
  allDepartment
}) {
  const { id } = useParams();
  const navigate = useNavigate();

  const [mode, setLocalMode] = useState(initialMode || "view");
  const [isLoading, setIsLoading] = useState(false);

  const [curriculum, setCurriculum] = useState(null);
  const [editedCurriculum, setEditedCurriculum] = useState(null);

  const [isDialogFormOpen, setIsDialogFormOpen] = useState(false);
  const [isAddingSubjects, setIsAddingSubjects] = useState(false);

  const [subject, setSubject] = useState({});
  const [chipInstructors, setChipInstructors] = useState([]);

  const [yearSemSubjectTarget, setYearSemSubjectTarget] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);

        if (mode === "new") {
          const empty = {
            CurriculumID: 0,
            CurriculumCode: "",
            CurriculumName: "",
            DepartmentID: null,
            YearLevels: []
          };

          setCurriculum(empty);
          setEditedCurriculum(structuredClone(empty));
          return;
        }

        const data = await loadCurriculum(id);

        setCurriculum(data);
        setEditedCurriculum(structuredClone(data));
      } catch (err) {
        setPopupOptions({
          Heading: "Load Failed",
          HeadingStyle: { background: POPUP_ERROR_COLOR, color: "white" },
          Message: String(err)
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleChange = (field, value) => {
    setEditedCurriculum(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <>
      <Loading IsLoading={isLoading} />

      <Popup
        popupOptions={popupOptions}
        closeButtonActionHandler={() => setPopupOptions(null)}
      />

      <Box>

        {/* HEADER */}
        <Box display="flex" justifyContent="space-between" p={1}>
          <Typography variant="h6">
            {editedCurriculum?.CurriculumCode || "New Curriculum"}
          </Typography>

          <Box display="flex" gap={1}>
            {mode === "view" && (
              <>
                <Button
                  startIcon={<EditIcon />}
                  onClick={() => setLocalMode("edit")}
                >
                  Edit
                </Button>

                <Button
                  startIcon={<ClearIcon />}
                  color="error"
                  onClick={() => navigate("/curriculums")}
                >
                  Close
                </Button>
              </>
            )}

            {mode === "edit" && (
              <>
                <Button
                  startIcon={<SaveIcon />}
                  onClick={async () => {
                    try {
                      await patchUpdateCurriculum(editedCurriculum);
                      setCurriculum(structuredClone(editedCurriculum));
                      setLocalMode("view");
                      reloadList?.();
                    } catch (err) {
                      setPopupOptions({
                        Heading: "Save Failed",
                        HeadingStyle: { background: POPUP_ERROR_COLOR },
                        Message: String(err)
                      });
                    }
                  }}
                >
                  Save
                </Button>

                <Button
                  startIcon={<CancelIcon />}
                  color="error"
                  onClick={() => {
                    setEditedCurriculum(structuredClone(curriculum));
                    setLocalMode("view");
                  }}
                >
                  Cancel
                </Button>
              </>
            )}
          </Box>
        </Box>

        {/* CODE INPUT */}
        {mode !== "view" && (
          <TextField
            fullWidth
            label="Curriculum Code"
            value={editedCurriculum?.CurriculumCode || ""}
            onChange={(e) =>
              handleChange("CurriculumCode", e.target.value)
            }
          />
        )}

        {/* YEAR LEVELS */}
        {editedCurriculum?.YearLevels?.map((year, yi) => (
          <Accordion key={yi}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography>{year.Name}</Typography>
            </AccordionSummary>

            <AccordionDetails>
              {year.Semesters?.map((sem, si) => (
                <Accordion key={si}>
                  <AccordionSummary>
                    <Typography>{sem.Name}</Typography>
                  </AccordionSummary>

                  <AccordionDetails>
                    <TableContainer component={Paper}>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Code</TableCell>
                            <TableCell>Name</TableCell>
                          </TableRow>
                        </TableHead>

                        <TableBody>
                          {sem.Subjects?.map((sub, i) => (
                            <TableRow key={i}>
                              <TableCell>{sub.Code}</TableCell>
                              <TableCell>{sub.Name}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </AccordionDetails>
                </Accordion>
              ))}
            </AccordionDetails>
          </Accordion>
        ))}

        {/* ADD YEAR */}
        {mode !== "view" && (
          <Button
            startIcon={<AddIcon />}
            onClick={() => {
              setEditedCurriculum(prev => ({
                ...prev,
                YearLevels: [
                  ...prev.YearLevels,
                  {
                    Name:
                      YEAR_LEVEL_NAMES[prev.YearLevels.length],
                    Semesters: []
                  }
                ]
              }));
            }}
          >
            Add Year
          </Button>
        )}

        {/* SUBJECT MODAL */}
        <Dialog open={isDialogFormOpen} onClose={() => setIsDialogFormOpen(false)}>
          <DialogTitle>Modify Subject</DialogTitle>
          <DialogContent>
            <TextField fullWidth label="Lecture Hours" />
            <TextField fullWidth label="Lab Hours" />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setIsDialogFormOpen(false)}>Close</Button>
          </DialogActions>
        </Dialog>

        {/* SUBJECT PICKER */}
        <SubjectSelection
          open={isAddingSubjects}
          onClose={() => setIsAddingSubjects(false)}
          curriculum={editedCurriculum}
          setEditedCurriculum={setEditedCurriculum}
          yearSemSubjectTarget={yearSemSubjectTarget}
        />

      </Box>
    </>
  );
}
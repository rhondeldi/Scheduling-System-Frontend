// ===================== IMPORTS =====================
import { useState, useEffect } from "react";
import { useRef } from "react";

import "@fontsource/roboto/300.css";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";

import "../assets/main.css";

import {
  Box,
  Button,
  Typography,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton,
  CircularProgress,
  Checkbox,
  FormControlLabel,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
  Paper,
  FormGroup,
  DialogContentText,
  Chip,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";

import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import DeleteIcon from "@mui/icons-material/Delete";
import CheckIcon from "@mui/icons-material/Check";
import ClearAllIcon from "@mui/icons-material/ClearAll";
import EditIcon from "@mui/icons-material/Edit";
import SaveIcon from "@mui/icons-material/Save";
import CancelIcon from "@mui/icons-material/Cancel";
import ClearIcon from "@mui/icons-material/Clear";
import RemoveCircleOutlineIcon from "@mui/icons-material/RemoveCircleOutline";

import {
  loadCurriculum,
  postCreateCurriculum,
  patchUpdateCurriculum,
} from "../js/curriculums";

import { fetchInstructorBasic } from "../js/instructors_v2";

import {
  Loading,
  POPUP_ERROR_COLOR,
  POPUP_WARNING_COLOR,
} from "../components/Loading";

import SubjectSelection from "./SubjectSelection";
import InstructorSelection from "./InstructorSelection";

// ===================== HELPERS =====================
const truncateText = (text, maxLength) => {
  if (!text) return "";
  if (text.length > maxLength) return text.substring(0, maxLength) + "...";
  return text;
};

// ===================== CONSTANTS =====================
const YEAR_LEVEL_NAMES = [
  "1st Year",
  "2nd Year",
  "3rd Year",
  "4th Year",
  "5th Year",
  "6th Year",
  "7th Year",
  "8th Year",
];

const SEMESTER_NAMES = ["1st Semester", "2nd Semester", "Mid-year"];

// ===================== MAIN COMPONENT =====================
function CurriculumView({
  mode,
  setMode,
  curriculum_id,
  department,
  onClose,
  setPopupOptions,
  reloadList,
  allDepartment,
}) {
  // ===================== STATE =====================
  const [isLoading, setIsLoading] = useState(false);

  const [curriculum, setCurriculum] = useState(null);
  const [editedCurriculum, setEditedCurriculum] = useState(null);

  const [yearTabIndex, setYearTabIndex] = useState(0);

  const [isDialogFormOpen, setIsDialogFormOpen] = useState(false);
  const [subject, setSubject] = useState({ LecHours: 0, LabHours: 0 });

  const [isAddingSubjects, setIsAddingSubjects] = useState(false);
  const [yearSemSubjectTarget, setYearSemSubjectTarget] = useState(null);

  const [chipInstructors, setChipInstructors] = useState([]);

  // ===================== LOAD DATA =====================
  useEffect(() => {
    const run = async () => {
      try {
        if (mode === "new") {
          const newCurriculum = {
            CurriculumCode: "",
            CurriculumID: 0,
            CurriculumName: "",
            DepartmentID: department.DepartmentID,
            YearLevels: [],
          };

          setCurriculum(newCurriculum);
          setEditedCurriculum(structuredClone(newCurriculum));
          return;
        }

        setIsLoading(true);

        const data = await loadCurriculum(curriculum_id);
        if (!data) throw "Curriculum not found";

        setCurriculum(data);
        setEditedCurriculum(structuredClone(data));
      } catch (err) {
        setPopupOptions({
          Heading: "Error loading curriculum",
          HeadingStyle: {
            background: POPUP_ERROR_COLOR,
            color: "white",
          },
          Message: `${err}`,
        });
      } finally {
        setIsLoading(false);
      }
    };

    run();
  }, []);

  // ===================== UI =====================
  return (
    <>
      <Loading IsLoading={isLoading} />

      <Box display="flex" flexDirection="column" maxHeight="80vh" overflow="hidden">
        {/* ================= HEADER ================= */}
        <Box
        sx={{
            display: "flex",
            justifyContent: "space-between",
            py: 1.5,
            px: 1,
            gap: 2,
            flexWrap: "wrap",
            alignItems: "center",
        }}
        >
          {mode === "view" ? (
            <Typography variant="h6">
              {curriculum?.CurriculumCode}
            </Typography>
          ) : (
            <TextField
            size="small"
            label="Curriculum Code"
            sx={{
                minWidth: 220,
            }}
              defaultValue={editedCurriculum?.CurriculumCode || ""}
              onChange={(e) => {
                const c = structuredClone(editedCurriculum);
                c.CurriculumCode = e.target.value;
                setEditedCurriculum(c);
              }}
            />
          )}

          <Box display="flex" gap={1}>
            {mode === "view" && (
              <>
                <Button
                  startIcon={<EditIcon />}
                  onClick={() => {
                    setMode("edit");
                    setEditedCurriculum(structuredClone(curriculum));
                  }}
                >
                  Edit
                </Button>
                <Button color="error" onClick={onClose}>
                  Close
                </Button>
              </>
            )}

            {mode === "edit" && (
              <>
                <Button
                  startIcon={<CheckIcon />}
                  onClick={async () => {
                    const updated = structuredClone(editedCurriculum);
                    await patchUpdateCurriculum(updated);
                    setCurriculum(updated);
                    reloadList();
                    setMode("view");
                  }}
                >
                  Apply
                </Button>

                <Button
                  color="error"
                  onClick={() => {
                    setMode("view");
                    setEditedCurriculum(structuredClone(curriculum));
                  }}
                >
                  Cancel
                </Button>
              </>
            )}

            {mode === "new" && (
              <>
                <Button
                  startIcon={<SaveIcon />}
                  onClick={async () => {
                    const newC = structuredClone(editedCurriculum);
                    await postCreateCurriculum(newC);
                    setCurriculum(newC);
                    reloadList();
                    setMode("view");
                  }}
                >
                  Save
                </Button>

                <Button color="error" onClick={onClose}>
                  Discard
                </Button>
              </>
            )}
          </Box>
        </Box>

        {/* ================= NAME + DEPARTMENT ================= */}
        <Box p={1} borderBottom="2px solid gray">
          {mode === "view" ? (
            <Typography variant="h6">
              {curriculum?.CurriculumName}
            </Typography>
          ) : (
            <TextField
              fullWidth
              label="Curriculum Name"
              defaultValue={editedCurriculum?.CurriculumName || ""}
              onChange={(e) => {
                const c = structuredClone(editedCurriculum);
                c.CurriculumName = e.target.value;
                setEditedCurriculum(c);
              }}
            />
          )}
        </Box>

        {/* ================= YEAR LEVELS (TABS) ================= */}
        <Box display="flex" flexDirection="column" flex={1} height="100vh" overflow="hidden">
          {editedCurriculum?.YearLevels?.length ? (
            <>
              {/* Tabs Header */}
              <Box
                display="flex"
                alignItems="center"
                borderBottom="1px solid #ddd" 
              >
                <Tabs
                  value={yearTabIndex}
                  onChange={(e, v) => setYearTabIndex(v)}
                  variant="scrollable"
                  scrollButtons="auto"
                  sx={{ flex: 1 }}
                >
                  {editedCurriculum.YearLevels.map((y, i) => (
                    <Tab
                      key={i}
                      label={`${y.Name}${y.IsActive ? " (Active)" : ""}`}
                    />
                  ))}
                </Tabs>

                {(mode === "edit" || mode === "new") && (
                  <Button
                    onClick={() => {
                      const c = structuredClone(editedCurriculum);

                      if (c.YearLevels.length >= YEAR_LEVEL_NAMES.length) {
                        setPopupOptions({
                          Heading: "Limit reached",
                          HeadingStyle: {
                            background: POPUP_WARNING_COLOR,
                            color: "black",
                          },
                          Message: "Max year levels reached",
                        });
                        return;
                      }

                      c.YearLevels.push({
                        Name: YEAR_LEVEL_NAMES[c.YearLevels.length],
                        IsActive: true,
                        Semesters: [],
                      });

                      setEditedCurriculum(c);
                      setYearTabIndex(c.YearLevels.length - 1);
                    }}
                  >
                    +
                  </Button>
                )}
              </Box>

              {/* Tab Content */}
              <Box p={2} flex={1} overflow="auto">
                {editedCurriculum.YearLevels[yearTabIndex] && (
                  <>
                    {/* Year controls */}
                    {(mode === "edit" || mode === "new") && (
                    <Box
                        display="flex"
                        gap={2}
                        mb={2}
                        flexWrap="wrap"
                        alignItems="center"
                    >
                        <FormControlLabel
                        control={
                            <Checkbox
                            checked={
                                editedCurriculum.YearLevels[yearTabIndex].IsActive
                            }
                            onChange={(e) => {
                                const c = structuredClone(editedCurriculum);

                                c.YearLevels[yearTabIndex].IsActive =
                                e.target.checked;

                                setEditedCurriculum(c);
                            }}
                            />
                        }
                        label="Active Year"
                        />

                        {/* ADD SEMESTER */}
                        <Button
                        variant="contained"
                        color="success"
                        startIcon={<AddIcon />}
                        onClick={() => {
                            const c = structuredClone(editedCurriculum);

                            const sems =
                            c.YearLevels[yearTabIndex].Semesters;

                            if (sems.length >= SEMESTER_NAMES.length) {
                            setPopupOptions({
                                Heading: "Semester Limit Reached",
                                HeadingStyle: {
                                background: POPUP_WARNING_COLOR,
                                color: "black",
                                },
                                Message: "Cannot add more semesters",
                            });

                            return;
                            }

                            sems.push({
                            Name: SEMESTER_NAMES[sems.length],
                            Sections: 0,
                            Subjects: [],
                            });

                            setEditedCurriculum(c);
                        }}
                        >
                        Add Semester
                        </Button>

                        {/* DELETE SEMESTER */}
                        <Button
                        variant="contained"
                        color="error"
                        startIcon={<RemoveIcon />}
                        onClick={() => {
                            const c = structuredClone(editedCurriculum);

                            const sems =
                            c.YearLevels[yearTabIndex].Semesters;

                            if (sems.length === 0) {
                            setPopupOptions({
                                Heading: "No Semester",
                                HeadingStyle: {
                                background: POPUP_WARNING_COLOR,
                                color: "black",
                                },
                                Message: "No semester left to remove",
                            });

                            return;
                            }

                            sems.pop();

                            setEditedCurriculum(c);
                        }}
                        >
                        Remove Semester
                        </Button>

                        {/* DELETE YEAR */}
                        <Button
                        variant="outlined"
                        color="error"
                        startIcon={<DeleteIcon />}
                        onClick={() => {
                            const c = structuredClone(editedCurriculum);

                            if (c.YearLevels.length === 0) return;

                            c.YearLevels.splice(yearTabIndex, 1);

                            setEditedCurriculum(c);

                            if (yearTabIndex > 0) {
                            setYearTabIndex(yearTabIndex - 1);
                            }
                        }}
                        >
                        Delete Year
                        </Button>
                    </Box>
                    )}

                    {/* Semesters */}
                    {editedCurriculum.YearLevels[yearTabIndex].Semesters.map(
                      (sem, si) => (
                        <Accordion key={si}>
                          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <Typography>
                              {sem.Name} - {sem.Sections} Sections
                            </Typography>
                          </AccordionSummary>

                          <AccordionDetails>
                          {(mode === "edit" || mode === "new") && (
                            <Box
                                display="flex"
                                justifyContent="space-between"
                                alignItems="center"
                                mb={2}
                            >
                                <Button
                                variant="contained"
                                color="secondary"
                                startIcon={<AddIcon />}
                                onClick={() => {
                                    setIsAddingSubjects(true);

                                    setYearSemSubjectTarget({
                                    index_year_level: yearTabIndex,
                                    index_semester: si,
                                    });
                                }}
                                >
                                Add Subject
                                </Button>

                                <TextField
                                size="small"
                                type="number"
                                label="Sections"
                                value={sem.Sections}
                                onChange={(e) => {
                                    const c = structuredClone(editedCurriculum);

                                    c.YearLevels[yearTabIndex]
                                    .Semesters[si]
                                    .Sections = parseInt(e.target.value || 0);

                                    setEditedCurriculum(c);
                                }}
                                sx={{ width: 120 }}
                                />
                            </Box>
                            )}
                            <TableContainer component={Paper}>
                              <Table size="small">
                              <TableHead>
                                <TableRow>
                                    <TableCell>Code</TableCell>
                                    <TableCell>Name</TableCell>
                                    <TableCell>Lec</TableCell>
                                    <TableCell>Lab</TableCell>
                                    <TableCell>Instructors</TableCell>

                                    {(mode === "edit" || mode === "new") && (
                                    <TableCell align="right">Actions</TableCell>
                                    )}
                                </TableRow>
                                </TableHead>
                                <TableBody
                                sx={{
                                    opacity: isLoading ? 0 : 1,

                                    transform: isLoading
                                    ? "translateY(12px)"
                                    : "translateY(0)",

                                    transition:
                                    "opacity 0.25s ease, transform 0.25s ease",
                                }}
                                >
                                {sem.Subjects.map((sub, subIndex) => (
                                <TableRow key={sub.ID}>

                                    <TableCell>{sub.Code}</TableCell>

                                    <TableCell>
                                    <Tooltip title={sub.Name}>
                                        <span>{truncateText(sub.Name, 55)}</span>
                                    </Tooltip>
                                    </TableCell>

                                    <TableCell>{sub.LecHours}</TableCell>

                                    <TableCell>{sub.LabHours}</TableCell>

                                    <TableCell>
                                    {sub.DesignatedInstructorsID?.length
                                        ? `${sub.DesignatedInstructorsID.length}x`
                                        : "auto"}
                                    </TableCell>

                                    {(mode === "edit" || mode === "new") && (
                                    <TableCell align="right">
                                        {/* EDIT SUBJECT */}
                                        <Button
                                        variant="contained"
                                        color="primary"
                                        size="small"
                                        startIcon={<EditIcon />}
                                        sx={{ mr: 1 }}
                                        onClick={async () => {
                                            setSubject(subject);

                                            setYearSemSubjectTarget({
                                            index_year_level: yearTabIndex,
                                            index_semester: si,
                                            subject_index: subIndex,
                                            });

                                            try {
                                            const new_instructors = [];

                                            if (sub?.DesignatedInstructorsID) {
                                                for (let num of sub.DesignatedInstructorsID) {
                                                const instructor_basic_info =
                                                    await fetchInstructorBasic(num);

                                                new_instructors.push({
                                                    InstructorID:
                                                    instructor_basic_info.InstructorID,

                                                    Name: `${instructor_basic_info.FirstName} ${instructor_basic_info.MiddleInitial}. ${instructor_basic_info.LastName}`,
                                                });
                                                }
                                            }

                                            setChipInstructors(new_instructors);
                                            } catch (err) {
                                            setPopupOptions({
                                                Heading: "Read Subject Error",
                                                HeadingStyle: {
                                                background: POPUP_WARNING_COLOR,
                                                color: "black",
                                                },
                                                Message: `${err}`,
                                            });
                                            }

                                            setIsDialogFormOpen(true);
                                        }}
                                        >
                                        Edit
                                        </Button>

                                        {/* REMOVE SUBJECT */}
                                        <Button
                                        variant="contained"
                                        color="error"
                                        size="small"
                                        startIcon={<RemoveCircleOutlineIcon />}
                                        onClick={() => {
                                            const c = structuredClone(editedCurriculum);

                                            c.YearLevels[yearTabIndex]
                                            .Semesters[si]
                                            .Subjects.splice(subIndex, 1);

                                            setEditedCurriculum(c);
                                        }}
                                        >
                                        Remove
                                        </Button>
                                    </TableCell>
                                    )}
                                </TableRow>
                                ))}
                                </TableBody>
                              </Table>
                            </TableContainer>
                          </AccordionDetails>
                        </Accordion>
                      )
                    )}
                  </>
                )}
              </Box>
            </>
          ) : (
            <Box p={2}>
              <Typography fontStyle="italic">
                empty year levels
              </Typography>
            </Box>
          )}
        </Box>
      </Box>

      {/* ================= SUBJECT DIALOG ================= */}
      <Dialog
          open={isDialogFormOpen}
          onClose={() => setIsDialogFormOpen(false)}
          fullWidth
          maxWidth="xl"
          TransitionProps={{
            timeout: 250,
          }}
          slotProps={{
            paper: {
              component: "form",
              onSubmit: async (event) => {
                try {
                  event.preventDefault();

                  const formData = new FormData(event.currentTarget);
                  const formJson = Object.fromEntries(formData.entries());

                  // when a subject's "modify" button was clicked, somewhere the `subject` state will be set by that
                  // associated subject in the curriculum, and since the `subject` state has the same reference as the
                  // one in the selected subject in the `editedCurriculum` state we can just edit the subject.LabHours
                  // and subject.LecHours directly and just update the `editedCurriculum` state to force rerender.

                  subject.LecHours = parseInt(
                    formJson.ModifySubjectDialogForm_LecHours,
                    10,
                  );
                  subject.LabHours = parseInt(
                    formJson.ModifySubjectDialogForm_LabHours,
                    10,
                  );

                  const new_designated_instructor_ids = [];

                  for (let i = 0; i < chipInstructors?.length; i++) {
                    new_designated_instructor_ids.push(
                      parseInt(chipInstructors[i].InstructorID, 10),
                    );
                  }

                  subject.DesignatedInstructorsID =
                    new_designated_instructor_ids;

                  let updated_curriculum = structuredClone(editedCurriculum);
                  setEditedCurriculum(updated_curriculum);
                } catch (err) {
                  setPopupOptions({
                    Heading: "Operation Failed",
                    HeadingStyle: {
                      background: POPUP_ERROR_COLOR,
                      color: "white",
                    },
                    Message: `${err.message}`,
                  });
                } finally {
                  setIsLoading(false);
                  setIsDialogFormOpen(false);
                }
              },
            },
          }}
        >
          <DialogTitle
            sx={{
                backgroundColor: "#2e6417",
                color: "white",
                fontWeight: 600,
                letterSpacing: "0.03em",
            }}
            >
            {subject?.Code
                ? `Edit Subject • ${subject.Code}`
                : "Edit Subject"}
            </DialogTitle>
          <DialogContent>
            <DialogContentText minWidth={"25em"}>
              {subject?.Name}
            </DialogContentText>
            <TextField
              required
              margin="dense"
              id="ModifySubjectDialogForm_LecHours"
              name="ModifySubjectDialogForm_LecHours"
              label="Lecture Hours"
              type="number"
              fullWidth
              variant="standard"
              defaultValue={subject?.LecHours || 0}
              slotProps={{ htmlInput: { min: 0, max: 15 } }}
            />
            <TextField
              required
              margin="dense"
              id="ModifySubjectDialogForm_LabHours"
              name="ModifySubjectDialogForm_LabHours"
              label="Lab Hours"
              type=""
              fullWidth
              variant="standard"
              defaultValue={subject?.LabHours || 0}
              slotProps={{ htmlInput: { min: 0, max: 15 } }}
            />

            <Box
              marginTop={"1em"}
              display={"flex"}
              flexDirection={"column"}
              gap={1}
            >
              <Box
                display={"flex"}
                justifyContent={"space-between"}
                alignItems={"center"}
              >
                <Typography variant="caption">
                  Add one or more instructor(s) you want to assign to this
                  subject
                </Typography>
              </Box>
              <Box display={"flex"} flexWrap={"wrap"} gap={1} padding={"0.3em"}>
                {chipInstructors.map((instructor) => (
                  <Chip
                    key={`chip-key-${instructor.InstructorID}`}
                    label={`${instructor.InstructorID} | ${instructor.Name}`}
                    onDelete={() => {
                      setChipInstructors(
                        chipInstructors.filter(
                          (iter_instructor) =>
                            iter_instructor?.InstructorID !=
                            instructor?.InstructorID,
                        ),
                      );
                    }}
                  />
                ))}
              </Box>
            </Box>

            <InstructorSelection
              open={true}
              curriculum={editedCurriculum}
              setEditedCurriculum={setEditedCurriculum}
              yearSemSubjectTarget={yearSemSubjectTarget}
              chipInstructors={chipInstructors}
              setChipInstructors={setChipInstructors}
            />
          </DialogContent>
          <DialogActions>
          <Button
            type="submit"
            variant="contained"
            >
            Save Subject
            </Button>
            <Button
              variant="outlined"
              onClick={() => {
                setIsDialogFormOpen(false);
                setChipInstructors([]);
              }}
            >
              Cancel
            </Button>
          </DialogActions>
        </Dialog>

      {/* ================= ADD SUBJECT ================= */}
      {isAddingSubjects && (
        <SubjectSelection
          open={isAddingSubjects}
          onClose={() => setIsAddingSubjects(false)}
          curriculum={editedCurriculum}
          setEditedCurriculum={setEditedCurriculum}
          yearSemSubjectTarget={yearSemSubjectTarget}
        />
      )}
    </>
  );
}

export default CurriculumView;
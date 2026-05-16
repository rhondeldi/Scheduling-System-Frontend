import { useCallback, useEffect, useState, useRef } from "react";

import {
  Box, TextField, Button,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TablePagination, Paper, CircularProgress, Skeleton,
  Dialog, DialogContent, DialogContentText, DialogTitle, DialogActions,
  FormControlLabel, Checkbox,
  IconButton,
} from "@mui/material";

import EditIcon from "@mui/icons-material/Edit";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";

import "../assets/main.css";
import {
  fetchSubjects,
  deleteRemoveSubject,
  patchUpdateSubject,
  postCreateSubject
} from "../js/subjects";

import {
  Popup,
  POPUP_ERROR_COLOR,
  POPUP_SUCCESS_COLOR,
} from "../components/Loading";

import { MainHeader } from "../components/Header";
import warning from "../assets/warning.png";

const truncateText = (text, maxLength) =>
  text?.length > maxLength ? text.substring(0, maxLength) + "..." : text;

const emptySubject = {
  Code: "",
  Name: "",
  LecHours: 0,
  LabHours: 0,
  BitFlags: 0,
};

export default function Subjects() {
  const [mode, setMode] = useState("");
  const [isDialogFormOpen, setIsDialogFormOpen] = useState(false);
  const [isDialogDeleteShow, setIsDialogDeleteShow] = useState(false);

  const [popupOptions, setPopupOptions] = useState(null);

  const [subjectToDelete, setSubjectToDelete] = useState(null);

  const [subject, setSubject] = useState(emptySubject);

  const [subjectList, setSubjectList] = useState([]);
  const [isTableLoading, setIsTableLoading] = useState(false);
  const [isPaginating, setIsPaginating] = useState(false);
  const [isOperationLoading, setIsOperationLoading] = useState(false);

  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(5);
  const [totalCount, setTotalCount] = useState(0);

  const [searchTerm, setSearchTerm] = useState("");

  const skipAnimRef = useRef(false);

  const load_subjects = useCallback(async (size, newPage, search) => {
    try {
      const data = await fetchSubjects(size, newPage, search, "");

      setSubjectList(data.Subjects || []);
      setTotalCount(data.TotalSubjects || 0);
    } catch (err) {
      setPopupOptions({
        Heading: "Fetch Failed",
        HeadingStyle: { background: POPUP_ERROR_COLOR, color: "white" },
        Message: err.message,
      });
    }

    setIsTableLoading(false);
    setIsPaginating(false);
  }, []);

  useEffect(() => {
    if (!skipAnimRef.current) setIsTableLoading(true);
    skipAnimRef.current = false;
    const timer = setTimeout(() => {
      load_subjects(pageSize, page, searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [load_subjects, page, pageSize, searchTerm]);

  const handleDelete = async (id) => {
    setIsOperationLoading(true);

    try {
      await deleteRemoveSubject(id);

      await load_subjects(pageSize, page, searchTerm);

      setPopupOptions({
        Heading: "Deleted",
        HeadingStyle: { background: POPUP_SUCCESS_COLOR, color: "white" },
        Message: "Subject deleted successfully",
      });
    } catch (err) {
      setPopupOptions({
        Heading: "Delete Failed",
        HeadingStyle: { background: POPUP_ERROR_COLOR, color: "white" },
        Message: err.message,
      });
    }

    setIsOperationLoading(false);
    setIsDialogDeleteShow(false);
    setSubjectToDelete(null);
  };

  const closeFormDialog = () => {
    setIsDialogFormOpen(false);
    setSubject(emptySubject);
  };

  const handleSave = async () => {
    setIsOperationLoading(true);

    const subjectPayload = {
      ...subject,
      LecHours: Number(subject.LecHours),
      LabHours: Number(subject.LabHours),
      BitFlags: Number(subject.BitFlags) || 0,
      DesignatedInstructors: subject.DesignatedInstructors || [],
    };

    try {
      if (mode === "new") {
        await postCreateSubject(subjectPayload);
      } else {
        await patchUpdateSubject(subjectPayload);
      }

      await load_subjects(pageSize, page, searchTerm);

      setPopupOptions({
        Heading: "Saved",
        HeadingStyle: { background: POPUP_SUCCESS_COLOR, color: "white" },
        Message: "Subject saved successfully",
      });

      closeFormDialog();
    } catch (err) {
      setPopupOptions({
        Heading: "Save Failed",
        HeadingStyle: { background: POPUP_ERROR_COLOR, color: "white" },
        Message: err.message,
      });
    } finally {
      setIsOperationLoading(false);
    }
  };

  return (
    <>
      {/* ROUTED HEADER */}
      <MainHeader pageName="subjects">

      <Popup
        popupOptions={popupOptions}
        closeButtonActionHandler={() => setPopupOptions(null)}
      />

      {/* PAGE */}
      <Box>

        {/* TOP BAR */}
        <Box sx={{ display: "flex", justifyContent: "space-between", py: 1.5 }}>
          <TextField
            size="small"
            label="Search subject"
            value={searchTerm}
            onChange={(e) => {
              setPage(0);
              setSearchTerm(e.target.value);
            }}
          />

          <Button
            startIcon={<AddIcon />}
            variant="contained"
            onClick={() => {
              setSubject(emptySubject);
              setMode("new");
              setIsDialogFormOpen(true);
            }}
          >
            Add Subject
          </Button>
        </Box>

        {/* TABLE */}
        <Box>
          <TableContainer component={Paper} sx={{ minHeight: 120 }}>
            <Table size="small" sx={{ tableLayout: "fixed" }}>
              <TableHead sx={{ "& .MuiTableCell-root": { bgcolor: "primary.main", color: "white", fontWeight: 700, letterSpacing: "0.05em" } }}>
                <TableRow>
                  <TableCell sx={{ width: "13%" }}>CODE</TableCell>
                  <TableCell>NAME</TableCell>
                  <TableCell sx={{ width: "10%" }}>LECTURE</TableCell>
                  <TableCell sx={{ width: "10%" }}>LAB</TableCell>
                  <TableCell sx={{ width: "80px" }} />
                </TableRow>
              </TableHead>

              <TableBody sx={{ opacity: isTableLoading ? 0 : 1, transform: isTableLoading ? "translateY(12px)" : "translateY(0)", transition: "opacity 0.25s ease, transform 0.25s ease" }}>
                {isPaginating
                  ? Array.from({ length: pageSize }).map((_, i) => (
                      <TableRow key={i} sx={{ height: 50 }}>
                        <TableCell><Skeleton /></TableCell>
                        <TableCell><Skeleton /></TableCell>
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
                  : subjectList.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ fontStyle: "italic", color: "text.secondary", py: 2 }}>
                      No subjects found
                    </TableCell>
                  </TableRow>
                ) : (
                  subjectList.map((s) => (
                    <TableRow key={s.ID}>
                      <TableCell sx={{ fontWeight: "bold" }}>{s.Code}</TableCell>
                      <TableCell sx={{ fontStyle: "italic" }}>{truncateText(s.Name, 80)}</TableCell>
                      <TableCell>{s.LecHours}</TableCell>
                      <TableCell>{s.LabHours}</TableCell>

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
                              setSubject(s);
                              setMode("edit");
                              setIsDialogFormOpen(true);
                            }}
                          >
                            <EditIcon />
                          </IconButton>

                          <IconButton
                            title="Delete"
                            color="delete"
                            onClick={() => {
                              setSubjectToDelete(s);
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
          setSubjectToDelete(null);
        }}
      >
        <DialogTitle sx={{backgroundColor: '#C62828',}}>Delete Subject</DialogTitle>
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
            {`This action cannot be undone. All data associated with ${subjectToDelete?.Code || "this subject"} will be lost.`}
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
            onClick={() => handleDelete(subjectToDelete?.ID)}
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
              setSubjectToDelete(null);
            }}
          >
            Cancel
          </Button>
        </DialogActions>
      </Dialog>

      {/* FORM DIALOG */}
      <Dialog open={isDialogFormOpen} onClose={closeFormDialog} fullWidth maxWidth="sm" onKeyDown={(e) => { if (e.key === "Enter" && !isOperationLoading) handleSave(); }}>
        <DialogTitle sx={{backgroundColor: '#2e6417',}}>{mode === "new" ? "Add New Subject" : "Edit Subject"}</DialogTitle>

        <DialogContent>
          <DialogContentText sx={{ mb: 1 }}>
            {mode === "new"
              ? "Enter the subject details and save it to add a new subject."
              : "Edit the current subject information and apply your changes."}
          </DialogContentText>

          <TextField
            margin="dense"
            label="Code"
            fullWidth
            value={subject.Code}
            onChange={(e) =>
              setSubject((previous) => ({ ...previous, Code: e.target.value }))
            }
          />

          <TextField
            margin="dense"
            label="Name"
            fullWidth
            value={subject.Name}
            onChange={(e) =>
              setSubject((previous) => ({ ...previous, Name: e.target.value }))
            }
          />

          <Box display="flex" gap={2}>
            <TextField
              margin="dense"
              label="Lecture Hours"
              type="number"
              fullWidth
              value={subject.LecHours}
              onChange={(e) =>
                setSubject((previous) => ({
                  ...previous,
                  LecHours: e.target.value,
                }))
              }
            />

            <TextField
              margin="dense"
              label="Lab Hours"
              type="number"
              fullWidth
              value={subject.LabHours}
              onChange={(e) =>
                setSubject((previous) => ({
                  ...previous,
                  LabHours: e.target.value,
                }))
              }
            />
          </Box>

          <FormControlLabel
            control={
              <Checkbox
                checked={(Number(subject.BitFlags) & 1) === 1}
                onChange={(e) =>
                  setSubject((previous) => ({
                    ...previous,
                    BitFlags: e.target.checked
                      ? Number(previous.BitFlags) | 1
                      : Number(previous.BitFlags) & ~1,
                  }))
                }
              />
            }
            label="Is Gym Type"
          />
        </DialogContent>

        <DialogActions>
          <Button
            onClick={handleSave}
            variant="contained"
            disabled={isOperationLoading}
          >
            {isOperationLoading
              ? "Saving..."
              : mode === "new"
                ? "Save"
                : "Apply Changes"}
          </Button>
          <Button
            onClick={closeFormDialog}
            variant="outlined"
            disabled={isOperationLoading}
          >
            Cancel
          </Button>
        </DialogActions>
      </Dialog>
      </MainHeader>
    </>
  );
}

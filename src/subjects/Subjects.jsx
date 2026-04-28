import { StrictMode, useState, useEffect, useRef } from "react";
import { createRoot } from "react-dom/client";

import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';

import {
    Box, TextField, Button, Typography,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TablePagination,
    Paper, CircularProgress, Dialog, DialogContent, DialogContentText, DialogTitle, DialogActions,
    FormControlLabel, Checkbox,
    ThemeProvider,
} from "@mui/material";

import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import IconButton from "@mui/material/IconButton";

import "../assets/main.css";
import { fetchSubjects, deleteRemoveSubject, patchUpdateSubject, postCreateSubject } from "../js/subjects";
import { Popup, POPUP_ERROR_COLOR, POPUP_SUCCESS_COLOR, POPUP_WARNING_COLOR } from "../components/Loading";
import { MainHeader } from "../components/Header";
import theme from "../components/Theme";
import warning from '../assets/warning.png';

const truncateText = (text, maxLength) => {
    if (text.length > maxLength) {
        return text.substring(0, maxLength) + '...';
    }
    return text;
};

function Subjects() {
    const [mode, setMode] = useState(""); // "new" or "edit"
    const [isDialogFormOpen, setIsDialogFormOpen] = useState(false);
    const [popupOptions, setPopupOptions] = useState(null);
    const [isDialogDeleteShow, setIsDialogDeleteShow] = useState(false);
    const [subjectToDelete, setSubjectToDelete] = useState(null);

    const [subject, setSubject] = useState({
        Code: "",
        Name: "",
        LecHours: 0,
        LabHours: 0,
    });

    const [subjectList, setSubjectList] = useState([]);
    const [isTableLoading, setIsTableLoading] = useState(false);
    const [isOperationLoading, setIsOperationLoading] = useState(false);
    const [page, setPage] = useState(0);
    const pageSize = 7;
    const [totalCount, setTotalCount] = useState(0);

    const [searchTerm, setSearchTerm] = useState("");
    const [jumpToPage, setJumpToPage] = useState('');
    const initialSearch = useRef(true);

    const totalPages = Math.ceil(totalCount / pageSize);

    const load_subjects = async (page_size, new_page, search_term = "") => {
        setIsTableLoading(true);
        try {
            let subjectsData;
            if (search_term) {
                subjectsData = await fetchSubjects(page_size, new_page, search_term, "");

                if (!subjectsData.Subjects?.length) {
                    subjectsData = await fetchSubjects(page_size, new_page, "", search_term);
                }
            } else {
                subjectsData = await fetchSubjects(page_size, new_page, "", "");
            }

            setSubjectList(subjectsData.Subjects);
            setTotalCount(subjectsData.TotalSubjects);
        } catch (err) {
            setPopupOptions({
                Heading: "Failed to Fetch Subjects",
                HeadingStyle: { background: POPUP_ERROR_COLOR, color: "white" },
                Message: `${err.message}`,
            });
        }
        setIsTableLoading(false);
    };

    const handleSubjectDelete = async (subject_id) => {
        setIsOperationLoading(true);
        try {
            await deleteRemoveSubject(subject_id);
            await load_subjects(pageSize, page, searchTerm);
            setPopupOptions({
                Heading: "Delete Success",
                HeadingStyle: { background: POPUP_SUCCESS_COLOR, color: "white" },
                Message: "The subject was successfully deleted",
            });
        } catch (err) {
            setPopupOptions({
                Heading: "Delete Failed",
                HeadingStyle: { background: POPUP_ERROR_COLOR, color: "white" },
                Message: `${err.message}`,
            });
        }
        setSubjectToDelete(null);
        setIsOperationLoading(false);
        setIsDialogDeleteShow(false);
    };

    const handleJumpToPage = async () => {
        const pageNumber = parseInt(jumpToPage, 10);
        if (pageNumber > 0 && pageNumber <= totalPages) {
            const newPage = pageNumber - 1; // Convert to 0-based index
            setPage(newPage);
            await load_subjects(pageSize, newPage, searchTerm);
            setJumpToPage('');
        } else {
            setPopupOptions({
                Heading: "Invalid Page",
                HeadingStyle: { background: POPUP_WARNING_COLOR, color: "white" },
                Message: `Please enter a page number between 1 and ${totalPages}`,
            });
        }
    };

    useEffect(() => {
        load_subjects(pageSize, page, searchTerm);
    }, []);

    useEffect(() => {
        if (initialSearch.current) {
            initialSearch.current = false;
            return;
        }

        setPage(0);
        const debounceTimer = setTimeout(() => {
            load_subjects(pageSize, 0, searchTerm);
        }, 300);

        return () => clearTimeout(debounceTimer);
    }, [searchTerm]);

    return (<>

        <MainHeader pageName="subjects">

        <Popup popupOptions={popupOptions} closeButtonActionHandler={() => setPopupOptions(null)} />

        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', padding: '1.5em'}}>
                <Box display={'flex'} gap={'0.5em'}>
                    <TextField
                        sx={{ minWidth: 300 }}
                        size="small"
                        label="Search code or name"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </Box>

                <Button
                    endIcon={<AddIcon />}
                    size="medium"
                    color="primary"
                    variant="contained"
                    disabled={isOperationLoading}
                    onClick={() => {
                        setSubject({ Code: "", Name: "", LecHours: 0, LabHours: 0 });
                        setMode("new");
                        setIsDialogFormOpen(true);
                    }}
                >
                    Add New Subject
                </Button>
            </Box>
            <Box paddingInline={4}>
            <TableContainer component={Paper}>
                <Table size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell>CODE</TableCell>
                            <TableCell>SUBJECT NAME</TableCell>
                            <TableCell>CREDITS</TableCell>
                            <TableCell>LECTURE</TableCell>
                            <TableCell>LAB</TableCell>
                            <TableCell align="right"></TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {isTableLoading ? (
                            <TableRow>
                                <TableCell colSpan={6} align="center">
                                    <CircularProgress />
                                </TableCell>
                            </TableRow>
                        ) : subjectList.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} align="center" sx={{ fontWeight: 'bold', py: 6 }}>
                                    No subjects found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            subjectList.map((subject) => (
                                <TableRow key={subject.ID}>
                                    <TableCell sx={{fontWeight: 'bold'}}> {subject.Code} </TableCell>
                                    <TableCell sx={{fontStyle: 'italic'}}>{truncateText(subject.Name, 90)}</TableCell>
                                    <TableCell>{subject.Credits}</TableCell>
                                    <TableCell>{subject.LecHours}</TableCell>
                                    <TableCell>{subject.LabHours}</TableCell>
                                    <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5em', flexWrap: 'nowrap' }}>
                                            <IconButton
                                                color="edit"
                                                disabled={isOperationLoading}
                                                onClick={() => {
                                                    setSubject(subject);
                                                    setMode("edit");
                                                    setIsDialogFormOpen(true);
                                                }}
                                            >
                                                <EditIcon />
                                            </IconButton>
                                            <IconButton
                                                color="delete"
                                                disabled={isOperationLoading}
                                                onClick={() => {
                                                    setSubjectToDelete(subject);
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
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <TablePagination
                        component="div"
                        count={totalCount}
                        rowsPerPage={pageSize}
                        page={page}
                        rowsPerPageOptions={[pageSize]}
                        onPageChange={async (_, new_page) => {
                            setPage(new_page);
                            await load_subjects(pageSize, new_page, searchTerm);
                        }}
                    />
                </Box>
            </TableContainer>
            </Box>
        </Box>

        <Dialog
        open={isDialogDeleteShow}
        onClose={() => setIsDialogDeleteShow(false)}
        aria-describedby="alert-dialog-description"
        >
        <DialogContent sx={{ textAlign: "center", pt: 3 }}>
            
            {/* Image on top */}
            <img
                src={warning}
                alt="Warning"
                style={{
                    width: 80,
                    height: 80,
                    marginBottom: 8,
                }}
            />

            {/* Header */}
            <h3 style={{ margin: 0, marginBottom: 8, fontWeight: 'bold' }}>
                Delete Subject?
            </h3>

            {/* Message */}
            <DialogContentText id="alert-dialog-description">
                {`This action cannot be undone. All data associated within ${subjectToDelete?.Code} will be lost.`}
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
                variant="contained"
                color="error"
                disabled={isOperationLoading}
                onClick={() => subjectToDelete && handleSubjectDelete(subjectToDelete?.ID)}
                sx={{ width: "50%" }}
            >
                {isOperationLoading ? <CircularProgress size={20} /> : "Confirm"}
            </Button>

            <Button
                variant="outlined"
                onClick={() => setIsDialogDeleteShow(false)}
                disabled={isOperationLoading}
                sx={{ width: "50%" }}
            >
                Cancel
            </Button>
        </DialogActions>
        </Dialog>
        <Dialog
            open={isDialogFormOpen}
            onClose={() => setIsDialogFormOpen(false)}
            slotProps={{
                paper: {
                    component: 'form',
                    onSubmit: async (event) => {
                        event.preventDefault();
                        const formData = new FormData(event.currentTarget);
                        const formJson = Object.fromEntries(formData.entries());

                        const isGym = formJson.isGym === "on";
                        const subjectData = {
                            Code: formJson.Code,
                            Name: formJson.Name,
                            LecHours: parseInt(formJson.LecHours, 10),
                            LabHours: parseInt(formJson.LabHours, 10),
                            BitFlags: isGym ? 1 : 0,
                            // note to self: designated instructors will only be populated in a subject instance in the curriculum's subject not here.
                            DesignatedInstructors: [],
                        };

                        if (mode === "edit") {
                            subjectData.ID = subject.ID;
                        }

                        try {
                            setIsOperationLoading(true);
                            if (mode === "new") {
                                await postCreateSubject(subjectData);
                                setPopupOptions({
                                    Heading: "Add Successful",
                                    HeadingStyle: { background: POPUP_SUCCESS_COLOR, color: "white" },
                                    Message: "A new subject was added",
                                });
                            } else if (mode === "edit") {
                                await patchUpdateSubject(subjectData);
                                setPopupOptions({
                                    Heading: "Edit Successful",
                                    HeadingStyle: { background: POPUP_SUCCESS_COLOR, color: "white" },
                                    Message: "Changes to the subject data are saved",
                                });
                            }
                            await load_subjects(pageSize, page, searchTerm);
                        } catch (err) {
                            setPopupOptions({
                                Heading: "Operation Failed",
                                HeadingStyle: { background: POPUP_ERROR_COLOR, color: "white" },
                                Message: `${err.message}`,
                            });
                        } finally {
                            setIsOperationLoading(false);
                            setIsDialogFormOpen(false);
                        }
                    },
                },
            }}
        >
            <DialogTitle>{mode === "new" ? "Add New Subject" : "Edit Subject"}</DialogTitle>
            <DialogContent>
                <DialogContentText>
                    {mode === "new" ? "Enter the subject details and save it to add a new subject." : "Edit the current subject information and apply your changes"}
                </DialogContentText>
                <TextField
                    autoFocus
                    required
                    margin="dense"
                    id="Code"
                    name="Code"
                    label="Code"
                    type="text"
                    fullWidth
                    variant="standard"
                    defaultValue={subject?.Code || ""}
                />
                <TextField
                    required
                    margin="dense"
                    id="Name"
                    name="Name"
                    label="Name"
                    type="text"
                    fullWidth
                    variant="standard"
                    defaultValue={subject?.Name || ""}
                />
                <TextField
                    required
                    margin="dense"
                    id="LecHours"
                    name="LecHours"
                    label="Lecture Hours"
                    type="number"
                    fullWidth
                    variant="outlined"
                    defaultValue={subject?.LecHours || 0}
                />
                <TextField
                    required
                    margin="dense"
                    id="LabHours"
                    name="LabHours"
                    label="Lab Hours"
                    type="number"
                    fullWidth
                    variant="outlined"
                    defaultValue={subject?.LabHours || 0}
                />
                <FormControlLabel
                    control={
                        <Checkbox
                            name="isGym"
                            defaultChecked={mode === "edit" && (subject?.BitFlags & 1) === 1}
                        />
                    }
                    label="Is Gym Type"
                />
            </DialogContent>
            <DialogActions>
                <Button variant="contained" type="submit" disabled={isOperationLoading}>
                    {isOperationLoading ? <CircularProgress size={20} /> : (mode === "new" ? "Save" : "Apply Changes")}
                </Button>
                <Button variant="outlined" onClick={() => setIsDialogFormOpen(false)} disabled={isOperationLoading}>Cancel</Button>
            </DialogActions>
        </Dialog>
        </MainHeader>
    </>);
}

createRoot(document.getElementById("root")).render(
    <StrictMode>
        <ThemeProvider theme={theme}>
            <Subjects />
        </ThemeProvider>
    </StrictMode>
);
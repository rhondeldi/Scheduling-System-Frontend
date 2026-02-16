import { StrictMode, useState, useEffect } from 'react';
import { createRoot } from "react-dom/client";

import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';

import {
    Box, TextField, Button, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TablePagination,
    Paper, CircularProgress, Dialog, DialogContent, DialogContentText, DialogTitle, DialogActions, Select, MenuItem, FormControl, InputLabel
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import { fetchCurriculumPageList, deleteRemoveCurriculum } from '../js/curriculums';
import { fetchAllDepartments } from '../js/departments'
import { Popup, POPUP_ERROR_COLOR, POPUP_WARNING_COLOR } from '../components/Loading';

import CurriculumView from './CurriculumView'
import { fetchSubjects } from '../js/subjects';

const truncateText = (text, maxLength) => {
    if (text.length > maxLength) {
        return text.substring(0, maxLength) + '...';
    }
    return text;
};

const has_subject = (curriculum, subject_id) => {
    console.log('curriculum: has subject');
    console.log(curriculum);
    for (let idx_yrlvl = 0; idx_yrlvl < curriculum.YearLevels.length; idx_yrlvl++) {
        const semesters = curriculum.YearLevels[idx_yrlvl].Semesters;
        console.log('semester')
        console.log(semesters)
        for (let idx_sem = 0; idx_sem < semesters.length; idx_sem++) {
            const subjects = semesters[idx_sem].Subjects;
            for (let idx_sub = 0; idx_sub < subjects.length; idx_sub++) {
                const subject = subjects[idx_sub];
                if (subject.ID === subject_id) {
                    return true;
                }
            }

        }
    }

    return false;
}

export default function SubjectSelection({ open, onClose, curriculum, setEditedCurriculum, yearSemSubjectTarget }) {
    const [popupOptions, setPopupOptions] = useState(null);

    const [subjectList, setSubjectList] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [page, setPage] = useState(0);
    const [pageSize, setPageSize] = useState(7);
    const [totalCount, setTotalCount] = useState(0);

    const [codeMatch, setCodeMatch] = useState("");
    const [nameMatch, setNameMatch] = useState("");

    const [jumpToPage, setJumpToPage] = useState('');

    const totalPages = Math.ceil(totalCount / pageSize);

    const load_subjects = async (page_size, new_page, code_match = "", name_match = "") => {
        setIsLoading(true);
        try {
            const subjectsData = await fetchSubjects(page_size, new_page, code_match, name_match);
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
    };

    const handleJumpToPage = () => {
        const pageNumber = parseInt(jumpToPage, 10);
        if (pageNumber > 0 && pageNumber <= totalPages) {
            const newPage = pageNumber - 1; // Convert to 0-based index
            setPage(newPage);
            load_subjects(pageSize, newPage, codeMatch, nameMatch);
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
        load_subjects(pageSize, page, codeMatch, nameMatch);
    }, []);

    return (<>
        <Popup popupOptions={popupOptions} closeButtonActionHandler={() => setPopupOptions(null)} />

        <Dialog
            open={open}
            onClose={onClose}
            aria-labelledby="alert-dialog-title"
            aria-describedby="alert-dialog-description"

            fullWidth
            maxWidth="xl"
        >
            <DialogTitle
                id="alert-dialog-title"
            >
                Add Subject
            </DialogTitle>
            <DialogContent>
                <Box display={'flex'} justifyContent={'space-between'} alignItems={'center'} padding={'0.5em'}>
                    <DialogContentText id="alert-dialog-description">
                        Search and select a subject to add
                    </DialogContentText>

                    <Box display={'flex'} gap={'0.5em'}>
                        <TextField
                            sx={{ width: '7.5em' }}
                            size="small"
                            label="Search Code"
                            value={codeMatch}
                            variant='filled'
                            onChange={(e) => setCodeMatch(e.target.value)}
                        />
                        <TextField
                            sx={{ width: '8em' }}
                            size="small"
                            label="Search Name"
                            value={nameMatch}
                            variant='filled'
                            onChange={(e) => setNameMatch(e.target.value)}
                        />
                        <Button
                            size="small"
                            variant="contained"
                            onClick={() => {
                                setPage(0);
                                load_subjects(pageSize, 0, codeMatch, nameMatch);
                            }}
                        >
                            <SearchIcon />
                        </Button>
                    </Box>
                </Box>

                <TableContainer component={Paper}>
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell>ID</TableCell>
                                <TableCell>Code</TableCell>
                                <TableCell>Name</TableCell>
                                <TableCell>Lec Hours</TableCell>
                                <TableCell>Lab Hours</TableCell>
                                <TableCell align="right">Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={6} align="center">
                                        <CircularProgress />
                                    </TableCell>
                                </TableRow>
                            ) : (
                                subjectList.map((subject) => (
                                    <TableRow key={subject.ID}>
                                        <TableCell>{subject.ID}</TableCell>
                                        <TableCell>{subject.Code}</TableCell>
                                        <TableCell>{truncateText(subject.Name, 50)}</TableCell>
                                        <TableCell>{subject.LecHours}</TableCell>
                                        <TableCell>{subject.LabHours}</TableCell>
                                        <TableCell align="right">
                                            <Button
                                                variant="contained"
                                                color="primary"
                                                size="small"
                                                style={{ marginRight: 8 }}
                                                startIcon={<AddIcon />}
                                                onClick={() => {
                                                    if (has_subject(curriculum, subject.ID)) {
                                                        setPopupOptions({
                                                            Heading: "Subject Exists",
                                                            HeadingStyle: { background: POPUP_ERROR_COLOR, color: "white" },
                                                            Message: 'the subject you want to add is already in the curriculum',
                                                        });

                                                        return
                                                    }

                                                    const new_curriculum = structuredClone(curriculum)
                                                    new_curriculum.YearLevels[yearSemSubjectTarget.index_year_level].Semesters[yearSemSubjectTarget.index_semester].Subjects.push(subject)
                                                    setEditedCurriculum(new_curriculum)
                                                    onClose()
                                                }}
                                            >
                                                Add
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>

                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <TablePagination
                            rowsPerPageOptions={[7]}
                            component="div"
                            count={totalCount}
                            rowsPerPage={pageSize}
                            page={page}
                            onPageChange={async (_, new_page) => {
                                setPage(new_page);
                                await load_subjects(pageSize, new_page, codeMatch, nameMatch);
                            }}
                            onRowsPerPageChange={async (event) => {
                                const newPageSize = parseInt(event.target.value, 10);
                                setPageSize(newPageSize);
                                setPage(0);
                                await load_subjects(newPageSize, 0, codeMatch, nameMatch);
                            }}
                        />
                        {/* page jump controls */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography>{`${page + 1}/${totalPages}`}</Typography>
                            <TextField
                                label="Go to page"
                                type="number"
                                value={jumpToPage}
                                onChange={(e) => setJumpToPage(e.target.value)}
                                slotProps={{ htmlInput: { min: 1, max: totalPages } }}
                                size="small"
                                style={{ width: '100px' }}
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
        </Dialog>
    </>)
}
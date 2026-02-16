import { useState, useEffect } from "react";

import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';

import SearchIcon from '@mui/icons-material/Search';

import { Popup, POPUP_ERROR_COLOR } from "../components/Loading";

import "../assets/main.css";
import "../instructors/TimeTable.css";

import "../instructors/TimeTableDropdowns.css";
import "../instructors/instructors.css";

import { fetchAllDepartments } from "../js/departments"
import { fetchInstructors } from "../js/instructors_v2"

import { Box, FormControl, InputLabel, MenuItem, Select, Button, Typography, Paper, TableContainer, Table, TableHead, TableRow, TableCell, TableBody, CircularProgress, TablePagination, Dialog, DialogTitle, DialogContentText, DialogContent, DialogActions, TextField } from "@mui/material";
import AddIcon from '@mui/icons-material/Add';

export default function InstructorSelection({
    chipInstructors, setChipInstructors,
    curriculum, yearSemSubjectTarget
}) {
    const [popupOptions, setPopupOptions] = useState(null);

    const [instructors, setInstructors] = useState([]);

    const [isLoading, setIsLoading] = useState(false);

    const [departmentID, setDepartmentID] = useState(""); // use for department selection drop down

    const [page, setPage] = useState(0);
    const [pageSize, setPageSize] = useState(4);
    const [totalCount, setTotalCount] = useState(0);

    const [firstNameMatch, setFirstNameMatch] = useState("");
    const [middleInitialMatch, setMiddleInitialMatch] = useState("");
    const [lastNameMatch, setLastNameMatch] = useState("");

    const load_instructors = async (department_id, page_size, new_page, firstname_match, middle_initial_match, lastname_match) => {
        setIsLoading(true);
        try {
            const fetched_instructors = await fetchInstructors(department_id, page_size, new_page, firstname_match, middle_initial_match, lastname_match)
            setInstructors(fetched_instructors.Instructors);
            setTotalCount(fetched_instructors.TotalInstructors)
        } catch (err) {
            setPopupOptions({
                Heading: "Failed to fetch instructors",
                HeadingStyle: { background: POPUP_ERROR_COLOR, color: "white" },
                Message: `${err}`
            })
        }

        setIsLoading(false);

        for (let i = 0; i < departments?.length; i++) {
            if (departments[i].DepartmentID === department_id) {
                setDepartmentID(departments[i].DepartmentID)
                break
            }
        }
    }

    useEffect(() => {
        const useEffectAsyncs = async () => {
            try {
                setIsLoading(true);
                const all_departments = await fetchAllDepartments();

                const departments = []

                for (let i = 0; i < all_departments.length; i++) {
                    if (all_departments[i].DepartmentID == curriculum.DepartmentID || all_departments[i].DepartmentID == 0) {
                        departments.push(all_departments[i])
                    }
                }

                setDepartments(departments);
                setIsLoading(false);
            } catch (err) {
                setPopupOptions({
                    Heading: "Failed to Fetch All Department Data",
                    HeadingStyle: { background: POPUP_ERROR_COLOR, color: "white" },
                    Message: `${err}`
                });
                setIsLoading(false);
            }
        };

        useEffectAsyncs();
    }, []);

    const [departments, setDepartments] = useState([]); // fetch on page load

    const handleDepartmentChange = async (e) => {
        await load_instructors(e.target.value, pageSize, 0, firstNameMatch, middleInitialMatch, lastNameMatch);
        setPage(0);
    }

    return (<>
        <Popup popupOptions={popupOptions} closeButtonActionHandler={() => setPopupOptions(null)} />

        <Typography variant="h6"> Designate Instructor </Typography>

        <Typography variant="caption">
            Search and select an instructor to add
        </Typography>

        <Box display={'flex'} justifyContent={'space-between'} alignItems={'center'} padding={'0.5em'}>
            <Box display={'flex'} flexWrap={'wrap'} gap={'0.5em'}>

                <FormControl sx={{ minWidth: 130 }} size="small">
                    <InputLabel id="label-id-department">Department</InputLabel>
                    <Select
                        id="id-department" labelId="label-id-department" label="Department"
                        value={departmentID}
                        onChange={handleDepartmentChange}
                    >
                        {departments ?
                            departments.map((department, index) => (
                                <MenuItem key={index} value={department.DepartmentID}>{`${department.Code} - ${department.Name}`}</MenuItem>
                            )) : null
                        }
                    </Select>
                </FormControl>

                <TextField
                    sx={{ width: '15em' }}
                    size="small"
                    label="First Name"
                    defaultValue={firstNameMatch}
                    onChange={(e) => setFirstNameMatch(e.target.value)}
                />

                <TextField
                    sx={{ width: '15em' }}
                    size="small"
                    label="Middle Initial"
                    defaultValue={middleInitialMatch}
                    onChange={(e) => setMiddleInitialMatch(e.target.value)}
                />

                <TextField
                    sx={{ width: '17em' }}
                    size="small"
                    label="Last Name"
                    defaultValue={lastNameMatch}
                    onChange={(e) => setLastNameMatch(e.target.value)}
                />

                <Button
                    disabled={!departmentID}
                    size="small"
                    variant="contained"
                    onClick={async () => {
                        setPage(0);
                        console.log('departmentID : ', departmentID)
                        load_instructors(departmentID, pageSize, 0, firstNameMatch, middleInitialMatch, lastNameMatch);
                    }}
                ><SearchIcon /></Button>

            </Box>
        </Box>

        <TableContainer component={Paper}>
            <Table size="small">
                <TableHead>
                    <TableRow sx={{ height: 1 }}>
                        <TableCell>ID</TableCell>
                        <TableCell>Last Name</TableCell>
                        <TableCell>First Name</TableCell>
                        <TableCell>Middle Initial</TableCell>
                        <TableCell align="right">Actions</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {isLoading ? (
                        <TableRow>
                            <TableCell colSpan={5} align="center">
                                <CircularProgress />
                            </TableCell>
                        </TableRow>
                    ) : (
                        instructors.map((instructor, index) => (
                            <TableRow key={instructor.InstructorID}>
                                <TableCell>{instructor.InstructorID}</TableCell>
                                <TableCell>{instructor.LastName}</TableCell>
                                <TableCell>{instructor.FirstName}</TableCell>
                                <TableCell>{instructor.MiddleInitial}</TableCell>
                                <TableCell align="right">
                                    <Button
                                        variant="contained"
                                        color="primary"
                                        size="small"
                                        style={{ marginRight: 8 }}
                                        startIcon={<AddIcon />}
                                        onClick={() => {
                                            let has_instructor = false

                                            for (let i = 0; i < chipInstructors?.length; i++) {
                                                console.log('has instructor id? ')
                                                if (chipInstructors[i]?.InstructorID == instructor.InstructorID) {
                                                    console.log('has instructor id yes!!!')
                                                    has_instructor = true;
                                                    break
                                                }
                                            }

                                            if (has_instructor) {
                                                setPopupOptions({
                                                    Heading: "Instructor Exists",
                                                    HeadingStyle: { background: POPUP_ERROR_COLOR, color: "white" },
                                                    Message: 'the instructor you want to add is already in this subject',
                                                });

                                                return
                                            }

                                            const new_curriculum = structuredClone(curriculum)
                                            new_curriculum.YearLevels[yearSemSubjectTarget.index_year_level].Semesters[yearSemSubjectTarget.index_semester].Subjects[yearSemSubjectTarget.subject_index]?.DesignatedInstructorsID?.push(instructor.InstructorID)

                                            const new_instructors = structuredClone(chipInstructors)

                                            new_instructors.push({
                                                InstructorID: instructor.InstructorID,
                                                Name: `${instructor.FirstName} ${instructor.MiddleInitial}. ${instructor.LastName}`
                                            })

                                            setChipInstructors(new_instructors);
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
                    rowsPerPageOptions={[4]}
                    component="div"
                    count={totalCount}
                    rowsPerPage={pageSize}
                    page={page}
                    onPageChange={async (_, new_page) => {
                        setPage(new_page);
                        await load_instructors(departmentID, pageSize, new_page, firstNameMatch, middleInitialMatch, lastNameMatch);
                    }}
                    onRowsPerPageChange={async (event) => {
                        const newPageSize = parseInt(event.target.value, 10);
                        setPageSize(newPageSize);
                        setPage(0);
                        await load_instructors(departmentID, newPageSize, 0, firstNameMatch, middleInitialMatch, lastNameMatch);
                    }}
                />
            </Box>
        </TableContainer>
    </>)
}
import { useState, useEffect } from 'react';
import { useRef } from 'react';

import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';

import "../assets/main.css";

import {
    Box, Button, Typography, TextField, Dialog, DialogTitle, DialogContent, DialogActions, Tabs, Tab, Accordion, AccordionSummary, AccordionDetails, IconButton, CircularProgress, Checkbox, FormControlLabel,
    Table,
    TableHead,
    TableRow,
    TableCell,
    TableBody,
    TableContainer,
    Paper,
    FormGroup,
    DialogContentText,
    ListItem,
    Chip,
    Tooltip,
    FormControl,
    InputLabel,
    Select,
    MenuItem
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckIcon from '@mui/icons-material/Check';
import ClearAllIcon from '@mui/icons-material/ClearAll';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import ClearIcon from '@mui/icons-material/Clear';
import { loadCurriculum, postCreateCurriculum, patchUpdateCurriculum } from '../js/curriculums';
import { fetchInstructorBasic } from '../js/instructors_v2';
import { Loading, Popup, POPUP_ERROR_COLOR, POPUP_WARNING_COLOR } from "../components/Loading";

import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import { CheckBox } from '@mui/icons-material';
import SubjectSelection from './SubjectSelection';
import InstructorSelection from './InstructorSelection';

const truncateText = (text, maxLength) => {
    if (text.length > maxLength) {
        return text.substring(0, maxLength) + '...';
    }

    return text;
};

const YEAR_LEVEL_NAMES = ["1st Year", "2nd Year", "3rd Year", "4th Year", "5th Year", "6th Year", "7th Year", "8th Year"]
const SEMESTER_NAMES = ["1st Semester", "2nd Semester", "Mid-year"]

function CurriculumView({
    mode, setMode,
    curriculum_id,
    department,
    onClose,
    popupOptions, setPopupOptions,
    reloadList,
    allDepartment,
}) {
    const [isLoading, setIsLoading] = useState(false)

    const [curriculum, setCurriculum] = useState(null)
    const [editedCurriculum, setEditedCurriculum] = useState(null)

    useEffect(() => {
        console.log('load mode :', mode)
        const useEffectAsyncs = async () => {
            try {
                if (mode === "new") {
                    const new_curriculum = {
                        CurriculumCode: "",
                        CurriculumID: 0,
                        CurriculumName: "",
                        DepartmentID: department.DepartmentID,
                        YearLevels: []
                    }
                    setCurriculum(new_curriculum);
                    setEditedCurriculum(structuredClone(new_curriculum));
                    return
                }

                setIsLoading(true);
                const loaded_curriculum = await loadCurriculum(curriculum_id);

                if (!loaded_curriculum) {
                    throw "Curriculum not found"
                }

                setCurriculum(loaded_curriculum);
                setEditedCurriculum(structuredClone(loaded_curriculum));

                console.log('loaded_curriculum:')
                console.log(loaded_curriculum)

                setIsLoading(false);
            } catch (err) {
                setPopupOptions({
                    Heading: "Failed to fetch specific curriculum data",
                    HeadingStyle: { background: POPUP_ERROR_COLOR, color: "white" },
                    Message: `${err}`
                });
                setIsLoading(false);
                setSemesterIndex("");
            }
        }

        useEffectAsyncs()
    }, [])

    const [isDialogFormOpen, setIsDialogFormOpen] = useState(false);
    const [subject, setSubject] = useState({
        LecHours: 0,
        LabHours: 0,
    });

    const [isAddingSubjects, setIsAddingSubjects] = useState(false)

    const [yearSemSubjectTarget, setYearSemSubjectTarget] = useState(null)

    const [chipInstructors, setChipInstructors] = useState([]);

    return (<>
        <Loading
            IsLoading={isLoading}
        />

        <Box>
            <Box display={'flex'} justifyContent={'space-between'} borderBottom={'gray solid thin'} padding={'0.5em'}>
                {(mode === "view") ?
                    (<Typography variant='h6'>{curriculum?.CurriculumCode}</Typography>) :
                    (<TextField
                        autoFocus
                        required
                        id="id-curriculum-code"
                        name="id-curriculum-code"
                        label="Curriculum Code"
                        type="text"
                        variant="outlined"
                        size='small'
                        defaultValue={editedCurriculum?.CurriculumCode || ""}
                        onChange={(e) => {
                            let edited_curriculum = editedCurriculum;
                            edited_curriculum.CurriculumCode = e.target.value;
                            setEditedCurriculum(edited_curriculum);
                        }}
                    />)
                }
                <Box display={'flex'} gap={'0.5em'}>
                    {(mode === "view") ? (<>
                        <Button
                            endIcon={<EditIcon />} size="small" color="primary" variant="contained"
                            onClick={() => {
                                console.log('mode :', mode)
                                setMode("edit")
                                setEditedCurriculum(structuredClone(curriculum))
                            }}
                        >
                            Edit
                        </Button>
                        <Button
                            endIcon={<ClearIcon />} size="small" color="error" variant="outlined"
                            onClick={() => onClose()}
                        >
                            Close
                        </Button>
                    </>) : null}

                    {(mode === "edit") ? (<>
                        <Button
                            endIcon={<CheckIcon />} size="small" color="primary" variant="contained"
                            onClick={async () => {
                                console.log('mode :', mode)
                                const updated_curriculum = structuredClone(editedCurriculum)

                                try {
                                    await patchUpdateCurriculum(updated_curriculum)
                                } catch (err) {
                                    setPopupOptions({
                                        Heading: "Failed to edit curriculum",
                                        HeadingStyle: { background: POPUP_ERROR_COLOR, color: "white" },
                                        Message: `${err}`
                                    });
                                }

                                setEditedCurriculum(updated_curriculum)
                                setCurriculum(updated_curriculum)
                                reloadList()
                                setMode("view")
                            }}
                        >
                            Apply Changes
                        </Button>
                        <Button
                            endIcon={<CancelIcon />} size="small" color="error" variant="outlined"
                            onClick={() => {
                                setMode("view")
                                setCurriculum(curriculum)
                                setEditedCurriculum(structuredClone(curriculum))
                            }}
                        >
                            Cancel Changes
                        </Button>
                    </>) : null}

                    {(mode === "new") ? (<>
                        <Button
                            endIcon={<SaveIcon />} size="small" color="primary" variant="contained"
                            onClick={async () => {
                                console.log('mode :', mode)
                                console.log(editedCurriculum)

                                const new_curriculum = structuredClone(editedCurriculum)

                                try {
                                    await postCreateCurriculum(new_curriculum)

                                    setEditedCurriculum(new_curriculum)
                                    setCurriculum(new_curriculum)
                                    reloadList()
                                    setMode("view")
                                } catch (err) {
                                    setPopupOptions({
                                        Heading: "Failed to add curriculum",
                                        HeadingStyle: { background: POPUP_ERROR_COLOR, color: "white" },
                                        Message: `${err}`
                                    });

                                    onClose()
                                }
                            }}
                        >
                            Save
                        </Button>
                        <Button
                            endIcon={<ClearAllIcon />} size="small" color="error" variant="outlined"
                            onClick={() => onClose()}
                        >
                            Discard
                        </Button>
                    </>) : null}
                </Box>
            </Box>

            <Box display={'flex'} alignItems={'baseline'} justifyContent={'space-between'} borderBottom={'grey solid thick'} marginBottom={'0.2em'} padding={'0.5em 0.5em 0.2em 0.5em'}>
                {(mode === "view") ?
                    <Typography variant='h6' width={'100%'}>{curriculum?.CurriculumName}</Typography> :
                    (<TextField
                        autoFocus
                        required
                        id="id-curriculum-name"
                        name="id-curriculum-name"
                        label="Curriculum Name"
                        type="text"
                        variant="outlined"
                        size='small'
                        sx={{ width: '100%' }}
                        defaultValue={editedCurriculum?.CurriculumName || ""}
                        onChange={(e) => {
                            let edited_curriculum = editedCurriculum;
                            edited_curriculum.CurriculumName = e.target.value;
                            setEditedCurriculum(edited_curriculum);
                        }}
                    />)
                }

                {mode === "edit" ?
                    <FormControl sx={{ width: 130 }} size="small" fullWidth>
                        <InputLabel id="label-id-edit-department">Department</InputLabel>
                        <Select
                            id="id-edit-department" labelId="label-id-edit-department" label="Department"
                            defaultValue={department?.DepartmentID}
                            onChange={(e) => {
                                let new_edit_curriculum = editedCurriculum
                                new_edit_curriculum.DepartmentID = Number(e.target.value)
                                setEditedCurriculum(new_edit_curriculum)
                            }}
                        >
                            {allDepartment ?
                                allDepartment.map((department, index) => {
                                    if (department?.DepartmentID > 0) {
                                        return <MenuItem key={index} value={department.DepartmentID}>{`${department.Code} - ${department.Name}`}</MenuItem>
                                    }

                                    return null
                                }) : null
                            }
                        </Select>
                    </FormControl>
                    : <Typography align='right' width={'100%'} variant='body1' fontStyle={'italic'}>
                        {allDepartment.find(dept => dept.DepartmentID == curriculum?.DepartmentID)?.Name || 'Department not found'}
                    </Typography>
                }
            </Box>

            <Box>
                {editedCurriculum?.YearLevels?.length !== 0 ? editedCurriculum?.YearLevels.map((year_level, index_year_level) => (<Accordion key={`accordion-id-curriculum-${index_year_level}`}>
                    <AccordionSummary
                        expandIcon={<ExpandMoreIcon />}
                        aria-controls={`yrlvl-panel${index_year_level + 1}-content`}
                        id={`${editedCurriculum?.CurriculumCode}-yrlvl-panel${index_year_level + 1}-header`}
                        sx={{
                            minHeight: '0px',
                            '&.Mui-expanded': {
                                minHeight: '0px',
                                color: 'whitesmoke',
                                backgroundColor: 'black',
                            },
                            padding: '0xp 0px',
                            height: '2.5em',
                            ":hover": { backgroundColor: 'orange' },
                        }}
                    >
                        <Box margin={'0px'} display={'flex'} justifyContent={'space-between'} minWidth={'11em'} gap={1}>
                            <Typography fontWeight={700} variant='h5' component="span">Year Level - {year_level.Name}</Typography>
                            {(mode === "view") ? (<Typography variant='h6' component="span">{year_level?.IsActive ? ' (Active)' : ' (Inactive)'}</Typography>) : null}
                        </Box>
                    </AccordionSummary>
                    <AccordionDetails sx={{ minHeight: '0px', padding: '0.2em 1em 0.5em 1em' }}>
                        <Box marginTop={1} padding={1} borderRadius={1} sx={{
                            boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.52)',
                        }}>
                        {(mode === "edit" || mode === "new") ? <Box display={'flex'} gap={'2em'} alignItems={'center'}>
                            <FormGroup>
                                <FormControlLabel control={
                                    <Checkbox
                                        checked={year_level.IsActive}
                                        onChange={(e) => {
                                            console.log(e.target.checked)
                                            const new_curriculum = structuredClone(editedCurriculum);
                                            new_curriculum.YearLevels[index_year_level].IsActive = e.target.checked;
                                            setEditedCurriculum(new_curriculum);
                                        }}
                                    />
                                } label="Active Year" />
                            </FormGroup>

                            <Button
                                size='large'
                                sx={{ minHeight: '10px', height: '2.3em' }}
                                variant='contained'
                                color="success"
                                startIcon={<AddIcon />}
                                onClick={() => {
                                    if (year_level.Semesters.length === SEMESTER_NAMES.length) {
                                        setPopupOptions({
                                            Heading: "Semester Limit Reach",
                                            HeadingStyle: { background: POPUP_WARNING_COLOR, color: "black" },
                                            Message: 'you can not add more semester to this year level',
                                        });
                                        return
                                    }

                                    const new_curriculum = structuredClone(editedCurriculum)
                                    new_curriculum.YearLevels[index_year_level].Semesters.push({
                                        Name: SEMESTER_NAMES[new_curriculum.YearLevels[index_year_level].Semesters.length],
                                        Sections: 0,
                                        Subjects: []
                                    })

                                    setEditedCurriculum(new_curriculum)
                                }}
                            >
                                Add Semester
                            </Button>

                            <Button
                                size='large'
                                sx={{ minHeight: '10px', height: '2.3em' }}
                                variant='contained'
                                color="error"
                                endIcon={<RemoveIcon />}
                                onClick={() => {
                                    if (year_level.Semesters.length === 0) {
                                        setPopupOptions({
                                            Heading: "Semester Limit Reach",
                                            HeadingStyle: { background: POPUP_WARNING_COLOR, color: "black" },
                                            Message: 'you can not decrease more semester to this year level',
                                        });
                                        return
                                    }

                                    const new_curriculum = structuredClone(editedCurriculum)
                                    new_curriculum.YearLevels[index_year_level].Semesters.pop()
                                    setEditedCurriculum(new_curriculum)
                                }}
                            >
                                Reduce Semester
                            </Button>
                        </Box> : null}
                        {year_level?.Semesters?.length !== 0 ? year_level?.Semesters.map((semester, index_semester) => (<Accordion key={`accordion-id-year-level-${editedCurriculum?.CurriculumCode}-${index_year_level}-${index_semester}`}>
                            <AccordionSummary
                                expandIcon={<ExpandMoreIcon />}
                                aria-controls={`sem-panel-${editedCurriculum?.CurriculumCode}-${index_year_level}-${index_semester + 1}-content`}
                                id={`sem-panel-${editedCurriculum?.CurriculumCode}-${index_year_level}-${index_semester + 1}-header`}
                                sx={{
                                    minHeight: '0px',
                                    '&.Mui-expanded': {
                                        minHeight: '0px',
                                        backgroundColor: 'darkgray',
                                        color: 'white'
                                    },
                                    padding: '0xp',
                                    height: '2em',
                                    ":hover": { backgroundColor: 'ButtonHighlight', color: 'black', outline: 'thin solid black' },
                                }}
                            >
                                <Typography variant='h6' component="span">{`${semester?.Name} - ${semester.Sections} Sections`}</Typography>
                            </AccordionSummary>
                            <AccordionDetails sx={{ minHeight: '0px', padding: '0.3em', display: 'flex', flexDirection: 'column', gap: '0.5em' }}>
                                <Box width={'100%'} display={'flex'} justifyContent={'space-between'} gap={'1em'} alignItems={'center'} paddingBlockEnd={'0px'}>
                                    {(mode === "edit" || mode === "new") ? <>
                                        <Button
                                            variant="contained"
                                            color="secondary"
                                            sx={{ minHeight: '2px', height: '2.3em' }}
                                            size="large"
                                            endIcon={<AddIcon />}
                                            onClick={() => {
                                                setIsAddingSubjects(true)
                                                setYearSemSubjectTarget({
                                                    index_year_level: index_year_level,
                                                    index_semester: index_semester,
                                                })
                                            }}
                                        >
                                            Add Subject
                                        </Button>

                                        <Box display={'flex'} alignItems={'baseline'} gap={2}>
                                            <Typography fontWeight={'bold'} variant='body1'>Number of Sections for {year_level?.Name}, {semester?.Name} </Typography>
                                            <TextField
                                                size='small'
                                                required
                                                id={`${editedCurriculum?.CurriculumCode}-${index_year_level}-${index_semester}-Sections`}
                                                sx={{ minWidth: '5em' }}
                                                name="Sections"
                                                label="Sections"
                                                type="number"
                                                variant="filled"
                                                defaultValue={semester?.Sections || 0}
                                                slotProps={{ htmlInput: { min: 0, max: 15 } }}
                                                onChange={(e) => {
                                                    semester.Sections = parseInt(e.target.value);
                                                    let edited_curriculum = editedCurriculum;
                                                    setEditedCurriculum(edited_curriculum);
                                                }}
                                            />
                                        </Box>
                                    </> : null}
                                </Box>
                                <TableContainer component={Paper}>
                                    <Table size="small">
                                        <TableHead>
                                            <TableRow>
                                                <TableCell>ID</TableCell>
                                                <TableCell>Code</TableCell>
                                                <TableCell>Name</TableCell>
                                                <TableCell>Lec Hr(s)</TableCell>
                                                <TableCell>Lab Hr(s)</TableCell>
                                                <TableCell>Designated Instructors</TableCell>
                                                {(mode === "edit" || mode === "new") ? <TableCell align="right">Actions</TableCell> : null}
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>{isLoading ? (
                                            <TableRow>
                                                <TableCell colSpan={(mode === "edit" || mode === "new") ? 7 : 6} align="center">
                                                    <CircularProgress />
                                                </TableCell>
                                            </TableRow>
                                        ) : (semester?.Subjects.map((subject, index_subject) => (
                                            <TableRow key={subject.ID}>
                                                <TableCell>{subject.ID}</TableCell>
                                                <TableCell>{subject.Code}</TableCell>
                                                <TableCell>
                                                    <Tooltip title={`${subject.Name}`}>
                                                        <span>{truncateText(subject.Name, 30)}</span>
                                                    </Tooltip>
                                                </TableCell>
                                                <TableCell>{subject.LecHours}</TableCell>
                                                <TableCell>{subject.LabHours}</TableCell>
                                                <TableCell>{`${subject?.DesignatedInstructorsID?.length ? subject?.DesignatedInstructorsID?.length + 'x' : 'auto assign'}`}</TableCell>
                                                {(mode === "edit" || mode === "new") ? <TableCell align='right'>
                                                    <Button
                                                        variant="contained"
                                                        color="primary"
                                                        size="large"
                                                        style={{ marginRight: 8 }}
                                                        startIcon={<EditIcon />}
                                                        onClick={async () => {
                                                            setSubject(subject);

                                                            setYearSemSubjectTarget({
                                                                index_year_level: index_year_level,
                                                                index_semester: index_semester,
                                                                subject_index: index_subject,
                                                            })

                                                            try {
                                                                console.log('modify subject')
                                                                const new_instructors = []

                                                                if (subject?.DesignatedInstructorsID) {
                                                                    for (let num of subject?.DesignatedInstructorsID) {
                                                                        const instructor_basic_info = await fetchInstructorBasic(num);
                                                                        new_instructors.push({
                                                                            InstructorID: instructor_basic_info.InstructorID,
                                                                            Name: `${instructor_basic_info.FirstName} ${instructor_basic_info.MiddleInitial}. ${instructor_basic_info.LastName}`
                                                                        })

                                                                        console.log(instructor_basic_info);
                                                                    }
                                                                }

                                                                setChipInstructors(new_instructors);
                                                            } catch (err) {
                                                                setPopupOptions({
                                                                    Heading: "Read Subject Error",
                                                                    HeadingStyle: { background: POPUP_WARNING_COLOR, color: "black" },
                                                                    Message: `${err}`,
                                                                });
                                                            }

                                                            setIsDialogFormOpen(true);
                                                        }}
                                                        sx={{ minHeight: '0px', fontSize: '1em', height: '2.2em', padding: '0px 0.8em', margin: '0px' }}
                                                    >
                                                        Modify
                                                    </Button>
                                                    <Button
                                                        sx={{ minHeight: '0px', fontSize: '1em', height: '2.2em', padding: '0px 0.8em', margin: '0px' }}
                                                        variant="contained"
                                                        color="error"
                                                        size="large"
                                                        endIcon={<RemoveCircleOutlineIcon />}
                                                        onClick={() => {
                                                            setIsLoading(true)
                                                            semester?.Subjects.splice(index_subject, 1)
                                                            setEditedCurriculum(structuredClone(editedCurriculum))
                                                            setIsLoading(false)
                                                        }}
                                                    >
                                                        Remove
                                                    </Button>
                                                </TableCell> : null}
                                            </TableRow>
                                        )))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </AccordionDetails>
                        </Accordion>)) : <Box padding={'1em'}><Typography fontStyle={'italic'}>empty semester</Typography></Box>}
                        </Box>
                    </AccordionDetails>
                </Accordion>)) : <Box padding={'1em'}><Typography fontStyle={'italic'}>empty year levels</Typography></Box>}
                <Box
                    display={'flex'}
                    justifyContent={'space-evenly'}
                    paddingTop={0}
                    paddingInline={3}
                    marginBottom={2}
                    gap={'3em'}
                >
                    {(mode === "new" || mode === "edit") ? <>
                        <Button
                            variant='contained'
                            color="success"
                            fullWidth
                            size='large'
                            startIcon={<AddIcon />}
                            onClick={() => {
                                if (editedCurriculum.YearLevels.length === YEAR_LEVEL_NAMES.length) {
                                    setPopupOptions({
                                        Heading: "Year Limit Reach",
                                        HeadingStyle: { background: POPUP_WARNING_COLOR, color: "black" },
                                        Message: 'you can not add more year level to this curriculum',
                                    });
                                    return
                                }

                                const new_curriculum = structuredClone(editedCurriculum)
                                new_curriculum.YearLevels.push({
                                    IsActive: true,
                                    Name: YEAR_LEVEL_NAMES[new_curriculum.YearLevels.length],
                                    Semesters: []
                                })

                                setEditedCurriculum(new_curriculum)
                            }}
                        >
                            Add Year
                        </Button>

                        <Button
                            variant='contained'
                            color="error"
                            endIcon={<RemoveIcon />}
                            fullWidth
                            size='large'
                            onClick={() => {
                                if (editedCurriculum.YearLevels.length === 0) {
                                    setPopupOptions({
                                        Heading: "Year Limit Reach",
                                        HeadingStyle: { background: POPUP_WARNING_COLOR, color: "black" },
                                        Message: 'you can not remove more year level to this curriculum',
                                    });
                                    return
                                }

                                const new_curriculum = structuredClone(editedCurriculum)
                                new_curriculum.YearLevels.pop()
                                setEditedCurriculum(new_curriculum)
                            }}
                        >
                            Reduce Year
                        </Button>
                    </> : null}
                </Box>
            </Box>

            {/* modify subject dialog */}
            <Dialog
                open={isDialogFormOpen}
                onClose={() => setIsDialogFormOpen(false)}
                fullWidth
                maxWidth="xl"
                slotProps={{
                    paper: {
                        component: 'form',
                        onSubmit: async (event) => {
                            try {
                                event.preventDefault();

                                const formData = new FormData(event.currentTarget);
                                const formJson = Object.fromEntries(formData.entries());

                                console.log('subject edit form json submit data:')
                                console.log(formJson)

                                // when a subject's "modify" button was clicked, somewhere the `subject` state will be set by that
                                // associated subject in the curriculum, and since the `subject` state has the same reference as the
                                // one in the selected subject in the `editedCurriculum` state we can just edit the subject.LabHours
                                // and subject.LecHours directly and just update the `editedCurriculum` state to force rerender.

                                subject.LecHours = parseInt(formJson.ModifySubjectDialogForm_LecHours, 10)
                                subject.LabHours = parseInt(formJson.ModifySubjectDialogForm_LabHours, 10)

                                const new_designated_instructor_ids = []

                                for (let i = 0; i < chipInstructors?.length; i++) {
                                    new_designated_instructor_ids.push(parseInt(chipInstructors[i].InstructorID, 10))
                                }

                                subject.DesignatedInstructorsID = new_designated_instructor_ids;

                                console.log('if here test debug msg 5')

                                let updated_curriculum = structuredClone(editedCurriculum);
                                setEditedCurriculum(updated_curriculum);
                            } catch (err) {
                                setPopupOptions({
                                    Heading: "Operation Failed",
                                    HeadingStyle: { background: POPUP_ERROR_COLOR, color: "white" },
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
                <DialogTitle>{`Modifying ${subject?.Code}`}</DialogTitle>
                <DialogContent>
                    <DialogContentText minWidth={'25em'}>
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

                    <Box marginTop={'1em'} display={'flex'} flexDirection={'column'} gap={1}>
                        <Box display={'flex'} justifyContent={'space-between'} alignItems={'center'}>
                            <Typography variant='caption'>Add one or more instructor(s) you want to assign to this subject</Typography>
                        </Box>
                        <Box display={'flex'} flexWrap={'wrap'} gap={1} padding={'0.3em'}>{chipInstructors.map((instructor) => (
                            <Chip
                                key={`chip-key-${instructor.InstructorID}`}
                                label={`${instructor.InstructorID} | ${instructor.Name}`}
                                onDelete={() => {
                                    setChipInstructors(
                                        chipInstructors.filter(iter_instructor => iter_instructor?.InstructorID != instructor?.InstructorID)
                                    )
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
                    <Button variant='outlined' type="submit">Save Subject</Button>
                    <Button variant='outlined' onClick={() => {
                        setIsDialogFormOpen(false);
                        setChipInstructors([]);
                    }}>Cancel</Button>
                </DialogActions>
            </Dialog>

            {/* add subjects */}

            <SubjectSelection
                open={isAddingSubjects}
                onClose={() => {
                    setIsAddingSubjects(false)
                    setYearSemSubjectTarget(null)
                }}
                curriculum={editedCurriculum}
                setEditedCurriculum={setEditedCurriculum}
                yearSemSubjectTarget={yearSemSubjectTarget}
            />

        </Box>
    </>);
}

export default CurriculumView;
import { useCallback, useEffect, useState } from 'react';

import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';

import {
    Box, TextField, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TablePagination,
    Paper, CircularProgress, Dialog, DialogContent, DialogContentText, DialogTitle, DialogActions, Select, MenuItem, FormControl, InputLabel,
    IconButton
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import AddIcon from '@mui/icons-material/Add';
import { fetchCurriculumPageList, deleteRemoveCurriculum } from '../js/curriculums';
import { fetchAllDepartments } from '../js/departments'
import { Popup, POPUP_ERROR_COLOR, POPUP_SUCCESS_COLOR } from '../components/Loading';

import CurriculumView from './CurriculumView'
import { MainHeader } from '../components/Header';

import SearchIcon from '@mui/icons-material/Search';

const truncateText = (text, maxLength) => {
    if (text.length > maxLength) {
        return text.substring(0, maxLength) + '...';
    }
    return text;
};

function CurriculumsTableList() {
    const [isView, setIsView] = useState(false)
    const [popupOptions, setPopupOptions] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const [allDepartment, setAllDepartment] = useState([]); // fetch on page load
    const [departmentID, setDepartmentID] = useState("");
    const [selectedDepartment, setSelectedDepartment] = useState("")

    useEffect(() => {
        const useEffectAsyncs = async () => {
            try {
                setIsLoading(true);

                const all_departments = await fetchAllDepartments();

                setAllDepartment(all_departments);

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

    const [page, setPage] = useState(0);
    const [pageSize, setPageSize] = useState(10);
    const [totalCount, setTotalCount] = useState(0);
    const [searchTerm, setSearchTerm] = useState("");
    const [curriculumList, setCurriculumList] = useState([]);
    const load_curriculums = useCallback(async (page_size, new_page, department_id, search_term = "") => {
        setIsLoading(true);
        try {
            let curriculum_page = await fetchCurriculumPageList(page_size, new_page, department_id, search_term, "");

            if (search_term && !curriculum_page.Curriculums?.length) {
                curriculum_page = await fetchCurriculumPageList(page_size, new_page, department_id, "", search_term);
            }

            setCurriculumList(curriculum_page.Curriculums);
            setTotalCount(curriculum_page.TotalCurriculums);
        } catch (err) {
            setPopupOptions({
                Heading: "Failed to Fetch Curriculums",
                HeadingStyle: { background: POPUP_ERROR_COLOR, color: "white" },
                Message: `${err.message}`,
            });
        }
        setIsLoading(false);
    }, []);
    const handleDepartmentChange = async (event) => {
        setDepartmentID(event.target.value);

        setPage(0)
        await load_curriculums(pageSize, 0, event.target.value, searchTerm);
    }


    const [isDialogDeleteShow, setIsDialogDeleteShow] = useState(false);
    const [curriculumToDelete, setCurriculumToDelete] = useState(null);
    const handleCurriculumDelete = async (curriculum_id) => {
        setIsLoading(true);
        try {
            await deleteRemoveCurriculum(curriculum_id);
            await load_curriculums(pageSize, page, departmentID, codeMatch, nameMatch);

            setPopupOptions({
                Heading: "Delete Success",
                HeadingStyle: { background: POPUP_SUCCESS_COLOR, color: "white" },
                Message: "The curriculum was successfully deleted",
            });
        } catch (err) {
            setPopupOptions({
                Heading: "Delete Failed",
                HeadingStyle: { background: POPUP_ERROR_COLOR, color: "white" },
                Message: `${err.message}`,
            });
        }
        setCurriculumToDelete(null);
        setIsLoading(false);
        setIsDialogDeleteShow(false);
    };

    const [mode, setMode] = useState("")
    const [curriculumBasicInfo, setCurriculumBasicInfo] = useState(null)

    return (<>
        <MainHeader pageName={'curriculums'}>

        <Popup popupOptions={popupOptions} closeButtonActionHandler={() => setPopupOptions(null)} />

        <Box display={!isView ? 'block' : 'none'}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', padding: '1.5em' }}>
                <Box display={'flex'} gap={'0.5em'}>
                    <FormControl sx={{ minWidth: 150, maxWidth: 151 }} size="small">
                        <InputLabel id="label-id-department">Department</InputLabel>
                        <Select
                            id="id-department" labelId="label-id-department" label="Department"
                            value={departmentID}
                            onChange={(e) => {
                                handleDepartmentChange(e)

                                for (let i = 0; i < allDepartment?.length; i++) {
                                    if (allDepartment[i].DepartmentID === e.target.value) {
                                        setSelectedDepartment(allDepartment[i])
                                        break
                                    }
                                }
                            }}
                        >
                            {allDepartment ?
                                allDepartment.map((department, index) => {
                                    if (department.DepartmentID > 0) {
                                        return <MenuItem key={index} value={department.DepartmentID}>{`${department.Code} - ${department.Name}`}</MenuItem>
                                    }

                                    return null
                                }) : null
                            }
                        </Select>
                    </FormControl>

                    {(Number.isInteger(Number.parseInt(departmentID, 10))) ? <>
                        <TextField
                            sx={{ minWidth: 260, maxWidth: 360 }}
                            size="small"
                            label="Search curriculum"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    setPage(0);
                                    load_curriculums(pageSize, 0, departmentID, e.target.value);
                                }
                            }}
                        />
                        <Button
                            size="small"
                            variant="contained"
                            onClick={() => {
                                setPage(0);
                                load_curriculums(pageSize, 0, departmentID, searchTerm);
                            }}
                        >
                            <SearchIcon />
                        </Button>
                    </> : null}
                </Box>

                {(Number.isInteger(Number.parseInt(departmentID, 10))) ? <>
                    <Button
                        endIcon={<AddIcon />}
                        size="small"
                        color="secondary"
                        variant="contained"
                        onClick={() => {
                            setCurriculumBasicInfo(null);
                            setMode("new");
                            setIsView(true)
                        }}
                        disabled={!selectedDepartment}
                    >
                        Add New Curriculum
                    </Button>
                </> : null}
            </Box>

            <Box paddingInline={4}>
                <TableContainer component={Paper}>
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell>ID</TableCell>
                                <TableCell>Code</TableCell>
                                <TableCell>Name</TableCell>
                                <TableCell align="right">Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={4} align="center">
                                        <CircularProgress />
                                    </TableCell>
                                </TableRow>
                            ) : (
                                curriculumList.map((curriculum) => (
                                    <TableRow key={curriculum.CurriculumID}>
                                        <TableCell>{curriculum.CurriculumID}</TableCell>
                                        <TableCell>{curriculum.CurriculumCode}</TableCell>
                                        <TableCell>{truncateText(curriculum.CurriculumName, 90)}</TableCell>
                                        <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                                            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5em', flexWrap: 'nowrap' }}>
                                                <IconButton
                                                    color="view"
                                                    onClick={() => {
                                                        setCurriculumBasicInfo(curriculum);
                                                        setMode("view");
                                                        setIsView(true)
                                                    }}
                                                >
                                                    <VisibilityIcon />
                                                </IconButton>
                                                <IconButton
                                                    color="delete"
                                                    onClick={() => {
                                                        setCurriculumToDelete(curriculum);
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
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                        <TablePagination
                            component="div"
                            count={totalCount}
                            rowsPerPage={pageSize}
                            page={page}
                            rowsPerPageOptions={[]}
                            labelRowsPerPage={() => ''}
                            onPageChange={async (_, new_page) => {
                                setPage(new_page);
                                await load_curriculums(pageSize, new_page, departmentID, searchTerm);
                            }}
                        />
                    </Box>
                </TableContainer>
            </Box>
        </Box>

        <Dialog
            open={isDialogDeleteShow}
            onClose={() => setIsDialogDeleteShow(false)}
            aria-labelledby="alert-dialog-title"
            aria-describedby="alert-dialog-description"
        >
            <DialogTitle id="alert-dialog-title">Delete Curriculum</DialogTitle>
            <DialogContent>
                <DialogContentText id="alert-dialog-description">
                    {`Are you sure you want to remove "${curriculumToDelete?.CurriculumName}"?`}
                </DialogContentText>
            </DialogContent>
            <DialogActions>
                <Button variant='outlined' onClick={() => handleCurriculumDelete(curriculumToDelete?.CurriculumID)}>Yes</Button>
                <Button variant='outlined' onClick={() => setIsDialogDeleteShow(false)}>No</Button>
            </DialogActions>
        </Dialog>

        {(mode === "view" || mode === "edit" || mode === "new") ? <CurriculumView
            mode={mode}
            setMode={setMode}
            curriculum_id={curriculumBasicInfo?.CurriculumID}
            department={selectedDepartment}
            onClose={() => {
                setIsView(false)
                setMode("")
                setCurriculumBasicInfo(null)
            }}
            popupOptions={popupOptions}
            setPopupOptions={setPopupOptions}
            reloadList={async () => {
                await load_curriculums(pageSize, page, departmentID, searchTerm);
            }}

            allDepartment={allDepartment}
        /> : null}
        </MainHeader>
    </>);
}

export default CurriculumsTableList;

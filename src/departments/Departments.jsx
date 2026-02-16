import { StrictMode, useState, useEffect } from "react";
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

import DoneIcon from '@mui/icons-material/Done';
import CancelIcon from '@mui/icons-material/Cancel';
import ClearAllIcon from '@mui/icons-material/ClearAll';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';

import "../assets/main.css";
import { fetchDepartmentsPaginated, deleteRemoveDepartment, patchUpdateDepartment, postCreateDepartment } from "../js/departments";
import { Popup, POPUP_ERROR_COLOR, POPUP_SUCCESS_COLOR, POPUP_WARNING_COLOR } from "../components/Loading";
import { MainHeader } from "../components/Header";
import theme from "../components/Theme";

const truncateText = (text, maxLength) => {
    if (text.length > maxLength) {
        return text.substring(0, maxLength) + '...';
    }
    return text;
};

function Departments() {
    const [mode, setMode] = useState(""); // "new" or "edit"
    const [isDialogFormOpen, setIsDialogFormOpen] = useState(false);
    const [popupOptions, setPopupOptions] = useState(null);
    const [isDialogDeleteShow, setIsDialogDeleteShow] = useState(false);
    const [departmentToDelete, setDepartmentToDelete] = useState(null);

    const [department, setDepartment] = useState({
        Code: "",
        Name: "",


    });

    const [departmentList, setDepartmentList] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [page, setPage] = useState(0);
    const [pageSize, setPageSize] = useState(10);
    const [totalCount, setTotalCount] = useState(0);

    const [codeMatch, setCodeMatch] = useState("");
    const [nameMatch, setNameMatch] = useState("");

    const [jumpToPage, setJumpToPage] = useState('');

    const totalPages = Math.ceil(totalCount / pageSize);

    const load_departments = async (page_size, new_page, code_match = "", name_match = "") => {
        setIsLoading(true);
        try {
            const departmentsData = await fetchDepartmentsPaginated(page_size, new_page, code_match, name_match);

            console.log('departmentsData: ', departmentsData)

            setDepartmentList(departmentsData.Departments);
            setTotalCount(departmentsData.TotalDepartments);
        } catch (err) {
            setPopupOptions({
                Heading: "Failed to Fetch Departments",
                HeadingStyle: { background: POPUP_ERROR_COLOR, color: "white" },
                Message: `${err.message}`,
            });
        }
        setIsLoading(false);
    };

    const handleDepartmentDelete = async (department_id) => {
        setIsLoading(true);
        try {
            await deleteRemoveDepartment(department_id);
            await load_departments(pageSize, page, codeMatch, nameMatch);
            setPopupOptions({
                Heading: "Delete Success",
                HeadingStyle: { background: POPUP_SUCCESS_COLOR, color: "white" },
                Message: "The department was successfully deleted",
            });
        } catch (err) {
            setPopupOptions({
                Heading: "Delete Failed",
                HeadingStyle: { background: POPUP_ERROR_COLOR, color: "white" },
                Message: `${err.message}`,
            });
        }
        setDepartmentToDelete(null);
        setIsLoading(false);
        setIsDialogDeleteShow(false);
    };

    const handleJumpToPage = () => {
        const pageNumber = parseInt(jumpToPage, 10);
        if (pageNumber > 0 && pageNumber <= totalPages) {
            const newPage = pageNumber - 1; // Convert to 0-based index
            setPage(newPage);
            load_departments(pageSize, newPage, codeMatch, nameMatch);
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
        load_departments(pageSize, page, codeMatch, nameMatch);
    }, []);

    return (<>

        <MainHeader pageName={'departments'} />

        <Popup popupOptions={popupOptions} closeButtonActionHandler={() => setPopupOptions(null)} />

        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', padding: '0.5em' }}>
                <Box display={'flex'} gap={'0.5em'}>
                    <TextField
                        sx={{ minWidth: 100, maxWidth: 130 }}
                        size="small"
                        label="Search Code"
                        value={codeMatch}
                        onChange={(e) => setCodeMatch(e.target.value)}
                    />
                    <TextField
                        sx={{ minWidth: 100, maxWidth: 500 }}
                        size="small"
                        label="Search Department Name"
                        value={nameMatch}
                        onChange={(e) => setNameMatch(e.target.value)}
                    />
                    <Button
                        size="small"
                        variant="contained"
                        onClick={() => {
                            setPage(0);
                            load_departments(pageSize, 0, codeMatch, nameMatch);
                        }}
                    >
                        <SearchIcon/>
                    </Button>
                </Box>

                <Button
                    endIcon={<AddIcon />}
                    size="medium"
                    color="secondary"
                    variant="contained"
                    onClick={() => {

                        setMode("new");
                        setIsDialogFormOpen(true);
                    }}
                >
                    Add New Department
                </Button>
            </Box>

            <Box
                paddingInlineStart={0}
                paddingInlineEnd={3}
                display={'flex'}
                justifyContent={'space-between'}
            >
                <Typography marginInline={'0.5em'} variant="h6">Departments</Typography>
            </Box>

            <Box paddingInline={1}>
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
                            departmentList.map((department) => ((department.DepartmentID) ?
                                <TableRow key={department.DepartmentID}>
                                    <TableCell>{department.DepartmentID}</TableCell>
                                    <TableCell>{department.Code}</TableCell>
                                    <TableCell>{truncateText(department.Name, 90)}</TableCell>
                                    <TableCell align="right">
                                        <Button
                                            disabled={department.DepartmentID == 0}
                                            variant="contained"
                                            color="primary"
                                            size="small"
                                            style={{ marginRight: 8 }}
                                            startIcon={<EditIcon />}
                                            onClick={() => {
                                                setDepartment(department);
                                                setMode("edit");
                                                setIsDialogFormOpen(true);
                                            }}
                                        >
                                            Edit
                                        </Button>
                                        <Button
                                            disabled={department.DepartmentID == 0}
                                            variant="contained"
                                            color="error"
                                            size="small"
                                            endIcon={<DeleteIcon />}
                                            onClick={() => {
                                                setDepartmentToDelete(department);
                                                setIsDialogDeleteShow(true);
                                            }}
                                        >
                                            Delete
                                        </Button>
                                    </TableCell>
                                </TableRow> : null
                            ))
                        )}
                    </TableBody>
                </Table>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <TablePagination
                        rowsPerPageOptions={[5, 10, 15]}
                        component="div"
                        count={totalCount}
                        rowsPerPage={pageSize}
                        page={page}
                        onPageChange={async (_, new_page) => {
                            setPage(new_page);
                            await load_departments(pageSize, new_page, codeMatch, nameMatch);
                        }}
                        onRowsPerPageChange={async (event) => {
                            const newPageSize = parseInt(event.target.value, 10);
                            setPageSize(newPageSize);
                            setPage(0);
                            await load_departments(newPageSize, 0, codeMatch, nameMatch);
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
            </Box>
        </Box>

        <Dialog
            open={isDialogDeleteShow}
            onClose={() => setIsDialogDeleteShow(false)}
            aria-labelledby="alert-dialog-title"
            aria-describedby="alert-dialog-description"
        >
            <DialogTitle id="alert-dialog-title">Remove Department</DialogTitle>
            <DialogContent>
                <DialogContentText id="alert-dialog-description">
                    {`Are you sure you want to remove "${departmentToDelete?.Name}"?`}
                </DialogContentText>
            </DialogContent>
            <DialogActions>
                <Button variant='outlined' onClick={() => handleDepartmentDelete(departmentToDelete?.DepartmentID)}>Yes</Button>
                <Button variant='outlined' onClick={() => setIsDialogDeleteShow(false)}>No</Button>
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

                        const departmentData = {
                            Code: formJson.Code,
                            Name: formJson.Name,
                            SaltedHashedPassword: formJson.SaltedHashedPassword
                        };

                        if (mode === "edit") {
                            departmentData.DepartmentID = department.DepartmentID;
                        }

                        try {
                            setIsLoading(true);

                            if (formJson.SaltedHashedPassword !== formJson.RetypedPassword) {
                                throw Error('password not the same')
                            }

                            if (mode === "new") {
                                await postCreateDepartment(departmentData);
                                setPopupOptions({
                                    Heading: "Add Successful",
                                    HeadingStyle: { background: POPUP_SUCCESS_COLOR, color: "white" },
                                    Message: "A new department was added",
                                });
                            } else if (mode === "edit") {
                                await patchUpdateDepartment(departmentData);
                                setPopupOptions({
                                    Heading: "Edit Successful",
                                    HeadingStyle: { background: POPUP_SUCCESS_COLOR, color: "white" },
                                    Message: "Changes to the department data are saved",
                                });
                            }
                            await load_departments(pageSize, page, codeMatch, nameMatch);
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
            <DialogTitle>{mode === "new" ? "Add New Department" : "Edit Department"}</DialogTitle>
            <DialogContent>
                <DialogContentText>
                    {mode === "new" ? "Enter the department details and save it to add a new department." : "Edit the current department information and apply your changes"}
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
                    defaultValue={department?.Code || ""}
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
                    defaultValue={department?.Name || ""}
                />

                <TextField
                    required={mode === "new"}
                    margin="dense"
                    id="SaltedHashedPassword"
                    name="SaltedHashedPassword"
                    label={mode === "new" ? "Password" : "New Password"}
                    type="password"
                    fullWidth
                    variant="standard"
                    defaultValue={""}
                />

                <TextField
                    required={mode === "new"}
                    margin="dense"
                    id="retype-password"
                    name="RetypedPassword"
                    label={mode === "new" ? "Re-Type Password" : "New Re-Type Password"}
                    type="password"
                    fullWidth
                    variant="standard"
                    defaultValue={""}
                />

            </DialogContent>
            <DialogActions>
                <Button variant="outlined" type="submit">{mode === "new" ? "Save" : "Apply Changes"}</Button>
                <Button variant="outlined" onClick={() => setIsDialogFormOpen(false)}>Cancel</Button>
            </DialogActions>
        </Dialog>
    </>);
}

createRoot(document.getElementById("root")).render(
    <StrictMode>
        <ThemeProvider theme={theme}>
            <Departments />
        </ThemeProvider>
    </StrictMode>
);
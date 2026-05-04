import { useCallback, useEffect, useState } from "react";
import PreviewIcon from "@mui/icons-material/Preview";

import {
  Box,
  FormControl,
  InputLabel,
  TextField,
  Select,
  MenuItem,
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
  OutlinedInput,
  Checkbox,
  ListItemText,
  Chip,
  IconButton,
} from "@mui/material";

import {
  Popup,
  POPUP_ERROR_COLOR,
  POPUP_SUCCESS_COLOR,
} from "../components/Loading";

import EditIcon from "@mui/icons-material/Edit";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";

import "../assets/main.css";

import { fetchAllDepartments, fetchWho } from "../js/departments";
import {
  fetchDepartmentRooms,
  deleteRemoveRoom,
  patchUpdateRoom,
  postCreateRoom,
} from "../js/rooms";
import { MainHeader } from "../components/Header";
import RoomSchedule from "./RoomSchedule";

function RoomTypeName(room_type) {
  switch (room_type) {
    case 0:
      return "Lecture";
    case 1:
      return "Laboratory";
    case 2:
      return "Gym";
  }
}

function Rooms() {
  const ROOM_TYPES = [
    0, // lecture
    1, // laboratory
    2, // gym
  ];

  const [mode, setMode] = useState("");
  const [isDialogFormOpen, setIsDialogFormOpen] = useState(false);

  const [popupOptions, setPopupOptions] = useState(null);
  const [isDialogDeleteShow, setIsDialogDeleteShow] = useState(false);
  const [roomToDelete, setRoomToDelete] = useState(null);
  const handleRoomDelete = async (room_id) => {
    setLoading(true);

    try {
      await deleteRemoveRoom(room_id);
      await load_rooms(departmentID, pageSize, page, searchTerm);

      setPopupOptions({
        Heading: "Delete Success",
        HeadingStyle: { background: POPUP_SUCCESS_COLOR, color: "white" },
        Message: "the room was succesfully deleted",
      });
    } catch (err) {
      setPopupOptions({
        Heading: "Delete Failed",
        HeadingStyle: { background: POPUP_ERROR_COLOR, color: "white" },
        Message: `${err}`,
      });
    }

    setRoomToDelete(null);
    setLoading(false);
    setIsDialogDeleteShow(false);

  };

  const [room, setRoom] = useState({
    Name: null,
    Capacity: null,
    RoomType: null,
  });

  const [roomList, setRoomList] = useState([]);

  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(5);
  const [totalCount, setTotalCount] = useState(0);

  const [departmentList, setDepartmentList] = useState("");
  useEffect(() => {
    const useEffectAsyncs = async () => {
      try {
        setLoading(true);

        const who = await fetchWho();
        const loggedInDepartmentID = Number(who);

        if (!Number.isInteger(loggedInDepartmentID)) {
          throw new Error("Unable to resolve logged-in department");
        }

        const all_departments = await fetchAllDepartments();
        const loggedInDepartment = all_departments.find(
          (department_iter) =>
            Number(department_iter.DepartmentID) === loggedInDepartmentID,
        );

        if (!loggedInDepartment) {
          throw new Error("Logged-in department data was not found");
        }

        setDepartmentList([loggedInDepartment]);
        setDepartmentID(loggedInDepartment.DepartmentID);
        setDepartment(loggedInDepartment);
        setLoading(false);
      } catch (err) {
        setPopupOptions({
          Heading: "Failed to Fetch All Department Data",
          HeadingStyle: { background: POPUP_ERROR_COLOR, color: "white" },
          Message: `${err}`,
        });
        setLoading(false);
      }
    };

    useEffectAsyncs();
  }, []);

  const load_rooms = useCallback(async (department_id, page_size, new_page, name_match = "") => {
    setLoading(true);

    try {
      const rooms = await fetchDepartmentRooms(
        department_id,
        page_size,
        new_page,
        name_match,
      );
      setRoomList(rooms.Rooms);
      setTotalCount(rooms.TotalRooms);
    } catch (err) {
      setPopupOptions({
        Heading: "Failed to fetch rooms",
        HeadingStyle: { background: POPUP_ERROR_COLOR, color: "white" },
        Message: `${err}`,
      });
    }

    setSharingDepartmentIDs([]);
    setSharingDepartments([]);

    setLoading(false);
  }, []);

  const [departmentID, setDepartmentID] = useState("");
  const [department, setDepartment] = useState("");

  const [sharingDepartmentIDs, setSharingDepartmentIDs] = useState([]);
  const [sharingDepartments, setSharingDepartments] = useState([]);

  // search bars

  const [searchTerm, setSearchTerm] = useState("");
  useEffect(() => {
    if (!Number.isInteger(Number.parseInt(departmentID, 10))) {
      return;
    }

    const debounceTimer = setTimeout(() => {
      load_rooms(departmentID, pageSize, page, searchTerm);
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [departmentID, load_rooms, page, pageSize, searchTerm]);

  // room schedule view

  const [isViewRoomSchedule, setIsViewRoomSchedule] = useState(false);
  const [roomToView, setRoomToView] = useState(null);

  return (
    <>
      <MainHeader pageName={"rooms"}>

      <Popup
        popupOptions={popupOptions}
        closeButtonActionHandler={() => {
          setPopupOptions(null);
        }}
      />

      {!isViewRoomSchedule ? (
        <Box>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              padding: "0.5em",
            }}
          >
            <Box sx={{ display: "flex", flexDirection: "row", gap: 2 }}>

              {Number.isInteger(Number.parseInt(departmentID, 10)) ? (
                <TextField
                  disabled={!Number.isInteger(Number.parseInt(departmentID, 10))}
                  sx={{ minWidth: 300 }}
                  size="small"
                  label="Search room name"
                  value={searchTerm}
                  onChange={(e) => {
                    setPage(0);
                    setSearchTerm(e.target.value);
                  }}
                />
              ) : null}
            </Box>

            {Number.isInteger(Number.parseInt(departmentID, 10)) ? (
              <Button
                disabled={!Number.isInteger(Number.parseInt(departmentID, 10))}
                endIcon={<AddIcon />}
                size="medium"
                color="secondary"
                variant="contained"
                onClick={() => {
                  const new_empty_room_fields = {
                    Name: null,
                    Capacity: null,
                    RoomType: null,
                  };

                  setSharingDepartmentIDs([]);
                  setSharingDepartments([]);

                  setRoom(new_empty_room_fields);
                  setMode("new");
                  setIsDialogFormOpen(true);
                }}
              >
                Add New Room to {department.Code}
              </Button>
            ) : null}
          </Box>

          <Box paddingInline={1}>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ height: 1 }}>
                    <TableCell>Room ID</TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell>Capacity</TableCell>
                    <TableCell>Room Type</TableCell>
                    {departmentID == 0 ? (
                      <TableCell>Department Sharing</TableCell>
                    ) : null}
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell
                        colSpan={departmentID == 0 ? 6 : 5}
                        align="center"
                      >
                        <CircularProgress />
                      </TableCell>
                    </TableRow>
                  ) : (
                    roomList?.map((room, index) => (
                      <TableRow key={room.RoomID}>
                        <TableCell>{room.RoomID}</TableCell>
                        <TableCell>{room.Name}</TableCell>
                        <TableCell>{room.Capacity}</TableCell>
                        <TableCell>{RoomTypeName(room.RoomType)}</TableCell>
                        {departmentID == 0 ? (
                          <TableCell>
                            {room?.SharingDepartments
                              ? `${room?.SharingDepartments?.length}x`
                              : "all"}
                          </TableCell>
                        ) : null}
                        <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5em', flexWrap: 'nowrap' }}>
                            <IconButton
                              color="view"
                              disabled={loading}
                              onClick={() => {
                                setRoomToView(room);
                                setIsViewRoomSchedule(true);
                              }}
                            >
                              <PreviewIcon />
                            </IconButton>
                            <IconButton
                              color="edit"
                              disabled={loading}
                              onClick={() => {
                                if (room.SharingDepartments) {
                                  setSharingDepartmentIDs(
                                    room.SharingDepartments,
                                  );

                                  const current_sharing_departments =
                                    room.SharingDepartments?.map((id) => {
                                      return departmentList.find((find_dept) => {
                                        return id == find_dept.DepartmentID;
                                      });
                                    });

                                  setSharingDepartments(
                                    current_sharing_departments,
                                  );
                                } else {
                                  setSharingDepartmentIDs([]);
                                  setSharingDepartments([]);
                                }

                                setRoom(room);
                                setMode("edit");
                                setIsDialogFormOpen(true);
                              }}
                            >
                              <EditIcon />
                            </IconButton>
                            <IconButton
                              color="delete"
                              disabled={loading}
                              onClick={async () => {
                                setRoomToDelete(room);
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

              <TablePagination
                component="div"
                count={totalCount}
                rowsPerPage={pageSize}
                page={page}
                rowsPerPageOptions={[5, 10, 25]}
                onPageChange={(_, new_page) => {
                  setPage(new_page);
                }}
                onRowsPerPageChange={(event) => {
                  setPageSize(Number.parseInt(event.target.value, 10));
                  setPage(0);
                }}
              />
            </TableContainer>
          </Box>
        </Box>
      ) : (
        <RoomSchedule
          roomToView={roomToView}
          setRoomToView={setRoomToView}
          setIsViewRoomSchedule={setIsViewRoomSchedule}
          selectedDepartment={department}
          popupOptions={popupOptions}
          setPopupOptions={setPopupOptions}
        />
      )}

      {/* delete dialog */}
      <Dialog
        open={isDialogDeleteShow}
        onClose={() => {
          setIsDialogDeleteShow(false);
          setRoomToDelete(null);
        }}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">Remove Room</DialogTitle>

        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            {`Are you sure you want to remove "${roomToDelete?.Name}"?`}
          </DialogContentText>
        </DialogContent>

        <DialogActions>
          <Button
            variant="outlined"
            onClick={() => {
              handleRoomDelete(roomToDelete?.RoomID);
            }}
          >
            Yes
          </Button>

          <Button
            variant="outlined"
            onClick={() => {
              setIsDialogDeleteShow(false);
            }}
          >
            No
          </Button>
        </DialogActions>
      </Dialog>

      {/* add/edit room dialog */}
      <Dialog
        open={isDialogFormOpen}
        onClose={() => {
          setIsDialogFormOpen(false);
        }}
        slotProps={{
          paper: {
            component: "form",
            onSubmit: async (event) => {
              event.preventDefault();
              const formData = new FormData(event.currentTarget);
              const formJson = Object.fromEntries(formData.entries());

              if (mode === "new") {
                formJson.DepartmentID = departmentID;
              } else {
                formJson.DepartmentID = Number(formJson.DepartmentID);
              }

              if (departmentID == 0) {
                formJson.SharingDepartments = sharingDepartmentIDs;
              } else {
                formJson.SharingDepartments = [];
              }

              formJson.Capacity = Number(formJson.Capacity);
              formJson.RoomType = Number(formJson.RoomType);

              try {
                setLoading(true);

                if (mode === "edit") {
                  formJson.RoomID = room.RoomID;
                  await patchUpdateRoom(formJson);

                  setPopupOptions({
                    Heading: "Edit Successful",
                    HeadingStyle: {
                      background: POPUP_SUCCESS_COLOR,
                      color: "white",
                    },
                    Message: "changes to the room data are saved",
                  });
                } else if (mode === "new") {
                  await postCreateRoom(formJson);

                  setPopupOptions({
                    Heading: "Add Successful",
                    HeadingStyle: {
                      background: POPUP_SUCCESS_COLOR,
                      color: "white",
                    },
                    Message: "a new room was added",
                  });
                }

                await load_rooms(departmentID, pageSize, page, searchTerm);
                setLoading(false);
              } catch (err) {
                setPopupOptions({
                  Heading: "Room Update Failed",
                  HeadingStyle: {
                    background: POPUP_ERROR_COLOR,
                    color: "white",
                  },
                  Message: `${err}`,
                });
                setLoading(false);
              } finally {
                setSharingDepartmentIDs([]);
                setSharingDepartments([]);
              }

              setIsDialogFormOpen(false);
            },
          },
        }}
      >
        <DialogTitle>
          {mode === "new"
            ? `Add New Room to ${department.Code}`
            : mode === "edit"
              ? "Edit Room"
              : "Temp Title"}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {mode === "new"
              ? "Enter the room details and save it to add a new room."
              : mode === "edit"
                ? "Edit the current room information and apply your changes"
                : "This is a temporary development and debugging content only"}
          </DialogContentText>
          <TextField
            autoFocus
            required
            margin="dense"
            id="Name"
            name="Name"
            label="Name"
            type="text"
            fullWidth
            variant="standard"
            defaultValue={room?.Name ? room?.Name : ""}
          />

          <TextField
            autoFocus
            required
            margin="dense"
            id="Capacity"
            name="Capacity"
            label="Capacity"
            type="number"
            fullWidth
            variant="standard"
            defaultValue={room?.Capacity ? room?.Capacity : ""}
          />

          <FormControl fullWidth margin="dense">
            <InputLabel id="label-RoomType">Room Type</InputLabel>
            <Select
              onFocus={false}
              required
              variant="standard"
              name="RoomType"
              label="RoomType"
              id="RoomType"
              labelId="label-RoomType"
              value={Number.isInteger(room?.RoomType) ? room?.RoomType : ""}
              onChange={(e) => {
                const new_room = structuredClone(room);
                new_room.RoomType = e.target.value;
                setRoom(new_room);
              }}
            >
              {ROOM_TYPES
                ? ROOM_TYPES.map((room_type, index) => (
                    <MenuItem
                      key={index}
                      value={room_type}
                    >{`${RoomTypeName(room_type)}`}</MenuItem>
                  ))
                : null}
            </Select>
          </FormControl>

          {mode === "edit" ? (
            <FormControl fullWidth margin="dense">
              <InputLabel id="label-id-edit-department">
                Move to Department
              </InputLabel>
              <Select
                onFocus={false}
                required
                variant="standard"
                name="DepartmentID"
                label="DepartmentID"
                id="id-edit-department"
                labelId="label-id-edit-department"
                value={
                  Number.isInteger(room?.DepartmentID) ? room?.DepartmentID : ""
                }
                onChange={(e) => {
                  const new_room = structuredClone(room);
                  new_room.DepartmentID = e.target.value;
                  setRoom(new_room);
                }}
              >
                {departmentList
                  ? departmentList.map((department, index) => {
                      return (
                        <MenuItem
                          key={index}
                          value={department.DepartmentID}
                        >{`${department.Code} - ${department.Name}`}</MenuItem>
                      );
                    })
                  : null}
              </Select>
            </FormControl>
          ) : null}

          {departmentID == 0 && departmentList ? (
            <>
              <FormControl sx={{ m: 1 }} fullWidth>
                <InputLabel id="multiple-department-checkbox-label">
                  Sharing Departments
                </InputLabel>
                <Select
                  labelId="multiple-department-checkbox-label"
                  id="multiple-department-checkbox"
                  multiple
                  name="SharingDepartments"
                  value={sharingDepartmentIDs}
                  onChange={(event) => {
                    const {
                      target: { value },
                    } = event;

                    setSharingDepartmentIDs(
                      typeof value === "string" ? value.split(",") : value,
                    );

                    const current_sharing_departments = value.map((id) => {
                      return departmentList.find((find_dept) => {
                        return id == find_dept.DepartmentID;
                      });
                    });

                    setSharingDepartments(current_sharing_departments);

                  }}
                  input={<OutlinedInput label="Sharing Departments" />}
                  renderValue={(selected) =>
                    selected?.length === 0
                      ? "Shared to All"
                      : selected.join(", ")
                  }
                >
                  {departmentList.map((department) => (
                    <MenuItem
                      key={department.DepartmentID}
                      value={Number.parseInt(department.DepartmentID, 10)}
                    >
                      <Checkbox
                        checked={sharingDepartmentIDs.includes(
                          Number.parseInt(department.DepartmentID, 10),
                        )}
                      />
                      <ListItemText primary={department.Name} />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Box display={"flex"} flexWrap={"wrap"} gap={1} padding={"0.3em"}>
                {sharingDepartments?.length > 0 ? (
                  sharingDepartments.map((department) => (
                    <Chip
                      key={`chip-key-${department.DepartmentID}`}
                      label={`${department.DepartmentID} | ${department.Name}`}
                      onDelete={() => {
                        setSharingDepartments(
                          sharingDepartments.filter(
                            (iter_dept) =>
                              iter_dept?.DepartmentID !=
                              department?.DepartmentID,
                          ),
                        );

                        setSharingDepartmentIDs(
                          sharingDepartmentIDs.filter(
                            (id) => id != department?.DepartmentID,
                          ),
                        );
                      }}
                    />
                  ))
                ) : (
                  <Typography>Shared By All Departments</Typography>
                )}
              </Box>
            </>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button variant="outlined" type="submit">
            {mode === "new"
              ? "Save"
              : mode === "edit"
                ? "Apply Changes"
                : "Temp Success"}
          </Button>
          <Button
            variant="outlined"
            onClick={() => {
              setSharingDepartmentIDs([]);
              setSharingDepartments([]);
              setIsDialogFormOpen(false);
            }}
          >
            Cancel
          </Button>
        </DialogActions>
      </Dialog>
      </MainHeader>
    </>
  );
}

export default Rooms;

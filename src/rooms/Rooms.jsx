// ===================== IMPORTS =====================
import { useCallback, useEffect, useState, useRef } from "react";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
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
  Skeleton,
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
  Tooltip,
} from "@mui/material";

import {
  Popup,
  POPUP_ERROR_COLOR,
  POPUP_SUCCESS_COLOR,
} from "../components/Loading";

import EditIcon from "@mui/icons-material/Edit";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import PrintIcon from "@mui/icons-material/Print";

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

// ===================== HELPERS =====================
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

// ===================== MAIN COMPONENT =====================
function Rooms({ adminMode = false, pageName = "rooms" }) {
  const ROOM_TYPES = [
    0, // lecture
    1, // laboratory
    2, // gym
  ];

  // ---- STATE ----
  const [mode, setMode] = useState("");
  const [isDialogFormOpen, setIsDialogFormOpen] = useState(false);

  const [isOperationLoading, setIsOperationLoading] = useState(false);
  const [popupOptions, setPopupOptions] = useState(null);
  const [isDialogDeleteShow, setIsDialogDeleteShow] = useState(false);
  const [roomToDelete, setRoomToDelete] = useState(null);

  // ---- HANDLERS ----
  const handleRoomDelete = async (room_id) => {
    setIsOperationLoading(true);

    try {
      await deleteRemoveRoom(room_id);
      await load_rooms(departmentID, pageSize, page, searchTerm);

      setPopupOptions({
        Heading: "Delete Success",
        HeadingStyle: { background: POPUP_SUCCESS_COLOR, color: "white" },
        Message: "The room was successfully deleted.",
      });

      setIsDialogDeleteShow(false);
      setRoomToDelete(null);
    } catch (err) {
      setPopupOptions({
        Heading: "Delete Failed",
        HeadingStyle: { background: POPUP_ERROR_COLOR, color: "white" },
        Message: `${err.message || err}`,
      });
    } finally {
      setIsOperationLoading(false);
    }
  };

  const [room, setRoom] = useState({
    Name: null,
    Capacity: null,
    RoomType: null,
    roomNumber: "",
    roomLetter: "",
  });

  const parseRoomName = (name) => {
    if (!name) return { number: "", letter: "" };
    const match = name.match(/^(\d+)([A-Z])?/);
    return {
      number: match ? match[1] : "",
      letter: match && match[2] ? match[2].toUpperCase() : "",
    };
  };

  const [roomList, setRoomList] = useState([]);

  const [loading, setLoading] = useState(true);
  const [isPaginating, setIsPaginating] = useState(false);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(5);
  const [totalCount, setTotalCount] = useState(0);

  const [departmentList, setDepartmentList] = useState([]);

  // ---- EFFECTS ----
  useEffect(() => {
    const useEffectAsyncs = async () => {
      try {
        setLoading(true);

        const all_departments = await fetchAllDepartments();

        if (adminMode) {
          setDepartmentList(all_departments);
          setLoading(false);
        } else {
          const who = await fetchWho();
          const loggedInDepartmentID = Number(who);

          if (!Number.isInteger(loggedInDepartmentID)) {
            throw new Error("Unable to resolve logged-in department");
          }

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
          // loading stays true — the rooms useEffect will setLoading(false) after fetching
        }
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
  }, [adminMode]);

  const skipAnimRef = useRef(false);

  const load_rooms = useCallback(async (department_id, page_size, new_page, name_match = "") => {
    try {
      const rooms = await fetchDepartmentRooms(
        department_id,
        page_size,
        new_page,
        name_match,
      );
      console.log("Department:", department_id);
      console.log("Rooms:", rooms);
      const mergedRooms =
        (rooms?.Rooms || [])
            .filter(
            (room, index, arr) =>
                arr.findIndex(
                (r) => r.RoomID === room.RoomID
                ) === index
            )
            .map((room) => ({
            ...room,

            IsShared:
                (room?.SharingDepartments && (
                  room.SharingDepartments.includes(Number(department_id)) ||
                  // If a room is shared to GEN (dept id 0), consider it shared when
                  // viewing other departments so the GEN badge appears.
                  room.SharingDepartments.includes(0)
                )) || Number(room.DepartmentID) === 0,
            }));

        console.log("Processed:", mergedRooms);

        setRoomList(mergedRooms);
      setTotalCount(rooms?.TotalRooms ?? 0);
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
    setIsPaginating(false);
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

    if (!skipAnimRef.current) setLoading(true);
    skipAnimRef.current = false;
    const debounceTimer = setTimeout(() => {
      load_rooms(departmentID, pageSize, page, searchTerm);
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [departmentID, load_rooms, page, pageSize, searchTerm]);

  // room schedule view (department mode only)

  const [isViewRoomSchedule, setIsViewRoomSchedule] = useState(false);
  const [roomToView, setRoomToView] = useState(null);
  const [autoOpenRoomPrintDialog, setAutoOpenRoomPrintDialog] = useState(false);

  // duplicate detection (admin mode)

    const [duplicateRoomNames, setDuplicateRoomNames] = useState(new Set());

    useEffect(() => {
    if (
        !adminMode ||
        Number(departmentID) === 0 ||
        !Number.isInteger(Number(departmentID))
    ) {
        setDuplicateRoomNames(new Set());
        return;
    }

    const checkDuplicates = async () => {
        try {
        const currentRooms = await fetchDepartmentRooms(
            departmentID,
            9999,
            0,
            ""
        );

        const currentNames = new Set(
            (currentRooms.Rooms || []).map(
            (r) => r.Name?.trim().toLowerCase()
            )
        );

        const duplicateNames = new Set();

        for (const room of currentRooms.Rooms || []) {
            const count =
            [...currentNames].filter(
                (n) =>
                n ===
                room.Name?.trim().toLowerCase()
            ).length;

            if (count > 1) {
            duplicateNames.add(
                room.Name.trim().toLowerCase()
            );
            }
        }

        setDuplicateRoomNames(
            duplicateNames
        );

        } catch {
        setDuplicateRoomNames(
            new Set()
        );
        }
    };

    checkDuplicates();

    }, [adminMode, departmentID]);

  return (
    <>
      <MainHeader pageName={pageName}>

      {/* ===================== POPUP ===================== */}
      <Popup
        popupOptions={popupOptions}
        closeButtonActionHandler={() => {
          setPopupOptions(null);
        }}
      />

      {!isViewRoomSchedule ? (
      <Box>
          {adminMode && (
            <Box sx={{ mb: 2 }}>
              <FormControl size="small" sx={{ minWidth: 300 }}>
                <InputLabel id="admin-department-select-label">Select Department</InputLabel>
                <Select
                  labelId="admin-department-select-label"
                  value={departmentID}
                  label="Select Department"
                  onChange={(e) => {
                    const selected = departmentList.find(
                      (d) => d.DepartmentID === e.target.value,
                    );
                    setDepartmentID(e.target.value);
                    setDepartment(selected || "");
                    setPage(0);
                  }}
                >
                  {departmentList.map((d) => (
                    <MenuItem key={d.DepartmentID} value={d.DepartmentID}>
                      {d.Code} — {d.Name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          )}
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              paddingBlock: "0.6em",
            }}
          >
            <Box sx={{ display: "flex", flexDirection: "row", gap: 2 }}>

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
            </Box>

            {adminMode && (
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
                    roomNumber: "",
                    roomLetter: "",
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
            )}
          </Box>

          {/* ===================== TABLE ===================== */}
          <Box>
          <TableContainer component={Paper}>
            <Box
            sx={{
                flex: 1,
                overflowY: "auto",
                minHeight: 0,
            }}
            >
            <Table stickyHeader size="small" sx={{ tableLayout: "fixed" }}>
                <TableHead sx={{ "& .MuiTableCell-root": { bgcolor: "primary.main", color: "white", fontWeight: 700, letterSpacing: "0.05em" } }}>
                  <TableRow sx={{ height: 1 }}>
                    <TableCell sx={{ width: "25%" }}>ROOM NAME</TableCell>
                    <TableCell sx={{ width: "20%" }}>ROOM TYPE</TableCell>
                    <TableCell sx={{ width: "20%" }}>SECTION CAPACITY</TableCell>
                    {departmentID !== "" && Number(departmentID) === 0 ? (
                      <TableCell sx={{ width: "10%" }}></TableCell>
                    ) : null}
                    <TableCell sx={{ width: "112px" }} align="right"></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody sx={{ opacity: loading ? 0 : 1, transform: loading ? "translateY(12px)" : "translateY(0)", transition: "opacity 0.25s ease, transform 0.25s ease" }}>
                  {isPaginating
                    ? Array.from({ length: pageSize }).map((_, i) => (
                        <TableRow key={i} sx={{ height: 50 }}>
                          <TableCell><Skeleton /></TableCell>
                          <TableCell><Skeleton /></TableCell>
                          <TableCell><Skeleton /></TableCell>
                          {departmentID !== "" && Number(departmentID) === 0 ? <TableCell><Skeleton /></TableCell> : null}
                          <TableCell align="right">
                            <Box sx={{ display: "flex", justifyContent: "flex-end", gap: "0.5em" }}>
                              <Skeleton variant="circular" width={32} height={32} />
                              <Skeleton variant="circular" width={32} height={32} />
                              <Skeleton variant="circular" width={32} height={32} />
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))
                    : !Number.isInteger(Number(departmentID)) ? (
                      <TableRow>
                        <TableCell colSpan={4} align="center" sx={{ fontStyle: "italic", color: "text.secondary", py: 2 }}>
                          Please select a department first
                        </TableCell>
                      </TableRow>
                    ) : roomList.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={departmentID !== "" && Number(departmentID) === 0 ? 5 : 4} align="center" sx={{ fontStyle: "italic", color: "text.secondary", py: 2 }}>
                          No rooms found
                        </TableCell>
                      </TableRow>
                  ) : (
                    roomList?.map((room, index) => {
                        console.log("ROOM DATA:", room);
                      
                        return (
                        
                      <TableRow key={room.RoomID}>
                        <TableCell sx={{ fontWeight: "bold" }}>
                        <Box
                            sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                            flexWrap: "wrap",
                            }}
                        >

                            {room.Name}

                            {/* Shared Room Label (GEN badge shown when room is from GEN or shared to GEN) */}
                            {(
                              Number(room?.DepartmentID) === 0 ||
                              (room?.SharingDepartments && room.SharingDepartments.some((id) => Number(id) === 0)) ||
                              Boolean(room?.IsShared)
                            ) && (
                              <Tooltip
                                title={
                                  room?.SharingDepartments?.length
                                    ? `Shared to ${room.SharingDepartments
                                        .map((id) =>
                                          departmentList.find(
                                            (d) => Number(d.DepartmentID) === Number(id)
                                          )?.Code || id
                                        )
                                        .filter(Boolean)
                                        .join(", ")}`
                                    : Number(room?.DepartmentID) === 0
                                      ? "GEN room"
                                      : "Shared resource"
                                }
                              >
                                <Chip
                                  label="GEN"
                                  size="small"
                                  variant="outlined"
                                  clickable={false}
                                  sx={{
                                    ml: 0.5,
                                    height: 20,
                                    color: "success.main",
                                    borderColor: "success.main",
                                    backgroundColor: "transparent",
                                    "& .MuiChip-label": {
                                      px: 1,
                                      fontSize: "0.68rem",
                                      fontWeight: 700,
                                    },
                                  }}
                                />
                              </Tooltip>
                            )}

                            {adminMode &&
                            duplicateRoomNames.has(
                                room.Name
                                .toLowerCase()
                                .trim()
                            ) && (
                            <Tooltip title="Duplicate room name">
                                <WarningAmberIcon
                                color="warning"
                                fontSize="small"
                                />
                            </Tooltip>
                            )}

                        </Box>
                        </TableCell>
                        <TableCell sx={{ fontStyle: "italic" }}>{RoomTypeName(room.RoomType)}</TableCell>
                        <TableCell>{room.Capacity}</TableCell>
                        {departmentID !== "" && Number(departmentID) === 0 ? (
                          <TableCell>
                            {room?.SharingDepartments
                              ? `${room?.SharingDepartments?.length}x`
                              : "all"}
                          </TableCell>
                        ) : null}
                        <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5em', flexWrap: 'nowrap' }}>
                            {!adminMode && (
                              <>
                                <IconButton
                                  title="View Schedule"
                                  color="view"
                                  disabled={loading}
                                  onClick={() => {
                                    setAutoOpenRoomPrintDialog(false);
                                    setRoomToView(room);
                                    setIsViewRoomSchedule(true);
                                  }}
                                >
                                  <PreviewIcon />
                                </IconButton>
                                <IconButton
                                  title="Print Schedule"
                                  color="primary"
                                  disabled={loading}
                                  onClick={() => {
                                    setAutoOpenRoomPrintDialog(true);
                                    setRoomToView(room);
                                    setIsViewRoomSchedule(true);
                                  }}
                                >
                                  <PrintIcon />
                                </IconButton>
                              </>
                            )}
                            <IconButton
                              title="Edit"
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

                                const { number, letter } = parseRoomName(room.Name);
                                setRoom({ ...room, roomNumber: number, roomLetter: letter });
                                setMode("edit");
                                setIsDialogFormOpen(true);
                              }}
                            >
                              <EditIcon />
                            </IconButton>
                            <IconButton
                              title="Delete"
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
                    );
                    })
                    )
                  }
                </TableBody>
              </Table>
              </Box>

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
                onPageChange={(_, new_page) => {
                  skipAnimRef.current = true;
                  setIsPaginating(true);
                  setPage(new_page);
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
      ) : (
        <RoomSchedule
          roomToView={roomToView}
          setRoomToView={setRoomToView}
          setIsViewRoomSchedule={setIsViewRoomSchedule}
          selectedDepartment={department}
          popupOptions={popupOptions}
          setPopupOptions={setPopupOptions}
          autoOpenPrintDialog={autoOpenRoomPrintDialog}
          onAutoOpenPrintDialogHandled={() => setAutoOpenRoomPrintDialog(false)}
        />
      )}

      {/* ===================== DELETE DIALOG ===================== */}
    <Dialog
        open={isDialogDeleteShow}
        onClose={() => {
          setIsDialogDeleteShow(false);
          setRoomToDelete(null);
        }}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title" sx={{ backgroundColor: "error.dark" }}>Delete Room</DialogTitle>

        <DialogContent>
          <DialogContentText id="alert-dialog-description" sx={{ color: "text.primary", mb: 2 }}>
            This action cannot be undone.
          </DialogContentText>

          <Box
            sx={{
              px: 1,
              py: 1.5,
              borderRadius: 1.5,
              backgroundColor: "rgba(180, 35, 24, 0.06)",
              border: "1px solid",
              borderColor: "error.light",
            }}
          >
            <Typography
              variant="subtitle1"
              sx={{ fontWeight: 700, color: "error.dark" }}
            >
              {`${roomToDelete?.Name ?? ""}`}
            </Typography>
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              This room record will be permanently removed.
            </Typography>
          </Box>
        </DialogContent>

        <DialogActions sx={{ justifyContent: "flex-end" }}>
          <Button
            color="secondary"
            variant="contained"
            onClick={() => {
              setIsDialogDeleteShow(false);
              setRoomToDelete(null);
            }}
          >
            Cancel
          </Button>
          <Button
            color="error"
            variant="outlined"
            onClick={() => {
              handleRoomDelete(roomToDelete?.RoomID);
            }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* ===================== FORM DIALOG ===================== */}
      <Dialog
        open={isDialogFormOpen}
        maxWidth="sm"
        fullWidth
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

              // Combine room number and letter into Name
              formJson.Name = (room.roomNumber || "") + (room.roomLetter || "");
              delete formJson.RoomNumber;
              delete formJson.RoomLetter;

              if (mode === "new") {
                formJson.DepartmentID = departmentID;
              } else {
                formJson.DepartmentID = Number(formJson.DepartmentID);
              }

              if (departmentID !== "" && Number(departmentID) === 0) {
                formJson.SharingDepartments = (sharingDepartmentIDs || []).map((id) => Number(id));
              } else {
                // If we're editing while not viewing GEN, preserve existing sharing
                // instead of clearing it unintentionally.
                if (mode === "edit") {
                  formJson.SharingDepartments = room?.SharingDepartments?.map((id) => Number(id)) || [];
                } else {
                  formJson.SharingDepartments = [];
                }
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
        <DialogTitle sx={{ backgroundColor: 'primary.main' }}>
          {mode === "new"
            ? `Add New Room to ${department.Code}`
            : mode === "edit"
              ? "Edit Room"
              : "Temp Title"}
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
            <DialogContentText sx={{ mb: 3 }}>
                {mode === "new"
                ? "Enter the room details below."
                : "Update the room information."}
            </DialogContentText>

            <Box
                sx={{
                display: "flex",
                flexDirection: "column",
                gap: 2.5,
                mt: 1,
                width: "100%",
                }}
            >

                {/* Room Number and Letter */}
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "3fr 1fr",
                    gap: 2,
                  }}
                >
                  <TextField
                    required
                    fullWidth
                    name="RoomNumber"
                    label="Room Number"
                    variant="outlined"
                    value={room?.roomNumber ?? ""}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "").slice(0, 3);
                      setRoom({ ...room, roomNumber: val });
                    }}
                    placeholder="Ex. 357"
                    inputProps={{ maxLength: 2, inputMode: "numeric" }}
                    InputProps={{
                      sx: {
                        borderRadius: 2,
                      },
                    }}
                  />
                  <TextField
                    fullWidth
                    name="RoomLetter"
                    label="Letter (optional)"
                    variant="outlined"
                    value={room?.roomLetter ?? ""}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^A-Za-z]/g, "").toUpperCase().slice(0, 1);
                      setRoom({ ...room, roomLetter: val });
                    }}
                    placeholder="Ex. A"
                    inputProps={{ maxLength: 2, inputMode: "text" }}
                    InputProps={{
                      sx: {
                        borderRadius: 2,
                      },
                    }}
                  />
                </Box>

                {/* Capacity + Type */}
                <Box
                sx={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 2,
                }}
                >

                <TextField
                    required
                    name="Capacity"
                    label="Section Capacity"
                    type="number"
                    variant="outlined"
                    defaultValue={room?.Capacity ?? ""}
                    InputProps={{
                    sx: {
                        borderRadius: 2,
                    },
                    }}
                />

                <FormControl fullWidth>
                    <InputLabel>Room Type</InputLabel>

                    <Select
                    name="RoomType"
                    value={
                        Number.isInteger(room?.RoomType)
                        ? room.RoomType
                        : ""
                    }
                    label="Room Type"
                    variant="outlined"
                    onChange={(e) => {
                        setRoom({
                        ...room,
                        RoomType: e.target.value,
                        });
                    }}
                    sx={{
                        borderRadius: 2,
                    }}
                    >
                    {ROOM_TYPES.map((type) => (
                        <MenuItem
                        key={type}
                        value={type}
                        >
                        {RoomTypeName(type)}
                        </MenuItem>
                    ))}
                    </Select>
                </FormControl>

                </Box>

                {/* Move department */}
                {mode === "edit" && adminMode && (
                <FormControl fullWidth>

                    <InputLabel>
                    Move to Department
                    </InputLabel>

                    <Select
                    name="DepartmentID"
                    label="Move to Department"
                    value={
                        Number.isInteger(room?.DepartmentID)
                        ? room.DepartmentID
                        : ""
                    }
                    variant="outlined"
                    onChange={(e) =>
                        setRoom({
                        ...room,
                        DepartmentID: e.target.value,
                        })
                    }
                    sx={{
                        borderRadius: 2,
                    }}
                    >
                    {departmentList.map((dept) => (
                        <MenuItem
                        key={dept.DepartmentID}
                        value={dept.DepartmentID}
                        >
                        {dept.Code} — {dept.Name}
                        </MenuItem>
                    ))}
                    </Select>

                </FormControl>
                )}

                {/* Sharing */}
                {departmentID !== "" &&
                Number(departmentID) === 0 && (
                <Box
                    sx={{
                    border: "1px solid",
                    borderColor: "divider",
                    borderRadius: 3,
                    p: 2,
                    }}
                >

                    <Typography
                    variant="subtitle2"
                    sx={{
                        mb: 1.5,
                        fontWeight: 700,
                    }}
                    >
                    Sharing Departments
                    </Typography>

                    <FormControl fullWidth>

                    <Select
                        multiple
                        value={sharingDepartmentIDs}
                        displayEmpty
                        onChange={(event) => {
                        const value = event.target.value;

                        const arr = typeof value === "string" ? value.split(",") : value;

                        const nums = arr.map((id) => Number(id));

                        setSharingDepartmentIDs(nums);

                        setSharingDepartments(
                          nums.map((id) => departmentList.find((d) => Number(d.DepartmentID) === id))
                        );
                      }}
                        renderValue={(selected) => (
                            <Typography
                              sx={{
                                color:
                                  selected.length === 0
                                    ? "text.secondary"
                                    : "text.primary",
                              }}
                            >
                              {selected.length
                                ? `${selected.length} selected`
                                : "Select a department"}
                            </Typography>
                          )}
                    >
                        {departmentList
                        .filter(
                            (department) =>
                            Number(department.DepartmentID) !== 0
                        )
                        .map((department) => (
                            <MenuItem
                            key={department.DepartmentID}
                            value={department.DepartmentID}
                            >
                            <Checkbox
                                checked={sharingDepartmentIDs.includes(
                                department.DepartmentID
                                )}
                            />

                            <ListItemText
                                primary={
                                department.Name
                                }
                            />
                            </MenuItem>
                        )
                        )}
                    </Select>

                    </FormControl>

                    {!!sharingDepartments.length && (
                    <Box
                        sx={{
                        mt: 2,
                        display: "flex",
                        flexWrap: "wrap",
                        gap: 1,
                        }}
                    >
                        {sharingDepartments.map(
                        (department) => (
                            <Chip
                            key={
                                department.DepartmentID
                            }
                            label={
                                department.Name
                            }
                            onDelete={() => {
                                setSharingDepartments(
                                sharingDepartments.filter(
                                    (d) =>
                                    d.DepartmentID !==
                                    department.DepartmentID
                                )
                                );

                                setSharingDepartmentIDs(
                                sharingDepartmentIDs.filter(
                                    (id) =>
                                    id !==
                                    department.DepartmentID
                                )
                                );
                            }}
                            />
                        )
                        )}
                    </Box>
                    )}

                </Box>
                )}

            </Box>
            </DialogContent>
        <DialogActions>
          <Button variant="contained" type="submit">
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

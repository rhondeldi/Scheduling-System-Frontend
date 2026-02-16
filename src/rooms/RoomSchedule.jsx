import { Box, Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, FormControl, InputLabel, List, MenuItem, Select, TextField, Typography } from "@mui/material";
import { useState, useEffect, useRef } from "react";
import { Loading, POPUP_ERROR_COLOR } from "../components/Loading";

import { fetchRoomAllocation } from "../js/rooms";
import { generateTimeSlotRowLabels } from "../js/week-time-table-grid-functions";

import { useReactToPrint } from "react-to-print";

import PrintIcon from '@mui/icons-material/Print';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';

import "../schedule/TimeTable.css";
import "../schedule/TimeTableDropdowns.css";
import "../assets/SubjectColors.css";
import { PrintHeader } from "../components/PrintHeader";

const SEMESTER_NAMES = [
    "1st Semester",
    "2nd Semester",
    "Mid-year",
]

export default function RoomSchedule({
    roomToView, setRoomToView, setIsViewRoomSchedule,
    selectedDepartment,
    popupOptions, setPopupOptions,
}) {
    const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const [startHour, setStartHour] = useState(7);
    const [timeSlotMinuteInterval, setTimeSlotMinuteInterval] = useState(30);
    const [dailyTimeSlots, setDailyTimeSlots] = useState(24);

    const [subjectColors, setSubjectColors] = useState({});
    const [subjects, setSubjects] = useState([])
    const [selectedSemesterSubject, setSelectedSemesterSubject] = useState([])
    const [IsLoading, setIsLoading] = useState(false)

    const [semesterIndex, setSemesterIndex] = useState("");

    useEffect(() => {
        const starting_hour = 7;
        const time_slot_per_hour = 2;
        const daily_time_slots = 24;

        const time_slot_minute_interval = 60 / time_slot_per_hour;

        setStartHour(starting_hour);
        setTimeSlotMinuteInterval(time_slot_minute_interval);
        setDailyTimeSlots(daily_time_slots);

        const async_use_effect = async () => {
            setIsLoading(true)

            try {
                const room_subject_allocation = await fetchRoomAllocation(roomToView.RoomID)
                setSubjects(room_subject_allocation)
            } catch (err) {
                setSubjects([])
                setPopupOptions({
                    Heading: "Unable To Load Room Schedule",
                    HeadingStyle: { background: POPUP_ERROR_COLOR, color: "white" },
                    Message: `${err}`
                });
            } finally {
                setIsLoading(false)
            }
        }

        async_use_effect();

    }, []);

    const handleSemesterChange = async (e) => {
        setSemesterIndex(e.target.value)

        const semester_idx = Number.parseInt(e.target.value, 10)

        if (Number.isInteger(semester_idx)) {

            console.log('selected semester index:', e.target.value)

            const subject_colors = [];
            let subject_count = 0;

            subjects[semester_idx].forEach((subject) => {
                if (!subject_colors[`${subject.SubjectCode}${subject.CourseSection}`]) {
                    subject_count++;
                    subject_colors[`${subject.SubjectCode}${subject.CourseSection}`] = `color-${subject_count}`;
                }
            });

            setSelectedSemesterSubject(subjects[semester_idx])
            setSubjectColors(subject_colors);

            console.log('subjects allocated:', subjects[semester_idx])
        } else {
            console.log('selected semester index: none')
            setSelectedSemesterSubject([])
            setSubjectColors([])
        }
    }

    const handleBackButton = () => {
        setRoomToView(false)
        setIsViewRoomSchedule(null)
    }

    /////////////////////////////////////////////////////////////////////////////////
    //                      PRINTING STATES, REFS AND HANDLERS
    /////////////////////////////////////////////////////////////////////////////////

    const [isPrinting, setIsPrinting] = useState(false);
    const [isBlackAndWhite, setIsBlackAndWhite] = useState(false)
    const contentRef = useRef(null);

    const promiseResolveRef = useRef(null);

    useEffect(() => {
        if (isPrinting && promiseResolveRef.current) {
            promiseResolveRef.current();
        }
    }, [isPrinting]);

    const reactToPrintFn = useReactToPrint({
        contentRef,
        documentTitle: `${roomToView.Name} - ${SEMESTER_NAMES[semesterIndex]} ${new Date().getFullYear()}`,
        onBeforePrint: () => {
            saveAddedOptionalPrintingValues()
            return new Promise((resolve) => {
                promiseResolveRef.current = resolve;
                setIsPrinting(true);
            });
        },
        onAfterPrint: () => {
            promiseResolveRef.current = null;
            setIsPrinting(false);
        },
    });

    const reactToPrintBlackAndWhiteFn = useReactToPrint({
        contentRef,
        documentTitle: `${roomToView.Name} - ${SEMESTER_NAMES[semesterIndex]} ${new Date().getFullYear()}`,
        onBeforePrint: () => {
            saveAddedOptionalPrintingValues()
            return new Promise((resolve) => {
                promiseResolveRef.current = resolve;
                setIsPrinting(true);
                setIsBlackAndWhite(true);
            });
        },
        onAfterPrint: () => {
            promiseResolveRef.current = null;
            setIsPrinting(false);
            setIsBlackAndWhite(false);
        },
    });

    const [academicYear, setAcademicYear] = useState("")

    const [signatoryPreparedBy, setSignatoryPreparedBy] = useState("")
    const [positionPreparedBy, setPositionPreparedBy] = useState("")

    const [signatoryCheckedAndReviewedBy, setSignatoryCheckedAndReviewedBy] = useState("")
    const [positionCheckedAndReviewedBy, setPositionCheckedAndReviewedBy] = useState("")

    const [isPrintDialogShow, setIsPrintDialogShow] = useState(false)

    const handleOpenSignatoriesDialog = () => {

        const academic_year = localStorage.getItem('academic-year')

        const signatory_prepared_by = localStorage.getItem('signatory-prepared-by')
        const position_prepared_by = localStorage.getItem('position-prepared-by')

        const signatory_checked_and_reviewed_by = localStorage.getItem('signatory-check-and-reviewed-by')
        const position_checked_and_reviewed_by = localStorage.getItem('position-check-and-reviewed-by')

        setAcademicYear(academic_year)

        setSignatoryPreparedBy(signatory_prepared_by)
        setPositionPreparedBy(position_prepared_by)

        setSignatoryCheckedAndReviewedBy(signatory_checked_and_reviewed_by)
        setPositionCheckedAndReviewedBy(position_checked_and_reviewed_by)

        setIsPrintDialogShow(true)
    }

    const saveAddedOptionalPrintingValues = () => {
        localStorage.setItem('academic-year', academicYear)

        localStorage.setItem('signatory-prepared-by', signatoryPreparedBy)
        localStorage.setItem('position-prepared-by', positionPreparedBy)

        localStorage.setItem('signatory-check-and-reviewed-by', signatoryCheckedAndReviewedBy)
        localStorage.setItem('position-check-and-reviewed-by', positionCheckedAndReviewedBy)
    }

    /////////////////////////////////////////////////////////////////////////////////

    return (<>
        <Loading
            IsLoading={IsLoading}
        />

        <Box padding={1} display={'flex'} justifyContent={'space-between'}>
            <Box display={'flex'} gap={5} alignItems={'center'}>
                <FormControl sx={{ minWidth: 115 }} size="small">
                    <InputLabel id="label-id-semester">Semester</InputLabel>
                    <Select autoWidth
                        labelId="label-id-semester"
                        label="Semester"
                        value={semesterIndex}
                        onChange={handleSemesterChange}
                        disabled={!Number.isInteger(selectedDepartment.DepartmentID)}
                    >
                        <MenuItem value=''>None</MenuItem>
                        <MenuItem value={0}>1st Semester</MenuItem>
                        <MenuItem value={1}>2nd Semester</MenuItem>
                        <MenuItem value={2}>Mid-year</MenuItem>
                    </Select>
                </FormControl>

                <Box display={'flex'} gap={1}>
                    <Typography variant="h5">Room - {roomToView.Name}</Typography>
                </Box>
            </Box>

            <Box>
                <Button variant="outlined" size="small" endIcon={<ExitToAppIcon />} onClick={handleBackButton}>Go Back</Button>
            </Box>
        </Box>

        <div ref={contentRef} style={{ padding: (isPrinting && Number.isInteger(Number.parseInt(semesterIndex, 10))) ? '1em' : '0px' }}>

            {(isPrinting && Number.isInteger(Number.parseInt(semesterIndex, 10))) ? (<>
                <PrintHeader isBlackAndWhite={isBlackAndWhite} />

                <Box display={'flex'} flexDirection={'column'} justifyContent={'center'} padding={1} gap={0} marginTop={1}>
                    <Typography lineHeight={1} variant="body1" flexWrap={true} textAlign={'center'}>{selectedDepartment.Name?.toUpperCase()}</Typography>
                    <Typography lineHeight={1} variant="body1" flexWrap={true} fontWeight={'bold'} textAlign={'center'}>Room Schedule</Typography>
                    <Typography lineHeight={1} variant="body1" textAlign={'center'}>{`${SEMESTER_NAMES[semesterIndex]}${academicYear ? (', ' + academicYear) : ''}`}</Typography>
                </Box>

                <Box display={'flex'} justifyContent={'space-between'} alignItems={'center'} marginBottom={0.5}>
                    <Box><Typography variant="body1" fontWeight={'bold'} textAlign={'left'}>{
                        `Room: ${roomToView.Name}`
                    }</Typography></Box>
                </Box>
            </>) : null}


            <table className="time-table">
                <thead>
                    <tr>
                        <th
                            className="time-slot-header"
                            style={{ ...((isBlackAndWhite) ? { background: 'white', color: 'black', border: 'thin solid black' } : {}) }}
                        >Time Slot</th>
                        {DAYS.map((day) => (
                            <th
                                key={day} className="day-header"
                                style={{ ...((isBlackAndWhite) ? { background: 'white', color: 'black', border: 'thin solid black' } : {}) }}
                            >{day}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {generateTimeSlotRowLabels(startHour, timeSlotMinuteInterval, dailyTimeSlots).map((time_slot_label, time_slot_index) => (
                        <tr key={time_slot_index}>
                            <td
                                style={{ ...((isBlackAndWhite) ? { background: 'white', color: 'black' } : {}) }}
                                className="time-slot"
                            >{time_slot_label}</td>
                            {DAYS.map((_, day_index) => {
                                let class_name = ""
                                let selected = ""

                                const has_assigned_subject = selectedSemesterSubject.find(
                                    (subj) => subj.DayIdx === day_index && subj.TimeSlotIdx === time_slot_index
                                );

                                if (has_assigned_subject) {
                                    const subject_color_key = `${has_assigned_subject.SubjectCode}${has_assigned_subject.CourseSection}`
                                    return (
                                        <td key={day_index} className={`subject-cell ${(!isBlackAndWhite) ? subjectColors[subject_color_key] : 'color-bw'}`} rowSpan={has_assigned_subject.SubjectTimeSlots}>
                                            <div className="subject-content">
                                                <div className="subject-time-slot-line-1">{has_assigned_subject.SubjectCode}</div>
                                                <div className="subject-time-slot-line-2">{has_assigned_subject.CourseSection}</div>
                                                <div className="subject-time-slot-line-3">{has_assigned_subject.InstructorName}</div>
                                            </div>
                                        </td>
                                    );
                                }

                                class_name = "empty-slot"

                                const is_occupied = selectedSemesterSubject.some((subject) => {
                                    const has_hit_subject_in_row = time_slot_index >= subject.TimeSlotIdx && time_slot_index < (subject.TimeSlotIdx + subject.SubjectTimeSlots);
                                    const has_hit_subject_in_col = day_index == subject.DayIdx;
                                    return has_hit_subject_in_row && has_hit_subject_in_col;
                                });

                                if (is_occupied) {
                                    return null
                                }

                                return (
                                    <td
                                        key={day_index}
                                        className={class_name}
                                    >
                                        <span className={`time-slot-cover ${selected}`}></span>
                                    </td>
                                )
                            })}
                        </tr>
                    ))}
                </tbody>
            </table>

            <Box display={'flex'} flexDirection={'row'} width={'100%'} justifyContent={'space-between'} paddingInline={5} paddingTop={3}>
                {(signatoryPreparedBy) ? <Box display={'flex'} flexDirection={'column'}>
                    <Typography variant="caption" marginBottom={3}>Prepared by:</Typography>
                    <Typography variant="body1">{signatoryPreparedBy}</Typography>
                    <Typography variant="caption">{positionPreparedBy}</Typography>
                </Box> : null}

                {(signatoryCheckedAndReviewedBy) ? <Box display={'flex'} flexDirection={'column'}>
                    <Typography variant="caption" marginBottom={3}>Checked and Reviewed by:</Typography>
                    <Typography variant="body1"> {signatoryCheckedAndReviewedBy}</Typography>
                    <Typography variant="caption">{positionCheckedAndReviewedBy}</Typography>
                </Box> : null}
            </Box>
        </div>

        <div style={{ height: '0.8em' }} />

        <Box gap={1} display={(Number.isInteger(Number.parseInt(semesterIndex, 10))) ? 'flex' : 'none'} justifyContent={'center'}>
            <Button variant="outlined" size="medium" onClick={handleOpenSignatoriesDialog} endIcon={<PrintIcon />}>Print</Button>
        </Box>

        <Dialog
            open={isPrintDialogShow}
            onClose={() => {
                setIsPrintDialogShow(false)
            }}
            aria-labelledby="alert-dialog-title"
            aria-describedby="alert-dialog-description"
        >
            <DialogTitle>Room Schedule Signatories</DialogTitle>

            <DialogContent>
                <DialogContentText id="alert-dialog-description">
                    Add signatories if needed to include in printing
                </DialogContentText>

                <Box display={'flex'} flexDirection={'column'} gap={2} marginTop={2}>

                    <Box width={'100%'} display={'flex'} gap={1}>
                        <TextField
                            fullWidth
                            label="S.Y. or A.Y. - 20XX - 20YY"
                            autoFocus
                            variant="standard"
                            onChange={(e) => setAcademicYear(e.target.value)}
                            defaultValue={academicYear ? academicYear : ""}
                        />
                    </Box>

                    <Box width={'100%'} display={'flex'} gap={1}>
                        <TextField
                            fullWidth
                            label="Prepared By"
                            autoFocus
                            variant="standard"
                            onChange={(e) => setSignatoryPreparedBy(e.target.value)}
                            defaultValue={signatoryPreparedBy ? signatoryPreparedBy : ""}
                        />
                        <TextField
                            label="Position"
                            autoFocus
                            variant="standard"
                            onChange={(e) => setPositionPreparedBy(e.target.value)}
                            defaultValue={positionPreparedBy ? positionPreparedBy : ""}
                        />
                    </Box>

                    <Box width={'100%'} display={'flex'} gap={1}>
                        <TextField
                            fullWidth
                            label="Check and Reviewed By"
                            autoFocus
                            variant="standard"
                            onChange={(e) => setSignatoryCheckedAndReviewedBy(e.target.value)}
                            defaultValue={signatoryCheckedAndReviewedBy ? signatoryCheckedAndReviewedBy : ""}
                        />
                        <TextField
                            label="Position"
                            autoFocus
                            variant="standard"
                            onChange={(e) => setPositionCheckedAndReviewedBy(e.target.value)}
                            defaultValue={positionCheckedAndReviewedBy ? positionCheckedAndReviewedBy : ""}
                        />
                    </Box>
                </Box>
            </DialogContent>

            <DialogActions>
                <Button variant="outlined" size="medium" onClick={reactToPrintFn} endIcon={<PrintIcon />}>Print Colored</Button>
                <Button variant="outlined" size="medium" onClick={reactToPrintBlackAndWhiteFn} endIcon={<PrintIcon />}>Print Black & White</Button>
                <Button
                    variant="outlined" size="medium"
                    onClick={() => {
                        setIsPrintDialogShow(false)
                        setSignatoryPreparedBy("")
                        setPositionPreparedBy("")
                        setSignatoryCheckedAndReviewedBy("")
                        setPositionCheckedAndReviewedBy("")
                    }}
                >
                    Cancel
                </Button>
            </DialogActions>

        </Dialog>

        <div style={{ height: '3.25em' }} />
    </>)
}
import { StrictMode, useState, useEffect, useRef } from "react";
import { createRoot } from "react-dom/client";

import { Loading, Popup, POPUP_ERROR_COLOR, POPUP_SUCCESS_COLOR, POPUP_WARNING_COLOR } from "../components/Loading";

import "../assets/main.css";
import "./TimeTable.css";
import "./TimeTableDropdowns.css";

import { fetchAllDepartments, fetchDepartmentCurriculumsData } from "../js/departments"
import { deserializeSchedule, fetchClassJsonSchedule, fetchSubjectTimeSlotMoveAvailability, fetchSubjectTimeSlotMove, fetchResourceEstimates, fetchSerializedClassSchedule, generateSchedule, getValidateSchedules, deleteClearDepartmentSchedule, deleteClearSectionSchedule, getSchedGenStatus } from "../js/schedule"

import { generateTimeSlotRowLabels } from "../js/week-time-table-grid-functions";
import { MainHeader } from "../components/Header";
import { Box, Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, LinearProgress, TextField, Typography } from "@mui/material";
import PrintIcon from '@mui/icons-material/Print';

const SECTION_CHARACTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890abcdefghijklmnopqrstuvwxyz";

import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';
import { ThemeProvider } from "@emotion/react";
import theme from "../components/Theme";

import "../assets/SubjectColors.css";

import { useReactToPrint } from "react-to-print";
import { PrintHeader } from "../components/PrintHeader";

const NUMBER_OF_GENERATIONS = 32

const SEMESTER_NAMES = [
    "1st Semester",
    "2nd Semester",
    "Mid-year",
]

function LinearProgressWithLabel(props) {
    return (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Box sx={{ width: '100%', mr: 1 }}>
                <LinearProgress variant="determinate" {...props} />
            </Box>
            <Box sx={{ minWidth: 35 }}>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    {`${Math.round(props.value)}%`}
                </Typography>
            </Box>
        </Box>
    );
}

function extractGenerationNumber(text) {
    if (typeof text !== 'string') {
        throw new TypeError('Expected a string');
    }

    const regex = /generation\s+(\d{1,2})/i;
    const is_match = text.match(regex);

    if (is_match) {
        return parseInt(is_match[1], 10);
    }

    return null;
}

function getScheduleGenerationStatusColor(status) {
    switch (status) {
        case "success": return 'green';
        case "in progress": return 'blue';
        case "failed": return 'red';
        case "internal server error": return 'red';
        case "on queue": return 'orange';
        case "not started": return 'black';
    }
}

function TimeTable() {
    const focusRef = useRef(null)

    const scrollToTable = () => focusRef.current.scrollIntoView()

    /////////////////////////////////////////////////////////////////////////////////
    //                     LOAD GUARD COMPONENT STATES
    /////////////////////////////////////////////////////////////////////////////////

    const [schedGenStatus, setSchedGenStatus] = useState(null)
    const [IsLoading, setIsLoading] = useState(false);
    const [popupOptions, setPopupOptions] = useState(null);

    /////////////////////////////////////////////////////////////////////////////////
    //                       TIME TABLE GRID STATES
    /////////////////////////////////////////////////////////////////////////////////

    const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const [startHour, setStartHour] = useState(7);
    const [timeSlotMinuteInterval, setTimeSlotMinuteInterval] = useState(30);
    const [dailyTimeSlots, setDailyTimeSlots] = useState(24);

    /////////////////////////////////////////////////////////////////////////////////
    //                       STATES FOR FETCHED DATA
    /////////////////////////////////////////////////////////////////////////////////

    const [allDepartments, setAllDepartment] = useState([]);                // fetch on page load
    const [departmentCurriculumsData, setDepartmentCurriculumsData] = useState([]);              // fetch on semester selection
    const [classAssignedSubjects, setClassAssignedSubjects] = useState([]) // fetch on section selection

    const [pickedUpSubject, setPickedUpSubject] = useState(null);
    const [pickedUpColor, setPickedUpColor] = useState(null);

    /////////////////////////////////////////////////////////////////////////////////
    //                       DROPDOWN SELECTION STATES
    /////////////////////////////////////////////////////////////////////////////////

    const [departmentID, setDepartmentID] = useState("");
    const [semesterIndex, setSemesterIndex] = useState("");
    const [curriculumIndex, setCurriculumIndex] = useState("");
    const [yearLevelIndex, setYearLevelIndex] = useState("");
    const [sectionIndex, setSectionIndex] = useState("");

    /////////////////////////////////////////////////////////////////////////////////
    //                       PAGE LOAD PROCESS
    /////////////////////////////////////////////////////////////////////////////////

    const [resourceEstimates, setResourceEstimates] = useState("")

    useEffect(() => {

        // TODO: fetch basic const values (data below is just temporary);

        const starting_hour = 7;
        const time_slot_per_hour = 2;
        const daily_time_slots = 24;

        const time_slot_minute_interval = 60 / time_slot_per_hour;

        setStartHour(starting_hour);
        setTimeSlotMinuteInterval(time_slot_minute_interval);
        setDailyTimeSlots(daily_time_slots);

        useEffectAsyncs();
    }, []);

    async function useEffectAsyncs() {
        try {
            setIsLoading(true);

            const all_departments = await fetchAllDepartments();

            setAllDepartment(all_departments);
            console.log('fetched departments: ', all_departments);

            setIsLoading(false);
        } catch (err) {
            setPopupOptions({
                Heading: "Failed to Fetch All Department Data",
                HeadingStyle: { background: POPUP_ERROR_COLOR, color: "white" },
                Message: `${err}`
            });
            setIsLoading(false);
            setSemesterIndex("");
        }
    }

    /////////////////////////////////////////////////////////////////////////////////
    //                       DROPDOWN HANDLERS
    /////////////////////////////////////////////////////////////////////////////////

    const handleDepartmentChange = async (event) => {
        console.log(`selected departmentID: ${event.target.value}`);
        setDepartmentID(event.target.value);
        setSemesterIndex("");
        setCurriculumIndex("");
        setYearLevelIndex("");
        setSectionIndex("");
        setClassAssignedSubjects([]);
        setPickedUpSubject(null);
        setAvailableSubjectTimeSlotMove(null)
        setSchedGenStatus(null);

        setResourceEstimates("")

        // clear any old polling loop
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
    }

    const updateCurriculumData = async (semester) => {
        const department_curriculums_data = await fetchDepartmentCurriculumsData(departmentID, semester);
        setDepartmentCurriculumsData(department_curriculums_data);
    }

    const handleSemesterChange = async (event) => {
        console.log(`selected semesterIndex: ${event.target.value}`);
        setSemesterIndex(event.target.value);
        setCurriculumIndex("");
        setYearLevelIndex("");
        setSectionIndex("");
        setClassAssignedSubjects([]);
        setPickedUpSubject(null);
        setAvailableSubjectTimeSlotMove(null)

        // clear any old polling loop
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }

        if (event.target.value) {
            setIsLoading(true);

            try {
                await updateCurriculumData(event.target.value);

                const sched_gen_status = await getSchedGenStatus(event.target.value, departmentID);
                setSchedGenStatus(sched_gen_status);

                const resource_estimate_msg = await fetchResourceEstimates(departmentID, event.target.value)
                setResourceEstimates(resource_estimate_msg)

                setIsLoading(false);
            } catch (err) {
                setPopupOptions({
                    Heading: "Failed to Fetch Semester Data",
                    HeadingStyle: { background: POPUP_ERROR_COLOR, color: "white" },
                    Message: `${err}`
                });
                setIsLoading(false);
                setSemesterIndex("");
            }
        }
    };

    const handleCurriculumChange = (event) => {
        console.log(`selected curriculumIndex: ${event.target.value}`);
        setCurriculumIndex(event.target.value);
        setYearLevelIndex("");
        setSectionIndex("");
        setClassAssignedSubjects([]);
        setPickedUpSubject(null);
        setAvailableSubjectTimeSlotMove(null)

        // clear any old polling loop
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
    };

    const handleYearLevelChange = (event) => {
        console.log(`selected yearLevelIndex: ${event.target.value}`);
        setYearLevelIndex(event.target.value);
        setSectionIndex("");
        setClassAssignedSubjects([]);
        setPickedUpSubject(null);
        setAvailableSubjectTimeSlotMove(null)

        // clear any old polling loop
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
    };

    const intervalRef = useRef(null);

    const handleSectionChange = async (event) => {
        setIsLoading(true);

        try {
            const newSection = event.target.value;
            setSectionIndex(newSection);
            setPickedUpSubject(null);
            setAvailableSubjectTimeSlotMove(null)

            // clear any old polling loop
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }

            if (!newSection) {
                setIsLoading(false);
                return;
            }

            // fetch initial status & load once
            const initialStatus = await getSchedGenStatus(semesterIndex, departmentID);
            setSchedGenStatus(initialStatus);
            await load_schedule(newSection);

            // if it’s still "in progress" or "queued" start up a new loop
            if (["in progress", "on queue"].includes(initialStatus.Status)) {
                intervalRef.current = window.setInterval(async () => {
                    const currentStatus = await getSchedGenStatus(semesterIndex, departmentID);
                    setSchedGenStatus(currentStatus);

                    if (["in progress", "on queue"].includes(currentStatus.Status)) {
                        await load_schedule(newSection);
                    } else {
                        if (intervalRef.current) {
                            clearInterval(intervalRef.current);
                            intervalRef.current = null;
                        }
                    }
                }, 1_357);
            }
        } catch (err) {
            setPopupOptions({
                Heading: "Error Retrieving Section Schedule",
                HeadingStyle: { background: POPUP_ERROR_COLOR, color: "white" },
                Message: `${err}`
            });
        }

        setIsLoading(false);
    };

    // make sure we also clear when the component unmounts
    useEffect(() => () => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
        }
    }, []);

    const load_schedule = async (sectionIndex) => {
        try {
            // Fetch the latest schedule data
            const classScheduledSubjects = await fetchClassJsonSchedule(
                departmentID,
                semesterIndex,
                departmentCurriculumsData[curriculumIndex].CurriculumID,
                yearLevelIndex,
                sectionIndex
            );

            // Update state to trigger re-render with new data
            setClassAssignedSubjects(classScheduledSubjects);
            console.log('fetched subjects: ', classScheduledSubjects)

            // Assign colors to subjects for display
            const subjectColors = {};
            let subjectCount = 0;

            classScheduledSubjects.forEach((subject) => {
                if (!subjectColors[subject.SubjectCode]) {
                    subjectCount++;
                    subjectColors[subject.SubjectCode] = `color-${subjectCount}`;
                }
            });

            setSubjectColors(subjectColors);

            scrollToTable()
        } catch (err) {
            console.error("Error loading schedule:", err);
            setPopupOptions({
                Heading: "Failed to Load Schedule",
                HeadingStyle: { background: POPUP_ERROR_COLOR, color: "white" },
                Message: `${err}`,
            });
        }
    };

    const handleClearDepartmentSchedule = async () => {
        setIsLoading(true)

        try {
            const msg = await deleteClearDepartmentSchedule(departmentID, semesterIndex)

            setClassAssignedSubjects([]);
            setPickedUpSubject(null);
            setAvailableSubjectTimeSlotMove(null)

            setPopupOptions({
                Heading: "Cleared Department Schedule",
                HeadingStyle: { background: POPUP_SUCCESS_COLOR, color: "white" },
                Message: msg
            });

        } catch (err) {
            setPopupOptions({
                Heading: "Clear Department Schedule Failed",
                HeadingStyle: { background: POPUP_ERROR_COLOR, color: "white" },
                Message: `${err}`
            });
        }

        setIsLoading(false)
    }

    const handleClearClassSchedule = async () => {
        setIsLoading(true)

        try {
            const msg = await deleteClearSectionSchedule(
                departmentID,
                semesterIndex,
                departmentCurriculumsData[curriculumIndex].CurriculumID,
                yearLevelIndex,
                sectionIndex
            )

            setClassAssignedSubjects([]);
            setPickedUpSubject(null);
            setAvailableSubjectTimeSlotMove(null)

            setPopupOptions({
                Heading: "Cleared Section Schedule",
                HeadingStyle: { background: POPUP_SUCCESS_COLOR, color: "white" },
                Message: msg
            });

        } catch (err) {
            setPopupOptions({
                Heading: "Clear Section Schedule Failed",
                HeadingStyle: { background: POPUP_ERROR_COLOR, color: "white" },
                Message: `${err}`
            });
        }

        setIsLoading(false)
    }

    /////////////////////////////////////////////////////////////////////////////////
    //                             DROPDOWN HANDLERS
    /////////////////////////////////////////////////////////////////////////////////

    const generateDepartmentSchedules = async () => {
        setIsLoading(true)

        try {
            const msg = await generateSchedule(semesterIndex, departmentID)
            const res = await getSchedGenStatus(semesterIndex, departmentID)

            setSectionIndex("");
            setClassAssignedSubjects([]);
            setSchedGenStatus(res)

            setPopupOptions({
                Heading: "Generating Schedule...",
                HeadingStyle: { background: POPUP_WARNING_COLOR, color: "black" },
                Message: msg
            });
        } catch (err) {
            setPopupOptions({
                Heading: "Failed to generate schedule for the department",
                HeadingStyle: { background: POPUP_ERROR_COLOR, color: "white" },
                Message: `${err}`
            });
        }

        setIsLoading(false)
    };

    const handleValidateSchedules = async () => {
        setIsLoading(true)

        try {
            const validation_errors = await getValidateSchedules(semesterIndex, departmentID)

            if (validation_errors.length > 0 && Array.isArray(validation_errors)) {
                setPopupOptions({
                    Heading: "Validation Problems",
                    HeadingStyle: { background: POPUP_WARNING_COLOR, color: "black" },
                    Message: validation_errors
                });
            } else {
                setPopupOptions({
                    Heading: "Validation Result",
                    HeadingStyle: { background: POPUP_SUCCESS_COLOR, color: "white" },
                    Message: 'there are no problems found in the schedules'
                });
            }
        } catch (err) {
            setPopupOptions({
                Heading: "Validation Failed",
                HeadingStyle: { background: POPUP_ERROR_COLOR, color: "white" },
                Message: `${err}`
            });
        }

        setIsLoading(false)
    }

    const [subjectColors, setSubjectColors] = useState({});

    /////////////////////////////////////////////////////////////////////////////////
    //                              COMPONENT UI CODE
    /////////////////////////////////////////////////////////////////////////////////

    const [availableSubjectTimeSlotMove, setAvailableSubjectTimeSlotMove] = useState(null);

    const handlePickupSubject = async (picked_up_subject) => {
        setIsLoading(true);

        try {
            const subject_move_time_slot_availability = await fetchSubjectTimeSlotMoveAvailability(
                picked_up_subject,
                departmentID,
                semesterIndex,
                departmentCurriculumsData[curriculumIndex].CurriculumID,
                yearLevelIndex,
                sectionIndex
            );

            console.log('subject_move_time_slot_availability : ', subject_move_time_slot_availability)
            setAvailableSubjectTimeSlotMove(subject_move_time_slot_availability)
        } catch (err) {
            setPopupOptions({
                Heading: "Time Slot Availability Check Unavailable",
                HeadingStyle: { background: POPUP_ERROR_COLOR, color: "white" },
                Message: `${err}`
            });

            setIsLoading(false);
            return
        }


        let current_assigned_subjects = structuredClone(classAssignedSubjects);
        let current_picked_up_subject = structuredClone(pickedUpSubject);

        if (current_picked_up_subject) {
            current_assigned_subjects.push(current_picked_up_subject)
            current_picked_up_subject = null
        }

        current_picked_up_subject = picked_up_subject

        const new_assigned_subjects = current_assigned_subjects.filter(subj => {
            return !(picked_up_subject.DayIdx == subj.DayIdx && picked_up_subject.TimeSlotIdx == subj.TimeSlotIdx);
        })

        const heights = Array.from(
            document.querySelectorAll('table tr'),
            row => row.offsetHeight
        );

        const max_height = Math.max(...heights);
        setCellHeight(max_height * 0.875);

        console.log('max height : ', max_height)

        setClassAssignedSubjects(new_assigned_subjects);
        setPickedUpSubject(current_picked_up_subject);

        console.log('picked up subject: ', current_picked_up_subject);
        console.log('new assigned subject: ', new_assigned_subjects);

        setIsLoading(false);
    }

    const handleCancelPickupSubject = () => {
        let new_assigned_subjects = structuredClone(classAssignedSubjects);

        if (pickedUpSubject) {
            new_assigned_subjects.push(pickedUpSubject)
            setPickedUpSubject(null);
            setAvailableSubjectTimeSlotMove(null)
        }

        setClassAssignedSubjects(new_assigned_subjects);
    }

    const handleDropPickedUpSubject = async (selected_day, selected_time_slot) => {
        setIsLoading(true);

        if (!pickedUpSubject) {
            console.log('nothing to move')
            setIsLoading(false);
            return;
        }

        if (!availableSubjectTimeSlotMove) {
            setPopupOptions({
                Heading: "Time Slot Move Error",
                HeadingStyle: { background: POPUP_ERROR_COLOR, color: "white" },
                Message: `time slot availability array not found`
            });
            setIsLoading(false);
            return;
        }

        let is_movable = true;
        let total_free_time_slots = 0

        for (let i = 0; i < pickedUpSubject.SubjectTimeSlots; i++) {
            if (!availableSubjectTimeSlotMove[selected_day][selected_time_slot + i]) {
                is_movable = false;
                break;
            }

            total_free_time_slots++
        }

        if (!is_movable) {
            setPopupOptions({
                Heading: "Move Not Allowed",
                HeadingStyle: { background: POPUP_ERROR_COLOR, color: "white" },
                Message: `the subject to be move has a total of ${pickedUpSubject.SubjectTimeSlots} time slots, while the selected time slot only have ${total_free_time_slots} free time slots from the starting and preceding time slots`
            });
            setIsLoading(false);
            return;
        }

        const movedSubject = structuredClone(pickedUpSubject)
        movedSubject.DayIdx = Number(selected_day)
        movedSubject.TimeSlotIdx = Number(selected_time_slot)

        try {
            const msg = await fetchSubjectTimeSlotMove(
                movedSubject,
                departmentID,
                semesterIndex,
                departmentCurriculumsData[curriculumIndex].CurriculumID,
                yearLevelIndex,
                sectionIndex
            );

            setPopupOptions({
                Heading: "Time Slot Move Success",
                HeadingStyle: { background: POPUP_SUCCESS_COLOR, color: "white" },
                Message: msg
            });

            const newClassAssignedSubject = structuredClone(classAssignedSubjects)
            newClassAssignedSubject.push(movedSubject)

            setClassAssignedSubjects(newClassAssignedSubject);
            setPickedUpSubject(null);
            setAvailableSubjectTimeSlotMove(null)
        } catch (err) {
            setPopupOptions({
                Heading: "Time Slot Move Error",
                HeadingStyle: { background: POPUP_ERROR_COLOR, color: "white" },
                Message: `${err}`
            });
            setIsLoading(false);
            return;
        }

        setIsLoading(false);
    }

    const [position, setPosition] = useState({ x: 0, y: 0 });

    useEffect(() => {
        const handleMouseMove = (event) => {
            setPosition({ x: event.clientX, y: event.clientY });
        };

        // Listen for mousemove on the whole window
        window.addEventListener('mousemove', handleMouseMove);

        // Clean up on unmount
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
        };
    }, []);

    const [cellHeight, setCellHeight] = useState(0);



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
        documentTitle: `${departmentCurriculumsData[curriculumIndex]?.CurriculumName} - ${SEMESTER_NAMES[semesterIndex]} ${new Date().getFullYear()} - Section ${SECTION_CHARACTERS[sectionIndex]}`,
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
        }
        ,
    });

    const reactToPrintBlackAndWhiteFn = useReactToPrint({
        contentRef,
        documentTitle: `${departmentCurriculumsData[curriculumIndex]?.CurriculumName} - ${SEMESTER_NAMES[semesterIndex]} ${new Date().getFullYear()} - Section ${SECTION_CHARACTERS[sectionIndex]}`,
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
        }
        ,
    });

    const [academicYear, setAcademicYear] = useState("")
    const [adviserFullName, setAdviserFullName] = useState("")

    const [signatoryPreparedBy, setSignatoryPreparedBy] = useState("")
    const [positionPreparedBy, setPositionPreparedBy] = useState("")

    const [signatoryCheckedAndReviewedBy, setSignatoryCheckedAndReviewedBy] = useState("")
    const [positionCheckedAndReviewedBy, setPositionCheckedAndReviewedBy] = useState("")

    const [isPrintDialogShow, setIsPrintDialogShow] = useState(false)

    const handleOpenSignatoriesDialog = () => {

        const academic_year = localStorage.getItem('academic-year')
        const adviser_fullname = localStorage.getItem('adviser-full-name')

        const signatory_prepared_by = localStorage.getItem('signatory-prepared-by')
        const position_prepared_by = localStorage.getItem('position-prepared-by')

        const signatory_checked_and_reviewed_by = localStorage.getItem('signatory-check-and-reviewed-by')
        const position_checked_and_reviewed_by = localStorage.getItem('position-check-and-reviewed-by')

        setAcademicYear(academic_year)
        setAdviserFullName(adviser_fullname)

        setSignatoryPreparedBy(signatory_prepared_by)
        setPositionPreparedBy(position_prepared_by)

        setSignatoryCheckedAndReviewedBy(signatory_checked_and_reviewed_by)
        setPositionCheckedAndReviewedBy(position_checked_and_reviewed_by)

        setIsPrintDialogShow(true)
    }

    const saveAddedOptionalPrintingValues = () => {
        localStorage.setItem('academic-year', academicYear)
        localStorage.setItem('adviser-full-name', adviserFullName)

        localStorage.setItem('signatory-prepared-by', signatoryPreparedBy)
        localStorage.setItem('position-prepared-by', positionPreparedBy)

        localStorage.setItem('signatory-check-and-reviewed-by', signatoryCheckedAndReviewedBy)
        localStorage.setItem('position-check-and-reviewed-by', positionCheckedAndReviewedBy)
    }

    /////////////////////////////////////////////////////////////////////////////////

    return (
        <>
            <MainHeader pageName={'schedule'} />
            {/*================================= Loading Component =================================*/}

            <Popup popupOptions={popupOptions} closeButtonActionHandler={() => {
                setPopupOptions(null);
            }} />

            <Loading
                IsLoading={IsLoading}
            />

            <div className="table-container">

                {/*================================= Dropdown Container =================================*/}

                <div className="dropdown-container" style={{ display: 'flex', flexDirection: 'column' }} ref={focusRef}>
                    <div id="left-dropdown-container" style={{ width: '100%', display: 'flex', justifyContent: 'space-evenly', padding: '0.2em', gap: '0.5em' }}>
                        <select className="dropdown" style={{ width: '100%' }} value={departmentID} onChange={handleDepartmentChange} disabled={pickedUpSubject}>
                            <option value="">Department</option>
                            {allDepartments ?
                                allDepartments.map((department, index) => {
                                    if (department.DepartmentID == 0) {
                                        return null
                                    }

                                    return <option key={index} value={department.DepartmentID}>{department.Code}</option>
                                }) : null
                            }
                        </select>

                        <select className="dropdown" style={{ width: '100%' }} value={semesterIndex} onChange={handleSemesterChange} disabled={!departmentID || pickedUpSubject}>
                            <option value="">Semester</option>
                            <option value={0}>1st Semester</option>
                            <option value={1}>2nd Semester</option>
                            <option value={2}>Mid-year</option>
                        </select>

                        <select className="dropdown" style={{ width: '100%' }} value={curriculumIndex} onChange={handleCurriculumChange} disabled={!semesterIndex || pickedUpSubject}>
                            <option value="">Course</option>
                            {departmentCurriculumsData ?
                                departmentCurriculumsData.map((curriculum, index) => (
                                    <option key={curriculum.CurriculumCode} value={index}>
                                        {curriculum.CurriculumCode}
                                    </option>
                                )) : null
                            }
                        </select>

                        <select className="dropdown" style={{ width: '100%' }} value={yearLevelIndex} onChange={handleYearLevelChange} disabled={!curriculumIndex || pickedUpSubject}>
                            <option value="">Year Level</option>
                            {curriculumIndex ?
                                departmentCurriculumsData[curriculumIndex].YearLevels.map((year_level, index) => {
                                    if (year_level.Name) {
                                        return (
                                            <option key={index} value={index}>
                                                {year_level.Name}
                                            </option>
                                        )
                                    }

                                    return null
                                }) : null
                            }
                        </select>

                        <select className="dropdown" style={{ width: '100%' }} value={sectionIndex} onChange={handleSectionChange} disabled={!yearLevelIndex || pickedUpSubject}>
                            <option value="">Section</option>
                            {yearLevelIndex ?
                                Array.from({ length: departmentCurriculumsData[curriculumIndex].YearLevels[yearLevelIndex].Sections }, (_, index) => (
                                    <option key={index} value={index}>
                                        {`Section ${SECTION_CHARACTERS[index]}`}
                                    </option>
                                )) : null
                            }
                        </select>
                    </div>
                </div>

                {/*================================= TimeTable Table =================================*/}


                {pickedUpSubject ?
                    <div className={`${pickedUpColor} subject-cursor`}
                        style={{
                            height: `${pickedUpSubject.SubjectTimeSlots * cellHeight}px`,
                            width: '13.5%',
                            border: '1px solid black',
                            display: 'flex', flexDirection: 'column',
                            justifyContent: 'center',
                            alignItems: 'center',
                            position: 'fixed',
                            top: `${position.y + 2}px`,
                            left: `${position.x + 2}px`,
                        }}
                    >
                        <div
                            className="subject-content"
                        >
                            <div className="subject-name">{pickedUpSubject.SubjectCode}</div>
                            <div className="instructor">{pickedUpSubject.InstructorLastName}</div>
                            <div className="room">{pickedUpSubject.RoomName}</div>
                        </div>
                    </div> : null
                }

                <div ref={contentRef} style={{ padding: (isPrinting && Number.isInteger(Number.parseInt(sectionIndex, 10))) ? '1em' : '0px' }}>

                    {(isPrinting && Number.isInteger(Number.parseInt(sectionIndex, 10))) ? (<>
                        <PrintHeader isBlackAndWhite={isBlackAndWhite} />

                        <Box display={'flex'} flexDirection={'column'} justifyContent={'center'} padding={1} gap={0} marginTop={1}>
                            <Typography lineHeight={1} variant="body1" flexWrap={true} textAlign={'center'}>{allDepartments.find(d => d.DepartmentID == departmentID).Name?.toUpperCase()}</Typography>
                            <Typography lineHeight={1} variant="body1" flexWrap={true} fontWeight={'bold'} textAlign={'center'}>Student's Schedule</Typography>
                            <Typography lineHeight={1} variant="body1" textAlign={'center'}>{`${SEMESTER_NAMES[semesterIndex]}${academicYear ? (', ' + academicYear) : ''}`}</Typography>
                        </Box>

                        <Box display={'flex'} justifyContent={'space-between'} alignItems={'center'}>
                            <Typography variant="body1">{
                                `Program: ${departmentCurriculumsData[curriculumIndex].CurriculumName}`
                            }</Typography>

                            <Typography variant="body1">{
                                `Year: ${departmentCurriculumsData[curriculumIndex].YearLevels[yearLevelIndex].Name}`
                            }</Typography>
                        </Box>

                        <Box display={'flex'} justifyContent={'space-between'} alignItems={'center'} marginBottom={1}>
                            {adviserFullName ? <Typography variant="body1">{
                                `Adviser: ${adviserFullName}`
                            }</Typography> : null}

                            <Typography variant="body1">{
                                `Section: ${SECTION_CHARACTERS[sectionIndex]}`
                            }</Typography>
                        </Box>
                    </>) : null}

                    <table className="time-table" style={{ display: sectionIndex ? 'revert' : 'none' }}>
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
                            {generateTimeSlotRowLabels(startHour, timeSlotMinuteInterval, dailyTimeSlots).map((time_slot_label, row_idx) => (
                                <tr key={row_idx}>
                                    <td
                                        style={{ ...((isBlackAndWhite) ? { background: 'white', color: 'black' } : {}) }}
                                        className="time-slot"
                                    >{time_slot_label}</td>
                                    {DAYS.map((_, day_idx) => {
                                        const has_assigned_subject = classAssignedSubjects.find(
                                            (subj) => subj.DayIdx === day_idx && subj.TimeSlotIdx === row_idx
                                        );

                                        if (has_assigned_subject) {
                                            return (
                                                <td
                                                    key={day_idx}
                                                    className={`subject-cell ${(!isBlackAndWhite) ? subjectColors[has_assigned_subject.SubjectCode] : 'color-bw'}`}
                                                    rowSpan={has_assigned_subject.SubjectTimeSlots}
                                                    onClick={() => {
                                                        handlePickupSubject(has_assigned_subject)
                                                        setPickedUpColor(`subject-cell ${subjectColors[has_assigned_subject.SubjectCode]}`)
                                                    }}
                                                >
                                                    <div className="subject-content">
                                                        <div className="subject-name">{has_assigned_subject.SubjectCode}</div>
                                                        <div className="instructor">{has_assigned_subject.InstructorLastName}</div>
                                                        <div className="room">{has_assigned_subject.RoomName}</div>
                                                    </div>
                                                </td>
                                            );
                                        }

                                        // row spans occupy space in a tr despite not having the td element spanning in that tr,
                                        // that's why this logic is needed because if we didn't do this, we will add empty slots
                                        // to the rows with cells that are affected by a row spans, which could lead to new empty
                                        // slots that can go outside of the table.

                                        const is_occupied = classAssignedSubjects.some((subject) => {
                                            const has_hit_subject_in_row = row_idx >= subject.TimeSlotIdx && row_idx < (subject.TimeSlotIdx + subject.SubjectTimeSlots);
                                            const has_hit_subject_in_col = day_idx == subject.DayIdx;
                                            return has_hit_subject_in_row && has_hit_subject_in_col;
                                        });

                                        if (availableSubjectTimeSlotMove) {
                                            if (availableSubjectTimeSlotMove[day_idx][row_idx]) {
                                                return <td
                                                    key={day_idx}
                                                    className="empty-slot free-move-slot"
                                                    onClick={() => handleDropPickedUpSubject(day_idx, row_idx)}
                                                ></td>;
                                            }
                                        }

                                        return is_occupied ? null : <td key={day_idx} className="empty-slot"></td>;
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

                {(!sectionIndex) ?
                    <Box height={200}></Box> :
                    null
                }

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
                    <DialogTitle>Student Schedule Signatories</DialogTitle>

                    <DialogContent>
                        <DialogContentText id="alert-dialog-description">
                            Add signatories and other info if needed to include in printing
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
                                    label="Adviser"
                                    autoFocus
                                    variant="standard"
                                    onChange={(e) => setAdviserFullName(e.target.value)}
                                    defaultValue={adviserFullName ? adviserFullName : ""}
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

                <Box padding={1} gap={1} display={'flex'} justifyContent={'space-evenly'}>
                    <Button
                        size="small"
                        fullWidth
                        onClick={generateDepartmentSchedules}
                        disabled={!semesterIndex || pickedUpSubject}
                        variant="contained"
                        color="success"
                    >
                        Generate Department Semester Schedules
                    </Button>

                    <Button
                        size="small"
                        fullWidth
                        onClick={handleValidateSchedules}
                        disabled={!semesterIndex || pickedUpSubject}
                        variant="contained"
                        color="warning"
                    >
                        Validate Schedules
                    </Button>

                    <Button
                        size="small"
                        fullWidth
                        onClick={handleClearDepartmentSchedule}
                        disabled={!semesterIndex || pickedUpSubject}
                        variant="contained"
                        color="error"
                    >
                        Clear Department Semester Schedules
                    </Button>

                    <Button
                        size="small"
                        fullWidth
                        onClick={handleClearClassSchedule}
                        disabled={!sectionIndex || pickedUpSubject}
                        variant="outlined"
                        color="error"
                    >
                        Clear Section Semester Schedule
                    </Button>

                    {pickedUpSubject ? <Button
                        size="small"
                        fullWidth
                        onClick={handleCancelPickupSubject}
                        disabled={!pickedUpSubject}
                        variant="contained"
                        color="primary"
                    >
                        Cancel Move
                    </Button> : null}
                </Box>
            </div >

            {schedGenStatus ?
                <>
                    < Box padding={2} >
                        <Typography
                            variant="h6"
                            style={{
                                color: getScheduleGenerationStatusColor(schedGenStatus.Status),
                                textAlign: 'center'
                            }}
                        >
                            {schedGenStatus.Status}
                        </Typography>
                        <Typography variant="body2" style={{ color: 'black', textAlign: 'center' }}>
                            {schedGenStatus.Message}
                        </Typography>

                        {sectionIndex ?
                            <LinearProgressWithLabel
                                value={
                                    Number.isNaN(Number.parseInt(extractGenerationNumber(schedGenStatus.Message), 10)) ?
                                        0 : (Number.parseInt(extractGenerationNumber(schedGenStatus.Message), 10) / NUMBER_OF_GENERATIONS) * 100
                                }
                            />
                            : null}
                    </Box >
                </>
                : null}

            {resourceEstimates ?
                <Box padding={2}>
                    <Typography variant="body1" style={{ color: 'black', textAlign: 'center' }}>
                        {resourceEstimates}
                    </Typography>
                </Box>
                : null}

            <Box display={'flex'} justifyContent={'center'} alignItems={'center'} padding={5}>
                <a href="/view_schedule/">link for publicly accessible schedule page view</a>
            </Box>
        </>
    );
}

createRoot(document.getElementById("root")).render(
    <StrictMode>
        <ThemeProvider theme={theme}>
            <TimeTable />
        </ThemeProvider>
    </StrictMode>
);

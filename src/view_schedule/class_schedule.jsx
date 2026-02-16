import { StrictMode, useState, useEffect, useRef } from "react";
import { createRoot } from "react-dom/client";

import { Loading, Popup, POPUP_ERROR_COLOR } from "../components/Loading";

import "../assets/main.css";
import "../schedule/TimeTable.css";
import "../schedule/TimeTableDropdowns.css";

import { fetchAllDepartments, fetchDepartmentCurriculumsData } from "../js/departments"
import { fetchClassJsonSchedule, fetchResourceEstimates, generateSchedule, getValidateSchedules, deleteClearDepartmentSchedule, deleteClearSectionSchedule, getSchedGenStatus } from "../js/schedule"

import { generateTimeSlotRowLabels } from "../js/week-time-table-grid-functions";

const SECTION_CHARACTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890abcdefghijklmnopqrstuvwxyz";

import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';
import { ThemeProvider } from "@emotion/react";
import theme from "../components/Theme";
import { Box, Typography } from "@mui/material";

import "../assets/SubjectColors.css";

function TimeTable() {

    /////////////////////////////////////////////////////////////////////////////////
    //                     LOAD GUARD COMPONENT STATES
    /////////////////////////////////////////////////////////////////////////////////

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
            await load_schedule(newSection);

            // if it’s still "in progress" or "queued" start up a new loop
            if (["in progress", "on queue"].includes(initialStatus.Status)) {
                intervalRef.current = window.setInterval(async () => {

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

            // Scroll to the bottom of the page
            window.scrollTo({
                top: document.documentElement.scrollHeight,
                behavior: 'smooth',
            });
        } catch (err) {
            console.error("Error loading schedule:", err);
            setPopupOptions({
                Heading: "Failed to Load Schedule",
                HeadingStyle: { background: POPUP_ERROR_COLOR, color: "white" },
                Message: `${err}`,
            });
        }
    };

    /////////////////////////////////////////////////////////////////////////////////
    //                             DROPDOWN HANDLERS
    /////////////////////////////////////////////////////////////////////////////////

    const [subjectColors, setSubjectColors] = useState({});

    /////////////////////////////////////////////////////////////////////////////////
    //                              COMPONENT UI CODE
    /////////////////////////////////////////////////////////////////////////////////

    const [availableSubjectTimeSlotMove, setAvailableSubjectTimeSlotMove] = useState(null);

    return (
        <>
            <Box display={'flex'} justifyContent={'center'} alignItems={'center'} padding={1} bgcolor={'#800080'}>
                <Typography variant="h6" color="#00ff00">Cavite Statue University - Silang Campus Schedules</Typography>
            </Box>

            <Popup popupOptions={popupOptions} closeButtonActionHandler={() => {
                setPopupOptions(null);
            }} />

            <Loading
                IsLoading={IsLoading}
            />

            <div className="table-container">

                {/*================================= Dropdown Container =================================*/}

                <div className="dropdown-container" style={{ display: 'flex', flexDirection: 'column' }}>
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

                <table className="time-table" style={{ display: sectionIndex ? 'revert' : 'none' }}>
                    <thead>
                        <tr>
                            <th className="time-slot-header">Time Slot</th>
                            {DAYS.map((day) => (
                                <th key={day} className="day-header">{day}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {generateTimeSlotRowLabels(startHour, timeSlotMinuteInterval, dailyTimeSlots).map((time_slot_label, row_idx) => (
                            <tr key={row_idx}>
                                <td className="time-slot">{time_slot_label}</td>
                                {DAYS.map((_, day_idx) => {
                                    const has_assigned_subject = classAssignedSubjects.find(
                                        (subj) => subj.DayIdx === day_idx && subj.TimeSlotIdx === row_idx
                                    );

                                    if (has_assigned_subject) {
                                        return (
                                            <td
                                                key={day_idx}
                                                className={`subject-cell ${subjectColors[has_assigned_subject.SubjectCode]}`}
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
            </div>
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

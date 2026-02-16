import { StrictMode, useState, useEffect } from "react";
import { createRoot } from "react-dom/client";

import { Loading, Popup } from "../components/Loading";

import "../assets/main.css";
import "./TimeTable.css";
import "./TimeTableDropdowns.css";

import { fetchAllDepartments, fetchDepartmentCurriculumsData } from "../js/departments"
import { deserializeSchedule, fetchClassJsonSchedule, fetchSerializedClassSchedule, generateSchedule, deleteClearDepartmentSchedule, deleteClearSectionSchedule, surveyAddPreference } from "../js/schedule"

import { generateTimeSlotRowLabels } from "../js/week-time-table-grid-functions";
import { MainHeader } from "../components/Header";

const SECTION_CHARACTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890abcdefghijklmnopqrstuvwxyz";

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
    const [classAssignedSubjectsBackup, setClassAssignedSubjectsBackup] = useState([]) // fetch on section selection

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
            console.log(all_departments);

            setIsLoading(false);
        } catch (err) {
            setPopupOptions({
                Heading: "Failed to Fetch All Department Data",
                HeadingStyle: { background: "red", color: "white" },
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

        if (event.target.value) {
            setIsLoading(true);

            try {
                await updateCurriculumData(event.target.value);

                setIsLoading(false);
            } catch (err) {
                setPopupOptions({
                    Heading: "Failed to Fetch Semester Data",
                    HeadingStyle: { background: "red", color: "white" },
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
    };

    const handleYearLevelChange = (event) => {
        console.log(`selected yearLevelIndex: ${event.target.value}`);
        setYearLevelIndex(event.target.value);
        setSectionIndex("");
        setClassAssignedSubjects([]);
    };

    const handleSectionChange = async (event) => {
        console.log(`selected sectionSchedIndex: ${event.target.value}`);

        console.log(
            `fetching : DepartmentID=${departmentID}, SemesterIndex=${semesterIndex}, ScheduleIndex=${event.target.value}`
        );

        setSectionIndex(event.target.value);
        setClassAssignedSubjects([]);

        if (event.target.value) {
            setIsLoading(true);

            try {
                const class_scheduled_subjects = await fetchClassJsonSchedule(
                    departmentID,
                    semesterIndex,
                    departmentCurriculumsData[curriculumIndex].CurriculumID,
                    yearLevelIndex,
                    event.target.value
                );

                console.log(class_scheduled_subjects)

                // DEBUG BLOCK: START
                // console.log('debug prints - remove later : start')
                // const class_serialized_scheduled = await fetchSerializedClassSchedule(departmentID, semesterIndex, event.target.value);
                // const class_deserialized_sched = await deserializeSchedule(class_serialized_scheduled);

                // console.log('deserialized schedule :');
                // console.log(class_deserialized_sched);
                // console.log('json sched :');
                // console.log(class_scheduled_subjects);
                // console.log('debug prints - remove later : end')
                // DEBUG BLOCK: END

                setClassAssignedSubjects(class_scheduled_subjects);

                const subject_colors = [];
                let subject_count = 0;

                class_scheduled_subjects.forEach((subject) => {
                    if (!subject_colors[subject.SubjectCode]) {
                        subject_count++;
                        subject_colors[subject.SubjectCode] = `color-${subject_count}`;
                    }
                });

                setSubjectColors(subject_colors);

                setIsLoading(false);

                window.scrollTo({
                    top: document.documentElement.scrollHeight,
                    behavior: 'smooth'
                });
            } catch (err) {
                setPopupOptions({
                    Heading: "Failed To Retrieve Schedule",
                    HeadingStyle: { background: "red", color: "white" },
                    Message: `${err}`
                });
                setIsLoading(false);
            }
        }
    };

    const handleClearDepartmentSchedule = async () => {
        setIsLoading(true)

        try {
            const msg = await deleteClearDepartmentSchedule(departmentID, semesterIndex)

            setClassAssignedSubjects([]);

            setPopupOptions({
                Heading: "Cleared Department Schedule",
                HeadingStyle: { background: "green", color: "white" },
                Message: msg
            });
        } catch (err) {
            setPopupOptions({
                Heading: "Clear Department Schedule Failed",
                HeadingStyle: { background: "red", color: "white" },
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

            setPopupOptions({
                Heading: "Cleared Section Schedule",
                HeadingStyle: { background: "green", color: "white" },
                Message: msg
            });
        } catch (err) {
            setPopupOptions({
                Heading: "Clear Section Schedule Failed",
                HeadingStyle: { background: "red", color: "white" },
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

            setSectionIndex("");
            setClassAssignedSubjects([]);

            setPopupOptions({
                Heading: "Generating Schedule...",
                HeadingStyle: { background: "Yellow", color: "black" },
                Message: msg
            });
        } catch (err) {
            setPopupOptions({
                Heading: "Failed to generate schedule for the department",
                HeadingStyle: { background: "red", color: "white" },
                Message: `${err}`
            });
        }

        setIsLoading(false)
    };

    const [subjectColors, setSubjectColors] = useState({});

    ////////////////////////////////////////////////////////////

    const [isDroppedSuccess, setIsDroppedSuccess] = useState(true)

    const handleDragStart = (e, subject) => {
        e.dataTransfer.setData("subject", JSON.stringify(subject));

        const droppedSubject = JSON.parse(e.dataTransfer.getData("subject"));

        setIsDroppedSuccess(false)
        setClassAssignedSubjectsBackup(structuredClone(classAssignedSubjects));

        const updatedSubjects = classAssignedSubjects.filter((subj) => {
            return !(
                subj.SubjectCode === droppedSubject.SubjectCode &&
                subj.InstructorLastName === droppedSubject.InstructorLastName &&
                subj.RoomName === droppedSubject.RoomName
            )
        });

        setClassAssignedSubjects(updatedSubjects);

        console.log('dragging...: ', updatedSubjects)
    };

    const handleDragEnd = (e) => {
        if (!isDroppedSuccess) {
            setClassAssignedSubjects(classAssignedSubjectsBackup)
        }

        console.log('drag end')
    };

    const handleDragOver = (e) => {
        e.preventDefault();
    };

    const handleDrop = (e, dayIdx, timeSlotIdx) => {
        e.preventDefault();
        const droppedSubject = JSON.parse(e.dataTransfer.getData("subject"));

        console.log('droppedSubject: ', droppedSubject)
        console.log('day & time slot: ', dayIdx, timeSlotIdx)

        if (timeSlotIdx + droppedSubject.SubjectTimeSlots - 1 >= dailyTimeSlots) {
            setPopupOptions({
                Heading: "Not Enough Time Slots",
                HeadingStyle: { background: "red", color: "white" },
                Message: "the remaining time slots are not enough.",
            });

            return
        }

        let has_overlap = false;

        for (let i = 0; i < classAssignedSubjectsBackup.length; i++) {
            if (classAssignedSubjectsBackup[i].DayIdx == dayIdx) {
                if (classAssignedSubjectsBackup[i].SubjectCode == droppedSubject.SubjectCode && classAssignedSubjectsBackup[i].RoomName == droppedSubject.RoomName) {
                    continue
                }

                const dropStartSlot = timeSlotIdx
                const dropEndSlot = timeSlotIdx + droppedSubject.SubjectTimeSlots - 1

                const sitStartSlot = classAssignedSubjectsBackup[i].TimeSlotIdx
                const sitEndSlot = classAssignedSubjectsBackup[i].TimeSlotIdx + classAssignedSubjectsBackup[i].SubjectTimeSlots - 1

                has_overlap = Math.max(dropStartSlot, sitStartSlot) <= Math.min(dropEndSlot, sitEndSlot)

                if (has_overlap) {
                    setPopupOptions({
                        Heading: "Overlapping Subjects",
                        HeadingStyle: { background: "red", color: "white" },
                        Message: "This time slot overlaps to another subject.",
                    });

                    return
                }
            }
        }

        const updatedSubjects = classAssignedSubjectsBackup.map((subj) => {
            if (
                subj.SubjectCode === droppedSubject.SubjectCode &&
                subj.InstructorLastName === droppedSubject.InstructorLastName &&
                subj.RoomName === droppedSubject.RoomName
            ) {
                return { ...subj, DayIdx: dayIdx, TimeSlotIdx: timeSlotIdx };
            }
            return subj;
        });

        setClassAssignedSubjects(updatedSubjects);
        setIsDroppedSuccess(true)
    };

    const saveConfiguration = async () => {
        setIsLoading(true);
        try {
            const response = await surveyAddPreference(classAssignedSubjects);
            setPopupOptions({
                Heading: "Configuration Saved",
                HeadingStyle: { background: "green", color: "white" },
                Message: response,
            });
        } catch (error) {
            setPopupOptions({
                Heading: "Failed to Save Configuration",
                HeadingStyle: { background: "red", color: "white" },
                Message: `${error}`,
            });
        }
        setIsLoading(false);
    };

    /////////////////////////////////////////////////////////////////////////////////
    //                              COMPONENT UI CODE
    /////////////////////////////////////////////////////////////////////////////////

    // Updated JSX Return
    return (
        <>
            <Popup
                popupOptions={popupOptions}
                closeButtonActionHandler={() => setPopupOptions(null)}
            />
            <Loading IsLoading={IsLoading} />
            <div
                className="table-container"
                onDragEnd={(e) => handleDragEnd(e)}
            >
                {/* Dropdown Container (unchanged) */}
                <div className="dropdown-container" style={{ display: "flex", flexDirection: "column" }}>
                    <div
                        id="left-dropdown-container"
                        style={{ width: "100%", display: "flex", justifyContent: "space-evenly", padding: "0.2em", gap: "0.5em" }}
                    >
                        <select className="dropdown" style={{ width: "100%" }} value={departmentID} onChange={handleDepartmentChange}>
                            <option value="">Department</option>
                            {allDepartments.map((department, index) => (
                                <option key={index} value={department.DepartmentID}>
                                    {department.Code}
                                </option>
                            ))}
                        </select>
                        {/* Other dropdowns remain unchanged */}
                        <select className="dropdown" style={{ width: "100%" }} value={semesterIndex} onChange={handleSemesterChange} disabled={!departmentID}>
                            <option value="">Semester</option>
                            <option value={0}>1st Semester</option>
                            <option value={1}>2nd Semester</option>
                        </select>
                        <select className="dropdown" style={{ width: "100%" }} value={curriculumIndex} onChange={handleCurriculumChange} disabled={!semesterIndex}>
                            <option value="">Course</option>
                            {departmentCurriculumsData.map((curriculum, index) => (
                                <option key={curriculum.CurriculumCode} value={index}>
                                    {curriculum.CurriculumCode}
                                </option>
                            ))}
                        </select>
                        <select className="dropdown" style={{ width: "100%" }} value={yearLevelIndex} onChange={handleYearLevelChange} disabled={!curriculumIndex}>
                            <option value="">Year Level</option>
                            {curriculumIndex &&
                                departmentCurriculumsData[curriculumIndex].YearLevels.map((year_level, index) => (
                                    <option key={index} value={index}>
                                        {year_level.Name}
                                    </option>
                                ))}
                        </select>
                        <select className="dropdown" style={{ width: "100%" }} value={sectionIndex} onChange={handleSectionChange} disabled={!yearLevelIndex}>
                            <option value="">Section</option>
                            {yearLevelIndex &&
                                Array.from({ length: departmentCurriculumsData[curriculumIndex].YearLevels[yearLevelIndex].Sections }, (_, index) => (
                                    <option key={index} value={index}>
                                        {`Section ${SECTION_CHARACTERS[index]}`}
                                    </option>
                                ))}
                        </select>
                    </div>
                </div>

                {/* Updated Timetable with Drag-and-Drop */}
                <table className="time-table" style={{ display: sectionIndex ? "revert" : "none" }}>
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
                                                draggable
                                                onDragStart={(e) => handleDragStart(e, has_assigned_subject)}
                                            >
                                                <div className="subject-content">
                                                    <div className="subject-name">{has_assigned_subject.SubjectCode}</div>
                                                    <div className="instructor">{has_assigned_subject.InstructorLastName}</div>
                                                    <div className="room">{has_assigned_subject.RoomName}</div>
                                                </div>
                                            </td>
                                        );
                                    }

                                    const is_occupied = classAssignedSubjects.some((subject) => {
                                        const has_hit_subject_in_row =
                                            row_idx >= subject.TimeSlotIdx && row_idx < subject.TimeSlotIdx + subject.SubjectTimeSlots;
                                        const has_hit_subject_in_col = day_idx === subject.DayIdx;
                                        return has_hit_subject_in_row && has_hit_subject_in_col;
                                    });

                                    return is_occupied ? null : (
                                        <td
                                            key={day_idx}
                                            className="empty-slot"
                                            onDragOver={handleDragOver}
                                            onDrop={(e) => handleDrop(e, day_idx, row_idx)}
                                        ></td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* Updated Button Section with Save Configuration */}
                <div style={{ width: "100%", display: "flex", justifyContent: "space-evenly", padding: "0.5em", gap: "0.5em" }}>
                    <button className="all-btns" style={{ width: "100%" }} onClick={generateDepartmentSchedules} disabled={!semesterIndex}>
                        Generate Department Semester Schedules
                    </button>
                    <button className="all-btns" style={{ width: "100%" }} onClick={handleClearDepartmentSchedule} disabled={!semesterIndex}>
                        Clear Department Semester Schedules
                    </button>
                    <button className="all-btns" style={{ width: "100%" }} onClick={handleClearClassSchedule} disabled={!sectionIndex}>
                        Clear Section Semester Schedule
                    </button>
                    <button className="all-btns" style={{ width: "100%" }} onClick={saveConfiguration} disabled={!sectionIndex}>
                        Save Configuration
                    </button>
                </div>
            </div>
        </>
    );
}

createRoot(document.getElementById("root")).render(
    <StrictMode>
        <TimeTable />
    </StrictMode>
);

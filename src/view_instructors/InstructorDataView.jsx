import { useState, useEffect, useRef } from "react";

import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';

import { InstructorTimeSlotBitMap } from "../js/instructor-time-slot-bit-map"

import { Box, Typography, FormControl, InputLabel, Select, MenuItem } from "@mui/material";
import { generateTimeSlotRowLabels } from "../js/week-time-table-grid-functions";
import { fetchInstructorResources } from "../js/instructors_v2"

import { Loading, POPUP_ERROR_COLOR } from "../components/Loading";

import "../assets/SubjectColors.css";

export default function InstructorDataView({
    selectedDepartment,
    selectedInstructor, setSelectedInstructor,
    mode, setMode,
    onInstructorDataViewClose,
    reloadInstructorsTable,
    departments,
    popupOptions, setPopupOptions,
}) {
    const [subjectColors, setSubjectColors] = useState({});

    /////////////////////////////////////////////////////////////////////////////////
    //                       SELECTED TIME SLOT CELL
    /////////////////////////////////////////////////////////////////////////////////

    const [selectedTimeSlots, setSelectedTimeSlots] = useState(new Set())

    /////////////////////////////////////////////////////////////////////////////////
    //                     LOAD GUARD COMPONENT STATES
    /////////////////////////////////////////////////////////////////////////////////

    const [IsLoading, setIsLoading] = useState(false);

    /////////////////////////////////////////////////////////////////////////////////
    //                       TIME TABLE GRID STATES
    /////////////////////////////////////////////////////////////////////////////////

    const [semesterIndex, setSemesterIndex] = useState("");

    const handleSemesterChange = (e) => {
        setSemesterIndex(e.target.value)

        const semester_idx = Number.parseInt(e.target.value, 10)

        if (Number.isInteger(semester_idx)) {
            console.log('selected semester index:', e.target.value)

            setAllocatedSubjectAssign(
                instructorResources.current.semesters_sub_assign[semester_idx]
            )

            const subject_colors = [];
            let subject_count = 0;

            instructorResources.current.semesters_sub_assign[semester_idx].forEach((subject) => {
                if (!subject_colors[`${subject.SubjectCode}${subject.CourseSection}`]) {
                    subject_count++;
                    subject_colors[`${subject.SubjectCode}${subject.CourseSection}`] = `color-${subject_count}`;
                }
            });

            setSubjectColors(subject_colors);

            console.log('allocated time slots:',
                new InstructorTimeSlotBitMap(
                    instructorResources.current.semesters_time_slots[semester_idx]
                )
            )

            console.log('subjects allocated:', instructorResources.current.semesters_sub_assign[semester_idx])
        } else {
            console.log('selected semester index: none')
            setAllocatedSubjectAssign([])
            setSubjectColors([])
        }
    }

    const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const [startHour, setStartHour] = useState(7);
    const [timeSlotMinuteInterval, setTimeSlotMinuteInterval] = useState(30);
    const [dailyTimeSlots, setDailyTimeSlots] = useState(24);

    const instructorResources = useRef(null)
    const [baseResourceTimeSlots, setBaseResourceTimeSlots] = useState(new InstructorTimeSlotBitMap())
    const [semsResourceTimeSlots, setSemsResourceTimeSlots] = useState(new InstructorTimeSlotBitMap())
    const [allocatedSubjectAssign, setAllocatedSubjectAssign] = useState([])

    const load_resources = async () => {
        try {
            if (mode == "new") {
                setBaseResourceTimeSlots(new InstructorTimeSlotBitMap())
                setSemsResourceTimeSlots(new InstructorTimeSlotBitMap())
                setSemesterIndex("")

                instructorResources.current = {
                    "base_time_slots": ["0", "0", "0"]
                }

                return
            }

            setIsLoading(true)

            const instructor_resources = await fetchInstructorResources(selectedInstructor.InstructorID)
            console.log('load_resources -> fetchInstructorResources  : ', instructor_resources)

            const base_time_slots = new InstructorTimeSlotBitMap(instructor_resources.base_time_slots)
            const semesters_time_slots = new InstructorTimeSlotBitMap(instructor_resources.base_time_slots)

            for (let i = 0; i < instructor_resources.semesters_time_slots.length; i++) {
                const sem_time_slots = new InstructorTimeSlotBitMap(instructor_resources.semesters_time_slots[i])

                for (let day = 0; day < DAYS.length; day++) {
                    for (let time_slot = 0; time_slot < dailyTimeSlots; time_slot++) {
                        if (!sem_time_slots.getAvailability(day, time_slot)) {
                            semesters_time_slots.setAvailability(false, day, time_slot)
                        }
                    }
                }
            }

            setBaseResourceTimeSlots(base_time_slots)
            setSemsResourceTimeSlots(semesters_time_slots)
            setSemesterIndex("")

            instructorResources.current = instructor_resources
        } catch (err) {
            setPopupOptions({
                Heading: "Page Load Error",
                HeadingStyle: { background: POPUP_ERROR_COLOR, color: "white" },
                Message: `${err}`
            });
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {

        // TODO: fetch basic const values (data below is just temporary);

        const starting_hour = 7;
        const time_slot_per_hour = 2;
        const daily_time_slots = 24;

        const time_slot_minute_interval = 60 / time_slot_per_hour;

        setStartHour(starting_hour);
        setTimeSlotMinuteInterval(time_slot_minute_interval);
        setDailyTimeSlots(daily_time_slots);

        load_resources();

    }, [selectedInstructor]);

    return (<>

        <Loading
            IsLoading={IsLoading}
        />

        <Box
            sx={{
                display: "flex",
                flexDirection: 'column'
            }}
        >
            {/* main page heading */}

            <Box
                sx={{
                    display: "flex",
                    flexDirection: 'row',
                    borderBlockEnd: 'thin solid grey',
                    justifyContent: 'space-between',
                    padding: '0.4em',
                }}
            >
                {/* main page heading title */}

                <Box
                    sx={{
                        p: 0, m: 0, height: 'min-content',
                    }}
                >
                    <Typography variant="h5">INSTRUCTOR PREVIEW</Typography>
                </Box>

                {/* main page heading buttons */}

                <Box
                    sx={{
                        display: "flex",
                        justifyContent: 'right',
                        p: 0.15,
                        gap: 1,
                        // border: '2px solid green', // debug border
                        m: 0,
                        height: 1
                    }}
                >
                    <FormControl sx={{ minWidth: 115 }} size="small">
                        <InputLabel id="label-id-semester">Semester</InputLabel>
                        <Select autoWidth
                            labelId="label-id-semester"
                            label="Semester"
                            value={semesterIndex}
                            onChange={handleSemesterChange}
                            disabled={!Number.isInteger(selectedDepartment.DepartmentID) || mode === "edit"}
                        >
                            <MenuItem value=''>None</MenuItem>
                            <MenuItem value={0}>1st Semester</MenuItem>
                            <MenuItem value={1}>2nd Semester</MenuItem>
                            <MenuItem value={2}>Mid-year</MenuItem>
                        </Select>
                    </FormControl>

                    <Button
                        endIcon={<ExitToAppIcon />} size="small" color="error" variant="outlined"
                        onClick={() => {
                            setMode("")
                            onInstructorDataViewClose()
                        }}
                    >
                        Go Back
                    </Button>
                </Box>
            </Box>

            {/* second page heading - instructor name display */}

            <Box sx={{ p: 1, width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', borderBlockEnd: 'thin solid grey' }}>
                <Box sx={{ display: 'flex', gap: '2em', alignItems: 'baseline' }}>
                    <Typography variant="subtitle2">INSTRUCTOR'S NAME:</Typography>
                    <Typography variant="body1">{` ${selectedInstructor.FirstName} ${selectedInstructor.MiddleInitial}. ${selectedInstructor.LastName}`}</Typography>
                </Box>
            </Box>

        </Box>

        <Divider orientation="vertical" flexItem />
        <Typography align="center" sx={{ background: 'gold', color: 'black', marginBottom: '0.05em' }}>Instructor Availability Time Slot</Typography>

        <table className="time-table">
            <thead>
                <tr>
                    <th className="time-slot-header">Time Slot</th>
                    {DAYS.map((day) => (
                        <th key={day} className="day-header">{day}</th>
                    ))}
                </tr>
            </thead>
            <tbody>
                {generateTimeSlotRowLabels(startHour, timeSlotMinuteInterval, dailyTimeSlots).map((time_slot_label, time_slot_index) => (
                    <tr key={time_slot_index}>
                        <td className="time-slot">{time_slot_label}</td>
                        {DAYS.map((_, day_index) => {
                            let class_name = ""
                            let selected = ""

                            const is_available_default = baseResourceTimeSlots?.getAvailability(day_index, time_slot_index) ? true : false
                            const is_available_alloc = semsResourceTimeSlots?.getAvailability(day_index, time_slot_index) ? true : false
                            const has_assigned_subject = allocatedSubjectAssign.find(
                                (subj) => subj.DayIdx === day_index && subj.TimeSlotIdx === time_slot_index
                            );

                            if (has_assigned_subject) {
                                const subject_color_key = `${has_assigned_subject.SubjectCode}${has_assigned_subject.CourseSection}`
                                return (
                                    <td key={day_index} className={`subject-cell ${subjectColors[subject_color_key]}`} rowSpan={has_assigned_subject.SubjectTimeSlots}>
                                        <div className="subject-content">
                                            <div className="subject-time-slot-line-1">{has_assigned_subject.SubjectCode}</div>
                                            <div className="subject-time-slot-line-2">{has_assigned_subject.CourseSection}</div>
                                            <div className="subject-time-slot-line-3">{has_assigned_subject.RoomName}</div>
                                        </div>
                                    </td>
                                );
                            }

                            if (mode === "view") {
                                class_name = "empty-slot"
                            } else if (!is_available_default) {
                                class_name = "disabled-slot"
                            } else if (is_available_default && !is_available_alloc) {
                                class_name = "occupied-slot"
                            } else {
                                class_name = "available-slot"
                            }

                            if (selectedTimeSlots?.has(`${day_index}:${time_slot_index}`)) {
                                selected = "selected-time-slot-cell"
                            }

                            const is_occupied = allocatedSubjectAssign.some((subject) => {
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
                                    {(mode !== "view") ? <span className={`time-slot-cover ${selected}`}></span> : null}
                                </td>
                            )
                        })}
                    </tr>
                ))}
            </tbody>
        </table>

        <div style={{ height: '3.25em' }} />
    </>)
}
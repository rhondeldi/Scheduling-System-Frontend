// ===================== IMPORTS =====================

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

// ===================== MAIN COMPONENT =====================

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

    // ---- ASYNC LOAD STATE ----

    const [asyncAssignments, setAsyncAssignments] = useState([]);
    const [asyncPlacements, setAsyncPlacements] = useState([]);
    const [asyncOverflow, setAsyncOverflow] = useState([]);
    const [hourTotals, setHourTotals] = useState({
        SyncHours: 0,
        AsyncHours: 0,
        TotalHours: 0,
    });

    const computeAsyncPlacements = (
        asyncRecords,
        allocatedSubjects,
        availabilityBitmap,
        days,
        perDay,
    ) => {
        const occupied = Array.from({ length: days }, () =>
            Array(perDay).fill(false),
        );

        for (let d = 0; d < days; d++) {
            for (let t = 0; t < perDay; t++) {
                if (!availabilityBitmap.getAvailability(d, t)) {
                    occupied[d][t] = true;
                }
            }
        }

        const dayMinStart = Array(days).fill(0);

        for (const subj of allocatedSubjects) {
            for (let i = 0; i < subj.SubjectTimeSlots; i++) {
                const slot = subj.TimeSlotIdx + i;
                if (slot >= 0 && slot < perDay) {
                    occupied[subj.DayIdx][slot] = true;
                }
            }

            const endSlot = subj.TimeSlotIdx + subj.SubjectTimeSlots;
            if (endSlot > dayMinStart[subj.DayIdx]) {
                dayMinStart[subj.DayIdx] = endSlot;
            }
        }

        const placements = [];
        const overflow = [];

        for (const record of asyncRecords) {
            const slotsNeeded = Math.max(
                1,
                Math.round((Number(record.AsyncHours) || 0) * 2),
            );

            const subjectCode =
                (record.DisplayLabel || '')
                    .replace(/\s*\(Async\)\s*$/i, '')
                    .trim() || `S${record.SubjectID}`;

            const sectionLabel =
                record.CourseSection ||
                `Yr ${(record.YearLevelIdx ?? 0) + 1}-S${
                    (record.SectionIdx ?? 0) + 1
                }`;

            let placed = false;

            for (let d = 0; d < days && !placed; d++) {
                for (
                    let t = dayMinStart[d];
                    t <= perDay - slotsNeeded && !placed;
                    t++
                ) {
                    let canPlace = true;
                    for (let i = 0; i < slotsNeeded; i++) {
                        if (occupied[d][t + i]) {
                            canPlace = false;
                            break;
                        }
                    }
                    if (canPlace) {
                        for (let i = 0; i < slotsNeeded; i++) {
                            occupied[d][t + i] = true;
                        }
                        dayMinStart[d] = t + slotsNeeded;
                        placements.push({
                            DayIdx: d,
                            TimeSlotIdx: t,
                            SubjectTimeSlots: slotsNeeded,
                            SubjectCode: subjectCode,
                            SectionLabel: sectionLabel,
                            AsyncHours: Number(record.AsyncHours) || 0,
                            RecordKey: `${record.SectionID}-${record.SubjectID}`,
                        });
                        placed = true;
                    }
                }
            }

            if (!placed) {
                overflow.push({
                    SubjectCode: subjectCode,
                    SectionLabel: sectionLabel,
                    AsyncHours: Number(record.AsyncHours) || 0,
                    RecordKey: `${record.SectionID}-${record.SubjectID}`,
                    SlotsNeeded: slotsNeeded,
                });
            }
        }

        return { placements, overflow };
    };

    // ---- SELECTED TIME SLOT CELL ----

    const [selectedTimeSlots, setSelectedTimeSlots] = useState(new Set())

    // ---- LOAD GUARD COMPONENT STATES ----

    const [IsLoading, setIsLoading] = useState(false);

    // ---- TIME TABLE GRID STATES ----

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

            const semesters_async_assign =
                instructorResources.current.semesters_async_assign || [];
            const semesters_hour_totals =
                instructorResources.current.semesters_hour_totals || [];

            const asyncRecords = semesters_async_assign[semester_idx] || [];
            setAsyncAssignments(asyncRecords);
            setHourTotals(
                semesters_hour_totals[semester_idx] || {
                    SyncHours: 0,
                    AsyncHours: 0,
                    TotalHours: 0,
                },
            );

            const semAvailabilityRaw =
                instructorResources.current.semesters_time_slots?.[semester_idx];

            const semAvailability = semAvailabilityRaw
                ? new InstructorTimeSlotBitMap(semAvailabilityRaw)
                : new InstructorTimeSlotBitMap();

            const allocatedSubjects =
                instructorResources.current.semesters_sub_assign[semester_idx] || [];

            const { placements, overflow } = computeAsyncPlacements(
                asyncRecords,
                allocatedSubjects,
                semAvailability,
                DAYS.length,
                dailyTimeSlots,
            );

            setAsyncPlacements(placements);
            setAsyncOverflow(overflow);

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
            setAsyncAssignments([])
            setAsyncPlacements([])
            setAsyncOverflow([])
            setHourTotals({ SyncHours: 0, AsyncHours: 0, TotalHours: 0 })
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

    // ---- HANDLERS ----

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

    // ---- EFFECTS ----

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

        {/* ===================== HEADING ===================== */}

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

        {/* ===================== TIMETABLE ===================== */}

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

                            const has_async_placement = asyncPlacements.find(
                                (p) => p.DayIdx === day_index && p.TimeSlotIdx === time_slot_index,
                            );

                            if (has_async_placement) {
                                return (
                                    <td
                                        key={day_index}
                                        className="subject-cell"
                                        rowSpan={has_async_placement.SubjectTimeSlots}
                                        style={{
                                            background: 'linear-gradient(to bottom right, #fff7d6, #ffe9a3)',
                                            color: '#5a4400',
                                            boxShadow: 'inset 0 0 0 0.1em #c8b04a',
                                        }}
                                    >
                                        <div className="subject-content">
                                            <div className="subject-time-slot-line-1">
                                                *{has_async_placement.SubjectCode}
                                            </div>
                                            <div className="subject-time-slot-line-2">
                                                {has_async_placement.SectionLabel}
                                            </div>
                                            <div className="subject-time-slot-line-3">Async</div>
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

                            const is_async_occupied = asyncPlacements.some((p) => {
                                const in_row =
                                    time_slot_index >= p.TimeSlotIdx &&
                                    time_slot_index < p.TimeSlotIdx + p.SubjectTimeSlots;
                                const in_col = day_index === p.DayIdx;
                                return in_row && in_col;
                            });

                            if (is_occupied || is_async_occupied) {
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

        {Number.isInteger(Number.parseInt(semesterIndex, 10)) ? (
            <Box
                sx={{
                    paddingInline: 2,
                    paddingBlock: 1.5,
                    marginTop: 1,
                    borderTop: 'thin solid #ccc',
                }}
            >
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                    Asynchronous Load
                </Typography>

                <Typography
                    variant="caption"
                    fontStyle="italic"
                    color="text.secondary"
                    gutterBottom
                    display="block"
                >
                    * cells above are asynchronous classes placed on the timetable
                    for display only — they do not affect the actual schedule.
                </Typography>

                {asyncOverflow.length > 0 ? (
                    <Box
                        sx={{
                            marginBottom: 1,
                            padding: 1,
                            background: '#fff4f4',
                            border: 'thin solid #d99',
                            borderRadius: 1,
                        }}
                    >
                        <Typography variant="body2" fontWeight="bold" color="error.main">
                            Could not place on timetable (no free contiguous slot):
                        </Typography>
                        {asyncOverflow.map((o) => (
                            <Typography
                                key={o.RecordKey}
                                variant="caption"
                                display="block"
                            >
                                *{o.SubjectCode} — {o.SectionLabel} —{' '}
                                {Number(o.AsyncHours).toFixed(2)} hr
                            </Typography>
                        ))}
                    </Box>
                ) : null}

                <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', marginBottom: 1 }}>
                    <Typography variant="body2">
                        <strong>Sync Hours:</strong>{' '}
                        {Number(hourTotals.SyncHours || 0).toFixed(2)}
                    </Typography>
                    <Typography variant="body2">
                        <strong>Async Hours:</strong>{' '}
                        {Number(hourTotals.AsyncHours || 0).toFixed(2)}
                    </Typography>
                    <Typography variant="body2">
                        <strong>Total Hours:</strong>{' '}
                        {Number(hourTotals.TotalHours || 0).toFixed(2)}
                    </Typography>
                </Box>

                {asyncAssignments.length === 0 ? (
                    <Typography
                        variant="body2"
                        fontStyle="italic"
                        color="text.secondary"
                    >
                        No asynchronous assignments for this semester.
                    </Typography>
                ) : (
                    <table className="time-table" style={{ width: '100%', marginTop: 4 }}>
                        <thead>
                            <tr>
                                <th className="day-header">Subject / Section</th>
                                <th className="day-header">Async Hours</th>
                            </tr>
                        </thead>
                        <tbody>
                            {asyncAssignments.map((record, idx) => (
                                <tr key={`${record.SectionID}-${record.SubjectID}-${idx}`}>
                                    <td className="time-slot">
                                        *{record.DisplayLabel ||
                                            `Subject ${record.SubjectID} - ${record.SectionID}`}
                                        {record.CourseSection
                                            ? ` — ${record.CourseSection}`
                                            : ''}
                                    </td>
                                    <td className="time-slot">
                                        {Number(record.AsyncHours || 0).toFixed(2)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </Box>
        ) : null}

        <div style={{ height: '3.25em' }} />
    </>)
}
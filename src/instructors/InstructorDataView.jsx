// ===================== IMPORTS =====================
import { useState, useEffect, useRef } from "react";

import IconButton from "@mui/material/IconButton";
import Button from "@mui/material/Button";
import DoneIcon from "@mui/icons-material/Done";
import CancelIcon from "@mui/icons-material/Cancel";
import ClearAllIcon from "@mui/icons-material/ClearAll";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import EditIcon from "@mui/icons-material/Edit";
import AddIcon from "@mui/icons-material/Add";
import ExitToAppIcon from "@mui/icons-material/ExitToApp";
import Tooltip from "@mui/material/Tooltip";

import { InstructorTimeSlotBitMap } from "../js/instructor-time-slot-bit-map";

import { useReactToPrint } from "react-to-print";
import PrintIcon from "@mui/icons-material/Print";

import {
  Box,
  Typography,
  TextField,
  FormControl,
  InputAdornment,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from "@mui/material";
import { generateTimeSlotRowLabels } from "../js/week-time-table-grid-functions";
import {
  ContextMenu,
  ContextMenuItem,
  Position,
  useContextMenuState,
} from "../components/ContextMenu";

import { patchUpdateInsturctor, postCreateInsturctor } from "../js/instructors";
import { fetchInstructorResources } from "../js/instructors_v2";

import {
  Loading,
  POPUP_ERROR_COLOR,
  POPUP_SUCCESS_COLOR,
  POPUP_WARNING_COLOR,
} from "../components/Loading";

import "../assets/SubjectColors.css";
import { PrintHeader } from "../components/PrintHeader";

// ===================== CONSTANTS =====================
const SEMESTER_NAMES = ["1st Semester", "2nd Semester", "Mid-year"];

// ===================== HELPERS =====================
function get_total_contact_hours(subjects) {
  let total_contact_hours = 0;
  if (Array.isArray(subjects) && Number.isInteger(subjects?.SubjectTimeSlots)) {
    for (let i = 0; i < subjects.length; i++) {
      total_contact_hours += subjects.SubjectTimeSlots;
    }
  }

  return total_contact_hours;
}

function to_title_case(str = "") {
  return str.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
}

// ===================== MAIN COMPONENT =====================
export default function InstructorDataView({
  selectedDepartment,
  selectedInstructor,
  setSelectedInstructor,
  mode,
  setMode,
  onInstructorDataViewClose,
  reloadInstructorsTable,
  departments,
  popupOptions,
  setPopupOptions,
  autoOpenPrintDialog = false,
  onAutoOpenPrintDialogHandled = () => {},
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

  // ---- SELECTED TIME SLOT CELL ----

  const [selectedTimeSlots, setSelectedTimeSlots] = useState(new Set());

  // ---- LOAD GUARD COMPONENT STATES ----

  const [IsLoading, setIsLoading] = useState(false);
  const [firstName, setFirstName] = useState(selectedInstructor?.FirstName ?? "");
  const [middleInitial, setMiddleInitial] = useState(
    selectedInstructor?.MiddleInitial ?? "",
  );
  const [lastName, setLastName] = useState(selectedInstructor?.LastName ?? "");

  const sanitizeNameValue = (value = "") => {
    return value
      .toUpperCase()
      .replace(/[^A-Z\s\-']/g, "")
      .replace(/^\s+/, "");
  };

  const sanitizeMiddleInitialValue = (value = "") => {
    return value.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 1);
  };

  const handleNameKeyDown = (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if ([
      "Backspace",
      "Delete",
      "Tab",
      "Enter",
      "ArrowLeft",
      "ArrowRight",
      "ArrowUp",
      "ArrowDown",
      "Home",
      "End",
    ].includes(e.key)) {
      return;
    }

    if (!/^[a-zA-Z\s\-']$/.test(e.key)) {
      e.preventDefault();
    }
  };

  const handleMiddleInitialKeyDown = (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if ([
      "Backspace",
      "Delete",
      "Tab",
      "Enter",
      "ArrowLeft",
      "ArrowRight",
      "ArrowUp",
      "ArrowDown",
      "Home",
      "End",
    ].includes(e.key)) {
      return;
    }

    if (!/^[a-zA-Z]$/.test(e.key)) {
      e.preventDefault();
    }
  };

  const updateInstructorField = (field, value) => {
    if (!selectedInstructor) return;
    setSelectedInstructor({ ...selectedInstructor, [field]: value });
  };

  useEffect(() => {
    setFirstName(selectedInstructor?.FirstName ?? "");
    setMiddleInitial(selectedInstructor?.MiddleInitial ?? "");
    setLastName(selectedInstructor?.LastName ?? "");
  }, [selectedInstructor]);

  // ---- TIME TABLE GRID STATES ----

  const [semesterIndex, setSemesterIndex] = useState("");

  const handleSemesterChange = (e) => {
    setSemesterIndex(e.target.value);

    const semester_idx = Number.parseInt(e.target.value, 10);

    if (Number.isInteger(semester_idx)) {
      setAllocatedSubjectAssign(
        instructorResources.current.semesters_sub_assign[semester_idx],
      );

      const subject_colors = [];
      let subject_count = 0;

      instructorResources.current.semesters_sub_assign[semester_idx].forEach(
        (subject) => {
          if (
            !subject_colors[`${subject.SubjectCode}${subject.CourseSection}`]
          ) {
            subject_count++;
            subject_colors[`${subject.SubjectCode}${subject.CourseSection}`] =
              `color-${subject_count}`;
          }
        },
      );

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
    } else {
      setAllocatedSubjectAssign([]);
      setSubjectColors([]);
      setAsyncAssignments([]);
      setAsyncPlacements([]);
      setAsyncOverflow([]);
      setHourTotals({ SyncHours: 0, AsyncHours: 0, TotalHours: 0 });
    }
  };

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

    // earliest slot per day where async may start: end of the last sync subject of that day.
    // days with no sync subject default to 0 (async may take the day entirely).
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

      const subjectCode = (record.DisplayLabel || "")
        .replace(/\s*\(Async\)\s*$/i, "")
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

  const DAYS = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  const [startHour, setStartHour] = useState(7);
  const [timeSlotMinuteInterval, setTimeSlotMinuteInterval] = useState(30);
  const [dailyTimeSlots, setDailyTimeSlots] = useState(24);

  const [isDragSelect, setIsDragSelect] = useState(false);
  const [instructorBackup, setInstructorBackup] = useState();

  const instructorResources = useRef(null);
  const [baseResourceTimeSlots, setBaseResourceTimeSlots] = useState(
    new InstructorTimeSlotBitMap(),
  );
  const [semsResourceTimeSlots, setSemsResourceTimeSlots] = useState(
    new InstructorTimeSlotBitMap(),
  );
  const [allocatedSubjectAssign, setAllocatedSubjectAssign] = useState([]);

  const backupBaseResourceTimeSlots = useRef(null);
  const backupSemsResourceTimeSlots = useRef(null);

  const load_resources = async () => {
    try {
      if (mode == "new") {
        setBaseResourceTimeSlots(new InstructorTimeSlotBitMap());
        setSemsResourceTimeSlots(new InstructorTimeSlotBitMap());
        setSemesterIndex("");

        instructorResources.current = {
          base_time_slots: ["0", "0", "0"],
        };

        return;
      }

      setIsLoading(true);

      const instructor_resources = await fetchInstructorResources(
        selectedInstructor.InstructorID,
      );

      const base_time_slots = new InstructorTimeSlotBitMap(
        instructor_resources.base_time_slots,
      );
      const semesters_time_slots = new InstructorTimeSlotBitMap(
        instructor_resources.base_time_slots,
      );

      for (
        let i = 0;
        i < instructor_resources.semesters_time_slots.length;
        i++
      ) {
        const sem_time_slots = new InstructorTimeSlotBitMap(
          instructor_resources.semesters_time_slots[i],
        );

        for (let day = 0; day < DAYS.length; day++) {
          for (let time_slot = 0; time_slot < dailyTimeSlots; time_slot++) {
            if (!sem_time_slots.getAvailability(day, time_slot)) {
              semesters_time_slots.setAvailability(false, day, time_slot);
            }
          }
        }
      }

      setBaseResourceTimeSlots(base_time_slots);
      setSemsResourceTimeSlots(semesters_time_slots);
      setSemesterIndex("");

      instructorResources.current = instructor_resources;
    } catch (err) {
      setPopupOptions({
        Heading: "Page Load Error",
        HeadingStyle: { background: POPUP_ERROR_COLOR, color: "white" },
        Message: `${err}`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const starting_hour = 7;
    const time_slot_per_hour = 2;
    const daily_time_slots = 24;

    const time_slot_minute_interval = 60 / time_slot_per_hour;

    setStartHour(starting_hour);
    setTimeSlotMinuteInterval(time_slot_minute_interval);
    setDailyTimeSlots(daily_time_slots);

    setInstructorBackup(structuredClone(selectedInstructor));

    load_resources();
  }, [selectedInstructor]);

  // ---- CONTEXT MENU HANDLERS ----

  const contextMenuState = useContextMenuState();

  const handleContextMenuEnable = () => {
    let is_all_enabled = true;
    let has_impossible_error = false;
    let enabled_time_slots = 0;

    for (const value of selectedTimeSlots) {
      let [day, time_slot] = value.split(":");

      day = Number(day);
      time_slot = Number(time_slot);

      const is_default_available = baseResourceTimeSlots?.getAvailability(
        day,
        time_slot,
      );
      const is_allocated_available = semsResourceTimeSlots?.getAvailability(
        day,
        time_slot,
      );

      if (!is_default_available && !is_allocated_available) {
        enabled_time_slots++;
      } else if (!is_default_available && is_allocated_available) {
        has_impossible_error = true;
      } else {
        is_all_enabled = false;
      }
    }

    if (has_impossible_error) {
      setPopupOptions({
        Heading: "That should not happen!",
        HeadingStyle: { background: POPUP_ERROR_COLOR, color: "white" },
        Message:
          "we detected an instructor default time slot that is not available yet the corresponding allocation time slot is available",
      });

      return;
    } else if (enabled_time_slots === 0) {
      setPopupOptions({
        Heading: "No Action",
        HeadingStyle: { background: POPUP_WARNING_COLOR, color: "white" },
        Message:
          "all selected time slots are either enabled or already occupied so no need to enable again",
      });
    } else if (!is_all_enabled) {
      setPopupOptions({
        Heading: "Partially Successful",
        HeadingStyle: { background: POPUP_WARNING_COLOR, color: "white" },
        Message: `some selected time slots (${selectedTimeSlots.size - enabled_time_slots}/${selectedTimeSlots.size}) are already enabled and/or occupied so no need to enabled again`,
      });
    } else {
      setPopupOptions({
        Heading: "Fully Successful",
        HeadingStyle: { background: POPUP_SUCCESS_COLOR, color: "white" },
        Message: "all selected time slots are enabled",
      });
    }

    for (const value of selectedTimeSlots) {
      let [day, time_slot] = value.split(":");

      day = Number(day);
      time_slot = Number(time_slot);

      const is_default_available = baseResourceTimeSlots?.getAvailability(
        day,
        time_slot,
      );
      const is_allocated_available = semsResourceTimeSlots?.getAvailability(
        day,
        time_slot,
      );

      if (!is_default_available && !is_allocated_available) {
        baseResourceTimeSlots?.setAvailability(true, day, time_slot);
        semsResourceTimeSlots?.setAvailability(true, day, time_slot);
      }
    }

    setSelectedTimeSlots(new Set());
  };

  const handleContextMenuDisable = () => {
    let is_all_disabled = true;
    let has_impossible_error = false;
    let disabled_time_slots = 0;

    for (const value of selectedTimeSlots) {
      let [day, time_slot] = value.split(":");

      day = Number(day);
      time_slot = Number(time_slot);

      const is_default_available = baseResourceTimeSlots?.getAvailability(
        day,
        time_slot,
      );
      const is_allocated_available = semsResourceTimeSlots?.getAvailability(
        day,
        time_slot,
      );

      if (is_default_available && is_allocated_available) {
        disabled_time_slots++;
      } else if (!is_default_available && is_allocated_available) {
        has_impossible_error = true;
      } else {
        is_all_disabled = false;
      }
    }

    if (has_impossible_error) {
      setPopupOptions({
        Heading: "That should not happen!",
        HeadingStyle: { background: POPUP_ERROR_COLOR, color: "white" },
        Message:
          "we detected an instructor default time slot that is not available yet the corresponding allocation time slot is available",
      });

      return;
    } else if (disabled_time_slots === 0) {
      setPopupOptions({
        Heading: "No Action",
        HeadingStyle: { background: POPUP_WARNING_COLOR, color: "white" },
        Message:
          "all selected time slots are either disabled or already occupied so no need to disable again",
      });
    } else if (!is_all_disabled) {
      setPopupOptions({
        Heading: "Partially Successful",
        HeadingStyle: { background: POPUP_WARNING_COLOR, color: "white" },
        Message: `some selected time slots (${selectedTimeSlots.size - disabled_time_slots}/${selectedTimeSlots.size}) are already disabled or occupied so no need to disable again`,
      });
    } else {
      setPopupOptions({
        Heading: "Fully Successful",
        HeadingStyle: { background: POPUP_SUCCESS_COLOR, color: "white" },
        Message: "all selected time slots are disabled",
      });
    }

    for (const value of selectedTimeSlots) {
      let [day, time_slot] = value.split(":");

      day = Number(day);
      time_slot = Number(time_slot);

      const is_default_available = baseResourceTimeSlots?.getAvailability(
        day,
        time_slot,
      );
      const is_allocated_available = semsResourceTimeSlots?.getAvailability(
        day,
        time_slot,
      );

      if (is_default_available && is_allocated_available) {
        baseResourceTimeSlots?.setAvailability(false, day, time_slot);
        semsResourceTimeSlots?.setAvailability(false, day, time_slot);
      }
    }

    setSelectedTimeSlots(new Set());
  };

  // ---- TIME SLOT SELECTION BUTTON HANDLERS ----

  const handleEditOrNewAction = async () => {
    try {
      let new_default_time = [];

      for (let i = 0; i < baseResourceTimeSlots.bitset.length; i++) {
        new_default_time.push(`${baseResourceTimeSlots.bitset[i]}`);
      }

      const updated_instructor_time_str = {
        InstructorID: selectedInstructor.InstructorID,
        DepartmentID: selectedInstructor.DepartmentID,
        FirstName: selectedInstructor.FirstName,
        MiddleInitial: selectedInstructor.MiddleInitial,
        LastName: selectedInstructor.LastName,
        Time: new_default_time,
      };

      setIsLoading(true);

      if (mode === "edit") {
        await patchUpdateInsturctor(updated_instructor_time_str);

        setPopupOptions({
          Heading: "Edit Successful",
          HeadingStyle: { background: POPUP_SUCCESS_COLOR, color: "white" },
          Message: "changes to the instructor data are saved",
        });

        reloadInstructorsTable();
      } else if (mode === "new") {
        await postCreateInsturctor(updated_instructor_time_str);

        setPopupOptions({
          Heading: "Add Successful",
          HeadingStyle: { background: POPUP_SUCCESS_COLOR, color: "white" },
          Message: "A NEW INSTRUCTOR HAS BEEN ADDED",
        });

        reloadInstructorsTable();
      } else {
        throw new Error("there was a problem in the v2 instructor page");
      }

      setIsLoading(false);
    } catch (err) {
      setPopupOptions({
        Heading: "Instructor Update Failed",
        HeadingStyle: { background: POPUP_ERROR_COLOR, color: "white" },
        Message: `${err}`,
      });
      setIsLoading(false);
    }
  };

  // ---- PRINTING STATES, REFS AND HANDLERS ----

  const [isPrinting, setIsPrinting] = useState(false);
  const [isBlackAndWhite, setIsBlackAndWhite] = useState(false);
  const contentRef = useRef(null);

  const promiseResolveRef = useRef(null);

  useEffect(() => {
    if (isPrinting && promiseResolveRef.current) {
      promiseResolveRef.current();
    }
  }, [isPrinting]);

  const reactToPrintFn = useReactToPrint({
    contentRef,
    documentTitle: `${selectedInstructor.FirstName} ${selectedInstructor.MiddleInitial} ${selectedInstructor.LastName} - ${SEMESTER_NAMES[semesterIndex]} ${new Date().getFullYear()}`,
    onBeforePrint: () => {
      saveAddedOptionalPrintingValues();
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
    documentTitle: `${selectedInstructor.FirstName} ${selectedInstructor.MiddleInitial} ${selectedInstructor.LastName} - ${SEMESTER_NAMES[semesterIndex]} ${new Date().getFullYear()}`,
    onBeforePrint: () => {
      saveAddedOptionalPrintingValues();
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

  const [academicYear, setAcademicYear] = useState("");
  const [highestEducationalAttainment, setHighestEducationalAttainment] =
    useState("");
  const [numbersOfPreperation, setNumbersOfPreperation] = useState("");

  const [consultation, setConsultation] = useState("");
  const [designation, setDesignation] = useState("");
  const [research, setResearch] = useState("");
  const [extension, setExtension] = useState("");

  const [signatoryConforme, setSignatoryConforme] = useState("");
  const [positionConforme, setPositionConforme] = useState("");

  const [signatoryRecommendingApproval, setSignatoryRecommendingApproval] =
    useState("");
  const [positionRecommendingApproval, setPositionRecommendingApproval] =
    useState("");

  const [signatoryReviewedBy, setSignatoryReviewedBy] = useState("");
  const [positionReviewedBy, setPositionReviewedBy] = useState("");

  const [signatoryApproved, setSignatoryApproved] = useState("");
  const [positionApproved, setPositionApproved] = useState("");

  const [isPrintDialogShow, setIsPrintDialogShow] = useState(false);

  const handleOpenSignatoriesDialog = () => {
    const academic_year = localStorage.getItem("academic-year");

    const position_conforme = localStorage.getItem("position-conforme");

    const signatory_recommending_approval = localStorage.getItem(
      "signatory-recommending-approval",
    );
    const position_recommending_approval = localStorage.getItem(
      "position-recommending-approval",
    );

    const signatory_reviewed_by = localStorage.getItem("signatory-reviewed-by");
    const position_reviewed_by = localStorage.getItem("position-reviewed-by");

    const signatory_approved = localStorage.getItem("signatory-approved");
    const position_approved = localStorage.getItem("position-approved");

    setAcademicYear(academic_year);

    setSignatoryConforme(
      to_title_case(
        `${selectedInstructor.FirstName} ${selectedInstructor.MiddleInitial}. ${selectedInstructor.LastName}`,
      ),
    );
    setPositionConforme(position_conforme);

    setSignatoryRecommendingApproval(signatory_recommending_approval);
    setPositionRecommendingApproval(position_recommending_approval);

    setSignatoryReviewedBy(signatory_reviewed_by);
    setPositionReviewedBy(position_reviewed_by);

    setSignatoryApproved(signatory_approved);
    setPositionApproved(position_approved);

    setIsPrintDialogShow(true);
  };

  useEffect(() => {
    if (
      !autoOpenPrintDialog ||
      mode !== "view" ||
      !Number.isInteger(Number.parseInt(semesterIndex, 10))
    ) {
      return;
    }

    handleOpenSignatoriesDialog();
    onAutoOpenPrintDialogHandled();
  }, [autoOpenPrintDialog, mode, semesterIndex]);

  const saveAddedOptionalPrintingValues = () => {
    localStorage.setItem("academic-year", academicYear);

    localStorage.setItem("position-conforme", positionConforme);

    localStorage.setItem(
      "signatory-recommending-approval",
      signatoryRecommendingApproval,
    );
    localStorage.setItem(
      "position-recommending-approval",
      positionRecommendingApproval,
    );

    localStorage.setItem("signatory-reviewed-by", signatoryReviewedBy);
    localStorage.setItem("position-reviewed-by", positionReviewedBy);

    localStorage.setItem("signatory-approved", signatoryApproved);
    localStorage.setItem("position-approved", positionApproved);
  };

  return (
    <>
      {/* ===================== CONTEXT MENU ===================== */}
      <ContextMenu closeAfterClick={true} conextMenuState={contextMenuState}>
        <ContextMenuItem onClick={handleContextMenuEnable}>
          Enable
        </ContextMenuItem>
        <ContextMenuItem onClick={handleContextMenuDisable}>
          Disable
        </ContextMenuItem>
      </ContextMenu>

      <Loading IsLoading={IsLoading} />

      {/* ===================== HEADING ===================== */}
      <Box
        sx={{
          display: "flex",
          // border: '6px solid yellow', // debug border
          flexDirection: "column",
        }}
      >
        {/* main page heading */}

        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
            borderBlockEnd: "thin solid grey",
            justifyContent: "space-between",
            padding: "0.4em",
          }}
        >
          {/* main page heading title */}

          <Box
            sx={{
              p: 0,
              m: 0,
              height: "min-content",
            }}
          >
            <Typography variant="h5">
              {mode === "view" ? (
                "INSTRUCTOR PREVIEW"
              ) : mode === "edit" ? (
                "EDIT INSTRUCTOR"
              ) : mode === "new" ? (
                "ADD NEW INSTRUCTOR"
              ) : (
                <p>green btn error: unknown mode</p>
              )}
            </Typography>
          </Box>

          {/* main page heading buttons */}

          <Box
            sx={{
              display: "flex",
              justifyContent: "right",
              p: 0.15,
              gap: 1,
              m: 0,
              height: 1,
            }}
          >
            {mode !== "new" ? (
              <FormControl sx={{ minWidth: 115 }} size="small">
                <InputLabel id="label-id-semester">Semester</InputLabel>
                <Select
                  autoWidth
                  labelId="label-id-semester"
                  label="Semester"
                  value={semesterIndex}
                  onChange={handleSemesterChange}
                  disabled={
                    !Number.isInteger(selectedDepartment.DepartmentID) ||
                    mode === "edit"
                  }
                >
                  <MenuItem value="">None</MenuItem>
                  <MenuItem value={0}>1st Semester</MenuItem>
                  <MenuItem value={1}>2nd Semester</MenuItem>
                  <MenuItem value={2}>Mid-year</MenuItem>
                </Select>
              </FormControl>
            ) : null}
            {mode === "view" ? (
            <Box sx={{ display: "flex", gap: .5 }}>

            <Tooltip
            title={
            semesterIndex === ""
            ? "Select a semester first"
            : "Print Schedule"
            }
            >
            <span>
            <IconButton
            color="view"
            variant="outlined"
            disabled={semesterIndex === ""}
            onClick={handleOpenSignatoriesDialog}
            sx={{
            borderRadius: 5,
            width: 38,
            height: 38,
            }}
            >
            <PrintIcon />
            </IconButton>
            </span>
            </Tooltip>

            <Tooltip title="Public View">
            <IconButton
            color="view"
            onClick={() =>
            window.open(
            "/view_instructors/",
            "_blank"
            )}
            sx={{
            borderRadius: 5,
            width: 38,
            height: 38,
            }}
            >
            <OpenInNewIcon />
            </IconButton>
            </Tooltip>

            <Tooltip title="Edit">
            <IconButton
            color="edit"
            onClick={() => {
            setMode("edit");
            

            setInstructorBackup(
            structuredClone(
            selectedInstructor
            )
            );

            backupBaseResourceTimeSlots.current =
            new InstructorTimeSlotBitMap(
            baseResourceTimeSlots.bitset
            );

            backupSemsResourceTimeSlots.current =
            new InstructorTimeSlotBitMap(
            semsResourceTimeSlots.bitset
            );
            }}
            sx={{
            borderRadius: 5,
            width: 38,
            height: 38,
            }}
            >
            <EditIcon />
            </IconButton>
            </Tooltip>

            <Tooltip title="Go Back">
            <IconButton
            color="delete"
            onClick={() => {
            setMode("");
            onInstructorDataViewClose();
            }}
            sx={{
            borderRadius: 5,
            width: 38,
            height: 38,
            }}
            >
            <ExitToAppIcon />
            </IconButton>
            </Tooltip>

            </Box>
          
            ) : mode === "edit" ? (
                <>
                <Button
                    endIcon={<DoneIcon />}
                    size="small"
                    color="success"
                    variant="contained"
                    onClick={() => {
                    handleEditOrNewAction();
                    setMode("view");
                    }}
                >
                    Save Changes
                </Button>
            
                <Button
                    endIcon={<CancelIcon />}
                    size="small"
                    color="error"
                    variant="outlined"
                    onClick={() => {
                    setMode("view");
            
                    selectedInstructor.InstructorID =
                        instructorBackup.InstructorID;
                    selectedInstructor.DepartmentID =
                        instructorBackup.DepartmentID;
                    selectedInstructor.FirstName =
                        instructorBackup.FirstName;
                    selectedInstructor.MiddleInitial =
                        instructorBackup.MiddleInitial;
                    selectedInstructor.LastName =
                        instructorBackup.LastName;
            
                    setBaseResourceTimeSlots(
                        backupBaseResourceTimeSlots.current
                    );
                    setSemsResourceTimeSlots(
                        backupSemsResourceTimeSlots.current
                    );
            
                    setSelectedTimeSlots(new Set());
                    }}
                >
                    Cancel
                </Button>
                </>
            ) : mode === "new" ? (
                <>
                  <Button
                    endIcon={<AddIcon />}
                    size="small"
                    color="success"
                    variant="contained"
                    onClick={() => {
                      handleEditOrNewAction();
                      setMode("");
                    }}
                  >
                    Save New Instructor
                  </Button>
              
                  <Button
                    endIcon={<CancelIcon />}
                    size="small"
                    color="error"
                    variant="outlined"
                    onClick={() => {
                      setMode("");
                      onInstructorDataViewClose();
                    }}
                  >
                    Cancel
                  </Button>
                </>
              ) : (
              <p>red btn error: unknown mode</p>
            )}
          </Box>
        </Box>

        {/* ===================== NAME BAR ===================== */}
        {/* second page heading - instructor name display */}

        <Box
          sx={{
            p: 1,
            width: "100%",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderBlockEnd: "thin solid grey",
          }}
        >
          <Box
            sx={{
              display: "flex",
              flexDirection: "row",
              gap: "2em",
              alignItems: "baseline",
            }}
          >
            {mode === "view" ? (
              <>
                <Typography variant="subtitle2">INSTRUCTOR'S NAME:</Typography>
                <Typography variant="body1">{` ${selectedInstructor.FirstName} ${selectedInstructor.MiddleInitial}. ${selectedInstructor.LastName}`}</Typography>
              </>
            ) : mode === "edit" ? (
              // instructor name display

              <>
                <TextField
                  variant="outlined"
                  size="small"
                  label="First Name"
                  value={firstName}
                  helperText="Letters, spaces, hyphens, apostrophes only"
                  inputProps={{
                    style: { textTransform: "uppercase" },
                  }}
                  onChange={(e) => {
                    const sanitized = sanitizeNameValue(e.target.value);
                    setFirstName(sanitized);
                    updateInstructorField("FirstName", sanitized);
                  }}
                  onPaste={(e) => {
                    e.preventDefault();
                    const pasted = e.clipboardData.getData("text");
                    const sanitized = sanitizeNameValue(pasted);
                    setFirstName(sanitized);
                    updateInstructorField("FirstName", sanitized);
                  }}
                  onKeyDown={handleNameKeyDown}
                />
                <TextField
                  variant="outlined"
                  size="small"
                  label="M.I."
                  value={middleInitial}
                  helperText="Single initial only"
                  inputProps={{ maxLength: 1 }}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">.</InputAdornment>
                    ),
                  }}
                  onChange={(e) => {
                    const sanitized = sanitizeMiddleInitialValue(e.target.value);
                    setMiddleInitial(sanitized);
                    updateInstructorField("MiddleInitial", sanitized);
                  }}
                  onPaste={(e) => {
                    e.preventDefault();
                    const pasted = e.clipboardData.getData("text");
                    const sanitized = sanitizeMiddleInitialValue(pasted);
                    setMiddleInitial(sanitized);
                    updateInstructorField("MiddleInitial", sanitized);
                  }}
                  onKeyDown={handleMiddleInitialKeyDown}
                />
                <TextField
                  variant="outlined"
                  size="small"
                  label="Last Name"
                  value={lastName}
                  helperText="Letters, spaces, hyphens, apostrophes only"
                  inputProps={{
                    style: { textTransform: "uppercase" },
                  }}
                  onChange={(e) => {
                    const sanitized = sanitizeNameValue(e.target.value);
                    setLastName(sanitized);
                    updateInstructorField("LastName", sanitized);
                  }}
                  onPaste={(e) => {
                    e.preventDefault();
                    const pasted = e.clipboardData.getData("text");
                    const sanitized = sanitizeNameValue(pasted);
                    setLastName(sanitized);
                    updateInstructorField("LastName", sanitized);
                  }}
                  onKeyDown={handleNameKeyDown}
                />
              </>
            ) : mode === "new" ? (
              <>  
                <TextField
                  variant="outlined"
                  size="small"
                  label="First Name"
                  value={firstName}
                  helperText="Letters, spaces, hyphens, apostrophes only"
                  inputProps={{
                    style: { textTransform: "uppercase" },
                  }}
                  onChange={(e) => {
                    const sanitized = sanitizeNameValue(e.target.value);
                    setFirstName(sanitized);
                    updateInstructorField("FirstName", sanitized);
                  }}
                  onPaste={(e) => {
                    e.preventDefault();
                    const pasted = e.clipboardData.getData("text");
                    const sanitized = sanitizeNameValue(pasted);
                    setFirstName(sanitized);
                    updateInstructorField("FirstName", sanitized);
                  }}
                  onKeyDown={handleNameKeyDown}
                />
                <TextField
                  variant="outlined"
                  size="small"
                  label="M.I."
                  value={middleInitial}
                  helperText="Single initial only"
                  inputProps={{ maxLength: 1 }}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">.</InputAdornment>
                    ),
                  }}
                  onChange={(e) => {
                    const sanitized = sanitizeMiddleInitialValue(e.target.value);
                    setMiddleInitial(sanitized);
                    updateInstructorField("MiddleInitial", sanitized);
                  }}
                  onPaste={(e) => {
                    e.preventDefault();
                    const pasted = e.clipboardData.getData("text");
                    const sanitized = sanitizeMiddleInitialValue(pasted);
                    setMiddleInitial(sanitized);
                    updateInstructorField("MiddleInitial", sanitized);
                  }}
                  onKeyDown={handleMiddleInitialKeyDown}
                />
                <TextField
                  variant="outlined"
                  size="small"
                  label="Last Name"
                  value={lastName}
                  helperText="Letters, spaces, hyphens, apostrophes only"
                  inputProps={{
                    style: { textTransform: "uppercase" },
                  }}
                  onChange={(e) => {
                    const sanitized = sanitizeNameValue(e.target.value);
                    setLastName(sanitized);
                    updateInstructorField("LastName", sanitized);
                  }}
                  onPaste={(e) => {
                    e.preventDefault();
                    const pasted = e.clipboardData.getData("text");
                    const sanitized = sanitizeNameValue(pasted);
                    setLastName(sanitized);
                    updateInstructorField("LastName", sanitized);
                  }}
                  onKeyDown={handleNameKeyDown}
                />
              </>
            ) : (
              <p>green btn error: unknown mode</p>
            )}
          </Box>

          {mode === "edit" && departments.length > 1 ? (
            <Box maxWidth={200}>
              <FormControl size="small" fullWidth>
                <InputLabel id="label-id-edit-department">
                  Move to Department
                </InputLabel>
                <Select
                  id="id-edit-department"
                  labelId="label-id-edit-department"
                  label="Move to Department"
                  defaultValue={selectedInstructor?.DepartmentID}
                  onChange={(e) => {
                    updateInstructorField("DepartmentID", Number(e.target.value));
                  }}
                >
                  {departments
                    ? departments.map((department, index) => {
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
            </Box>
          ) : (
            <Typography align="right" variant="body1" fontStyle={"italic"}>
              {departments.find(
                (dept) => dept.DepartmentID === selectedInstructor?.DepartmentID,
              )?.Name || "Department not found"}
            </Typography>
          )}
        </Box>
      </Box>

      {/* ===================== INSTRUCTOR AVAILABILITY TIME SLOTS ===================== */}
      {mode === "edit" || mode === "new" ? (
        <Typography
          align="center"
          sx={{ background: "gold", color: "black", marginBottom: "0.05em" }}
        >
          Instructor Availability Time Slot
        </Typography>
      ) : null}

      <Box
        style={{
          width: "100%",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          paddingInline: "1em",
          // border: '4px solid red',  // debug border
        }}
      >
        <Box
          style={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "center",
            alignItems: "center",
            gap: "0.3em",
            // border: '7px solid green', // debug border
          }}
        >
          {mode === "edit" || mode === "new" ? (
            <Typography variant="subtitle1" fontStyle={"italic"} color="red">
              select a cell by clicking or click-dragging
            </Typography>
          ) : null}
          {mode === "edit" || mode === "new" ? (
            isDragSelect ? (
              <div
                style={{ width: "0.8em", height: "0.8em", background: "green" }}
              ></div>
            ) : (
              <div
                style={{ width: "0.8em", height: "0.8em", background: "red" }}
              ></div>
            )
          ) : null}
        </Box>

        {mode === "edit" || mode === "new" ? (
          <Typography variant="subtitle1" fontStyle={"italic"} color="red">
            right click after selecting to open context menu action
          </Typography>
        ) : null}

        {mode === "edit" || mode === "new" ? (
          <Box sx={{ display: "flex", p: 0.15, gap: 1 }}>
            <Button
              startIcon={<ClearAllIcon />}
              size="small"
              color="secondary"
              variant="contained"
              onClick={() => setSelectedTimeSlots(new Set([]))}
            >
              Clear Time Slot Selection
            </Button>
          </Box>
        ) : null}
      </Box>

      {/* ===================== TIMETABLE ===================== */}
      <div
        ref={contentRef}
        style={{
          padding:
            isPrinting && Number.isInteger(Number.parseInt(semesterIndex, 10))
              ? "1em"
              : "0px",
        }}
      >
        {isPrinting && Number.isInteger(Number.parseInt(semesterIndex, 10)) ? (
          <>
            <PrintHeader isBlackAndWhite={isBlackAndWhite} />

            <Box
              display={"flex"}
              flexDirection={"column"}
              justifyContent={"center"}
              padding={1}
              gap={0}
              marginTop={1}
            >
              <Typography
                lineHeight={1}
                variant="body1"
                flexWrap={true}
                textAlign={"center"}
              >
                {selectedDepartment.Name?.toUpperCase()}
              </Typography>
              <Typography
                lineHeight={1}
                variant="body1"
                flexWrap={true}
                fontWeight={"bold"}
                textAlign={"center"}
              >
                Faculty Class Schedule
              </Typography>
              <Typography
                lineHeight={1}
                variant="body1"
                textAlign={"center"}
              >{`${SEMESTER_NAMES[semesterIndex]}${academicYear ? ", " + academicYear : ""}`}</Typography>
            </Box>

            <Box
              display={"flex"}
              justifyContent={"space-between"}
              alignItems={"center"}
              marginBottom={1}
            >
              <Typography variant="body1">{`Name: ${selectedInstructor.FirstName} ${selectedInstructor.MiddleInitial} ${selectedInstructor.LastName}`}</Typography>
            </Box>
          </>
        ) : null}

        <table className="time-table">
          <thead>
            <tr>
              <th
                className="time-slot-header"
                style={{
                  ...(isBlackAndWhite
                    ? {
                        background: "white",
                        color: "black",
                        border: "thin solid black",
                      }
                    : {}),
                }}
              >
                Time Slot
              </th>
              {DAYS.map((day) => (
                <th
                  key={day}
                  className="day-header"
                  style={{
                    ...(isBlackAndWhite
                      ? {
                          background: "white",
                          color: "black",
                          border: "thin solid black",
                        }
                      : {}),
                  }}
                >
                  {day}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {generateTimeSlotRowLabels(
              startHour,
              timeSlotMinuteInterval,
              dailyTimeSlots,
            ).map((time_slot_label, time_slot_index) => (
              <tr key={time_slot_index}>
                <td
                  style={{
                    ...(isBlackAndWhite
                      ? { background: "white", color: "black" }
                      : {}),
                  }}
                  className="time-slot"
                >
                  {time_slot_label}
                </td>
                {DAYS.map((_, day_index) => {
                  let class_name = "";
                  let selected = "";

                  const is_available_default =
                    baseResourceTimeSlots?.getAvailability(
                      day_index,
                      time_slot_index,
                    )
                      ? true
                      : false;
                  const is_available_alloc =
                    semsResourceTimeSlots?.getAvailability(
                      day_index,
                      time_slot_index,
                    )
                      ? true
                      : false;
                  const has_assigned_subject = allocatedSubjectAssign.find(
                    (subj) =>
                      subj.DayIdx === day_index &&
                      subj.TimeSlotIdx === time_slot_index,
                  );

                  if (has_assigned_subject) {
                    const subject_color_key = `${has_assigned_subject.SubjectCode}${has_assigned_subject.CourseSection}`;
                    return (
                      <td
                        key={day_index}
                        className={`subject-cell ${!isBlackAndWhite ? subjectColors[subject_color_key] : "color-bw"}`}
                        rowSpan={has_assigned_subject.SubjectTimeSlots}
                      >
                        <div className="subject-content">
                          <div className="subject-time-slot-line-1">
                            {has_assigned_subject.SubjectCode}
                          </div>
                          <div className="subject-time-slot-line-2">
                            {has_assigned_subject.CourseSection}
                          </div>
                          <div className="subject-time-slot-line-3">
                            {has_assigned_subject.RoomName}
                          </div>
                        </div>
                      </td>
                    );
                  }

                  const has_async_placement =
                    mode === "view"
                      ? asyncPlacements.find(
                          (p) =>
                            p.DayIdx === day_index &&
                            p.TimeSlotIdx === time_slot_index,
                        )
                      : null;

                  if (has_async_placement) {
                    return (
                      <td
                        key={day_index}
                        className={`subject-cell ${
                          isBlackAndWhite ? "color-bw" : ""
                        }`}
                        rowSpan={has_async_placement.SubjectTimeSlots}
                        style={
                          isBlackAndWhite
                            ? {}
                            : {
                                background:
                                  "linear-gradient(to bottom right, #fff7d6, #ffe9a3)",
                                color: "#5a4400",
                                boxShadow: "inset 0 0 0 0.1em #c8b04a",
                              }
                        }
                      >
                        <div className="subject-content">
                          <div className="subject-time-slot-line-1">
                            *{has_async_placement.SubjectCode}
                          </div>
                          <div className="subject-time-slot-line-2">
                            {has_async_placement.SectionLabel}
                          </div>
                          <div className="subject-time-slot-line-3">
                            Async
                          </div>
                        </div>
                      </td>
                    );
                  }

                  if (mode === "view") {
                    class_name = "empty-slot";
                  } else if (!is_available_default) {
                    class_name = "disabled-slot";
                  } else if (is_available_default && !is_available_alloc) {
                    class_name = "occupied-slot";
                  } else {
                    class_name = "available-slot";
                  }

                  if (
                    selectedTimeSlots?.has(`${day_index}:${time_slot_index}`)
                  ) {
                    selected = "selected-time-slot-cell";
                  }

                  const is_occupied = allocatedSubjectAssign.some((subject) => {
                    const has_hit_subject_in_row =
                      time_slot_index >= subject.TimeSlotIdx &&
                      time_slot_index <
                        subject.TimeSlotIdx + subject.SubjectTimeSlots;
                    const has_hit_subject_in_col = day_index == subject.DayIdx;
                    return has_hit_subject_in_row && has_hit_subject_in_col;
                  });

                  const is_async_occupied =
                    mode === "view" &&
                    asyncPlacements.some((p) => {
                      const in_row =
                        time_slot_index >= p.TimeSlotIdx &&
                        time_slot_index < p.TimeSlotIdx + p.SubjectTimeSlots;
                      const in_col = day_index === p.DayIdx;
                      return in_row && in_col;
                    });

                  if (is_occupied || is_async_occupied) {
                    return null;
                  }

                  return (
                    <td
                      key={day_index}
                      className={class_name}
                      onContextMenu={(event) => {
                        event.preventDefault();

                        if (mode === "view") {
                          return;
                        }

                        contextMenuState.setShow(true);
                        contextMenuState.setPosition(
                          new Position(event.clientX, event.clientY),
                        );

                        const is_selected = selectedTimeSlots.has(
                          `${day_index}:${time_slot_index}`,
                        );

                        if (!is_selected) {
                          const new_selected_time_slots = new Set(
                            selectedTimeSlots,
                          );
                          new_selected_time_slots.add(
                            `${day_index}:${time_slot_index}`,
                          );
                          setSelectedTimeSlots(new_selected_time_slots);
                        }
                      }}
                      onMouseDown={(event) => {
                        if (mode === "view") {
                          return;
                        }

                        setIsDragSelect(true);

                        const is_selected = selectedTimeSlots.has(
                          `${day_index}:${time_slot_index}`,
                        );

                        if (!is_selected) {
                          const new_selected_time_slots = new Set(
                            selectedTimeSlots,
                          );
                          new_selected_time_slots.add(
                            `${day_index}:${time_slot_index}`,
                          );
                          setSelectedTimeSlots(new_selected_time_slots);
                        }
                      }}
                      onMouseEnter={(event) => {
                        if (mode === "view") {
                          return;
                        }

                        const is_selected = selectedTimeSlots.has(
                          `${day_index}:${time_slot_index}`,
                        );

                        if (!is_selected && isDragSelect) {
                          const new_selected_time_slots = new Set(
                            selectedTimeSlots,
                          );
                          new_selected_time_slots.add(
                            `${day_index}:${time_slot_index}`,
                          );
                          setSelectedTimeSlots(new_selected_time_slots);
                        }
                      }}
                      onMouseUp={(event) => {
                        if (mode === "view") {
                          return;
                        }

                        setIsDragSelect(false);
                      }}
                    >
                      {mode !== "view" ? (
                        <span className={`time-slot-cover ${selected}`}></span>
                      ) : null}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>

        {mode === "view" &&
        Number.isInteger(Number.parseInt(semesterIndex, 10)) ? (
          <Box
            sx={{
              paddingInline: 2,
              paddingBlock: 1.5,
              marginTop: 1,
              borderTop: "thin solid #ccc",
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

            <Box
              sx={{
                display: "flex",
                gap: 3,
                flexWrap: "wrap",
                marginBottom: 1,
              }}
            >
              <Typography variant="body2">
                <strong>Sync Hours:</strong>{" "}
                {Number(hourTotals.SyncHours || 0).toFixed(2)}
              </Typography>
              <Typography variant="body2">
                <strong>Async Hours:</strong>{" "}
                {Number(hourTotals.AsyncHours || 0).toFixed(2)}
              </Typography>
              <Typography variant="body2">
                <strong>Total Hours:</strong>{" "}
                {Number(hourTotals.TotalHours || 0).toFixed(2)}
              </Typography>
            </Box>

            {asyncOverflow.length > 0 ? (
              <Box
                sx={{
                  marginBottom: 1,
                  padding: 1,
                  background: "#fff4f4",
                  border: "thin solid #d99",
                  borderRadius: 1,
                }}
              >
                <Typography
                  variant="body2"
                  fontWeight="bold"
                  color="error.main"
                >
                  Could not place on timetable (no free contiguous slot):
                </Typography>
                {asyncOverflow.map((o) => (
                  <Typography
                    key={o.RecordKey}
                    variant="caption"
                    display="block"
                  >
                    *{o.SubjectCode} — {o.SectionLabel} —{" "}
                    {Number(o.AsyncHours).toFixed(2)} hr
                  </Typography>
                ))}
              </Box>
            ) : null}

            {asyncAssignments.length === 0 ? (
              <Typography
                variant="body2"
                fontStyle="italic"
                color="text.secondary"
              >
                No asynchronous assignments for this semester.
              </Typography>
            ) : (
              <table
                className="time-table"
                style={{ width: "100%", marginTop: 4 }}
              >
                <thead>
                  <tr>
                    <th
                      className="day-header"
                      style={{
                        ...(isBlackAndWhite
                          ? {
                              background: "white",
                              color: "black",
                              border: "thin solid black",
                            }
                          : {}),
                      }}
                    >
                      Subject / Section
                    </th>
                    <th
                      className="day-header"
                      style={{
                        ...(isBlackAndWhite
                          ? {
                              background: "white",
                              color: "black",
                              border: "thin solid black",
                            }
                          : {}),
                      }}
                    >
                      Async Hours
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {asyncAssignments.map((record, idx) => (
                    <tr key={`${record.SectionID}-${record.SubjectID}-${idx}`}>
                      <td
                        className="time-slot"
                        style={{
                          ...(isBlackAndWhite
                            ? { background: "white", color: "black" }
                            : {}),
                        }}
                      >
                        *{record.DisplayLabel ||
                          `Subject ${record.SubjectID} - ${record.SectionID}`}
                        {record.CourseSection
                          ? ` — ${record.CourseSection}`
                          : ""}
                      </td>
                      <td
                        className="time-slot"
                        style={{
                          ...(isBlackAndWhite
                            ? { background: "white", color: "black" }
                            : {}),
                        }}
                      >
                        {Number(record.AsyncHours || 0).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Box>
        ) : null}

        <Box
          display={"flex"}
          gap={3}
          flexDirection={"row"}
          flexWrap="wrap"
          width={"100%"}
          justifyContent={"space-between"}
          paddingInline={5}
          paddingTop={3}
        >
          {signatoryConforme ? (
            <Box display={"flex"} minWidth={1 / 3} flexDirection={"column"}>
              <Typography variant="caption" marginBottom={3}>
                Conforme:
              </Typography>
              <Typography variant="body1">{signatoryConforme}</Typography>
              <Typography variant="caption">{positionConforme}</Typography>
            </Box>
          ) : null}

          {signatoryRecommendingApproval ? (
            <Box display={"flex"} minWidth={1 / 3} flexDirection={"column"}>
              <Typography variant="caption" marginBottom={3}>
                Recommending Approval:
              </Typography>
              <Typography variant="body1">
                {" "}
                {signatoryRecommendingApproval}
              </Typography>
              <Typography variant="caption">
                {positionRecommendingApproval}
              </Typography>
            </Box>
          ) : null}

          {signatoryReviewedBy ? (
            <Box display={"flex"} minWidth={1 / 3} flexDirection={"column"}>
              <Typography variant="caption" marginBottom={3}>
                Reviewed by:
              </Typography>
              <Typography variant="body1"> {signatoryReviewedBy}</Typography>
              <Typography variant="caption">{positionReviewedBy}</Typography>
            </Box>
          ) : null}

          {signatoryApproved ? (
            <Box display={"flex"} minWidth={1 / 3} flexDirection={"column"}>
              <Typography variant="caption" marginBottom={3}>
                Approved:
              </Typography>
              <Typography variant="body1"> {signatoryApproved}</Typography>
              <Typography variant="caption">{positionApproved}</Typography>
            </Box>
          ) : null}
        </Box>
      </div>

      {!semesterIndex ? <Box height={5}></Box> : null}

      {/* ===================== PRINT DIALOG ===================== */}
      <Dialog
        open={isPrintDialogShow}
        onClose={() => {
          setIsPrintDialogShow(false);
        }}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle>Faculty Schedule Signatories</DialogTitle>

        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Add signatories if needed.
            browser print dialog.
          </DialogContentText>

          <Box display={"flex"} flexDirection={"column"} gap={2} marginTop={2}>
            <Box width={"100%"} display={"flex"} gap={1}>
              <TextField
                fullWidth
                label="S.Y. or A.Y. - 20XX - 20YY"
                autoFocus
                variant="standard"
                onChange={(e) => setAcademicYear(e.target.value)}
                defaultValue={academicYear ? academicYear : ""}
              />
            </Box>

            {/* 
                    <Box width={'100%'} display={'flex'} gap={1}>
                        <TextField
                            fullWidth
                            label="Highest Educational Attainment"
                            autoFocus
                            variant="standard"
                            onChange={(e) => setHighestEducationalAttainment(e.target.value)}
                            defaultValue={highestEducationalAttainment ? highestEducationalAttainment : ""}
                        />
                    </Box>

                    <Box width={'100%'} display={'flex'} gap={1}>
                        <TextField
                            type="number"
                            fullWidth
                            label="Number of Preperation(s)"
                            autoFocus
                            variant="standard"
                            onChange={(e) => setNumbersOfPreperation(e.target.value)}
                            defaultValue={numbersOfPreperation ? numbersOfPreperation : ""}
                        />
                    </Box> */}

            <Box width={"100%"} display={"flex"} gap={1}>
                <TextField
                fullWidth
                label="Conforme"
                variant="standard"
                value={signatoryConforme || ""}
                InputProps={{
                    readOnly: true,
                }}
                />
              <TextField
                label="Position"
                autoFocus
                variant="standard"
                onChange={(e) => setPositionConforme(e.target.value)}
                defaultValue={positionConforme ? positionConforme : ""}
              />
            </Box>

            <Box width={"100%"} display={"flex"} gap={1}>
              <TextField
                fullWidth
                label="Recommending Approval"
                autoFocus
                variant="standard"
                onChange={(e) =>
                  setSignatoryRecommendingApproval(e.target.value)
                }
                defaultValue={
                  signatoryRecommendingApproval
                    ? signatoryRecommendingApproval
                    : ""
                }
              />
              <TextField
                label="Position"
                autoFocus
                variant="standard"
                onChange={(e) =>
                  setPositionRecommendingApproval(e.target.value)
                }
                defaultValue={
                  positionRecommendingApproval
                    ? positionRecommendingApproval
                    : ""
                }
              />
            </Box>

            <Box width={"100%"} display={"flex"} gap={1}>
              <TextField
                fullWidth
                label="Reviewed by"
                autoFocus
                variant="standard"
                onChange={(e) => setSignatoryReviewedBy(e.target.value)}
                defaultValue={signatoryReviewedBy ? signatoryReviewedBy : ""}
              />
              <TextField
                label="Position"
                autoFocus
                variant="standard"
                onChange={(e) => setPositionReviewedBy(e.target.value)}
                defaultValue={positionReviewedBy ? positionReviewedBy : ""}
              />
            </Box>

            <Box width={"100%"} display={"flex"} gap={1}>
              <TextField
                fullWidth
                label="Approved"
                autoFocus
                variant="standard"
                onChange={(e) => setSignatoryApproved(e.target.value)}
                defaultValue={signatoryApproved ? signatoryApproved : ""}
              />
              <TextField
                label="Position"
                autoFocus
                variant="standard"
                onChange={(e) => setPositionApproved(e.target.value)}
                defaultValue={positionApproved ? positionApproved : ""}
              />
            </Box>
          </Box>
        </DialogContent>

        <DialogActions>
          <Button
            variant="outlined"
            size="medium"
            onClick={reactToPrintFn}
            endIcon={<PrintIcon />}
          >
            Print Colored
          </Button>
          <Button
            variant="outlined"
            size="medium"
            onClick={reactToPrintBlackAndWhiteFn}
            endIcon={<PrintIcon />}
          >
            Print Black & White
          </Button>
          <Button
            variant="outlined"
            size="medium"
            onClick={() => {
              setIsPrintDialogShow(false);

              setConsultation("");
              setDesignation("");
              setResearch("");
              setExtension("");

              setSignatoryConforme("");
              setSignatoryRecommendingApproval("");
              setSignatoryReviewedBy("");
              setSignatoryApproved("");

              setPositionConforme("");
              setPositionRecommendingApproval("");
              setPositionReviewedBy("");
              setPositionApproved("");
            }}
          >
            Cancel
          </Button>
        </DialogActions>
      </Dialog>

      <div style={{ height: "3.25em" }} />
    </>
  );
}

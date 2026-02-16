import { DEV, API_VERSION, base_url } from "./basics.js";

export async function fetchConst() {
  let api_request = `/${API_VERSION}/const`

  if (DEV) {
    console.log('call: fetchConst')
    api_request = `${base_url}/${API_VERSION}/const`
  }

  const response = await fetch(api_request, {
    headers: {
      Accept: "application/json",
    },
    credentials: "include",
    method: 'GET'
  });

  if (!response.ok) {
    throw Error(`${response.status} : ${await response.text()}`);
  }

  return await response.json();
}

export async function fetchSerializedUniversitySchedule(selected_semester) {
  let api_request = `/${API_VERSION}/university_schedule?semester=${selected_semester}`

  if (DEV) {
    console.log('call: fetchSerializedUniversitySchedule')
    api_request = `${base_url}/${API_VERSION}/university_schedule?semester=${selected_semester}`
  }

  const response = await fetch(api_request, {
    headers: {
      Accept: "text/plain",
    },
    credentials: "include",
    method: 'GET'
  });

  if (!response.ok) {
    throw Error(`${response.status} : ${await response.text()}`);
  }

  return new Uint8Array(await response.arrayBuffer());
}

export async function fetchSerializedClassSchedule(department_id, selected_semester, schedule_idx) {
  let api_request = `/${API_VERSION}/class_schedule?department_id=${department_id}&semester=${selected_semester}&schedule_idx=${schedule_idx}`

  if (DEV) {
    console.log('call: fetchSerializedClassSchedule')
    api_request = `${base_url}/${API_VERSION}/class_schedule?department_id=${department_id}&semester=${selected_semester}&schedule_idx=${schedule_idx}`
  }

  const response = await fetch(api_request, {
    headers: {
      Accept: "text/plain",
    },
    credentials: "include",
    method: 'GET'
  });

  if (!response.ok) {
    throw Error(`${response.status} : ${await response.text()}`);
  }

  return new Uint8Array(await response.arrayBuffer());
}

export async function deleteClearSectionSchedule(department_id, selected_semester, curriculum_id, year_level_idx, section_idx) {
  let api_request = `/v2/clear_class_schedule?department_id=${department_id}&semester=${selected_semester}&curriculum_id=${curriculum_id}&year_level_idx=${year_level_idx}&section_idx=${section_idx}`

  if (DEV) {
    console.log('call: deleteClearSectionSchedule')
    api_request = `${base_url}/v2/clear_class_schedule?department_id=${department_id}&semester=${selected_semester}&curriculum_id=${curriculum_id}&year_level_idx=${year_level_idx}&section_idx=${section_idx}`
  }

  const response = await fetch(api_request, {
    headers: {
      Accept: "text/plain",
    },
    credentials: "include",
    method: 'DELETE'
  });

  if (!response.ok) {
    throw Error(`${response.status} : ${await response.text()}`);
  }

  return await response.text()
}

export async function deleteClearDepartmentSchedule(department_id, selected_semester) {
  let api_request = `/${API_VERSION}/clear_department_schedules?department_id=${department_id}&semester=${selected_semester}`

  if (DEV) {
    console.log('call: deleteClearDepartmentSchedule')
    api_request = `${base_url}/${API_VERSION}/clear_department_schedules?department_id=${department_id}&semester=${selected_semester}`
  }

  const response = await fetch(api_request, {
    headers: {
      Accept: "text/plain",
    },
    credentials: "include",
    method: 'DELETE'
  });

  if (!response.ok) {
    throw Error(`${response.status} : ${await response.text()}`);
  }

  return await response.text()
}

export async function fetchClassJsonSchedule(department_id, selected_semester, curriculum_id, year_level_idx, section_idx) {
  let api_request = `/v2/class_json_schedule?department_id=${department_id}&semester=${selected_semester}&curriculum_id=${curriculum_id}&year_level_idx=${year_level_idx}&section_idx=${section_idx}`

  if (DEV) {
    console.log('call: fetchClassJsonSchedule')
    api_request = `${base_url}/v2/class_json_schedule?department_id=${department_id}&semester=${selected_semester}&curriculum_id=${curriculum_id}&year_level_idx=${year_level_idx}&section_idx=${section_idx}`
  }

  const response = await fetch(api_request, {
    headers: {
      Accept: "application/json",
    },
    credentials: "include",
    method: 'GET'
  });

  if (!response.ok) {
    throw Error(`${response.status} : ${await response.text()}`);
  }

  return await response.json();
}

export async function sendSerializedSchedule(selected_semester, serialized_schedule) {
  let api_request = `/${API_VERSION}/university_schedule?semester=${selected_semester}`

  if (DEV) {
    console.log('call: sendSerializedSchedule')
    api_request = `${base_url}/${API_VERSION}/university_schedule?semester=${selected_semester}`
  }

  const response = await fetch(api_request, {
    credentials: "include",
    method: 'POST',
    headers: {
      Accept: "text/plain",
      'Content-Type': 'application/octet-stream'
    },
    body: serialized_schedule
  });

  if (!response.ok) {
    throw new Error(`${response.status} : ${await response.text()}`);
  }
}

export async function deserializeSchedule(serialized_data) {
  let constants = await fetchConst()

  const time_slot_bytes = constants.time_slot_bytes;
  const weekly_school_days = constants.weekly_school_days;

  const daily_time_slots = constants.daily_time_slots;
  const weekly_time_slots = constants.weekly_time_slots;

  const university_schedules = [];
  const number_of_sections = serialized_data.length / (weekly_time_slots * time_slot_bytes);

  let offset = 0;

  for (let section_idx = 0; section_idx < number_of_sections; section_idx++) {
    const week_time_table = [];
    for (let day = 0; day < weekly_school_days; day++) {
      const day_time_table = [];
      for (let time_slot = 0; time_slot < daily_time_slots; time_slot++) {
        const subjectID = (serialized_data[offset] | (serialized_data[offset + 1] << 8));
        const instructorID = (serialized_data[offset + 2] | (serialized_data[offset + 3] << 8));
        const roomID = (serialized_data[offset + 4] | (serialized_data[offset + 5] << 8));

        day_time_table.push({ subjectID, instructorID, roomID });
        offset += time_slot_bytes;
      }
      week_time_table.push(day_time_table);
    }
    university_schedules.push(week_time_table);
  }

  return university_schedules;
}

export async function serializeSchedule(university_schedules) {
  let constants = await fetchConst()

  const time_slot_bytes = constants.time_slot_bytes;
  const weekly_time_slots = constants.weekly_time_slots;

  const serialized_data = new Uint8Array(university_schedules.length * weekly_time_slots * time_slot_bytes);

  let offset = 0;

  for (const section_week_schedule of university_schedules) {
    for (const day of section_week_schedule) {
      for (const time_slot of day) {
        serialized_data[offset] = time_slot.subjectID & 0xff;
        serialized_data[offset + 1] = (time_slot.subjectID >> 8) & 0xff;
        serialized_data[offset + 2] = time_slot.instructorID & 0xff;
        serialized_data[offset + 3] = (time_slot.instructorID >> 8) & 0xff;
        serialized_data[offset + 4] = time_slot.roomID & 0xff;
        serialized_data[offset + 5] = (time_slot.roomID >> 8) & 0xff;

        offset += time_slot_bytes;
      }
    }
  }

  return serialized_data;
}

export async function generateSchedule(selected_semester, department_id) {
  let api_request = `/${API_VERSION}/generate_schedule?semester=${selected_semester}&department_id=${department_id}`

  if (DEV) {
    console.log('call: generateSchedule')
    api_request = `${base_url}/${API_VERSION}/generate_schedule?semester=${selected_semester}&department_id=${department_id}`
  }

  const response = await fetch(api_request, {
    credentials: "include",
    method: 'POST',
    headers: {
      Accept: "text/plain",
    },
  });

  if (!response.ok) {
    throw new Error(`${response.status} : ${await response.text()}`);
  }

  return await response.text()
}

export async function getValidateSchedules(semesterIndex, departmentID) {
  let api_request = `/v2/validate_schedules?semester=${semesterIndex}&department_id=${departmentID}`

  if (DEV) {
    console.log('call: getValidateSchedules')
    api_request = `${base_url}/v2/validate_schedules?semester=${semesterIndex}&department_id=${departmentID}`
  }

  const response = await fetch(api_request, {
    credentials: "include",
    method: 'GET',
    headers: {
      Accept: "application/json",
    },
  });

  switch (response.status) {
    case 404: {
      return await response.json()
    }
    case 409: {
      return await response.json()
    }
    default: {
      if (!response.ok) {
        throw new Error(`${response.status} : ${await response.text()}`);
      }
    }
  }

  return await response.text()
}

export async function surveyAddPreference(new_class_scheduled_subjects) {
  let api_request = '/v2/add_schedule_preference'

  if (DEV) {
    console.log('call: surveyAddPreference')
    api_request = `${base_url}/v2/add_schedule_preference`
  }

  const response = await fetch(api_request, {
    credentials: "include",
    method: 'POST',
    headers: {
      Accept: "text/plain",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(new_class_scheduled_subjects)
  });

  if (!response.ok) {
    throw new Error(`${response.status} : ${await response.text()}`);
  }

  return await response.text()
}

export async function getSchedGenStatus(semesterIndex, departmentID) {
  let api_request = `/v1/dept_gen_result?semester=${semesterIndex}&department_id=${departmentID}`

  if (DEV) {
    console.log('call: getSchedGenStatus')
    api_request = `${base_url}/v1/dept_gen_result?semester=${semesterIndex}&department_id=${departmentID}`
  }

  const response = await fetch(api_request, {
    credentials: "include",
    method: 'GET',
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`${response.status} : ${await response.text()}`);
  }

  return await response.json()
}

export async function fetchSubjectTimeSlotMoveAvailability(subject_json, department_id, selected_semester, curriculum_id, year_level_idx, section_idx) {
  let api_request = `/v2/available_subject_moves?department_id=${department_id}&semester=${selected_semester}&curriculum_id=${curriculum_id}&year_level_idx=${year_level_idx}&section_idx=${section_idx}`

  if (DEV) {
    console.log('call: fetchSubjectTimeSlotMoveAvailability')
    api_request = `${base_url}/v2/available_subject_moves?department_id=${department_id}&semester=${selected_semester}&curriculum_id=${curriculum_id}&year_level_idx=${year_level_idx}&section_idx=${section_idx}`
  }

  const response = await fetch(api_request, {
    headers: {
      Accept: "text/plain",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(subject_json),
    credentials: "include",
    method: 'POST'
  });

  if (!response.ok) {
    throw Error(`${response.status} : ${await response.text()}`);
  }

  return await response.json();
}

export async function fetchSubjectTimeSlotMove(subject_json, department_id, selected_semester, curriculum_id, year_level_idx, section_idx) {
  let api_request = `/v2/subject_move?department_id=${department_id}&semester=${selected_semester}&curriculum_id=${curriculum_id}&year_level_idx=${year_level_idx}&section_idx=${section_idx}`

  if (DEV) {
    console.log('call: fetchSubjectTimeSlotMove')
    api_request = `${base_url}/v2/subject_move?department_id=${department_id}&semester=${selected_semester}&curriculum_id=${curriculum_id}&year_level_idx=${year_level_idx}&section_idx=${section_idx}`
  }

  const response = await fetch(api_request, {
    headers: {
      Accept: "text/plain",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(subject_json),
    credentials: "include",
    method: 'POST'
  });

  if (!response.ok) {
    throw Error(`${response.status} : ${await response.text()}`);
  }

  return await response.text();
}

export async function fetchResourceEstimates(department_id, selected_semester) {
  let api_request = `/v2/estimate_resources?department_id=${department_id}&semester=${selected_semester}`

  if (DEV) {
    console.log('call: fetchResourceEstimates')
    api_request = `${base_url}/v2/estimate_resources?department_id=${department_id}&semester=${selected_semester}`
  }

  const response = await fetch(api_request, {
    headers: {
      Accept: "text/plain",
    },
    credentials: "include",
    method: 'GET'
  });

  if (!response.ok) {
    throw Error(`${response.status} : ${await response.text()}`);
  }

  return await response.text()
}
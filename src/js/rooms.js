import { DEV, API_VERSION, base_url } from "./basics.js";

export async function fetchDepartmentRooms(department_id, page_size, page, name_match) {
  let api_request = `/${API_VERSION}/rooms?department_id=${department_id}&page_size=${page_size}&page=${page}`

  if (DEV) {
    console.log('call: fetchDepartmentRoomsDefaults')
    api_request = `${base_url}/${API_VERSION}/rooms?department_id=${department_id}&page_size=${page_size}&page=${page}`
  }

  if (name_match) {
    api_request = `${api_request}&name_match=${name_match}`
  }

  const response = await fetch(api_request, {
    headers: {
      Accept: "application/json",
    },
    credentials: "include",
    method: 'GET'
  });

  if (!response.ok) {
    throw Error(`${response.status} :${await response.text()}`);
  }

  return response.json();
}

export async function deleteRemoveRoom(room_id) {
  let api_request = `/${API_VERSION}/room_remove?room_id=${room_id}`

  if (DEV) {
    console.log('call: postUpdateRoom')
    api_request = `${base_url}/${API_VERSION}/room_remove?room_id=${room_id}`
  }

  const response = await fetch(api_request, {
    credentials: "include",
    method: 'DELETE',
    headers: {
      Accept: "text/plain",
    },
  });

  if (!response.ok) {
    throw new Error(`${response.status} : ${await response.text()}`);
  }
}

export async function postCreateRoom(room) {
  let api_request = `/${API_VERSION}/room_add`

  if (DEV) {
    console.log('call: postUpdateRoom')
    api_request = `${base_url}/${API_VERSION}/room_add`
  }

  const response = await fetch(api_request, {
    credentials: "include",
    method: 'POST',
    headers: {
      Accept: "text/plain",
      "Content-Type": "application/json",
    },

    body: JSON.stringify(room)
  });

  if (!response.ok) {
    throw new Error(`${response.status} : ${await response.text()}`);
  }
}

export async function patchUpdateRoom(room) {
  let api_request = `/${API_VERSION}/room_update`

  if (DEV) {
    console.log('call: postUpdateRoom')
    api_request = `${base_url}/${API_VERSION}/room_update`
  }

  const response = await fetch(api_request, {
    credentials: "include",
    method: 'PATCH',
    headers: {
      Accept: "text/plain",
      "Content-Type": "application/json",
    },

    body: JSON.stringify(room)
  });

  if (!response.ok) {
    throw new Error(`${response.status} : ${await response.text()}`);
  }
}

export async function fetchRoomAllocation(room_id) {
  let api_request = `/${API_VERSION}/room_allocation?room_id=${room_id}`

  if (DEV) {
    console.log('call: fetchRoomAllocation')
    api_request = `${base_url}/${API_VERSION}/room_allocation?room_id=${room_id}`
  }

  const response = await fetch(api_request, {
    headers: {
      Accept: "application/json",
    },
    credentials: "include",
    method: 'GET'
  });

  if (!response.ok) {
    throw Error(`${response.status} :${await response.text()}`);
  }

  return response.json();
}
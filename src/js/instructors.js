import { DEV, API_VERSION, base_url } from "./basics.js";

export async function deleteRemoveInsturctor(instructor_id) {
  let api_request = `/${API_VERSION}/instructor_remove?instructor_id=${instructor_id}`

  if (DEV) {
    console.log('call: postUpdateInsturctor')
    api_request = `${base_url}/${API_VERSION}/instructor_remove?instructor_id=${instructor_id}`
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

export async function postCreateInsturctor(instructor) {
  let api_request = `/${API_VERSION}/instructor_add`

  if (DEV) {
    console.log('call: postUpdateInsturctor')
    api_request = `${base_url}/${API_VERSION}/instructor_add`
  }

  const response = await fetch(api_request, {
    credentials: "include",
    method: 'POST',
    headers: {
      Accept: "text/plain",
      "Content-Type": "application/json",
    },

    body: JSON.stringify(instructor)
  });

  if (!response.ok) {
    throw new Error(`${response.status} : ${await response.text()}`);
  }
}

export async function patchUpdateInsturctor(instructor) {
  let api_request = `/${API_VERSION}/instructor_update`

  if (DEV) {
    console.log('call: postUpdateInsturctor')
    api_request = `${base_url}/${API_VERSION}/instructor_update`
  }

  const response = await fetch(api_request, {
    credentials: "include",
    method: 'PATCH',
    headers: {
      Accept: "text/plain",
      "Content-Type": "application/json",
    },

    body: JSON.stringify(instructor)
  });

  if (!response.ok) {
    throw new Error(`${response.status} : ${await response.text()}`);
  }
}
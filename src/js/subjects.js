import { DEV, API_VERSION, base_url } from "./basics.js";

export async function fetchSubjects(page_size, page, code_match = "", name_match = "") {
  let api_request = `/${API_VERSION}/subjects?page_size=${page_size}&page=${page}`

  if (DEV) {
    console.log('call: fetchSubjects')
    api_request = `${base_url}/${API_VERSION}/subjects?page_size=${page_size}&page=${page}`
  }

  if (code_match) api_request += `&code_match=${encodeURIComponent(code_match)}`;
  if (name_match) api_request += `&name_match=${encodeURIComponent(name_match)}`;

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

export async function deleteRemoveSubject(subject_id) {
  let api_request = `/${API_VERSION}/subject_remove?subject_id=${subject_id}`

  if (DEV) {
    console.log('call: deleteRemoveSubject')
    api_request = `${base_url}/${API_VERSION}/subject_remove?subject_id=${subject_id}`
  }

  const response = await fetch(api_request, {
    method: 'DELETE',
    credentials: "include",
    headers: {
      Accept: "text/plain",
    },
  });

  if (!response.ok) {
    throw new Error(`${response.status} : ${await response.text()}`);
  }
}

export async function postCreateSubject(subject) {
  let api_request = `/${API_VERSION}/subject_add`

  if (DEV) {
    console.log('call: postCreateSubject')
    api_request = `${base_url}/${API_VERSION}/subject_add`
  }

  const response = await fetch(api_request, {
    method: 'POST',
    credentials: "include",
    headers: {
      Accept: "text/plain",
      "Content-Type": "application/json",
    },

    body: JSON.stringify(subject)
  });

  if (!response.ok) {
    throw new Error(`${response.status} : ${await response.text()}`);
  }
}

export async function patchUpdateSubject(subject) {
  let api_request = `/${API_VERSION}/subject_update`

  if (DEV) {
    console.log('call: patchUpdateSubject')
    api_request = `${base_url}/${API_VERSION}/subject_update`
  }

  const response = await fetch(api_request, {
    method: 'PATCH',
    credentials: "include",
    headers: {
      Accept: "text/plain",
      "Content-Type": "application/json",
    },

    body: JSON.stringify(subject)
  });

  if (!response.ok) {
    throw new Error(`${response.status} : ${await response.text()}`);
  }
}
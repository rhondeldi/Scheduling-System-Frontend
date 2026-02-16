import { DEV, API_VERSION, base_url } from "./basics.js";

export async function fetchCurriculumPageList(page_size, page, department_id, code_match = "", name_match = "") {
  let api_request = `/${API_VERSION}/curriculum_list?page_size=${page_size}&page=${page}&department_id=${department_id}`;

  if (DEV) {
    console.log('call: fetchCurriculumPageList');
    api_request = `${base_url}/${API_VERSION}/curriculum_list?page_size=${page_size}&page=${page}&department_id=${department_id}`;
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
    throw Error(`${response.status} : ${await response.text()}`);
  }

  return response.json();
}

export async function loadCurriculum(curriculum_id) {
  let api_request = `/${API_VERSION}/curriculum_load?curriculum_id=${curriculum_id}`

  if (DEV) {
    console.log('call: loadCurriculum')
    api_request = `${base_url}/${API_VERSION}/curriculum_load?curriculum_id=${curriculum_id}`
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

export async function deleteRemoveCurriculum(curriculum_id) {
  let api_request = `/${API_VERSION}/curriculum_remove?curriculum_id=${curriculum_id}`

  if (DEV) {
    console.log('call: deleteRemoveCurriculum')
    api_request = `${base_url}/${API_VERSION}/curriculum_remove?curriculum_id=${curriculum_id}`
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

export async function postCreateCurriculum(curriculum) {
  let api_request = `/${API_VERSION}/curriculum_add`

  if (DEV) {
    console.log('call: postCreateCurriculum')
    api_request = `${base_url}/${API_VERSION}/curriculum_add`
  }

  const response = await fetch(api_request, {
    credentials: "include",
    method: 'POST',
    headers: {
      Accept: "text/plain",
      "Content-Type": "application/json",
    },

    body: JSON.stringify(curriculum)
  });

  if (!response.ok) {
    throw new Error(`${response.status} : ${await response.text()}`);
  }
}

export async function patchUpdateCurriculum(curriculum) {
  let api_request = `/${API_VERSION}/curriculum_update`

  if (DEV) {
    console.log('call: patchUpdateCurriculum')
    api_request = `${base_url}/${API_VERSION}/curriculum_update`
  }

  const response = await fetch(api_request, {
    credentials: "include",
    method: 'PATCH',
    headers: {
      Accept: "text/plain",
      "Content-Type": "application/json",
    },

    body: JSON.stringify(curriculum)
  });

  if (!response.ok) {
    throw new Error(`${response.status} : ${await response.text()}`);
  }
}
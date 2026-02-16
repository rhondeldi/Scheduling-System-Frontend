import { DEV, API_VERSION, base_url } from "./basics.js";

export async function loginDepartment(payload) {
  console.log('login department ', payload)

  let api_request = `/auth_gasss_login`

  if (DEV) {
    console.log('call: loginDepartment')
    api_request = `${base_url}/auth_gasss_login`
  }

  const response = await fetch(api_request, {
    method: 'POST',
    credentials: "include",
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  return response
}

export async function logoutDepartment() {
  console.log('logout department ')

  let api_request = `/auth_gasss_logout`

  if (DEV) {
    console.log('call: logoutDepartment')
    api_request = `${base_url}/auth_gasss_logout`
  }

  const response = await fetch(api_request, {
    method: 'DELETE',
    credentials: "include"
  });

  return response
}

export async function fetchWho() {
  console.log('who? ')

  let api_request = `/who`

  if (DEV) {
    console.log('call: fetchWho')
    api_request = `${base_url}/who`
  }

  const response = await fetch(api_request, {
    method: 'GET',
    credentials: "include",
    headers: {
      Accept: "text/plain",
    }
  });

  if (!response.ok) {
    throw Error(`${response.status} :${await response.text()}`);
  }

  return response.text()
}

export async function fetchAllDepartments() {
  let api_request = `/${API_VERSION}/all_departments`

  if (DEV) {
    console.log('call: fetchAllDepartments')
    api_request = `${base_url}/${API_VERSION}/all_departments`
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

export async function fetchDepartmentCurriculumsData(department_id, semester) {
  let api_request = `/${API_VERSION}/department_data?department_id=${department_id}&semester=${semester}`

  if (DEV) {
    console.log('call: fetchDepartmentData')
    api_request = `${base_url}/${API_VERSION}/department_data?department_id=${department_id}&semester=${semester}`
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

export async function fetchDepartmentsPaginated(page_size, page, code_match = "", name_match = "") {
  let api_request = `/${API_VERSION}/departments?page_size=${page_size}&page=${page}`

  if (DEV) {
    console.log('call: fetchSubjects')
    api_request = `${base_url}/${API_VERSION}/departments?page_size=${page_size}&page=${page}`
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

export async function deleteRemoveDepartment(department_id) {
  let api_request = `/${API_VERSION}/department_remove?department_id=${department_id}`

  if (DEV) {
    console.log('call: deleteRemoveDepartment')
    api_request = `${base_url}/${API_VERSION}/department_remove?department_id=${department_id}`
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

export async function postCreateDepartment(department) {
  let api_request = `/${API_VERSION}/department_add`

  if (DEV) {
    console.log('call: postCreateDepartment')
    api_request = `${base_url}/${API_VERSION}/department_add`
  }

  const response = await fetch(api_request, {
    credentials: "include",
    method: 'POST',
    headers: {
      Accept: "text/plain",
      "Content-Type": "application/json",
    },

    body: JSON.stringify(department)
  });

  if (!response.ok) {
    throw new Error(`${response.status} : ${await response.text()}`);
  }
}

export async function patchUpdateDepartment(department) {
  let api_request = `/${API_VERSION}/department_update`

  if (DEV) {
    console.log('call: patchUpdateDepartment')
    api_request = `${base_url}/${API_VERSION}/department_update`
  }

  const response = await fetch(api_request, {
    credentials: "include",
    method: 'PATCH',
    headers: {
      Accept: "text/plain",
      "Content-Type": "application/json",
    },

    body: JSON.stringify(department)
  });

  if (!response.ok) {
    throw new Error(`${response.status} : ${await response.text()}`);
  }
}
import { DEV, base_url } from "./basics.js";

const API_VERSION = 'v2'

export async function fetchInstructors(department_id, page_size, page, firstname_match, initial_match, lastname_match) {
  let api_request = `/${API_VERSION}/instructors?department_id=${department_id}&page_size=${page_size}&page=${page}`

  if (DEV) {
    console.log('call: fetchInstructors')
    api_request = `${base_url}/${API_VERSION}/instructors?department_id=${department_id}&page_size=${page_size}&page=${page}`
  }

  if (firstname_match) api_request += `&firstname_match=${encodeURIComponent(firstname_match)}`;
  if (initial_match) api_request += `&initial_match=${encodeURIComponent(initial_match)}`;
  if (lastname_match) api_request += `&lastname_match=${encodeURIComponent(lastname_match)}`;

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

export async function fetchInstructorResources(instructor_id) {
  let api_request = `/${API_VERSION}/instructor_resources?instructor_id=${instructor_id}`

  if (DEV) {
    console.log('call: fetchInstructorResources')
    api_request = `${base_url}/${API_VERSION}/instructor_resources?instructor_id=${instructor_id}`
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

export async function fetchInstructorBasic(instructor_id) {
  let api_request = `/${API_VERSION}/instructor_basic?instructor_id=${instructor_id}`

  if (DEV) {
    console.log('call: fetchInstructorBasic')
    api_request = `${base_url}/${API_VERSION}/instructor_basic?instructor_id=${instructor_id}`
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
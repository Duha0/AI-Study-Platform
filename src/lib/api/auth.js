/* Auth endpoints. */

import { request } from "./client";

export function register(fullName, email, password) {
  return request("/api/auth/register", {
    method: "POST",
    auth: false,
    body: { full_name: fullName, email, password },
  });
}

export function login(email, password) {
  return request("/api/auth/login", {
    method: "POST",
    auth: false,
    body: { email, password },
  });
}

export function fetchMe() {
  return request("/api/auth/me");
}

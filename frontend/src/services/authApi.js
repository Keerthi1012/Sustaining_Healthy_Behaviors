import { request } from "./apiClient";

export async function registerAccount({
    username,
    password,
    displayName,
}) {
    return request("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({
            username,
            password,
            display_name: displayName || null,
        }),
    });
}

export async function loginAccount({ username, password }) {
    return request("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ username, password }),
    });
}

export async function getCurrentUser(token) {
    return request("/api/auth/me", { token });
}

export async function logoutAccount(token) {
    return request("/api/auth/logout", {
        method: "POST",
        token,
    });
}

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "").replace(
    /\/$/,
    ""
);

async function request(path, options = {}) {
    const { token, headers, ...fetchOptions } = options;
    const response = await fetch(`${API_BASE_URL}${path}`, {
        ...fetchOptions,
        headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...(headers ?? {}),
        },
    });

    const contentType = response.headers.get("content-type") ?? "";
    const data = contentType.includes("application/json")
        ? await response.json()
        : null;

    if (!response.ok) {
        const detail =
            typeof data?.detail === "string"
                ? data.detail
                : "The service could not complete that request.";
        const error = new Error(detail);
        error.status = response.status;
        error.data = data;
        throw error;
    }

    return data;
}

export { request };

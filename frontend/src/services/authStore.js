const SESSION_KEY = "sproutly.auth.v1";

export function isValidSession(session) {
    return Boolean(
        session?.token &&
            session?.user?.user_id &&
            session?.user?.username
    );
}

export function loadSession() {
    try {
        const raw = window.localStorage.getItem(SESSION_KEY);
        if (!raw) return null;

        const session = JSON.parse(raw);
        if (!isValidSession(session)) {
            window.localStorage.removeItem(SESSION_KEY);
            return null;
        }

        return session;
    } catch {
        return null;
    }
}

export function saveSession(session) {
    if (!isValidSession(session)) return false;

    try {
        window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    } catch {
        return false;
    }
    return true;
}

export function clearSession() {
    try {
        window.localStorage.removeItem(SESSION_KEY);
    } catch {
        return false;
    }
    return true;
}

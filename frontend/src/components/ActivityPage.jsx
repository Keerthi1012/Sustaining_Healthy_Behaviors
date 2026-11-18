
import { useEffect, useState } from "react";

const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

// Temporary development user.
// We'll replace this when user identity is implemented.
const USER_ID = "user_001";

function ActivityPage({ profile, onBack }) {
    const [duration, setDuration] = useState("");
    const [intensity, setIntensity] = useState("unknown");
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    useEffect(() => {
        async function loadActivities() {
            try {
                const response = await fetch(
                    `${API_BASE_URL}/api/users/${USER_ID}/activities`
                );

                if (!response.ok) {
                    throw new Error("Could not load your activity history.");
                }

                const data = await response.json();
                setActivities(data);
            } catch (err) {
                setError(err.message || "Unable to connect to the server.");
            } finally {
                setLoading(false);
            }
        }

        loadActivities();
    }, []);

    async function handleSubmit(event) {
        event.preventDefault();

        const minutes = Number(duration);

        if (!Number.isFinite(minutes) || minutes <= 0) {
            setError("Please enter a valid walking duration.");
            return;
        }

        setSaving(true);
        setError("");
        setSuccess("");

        try {
            const response = await fetch(`${API_BASE_URL}/api/activities`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    user_id: USER_ID,
                    activity_type: "walking",
                    source: "manual",
                    duration_minutes: minutes,
                    intensity,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.detail || "We couldn't save your walking activity."
                );
            }

            setActivities((previous) => [data, ...previous]);
            setDuration("");
            setIntensity("unknown");
            setSuccess("Your walk has been saved. Great job!");
        } catch (err) {
            setError(err.message || "Unable to save your walk.");
        } finally {
            setSaving(false);
        }
    }

    return (
        <main className="activity-page">
            <button type="button" onClick={onBack}>
                ← Back
            </button>

            <header className="activity-header">
                <h1>Your walking adventure 🌱</h1>
                <p>
                    {profile?.goalName
                        ? `Let's make progress with ${profile.goalName.toLowerCase()}.`
                        : "Every small step counts."}
                </p>
            </header>

            <section className="activity-form-section">
                <h2>Log a walk</h2>
                <p>Went for a walk? Tell us how it went.</p>

                <form onSubmit={handleSubmit}>
                    <label htmlFor="duration">How many minutes did you walk?</label>

                    <input
                        id="duration"
                        type="number"
                        min="0.1"
                        step="0.1"
                        value={duration}
                        onChange={(event) => setDuration(event.target.value)}
                        placeholder="e.g. 5"
                        required
                    />

                    <label htmlFor="intensity">How did the walk feel?</label>

                    <select
                        id="intensity"
                        value={intensity}
                        onChange={(event) => setIntensity(event.target.value)}
                    >
                        <option value="unknown">Not sure</option>
                        <option value="light">Light</option>
                        <option value="moderate">Moderate</option>
                        <option value="vigorous">Vigorous</option>
                    </select>

                    <button type="submit" disabled={saving}>
                        {saving ? "Saving..." : "Save my walk"}
                    </button>
                </form>

                {error && <p role="alert">{error}</p>}
                {success && <p role="status">{success}</p>}
            </section>

            <section className="activity-history">
                <h2>Your activity history</h2>

                {loading && <p>Loading your walks...</p>}

                {!loading && activities.length === 0 && (
                    <p>Your first walk is waiting to be recorded!</p>
                )}

                {!loading && activities.length > 0 && (
                    <ul>
                        {activities.map((activity) => (
                            <li key={activity.observation_id}>
                                <strong>🚶 Walking — {activity.duration_minutes} minutes</strong>
                                <span>
                                    {new Date(activity.started_at).toLocaleString()}
                                </span>
                                <span>
                                    Intensity: {activity.intensity}
                                </span>
                            </li>
                        ))}
                    </ul>
                )}
            </section>
        </main>
    );
}

export default ActivityPage;

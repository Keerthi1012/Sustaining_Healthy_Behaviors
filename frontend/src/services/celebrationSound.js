const NOTES = [523.25, 659.25, 783.99];
const NOTE_GAP_SECONDS = 0.09;
const NOTE_LENGTH_SECONDS = 0.45;
const PEAK_GAIN = 0.06;

let audioContext = null;

function getAudioContext() {
    if (typeof window === "undefined") return null;

    const AudioContextClass =
        window.AudioContext ?? window.webkitAudioContext;

    if (!AudioContextClass) return null;

    if (!audioContext) {
        try {
            audioContext = new AudioContextClass();
        } catch {
            return null;
        }
    }

    return audioContext;
}

export function playCompletionChime({ enabled = true } = {}) {
    if (!enabled) return false;

    const context = getAudioContext();
    if (!context) return false;

    try {
        if (context.state === "suspended" && context.resume) {
            context.resume();
        }

        const start = context.currentTime;

        NOTES.forEach((frequency, index) => {
            const oscillator = context.createOscillator();
            const gain = context.createGain();
            const noteStart = start + index * NOTE_GAP_SECONDS;

            oscillator.type = "sine";
            oscillator.frequency.value = frequency;

            gain.gain.setValueAtTime(0.0001, noteStart);
            gain.gain.exponentialRampToValueAtTime(
                PEAK_GAIN,
                noteStart + 0.03
            );
            gain.gain.exponentialRampToValueAtTime(
                0.0001,
                noteStart + NOTE_LENGTH_SECONDS - 0.03
            );

            oscillator.connect(gain);
            gain.connect(context.destination);
            oscillator.start(noteStart);
            oscillator.stop(noteStart + NOTE_LENGTH_SECONDS);

            oscillator.onended = () => {
                oscillator.disconnect();
                gain.disconnect();
            };
        });

        return true;
    } catch {
        return false;
    }
}

export function resetCompletionSound() {
    audioContext = null;
}

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
    playCompletionChime,
    resetCompletionSound,
} from "./celebrationSound";

function createFakeAudioContext() {
    const oscillators = [];
    const gains = [];

    const context = {
        state: "suspended",
        currentTime: 0,
        destination: {},
        resume: vi.fn(() => {
            context.state = "running";
            return Promise.resolve();
        }),
        createOscillator: vi.fn(() => {
            const oscillator = {
                type: "",
                frequency: { value: 0 },
                connect: vi.fn(),
                disconnect: vi.fn(),
                start: vi.fn(),
                stop: vi.fn(),
                onended: null,
            };
            oscillators.push(oscillator);
            return oscillator;
        }),
        createGain: vi.fn(() => {
            const gain = {
                gain: {
                    setValueAtTime: vi.fn(),
                    exponentialRampToValueAtTime: vi.fn(),
                },
                connect: vi.fn(),
                disconnect: vi.fn(),
            };
            gains.push(gain);
            return gain;
        }),
    };

    return { context, oscillators, gains };
}

describe("celebration sound", () => {
    beforeEach(() => {
        resetCompletionSound();
    });

    afterEach(() => {
        vi.unstubAllGlobals();
        resetCompletionSound();
    });

    it("does nothing when the browser has no audio support", () => {
        vi.stubGlobal("AudioContext", undefined);
        vi.stubGlobal("webkitAudioContext", undefined);

        expect(playCompletionChime()).toBe(false);
    });

    it("does not create audio when the preference is off", () => {
        const fake = createFakeAudioContext();
        vi.stubGlobal("AudioContext", vi.fn(function FakeAudioContext() { return fake.context; }));

        expect(playCompletionChime({ enabled: false })).toBe(false);
        expect(fake.context.createOscillator).not.toHaveBeenCalled();
    });

    it("plays a short three-note chime and resumes a suspended context", () => {
        const fake = createFakeAudioContext();
        vi.stubGlobal("AudioContext", vi.fn(function FakeAudioContext() { return fake.context; }));

        expect(playCompletionChime()).toBe(true);
        expect(fake.context.resume).toHaveBeenCalled();
        expect(fake.oscillators).toHaveLength(3);
        expect(fake.gains).toHaveLength(3);
        expect(fake.oscillators[0].start).toHaveBeenCalled();
        expect(fake.oscillators[0].stop).toHaveBeenCalled();
        expect(
            fake.gains[0].gain.exponentialRampToValueAtTime
        ).toHaveBeenCalled();
    });

    it("fails quietly when the audio context cannot be created", () => {
        vi.stubGlobal("AudioContext", vi.fn(function BrokenAudioContext() { throw new Error("nope"); }));

        expect(playCompletionChime()).toBe(false);
    });
});

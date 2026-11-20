import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
    plugins: [react()],
    test: {
        environment: "jsdom",
        setupFiles: ["./src/test/setup.js"],
        env: {
            VITE_API_BASE_URL: "",
            VITE_USE_BACKEND_JOURNEY: "false",
            VITE_USE_BACKEND_PROGRESSION: "false",
        },
        restoreMocks: true,
        testTimeout: 10000,
    },
});

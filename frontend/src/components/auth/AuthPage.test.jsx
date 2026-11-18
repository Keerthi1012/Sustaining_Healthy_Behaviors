import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AuthPage from "./AuthPage";
import { loginAccount, registerAccount } from "../../services/authApi";

vi.mock("../../services/authApi", () => ({
    loginAccount: vi.fn(),
    registerAccount: vi.fn(),
}));

const session = {
    token: "demo-token",
    user: {
        user_id: "user-1",
        username: "alice",
        display_name: "Alice",
    },
};

describe("AuthPage", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("signs in with a username and password", async () => {
        loginAccount.mockResolvedValue(session);
        const onAuthenticated = vi.fn();
        const user = userEvent.setup();

        render(<AuthPage onAuthenticated={onAuthenticated} />);

        await user.type(screen.getByLabelText("Username"), "alice");
        await user.type(screen.getByLabelText("Password"), "gentle-steps");
        await user.click(
            screen.getByRole("button", { name: /Sign in to Sproutly/i })
        );

        await waitFor(() => {
            expect(loginAccount).toHaveBeenCalledWith({
                username: "alice",
                password: "gentle-steps",
            });
        });
        expect(onAuthenticated).toHaveBeenCalledWith(session);
    });

    it("registers an account with an optional display name", async () => {
        registerAccount.mockResolvedValue(session);
        const onAuthenticated = vi.fn();
        const user = userEvent.setup();

        render(<AuthPage onAuthenticated={onAuthenticated} />);

        await user.click(
            screen.getByRole("button", { name: "Create account" })
        );
        await user.type(screen.getByLabelText("Username"), "alice");
        await user.type(
            screen.getByLabelText(/Name to greet you by/i),
            "Alice"
        );
        await user.type(screen.getByLabelText("Password"), "gentle-steps");
        await user.type(
            screen.getByLabelText("Confirm password"),
            "gentle-steps"
        );
        await user.click(
            screen.getByRole("button", { name: /Create my account/i })
        );

        await waitFor(() => {
            expect(registerAccount).toHaveBeenCalledWith({
                username: "alice",
                password: "gentle-steps",
                displayName: "Alice",
            });
        });
        expect(onAuthenticated).toHaveBeenCalledWith(session);
    });

    it("keeps mismatched passwords from being submitted", async () => {
        const user = userEvent.setup();

        render(<AuthPage onAuthenticated={vi.fn()} />);

        await user.click(
            screen.getByRole("button", { name: "Create account" })
        );
        await user.type(screen.getByLabelText("Username"), "alice");
        await user.type(screen.getByLabelText("Password"), "gentle-steps");
        await user.type(
            screen.getByLabelText("Confirm password"),
            "different-steps"
        );
        await user.click(
            screen.getByRole("button", { name: /Create my account/i })
        );

        expect(
            screen.getByRole("alert")
        ).toHaveTextContent(/passwords do not match/i);
        expect(registerAccount).not.toHaveBeenCalled();
    });

    it("shows the service error when sign-in fails", async () => {
        loginAccount.mockRejectedValue(
            new Error("That username and password do not match")
        );
        const user = userEvent.setup();

        render(<AuthPage onAuthenticated={vi.fn()} />);

        await user.type(screen.getByLabelText("Username"), "alice");
        await user.type(screen.getByLabelText("Password"), "wrong-password");
        await user.click(
            screen.getByRole("button", { name: /Sign in to Sproutly/i })
        );

        expect(await screen.findByRole("alert")).toHaveTextContent(
            "That username and password do not match"
        );
    });

    it("shows a quiet loading state while restoring a session", () => {
        render(<AuthPage checking />);

        expect(
            screen.getByRole("heading", { name: /Opening your world/i })
        ).toBeInTheDocument();
        expect(
            screen.queryByLabelText("Username")
        ).not.toBeInTheDocument();
    });
});

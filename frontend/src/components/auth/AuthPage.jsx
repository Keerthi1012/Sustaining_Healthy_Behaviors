import { useState } from "react";
import {
    ArrowRight,
    LoaderCircle,
    ShieldCheck,
    Sprout,
} from "lucide-react";

import CompanionPair from "../companion/CompanionPair";
import MeadowScene from "../world/MeadowScene";
import LanguageSwitch from "../ui/LanguageSwitch";
import { useI18n } from "../../i18n";
import { loginAccount, registerAccount } from "../../services/authApi";
import "./AuthPage.css";

const USERNAME_PATTERN = /^[A-Za-z0-9_]{3,24}$/;

function AuthPage({ checking = false, onAuthenticated }) {
    const { t } = useI18n();
    const [mode, setMode] = useState("login");
    const [username, setUsername] = useState("");
    const [displayName, setDisplayName] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    const isRegistering = mode === "register";

    const switchMode = (nextMode) => {
        setMode(nextMode);
        setError(null);
        setPassword("");
        setConfirmPassword("");
    };

    const validate = () => {
        const cleanUsername = username.trim();

        if (!cleanUsername) {
            return "auth.errors.usernameRequired";
        }

        if (isRegistering && !USERNAME_PATTERN.test(cleanUsername)) {
            return "auth.errors.usernameFormat";
        }

        if (!password) {
            return "auth.errors.passwordRequired";
        }

        if (isRegistering && password.length < 8) {
            return "auth.errors.passwordLength";
        }

        if (isRegistering && password !== confirmPassword) {
            return "auth.errors.passwordMismatch";
        }

        return "";
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        const validationKey = validate();

        if (validationKey) {
            setError({ key: validationKey });
            return;
        }

        setError(null);
        setSubmitting(true);

        try {
            const session = isRegistering
                ? await registerAccount({
                      username: username.trim(),
                      password,
                      displayName: displayName.trim(),
                  })
                : await loginAccount({
                      username: username.trim(),
                      password,
                  });

            onAuthenticated(session);
        } catch (requestError) {
            setError({
                message:
                    requestError?.message ?? t("auth.errors.generic"),
            });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <main className="auth-page">
            <nav className="auth-nav" aria-label={t("auth.navLabel")}>
                <div className="auth-brand">
                    <span className="auth-brand__icon" aria-hidden="true">
                        <Sprout size={20} />
                    </span>
                    <span>{t("auth.navLabel")}</span>
                </div>
                <div className="auth-nav__end">
                    <span className="auth-nav__tagline">
                        {t("auth.tagline")}
                    </span>
                    <LanguageSwitch />
                </div>
            </nav>

            <section className="auth-shell">
                <div className="auth-panel">
                    <p className="eyebrow">
                        {checking
                            ? t("auth.checking.eyebrow")
                            : isRegistering
                              ? t("auth.register.eyebrow")
                              : t("auth.login.eyebrow")}
                    </p>

                    <h1>
                        {checking
                            ? t("auth.checking.title")
                            : isRegistering
                              ? t("auth.register.title")
                              : t("auth.login.title")}
                    </h1>

                    <p className="auth-lead">
                        {checking
                            ? t("auth.checking.lead")
                            : isRegistering
                              ? t("auth.register.lead")
                              : t("auth.login.lead")}
                    </p>

                    {checking ? (
                        <div className="auth-checking" role="status">
                            <LoaderCircle
                                size={22}
                                aria-hidden="true"
                                className="auth-checking__spinner"
                            />
                            <span>{t("auth.checking.status")}</span>
                        </div>
                    ) : (
                        <>
                            <div
                                className="auth-switch"
                                aria-label={t("auth.switchLabel")}
                            >
                                <button
                                    type="button"
                                    aria-pressed={!isRegistering}
                                    onClick={() => switchMode("login")}
                                >
                                    {t("auth.signIn")}
                                </button>
                                <button
                                    type="button"
                                    aria-pressed={isRegistering}
                                    onClick={() => switchMode("register")}
                                >
                                    {t("auth.createAccount")}
                                </button>
                            </div>

                            <form className="auth-form" onSubmit={handleSubmit} noValidate>
                                <div className="auth-field">
                                    <label htmlFor="auth-username">
                                        {t("auth.username")}
                                    </label>
                                    <input
                                        id="auth-username"
                                        name="username"
                                        type="text"
                                        value={username}
                                        onChange={(event) => setUsername(event.target.value)}
                                        autoComplete="username"
                                        maxLength={24}
                                        aria-describedby={
                                            isRegistering ? "auth-username-help" : undefined
                                        }
                                        required
                                    />
                                    {isRegistering && (
                                        <p className="auth-help" id="auth-username-help">
                                            {t("auth.usernameHelp")}
                                        </p>
                                    )}
                                </div>

                                {isRegistering && (
                                    <div className="auth-field">
                                        <label htmlFor="auth-display-name">
                                            {t("auth.displayName")}
                                            <span>{t("common.optional")}</span>
                                        </label>
                                        <input
                                            id="auth-display-name"
                                            name="displayName"
                                            type="text"
                                            value={displayName}
                                            onChange={(event) => setDisplayName(event.target.value)}
                                            autoComplete="nickname"
                                            maxLength={40}
                                        />
                                    </div>
                                )}

                                <div className="auth-field">
                                    <label htmlFor="auth-password">
                                        {t("auth.password")}
                                    </label>
                                    <input
                                        id="auth-password"
                                        name="password"
                                        type="password"
                                        value={password}
                                        onChange={(event) => setPassword(event.target.value)}
                                        autoComplete={
                                            isRegistering ? "new-password" : "current-password"
                                        }
                                        maxLength={128}
                                        required
                                    />
                                    {isRegistering && (
                                        <p className="auth-help">
                                            {t("auth.passwordHelp")}
                                        </p>
                                    )}
                                </div>

                                {isRegistering && (
                                    <div className="auth-field">
                                        <label htmlFor="auth-confirm-password">
                                            {t("auth.confirmPassword")}
                                        </label>
                                        <input
                                            id="auth-confirm-password"
                                            name="confirmPassword"
                                            type="password"
                                            value={confirmPassword}
                                            onChange={(event) =>
                                                setConfirmPassword(event.target.value)
                                            }
                                            autoComplete="new-password"
                                            maxLength={128}
                                            required
                                        />
                                    </div>
                                )}

                                {error && (
                                    <div className="auth-error" role="alert">
                                        {error.key
                                            ? t(error.key)
                                            : error.message}
                                    </div>
                                )}

                                <button
                                    className="auth-submit"
                                    type="submit"
                                    disabled={submitting}
                                >
                                    {submitting
                                        ? t("common.pleaseWait")
                                        : isRegistering
                                          ? t("auth.submitRegister")
                                          : t("auth.submitLogin")}
                                    {!submitting && (
                                        <ArrowRight
                                            className="icon-directional"
                                            size={18}
                                            aria-hidden="true"
                                        />
                                    )}
                                </button>
                            </form>

                            <p className="auth-privacy">
                                <ShieldCheck size={15} aria-hidden="true" />
                                {t("auth.privacy")}
                            </p>
                        </>
                    )}
                </div>

                <aside className="auth-art">
                    <MeadowScene growth={0.55} />
                    <div className="auth-art__shade" aria-hidden="true" />
                    <div className="auth-art__note">
                        <span className="eyebrow">
                            {t("auth.artEyebrow")}
                        </span>
                        <p>{t("auth.artNote")}</p>
                    </div>
                    <CompanionPair
                        heartSize={138}
                        mindSize={138}
                        heartExpression="happy"
                        mindExpression="welcome"
                        className="companion-pair--floating"
                    />
                </aside>
            </section>

            <footer className="auth-footer">
                <p>{t("auth.footer")}</p>
            </footer>
        </main>
    );
}

export default AuthPage;

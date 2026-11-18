import { useEffect, useRef, useState } from "react";
import { ChevronDown, LogOut } from "lucide-react";
import "./UserMenu.css";

function getInitials(name) {
    return name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0])
        .join("")
        .toUpperCase();
}

function UserMenu({ user, onLogout }) {
    const [open, setOpen] = useState(false);
    const rootRef = useRef(null);
    const triggerRef = useRef(null);

    useEffect(() => {
        if (!open) return undefined;

        const handlePointerDown = (event) => {
            if (!rootRef.current?.contains(event.target)) {
                setOpen(false);
            }
        };

        const handleKeyDown = (event) => {
            if (event.key === "Escape") {
                setOpen(false);
                triggerRef.current?.focus();
            }
        };

        document.addEventListener("pointerdown", handlePointerDown);
        document.addEventListener("keydown", handleKeyDown);

        return () => {
            document.removeEventListener("pointerdown", handlePointerDown);
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [open]);

    if (!user) return null;

    const displayName = user.display_name || user.username;

    const handleLogout = () => {
        setOpen(false);
        onLogout();
    };

    return (
        <div className="account-menu" ref={rootRef}>
            <button
                className="account-menu__trigger"
                type="button"
                ref={triggerRef}
                aria-haspopup="menu"
                aria-expanded={open}
                aria-label={`Account menu for ${displayName}`}
                onClick={() => setOpen((current) => !current)}
            >
                <span className="account-menu__avatar" aria-hidden="true">
                    {getInitials(displayName)}
                </span>
                <span className="account-menu__name">{displayName}</span>
                <ChevronDown
                    size={14}
                    aria-hidden="true"
                    className={`account-menu__chevron ${open ? "account-menu__chevron--open" : ""}`}
                />
            </button>

            {open && (
                <div className="account-menu__panel" role="menu" aria-label="Account">
                    <div className="account-menu__identity" role="presentation">
                        <strong>{displayName}</strong>
                        <span>@{user.username}</span>
                    </div>
                    <button
                        className="account-menu__logout"
                        type="button"
                        role="menuitem"
                        onClick={handleLogout}
                    >
                        <LogOut size={16} aria-hidden="true" />
                        Log out
                    </button>
                </div>
            )}
        </div>
    );
}

export default UserMenu;

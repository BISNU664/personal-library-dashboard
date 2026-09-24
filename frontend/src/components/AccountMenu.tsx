import { useEffect, useRef, useState } from "react";
import type { User } from "../api";
import AuthForm from "./AuthForm";
import Modal from "./Modal";

interface AccountMenuProps {
  user: User;
  onLogOut: () => void;
  onLogOutEverywhere: () => void;
  onUserUpdated: (user: User) => void;
}

/** Avatar button that opens the reader's account options. */
function AccountMenu({
  user,
  onLogOut,
  onLogOutEverywhere,
  onUserUpdated,
}: AccountMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on a click outside the menu or on Escape.
  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setIsOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const handleLogOut = () => {
    // A guest has no password, so logging out means losing the library for good.
    if (
      user.is_guest &&
      !window.confirm(
        "Log out of the guest account? You won't be able to get back into this library. Create an account first to keep it."
      )
    ) {
      return;
    }
    onLogOut();
  };

  const initial = user.display_name.charAt(0).toUpperCase();

  return (
    <div className="account-menu" ref={menuRef}>
      <button
        type="button"
        className="account-avatar"
        aria-label="Account"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((open) => !open)}
      >
        {initial}
      </button>

      {isOpen && (
        <div className="account-popover" role="menu">
          <div className="account-summary">
            <span className="account-avatar large" aria-hidden="true">
              {initial}
            </span>
            <div>
              <strong>{user.display_name}</strong>
              <span>{user.is_guest ? "Guest account" : user.email}</span>
            </div>
          </div>

          {user.is_guest && (
            <>
              <p className="account-guest-note">
                Your library is only saved on this browser. Create an account
                to keep it.
              </p>
              <button
                type="button"
                role="menuitem"
                className="account-primary-item"
                onClick={() => {
                  setIsOpen(false);
                  setIsUpgrading(true);
                }}
              >
                Create account to keep your library
              </button>
            </>
          )}

          <button type="button" role="menuitem" onClick={handleLogOut}>
            Log out
          </button>
          {!user.is_guest && (
            <button type="button" role="menuitem" onClick={onLogOutEverywhere}>
              Log out of all devices
            </button>
          )}
        </div>
      )}

      {isUpgrading && (
        <Modal labelledBy="upgrade-title" onClose={() => setIsUpgrading(false)}>
          <h2 id="upgrade-title">Create your account</h2>
          <p className="modal-intro">
            Everything in your guest library comes with you.
          </p>
          <AuthForm
            isUpgrade
            onAuthenticated={(updated) => {
              setIsUpgrading(false);
              onUserUpdated(updated);
            }}
          />
        </Modal>
      )}
    </div>
  );
}

export default AccountMenu;

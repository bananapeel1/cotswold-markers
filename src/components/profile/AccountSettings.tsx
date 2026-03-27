"use client";

import { useState } from "react";
import {
  updateProfile,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
  GoogleAuthProvider,
  linkWithPopup,
  unlink,
  signOut,
  type User,
} from "firebase/auth";
import { auth } from "@/lib/firebase-client";

interface AccountSettingsProps {
  user: User;
}

export default function AccountSettings({ user }: AccountSettingsProps) {
  const [displayName, setDisplayName] = useState(user.displayName || "");
  const [saving, setSaving] = useState(false);
  const [nameSuccess, setNameSuccess] = useState(false);

  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [pwError, setPwError] = useState("");
  const [pwSuccess, setPwSuccess] = useState(false);
  const [changingPw, setChangingPw] = useState(false);

  const [exporting, setExporting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [linkingGoogle, setLinkingGoogle] = useState(false);

  const hasPassword = user.providerData.some((p) => p.providerId === "password");
  const hasGoogle = user.providerData.some((p) => p.providerId === "google.com");

  async function handleUpdateName() {
    if (!displayName.trim()) return;
    setSaving(true);
    setNameSuccess(false);
    try {
      await updateProfile(user, { displayName: displayName.trim() });
      // Also update Firestore via API
      await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName: displayName.trim() }),
      });
      setNameSuccess(true);
      setTimeout(() => setNameSuccess(false), 3000);
    } catch {
      // silent
    }
    setSaving(false);
  }

  async function handleChangePassword() {
    if (!currentPw || !newPw) return;
    if (newPw.length < 6) {
      setPwError("Password must be at least 6 characters");
      return;
    }
    setChangingPw(true);
    setPwError("");
    setPwSuccess(false);
    try {
      const credential = EmailAuthProvider.credential(user.email!, currentPw);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPw);
      setPwSuccess(true);
      setCurrentPw("");
      setNewPw("");
      setTimeout(() => setPwSuccess(false), 3000);
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code;
      if (code === "auth/wrong-password" || code === "auth/invalid-credential") {
        setPwError("Current password is incorrect");
      } else {
        setPwError("Failed to change password");
      }
    }
    setChangingPw(false);
  }

  async function handleLinkGoogle() {
    setLinkingGoogle(true);
    try {
      await linkWithPopup(user, new GoogleAuthProvider());
      window.location.reload();
    } catch {
      setLinkingGoogle(false);
    }
  }

  async function handleUnlinkGoogle() {
    if (!hasPassword) {
      alert("You need a password login before unlinking Google. Set a password first.");
      return;
    }
    try {
      await unlink(user, "google.com");
      window.location.reload();
    } catch {
      // silent
    }
  }

  async function handleExportData() {
    setExporting(true);
    try {
      const res = await fetch("/api/user/profile?export=true");
      const data = await res.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `trailtap-data-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // silent
    }
    setExporting(false);
  }

  async function handleDeleteAccount() {
    setDeleting(true);
    try {
      // Delete server-side data first
      await fetch("/api/user/profile", { method: "DELETE" });
      // Delete Firebase Auth account
      await user.delete();
      window.location.href = "/";
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code;
      if (code === "auth/requires-recent-login") {
        alert("For security, please sign out, sign back in, and try again.");
      }
      setDeleting(false);
    }
  }

  async function handleSignOut() {
    // Clear session cookie
    await fetch("/api/auth/session", { method: "DELETE" });
    await signOut(auth);
    window.location.href = "/";
  }

  return (
    <div className="space-y-5">
      {/* Display Name */}
      <div className="bg-surface-container-lowest rounded-lg p-5 shadow-ambient">
        <div className="flex items-center gap-2 mb-4">
          <span className="material-symbols-outlined text-primary text-base">badge</span>
          <h2 className="font-headline font-bold text-primary text-lg">Display Name</h2>
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="flex-1 bg-surface-container border border-outline-variant/20 rounded-md px-3 py-2 text-sm"
            placeholder="Your trail name"
            maxLength={50}
          />
          <button
            onClick={handleUpdateName}
            disabled={saving || !displayName.trim()}
            className="bg-primary text-on-primary px-4 py-2 rounded-md text-sm font-bold active:scale-95 transition-transform disabled:opacity-50"
          >
            {saving ? "..." : "Save"}
          </button>
        </div>
        {nameSuccess && (
          <p className="text-xs text-primary mt-2 flex items-center gap-1">
            <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
            Name updated
          </p>
        )}
      </div>

      {/* Password */}
      {hasPassword && (
        <div className="bg-surface-container-lowest rounded-lg p-5 shadow-ambient">
          <div className="flex items-center gap-2 mb-4">
            <span className="material-symbols-outlined text-primary text-base">lock</span>
            <h2 className="font-headline font-bold text-primary text-lg">Change Password</h2>
          </div>
          <div className="space-y-3">
            <input
              type="password"
              value={currentPw}
              onChange={(e) => setCurrentPw(e.target.value)}
              className="w-full bg-surface-container border border-outline-variant/20 rounded-md px-3 py-2 text-sm"
              placeholder="Current password"
            />
            <input
              type="password"
              value={newPw}
              onChange={(e) => setNewPw(e.target.value)}
              className="w-full bg-surface-container border border-outline-variant/20 rounded-md px-3 py-2 text-sm"
              placeholder="New password (min 6 characters)"
            />
            {pwError && <p className="text-xs text-error">{pwError}</p>}
            {pwSuccess && (
              <p className="text-xs text-primary flex items-center gap-1">
                <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                Password changed
              </p>
            )}
            <button
              onClick={handleChangePassword}
              disabled={changingPw || !currentPw || !newPw}
              className="bg-primary text-on-primary px-4 py-2 rounded-md text-sm font-bold active:scale-95 transition-transform disabled:opacity-50"
            >
              {changingPw ? "Changing..." : "Change Password"}
            </button>
          </div>
        </div>
      )}

      {/* Linked Accounts */}
      <div className="bg-surface-container-lowest rounded-lg p-5 shadow-ambient">
        <div className="flex items-center gap-2 mb-4">
          <span className="material-symbols-outlined text-primary text-base">link</span>
          <h2 className="font-headline font-bold text-primary text-lg">Linked Accounts</h2>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-surface-container rounded-md">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              <span className="text-sm font-bold">Google</span>
            </div>
            {hasGoogle ? (
              <button
                onClick={handleUnlinkGoogle}
                className="text-xs text-secondary bg-surface-variant px-3 py-1.5 rounded-md active:scale-95 transition-transform"
              >
                Unlink
              </button>
            ) : (
              <button
                onClick={handleLinkGoogle}
                disabled={linkingGoogle}
                className="text-xs text-primary font-bold bg-primary-fixed px-3 py-1.5 rounded-md active:scale-95 transition-transform"
              >
                {linkingGoogle ? "Linking..." : "Link"}
              </button>
            )}
          </div>
          {hasPassword && (
            <div className="flex items-center justify-between p-3 bg-surface-container rounded-md">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-lg">mail</span>
                <span className="text-sm font-bold">Email &amp; Password</span>
              </div>
              <span className="text-xs text-primary font-bold flex items-center gap-1">
                <span className="material-symbols-outlined text-xs" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                Active
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Data & Privacy */}
      <div className="bg-surface-container-lowest rounded-lg p-5 shadow-ambient">
        <div className="flex items-center gap-2 mb-4">
          <span className="material-symbols-outlined text-primary text-base">shield</span>
          <h2 className="font-headline font-bold text-primary text-lg">Data &amp; Privacy</h2>
        </div>
        <div className="space-y-2">
          <button
            onClick={handleExportData}
            disabled={exporting}
            className="w-full flex items-center gap-3 p-3 bg-surface-container rounded-md text-left active:scale-[0.98] transition-transform"
          >
            <span className="material-symbols-outlined text-primary text-lg">download</span>
            <div>
              <p className="text-sm font-bold">{exporting ? "Exporting..." : "Export My Data"}</p>
              <p className="text-[10px] text-secondary">Download all your scans, badges, and journal entries as JSON</p>
            </div>
          </button>

          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 p-3 bg-surface-container rounded-md text-left active:scale-[0.98] transition-transform"
          >
            <span className="material-symbols-outlined text-secondary text-lg">logout</span>
            <p className="text-sm font-bold text-secondary">Sign Out</p>
          </button>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-surface-container-lowest rounded-lg p-5 shadow-ambient border border-error/20">
        <div className="flex items-center gap-2 mb-4">
          <span className="material-symbols-outlined text-error text-base">warning</span>
          <h2 className="font-headline font-bold text-error text-lg">Danger Zone</h2>
        </div>
        {!showDeleteConfirm ? (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="w-full flex items-center gap-3 p-3 bg-error/5 rounded-md text-left active:scale-[0.98] transition-transform"
          >
            <span className="material-symbols-outlined text-error text-lg">delete_forever</span>
            <div>
              <p className="text-sm font-bold text-error">Delete Account</p>
              <p className="text-[10px] text-secondary">Permanently delete your account and all data</p>
            </div>
          </button>
        ) : (
          <div className="p-4 bg-error/5 rounded-md">
            <p className="text-sm font-bold text-error mb-2">Are you sure?</p>
            <p className="text-xs text-secondary mb-4">
              This will permanently delete your account, all scans, badges, journal entries, and friend connections. This cannot be undone.
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleDeleteAccount}
                disabled={deleting}
                className="flex-1 bg-error text-on-error py-2.5 rounded-md text-sm font-bold active:scale-95 transition-transform disabled:opacity-50"
              >
                {deleting ? "Deleting..." : "Yes, Delete Everything"}
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 bg-surface-container py-2.5 rounded-md text-sm font-bold active:scale-95 transition-transform"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import { useAuth } from "@/contexts/AuthContext";

export default function LogoutButton() {
  const { signOutUser } = useAuth();

  return (
    <button
      onClick={async () => {
        await signOutUser();
        window.location.href = "/login";
      }}
      className="p-2 rounded-full hover:bg-surface-container transition-colors active:scale-95"
      title="Sign out"
    >
      <span className="material-symbols-outlined text-secondary">logout</span>
    </button>
  );
}

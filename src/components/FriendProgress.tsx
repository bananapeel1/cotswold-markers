"use client";

import { useState } from "react";
import { useFriends } from "@/hooks/useFriends";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "@/lib/firebase-client";
import { useEffect } from "react";

export default function FriendProgress({ userScanCount, userBadgeCount }: { userScanCount: number; userBadgeCount: number }) {
  const { friends, loading } = useFriends();
  const [user, setUser] = useState<User | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return unsub;
  }, []);

  if (!user) return null;

  const inviteLink = `${typeof window !== "undefined" ? window.location.origin : ""}/signup?ref=${user.uid}`;

  function copyLink() {
    navigator.clipboard.writeText(inviteLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function shareLink() {
    if (navigator.share) {
      navigator.share({
        title: "Walk the Cotswold Way with me!",
        text: "Join me on the Cotswold Way trail. Track your progress and earn badges!",
        url: inviteLink,
      });
    } else {
      copyLink();
    }
  }

  return (
    <div className="bg-surface-container-low rounded-xl p-5">
      <h2 className="font-headline font-bold text-primary text-lg mb-4 flex items-center gap-2">
        <span className="material-symbols-outlined text-base">group</span>
        Trail Buddies
      </h2>

      {/* Invite link */}
      <div className="bg-surface-container rounded-lg p-4 mb-4">
        <p className="text-xs text-secondary mb-2">Invite a friend to walk with you</p>
        <div className="flex gap-2">
          <button
            onClick={copyLink}
            className="flex-1 bg-primary-fixed text-on-primary-fixed px-4 py-2.5 rounded-full text-xs font-bold flex items-center justify-center gap-2 active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined text-sm">
              {copied ? "check" : "content_copy"}
            </span>
            {copied ? "Copied!" : "Copy Link"}
          </button>
          <button
            onClick={shareLink}
            className="bg-primary text-on-primary px-4 py-2.5 rounded-full text-xs font-bold flex items-center justify-center gap-2 active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined text-sm">share</span>
            Share
          </button>
        </div>
      </div>

      {/* Friends list */}
      {loading ? (
        <div className="animate-pulse space-y-2">
          <div className="h-12 bg-surface-container rounded-lg" />
          <div className="h-12 bg-surface-container rounded-lg" />
        </div>
      ) : friends.length === 0 ? (
        <p className="text-sm text-secondary italic text-center py-4">
          No trail buddies yet. Share your invite link to get started!
        </p>
      ) : (
        <div className="space-y-3">
          {friends.map((friend) => (
            <div key={friend.uid} className="bg-surface-container rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-bold">{friend.name}</p>
                {friend.isComplete && (
                  <span className="text-[10px] font-bold text-primary bg-primary-fixed px-2 py-0.5 rounded-full">Complete</span>
                )}
              </div>
              {/* Comparison bars */}
              <div className="space-y-2">
                <div>
                  <div className="flex justify-between text-[10px] text-secondary mb-1">
                    <span>Markers</span>
                    <span>{friend.scanCount} vs {userScanCount}</span>
                  </div>
                  <div className="flex gap-1 h-2">
                    <div className="flex-1 bg-surface-variant rounded-full overflow-hidden">
                      <div className="h-full bg-tertiary rounded-full" style={{ width: `${(friend.scanCount / 50) * 100}%` }} />
                    </div>
                    <div className="flex-1 bg-surface-variant rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: `${(userScanCount / 50) * 100}%` }} />
                    </div>
                  </div>
                  <div className="flex justify-between text-[8px] text-secondary mt-0.5">
                    <span>{friend.name}</span>
                    <span>You</span>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-[10px] text-secondary mb-1">
                    <span>Badges</span>
                    <span>{friend.badgeCount} vs {userBadgeCount}</span>
                  </div>
                  <div className="flex gap-1 h-2">
                    <div className="flex-1 bg-surface-variant rounded-full overflow-hidden">
                      <div className="h-full bg-tertiary rounded-full" style={{ width: `${(friend.badgeCount / 17) * 100}%` }} />
                    </div>
                    <div className="flex-1 bg-surface-variant rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: `${(userBadgeCount / 17) * 100}%` }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

import React, { FormEvent, useEffect, useState } from "react";
import { PlayerProgress, saveDisplayName } from "../../domain/progress";
import { useAuth } from "../../hooks/useAuth";
import { supabase } from "../../lib/supabase";
import { synchronizeLocalHistory } from "../../domain/cloudProgress";
import { Panel } from "./Panel";

interface ProfileProps {
  isOpen: boolean;
  close: () => void;
  progress: PlayerProgress;
  onChange: (progress: PlayerProgress) => void;
}

export function Profile({ isOpen, close, progress, onChange }: ProfileProps) {
  const [name, setName] = useState(progress.displayName);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { session, isLoading } = useAuth();

  useEffect(() => {
    if (!session?.user) return;

    supabase
      .from("profiles")
      .select("display_name")
      .eq("id", session.user.id)
      .single()
      .then(async ({ data }) => {
        if (data?.display_name) {
          setName(data.display_name);
          try {
            const cloudProgress = await synchronizeLocalHistory(
              session.user.id,
              data.display_name
            );
            onChange(cloudProgress);
            setMessage("Your scores and game history are synced.");
          } catch {
            onChange(saveDisplayName(data.display_name));
            setMessage(
              "Signed in, but cloud history could not sync. Your device copy is safe."
            );
          }
        }
      });
  }, [session?.user, onChange]);

  async function handleAuthentication(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setMessage("");

    const result =
      authMode === "signup"
        ? await supabase.auth.signUp({
            email,
            password,
            options: {
              data: { display_name: name.trim() || "MelBurb Player" },
              emailRedirectTo: "https://www.melburb.com/",
            },
          })
        : await supabase.auth.signInWithPassword({ email, password });

    setSubmitting(false);
    setPassword("");

    if (result.error) {
      setMessage(result.error.message);
      return;
    }

    setMessage(
      authMode === "signup" && !result.data.session
        ? "Check your email to confirm your new MelBurb account."
        : "You are signed in. Your player card is now connected."
    );
  }

  async function saveName() {
    const next = saveDisplayName(name);
    onChange(next);

    if (session?.user) {
      const { error } = await supabase
        .from("profiles")
        .update({ display_name: next.displayName })
        .eq("id", session.user.id);
      setMessage(error ? error.message : "Display name saved to your account.");
    }
  }

  async function signOut() {
    const { error } = await supabase.auth.signOut();
    setMessage(error ? error.message : "You are signed out.");
  }

  return (
    <Panel title="Player card" isOpen={isOpen} close={close}>
      {isLoading ? (
        <p className="mb-4 text-sm">Checking your account…</p>
      ) : session?.user ? (
        <div className="account-status mb-4">
          <span>Signed in</span>
          <strong>{session.user.email}</strong>
          <small>Scores and completed games sync automatically.</small>
          <button className="cafe-button" type="button" onClick={signOut}>
            Sign out
          </button>
        </div>
      ) : (
        <form className="account-form mb-5" onSubmit={handleAuthentication}>
          <div className="account-tabs" role="tablist" aria-label="Account">
            <button
              className={authMode === "signin" ? "active" : ""}
              type="button"
              onClick={() => setAuthMode("signin")}
            >
              Sign in
            </button>
            <button
              className={authMode === "signup" ? "active" : ""}
              type="button"
              onClick={() => setAuthMode("signup")}
            >
              Create account
            </button>
          </div>
          <p className="text-sm text-slate-600 dark:text-stone-300">
            {authMode === "signup"
              ? "Create an account to keep your player identity across devices."
              : "Sign in to reconnect your MelBurb player card."}
          </p>
          <label htmlFor="account-email">Email</label>
          <input
            id="account-email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <label htmlFor="account-password">Password</label>
          <input
            id="account-password"
            type="password"
            autoComplete={
              authMode === "signup" ? "new-password" : "current-password"
            }
            minLength={8}
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          <button className="cafe-button" type="submit" disabled={submitting}>
            {submitting
              ? "Please wait…"
              : authMode === "signup"
              ? "Create account"
              : "Sign in"}
          </button>
        </form>
      )}
      {message && <p className="account-message mb-4">{message}</p>}
      <label className="block font-bold mb-1" htmlFor="display-name">
        Display name
      </label>
      <div className="flex gap-2">
        <input
          id="display-name"
          className="flex-1 rounded border-2 border-stone-500 bg-transparent p-2"
          maxLength={24}
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
        <button className="cafe-button" onClick={saveName} type="button">
          Save
        </button>
      </div>
      <div className="grid grid-cols-3 gap-2 my-6 text-center">
        <ProfileStat value={progress.totalPoints} label="Points" />
        <ProfileStat value={progress.completedGames} label="Games" />
        <ProfileStat value={progress.closeCalls} label="Close calls" />
      </div>
      <h3 className="font-bold uppercase tracking-wider mb-2">Achievements</h3>
      {progress.achievements.length ? (
        <div className="flex flex-wrap gap-2">
          {progress.achievements.map((achievement) => (
            <span className="achievement-chip" key={achievement}>
              ☕ {achievement}
            </span>
          ))}
        </div>
      ) : (
        <p className="text-sm opacity-70">
          Finish a game to earn your first badge.
        </p>
      )}
    </Panel>
  );
}

function ProfileStat({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded border-2 border-stone-500 p-3">
      <div className="text-2xl font-black text-amber-400">{value}</div>
      <div className="text-xs uppercase tracking-wider">{label}</div>
    </div>
  );
}

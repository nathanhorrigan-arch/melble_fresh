import React, { FormEvent, useEffect, useState } from "react";
import { PlayerProgress, saveDisplayName } from "../../domain/progress";
import { useAuth } from "../../hooks/useAuth";
import { supabase } from "../../lib/supabase";
import { synchronizeLocalHistory } from "../../domain/cloudProgress";
import { Panel } from "./Panel";

// Profanity filter - matches database migration
const BLOCKED_TERMS = [
  "fuck",
  "shit",
  "bitch",
  "cunt",
  "nigger",
  "faggot",
  "retard",
  "whore",
  "slut",
  "pussy",
  "dick",
  "cock",
  "asshole",
  "bastard",
  "damn",
  "hell",
  "piss",
  "cum",
  "jizz",
  "twat",
  "crap",
  "wank",
  "fag",
  "dyke",
  "tranny",
  "shemale",
  "kike",
  "spic",
  "chink",
  "gook",
  "wetback",
  "raghead",
  "sandnigger",
  "porchmonkey",
  "coon",
  "nigga",
  "niggah",
  "nigguh",
  "niglet",
  "coonass",
  "honky",
  "cracker",
  "whitey",
  "redneck",
  "hillbilly",
  "trailertrash",
  "nazi",
  "jew",
  "motherfucker",
  "fucker",
  "fucked",
  "fuck_me",
  "fuck me",
  "fuck it",
  "f_u_c_k",
  "c_u_n_t",
  "s_h_i_t",
  "tits",
  "breasts",
  "jugs",
  "knockers",
];

function containsProfanity(text: string): boolean {
  const lower = text.toLowerCase();
  return BLOCKED_TERMS.some((term) => lower.includes(term));
}

interface ProfileProps {
  isOpen: boolean;
  close: () => void;
  progress: PlayerProgress;
  onChange: (progress: PlayerProgress) => void;
  initialAuthMode?: "signin" | "signup";
}

export function Profile({
  isOpen,
  close,
  progress,
  onChange,
  initialAuthMode = "signin",
}: ProfileProps) {
  const [name, setName] = useState(progress.displayName);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const [forgotPasswordMode, setForgotPasswordMode] = useState(false);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [editingDisplayName, setEditingDisplayName] = useState(false);
  const { session, isLoading } = useAuth();

  useEffect(() => {
    if (isOpen && !session?.user) setAuthMode(initialAuthMode);
  }, [initialAuthMode, isOpen, session?.user]);

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

    const trimmedName = name.trim();
    if (
      authMode === "signup" &&
      trimmedName &&
      containsProfanity(trimmedName)
    ) {
      setSubmitting(false);
      setMessage("Display name contains inappropriate content.");
      setName("");
      return;
    }

    const result =
      authMode === "signup"
        ? await supabase.auth.signUp({
            email,
            password,
            options: {
              data: { display_name: trimmedName || "MelBurb Player" },
              emailRedirectTo: "https://www.melburb.com/",
            },
          })
        : await supabase.auth.signInWithPassword({ email, password });

    setSubmitting(false);
    setPassword("");

    if (result.error) {
      if (
        authMode === "signup" &&
        result.error.message.includes("already been registered")
      ) {
        setMessage(
          "An account with this email already exists. Please sign in instead."
        );
        setAuthMode("signin");
      } else if (
        authMode === "signup" &&
        result.error.message.includes("User already registered")
      ) {
        setMessage(
          "An account with this email already exists. Please sign in instead."
        );
        setAuthMode("signin");
      } else {
        setMessage(result.error.message);
      }
      return;
    }

    setMessage(
      authMode === "signup" && !result.data.session
        ? "Check your email to confirm. If you already have an account, click Sign in instead."
        : "You are signed in. Your player card is now connected."
    );
  }

  async function handleForgotPassword(event: FormEvent) {
    event.preventDefault();
    if (!email) {
      setMessage("Please enter your email address.");
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: "https://www.melburb.com/",
    });
    setSubmitting(false);
    if (error) {
      setMessage(error.message);
    } else {
      setMessage("Check your email for a password reset link.");
      setForgotPasswordMode(false);
    }
  }

  async function signOut() {
    const { error } = await supabase.auth.signOut();
    setMessage(error ? error.message : "You are signed out.");
  }

  async function handleDisplayNameChange(event: FormEvent) {
    event.preventDefault();
    if (!session?.user) return;

    const trimmedName = name.trim();
    if (trimmedName.length < 2 || trimmedName.length > 24) {
      setMessage("Choose a display name between 2 and 24 characters.");
      return;
    }
    if (containsProfanity(trimmedName)) {
      setMessage("Display name contains inappropriate content.");
      return;
    }

    setSubmitting(true);
    setMessage("");

    if (process.env.NODE_ENV === "development") {
      onChange(saveDisplayName(trimmedName));
      setSubmitting(false);
      setEditingDisplayName(false);
      setMessage(
        "Local preview: your new display name is shown on this device only."
      );
      return;
    }

    const { error } = await supabase
      .from("profiles")
      .update({ display_name: trimmedName })
      .eq("id", session.user.id);

    setSubmitting(false);
    if (error) {
      if (
        error.code === "23505" ||
        error.message.includes("Display name is already in use")
      ) {
        setMessage(
          "That display name is already being used. Please choose another."
        );
        return;
      }
      setMessage("Your display name could not be updated. Please try again.");
      return;
    }

    onChange(saveDisplayName(trimmedName));
    setEditingDisplayName(false);
    setMessage("Your display name has been updated.");
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
        <>
          <div className="account-form mb-5">
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
            <p className="text-sm text-slate-600 dark:text-stone-300 mb-3">
              {authMode === "signup"
                ? "Create an account to keep your player identity across devices."
                : "Sign in to reconnect your MelBurb player card."}
            </p>
            <form onSubmit={handleAuthentication}>
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
              {authMode === "signup" &&
                (progress.displayName === "Café Guest" ||
                  !progress.displayName) && (
                  <>
                    <label htmlFor="display-name">
                      Please create a display name
                    </label>
                    <input
                      id="display-name"
                      type="text"
                      autoComplete="nickname"
                      maxLength={24}
                      required
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      placeholder="Your visible player name"
                    />
                  </>
                )}
              <button
                className="cafe-button w-full mt-4"
                type="submit"
                disabled={submitting}
              >
                {submitting
                  ? "Please wait…"
                  : authMode === "signup"
                  ? "Create account"
                  : "Sign in"}
              </button>
              {authMode === "signup" && (
                <p className="text-xs text-stone-400 mt-2 text-center">
                  Already have an account?{" "}
                  <button
                    type="button"
                    className="text-amber-400 hover:text-amber-300 underline"
                    onClick={() => setAuthMode("signin")}
                  >
                    Sign in
                  </button>{" "}
                  instead.
                </p>
              )}
            </form>
            {authMode === "signin" && !forgotPasswordMode && (
              <button
                type="button"
                className="text-sm text-amber-400 hover:text-amber-300 mt-3 underline"
                onClick={() => setForgotPasswordMode(true)}
              >
                Forgot password?
              </button>
            )}
            {forgotPasswordMode && (
              <form onSubmit={handleForgotPassword} className="mt-4">
                <p className="text-sm text-stone-300 mb-3">
                  Enter your email and we&apos;ll send you a link to reset your
                  password.
                </p>
                <label htmlFor="reset-email">Email</label>
                <input
                  id="reset-email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="mb-3"
                />
                <button
                  className="cafe-button w-full"
                  type="submit"
                  disabled={submitting}
                >
                  {submitting ? "Please wait…" : "Send reset link"}
                </button>
                <button
                  type="button"
                  className="text-sm text-stone-400 hover:text-stone-300 mt-2"
                  onClick={() => {
                    setForgotPasswordMode(false);
                    setMessage("");
                  }}
                >
                  Back to sign in
                </button>
              </form>
            )}
          </div>
        </>
      )}
      {message && <p className="account-message mb-4">{message}</p>}
      {progress.displayName && session?.user && (
        <section className="display-name-card mb-4">
          <div className="display-name-heading">
            <div>
              <span>Display name</span>
              <strong>{progress.displayName}</strong>
            </div>
            {!editingDisplayName && (
              <button
                className="cafe-button"
                type="button"
                onClick={() => {
                  setName(progress.displayName);
                  setMessage("");
                  setEditingDisplayName(true);
                }}
              >
                Edit name
              </button>
            )}
          </div>
          <p>
            This is the name shown on your player card and future public game
            features. Display names must be unique; your email and login stay
            the same.
          </p>
          {editingDisplayName && (
            <form onSubmit={handleDisplayNameChange}>
              <label htmlFor="edit-display-name">New display name</label>
              <input
                id="edit-display-name"
                type="text"
                autoComplete="nickname"
                minLength={2}
                maxLength={24}
                required
                autoFocus
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
              <small>{name.trim().length}/24 characters</small>
              <div className="display-name-actions">
                <button
                  className="cafe-button"
                  type="submit"
                  disabled={submitting}
                >
                  {submitting ? "Saving…" : "Save display name"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setName(progress.displayName);
                    setEditingDisplayName(false);
                    setMessage("");
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </section>
      )}
    </Panel>
  );
}

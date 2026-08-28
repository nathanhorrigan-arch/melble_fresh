import React, { useState } from "react";
import { PlayerProgress, saveDisplayName } from "../../domain/progress";
import { Panel } from "./Panel";

interface ProfileProps {
  isOpen: boolean;
  close: () => void;
  progress: PlayerProgress;
  onChange: (progress: PlayerProgress) => void;
}

export function Profile({ isOpen, close, progress, onChange }: ProfileProps) {
  const [name, setName] = useState(progress.displayName);

  return (
    <Panel title="Player card" isOpen={isOpen} close={close}>
      <p className="mb-4 text-sm text-slate-600 dark:text-stone-300">
        This first version saves your player card privately on this device.
        Cloud accounts and cross-device syncing will be added with a secure
        database.
      </p>
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
        <button
          className="cafe-button"
          onClick={() => onChange(saveDisplayName(name))}
          type="button"
        >
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

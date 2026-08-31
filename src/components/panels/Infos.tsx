import { Guesses } from "../Guesses";
import { Panel } from "./Panel";
import React from "react";
import { MelBurb } from "../MelBurb";
import { formatDistance } from "../../domain/geography";
import { SettingsData } from "../../hooks/useSettings";
import Twemoji from "./../Twemoji";

interface InfosProps {
  isOpen: boolean;
  close: () => void;
  settingsData: SettingsData;
}

export function Infos({ isOpen, close, settingsData }: InfosProps) {
  return (
    <Panel title="How to play" isOpen={isOpen} close={close}>
      <div className="space-y-6">
        <section>
          <h3 className="text-lg font-bold mb-2 flex items-center gap-2">
            <Twemoji text="🎯" options={{ className: "inline-block" }} />
            The Goal
          </h3>
          <p className="text-stone-300">
            A mystery Melbourne suburb is waiting. You have{" "}
            <strong>6 guesses</strong> to name it based on distance clues.
          </p>
        </section>

        <section>
          <h3 className="text-lg font-bold mb-2 flex items-center gap-2">
            <Twemoji text="⌨️" options={{ className: "inline-block" }} />
            How to Guess
          </h3>
          <ul className="text-stone-300 space-y-1 list-none">
            <li>• Start typing a suburb name and select from the list</li>
            <li>
              • Only <strong>Greater Melbourne suburbs</strong> are valid
              guesses
            </li>
            <li>
              • Each guess reveals <strong>3 clues</strong> to help you
            </li>
          </ul>
        </section>

        <section>
          <h3 className="text-lg font-bold mb-2 flex items-center gap-2">
            <Twemoji text="📍" options={{ className: "inline-block" }} />
            The Clues
          </h3>
          <div className="bg-stone-900 rounded-lg p-3 mb-3">
            <div className="grid grid-cols-3 gap-2 text-center text-xs mb-2">
              <div className="bg-stone-800 p-2 rounded">
                <div className="text-amber-400 font-bold">📏 Distance</div>
                <div className="text-stone-400">How far away (in km)</div>
              </div>
              <div className="bg-stone-800 p-2 rounded">
                <div className="text-amber-400 font-bold">🧭 Direction</div>
                <div className="text-stone-400">Where to go next</div>
              </div>
              <div className="bg-stone-800 p-2 rounded">
                <div className="text-amber-400 font-bold">📊 Proximity</div>
                <div className="text-stone-400">Match percentage</div>
              </div>
            </div>
            <p className="text-stone-400 text-xs text-center">
              Use these clues to narrow down the mystery suburb!
            </p>
          </div>
        </section>

        <section>
          <h3 className="text-lg font-bold mb-2 flex items-center gap-2">
            <Twemoji text="🧭" options={{ className: "inline-block" }} />
            Direction Guide
          </h3>
          <div className="flex flex-wrap gap-2 justify-center bg-stone-900 rounded-lg p-3">
            {["N", "NE", "E", "SE", "S", "SW", "W", "NW"].map((dir) => (
              <span
                key={dir}
                className="bg-stone-800 px-2 py-1 rounded text-sm font-mono"
              >
                {dir}
              </span>
            ))}
            <span className="text-stone-500 text-xs self-center ml-2">
              = North, South, East, West + combinations
            </span>
          </div>
        </section>

        <section>
          <h3 className="text-lg font-bold mb-2 flex items-center gap-2">
            <Twemoji text="🏆" options={{ className: "inline-block" }} />
            Scoring
          </h3>
          <div className="bg-stone-900 rounded-lg p-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Twemoji text="🎯" options={{ className: "inline-block" }} />
                  Exact match
                </span>
                <span className="bg-amber-700 px-3 py-1 rounded font-bold">
                  100 pts
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Twemoji text="📍" options={{ className: "inline-block" }} />
                  Within 1 km
                </span>
                <span className="bg-stone-700 px-3 py-1 rounded font-bold">
                  75 pts
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Twemoji text="📍" options={{ className: "inline-block" }} />
                  Within 3 km
                </span>
                <span className="bg-stone-700 px-3 py-1 rounded font-bold">
                  50 pts
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Twemoji text="📍" options={{ className: "inline-block" }} />
                  Within 5 km
                </span>
                <span className="bg-stone-700 px-3 py-1 rounded font-bold">
                  25 pts
                </span>
              </div>
              <hr className="border-stone-700" />
              <div className="flex items-center justify-between text-stone-400">
                <span>Barista clue (each)</span>
                <span className="text-red-400">-10 pts</span>
              </div>
            </div>
          </div>
        </section>

        <section>
          <h3 className="text-lg font-bold mb-2 flex items-center gap-2">
            <Twemoji text="💡" options={{ className: "inline-block" }} />
            Example Game
          </h3>

          <div className="space-y-4">
            <div className="bg-stone-900 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-amber-600 text-xs px-2 py-1 rounded-full font-bold">
                  1
                </span>
                <span className="text-stone-300">First guess - far away</span>
              </div>
              <Guesses
                rowCount={1}
                guesses={[
                  {
                    name: "St Kilda",
                    direction: "N",
                    distance: 7_000,
                  },
                ]}
                settingsData={settingsData}
              />
              <p className="text-stone-400 text-sm mt-2">
                📏 <strong>7 km north</strong> — head that way!
              </p>
            </div>

            <div className="bg-stone-900 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-amber-600 text-xs px-2 py-1 rounded-full font-bold">
                  2
                </span>
                <span className="text-stone-300">Getting warmer!</span>
              </div>
              <Guesses
                rowCount={1}
                guesses={[
                  {
                    name: "Richmond",
                    direction: "NW",
                    distance: 3_000,
                  },
                ]}
                settingsData={settingsData}
              />
              <p className="text-stone-400 text-sm mt-2">
                📏 <strong>3 km north-west</strong> — you&apos;re getting
                closer!
              </p>
            </div>

            <div className="bg-stone-900 rounded-lg p-3 border-2 border-green-600">
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-green-600 text-xs px-2 py-1 rounded-full font-bold">
                  3
                </span>
                <span className="text-green-400 font-bold">Solved! 🎉</span>
              </div>
              <Guesses
                rowCount={1}
                guesses={[
                  {
                    name: "Fitzroy",
                    direction: "N",
                    distance: 0,
                  },
                ]}
                settingsData={settingsData}
              />
              <p className="text-green-400 text-sm mt-2">
                🎯 <strong>Distance: 0 km</strong> — Perfect pour! 100 points!
              </p>
            </div>
          </div>
        </section>
      </div>
    </Panel>
  );
}

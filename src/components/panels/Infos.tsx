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
      <div className="space-y-3 text-justify border-b-2 border-gray-200 pb-3 mb-3">
        <div>
          A mystery Melbourne suburb has just landed on the café counter. Read
          its outline and name it before your six guesses run out.
        </div>
        <div>
          Start typing a suburb and choose one from the list. MelBurb accepts
          Greater Melbourne suburbs included in the game, rather than smaller
          localities.
        </div>
        <div>
          Every guess comes back with three clues: how far away it is, which
          direction to travel, and a proximity percentage. Follow the trail
          until you reach the mystery <MelBurb />.
        </div>
        <div>
          Name it exactly to collect 100 points. If the answer escapes you, your
          nearest guess still earns 75 points at 1 km or closer, 50 at 3 km or
          closer, or 25 at 5 km or closer. Anything farther earns no points, and
          each Barista clue deducts 10 points.
        </div>
        <div>
          Visit Daily for the shared puzzle of the day, open Practice for
          unlimited extra rounds, or pass a completed puzzle to a friend as a
          challenge.
        </div>
      </div>
      <div className="space-y-3 text-justify border-b-2 border-gray-200 pb-3 mb-3">
        <div className="font-bold">Examples</div>
        <div>
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
          <div className="my-2">
            You order <span className="uppercase font-bold">St Kilda</span>, but
            the mystery suburb is {formatDistance(7_000)} to the north. The
            arrow gives you a direction for your next move.
          </div>
        </div>
        <div>
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
          <div className="my-2">
            Next comes <span className="uppercase font-bold">Richmond</span>. At{" "}
            {formatDistance(3_000)} away, you are getting warmer; head
            north-west to close the gap.
          </div>
        </div>
        <div>
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
          <div className="my-2">
            <span className="uppercase font-bold">Fitzroy</span> is the perfect
            pour: the distance reaches zero and the suburb is solved!{" "}
            <Twemoji text="🎉" options={{ className: "inline-block" }} />
          </div>
        </div>
      </div>
    </Panel>
  );
}

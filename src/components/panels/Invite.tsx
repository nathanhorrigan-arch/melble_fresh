import React from "react";
import CopyToClipboard from "react-copy-to-clipboard";
import { toast } from "react-toastify";
import Twemoji from "../Twemoji";
import { Panel } from "./Panel";

interface InviteProps {
  isOpen: boolean;
  close: () => void;
}

const shareUrl = "https://www.melburb.com/";
const shareText =
  "Meet me at MelBurb for today's freshly brewed Melbourne suburb. It's free to play, with no ads—can you name it?";

export function Invite({ isOpen, close }: InviteProps) {
  const shareFromDevice = async () => {
    if (!navigator.share) {
      await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
      toast("Invite copied — ready to share!");
      return;
    }

    try {
      await navigator.share({
        title: "MelBurb",
        text: shareText,
        url: shareUrl,
      });
    } catch (error) {
      if ((error as DOMException).name !== "AbortError") {
        toast("Sharing was cancelled — try copying the invite instead.");
      }
    }
  };

  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(
    `${shareText}\n${shareUrl}`
  )}`;

  return (
    <Panel title="Share MelBurb" isOpen={isOpen} close={close}>
      <div className="invite-panel">
        <Twemoji text="☕" className="invite-panel-cup" />
        <h3>BRING A MATE TO THE CAFÉ</h3>
        <p>
          Share today&apos;s Melbourne mystery. Your friend gets the game link —
          never your answer or guesses.
        </p>
        <blockquote>{shareText}</blockquote>
        <div className="invite-actions">
          <button type="button" onClick={shareFromDevice}>
            <Twemoji text="📤" /> Share from this device
          </button>
          <CopyToClipboard
            text={`${shareText}\n${shareUrl}`}
            onCopy={() => toast("Invite copied — ready to share!")}
          >
            <button type="button">
              <Twemoji text="🔗" /> Copy invite &amp; link
            </button>
          </CopyToClipboard>
          <a href={whatsappUrl} target="_blank" rel="noreferrer">
            <Twemoji text="💬" /> Send with WhatsApp
          </a>
        </div>
        <small>Free to play · No ads · One fresh suburb daily</small>
      </div>
    </Panel>
  );
}

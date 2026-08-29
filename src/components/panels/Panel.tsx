import Modal from "react-modal";
import React, { useEffect, useState } from "react";
import { Twemoji } from "@teuteuf/react-emoji-render";

interface PanelProps {
  title: string;
  isOpen: boolean;
  close: () => void;
  children?: React.ReactNode;
  debugAction?: () => void;
}

export function Panel({
  title,
  isOpen,
  close,
  children,
  debugAction,
}: PanelProps) {
  const [debug, setDebug] = useState(5);
  useEffect(() => {
    setDebug(5);
  }, [isOpen]);

  useEffect(() => {
    if (debug === 0 && debugAction != null) {
      debugAction();
    }
  }, [debug, debugAction]);

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={close}
      overlayClassName="panel-overlay"
      className="panel-modal"
      ariaHideApp={false}
    >
      <div className="w-full bg-stone-950 text-stone-100 text-sm overflow-auto px-4 pb-4 border-4 border-amber-900">
        <header className="border-b-2 border-amber-700 mb-3 flex">
          <h2
            className="text-2xl font-bold uppercase tracking-wide text-center my-1 flex-auto"
            onClick={() => setDebug((prev) => prev - 1)}
          >
            {title}
          </h2>
          <button type="button" onClick={close}>
            <Twemoji text="❌" />
          </button>
        </header>
        {children}
      </div>
    </Modal>
  );
}

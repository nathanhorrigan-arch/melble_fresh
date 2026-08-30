import React, { useState } from "react";
import Autosuggest from "react-autosuggest";
import { useTranslation } from "react-i18next";
import { getSuburbName, sanitizeSuburbName } from "../domain/suburbs";
import { suburbs } from "../domain/suburbs.position";

interface SuburbInputProps {
  inputRef: React.RefObject<HTMLInputElement>;
  currentGuess: string;
  setCurrentGuess: (guess: string) => void;
  placeholder: string;
}

export function SuburbInput({
  inputRef,
  currentGuess,
  setCurrentGuess,
  placeholder,
}: SuburbInputProps) {
  const [suggestions, setSuggestions] = useState<string[]>([]);

  const { i18n } = useTranslation();

  return (
    <Autosuggest
      theme={{ suggestionHighlighted: "font-bold" }}
      shouldRenderSuggestions={() => true}
      highlightFirstSuggestion
      suggestions={suggestions}
      onSuggestionsFetchRequested={({ value }) =>
        setSuggestions(
          suburbs
            .map((c) => getSuburbName(i18n.resolvedLanguage, c).toUpperCase())
            .filter((suburbName) =>
              sanitizeSuburbName(suburbName).includes(sanitizeSuburbName(value))
            )
            .sort()
        )
      }
      onSuggestionsClearRequested={() => setSuggestions([])}
      getSuggestionValue={(suggestion) => suggestion}
      renderSuggestion={(suggestion) => (
        <div className="m-0.5 bg-white dark:bg-slate-800 dark:text-slate-100 p-1 cursor-pointer">
          {suggestion}
        </div>
      )}
      containerProps={{
        className: "guess-entry-field rounded flex-auto relative",
      }}
      inputProps={{
        ref: inputRef,
        id: "suburb-guess",
        className:
          "guess-entry-input w-full bg-stone-950 text-stone-100 p-2 outline-none",
        placeholder,
        value: currentGuess,
        onChange: (_e, { newValue }) => setCurrentGuess(newValue),
      }}
      renderSuggestionsContainer={({ containerProps, children }) => (
        <div
          {...containerProps}
          className={`${containerProps.className} rounded absolute bottom-full w-full bg-gray-300 dark:bg-white mb-1 divide-x-2 max-h-52 overflow-auto`}
        >
          {children}
        </div>
      )}
    />
  );
}

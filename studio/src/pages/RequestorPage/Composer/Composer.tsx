import { escapeKeymap } from "@/components/CodeMirrorEditor/keymaps";
import { customTheme } from "@/components/CodeMirrorEditor/themes";
import { cn } from "@/utils";
import {
  type CompletionContext,
  autocompletion,
} from "@codemirror/autocomplete";
import CodeMirror, { EditorView } from "@uiw/react-codemirror";
import { useCallback, useMemo } from "react";

const suggestions = [
  { label: "command1", type: "keyword" },
  { label: "command2", type: "command" },
  { label: "command3", type: "command" },
];

function myCompletions(context: CompletionContext) {
  // Match a '/' followed by zero or more word characters
  const word = context.matchBefore(/\/\w*/);
  console.log("Autocomplete triggered. Matched word:", word);

  if (word && word.from !== word.to) {
    const result = {
      from: word.from,
      // to: word.to, // `to` will default to cursor position
      options: suggestions
        .filter((item) =>
          item.label.toLowerCase().startsWith(word.text.slice(1).toLowerCase()),
        )
        .map((item) => ({
          label: item.label,
          type: item.type,
        })),
    };
    console.log("Autocomplete result:", result);
    return result;
  }
  return null;
}

export function Composer() {
  const extensions = useMemo(
    () => [
      autocompletion({
        override: [myCompletions],
        activateOnTyping: true,
        defaultKeymap: true, // Add this line
      }),
      customTheme,
      escapeKeymap,
      EditorView.lineWrapping,
    ],
    [],
  );

  const handleChange = useCallback((value: string) => {
    console.log("Content:", value);
  }, []);

  return (
    <div className={cn("p-4 border rounded", "focus-within:border-blue-600")}>
      <CodeMirror
        value=""
        onChange={handleChange}
        extensions={extensions}
        placeholder="Type something... Use '/' for commands"
        theme={customTheme}
      />
    </div>
  );
}

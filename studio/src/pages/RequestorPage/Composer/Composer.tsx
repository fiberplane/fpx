// import { escapeKeymap } from "@/components/CodeMirrorEditor/keymaps";
import { customTheme } from "@/components/CodeMirrorEditor/themes";
// import { cn } from "@/utils";
import {
  type CompletionContext,
  autocompletion,
} from "@codemirror/autocomplete";
import CodeMirror, { EditorView } from "@uiw/react-codemirror";
import { useCallback, useMemo, useState } from "react";

// const suggestions = [
//   { label: "command1", type: "keyword" },
//   { label: "command2", type: "command" },
//   { label: "command3", type: "command" },
// ];

// function myCompletions(context: CompletionContext) {
//   // Match a '/' followed by zero or more word characters
//   const word = context.matchBefore(/\/\w*/);
//   console.log("Autocomplete triggered. Matched word:", word);

//   if (word && word.from !== word.to) {
//     const result = {
//       from: word.from,
//       // to: word.to, // `to` will default to cursor position
//       options: suggestions
//         .filter((item) =>
//           item.label.toLowerCase().startsWith(word.text.slice(1).toLowerCase()),
//         )
//         .map((item) => ({
//           label: item.label,
//           type: item.type,
//         })),
//     };
//     console.log("Autocomplete result:", result);
//     return result;
//   }
//   return null;
// }

// Our list of completions (can be static, since the editor
/// will do filtering based on context).

const completions = [
  { label: "panic", type: "keyword" },
  { label: "park", type: "constant", info: "Test completion" },
  { label: "password", type: "variable" },
];

function myCompletions(context: CompletionContext) {
  const before = context.matchBefore(/\w+/);
  // If completion wasn't explicitly started and there
  // is no word before the cursor, don't open completions.
  if (!context.explicit && !before) {
    return null;
  }
  return {
    from: before ? before.from : context.pos,
    options: completions,
    validFor: /^\w*$/,
  };
}

export function Composer() {
  const [value, setValue] = useState("");
  const extensions = useMemo(
    () => [
      // html(),
      autocompletion({
        override: [myCompletions],
        // activateOnTyping: true,
        // defaultKeymap: true, // Add this line
      }),
      // customTheme,
      // escapeKeymap,
      // EditorView.lineWrapping,
    ],
    [],
  );

  return (
    <CodeMirror
      value={value}
      onChange={setValue}
      extensions={extensions}
      // height="200px"
      placeholder="Type something... Use '/' for commands"
      theme={customTheme}
      basicSetup={{
        autocompletion: true,
        completionKeymap: true,
        foldGutter: false,
        lineNumbers: false,
        dropCursor: false,
      }}
    />
  );
}

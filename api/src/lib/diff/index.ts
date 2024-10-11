import type { GitDiff } from "../ai/schema.js";

export function serializeDiffToPatch(gitDiff: GitDiff): string {
  return gitDiff.files
    .map((file) => {
      const diffHeader = `diff --git ${file.isNewFile ? "/dev/null" : `a/${file.oldFile}`} ${file.isDeletedFile ? "/dev/null" : `b/${file.newFile}`}`;
      const modeChanges = [
        file.oldMode && `old mode ${file.oldMode}`,
        file.newMode && `new mode ${file.newMode}`,
        file.newFileMode && `new file mode ${file.newFileMode}`,
        file.deletedFileMode && `deleted file mode ${file.deletedFileMode}`,
      ]
        .filter(Boolean)
        .join("\n");

      const indexLine = file.fileIndex ? `index ${file.fileIndex}` : "";

      const fileHeaders = [
        `--- ${file.isNewFile ? "/dev/null" : `a/${file.oldFile}`}`,
        `+++ ${file.isDeletedFile ? "/dev/null" : `b/${file.newFile}`}`,
      ].join("\n");

      const hunks = file.hunks
        .map((hunk) => {
          const header = `@@ -${hunk.oldStartLine},${hunk.oldLineCount} +${hunk.newStartLine},${hunk.newLineCount} @@${hunk.sectionHeader ? ` ${hunk.sectionHeader}` : ""}`;
          const changes = hunk.changes
            .map((change) => {
              const prefix =
                change.type === "addition"
                  ? "+"
                  : change.type === "deletion"
                    ? "-"
                    : " ";
              return change.content
                .split("\n")
                .map((line) => `${prefix}${line}`)
                .join("\n");
            })
            .join("\n");
          return `${header}\n${changes}`;
        })
        .join("\n");

      return [diffHeader, modeChanges, indexLine, fileHeaders, hunks]
        .filter(Boolean)
        .join("\n");
    })
    .join("\n\n");
}

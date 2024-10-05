import { z } from "zod";

const GitDiffHunkSchema = z.object({
  oldStartLine: z.number(),
  oldLineCount: z.number(),
  newStartLine: z.number(),
  newLineCount: z.number(),
  sectionHeader: z.string().optional(),
  changes: z.array(
    z.object({
      type: z.enum(["context", "addition", "deletion"]),
      content: z.string(),
    }),
  ),
});

const GitDiffFileSchema = z.object({
  oldFile: z.string(),
  newFile: z.string(),
  hunks: z.array(GitDiffHunkSchema),
  isBinary: z.boolean().optional(),
  binaryChanges: z
    .object({
      oldMode: z.string().optional(),
      newMode: z.string().optional(),
      deletedFileMode: z.string().optional(),
      newFileMode: z.string().optional(),
    })
    .optional(),
});

export const GitDiffSchema = z.array(GitDiffFileSchema);

export type GitDiff = z.infer<typeof GitDiffSchema>;

export type FileType = {
  path: string;
  content: string;
};

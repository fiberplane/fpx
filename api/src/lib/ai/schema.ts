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
  oldFile: z.union([z.string().regex(/^[\w\-./\\]+$/), z.literal("/dev/null")]),
  newFile: z.union([z.string().regex(/^[\w\-./\\]+$/), z.literal("/dev/null")]),
  hunks: z.array(GitDiffHunkSchema),
  isBinary: z.boolean().optional(),
  oldMode: z.string().optional(),
  newMode: z.string().optional(),
  newFileMode: z.string().optional(),
  deletedFileMode: z.string().optional(),
  isNewFile: z.boolean(),
  isDeletedFile: z.boolean(),
  fileIndex: z.string().optional(),
});

export const GitDiffSchema = z.object({
  files: z.array(GitDiffFileSchema),
});

export type GitDiff = z.infer<typeof GitDiffSchema>;

export type FileType = {
  path: string;
  content: string;
};

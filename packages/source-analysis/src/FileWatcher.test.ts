import { copyFileSync, readdirSync, unlinkSync } from "node:fs";
import * as path from "node:path";
import { expect, test, vi } from "vitest";
import { FileWatcher } from "./FileWatcher";

test("Initial files (added)", async () => {
  const location = path.join(__dirname, "../test-cases/multiple");
  const watcher = new FileWatcher(location);
  const handler = vi.fn();
  watcher.addListener("fileAdded", handler);
  await watcher.start();
  try {
    expect(handler).toHaveBeenCalledTimes(3);

    // Find basic file event
    const basicFile = handler.mock.calls.find((call) =>
      call[0].payload.fileName.endsWith("basic.ts"),
    );
    expect(basicFile).toBeDefined();

    // Find index file event
    const indexFile = handler.mock.calls.find((call) =>
      call[0].payload.fileName.endsWith("index.ts"),
    );
    expect(indexFile).toBeDefined();

    // Find other file event
    const otherFile = handler.mock.calls.find((call) =>
      call[0].payload.fileName.endsWith("other.ts"),
    );
    expect(otherFile).toBeDefined();
  } finally {
    watcher.teardown();
  }
});

test("Empty folder", async () => {
  const location = path.join(__dirname, "../test-cases/empty");
  const simpleLocation = path.join(__dirname, "../test-cases/single");

  // Avoid test from failing due to dirty initial state
  // Remove old files (if they still exist)
  removeTypescriptFiles(location);

  // Setup (mock) event handlers
  const addHandler = vi.fn();
  const updateHandler = vi.fn();
  const removeHandler = vi.fn();

  // Initialize watcher
  const watcher = new FileWatcher(location);
  watcher.addListener("fileAdded", addHandler);
  watcher.addListener("fileUpdated", updateHandler);
  watcher.addListener("fileRemoved", removeHandler);
  await watcher.start();

  try {
    expect(addHandler).toHaveBeenCalledTimes(0);
    expect(updateHandler).toHaveBeenCalledTimes(0);
    expect(removeHandler).toHaveBeenCalledTimes(0);

    copyFileSync(
      path.join(simpleLocation, "index.ts"),
      path.join(location, "index.ts"),
    );

    await expect.poll(() => addHandler).toHaveBeenCalledTimes(1);
    // Reset mock call count
    addHandler.mockClear();

    // Verify remove hasn't been triggered yet
    expect(removeHandler).toHaveBeenCalledTimes(0);

    // Remove (all) typescript files
    removeTypescriptFiles(location);

    // Wait for the remove handler to have been called
    await expect.poll(() => removeHandler).toHaveBeenCalledTimes(1);

    // Verify nothing else odd happened
    expect(addHandler).toHaveBeenCalledTimes(0);
    expect(updateHandler).toHaveBeenCalledTimes(0);
  } finally {
    watcher.teardown();
    removeTypescriptFiles(location);
  }
});

function removeTypescriptFiles(location: string) {
  const files = readdirSync(location);
  for (const file of files) {
    if (file.endsWith(".ts")) {
      unlinkSync(path.join(location, file));
    }
  }
}

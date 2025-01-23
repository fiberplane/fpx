import { KeyboardShortcutKey } from "@/components/KeyboardShortcut";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { isMac } from "@/utils";

type ShortcutSection = {
  title: string;
  shortcuts: {
    label: string;
    keys: string[];
  }[];
};

const CMD_KEY = isMac ? "⌘" : "Ctrl";

const KEYBOARD_SHORTCUTS: ShortcutSection[] = [
  {
    title: "General",
    shortcuts: [
      { label: "Open Command Menu", keys: [CMD_KEY, "K"] },
      { label: "Send Request", keys: [CMD_KEY, "Enter"] },
      { label: "Use Example Data", keys: [CMD_KEY, "G"] },
      // TODO - Find a better name for the Help menu, all it has right now are a link to Settings and the keyboard shortcuts
      { label: "Open Help Menu", keys: ["shift", "?"] },
      { label: "Open Keyboard Shortcuts", keys: [CMD_KEY, "/"] },
    ],
  },
  {
    title: "Request Panel",
    shortcuts: [
      { label: "View Request Params", keys: ["g", "then", "p"] },
      { label: "View Request Auth", keys: ["g", "then", "a"] },
      { label: "View Request Headers", keys: ["g", "then", "h"] },
      { label: "View Request Body", keys: ["g", "then", "b"] },
      { label: "View Route Docs", keys: ["g", "then", "d"] },
    ],
  },
  {
    title: "Sidebar Navigation",
    shortcuts: [
      { label: "Toggle Sidebar", keys: [CMD_KEY, "B"] },
      { label: "Go to Next Route", keys: ["j"] },
      { label: "Go to Previous Route", keys: ["k"] },
      { label: "Select Focused Route", keys: ["Enter"] },
      { label: "Filter Routes List", keys: ["/"] },
    ],
  },
];

export function KeyboardShortcutsModal({
  onClose,
}: {
  onClose: () => void;
}) {
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <div className="p-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold tracking-tight">
              Keyboard Shortcuts
            </h2>
          </div>

          <div className="space-y-6">
            {KEYBOARD_SHORTCUTS.map((section) => (
              <div key={section.title}>
                <h3 className="text-base text-foreground/70 mb-2">
                  {section.title}
                </h3>
                <div className="space-y-1">
                  {section.shortcuts.map((shortcut) => (
                    <div
                      key={shortcut.label}
                      className="flex items-center justify-between py-1 group hover:bg-muted/50 rounded-md px-2 transition-colors"
                    >
                      <span className="text-sm text-foreground/90 group-hover:text-foreground">
                        {shortcut.label}
                      </span>
                      <div className="flex items-center gap-1">
                        {shortcut.keys.map((key, index) => (
                          <span key={`${shortcut.label}-${key}-${index}`}>
                            {index > 0 &&
                              key !== "then" &&
                              index !== shortcut.keys.indexOf("then") + 1 && (
                                <span className="text-muted-foreground text-sm mx-1">
                                  +
                                </span>
                              )}
                            {key === "then" ? (
                              <span className="text-xs text-muted-foreground mx-1">
                                then
                              </span>
                            ) : (
                              <KeyboardShortcutKey
                                key={key}
                                className="inline-flex min-w-[1.75rem] justify-center"
                              >
                                {key}
                              </KeyboardShortcutKey>
                            )}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

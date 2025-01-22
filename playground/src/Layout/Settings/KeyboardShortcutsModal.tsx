import { KeyboardShortcutKey } from "@/components/KeyboardShortcut";
import { Dialog, DialogContent } from "@/components/ui/dialog";

type ShortcutSection = {
  title: string;
  shortcuts: {
    label: string;
    keys: string[];
  }[];
};

const KEYBOARD_SHORTCUTS: ShortcutSection[] = [
  {
    title: "General",
    shortcuts: [
      { label: "Open Command Menu", keys: ["⌘", "K"] },
      { label: "Send Request", keys: ["⌘", "Enter"] },
      { label: "Use Example Data", keys: ["⌘", "G"] },
    ],
  },
  {
    title: "Request Panel",
    shortcuts: [
      { label: "View Request Params", keys: ["g", "then", "p"] },
      { label: "View Request Headers", keys: ["g", "then", "h"] },
      { label: "View Request Body", keys: ["g", "then", "b"] },
      { label: "View Route Docs", keys: ["g", "then", "d"] },
    ],
  },
  {
    title: "Sidebar Navigation",
    shortcuts: [
      { label: "Toggle Sidebar", keys: ["⌘", "B"] },
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
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Keyboard Shortcuts</h2>
          </div>

          <div className="space-y-8">
            {KEYBOARD_SHORTCUTS.map((section) => (
              <div key={section.title}>
                <h3 className="text-sm font-medium text-foreground mb-4">
                  {section.title}
                </h3>
                <div className="space-y-1">
                  {section.shortcuts.map((shortcut) => (
                    <div
                      key={shortcut.label}
                      className="flex items-center justify-between py-1"
                    >
                      <span className="text-sm">{shortcut.label}</span>
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
                                className="inline-flex"
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

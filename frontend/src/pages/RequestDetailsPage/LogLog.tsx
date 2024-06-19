import { MizuMessage } from "@/queries";
import { LogLevel } from "./RequestDetailsPage";
import { StackTrace } from "./StackTrace";

export function LogLog({
  message,
  level,
}: { message: string | MizuMessage; level: LogLevel }) {
  // FIXME: why are these unknowns?
  const description =
    typeof message === "string" ? message : (message.message as string);
  const stack =
    typeof message === "object" &&
    "stack" in message &&
    (message.stack as string);

  const name =
    typeof message === "object" &&
    "name" in message &&
    (message.name as string);

  const heading = `console.${level ? level : "error"}${name && ": " + name}`;
  const id = `log-${level ? level : "error"}-${name}`;

  return (
    <section className="flex flex-col gap-4" id={id}>
      <div className="flex items-center gap-4">
        <h3 className="text-xl font-semibold font-mono">{heading}</h3>
      </div>

      {description && <p>{description}</p>}
      {stack && (
        <div className="mt-2 max-h-[200px] overflow-y-scroll text-gray-400">
          <StackTrace stackTrace={stack} />
        </div>
      )}
    </section>
  );
}

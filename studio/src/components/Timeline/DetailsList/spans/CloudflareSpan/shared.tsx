import { Badge } from "@/components/ui/badge";
import { CF_BINDING_METHOD, CF_BINDING_NAME } from "@/constants";
import { cn, getString } from "@/utils";
import type { OtelSpan } from "@fiberplane/fpx-types";

export function CfBindingOverview({
  span,
  className,
  children,
}: { span: OtelSpan; className?: string; children?: React.ReactNode }) {
  const bindingName = getString(span.attributes[CF_BINDING_NAME]);
  const method = getString(span.attributes[CF_BINDING_METHOD]);

  return (
    <div className={cn("flex items-center gap-2 py-0.5", className)}>
      <Badge variant="secondary" className="font-mono font-light text-gray-300">
        {bindingName}.{method}
      </Badge>
      {children}
    </div>
  );
}

export function KeyBadge({ keyName }: { keyName: string }) {
  return (
    <Badge className="text-xs gap-2" variant="secondary">
      <span className="font-mono text-muted-foreground uppercase pr-2 border-r border-gray-500">
        Key
      </span>
      {keyName}
    </Badge>
  );
}

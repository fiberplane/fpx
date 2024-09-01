import { Badge } from "@/components/ui/badge";
import { CF_BINDING_METHOD, CF_BINDING_NAME } from "@/constants";
import type { OtelSpan } from "@/queries";
import { cn, getString } from "@/utils";

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

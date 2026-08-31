import * as React from "react";

import { cn } from "@/lib/utils";

const Separator = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "h-0 w-full border-t-2 border-dashed border-foreground/40",
      className,
    )}
    {...props}
  />
));
Separator.displayName = "Separator";

export { Separator };

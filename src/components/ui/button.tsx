import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-semibold tracking-tight transition-[transform,box-shadow,filter] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 active:translate-y-[2px] active:shadow-none select-none",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground border-2 border-foreground rounded-[10px] shadow-[2px_3px_0_0_hsl(var(--foreground))] hover:brightness-95",
        destructive:
          "bg-destructive text-destructive-foreground border-2 border-foreground rounded-[10px] shadow-[2px_3px_0_0_hsl(var(--foreground))] hover:brightness-95",
        outline:
          "bg-background text-foreground border-2 border-foreground rounded-[10px] shadow-[2px_3px_0_0_hsl(var(--foreground))] hover:brightness-95",
        secondary:
          "bg-secondary text-secondary-foreground border-2 border-foreground rounded-[10px] shadow-[2px_3px_0_0_hsl(var(--foreground))] hover:brightness-95",
        ghost:
          "text-foreground rounded-[10px] hover:bg-foreground/5 border-2 border-transparent",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 rounded-[8px] px-3 text-xs",
        lg: "h-11 rounded-[10px] px-8 text-base",
        icon: "h-9 w-9 rounded-[10px]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };

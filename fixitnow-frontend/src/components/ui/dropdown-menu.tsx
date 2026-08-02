"use client";

import * as React from "react";
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import { Check, ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

const DropdownMenu = DropdownMenuPrimitive.Root;
const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;
const DropdownMenuPortal = DropdownMenuPrimitive.Portal;

const DropdownMenuContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content>
>(({ className, sideOffset = 6, ...props }, ref) => (
  <DropdownMenuPrimitive.Portal>
    <DropdownMenuPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        "z-50 min-w-[12rem] overflow-hidden rounded-lg border border-border bg-popover text-popover-foreground shadow-xl shadow-black/20 p-1",
        "data-[state=open]:animate-in data-[state=closed]:animate-out",
        "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
        "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
        "data-[side=bottom]:slide-in-from-top-1 data-[side=top]:slide-in-from-bottom-1",
        className
      )}
      {...props}
    />
  </DropdownMenuPrimitive.Portal>
));
DropdownMenuContent.displayName = "DropdownMenuContent";

const DropdownMenuItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item> & {
    selected?: boolean;
  }
>(({ className, selected, children, ...props }, ref) => (
  <DropdownMenuPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex cursor-pointer select-none items-center gap-2 rounded-md px-2.5 py-2 text-sm outline-none",
      "text-popover-foreground",
      "focus:bg-accent/15 focus:text-foreground",
      "data-[highlighted]:bg-accent/15 data-[highlighted]:text-foreground",
      "[&_svg]:size-4 [&_svg]:text-muted-foreground",
      className
    )}
    {...props}
  >
    {children}
    {selected ? (
      <Check className="ml-auto h-4 w-4 text-primary" />
    ) : null}
  </DropdownMenuPrimitive.Item>
));
DropdownMenuItem.displayName = "DropdownMenuItem";

export interface DropdownOption {
  label: string;
  value: string;
  icon?: React.ComponentType<{ className?: string }>;
}

export interface DropdownProps {
  label: string;
  value: string;
  options: DropdownOption[];
  onChange: (v: string) => void;
  className?: string;
  align?: "start" | "center" | "end";
}

/**
 * A dark-mode-safe select alternative built on Radix DropdownMenu.
 * - The trigger button uses our design tokens (always readable).
 * - The panel uses popover colors which already have a dark variant.
 * - No native <select> means no OS-styled white-on-white option list.
 */
export function Dropdown({
  label,
  value,
  options,
  onChange,
  className,
  align = "start",
}: DropdownProps) {
  const current = options.find((o) => o.value === value) ?? options[0];
  const Icon = current?.icon;

  return (
    <DropdownMenu onValueChange={(v) => onChange(v)}>
      <DropdownMenuTrigger
        className={cn(
          "inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-background px-3 text-sm font-medium text-foreground shadow-sm",
          "hover:bg-accent/10 transition-colors",
          "focus:outline-none focus:ring-2 focus:ring-ring/60 focus:ring-offset-0",
          "data-[state=open]:bg-accent/15",
          className
        )}
      >
        <span className="text-xs font-normal text-muted-foreground">{label}:</span>
        <span className="inline-flex items-center gap-1.5">
          {Icon ? <Icon className="h-3.5 w-3.5 text-muted-foreground" /> : null}
          <span>{current?.label ?? ""}</span>
        </span>
        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align}>
        {options.map((opt) => {
          const OptIcon = opt.icon;
          // Stable id from value; "All" (empty string) gets a literal fallback.
          const itemKey = opt.value === "" ? "__all__" : opt.value;
          return (
            <DropdownMenuItem
              key={itemKey}
              value={opt.value}
              selected={opt.value === value}
              onSelect={(e) => {
                e.preventDefault?.();
                onChange(opt.value);
              }}
            >
              {OptIcon ? <OptIcon className="h-4 w-4" /> : <span className="inline-block h-4 w-4" />}
              <span>{opt.label}</span>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
};

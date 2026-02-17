import * as SelectPrimitive from "@radix-ui/react-select";
import type { ComponentPropsWithoutRef, ElementRef } from "react";
import { forwardRef } from "react";
import { CaretDown, Check } from "~lib/icons";
import { cn } from "~lib/utils";

export const Select = SelectPrimitive.Root;
export const SelectValue = SelectPrimitive.Value;
export const SelectGroup = SelectPrimitive.Group;

export const SelectTrigger = forwardRef<
  ElementRef<typeof SelectPrimitive.Trigger>,
  ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Trigger
    ref={ref}
    className={cn(
      "inline-flex h-5 items-center justify-between gap-1.5 bg-[var(--pt-hover-bg)] border border-[var(--pt-surface-border)] rounded-[var(--pt-radius)] px-2 text-xs font-medium text-[var(--pt-text-primary)] outline-none cursor-pointer max-w-[140px] hover:bg-[var(--pt-active-bg)] transition-colors focus-visible:ring-2 focus-visible:ring-[var(--pt-accent)] focus-visible:ring-offset-1",
      className,
    )}
    {...props}
  >
    {children}
    <SelectPrimitive.Icon asChild>
      <CaretDown size={10} weight="bold" className="text-[var(--pt-text-quaternary)]" />
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
));
SelectTrigger.displayName = "SelectTrigger";

export const SelectContent = forwardRef<
  ElementRef<typeof SelectPrimitive.Content>,
  ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className, children, position = "popper", ...props }, ref) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      ref={ref}
      position={position}
      sideOffset={4}
      className={cn(
        "z-[var(--pt-z-dropdown)] min-w-[140px] overflow-hidden rounded-[var(--pt-radius-md)] border border-[var(--pt-surface-border)] bg-[var(--pt-surface)] text-[var(--pt-text-primary)]",
        "shadow-[var(--pt-shadow)] p-1",
        "data-[state=open]:animate-slideDownAndFade",
        className,
      )}
      {...props}
    >
      <SelectPrimitive.Viewport className="p-0">
        {children}
      </SelectPrimitive.Viewport>
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
));
SelectContent.displayName = "SelectContent";

export const SelectItem = forwardRef<
  ElementRef<typeof SelectPrimitive.Item>,
  ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex items-center gap-2 rounded-[var(--pt-radius-sm)] px-2 py-1.5 text-xs font-medium text-[var(--pt-text-primary)] outline-none cursor-pointer select-none",
      "data-[highlighted]:bg-[var(--pt-hover-bg)] data-[state=checked]:text-[var(--pt-accent)]",
      "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className,
    )}
    {...props}
  >
    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    <SelectPrimitive.ItemIndicator className="ml-auto">
      <Check size={10} weight="bold" />
    </SelectPrimitive.ItemIndicator>
  </SelectPrimitive.Item>
));
SelectItem.displayName = "SelectItem";

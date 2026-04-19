import * as SelectPrimitive from "@radix-ui/react-select";
import type { ComponentPropsWithoutRef, ElementRef } from "react";
import { forwardRef, useCallback, useRef, useState } from "react";
import { CaretDown, Check } from "~lib/icons";
import { cn } from "~lib/utils";

// Radix Select uses a press-drag-release gesture (radix-ui#3146): the same
// gesture's pointerup outside content closes the menu. We guard close events
// fired within this window of the open transition so click-to-toggle works.
const OPEN_GUARD_MS = 800;

export const Select: React.FC<
  ComponentPropsWithoutRef<typeof SelectPrimitive.Root>
  // eslint-disable-next-line @typescript-eslint/unbound-method
> = ({ open, defaultOpen, onOpenChange, ...props }) => {
  const isControlled = open !== undefined;
  const [internalOpen, setInternalOpen] = useState(defaultOpen ?? false);
  const openedAtRef = useRef(0);

  const currentOpen = isControlled ? open : internalOpen;

  const handleOpenChange = useCallback(
    (next: boolean) => {
      if (next) {
        openedAtRef.current = performance.now();
      } else if (performance.now() - openedAtRef.current < OPEN_GUARD_MS) {
        return;
      }
      if (!isControlled) setInternalOpen(next);
      onOpenChange?.(next);
    },
    [isControlled, onOpenChange],
  );

  return (
    <SelectPrimitive.Root
      open={currentOpen}
      onOpenChange={handleOpenChange}
      {...props}
    />
  );
};
export const SelectValue = SelectPrimitive.Value;
export const SelectGroup = SelectPrimitive.Group;

export const SelectTrigger = forwardRef<
  ElementRef<typeof SelectPrimitive.Trigger>,
  ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Trigger
    ref={ref}
    className={cn(
      "inline-flex h-7 items-center justify-between gap-1.5 bg-[var(--pt-hover-bg)] border border-[var(--pt-surface-border)] rounded-[var(--pt-radius)] px-2.5 text-xs font-medium text-[var(--pt-text-primary)] outline-none cursor-pointer hover:bg-[var(--pt-active-bg)] transition-colors",
      className,
    )}
    {...props}
  >
    {children}
    <SelectPrimitive.Icon asChild>
      <CaretDown
        size={10}
        weight="bold"
        className="text-[var(--pt-text-quaternary)]"
      />
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
));
SelectTrigger.displayName = "SelectTrigger";

export const SelectContent = forwardRef<
  ElementRef<typeof SelectPrimitive.Content>,
  ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(
  (
    { className, children, position = "popper", onCloseAutoFocus, ...props },
    ref,
  ) => (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        ref={ref}
        position={position}
        sideOffset={4}
        onCloseAutoFocus={(e) => {
          onCloseAutoFocus?.(e);
          // Suppress focus return to the trigger on mouse-driven close so the
          // focus-visible ring doesn't linger after a click. Keyboard close
          // (Esc) still restores focus because Radix sets `e.detail` accordingly.
          if (!e.defaultPrevented) {
            e.preventDefault();
          }
        }}
        className={cn(
          "z-[var(--pt-z-dropdown)] min-w-[140px] outline-none overflow-hidden rounded-[var(--pt-radius-md)] border border-[var(--pt-surface-border)] bg-[var(--pt-surface)] text-[var(--pt-text-primary)]",
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
  ),
);
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

"use client";

import * as React from "react";
import {
  Command as CommandPrimitive,
  CommandDialog as CommandDialogPrimitive,
  CommandEmpty as CommandEmptyPrimitive,
  CommandGroup as CommandGroupPrimitive,
  CommandInput as CommandInputPrimitive,
  CommandItem as CommandItemPrimitive,
  CommandList as CommandListPrimitive,
  CommandSeparator as CommandSeparatorPrimitive,
} from "cmdk";
import { cn } from "~lib/cn";

const Command = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive>
>(({ className, ...props }, ref) => (
  <CommandPrimitive
    ref={ref}
    className={cn(
      "flex h-full w-full flex-col overflow-hidden",
      "bg-transparent text-foreground",
      className,
    )}
    {...props}
  />
));
Command.displayName = CommandPrimitive.displayName ?? "Command";

const CommandInput = React.forwardRef<
  React.ElementRef<typeof CommandInputPrimitive>,
  React.ComponentPropsWithoutRef<typeof CommandInputPrimitive>
>(({ className, ...props }, ref) => (
  <CommandInputPrimitive
    ref={ref}
    className={cn(
      "flex h-11 w-full rounded-md bg-transparent py-3 text-[14px] font-medium outline-none",
      "placeholder:text-[var(--pt-text-secondary)]",
      "disabled:cursor-not-allowed disabled:opacity-50",
      "tracking-tight antialiased",
      className,
    )}
    {...props}
  />
));
CommandInput.displayName = CommandInputPrimitive.displayName ?? "CommandInput";

const CommandList = React.forwardRef<
  React.ElementRef<typeof CommandListPrimitive>,
  React.ComponentPropsWithoutRef<typeof CommandListPrimitive>
>(({ className, ...props }, ref) => (
  <CommandListPrimitive
    ref={ref}
    className={cn("overflow-y-auto overflow-x-hidden", className)}
    {...props}
  />
));
CommandList.displayName = CommandListPrimitive.displayName ?? "CommandList";

const CommandEmpty = React.forwardRef<
  React.ElementRef<typeof CommandEmptyPrimitive>,
  React.ComponentPropsWithoutRef<typeof CommandEmptyPrimitive>
>(({ className, ...props }, ref) => (
  <CommandEmptyPrimitive
    ref={ref}
    className={cn("py-6 text-center text-sm", className)}
    {...props}
  />
));
CommandEmpty.displayName = CommandEmptyPrimitive.displayName ?? "CommandEmpty";

const CommandGroup = React.forwardRef<
  React.ElementRef<typeof CommandGroupPrimitive>,
  React.ComponentPropsWithoutRef<typeof CommandGroupPrimitive>
>(({ className, ...props }, ref) => (
  <CommandGroupPrimitive
    ref={ref}
    className={cn("overflow-hidden p-1 text-foreground", className)}
    {...props}
  />
));
CommandGroup.displayName = CommandGroupPrimitive.displayName ?? "CommandGroup";

const CommandItem = React.forwardRef<
  React.ElementRef<typeof CommandItemPrimitive>,
  React.ComponentPropsWithoutRef<typeof CommandItemPrimitive>
>(({ className, ...props }, ref) => (
  <CommandItemPrimitive
    ref={ref}
    className={cn(
      "relative flex cursor-pointer select-none items-center rounded-lg px-3 py-2 text-[14px] font-medium outline-none transition-colors",
      "aria-selected:bg-[var(--pt-hover-bg)] aria-selected:text-[var(--pt-text-primary)]",
      "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      "tracking-tight antialiased",
      className,
    )}
    {...props}
  />
));
CommandItem.displayName = CommandItemPrimitive.displayName ?? "CommandItem";

const CommandSeparator = React.forwardRef<
  React.ElementRef<typeof CommandSeparatorPrimitive>,
  React.ComponentPropsWithoutRef<typeof CommandSeparatorPrimitive>
>(({ className, ...props }, ref) => (
  <CommandSeparatorPrimitive
    ref={ref}
    className={cn("-mx-1 h-px bg-[var(--pt-glass-border)]", className)}
    {...props}
  />
));
CommandSeparator.displayName =
  CommandSeparatorPrimitive.displayName ?? "CommandSeparator";

const CommandDialog = ({
  overlayClassName,
  contentClassName,
  ...props
}: React.ComponentPropsWithoutRef<typeof CommandDialogPrimitive>) => (
  <CommandDialogPrimitive
    overlayClassName={cn("fixed inset-0 z-[99998]", overlayClassName)}
    contentClassName={cn(
      "fixed top-[15%] left-1/2 z-[99999] w-[640px] -translate-x-1/2",
      "overflow-hidden rounded-[var(--pt-radius)] border border-[var(--pt-glass-border)]",
      "bg-[var(--pt-glass-bg)] shadow-[var(--pt-shadow)] [backdrop-filter:var(--pt-glass-blur)]",
      contentClassName,
    )}
    style={{ boxShadow: "var(--pt-shadow), var(--pt-inner-glow)" }}
    {...props}
  />
);

export {
  Command,
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
};

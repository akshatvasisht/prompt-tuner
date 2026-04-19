import * as SwitchPrimitive from "@radix-ui/react-switch";
import * as React from "react";
import { cn } from "~lib/utils";

type SwitchSize = "sm" | "default";

const ROOT_SIZE: Record<SwitchSize, string> = {
  default: "h-6 w-11",
  sm: "h-5 w-9",
};
const THUMB_SIZE: Record<SwitchSize, string> = {
  default:
    "h-5 w-5 data-[state=checked]:translate-x-[22px] data-[state=unchecked]:translate-x-0.5",
  sm: "h-4 w-4 data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0.5",
};

interface SwitchProps extends React.ComponentPropsWithoutRef<
  typeof SwitchPrimitive.Root
> {
  size?: SwitchSize;
}

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitive.Root>,
  SwitchProps
>(({ className, size = "default", onPointerUp, ...props }, ref) => (
  <SwitchPrimitive.Root
    className={cn(
      "peer inline-flex shrink-0 cursor-pointer items-center rounded-full transition-colors outline-none disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-[var(--pt-accent)] data-[state=unchecked]:bg-[var(--pt-switch-off)]",
      ROOT_SIZE[size],
      className,
    )}
    onPointerUp={(e) => {
      onPointerUp?.(e);
      // Mouse activation should not leave a focus-visible ring on the toggle.
      // Keyboard users still get the ring via Tab focus.
      const target = e.currentTarget;
      requestAnimationFrame(() => {
        target.blur();
      });
    }}
    {...props}
    ref={ref}
  >
    <SwitchPrimitive.Thumb
      className={cn(
        "pointer-events-none block rounded-full bg-[var(--pt-surface-elevated)] shadow-[var(--pt-shadow)] ring-0 transition-transform",
        THUMB_SIZE[size],
      )}
    />
  </SwitchPrimitive.Root>
));
Switch.displayName = SwitchPrimitive.Root.displayName;

export { Switch };

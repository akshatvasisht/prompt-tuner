import "../styles/globals.css";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  Keyboard,
  Cpu,
  CheckCircle,
  ArrowRight,
  Play,
  TreeStructure,
} from "~lib/icons";
import { Button } from "~components/ui/Button";
import { KeyboardShortcut } from "~components/ui/KeyboardShortcut";
import { Logo } from "~components/Logo";
import { ACTIONS } from "~lib/actions";

const STEPS = [
  { id: "welcome", title: "Welcome to Prompt Tuner" },
  { id: "shortcuts", title: "Shortcut Discovery" },
  { id: "engine", title: "Gemini Nano Setup" },
  { id: "actions", title: "Action Explainer" },
  { id: "runonopen", title: "Run on Open" },
  { id: "done", title: "Ready" },
] as const;

function SurfacePanel({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`bg-[var(--pt-surface-elevated)] border border-[var(--pt-surface-border)] rounded-[var(--pt-radius-md)] shadow-[var(--pt-shadow)] ${className}`}
    >
      {children}
    </div>
  );
}

function NumberBadge({ n }: { n: number }) {
  return (
    <span className="bg-[var(--pt-accent-light)] text-[var(--pt-accent)] w-5 h-5 rounded-full inline-flex justify-center items-center text-xs font-semibold">
      {n}
    </span>
  );
}

function StepHeader({ icon, title }: { icon: ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="h-10 w-10 rounded-[var(--pt-radius-md)] bg-[var(--pt-accent-light)] flex items-center justify-center">
        {icon}
      </div>
      <h2 className="text-lg font-semibold tracking-tight leading-tight text-[var(--pt-text-primary)]">
        {title}
      </h2>
    </div>
  );
}

export default function SetupWizard() {
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState<"forward" | "back">("forward");
  const headingRef = useRef<HTMLDivElement>(null);

  const isLast = step === STEPS.length - 1;

  const handleNext = useCallback(() => {
    setDirection("forward");
    setStep((s) => Math.min(STEPS.length - 1, s + 1));
  }, []);

  const handleBack = useCallback(() => {
    setDirection("back");
    setStep((s) => Math.max(0, s - 1));
  }, []);

  const handleComplete = useCallback(async () => {
    /* eslint-disable-next-line @typescript-eslint/no-deprecated */
    await chrome.storage.local.set({ onboardingComplete: true });
    window.close();
  }, []);

  const handleSkip = useCallback(() => {
    setDirection("forward");
    setStep(STEPS.length - 1);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLElement) {
        const tag = e.target.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA" || e.target.isContentEditable)
          return;
      }
      if (e.key === "Enter") {
        e.preventDefault();
        if (isLast) void handleComplete();
        else handleNext();
      } else if (e.key === "Escape" && !isLast) {
        e.preventDefault();
        handleSkip();
      } else if (e.key === "ArrowLeft" && step > 0) {
        e.preventDefault();
        handleBack();
      } else if (e.key === "ArrowRight" && !isLast) {
        e.preventDefault();
        handleNext();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
    };
  }, [step, isLast, handleNext, handleBack, handleComplete, handleSkip]);

  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true });
  }, [step]);

  const renderStepContent = () => {
    switch (step) {
      case 0:
        return (
          <div className="flex flex-col items-center text-center motion-safe:animate-in motion-safe:fade-in">
            <Logo
              aria-label="Prompt Tuner"
              className="h-14 w-14 text-[var(--pt-accent)] mb-5"
              style={{ filter: "drop-shadow(var(--pt-shadow))" }}
            />
            <h1 className="text-xl font-semibold tracking-tight leading-tight text-[var(--pt-text-primary)] mb-2">
              Welcome to Prompt Tuner
            </h1>
            <p className="text-sm text-[var(--pt-text-secondary)] max-w-md leading-relaxed">
              The privacy-first Chrome extension that brings edge-based AI
              prompt engineering straight to your text selections.
            </p>
          </div>
        );
      case 1:
        return (
          <div className="flex flex-col items-start motion-safe:animate-in motion-safe:fade-in w-full">
            <StepHeader
              icon={<Keyboard className="text-[var(--pt-accent)] w-5 h-5" />}
              title="Invoke Anywhere"
            />
            <p className="text-sm text-[var(--pt-text-secondary)] leading-relaxed mb-5">
              Prompt Tuner gets out of your way. Simply select text in any chat
              interface (ChatGPT, Claude, Gemini) and press:
            </p>
            <SurfacePanel className="w-full px-5 py-4 flex flex-col items-center gap-2.5">
              <KeyboardShortcut variant="hero" keys={["⌘", "⇧", "K"]} />
              <div className="flex items-center gap-3 w-full">
                <span
                  aria-hidden="true"
                  className="h-px flex-1 bg-[var(--pt-surface-border)]"
                />
                <span className="text-[var(--pt-text-tertiary)] text-[10px] font-semibold tracking-[0.22em] uppercase">
                  or
                </span>
                <span
                  aria-hidden="true"
                  className="h-px flex-1 bg-[var(--pt-surface-border)]"
                />
              </div>
              <KeyboardShortcut variant="hero" keys={["Ctrl", "⇧", "K"]} />
            </SurfacePanel>
          </div>
        );
      case 2:
        return (
          <div className="flex flex-col items-start motion-safe:animate-in motion-safe:fade-in w-full">
            <StepHeader
              icon={<Cpu className="text-[var(--pt-accent)] w-5 h-5" />}
              title="Chrome's Built-In AI"
            />
            <p className="text-sm text-[var(--pt-text-secondary)] leading-relaxed mb-5">
              Prompt Tuner runs 100% locally using Chrome&apos;s built-in Gemini
              Nano model. No API keys, no cloud servers, total privacy.
            </p>

            <div className="flex flex-col gap-2 w-full">
              <SurfacePanel className="p-4 flex flex-col gap-2">
                <h3 className="text-sm text-[var(--pt-text-primary)] font-semibold flex items-center gap-2">
                  <NumberBadge n={1} />
                  Update Chrome
                </h3>
                <p className="text-sm text-[var(--pt-text-secondary)] ml-7 leading-relaxed">
                  Ensure you are running Chrome version 138 or higher.
                </p>
              </SurfacePanel>

              <SurfacePanel className="p-4 flex flex-col gap-2">
                <h3 className="text-sm text-[var(--pt-text-primary)] font-semibold flex items-center gap-2">
                  <NumberBadge n={2} />
                  Enable the Feature Flag
                </h3>
                <p className="text-sm text-[var(--pt-text-secondary)] ml-7 leading-relaxed">
                  Go to{" "}
                  <code className="text-[var(--pt-accent)] bg-[var(--pt-accent-light)] px-2 py-0.5 rounded-[var(--pt-radius-sm)] font-mono text-xs break-all">
                    chrome://flags/#prompt-api-for-gemini-nano
                  </code>{" "}
                  and set it to{" "}
                  <strong className="text-[var(--pt-text-primary)] font-semibold">
                    Enabled
                  </strong>
                  . Relaunch Chrome.
                </p>
              </SurfacePanel>

              <SurfacePanel className="p-4 flex flex-col gap-2">
                <h3 className="text-sm text-[var(--pt-text-primary)] font-semibold flex items-center gap-2">
                  <NumberBadge n={3} />
                  Trigger Download
                </h3>
                <p className="text-sm text-[var(--pt-text-secondary)] ml-7 leading-relaxed">
                  If you haven&apos;t used Nano before, the model might
                  automatically download in the background when you first try to
                  tune.
                </p>
              </SurfacePanel>
            </div>
          </div>
        );
      case 3: {
        const primaries = ACTIONS.filter((a) => a.type === "primary");
        const secondaries = ACTIONS.filter((a) => a.type === "secondary");
        return (
          <div className="flex flex-col items-start motion-safe:animate-in motion-safe:fade-in w-full">
            <StepHeader
              icon={
                <TreeStructure className="text-[var(--pt-accent)] w-5 h-5" />
              }
              title={`${String(ACTIONS.length)} Prompt Engineering Tools`}
            />
            <p className="text-sm text-[var(--pt-text-secondary)] leading-relaxed mb-5">
              Transform your raw thoughts into highly effective prompts using
              built-in tactics. The palette lists them in this exact order.
            </p>

            <div className="w-full flex flex-col gap-1.5">
              {primaries.map((action) => (
                <SurfacePanel
                  key={action.id}
                  className="flex items-center gap-3 px-4 py-3"
                >
                  <span
                    aria-hidden="true"
                    className="text-base leading-none text-[var(--pt-accent)]"
                  >
                    ✱
                  </span>
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-semibold text-[var(--pt-text-primary)] leading-tight">
                      {action.label}
                    </span>
                    <span className="text-xs text-[var(--pt-text-secondary)] leading-snug">
                      {action.description}
                    </span>
                  </div>
                </SurfacePanel>
              ))}

              <div className="flex items-center gap-2 px-1 pt-3">
                <span className="font-sans text-[10px] font-semibold tracking-[0.22em] uppercase text-[var(--pt-accent)]">
                  Techniques
                </span>
                <span
                  aria-hidden="true"
                  className="h-px flex-1 bg-[var(--pt-surface-border)]"
                />
              </div>

              <ul className="flex flex-col gap-0.5">
                {secondaries.map((action, i) => (
                  <li
                    key={action.id}
                    className="flex items-baseline gap-3 px-1 py-1.5"
                  >
                    <span
                      aria-hidden="true"
                      className="w-5 shrink-0 text-xs font-semibold tabular-nums text-[var(--pt-accent)] leading-none"
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <div className="min-w-0 flex-1">
                      <span className="text-sm font-medium text-[var(--pt-text-primary)]">
                        {action.label}
                      </span>
                      <span className="ml-2 text-xs text-[var(--pt-text-tertiary)]">
                        {action.description}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        );
      }
      case 4:
        return (
          <div className="flex flex-col items-start motion-safe:animate-in motion-safe:fade-in w-full">
            <StepHeader
              icon={<Play className="text-[var(--pt-accent)] w-5 h-5" />}
              title="Power User Mode"
            />
            <p className="text-sm text-[var(--pt-text-secondary)] leading-relaxed mb-5">
              Once you find your groove, clicking through the palette can feel
              slow.
            </p>
            <SurfacePanel className="w-full px-5 py-4 flex flex-col items-start gap-3">
              <p className="text-sm text-[var(--pt-text-primary)] leading-relaxed">
                Open the extension popup and enable{" "}
                <strong className="font-semibold">Run on Open</strong>. Select a{" "}
                <strong className="font-semibold">Default Action</strong> (like
                Improve Prompt).
              </p>
              <hr className="w-full border-[var(--pt-surface-border)]" />
              <p className="text-xs text-[var(--pt-text-secondary)] leading-relaxed">
                Now, selecting text and hitting{" "}
                <KeyboardShortcut variant="inline" keys={["⌘", "⇧", "K"]} />{" "}
                instantly runs your Default Action and streams the result.
              </p>
            </SurfacePanel>
          </div>
        );
      case 5:
        return (
          <div className="flex flex-col items-center text-center motion-safe:animate-in motion-safe:fade-in">
            <div className="h-14 w-14 rounded-full bg-[var(--pt-accent-light)] flex items-center justify-center shadow-[var(--pt-shadow)] pt-check-pop mb-5">
              <CheckCircle
                className="text-[var(--pt-accent)] w-7 h-7"
                weight="fill"
              />
            </div>
            <h1 className="text-xl font-semibold tracking-tight leading-tight text-[var(--pt-text-primary)] mb-2">
              You&apos;re all set!
            </h1>
            <p className="text-sm text-[var(--pt-text-secondary)] max-w-sm leading-relaxed">
              Ready to start tuning prompts. Select some text in an AI chat and
              hit the shortcut!
            </p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[var(--pt-bg-base)] text-[var(--pt-text-primary)] flex items-center justify-center p-6 selection:bg-[var(--pt-accent)]/20">
      <div className="w-full max-w-xl relative">
        {/* Progress Bar */}
        <nav
          aria-label="Setup progress"
          className="absolute -top-10 left-0 w-full"
        >
          <ol className="flex items-center gap-2 list-none p-0 m-0">
            {STEPS.map((s, i) => {
              const active = i <= step;
              const current = i === step;
              return (
                <li
                  key={s.id}
                  aria-label={`Step ${String(i + 1)} of ${String(STEPS.length)}: ${s.title}`}
                  aria-current={current ? "step" : undefined}
                  style={{ transitionDelay: `${String(i * 60)}ms` }}
                  className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                    active
                      ? "bg-[var(--pt-accent)]"
                      : "bg-[var(--pt-surface-border)]"
                  }`}
                />
              );
            })}
          </ol>
        </nav>

        {/* Content Box - solid cream paper surface */}
        <div className="bg-[var(--pt-surface)] border border-[var(--pt-surface-border)] rounded-[var(--pt-radius-lg)] px-8 pt-8 pb-4 flex flex-col overflow-hidden relative shadow-[var(--pt-shadow-lg)]">
          <div
            ref={headingRef}
            tabIndex={-1}
            key={`step-${String(step)}-${direction}`}
            aria-live="polite"
            aria-atomic="true"
            className={`flex motion-safe:animate-in motion-safe:fade-in ${direction === "forward" ? "motion-safe:slide-in-from-bottom-4" : "motion-safe:slide-in-from-top-4"} ${step === 0 || step === 5 ? "items-center justify-center py-2" : "items-start"} focus:outline-none`}
          >
            {renderStepContent()}
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-[var(--pt-surface-border)] mt-5">
            <div className="flex items-center gap-1">
              {step > 0 && (
                <Button
                  variant="ghost"
                  onClick={handleBack}
                  className="hover:text-[var(--pt-text-primary)] text-[var(--pt-text-secondary)]"
                >
                  Back
                </Button>
              )}
              {!isLast && (
                <Button
                  variant="ghost"
                  onClick={handleSkip}
                  className="text-[var(--pt-text-secondary)] hover:text-[var(--pt-text-primary)]"
                >
                  Skip tutorial
                </Button>
              )}
            </div>

            {!isLast ? (
              <Button onClick={handleNext} className="gap-2">
                Continue <ArrowRight weight="regular" />
              </Button>
            ) : (
              <Button onClick={() => void handleComplete()} className="gap-2">
                Finish <CheckCircle weight="fill" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

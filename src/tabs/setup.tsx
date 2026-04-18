import "../styles/globals.css";
import { useState } from "react";
import {
  Sparkle,
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

export default function SetupWizard() {
  const [step, setStep] = useState(0);

  const steps = [
    { id: "welcome", title: "Welcome to Prompt Tuner" },
    { id: "shortcuts", title: "Shortcut Discovery" },
    { id: "engine", title: "Gemini Nano Setup" },
    { id: "actions", title: "Action Explainer" },
    { id: "runonopen", title: "Run on Open" },
    { id: "done", title: "Ready" },
  ];

  const handleNext = () => {
    setStep((s) => Math.min(steps.length - 1, s + 1));
  };

  const handleBack = () => {
    setStep((s) => Math.max(0, s - 1));
  };

  const handleComplete = async () => {
    /* eslint-disable-next-line @typescript-eslint/no-deprecated */
    await chrome.storage.local.set({ onboardingComplete: true });
    window.close();
  };

  const handleSkip = () => {
    setStep(steps.length - 1);
  };

  const renderStepContent = () => {
    switch (step) {
      case 0:
        return (
          <div className="flex flex-col items-center text-center space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <Logo
              aria-label="Prompt Tuner"
              className="h-16 w-16 text-[var(--pt-accent)]"
              style={{ filter: "drop-shadow(var(--pt-shadow))" }}
            />
            <h1 className="text-xl font-semibold tracking-tight leading-tight text-[var(--pt-text-primary)]">
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
          <div className="flex flex-col items-start space-y-5 animate-in fade-in slide-in-from-bottom-4 max-w-xl">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-[var(--pt-radius-md)] bg-[var(--pt-accent-light)] flex items-center justify-center">
                <Keyboard className="text-[var(--pt-accent)] w-5 h-5" />
              </div>
              <h2 className="text-lg font-semibold tracking-tight leading-tight text-[var(--pt-text-primary)]">
                Invoke Anywhere
              </h2>
            </div>
            <p className="text-sm text-[var(--pt-text-secondary)] leading-relaxed">
              Prompt Tuner gets out of your way. Simply select text in any chat
              interface (ChatGPT, Claude, Gemini) and press:
            </p>
            <div className="w-full bg-[var(--pt-surface-elevated)] border border-[var(--pt-surface-border)] rounded-[var(--pt-radius-md)] p-6 flex justify-center items-center shadow-[var(--pt-shadow)] mt-2">
              <KeyboardShortcut variant="hero" keys={["⌘", "⇧", "K"]} />
              <span className="text-[var(--pt-text-tertiary)] mx-4 text-xs font-medium">OR</span>
              <KeyboardShortcut variant="hero" keys={["Ctrl", "⇧", "K"]} />
            </div>
          </div>
        );
      case 2:
        return (
          <div className="flex flex-col items-start space-y-5 animate-in fade-in slide-in-from-bottom-4 w-full">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-[var(--pt-radius-md)] bg-[var(--pt-accent-light)] flex items-center justify-center">
                <Cpu className="text-[var(--pt-accent)] w-5 h-5" />
              </div>
              <h2 className="text-lg font-semibold tracking-tight leading-tight text-[var(--pt-text-primary)]">
                Chrome&apos;s Built-In AI
              </h2>
            </div>
            <p className="text-sm text-[var(--pt-text-secondary)] leading-relaxed">
              Prompt Tuner runs 100% locally using Chrome&apos;s built-in Gemini
              Nano model. No API keys, no cloud servers, total privacy.
            </p>

            <div className="flex flex-col space-y-3 w-full mt-2">
              <div className="bg-[var(--pt-surface-elevated)] border border-[var(--pt-surface-border)] rounded-[var(--pt-radius-md)] p-4 flex flex-col gap-2 shadow-[var(--pt-shadow)]">
                <h3 className="text-sm text-[var(--pt-text-primary)] font-semibold flex items-center gap-2">
                  <span className="bg-[var(--pt-accent-light)] text-[var(--pt-accent)] w-5 h-5 rounded-full inline-flex justify-center items-center text-xs font-semibold">
                    1
                  </span>
                  Update Chrome
                </h3>
                <p className="text-sm text-[var(--pt-text-secondary)] ml-7 leading-relaxed">
                  Ensure you are running Chrome version 138 or higher.
                </p>
              </div>

              <div className="bg-[var(--pt-surface-elevated)] border border-[var(--pt-surface-border)] rounded-[var(--pt-radius-md)] p-4 flex flex-col gap-2 shadow-[var(--pt-shadow)]">
                <h3 className="text-sm text-[var(--pt-text-primary)] font-semibold flex items-center gap-2">
                  <span className="bg-[var(--pt-accent-light)] text-[var(--pt-accent)] w-5 h-5 rounded-full inline-flex justify-center items-center text-xs font-semibold">
                    2
                  </span>
                  Enable the Feature Flag
                </h3>
                <p className="text-sm text-[var(--pt-text-secondary)] ml-7 leading-relaxed">
                  Go to{" "}
                  <code className="text-[var(--pt-accent)] bg-[var(--pt-accent-light)] px-2 py-0.5 rounded-[var(--pt-radius-sm)] font-mono text-xs">
                    chrome://flags/#prompt-api-for-gemini-nano
                  </code>{" "}
                  and set it to <strong className="text-[var(--pt-text-primary)] font-semibold">Enabled</strong>. Relaunch Chrome.
                </p>
              </div>

              <div className="bg-[var(--pt-surface-elevated)] border border-[var(--pt-surface-border)] rounded-[var(--pt-radius-md)] p-4 flex flex-col gap-2 shadow-[var(--pt-shadow)]">
                <h3 className="text-sm text-[var(--pt-text-primary)] font-semibold flex items-center gap-2">
                  <span className="bg-[var(--pt-accent-light)] text-[var(--pt-accent)] w-5 h-5 rounded-full inline-flex justify-center items-center text-xs font-semibold">
                    3
                  </span>
                  Trigger Download
                </h3>
                <p className="text-sm text-[var(--pt-text-secondary)] ml-7 leading-relaxed">
                  If you haven&apos;t used Nano before, the model might
                  automatically download in the background when you first try to
                  tune.
                </p>
              </div>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="flex flex-col items-start space-y-5 animate-in fade-in slide-in-from-bottom-4 w-full">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-[var(--pt-radius-md)] bg-[var(--pt-accent-light)] flex items-center justify-center">
                <TreeStructure className="text-[var(--pt-accent)] w-5 h-5" />
              </div>
              <h2 className="text-lg font-semibold tracking-tight leading-tight text-[var(--pt-text-primary)]">
                6 Prompt Engineering Tools
              </h2>
            </div>
            <p className="text-sm text-[var(--pt-text-secondary)] leading-relaxed">
              Transform your raw thoughts into highly effective prompts using
              built-in tactics.
            </p>

            <div className="grid grid-cols-2 gap-3 w-full">
              {ACTIONS.map((action) => {
                const Icon = action.icon;
                return (
                  <div
                    key={action.id}
                    className="bg-[var(--pt-surface-elevated)] border border-[var(--pt-surface-border)] rounded-[var(--pt-radius-md)] p-4 flex flex-col gap-2 relative overflow-hidden shadow-[var(--pt-shadow)] transition-colors"
                  >
                    <div className="flex items-center gap-2 text-sm text-[var(--pt-text-primary)] font-medium">
                      <Icon className="w-4 h-4 text-[var(--pt-accent)]" />
                      {action.label}
                    </div>
                    <p className="text-xs text-[var(--pt-text-secondary)] leading-relaxed">
                      {action.description}
                    </p>
                    {action.type === "primary" && (
                      <div className="absolute top-0 right-0 py-0.5 px-2 text-xs uppercase font-semibold tracking-wide text-[var(--pt-accent)] bg-[var(--pt-accent-light)] rounded-bl-[var(--pt-radius-md)]">
                        Primary
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      case 4:
        return (
          <div className="flex flex-col items-start space-y-5 animate-in fade-in slide-in-from-bottom-4 max-w-xl">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-[var(--pt-radius-md)] bg-[var(--pt-accent-light)] flex items-center justify-center">
                <Play className="text-[var(--pt-accent)] w-5 h-5" />
              </div>
              <h2 className="text-lg font-semibold tracking-tight leading-tight text-[var(--pt-text-primary)]">
                Power User Mode
              </h2>
            </div>
            <p className="text-sm text-[var(--pt-text-secondary)] leading-relaxed">
              Once you find your groove, clicking through the palette can feel
              slow.
            </p>
            <div className="w-full bg-[var(--pt-surface-elevated)] border border-[var(--pt-surface-border)] rounded-[var(--pt-radius-md)] p-5 flex flex-col items-start gap-3 shadow-[var(--pt-shadow)]">
              <p className="text-sm text-[var(--pt-text-primary)] leading-relaxed">
                Open the extension popup and enable <strong className="font-semibold">Run on Open</strong>
                . Select a <strong className="font-semibold">Default Action</strong> (like Optimize).
              </p>
              <hr className="w-full border-[var(--pt-surface-border)]" />
              <p className="text-xs text-[var(--pt-text-secondary)] flex items-center gap-2 leading-relaxed">
                <Sparkle className="w-4 h-4 text-[var(--pt-accent)]" /> Now, selecting
                text and hitting{" "}
                <KeyboardShortcut variant="inline" keys={["⌘⇧K"]} />{" "}
                instantly runs your Default Action and streams the result.
              </p>
            </div>
          </div>
        );
      case 5:
        return (
          <div className="flex flex-col items-center text-center space-y-6 animate-in fade-in slide-in-from-bottom-4 outline-none">
            <div className="h-16 w-16 rounded-full bg-[var(--pt-accent-light)] flex items-center justify-center shadow-[var(--pt-shadow)]">
              <CheckCircle
                className="text-[var(--pt-accent)] w-8 h-8"
                weight="fill"
              />
            </div>
            <h1 className="text-xl font-semibold tracking-tight leading-tight text-[var(--pt-text-primary)]">
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
      <div className="w-full max-w-3xl relative">
        {/* Progress Bar */}
        <nav
          aria-label="Setup progress"
          className="absolute -top-10 left-0 w-full"
        >
          <ol className="flex items-center gap-2 list-none p-0 m-0">
            {steps.map((s, i) => {
              const active = i <= step;
              const current = i === step;
              return (
                <li
                  key={s.id}
                  aria-label={`Step ${String(i + 1)} of ${String(steps.length)}: ${s.title}`}
                  aria-current={current ? "step" : undefined}
                  className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                    active
                      ? "bg-[var(--pt-accent)]"
                      : "bg-[var(--pt-surface-border)]"
                  }`}
                />
              );
            })}
          </ol>
        </nav>

        {/* Content Box — solid cream paper surface */}
        <div className="min-h-[460px] bg-[var(--pt-surface)] border border-[var(--pt-surface-border)] rounded-[var(--pt-radius-lg)] p-10 flex flex-col overflow-hidden relative shadow-[var(--pt-shadow-lg)]">
          <div className="flex-1 flex items-center justify-center">
            {renderStepContent()}
          </div>

          <div className="flex items-center justify-between pt-6 border-t border-[var(--pt-surface-border)] mt-8">
            <div>
              {step === 0 ? (
                <Button
                  variant="ghost"
                  onClick={handleSkip}
                  className="text-[var(--pt-text-secondary)] hover:text-[var(--pt-text-primary)]"
                >
                  Skip tutorial
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  onClick={handleBack}
                  className="hover:text-[var(--pt-text-primary)] text-[var(--pt-text-secondary)]"
                >
                  Back
                </Button>
              )}
            </div>

            {step < steps.length - 1 ? (
              <Button onClick={handleNext} className="gap-2 bg-[var(--pt-accent)] hover:bg-[var(--pt-accent-hover)] text-white shadow-[var(--pt-shadow)]">
                Continue <ArrowRight weight="regular" />
              </Button>
            ) : (
              <Button
                onClick={() => void handleComplete()}
                className="gap-2 bg-[var(--pt-accent)] hover:bg-[var(--pt-accent-hover)] text-white shadow-[var(--pt-shadow)]"
              >
                Finish <CheckCircle weight="fill" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

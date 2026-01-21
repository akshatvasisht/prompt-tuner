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
          <div className="flex flex-col items-center text-center space-y-7 animate-in fade-in slide-in-from-bottom-4">
            <img
              /* eslint-disable-next-line @typescript-eslint/no-deprecated */
              src={chrome.runtime.getURL("assets/logo.svg")}
              alt="Prompt Tuner"
              className="h-20 w-20"
              style={{ filter: "drop-shadow(var(--pt-shadow-lg))" }}
            />
            <h1 className="text-4xl font-bold tracking-tight leading-tight text-[var(--pt-text-primary)]">
              Welcome to Prompt Tuner
            </h1>
            <p className="text-lg text-[var(--pt-text-secondary)] max-w-lg leading-relaxed">
              The privacy-first Chrome extension that brings edge-based AI
              prompt engineering straight to your text selections.
            </p>
          </div>
        );
      case 1:
        return (
          <div className="flex flex-col items-start space-y-6 animate-in fade-in slide-in-from-bottom-4 max-w-xl">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-[var(--pt-accent-light)] flex items-center justify-center">
                <Keyboard className="text-[var(--pt-accent)] w-6 h-6" />
              </div>
              <h2 className="text-2xl font-semibold tracking-tight leading-tight text-[var(--pt-text-primary)]">
                Invoke Anywhere
              </h2>
            </div>
            <p className="text-[var(--pt-text-secondary)] leading-relaxed text-lg">
              Prompt Tuner gets out of your way. Simply select text in any chat
              interface (ChatGPT, Claude, Gemini) and press:
            </p>
            <div className="w-full bg-[var(--pt-bg-elevated)] border border-[var(--pt-surface-border)] rounded-xl p-8 flex justify-center items-center shadow-sm mt-4">
              <KeyboardShortcut variant="hero" keys={["⌘", "⇧", "K"]} />
              <span className="text-[var(--pt-text-tertiary)] mx-4 text-sm font-medium">OR</span>
              <KeyboardShortcut variant="hero" keys={["Ctrl", "⇧", "K"]} />
            </div>
          </div>
        );
      case 2:
        return (
          <div className="flex flex-col items-start space-y-5 animate-in fade-in slide-in-from-bottom-4 w-full">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-[var(--pt-accent-light)] flex items-center justify-center">
                <Cpu className="text-[var(--pt-accent)] w-6 h-6" />
              </div>
              <h2 className="text-2xl font-semibold tracking-tight leading-tight text-[var(--pt-text-primary)]">
                Chrome&apos;s Built-In AI
              </h2>
            </div>
            <p className="text-[var(--pt-text-secondary)] leading-relaxed">
              Prompt Tuner runs 100% locally using Chrome&apos;s built-in Gemini
              Nano model. No API keys, no cloud servers, total privacy.
            </p>

            <div className="flex flex-col space-y-3 w-full mt-4">
              <div className="bg-[var(--pt-bg-elevated)] border border-[var(--pt-surface-border)] rounded-lg p-5 flex flex-col gap-2 shadow-sm">
                <div className="flex items-center justify-between">
                  <h3 className="text-[var(--pt-text-primary)] font-semibold flex items-center gap-2">
                    <span className="bg-[var(--pt-accent-light)] text-[var(--pt-accent)] w-6 h-6 rounded-full inline-flex justify-center items-center text-xs font-bold">
                      1
                    </span>
                    Update Chrome
                  </h3>
                </div>
                <p className="text-sm text-[var(--pt-text-secondary)] ml-8 leading-relaxed">
                  Ensure you are running Chrome version 138 or higher.
                </p>
              </div>

              <div className="bg-[var(--pt-bg-elevated)] border border-[var(--pt-surface-border)] rounded-lg p-5 flex flex-col gap-2 shadow-sm">
                <div className="flex items-center justify-between">
                  <h3 className="text-[var(--pt-text-primary)] font-semibold flex items-center gap-2">
                    <span className="bg-[var(--pt-accent-light)] text-[var(--pt-accent)] w-6 h-6 rounded-full inline-flex justify-center items-center text-xs font-bold">
                      2
                    </span>
                    Enable the Feature Flag
                  </h3>
                </div>
                <p className="text-sm text-[var(--pt-text-secondary)] ml-8 leading-relaxed">
                  Go to{" "}
                  <code className="text-[var(--pt-accent)] bg-[var(--pt-accent-light)] px-2 py-0.5 rounded font-mono text-xs">
                    chrome://flags/#prompt-api-for-gemini-nano
                  </code>{" "}
                  and set it to <strong className="text-[var(--pt-text-primary)]">Enabled</strong>. Relaunch Chrome.
                </p>
              </div>

              <div className="bg-[var(--pt-bg-elevated)] border border-[var(--pt-surface-border)] rounded-lg p-5 flex flex-col gap-2 shadow-sm">
                <div className="flex items-center justify-between">
                  <h3 className="text-[var(--pt-text-primary)] font-semibold flex items-center gap-2">
                    <span className="bg-[var(--pt-accent-light)] text-[var(--pt-accent)] w-6 h-6 rounded-full inline-flex justify-center items-center text-xs font-bold">
                      3
                    </span>
                    Trigger Download
                  </h3>
                </div>
                <p className="text-sm text-[var(--pt-text-secondary)] ml-8 leading-relaxed">
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
          <div className="flex flex-col items-start space-y-6 animate-in fade-in slide-in-from-bottom-4 w-full">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-[var(--pt-accent-light)] flex items-center justify-center">
                <TreeStructure className="text-[var(--pt-accent)] w-6 h-6" />
              </div>
              <h2 className="text-2xl font-semibold tracking-tight leading-tight text-[var(--pt-text-primary)]">
                6 Prompt Engineering Tools
              </h2>
            </div>
            <p className="text-[var(--pt-text-secondary)] leading-relaxed">
              Transform your raw thoughts into highly effective prompts using
              built-in tactics.
            </p>

            <div className="grid grid-cols-2 gap-3 w-full">
              {ACTIONS.map((action) => {
                const Icon = action.icon;
                return (
                  <div
                    key={action.id}
                    className="bg-[var(--pt-bg-elevated)] border border-[var(--pt-surface-border)] rounded-lg p-4 flex flex-col gap-2 relative overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center gap-2 text-[var(--pt-text-primary)] font-medium">
                      <Icon className="w-4 h-4 text-[var(--pt-accent)]" />
                      {action.label}
                    </div>
                    <p className="text-xs text-[var(--pt-text-secondary)] leading-relaxed">
                      {action.description}
                    </p>
                    {action.type === "primary" && (
                      <div className="absolute top-0 right-0 py-1 px-3 text-[10px] uppercase font-bold text-[var(--pt-accent)] bg-[var(--pt-accent-light)] rounded-bl-lg">
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
          <div className="flex flex-col items-start space-y-6 animate-in fade-in slide-in-from-bottom-4 max-w-xl">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-[var(--pt-accent-light)] flex items-center justify-center">
                <Play className="text-[var(--pt-accent)] w-6 h-6" />
              </div>
              <h2 className="text-2xl font-semibold tracking-tight leading-tight text-[var(--pt-text-primary)]">
                Power User Mode
              </h2>
            </div>
            <p className="text-[var(--pt-text-secondary)] leading-relaxed text-lg">
              Once you find your groove, clicking through the palette can feel
              slow.
            </p>
            <div className="w-full bg-[var(--pt-bg-elevated)] border border-[var(--pt-surface-border)] rounded-xl p-6 flex flex-col items-start gap-4 shadow-sm">
              <p className="text-[var(--pt-text-primary)] leading-relaxed">
                Open the extension popup and enable <strong>Run on Open</strong>
                . Select a <strong>Default Action</strong> (like Optimize).
              </p>
              <hr className="w-full border-[var(--pt-surface-border)]" />
              <p className="text-[var(--pt-text-secondary)] text-sm flex items-center gap-2">
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
          <div className="flex flex-col items-center text-center space-y-7 animate-in fade-in slide-in-from-bottom-4 outline-none pb-8">
            <div className="h-20 w-20 rounded-full bg-[var(--pt-accent-light)] flex items-center justify-center shadow-[var(--pt-shadow)]">
              <CheckCircle
                className="text-[var(--pt-accent)] w-10 h-10"
                weight="fill"
              />
            </div>
            <h1 className="text-3xl font-bold tracking-tight leading-tight text-[var(--pt-text-primary)]">
              You&apos;re all set!
            </h1>
            <p className="text-lg text-[var(--pt-text-secondary)] max-w-sm leading-relaxed">
              Ready to start tuning prompts. Select some text in an AI chat and
              hit the shortcut!
            </p>
            <Button
              className="mt-4 px-8 bg-[var(--pt-accent)] hover:bg-[var(--pt-accent-hover)] text-white shadow-sm"
              onClick={() => {
                window.close();
              }}
            >
              Close this tab
            </Button>
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
          className="absolute -top-12 left-0 w-full"
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
        <div className="min-h-[500px] bg-[var(--pt-surface)] border border-[var(--pt-surface-border)] rounded-[var(--pt-radius-lg)] p-12 flex flex-col overflow-hidden relative shadow-[var(--pt-shadow-lg)]">
          <div className="flex-1 flex items-center justify-center">
            {renderStepContent()}
          </div>

          <div className="flex items-center justify-between pt-8 border-t border-[var(--pt-surface-border)] mt-10">
            <div>
              {step === 0 ? (
                <button
                  onClick={handleSkip}
                  className="text-sm text-[var(--pt-text-secondary)] hover:text-[var(--pt-text-primary)] transition-colors"
                >
                  Skip tutorial
                </button>
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
              <Button onClick={handleNext} className="gap-2 bg-[var(--pt-accent)] hover:bg-[var(--pt-accent-hover)] text-white shadow-sm">
                Continue <ArrowRight weight="regular" />
              </Button>
            ) : (
              <Button
                onClick={() => void handleComplete()}
                className="gap-2 bg-[var(--pt-accent)] hover:bg-[var(--pt-accent-hover)] text-white shadow-sm"
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

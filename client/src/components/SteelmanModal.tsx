import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { X } from "lucide-react";

interface SteelmanModalProps {
  isOpen: boolean;
  onClose: () => void;
  originalArgument: string;
  onSubmit: (restatement: string) => void;
  isLoading?: boolean;
}

export default function SteelmanModal({
  isOpen,
  onClose,
  originalArgument,
  onSubmit,
  isLoading = false,
}: SteelmanModalProps) {
  const [restatement, setRestatement] = useState("");
  const [step, setStep] = useState<"restate" | "waiting" | "approved" | "rejected">("restate");

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (restatement.trim()) {
      onSubmit(restatement);
      setStep("waiting");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-serif text-2xl font-bold">Before You Disagree</h2>
            <button
              onClick={onClose}
              className="p-1 hover:bg-muted rounded transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {step === "restate" && (
            <>
              {/* Original Argument */}
              <div className="mb-6 p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground mb-2">Original argument:</p>
                <p className="font-serif text-base leading-relaxed">{originalArgument}</p>
              </div>

              {/* Instructions */}
              <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-sm font-medium mb-2">
                  ✓ Restate this argument in your own words
                </p>
                <p className="text-sm text-muted-foreground">
                  Show that you understand the original author's position fairly and accurately.
                  The author will confirm whether you've captured their argument correctly.
                </p>
              </div>

              {/* Restatement Input */}
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">Your restatement:</label>
                <textarea
                  value={restatement}
                  onChange={(e) => setRestatement(e.target.value)}
                  placeholder="Restate the argument you're responding to..."
                  rows={5}
                  className="w-full px-3 py-2 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-accent resize-none"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Be fair and thorough. Avoid strawmanning or misrepresenting the argument.
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={!restatement.trim() || isLoading}
                >
                  {isLoading ? "Submitting..." : "Submit Restatement"}
                </Button>
              </div>
            </>
          )}

          {step === "waiting" && (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900 mb-4">
                <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              </div>
              <p className="font-medium mb-2">Waiting for author feedback</p>
              <p className="text-sm text-muted-foreground">
                The original author will review your restatement and confirm whether you've
                captured their argument fairly.
              </p>
            </div>
          )}

          {step === "approved" && (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 dark:bg-green-900 mb-4">
                <span className="text-xl">✓</span>
              </div>
              <p className="font-medium mb-2">Great! Your restatement was approved</p>
              <p className="text-sm text-muted-foreground mb-6">
                You can now post your response or critique.
              </p>
              <Button onClick={onClose}>Continue</Button>
            </div>
          )}

          {step === "rejected" && (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900 mb-4">
                <span className="text-xl">→</span>
              </div>
              <p className="font-medium mb-2">Your restatement needs revision</p>
              <p className="text-sm text-muted-foreground mb-6">
                The author indicated your restatement doesn't quite capture their position.
                Please revise and try again.
              </p>
              <Button onClick={() => setStep("restate")}>Revise Restatement</Button>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

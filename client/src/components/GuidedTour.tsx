import React, { useState, useEffect } from 'react';
import { HelpCircle, ChevronRight, ChevronLeft, Check, X } from 'lucide-react';

export interface TourStep {
  title: string;
  description: string;
  tip?: string;
}

interface GuidedTourProps {
  pageKey: string;
  steps: TourStep[];
}

export const GuidedTour: React.FC<GuidedTourProps> = ({ pageKey, steps }) => {
  const storageKey = `kind_table_tour_completed_${pageKey}`;
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const hasCompleted = localStorage.getItem(storageKey);
    if (!hasCompleted) {
      // First visit: show automatically after a short delay
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 700);
      return () => clearTimeout(timer);
    }
  }, [storageKey]);

  const handleComplete = () => {
    localStorage.setItem(storageKey, 'true');
    setIsOpen(false);
    setCurrentStep(0);
  };

  const handleSkip = () => {
    localStorage.setItem(storageKey, 'true');
    setIsOpen(false);
    setCurrentStep(0);
  };

  const handleRestart = () => {
    setCurrentStep(0);
    setIsOpen(true);
  };

  return (
    <>
      {/* Help / Restart Tour button */}
      <button
        type="button"
        onClick={handleRestart}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg text-stone-600 dark:text-stone-300 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors focus:ring-2 focus:ring-emerald-600"
        title="Start 3-step guided tour"
      >
        <HelpCircle className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
        <span>Quick tour</span>
      </button>

      {/* Tour Dialog Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fadeIn">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="tour-title"
            className="w-full max-w-md bg-white dark:bg-stone-900 rounded-2xl shadow-2xl border border-stone-200 dark:border-stone-800 p-6 animate-slide-down"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-400">
                Step {currentStep + 1} of {steps.length}
              </span>
              <button
                type="button"
                onClick={handleSkip}
                className="p-1 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 rounded-lg"
                aria-label="Skip tour"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="my-5">
              <h3 id="tour-title" className="text-lg font-bold text-stone-900 dark:text-stone-100 mb-2">
                {steps[currentStep].title}
              </h3>
              <p className="text-sm text-stone-600 dark:text-stone-300 leading-relaxed">
                {steps[currentStep].description}
              </p>
              {steps[currentStep].tip && (
                <div className="mt-3 p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-xs text-amber-900 dark:text-amber-200">
                  <span className="font-semibold">Tip: </span>
                  {steps[currentStep].tip}
                </div>
              )}
            </div>

            {/* Progress dots & Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-stone-100 dark:border-stone-800">
              <div className="flex gap-1.5" aria-hidden="true">
                {steps.map((_, idx) => (
                  <span
                    key={idx}
                    className={`h-2 rounded-full transition-all ${
                      idx === currentStep
                        ? 'w-6 bg-emerald-700 dark:bg-emerald-500'
                        : 'w-2 bg-stone-300 dark:bg-stone-700'
                    }`}
                  />
                ))}
              </div>

              <div className="flex items-center gap-2">
                {currentStep > 0 && (
                  <button
                    type="button"
                    onClick={() => setCurrentStep((c) => c - 1)}
                    className="inline-flex items-center px-3 py-1.5 text-xs font-semibold rounded-lg text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800"
                  >
                    <ChevronLeft className="w-3.5 h-3.5 mr-1" />
                    Back
                  </button>
                )}

                {currentStep < steps.length - 1 ? (
                  <button
                    type="button"
                    onClick={() => setCurrentStep((c) => c + 1)}
                    className="inline-flex items-center px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-800 hover:bg-emerald-900 text-white shadow-sm"
                  >
                    Next
                    <ChevronRight className="w-3.5 h-3.5 ml-1" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleComplete}
                    className="inline-flex items-center px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-800 hover:bg-emerald-900 text-white shadow-sm"
                  >
                    <Check className="w-3.5 h-3.5 mr-1" />
                    Got it, let's start!
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

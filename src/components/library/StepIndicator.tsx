import { Check } from "lucide-react";

interface Step {
  id: number;
  label: string;
}

interface StepIndicatorProps {
  steps: Step[];
  currentStep: number;
}

export default function StepIndicator({ steps, currentStep }: StepIndicatorProps) {
  return (
    <div className="flex items-center justify-center gap-4 py-6">
      {steps.map((step, index) => {
        const stepNumber = index + 1;
        const isActive = stepNumber === currentStep;
        const isDone = stepNumber < currentStep;

        return (
          <div key={step.id} className="flex items-center gap-4">

            {/* circle */}
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-full font-bold
              ${
                isDone
                  ? "bg-green-500 text-white"
                  : isActive
                  ? "bg-blue-500 text-white"
                  : "bg-gray-300 text-gray-700"
              }`}
            >
              {isDone ? <Check className="h-5 w-5" /> : stepNumber}
            </div>

            {/* line between steps */}
            {index < steps.length - 1 && (
              <div
                className={`w-10 h-1 ${
                  stepNumber < currentStep ? "bg-green-500" : "bg-gray-300"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
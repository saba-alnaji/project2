import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface Step {
  id: number;
  label: string;
  icon?: React.ReactNode;
}

interface StepIndicatorProps {
  steps: Step[];
  currentStep: number;
}

export default function StepIndicator({ steps, currentStep }: StepIndicatorProps) {
  return (
    <div className="flex items-center justify-center gap-0 mb-8">
      {steps.map((step, index) => {
        const isDone = currentStep > step.id;
        const isActive = currentStep === step.id;
        const isPending = currentStep < step.id;

        return (
          <div key={step.id} className="flex items-center">
            {/* Step circle */}
            <div className="flex flex-col items-center">
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300",
                isDone && "step-done",
                isActive && "step-active animate-pulse-ring",
                isPending && "step-pending"
              )}>
                {isDone ? <Check className="w-5 h-5" /> : step.id}
              </div>
              <span className={cn(
                "mt-2 text-xs font-medium whitespace-nowrap",
                isActive && "text-primary font-semibold",
                isPending && "text-muted-foreground",
                isDone && "text-success"
              )}>
                {step.label}
              </span>
            </div>

            {/* Connector */}
            {index < steps.length - 1 && (
              <div className={cn(
                "w-16 sm:w-24 h-0.5 mb-5 mx-1 transition-all duration-500",
                currentStep > step.id ? "bg-success" : "bg-border"
              )} />
            )}
          </div>
        );
      })}
    </div>
  );
}
interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
}

export default function ProgressBar({ currentStep, totalSteps }: ProgressBarProps) {
  const progress = (currentStep / totalSteps) * 100;

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-slate-700">
          Step {currentStep} of {totalSteps}
        </span>
        <span className="text-sm text-slate-500">{Math.round(progress)}%</span>
      </div>
      <div className="w-full bg-slate-200 rounded-full h-2.5" role="progressbar" aria-valuenow={currentStep} aria-valuemin={1} aria-valuemax={totalSteps}>
        <div
          className="bg-blue-600 h-2.5 rounded-full transition-all duration-300 ease-in-out"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
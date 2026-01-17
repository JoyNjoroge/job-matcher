import { cn } from "@/lib/utils";

interface FitScoreRingProps {
  score: number;
  size?: "sm" | "md" | "lg";
}

export function FitScoreRing({ score, size = "md" }: FitScoreRingProps) {
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const sizeClasses = {
    sm: "h-16 w-16",
    md: "h-24 w-24",
    lg: "h-32 w-32",
  };

  const textSizes = {
    sm: "text-lg",
    md: "text-2xl",
    lg: "text-4xl",
  };

  const getScoreColor = () => {
    if (score >= 70) return "text-fit-strong stroke-fit-strong";
    if (score >= 40) return "text-fit-medium stroke-fit-medium";
    return "text-fit-low stroke-fit-low";
  };

  return (
    <div className={cn("relative", sizeClasses[size])}>
      <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          strokeWidth="8"
          className="stroke-muted"
        />
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className={cn("transition-all duration-1000 ease-out", getScoreColor())}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={cn("font-bold", textSizes[size], getScoreColor())}>
          {score}
        </span>
      </div>
    </div>
  );
}

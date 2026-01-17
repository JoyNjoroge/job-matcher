import { cn } from "@/lib/utils";

interface LikelihoodBadgeProps {
  likelihood: "low" | "medium" | "high";
}

export function LikelihoodBadge({ likelihood }: LikelihoodBadgeProps) {
  const config = {
    low: {
      label: "Low",
      className: "bg-fit-low/10 text-fit-low border-fit-low/20",
    },
    medium: {
      label: "Medium",
      className: "bg-fit-medium/10 text-fit-medium border-fit-medium/20",
    },
    high: {
      label: "High",
      className: "bg-fit-strong/10 text-fit-strong border-fit-strong/20",
    },
  };

  const { label, className } = config[likelihood];

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium",
        className
      )}
    >
      {label} Likelihood
    </span>
  );
}

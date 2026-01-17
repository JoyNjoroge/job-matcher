import { CheckCircle, AlertTriangle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface AnalysisCardProps {
  title: string;
  items: string[];
  type: "strengths" | "gaps" | "red_flags";
}

export function AnalysisCard({ title, items, type }: AnalysisCardProps) {
  const config = {
    strengths: {
      icon: CheckCircle,
      iconClass: "text-fit-strong",
      bgClass: "bg-fit-strong/5 border-fit-strong/20",
    },
    gaps: {
      icon: AlertTriangle,
      iconClass: "text-fit-medium",
      bgClass: "bg-fit-medium/5 border-fit-medium/20",
    },
    red_flags: {
      icon: XCircle,
      iconClass: "text-fit-low",
      bgClass: "bg-fit-low/5 border-fit-low/20",
    },
  };

  const { icon: Icon, iconClass, bgClass } = config[type];

  if (items.length === 0) return null;

  return (
    <div className={cn("rounded-xl border p-6", bgClass)}>
      <div className="flex items-center gap-2 mb-4">
        <Icon className={cn("h-5 w-5", iconClass)} />
        <h3 className="font-semibold text-foreground">{title}</h3>
      </div>
      <ul className="space-y-2">
        {items.map((item, index) => (
          <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
            <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-current shrink-0" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface InterviewQuestionProps {
  question: string;
  whatTheyTest: string;
  talkingPoints: string[];
  index: number;
}

export function InterviewQuestion({
  question,
  whatTheyTest,
  talkingPoints,
  index,
}: InterviewQuestionProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-start gap-4 p-5 text-left hover:bg-muted/50 transition-colors"
      >
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
          {index + 1}
        </span>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-foreground">{question}</p>
        </div>
        <ChevronDown
          className={cn(
            "h-5 w-5 shrink-0 text-muted-foreground transition-transform",
            isOpen && "rotate-180"
          )}
        />
      </button>
      
      {isOpen && (
        <div className="border-t border-border bg-muted/30 px-5 py-4 space-y-4">
          <div>
            <h4 className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">
              What they're testing
            </h4>
            <p className="text-sm text-foreground">{whatTheyTest}</p>
          </div>
          
          <div>
            <h4 className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">
              Suggested talking points
            </h4>
            <ul className="space-y-1.5">
              {talkingPoints.map((point, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                  {point}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

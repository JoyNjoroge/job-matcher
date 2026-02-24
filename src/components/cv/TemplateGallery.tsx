import { cn } from "@/lib/utils";
import type { CVTemplate } from "@/types/jsonResume";
import { FileText, Zap, Award } from "lucide-react";

const templates: { id: CVTemplate; name: string; subtitle: string; icon: typeof FileText }[] = [
  { id: "ats-crusher", name: "The ATS Crusher", subtitle: "Clean / Minimal", icon: FileText },
  { id: "startup", name: "The Startup", subtitle: "Modern / Bold", icon: Zap },
  { id: "executive", name: "The Executive", subtitle: "Serif / Classic", icon: Award },
];

interface Props {
  selected: CVTemplate;
  onSelect: (t: CVTemplate) => void;
}

export function TemplateGallery({ selected, onSelect }: Props) {
  return (
    <div className="flex gap-3">
      {templates.map((t) => {
        const Icon = t.icon;
        const active = selected === t.id;
        return (
          <button
            key={t.id}
            onClick={() => onSelect(t.id)}
            className={cn(
              "flex items-center gap-3 rounded-lg border px-4 py-3 text-left transition-all flex-1",
              active
                ? "border-primary bg-primary/10 ring-2 ring-primary/20"
                : "border-border bg-card hover:border-primary/40"
            )}
          >
            <Icon className={cn("h-5 w-5", active ? "text-primary" : "text-muted-foreground")} />
            <div>
              <p className={cn("text-sm font-semibold", active ? "text-primary" : "text-foreground")}>{t.name}</p>
              <p className="text-xs text-muted-foreground">{t.subtitle}</p>
            </div>
          </button>
        );
      })}
    </div>
  );
}

import { cn } from "@/lib/utils";
import type { CVTemplate } from "@/types/jsonResume";
import { FileText, Zap, Award, Columns, Minus, Palette } from "lucide-react";

const TEMPLATES: {
  id: CVTemplate;
  name: string;
  subtitle: string;
  icon: typeof FileText;
  color: string;
}[] = [
  {
    id: "ats-crusher",
    name: "ATS Crusher",
    subtitle: "Clean · Single column · Max compatibility",
    icon: FileText,
    color: "#2563EB",
  },
  {
    id: "startup",
    name: "Startup",
    subtitle: "Modern · Indigo header · Bold",
    icon: Zap,
    color: "#4338CA",
  },
  {
    id: "executive",
    name: "Executive",
    subtitle: "Serif · Centred · Classic",
    icon: Award,
    color: "#1a1a1a",
  },
  {
    id: "nova",
    name: "Nova",
    subtitle: "Two-column · Blue sidebar",
    icon: Columns,
    color: "#1e3a5f",
  },
  {
    id: "minimal-ink",
    name: "Minimal Ink",
    subtitle: "Ultra-clean · Black & white · Designer",
    icon: Minus,
    color: "#111111",
  },
  {
    id: "bold-creative",
    name: "Bold Creative",
    subtitle: "Dark header · Emerald accents",
    icon: Palette,
    color: "#10b981",
  },
];

interface Props {
  selected: CVTemplate;
  onSelect: (t: CVTemplate) => void;
}

export function TemplateGallery({ selected, onSelect }: Props) {
  return (
    <div>
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
        Choose Template
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {TEMPLATES.map((t) => {
          const Icon = t.icon;
          const active = selected === t.id;
          return (
            <button
              key={t.id}
              onClick={() => onSelect(t.id)}
              className={cn(
                "flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-all",
                active
                  ? "border-primary bg-primary/8 ring-2 ring-primary/20 shadow-sm"
                  : "border-border bg-card hover:border-primary/40 hover:bg-muted/40"
              )}
            >
              <div
                className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: active ? t.color : "var(--muted, #f3f4f6)" }}
              >
                <Icon
                  className="h-4 w-4"
                  style={{ color: active ? "white" : t.color }}
                />
              </div>
              <div className="min-w-0">
                <p
                  className="text-sm font-semibold truncate"
                  style={{ color: active ? t.color : undefined }}
                >
                  {t.name}
                </p>
                <p className="text-xs text-muted-foreground truncate leading-tight">
                  {t.subtitle}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

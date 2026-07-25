import { Heart, Linkedin, Github } from "lucide-react";
import { Button } from "@/components/ui/button";

const socialLinks = [
  {
    name: "LinkedIn",
    href: "https://www.linkedin.com/in/joynjorogesaas/",
    icon: Linkedin,
  },
  {
    name: "GitHub",
    href: "https://github.com/JoyNjoroge",
    icon: Github,
  },
];

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-muted/30">
      <div className="container py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>© {currentYear} CandorApply. All rights reserved.</span>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              {socialLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <Button
                    key={link.name}
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 text-muted-foreground hover:text-foreground"
                    asChild
                  >
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={link.name}
                    >
                      <Icon className="h-4 w-4" />
                    </a>
                  </Button>
                );
              })}
            </div>
            
            <div className="h-4 w-px bg-border" />
            
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <span>Made with</span>
              <Heart className="h-4 w-4 text-red-500 fill-red-500 animate-pulse" />
              <span>by</span>
              <a 
                href="https://www.linkedin.com/in/joynjorogesaas/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="font-medium text-foreground hover:text-primary transition-colors"
              >
                Joy Njoroge
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

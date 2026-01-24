import { Link } from "react-router-dom";
import { FileSearch, Search, LayoutGrid, Send, ArrowRight, Sparkles, Target, Zap, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const features = [
  {
    icon: FileSearch,
    title: "Analyze Your Fit",
    description: "Upload your CV and paste a job description to get an instant fit score, strengths, gaps, and interview likelihood.",
    link: "/analyze",
    linkText: "Start Analysis",
    gradient: "from-blue-500 to-cyan-400",
  },
  {
    icon: Search,
    title: "Search Jobs",
    description: "Find opportunities across multiple platforms with powerful filters for role, location, and experience level.",
    link: "/search",
    linkText: "Browse Jobs",
    gradient: "from-violet-500 to-purple-400",
  },
  {
    icon: LayoutGrid,
    title: "Track Applications",
    description: "Keep all your applications organized in a visual kanban board sorted by fit score and status.",
    link: "/board",
    linkText: "View Board",
    gradient: "from-emerald-500 to-teal-400",
  },
  {
    icon: Send,
    title: "AI-Powered Apply",
    description: "Generate tailored cover letters, application emails, and get ATS compatibility tips for each role.",
    link: "/apply",
    linkText: "Prepare Application",
    gradient: "from-orange-500 to-amber-400",
  },
];

const stats = [
  { value: "85%", label: "Match Accuracy" },
  { value: "10x", label: "Faster Applications" },
  { value: "500+", label: "Jobs Indexed Daily" },
];

export default function HomePage() {
  return (
    <div className="space-y-24 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl" />
        </div>
        
        <div className="text-center space-y-8 py-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
            <Sparkles className="h-4 w-4" />
            AI-Powered Job Application Assistant
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-foreground">
            Job Applications
            <br />
            <span className="bg-gradient-to-r from-primary via-violet-500 to-primary bg-clip-text text-transparent">
              Made Easy
            </span>
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            From finding the perfect role to crafting the perfect application—ApplyBot Pro guides you through every step with AI-powered insights.
          </p>
          
          <div className="flex flex-wrap justify-center gap-4">
            <Button asChild size="lg" className="gap-2 text-base h-12 px-8">
              <Link to="/analyze">
                Get Started
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="gap-2 text-base h-12 px-8">
              <Link to="/search">
                Browse Jobs
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="grid grid-cols-3 gap-8 max-w-3xl mx-auto">
        {stats.map((stat) => (
          <div key={stat.label} className="text-center">
            <div className="text-4xl font-bold text-foreground">{stat.value}</div>
            <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
          </div>
        ))}
      </section>

      {/* How It Works */}
      <section className="space-y-12">
        <div className="text-center space-y-4">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">How It Works</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Four simple steps to land your dream job faster than ever before.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card key={feature.title} className="group relative overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5">
                <CardContent className="p-8 space-y-6">
                  <div className="flex items-start justify-between">
                    <div className={`p-3 rounded-xl bg-gradient-to-br ${feature.gradient} shadow-lg`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <span className="text-6xl font-bold text-muted/20 group-hover:text-muted/40 transition-colors">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                  </div>
                  
                  <div className="space-y-3">
                    <h3 className="text-xl font-semibold text-foreground">{feature.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                  </div>
                  
                  <Button asChild variant="ghost" className="gap-2 p-0 h-auto text-primary hover:text-primary hover:bg-transparent group/btn">
                    <Link to={feature.link}>
                      {feature.linkText}
                      <ArrowRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Benefits Section */}
      <section className="relative">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-muted/30 to-transparent rounded-3xl" />
        
        <div className="p-12 space-y-8">
          <div className="text-center space-y-4">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">Why ApplyBot Pro?</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Stop wasting time on applications that don't match. Focus on opportunities where you'll shine.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[
              { icon: Target, title: "Smart Matching", desc: "AI analyzes your skills against job requirements" },
              { icon: Zap, title: "Save Time", desc: "Auto-generate tailored applications in seconds" },
              { icon: CheckCircle, title: "Stay Organized", desc: "Track every application in one place" },
            ].map((benefit) => {
              const Icon = benefit.icon;
              return (
                <div key={benefit.title} className="text-center space-y-3 p-6">
                  <div className="inline-flex p-3 rounded-full bg-primary/10">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground">{benefit.title}</h3>
                  <p className="text-sm text-muted-foreground">{benefit.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="text-center space-y-6 py-8">
        <h2 className="text-3xl md:text-4xl font-bold text-foreground">
          Ready to Land Your Dream Job?
        </h2>
        <p className="text-muted-foreground max-w-lg mx-auto">
          Start analyzing job fits, searching opportunities, and applying smarter today.
        </p>
        <Button asChild size="lg" className="gap-2 text-base h-12 px-8">
          <Link to="/analyze">
            Start Free Analysis
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </section>
    </div>
  );
}

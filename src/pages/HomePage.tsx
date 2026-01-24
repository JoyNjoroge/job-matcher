import { Link } from "react-router-dom";
import { FileSearch, Search, LayoutGrid, Send, ArrowRight, Sparkles, Target, Zap, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Lottie from "lottie-react";

// Lottie animation data for each feature
const analyzeAnimation = {
  v: "5.7.4",
  fr: 30,
  ip: 0,
  op: 60,
  w: 100,
  h: 100,
  layers: [
    {
      ty: 4,
      nm: "circle",
      sr: 1,
      ks: {
        o: { a: 0, k: 100 },
        r: { a: 1, k: [{ t: 0, s: [0], e: [360] }, { t: 60, s: [360] }] },
        p: { a: 0, k: [50, 50] },
        s: { a: 1, k: [{ t: 0, s: [90, 90], e: [100, 100] }, { t: 30, s: [100, 100], e: [90, 90] }, { t: 60, s: [90, 90] }] }
      },
      shapes: [
        {
          ty: "el",
          p: { a: 0, k: [0, 0] },
          s: { a: 0, k: [60, 60] }
        },
        {
          ty: "st",
          c: { a: 0, k: [0.2, 0.6, 1, 1] },
          o: { a: 0, k: 100 },
          w: { a: 0, k: 4 },
          d: [{ n: "d", nm: "dash", v: { a: 0, k: 10 } }, { n: "g", nm: "gap", v: { a: 0, k: 5 } }]
        }
      ]
    }
  ]
};

const searchAnimation = {
  v: "5.7.4",
  fr: 30,
  ip: 0,
  op: 60,
  w: 100,
  h: 100,
  layers: [
    {
      ty: 4,
      nm: "magnifier",
      sr: 1,
      ks: {
        o: { a: 0, k: 100 },
        r: { a: 0, k: 0 },
        p: { a: 1, k: [{ t: 0, s: [50, 50], e: [55, 45] }, { t: 15, s: [55, 45], e: [45, 55] }, { t: 30, s: [45, 55], e: [55, 50] }, { t: 45, s: [55, 50], e: [50, 50] }, { t: 60, s: [50, 50] }] },
        s: { a: 0, k: [100, 100] }
      },
      shapes: [
        {
          ty: "el",
          p: { a: 0, k: [0, 0] },
          s: { a: 0, k: [40, 40] }
        },
        {
          ty: "st",
          c: { a: 0, k: [0.5, 0.3, 0.9, 1] },
          o: { a: 0, k: 100 },
          w: { a: 0, k: 5 }
        }
      ]
    }
  ]
};

const trackAnimation = {
  v: "5.7.4",
  fr: 30,
  ip: 0,
  op: 60,
  w: 100,
  h: 100,
  layers: [
    {
      ty: 4,
      nm: "bars",
      sr: 1,
      ks: {
        o: { a: 0, k: 100 },
        r: { a: 0, k: 0 },
        p: { a: 0, k: [50, 50] },
        s: { a: 0, k: [100, 100] }
      },
      shapes: [
        {
          ty: "rc",
          p: { a: 0, k: [-20, 10] },
          s: { a: 1, k: [{ t: 0, s: [15, 30], e: [15, 50] }, { t: 30, s: [15, 50], e: [15, 30] }, { t: 60, s: [15, 30] }] },
          r: { a: 0, k: 4 }
        },
        {
          ty: "rc",
          p: { a: 0, k: [0, 5] },
          s: { a: 1, k: [{ t: 10, s: [15, 40], e: [15, 55] }, { t: 40, s: [15, 55], e: [15, 40] }, { t: 60, s: [15, 40] }] },
          r: { a: 0, k: 4 }
        },
        {
          ty: "rc",
          p: { a: 0, k: [20, 0] },
          s: { a: 1, k: [{ t: 20, s: [15, 50], e: [15, 35] }, { t: 50, s: [15, 35], e: [15, 50] }, { t: 60, s: [15, 50] }] },
          r: { a: 0, k: 4 }
        },
        {
          ty: "fl",
          c: { a: 0, k: [0.2, 0.8, 0.6, 1] },
          o: { a: 0, k: 100 }
        }
      ]
    }
  ]
};

const applyAnimation = {
  v: "5.7.4",
  fr: 30,
  ip: 0,
  op: 60,
  w: 100,
  h: 100,
  layers: [
    {
      ty: 4,
      nm: "plane",
      sr: 1,
      ks: {
        o: { a: 0, k: 100 },
        r: { a: 1, k: [{ t: 0, s: [-45], e: [-35] }, { t: 15, s: [-35], e: [-45] }, { t: 30, s: [-45], e: [-55] }, { t: 45, s: [-55], e: [-45] }, { t: 60, s: [-45] }] },
        p: { a: 1, k: [{ t: 0, s: [50, 50], e: [55, 45] }, { t: 30, s: [55, 45], e: [50, 50] }, { t: 60, s: [50, 50] }] },
        s: { a: 0, k: [100, 100] }
      },
      shapes: [
        {
          ty: "sr",
          p: { a: 0, k: [0, 0] },
          or: { a: 0, k: 25 },
          ir: { a: 0, k: 12 },
          pt: { a: 0, k: 3 },
          r: { a: 0, k: 0 }
        },
        {
          ty: "fl",
          c: { a: 0, k: [1, 0.6, 0.2, 1] },
          o: { a: 0, k: 100 }
        }
      ]
    }
  ]
};

const features = [
  {
    icon: FileSearch,
    title: "Analyze Your Fit",
    description: "Upload your CV and paste a job description to get an instant fit score, strengths, gaps, and interview likelihood.",
    link: "/analyze",
    linkText: "Start Analysis",
    gradient: "from-blue-500 to-cyan-400",
    animation: analyzeAnimation,
  },
  {
    icon: Search,
    title: "Search Jobs",
    description: "Find opportunities across multiple platforms with powerful filters for role, location, and experience level.",
    link: "/search",
    linkText: "Browse Jobs",
    gradient: "from-violet-500 to-purple-400",
    animation: searchAnimation,
  },
  {
    icon: LayoutGrid,
    title: "Track Applications",
    description: "Keep all your applications organized in a visual kanban board sorted by fit score and status.",
    link: "/board",
    linkText: "View Board",
    gradient: "from-emerald-500 to-teal-400",
    animation: trackAnimation,
  },
  {
    icon: Send,
    title: "AI-Powered Apply",
    description: "Generate tailored cover letters, application emails, and get ATS compatibility tips for each role.",
    link: "/apply",
    linkText: "Prepare Application",
    gradient: "from-orange-500 to-amber-400",
    animation: applyAnimation,
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
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        </div>
        
        <div className="text-center space-y-8 py-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium animate-fade-in">
            <Sparkles className="h-4 w-4" />
            AI-Powered Job Application Assistant
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-foreground animate-fade-in" style={{ animationDelay: '0.1s' }}>
            Job Applications
            <br />
            <span className="bg-gradient-to-r from-primary via-violet-500 to-primary bg-clip-text text-transparent bg-[length:200%_auto] animate-[gradient_3s_linear_infinite]">
              Made Easy
            </span>
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed animate-fade-in" style={{ animationDelay: '0.2s' }}>
            From finding the perfect role to crafting the perfect application—ApplyBot Pro guides you through every step with AI-powered insights.
          </p>
          
          <div className="flex flex-wrap justify-center gap-4 animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <Button asChild size="lg" className="gap-2 text-base h-12 px-8 shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-shadow">
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
        {stats.map((stat, index) => (
          <div key={stat.label} className="text-center animate-fade-in" style={{ animationDelay: `${0.1 * index}s` }}>
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
              <Card 
                key={feature.title} 
                className="group relative overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 animate-fade-in"
                style={{ animationDelay: `${0.1 * index}s` }}
              >
                <CardContent className="p-8 space-y-6">
                  <div className="flex items-start justify-between">
                    <div className={`relative p-3 rounded-xl bg-gradient-to-br ${feature.gradient} shadow-lg`}>
                      <Icon className="h-6 w-6 text-white" />
                      <div className="absolute -right-8 -top-8 w-20 h-20 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                        <Lottie 
                          animationData={feature.animation} 
                          loop={true}
                          className="w-full h-full"
                        />
                      </div>
                    </div>
                    <span className="text-6xl font-bold text-muted/20 group-hover:text-muted/40 transition-colors">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                  </div>
                  
                  <div className="space-y-3">
                    <h3 className="text-xl font-semibold text-foreground group-hover:text-primary transition-colors">{feature.title}</h3>
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
            ].map((benefit, index) => {
              const Icon = benefit.icon;
              return (
                <div 
                  key={benefit.title} 
                  className="text-center space-y-3 p-6 rounded-2xl hover:bg-background/50 transition-colors animate-fade-in"
                  style={{ animationDelay: `${0.1 * index}s` }}
                >
                  <div className="inline-flex p-3 rounded-full bg-primary/10 group-hover:scale-110 transition-transform">
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
        <Button asChild size="lg" className="gap-2 text-base h-12 px-8 shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-shadow">
          <Link to="/analyze">
            Start Free Analysis
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </section>
    </div>
  );
}

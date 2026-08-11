import { Button } from "@/components/ui/button";
import { getLoginUrl } from "@/const";
import { Shield, Zap, BarChart3, Lock, AlertTriangle, TrendingUp, ArrowRight, CheckCircle2 } from "lucide-react";
import { useEffect, useState } from "react";

export default function Home() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const features = [
    {
      icon: Shield,
      title: "Real-Time Detection",
      description: "Detect DDoS attacks in milliseconds with advanced ML algorithms",
      color: "from-blue-500 to-cyan-400",
    },
    {
      icon: Zap,
      title: "Instant Mitigation",
      description: "Automatically block threats with IP filtering and rate limiting",
      color: "from-cyan-400 to-blue-500",
    },
    {
      icon: BarChart3,
      title: "Deep Analytics",
      description: "Comprehensive attack forensics and traffic pattern analysis",
      color: "from-purple-500 to-pink-400",
    },
    {
      icon: Lock,
      title: "Enterprise Security",
      description: "Role-based access control with audit logging and compliance",
      color: "from-orange-500 to-red-400",
    },
  ];

  const benefits = [
    "99.99% uptime guarantee",
    "Sub-millisecond detection latency",
    "Multi-layer attack protection",
    "Global threat intelligence",
    "24/7 automated response",
    "Detailed incident reporting",
  ];

  return (
    <div className="min-h-screen bg-[#09090b] text-[#f5f8f8] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-950/20 via-background to-background overflow-hidden font-sans">
      {/* Navigation */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled ? "bg-black/60 backdrop-blur-md shadow-lg border-b border-cyan-500/20" : "bg-transparent"
        }`}
      >
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center neon-glow-cyan">
              <Shield className="w-6 h-6 text-black" />
            </div>
            <span className="text-xl font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-primary to-purple-400">SentinelFlow</span>
          </div>
          <a href={getLoginUrl()}>
            <Button className="bg-transparent border border-cyan-400/50 text-cyan-400 hover:bg-cyan-400 hover:text-black font-semibold px-6 py-2 rounded-lg transition-all duration-300 hover:scale-105 neon-border-cyan neon-glow-cyan/20">
              Sign In
            </Button>
          </a>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: "1s" }} />
        </div>

        <div className="relative container mx-auto max-w-4xl text-center">
          <div className="inline-block mb-6 px-4 py-2 bg-cyan-950/30 rounded-full border border-cyan-500/30 backdrop-blur-sm">
            <span className="text-sm font-semibold text-cyan-400">🚀 Enterprise-Grade DDoS Protection</span>
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6 leading-tight tracking-tight">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500">Detect & Mitigate</span>
            <br />
            <span className="text-[#f5f8f8] drop-shadow-[0_0_15px_rgba(0,242,255,0.15)]">DDoS Attacks in Real-Time</span>
          </h1>

          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
            SentinelFlow provides advanced threat detection, instant mitigation, and comprehensive analytics to protect your infrastructure from sophisticated DDoS attacks.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <a href={getLoginUrl()}>
              <Button className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:shadow-lg hover:shadow-cyan-400/50 text-black font-bold px-8 py-3 rounded-lg transition-all duration-300 hover:scale-105 group">
                Get Started <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </a>
            <Button
              variant="outline"
              className="border border-purple-500/50 text-purple-400 hover:bg-purple-500/10 font-semibold px-8 py-3 rounded-lg transition-all duration-300"
            >
              Watch Demo
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-6 mb-16">
            <div className="glass-card hud-border p-6 rounded-lg">
              <div className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">99.99%</div>
              <div className="text-sm text-muted-foreground">Uptime SLA</div>
            </div>
            <div className="glass-card hud-border p-6 rounded-lg">
              <div className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">&lt;1ms</div>
              <div className="text-sm text-muted-foreground">Detection Latency</div>
            </div>
            <div className="glass-card hud-border p-6 rounded-lg">
              <div className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400">1M+</div>
              <div className="text-sm text-muted-foreground">Threats Blocked</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-black/20 border-y border-cyan-500/10">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 tracking-tight">Powerful Features</h2>
            <p className="text-lg text-muted-foreground">Everything you need to protect your infrastructure</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {features.map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <div
                  key={idx}
                  className="group glass-card hud-border p-8 hover:neon-glow-primary transition-all duration-300 animate-fade-in-up"
                  style={{ animationDelay: `${idx * 100}ms` }}
                >
                  <div className={`w-14 h-14 rounded-lg bg-gradient-to-br ${feature.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 neon-glow-cyan/20`}>
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-4xl">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold mb-6 tracking-tight">Why Choose SentinelFlow?</h2>
              <div className="space-y-4">
                {benefits.map((benefit, idx) => (
                  <div key={idx} className="flex items-center gap-3 animate-fade-in-up" style={{ animationDelay: `${idx * 50}ms` }}>
                    <CheckCircle2 className="w-5 h-5 text-cyan-400 flex-shrink-0" />
                    <span className="text-lg text-[#f5f8f8]">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-purple-500/10 rounded-2xl blur-2xl" />
              <div className="relative glass-card hud-border rounded-2xl p-8 shadow-2xl">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-black/40 border border-cyan-500/20 rounded-lg">
                    <span className="font-semibold text-sm text-[#f5f8f8]">Real-time Threats</span>
                    <TrendingUp className="w-4 h-4 text-red-500 animate-pulse" />
                  </div>
                  <div className="flex items-center justify-between p-4 bg-black/40 border border-cyan-500/20 rounded-lg">
                    <span className="font-semibold text-sm text-[#f5f8f8]">Blocked Attacks</span>
                    <Shield className="w-4 h-4 text-cyan-400 animate-bounce-in" />
                  </div>
                  <div className="flex items-center justify-between p-4 bg-black/40 border border-cyan-500/20 rounded-lg">
                    <span className="font-semibold text-sm text-[#f5f8f8]">System Status</span>
                    <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_#22c55e]" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-cyan-950/40 via-purple-950/30 to-black/80 border-t border-cyan-500/10 relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-cyan-500/5 to-transparent blur-3xl pointer-events-none" />
        <div className="relative container mx-auto max-w-4xl text-center">
          <h2 className="text-4xl font-bold mb-4 tracking-tight">Ready to Protect Your Infrastructure?</h2>
          <p className="text-lg mb-8 text-cyan-200/80">Join thousands of enterprises using SentinelFlow for advanced DDoS protection.</p>
          <a href={getLoginUrl()}>
            <Button className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:shadow-lg hover:shadow-cyan-400/50 text-black font-bold px-8 py-3 rounded-lg transition-all duration-300 hover:scale-105">
              Start Free Trial <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black/60 border-t border-cyan-500/10 py-8 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center gap-2 mb-4 md:mb-0">
              <Shield className="w-5 h-5 text-cyan-400" />
              <span className="font-semibold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">SentinelFlow</span>
            </div>
            <p className="text-sm text-muted-foreground">© 2026 SentinelFlow. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

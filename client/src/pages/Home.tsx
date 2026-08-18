import { Button } from "@/components/ui/button";
import { getLoginUrl } from "@/const";
import { Shield, Lock, Activity, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import ThreeDExplodedNodes from "@/components/ThreeDExplodedNodes";

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
      tag: "01 / DETECT",
      title: "Volumetric ML Parsing",
      description: "Applies isolation forest modeling to classify multi-vector DDoS surges in under 1.2ms.",
    },
    {
      icon: Activity,
      tag: "02 / MONITOR",
      title: "Real-time Metrics Pipeline",
      description: "Continuous telemetry monitoring of packet rate velocity, protocol ratios, and network entropy.",
    },
    {
      icon: RefreshCw,
      tag: "03 / MITIGATE",
      title: "Scrubber Routing Control",
      description: "Instant mitigation response including hardware IP filtering and dynamic playbooks.",
    },
    {
      icon: Lock,
      tag: "04 / SECURE",
      title: "Audit Integrity Logs",
      description: "Cryptographically verified action logging with granular tenant and role permissions.",
    },
  ];

  return (
    <div className="min-h-screen bg-[#0c0d10] text-[#e2e8f0] drafting-grid font-sans relative">
      {/* Background blueprint details */}
      <div className="absolute top-12 left-12 w-24 h-[0.5px] bg-[#c5a880]/15 pointer-events-none" />
      <div className="absolute top-12 left-12 h-24 w-[0.5px] bg-[#c5a880]/15 pointer-events-none" />
      <div className="absolute bottom-12 right-12 w-24 h-[0.5px] bg-[#c5a880]/15 pointer-events-none" />
      <div className="absolute bottom-12 right-12 h-24 w-[0.5px] bg-[#c5a880]/15 pointer-events-none" />

      {/* Navigation */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled ? "bg-[#0c0d10]/90 backdrop-blur-md border-b border-[#c5a880]/15 shadow-sm" : "bg-transparent border-b border-transparent"
        }`}
      >
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 border border-[#c5a880]/40 flex items-center justify-center relative">
              <div className="absolute inset-0.5 border border-[#c5a880]/20" />
              <Shield className="w-4 h-4 text-[#c5a880]" />
            </div>
            <span className="font-serif text-lg tracking-widest text-[#c5a880] uppercase">SentinelFlow</span>
          </div>
          <a href={getLoginUrl()}>
            <Button className="bg-transparent border border-[#c5a880]/40 text-[#c5a880] hover:bg-[#c5a880]/10 font-mono text-xs uppercase px-5 py-1.5 rounded-none tracking-wider">
              Authenticate
            </Button>
          </a>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Content Column */}
            <div className="lg:col-span-5 space-y-8 text-left z-10">
              <div className="inline-block px-3 py-1 border border-[#c5a880]/20 bg-[#13151a]/50 text-[#c5a880] font-mono text-[10px] tracking-widest uppercase">
                [ SECURE INGRESS MITIGATION DAEMON ]
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif text-[#e2e8f0] leading-none tracking-tight">
                ANOMALY DETECTION <br />
                <span className="text-[#c5a880]">FOR NETWORKS</span>
              </h1>

              <p className="text-sm text-muted-foreground max-w-lg leading-relaxed font-sans">
                SentinelFlow deploys modular ML classification filters to inspect multi-vector DDoS spikes at the sub-millisecond layer, triggering automated hardware routing mitigation.
              </p>

              <div className="flex gap-4">
                <a href={getLoginUrl()}>
                  <Button className="bg-[#c5a880] text-[#0d0e12] hover:bg-[#b09670] font-mono text-xs uppercase tracking-widest px-8 py-4 rounded-none">
                    Start Scrubber
                  </Button>
                </a>
                <a href="#specification">
                  <Button
                    variant="outline"
                    className="border border-border/60 hover:bg-card/40 text-muted-foreground hover:text-[#e2e8f0] font-mono text-xs uppercase tracking-widest px-8 py-4 rounded-none"
                  >
                    Tech Specs
                  </Button>
                </a>
              </div>

              {/* Stats Block */}
              <div className="grid grid-cols-3 border border-[#c5a880]/15 divide-x divide-[#c5a880]/15 bg-[#13151a]/20">
                <div className="p-4 text-center">
                  <div className="font-mono text-lg font-bold text-[#c5a880]">99.99%</div>
                  <div className="text-[9px] font-mono text-muted-foreground uppercase tracking-wider">UPTIME_SLA</div>
                </div>
                <div className="p-4 text-center">
                  <div className="font-mono text-lg font-bold text-[#c5a880]">&lt;1.2ms</div>
                  <div className="text-[9px] font-mono text-muted-foreground uppercase tracking-wider">ANALYSIS_LT</div>
                </div>
                <div className="p-4 text-center">
                  <div className="font-mono text-lg font-bold text-[#c5a880]">1M+</div>
                  <div className="text-[9px] font-mono text-muted-foreground uppercase tracking-wider">BLOCKED_ATTACKS</div>
                </div>
              </div>
            </div>

            {/* Right Interactive 3D Column */}
            <div className="lg:col-span-7 h-[450px] w-full animate-fade-in-up">
              <ThreeDExplodedNodes />
            </div>

          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="specification" className="py-20 border-t border-[#c5a880]/10 bg-[#0a0b0d]/40">
        <div className="container mx-auto">
          <div className="mb-16 border-l border-[#c5a880]/40 pl-6">
            <div className="text-xs font-mono text-[#c5a880] tracking-widest uppercase mb-1">SYSTEM SPECIFICATIONS</div>
            <h2 className="text-2xl font-serif tracking-widest text-[#e2e8f0] uppercase">PROACTIVE DETECTOR CAPABILITIES</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <div
                  key={idx}
                  className="hud-border p-6 bg-[#13151a]/30 transition-all duration-300 hover:border-[#c5a880]/40"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-8 h-8 border border-border flex items-center justify-center">
                      <Icon className="w-4 h-4 text-[#c5a880]" />
                    </div>
                    <span className="font-mono text-[9px] text-[#c5a880]/70 tracking-widest">{feature.tag}</span>
                  </div>
                  <h3 className="font-serif text-sm font-bold text-[#e2e8f0] uppercase tracking-wider mb-2">{feature.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* System Technical Rules Section */}
      <section className="py-20 border-t border-[#c5a880]/10">
        <div className="container mx-auto max-w-4xl">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h2 className="text-2xl font-serif tracking-wider text-[#e2e8f0] uppercase">MITIGATION PLATFORM ARCHITECTURE</h2>
              
              <div className="space-y-3 font-mono text-xs text-muted-foreground">
                <div className="flex items-start gap-2">
                  <span className="text-[#c5a880]">[+]</span>
                  <span>IP rate-limit scrubbing enabled globally</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-[#c5a880]">[+]</span>
                  <span>Automated threat payload forensic export</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-[#c5a880]">[+]</span>
                  <span>Real-time webhook notification callbacks</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-[#c5a880]">[+]</span>
                  <span>Asynchronous Python ML model pipeline</span>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="hud-border bg-[#13151a]/40 p-6 space-y-4">
                <div className="flex items-center justify-between p-3 border border-border bg-[#0c0d10] font-mono text-[10px]">
                  <span>VOLUMETRIC_THRESHOLD:</span>
                  <span className="text-red-500 font-bold">12,000 GBPS</span>
                </div>
                <div className="flex items-center justify-between p-3 border border-border bg-[#0c0d10] font-mono text-[10px]">
                  <span>RESPONSE_DAEMON:</span>
                  <span className="text-[#c5a880]">MITIGATION_ACTIVE</span>
                </div>
                <div className="flex items-center justify-between p-3 border border-border bg-[#0c0d10] font-mono text-[10px]">
                  <span>ANOMALY_ENGINE:</span>
                  <span className="text-green-500">SYSTEM_NOMINAL</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#c5a880]/10 py-8 bg-[#0a0b0d]/60 font-mono text-[10px]">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between text-muted-foreground">
            <div className="flex items-center gap-2 mb-4 md:mb-0">
              <Shield className="w-4 h-4 text-[#c5a880]" />
              <span className="tracking-widest uppercase text-[#e2e8f0] font-serif text-xs">SentinelFlow</span>
            </div>
            <div>© 2026 SENTINELFLOW SYSTEMS LLC. ALL RIGHTS RESERVED.</div>
          </div>
        </div>
      </footer>
    </div>
  );
}

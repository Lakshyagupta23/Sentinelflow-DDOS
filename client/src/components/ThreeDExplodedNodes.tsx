import { useEffect, useRef, useState } from "react";

interface Node3D {
  id: string;
  name: string;
  x: number; // 3D coordinates (-150 to 150)
  y: number;
  z: number;
  type: "core" | "edge" | "db" | "mitigation" | "monitoring";
  ip: string;
  details: string;
}

export default function ThreeDExplodedNodes() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [, setActiveNode] = useState<Node3D | null>(null);

  // Nodes definition representing the SentinelFlow security nodes
  const nodes: Node3D[] = [
    { id: "core", name: "SENTINEL COGNITIVE CORE", x: 0, y: 0, z: 0, type: "core", ip: "10.0.0.1", details: "Real-time supervised & unsupervised anomaly detection module." },
    { id: "edge1", name: "EDGE GATEWAY [US-EAST]", x: -120, y: -70, z: 50, type: "edge", ip: "162.254.204.1", details: "Filtering layer 3/4 volumetric packets at connection ingress." },
    { id: "edge2", name: "EDGE GATEWAY [EU-CENTRAL]", x: 120, y: -50, z: -50, type: "edge", ip: "162.254.205.14", details: "Intercepting protocol-based DNS/NTP reflection query metrics." },
    { id: "mit1", name: "HYDRA MITIGATION SCRUBBER", x: -80, y: 90, z: -80, type: "mitigation", ip: "10.0.8.20", details: "Injecting hardware rate-limit filters and dynamic CAPTCHA rules." },
    { id: "db1", name: "MIGRATION STORAGE LOGS", x: 80, y: 80, z: 80, type: "db", ip: "10.0.12.5", details: "Drizzle ORM transactional audit log storage & statistics database." },
    { id: "mon1", name: "ANOMALY DETECTION DAEMON", x: 0, y: -130, z: 20, type: "monitoring", ip: "127.0.0.1", details: "Express background daemon checking ML-service pipeline health." },
  ];

  // Connection pipelines
  const connections = [
    { from: "edge1", to: "core" },
    { from: "edge2", to: "core" },
    { from: "core", to: "mit1" },
    { from: "core", to: "db1" },
    { from: "mon1", to: "core" },
    { from: "edge1", to: "mon1" },
    { from: "edge2", to: "mon1" },
  ];

  useEffect(() => {
    const handleScroll = () => {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (scrollHeight > 0) {
        setScrollProgress(window.scrollY / scrollHeight);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let rotationAngle = 0;

    // Resize handler
    const resizeCanvas = () => {
      if (canvas.parentElement) {
        canvas.width = canvas.parentElement.clientWidth;
        canvas.height = canvas.parentElement.clientHeight || 500;
      }
    };
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    // Track mouse coordinates
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      setMousePos({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    };
    canvas.addEventListener("mousemove", handleMouseMove);

    // 3D perspective projection formula
    const project = (x: number, y: number, z: number, angle: number, scroll: number) => {
      // Disassembly drift factor on scroll
      const explodeFactor = 1 + scroll * 1.6;
      const ex = x * explodeFactor;
      const ey = y * explodeFactor;
      const ez = z * explodeFactor;

      // Rotate around Y axis
      const cosY = Math.cos(angle);
      const sinY = Math.sin(angle);
      const rx = ex * cosY - ez * sinY;
      const rz = ex * sinY + ez * cosY;

      // Pitch angle tilt
      const tilt = 0.35;
      const cosX = Math.cos(tilt);
      const sinX = Math.sin(tilt);
      const ry = ey * cosX - rz * sinX;
      const finalZ = ey * sinX + rz * cosX;

      // FOV calculations
      const fov = 400;
      const scale = fov / (fov + finalZ);
      const projX = canvas.width / 2 + rx * scale;
      const projY = canvas.height / 2 + ry * scale;

      return { x: projX, y: projY, scale };
    };

    // Render logic loop
    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      rotationAngle += 0.0025;

      // Technical grid overlay
      ctx.strokeStyle = "rgba(197, 168, 128, 0.025)";
      ctx.lineWidth = 1;
      const gridSize = 40;
      for (let x = 0; x < canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      // Outer security ring boundary
      ctx.strokeStyle = "rgba(197, 168, 128, 0.05)";
      ctx.beginPath();
      ctx.arc(canvas.width / 2, canvas.height / 2, 170 * (1 + scrollProgress * 0.4), 0, Math.PI * 2);
      ctx.stroke();

      // Map 3D points
      const projectedNodes = nodes.map((node) => {
        const proj = project(node.x, node.y, node.z, rotationAngle, scrollProgress);
        return { ...node, proj };
      });

      // Render network links
      connections.forEach(({ from, to }) => {
        const nodeFrom = projectedNodes.find((n) => n.id === from);
        const nodeTo = projectedNodes.find((n) => n.id === to);

        if (nodeFrom && nodeTo) {
          ctx.strokeStyle = "rgba(197, 168, 128, 0.15)";
          ctx.lineWidth = 0.75;
          ctx.beginPath();
          ctx.moveTo(nodeFrom.proj.x, nodeFrom.proj.y);
          ctx.lineTo(nodeTo.proj.x, nodeTo.proj.y);
          ctx.stroke();

          // Stream packets along links
          const time = Date.now() * 0.001;
          const flowSpeed = 0.4;
          const ratio = (time * flowSpeed) % 1.0;
          const px = nodeFrom.proj.x + (nodeTo.proj.x - nodeFrom.proj.x) * ratio;
          const py = nodeFrom.proj.y + (nodeTo.proj.y - nodeFrom.proj.y) * ratio;

          ctx.fillStyle = "#c5a880";
          ctx.beginPath();
          ctx.arc(px, py, 2, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      // Render nodes & verify mouse hover proximity
      let hovered: typeof nodes[0] | null = null;
      let minDistance = 24;

      projectedNodes.forEach((node) => {
        const dx = mousePos.x - node.proj.x;
        const dy = mousePos.y - node.proj.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < minDistance) {
          hovered = node;
          minDistance = dist;
        }

        const size = (node.type === "core" ? 8 : 4.5) * node.proj.scale;

        // Custom square nodes (handmade drafting blueprints style)
        ctx.strokeStyle = node.type === "core" ? "#c5a880" : "rgba(197, 168, 128, 0.45)";
        ctx.lineWidth = 1;
        ctx.strokeRect(node.proj.x - size - 2, node.proj.y - size - 2, size * 2 + 4, size * 2 + 4);

        if (node.type === "core") {
          ctx.fillStyle = "rgba(197, 168, 128, 0.15)";
          ctx.fillRect(node.proj.x - size, node.proj.y - size, size * 2, size * 2);
          ctx.fillStyle = "#c5a880";
          ctx.beginPath();
          ctx.arc(node.proj.x, node.proj.y, size * 0.4, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillStyle = "rgba(197, 168, 128, 0.65)";
          ctx.beginPath();
          ctx.arc(node.proj.x, node.proj.y, size * 0.8, 0, Math.PI * 2);
          ctx.fill();
        }

        // Small coordinate label next to node
        ctx.fillStyle = "rgba(197, 168, 128, 0.45)";
        ctx.font = "7.5px monospace";
        ctx.fillText(node.id.toUpperCase(), node.proj.x + size + 6, node.proj.y + 3);
      });

      setActiveNode(hovered);

      // Render tactical dashboard overlay box on hover
      if (hovered) {
        const active: Node3D = hovered;
        ctx.save();

        const boxX = Math.min(active.proj.x + 16, canvas.width - 230);
        const boxY = Math.min(active.proj.y - 12, canvas.height - 100);

        // Tooltip box border/glass
        ctx.fillStyle = "rgba(12, 13, 16, 0.95)";
        ctx.strokeStyle = "#c5a880";
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.rect(boxX, boxY, 200, 80);
        ctx.fill();
        ctx.stroke();

        // Node Info Text
        ctx.fillStyle = "#c5a880";
        ctx.font = "bold 9px 'Sora', sans-serif";
        ctx.fillText(active.name, boxX + 10, boxY + 18);

        ctx.fillStyle = "rgba(226, 232, 240, 0.75)";
        ctx.font = "8px monospace";
        ctx.fillText(`NET_IP: ${active.ip}`, boxX + 10, boxY + 34);
        ctx.fillText(`ROLE: ${active.type.toUpperCase()}`, boxX + 10, boxY + 44);

        ctx.fillStyle = "rgba(226, 232, 240, 0.5)";
        ctx.font = "8px 'Sora', sans-serif";
        ctx.fillText(active.details.substring(0, 42), boxX + 10, boxY + 60);
        if (active.details.length > 42) {
          ctx.fillText(active.details.substring(42, 84), boxX + 10, boxY + 70);
        }

        ctx.restore();
      }

      // Draw scroll track meter
      ctx.strokeStyle = "rgba(197, 168, 128, 0.12)";
      ctx.beginPath();
      ctx.moveTo(canvas.width - 25, canvas.height / 2 - 50);
      ctx.lineTo(canvas.width - 25, canvas.height / 2 + 50);
      ctx.stroke();

      // Scroll pointer dot
      ctx.fillStyle = "#c5a880";
      const scrollY = (canvas.height / 2 - 50) + scrollProgress * 100;
      ctx.beginPath();
      ctx.arc(canvas.width - 25, scrollY, 3, 0, Math.PI * 2);
      ctx.fill();

      // Label rotating vertically
      ctx.save();
      ctx.translate(canvas.width - 32, canvas.height / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.fillStyle = "rgba(197, 168, 128, 0.3)";
      ctx.font = "7px monospace";
      ctx.textAlign = "center";
      ctx.fillText(`GRAVITY DRIFT MODULE: ${(1 + scrollProgress * 1.6).toFixed(2)}X`, 0, 0);
      ctx.restore();

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", resizeCanvas);
      canvas.removeEventListener("mousemove", handleMouseMove);
    };
  }, [scrollProgress, mousePos]);

  const rawAngle = Date.now() * 0.00025;

  return (
    <div className="relative w-full h-full min-h-[420px] border border-border bg-card/5 backdrop-blur-[1px] rounded-sm overflow-hidden select-none">
      {/* Corner blueprints design notches */}
      <div className="absolute top-[-1px] left-[-1px] w-2 h-2 border-t border-l border-primary" />
      <div className="absolute top-[-1px] right-[-1px] w-2 h-2 border-t border-r border-primary" />
      <div className="absolute bottom-[-1px] left-[-1px] w-2 h-2 border-b border-l border-primary" />
      <div className="absolute bottom-[-1px] right-[-1px] w-2 h-2 border-b border-r border-primary" />
      
      <canvas ref={canvasRef} className="block w-full h-full cursor-crosshair" />

      {/* Blueprint Coordinates Overlay */}
      <div className="absolute bottom-2.5 left-2.5 text-[7px] font-mono text-muted-foreground space-y-0.5 pointer-events-none">
        <div>CORE: CLOUD_NODE_GRID_3D</div>
        <div>VECTOR_ANGLE: {rawAngle.toFixed(3)} | EXPLODE: {(scrollProgress * 100).toFixed(0)}%</div>
      </div>
    </div>
  );
}

import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { openApiSpec } from "../openapi";
import { getSwaggerUIHtml, getReDocHtml } from "../swagger-ui";
import { realtimeServer } from "../websocket";
import { startAnomalyDetector, stopAnomalyDetector } from "../monitoring/anomaly-detector";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  registerStorageProxy(app);
  registerOAuthRoutes(app);

  // OpenAPI/Swagger documentation
  app.get("/api/openapi.json", (req, res) => {
    res.json(openApiSpec);
  });

  app.get("/api/docs", (req, res) => {
    res.set("Content-Type", "text/html");
    res.send(getSwaggerUIHtml("/api/openapi.json"));
  });

  app.get("/api/redoc", (req, res) => {
    res.set("Content-Type", "text/html");
    res.send(getReDocHtml("/api/openapi.json"));
  });

  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );

  // Initialize WebSocket server
  realtimeServer.initialize(server);
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
    console.log(`API Documentation available at:`);
    console.log(`  - Swagger UI: http://localhost:${port}/api/docs`);
    console.log(`  - ReDoc: http://localhost:${port}/api/redoc`);
    console.log(`  - OpenAPI JSON: http://localhost:${port}/api/openapi.json`);
    console.log(`  - WebSocket: ws://localhost:${port}/api/ws`);
    startAnomalyDetector();
  });
}

startServer().catch(console.error);

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received, shutting down gracefully...");
  stopAnomalyDetector();
  realtimeServer.shutdown();
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("SIGINT received, shutting down gracefully...");
  stopAnomalyDetector();
  realtimeServer.shutdown();
  process.exit(0);
});

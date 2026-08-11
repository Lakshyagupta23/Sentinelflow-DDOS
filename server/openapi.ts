/**
 * OpenAPI/Swagger Documentation for SentinelFlow API
 */

export const openApiSpec = {
  openapi: "3.0.0",
  info: {
    title: "SentinelFlow DDoS Detection API",
    description:
      "Enterprise-grade DDoS and traffic anomaly detection platform with real-time monitoring, attack forensics, mitigation controls, and threat intelligence.",
    version: "1.0.0",
    contact: {
      name: "SentinelFlow Support",
      url: "https://sentinelflow.io/support",
    },
    license: {
      name: "MIT",
    },
  },
  servers: [
    {
      url: "/api",
      description: "Production API",
    },
    {
      url: "http://localhost:3000/api",
      description: "Development API",
    },
  ],
  tags: [
    {
      name: "Attacks",
      description: "DDoS attack detection and management",
    },
    {
      name: "Traffic Metrics",
      description: "Real-time traffic monitoring and metrics",
    },
    {
      name: "Alerts",
      description: "Alert configuration and management",
    },
    {
      name: "Mitigation",
      description: "Attack mitigation controls",
    },
    {
      name: "Threat Intelligence",
      description: "Threat intelligence and IP reputation",
    },
    {
      name: "Alert Rules",
      description: "Custom alert rules builder",
    },
    {
      name: "Notifications",
      description: "Real-time notifications",
    },
    {
      name: "Audit Logs",
      description: "System audit logging",
    },
  ],
  paths: {
    "/trpc/attacks.list": {
      post: {
        tags: ["Attacks"],
        summary: "List DDoS attacks",
        description: "Retrieve a list of detected DDoS attacks with optional filtering",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  organizationId: { type: "number" },
                  severity: { type: "string", enum: ["critical", "high", "medium", "low"] },
                  status: { type: "string", enum: ["ongoing", "mitigated", "resolved"] },
                  limit: { type: "number", default: 50 },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "List of attacks",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      id: { type: "number" },
                      organizationId: { type: "number" },
                      attackType: { type: "string" },
                      severity: { type: "string" },
                      status: { type: "string" },
                      peakTraffic: { type: "number" },
                      startTime: { type: "string", format: "date-time" },
                      endTime: { type: "string", format: "date-time" },
                      sourceIp: { type: "string" },
                      targetUrl: { type: "string" },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/trpc/mitigation.createRule": {
      post: {
        tags: ["Mitigation"],
        summary: "Create mitigation rule",
        description: "Create a new mitigation rule (IP block, rate limit, CAPTCHA, geo-blocking)",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  organizationId: { type: "number" },
                  type: { type: "string", enum: ["ip_block", "rate_limit", "captcha_challenge", "geo_block"] },
                  target: { type: "string", description: "IP address, URL pattern, or country code" },
                  threshold: { type: "number", description: "For rate limiting" },
                  duration: { type: "number", description: "Duration in seconds" },
                },
                required: ["organizationId", "type", "target"],
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Mitigation rule created",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    id: { type: "number" },
                    type: { type: "string" },
                    target: { type: "string" },
                    status: { type: "string" },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/trpc/threatIntel.getByIp": {
      post: {
        tags: ["Threat Intelligence"],
        summary: "Get IP reputation",
        description: "Query threat intelligence databases for IP reputation and threat data",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  sourceIp: { type: "string", description: "IP address to lookup" },
                },
                required: ["sourceIp"],
              },
            },
          },
        },
        responses: {
          "200": {
            description: "IP threat intelligence",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    ip: { type: "string" },
                    reputation: { type: "string", enum: ["malicious", "suspicious", "clean"] },
                    threatLevel: { type: "string", enum: ["critical", "high", "medium", "low"] },
                    threatType: { type: "string" },
                    threatActor: { type: "string" },
                    knownBotnets: { type: "array", items: { type: "string" } },
                    lastSeen: { type: "string", format: "date-time" },
                    sources: { type: "array", items: { type: "string" } },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/trpc/alertRules.create": {
      post: {
        tags: ["Alert Rules"],
        summary: "Create custom alert rule",
        description: "Create a custom alert rule with conditions and actions",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  organizationId: { type: "number" },
                  name: { type: "string" },
                  description: { type: "string" },
                  conditions: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        field: { type: "string" },
                        operator: { type: "string", enum: ["equals", "greater_than", "less_than", "contains"] },
                        value: {},
                      },
                    },
                  },
                  logicalOperator: { type: "string", enum: ["AND", "OR"] },
                  actions: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        type: { type: "string", enum: ["email", "slack", "webhook", "sms"] },
                        target: { type: "string" },
                      },
                    },
                  },
                  enabled: { type: "boolean" },
                },
                required: ["organizationId", "name", "conditions", "actions"],
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Alert rule created",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    id: { type: "number" },
                    name: { type: "string" },
                    enabled: { type: "boolean" },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/notifications/sse": {
      get: {
        tags: ["Notifications"],
        summary: "Subscribe to real-time notifications (SSE)",
        description: "Server-Sent Events endpoint for real-time attack and alert notifications",
        responses: {
          "200": {
            description: "Event stream",
            content: {
              "text/event-stream": {
                schema: {
                  type: "object",
                  properties: {
                    type: { type: "string" },
                    title: { type: "string" },
                    message: { type: "string" },
                    severity: { type: "string" },
                    data: { type: "object" },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/ws": {
      get: {
        tags: ["Notifications"],
        summary: "WebSocket connection for real-time updates",
        description: "WebSocket endpoint for low-latency real-time attack feeds and metrics",
        responses: {
          "101": {
            description: "WebSocket upgrade",
          },
        },
      },
    },
  },
  components: {
    schemas: {
      Attack: {
        type: "object",
        properties: {
          id: { type: "number" },
          organizationId: { type: "number" },
          attackType: { type: "string", enum: ["volumetric", "protocol", "application-layer"] },
          severity: { type: "string", enum: ["critical", "high", "medium", "low"] },
          status: { type: "string", enum: ["ongoing", "mitigated", "resolved"] },
          peakTraffic: { type: "number", description: "Peak traffic in Gbps" },
          startTime: { type: "string", format: "date-time" },
          endTime: { type: "string", format: "date-time" },
          sourceIp: { type: "string" },
          targetUrl: { type: "string" },
          userAgent: { type: "string" },
          country: { type: "string" },
        },
      },
      MitigationRule: {
        type: "object",
        properties: {
          id: { type: "number" },
          type: { type: "string", enum: ["ip_block", "rate_limit", "captcha_challenge", "geo_block"] },
          target: { type: "string" },
          threshold: { type: "number" },
          duration: { type: "number" },
          status: { type: "string" },
          createdAt: { type: "string", format: "date-time" },
        },
      },
      ThreatIntel: {
        type: "object",
        properties: {
          ip: { type: "string" },
          reputation: { type: "string", enum: ["malicious", "suspicious", "clean"] },
          threatLevel: { type: "string", enum: ["critical", "high", "medium", "low"] },
          threatType: { type: "string" },
          threatActor: { type: "string" },
          knownBotnets: { type: "array", items: { type: "string" } },
          lastSeen: { type: "string", format: "date-time" },
          sources: { type: "array", items: { type: "string" } },
        },
      },
      AlertRule: {
        type: "object",
        properties: {
          id: { type: "number" },
          name: { type: "string" },
          description: { type: "string" },
          conditions: { type: "array" },
          logicalOperator: { type: "string" },
          actions: { type: "array" },
          enabled: { type: "boolean" },
          createdAt: { type: "string", format: "date-time" },
        },
      },
    },
  },
};

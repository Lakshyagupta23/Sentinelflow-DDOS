import * as db from "../db";
import { ENV } from "../_core/env";
import { realtimeServer } from "../websocket";
import { executePlaybook } from "../playbook-engine-db";
import { nanoid } from "nanoid";
import { eq, and } from "drizzle-orm";
import { playbooks, playbookAutomations } from "../../drizzle/schema";

// Active threat detection interval in ms (5 seconds)
const METRIC_INTERVAL_MS = 5000;
let detectorInterval: NodeJS.Timeout | null = null;
let currentAttackId: string | null = null;

// Helper to simulate network traffic
function simulateTraffic(hasAttack: boolean, attackType?: string) {
  // Normal background traffic values
  let volume = 2.0 + Math.random() * 4.0; // 2 to 6 Gbps
  let rate = 80 + Math.random() * 100;    // 80 to 180 req/s
  let synRatio = 0.01 + Math.random() * 0.05;
  let udpRatio = 0.01 + Math.random() * 0.05;
  let httpRatio = 0.3 + Math.random() * 0.3;
  let ipEntropy = 3.8 + Math.random() * 0.6; // High entropy

  if (hasAttack) {
    if (attackType === "volumetric") {
      volume = 80.0 + Math.random() * 150.0; // 80 to 230 Gbps
      rate = 4000 + Math.random() * 8000;     // 4k to 12k req/s
      synRatio = 0.05 + Math.random() * 0.1;
      udpRatio = 0.05 + Math.random() * 0.1;
      httpRatio = 0.3 + Math.random() * 0.2;
      ipEntropy = 1.0 + Math.random() * 1.2;  // Low entropy (botnet/volumetric source)
    } else if (attackType === "protocol") {
      volume = 15.0 + Math.random() * 40.0;
      rate = 1200 + Math.random() * 2000;
      const isSyn = Math.random() > 0.5;
      if (isSyn) {
        synRatio = 0.8 + Math.random() * 0.18;
        udpRatio = 0.01 + Math.random() * 0.05;
      } else {
        udpRatio = 0.8 + Math.random() * 0.18;
        synRatio = 0.01 + Math.random() * 0.05;
      }
      httpRatio = 0.02 + Math.random() * 0.1;
      ipEntropy = 2.0 + Math.random() * 1.5;
    } else if (attackType === "application_layer") {
      volume = 5.0 + Math.random() * 15.0;
      rate = 800 + Math.random() * 1200;
      httpRatio = 0.85 + Math.random() * 0.13;
      synRatio = 0.01 + Math.random() * 0.05;
      udpRatio = 0.01 + Math.random() * 0.05;
      ipEntropy = 1.5 + Math.random() * 1.2;
    }
  }

  const protocols = {
    http: Math.round(httpRatio * 100),
    https: Math.round((1 - httpRatio - synRatio - udpRatio) * 100),
    tcp_syn: Math.round(synRatio * 100),
    udp: Math.round(udpRatio * 100),
  };

  // Adjust total to 100%
  const total = protocols.http + protocols.https + protocols.tcp_syn + protocols.udp;
  if (total !== 100) {
    protocols.https += (100 - total);
  }

  return { volume, rate, synRatio, udpRatio, httpRatio, ipEntropy, protocols };
}

export function startAnomalyDetector() {
  if (detectorInterval) {
    console.log("[AnomalyDetector] Already running.");
    return;
  }

  console.log("[AnomalyDetector] Initializing AI Anomaly Detection Daemon...");
  
  // Track simulation state
  let ticksSinceLastAttack = 0;
  let activeAttackType: string | null = null;
  let activeAttackSeverity: "low" | "medium" | "high" | "critical" = "medium";
  let activeAttackDbId: number | null = null;

  detectorInterval = setInterval(async () => {
    try {
      const database = await db.getDb();
      if (!database) {
        console.warn("[AnomalyDetector] Database not available, skipping tick.");
        return;
      }

      // Check if we should trigger a new attack (after 15 ticks of calm, 5% chance)
      const hasActiveAttack = currentAttackId !== null;
      if (!hasActiveAttack && ticksSinceLastAttack > 15 && Math.random() < 0.05) {
        currentAttackId = `atk_${nanoid(10)}`;
        const types = ["volumetric", "protocol", "application_layer"];
        activeAttackType = types[Math.floor(Math.random() * types.length)];
        const severities: Array<"low" | "medium" | "high" | "critical"> = ["low", "medium", "high", "critical"];
        activeAttackSeverity = severities[Math.floor(Math.random() * severities.length)];
        ticksSinceLastAttack = 0;
        console.log(`[AnomalyDetector] Triggering simulated ${activeAttackType} attack (${activeAttackSeverity})...`);
      }

      // Simulate traffic metrics
      const traffic = simulateTraffic(hasActiveAttack, activeAttackType || undefined);

      // Record traffic metric in DB
      await db.createTrafficMetric({
        timestamp: new Date(),
        trafficVolume: traffic.volume.toFixed(2),
        requestRate: Math.round(traffic.rate).toString(),
        protocolBreakdown: JSON.stringify(traffic.protocols),
        sourceCountry: "US",
      });

      // Query Python ML Service for prediction
      let prediction = { anomaly: false, score: 0.0 };
      try {
        const mlPredictUrl = `${ENV.mlServiceUrl.replace(/\/$/, "")}/predict`;
        const mlResponse = await fetch(mlPredictUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            trafficVolume: traffic.volume,
            requestRate: traffic.rate,
            tcp_syn_ratio: traffic.synRatio,
            udp_ratio: traffic.udpRatio,
            http_ratio: traffic.httpRatio,
            ip_entropy: traffic.ipEntropy,
          }),
        });

        if (mlResponse.ok) {
          prediction = await mlResponse.json();
        } else {
          console.warn("[AnomalyDetector] Python ML Service returned status:", mlResponse.status);
        }
      } catch (err) {
        // Fallback rule-based logic if ML service is down
        console.warn("[AnomalyDetector] Python ML Service offline, falling back to rule-based logic.");
        const isSpike = traffic.volume > 15.0 || traffic.rate > 800;
        prediction = {
          anomaly: isSpike,
          score: isSpike ? 0.92 : 0.08,
        };
      }

      // Broadcast traffic metrics to frontend via WebSockets
      realtimeServer.broadcastMetricsUpdate(1, {
        timestamp: new Date().toISOString(),
        trafficVolume: parseFloat(traffic.volume.toFixed(2)),
        requestRate: Math.round(traffic.rate),
        protocolBreakdown: JSON.stringify(traffic.protocols),
        sourceCountry: "US",
      });

      // Handle anomaly classification
      if (prediction.anomaly) {
        if (!hasActiveAttack) {
          currentAttackId = `atk_${nanoid(10)}`;
          activeAttackType = traffic.volume > 50 ? "volumetric" : (traffic.synRatio > 0.4 || traffic.udpRatio > 0.4 ? "protocol" : "application_layer");
          activeAttackSeverity = prediction.score > 0.9 ? "critical" : (prediction.score > 0.75 ? "high" : (prediction.score > 0.5 ? "medium" : "low"));
          console.log(`[AnomalyDetector] AI classified traffic as ANOMALOUS (Score: ${prediction.score}). Triggering attack ${currentAttackId}`);
        }

        // Check if the attack exists in the DB, if not insert it
        let ongoingAttacks = await db.getOngoingAttacks();
        let ongoingAttack = ongoingAttacks.find(a => a.attackId === currentAttackId);

        if (!ongoingAttack && currentAttackId) {
          await db.createAttack({
            attackId: currentAttackId,
            type: activeAttackType as any,
            severity: activeAttackSeverity,
            status: "ongoing",
            sourceIp: "192.168.1.100",
            destinationUrl: "https://api.example.com/auth",
            peakTraffic: traffic.volume.toFixed(2),
            startTime: new Date(),
          });

          // Fetch the inserted attack ID
          ongoingAttacks = await db.getOngoingAttacks();
          ongoingAttack = ongoingAttacks.find(a => a.attackId === currentAttackId);
          activeAttackDbId = ongoingAttack?.id || null;

          // Create security alert
          const alertId = `alrt_${nanoid(10)}`;
          const alert = {
            alertId,
            type: "attack_detected" as const,
            severity: activeAttackSeverity,
            message: `AI Anomaly Engine detected active ${activeAttackType} attack with ${activeAttackSeverity} severity (ML Confidence: ${(prediction.score * 100).toFixed(1)}%).`,
            attackId: activeAttackDbId || undefined,
            isRead: false,
          };
          await db.createAlert(alert);

          // Broadcast updates via WebSockets
          realtimeServer.broadcastAlert(1, {
            ...alert,
            id: Math.floor(Math.random() * 10000), // temp numeric ID
            createdAt: new Date().toISOString(),
          });

          realtimeServer.broadcastAttackUpdate(1, {
            ...ongoingAttack,
            startTime: new Date().toISOString(),
          });

          // Trigger automated playbooks
          try {
            const ongoingPlaybooks = await database
              .select({
                playbookId: playbooks.playbookId,
                trigger: playbookAutomations.trigger
              })
              .from(playbooks)
              .innerJoin(playbookAutomations, eq(playbooks.id, playbookAutomations.playbookId))
              .where(and(
                eq(playbooks.organizationId, 1),
                eq(playbooks.isActive, true)
              ));

            const matchingPlaybooks = ongoingPlaybooks.filter(p => {
              const trigger = p.trigger as any;
              return trigger?.type === "attack_detected";
            });

            for (const playbook of matchingPlaybooks) {
              console.log(`[AnomalyDetector] Executing playbook: ${playbook.playbookId}`);
              await executePlaybook(playbook.playbookId, currentAttackId, {
                attackId: currentAttackId,
                type: activeAttackType,
                severity: activeAttackSeverity,
                trafficVolume: traffic.volume,
                requestRate: traffic.rate,
              });
            }
          } catch (pbErr) {
            console.error("[AnomalyDetector] Error triggering playbooks:", pbErr);
          }
        }
      } else {
        // ML classified as normal (anomaly = false)
        if (hasActiveAttack && currentAttackId) {
          console.log(`[AnomalyDetector] AI Anomaly Engine cleared attack ${currentAttackId} (Score: ${prediction.score}). Resolving attack status...`);
          
          // Resolve ongoing attack in DB
          await db.updateAttackStatus(currentAttackId, "resolved");

          // Broadcast update
          const attackRecord = await db.getAttackById(currentAttackId);
          if (attackRecord) {
            realtimeServer.broadcastAttackUpdate(1, {
              ...attackRecord,
              status: "resolved",
              endTime: new Date().toISOString(),
            });
          }

          // Reset state
          currentAttackId = null;
          activeAttackType = null;
          activeAttackDbId = null;
          ticksSinceLastAttack = 0;
        } else {
          ticksSinceLastAttack++;
        }
      }
    } catch (err) {
      console.error("[AnomalyDetector] Error in anomaly detector loop:", err);
    }
  }, METRIC_INTERVAL_MS);
}

export function stopAnomalyDetector() {
  if (detectorInterval) {
    clearInterval(detectorInterval);
    detectorInterval = null;
    console.log("[AnomalyDetector] Stopped AI Anomaly Detection Daemon.");
  }
}

import mysql from 'mysql2/promise';
import { nanoid } from 'nanoid';

const pool = mysql.createPool({
  connectionLimit: 1,
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'ddos_detection',
});

async function seedDemoData() {
  const connection = await pool.getConnection();

  try {
    console.log('🌱 Seeding demo data for DDoS Detection Platform...');

    // Clear existing data
    await connection.query('DELETE FROM attacks');
    await connection.query('DELETE FROM traffic_metrics');
    await connection.query('DELETE FROM alerts');
    await connection.query('DELETE FROM mitigation_rules');
    await connection.query('DELETE FROM top_attack_vectors');

    // Create demo attacks
    const attacks = [
      {
        attackId: nanoid(),
        type: 'volumetric',
        severity: 'critical',
        status: 'ongoing',
        sourceIp: '192.168.1.100',
        destinationUrl: 'https://api.example.com/auth',
        peakTraffic: 15000.50,
        startTime: new Date(Date.now() - 5 * 60000), // 5 minutes ago
        endTime: null,
        duration: null,
        mitigationStatus: 'rate_limiting_active',
      },
      {
        attackId: nanoid(),
        type: 'protocol',
        severity: 'high',
        status: 'mitigated',
        sourceIp: '203.0.113.45',
        destinationUrl: 'https://api.example.com/users',
        peakTraffic: 8500.25,
        startTime: new Date(Date.now() - 30 * 60000), // 30 minutes ago
        endTime: new Date(Date.now() - 10 * 60000), // 10 minutes ago
        duration: 1200,
        mitigationStatus: 'ip_blocked',
      },
      {
        attackId: nanoid(),
        type: 'application_layer',
        severity: 'medium',
        status: 'resolved',
        sourceIp: '198.51.100.89',
        destinationUrl: 'https://api.example.com/search',
        peakTraffic: 3200.75,
        startTime: new Date(Date.now() - 120 * 60000), // 2 hours ago
        endTime: new Date(Date.now() - 90 * 60000), // 1.5 hours ago
        duration: 1800,
        mitigationStatus: 'captcha_challenge',
      },
    ];

    for (const attack of attacks) {
      await connection.query(
        'INSERT INTO attacks (attackId, type, severity, status, sourceIp, destinationUrl, peakTraffic, startTime, endTime, duration, mitigationStatus) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [
          attack.attackId,
          attack.type,
          attack.severity,
          attack.status,
          attack.sourceIp,
          attack.destinationUrl,
          attack.peakTraffic,
          attack.startTime,
          attack.endTime,
          attack.duration,
          attack.mitigationStatus,
        ]
      );
    }

    console.log(`✅ Created ${attacks.length} demo attacks`);

    // Create demo traffic metrics
    const now = Date.now();
    const trafficMetrics = [];
    for (let i = 59; i >= 0; i--) {
      const timestamp = new Date(now - i * 60000);
      const baseVolume = 5000 + Math.random() * 2000;
      const spike = i < 10 ? 8000 : 0; // Spike in recent metrics
      trafficMetrics.push({
        timestamp,
        trafficVolume: baseVolume + spike,
        requestRate: 100 + Math.random() * 50,
        protocolBreakdown: JSON.stringify({
          http: Math.floor(30 + Math.random() * 10),
          https: Math.floor(50 + Math.random() * 10),
          other: Math.floor(5 + Math.random() * 5),
        }),
        sourceCountry: ['US', 'CN', 'RU', 'IN', 'BR'][Math.floor(Math.random() * 5)],
      });
    }

    for (const metric of trafficMetrics) {
      await connection.query(
        'INSERT INTO traffic_metrics (timestamp, trafficVolume, requestRate, protocolBreakdown, sourceCountry) VALUES (?, ?, ?, ?, ?)',
        [
          metric.timestamp,
          metric.trafficVolume,
          metric.requestRate,
          metric.protocolBreakdown,
          metric.sourceCountry,
        ]
      );
    }

    console.log(`✅ Created ${trafficMetrics.length} demo traffic metrics`);

    // Create demo alerts
    const alerts = [
      {
        alertId: nanoid(),
        type: 'attack_detected',
        severity: 'critical',
        message: 'Volumetric DDoS attack detected on API endpoint',
        isRead: false,
        attackId: 1,
      },
      {
        alertId: nanoid(),
        type: 'traffic_spike',
        severity: 'high',
        message: 'Unusual traffic spike detected - 300% above baseline',
        isRead: false,
        attackId: null,
      },
      {
        alertId: nanoid(),
        type: 'anomaly',
        severity: 'medium',
        message: 'Anomalous request pattern from geographic region',
        isRead: true,
        attackId: null,
      },
      {
        alertId: nanoid(),
        type: 'threshold_exceeded',
        severity: 'high',
        message: 'Request rate threshold exceeded - 250 req/s',
        isRead: false,
        attackId: null,
      },
    ];

    for (const alert of alerts) {
      await connection.query(
        'INSERT INTO alerts (alertId, type, severity, message, isRead, attackId) VALUES (?, ?, ?, ?, ?, ?)',
        [alert.alertId, alert.type, alert.severity, alert.message, alert.isRead, alert.attackId]
      );
    }

    console.log(`✅ Created ${alerts.length} demo alerts`);

    // Create demo mitigation rules
    const rules = [
      {
        ruleId: nanoid(),
        type: 'ip_block',
        target: '192.168.1.0/24',
        isActive: true,
        threshold: null,
        duration: null,
        createdBy: null,
      },
      {
        ruleId: nanoid(),
        type: 'rate_limit',
        target: 'https://api.example.com/auth',
        isActive: true,
        threshold: 100,
        duration: 3600,
        createdBy: null,
      },
      {
        ruleId: nanoid(),
        type: 'captcha_challenge',
        target: 'https://api.example.com/search',
        isActive: true,
        threshold: null,
        duration: null,
        createdBy: null,
      },
      {
        ruleId: nanoid(),
        type: 'geo_block',
        target: 'CN',
        isActive: false,
        threshold: null,
        duration: null,
        createdBy: null,
      },
    ];

    for (const rule of rules) {
      await connection.query(
        'INSERT INTO mitigation_rules (ruleId, type, target, isActive, threshold, duration, createdBy) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [rule.ruleId, rule.type, rule.target, rule.isActive, rule.threshold, rule.duration, rule.createdBy]
      );
    }

    console.log(`✅ Created ${rules.length} demo mitigation rules`);

    // Create demo top attack vectors
    const vectors = [
      { vectorType: 'source_ip', value: '192.168.1.100', count: 45000 },
      { vectorType: 'source_ip', value: '203.0.113.45', count: 32000 },
      { vectorType: 'source_ip', value: '198.51.100.89', count: 18000 },
      { vectorType: 'destination_url', value: '/api/auth', count: 40000 },
      { vectorType: 'destination_url', value: '/api/users', count: 35000 },
      { vectorType: 'destination_url', value: '/api/search', count: 20000 },
      { vectorType: 'user_agent', value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', count: 25000 },
      { vectorType: 'user_agent', value: 'curl/7.68.0', count: 15000 },
      { vectorType: 'country', value: 'US', count: 30000 },
      { vectorType: 'country', value: 'CN', count: 25000 },
    ];

    for (const vector of vectors) {
      await connection.query(
        'INSERT INTO top_attack_vectors (vectorType, value, count, timestamp) VALUES (?, ?, ?, ?)',
        [vector.vectorType, vector.value, vector.count, new Date()]
      );
    }

    console.log(`✅ Created ${vectors.length} demo attack vectors`);

    console.log('\n✨ Demo data seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error seeding demo data:', error);
    process.exit(1);
  } finally {
    await connection.release();
    await pool.end();
  }
}

seedDemoData();

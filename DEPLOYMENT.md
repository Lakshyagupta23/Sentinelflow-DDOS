# SentinelFlow - Deployment Guide

## Overview

SentinelFlow is a production-ready DDoS detection and mitigation platform built with React 19, Express 4, tRPC 11, and MySQL. This guide covers deployment, configuration, and operational procedures.

## Pre-Deployment Checklist

- [x] All 86 tests passing
- [x] Zero TypeScript errors
- [x] Database schema migrated
- [x] Environment variables configured
- [x] API documentation generated (/api/docs, /api/redoc)
- [x] WebSocket server configured
- [x] Webhook signing (HMAC) enabled
- [x] RBAC permissions configured
- [x] Audit logging enabled

## Environment Variables

### Required Secrets

```bash
# Database
DATABASE_URL=mysql://user:password@host:3306/ddos_detection

# OAuth
VITE_APP_ID=your_oauth_app_id
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://login.manus.im
JWT_SECRET=your_jwt_secret_key

# Threat Intelligence APIs
ALIENVAULT_OTX_API_KEY=your_otx_api_key
SHODAN_API_KEY=your_shodan_api_key
ABUSEIPDB_API_KEY=your_abuseipdb_api_key

# Manus Built-in APIs
BUILT_IN_FORGE_API_URL=https://api.manus.im
BUILT_IN_FORGE_API_KEY=your_forge_api_key
VITE_FRONTEND_FORGE_API_KEY=your_frontend_forge_key
VITE_FRONTEND_FORGE_API_URL=https://api.manus.im

# Owner Information
OWNER_NAME=your_name
OWNER_OPEN_ID=your_open_id

# Analytics (Optional)
VITE_ANALYTICS_ENDPOINT=https://analytics.example.com
VITE_ANALYTICS_WEBSITE_ID=your_website_id
```

### Optional External Integrations

```bash
# Slack Webhooks
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL

# PagerDuty
PAGERDUTY_API_KEY=your_pagerduty_api_key
PAGERDUTY_SERVICE_ID=your_service_id

# Splunk HEC
SPLUNK_HEC_URL=https://your-splunk-instance:8088
SPLUNK_HEC_TOKEN=your_hec_token
```

## Database Setup

### Initial Migration

```bash
# Generate migrations
pnpm drizzle-kit generate

# Apply migrations
pnpm drizzle-kit push
```

### Tables Created

- `users` - User accounts and authentication
- `organizations` - Multi-tenant organizations
- `organization_members` - Team membership
- `attacks` - DDoS attack records
- `traffic_metrics` - Network traffic data
- `alerts` - Security alerts
- `mitigation_rules` - Automated mitigation policies
- `alert_rules` - Custom alert rules
- `alert_configs` - Alert configurations
- `threat_intelligence` - Threat data cache
- `webhooks` - Webhook endpoints
- `webhook_deliveries` - Webhook delivery logs
- `teams` - Team management
- `team_members` - Team membership
- `playbooks` - Attack response playbooks
- `playbook_automations` - Playbook configurations
- `playbook_executions` - Playbook execution history
- `notifications` - User notifications
- `audit_logs` - Audit trail
- `top_attack_vectors` - Attack statistics

## Deployment Steps

### 1. Build for Production

```bash
# Install dependencies
pnpm install

# Build frontend
pnpm build

# Verify build
ls -la dist/
```

### 2. Start Production Server

```bash
# Set environment
export NODE_ENV=production

# Start server
pnpm start
```

### 3. Verify Endpoints

```bash
# Health check
curl http://localhost:3000/

# API documentation
curl http://localhost:3000/api/docs
curl http://localhost:3000/api/redoc

# OpenAPI schema
curl http://localhost:3000/api/openapi.json

# WebSocket endpoint
ws://localhost:3000/api/ws
```

## API Endpoints

### Authentication

- `POST /api/oauth/callback` - OAuth callback handler
- `POST /api/trpc/auth.logout` - Logout procedure

### DDoS Detection

- `GET /api/trpc/attacks.list` - List recent attacks
- `GET /api/trpc/attacks.getById` - Get attack details
- `POST /api/trpc/attacks.create` - Report attack
- `POST /api/trpc/mitigation.apply` - Apply mitigation

### Alert Management

- `GET /api/trpc/alertRules.list` - List alert rules
- `POST /api/trpc/alertRules.create` - Create alert rule
- `DELETE /api/trpc/alertRules.delete` - Delete alert rule

### Threat Intelligence

- `GET /api/trpc/threatIntel.getByIp` - Get IP reputation
- `GET /api/trpc/threatIntel.enrichThreatIntelligence` - Enrich threat data

### Webhook Management

- `GET /api/trpc/webhooks.list` - List webhooks
- `POST /api/trpc/webhooks.register` - Register webhook
- `DELETE /api/trpc/webhooks.delete` - Delete webhook

### Team Management

- `GET /api/trpc/teams.list` - List teams
- `POST /api/trpc/teams.create` - Create team
- `POST /api/trpc/teams.addMember` - Add team member
- `DELETE /api/trpc/teams.removeMember` - Remove team member

### Playbook Automation

- `GET /api/trpc/playbooks.list` - List playbooks
- `POST /api/trpc/playbooks.create` - Create playbook
- `POST /api/trpc/playbooksAutomation.execute` - Execute playbook
- `GET /api/trpc/playbooksAutomation.getExecution` - Get execution status

### Notifications

- `GET /api/trpc/notifications.list` - List notifications
- `GET /api/trpc/notifications.unread` - Get unread notifications
- `POST /api/trpc/notifications.markAsRead` - Mark as read

## Security Considerations

### Webhook Security

- All webhooks are signed with HMAC-SHA256
- Verify signature header: `X-Webhook-Signature`
- Implement exponential backoff for retries
- Store webhook secrets securely (never log them)

### RBAC Implementation

- Three role levels: `member`, `lead`, `admin`
- Admins can manage team members and permissions
- Leads can execute playbooks and manage alerts
- Members can view dashboards and reports

### Audit Logging

- All user actions logged to `audit_logs` table
- Includes: user ID, action, resource, timestamp, status
- Retention: 90 days minimum
- Review logs regularly for security incidents

## Monitoring & Alerting

### Key Metrics

- Attack detection rate
- Mitigation success rate
- Webhook delivery success rate
- API response time
- Database query performance

### Health Checks

```bash
# Server health
curl http://localhost:3000/health

# Database connection
curl http://localhost:3000/api/trpc/system.health

# Webhook delivery status
curl http://localhost:3000/api/trpc/webhooks.list
```

## Scaling Considerations

### Horizontal Scaling

- Use load balancer (nginx, HAProxy)
- Share database connection pool
- Implement Redis for session caching
- Use message queue for webhook delivery

### Vertical Scaling

- Increase Node.js heap size: `--max-old-space-size=4096`
- Optimize database indexes
- Enable query caching
- Use connection pooling

## Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| Database connection timeout | Check DATABASE_URL, network connectivity, firewall rules |
| OAuth callback fails | Verify VITE_APP_ID, OAUTH_SERVER_URL, redirect URI |
| Webhooks not delivering | Check webhook URL accessibility, verify HMAC signature |
| WebSocket connection fails | Check firewall, verify ws:// protocol support |
| High API latency | Check database indexes, enable query caching |

### Debug Mode

```bash
# Enable debug logging
export DEBUG=sentinelflow:*

# Enable verbose error output
export NODE_ENV=development
```

## Backup & Recovery

### Database Backup

```bash
# Full backup
mysqldump -u user -p database > backup.sql

# Incremental backup
mysqldump -u user -p --single-transaction database > backup.sql

# Restore
mysql -u user -p database < backup.sql
```

### Configuration Backup

```bash
# Backup environment variables
cp .env .env.backup

# Backup webhook configurations
curl http://localhost:3000/api/trpc/webhooks.list > webhooks_backup.json

# Backup playbooks
curl http://localhost:3000/api/trpc/playbooks.list > playbooks_backup.json
```

## Performance Tuning

### Database Optimization

```sql
-- Add indexes for common queries
CREATE INDEX idx_attacks_timestamp ON attacks(createdAt);
CREATE INDEX idx_alerts_organization ON alerts(organizationId);
CREATE INDEX idx_webhooks_organization ON webhooks(organizationId);
CREATE INDEX idx_audit_logs_user ON audit_logs(userId);
```

### Application Optimization

- Enable gzip compression
- Implement response caching
- Use CDN for static assets
- Optimize database queries
- Implement connection pooling

## Support & Maintenance

### Regular Maintenance

- Monitor disk space
- Review and rotate logs
- Update dependencies monthly
- Audit security settings quarterly
- Review webhook delivery logs

### Incident Response

1. Check application logs
2. Verify database connectivity
3. Review recent deployments
4. Check external API status
5. Implement mitigation
6. Document incident

## Additional Resources

- API Documentation: `/api/docs`
- OpenAPI Schema: `/api/openapi.json`
- GitHub Repository: [SentinelFlow](https://github.com/your-org/sentinelflow)
- Issue Tracker: [GitHub Issues](https://github.com/your-org/sentinelflow/issues)

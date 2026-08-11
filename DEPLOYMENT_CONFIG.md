# SentinelFlow Deployment Configuration Guide

## Environment Variables

### Database Configuration
```
DATABASE_URL=mysql://user:password@host:3306/sentinelflow
```

### Authentication & OAuth
```
JWT_SECRET=your-jwt-secret-key-here
VITE_APP_ID=your-manus-app-id
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://manus.im
OWNER_NAME=Your Organization Name
OWNER_OPEN_ID=your-open-id
```

### Manus Built-in APIs
```
BUILT_IN_FORGE_API_URL=https://api.manus.im
BUILT_IN_FORGE_API_KEY=your-forge-api-key
VITE_FRONTEND_FORGE_API_URL=https://api.manus.im
VITE_FRONTEND_FORGE_API_KEY=your-frontend-forge-api-key
```

### Analytics
```
VITE_ANALYTICS_ENDPOINT=https://analytics.manus.im
VITE_ANALYTICS_WEBSITE_ID=your-website-id
VITE_APP_TITLE=SentinelFlow - DDoS Detection Platform
VITE_APP_LOGO=https://your-domain.com/logo.png
```

### External Threat Intelligence
```
ALIENVAULT_OTX_API_KEY=your-alienvault-otx-api-key
SHODAN_API_KEY=your-shodan-api-key
ABUSEIPDB_API_KEY=your-abuseipdb-api-key
```

### Jira Integration
```
JIRA_URL=https://your-jira-instance.atlassian.net
JIRA_USERNAME=your-jira-email@example.com
JIRA_API_TOKEN=your-jira-api-token
JIRA_PROJECT_KEY=SEC
```

**Setup Instructions:**
1. Generate API token at https://id.atlassian.com/manage-profile/security/api-tokens
2. Create a project in Jira for DDoS incidents
3. Note the project key (e.g., SEC)

### ServiceNow Integration
```
SERVICENOW_INSTANCE=your-instance-name
SERVICENOW_USERNAME=your-servicenow-username
SERVICENOW_PASSWORD=your-servicenow-password
```

**Setup Instructions:**
1. Create a ServiceNow user account with incident creation permissions
2. Enable REST API access in ServiceNow
3. Note your instance name (from your ServiceNow URL)

### Slack Integration
```
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
SLACK_BOT_TOKEN=xoxb-your-bot-token
SLACK_CHANNEL=#security-alerts
```

**Setup Instructions:**
1. Create a Slack app at https://api.slack.com/apps
2. Enable Incoming Webhooks
3. Create a webhook for your security channel
4. Create a bot token with chat:write permission

### PagerDuty Integration
```
PAGERDUTY_API_KEY=your-pagerduty-api-key
PAGERDUTY_SERVICE_ID=your-service-id
```

**Setup Instructions:**
1. Generate API token at https://pagerduty.com/account/settings/integrations
2. Create a service for DDoS incidents
3. Note the service ID

### Splunk Integration
```
SPLUNK_HEC_URL=https://your-splunk-instance.com:8088
SPLUNK_HEC_TOKEN=your-hec-token
SPLUNK_INDEX=ddos_detection
```

**Setup Instructions:**
1. Enable HTTP Event Collector in Splunk
2. Create a new HEC token
3. Create an index for DDoS events

## Deployment Platforms

### Docker Deployment
```dockerfile
FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm build
EXPOSE 3000
CMD ["pnpm", "start"]
```

### Kubernetes Deployment
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: sentinelflow
spec:
  replicas: 3
  selector:
    matchLabels:
      app: sentinelflow
  template:
    metadata:
      labels:
        app: sentinelflow
    spec:
      containers:
      - name: sentinelflow
        image: your-registry/sentinelflow:latest
        ports:
        - containerPort: 3000
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: sentinelflow-secrets
              key: database-url
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: sentinelflow-secrets
              key: jwt-secret
        livenessProbe:
          httpGet:
            path: /health/live
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health/ready
            port: 3000
          initialDelaySeconds: 10
          periodSeconds: 5
```

### Cloud Run Deployment
```bash
gcloud run deploy sentinelflow \
  --source . \
  --platform managed \
  --region us-central1 \
  --set-env-vars DATABASE_URL=$DATABASE_URL \
  --set-env-vars JWT_SECRET=$JWT_SECRET \
  --memory 512Mi \
  --cpu 1 \
  --timeout 180
```

## Database Setup

### Initial Migration
```bash
# Generate migration
pnpm drizzle-kit generate

# Apply migration
pnpm drizzle-kit migrate

# Or manually via SQL
mysql -u user -p sentinelflow < drizzle/migrations/0001_initial.sql
```

### Backup Configuration
```bash
# Daily backup script
0 2 * * * mysqldump -u user -p sentinelflow > /backups/sentinelflow-$(date +\%Y\%m\%d).sql

# Restore from backup
mysql -u user -p sentinelflow < /backups/sentinelflow-20240101.sql
```

## SSL/TLS Configuration

### Let's Encrypt with Nginx
```nginx
server {
    listen 443 ssl http2;
    server_name sentinelflow.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/sentinelflow.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/sentinelflow.yourdomain.com/privkey.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Auto-renewal
```bash
certbot renew --quiet --no-eff-email
```

## Monitoring Setup

### Health Check Endpoints
- **Liveness:** `GET /health/live` - Is the service running?
- **Readiness:** `GET /health/ready` - Is the service ready to accept traffic?
- **Metrics:** `GET /health/metrics` - Performance metrics

### Logging
```bash
# View application logs
docker logs sentinelflow

# Stream logs
docker logs -f sentinelflow

# Structured logging to file
NODE_ENV=production pnpm start 2>&1 | tee sentinelflow.log
```

### Performance Monitoring
- Response times tracked in `/health/metrics`
- Database query performance logged
- WebSocket connection metrics available
- Error rates and types tracked

## Security Checklist

- [ ] Change all default passwords
- [ ] Enable SSL/TLS certificates
- [ ] Configure firewall rules
- [ ] Set up rate limiting (configured in code)
- [ ] Enable audit logging (enabled by default)
- [ ] Configure CORS for allowed origins
- [ ] Set up API key rotation
- [ ] Enable database encryption
- [ ] Configure backup encryption
- [ ] Set up monitoring and alerting
- [ ] Regular security updates
- [ ] Penetration testing

## Troubleshooting

### Database Connection Issues
```bash
# Test connection
mysql -u user -p -h host sentinelflow -e "SELECT 1;"

# Check connection pool
# Look for "Connection pool exhausted" in logs
```

### API Integration Failures
```bash
# Test Jira connectivity
curl -u email:token https://your-jira-instance.atlassian.net/rest/api/3/myself

# Test ServiceNow connectivity
curl -u username:password https://your-instance.service-now.com/api/now/table/incident?limit=1

# Test Slack webhook
curl -X POST -H 'Content-type: application/json' \
  --data '{"text":"Test"}' \
  $SLACK_WEBHOOK_URL
```

### Performance Issues
- Check database query performance in logs
- Monitor memory usage
- Review WebSocket connection count
- Check rate limiting status

## Support & Documentation

- API Documentation: `https://your-domain.com/api/docs`
- ReDoc: `https://your-domain.com/api/redoc`
- OpenAPI Schema: `https://your-domain.com/api/openapi.json`
- GitHub: `https://github.com/your-org/sentinelflow`

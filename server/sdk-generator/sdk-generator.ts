/**
 * API Client SDK Generator
 * Generates TypeScript and Python SDKs from OpenAPI schema
 */

export interface SDKConfig {
  packageName: string;
  version: string;
  author: string;
  description: string;
}

/**
 * SDK Generator
 */
export class SDKGenerator {
  private config: SDKConfig;

  constructor(config: SDKConfig) {
    this.config = config;
  }

  /**
   * Generate TypeScript SDK
   */
  generateTypeScriptSDK(): string {
    return `
/**
 * ${this.config.packageName} - TypeScript SDK
 * Version: ${this.config.version}
 * Author: ${this.config.author}
 * Description: ${this.config.description}
 */

export interface ClientConfig {
  baseURL: string;
  apiKey: string;
  timeout?: number;
}

export interface AttackData {
  id: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  duration: number;
  affectedIps: number;
  timestamp: number;
}

export interface MitigationData {
  id: string;
  attackId: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  timestamp: number;
}

export interface AlertRule {
  id: string;
  name: string;
  conditions: Record<string, unknown>;
  enabled: boolean;
}

/**
 * SentinelFlow API Client
 */
export class SentinelFlowClient {
  private baseURL: string;
  private apiKey: string;
  private timeout: number;

  constructor(config: ClientConfig) {
    this.baseURL = config.baseURL;
    this.apiKey = config.apiKey;
    this.timeout = config.timeout || 30000;
  }

  /**
   * Get active attacks
   */
  async getAttacks(): Promise<AttackData[]> {
    return this.request('GET', '/api/attacks');
  }

  /**
   * Get attack by ID
   */
  async getAttack(id: string): Promise<AttackData> {
    return this.request('GET', \`/api/attacks/\${id}\`);
  }

  /**
   * Get mitigations
   */
  async getMitigations(): Promise<MitigationData[]> {
    return this.request('GET', '/api/mitigations');
  }

  /**
   * Create mitigation
   */
  async createMitigation(attackId: string): Promise<MitigationData> {
    return this.request('POST', '/api/mitigations', { attackId });
  }

  /**
   * Get alert rules
   */
  async getAlertRules(): Promise<AlertRule[]> {
    return this.request('GET', '/api/alert-rules');
  }

  /**
   * Create alert rule
   */
  async createAlertRule(rule: Omit<AlertRule, 'id'>): Promise<AlertRule> {
    return this.request('POST', '/api/alert-rules', rule);
  }

  /**
   * Update alert rule
   */
  async updateAlertRule(id: string, rule: Partial<AlertRule>): Promise<AlertRule> {
    return this.request('PUT', \`/api/alert-rules/\${id}\`, rule);
  }

  /**
   * Delete alert rule
   */
  async deleteAlertRule(id: string): Promise<void> {
    return this.request('DELETE', \`/api/alert-rules/\${id}\`);
  }

  /**
   * Make HTTP request
   */
  private async request(method: string, path: string, data?: unknown): Promise<unknown> {
    const url = \`\${this.baseURL}\${path}\`;
    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': \`Bearer \${this.apiKey}\`,
      },
      timeout: this.timeout,
    };

    if (data) {
      options.body = JSON.stringify(data);
    }

    const response = await fetch(url, options);
    if (!response.ok) {
      throw new Error(\`API Error: \${response.statusText}\`);
    }

    return response.json();
  }
}

export default SentinelFlowClient;
    `.trim();
  }

  /**
   * Generate Python SDK
   */
  generatePythonSDK(): string {
    return `
"""
${this.config.packageName} - Python SDK
Version: ${this.config.version}
Author: ${this.config.author}
Description: ${this.config.description}
"""

import requests
from typing import Dict, List, Optional, Any
from dataclasses import dataclass
from enum import Enum

class Severity(Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class MitigationStatus(Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"

@dataclass
class AttackData:
    id: str
    type: str
    severity: str
    duration: int
    affected_ips: int
    timestamp: int

@dataclass
class MitigationData:
    id: str
    attack_id: str
    status: str
    timestamp: int

@dataclass
class AlertRule:
    id: str
    name: str
    conditions: Dict[str, Any]
    enabled: bool

class SentinelFlowClient:
    """SentinelFlow API Client for Python"""

    def __init__(self, base_url: str, api_key: str, timeout: int = 30):
        self.base_url = base_url
        self.api_key = api_key
        self.timeout = timeout
        self.session = requests.Session()
        self.session.headers.update({
            'Authorization': f'Bearer {self.api_key}',
            'Content-Type': 'application/json',
        })

    def get_attacks(self) -> List[AttackData]:
        """Get active attacks"""
        response = self.session.get(f'{self.base_url}/api/attacks', timeout=self.timeout)
        response.raise_for_status()
        return [AttackData(**attack) for attack in response.json()]

    def get_attack(self, attack_id: str) -> AttackData:
        """Get attack by ID"""
        response = self.session.get(
            f'{self.base_url}/api/attacks/{attack_id}',
            timeout=self.timeout
        )
        response.raise_for_status()
        return AttackData(**response.json())

    def get_mitigations(self) -> List[MitigationData]:
        """Get mitigations"""
        response = self.session.get(f'{self.base_url}/api/mitigations', timeout=self.timeout)
        response.raise_for_status()
        return [MitigationData(**mitigation) for mitigation in response.json()]

    def create_mitigation(self, attack_id: str) -> MitigationData:
        """Create mitigation for attack"""
        response = self.session.post(
            f'{self.base_url}/api/mitigations',
            json={'attack_id': attack_id},
            timeout=self.timeout
        )
        response.raise_for_status()
        return MitigationData(**response.json())

    def get_alert_rules(self) -> List[AlertRule]:
        """Get alert rules"""
        response = self.session.get(f'{self.base_url}/api/alert-rules', timeout=self.timeout)
        response.raise_for_status()
        return [AlertRule(**rule) for rule in response.json()]

    def create_alert_rule(self, name: str, conditions: Dict[str, Any]) -> AlertRule:
        """Create alert rule"""
        response = self.session.post(
            f'{self.base_url}/api/alert-rules',
            json={'name': name, 'conditions': conditions},
            timeout=self.timeout
        )
        response.raise_for_status()
        return AlertRule(**response.json())

    def update_alert_rule(self, rule_id: str, **kwargs) -> AlertRule:
        """Update alert rule"""
        response = self.session.put(
            f'{self.base_url}/api/alert-rules/{rule_id}',
            json=kwargs,
            timeout=self.timeout
        )
        response.raise_for_status()
        return AlertRule(**response.json())

    def delete_alert_rule(self, rule_id: str) -> None:
        """Delete alert rule"""
        response = self.session.delete(
            f'{self.base_url}/api/alert-rules/{rule_id}',
            timeout=self.timeout
        )
        response.raise_for_status()

    def close(self) -> None:
        """Close session"""
        self.session.close()

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.close()
    `.trim();
  }

  /**
   * Generate SDK documentation
   */
  generateDocumentation(): string {
    return `
# ${this.config.packageName} SDK Documentation

Version: ${this.config.version}
Author: ${this.config.author}

## Overview

${this.config.description}

## Installation

### TypeScript/JavaScript

\`\`\`bash
npm install ${this.config.packageName}
\`\`\`

### Python

\`\`\`bash
pip install ${this.config.packageName}
\`\`\`

## Quick Start

### TypeScript

\`\`\`typescript
import SentinelFlowClient from '${this.config.packageName}';

const client = new SentinelFlowClient({
  baseURL: 'https://api.sentinelflow.com',
  apiKey: 'your-api-key',
});

// Get active attacks
const attacks = await client.getAttacks();

// Create mitigation
const mitigation = await client.createMitigation(attacks[0].id);
\`\`\`

### Python

\`\`\`python
from ${this.config.packageName} import SentinelFlowClient

client = SentinelFlowClient(
    base_url='https://api.sentinelflow.com',
    api_key='your-api-key'
)

# Get active attacks
attacks = client.get_attacks()

# Create mitigation
mitigation = client.create_mitigation(attacks[0].id)
\`\`\`

## API Reference

### Attacks

- \`getAttacks()\` - Get all active attacks
- \`getAttack(id)\` - Get specific attack

### Mitigations

- \`getMitigations()\` - Get all mitigations
- \`createMitigation(attackId)\` - Create new mitigation

### Alert Rules

- \`getAlertRules()\` - Get all alert rules
- \`createAlertRule(rule)\` - Create new alert rule
- \`updateAlertRule(id, rule)\` - Update alert rule
- \`deleteAlertRule(id)\` - Delete alert rule

## Error Handling

The SDK throws errors for failed requests. Always wrap calls in try-catch:

### TypeScript

\`\`\`typescript
try {
  const attacks = await client.getAttacks();
} catch (error) {
  console.error('Failed to get attacks:', error.message);
}
\`\`\`

### Python

\`\`\`python
try:
    attacks = client.get_attacks()
except requests.RequestException as e:
    print(f'Failed to get attacks: {e}')
\`\`\`

## Support

For issues and questions, visit: https://github.com/sentinelflow/${this.config.packageName}
    `.trim();
  }

  /**
   * Generate package.json for TypeScript SDK
   */
  generatePackageJson(): string {
    return JSON.stringify(
      {
        name: this.config.packageName,
        version: this.config.version,
        description: this.config.description,
        author: this.config.author,
        main: "dist/index.js",
        types: "dist/index.d.ts",
        scripts: {
          build: "tsc",
          test: "vitest",
          "type-check": "tsc --noEmit",
        },
        dependencies: {
          "node-fetch": "^3.0.0",
        },
        devDependencies: {
          typescript: "^5.0.0",
          vitest: "^0.34.0",
        },
        keywords: ["ddos", "detection", "security", "api", "client"],
        license: "MIT",
      },
      null,
      2
    );
  }

  /**
   * Generate setup.py for Python SDK
   */
  generateSetupPy(): string {
    return `
from setuptools import setup, find_packages

setup(
    name='${this.config.packageName}',
    version='${this.config.version}',
    description='${this.config.description}',
    author='${this.config.author}',
    packages=find_packages(),
    install_requires=[
        'requests>=2.28.0',
    ],
    python_requires='>=3.8',
    classifiers=[
        'Development Status :: 4 - Beta',
        'Intended Audience :: Developers',
        'License :: OSI Approved :: MIT License',
        'Programming Language :: Python :: 3',
        'Programming Language :: Python :: 3.8',
        'Programming Language :: Python :: 3.9',
        'Programming Language :: Python :: 3.10',
        'Programming Language :: Python :: 3.11',
    ],
)
    `.trim();
  }
}

/**
 * Generate all SDKs
 */
export function generateAllSDKs(config: SDKConfig): Record<string, string> {
  const generator = new SDKGenerator(config);

  return {
    "typescript-sdk.ts": generator.generateTypeScriptSDK(),
    "python-sdk.py": generator.generatePythonSDK(),
    "README.md": generator.generateDocumentation(),
    "package.json": generator.generatePackageJson(),
    "setup.py": generator.generateSetupPy(),
  };
}

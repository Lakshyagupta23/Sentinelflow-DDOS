/**
 * Real Jira REST API Integration
 * Requires: JIRA_URL, JIRA_USERNAME, JIRA_API_TOKEN
 */

import { ErrorRecovery } from "../error-handler";

export interface JiraConfig {
  url: string;
  username: string;
  apiToken: string;
  projectKey: string;
}

export interface JiraIncident {
  key: string;
  id: string;
  url: string;
  status: string;
}

export class JiraIntegration {
  private config: JiraConfig;
  private authHeader: string;

  constructor(config: JiraConfig) {
    this.config = config;
    this.authHeader = `Basic ${Buffer.from(`${config.username}:${config.apiToken}`).toString("base64")}`;
  }

  /**
   * Create incident in Jira with retry logic
   */
  async createIncident(
    attackId: string,
    severity: string,
    description: string,
    sourceIp: string
  ): Promise<JiraIncident> {
    const issueType = this.mapSeverityToIssueType(severity);
    const body = {
      fields: {
        project: { key: this.config.projectKey },
        summary: `DDoS Attack Detected: ${attackId}`,
        description: `Attack ID: ${attackId}\nSeverity: ${severity}\nSource IP: ${sourceIp}\n\n${description}`,
        issuetype: { name: issueType },
        priority: { name: this.mapSeverityToPriority(severity) },
        labels: ["ddos-attack", "automated", "sentinelflow"],
      },
    };

    return ErrorRecovery.retryWithBackoff(
      async () => {
        const response = await fetch(`${this.config.url}/rest/api/3/issues`, {
          method: "POST",
          headers: {
            Authorization: this.authHeader,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        });

        if (!response.ok) {
          throw new Error(`Jira API error: ${response.statusText}`);
        }

        const data = await response.json() as any;
        return {
          key: data.key,
          id: data.id,
          url: `${this.config.url}/browse/${data.key}`,
          status: "created",
        };
      },
      3,
      100
    ).catch((error) => {
      console.error("Failed to create Jira incident after retries:", error);
      throw error;
    });
  }

  /**
   * Update incident status
   */
  async updateIncident(issueKey: string, status: string): Promise<void> {
    const transitions: Record<string, string> = {
      resolved: "3",
      closed: "5",
      in_progress: "4",
    };

    const transitionId = transitions[status] || "3";

    try {
      await fetch(`${this.config.url}/rest/api/3/issues/${issueKey}/transitions`, {
        method: "POST",
        headers: {
          Authorization: this.authHeader,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          transition: { id: transitionId },
        }),
      });
    } catch (error) {
      console.error("Failed to update Jira incident:", error);
      throw error;
    }
  }

  /**
   * Add comment to incident
   */
  async addComment(issueKey: string, comment: string): Promise<void> {
    try {
      await fetch(`${this.config.url}/rest/api/3/issues/${issueKey}/comments`, {
        method: "POST",
        headers: {
          Authorization: this.authHeader,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          body: {
            version: 1,
            type: "doc",
            content: [
              {
                type: "paragraph",
                content: [
                  {
                    type: "text",
                    text: comment,
                  },
                ],
              },
            ],
          },
        }),
      });
    } catch (error) {
      console.error("Failed to add Jira comment:", error);
      throw error;
    }
  }

  private mapSeverityToIssueType(severity: string): string {
    const mapping: Record<string, string> = {
      critical: "Incident",
      high: "Bug",
      medium: "Task",
      low: "Task",
    };
    return mapping[severity] || "Task";
  }

  private mapSeverityToPriority(severity: string): string {
    const mapping: Record<string, string> = {
      critical: "Highest",
      high: "High",
      medium: "Medium",
      low: "Low",
    };
    return mapping[severity] || "Medium";
  }
}

/**
 * Create Jira integration instance
 */
export function createJiraIntegration(): JiraIntegration | null {
  const url = process.env.JIRA_URL;
  const username = process.env.JIRA_USERNAME;
  const apiToken = process.env.JIRA_API_TOKEN;
  const projectKey = process.env.JIRA_PROJECT_KEY || "SEC";

  if (!url || !username || !apiToken) {
    console.warn("Jira integration not configured (missing JIRA_URL, JIRA_USERNAME, or JIRA_API_TOKEN)");
    return null;
  }

  return new JiraIntegration({ url, username, apiToken, projectKey });
}

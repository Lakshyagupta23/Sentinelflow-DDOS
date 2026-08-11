import { describe, it, expect, beforeEach } from "vitest";
import { SDKGenerator, generateAllSDKs } from "./sdk-generator";

describe("SDK Generator", () => {
  const config = {
    packageName: "sentinelflow-sdk",
    version: "1.0.0",
    author: "SentinelFlow Team",
    description: "Official SentinelFlow API Client SDK",
  };

  let generator: SDKGenerator;

  beforeEach(() => {
    generator = new SDKGenerator(config);
  });

  it("should create SDK generator instance", () => {
    expect(generator).toBeDefined();
  });

  it("should generate TypeScript SDK", () => {
    const sdk = generator.generateTypeScriptSDK();
    expect(sdk).toContain("SentinelFlowClient");
    expect(sdk).toContain("getAttacks");
    expect(sdk).toContain("createMitigation");
    expect(sdk).toContain("getAlertRules");
    expect(sdk).toContain("export class SentinelFlowClient");
  });

  it("should generate Python SDK", () => {
    const sdk = generator.generatePythonSDK();
    expect(sdk).toContain("class SentinelFlowClient");
    expect(sdk).toContain("def get_attacks");
    expect(sdk).toContain("def create_mitigation");
    expect(sdk).toContain("def get_alert_rules");
    expect(sdk).toContain("import requests");
  });

  it("should generate SDK documentation", () => {
    const docs = generator.generateDocumentation();
    expect(docs).toContain("# sentinelflow-sdk SDK Documentation");
    expect(docs).toContain("## Installation");
    expect(docs).toContain("## Quick Start");
    expect(docs).toContain("## API Reference");
    expect(docs).toContain("npm install sentinelflow-sdk");
    expect(docs).toContain("pip install sentinelflow-sdk");
  });

  it("should generate package.json", () => {
    const packageJson = generator.generatePackageJson();
    const parsed = JSON.parse(packageJson);

    expect(parsed.name).toBe("sentinelflow-sdk");
    expect(parsed.version).toBe("1.0.0");
    expect(parsed.author).toBe("SentinelFlow Team");
    expect(parsed.main).toBe("dist/index.js");
    expect(parsed.scripts.build).toBe("tsc");
  });

  it("should generate setup.py", () => {
    const setupPy = generator.generateSetupPy();
    expect(setupPy).toContain("name='sentinelflow-sdk'");
    expect(setupPy).toContain("version='1.0.0'");
    expect(setupPy).toContain("author='SentinelFlow Team'");
    expect(setupPy).toContain("install_requires");
    expect(setupPy).toContain("requests");
  });

  it("should generate all SDKs", () => {
    const sdks = generateAllSDKs(config);

    expect(sdks["typescript-sdk.ts"]).toBeDefined();
    expect(sdks["python-sdk.py"]).toBeDefined();
    expect(sdks["README.md"]).toBeDefined();
    expect(sdks["package.json"]).toBeDefined();
    expect(sdks["setup.py"]).toBeDefined();
  });

  it("should include TypeScript types in SDK", () => {
    const sdk = generator.generateTypeScriptSDK();
    expect(sdk).toContain("interface ClientConfig");
    expect(sdk).toContain("interface AttackData");
    expect(sdk).toContain("interface MitigationData");
    expect(sdk).toContain("interface AlertRule");
  });

  it("should include Python dataclasses in SDK", () => {
    const sdk = generator.generatePythonSDK();
    expect(sdk).toContain("@dataclass");
    expect(sdk).toContain("class AttackData");
    expect(sdk).toContain("class MitigationData");
    expect(sdk).toContain("class AlertRule");
    expect(sdk).toContain("class Severity");
  });

  it("should include error handling in documentation", () => {
    const docs = generator.generateDocumentation();
    expect(docs).toContain("## Error Handling");
    expect(docs).toContain("try-catch");
    expect(docs).toContain("RequestException");
  });

  it("should include all API methods in TypeScript SDK", () => {
    const sdk = generator.generateTypeScriptSDK();
    const methods = [
      "getAttacks",
      "getAttack",
      "getMitigations",
      "createMitigation",
      "getAlertRules",
      "createAlertRule",
      "updateAlertRule",
      "deleteAlertRule",
    ];

    for (const method of methods) {
      expect(sdk).toContain(`async ${method}`);
    }
  });

  it("should include all API methods in Python SDK", () => {
    const sdk = generator.generatePythonSDK();
    const methods = [
      "get_attacks",
      "get_attack",
      "get_mitigations",
      "create_mitigation",
      "get_alert_rules",
      "create_alert_rule",
      "update_alert_rule",
      "delete_alert_rule",
    ];

    for (const method of methods) {
      expect(sdk).toContain(`def ${method}`);
    }
  });

  it("should include context manager in Python SDK", () => {
    const sdk = generator.generatePythonSDK();
    expect(sdk).toContain("def __enter__");
    expect(sdk).toContain("def __exit__");
    expect(sdk).toContain("def close");
  });

  it("should include proper authentication headers", () => {
    const tsSdk = generator.generateTypeScriptSDK();
    expect(tsSdk).toContain("Authorization");
    expect(tsSdk).toContain("Bearer");

    const pySdk = generator.generatePythonSDK();
    expect(pySdk).toContain("Authorization");
    expect(pySdk).toContain("Bearer");
  });
});

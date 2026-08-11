/**
 * Data export utilities for CSV and JSON formats
 */

export function exportToCSV<T extends Record<string, any>>(
  data: T[],
  filename: string,
  columns?: (keyof T)[]
) {
  if (data.length === 0) return;

  // Determine columns
  const cols = columns || (Object.keys(data[0]) as (keyof T)[]);

  // Create CSV header
  const header = cols.join(",");

  // Create CSV rows
  const rows = data.map((item) =>
    cols
      .map((col) => {
        const value = item[col];
        // Escape quotes and wrap in quotes if contains comma
        const stringValue = String(value || "");
        return stringValue.includes(",") || stringValue.includes('"')
          ? `"${stringValue.replace(/"/g, '""')}"`
          : stringValue;
      })
      .join(",")
  );

  // Combine and download
  const csv = [header, ...rows].join("\n");
  downloadFile(csv, `${filename}.csv`, "text/csv");
}

export function exportToJSON<T>(data: T[], filename: string) {
  const json = JSON.stringify(data, null, 2);
  downloadFile(json, `${filename}.json`, "application/json");
}

export function exportToJSON_Lines<T extends Record<string, any>>(
  data: T[],
  filename: string
) {
  const jsonLines = data.map((item) => JSON.stringify(item)).join("\n");
  downloadFile(jsonLines, `${filename}.jsonl`, "application/x-ndjson");
}

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generate report with metadata
 */
export function generateReport<T extends Record<string, any>>(
  data: T[],
  title: string,
  metadata?: Record<string, any>
) {
  const report = {
    title,
    generatedAt: new Date().toISOString(),
    totalRecords: data.length,
    metadata,
    data,
  };

  return report;
}

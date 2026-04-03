import type { Product, FeeSchedule } from "@/lib/types";

// ---------------------------------------------------------------------------
// Internal CSV parser — handles BOM, quoted fields with commas/newlines,
// trailing newlines, and CRLF line endings. No external libraries.
// ---------------------------------------------------------------------------

function parseCSVRows(csvText: string): string[][] {
  // Strip UTF-8 BOM if present
  let text = csvText.startsWith("\uFEFF") ? csvText.slice(1) : csvText;
  // Normalise line endings
  text = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  // Remove trailing newline(s) so we don't get a phantom empty row
  text = text.replace(/\n+$/, "");

  const rows: string[][] = [];
  let current = "";
  let inQuotes = false;
  let row: string[] = [];

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];

    if (inQuotes) {
      if (ch === '"') {
        // Escaped quote ""
        if (i + 1 < text.length && text[i + 1] === '"') {
          current += '"';
          i++; // skip next quote
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ",") {
        row.push(current.trim());
        current = "";
      } else if (ch === "\n") {
        row.push(current.trim());
        rows.push(row);
        row = [];
        current = "";
      } else {
        current += ch;
      }
    }
  }

  // Push last field / row
  row.push(current.trim());
  if (row.length > 1 || row[0] !== "") {
    rows.push(row);
  }

  return rows;
}

function isTruthy(value: string): boolean {
  const v = value.toLowerCase().trim();
  return v === "y" || v === "yes" || v === "true" || v === "1";
}

// ---------------------------------------------------------------------------
// Product CSV helpers
// ---------------------------------------------------------------------------

export function generateProductTemplate(): string {
  const headers =
    "Name,Vendor,HCPCS Code,Cost,MSRP,Category,Requires Measurement,Requires Prior Auth";
  const example1 =
    'Compression Sleeve - Upper Arm,Medi,A6530,45.00,89.99,Compression Garments,Yes,No';
  const example2 =
    '"Knee Brace, Hinged",DJO Global,L1810,120.00,249.99,Orthopedic Braces,Yes,Yes';
  return [headers, example1, example2].join("\n");
}

export function parseProductCSV(
  csvText: string
): { valid: Product[]; errors: { row: number; message: string }[] } {
  const rows = parseCSVRows(csvText);
  if (rows.length === 0) {
    return { valid: [], errors: [{ row: 1, message: "CSV file is empty" }] };
  }

  // First row is the header — skip it
  const valid: Product[] = [];
  const errors: { row: number; message: string }[] = [];

  for (let i = 1; i < rows.length; i++) {
    const cols = rows[i];
    const rowNum = i + 1; // 1-indexed, accounting for header

    if (cols.length < 8) {
      errors.push({
        row: rowNum,
        message: `Expected 8 columns but found ${cols.length}`,
      });
      continue;
    }

    const [name, vendor, hcpcsCode, costStr, msrpStr, category, measStr, authStr] =
      cols;

    const missing: string[] = [];
    if (!name) missing.push("Name");
    if (!vendor) missing.push("Vendor");
    if (!hcpcsCode) missing.push("HCPCS Code");
    if (!costStr) missing.push("Cost");
    if (!msrpStr) missing.push("MSRP");
    if (!category) missing.push("Category");

    if (missing.length > 0) {
      errors.push({
        row: rowNum,
        message: `Missing required fields: ${missing.join(", ")}`,
      });
      continue;
    }

    const cost = parseFloat(costStr);
    const msrp = parseFloat(msrpStr);

    if (isNaN(cost) || cost <= 0) {
      errors.push({ row: rowNum, message: `Cost must be a positive number, got "${costStr}"` });
      continue;
    }
    if (isNaN(msrp) || msrp <= 0) {
      errors.push({ row: rowNum, message: `MSRP must be a positive number, got "${msrpStr}"` });
      continue;
    }

    valid.push({
      id: `prod-${crypto.randomUUID().slice(0, 8)}`,
      name,
      vendor,
      hcpcsCode,
      cost,
      msrp,
      category,
      requiresMeasurement: isTruthy(measStr),
      requiresPriorAuth: isTruthy(authStr),
    });
  }

  return { valid, errors };
}

// ---------------------------------------------------------------------------
// Fee Schedule CSV helpers
// ---------------------------------------------------------------------------

export function generateFeeScheduleTemplate(): string {
  const headers = "Payer,HCPCS Code,State,Reimbursement Rate,Multiplier";
  const example1 = "Medicare,A6530,FL,75.00,1.0";
  const example2 = "Blue Cross,L1810,CA,180.00,1.15";
  return [headers, example1, example2].join("\n");
}

export function parseFeeScheduleCSV(
  csvText: string
): { valid: FeeSchedule[]; errors: { row: number; message: string }[] } {
  const rows = parseCSVRows(csvText);
  if (rows.length === 0) {
    return { valid: [], errors: [{ row: 1, message: "CSV file is empty" }] };
  }

  const valid: FeeSchedule[] = [];
  const errors: { row: number; message: string }[] = [];

  for (let i = 1; i < rows.length; i++) {
    const cols = rows[i];
    const rowNum = i + 1;

    if (cols.length < 5) {
      errors.push({
        row: rowNum,
        message: `Expected 5 columns but found ${cols.length}`,
      });
      continue;
    }

    const [payer, hcpcsCode, state, rateStr, multiplierStr] = cols;

    const missing: string[] = [];
    if (!payer) missing.push("Payer");
    if (!hcpcsCode) missing.push("HCPCS Code");
    if (!state) missing.push("State");
    if (!rateStr) missing.push("Reimbursement Rate");
    if (!multiplierStr) missing.push("Multiplier");

    if (missing.length > 0) {
      errors.push({
        row: rowNum,
        message: `Missing required fields: ${missing.join(", ")}`,
      });
      continue;
    }

    const reimbursementRate = parseFloat(rateStr);
    const multiplier = parseFloat(multiplierStr);

    if (isNaN(reimbursementRate) || reimbursementRate <= 0) {
      errors.push({
        row: rowNum,
        message: `Reimbursement Rate must be a positive number, got "${rateStr}"`,
      });
      continue;
    }
    if (isNaN(multiplier) || multiplier <= 0) {
      errors.push({
        row: rowNum,
        message: `Multiplier must be a positive number, got "${multiplierStr}"`,
      });
      continue;
    }

    valid.push({
      id: `fee-${crypto.randomUUID().slice(0, 8)}`,
      payer,
      hcpcsCode,
      state,
      reimbursementRate,
      multiplier,
    });
  }

  return { valid, errors };
}

// ---------------------------------------------------------------------------
// Download helper
// ---------------------------------------------------------------------------

export function downloadCSV(content: string, filename: string): void {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

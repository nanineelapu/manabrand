/** Download a table as a .csv file (opens correctly in Excel, including ₹ and Indian names). Client-side only. */
export function downloadCsv(filename: string, rows: (string | number | null | undefined)[][]) {
  const cell = (v: string | number | null | undefined) => {
    const s = String(v ?? "");
    // guard against spreadsheet formula injection from user-typed text (names, addresses…)
    const safe = /^[=+\-@\t\r]/.test(s) && Number.isNaN(Number(s)) ? `'${s}` : s;
    return /[",\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
  };
  const csv = "﻿" + rows.map((r) => r.map(cell).join(",")).join("\r\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const a = Object.assign(document.createElement("a"), { href: url, download: filename.endsWith(".csv") ? filename : `${filename}.csv` });
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

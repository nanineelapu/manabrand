import { cn } from "@/lib/utils";

const rows = [
  ["XS", "32", "26", "34", "5'0\" – 5'2\""],
  ["S", "34", "28", "36", "5'2\" – 5'4\""],
  ["M", "36", "30", "38", "5'4\" – 5'6\""],
  ["L", "38", "32", "40", "5'6\" – 5'8\""],
  ["XL", "40", "34", "42", "5'8\" – 5'10\""],
  ["XXL", "42", "36", "44", "5'10\" – 6'0\""],
];

export function SizeChart({ className, highlight }: { className?: string; highlight?: string }) {
  return (
    <div className={cn("overflow-hidden rounded-card border border-line", className)}>
      <table className="w-full text-center text-sm">
        <caption className="sr-only">Size chart in inches</caption>
        <thead className="bg-bg-subtle text-xs font-semibold uppercase tracking-wide text-muted">
          <tr>{["Size", "Bust", "Waist", "Hip", "Height"].map((h) => <th key={h} scope="col" className="px-2 py-3">{h}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-line tabular">
          {rows.map((r) => (
            <tr key={r[0]} className={cn(highlight === r[0] && "bg-accent-soft font-semibold")}>
              <th scope="row" className="px-2 py-3 font-semibold">{r[0]}</th>
              {r.slice(1).map((c, i) => <td key={i} className="px-2 py-3">{c}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

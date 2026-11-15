import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Column<T> {
  key: string;
  header: string;
  cell: (row: T) => React.ReactNode;
  className?: string;
  align?: "left" | "right" | "center";
  /** mobile card: "title" = main line, "sub" = line under title, "right" = top-right corner, "row" (default) = labelled grid cell, "hide" = omitted */
  mobile?: "title" | "sub" | "right" | "row" | "hide";
}

/**
 * Responsive table. ≥ md: a dense table. < md: a stack of tappable cards
 * (never horizontal-scroll tables on phones). `actions` renders as a footer
 * row on cards and as a trailing column on the table, so every action stays
 * reachable on mobile.
 */
export function DataTable<T>({
  columns, rows, rowKey, rowHref, empty, className, actions,
}: {
  columns: Column<T>[]; rows: T[]; rowKey: (r: T) => string; rowHref?: (r: T) => string;
  empty?: React.ReactNode; className?: string; actions?: (r: T) => React.ReactNode;
}) {
  if (!rows.length) return <div className="rounded-card border border-dashed border-line-strong bg-card">{empty}</div>;

  const title = columns.find((c) => c.mobile === "title") ?? columns[0];
  const sub = columns.find((c) => c.mobile === "sub");
  const right = columns.find((c) => c.mobile === "right");
  const rest = columns.filter((c) => c !== title && c !== sub && c !== right && (c.mobile === undefined || c.mobile === "row"));
  const al = { left: "text-left", right: "text-right", center: "text-center" };

  return (
    <div className={className}>
      {/* Mobile cards */}
      <ul className="space-y-2.5 md:hidden">
        {rows.map((r) => {
          const body = (
            <div className="flex items-start gap-3 p-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 text-[15px] font-medium">{title.cell(r)}</div>
                  {right && <div className="shrink-0 text-right">{right.cell(r)}</div>}
                </div>
                {sub && <div className="mt-0.5 text-[13px] text-muted">{sub.cell(r)}</div>}
                {rest.length > 0 && (
                  <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2.5">
                    {rest.map((c) => (
                      <div key={c.key} className="min-w-0">
                        <dt className="text-[11px] font-medium uppercase tracking-wide text-subtle">{c.header}</dt>
                        <dd className="truncate text-[13px]">{c.cell(r)}</dd>
                      </div>
                    ))}
                  </dl>
                )}
              </div>
              {rowHref && <ChevronRight className="mt-1 size-4 shrink-0 text-subtle" aria-hidden />}
            </div>
          );
          const act = actions?.(r);
          return (
            <li key={rowKey(r)} className="overflow-hidden rounded-card border border-line bg-card shadow-card">
              {rowHref ? <Link href={rowHref(r)} className="block active:bg-bg-subtle">{body}</Link> : body}
              {act ? <div className="flex flex-wrap items-center gap-2 border-t border-line bg-bg-subtle/50 px-4 py-2.5">{act}</div> : null}
            </li>
          );
        })}
      </ul>

      {/* Desktop table */}
      <div className="hidden overflow-hidden rounded-card border border-line bg-card shadow-card md:block">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-line bg-bg-subtle/60 text-left text-[12px] font-semibold uppercase tracking-wide text-muted">
                {columns.map((c) => (
                  <th key={c.key} scope="col" className={cn("px-4 py-3 font-semibold", al[c.align ?? "left"], c.className)}>{c.header}</th>
                ))}
                {actions && <th scope="col" className="px-4 py-3 text-right"><span className="sr-only">Actions</span></th>}
                {rowHref && <th className="w-8"><span className="sr-only">Open</span></th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((r) => (
                <tr key={rowKey(r)} className="group transition-colors hover:bg-bg-subtle/50">
                  {columns.map((c, i) => (
                    <td key={c.key} className={cn("px-4 py-3 align-middle", al[c.align ?? "left"], c.className)}>
                      {rowHref && i === 0 ? <Link href={rowHref(r)} className="block font-medium hover:underline">{c.cell(r)}</Link> : c.cell(r)}
                    </td>
                  ))}
                  {actions && <td className="whitespace-nowrap px-4 py-3 text-right"><span className="inline-flex items-center justify-end gap-1.5">{actions(r)}</span></td>}
                  {rowHref && (
                    <td className="pr-3 text-right">
                      <Link href={rowHref(r)} aria-label="Open" className="inline-grid size-8 place-items-center rounded-full text-subtle hover:bg-bg-subtle hover:text-fg">
                        <ChevronRight className="size-4" />
                      </Link>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

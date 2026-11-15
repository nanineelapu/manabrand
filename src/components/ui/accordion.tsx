import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

/** Zero-JS accordion built on <details>. Works in Server Components. */
export function Accordion({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("divide-y divide-line border-y border-line", className)}>{children}</div>;
}

export function AccordionItem({
  title, children, defaultOpen, icon, name,
}: { title: React.ReactNode; children: React.ReactNode; defaultOpen?: boolean; icon?: React.ReactNode; name?: string }) {
  return (
    <details open={defaultOpen} name={name} className="group">
      <summary className="flex min-h-14 cursor-pointer items-center gap-3 py-3 text-[15px] font-medium">
        {icon && <span className="text-muted">{icon}</span>}
        <span className="flex-1">{title}</span>
        <ChevronDown className="chev size-5 shrink-0 text-muted transition-transform" aria-hidden />
      </summary>
      <div className="pb-4 text-sm leading-relaxed text-muted">{children}</div>
    </details>
  );
}

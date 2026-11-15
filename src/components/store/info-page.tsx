import { Breadcrumb } from "@/components/ui/display";

export function InfoPage({
  title, intro, children, updated, aside,
}: { title: string; intro?: string; children: React.ReactNode; updated?: string; aside?: React.ReactNode }) {
  return (
    <div className="container-page pb-6 pt-4 md:pt-8">
      <Breadcrumb items={[{ label: "Home", href: "/" }, { label: title }]} />
      <header className="mt-4 max-w-3xl md:mt-8">
        <h1 className="font-display text-[34px] font-semibold leading-tight tracking-tight md:text-5xl">{title}</h1>
        {intro && <p className="mt-3 text-base leading-relaxed text-muted md:text-lg">{intro}</p>}
        {updated && <p className="mt-2 text-xs text-subtle">Last updated {updated}</p>}
      </header>
      <div className="mt-8 grid gap-10 md:mt-12 lg:grid-cols-[1fr_320px] lg:gap-16">
        <div className="max-w-3xl space-y-8 text-[15px] leading-relaxed [&_h2]:mb-2 [&_h2]:font-display [&_h2]:text-2xl [&_h2]:font-semibold [&_p]:text-muted [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-5 [&_ul]:text-muted">{children}</div>
        {aside && <aside className="lg:sticky lg:top-24 lg:self-start">{aside}</aside>}
      </div>
    </div>
  );
}

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="container-page flex flex-col items-center py-20 text-center md:py-28">
      <p className="glass rounded-full px-4 py-1.5 text-xs font-semibold tracking-wide">404</p>
      <h1 className="mt-5 text-3xl font-semibold md:text-4xl">We couldn’t find that page</h1>
      <p className="mt-3 max-w-md text-muted">The link may be broken or the item may no longer be available.</p>
      <div className="mt-7 flex flex-col gap-3 sm:flex-row"><Button href="/" size="lg" className="rounded-full">Go home</Button><Button href="/shop" size="lg" variant="outline" className="rounded-full">Browse all products</Button></div>
    </div>
  );
}

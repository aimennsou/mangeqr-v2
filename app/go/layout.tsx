/**
 * Bare layout for the paid-ads lead funnel (/go/fr, /go/ar). No app chrome
 * (navbar/sidebar) to maximize conversion. Each page renders the wizard with
 * its own dir/font. The root layout owns <html>/<body>.
 */
export default function GoLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#faf7f2] text-neutral-900">{children}</div>
  );
}

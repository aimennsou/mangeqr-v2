import { Navbar } from "./navbar";
import { PAGE_CONTAINER } from "./page-container";

interface ContentLayoutProps {
  title: string;
  children: React.ReactNode;
}

export function ContentLayout({ title, children }: ContentLayoutProps) {
  return (
    <div>
      <Navbar title={title} />
      {/* Horizontal rhythm comes from PAGE_CONTAINER, which the navbar shares so
          the two line up. Vertical padding scales with the viewport: 24px of air
          under a 56px sticky navbar is enough on a phone and cramped on a
          desktop, where the old flat pt-8/pb-8 applied everywhere. */}
      <div className={`${PAGE_CONTAINER} py-6 lg:py-10`}>{children}</div>
    </div>
  );
}

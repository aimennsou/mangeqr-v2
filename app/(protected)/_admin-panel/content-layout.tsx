

interface ContentLayoutProps {
  title: string;
  children: React.ReactNode;
}

export function ContentLayout({ title, children }: ContentLayoutProps) {
  return (
    <div>
   
      <div className="m-auto container pt-8 pb-8 px-4 sm:px-8">{children}</div>
    </div>
  );
}

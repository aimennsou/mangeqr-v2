import { Navbar } from "@/components/protected/navbar";
import AdminPanelLayout from "./_admin-panel/admin-panel-layout";




export default function ProtectedLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return  <AdminPanelLayout>
{/*<Navbar/>*/}
     {children}</AdminPanelLayout>;
}

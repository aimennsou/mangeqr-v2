import { redirect } from "next/navigation";

// `/account` and `/settings` are consolidated into a single canonical account
// page at `/settings` (the destination the sidebar "Mon compte" links to).
// `/account` permanently redirects there so there is one working page and no
// duplicate/dead route. See Requirement 2 (acceptance criterion 4).
export default function AccountPage() {
  redirect("/settings");
}

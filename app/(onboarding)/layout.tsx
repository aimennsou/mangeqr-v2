/**
 * Bare layout for the first-login onboarding wizard. Unlike the (protected)
 * route group, it does NOT render the admin-panel shell (sidebar / navbar /
 * welcome tour), so the wizard fills the screen. Global providers (theme, i18n,
 * auth) come from the root layout. `(onboarding)` is a route group, so the URL
 * stays `/onboarding`.
 */
export default function OnboardingLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return <div className="min-h-screen bg-background text-foreground">{children}</div>;
}

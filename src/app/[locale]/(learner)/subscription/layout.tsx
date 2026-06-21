import { FeatureGate } from "@/components/shared/FeatureGate";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <FeatureGate flag="subscriptions" redirectTo="/dashboard">
      {children}
    </FeatureGate>
  );
}

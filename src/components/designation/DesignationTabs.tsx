"use client";

import { cn } from "@/lib/utils/cn";

type TabValue = "overview" | "courseWebsite";

interface DesignationTabsProps {
  activeTab: TabValue;
  onTabChange: (tab: TabValue) => void;
  locale: string;
}

const tabs: { value: TabValue; labelEn: string; labelAr: string }[] = [
  { value: "overview", labelEn: "Overview", labelAr: "نظرة عامة" },
  { value: "courseWebsite", labelEn: "Course Website", labelAr: "موقع الدورة" },
];

export function DesignationTabs({
  activeTab,
  onTabChange,
  locale,
}: DesignationTabsProps) {
  return (
    <div className="sticky top-16 z-20 border-b bg-background/80 py-4 backdrop-blur-md">
      <div className="container mx-auto flex justify-center px-4">
        <div className="inline-flex rounded-full bg-muted/50 p-1">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.value;
            const label = locale === "ar" ? tab.labelAr : tab.labelEn;

            return (
              <button
                key={tab.value}
                onClick={() => onTabChange(tab.value)}
                className={cn(
                  "rounded-full px-6 py-2 text-sm font-medium transition-all",
                  isActive
                    ? "bg-white font-semibold text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import type { DesignationResource } from "@/types";

import { DesignationHero } from "@/components/designation/DesignationHero";
import { DesignationTabs } from "@/components/designation/DesignationTabs";
import { DesignationOverview } from "@/components/designation/DesignationOverview";
import { DesignationModules } from "@/components/designation/DesignationModules";
import { DesignationFoundingMember } from "@/components/designation/DesignationFoundingMember";
import { DesignationSteps } from "@/components/designation/DesignationSteps";
import { DesignationCPE } from "@/components/designation/DesignationCPE";
import { DesignationResources } from "@/components/designation/DesignationResources";
import { DesignationCourseContent } from "@/components/designation/DesignationCourseContent";
import { DesignationFAQ } from "@/components/designation/DesignationFAQ";
import { DesignationCTA } from "@/components/designation/DesignationCTA";

import type {
  DesignationDetail,
  DesignationDocumentRow,
  CPECategoryRow,
} from "@/lib/server/catalog-data";

interface FAQItem {
  question: string;
  questionAr: string;
  answer: string;
  answerAr: string;
}

interface Props {
  designation: DesignationDetail;
  documents: DesignationDocumentRow[];
  cpeCategories: CPECategoryRow[];
  resources: DesignationResource[];
  holderCount: number;
  primaryCourseSlug: string | null;
  hasAccess: boolean;
  isLoggedIn: boolean;
  initialTab: "overview" | "courseWebsite";
  faqItems: FAQItem[];
  slug: string;
}

export default function DesignationLandingClient({
  designation,
  documents,
  cpeCategories,
  resources,
  holderCount,
  primaryCourseSlug,
  hasAccess,
  isLoggedIn,
  initialTab,
  faqItems,
  slug,
}: Props) {
  const locale = useLocale();
  const [activeTab, setActiveTab] = useState<"overview" | "courseWebsite">(
    initialTab
  );

  const d = designation;
  const meta = d.metadata ?? {};
  const name = locale === "ar" && d.name_ar ? d.name_ar : d.name;
  const desc =
    (locale === "ar" && d.description_ar ? d.description_ar : d.description) ??
    "";
  const renderCycleYears = Number(meta.cpe_cycle_years) || 1;
  const cpeHours =
    Number(meta.cpe_cycle_hours) || d.annual_cpe_required * renderCycleYears;
  const prerequisites: string[] = Array.isArray(meta.prerequisites)
    ? (meta.prerequisites as string[])
    : [];

  const tierRaw = meta.tier_level;
  const tier =
    tierRaw === "gateway" ||
    tierRaw === "professional" ||
    tierRaw === "executive"
      ? tierRaw
      : null;

  const hideTabs = meta.hide_tabs === true;
  const effectiveTab = hideTabs ? "overview" : activeTab;

  return (
    <div className="pb-0">
      {/* Hero */}
      <DesignationHero
        name={name}
        abbreviation={d.abbreviation}
        description={desc}
        prerequisites={prerequisites}
        locale={locale}
        slug={slug}
        tier={tier}
        foundingFee={d.founding_fee}
        currency={d.currency ?? "USD"}
        cpeHours={cpeHours}
        cpeCycleYears={renderCycleYears}
        holderCount={holderCount}
        primaryCourseSlug={primaryCourseSlug}
      />

      {/* Tab Navigation */}
      {!hideTabs && (
        <DesignationTabs
          activeTab={activeTab}
          onTabChange={setActiveTab}
          locale={locale}
        />
      )}

      {/* Tab Content */}
      {effectiveTab === "overview" ? (
        <div className="space-y-16 py-16">
          <div className="container mx-auto px-4">
            <DesignationOverview
              abbreviation={d.abbreviation}
              description={desc}
              documentsCount={documents.length}
              cpeHours={cpeHours}
              cpeCycleYears={renderCycleYears}
              locale={locale}
            />
          </div>

          {documents.length > 0 && (
            <div className="container mx-auto px-4">
              <DesignationModules documents={documents} locale={locale} />
            </div>
          )}

          <div className="container mx-auto px-4">
            <DesignationFoundingMember
              abbreviation={d.abbreviation}
              foundingFee={d.founding_fee}
              locale={locale}
            />
          </div>

          <div className="container mx-auto px-4">
            <DesignationSteps
              abbreviation={d.abbreviation}
              locale={locale}
              primaryCourseSlug={primaryCourseSlug}
            />
          </div>

          {cpeCategories.length > 0 && (
            <div className="container mx-auto px-4">
              <DesignationCPE
                cpeCategories={cpeCategories}
                abbreviation={d.abbreviation}
                cpeHours={cpeHours}
                cpeCycleYears={renderCycleYears}
                slug={slug}
                locale={locale}
              />
            </div>
          )}

          <div className="container mx-auto px-4">
            <DesignationFAQ items={faqItems} locale={locale} />
          </div>

          <DesignationCTA
            abbreviation={d.abbreviation}
            slug={slug}
            locale={locale}
            primaryCourseSlug={primaryCourseSlug}
          />
        </div>
      ) : (
        <div className="space-y-16 py-16">
          <div className="container mx-auto px-4">
            <DesignationCourseContent
              slug={slug}
              locale={locale}
              designationId={d.id}
            />
          </div>
          <div className="container mx-auto px-4">
            <DesignationResources
              resources={resources}
              locale={locale}
              abbreviation={d.abbreviation}
              hasAccess={hasAccess}
              isLoggedIn={isLoggedIn}
              slug={slug}
            />
          </div>
        </div>
      )}
    </div>
  );
}

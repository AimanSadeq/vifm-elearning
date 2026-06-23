import Link from "next/link";

export const metadata = {
  title: "Terms of Service | VIFM Academy",
  description:
    "Terms of Service for the VIFM Academy e-learning platform.",
};

const P = ({ children }: { children: React.ReactNode }) => (
  <p className="mt-3 text-muted-foreground leading-relaxed">{children}</p>
);

const H3 = ({ children }: { children: React.ReactNode }) => (
  <h3 className="mt-6 text-lg font-semibold">{children}</h3>
);

const UL = ({ items }: { items: React.ReactNode[] }) => (
  <ul className="mt-3 list-disc space-y-1.5 ps-6 text-muted-foreground leading-relaxed">
    {items.map((it, i) => (
      <li key={i}>{it}</li>
    ))}
  </ul>
);

export default async function TermsOfServicePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const mail = (
    <a
      href="mailto:clients@viftraining.com"
      className="text-brand-600 hover:underline"
    >
      clients@viftraining.com
    </a>
  );

  return (
    <div className="py-16 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <h1 className="font-heading text-3xl font-bold sm:text-4xl">
          Terms of Service
        </h1>
        <p className="mt-3 font-medium">
          Virginia Institute of Finance and Management — VIFM Academy
          E-Learning Platform
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Last Updated: February 2026
        </p>

        <div className="mt-10 space-y-10">
          <section>
            <h2 className="text-xl font-semibold">1. Agreement to Terms</h2>
            <P>
              By accessing, registering for, or using the VIFM Academy
              e-learning platform, including our website at{" "}
              <a
                href="https://learn.viftraining.com"
                className="text-brand-600 hover:underline"
              >
                learn.viftraining.com
              </a>
              , mobile applications, and related services (collectively, the
              &ldquo;Platform&rdquo;), you agree to be legally bound by these
              Terms of Service (&ldquo;Terms&rdquo;) and our{" "}
              <Link
                href={`/${locale}/privacy-policy`}
                className="text-brand-600 hover:underline"
              >
                Privacy Policy
              </Link>
              , which is incorporated herein by reference.
            </P>
            <P>
              If you are accessing the Platform on behalf of an organisation,
              you represent and warrant that you have the authority to bind that
              organisation to these Terms, and references to &ldquo;you&rdquo;
              shall include both you and that organisation.
            </P>
            <P>
              If you do not agree to these Terms, you must not access or use the
              Platform.
            </P>
          </section>

          <section>
            <h2 className="text-xl font-semibold">2. Eligibility</h2>
            <P>
              The Platform is intended for professional use by individuals aged
              18 and above. By creating an account, you confirm that you meet
              this age requirement and that all information you provide is
              accurate, current, and complete. VIFM reserves the right to
              suspend or terminate any account where eligibility requirements
              are not met.
            </P>
          </section>

          <section>
            <h2 className="text-xl font-semibold">3. User Accounts</h2>
            <H3>3.1 Account Registration</H3>
            <P>
              You must provide accurate, complete, and up-to-date information
              when creating an account. You agree to promptly update your
              account information if any details change. VIFM reserves the right
              to reject or remove any account that contains false, misleading,
              or inappropriate information.
            </P>
            <H3>3.2 Account Security</H3>
            <P>
              You are solely responsible for maintaining the confidentiality of
              your login credentials and for all activities that occur under
              your account. You must not share your credentials with any third
              party or allow others to access the Platform using your account.
              You agree to notify us immediately at {mail} if you become aware
              of any unauthorised access to or use of your account. VIFM shall
              not be liable for any loss or damage arising from your failure to
              maintain the security of your account.
            </P>
            <H3>3.3 Account Suspension and Termination</H3>
            <P>
              VIFM reserves the right to suspend or permanently terminate your
              account, without prior notice, if we determine that you have
              violated these Terms, engaged in fraudulent activity, or used the
              Platform in a manner that is harmful to other users, instructors,
              or VIFM.
            </P>
          </section>

          <section>
            <h2 className="text-xl font-semibold">
              4. Course Enrolment and Access
            </h2>
            <H3>4.1 Enrolment</H3>
            <P>
              Course access is granted upon successful completion of the
              enrolment process and, where applicable, receipt of full payment.
              Enrolment in a course constitutes your agreement to comply with
              any additional course-specific requirements communicated at the
              time of enrolment.
            </P>
            <H3>4.2 Access Duration</H3>
            <P>
              The duration of your access to a course is determined by the
              course type or subscription plan you have purchased. Access
              periods are specified on the relevant course or plan page at the
              time of purchase. VIFM does not guarantee indefinite access to any
              course or content.
            </P>
            <H3>4.3 Content Updates</H3>
            <P>
              VIFM reserves the right to modify, update, or remove course
              content at any time to ensure accuracy, relevance, and compliance
              with applicable standards. Where material changes are made to a
              course in which you are actively enrolled, we will endeavour to
              provide reasonable notice.
            </P>
            <H3>4.4 Technical Requirements</H3>
            <P>
              You are responsible for ensuring that your device and internet
              connection meet the minimum technical requirements necessary to
              access the Platform. VIFM is not responsible for any inability to
              access content arising from your technical environment.
            </P>
          </section>

          <section>
            <h2 className="text-xl font-semibold">5. Payments and Refunds</h2>
            <H3>5.1 Pricing</H3>
            <P>
              All prices are displayed in the applicable currency at the time of
              purchase. VIFM reserves the right to adjust pricing at any time;
              however, any change will not affect enrolments already confirmed
              and paid.
            </P>
            <H3>5.2 Payment Processing</H3>
            <P>
              Payments are processed securely through our authorised third-party
              payment partners. By submitting payment, you authorise VIFM to
              charge the applicable fees to your designated payment method. VIFM
              does not store full payment card details.
            </P>
            <H3>5.3 Refund Policy</H3>
            <P>
              Refund requests must be submitted in writing to {mail} within 14
              calendar days of the enrolment date, provided that no more than
              25% of the course content has been accessed. Refunds will not be
              issued after this period or where the access threshold has been
              exceeded. Refunds are processed within 10 business days and
              returned to the original payment method.
            </P>
            <H3>5.4 Subscriptions</H3>
            <P>
              Subscription plans are billed on a recurring basis as specified at
              the time of purchase. You may cancel your subscription at any time;
              cancellation will take effect at the end of the current billing
              period, and no partial refunds will be issued for unused time
              within a billing cycle.
            </P>
            <H3>5.5 Free Courses and Vouchers</H3>
            <P>
              Courses accessed using a voucher code or offered at no charge are
              subject to these Terms in the same manner as paid enrolments.
              Voucher codes are non-transferable, cannot be exchanged for cash,
              and are valid only for the course or period specified.
            </P>
          </section>

          <section>
            <h2 className="text-xl font-semibold">6. Intellectual Property</h2>
            <H3>6.1 VIFM Content</H3>
            <P>
              All content available on the Platform, including but not limited
              to course videos, lecture materials, assessments, study guides,
              graphics, software, and platform features, is the intellectual
              property of VIFM or its licensors and is protected by applicable
              copyright, trademark, and intellectual property laws.
            </P>
            <H3>6.2 Permitted Use</H3>
            <P>
              Upon enrolment, VIFM grants you a limited, non-exclusive,
              non-transferable, revocable licence to access and use the course
              content solely for your personal, non-commercial, professional
              development purposes. This licence does not permit you to download,
              reproduce, distribute, publicly display, modify, or create
              derivative works from any content without the prior explicit
              written consent of VIFM.
            </P>
            <H3>6.3 User-Generated Content</H3>
            <P>
              Where the Platform permits you to submit content, such as forum
              posts, comments, or assignments, you retain ownership of your
              content but grant VIFM a non-exclusive, royalty-free licence to
              use, display, and store such content for the purposes of operating
              the Platform. You represent that any content you submit does not
              infringe the rights of any third party.
            </P>
          </section>

          <section>
            <h2 className="text-xl font-semibold">7. Acceptable Use</h2>
            <P>
              You agree to use the Platform in a lawful, respectful, and
              responsible manner. You must not:
            </P>
            <UL
              items={[
                "Share, transfer, or sell your account credentials or allow any third party to access the Platform using your account",
                "Reproduce, redistribute, screen-record, or otherwise copy course content in whole or in part",
                "Use automated tools, bots, scrapers, or scripts to access, download, or extract content from the Platform",
                "Engage in any conduct that disrupts, damages, or impairs the Platform or its infrastructure",
                "Attempt to gain unauthorised access to any part of the Platform or any other user’s account",
                "Post, upload, or transmit any content that is unlawful, defamatory, offensive, or infringes third-party rights in any discussion forums or interactive features",
                "Misrepresent your identity, qualifications, or affiliation in connection with the Platform",
              ]}
            />
            <P>
              VIFM reserves the right to investigate and take appropriate action,
              including removal of content and account termination, in response
              to any violation of this section.
            </P>
          </section>

          <section>
            <h2 className="text-xl font-semibold">
              8. Certifications and CPE Credits
            </h2>
            <H3>8.1 Issuance</H3>
            <P>
              Digital certificates and Continuing Professional Education (CPE)
              credits are issued upon successful completion of all course
              requirements, including any assessments, examinations, or minimum
              progress thresholds specified for the relevant course or
              certification programme.
            </P>
            <H3>8.2 Integrity</H3>
            <P>
              VIFM maintains the integrity of its certification programmes. Any
              attempt to circumvent assessments, share examination content,
              impersonate another learner, or otherwise obtain a certificate
              through fraudulent or dishonest means will result in immediate
              revocation of the certificate, termination of the account, and may
              be reported to relevant professional bodies.
            </P>
            <H3>8.3 Verification</H3>
            <P>
              VIFM certificates are subject to verification by employers,
              professional bodies, or other third parties. VIFM reserves the
              right to confirm or deny the validity of any certificate issued
              through the Platform.
            </P>
          </section>

          <section>
            <h2 className="text-xl font-semibold">9. Corporate Accounts</h2>
            <P>
              Organisations that access the Platform through a corporate account
              are responsible for managing their authorised users, ensuring that
              all users comply with these Terms, and maintaining accurate records
              of their licences. The specific terms governing corporate access,
              including licence scope, user limits, and administrative rights,
              are set out in the separate Corporate Agreement executed between
              the organisation and VIFM. In the event of any conflict between
              these Terms and the Corporate Agreement, the Corporate Agreement
              shall prevail with respect to the corporate relationship.
            </P>
          </section>

          <section>
            <h2 className="text-xl font-semibold">
              10. Third-Party Links and Services
            </h2>
            <P>
              The Platform may contain links to third-party websites, tools, or
              services. These links are provided for convenience only and do not
              constitute an endorsement by VIFM. VIFM has no control over the
              content or practices of third-party sites and accepts no
              responsibility for any loss or damage arising from your use of
              them. Your interactions with third-party services are governed by
              their respective terms and privacy policies.
            </P>
          </section>

          <section>
            <h2 className="text-xl font-semibold">
              11. Disclaimer of Warranties
            </h2>
            <P>
              The Platform and all content are provided on an &ldquo;as
              is&rdquo; and &ldquo;as available&rdquo; basis, without warranties
              of any kind, whether express, implied, or statutory. To the fullest
              extent permitted by applicable law, VIFM expressly disclaims all
              warranties, including implied warranties of merchantability,
              fitness for a particular purpose, and non-infringement. VIFM does
              not warrant that the Platform will be uninterrupted, error-free, or
              free of viruses or other harmful components, or that course content
              is complete, accurate, or current at all times.
            </P>
          </section>

          <section>
            <h2 className="text-xl font-semibold">12. Limitation of Liability</h2>
            <P>
              To the fullest extent permitted by applicable law, VIFM, its
              directors, employees, instructors, and affiliates shall not be
              liable for any indirect, incidental, special, consequential, or
              punitive damages, including loss of profits, data, or business
              opportunities, arising out of or in connection with your use of or
              inability to use the Platform, even if VIFM has been advised of the
              possibility of such damages.
            </P>
            <P>
              VIFM&rsquo;s total aggregate liability to you for any claims arising
              under or in connection with these Terms shall not exceed the total
              amount paid by you to VIFM in the twelve (12) months immediately
              preceding the event giving rise to the claim.
            </P>
            <P>
              Nothing in these Terms shall limit or exclude liability for death
              or personal injury caused by negligence, fraud, or any other
              liability that cannot be excluded by law.
            </P>
          </section>

          <section>
            <h2 className="text-xl font-semibold">
              13. Governing Law and Dispute Resolution
            </h2>
            <P>
              These Terms shall be governed by and construed in accordance with
              the laws of the applicable jurisdiction in which VIFM operates. Any
              dispute arising out of or in connection with these Terms that
              cannot be resolved amicably shall be referred to the competent
              courts of that jurisdiction.
            </P>
          </section>

          <section>
            <h2 className="text-xl font-semibold">14. Changes to These Terms</h2>
            <P>
              VIFM reserves the right to modify these Terms at any time. When
              material changes are made, we will notify registered users by email
              and post a prominent notice on the Platform at least 14 days before
              the changes take effect. Your continued use of the Platform after
              the effective date of any changes constitutes your acceptance of
              the updated Terms. If you do not agree to the revised Terms, you
              must discontinue use of the Platform before the changes take
              effect.
            </P>
          </section>

          <section>
            <h2 className="text-xl font-semibold">15. Severability</h2>
            <P>
              If any provision of these Terms is found to be unlawful, void, or
              unenforceable, that provision shall be deemed severable and shall
              not affect the validity and enforceability of the remaining
              provisions.
            </P>
          </section>

          <section>
            <h2 className="text-xl font-semibold">16. Entire Agreement</h2>
            <P>
              These Terms, together with the Privacy Policy and any applicable
              Corporate Agreement, constitute the entire agreement between you
              and VIFM with respect to your use of the Platform and supersede all
              prior agreements, representations, or understandings relating to
              the same subject matter.
            </P>
          </section>

          <section>
            <h2 className="text-xl font-semibold">17. Contact Us</h2>
            <P>
              If you have any questions or concerns regarding these Terms of
              Service, please contact us:
            </P>
            <P>
              <strong className="text-foreground">
                Virginia Institute of Finance and Management
              </strong>{" "}
              — Legal &amp; Compliance
              <br />
              Email: {mail}
              <br />
              Website:{" "}
              <a
                href="https://www.viftraining.com/contact"
                className="text-brand-600 hover:underline"
              >
                www.viftraining.com/contact
              </a>
            </P>
          </section>
        </div>
      </div>
    </div>
  );
}

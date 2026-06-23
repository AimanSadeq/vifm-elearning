export const metadata = {
  title: "Privacy Policy | VIFM Academy",
  description: "Privacy Policy for the VIFM Academy e-learning platform.",
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

const USE_ROWS: [string, string][] = [
  ["Providing and maintaining the Platform and its features", "Performance of contract"],
  ["Processing course enrolments, payments, and refunds", "Performance of contract"],
  ["Tracking learning progress and issuing digital certificates and CPE credits", "Performance of contract"],
  ["Sending course updates, completion reminders, and relevant notifications", "Legitimate interest / consent"],
  ["Communicating administrative information, including policy changes", "Legitimate interest"],
  ["Improving the Platform and developing new courses and features", "Legitimate interest"],
  ["Conducting analytics and generating aggregated, anonymised reports", "Legitimate interest"],
  ["Complying with applicable legal and regulatory obligations", "Legal obligation"],
  ["Preventing fraud and ensuring platform security", "Legitimate interest / legal obligation"],
];

export default function PrivacyPolicyPage() {
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
          Privacy Policy
        </h1>
        <p className="mt-3 font-medium">
          Virginia Institute of Finance and Management — VIFM Academy
          E-Learning Platform
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Last Updated: June 2026
        </p>

        <div className="mt-10 space-y-10">
          <section>
            <h2 className="text-xl font-semibold">1. Introduction</h2>
            <P>
              Virginia Institute of Finance and Management (&ldquo;VIFM&rdquo;,
              &ldquo;we&rdquo;, &ldquo;our&rdquo;, or &ldquo;us&rdquo;) is
              committed to protecting the privacy and security of your personal
              information. This Privacy Policy explains how we collect, use,
              disclose, and safeguard your information when you access or use the
              VIFM Academy e-learning platform, including our website at{" "}
              <a
                href="https://learn.viftraining.com"
                className="text-brand-600 hover:underline"
              >
                learn.viftraining.com
              </a>
              , mobile applications, and related services (collectively, the
              &ldquo;Platform&rdquo;).
            </P>
            <P>
              By registering for an account or using the Platform, you
              acknowledge that you have read and understood this Privacy Policy.
              If you do not agree with the practices described herein, please
              discontinue use of the Platform.
            </P>
          </section>

          <section>
            <h2 className="text-xl font-semibold">2. Information We Collect</h2>
            <H3>2.1 Information You Provide Directly</H3>
            <P>
              We collect personal information that you voluntarily provide when
              you register for an account, enroll in courses, make a payment, or
              contact us. This includes:
            </P>
            <UL
              items={[
                <>
                  <strong className="text-foreground">
                    Identity information:
                  </strong>{" "}
                  Full name, job title, and professional credentials
                </>,
                <>
                  <strong className="text-foreground">
                    Contact information:
                  </strong>{" "}
                  Email address, phone number, and mailing address
                </>,
                <>
                  <strong className="text-foreground">
                    Organisation details:
                  </strong>{" "}
                  Employer name, department, and corporate account information
                  (where applicable)
                </>,
                <>
                  <strong className="text-foreground">
                    Payment information:
                  </strong>{" "}
                  Credit or debit card details and billing address, processed
                  securely through our third-party payment providers
                </>,
                <>
                  <strong className="text-foreground">
                    Profile information:
                  </strong>{" "}
                  Profile photo, professional background, and learning
                  preferences
                </>,
              ]}
            />
            <H3>2.2 Information Collected Automatically</H3>
            <P>
              When you use the Platform, we automatically collect certain
              technical and usage data, including:
            </P>
            <UL
              items={[
                "Pages visited, courses accessed, and video watch progress",
                "Assessment and quiz responses and completion records",
                "Login timestamps, session duration, and navigation patterns",
                "Device type, operating system, browser type, and IP address",
                "Referring URLs and search terms used to reach the Platform",
              ]}
            />
            <H3>2.3 Information from Third Parties</H3>
            <P>
              Where you register or log in using a third-party service (such as
              LinkedIn or Google), we may receive basic profile information from
              that service in accordance with your privacy settings on that
              platform.
            </P>
          </section>

          <section>
            <h2 className="text-xl font-semibold">
              3. How We Use Your Information
            </h2>
            <P>We use the information we collect for the following purposes:</P>
            <div className="mt-4 overflow-hidden rounded-lg border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-2.5 text-start font-semibold">
                      Purpose
                    </th>
                    <th className="px-4 py-2.5 text-start font-semibold">
                      Legal Basis
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {USE_ROWS.map(([purpose, basis], i) => (
                    <tr key={i} className="border-b last:border-0">
                      <td className="px-4 py-2.5 align-top text-muted-foreground">
                        {purpose}
                      </td>
                      <td className="px-4 py-2.5 align-top text-muted-foreground">
                        {basis}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <P>
              We will not use your personal information for purposes incompatible
              with those described above without first obtaining your consent.
            </P>
          </section>

          <section>
            <h2 className="text-xl font-semibold">
              4. Information Sharing and Disclosure
            </h2>
            <P>
              We do not sell, rent, or trade your personal information to third
              parties. We may share your data only in the following limited
              circumstances:
            </P>
            <UL
              items={[
                <>
                  <strong className="text-foreground">
                    Course Instructors:
                  </strong>{" "}
                  Instructors may access learner information limited to course
                  enrolment status, progress, and assessment results, solely for
                  the purpose of delivering and supporting the course.
                </>,
                <>
                  <strong className="text-foreground">
                    Corporate Administrators:
                  </strong>{" "}
                  If you are enrolled through an organisational account, your
                  employer or designated administrator may have access to your
                  enrolment status, course completion records, and CPE credits
                  earned.
                </>,
                <>
                  <strong className="text-foreground">
                    Payment Processors:
                  </strong>{" "}
                  We share payment information with authorised third-party
                  payment processors to complete transactions securely. These
                  processors are bound by strict data protection obligations and
                  are not permitted to use your information for any other
                  purpose.
                </>,
                <>
                  <strong className="text-foreground">
                    Service Providers:
                  </strong>{" "}
                  We engage trusted third-party vendors to assist in operating
                  the Platform, including cloud hosting, email delivery,
                  analytics, and customer support. All service providers are
                  contractually required to protect your data and process it only
                  on our instructions.
                </>,
                <>
                  <strong className="text-foreground">
                    Legal and Regulatory Authorities:
                  </strong>{" "}
                  We may disclose your information where required to do so by law,
                  court order, or regulatory authority, or where we believe
                  disclosure is necessary to protect the rights, property, or
                  safety of VIFM, our users, or the public.
                </>,
                <>
                  <strong className="text-foreground">
                    Business Transfers:
                  </strong>{" "}
                  In the event of a merger, acquisition, or sale of assets, your
                  information may be transferred to the successor entity, subject
                  to the same privacy protections described in this Policy.
                </>,
              ]}
            />
          </section>

          <section>
            <h2 className="text-xl font-semibold">5. Data Retention</h2>
            <P>
              We retain your personal information for as long as your account
              remains active or as necessary to provide you with our services.
              We also retain data as required to comply with legal obligations,
              resolve disputes, and enforce our agreements. When your data is no
              longer required, we securely delete or anonymise it in accordance
              with our data retention schedule.
            </P>
          </section>

          <section>
            <h2 className="text-xl font-semibold">6. Data Security</h2>
            <P>
              We implement industry-standard technical and organisational
              security measures to protect your personal information against
              unauthorised access, disclosure, alteration, or destruction. These
              measures include:
            </P>
            <UL
              items={[
                "Encryption of data in transit using TLS (Transport Layer Security)",
                "Encryption of sensitive data at rest",
                "Secure authentication mechanisms, including password hashing",
                "Role-based access controls limiting staff access to personal data",
                "Regular security assessments and vulnerability testing",
              ]}
            />
            <P>
              While we take all reasonable precautions, no method of electronic
              transmission or storage is completely secure. We encourage you to
              use a strong, unique password and to notify us immediately if you
              suspect any unauthorised access to your account.
            </P>
          </section>

          <section>
            <h2 className="text-xl font-semibold">
              7. Cookies and Tracking Technologies
            </h2>
            <P>
              We use cookies and similar tracking technologies to operate and
              improve the Platform. Cookies are small text files stored on your
              device that help us:
            </P>
            <UL
              items={[
                "Maintain your login session and authentication state",
                "Remember your language preferences and accessibility settings",
                "Analyse how learners navigate and use the Platform",
                "Measure the effectiveness of our communications",
              ]}
            />
            <P>
              You may control or disable cookies through your browser settings;
              however, disabling certain cookies may affect the functionality of
              the Platform. We do not use cookies to serve third-party
              advertising.
            </P>
          </section>

          <section>
            <h2 className="text-xl font-semibold">
              8. International Data Transfers
            </h2>
            <P>
              VIFM operates primarily in the GCC region. If your information is
              transferred to or processed in a country outside your jurisdiction,
              we ensure that appropriate safeguards are in place to protect your
              data in accordance with applicable data protection laws.
            </P>
          </section>

          <section>
            <h2 className="text-xl font-semibold">
              9. Children&rsquo;s Privacy
            </h2>
            <P>
              The Platform is intended for professional use by individuals aged
              18 and above. We do not knowingly collect personal information from
              children under the age of 18. If we become aware that a minor has
              provided us with personal information, we will take steps to delete
              such information promptly.
            </P>
          </section>

          <section>
            <h2 className="text-xl font-semibold">10. Your Rights</h2>
            <P>
              Depending on your jurisdiction, you may have the following rights
              with respect to your personal information:
            </P>
            <UL
              items={[
                <>
                  <strong className="text-foreground">Right of access:</strong>{" "}
                  Request a copy of the personal information we hold about you
                </>,
                <>
                  <strong className="text-foreground">
                    Right to rectification:
                  </strong>{" "}
                  Request correction of inaccurate or incomplete information
                </>,
                <>
                  <strong className="text-foreground">Right to erasure:</strong>{" "}
                  Request deletion of your personal information, subject to legal
                  retention obligations
                </>,
                <>
                  <strong className="text-foreground">
                    Right to restriction:
                  </strong>{" "}
                  Request that we limit the processing of your data in certain
                  circumstances
                </>,
                <>
                  <strong className="text-foreground">
                    Right to data portability:
                  </strong>{" "}
                  Receive your data in a structured, machine-readable format
                </>,
                <>
                  <strong className="text-foreground">
                    Right to withdraw consent:
                  </strong>{" "}
                  Where processing is based on consent, withdraw it at any time
                  without affecting the lawfulness of prior processing
                </>,
                <>
                  <strong className="text-foreground">Right to object:</strong>{" "}
                  Object to processing based on legitimate interests
                </>,
              ]}
            />
            <P>
              To exercise any of these rights, please submit a request to us
              using the contact details below. We will respond within 30 days of
              receiving your request.
            </P>
          </section>

          <section>
            <h2 className="text-xl font-semibold">
              11. Changes to This Privacy Policy
            </h2>
            <P>
              We may update this Privacy Policy from time to time to reflect
              changes in our practices, technology, or legal requirements. When
              we make material changes, we will notify you by email or by posting
              a prominent notice on the Platform prior to the change taking
              effect. The &ldquo;Last Updated&rdquo; date at the top of this
              Policy indicates when it was most recently revised. We encourage you
              to review this Policy periodically.
            </P>
          </section>

          <section>
            <h2 className="text-xl font-semibold">12. Contact Us</h2>
            <P>
              If you have any questions, concerns, or requests regarding this
              Privacy Policy or our data practices, please contact us:
            </P>
            <P>
              <strong className="text-foreground">
                Virginia Institute of Finance and Management
              </strong>{" "}
              — Privacy &amp; Data Protection
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
            <P>
              We are committed to addressing your concerns promptly and
              transparently.
            </P>
          </section>
        </div>
      </div>
    </div>
  );
}

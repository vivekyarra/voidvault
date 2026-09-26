import type { JSX } from "react";
import { RazorVLogo } from "./brand/RazorVLogo";

interface LegalPageProps {
  onNavigateHome: () => void;
}

interface Section {
  title: string;
  body: JSX.Element;
}

const CONTACT_EMAIL = "devilsince1911@gmail.com";
const EFFECTIVE_DATE = "February 27, 2026";

function LegalLayout({
  title,
  sections,
  onNavigateHome,
}: {
  title: string;
  sections: Section[];
  onNavigateHome: () => void;
}) {
  return (
    <main className="legal-shell">
      <header className="legal-header">
        <div className="legal-brand">
          <RazorVLogo aria-hidden="true" className="legal-brand-mark" />
          <span>VOIDVAULT</span>
        </div>
        <button className="ghost-button" type="button" onClick={onNavigateHome}>
          Back
        </button>
        <h1>{title}</h1>
        <p className="legal-effective">Effective Date: {EFFECTIVE_DATE}</p>
      </header>

      <article className="legal-card">
        {sections.map((section) => (
          <section className="legal-section" key={section.title}>
            <h2>{section.title}</h2>
            {section.body}
          </section>
        ))}
      </article>
    </main>
  );
}

export function TermsPage({ onNavigateHome }: LegalPageProps) {
  const sections: Section[] = [
    {
      title: "Welcome",
      body: (
        <p>
          Welcome to VoidVault. By accessing or using VoidVault (the Service), you
          agree to these Terms of Service. If you do not agree, do not use the
          Service.
        </p>
      ),
    },
    {
      title: "1. Description of Service",
      body: (
        <>
          <p>VoidVault is an anonymous social platform that allows users to:</p>
          <ul>
            <li>Create accounts using a username and password</li>
            <li>Post content and images</li>
            <li>Follow other users</li>
            <li>Send and receive messages</li>
          </ul>
          <p>
            VoidVault does not require email or traditional identity verification.
          </p>
        </>
      ),
    },
    {
      title: "2. Eligibility",
      body: (
        <>
          <p>
            You must be at least 13 years old (or the minimum age required in your
            country) to use VoidVault.
          </p>
          <p>By using the Service, you confirm that:</p>
          <ul>
            <li>You meet the minimum age requirement</li>
            <li>You will comply with all applicable laws</li>
          </ul>
        </>
      ),
    },
    {
      title: "3. Account Responsibility",
      body: (
        <>
          <p>You are responsible for:</p>
          <ul>
            <li>Keeping your password secure</li>
            <li>All activity performed under your account</li>
          </ul>
          <p>
            VoidVault cannot recover accounts if you lose your password. You will
            need to create a new account.
          </p>
        </>
      ),
    },
    {
      title: "4. Prohibited Content and Behavior",
      body: (
        <>
          <p>You may not use VoidVault to:</p>
          <ul>
            <li>Post illegal content</li>
            <li>Harass, threaten, or abuse others</li>
            <li>Share sexually explicit material involving minors</li>
            <li>Impersonate others</li>
            <li>Upload malware or harmful code</li>
            <li>Engage in spam or automated abuse</li>
          </ul>
          <p>
            VoidVault reserves the right to remove content or suspend accounts at
            its discretion.
          </p>
        </>
      ),
    },
    {
      title: "5. Content Ownership",
      body: (
        <>
          <p>You retain ownership of the content you post.</p>
          <p>
            By posting content, you grant VoidVault a non-exclusive, worldwide
            license to host, display, and distribute your content for the purpose of
            operating the Service.
          </p>
        </>
      ),
    },
    {
      title: "6. Moderation",
      body: (
        <p>
          VoidVault may remove content, hide posts, suspend accounts, or restrict
          features to protect users and platform integrity.
        </p>
      ),
    },
    {
      title: "7. Disclaimer of Warranties",
      body: (
        <p>
          VoidVault is provided as is. We do not guarantee continuous availability,
          error-free operation, or security against all threats. Use the Service at
          your own risk.
        </p>
      ),
    },
    {
      title: "8. Limitation of Liability",
      body: (
        <p>
          VoidVault is not liable for user-generated content, loss of data, or
          damages resulting from use of the Service, to the maximum extent permitted
          by law.
        </p>
      ),
    },
    {
      title: "9. Changes to Terms",
      body: (
        <p>
          We may update these Terms at any time. Continued use of the Service
          constitutes acceptance of changes.
        </p>
      ),
    },
    {
      title: "10. Contact",
      body: (
        <p>
          For legal inquiries, contact:{" "}
          <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
        </p>
      ),
    },
  ];

  return (
    <LegalLayout
      title="Terms of Service"
      sections={sections}
      onNavigateHome={onNavigateHome}
    />
  );
}

export function PrivacyPage({ onNavigateHome }: LegalPageProps) {
  const sections: Section[] = [
    {
      title: "Welcome",
      body: (
        <p>
          VoidVault respects your privacy. This policy explains what we collect and
          how we use it.
        </p>
      ),
    },
    {
      title: "1. Information We Collect",
      body: (
        <>
          <p>VoidVault collects:</p>
          <h3>a) Account Information</h3>
          <ul>
            <li>Username</li>
            <li>Password hash (never stored in plain text)</li>
          </ul>
          <p>We do not collect:</p>
          <ul>
            <li>Email addresses</li>
            <li>Real names</li>
            <li>Phone numbers</li>
          </ul>
          <h3>b) Technical Data</h3>
          <p>Automatically collected:</p>
          <ul>
            <li>IP address (for security and rate limiting)</li>
            <li>Device fingerprint (hashed)</li>
            <li>Session tokens (hashed)</li>
            <li>Browser user-agent</li>
          </ul>
          <h3>c) Content</h3>
          <p>We store:</p>
          <ul>
            <li>Posts</li>
            <li>Messages</li>
            <li>Uploaded images</li>
          </ul>
          <p>Images are stored via Cloudinary CDN.</p>
        </>
      ),
    },
    {
      title: "2. Cookies",
      body: (
        <>
          <p>VoidVault uses secure cookies to maintain login sessions.</p>
          <p>Cookie details:</p>
          <ul>
            <li>HttpOnly</li>
            <li>Secure</li>
            <li>SameSite=None</li>
            <li>Used only for authentication</li>
          </ul>
          <p>We do not use tracking or advertising cookies.</p>
        </>
      ),
    },
    {
      title: "3. How We Use Data",
      body: (
        <ul>
          <li>Provide account access</li>
          <li>Prevent abuse and spam</li>
          <li>Enforce platform rules</li>
          <li>Maintain security</li>
          <li>Do not sell personal data</li>
        </ul>
      ),
    },
    {
      title: "4. Data Storage",
      body: (
        <p>
          Data is stored using Supabase (PostgreSQL), Cloudflare infrastructure, and
          Cloudinary for images.
        </p>
      ),
    },
    {
      title: "5. Data Retention",
      body: (
        <p>
          We retain data until user deletion, account removal, or policy action.
          Deleted posts may be retained for security or moderation purposes.
        </p>
      ),
    },
    {
      title: "6. Third-Party Services",
      body: (
        <p>
          VoidVault uses Cloudflare, Supabase, and Cloudinary. These providers
          process data as part of delivering the Service.
        </p>
      ),
    },
    {
      title: "7. Security",
      body: (
        <p>
          We implement hashed session tokens, password hashing, rate limiting, and
          secure HTTPS connections. However, no system is 100 percent secure.
        </p>
      ),
    },
    {
      title: "8. Children's Privacy",
      body: (
        <p>
          VoidVault is not directed at children under 13. If you believe a child has
          provided personal information, contact us.
        </p>
      ),
    },
    {
      title: "9. Changes to This Policy",
      body: <p>We may update this Privacy Policy periodically.</p>,
    },
    {
      title: "10. Contact",
      body: (
        <p>
          For privacy questions:{" "}
          <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
        </p>
      ),
    },
  ];

  return (
    <LegalLayout
      title="Privacy Policy"
      sections={sections}
      onNavigateHome={onNavigateHome}
    />
  );
}

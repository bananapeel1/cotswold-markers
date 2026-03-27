import TopNav from "@/components/TopNav";
import Link from "next/link";

export const metadata = {
  title: "Privacy Policy | TrailTap",
  description: "How TrailTap handles your data on the Cotswold Way.",
};

export default function PrivacyPage() {
  return (
    <>
      <TopNav />
      <main className="max-w-2xl mx-auto px-4 pt-20 pb-8 space-y-6 text-sm text-on-surface/80 leading-relaxed">
        <h1 className="font-headline text-2xl font-bold text-primary">
          Privacy Policy
        </h1>
        <p className="text-secondary text-xs">Last updated: 27 March 2026</p>

        <section className="space-y-2">
          <h2 className="font-bold text-on-surface">Who we are</h2>
          <p>
            TrailTap is operated by Aron Gijsel. Contact:{" "}
            <a href="mailto:arongijsel@gmail.com" className="text-primary underline">
              arongijsel@gmail.com
            </a>
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-bold text-on-surface">What data we collect</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              <strong>Account data:</strong> If you create an account, we store
              your email address and display name via Google Firebase
              Authentication.
            </li>
            <li>
              <strong>Scan data:</strong> When you scan a QR code marker, we
              record which marker was scanned and when, linked to your account if
              you are signed in.
            </li>
            <li>
              <strong>Location data:</strong> If you use the &ldquo;Near Me&rdquo;
              feature, your device&rsquo;s GPS coordinates are used locally in
              your browser to show nearby points of interest. We do not store your
              location on our servers.
            </li>
            <li>
              <strong>Trail condition reports:</strong> If you submit a trail
              condition report, we store the report content, timestamp, and
              associated marker.
            </li>
            <li>
              <strong>Journal entries:</strong> If you write journal entries, these
              are stored in your browser&rsquo;s local storage and are not sent to
              our servers.
            </li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="font-bold text-on-surface">How we use your data</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>To provide your trail progress, badges, and scan history</li>
            <li>To display community statistics (anonymised scan counts)</li>
            <li>To show trail condition reports to other walkers</li>
            <li>To improve the app experience</li>
          </ul>
          <p>We do not sell your data to third parties.</p>
        </section>

        <section className="space-y-2">
          <h2 className="font-bold text-on-surface">Third-party services</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              <strong>Google Firebase:</strong> Authentication, database, and file
              storage. See{" "}
              <a
                href="https://firebase.google.com/support/privacy"
                className="text-primary underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                Firebase Privacy Policy
              </a>
              .
            </li>
            <li>
              <strong>Mapbox:</strong> Trail maps. See{" "}
              <a
                href="https://www.mapbox.com/legal/privacy"
                className="text-primary underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                Mapbox Privacy Policy
              </a>
              .
            </li>
            <li>
              <strong>Vercel:</strong> Hosting. See{" "}
              <a
                href="https://vercel.com/legal/privacy-policy"
                className="text-primary underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                Vercel Privacy Policy
              </a>
              .
            </li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="font-bold text-on-surface">Cookies</h2>
          <p>
            We use essential cookies for authentication (Firebase session tokens).
            We do not use advertising or tracking cookies. Mapbox may set
            performance cookies for map tile caching.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-bold text-on-surface">Your rights</h2>
          <p>
            Under UK GDPR, you have the right to access, correct, or delete your
            personal data. To exercise these rights, email{" "}
            <a href="mailto:arongijsel@gmail.com" className="text-primary underline">
              arongijsel@gmail.com
            </a>
            .
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-bold text-on-surface">Data retention</h2>
          <p>
            Account and scan data is retained for as long as your account is
            active. You can request deletion at any time. Trail condition reports
            are automatically removed after 30 days.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-bold text-on-surface">Changes to this policy</h2>
          <p>
            We may update this policy from time to time. The latest version will
            always be available at this page.
          </p>
        </section>
      </main>
    </>
  );
}

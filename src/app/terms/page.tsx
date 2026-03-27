import TopNav from "@/components/TopNav";

export const metadata = {
  title: "Terms of Use | TrailTap",
  description: "Terms of use for the TrailTap Cotswold Way trail app.",
};

export default function TermsPage() {
  return (
    <>
      <TopNav title="Terms of Use" showBack />
      <main className="max-w-2xl mx-auto px-4 py-8 space-y-6 text-sm text-on-surface/80 leading-relaxed">
        <h1 className="font-headline text-2xl font-bold text-primary">
          Terms of Use
        </h1>
        <p className="text-secondary text-xs">Last updated: 27 March 2026</p>

        <section className="space-y-2">
          <h2 className="font-bold text-on-surface">1. About TrailTap</h2>
          <p>
            TrailTap is a trail companion app for the Cotswold Way National Trail.
            It provides information about points of interest, facilities, and
            stories along the 102-mile route from Chipping Campden to Bath. The
            app is provided by Aron Gijsel.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-bold text-on-surface">2. Use of the app</h2>
          <p>
            TrailTap is provided as a supplementary guide only. It is not a
            substitute for proper navigation equipment, maps, or common sense.
            Always carry a physical map and compass when walking the Cotswold Way.
          </p>
          <p>
            Mobile signal is intermittent along much of the trail. Do not rely
            solely on this app for navigation or emergency information.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-bold text-on-surface">3. Accuracy of information</h2>
          <p>
            We make every effort to ensure information (opening hours, facilities,
            trail conditions) is accurate and up to date. However, conditions
            change and we cannot guarantee accuracy. Always verify critical
            information (especially accommodation and transport) independently.
          </p>
          <p>
            Trail condition reports are submitted by other walkers and are not
            verified by TrailTap. Use your own judgement on the trail.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-bold text-on-surface">4. Safety</h2>
          <p>
            Walking the Cotswold Way involves inherent risks including uneven
            terrain, steep slopes, livestock, weather exposure, and remote
            locations with no mobile signal. TrailTap accepts no liability for
            injury, loss, or damage arising from use of the trail or reliance on
            information provided in this app.
          </p>
          <p>
            In an emergency, call 999 and ask for Mountain Rescue (Gloucestershire
            Cave &amp; Mountain Rescue Team covers the Cotswold Way).
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-bold text-on-surface">5. User accounts</h2>
          <p>
            You may create an account to track your progress and earn badges. You
            are responsible for maintaining the security of your account. We
            reserve the right to suspend accounts that are used to submit false
            trail condition reports or abuse the platform.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-bold text-on-surface">6. Content</h2>
          <p>
            Historical and cultural content on TrailTap is researched from public
            sources including English Heritage, National Trust, and local history
            records. If you believe any content is inaccurate, please contact us
            at{" "}
            <a href="mailto:arongijsel@gmail.com" className="text-primary underline">
              arongijsel@gmail.com
            </a>
            .
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-bold text-on-surface">7. QR code markers</h2>
          <p>
            Physical QR code markers along the trail are the property of TrailTap.
            Tampering with, removing, or damaging markers is not permitted.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-bold text-on-surface">8. Changes</h2>
          <p>
            We may update these terms from time to time. Continued use of TrailTap
            after changes constitutes acceptance of the updated terms.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-bold text-on-surface">9. Governing law</h2>
          <p>
            These terms are governed by the laws of England and Wales.
          </p>
        </section>
      </main>
    </>
  );
}

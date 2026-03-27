import Link from "next/link";
import Image from "next/image";
import TopNav from "@/components/TopNav";

export const metadata = {
  title: "TrailTap | Partner With Us",
  description: "Sponsor trail markers and reach walkers right on the Cotswold Way.",
};

export default function SponsorsPage() {
  return (
    <>
      <TopNav />
      <main className="pt-24 pb-32">
        {/* Hero */}
        <section className="px-6 max-w-7xl mx-auto mb-20">
          <div className="relative overflow-hidden bg-surface-container rounded-md p-8 md:p-16 flex flex-col md:flex-row items-center gap-12">
            <div className="flex-1 z-10">
              <span className="inline-block px-4 py-1.5 mb-6 rounded-full bg-primary-fixed text-on-primary-fixed text-[10px] font-bold uppercase tracking-widest font-label">
                Business Solutions
              </span>
              <h1 className="text-5xl md:text-7xl font-extrabold font-headline leading-[1.1] tracking-tight text-primary mb-8 max-w-2xl">
                Connect with walkers, right where they are.
              </h1>
              <p className="text-lg text-secondary max-w-lg mb-10 leading-relaxed">
                Bridge the gap between digital discovery and physical
                exploration. Place your brand directly on the trail through
                smart physical markers and contextual rewards.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link
                  href="mailto:AronGijsel@gmail.com"
                  className="bg-primary text-on-primary px-8 py-4 rounded-full font-bold shadow-ambient active:scale-95 transition-all"
                >
                  Book a Marker
                </Link>
                <Link
                  href="mailto:AronGijsel@gmail.com"
                  className="text-primary font-bold px-8 py-4 rounded-full border border-outline-variant/30 hover:bg-surface-container-low transition-colors"
                >
                  Inquire Now
                </Link>
              </div>
            </div>
            <div className="flex-1 relative">
              <div className="relative w-full aspect-square rounded-md overflow-hidden rotate-3 shadow-2xl">
                <Image
                  src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=600&q=80"
                  alt="Local business serving customers"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="absolute -bottom-6 -left-6 bg-surface-container-lowest p-6 rounded-md shadow-xl max-w-[240px] -rotate-3 border border-outline-variant/10">
                <div className="flex items-center gap-3 mb-2">
                  <span className="material-symbols-outlined text-tertiary">storefront</span>
                  <span className="text-[10px] font-bold uppercase tracking-widest font-label">
                    Partner Opportunity
                  </span>
                </div>
                <p className="font-headline font-bold text-primary">Your Business Here</p>
                <p className="text-xs text-secondary mt-1">
                  Join the Cotswold Way&apos;s first digital trail network and reach thousands of walkers.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Benefits */}
        <section className="px-6 max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 mb-24">
          {[
            {
              icon: "track_changes",
              title: "Targeted exposure",
              desc: "Reach adventurers exactly when they need you. Context-aware markers deliver your offer as they approach your location.",
              bg: "bg-surface-container-low",
              iconBg: "bg-primary-container",
            },
            {
              icon: "analytics",
              title: "Measurable impact",
              desc: "Every scan is a data point. Track conversions from the trail marker directly to your business in real-time.",
              bg: "bg-surface-container",
              iconBg: "bg-tertiary-container",
            },
            {
              icon: "diversity_3",
              title: "Community support",
              desc: "Build authentic loyalty by supporting local trail maintenance and conservation through your sponsorship.",
              bg: "bg-surface-container-high",
              iconBg: "bg-secondary-container",
            },
          ].map((card) => (
            <div key={card.title} className={`${card.bg} p-10 rounded-md flex flex-col gap-6`}>
              <div className={`w-14 h-14 rounded-full ${card.iconBg} flex items-center justify-center`}>
                <span className="material-symbols-outlined text-white text-3xl">
                  {card.icon}
                </span>
              </div>
              <h3 className="text-2xl font-headline font-bold text-primary">
                {card.title}
              </h3>
              <p className="text-secondary leading-relaxed">{card.desc}</p>
            </div>
          ))}
        </section>

        {/* Pricing */}
        <section className="px-6 max-w-7xl mx-auto mb-24">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-headline font-extrabold text-primary mb-4">
              Ready to join the trail?
            </h2>
            <p className="text-secondary">
              Flexible plans for local shops and national brands.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 max-w-4xl mx-auto">
            {/* Trail Starter */}
            <div className="bg-surface-container-lowest p-10 rounded-md shadow-ambient border border-outline-variant/10 relative group hover:border-primary transition-colors">
              <div className="mb-8">
                <h3 className="text-xl font-headline font-bold text-primary">
                  Trail Starter
                </h3>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold font-headline">£495</span>
                  <span className="text-secondary font-medium">/yr</span>
                </div>
              </div>
              <ul className="space-y-4 mb-10">
                {["1 Physical NFC/QR Marker", "Direct Link to Your Offer", "Basic Performance Stats"].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-sm">
                    <span className="material-symbols-outlined text-primary-container text-lg">check_circle</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="mailto:AronGijsel@gmail.com"
                className="block w-full py-4 rounded-full border border-primary text-primary font-bold text-center hover:bg-primary hover:text-on-primary transition-all"
              >
                Select Starter
              </Link>
            </div>

            {/* Trail Leader */}
            <div className="bg-primary p-10 rounded-md shadow-xl relative overflow-hidden text-on-primary">
              <div className="absolute -top-6 -right-6 w-24 h-24 bg-primary-container rounded-full opacity-50" />
              <div className="mb-8 relative z-10">
                <div className="inline-block bg-white/10 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest mb-4">
                  Most Popular
                </div>
                <h3 className="text-xl font-headline font-bold">Trail Leader</h3>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold font-headline">£1,295</span>
                  <span className="text-on-primary/70 font-medium">/yr</span>
                </div>
              </div>
              <ul className="space-y-4 mb-10 relative z-10">
                {["3 Physical NFC/QR Markers", "Location-Based Alerts", "Advanced Analytics & Heatmaps", "Priority Map Placement"].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-sm">
                    <span className="material-symbols-outlined text-primary-fixed text-lg">verified</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="mailto:AronGijsel@gmail.com"
                className="block w-full py-4 rounded-full bg-primary-fixed text-on-primary-fixed font-bold text-center shadow-lg active:scale-95 transition-all relative z-10"
              >
                Select Leader
              </Link>
            </div>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="bg-surface border-t border-outline-variant/20 pt-16 pb-24 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="col-span-1 md:col-span-2">
            <div className="text-2xl font-black text-primary tracking-tighter font-headline mb-6">
              TrailTap
            </div>
            <p className="text-secondary max-w-sm">
              Smart trail markers connecting walkers to local stories, hidden
              gems, and essential stops along the Cotswold Way.
            </p>
          </div>
          <div>
            <h4 className="font-bold text-primary mb-6">For Partners</h4>
            <ul className="space-y-4 text-sm text-secondary">
              <li><Link className="hover:text-primary" href="/sponsors">How it Works</Link></li>
              <li><Link className="hover:text-primary" href="mailto:AronGijsel@gmail.com">Contact</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-primary mb-6">App</h4>
            <ul className="space-y-4 text-sm text-secondary">
              <li><Link className="hover:text-primary" href="/trail">Explore the Trail</Link></li>
              <li><Link className="hover:text-primary" href="/m/CW01">Try a Marker</Link></li>
            </ul>
          </div>
        </div>
      </footer>

    </>
  );
}

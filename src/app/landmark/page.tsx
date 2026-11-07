export const dynamic = "force-dynamic";

import SupporterMarkerPage, { supporterMarkerMetadata } from "@/components/supporter/SupporterMarkerPage";

export const metadata = supporterMarkerMetadata("landmark");

export default function Page() {
  return <SupporterMarkerPage slug="landmark" />;
}

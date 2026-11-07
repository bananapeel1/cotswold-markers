export const dynamic = "force-dynamic";

import SupporterMarkerPage, { supporterMarkerMetadata } from "@/components/supporter/SupporterMarkerPage";

export const metadata = supporterMarkerMetadata("epicentre");

export default function Page() {
  return <SupporterMarkerPage slug="epicentre" />;
}

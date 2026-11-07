import SupporterBusinessPage, { supporterBusinessMetadata } from "@/components/supporter/SupporterBusinessPage";

export const metadata = supporterBusinessMetadata("landmark");

export default function Page() {
  return <SupporterBusinessPage slug="landmark" />;
}

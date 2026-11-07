import SupporterBusinessPage, { supporterBusinessMetadata } from "@/components/supporter/SupporterBusinessPage";

export const metadata = supporterBusinessMetadata("epicentre");

export default function Page() {
  return <SupporterBusinessPage slug="epicentre" />;
}

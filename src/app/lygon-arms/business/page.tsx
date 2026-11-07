import SupporterBusinessPage, { supporterBusinessMetadata } from "@/components/supporter/SupporterBusinessPage";

export const metadata = supporterBusinessMetadata("lygon-arms");

export default function Page() {
  return <SupporterBusinessPage slug="lygon-arms" />;
}

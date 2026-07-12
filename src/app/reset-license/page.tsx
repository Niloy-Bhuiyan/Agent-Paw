import type { Metadata } from "next";
import { ResetLicenseContent } from "./ResetLicenseContent";

export const metadata: Metadata = {
  title: "Reset license — Comnyang",
  description: "Detach your Comnyang license from all devices.",
};

export default function ResetLicensePage() {
  return <ResetLicenseContent />;
}

import type { Metadata } from "next";
import { ResetLicenseContent } from "./ResetLicenseContent";

export const metadata: Metadata = {
  title: "Reset license — AgentPaw",
  description: "Detach your AgentPaw license from all devices.",
};

export default function ResetLicensePage() {
  return <ResetLicenseContent />;
}

import type { Metadata } from "next";
import { DownloadContent } from "./DownloadContent";

export const metadata: Metadata = {
  title: "Download — AgentPaw",
  description: "Download AgentPaw for macOS and Windows.",
};

export default function DownloadPage() {
  return <DownloadContent />;
}

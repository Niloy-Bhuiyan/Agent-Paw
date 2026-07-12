import type { Metadata } from "next";
import { DownloadContent } from "./DownloadContent";

export const metadata: Metadata = {
  title: "Download — Comnyang",
  description: "Download Comnyang for macOS and Windows.",
};

export default function DownloadPage() {
  return <DownloadContent />;
}

import type { Metadata } from "next";
import { ShowcaseContent } from "./ShowcaseContent";

export const metadata: Metadata = {
  title: "Showcase — Comnyang",
  description: "Fur patterns the community has dressed their Comnyangs in.",
};

export default function ShowcasePage() {
  return <ShowcaseContent />;
}

import type { Metadata } from "next";
import { ShowcaseContent } from "./ShowcaseContent";

export const metadata: Metadata = {
  title: "Showcase — AgentPaw",
  description: "Fur patterns the community has dressed their AgentPaws in.",
};

export default function ShowcasePage() {
  return <ShowcaseContent />;
}

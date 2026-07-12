import { NextResponse } from "next/server";
import { listProviders } from "@/lib/ai/registry";

export const dynamic = "force-dynamic";

/** GET /api/providers — key-free provider status for the UI. */
export function GET() {
  return NextResponse.json({ providers: listProviders() });
}

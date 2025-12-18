import { NextResponse } from "next/server";
import { withAuth } from "@/lib/auth";
import { getAllBillingPlans } from "@/lib/partner";

// Enable edge runtime for ultra-low latency
export const runtime = "edge";

/**
 * GET /v1/installations/[installationId]/plans
 * Get available billing plans for this installation
 */
export const GET = withAuth(async () => {
	const plans = getAllBillingPlans();
	return NextResponse.json(plans);
});

import { NextRequest, NextResponse } from "next/server";
import { readRequestBodyWithSchema, withAuth } from "@/lib/auth";
import {
	getAllBillingPlans,
	getInstallation,
	installIntegration,
	uninstallInstallation,
} from "@/lib/partner";
import { installIntegrationRequestSchema } from "@/lib/schemas";

// Enable edge runtime for ultra-low latency
export const runtime = "edge";

/**
 * PUT /v1/installations/[installationId]
 * Called by Vercel when user installs the integration
 */
export const PUT = withAuth(async (claims, request) => {
	const body = await readRequestBodyWithSchema(
		request,
		installIntegrationRequestSchema,
	);

	if (!body.success) {
		return NextResponse.json(
			{ error: "Invalid request body" },
			{ status: 400 },
		);
	}

	console.log("[Install] installationId:", claims.installation_id);

	await installIntegration(claims.installation_id, {
		type: "marketplace",
		...body.data,
	});

	return new Response(null, { status: 201 });
});

/**
 * GET /v1/installations/[installationId]
 * Get installation details
 */
export const GET = withAuth(async (claims) => {
	const installation = await getInstallation(claims.installation_id);

	if (!installation || installation.deletedAt) {
		return NextResponse.json(
			{ error: "Installation not found" },
			{ status: 404 },
		);
	}

	const billingPlans = getAllBillingPlans();
	const billingPlan = billingPlans.plans.find(
		(plan) => plan.id === installation.billingPlanId,
	);

	return NextResponse.json({
		billingPlan: billingPlan
			? { ...billingPlan, scope: "installation" }
			: undefined,
	});
});

/**
 * DELETE /v1/installations/[installationId]
 * Called by Vercel when user uninstalls the integration
 */
export const DELETE = withAuth(async (claims) => {
	console.log("[Uninstall] installationId:", claims.installation_id);

	const response = await uninstallInstallation(claims.installation_id);

	if (!response) {
		return new Response(null, { status: 204 });
	}

	return NextResponse.json(response);
});

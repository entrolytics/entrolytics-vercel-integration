import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth";
import { getInstallation } from "@/lib/partner";
import { getAccountInfo, listProjects } from "@/lib/vercel-api";

// Enable edge runtime for ultra-low latency
export const runtime = "edge";

/**
 * GET /v1/integrations/configuration/[configurationId]
 * Get integration configuration details
 * Reference: https://vercel.com/docs/rest-api/vercel-api-integrations#integration-configuration
 */
export const GET = withAuth(async (claims) => {
	const installation = await getInstallation(claims.installation_id);

	if (!installation || installation.deletedAt) {
		return NextResponse.json(
			{ error: "Configuration not found" },
			{ status: 404 },
		);
	}

	try {
		// Get account information
		const accountInfo = await getAccountInfo(claims.installation_id);

		// Get projects list
		const projects = await listProjects(claims.installation_id);

		// Return configuration details
		return NextResponse.json({
			id: claims.installation_id,
			ownerId: claims.user_id,
			teamId: claims.team_id,
			type: installation.type,
			billingPlanId: installation.billingPlanId,
			createdAt: installation.createdAt,
			account: {
				id: accountInfo.id,
				name: accountInfo.name,
				email: accountInfo.email,
			},
			projects: projects.map((p) => ({
				id: p.id,
				name: p.name,
				framework: p.framework,
			})),
		});
	} catch (error) {
		console.error("[Configuration] Failed to get configuration:", error);
		return NextResponse.json(
			{ error: "Failed to load configuration" },
			{ status: 500 },
		);
	}
});

/**
 * PUT /v1/integrations/configuration/[configurationId]
 * Update integration configuration
 * Reference: https://vercel.com/docs/rest-api/vercel-api-integrations#integration-configuration
 */
export const PUT = withAuth(async (claims, request) => {
	const installation = await getInstallation(claims.installation_id);

	if (!installation || installation.deletedAt) {
		return NextResponse.json(
			{ error: "Configuration not found" },
			{ status: 404 },
		);
	}

	try {
		const body = await request.json();

		// Update configuration settings
		// In a full implementation, you might store these settings in KV
		console.log("[Configuration] Update request:", body);

		return NextResponse.json({
			id: claims.installation_id,
			updated: true,
			message: "Configuration updated successfully",
		});
	} catch (error) {
		console.error("[Configuration] Failed to update configuration:", error);
		return NextResponse.json(
			{ error: "Failed to update configuration" },
			{ status: 500 },
		);
	}
});

/**
 * DELETE /v1/integrations/configuration/[configurationId]
 * Remove integration configuration
 * Reference: https://vercel.com/docs/rest-api/vercel-api-integrations#integration-configuration
 */
export const DELETE = withAuth(async (claims) => {
	const { uninstallInstallation } = await import("@/lib/partner");

	console.log("[Configuration] Delete request for:", claims.installation_id);

	const response = await uninstallInstallation(claims.installation_id);

	if (!response) {
		return NextResponse.json(
			{ error: "Configuration not found" },
			{ status: 404 },
		);
	}

	return NextResponse.json({
		id: claims.installation_id,
		deleted: true,
		finalized: response.finalized,
	});
});

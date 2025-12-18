import { kv } from "@vercel/kv";
import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth";
import { getInstallation } from "@/lib/partner";
import { getAccountInfo } from "@/lib/vercel-api";

// Enable edge runtime for ultra-low latency
export const runtime = "edge";

/**
 * GET /v1/integrations/configurations
 * List all integration configurations for the authenticated user/team
 * Reference: https://vercel.com/docs/rest-api/vercel-api-integrations#integration-configuration
 */
export const GET = withAuth(async (claims) => {
	try {
		// Get all installation IDs
		const installationIds = await kv.lrange<string>("installations", 0, -1);

		const configurations = [];

		for (const installationId of installationIds) {
			const installation = await getInstallation(installationId);

			// Skip deleted installations
			if (!installation || installation.deletedAt) {
				continue;
			}

			// Filter by user/team - check if installation belongs to this user/team
			const installationUserId = installation.credentials?.user_id;
			const installationTeamId = installation.credentials?.team_id;

			if (
				installationUserId !== claims.user_id &&
				installationTeamId !== claims.team_id
			) {
				continue;
			}

			try {
				const accountInfo = await getAccountInfo(installationId);

				configurations.push({
					id: installationId,
					ownerId: installationUserId,
					teamId: installationTeamId,
					type: installation.type,
					billingPlanId: installation.billingPlanId,
					account: {
						id: accountInfo.id,
						name: accountInfo.name,
					},
				});
			} catch (error) {
				console.error(
					`[Configurations] Failed to get account info for ${installationId}:`,
					error,
				);
			}
		}

		return NextResponse.json({
			configurations,
			total: configurations.length,
		});
	} catch (error) {
		console.error("[Configurations] Failed to list configurations:", error);
		return NextResponse.json(
			{ error: "Failed to list configurations" },
			{ status: 500 },
		);
	}
});

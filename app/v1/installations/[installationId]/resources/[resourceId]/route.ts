import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth";
import { deleteResource, getResource } from "@/lib/partner";

// Enable edge runtime for ultra-low latency
export const runtime = "edge";

/**
 * GET /v1/installations/[installationId]/resources/[resourceId]
 * Get a specific resource (website)
 */
export const GET = withAuth(async (claims, request) => {
	const url = new URL(request.url);
	const resourceId = url.pathname.split("/").pop();

	if (!resourceId) {
		return NextResponse.json(
			{ error: "Resource ID required" },
			{ status: 400 },
		);
	}

	const resource = await getResource(claims.installation_id, resourceId);

	if (!resource) {
		return NextResponse.json({ error: "Resource not found" }, { status: 404 });
	}

	return NextResponse.json(resource);
});

/**
 * DELETE /v1/installations/[installationId]/resources/[resourceId]
 * Delete a resource (website)
 */
export const DELETE = withAuth(async (claims, request) => {
	const url = new URL(request.url);
	const resourceId = url.pathname.split("/").pop();

	if (!resourceId) {
		return NextResponse.json(
			{ error: "Resource ID required" },
			{ status: 400 },
		);
	}

	console.log(
		"[Delete Resource] installationId:",
		claims.installation_id,
		"resourceId:",
		resourceId,
	);

	await deleteResource(claims.installation_id, resourceId);

	return new Response(null, { status: 204 });
});

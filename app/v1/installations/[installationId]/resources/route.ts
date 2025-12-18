import { NextRequest, NextResponse } from "next/server";
import { readRequestBodyWithSchema, withAuth } from "@/lib/auth";
import { listResources, provisionResource } from "@/lib/partner";
import { provisionResourceRequestSchema } from "@/lib/schemas";

// Enable edge runtime for ultra-low latency
export const runtime = "edge";

/**
 * GET /v1/installations/[installationId]/resources
 * List all resources (websites) for this installation
 */
export const GET = withAuth(async (claims, request) => {
	const url = new URL(request.url);
	const resourceIds = url.searchParams.get("resourceIds")?.split(",");

	const resources = await listResources(claims.installation_id);

	// If specific resourceIds requested, filter
	if (resourceIds?.length) {
		return NextResponse.json({
			resources: resources.resources.filter((r) => resourceIds.includes(r.id)),
		});
	}

	return NextResponse.json(resources);
});

/**
 * POST /v1/installations/[installationId]/resources
 * Create a new resource (Entrolytics website)
 */
export const POST = withAuth(async (claims, request) => {
	const body = await readRequestBodyWithSchema(
		request,
		provisionResourceRequestSchema,
	);

	if (!body.success) {
		return NextResponse.json(
			{ error: "Invalid request body" },
			{ status: 400 },
		);
	}

	console.log(
		"[Provision] installationId:",
		claims.installation_id,
		"body:",
		body.data,
	);

	const resource = await provisionResource(claims.installation_id, body.data);

	return NextResponse.json(resource, { status: 201 });
});

import { kv } from "@vercel/kv";
import { nanoid } from "nanoid";
import { env } from "./env";
import type {
	BillingPlan,
	InstallIntegrationRequest,
	ProvisionResourceRequest,
	Resource,
} from "./schemas";

// Entrolytics billing plans
const billingPlans: BillingPlan[] = [
	{
		id: "free",
		scope: "resource",
		name: "Free",
		cost: "Free",
		description: "Basic analytics for personal projects",
		type: "subscription",
		paymentMethodRequired: false,
		details: [
			{ label: "Page views", value: "10,000/month" },
			{ label: "Data retention", value: "3 months" },
		],
		highlightedDetails: [
			{ label: "Websites", value: "1" },
			{ label: "Real-time", value: "Yes" },
		],
		maxResources: 1,
		effectiveDate: "2024-01-01T00:00:00Z",
	},
	{
		id: "pro",
		scope: "resource",
		name: "Pro",
		cost: "$9/month",
		description: "Advanced analytics for growing projects",
		type: "subscription",
		paymentMethodRequired: true,
		details: [
			{ label: "Page views", value: "100,000/month" },
			{ label: "Data retention", value: "12 months" },
			{ label: "Custom events", value: "Unlimited" },
		],
		highlightedDetails: [
			{ label: "Websites", value: "10" },
			{ label: "Real-time", value: "Yes" },
		],
		effectiveDate: "2024-01-01T00:00:00Z",
	},
];

const billingPlanMap = new Map(billingPlans.map((plan) => [plan.id, plan]));

export type Installation = InstallIntegrationRequest & {
	type: "marketplace" | "external";
	billingPlanId: string;
	deletedAt?: number;
};

/**
 * Install integration - called when user adds the integration
 */
export async function installIntegration(
	installationId: string,
	request: InstallIntegrationRequest & { type: "marketplace" | "external" },
): Promise<void> {
	const installation: Installation = {
		...request,
		billingPlanId: request.billingPlanId || "free",
	};

	const pipeline = kv.pipeline();
	pipeline.set(installationId, installation);
	pipeline.lrem("installations", 0, installationId);
	pipeline.lpush("installations", installationId);
	await pipeline.exec();
}

/**
 * Uninstall integration
 */
export async function uninstallInstallation(
	installationId: string,
): Promise<{ finalized: boolean } | undefined> {
	const installation = await getInstallation(installationId);

	if (!installation || installation.deletedAt) {
		return undefined;
	}

	// Clean up access token
	try {
		const { deleteAccessToken } = await import("./vercel-api");
		await deleteAccessToken(installationId);
		console.log(
			"[Uninstall] Access token deleted for installation:",
			installationId,
		);
	} catch (error) {
		console.error("[Uninstall] Failed to delete access token:", error);
	}

	const pipeline = kv.pipeline();
	pipeline.set(installationId, {
		...installation,
		deletedAt: Date.now(),
	});
	pipeline.lrem("installations", 0, installationId);
	await pipeline.exec();

	const billingPlan = billingPlanMap.get(installation.billingPlanId);
	return { finalized: billingPlan?.paymentMethodRequired === false };
}

/**
 * Get installation by ID
 */
export async function getInstallation(
	installationId: string,
): Promise<Installation | null> {
	return kv.get<Installation>(installationId);
}

/**
 * Provision a resource (Entrolytics website)
 */
export async function provisionResource(
	installationId: string,
	request: ProvisionResourceRequest,
): Promise<Resource & { secrets: Array<{ name: string; value: string }> }> {
	const billingPlan = billingPlanMap.get(request.billingPlanId);
	if (!billingPlan) {
		throw new Error(`Unknown billing plan ${request.billingPlanId}`);
	}

	// Create website in Entrolytics
	const websiteId = await createEntrolyticsWebsite(
		installationId,
		request.name,
		request.metadata?.domain,
	);

	const resource: Resource = {
		id: nanoid(),
		status: "ready",
		name: request.name,
		productId: request.productId,
		billingPlan,
		metadata: {
			...request.metadata,
			websiteId,
			projectId: request.metadata?.projectId, // Store project ID for later reference
		},
	};

	await kv.set(`${installationId}:resource:${resource.id}`, resource);
	await kv.lpush(`${installationId}:resources`, resource.id);

	// If projectId is provided, inject environment variables using Vercel API
	if (request.metadata?.projectId) {
		try {
			const { upsertEnvironmentVariables } = await import("./vercel-api");
			await upsertEnvironmentVariables(
				installationId,
				request.metadata.projectId as string,
				[
					{
						key: "NEXT_PUBLIC_ENTROLYTICS_NG_WEBSITE_ID",
						value: websiteId,
						target: ["production", "preview", "development"],
					},
					{
						key: "NEXT_PUBLIC_ENTROLYTICS_HOST",
						value: env.ENTROLYTICS_API_URL,
						target: ["production", "preview", "development"],
					},
					{
						key: "NEXT_PUBLIC_ENTROLYTICS_ENDPOINT",
						value: "/api/send-native",
						target: ["production", "preview", "development"],
					},
				],
			);
			console.log(
				"[Resource] Environment variables injected for project:",
				request.metadata.projectId,
			);
		} catch (error) {
			console.error(
				"[Resource] Failed to inject environment variables:",
				error,
			);
			// Don't fail the entire resource creation if env var injection fails
		}
	}

	return {
		...resource,
		secrets: [
			{
				name: "NEXT_PUBLIC_ENTROLYTICS_NG_WEBSITE_ID",
				value: websiteId,
			},
			{
				name: "NEXT_PUBLIC_ENTROLYTICS_HOST",
				value: env.ENTROLYTICS_API_URL,
			},
			{
				name: "NEXT_PUBLIC_ENTROLYTICS_ENDPOINT",
				value: "/api/send-native",
			},
		],
	};
}

/**
 * Delete a resource
 */
export async function deleteResource(
	installationId: string,
	resourceId: string,
): Promise<void> {
	// Get resource first to access projectId
	const resource = await getResource(installationId, resourceId);

	// Delete environment variables if projectId exists
	if (resource?.metadata?.projectId) {
		try {
			const { deleteEnvironmentVariables } = await import("./vercel-api");
			await deleteEnvironmentVariables(
				installationId,
				resource.metadata.projectId as string,
				[
					"NEXT_PUBLIC_ENTROLYTICS_NG_WEBSITE_ID",
					"NEXT_PUBLIC_ENTROLYTICS_HOST",
					"NEXT_PUBLIC_ENTROLYTICS_ENDPOINT",
				],
			);
			console.log(
				"[Resource] Environment variables removed for project:",
				resource.metadata.projectId,
			);
		} catch (error) {
			console.error(
				"[Resource] Failed to remove environment variables:",
				error,
			);
		}
	}

	const pipeline = kv.pipeline();
	pipeline.del(`${installationId}:resource:${resourceId}`);
	pipeline.lrem(`${installationId}:resources`, 0, resourceId);
	await pipeline.exec();
}

/**
 * List resources for an installation
 */
export async function listResources(
	installationId: string,
): Promise<{ resources: Resource[] }> {
	const resourceIds = await kv.lrange<string>(
		`${installationId}:resources`,
		0,
		-1,
	);

	if (resourceIds.length === 0) {
		return { resources: [] };
	}

	const pipeline = kv.pipeline();
	for (const resourceId of resourceIds) {
		pipeline.get(`${installationId}:resource:${resourceId}`);
	}

	const resources = await pipeline.exec<(Resource | null)[]>();
	return {
		resources: resources.filter((r): r is Resource => r !== null),
	};
}

/**
 * Get single resource
 */
export async function getResource(
	installationId: string,
	resourceId: string,
): Promise<Resource | null> {
	return kv.get<Resource>(`${installationId}:resource:${resourceId}`);
}

/**
 * Get all billing plans
 */
export function getAllBillingPlans(): { plans: BillingPlan[] } {
	return { plans: billingPlans };
}

/**
 * Store webhook event for debugging
 */
export async function storeWebhookEvent(event: unknown): Promise<void> {
	const pipeline = kv.pipeline();
	pipeline.lpush("webhook_events", event);
	pipeline.ltrim("webhook_events", 0, 100);
	await pipeline.exec();
}

/**
 * Get installation config for deployment tracking
 * Returns the website ID and API credentials for a given project
 */
export async function getInstallationConfig(
	projectId?: string,
): Promise<{ websiteId: string; apiKey: string; host: string } | null> {
	if (!projectId) {
		return null;
	}

	// Try to find installation by project ID
	const installationIds = await kv.lrange<string>("installations", 0, -1);

	for (const installationId of installationIds) {
		const resources = await listResources(installationId);
		for (const resource of resources.resources) {
			// Check if this resource is associated with the project
			if (resource.metadata?.projectId === projectId) {
				return {
					websiteId: resource.metadata.websiteId as string,
					apiKey: env.ENTROLYTICS_INTEGRATION_SECRET,
					host: env.ENTROLYTICS_API_URL,
				};
			}
		}
	}

	return null;
}

/**
 * Create a website in Entrolytics backend
 */
async function createEntrolyticsWebsite(
	installationId: string,
	name: string,
	domain?: string,
): Promise<string> {
	try {
		const response = await fetch(`${env.ENTROLYTICS_API_URL}/api/websites`, {
			method: "POST",
			headers: {
				Authorization: `Bearer ${env.ENTROLYTICS_INTEGRATION_SECRET}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				name,
				domain: domain || name,
				shareId: null,
			}),
		});

		if (!response.ok) {
			const errorText = await response.text();
			console.error(
				`Failed to create Entrolytics website: ${response.status} ${errorText}`,
			);
			// Fall back to generating a local ID if API fails
			return nanoid();
		}

		const data = (await response.json()) as { id: string; websiteId: string };
		return data.websiteId || data.id;
	} catch (error) {
		console.error("Error creating Entrolytics website:", error);
		// Fall back to generating a local ID if API call fails
		return nanoid();
	}
}

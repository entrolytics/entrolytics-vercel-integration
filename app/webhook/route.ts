import { type NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/env";
import {
	getInstallationConfig,
	storeWebhookEvent,
	uninstallInstallation,
} from "@/lib/partner";
import {
	unknownWebhookEventSchema,
	type WebhookEvent,
	webhookEventSchema,
} from "@/lib/schemas";

// Enable edge runtime for ultra-low latency
export const runtime = "edge";
export const dynamic = "force-dynamic";

/**
 * POST /webhook
 * Handle Vercel webhook events
 */
export async function POST(request: NextRequest): Promise<Response> {
	const rawBody = await request.text();
	const bodySignature = await sha1(rawBody, env.INTEGRATION_CLIENT_SECRET);

	// Verify webhook signature
	if (bodySignature !== request.headers.get("x-vercel-signature")) {
		console.error("[Webhook] Invalid signature");
		return NextResponse.json(
			{ error: "invalid_signature", message: "Signature didn't match" },
			{ status: 401 },
		);
	}

	let json: unknown;
	try {
		json = JSON.parse(rawBody);
	} catch (e) {
		console.error("[Webhook] Failed to parse JSON:", e);
		return new Response("", { status: 200 });
	}

	// Try to parse as known event type
	let event: WebhookEvent | undefined;
	try {
		event = webhookEventSchema.parse(json);
	} catch (e) {
		console.log("[Webhook] Unknown event type:", json);
	}

	// Store event for debugging (even if unknown)
	if (!event) {
		try {
			await storeWebhookEvent(unknownWebhookEventSchema.parse(json));
		} catch (e) {
			console.error("[Webhook] Failed to store unknown event:", e);
		}
		return new Response("", { status: 200 });
	}

	const { id, type, createdAt, payload } = event;
	console.log("[Webhook] Event:", id, type, new Date(createdAt));

	await storeWebhookEvent(event);

	// Handle known event types
	switch (type) {
		case "integration-configuration.removed": {
			// User removed the integration
			await uninstallInstallation(payload.configuration.id);
			break;
		}

		case "project.created": {
			// New project created - could auto-inject env vars if we have a default resource
			console.log(
				"[Webhook] Project created:",
				payload.project?.id,
				payload.project?.name,
			);
			// Note: In a production integration, you might want to automatically
			// provision a resource and inject env vars for new projects
			break;
		}

		case "project.removed": {
			// Project deleted - clean up associated resources
			console.log("[Webhook] Project removed:", payload.project?.id);
			// Could clean up resources associated with this project
			break;
		}

		case "deployment.created": {
			// Track deployment to entrolytics-ng
			console.log("[Webhook] Deployment created:", payload.deployment.id);
			await trackDeployment(payload);
			break;
		}

		case "deployment.succeeded": {
			// Update deployment status on success
			console.log("[Webhook] Deployment succeeded:", payload.deployment.id);
			break;
		}

		case "integration-configuration.scope-change-confirmed": {
			// User confirmed scope changes
			console.log(
				"[Webhook] Scope changes confirmed:",
				payload.configuration?.id,
			);
			// The integration now has access to the new scopes
			break;
		}
	}

	return new Response("", { status: 200 });
}

/**
 * Track deployment to entrolytics-ng
 * Phase 2: Deployment Tracking
 */
async function trackDeployment(payload: {
	deployment: {
		id: string;
		name?: string;
		url?: string;
		meta?: {
			githubCommitSha?: string;
			githubCommitRef?: string;
		};
	};
	project?: {
		id: string;
		name?: string;
	};
}): Promise<void> {
	try {
		// Get installation config to find website ID and API key
		const config = await getInstallationConfig(payload.project?.id);
		if (!config?.websiteId || !config?.apiKey) {
			console.log(
				"[Webhook] No website ID or API key configured for project:",
				payload.project?.id,
			);
			return;
		}

		const entrolyticsHost = config.host || "https://ng.entrolytics.click";
		const deploymentPayload = {
			website: config.websiteId,
			deployId: payload.deployment.id,
			gitSha: payload.deployment.meta?.githubCommitSha,
			gitBranch: payload.deployment.meta?.githubCommitRef,
			deployUrl: payload.deployment.url
				? `https://${payload.deployment.url}`
				: undefined,
			source: "vercel",
		};

		const response = await fetch(
			`${entrolyticsHost}/api/websites/${config.websiteId}/deployments`,
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${config.apiKey}`,
				},
				body: JSON.stringify(deploymentPayload),
			},
		);

		if (response.ok) {
			console.log(
				"[Webhook] Deployment tracked to entrolytics-ng:",
				payload.deployment.id,
			);
		} else {
			console.error(
				"[Webhook] Failed to track deployment:",
				await response.text(),
			);
		}
	} catch (error) {
		console.error("[Webhook] Error tracking deployment:", error);
	}
}

/**
 * Edge-compatible SHA1 HMAC using Web Crypto API
 */
async function sha1(data: string, secret: string): Promise<string> {
	const encoder = new TextEncoder();
	const keyData = encoder.encode(secret);
	const messageData = encoder.encode(data);

	// Import the key for HMAC
	const key = await crypto.subtle.importKey(
		"raw",
		keyData,
		{ name: "HMAC", hash: "SHA-1" },
		false,
		["sign"],
	);

	// Sign the message
	const signature = await crypto.subtle.sign("HMAC", key, messageData);

	// Convert ArrayBuffer to hex string
	return Array.from(new Uint8Array(signature))
		.map((b) => b.toString(16).padStart(2, "0"))
		.join("");
}

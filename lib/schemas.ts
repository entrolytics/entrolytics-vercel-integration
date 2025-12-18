import { z } from "zod";

// Billing plan types
export const billingPlanSchema = z.object({
	id: z.string(),
	scope: z.enum(["resource", "installation"]),
	name: z.string(),
	cost: z.string(),
	description: z.string(),
	type: z.enum(["subscription", "prepayment"]),
	paymentMethodRequired: z.boolean(),
	details: z
		.array(
			z.object({
				label: z.string(),
				value: z.string().optional(),
			}),
		)
		.optional(),
	highlightedDetails: z
		.array(
			z.object({
				label: z.string(),
				value: z.string().optional(),
			}),
		)
		.optional(),
	maxResources: z.number().optional(),
	effectiveDate: z.string().optional(),
});

export type BillingPlan = z.infer<typeof billingPlanSchema>;

// Installation request
export const installIntegrationRequestSchema = z.object({
	credentials: z.object({
		access_token: z.string(),
		refresh_token: z.string().optional(),
		token_type: z.string(),
		installation_id: z.string().optional(),
		user_id: z.string().optional(),
		team_id: z.string().nullable().optional(),
	}),
	acceptedPolicies: z
		.array(
			z.object({
				id: z.string(),
				acceptedAt: z.string(),
			}),
		)
		.optional(),
	billingPlanId: z.string().optional(),
});

export type InstallIntegrationRequest = z.infer<
	typeof installIntegrationRequestSchema
>;

// Resource types
export const resourceMetadataSchema = z.object({
	websiteId: z.string().optional(),
	domain: z.string().optional(),
});

export const provisionResourceRequestSchema = z.object({
	productId: z.string(),
	name: z.string(),
	metadata: resourceMetadataSchema.optional(),
	billingPlanId: z.string(),
});

export type ProvisionResourceRequest = z.infer<
	typeof provisionResourceRequestSchema
>;

export const resourceSchema = z.object({
	id: z.string(),
	status: z.enum(["ready", "pending", "error", "suspended"]),
	name: z.string(),
	productId: z.string(),
	billingPlan: billingPlanSchema,
	metadata: resourceMetadataSchema.optional(),
	notification: z
		.object({
			level: z.enum(["info", "warning", "error"]),
			message: z.string(),
			action: z
				.object({
					label: z.string(),
					url: z.string(),
				})
				.optional(),
		})
		.optional(),
});

export type Resource = z.infer<typeof resourceSchema>;

// Webhook events
export const webhookEventSchema = z.discriminatedUnion("type", [
	z.object({
		id: z.string(),
		type: z.literal("integration-configuration.removed"),
		createdAt: z.number(),
		payload: z.object({
			configuration: z.object({ id: z.string() }),
		}),
	}),
	z.object({
		id: z.string(),
		type: z.literal("deployment.created"),
		createdAt: z.number(),
		payload: z.object({
			deployment: z.object({ id: z.string() }),
			installationIds: z.array(z.string()).optional(),
		}),
	}),
]);

export type WebhookEvent = z.infer<typeof webhookEventSchema>;

export const unknownWebhookEventSchema = z.object({
	id: z.string(),
	type: z.string(),
	createdAt: z.number(),
	payload: z.unknown(),
});

export type UnknownWebhookEvent = z.infer<typeof unknownWebhookEventSchema>;

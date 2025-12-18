/**
 * Vercel API Client
 * Handles API calls to Vercel REST API with proper authentication and team support
 * Reference: https://vercel.com/docs/rest-api
 */

import { kv } from "@vercel/kv";

export interface VercelTokenData {
	access_token: string;
	installation_id: string;
	user_id: string;
	team_id: string | null;
}

export interface EnvironmentVariable {
	key: string;
	value: string;
	type: "encrypted" | "plain" | "secret" | "system";
	target: ("production" | "preview" | "development")[];
	gitBranch?: string;
}

/**
 * Store access token from OAuth callback
 */
export async function storeAccessToken(
	installationId: string,
	tokenData: VercelTokenData,
): Promise<void> {
	await kv.set(`token:${installationId}`, tokenData);
}

/**
 * Get access token for an installation
 */
export async function getAccessToken(
	installationId: string,
): Promise<VercelTokenData | null> {
	return kv.get<VercelTokenData>(`token:${installationId}`);
}

/**
 * Delete access token (on uninstall)
 */
export async function deleteAccessToken(installationId: string): Promise<void> {
	await kv.del(`token:${installationId}`);
}

/**
 * Create or update environment variables for a project
 * Reference: https://vercel.com/docs/rest-api/reference/endpoints/projects/create-one-or-more-environment-variables
 */
export async function upsertEnvironmentVariables(
	installationId: string,
	projectId: string,
	variables: Omit<EnvironmentVariable, "type">[],
): Promise<{ created: number; updated: number }> {
	const tokenData = await getAccessToken(installationId);

	if (!tokenData) {
		throw new Error("No access token found for installation");
	}

	const url = new URL(`https://api.vercel.com/v10/projects/${projectId}/env`);
	if (tokenData.team_id) {
		url.searchParams.set("teamId", tokenData.team_id);
	}

	// Transform variables to include type and proper format
	const envVars = variables.map((v) => ({
		...v,
		type: "encrypted" as const,
	}));

	const response = await fetch(url.toString(), {
		method: "POST",
		headers: {
			Authorization: `Bearer ${tokenData.access_token}`,
			"Content-Type": "application/json",
		},
		body: JSON.stringify(envVars),
	});

	if (!response.ok) {
		const error = await response.text();
		console.error("[Vercel API] Failed to create env vars:", error);
		throw new Error(
			`Failed to create environment variables: ${response.status}`,
		);
	}

	const data = await response.json();
	return {
		created: data.created?.length || 0,
		updated: data.updated?.length || 0,
	};
}

/**
 * Delete environment variables for a project
 * Reference: https://vercel.com/docs/rest-api/reference/endpoints/projects/delete-environment-variable
 */
export async function deleteEnvironmentVariables(
	installationId: string,
	projectId: string,
	keys: string[],
): Promise<void> {
	const tokenData = await getAccessToken(installationId);

	if (!tokenData) {
		throw new Error("No access token found for installation");
	}

	// Get all env vars first to find IDs
	const envVars = await listEnvironmentVariables(installationId, projectId);

	// Filter to find the ones we want to delete
	const varsToDelete = envVars.filter((v) => keys.includes(v.key));

	for (const envVar of varsToDelete) {
		const url = new URL(
			`https://api.vercel.com/v9/projects/${projectId}/env/${envVar.id}`,
		);
		if (tokenData.team_id) {
			url.searchParams.set("teamId", tokenData.team_id);
		}

		await fetch(url.toString(), {
			method: "DELETE",
			headers: {
				Authorization: `Bearer ${tokenData.access_token}`,
			},
		});
	}
}

/**
 * List environment variables for a project
 * Reference: https://vercel.com/docs/rest-api/reference/endpoints/projects/get-environment-variables
 */
export async function listEnvironmentVariables(
	installationId: string,
	projectId: string,
): Promise<Array<{ id: string; key: string; value: string }>> {
	const tokenData = await getAccessToken(installationId);

	if (!tokenData) {
		throw new Error("No access token found for installation");
	}

	const url = new URL(`https://api.vercel.com/v9/projects/${projectId}/env`);
	if (tokenData.team_id) {
		url.searchParams.set("teamId", tokenData.team_id);
	}

	const response = await fetch(url.toString(), {
		method: "GET",
		headers: {
			Authorization: `Bearer ${tokenData.access_token}`,
		},
	});

	if (!response.ok) {
		const error = await response.text();
		console.error("[Vercel API] Failed to list env vars:", error);
		return [];
	}

	const data = await response.json();
	return data.envs || [];
}

/**
 * Get list of projects for the installation
 * Reference: https://vercel.com/docs/rest-api/reference/endpoints/projects/get-projects
 */
export async function listProjects(installationId: string): Promise<
	Array<{
		id: string;
		name: string;
		framework: string | null;
		link?: {
			type: string;
			repo: string;
		};
	}>
> {
	const tokenData = await getAccessToken(installationId);

	if (!tokenData) {
		throw new Error("No access token found for installation");
	}

	const url = new URL("https://api.vercel.com/v9/projects");
	if (tokenData.team_id) {
		url.searchParams.set("teamId", tokenData.team_id);
	}

	const response = await fetch(url.toString(), {
		method: "GET",
		headers: {
			Authorization: `Bearer ${tokenData.access_token}`,
		},
	});

	if (!response.ok) {
		const error = await response.text();
		console.error("[Vercel API] Failed to list projects:", error);
		return [];
	}

	const data = await response.json();
	return data.projects || [];
}

/**
 * Get user or team information
 * Reference: https://vercel.com/docs/rest-api/reference/endpoints/user
 */
export async function getAccountInfo(installationId: string): Promise<{
	id: string;
	email?: string;
	name?: string;
	username?: string;
}> {
	const tokenData = await getAccessToken(installationId);

	if (!tokenData) {
		throw new Error("No access token found for installation");
	}

	// If team installation, get team info
	if (tokenData.team_id) {
		const response = await fetch(
			`https://api.vercel.com/v2/teams/${tokenData.team_id}`,
			{
				headers: {
					Authorization: `Bearer ${tokenData.access_token}`,
				},
			},
		);

		if (response.ok) {
			return response.json();
		}
	}

	// Otherwise get user info
	const response = await fetch("https://api.vercel.com/v2/user", {
		headers: {
			Authorization: `Bearer ${tokenData.access_token}`,
		},
	});

	if (!response.ok) {
		throw new Error("Failed to get account info");
	}

	return response.json();
}

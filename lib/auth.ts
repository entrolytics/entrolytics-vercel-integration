import * as jose from "jose";
import { type NextRequest, NextResponse } from "next/server";
import { env } from "./env";

interface Claims {
	installation_id: string;
	user_id?: string;
	team_id?: string;
	iat: number;
	iss: string;
}

/**
 * Verify JWT token from Vercel API requests
 */
async function verifyToken(token: string): Promise<Claims> {
	const secret = new TextEncoder().encode(env.INTEGRATION_CLIENT_SECRET);

	const { payload } = await jose.jwtVerify(token, secret, {
		issuer: "https://vercel.com",
	});

	return payload as unknown as Claims;
}

/**
 * Higher-order function to wrap API routes with JWT auth
 */
export function withAuth(
	handler: (claims: Claims, request: NextRequest) => Promise<Response>,
) {
	return async (request: NextRequest): Promise<Response> => {
		const authHeader = request.headers.get("Authorization");

		if (!authHeader?.startsWith("Bearer ")) {
			return NextResponse.json(
				{ error: "Missing or invalid Authorization header" },
				{ status: 401 },
			);
		}

		const token = authHeader.slice(7);

		try {
			const claims = await verifyToken(token);
			return handler(claims, request);
		} catch (error) {
			console.error("Auth error:", error);
			return NextResponse.json({ error: "Invalid token" }, { status: 401 });
		}
	};
}

/**
 * Read and parse request body with Zod schema
 */
export async function readRequestBodyWithSchema<T>(
	request: NextRequest,
	schema: {
		safeParse: (data: unknown) => {
			success: boolean;
			data?: T;
			error?: unknown;
		};
	},
): Promise<{ success: true; data: T } | { success: false; error: unknown }> {
	try {
		const body = await request.json();
		const result = schema.safeParse(body);

		if (result.success) {
			return { success: true, data: result.data as T };
		}

		return { success: false, error: result.error };
	} catch (error) {
		return { success: false, error };
	}
}

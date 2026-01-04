"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

interface Resource {
	id: string;
	name: string;
	status: string;
	metadata?: {
		websiteId?: string;
		projectId?: string;
		domain?: string;
	};
}

interface Project {
	id: string;
	name: string;
	framework: string | null;
}

interface Installation {
	billingPlan?: {
		id: string;
		name: string;
		cost: string;
	};
}

export default function DashboardPage() {
	const searchParams = useSearchParams();
	const configurationId = searchParams.get("configurationId");
	const [resources, setResources] = useState<Resource[]>([]);
	const [projects, setProjects] = useState<Project[]>([]);
	const [installation, setInstallation] = useState<Installation | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [showCreateForm, setShowCreateForm] = useState(false);

	useEffect(() => {
		if (configurationId) {
			loadDashboardData();
		}
	}, [configurationId]);

	const loadDashboardData = async () => {
		try {
			setLoading(true);
			// Note: In production, these would be authenticated API calls
			// For now, showing UI structure
			setLoading(false);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to load data");
			setLoading(false);
		}
	};

	return (
		<div className="min-h-screen bg-gray-50">
			<div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
				{/* Header */}
				<div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-4">
							<div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
								<svg
									className="w-6 h-6 text-white"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
									/>
								</svg>
							</div>
							<div>
								<h1 className="text-2xl font-bold text-gray-900">
									Entrolytics Dashboard
								</h1>
								<p className="text-sm text-gray-500">
									Manage your analytics resources
								</p>
							</div>
						</div>
						<div className="flex gap-3">
							<a
								href="https://entrolytics.click"
								target="_blank"
								rel="noopener noreferrer"
								className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
							>
								View Analytics
							</a>
							<a
								href="https://docs.entrolytics.click"
								target="_blank"
								rel="noopener noreferrer"
								className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
							>
								Documentation
							</a>
						</div>
					</div>
				</div>

				{/* Status Banner */}
				<div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
					<div className="flex items-center gap-2">
						<svg
							className="w-5 h-5 text-green-600"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M5 13l4 4L19 7"
							/>
						</svg>
						<span className="font-medium text-green-800">
							Integration Active
						</span>
					</div>
					<p className="mt-2 text-sm text-green-700">
						Your Vercel account is connected to Entrolytics. Create resources to
						start tracking analytics for your projects.
					</p>
				</div>

				<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
					{/* Main Content */}
					<div className="lg:col-span-2 space-y-6">
						{/* Resources Section */}
						<div className="bg-white rounded-lg shadow-sm border">
							<div className="p-6 border-b flex items-center justify-between">
								<div>
									<h2 className="text-lg font-semibold text-gray-900">
										Analytics Resources
									</h2>
									<p className="text-sm text-gray-500 mt-1">
										Manage your website tracking configurations
									</p>
								</div>
								<button
									onClick={() => setShowCreateForm(!showCreateForm)}
									className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
								>
									+ Create Resource
								</button>
							</div>

							<div className="p-6">
								{showCreateForm && (
									<div className="mb-6 p-4 bg-gray-50 rounded-lg border">
										<h3 className="font-medium text-gray-900 mb-4">
											Create New Resource
										</h3>
										<form className="space-y-4">
											<div>
												<label className="block text-sm font-medium text-gray-700 mb-1">
													Resource Name
												</label>
												<input
													type="text"
													placeholder="My Website Analytics"
													className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
												/>
											</div>
											<div>
												<label className="block text-sm font-medium text-gray-700 mb-1">
													Select Project
												</label>
												<select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
													<option>Select a Vercel project...</option>
												</select>
											</div>
											<div>
												<label className="block text-sm font-medium text-gray-700 mb-1">
													Domain (optional)
												</label>
												<input
													type="text"
													placeholder="example.com"
													className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
												/>
											</div>
											<div className="flex gap-3">
												<button
													type="submit"
													className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
												>
													Create Resource
												</button>
												<button
													type="button"
													onClick={() => setShowCreateForm(false)}
													className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
												>
													Cancel
												</button>
											</div>
										</form>
									</div>
								)}

								{resources.length === 0 ? (
									<div className="text-center py-12">
										<svg
											className="mx-auto h-12 w-12 text-gray-400"
											fill="none"
											viewBox="0 0 24 24"
											stroke="currentColor"
										>
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												strokeWidth={2}
												d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
											/>
										</svg>
										<h3 className="mt-2 text-sm font-medium text-gray-900">
											No resources
										</h3>
										<p className="mt-1 text-sm text-gray-500">
											Get started by creating a new analytics resource.
										</p>
										<div className="mt-6">
											<button
												onClick={() => setShowCreateForm(true)}
												className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
											>
												+ Create Resource
											</button>
										</div>
									</div>
								) : (
									<div className="space-y-4">
										{resources.map((resource) => (
											<div
												key={resource.id}
												className="border rounded-lg p-4 hover:border-blue-300 transition-colors"
											>
												<div className="flex items-start justify-between">
													<div className="flex-1">
														<h3 className="font-medium text-gray-900">
															{resource.name}
														</h3>
														<p className="text-sm text-gray-500 mt-1">
															Website ID:{" "}
															{resource.metadata?.websiteId || "N/A"}
														</p>
														{resource.metadata?.domain && (
															<p className="text-sm text-gray-500">
																Domain: {resource.metadata.domain}
															</p>
														)}
														<div className="flex items-center gap-2 mt-2">
															<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
																{resource.status}
															</span>
														</div>
													</div>
													<div className="flex gap-2">
														<button className="p-2 text-gray-400 hover:text-gray-600">
															<svg
																className="w-5 h-5"
																fill="none"
																viewBox="0 0 24 24"
																stroke="currentColor"
															>
																<path
																	strokeLinecap="round"
																	strokeLinejoin="round"
																	strokeWidth={2}
																	d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
																/>
																<path
																	strokeLinecap="round"
																	strokeLinejoin="round"
																	strokeWidth={2}
																	d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
																/>
															</svg>
														</button>
														<button className="p-2 text-gray-400 hover:text-red-600">
															<svg
																className="w-5 h-5"
																fill="none"
																viewBox="0 0 24 24"
																stroke="currentColor"
															>
																<path
																	strokeLinecap="round"
																	strokeLinejoin="round"
																	strokeWidth={2}
																	d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
																/>
															</svg>
														</button>
													</div>
												</div>
											</div>
										))}
									</div>
								)}
							</div>
						</div>

						{/* Quick Start Guide */}
						<div className="bg-white rounded-lg shadow-sm border p-6">
							<h2 className="text-lg font-semibold text-gray-900 mb-4">
								Integration Setup
							</h2>
							<div className="space-y-4">
								<div className="flex gap-3">
									<div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
										1
									</div>
									<div className="flex-1">
										<h3 className="font-medium text-gray-900">
											Create a Resource
										</h3>
										<p className="text-sm text-gray-600 mt-1">
											Create an analytics resource and link it to a Vercel
											project. Environment variables will be automatically
											injected.
										</p>
									</div>
								</div>
								<div className="flex gap-3">
									<div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
										2
									</div>
									<div className="flex-1">
										<h3 className="font-medium text-gray-900">
											Add Tracking Script
										</h3>
										<p className="text-sm text-gray-600 mt-1">
											Add the tracking script to your Next.js application:
										</p>
										<pre className="mt-2 p-3 bg-gray-900 text-gray-100 rounded-lg text-xs overflow-x-auto">
											{`import Script from 'next/script';

<Script
  src={\`\${process.env.NEXT_PUBLIC_ENTROLYTICS_HOST}/script.js\`}
  data-website-id={process.env.NEXT_PUBLIC_ENTROLYTICS_WEBSITE_ID}
  strategy="afterInteractive"
/>`}
										</pre>
									</div>
								</div>
								<div className="flex gap-3">
									<div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
										3
									</div>
									<div className="flex-1">
										<h3 className="font-medium text-gray-900">
											Deploy & Track
										</h3>
										<p className="text-sm text-gray-600 mt-1">
											Deploy your project and start seeing analytics data in
											real-time!
										</p>
									</div>
								</div>
							</div>
						</div>
					</div>

					{/* Sidebar */}
					<div className="space-y-6">
						{/* Plan Info */}
						<div className="bg-white rounded-lg shadow-sm border p-6">
							<h3 className="font-semibold text-gray-900 mb-4">Current Plan</h3>
							<div className="space-y-3">
								<div>
									<div className="text-2xl font-bold text-gray-900">Free</div>
									<div className="text-sm text-gray-500">$0/month</div>
								</div>
								<div className="border-t pt-3 space-y-2 text-sm">
									<div className="flex justify-between">
										<span className="text-gray-600">Page views</span>
										<span className="font-medium text-gray-900">10K/month</span>
									</div>
									<div className="flex justify-between">
										<span className="text-gray-600">Websites</span>
										<span className="font-medium text-gray-900">1</span>
									</div>
									<div className="flex justify-between">
										<span className="text-gray-600">Retention</span>
										<span className="font-medium text-gray-900">3 months</span>
									</div>
								</div>
								<button className="w-full mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
									Upgrade to Pro
								</button>
							</div>
						</div>

						{/* Environment Variables */}
						<div className="bg-white rounded-lg shadow-sm border p-6">
							<h3 className="font-semibold text-gray-900 mb-4">
								Auto-Configured Variables
							</h3>
							<div className="space-y-2 text-sm">
								<div className="bg-gray-50 rounded p-2 font-mono text-xs">
									NEXT_PUBLIC_ENTROLYTICS_WEBSITE_ID
								</div>
								<div className="bg-gray-50 rounded p-2 font-mono text-xs">
									NEXT_PUBLIC_ENTROLYTICS_HOST
								</div>
								<div className="bg-gray-50 rounded p-2 font-mono text-xs">
									NEXT_PUBLIC_ENTROLYTICS_ENDPOINT
								</div>
							</div>
							<p className="mt-3 text-xs text-gray-500">
								These variables are automatically injected into your Vercel
								projects when you create a resource.
							</p>
						</div>

						{/* Help & Resources */}
						<div className="bg-white rounded-lg shadow-sm border p-6">
							<h3 className="font-semibold text-gray-900 mb-4">
								Help & Resources
							</h3>
							<div className="space-y-3">
								<a
									href="https://docs.entrolytics.click"
									target="_blank"
									rel="noopener noreferrer"
									className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
								>
									<svg
										className="w-4 h-4"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
										/>
									</svg>
									Documentation
								</a>
								<a
									href="https://github.com/entrolytics"
									target="_blank"
									rel="noopener noreferrer"
									className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
								>
									<svg
										className="w-4 h-4"
										fill="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											fillRule="evenodd"
											d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
											clipRule="evenodd"
										/>
									</svg>
									GitHub
								</a>
								<a
									href="mailto:support@entrolytics.click"
									className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
								>
									<svg
										className="w-4 h-4"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
										/>
									</svg>
									Support
								</a>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

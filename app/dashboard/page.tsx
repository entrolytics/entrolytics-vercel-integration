import Link from 'next/link';

export default function DashboardPage({
  searchParams,
}: {
  searchParams: { configurationId?: string };
}) {
  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      <div className="bg-white rounded-lg shadow-sm border p-8">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Entrolytics</h1>
            <p className="text-gray-500">First-party growth analytics</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="font-medium text-green-800">Integration Connected</span>
            </div>
            <p className="mt-2 text-sm text-green-700">
              Your Vercel project is now connected to Entrolytics. Environment variables
              have been automatically configured.
            </p>
          </div>

          <div className="border-t pt-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Next Steps</h2>
            <ol className="list-decimal list-inside space-y-3 text-gray-600">
              <li>
                Add the tracking script to your app:
                <pre className="mt-2 p-3 bg-gray-100 rounded text-sm overflow-x-auto">
{`<Script
  src={\`\${process.env.NEXT_PUBLIC_ENTROLYTICS_HOST}/script.js\`}
  data-website-id={process.env.NEXT_PUBLIC_ENTROLYTICS_NG_WEBSITE_ID}
/>`}
                </pre>
              </li>
              <li>Deploy your project to see analytics in action</li>
              <li>
                View your analytics at{' '}
                <a
                  href="https://entrolytics.click"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  entrolytics.click
                </a>
              </li>
            </ol>
          </div>

          <div className="border-t pt-6 flex gap-4">
            <a
              href="https://entrolytics.click"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Open Dashboard
            </a>
            <a
              href="https://docs.entrolytics.click"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Documentation
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

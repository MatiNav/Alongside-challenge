import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-8">
      <div className="max-w-md w-full space-y-8 text-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Mint Management
          </h1>
          <p className="text-gray-600">Create and manage your mints</p>
        </div>

        <div className="space-y-4">
          {" "}
          <Link
            href="/mint"
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors block"
          >
            Create New Mint
          </Link>
          <Link
            href="/dashboard"
            className="w-full bg-gray-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-gray-700 transition-colors block"
          >
            View Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}

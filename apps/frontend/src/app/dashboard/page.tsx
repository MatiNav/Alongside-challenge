"use client";

import { IMintDBObject, IPaginationResult } from "@alongside/shared-types";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function DashboardPage() {
  const [mints, setMints] = useState<IMintDBObject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [nextToken, setNextToken] = useState<string | undefined>();
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchMints = async (token?: string) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "";
      const url = new URL(`${apiUrl}/mint`);
      url.searchParams.append("limit", "10");
      if (token) {
        url.searchParams.append("nextToken", token);
      }

      const response = await fetch(url.toString());
      if (!response.ok) {
        throw new Error("Failed to fetch mints");
      }

      const data: IPaginationResult<IMintDBObject> = await response.json();

      if (token) {
        // Loading more items - append to existing list
        setMints((prev) => [...prev, ...data.items]);
      } else {
        // Initial load - replace the list
        setMints(data.items);
      }

      setNextToken(data.lastEvaluatedKey);
      setHasMore(data.hasMore);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred"
      );
    }
  };

  useEffect(() => {
    const loadInitialMints = async () => {
      setLoading(true);
      await fetchMints();
      setLoading(false);
    };

    loadInitialMints();
  }, []);

  const handleLoadMore = async () => {
    if (!nextToken || loadingMore) return;

    setLoadingMore(true);
    await fetchMints(nextToken);
    setLoadingMore(false);
  };

  const handleRefresh = async () => {
    setLoading(true);
    setMints([]);
    setNextToken(undefined);
    setHasMore(false);
    setError("");
    await fetchMints();
    setLoading(false);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
      case "success":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "failed":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading mints...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <Link
              href="/"
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              ← Back to Home
            </Link>
            <h1 className="text-3xl font-bold text-gray-900 mt-2">
              Mint Dashboard
            </h1>
            <p className="text-gray-600 mt-1">Showing {mints.length} mints</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? "Refreshing..." : "Refresh"}
            </button>
            <Link
              href="/mint"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Create New Mint
            </Link>
          </div>
        </div>
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-600">{error}</p>
            <button
              onClick={handleRefresh}
              className="mt-2 text-red-700 underline hover:no-underline text-sm"
            >
              Try again
            </button>
          </div>
        )}
        {mints.length === 0 && !error ? (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg mb-4">No mints found</p>
            <Link
              href="/mint"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Create Your First Mint
            </Link>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Mint ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Token
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Transaction ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {mints.map((mint) => (
                      <tr key={mint.mintId} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                          {mint.mintId.slice(0, 8)}...
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {mint.amount.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {mint.token.toUpperCase()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                              mint.status
                            )}`}
                          >
                            {mint.status}
                          </span>
                          {mint.errorMessage && (
                            <p
                              className="text-xs text-red-600 mt-1 max-w-xs truncate"
                              title={mint.errorMessage}
                            >
                              {mint.errorMessage}
                            </p>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                          {mint.transactionId ? (
                            <span
                              className="text-blue-600 cursor-help"
                              title={mint.transactionId}
                            >
                              {mint.transactionId}
                            </span>
                          ) : (
                            <span className="text-gray-400 italic">N/A</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(mint.createdAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Simple Pagination - Show Next Page Button */}
            {hasMore && (
              <div className="flex justify-center">
                <button
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                  {loadingMore ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Loading...
                    </>
                  ) : (
                    <>
                      Show Next Page
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Show message when no more items */}
            {!hasMore && mints.length > 0 && (
              <div className="text-center py-6">
                <p className="text-gray-500 text-sm">
                  You have reached the end of the list
                </p>
                <button
                  onClick={handleRefresh}
                  className="mt-2 text-blue-600 hover:text-blue-800 text-sm underline hover:no-underline"
                >
                  Refresh to see new mints
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

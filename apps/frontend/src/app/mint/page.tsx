"use client";

import Link from "next/link";
import { useState } from "react";

interface MintFormData {
  amount: number;
  token: string;
}

export default function MintPage() {
  const [formData, setFormData] = useState<MintFormData>({
    amount: 0,
    token: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "amount" ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.token || formData.amount <= 0) {
      setError("Please fill in all fields with valid values.");
      return;
    }

    setIsSubmitting(true);
    setError("");
    setSuccess(false);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "";
      const response = await fetch(`${apiUrl}/mint`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create mint");
      }

      setSuccess(true);
      setFormData({ amount: 0, token: "" });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
        <div className="mb-6">
          <Link
            href="/"
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            ← Back to Home
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-2">
            Create New Mint
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="amount"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Amount
            </label>
            <input
              type="number"
              id="amount"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              min="1"
              step="1"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter amount"
            />
          </div>

          <div>
            <label
              htmlFor="token"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Token
            </label>
            <select
              id="token"
              name="token"
              value={formData.token}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select a token</option>
              <option value="doge">DOGE</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? "Creating Mint..." : "Create Mint"}
          </button>
        </form>

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {success && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
            <p className="text-green-600 text-sm">
              Mint created successfully!
              <Link
                href="/dashboard"
                className="ml-2 underline hover:no-underline"
              >
                View Dashboard
              </Link>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";

interface Town {
  id: string;
  name: string;
  slug: string;
}

export default function AskPage() {
  const params = useParams<{ townSlug: string }>();
  const townSlug = params.townSlug;

  const [town, setTown] = useState<Town | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadTown() {
      try {
        const res = await fetch("/api/towns");
        const towns: Town[] = await res.json();
        const found = towns.find((t) => t.slug === townSlug);
        if (found) setTown(found);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    loadTown();
  }, [townSlug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!town) return;

    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          townId: town.id,
          name: name.trim(),
          email: email.trim(),
          message: message.trim(),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Something went wrong. Please try again.");
        return;
      }

      setSubmitted(true);
    } catch {
      setError("Unable to submit your question. Please try again later.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <p className="text-gray-500">Loading...</p>;
  }

  if (!town) {
    return <p className="text-gray-500">Town not found.</p>;
  }

  if (submitted) {
    return (
      <div className="max-w-lg mx-auto">
        <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-6 h-6 text-green-600"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight mb-2">
            Thank you!
          </h1>
          <p className="text-gray-500">
            Your question has been submitted. A town administrator will review it
            and may follow up via the email you provided.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">
          Ask a Question
        </h1>
        <p className="text-gray-500 mt-1">
          Have a question about {town.name}&apos;s budget or finances? Submit it
          below and a town administrator will review it.
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
        <p className="text-sm text-blue-800 leading-relaxed">
          <strong>Your voice matters.</strong>{" "}
          This form goes directly to your town&apos;s finance office.
          Ask about anything you see on this portal — a line item
          that doesn&apos;t make sense, a number that seems off, or
          something you&apos;d like explained differently. We&apos;ll
          follow up via the email you provide. All questions are kept
          on file and reviewed regularly.
        </p>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6">

        {error && (
          <div
            className="bg-red-50 border border-red-200 rounded-md p-3 mb-5 text-sm text-red-700"
            role="alert"
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="question-name"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Name
            </label>
            <input
              id="question-name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              aria-required="true"
            />
          </div>

          <div>
            <label
              htmlFor="question-email"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Email
            </label>
            <input
              id="question-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              aria-required="true"
            />
          </div>

          <div>
            <label
              htmlFor="question-message"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Your question or feedback
            </label>
            <textarea
              id="question-message"
              required
              rows={5}
              maxLength={2000}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="What would you like to know about the town's budget?"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y"
              aria-required="true"
              aria-describedby="message-count"
            />
            <p id="message-count" className="text-xs text-gray-400 mt-1 text-right">
              {message.length}/2000
            </p>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full px-4 py-2.5 bg-gray-900 text-white rounded-md text-sm font-medium hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? "Submitting..." : "Submit Question"}
          </button>
        </form>
      </div>
    </div>
  );
}

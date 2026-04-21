"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import HelpBox from "@/components/admin/HelpBox";

interface Town {
  id: string;
  name: string;
}

interface Question {
  id: string;
  townId: string;
  name: string;
  email: string;
  message: string;
  status: string;
  reply: string | null;
  createdAt: string;
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    new: "bg-blue-100 text-blue-800",
    read: "bg-gray-100 text-gray-700",
    replied: "bg-green-100 text-green-800",
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${styles[status] || styles.new}`}
    >
      {status}
    </span>
  );
}

function QuestionCard({
  question,
  onUpdate,
  onDelete,
}: {
  question: Question;
  onUpdate: (q: Question) => void;
  onDelete: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [replyText, setReplyText] = useState(question.reply || "");
  const [saving, setSaving] = useState(false);

  const handleMarkRead = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/questions/${question.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "read" }),
      });
      if (res.ok) {
        const updated = await res.json();
        onUpdate(updated);
      }
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  };

  const handleReply = async () => {
    if (!replyText.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/questions/${question.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "replied", reply: replyText.trim() }),
      });
      if (res.ok) {
        const updated = await res.json();
        onUpdate(updated);
      }
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Delete this question? This cannot be undone.")) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/questions/${question.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        onDelete(question.id);
      }
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  };

  const date = new Date(question.createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-medium text-gray-900">{question.name}</p>
            <StatusBadge status={question.status} />
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            {question.email} &middot; {date}
          </p>
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-sm text-gray-500 hover:text-gray-900 shrink-0"
          aria-expanded={expanded}
          aria-label={expanded ? "Collapse question" : "Expand question"}
        >
          {expanded ? "Collapse" : "Expand"}
        </button>
      </div>

      {expanded && (
        <div className="mt-4 space-y-4">
          <div className="bg-gray-50 rounded-md p-3">
            <p className="text-sm text-gray-700 whitespace-pre-wrap">
              {question.message}
            </p>
          </div>

          {question.reply && (
            <div className="bg-green-50 border border-green-200 rounded-md p-3">
              <p className="text-xs font-medium text-green-800 mb-1">Reply sent:</p>
              <p className="text-sm text-green-700 whitespace-pre-wrap">
                {question.reply}
              </p>
            </div>
          )}

          <div className="flex items-center gap-2 flex-wrap">
            {question.status === "new" && (
              <button
                onClick={handleMarkRead}
                disabled={saving}
                className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:opacity-50"
              >
                Mark as Read
              </button>
            )}
            <button
              onClick={handleDelete}
              disabled={saving}
              className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-md disabled:opacity-50"
            >
              Delete
            </button>
          </div>

          {question.status !== "replied" && (
            <div className="border-t border-gray-100 pt-3">
              <label
                htmlFor={`reply-${question.id}`}
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Reply
              </label>
              <textarea
                id={`reply-${question.id}`}
                rows={3}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Type your reply..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
              />
              <button
                onClick={handleReply}
                disabled={saving || !replyText.trim()}
                className="mt-2 px-4 py-2 bg-gray-900 text-white rounded-md text-sm hover:bg-gray-800 disabled:opacity-50"
              >
                {saving ? "Saving..." : "Send Reply"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function AdminQuestionsPage() {
  const [town, setTown] = useState<Town | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "new" | "read" | "replied">("all");

  useEffect(() => {
    async function load() {
      try {
        const townsRes = await fetch("/api/towns");
        const towns = await townsRes.json();
        if (towns.length === 0) {
          setLoading(false);
          return;
        }
        const t = towns[0];
        setTown(t);

        const questionsRes = await fetch(`/api/questions?townId=${t.id}`);
        const questionsData = await questionsRes.json();
        setQuestions(questionsData);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleUpdate = (updated: Question) => {
    setQuestions((prev) =>
      prev.map((q) => (q.id === updated.id ? updated : q))
    );
  };

  const handleDelete = (id: string) => {
    setQuestions((prev) => prev.filter((q) => q.id !== id));
  };

  const filtered =
    filter === "all"
      ? questions
      : questions.filter((q) => q.status === filter);

  const counts = {
    all: questions.length,
    new: questions.filter((q) => q.status === "new").length,
    read: questions.filter((q) => q.status === "read").length,
    replied: questions.filter((q) => q.status === "replied").length,
  };

  if (loading) return <p className="text-gray-500">Loading...</p>;

  if (!town) {
    return (
      <div>
        <p className="text-gray-500">
          No town configured.{" "}
          <Link href="/admin/setup" className="text-blue-600 hover:underline">
            Set up your town
          </Link>{" "}
          first.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Resident Questions
        </h1>
        <p className="text-gray-500 mt-1">
          View and respond to questions submitted by residents through the portal.
        </p>
      </div>

      <HelpBox title="How this works" variant="info">
        <p className="mb-1.5">
          Residents can submit questions from the &quot;Ask a Question&quot; page on
          your public portal. Questions appear here for you to review and respond to.
        </p>
        <p>
          You can mark questions as read, reply to them (the reply is saved for your
          records), or delete questions that are spam or off-topic.
        </p>
      </HelpBox>

      {/* Filter tabs */}
      <div className="flex gap-1 border-b border-gray-200" role="tablist" aria-label="Filter questions">
        {(["all", "new", "read", "replied"] as const).map((tab) => (
          <button
            key={tab}
            role="tab"
            aria-selected={filter === tab}
            onClick={() => setFilter(tab)}
            className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
              filter === tab
                ? "border-gray-900 text-gray-900"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
            <span className="ml-1.5 text-xs text-gray-400">({counts[tab]})</span>
          </button>
        ))}
      </div>

      {/* Question list */}
      {filtered.length === 0 ? (
        <p className="text-sm text-gray-400 py-4">
          {filter === "all"
            ? "No questions have been submitted yet."
            : `No ${filter} questions.`}
        </p>
      ) : (
        <div className="space-y-3">
          {filtered.map((q) => (
            <QuestionCard
              key={q.id}
              question={q}
              onUpdate={handleUpdate}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}

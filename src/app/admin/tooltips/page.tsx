"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import HelpBox from "@/components/admin/HelpBox";

interface Town {
  id: string;
  name: string;
}

interface TooltipData {
  id: string;
  scope: string;
  key: string;
  text: string;
}

export default function TooltipsPage() {
  const [town, setTown] = useState<Town | null>(null);
  const [tooltips, setTooltips] = useState<TooltipData[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [lineItems, setLineItems] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [lineItemSearch, setLineItemSearch] = useState("");
  const [editTexts, setEditTexts] = useState<Record<string, string>>({});

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

        // Load tooltips
        const tooltipRes = await fetch(`/api/tooltips?townId=${t.id}`);
        const tooltipData = await tooltipRes.json();
        setTooltips(tooltipData);

        // Build initial edit texts
        const texts: Record<string, string> = {};
        for (const tip of tooltipData) {
          texts[`${tip.scope}:${tip.key}`] = tip.text;
        }
        setEditTexts(texts);

        // Load unique categories and line items from budget data
        const uploadsRes = await fetch(`/api/towns/${t.id}/uploads`);
        const uploads = await uploadsRes.json();
        if (uploads.length > 0) {
          const budgetRes = await fetch(`/api/towns/${t.id}/budget-keys`);
          if (budgetRes.ok) {
            const keys = await budgetRes.json();
            setCategories(keys.categories || []);
            setLineItems(keys.lineItems || []);
          }
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleSave = async (scope: string, key: string) => {
    if (!town) return;
    const textKey = `${scope}:${key}`;
    const text = editTexts[textKey] || "";
    setSaving(textKey);

    try {
      await fetch("/api/tooltips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ townId: town.id, scope, key, text }),
      });

      // Update local state
      if (text.trim()) {
        setTooltips((prev) => {
          const existing = prev.find((t) => t.scope === scope && t.key === key);
          if (existing) {
            return prev.map((t) =>
              t.scope === scope && t.key === key ? { ...t, text } : t
            );
          }
          return [...prev, { id: "", scope, key, text }];
        });
      } else {
        setTooltips((prev) =>
          prev.filter((t) => !(t.scope === scope && t.key === key))
        );
      }
    } catch {
      // ignore
    } finally {
      setSaving(null);
    }
  };

  const getTooltipText = (scope: string, key: string) => {
    const textKey = `${scope}:${key}`;
    return editTexts[textKey] ?? "";
  };

  const setTooltipText = (scope: string, key: string, text: string) => {
    setEditTexts((prev) => ({ ...prev, [`${scope}:${key}`]: text }));
  };

  const filteredLineItems = lineItemSearch
    ? lineItems.filter((li) =>
        li.toLowerCase().includes(lineItemSearch.toLowerCase())
      )
    : lineItems.slice(0, 50);

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
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Tooltips & Explainers</h1>
        <p className="text-gray-500 mt-1">
          Add explanatory text that appears on the resident portal when hovering over budget categories and line items.
        </p>
      </div>

      <HelpBox title="Why add tooltips?" variant="info">
        <p className="mb-1.5">
          Budget data can be confusing for residents. Tooltips let you add
          short, plain-language explanations that appear when someone hovers
          over or taps on a budget category or line item on your portal.
        </p>
        <p>
          For example, you might explain that &quot;Unclassified&quot; expenses
          include things like insurance and retirement benefits, or that
          &quot;Cherry Sheet Assessments&quot; are state charges passed to
          the town.
        </p>
      </HelpBox>

      {/* Category Explainers */}
      <section>
        <h2 className="text-lg font-medium mb-4">Category Explainers</h2>
        <HelpBox variant="tip">
          <p>
            Categories are the broad groupings in your budget (e.g.,
            &quot;Public Safety&quot;, &quot;Education&quot;). A small (?) icon
            will appear next to each category that has an explanation. Keep
            descriptions short — one or two sentences is ideal.
          </p>
        </HelpBox>

        {categories.length === 0 ? (
          <p className="text-sm text-gray-400">
            No budget data uploaded yet. Upload data to see categories here.
          </p>
        ) : (
          <div className="space-y-3">
            {categories.map((cat) => (
              <div
                key={cat}
                className="bg-white border border-gray-200 rounded-lg p-4"
              >
                <label className="text-sm font-medium block mb-2">{cat}</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={getTooltipText("category", cat)}
                    onChange={(e) =>
                      setTooltipText("category", cat, e.target.value)
                    }
                    placeholder="Explain this category for residents..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={() => handleSave("category", cat)}
                    disabled={saving === `category:${cat}`}
                    className="px-3 py-2 bg-gray-900 text-white rounded-md text-sm hover:bg-gray-800 disabled:opacity-50"
                  >
                    {saving === `category:${cat}` ? "..." : "Save"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Line Item Tooltips */}
      <section>
        <h2 className="text-lg font-medium mb-4">Line Item Hover Text</h2>
        <HelpBox variant="tip">
          <p>
            Line items are the individual rows in your budget tables (e.g.,
            &quot;Police Salaries&quot;, &quot;Road Maintenance&quot;).
            Hover text appears when a resident moves their mouse over or taps
            on a line item. This is great for explaining what an unfamiliar
            budget line actually pays for.
          </p>
        </HelpBox>

        {lineItems.length === 0 ? (
          <p className="text-sm text-gray-400">
            No budget data uploaded yet. Upload data to see line items here.
          </p>
        ) : (
          <>
            <input
              type="text"
              value={lineItemSearch}
              onChange={(e) => setLineItemSearch(e.target.value)}
              placeholder="Search line items..."
              className="w-full max-w-sm px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
              aria-label="Search line items"
            />

            <div className="space-y-2">
              {filteredLineItems.map((item) => (
                <div
                  key={item}
                  className="bg-white border border-gray-200 rounded-lg p-3"
                >
                  <label className="text-sm font-medium block mb-1.5">{item}</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={getTooltipText("line-item", item)}
                      onChange={(e) =>
                        setTooltipText("line-item", item, e.target.value)
                      }
                      placeholder="Add hover text..."
                      className="flex-1 px-2 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      onClick={() => handleSave("line-item", item)}
                      disabled={saving === `line-item:${item}`}
                      className="px-3 py-1.5 bg-gray-900 text-white rounded-md text-sm hover:bg-gray-800 disabled:opacity-50"
                    >
                      {saving === `line-item:${item}` ? "..." : "Save"}
                    </button>
                  </div>
                </div>
              ))}
              {lineItems.length > 50 && !lineItemSearch && (
                <p className="text-xs text-gray-400">
                  Showing first 50 of {lineItems.length} items. Use search to find specific line items.
                </p>
              )}
            </div>
          </>
        )}
      </section>
    </div>
  );
}

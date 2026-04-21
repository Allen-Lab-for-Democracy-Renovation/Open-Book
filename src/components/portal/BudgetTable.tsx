"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { formatCurrency } from "@/lib/format";
import TooltipIcon from "./TooltipIcon";

interface TableRow {
  id: string;
  cells: (string | number | null)[];
  isGroup?: boolean;
  isSubtotal?: boolean;
  depth?: number;
}

interface TooltipMap {
  [key: string]: string;
}

interface BudgetTableProps {
  headers: string[];
  rows: TableRow[];
  searchable?: boolean;
  categoryTooltips?: TooltipMap;
  lineItemTooltips?: TooltipMap;
}

export default function BudgetTable({
  headers,
  rows,
  searchable = true,
  categoryTooltips = {},
  lineItemTooltips = {},
}: BudgetTableProps) {
  const [query, setQuery] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScroll, setCanScroll] = useState(false);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const check = () => setCanScroll(el.scrollWidth > el.clientWidth);
    check();
    const observer = new ResizeObserver(check);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const filtered = useMemo(() => {
    if (!query) return rows;
    const q = query.toLowerCase();
    return rows.filter(
      (r) =>
        r.isGroup ||
        r.isSubtotal ||
        r.cells.some(
          (c) => c != null && c.toString().toLowerCase().includes(q)
        )
    );
  }, [rows, query]);

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      {searchable && (
        <div className="px-4 py-3 border-b border-gray-100">
          <input
            type="text"
            placeholder="Search line items..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full max-w-sm px-3 py-2 text-sm border border-gray-200 rounded-md bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
            aria-label="Search budget items"
          />
          {query && (
            <p className="text-xs text-gray-400 mt-1.5">
              {filtered.filter((r) => !r.isGroup && !r.isSubtotal).length} results
            </p>
          )}
        </div>
      )}

      <div className="relative">
        {canScroll && (
          <div
            className="absolute right-0 top-0 bottom-0 w-8 pointer-events-none z-10"
            style={{
              background: "linear-gradient(to right, transparent, white)",
            }}
          />
        )}

        <div ref={scrollRef} className="overflow-x-auto">
          <table className="w-full text-sm" style={{ minWidth: "600px" }} role="table">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/80">
                {headers.map((h, i) => (
                  <th
                    key={h}
                    scope="col"
                    className={`px-4 py-2.5 text-left text-xs font-semibold font-display uppercase tracking-wide text-gray-500 ${
                      i > 0 && i < headers.length ? "hidden sm:table-cell" : ""
                    }`}
                    style={i > 1 ? { minWidth: "100px" } : undefined}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => {
                const firstCell =
                  row.cells[0] != null ? row.cells[0].toString() : "";
                const groupTooltip =
                  (row.isGroup || row.isSubtotal) && firstCell
                    ? categoryTooltips[firstCell]
                    : undefined;
                const itemTooltip =
                  !row.isGroup && !row.isSubtotal && firstCell
                    ? lineItemTooltips[firstCell]
                    : undefined;

                return (
                  <tr
                    key={row.id}
                    className={
                      row.isGroup
                        ? "bg-gray-100/80 font-semibold text-gray-900"
                        : row.isSubtotal
                        ? "bg-gray-50/60 font-medium border-t border-gray-200 text-gray-800"
                        : "border-b border-gray-50 hover:bg-gray-50/50 transition-colors duration-75 text-gray-700"
                    }
                  >
                    {row.cells.map((cell, i) => (
                      <td
                        key={i}
                        className={`px-4 py-2 ${
                          typeof cell === "number"
                            ? "text-right tabular-nums"
                            : ""
                        } ${
                          cell !== null && typeof cell === "string" && cell.startsWith("+")
                            ? "text-emerald-600"
                            : cell !== null && typeof cell === "string" && cell.startsWith("-")
                            ? "text-red-600"
                            : ""
                        }`}
                        style={
                          row.depth && i === 0
                            ? { paddingLeft: `${1 + row.depth * 1.25}rem` }
                            : undefined
                        }
                        {...(itemTooltip && i === 0
                          ? { title: itemTooltip }
                          : {})}
                      >
                        <span className="inline-flex items-center gap-0.5">
                          {typeof cell === "number" ? (
                            <span className="tabular-nums">{formatCurrency(cell)}</span>
                          ) : (
                            <span className={`${row.depth && i === 0 ? "text-gray-600" : ""}`}>
                              {cell ?? ""}
                            </span>
                          )}
                          {i === 0 && groupTooltip && (
                            <TooltipIcon text={groupTooltip} label={firstCell} />
                          )}
                          {i === 0 && itemTooltip && (
                            <TooltipIcon text={itemTooltip} label={firstCell} />
                          )}
                        </span>
                      </td>
                    ))}
                  </tr>
                );
              })}

              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={headers.length}
                    className="px-4 py-8 text-center text-gray-400 text-sm"
                  >
                    {query ? "No items match your search." : "No data available."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

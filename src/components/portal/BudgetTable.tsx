"use client";

import { useState, useRef, useEffect } from "react";
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

interface YearColumnConfig {
  // All fiscal years available, ascending. Row cells must include an amount
  // for each year (in this order) after the static cells.
  years: string[];
  // Optional default selection. If omitted, defaults to the 3 most recent
  // years. The dropdown only renders when years.length > 3.
  defaultSelectedYears?: string[];
}

interface BudgetTableProps {
  headers: string[];
  rows: TableRow[];
  searchable?: boolean;
  categoryTooltips?: TooltipMap;
  lineItemTooltips?: TooltipMap;
  yearColumns?: YearColumnConfig;
}

export default function BudgetTable({
  headers,
  rows,
  searchable = true,
  categoryTooltips = {},
  lineItemTooltips = {},
  yearColumns,
}: BudgetTableProps) {
  const [query, setQuery] = useState("");
  const [yearMenuOpen, setYearMenuOpen] = useState(false);
  const [selectedYears, setSelectedYears] = useState<string[]>(() => {
    if (!yearColumns) return [];
    // Always start with the 3 most recent years selected, regardless of how
    // many years are uploaded.
    return yearColumns.defaultSelectedYears ?? yearColumns.years.slice(-3);
  });
  const scrollRef = useRef<HTMLDivElement>(null);
  const yearMenuRef = useRef<HTMLDivElement>(null);
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

  useEffect(() => {
    if (!yearMenuOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (
        yearMenuRef.current &&
        !yearMenuRef.current.contains(e.target as Node)
      ) {
        setYearMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [yearMenuOpen]);

  const allYears = yearColumns?.years ?? [];
  const staticHeaderCount = headers.length;
  const showYearMenu = !!yearColumns && allYears.length > 3;

  // Visible years follow allYears' ascending order, filtered by selection.
  const visibleYears = yearColumns
    ? allYears.filter((y) => selectedYears.includes(y))
    : [];

  // Percent change is always computed from the two most recent years of data,
  // regardless of which years are toggled in the selector.
  const showPctChange = !!yearColumns && allYears.length >= 2;
  const priorYear = showPctChange ? allYears[allYears.length - 2] : "";
  const recentYear = showPctChange ? allYears[allYears.length - 1] : "";

  const effectiveHeaders = yearColumns
    ? [
        ...headers,
        ...visibleYears.map((y) => `FY${y}`),
        ...(showPctChange
          ? [`% Change FY${priorYear} to FY${recentYear}`]
          : []),
      ]
    : headers;

  const effectiveRows = yearColumns
    ? rows.map((r) => {
      const staticCells = r.cells.slice(0, staticHeaderCount);
      const yearCells = visibleYears.map((y) => {
        const i = allYears.indexOf(y);
        return r.cells[staticHeaderCount + i] ?? null;
      });
      let pctCells: (string | number | null)[] = [];
      if (showPctChange) {
        const prior = r.cells[staticHeaderCount + (allYears.length - 2)];
        const recent = r.cells[staticHeaderCount + (allYears.length - 1)];
        if (
          typeof prior !== "number" ||
          typeof recent !== "number" ||
          prior === 0
        ) {
          pctCells = ["—"];
        } else {
          const pct = ((recent - prior) / prior) * 100;
          const sign = pct > 0 ? "+" : "";
          pctCells = [`${sign}${pct.toFixed(1)}%`];
        }
      }
      return { ...r, cells: [...staticCells, ...yearCells, ...pctCells] };
    })
    : rows;

  const q = query.toLowerCase();
  const filtered = query
    ? effectiveRows.filter(
        (r) =>
          r.isGroup ||
          r.isSubtotal ||
          r.cells.some((c) => c != null && c.toString().toLowerCase().includes(q))
      )
    : effectiveRows;

  const toggleYear = (year: string) => {
    setSelectedYears((prev) => {
      if (prev.includes(year)) {
        if (prev.length === 1) return prev; // keep at least one column visible
        return prev.filter((y) => y !== year);
      }
      return [...prev, year];
    });
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      {(searchable || showYearMenu) && (
        <div className="px-4 py-3 border-b border-gray-100 flex items-start justify-between gap-3">
          {searchable ? (
            <div className="flex-1 max-w-sm">
              <input
                type="text"
                placeholder="Search line items..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                aria-label="Search budget items"
              />
              {query && (
                <p className="text-xs text-gray-500 mt-1.5">
                  {filtered.filter((r) => !r.isGroup && !r.isSubtotal).length}{" "}
                  results
                </p>
              )}
            </div>
          ) : (
            <div />
          )}

          {showYearMenu && (
            <div className="relative" ref={yearMenuRef}>
              <button
                type="button"
                onClick={() => setYearMenuOpen((o) => !o)}
                aria-haspopup="listbox"
                aria-expanded={yearMenuOpen}
                className="inline-flex items-center gap-2 px-3 py-2 text-sm border border-gray-200 rounded-md bg-gray-50 hover:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
              >
                <span className="font-medium text-gray-700">Fiscal Year</span>
                <span className="text-gray-500 text-xs">
                  {selectedYears.length} selected
                </span>
                <svg
                  className="w-3 h-3 text-gray-400"
                  viewBox="0 0 12 12"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M3 4.5L6 7.5L9 4.5"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
              {yearMenuOpen && (
                <div
                  role="listbox"
                  aria-multiselectable="true"
                  className="absolute right-0 top-full mt-1 z-20 bg-white border border-gray-200 rounded-md shadow-lg min-w-[10rem] py-1"
                >
                  {[...allYears].reverse().map((year) => {
                    const isSelected = selectedYears.includes(year);
                    return (
                      <label
                        key={year}
                        className="flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-gray-50 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleYear(year)}
                          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-gray-700">FY{year}</span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
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
          <table
            className="w-full text-sm"
            style={{ minWidth: "600px" }}
            role="table"
            aria-label="Budget data"
          >
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/80">
                {effectiveHeaders.map((h, i) => (
                  <th
                    key={h}
                    scope="col"
                    className={`px-4 py-2.5 text-left text-xs font-semibold font-display uppercase tracking-wide text-gray-500 ${
                      i > 0 && i < effectiveHeaders.length
                        ? "hidden sm:table-cell"
                        : ""
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
                          cell !== null &&
                          typeof cell === "string" &&
                          cell.startsWith("+")
                            ? "text-emerald-600"
                            : cell !== null &&
                              typeof cell === "string" &&
                              cell.startsWith("-")
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
                            <span className="tabular-nums">
                              {formatCurrency(cell)}
                            </span>
                          ) : (
                            <span
                              className={`${
                                row.depth && i === 0 ? "text-gray-600" : ""
                              }`}
                            >
                              {cell ?? ""}
                            </span>
                          )}
                          {i === 0 && groupTooltip && (
                            <TooltipIcon
                              text={groupTooltip}
                              label={firstCell}
                            />
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
                    colSpan={effectiveHeaders.length}
                    className="px-4 py-8 text-center text-gray-500 text-sm"
                  >
                    {query
                      ? "No items match your search."
                      : "No data available."}
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

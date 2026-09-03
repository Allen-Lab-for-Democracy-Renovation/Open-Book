"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { filterHierarchicalRows } from "@/lib/financial-series";
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

interface SeriesColumn {
  key: string;
  label: string;
}

interface SeriesColumnConfig {
  columns: SeriesColumn[];
  defaultSelectedKeys?: string[];
  comparison?: {
    fromKey: string;
    toKey: string;
    label: string;
  };
}

interface BudgetTableProps {
  headers: string[];
  rows: TableRow[];
  searchable?: boolean;
  collapsible?: boolean;
  searchPlaceholder?: string;
  categoryTooltips?: TooltipMap;
  lineItemTooltips?: TooltipMap;
  seriesColumns?: SeriesColumnConfig;
}

function ComparisonBadge({
  value,
  bold,
}: {
  value: string | number | null;
  bold?: boolean;
}) {
  if (value === null || value === "—") {
    return <span className="text-gray-400">—</span>;
  }
  const str = String(value);
  const isPositive = str.startsWith("+");
  const isNegative = str.startsWith("-");
  if (!isPositive && !isNegative) {
    return <span className="text-gray-400">{str}</span>;
  }
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs ${
        bold ? "font-semibold" : "font-normal"
      } ${
        isPositive
          ? "bg-emerald-100 text-emerald-800"
          : "bg-red-100 text-red-800"
      }`}
    >
      <span aria-hidden="true">{isPositive ? "▲" : "▼"}</span>
      {str}
    </span>
  );
}

function displayDepth(row: TableRow, activeAncestorCount = 1): number {
  if (row.depth !== undefined) return row.depth;
  if (row.isGroup) return 0;
  if (row.isSubtotal) return 1;
  return Math.max(1, activeAncestorCount);
}

function removeCollapsedDescendants(
  rows: TableRow[],
  collapsedIds: Set<string>
): TableRow[] {
  const ancestors: { id: string; depth: number }[] = [];

  return rows.filter((row) => {
    const depth = displayDepth(row, ancestors.length);
    while (
      ancestors.length > 0 &&
      ancestors[ancestors.length - 1].depth >= depth
    ) {
      ancestors.pop();
    }

    const hidden = ancestors.some(({ id }) => collapsedIds.has(id));
    if (row.isGroup || row.isSubtotal) ancestors.push({ id: row.id, depth });
    return !hidden;
  });
}

export default function BudgetTable({
  headers,
  rows,
  searchable = true,
  collapsible = true,
  searchPlaceholder = "Search line items...",
  categoryTooltips = {},
  lineItemTooltips = {},
  seriesColumns,
}: BudgetTableProps) {
  const allColumns = useMemo(
    () => seriesColumns?.columns ?? [],
    [seriesColumns?.columns]
  );
  const [query, setQuery] = useState("");
  const [columnMenuOpen, setColumnMenuOpen] = useState(false);
  const [selectedColumnKeys, setSelectedColumnKeys] = useState<string[]>(() =>
    seriesColumns
      ? seriesColumns.defaultSelectedKeys ??
        seriesColumns.columns.slice(-4).map((column) => column.key)
      : []
  );
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set());
  const scrollRef = useRef<HTMLDivElement>(null);
  const columnMenuRef = useRef<HTMLDivElement>(null);
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
    if (!columnMenuOpen) return;
    function handleClickOutside(event: MouseEvent) {
      if (
        columnMenuRef.current &&
        !columnMenuRef.current.contains(event.target as Node)
      ) {
        setColumnMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [columnMenuOpen]);

  const staticHeaderCount = headers.length;
  const visibleColumns = allColumns.filter((column) =>
    selectedColumnKeys.includes(column.key)
  );
  const showColumnMenu = allColumns.length > 1;
  const comparison = seriesColumns?.comparison;

  const effectiveHeaders = seriesColumns
    ? [
        ...headers,
        ...visibleColumns.map((column) => column.label),
        ...(comparison ? [comparison.label] : []),
      ]
    : headers;

  const effectiveRows = seriesColumns
    ? rows.map((row) => {
        const staticCells = row.cells.slice(0, staticHeaderCount);
        const seriesCells = visibleColumns.map((column) => {
          const index = allColumns.findIndex(({ key }) => key === column.key);
          return row.cells[staticHeaderCount + index] ?? null;
        });
        let comparisonCell: string | null = null;

        if (comparison) {
          const fromIndex = allColumns.findIndex(
            ({ key }) => key === comparison.fromKey
          );
          const toIndex = allColumns.findIndex(
            ({ key }) => key === comparison.toKey
          );
          const fromValue = row.cells[staticHeaderCount + fromIndex];
          const toValue = row.cells[staticHeaderCount + toIndex];

          if (
            typeof fromValue === "number" &&
            typeof toValue === "number" &&
            fromValue !== 0
          ) {
            const percent = ((toValue - fromValue) / fromValue) * 100;
            comparisonCell = `${percent > 0 ? "+" : ""}${percent.toFixed(1)}%`;
          } else {
            comparisonCell = "—";
          }
        }

        return {
          ...row,
          cells: [
            ...staticCells,
            ...seriesCells,
            ...(comparison ? [comparisonCell] : []),
          ],
        };
      })
    : rows;

  const hierarchyIds = effectiveRows
    .filter((row) => row.isGroup || row.isSubtotal)
    .map((row) => row.id);
  const hasHierarchy = collapsible && hierarchyIds.length > 0;
  const everyGroupCollapsed =
    hasHierarchy && hierarchyIds.every((id) => collapsedIds.has(id));
  const searchedRows = filterHierarchicalRows(effectiveRows, query);
  const displayedRows = query
    ? searchedRows
    : removeCollapsedDescendants(searchedRows, collapsedIds);

  const toggleColumn = (key: string) => {
    setSelectedColumnKeys((current) => {
      if (current.includes(key)) {
        if (current.length === 1) return current;
        return current.filter((columnKey) => columnKey !== key);
      }
      return [...current, key];
    });
  };

  const toggleRow = (id: string) => {
    setCollapsedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAllRows = () => {
    setCollapsedIds(
      everyGroupCollapsed ? new Set() : new Set(hierarchyIds)
    );
  };

  const tableMinWidth = Math.max(
    640,
    260 + Math.max(0, effectiveHeaders.length - 1) * 132
  );

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      {(searchable || showColumnMenu || hasHierarchy) && (
        <div className="px-4 py-3 border-b border-gray-100 flex flex-wrap items-start justify-between gap-3">
          {searchable ? (
            <div className="flex-1 min-w-[14rem] max-w-sm">
              <input
                type="search"
                placeholder={searchPlaceholder}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                aria-label={searchPlaceholder.replace(/\.{3}$/, "")}
              />
              {query && (
                <p className="text-xs text-gray-500 mt-1.5" aria-live="polite">
                  {
                    displayedRows.filter(
                      (row) => !row.isGroup && !row.isSubtotal
                    ).length
                  }{" "}
                  results
                </p>
              )}
            </div>
          ) : (
            <div />
          )}

          <div className="flex flex-wrap items-center justify-end gap-2">
            {showColumnMenu && (
              <div className="relative" ref={columnMenuRef}>
                <button
                  type="button"
                  onClick={() => setColumnMenuOpen((open) => !open)}
                  aria-haspopup="true"
                  aria-expanded={columnMenuOpen}
                  className="inline-flex items-center gap-2 px-3 py-2 text-sm border border-gray-200 rounded-md bg-gray-50 hover:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                >
                  <span className="font-medium text-gray-700">Fiscal Year</span>
                  <span className="text-gray-500 text-xs">
                    {selectedColumnKeys.length} selected
                  </span>
                  <span aria-hidden="true" className="text-gray-400 text-xs">
                    {columnMenuOpen ? "▴" : "▾"}
                  </span>
                </button>
                {columnMenuOpen && (
                  <div
                    aria-label="Fiscal year visibility"
                    className="absolute right-0 top-full mt-1 z-30 bg-white border border-gray-200 rounded-md shadow-lg min-w-[13rem] max-h-80 overflow-y-auto py-1"
                  >
                    {[...allColumns].reverse().map((column) => (
                      <label
                        key={column.key}
                        className="flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-gray-50 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedColumnKeys.includes(column.key)}
                          onChange={() => toggleColumn(column.key)}
                          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-gray-700 whitespace-nowrap">
                          {column.label}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            )}

            {hasHierarchy && (
              <button
                type="button"
                onClick={toggleAllRows}
                className="px-3 py-2 text-sm font-medium text-gray-700 border border-gray-200 rounded-md bg-gray-50 hover:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
              >
                {everyGroupCollapsed ? "Expand all" : "Collapse all"}
              </button>
            )}
          </div>
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
            style={{ minWidth: `${tableMinWidth}px` }}
            aria-label="Budget data"
          >
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/80">
                {effectiveHeaders.map((header, index) => (
                  <th
                    key={`${header}-${index}`}
                    scope="col"
                    className={`px-4 py-2.5 text-left text-xs font-semibold font-display uppercase tracking-wide text-gray-500 whitespace-nowrap ${
                      index > 1 ? "min-w-[8.25rem]" : ""
                    }`}
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {displayedRows.map((row) => {
                const firstCell = row.cells[0]?.toString() ?? "";
                const groupTooltip =
                  (row.isGroup || row.isSubtotal) && firstCell
                    ? categoryTooltips[firstCell]
                    : undefined;
                const itemTooltip =
                  !row.isGroup && !row.isSubtotal && firstCell
                    ? lineItemTooltips[firstCell]
                    : undefined;
                const isHierarchyRow = row.isGroup || row.isSubtotal;
                const rowIsCollapsed = collapsedIds.has(row.id);
                const depth = displayDepth(row);

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
                    {row.cells.map((cell, index) => {
                      const isComparisonCell =
                        Boolean(comparison) && index === row.cells.length - 1;
                      return (
                        <td
                          key={index}
                          className={`px-4 py-2 whitespace-nowrap ${
                            isComparisonCell
                              ? "text-center"
                              : typeof cell === "number"
                                ? "text-right tabular-nums"
                                : ""
                          }`}
                          style={
                            depth > 0 && index === 0
                              ? { paddingLeft: `${1 + depth * 1.25}rem` }
                              : undefined
                          }
                          {...(itemTooltip && index === 0
                            ? { title: itemTooltip }
                            : {})}
                        >
                          <span className="inline-flex items-center gap-1.5">
                            {index === 0 && isHierarchyRow && (
                              <button
                                type="button"
                                onClick={() => toggleRow(row.id)}
                                aria-label={`${
                                  rowIsCollapsed ? "Expand" : "Collapse"
                                } ${firstCell}`}
                                className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded text-gray-500 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                              >
                                <span aria-hidden="true">
                                  {rowIsCollapsed ? "▸" : "▾"}
                                </span>
                              </button>
                            )}
                            {isComparisonCell ? (
                              <ComparisonBadge value={cell} bold={row.isGroup} />
                            ) : typeof cell === "number" ? (
                              <span className="tabular-nums">
                                {formatCurrency(cell)}
                              </span>
                            ) : (
                              <span className={depth > 0 && index === 0 ? "text-gray-700" : ""}>
                                {cell ?? ""}
                              </span>
                            )}
                            {index === 0 && groupTooltip && (
                              <TooltipIcon text={groupTooltip} label={firstCell} />
                            )}
                            {index === 0 && itemTooltip && (
                              <TooltipIcon text={itemTooltip} label={firstCell} />
                            )}
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}

              {displayedRows.length === 0 && (
                <tr>
                  <td
                    colSpan={effectiveHeaders.length}
                    className="px-4 py-8 text-center text-gray-500 text-sm"
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

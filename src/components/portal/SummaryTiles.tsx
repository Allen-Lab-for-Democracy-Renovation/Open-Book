"use client";

import type { SummaryTile } from "@/types";
import TooltipIcon from "./TooltipIcon";

interface TooltipMap {
  [key: string]: string;
}

export default function SummaryTiles({
  tiles,
  tooltips = {},
}: {
  tiles: SummaryTile[];
  tooltips?: TooltipMap;
}) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {tiles.map((tile, i) => (
        <div
          key={tile.label}
          className="bg-white border border-gray-200 rounded-lg p-4 sm:p-5 transition-colors duration-150 hover:border-gray-300"
        >
          <p className="text-xs sm:text-sm text-gray-500 font-medium leading-tight">
            {tile.label}
            {tooltips[tile.label] && (
              <TooltipIcon text={tooltips[tile.label]} label={tile.label} />
            )}
          </p>
          <p className="text-xl sm:text-2xl font-display font-semibold mt-1.5 tracking-tight text-gray-900 tabular-nums">
            {tile.value}
          </p>
          {tile.change && (
            <p
              className={`text-xs sm:text-sm mt-1 tabular-nums font-medium ${
                tile.changeType === "positive"
                  ? "text-emerald-600"
                  : tile.changeType === "negative"
                  ? "text-red-600"
                  : "text-gray-500"
              }`}
            >
              {tile.change}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";

interface BudgetBookControlsProps {
  showCompareOption: boolean;
}

export default function BudgetBookControls({
  showCompareOption,
}: BudgetBookControlsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const compare = searchParams.get("compare") !== "0";
  const expenseDetail = searchParams.get("expenseDetail") !== "0";
  const revenueDetail = searchParams.get("revenueDetail") !== "0";

  const setFlag = (key: string, value: boolean) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.delete(key);
    } else {
      params.set(key, "0");
    }
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  };

  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-sm text-gray-700">
      {showCompareOption && (
        <label className="flex items-center gap-1.5 cursor-pointer">
          <input
            type="checkbox"
            checked={compare}
            onChange={(e) => setFlag("compare", e.target.checked)}
            className="rounded border-gray-300 text-gray-900 focus:ring-gray-400"
          />
          Show prior year comparison
        </label>
      )}
      <label className="flex items-center gap-1.5 cursor-pointer">
        <input
          type="checkbox"
          checked={expenseDetail}
          onChange={(e) => setFlag("expenseDetail", e.target.checked)}
          className="rounded border-gray-300 text-gray-900 focus:ring-gray-400"
        />
        Detailed expense budget
      </label>
      <label className="flex items-center gap-1.5 cursor-pointer">
        <input
          type="checkbox"
          checked={revenueDetail}
          onChange={(e) => setFlag("revenueDetail", e.target.checked)}
          className="rounded border-gray-300 text-gray-900 focus:ring-gray-400"
        />
        Detailed revenue budget
      </label>
    </div>
  );
}

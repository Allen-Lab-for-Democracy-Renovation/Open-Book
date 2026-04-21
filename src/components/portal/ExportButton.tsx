"use client";

interface ExportButtonProps {
  data: Record<string, string | number | null>[];
  filename: string;
}

export default function ExportButton({ data, filename }: ExportButtonProps) {
  const handleExport = () => {
    if (data.length === 0) return;
    const headers = Object.keys(data[0]);
    const csv = [
      headers.join(","),
      ...data.map((row) =>
        headers
          .map((h) => {
            const val = row[h];
            if (val == null) return "";
            const str = val.toString();
            return str.includes(",") || str.includes('"')
              ? `"${str.replace(/"/g, '""')}"` : str;
          })
          .join(",")
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <button
      onClick={handleExport}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-display font-medium border border-gray-300 rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors duration-100 active:scale-[0.98]"
      aria-label={`Export ${filename} as CSV`}
    >
      <svg
        className="w-3.5 h-3.5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
        />
      </svg>
      Export
    </button>
  );
}

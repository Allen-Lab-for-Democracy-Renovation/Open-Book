interface HelpBoxProps {
  title?: string;
  children: React.ReactNode;
  variant?: "info" | "tip" | "warning" | "step";
}

const VARIANTS = {
  info: {
    bg: "bg-blue-50 border-blue-200",
    titleColor: "text-blue-800",
    textColor: "text-blue-700",
  },
  tip: {
    bg: "bg-emerald-50 border-emerald-200",
    titleColor: "text-emerald-800",
    textColor: "text-emerald-700",
  },
  warning: {
    bg: "bg-amber-50 border-amber-200",
    titleColor: "text-amber-800",
    textColor: "text-amber-700",
  },
  step: {
    bg: "bg-gray-50 border-gray-200",
    titleColor: "text-gray-800",
    textColor: "text-gray-600",
  },
};

export default function HelpBox({
  title,
  children,
  variant = "info",
}: HelpBoxProps) {
  const v = VARIANTS[variant];

  return (
    <div className={`border rounded-lg p-4 ${v.bg}`}>
      {title && (
        <p className={`text-sm font-medium ${v.titleColor} mb-1`}>
          {title}
        </p>
      )}
      <div className={`text-sm ${v.textColor} leading-relaxed`}>
        {children}
      </div>
    </div>
  );
}

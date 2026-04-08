import CategoryValue from "./CategoryValue";

export default function CategoryLabel({ category, valign = "center" }) {
  const valignClass = valign === "end" ? "justify-end" : "justify-center";

  return (
    <div className={`flex flex-col px-1.5 sm:px-2.5 py-2 sm:py-3 items-center text-center ${valignClass}`}>
      <span className="text-[9px] sm:text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-1">
        {category.label}
      </span>
      <CategoryValue
        category={category}
        className="text-[11px] sm:text-[13px] font-bold text-primary dark:text-foreground leading-snug uppercase wrap-break-word hyphens-auto"
      />
    </div>
  );
}

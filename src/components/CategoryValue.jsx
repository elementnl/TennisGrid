import { getFlagUrl } from "@/utils/puzzleGenerator";

export default function CategoryValue({ category, className = "" }) {
  const isCountry = category.key === "country" && category._selectedValue;
  const flagUrl = isCountry ? getFlagUrl(category._selectedValue, 32) : null;

  if (!flagUrl) {
    return <span className={className}>{category.value}</span>;
  }

  return (
    <span className={className}>
      <img src={flagUrl} alt="" className="inline h-3 sm:h-4 w-auto align-top mr-1" />
      {category.value}
    </span>
  );
}

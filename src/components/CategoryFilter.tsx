import { categories } from "@/data/groceryData";
import { useI18n, categoryKeyMap } from "@/hooks/useI18n";

interface CategoryFilterProps {
  selected: string;
  onSelect: (category: string) => void;
}

const CategoryFilter = ({ selected, onSelect }: CategoryFilterProps) => {
  const { t } = useI18n();
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      {categories.map((cat) => (
        <button
          key={cat}
          onClick={() => onSelect(cat)}
          className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-all ${
            selected === cat
              ? "bg-primary text-primary-foreground shadow-md"
              : "bg-card text-muted-foreground border border-border hover:border-primary/30 hover:text-foreground"
          }`}
        >
          {t(categoryKeyMap[cat] || cat)}
        </button>
      ))}
    </div>
  );
};

export default CategoryFilter;

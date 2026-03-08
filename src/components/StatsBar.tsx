import { Euro, TrendingDown, ShoppingCart } from "lucide-react";
import { products, getLowestPrice, getHighestPrice } from "@/data/groceryData";
import { useI18n } from "@/hooks/useI18n";

const StatsBar = () => {
  const { t } = useI18n();
  const totalSavings = products.reduce((sum, p) => {
    return sum + (getHighestPrice(p).price - getLowestPrice(p).price);
  }, 0);

  const avgSaving = totalSavings / products.length;

  const stats = [
    { icon: ShoppingCart, label: t("stats.products"), value: products.length.toString() },
    { icon: TrendingDown, label: t("stats.avgSavings"), value: `€${avgSaving.toFixed(2)}` },
    { icon: Euro, label: t("stats.totalSavings"), value: `€${totalSavings.toFixed(2)}` },
  ];

  return (
    <div className="grid grid-cols-3 gap-2">
      {stats.map((stat) => (
        <div key={stat.label} className="bg-card rounded-2xl border border-border p-3 flex flex-col items-center gap-1.5">
          <div className="h-8 w-8 rounded-xl bg-primary/15 flex items-center justify-center">
            <stat.icon className="h-4 w-4 text-primary" />
          </div>
          <p className="text-lg font-display font-bold text-card-foreground">{stat.value}</p>
          <p className="text-[10px] text-muted-foreground">{stat.label}</p>
        </div>
      ))}
    </div>
  );
};

export default StatsBar;

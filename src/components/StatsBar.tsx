import { products, getLowestPrice, getHighestPrice } from "@/data/groceryData";
import { Euro, TrendingDown, ShoppingCart } from "lucide-react";

const StatsBar = () => {
  const totalSavings = products.reduce((sum, p) => {
    return sum + (getHighestPrice(p).price - getLowestPrice(p).price);
  }, 0);

  const avgSaving = totalSavings / products.length;

  const stats = [
    {
      icon: ShoppingCart,
      label: "Products Tracked",
      value: products.length.toString(),
    },
    {
      icon: TrendingDown,
      label: "Avg. Savings",
      value: `$${avgSaving.toFixed(2)}`,
    },
    {
      icon: DollarSign,
      label: "Total Potential Savings",
      value: `$${totalSavings.toFixed(2)}`,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="bg-card rounded-xl border border-border p-4 flex items-center gap-3 shadow-sm"
        >
          <div className="h-10 w-10 rounded-lg bg-accent flex items-center justify-center">
            <stat.icon className="h-5 w-5 text-accent-foreground" />
          </div>
          <div>
            <p className="text-xl font-display font-bold text-card-foreground">{stat.value}</p>
            <p className="text-xs text-muted-foreground">{stat.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default StatsBar;

import type { Recommendation } from "@/hooks/useRecommendations";
import { stores, getLowestPrice } from "@/data/groceryData";
import { Sparkles, TrendingDown, Tag, Heart } from "lucide-react";

const reasonConfig: Record<string, { icon: typeof Sparkles; title: string; accent: string }> = {
  best_value: { icon: TrendingDown, title: "Best Value Picks", accent: "text-accent-foreground" },
  deal_trending: { icon: Tag, title: "Hot Deals & Trending", accent: "text-secondary-foreground" },
  personalized: { icon: Heart, title: "Picked For You", accent: "text-primary" },
};

interface RecommendationRowProps {
  recommendations: Recommendation[];
  reason: string;
}

const RecommendationRow = ({ recommendations, reason }: RecommendationRowProps) => {
  if (recommendations.length === 0) return null;
  const config = reasonConfig[reason];
  if (!config) return null;
  const Icon = config.icon;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Icon className={`h-5 w-5 ${config.accent}`} />
        <h3 className="font-display font-semibold text-foreground">{config.title}</h3>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
        {recommendations.map((rec) => {
          const lowest = getLowestPrice(rec.product);
          const store = stores.find((s) => s.id === lowest.storeId)!;
          return (
            <div
              key={rec.product.id}
              className="min-w-[160px] bg-card rounded-xl border border-border p-3 shadow-sm hover:shadow-md transition-all flex-shrink-0 animate-scale-in"
            >
              <div className="text-3xl mb-2">{rec.product.image}</div>
              <p className="font-medium text-sm text-card-foreground leading-tight truncate">
                {rec.product.name}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">{rec.product.unit}</p>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-lg font-display font-bold text-accent-foreground">
                  €{lowest.price.toFixed(2)}
                </span>
                <span className="text-[10px] text-muted-foreground">at {store.name}</span>
              </div>
              <span className="inline-block mt-1.5 text-[10px] font-medium bg-accent text-accent-foreground px-2 py-0.5 rounded-full">
                {rec.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RecommendationRow;

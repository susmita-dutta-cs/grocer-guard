import { useMemo, useCallback, useState } from "react";
import { Product, stores, getLowestPrice, getHighestPrice, getSavingsPercent } from "@/data/groceryData";
import { useGroceryData } from "@/hooks/useGroceryData";

// --- Types ---
export type RecommendationReason =
  | "best_value"
  | "smart_basket"
  | "personalized"
  | "deal_trending";

export type Recommendation = {
  product: Product;
  reason: RecommendationReason;
  label: string;
  score: number;
};

export type SmartBasketItem = {
  productId: string;
  productName: string;
  brand?: string;
  image: string;
  price: number;
  available: boolean;
};

export type SmartBasketResult = {
  storeId: string;
  storeName: string;
  totalCost: number;
  itemCount: number;
  savings: number;
  items: SmartBasketItem[];
};

// --- Browsing history (localStorage) ---
const HISTORY_KEY = "grocerysaver_history";
const MAX_HISTORY = 50;

function getViewHistory(): string[] {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
  } catch {
    return [];
  }
}

function addToViewHistory(productId: string) {
  const history = getViewHistory();
  history.unshift(productId);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, MAX_HISTORY)));
}

// --- Algorithms ---

function getBestValuePicks(allProducts: Product[], count = 4): Recommendation[] {
  return allProducts
    .map((p) => ({
      product: p,
      reason: "best_value" as const,
      label: `Save ${getSavingsPercent(p)}%`,
      score: getSavingsPercent(p),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, count);
}

function getSmartBasket(allProducts: Product[], selectedIds: string[]): SmartBasketResult[] {
  const selected = allProducts.filter((p) => selectedIds.includes(p.id));
  if (selected.length === 0) return [];

  return stores
    .map((store) => {
      const items: SmartBasketItem[] = selected.map((p) => {
        const storePrice = p.prices.find((pp) => pp.storeId === store.id);
        return {
          productId: p.id,
          productName: p.name,
          brand: p.brand,
          image: p.image,
          price: storePrice?.price ?? 0,
          available: !!storePrice,
        };
      });

      const totalCost = items.reduce((sum, item) => sum + item.price, 0);
      const maxTotal = selected.reduce((sum, p) => sum + getHighestPrice(p).price, 0);

      return {
        storeId: store.id,
        storeName: store.name,
        totalCost: Math.round(totalCost * 100) / 100,
        itemCount: selected.length,
        savings: Math.round((maxTotal - totalCost) * 100) / 100,
        items,
      };
    })
    .sort((a, b) => a.totalCost - b.totalCost);
}

function getDealsAndTrending(allProducts: Product[], count = 4): Recommendation[] {
  const onSaleProducts = allProducts.filter((p) =>
    p.prices.some((pp) => pp.onSale)
  );

  return onSaleProducts
    .map((p) => {
      const salePrice = p.prices.find((pp) => pp.onSale)!;
      const highest = getHighestPrice(p).price;
      const discount = Math.round(((highest - salePrice.price) / highest) * 100);
      const store = stores.find((s) => s.id === salePrice.storeId)!;
      return {
        product: p,
        reason: "deal_trending" as const,
        label: `${store.name} — €${salePrice.price.toFixed(2)}`,
        score: discount,
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, count);
}

function getPersonalized(allProducts: Product[], count = 4): Recommendation[] {
  const history = getViewHistory();
  if (history.length === 0) return [];

  const catFreq: Record<string, number> = {};
  history.forEach((id) => {
    const p = allProducts.find((pr) => pr.id === id);
    if (p) {
      catFreq[p.category] = (catFreq[p.category] || 0) + 1;
    }
  });

  const topCats = Object.entries(catFreq)
    .sort(([, a], [, b]) => b - a)
    .map(([cat]) => cat);

  const recentSet = new Set(history.slice(0, 5));
  const recommendations = allProducts
    .filter((p) => topCats.includes(p.category) && !recentSet.has(p.id))
    .map((p) => ({
      product: p,
      reason: "personalized" as const,
      label: p.category,
      score: (topCats.indexOf(p.category) + 1) * -1 + getSavingsPercent(p),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, count);

  return recommendations;
}

// --- Hook ---
export function useRecommendations() {
  const { products: allProducts } = useGroceryData();
  const [basketIds, setBasketIds] = useState<string[]>([]);
  const [historyVersion, setHistoryVersion] = useState(0);

  const trackView = useCallback((productId: string) => {
    addToViewHistory(productId);
    setHistoryVersion((v) => v + 1);
  }, []);

  const toggleBasketItem = useCallback((productId: string) => {
    setBasketIds((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
  }, []);

  const bestValue = useMemo(() => getBestValuePicks(allProducts, 4), [allProducts]);
  const deals = useMemo(() => getDealsAndTrending(allProducts, 4), [allProducts]);
  const personalized = useMemo(() => getPersonalized(allProducts, 4), [allProducts, historyVersion]);
  const smartBasket = useMemo(() => getSmartBasket(allProducts, basketIds), [allProducts, basketIds]);

  return {
    bestValue,
    deals,
    personalized,
    smartBasket,
    basketIds,
    toggleBasketItem,
    trackView,
  };
}

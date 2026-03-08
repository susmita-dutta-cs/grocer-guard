import { useI18n } from "@/hooks/useI18n";
import type { Product } from "@/data/groceryData";

export function useProductName() {
  const { language } = useI18n();

  const getProductName = (product: Product): string => {
    if (language === "nl" && product.name_nl) return product.name_nl;
    if (language === "fr" && product.name_fr) return product.name_fr;
    return product.name;
  };

  return { getProductName };
}

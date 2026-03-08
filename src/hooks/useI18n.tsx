import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

export type Language = "en" | "nl" | "fr";

type Translations = Record<string, Record<Language, string>>;

const translations: Translations = {
  // Header
  "app.tagline": {
    en: "Compare • Save • Shop Smart",
    nl: "Vergelijk • Bespaar • Slim Winkelen",
    fr: "Comparer • Économiser • Acheter Malin",
  },
  // Hero
  "hero.title1": {
    en: "Compare prices.",
    nl: "Vergelijk prijzen.",
    fr: "Comparez les prix.",
  },
  "hero.title2": {
    en: "Save every trip.",
    nl: "Bespaar elke keer.",
    fr: "Économisez à chaque course.",
  },
  "hero.subtitle": {
    en: "Aldi, Albert Heijn, Carrefour, Colruyt, Jumbo & Lidl",
    nl: "Aldi, Albert Heijn, Carrefour, Colruyt, Jumbo & Lidl",
    fr: "Aldi, Albert Heijn, Carrefour, Colruyt, Jumbo & Lidl",
  },
  // Stats
  "stats.products": {
    en: "Products",
    nl: "Producten",
    fr: "Produits",
  },
  "stats.avgSavings": {
    en: "Avg. Savings",
    nl: "Gem. Besparing",
    fr: "Écon. Moyenne",
  },
  "stats.totalSavings": {
    en: "Total Savings",
    nl: "Totale Besparing",
    fr: "Économies Totales",
  },
  // Recommendations
  "rec.bestValue": {
    en: "Best Value Picks",
    nl: "Beste Prijs-Kwaliteit",
    fr: "Meilleurs Rapports Qualité-Prix",
  },
  "rec.deals": {
    en: "Hot Deals & Trending",
    nl: "Aanbiedingen & Trending",
    fr: "Offres & Tendances",
  },
  "rec.personalized": {
    en: "Picked For You",
    nl: "Voor Jou Gekozen",
    fr: "Choisi Pour Vous",
  },
  // Product Card
  "product.bestDeal": {
    en: "Best deal",
    nl: "Beste deal",
    fr: "Meilleur prix",
  },
  "product.sale": {
    en: "SALE",
    nl: "ACTIE",
    fr: "PROMO",
  },
  // Search
  "search.placeholder": {
    en: "Search groceries...",
    nl: "Zoek boodschappen...",
    fr: "Rechercher des produits...",
  },
  // Categories
  "cat.all": { en: "All", nl: "Alles", fr: "Tout" },
  "cat.fruitsVeg": {
    en: "Fruits & Vegetables",
    nl: "Groenten & Fruit",
    fr: "Fruits & Légumes",
  },
  "cat.dairy": {
    en: "Dairy & Eggs",
    nl: "Zuivel & Eieren",
    fr: "Produits Laitiers & Œufs",
  },
  "cat.meat": {
    en: "Meat & Seafood",
    nl: "Vlees & Vis",
    fr: "Viande & Poisson",
  },
  "cat.bakery": { en: "Bakery", nl: "Bakkerij", fr: "Boulangerie" },
  "cat.pantry": { en: "Pantry", nl: "Voorraadkast", fr: "Épicerie" },
  "cat.beverages": { en: "Beverages", nl: "Dranken", fr: "Boissons" },
  "cat.snacks": { en: "Snacks", nl: "Snacks", fr: "Snacks" },
  // Smart Basket
  "basket.title": {
    en: "Smart Basket",
    nl: "Slimme Mand",
    fr: "Panier Intelligent",
  },
  "basket.description": {
    en: "Tap items to add them, then see which store gives you the lowest total.",
    nl: "Tik op producten om ze toe te voegen en ontdek welke winkel het goedkoopst is.",
    fr: "Appuyez sur les articles, puis voyez quel magasin offre le total le plus bas.",
  },
  "basket.totalFor": {
    en: "Total for",
    nl: "Totaal voor",
    fr: "Total pour",
  },
  "basket.items": { en: "items", nl: "artikelen", fr: "articles" },
  "basket.save": { en: "Save", nl: "Bespaar", fr: "Économisez" },
  // Navigation
  "nav.home": { en: "Home", nl: "Home", fr: "Accueil" },
  "nav.search": { en: "Search", nl: "Zoeken", fr: "Rechercher" },
  "nav.basket": { en: "Basket", nl: "Mand", fr: "Panier" },
  "nav.settings": { en: "Settings", nl: "Instellingen", fr: "Paramètres" },
  // Settings
  "settings.title": { en: "Settings", nl: "Instellingen", fr: "Paramètres" },
  "settings.about": { en: "About", nl: "Over", fr: "À propos" },
  "settings.storesTracked": {
    en: "Stores tracked",
    nl: "Winkels gevolgd",
    fr: "Magasins suivis",
  },
  "settings.products": { en: "Products", nl: "Producten", fr: "Produits" },
  "settings.priceUpdates": {
    en: "Price updates",
    nl: "Prijsupdates",
    fr: "Mises à jour des prix",
  },
  "settings.weekly": {
    en: "Weekly",
    nl: "Wekelijks",
    fr: "Hebdomadaire",
  },
  "settings.stores": { en: "Stores", nl: "Winkels", fr: "Magasins" },
  "settings.language": { en: "Language", nl: "Taal", fr: "Langue" },
  // All products
  "products.all": {
    en: "All Products",
    nl: "Alle Producten",
    fr: "Tous les Produits",
  },
  "products.noResults": {
    en: "No products found",
    nl: "Geen producten gevonden",
    fr: "Aucun produit trouvé",
  },
  "products.tryDifferent": {
    en: "Try a different search or category",
    nl: "Probeer een andere zoekopdracht of categorie",
    fr: "Essayez une autre recherche ou catégorie",
  },
  "products.items": { en: "items", nl: "artikelen", fr: "articles" },
};

// Category key mapping
export const categoryKeyMap: Record<string, string> = {
  All: "cat.all",
  "Fruits & Vegetables": "cat.fruitsVeg",
  "Dairy & Eggs": "cat.dairy",
  "Meat & Seafood": "cat.meat",
  Bakery: "cat.bakery",
  Pantry: "cat.pantry",
  Beverages: "cat.beverages",
  Snacks: "cat.snacks",
};

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextType>({
  language: "en",
  setLanguage: () => {},
  t: (key) => key,
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem("grocerysaver-lang");
    return (saved as Language) || "en";
  });

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("grocerysaver-lang", lang);
  }, []);

  const t = useCallback(
    (key: string) => {
      return translations[key]?.[language] || translations[key]?.en || key;
    },
    [language]
  );

  return (
    <I18nContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}

export const languageNames: Record<Language, string> = {
  en: "English",
  nl: "Nederlands",
  fr: "Français",
};

export const languageFlags: Record<Language, string> = {
  en: "🇬🇧",
  nl: "🇳🇱",
  fr: "🇫🇷",
};

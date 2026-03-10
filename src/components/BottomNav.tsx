import { Home, Heart, ShoppingCart, Settings } from "lucide-react";
import { useI18n } from "@/hooks/useI18n";

interface BottomNavProps {
  active: string;
  onNavigate: (tab: string) => void;
  basketCount?: number;
  favoritesCount?: number;
}

const tabIcons = {
  home: Home,
  favorites: Heart,
  basket: ShoppingCart,
  settings: Settings,
};

const tabKeys = {
  home: "nav.home",
  favorites: "Favorites",
  basket: "nav.basket",
  settings: "nav.settings",
};

const BottomNav = ({ active, onNavigate, basketCount = 0, favoritesCount = 0 }: BottomNavProps) => {
  const { t } = useI18n();
  const tabs = ["home", "basket", "settings"] as const;

  const totalBasketCount = basketCount + favoritesCount;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass border-t border-border">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
        {tabs.map((id) => {
          const isActive = active === id;
          const Icon = tabIcons[id];
          return (
            <button
              key={id}
              onClick={() => onNavigate(id)}
              className={`relative flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-all ${
                isActive ? "text-primary" : "text-muted-foreground"
              }`}
            >
              {isActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary rounded-full" />
              )}
              <div className="relative">
                <Icon className={`h-5 w-5 transition-transform ${isActive ? "scale-110" : ""}`} />
                {id === "basket" && totalBasketCount > 0 && (
                  <span className="absolute -top-1.5 -right-2 bg-primary text-primary-foreground text-[9px] font-bold min-w-[16px] h-4 rounded-full flex items-center justify-center px-1">
                    {totalBasketCount}
                  </span>
                )}
              </div>
              <span className={`text-[10px] font-medium ${isActive ? "text-primary" : ""}`}>
                {t(tabKeys[id])}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;

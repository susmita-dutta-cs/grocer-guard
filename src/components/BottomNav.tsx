import { useState } from "react";
import { Home, Search, ShoppingCart, Settings } from "lucide-react";

interface BottomNavProps {
  active: string;
  onNavigate: (tab: string) => void;
  basketCount?: number;
}

const tabs = [
  { id: "home", icon: Home, label: "Home" },
  { id: "search", icon: Search, label: "Search" },
  { id: "basket", icon: ShoppingCart, label: "Basket" },
  { id: "settings", icon: Settings, label: "Settings" },
];

const BottomNav = ({ active, onNavigate, basketCount = 0 }: BottomNavProps) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass border-t border-border safe-area-bottom">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
        {tabs.map((tab) => {
          const isActive = active === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => onNavigate(tab.id)}
              className={`relative flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-all ${
                isActive ? "text-primary" : "text-muted-foreground"
              }`}
            >
              {isActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary rounded-full" />
              )}
              <div className="relative">
                <Icon className={`h-5 w-5 transition-transform ${isActive ? "scale-110" : ""}`} />
                {tab.id === "basket" && basketCount > 0 && (
                  <span className="absolute -top-1.5 -right-2 bg-primary text-primary-foreground text-[9px] font-bold min-w-[16px] h-4 rounded-full flex items-center justify-center px-1">
                    {basketCount}
                  </span>
                )}
              </div>
              <span className={`text-[10px] font-medium ${isActive ? "text-primary" : ""}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;

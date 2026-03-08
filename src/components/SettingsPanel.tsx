import { Info, Globe } from "lucide-react";
import { useI18n, languageNames, languageFlags, type Language } from "@/hooks/useI18n";

const languages: Language[] = ["en", "nl", "fr"];

const SettingsPanel = () => {
  const { t, language, setLanguage } = useI18n();

  return (
    <div className="space-y-4">
      <h2 className="font-display font-bold text-xl text-foreground">{t("settings.title")}</h2>

      {/* Language Selector */}
      <div className="bg-card rounded-2xl border border-border p-4 space-y-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/15 flex items-center justify-center">
            <Globe className="h-5 w-5 text-primary" />
          </div>
          <h3 className="font-display font-semibold text-sm text-card-foreground">
            {t("settings.language")}
          </h3>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {languages.map((lang) => (
            <button
              key={lang}
              onClick={() => setLanguage(lang)}
              className={`flex items-center justify-center gap-2 py-3 rounded-xl border text-sm font-medium transition-all active:scale-95 ${
                language === lang
                  ? "bg-primary/15 text-primary border-primary/30"
                  : "bg-muted text-muted-foreground border-border hover:border-primary/20"
              }`}
            >
              <span className="text-lg">{languageFlags[lang]}</span>
              <span className="text-xs">{languageNames[lang]}</span>
            </button>
          ))}
        </div>
      </div>

      {/* About */}
      <div className="bg-card rounded-2xl border border-border p-4 space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/15 flex items-center justify-center">
            <Info className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-display font-semibold text-sm text-card-foreground">
              {t("settings.about")}
            </h3>
            <p className="text-xs text-muted-foreground">GrocerySaver v1.0</p>
          </div>
        </div>

        <div className="space-y-3 pt-2 border-t border-border">
          <div className="flex items-center justify-between">
            <span className="text-sm text-card-foreground">{t("settings.storesTracked")}</span>
            <span className="text-sm font-medium text-primary">6</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-card-foreground">{t("settings.products")}</span>
            <span className="text-sm font-medium text-primary">12+</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-card-foreground">{t("settings.priceUpdates")}</span>
            <span className="text-sm font-medium text-primary">{t("settings.weekly")}</span>
          </div>
        </div>
      </div>

      {/* Stores */}
      <div className="bg-card rounded-2xl border border-border p-4">
        <h3 className="font-display font-semibold text-sm text-card-foreground mb-2">
          {t("settings.stores")}
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {["Aldi", "Albert Heijn", "Carrefour", "Colruyt", "Jumbo", "Lidl"].map((store) => (
            <div key={store} className="flex items-center gap-2 bg-muted rounded-xl px-3 py-2.5">
              <div className="h-2 w-2 rounded-full bg-primary" />
              <span className="text-xs font-medium text-foreground">{store}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;

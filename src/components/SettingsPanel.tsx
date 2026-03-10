import { useState, useEffect } from "react";
import { Info, Globe, ShieldCheck, LogIn, LogOut, Link2, Save, Loader2 } from "lucide-react";
import { useGroceryData } from "@/hooks/useGroceryData";
import { useI18n, languageNames, languageFlags, type Language } from "@/hooks/useI18n";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const languages: Language[] = ["en", "nl", "fr"];

const storeNames: Record<string, string> = {
  aldi: "Aldi",
  albert_heijn: "Albert Heijn",
  carrefour: "Carrefour",
  colruyt: "Colruyt",
  delhaize: "Delhaize",
  jumbo: "Jumbo",
  lidl: "Lidl",
};

const methodOptions = ["scrape", "screenshot", "issuu", "crawl"];

type StoreConfig = {
  store_id: string;
  folder_url: string;
  scrape_method: string;
};

const SettingsPanel = () => {
  const { t, language, setLanguage } = useI18n();
  const { user, isAdmin, signOut } = useAuth();
  const { products } = useGroceryData();
  const navigate = useNavigate();

  const [configs, setConfigs] = useState<StoreConfig[]>([]);
  const [saving, setSaving] = useState(false);
  const [loadingConfigs, setLoadingConfigs] = useState(false);

  useEffect(() => {
    if (isAdmin) {
      setLoadingConfigs(true);
      supabase
        .from("store_scrape_configs")
        .select("store_id, folder_url, scrape_method")
        .order("store_id")
        .then(({ data }) => {
          if (data && data.length > 0) {
            setConfigs(data);
          } else {
            // Initialize with empty configs for all stores
            setConfigs(
              Object.keys(storeNames).map((id) => ({
                store_id: id,
                folder_url: "",
                scrape_method: "scrape",
              }))
            );
          }
          setLoadingConfigs(false);
        });
    }
  }, [isAdmin]);

  const updateConfig = (storeId: string, field: "folder_url" | "scrape_method", value: string) => {
    setConfigs((prev) =>
      prev.map((c) => (c.store_id === storeId ? { ...c, [field]: value } : c))
    );
  };

  const saveConfigs = async () => {
    setSaving(true);
    try {
      for (const config of configs) {
        const { error } = await supabase
          .from("store_scrape_configs")
          .upsert(
            {
              store_id: config.store_id,
              folder_url: config.folder_url,
              scrape_method: config.scrape_method,
              updated_at: new Date().toISOString(),
              updated_by: user?.id,
            },
            { onConflict: "store_id" }
          );
        if (error) throw error;
      }
      toast.success("Folder URLs updated successfully");
    } catch (e: any) {
      toast.error("Failed to save: " + (e.message || "Unknown error"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="font-display font-bold text-xl text-foreground">{t("settings.title")}</h2>

      {/* Account */}
      <div className="bg-card rounded-2xl border border-border p-4 space-y-3">
        {user ? (
          <>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-card-foreground">{user.email}</p>
                <p className="text-[10px] text-muted-foreground">
                  {isAdmin ? "Admin" : "User"}
                </p>
              </div>
              <button
                onClick={() => signOut()}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-muted text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                <LogOut className="h-3.5 w-3.5" />
                Sign Out
              </button>
            </div>
            {isAdmin && (
              <button
                onClick={() => navigate("/admin")}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary/15 text-primary text-sm font-medium border border-primary/20 hover:bg-primary/20 transition-colors active:scale-[0.98]"
              >
                <ShieldCheck className="h-4 w-4" />
                Admin — Edit Prices
              </button>
            )}
          </>
        ) : (
          <button
            onClick={() => navigate("/login")}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity active:scale-[0.98]"
          >
            <LogIn className="h-4 w-4" />
            Sign In
          </button>
        )}
      </div>

      {/* Admin: Folder URL Manager */}
      {isAdmin && (
        <div className="bg-card rounded-2xl border border-border p-4 space-y-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/15 flex items-center justify-center">
              <Link2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-display font-semibold text-sm text-card-foreground">
                Store Folder URLs
              </h3>
              <p className="text-[10px] text-muted-foreground">
                Update scraping URLs for weekly promotions
              </p>
            </div>
          </div>

          {loadingConfigs ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-3">
              {configs.map((config) => (
                <div key={config.store_id} className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-primary" />
                    <span className="text-xs font-medium text-foreground">
                      {storeNames[config.store_id] || config.store_id}
                    </span>
                    <select
                      value={config.scrape_method}
                      onChange={(e) => updateConfig(config.store_id, "scrape_method", e.target.value)}
                      className="ml-auto text-[10px] bg-muted border border-border rounded-lg px-2 py-1 text-muted-foreground"
                    >
                      {methodOptions.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                  </div>
                  <input
                    type="url"
                    value={config.folder_url}
                    onChange={(e) => updateConfig(config.store_id, "folder_url", e.target.value)}
                    placeholder={`https://...`}
                    className="w-full text-xs bg-muted border border-border rounded-xl px-3 py-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/40 transition-colors"
                  />
                </div>
              ))}

              <button
                onClick={saveConfigs}
                disabled={saving}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity active:scale-[0.98] disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {saving ? "Saving..." : "Save URLs"}
              </button>
            </div>
          )}
        </div>
      )}

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
            <span className="text-sm font-medium text-primary">{products.length}</span>
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
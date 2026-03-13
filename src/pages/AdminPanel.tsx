import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/hooks/useI18n";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { ShieldCheck, Save, ArrowLeft, RefreshCw, Loader2, CheckCircle, AlertCircle, Newspaper } from "lucide-react";
import { stores } from "@/data/groceryData";
import { toast } from "sonner";

interface DbProduct {
  id: string;
  name: string;
  category: string;
  unit: string;
  image: string | null;
}

interface DbPrice {
  id: string;
  product_id: string;
  store_id: string;
  price: number;
  on_sale: boolean | null;
}

type ScrapeStatus = "idle" | "running" | "done" | "error";

interface ScrapeProgress {
  status: ScrapeStatus;
  storeId: string | null;
  offset: number;
  totalFound: number;
  totalScraped: number;
  errors: string[];
}

interface FolderScrapeResult {
  promotions: number;
  matched: number;
  error?: string;
}

interface FolderProgress {
  status: ScrapeStatus;
  storeId: string | null;
  results: Record<string, FolderScrapeResult>;
}

interface Promotion {
  id: string;
  product_name: string;
  brand: string | null;
  store_id: string;
  original_price: number | null;
  promo_price: number | null;
  quantity: string | null;
  discount_type: string | null;
  valid_from: string | null;
  valid_until: string | null;
  scraped_at: string;
}

const AdminPanel = () => {
  const { user, isAdmin, loading } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const [products, setProducts] = useState<DbProduct[]>([]);
  const [prices, setPrices] = useState<DbPrice[]>([]);
  const [editingPrices, setEditingPrices] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [scrapeProgress, setScrapeProgress] = useState<ScrapeProgress>({
    status: "idle",
    storeId: null,
    offset: 0,
    totalFound: 0,
    totalScraped: 0,
    errors: [],
  });
  const [folderProgress, setFolderProgress] = useState<FolderProgress>({
    status: "idle",
    storeId: null,
    results: {},
  });
  const [promotions, setPromotions] = useState<Promotion[]>([]);

  const fetchData = async () => {
    const [{ data: prods }, { data: prs }] = await Promise.all([
      supabase.from("products").select("*").order("name"),
      supabase.from("product_prices").select("*"),
    ]);
    if (prods) setProducts(prods);
    if (prs) setPrices(prs as DbPrice[]);
  };

  const fetchPromotions = async () => {
    const { data } = await supabase
      .from("weekly_promotions")
      .select("*")
      .order("scraped_at", { ascending: false });
    if (data) setPromotions(data as Promotion[]);
  };

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      navigate("/login");
    }
  }, [user, isAdmin, loading, navigate]);

  useEffect(() => {
    fetchData();
    fetchPromotions();
  }, []);

  const getPrice = (productId: string, storeId: string) => {
    return prices.find((p) => p.product_id === productId && p.store_id === storeId);
  };

  const getPriceKey = (productId: string, storeId: string) => `${productId}_${storeId}`;

  const handlePriceChange = (productId: string, storeId: string, value: string) => {
    setEditingPrices((prev) => ({
      ...prev,
      [getPriceKey(productId, storeId)]: value,
    }));
  };

  const saveAllPrices = async () => {
    setSaving(true);
    let count = 0;

    for (const [key, value] of Object.entries(editingPrices)) {
      const [productId, storeId] = key.split("_");
      const price = parseFloat(value);
      if (isNaN(price) || price < 0) continue;

      const existing = getPrice(productId, storeId);
      if (existing) {
        await supabase
          .from("product_prices")
          .update({ price, scraped_at: new Date().toISOString() })
          .eq("id", existing.id);
      } else {
        await supabase.from("product_prices").insert({
          product_id: productId,
          store_id: storeId,
          price,
          on_sale: false,
          scraped_at: new Date().toISOString(),
        });
      }
      count++;
    }

    setEditingPrices({});
    await fetchData();
    setSaving(false);
    toast.success(`${count} price(s) updated successfully`);
  };

  const startScrape = async (storeId?: string, missingOnly = false) => {
    setScrapeProgress({
      status: "running",
      storeId: storeId || null,
      offset: 0,
      totalFound: 0,
      totalScraped: 0,
      errors: [],
    });

    let offset = 0;
    let totalFound = 0;
    let totalScraped = 0;
    const allErrors: string[] = [];

    try {
      while (true) {
        const { data, error } = await supabase.functions.invoke("scrape-prices", {
          body: { store_id: storeId || undefined, offset, missing_only: missingOnly },
        });

        if (error) {
          allErrors.push(error.message);
          break;
        }

        if (!data.success) {
          allErrors.push(data.error || "Unknown error");
          break;
        }

        totalFound += data.prices_found || 0;
        totalScraped += data.products_scraped || 0;
        if (data.errors) allErrors.push(...data.errors);

        setScrapeProgress({
          status: "running",
          storeId: storeId || null,
          offset,
          totalFound,
          totalScraped,
          errors: allErrors,
        });

        if (data.done || !data.next_offset) break;
        offset = data.next_offset;
      }

      setScrapeProgress({
        status: allErrors.length > 0 ? "error" : "done",
        storeId: storeId || null,
        offset,
        totalFound,
        totalScraped,
        errors: allErrors,
      });

      await fetchData();
      toast.success(`Scraping complete: ${totalFound} prices found from ${totalScraped} products`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Scraping failed";
      setScrapeProgress((prev) => ({
        ...prev,
        status: "error",
        errors: [...prev.errors, msg],
      }));
      toast.error(msg);
    }
  };

  const startFolderScrape = async (storeId?: string) => {
    setFolderProgress({
      status: "running",
      storeId: storeId || null,
      results: {},
    });

    try {
      const { data, error } = await supabase.functions.invoke("scrape-folders", {
        body: { store_id: storeId || undefined },
      });

      if (error) {
        setFolderProgress({ status: "error", storeId: storeId || null, results: {} });
        toast.error(error.message);
        return;
      }

      if (!data.success) {
        setFolderProgress({ status: "error", storeId: storeId || null, results: {} });
        toast.error(data.error || "Unknown error");
        return;
      }

      setFolderProgress({
        status: "done",
        storeId: storeId || null,
        results: data.results || {},
      });

      const totalPromos = Object.values(data.results as Record<string, FolderScrapeResult>).reduce(
        (sum, r) => sum + r.promotions, 0
      );
      const totalMatched = Object.values(data.results as Record<string, FolderScrapeResult>).reduce(
        (sum, r) => sum + r.matched, 0
      );
      toast.success(`Folders scraped: ${totalPromos} promotions found, ${totalMatched} matched to products`);
      await fetchData();
      await fetchPromotions();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Folder scraping failed";
      setFolderProgress({ status: "error", storeId: storeId || null, results: {} });
      toast.error(msg);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <Loader2 className="h-6 w-6 text-primary animate-spin" />
        <p className="text-muted-foreground">Loading...</p>
        <button onClick={() => navigate("/login")} className="text-xs text-primary underline">
          Go to login
        </button>
      </div>
    );
  }

  if (!isAdmin) {
    navigate("/login");
    return null;
  }

  const isRunning = scrapeProgress.status === "running";
  const isFolderRunning = folderProgress.status === "running";

  return (
    <div className="min-h-screen bg-background">
      <header className="glass border-b border-border sticky top-0 z-40">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate("/")} className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <ShieldCheck className="h-5 w-5 text-primary" />
          <h1 className="font-display font-bold text-base text-foreground flex-1">Admin — Price Editor</h1>
          <button
            onClick={saveAllPrices}
            disabled={saving || Object.keys(editingPrices).length === 0}
            className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-xs font-semibold disabled:opacity-40 transition-opacity"
          >
            <Save className="h-3.5 w-3.5" />
            {saving ? "Saving..." : `Save (${Object.keys(editingPrices).length})`}
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-4 space-y-4">
        {/* Scrape Section */}
        <div className="bg-card rounded-2xl border border-border p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-semibold text-foreground flex items-center gap-2">
              <RefreshCw className={`h-4 w-4 text-primary ${isRunning ? "animate-spin" : ""}`} />
              Price Scraping
            </h2>
            <button
              onClick={() => startScrape()}
              disabled={isRunning}
              className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-xs font-semibold disabled:opacity-40 transition-opacity"
            >
              {isRunning ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Scraping...
                </>
              ) : (
                <>
                  <RefreshCw className="h-3.5 w-3.5" />
                  Scrape All Stores
                </>
              )}
            </button>
          </div>

          <p className="text-xs text-muted-foreground">
            Scrape real prices from store websites using Firecrawl. You can scrape all stores or one at a time.
          </p>

          {/* Per-store buttons */}
          <div className="flex flex-wrap gap-2">
            {stores.map((store) => (
              <button
                key={store.id}
                onClick={() => startScrape(store.id)}
                disabled={isRunning}
                className="text-[11px] px-3 py-1.5 rounded-lg border border-border bg-card text-muted-foreground hover:bg-primary/10 hover:text-primary hover:border-primary/30 disabled:opacity-40 transition-all"
              >
                {store.name}
              </button>
            ))}
          </div>

          {/* Progress */}
          {scrapeProgress.status !== "idle" && (
            <div className="mt-3 p-3 rounded-xl bg-muted/50 space-y-2">
              <div className="flex items-center gap-2">
                {scrapeProgress.status === "running" && (
                  <Loader2 className="h-4 w-4 text-primary animate-spin" />
                )}
                {scrapeProgress.status === "done" && (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                )}
                {scrapeProgress.status === "error" && (
                  <AlertCircle className="h-4 w-4 text-destructive" />
                )}
                <span className="text-xs font-medium text-foreground">
                  {scrapeProgress.status === "running"
                    ? `Scraping... ${scrapeProgress.totalScraped} products processed`
                    : scrapeProgress.status === "done"
                    ? "Scraping complete"
                    : "Scraping finished with errors"}
                </span>
              </div>
              <div className="text-[11px] text-muted-foreground space-y-0.5">
                <p>Prices found: <span className="font-semibold text-foreground">{scrapeProgress.totalFound}</span></p>
                <p>Products scraped: <span className="font-semibold text-foreground">{scrapeProgress.totalScraped}</span></p>
                {scrapeProgress.storeId && (
                  <p>Store: <span className="font-semibold text-foreground">{stores.find(s => s.id === scrapeProgress.storeId)?.name}</span></p>
                )}
              </div>
              {scrapeProgress.errors.length > 0 && (
                <div className="text-[10px] text-destructive mt-1">
                  {scrapeProgress.errors.slice(0, 3).map((e, i) => (
                    <p key={i}>⚠ {e}</p>
                  ))}
                  {scrapeProgress.errors.length > 3 && (
                    <p>...and {scrapeProgress.errors.length - 3} more errors</p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Scrape Missing Prices Section */}
        <div className="bg-card rounded-2xl border border-border p-4 space-y-3">
          <h2 className="font-display font-semibold text-foreground flex items-center gap-2">
            <RefreshCw className="h-4 w-4 text-primary" />
            Scrape Missing Prices
          </h2>
          <p className="text-xs text-muted-foreground">
            Only scrape products that don't have a price yet for a specific store. Fills gaps in coverage.
          </p>
          <div className="flex flex-wrap gap-2">
            {stores.map((store) => (
              <button
                key={store.id}
                onClick={() => startScrape(store.id, true)}
                disabled={isRunning}
                className="text-[11px] px-3 py-1.5 rounded-lg border border-border bg-card text-muted-foreground hover:bg-primary/10 hover:text-primary hover:border-primary/30 disabled:opacity-40 transition-all"
              >
                🔍 {store.name}
              </button>
            ))}
          </div>
        </div>

        {/* Folder Scraping Section */}
        <div className="bg-card rounded-2xl border border-border p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-semibold text-foreground flex items-center gap-2">
              <Newspaper className={`h-4 w-4 text-primary ${isFolderRunning ? "animate-pulse" : ""}`} />
              Weekly Folder Promotions
            </h2>
            <button
              onClick={() => startFolderScrape()}
              disabled={isFolderRunning || isRunning}
              className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-xs font-semibold disabled:opacity-40 transition-opacity"
            >
              {isFolderRunning ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Scraping Folders...
                </>
              ) : (
                <>
                  <Newspaper className="h-3.5 w-3.5" />
                  Scrape All Folders
                </>
              )}
            </button>
          </div>

          <p className="text-xs text-muted-foreground">
            Scrape weekly promotional folders from each store. Uses AI to extract discount items and match them to your product catalog.
          </p>

          {/* Per-store folder buttons */}
          <div className="flex flex-wrap gap-2">
            {stores.map((store) => (
              <button
                key={store.id}
                onClick={() => startFolderScrape(store.id)}
                disabled={isFolderRunning || isRunning}
                className="text-[11px] px-3 py-1.5 rounded-lg border border-border bg-card text-muted-foreground hover:bg-accent/10 hover:text-accent-foreground hover:border-accent/30 disabled:opacity-40 transition-all"
              >
                📰 {store.name}
              </button>
            ))}
          </div>

          {/* Folder Progress */}
          {folderProgress.status !== "idle" && (
            <div className="mt-3 p-3 rounded-xl bg-muted/50 space-y-2">
              <div className="flex items-center gap-2">
                {folderProgress.status === "running" && (
                  <Loader2 className="h-4 w-4 text-primary animate-spin" />
                )}
                {folderProgress.status === "done" && (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                )}
                {folderProgress.status === "error" && (
                  <AlertCircle className="h-4 w-4 text-destructive" />
                )}
                <span className="text-xs font-medium text-foreground">
                  {folderProgress.status === "running"
                    ? "Scraping folders & extracting promotions with AI..."
                    : folderProgress.status === "done"
                    ? "Folder scraping complete"
                    : "Folder scraping finished with errors"}
                </span>
              </div>

              {Object.keys(folderProgress.results).length > 0 && (
                <div className="text-[11px] space-y-1">
                  {Object.entries(folderProgress.results).map(([sid, result]) => (
                    <div key={sid} className="flex items-center gap-2">
                      <span className="font-medium text-foreground w-24">
                        {stores.find(s => s.id === sid)?.name || sid}
                      </span>
                      <span className="text-muted-foreground">
                        {result.promotions} promos, {result.matched} matched
                      </span>
                      {result.error && (
                        <span className="text-destructive">⚠ {result.error}</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Scraped Promotions List */}
        {promotions.length > 0 && (
          <div className="bg-card rounded-2xl border border-border p-4 space-y-3">
            <h2 className="font-display font-semibold text-foreground flex items-center gap-2">
              <Newspaper className="h-4 w-4 text-primary" />
              Scraped Promotions ({promotions.length})
            </h2>
            <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-card z-10">
                  <tr className="border-b border-border">
                    <th className="text-left py-2 px-2 font-semibold text-foreground">Store</th>
                    <th className="text-left py-2 px-2 font-semibold text-foreground">Product</th>
                    <th className="text-left py-2 px-2 font-semibold text-foreground">Brand</th>
                    <th className="text-left py-2 px-2 font-semibold text-foreground">Quantity</th>
                    <th className="text-right py-2 px-2 font-semibold text-foreground">Original</th>
                    <th className="text-right py-2 px-2 font-semibold text-foreground">Promo</th>
                    <th className="text-left py-2 px-2 font-semibold text-foreground">Type</th>
                    <th className="text-left py-2 px-2 font-semibold text-foreground">Valid</th>
                  </tr>
                </thead>
                <tbody>
                  {promotions.map((promo) => (
                    <tr key={promo.id} className="border-b border-border/30 hover:bg-muted/30">
                      <td className="py-2 px-2 text-muted-foreground">
                        {stores.find(s => s.id === promo.store_id)?.name || promo.store_id}
                      </td>
                      <td className="py-2 px-2 font-medium text-foreground">{promo.product_name}</td>
                      <td className="py-2 px-2 text-muted-foreground">{promo.brand || "—"}</td>
                      <td className="py-2 px-2 text-muted-foreground">{promo.quantity || "—"}</td>
                      <td className="py-2 px-2 text-right text-muted-foreground">
                        {promo.original_price != null ? `€${promo.original_price.toFixed(2)}` : "—"}
                      </td>
                      <td className="py-2 px-2 text-right font-semibold text-primary">
                        {promo.promo_price != null ? `€${promo.promo_price.toFixed(2)}` : "—"}
                      </td>
                      <td className="py-2 px-2 text-muted-foreground">{promo.discount_type || "—"}</td>
                      <td className="py-2 px-2 text-[10px] text-muted-foreground">
                        {promo.valid_from && promo.valid_until
                          ? `${promo.valid_from} → ${promo.valid_until}`
                          : promo.valid_until
                          ? `until ${promo.valid_until}`
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          Edit prices below. Changed cells are highlighted. Click Save to apply all changes.
        </p>

        {/* Price table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-2 font-display font-semibold text-foreground sticky left-0 bg-background">
                  Product
                </th>
                {stores.map((s) => (
                  <th key={s.id} className="text-center py-3 px-2 font-display font-semibold text-foreground min-w-[80px]">
                    {s.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id} className="border-b border-border/50 hover:bg-card/50">
                  <td className="py-2.5 px-2 sticky left-0 bg-background">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{product.image}</span>
                      <div>
                        <p className="font-medium text-foreground text-[11px]">{product.name}</p>
                        <p className="text-[9px] text-muted-foreground">{product.unit}</p>
                      </div>
                    </div>
                  </td>
                  {stores.map((store) => {
                    const existing = getPrice(product.id, store.id);
                    const key = getPriceKey(product.id, store.id);
                    const isEdited = key in editingPrices;
                    const displayValue = isEdited
                      ? editingPrices[key]
                      : existing
                      ? existing.price.toString()
                      : "";

                    return (
                      <td key={store.id} className="py-2.5 px-1 text-center">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={displayValue}
                          onChange={(e) => handlePriceChange(product.id, store.id, e.target.value)}
                          placeholder="—"
                          className={`w-full text-center py-1.5 px-1 rounded-lg border text-[11px] font-medium transition-all ${
                            isEdited
                              ? "bg-primary/15 border-primary/30 text-primary"
                              : "bg-card border-border text-foreground"
                          } focus:outline-none focus:ring-1 focus:ring-primary/40`}
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
};

export default AdminPanel;

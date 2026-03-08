import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/hooks/useI18n";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { ShieldCheck, Save, ArrowLeft, Plus, Trash2 } from "lucide-react";
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

const AdminPanel = () => {
  const { user, isAdmin, loading } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const [products, setProducts] = useState<DbProduct[]>([]);
  const [prices, setPrices] = useState<DbPrice[]>([]);
  const [editingPrices, setEditingPrices] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      navigate("/login");
    }
  }, [user, isAdmin, loading, navigate]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [{ data: prods }, { data: prs }] = await Promise.all([
      supabase.from("products").select("*").order("name"),
      supabase.from("product_prices").select("*"),
    ]);
    if (prods) setProducts(prods);
    if (prs) setPrices(prs as DbPrice[]);
  };

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

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!isAdmin) return null;

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

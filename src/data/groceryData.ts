export type Store = {
  id: string;
  name: string;
  colorClass: string;
};

export type ProductPrice = {
  storeId: string;
  price: number;
  onSale?: boolean;
};

export type Product = {
  id: string;
  name: string;
  category: string;
  unit: string;
  image: string;
  prices: ProductPrice[];
};

export const stores: Store[] = [
  { id: "aldi", name: "Aldi", colorClass: "bg-store-1" },
  { id: "albert_heijn", name: "Albert Heijn", colorClass: "bg-store-2" },
  { id: "carrefour", name: "Carrefour", colorClass: "bg-store-3" },
  { id: "colruyt", name: "Colruyt", colorClass: "bg-store-4" },
  { id: "jumbo", name: "Jumbo", colorClass: "bg-store-5" },
  { id: "lidl", name: "Lidl", colorClass: "bg-store-6" },
];

export const categories = [
  "All",
  "Fruits & Vegetables",
  "Dairy & Eggs",
  "Meat & Seafood",
  "Bakery",
  "Pantry",
  "Beverages",
  "Snacks",
];

export const products: Product[] = [
  {
    id: "1",
    name: "Organic Bananas",
    category: "Fruits & Vegetables",
    unit: "per lb",
    image: "🍌",
    prices: [
      { storeId: "walmart", price: 0.69 },
      { storeId: "kroger", price: 0.79 },
      { storeId: "target", price: 0.89 },
      { storeId: "aldi", price: 0.55, onSale: true },
    ],
  },
  {
    id: "2",
    name: "Whole Milk (1 gal)",
    category: "Dairy & Eggs",
    unit: "per gallon",
    image: "🥛",
    prices: [
      { storeId: "walmart", price: 3.48 },
      { storeId: "kroger", price: 3.99 },
      { storeId: "target", price: 4.19 },
      { storeId: "aldi", price: 2.99, onSale: true },
    ],
  },
  {
    id: "3",
    name: "Large Eggs (dozen)",
    category: "Dairy & Eggs",
    unit: "per dozen",
    image: "🥚",
    prices: [
      { storeId: "walmart", price: 3.12 },
      { storeId: "kroger", price: 3.49 },
      { storeId: "target", price: 3.79 },
      { storeId: "aldi", price: 2.89 },
    ],
  },
  {
    id: "4",
    name: "Chicken Breast",
    category: "Meat & Seafood",
    unit: "per lb",
    image: "🍗",
    prices: [
      { storeId: "walmart", price: 3.18, onSale: true },
      { storeId: "kroger", price: 4.29 },
      { storeId: "target", price: 4.49 },
      { storeId: "aldi", price: 3.49 },
    ],
  },
  {
    id: "5",
    name: "Sliced White Bread",
    category: "Bakery",
    unit: "per loaf",
    image: "🍞",
    prices: [
      { storeId: "walmart", price: 1.28 },
      { storeId: "kroger", price: 1.99 },
      { storeId: "target", price: 2.49 },
      { storeId: "aldi", price: 0.99 },
    ],
  },
  {
    id: "6",
    name: "Fresh Strawberries",
    category: "Fruits & Vegetables",
    unit: "per 16 oz",
    image: "🍓",
    prices: [
      { storeId: "walmart", price: 3.47 },
      { storeId: "kroger", price: 2.99, onSale: true },
      { storeId: "target", price: 3.99 },
      { storeId: "aldi", price: 2.49 },
    ],
  },
  {
    id: "7",
    name: "Cheddar Cheese Block",
    category: "Dairy & Eggs",
    unit: "per 8 oz",
    image: "🧀",
    prices: [
      { storeId: "walmart", price: 2.98 },
      { storeId: "kroger", price: 3.49 },
      { storeId: "target", price: 3.79 },
      { storeId: "aldi", price: 2.39 },
    ],
  },
  {
    id: "8",
    name: "Ground Beef 80/20",
    category: "Meat & Seafood",
    unit: "per lb",
    image: "🥩",
    prices: [
      { storeId: "walmart", price: 4.78 },
      { storeId: "kroger", price: 5.49 },
      { storeId: "target", price: 5.79, onSale: true },
      { storeId: "aldi", price: 4.29 },
    ],
  },
  {
    id: "9",
    name: "Coca-Cola 12-pack",
    category: "Beverages",
    unit: "12 cans",
    image: "🥤",
    prices: [
      { storeId: "walmart", price: 5.98 },
      { storeId: "kroger", price: 6.49 },
      { storeId: "target", price: 5.49, onSale: true },
      { storeId: "aldi", price: 4.69 },
    ],
  },
  {
    id: "10",
    name: "Potato Chips",
    category: "Snacks",
    unit: "per 8 oz",
    image: "🥔",
    prices: [
      { storeId: "walmart", price: 3.48 },
      { storeId: "kroger", price: 3.99 },
      { storeId: "target", price: 4.29 },
      { storeId: "aldi", price: 1.89, onSale: true },
    ],
  },
  {
    id: "11",
    name: "Pasta Spaghetti",
    category: "Pantry",
    unit: "per 16 oz",
    image: "🍝",
    prices: [
      { storeId: "walmart", price: 1.18 },
      { storeId: "kroger", price: 1.49 },
      { storeId: "target", price: 1.69 },
      { storeId: "aldi", price: 0.89 },
    ],
  },
  {
    id: "12",
    name: "Avocados",
    category: "Fruits & Vegetables",
    unit: "each",
    image: "🥑",
    prices: [
      { storeId: "walmart", price: 0.98 },
      { storeId: "kroger", price: 1.25 },
      { storeId: "target", price: 1.49 },
      { storeId: "aldi", price: 0.79 },
    ],
  },
];

export function getLowestPrice(product: Product): { storeId: string; price: number } {
  return product.prices.reduce((min, p) => (p.price < min.price ? p : min), product.prices[0]);
}

export function getHighestPrice(product: Product): { storeId: string; price: number } {
  return product.prices.reduce((max, p) => (p.price > max.price ? p : max), product.prices[0]);
}

export function getSavingsPercent(product: Product): number {
  const low = getLowestPrice(product).price;
  const high = getHighestPrice(product).price;
  return Math.round(((high - low) / high) * 100);
}

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
  name_nl?: string;
  name_fr?: string;
  brand?: string;
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
  "Frozen",
  "Household",
  "Personal Care",
];

export const products: Product[] = [
  {
    id: "1",
    name: "Organic Bananas",
    category: "Fruits & Vegetables",
    unit: "per kg",
    image: "🍌",
    prices: [
      { storeId: "aldi", price: 1.49 },
      { storeId: "albert_heijn", price: 1.89 },
      { storeId: "carrefour", price: 1.79 },
      { storeId: "colruyt", price: 1.69 },
      { storeId: "jumbo", price: 1.85 },
      { storeId: "lidl", price: 1.39, onSale: true },
    ],
  },
  {
    id: "2",
    name: "Whole Milk (1L)",
    category: "Dairy & Eggs",
    unit: "per liter",
    image: "🥛",
    prices: [
      { storeId: "aldi", price: 0.99 },
      { storeId: "albert_heijn", price: 1.19 },
      { storeId: "carrefour", price: 1.09 },
      { storeId: "colruyt", price: 1.05 },
      { storeId: "jumbo", price: 1.15 },
      { storeId: "lidl", price: 0.95, onSale: true },
    ],
  },
  {
    id: "3",
    name: "Free Range Eggs (10)",
    category: "Dairy & Eggs",
    unit: "per 10",
    image: "🥚",
    prices: [
      { storeId: "aldi", price: 2.49 },
      { storeId: "albert_heijn", price: 2.99 },
      { storeId: "carrefour", price: 2.89 },
      { storeId: "colruyt", price: 2.69 },
      { storeId: "jumbo", price: 2.95 },
      { storeId: "lidl", price: 2.39 },
    ],
  },
  {
    id: "4",
    name: "Chicken Breast",
    category: "Meat & Seafood",
    unit: "per kg",
    image: "🍗",
    prices: [
      { storeId: "aldi", price: 7.99 },
      { storeId: "albert_heijn", price: 9.49, onSale: true },
      { storeId: "carrefour", price: 8.99 },
      { storeId: "colruyt", price: 8.49 },
      { storeId: "jumbo", price: 9.29 },
      { storeId: "lidl", price: 7.49 },
    ],
  },
  {
    id: "5",
    name: "White Bread",
    category: "Bakery",
    unit: "per loaf",
    image: "🍞",
    prices: [
      { storeId: "aldi", price: 1.09 },
      { storeId: "albert_heijn", price: 1.49 },
      { storeId: "carrefour", price: 1.39 },
      { storeId: "colruyt", price: 1.29 },
      { storeId: "jumbo", price: 1.45 },
      { storeId: "lidl", price: 0.99 },
    ],
  },
  {
    id: "6",
    name: "Fresh Strawberries",
    category: "Fruits & Vegetables",
    unit: "per 500g",
    image: "🍓",
    prices: [
      { storeId: "aldi", price: 2.99 },
      { storeId: "albert_heijn", price: 3.49 },
      { storeId: "carrefour", price: 3.29, onSale: true },
      { storeId: "colruyt", price: 3.19 },
      { storeId: "jumbo", price: 3.39 },
      { storeId: "lidl", price: 2.79 },
    ],
  },
  {
    id: "7",
    name: "Gouda Cheese",
    category: "Dairy & Eggs",
    unit: "per 400g",
    image: "🧀",
    prices: [
      { storeId: "aldi", price: 2.89 },
      { storeId: "albert_heijn", price: 3.49 },
      { storeId: "carrefour", price: 3.29 },
      { storeId: "colruyt", price: 3.09 },
      { storeId: "jumbo", price: 3.39 },
      { storeId: "lidl", price: 2.79 },
    ],
  },
  {
    id: "8",
    name: "Ground Beef",
    category: "Meat & Seafood",
    unit: "per 500g",
    image: "🥩",
    prices: [
      { storeId: "aldi", price: 3.99 },
      { storeId: "albert_heijn", price: 4.99 },
      { storeId: "carrefour", price: 4.59, onSale: true },
      { storeId: "colruyt", price: 4.29 },
      { storeId: "jumbo", price: 4.89 },
      { storeId: "lidl", price: 3.79 },
    ],
  },
  {
    id: "9",
    name: "Coca-Cola 6-pack",
    category: "Beverages",
    unit: "6 × 330ml",
    image: "🥤",
    prices: [
      { storeId: "aldi", price: 3.49 },
      { storeId: "albert_heijn", price: 4.29, onSale: true },
      { storeId: "carrefour", price: 3.99 },
      { storeId: "colruyt", price: 3.79 },
      { storeId: "jumbo", price: 4.19 },
      { storeId: "lidl", price: 3.29 },
    ],
  },
  {
    id: "10",
    name: "Potato Chips",
    category: "Snacks",
    unit: "per 200g",
    image: "🥔",
    prices: [
      { storeId: "aldi", price: 1.29, onSale: true },
      { storeId: "albert_heijn", price: 1.89 },
      { storeId: "carrefour", price: 1.69 },
      { storeId: "colruyt", price: 1.59 },
      { storeId: "jumbo", price: 1.79 },
      { storeId: "lidl", price: 1.19 },
    ],
  },
  {
    id: "11",
    name: "Spaghetti Pasta",
    category: "Pantry",
    unit: "per 500g",
    image: "🍝",
    prices: [
      { storeId: "aldi", price: 0.79 },
      { storeId: "albert_heijn", price: 1.19 },
      { storeId: "carrefour", price: 0.99 },
      { storeId: "colruyt", price: 0.89 },
      { storeId: "jumbo", price: 1.09 },
      { storeId: "lidl", price: 0.69 },
    ],
  },
  {
    id: "12",
    name: "Avocados",
    category: "Fruits & Vegetables",
    unit: "each",
    image: "🥑",
    prices: [
      { storeId: "aldi", price: 0.89 },
      { storeId: "albert_heijn", price: 1.29 },
      { storeId: "carrefour", price: 1.19 },
      { storeId: "colruyt", price: 1.09 },
      { storeId: "jumbo", price: 1.25 },
      { storeId: "lidl", price: 0.79 },
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

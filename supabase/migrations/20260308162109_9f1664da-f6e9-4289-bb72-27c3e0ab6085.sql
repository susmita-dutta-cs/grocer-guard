
INSERT INTO products (name, name_nl, name_fr, category, unit, image, brand) VALUES
  ('Smoked Mackerel Fillet', 'Gerookte Makreelfilet', 'Filet de Maquereau Fumé', 'Meat & Seafood', 'per 200g', '🐟', NULL),
  ('Oat Drink Barista', 'Haverdrink Barista', 'Boisson Avoine Barista', 'Dairy & Eggs', 'per liter', '🥛', NULL),
  ('Pretzel Sticks', 'Pretzelsticks', 'Bâtonnets Bretzel', 'Snacks', 'per 200g', '🥨', NULL),
  ('Edamame Frozen', 'Edamame Diepvries', 'Edamame Surgelés', 'Frozen', 'per 400g', '🫛', NULL),
  ('Aloe Vera Drink', 'Aloë Vera Drank', 'Boisson Aloe Vera', 'Beverages', 'per 500ml', '🧃', NULL),
  ('Facial Tissue Box', 'Tissues Doos', 'Boîte de Mouchoirs', 'Household', 'per 100 sheets', '🤧', NULL),
  ('Hand Cream', 'Handcrème', 'Crème pour les Mains', 'Personal Care', 'per 75ml', '🧴', NULL);

INSERT INTO product_prices (product_id, store_id, price, on_sale)
SELECT p.id, v.store_id, v.price, v.on_sale FROM products p
CROSS JOIN LATERAL (VALUES
  ('aldi', 2.49, false), ('albert_heijn', 3.29, false), ('carrefour', 2.99, true),
  ('colruyt', 2.79, false), ('jumbo', 3.19, false), ('lidl', 2.39, false)
) AS v(store_id, price, on_sale) WHERE p.name = 'Smoked Mackerel Fillet';

INSERT INTO product_prices (product_id, store_id, price, on_sale)
SELECT p.id, v.store_id, v.price, v.on_sale FROM products p
CROSS JOIN LATERAL (VALUES
  ('aldi', 1.79, false), ('albert_heijn', 2.29, false), ('carrefour', 2.09, false),
  ('colruyt', 1.99, false), ('jumbo', 2.19, true), ('lidl', 1.69, false)
) AS v(store_id, price, on_sale) WHERE p.name = 'Oat Drink Barista';

INSERT INTO product_prices (product_id, store_id, price, on_sale)
SELECT p.id, v.store_id, v.price, v.on_sale FROM products p
CROSS JOIN LATERAL (VALUES
  ('aldi', 0.99, false), ('albert_heijn', 1.49, false), ('carrefour', 1.29, false),
  ('colruyt', 1.19, false), ('jumbo', 1.39, false), ('lidl', 0.89, true)
) AS v(store_id, price, on_sale) WHERE p.name = 'Pretzel Sticks';

INSERT INTO product_prices (product_id, store_id, price, on_sale)
SELECT p.id, v.store_id, v.price, v.on_sale FROM products p
CROSS JOIN LATERAL (VALUES
  ('aldi', 2.29, false), ('albert_heijn', 2.99, false), ('carrefour', 2.69, false),
  ('colruyt', 2.49, true), ('jumbo', 2.89, false), ('lidl', 2.19, false)
) AS v(store_id, price, on_sale) WHERE p.name = 'Edamame Frozen';

INSERT INTO product_prices (product_id, store_id, price, on_sale)
SELECT p.id, v.store_id, v.price, v.on_sale FROM products p
CROSS JOIN LATERAL (VALUES
  ('aldi', 1.59, false), ('albert_heijn', 2.19, false), ('carrefour', 1.99, false),
  ('colruyt', 1.89, false), ('jumbo', 2.09, false), ('lidl', 1.49, true)
) AS v(store_id, price, on_sale) WHERE p.name = 'Aloe Vera Drink';

INSERT INTO product_prices (product_id, store_id, price, on_sale)
SELECT p.id, v.store_id, v.price, v.on_sale FROM products p
CROSS JOIN LATERAL (VALUES
  ('aldi', 1.09, false), ('albert_heijn', 1.59, false), ('carrefour', 1.39, false),
  ('colruyt', 1.29, false), ('jumbo', 1.49, false), ('lidl', 0.99, false)
) AS v(store_id, price, on_sale) WHERE p.name = 'Facial Tissue Box';

INSERT INTO product_prices (product_id, store_id, price, on_sale)
SELECT p.id, v.store_id, v.price, v.on_sale FROM products p
CROSS JOIN LATERAL (VALUES
  ('aldi', 1.99, false), ('albert_heijn', 2.79, true), ('carrefour', 2.49, false),
  ('colruyt', 2.29, false), ('jumbo', 2.69, false), ('lidl', 1.89, false)
) AS v(store_id, price, on_sale) WHERE p.name = 'Hand Cream';

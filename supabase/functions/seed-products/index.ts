import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const STORES = ["aldi", "albert_heijn", "carrefour", "colruyt", "jumbo", "lidl", "delhaize"];

// Price ranges by category [min, max] in EUR
const PRICE_RANGES: Record<string, [number, number]> = {
  "Fruits & Vegetables": [0.49, 6.99],
  "Dairy & Eggs": [0.59, 8.99],
  "Meat & Seafood": [1.99, 24.99],
  "Bakery": [0.69, 5.99],
  "Pantry": [0.39, 12.99],
  "Beverages": [0.29, 9.99],
  "Snacks": [0.79, 7.99],
  "Frozen": [1.49, 12.99],
  "Household": [0.99, 14.99],
  "Personal Care": [0.99, 12.99],
};

// Store price multipliers (relative to base)
const STORE_MULTIPLIERS: Record<string, [number, number]> = {
  aldi: [0.85, 0.95],
  lidl: [0.84, 0.94],
  colruyt: [0.90, 1.00],
  carrefour: [0.95, 1.08],
  albert_heijn: [0.98, 1.12],
  jumbo: [0.96, 1.10],
  delhaize: [1.00, 1.15],
};

const BRANDS: Record<string, string[]> = {
  "Fruits & Vegetables": ["Bio Village", "Nature's Best", "Green Garden", "Farm Fresh", "Everyday", "Boni", "365", "AH Bio", "Carrefour Bio", "Colruyt Eco", "Local Harvest", "Sun Ripe", "Golden Fields"],
  "Dairy & Eggs": ["Campina", "Danone", "Alpro", "Boni", "Everyday", "AH", "Président", "Philadelphia", "Arla", "Milka", "Zottegem", "Lactel", "Vache Bleue", "Bridel", "Elle & Vire"],
  "Meat & Seafood": ["Boni", "Everyday", "Imperial", "Herta", "Aoste", "Come a Casa", "Père Dodu", "Fleury Michon", "AH", "Farm Fresh", "North Sea", "Ocean Best", "Belgian Farms"],
  "Bakery": ["Harry's", "Jacquet", "Boni", "Everyday", "AH", "Délifrance", "Pain Quotidien", "Colruyt", "Golden Crust", "La Boulangère", "Vandemoortele"],
  "Pantry": ["Heinz", "Barilla", "De Cecco", "Boni", "Everyday", "AH", "Knorr", "Maggi", "Devos Lemmens", "Uncle Ben's", "Buitoni", "Panzani", "Lotus", "Calvé", "Lesieur"],
  "Beverages": ["Coca-Cola", "Pepsi", "Spa", "Chaudfontaine", "Lipton", "Fuze Tea", "Fanta", "Tropicana", "Innocent", "AH", "Boni", "Everyday", "Schweppes", "Red Bull", "Capri-Sun"],
  "Snacks": ["Lay's", "Doritos", "Pringles", "Côte d'Or", "Leonidas", "LU", "Lotus", "Boni", "Everyday", "AH", "Liga", "Sultana", "Griesson", "Chio"],
  "Frozen": ["Iglo", "McCain", "Dr. Oetker", "Boni", "Everyday", "AH", "Come a Casa", "Marie", "Findus", "Magnum", "Ben & Jerry's", "Häagen-Dazs"],
  "Household": ["Dreft", "Vanish", "Cillit Bang", "Ajax", "Cif", "Swiffer", "Boni", "Everyday", "AH", "Scottex", "Lotus", "Fairy", "Sun", "Finish"],
  "Personal Care": ["Dove", "Nivea", "Gillette", "Oral-B", "Colgate", "Head & Shoulders", "Boni", "Everyday", "AH", "Sanex", "Dettol", "Always", "Pampers"],
};

const PRODUCTS_DATA: Record<string, { names: string[]; units: string[] }> = {
  "Fruits & Vegetables": {
    names: [
      "Red Apples", "Green Apples", "Pink Lady Apples", "Granny Smith Apples", "Fuji Apples", "Royal Gala Apples",
      "Bananas", "Organic Bananas", "Baby Bananas", "Plantains",
      "Oranges", "Blood Oranges", "Navel Oranges", "Mandarins", "Clementines", "Tangerines", "Satsumas",
      "Lemons", "Limes", "Grapefruit", "Pomelo",
      "Strawberries", "Blueberries", "Raspberries", "Blackberries", "Cranberries", "Redcurrants", "Gooseberries",
      "Grapes Red", "Grapes White", "Grapes Black",
      "Watermelon", "Cantaloupe", "Honeydew Melon", "Galia Melon",
      "Pineapple", "Mango", "Papaya", "Kiwi", "Passion Fruit", "Dragon Fruit", "Lychee", "Pomegranate",
      "Peaches", "Nectarines", "Plums", "Apricots", "Cherries", "Figs",
      "Pears Conference", "Pears Williams", "Pears Doyenné",
      "Avocado", "Avocado Hass", "Avocado Ready-to-Eat",
      "Tomatoes", "Cherry Tomatoes", "Plum Tomatoes", "Beef Tomatoes", "Vine Tomatoes", "Sun-dried Tomatoes",
      "Cucumber", "Mini Cucumbers",
      "Bell Pepper Red", "Bell Pepper Yellow", "Bell Pepper Green", "Bell Pepper Orange", "Mixed Bell Peppers",
      "Chili Peppers Red", "Chili Peppers Green", "Jalapeños", "Habanero Peppers",
      "Onions Yellow", "Onions Red", "Onions White", "Spring Onions", "Shallots", "Leek",
      "Garlic", "Garlic Peeled", "Ginger",
      "Potatoes", "Baby Potatoes", "Sweet Potatoes", "Baking Potatoes", "Red Potatoes",
      "Carrots", "Baby Carrots", "Parsnips", "Turnips", "Beetroot", "Celeriac", "Radishes",
      "Broccoli", "Cauliflower", "Brussels Sprouts", "Cabbage White", "Cabbage Red", "Savoy Cabbage",
      "Lettuce Iceberg", "Lettuce Romaine", "Lettuce Butterhead", "Lettuce Little Gem", "Mixed Salad Leaves",
      "Spinach Fresh", "Baby Spinach", "Rocket (Arugula)", "Kale", "Chard",
      "Courgettes (Zucchini)", "Aubergine (Eggplant)", "Asparagus Green", "Asparagus White",
      "Green Beans", "Sugar Snap Peas", "Mange Tout",
      "Mushrooms White", "Mushrooms Chestnut", "Mushrooms Portobello", "Shiitake Mushrooms", "Oyster Mushrooms",
      "Corn on the Cob", "Baby Corn",
      "Fennel", "Artichoke", "Celery", "Pak Choi", "Bean Sprouts",
      "Fresh Herbs Basil", "Fresh Herbs Coriander", "Fresh Herbs Parsley", "Fresh Herbs Mint", "Fresh Herbs Rosemary", "Fresh Herbs Thyme",
      "Coconut Fresh", "Dates Fresh", "Rhubarb",
      "Mixed Fruit Bowl", "Prepared Fruit Salad", "Stir-Fry Vegetables Mix", "Soup Vegetables Mix",
      "Organic Carrots", "Organic Tomatoes", "Organic Spinach", "Organic Potatoes",
    ],
    units: ["per kg", "per 500g", "per piece", "per bunch", "per pack", "per 250g", "per net"],
  },
  "Dairy & Eggs": {
    names: [
      "Whole Milk 1L", "Semi-Skimmed Milk 1L", "Skimmed Milk 1L", "Whole Milk 2L", "Semi-Skimmed Milk 2L",
      "Lactose-Free Milk 1L", "Chocolate Milk 1L", "Strawberry Milk 500ml",
      "Oat Milk 1L", "Almond Milk 1L", "Soy Milk 1L", "Coconut Milk 1L", "Rice Milk 1L",
      "Buttermilk 1L", "Kefir 500ml", "Acidophilus Milk 1L",
      "Butter Unsalted 250g", "Butter Salted 250g", "Butter Roll 500g", "Cooking Butter",
      "Margarine 500g", "Light Spread 500g",
      "Cream Cheese 200g", "Cream Cheese Light", "Cream Cheese Herbs",
      "Natural Yogurt 500g", "Greek Yogurt 500g", "Greek Yogurt 0%", "Skyr Natural",
      "Fruit Yogurt Strawberry", "Fruit Yogurt Peach", "Fruit Yogurt Blueberry", "Fruit Yogurt Mixed Berry",
      "Drinking Yogurt Natural", "Drinking Yogurt Strawberry",
      "Crème Fraîche 200ml", "Sour Cream 200ml", "Whipping Cream 250ml", "Cooking Cream 250ml",
      "Eggs Free Range 6", "Eggs Free Range 10", "Eggs Free Range 12", "Eggs Organic 6", "Eggs Organic 10",
      "Eggs Barn 12", "Eggs Large 15", "Quail Eggs 12",
      "Gouda Cheese Young 400g", "Gouda Cheese Matured 400g", "Gouda Cheese Old 400g", "Gouda Cheese Sliced",
      "Emmental Cheese 200g", "Gruyère Cheese 200g", "Comté Cheese 200g",
      "Cheddar Cheese Block", "Cheddar Cheese Sliced", "Cheddar Cheese Grated",
      "Mozzarella Ball 125g", "Mozzarella Grated 200g", "Mozzarella Burrata",
      "Parmesan Cheese 200g", "Parmesan Grated 100g", "Pecorino 150g",
      "Brie 200g", "Camembert 250g", "Blue Cheese 150g", "Roquefort 100g",
      "Feta Cheese 200g", "Halloumi 250g", "Ricotta 250g", "Mascarpone 250g",
      "Cheese Spread Plain", "Cheese Spread Herbs", "Cheese Cubes for Salad",
      "Cottage Cheese 200g", "Cottage Cheese Light",
      "Whipped Cream Spray 250ml", "Custard 500ml", "Chocolate Pudding 4-pack",
      "Rice Pudding 500g", "Panna Cotta 2-pack", "Tiramisu 2-pack",
      "Fresh Pasta Sheets", "Fresh Ravioli Ricotta", "Fresh Tortellini",
    ],
    units: ["per piece", "per pack", "per 500g", "per liter", "per 200g", "per 250g", "per 125g", "per 400g"],
  },
  "Meat & Seafood": {
    names: [
      "Chicken Breast Fillet", "Chicken Thigh Fillet", "Chicken Drumsticks", "Chicken Wings",
      "Whole Chicken", "Chicken Minced 500g", "Chicken Satay Skewers", "Chicken Escalope",
      "Turkey Breast Fillet", "Turkey Minced 500g", "Turkey Escalope", "Turkey Leg",
      "Pork Chops", "Pork Tenderloin", "Pork Belly", "Pork Shoulder Roast",
      "Pork Minced 500g", "Pork Sausages 6-pack", "Pork Ribs", "Pork Escalope",
      "Beef Steak Sirloin", "Beef Steak Ribeye", "Beef Steak Filet Mignon",
      "Beef Minced 500g", "Beef Minced Lean 500g", "Beef Stewing Cubes", "Beef Roast",
      "Beef Burger Patties 4-pack", "Beef Tartare 200g", "Beef Carpaccio 100g",
      "Lamb Chops", "Lamb Leg Roast", "Lamb Minced 500g", "Lamb Shoulder",
      "Veal Escalope", "Veal Minced 500g", "Veal Stewing Cubes",
      "Mixed Minced Meat 500g", "Mixed Minced Meat 1kg",
      "Bacon Smoked 200g", "Bacon Unsmoked 200g", "Bacon Strips 150g", "Pancetta 100g",
      "Ham Sliced 200g", "Ham Cooked 200g", "Parma Ham 100g", "Serrano Ham 100g",
      "Salami Milano 150g", "Chorizo 200g", "Mortadella 150g",
      "Sausage Bratwurst 4-pack", "Sausage Merguez 6-pack", "Sausage Chipolata 8-pack",
      "Boudin Blanc 4-pack", "Boudin Noir 4-pack",
      "Salmon Fillet Fresh", "Salmon Fillet Smoked 100g", "Salmon Steak",
      "Cod Fillet Fresh", "Cod Fillet Frozen 400g",
      "Tuna Steak Fresh", "Shrimp Raw 200g", "Shrimp Cooked 200g", "Shrimp Cocktail",
      "Mussels Fresh 1kg", "Mussels Cooked 500g",
      "Sea Bass Fillet", "Sole Fillet", "Haddock Fillet", "Mackerel Fillet",
      "Trout Whole", "Sardines Fresh",
      "Crab Meat 200g", "Lobster Tail", "Scallops 200g", "Calamari Rings 300g",
      "Fish Fingers 10-pack", "Fish Cakes 4-pack",
      "Organic Chicken Breast", "Organic Beef Minced 500g", "Organic Pork Sausages",
      "Marinated Chicken Tikka", "Marinated Pork Souvlaki", "BBQ Chicken Drumsticks",
    ],
    units: ["per kg", "per 500g", "per pack", "per piece", "per 200g", "per 100g", "per 4-pack"],
  },
  "Bakery": {
    names: [
      "White Bread Sliced", "Wholemeal Bread Sliced", "Multigrain Bread Sliced",
      "Sourdough Bread", "Rye Bread", "Pumpernickel Bread",
      "Baguette", "Baguette Multigrain", "Ciabatta", "Focaccia",
      "Croissants 4-pack", "Croissants Butter 6-pack", "Pain au Chocolat 4-pack", "Pain aux Raisins 4-pack",
      "Brioche", "Brioche Rolls 6-pack", "Milk Bread",
      "Pita Bread 6-pack", "Naan Bread 2-pack", "Tortilla Wraps 6-pack", "Tortilla Wraps 8-pack",
      "Bagels Plain 4-pack", "Bagels Sesame 4-pack", "English Muffins 4-pack",
      "Sandwich Rolls 6-pack", "Burger Buns 4-pack", "Hot Dog Rolls 6-pack",
      "Crackers Plain", "Crackers Wholemeal", "Rice Cakes Plain", "Rice Cakes Chocolate",
      "Crispbread Rye", "Breadsticks",
      "Toast Bread", "Toast Bread Multigrain",
      "Pancakes 8-pack", "Waffles Belgian 4-pack", "Waffles Liège 6-pack",
      "Cake Chocolate", "Cake Carrot", "Cake Lemon",
      "Muffins Chocolate 4-pack", "Muffins Blueberry 4-pack",
      "Danish Pastry 4-pack", "Cinnamon Rolls 4-pack", "Apple Turnover 2-pack",
      "Cookies Chocolate Chip 200g", "Cookies Oat 200g", "Shortbread 150g",
      "Gingerbread (Speculoos)", "Stroopwafels 8-pack",
      "Granola Bar 6-pack", "Energy Balls 5-pack",
      "Bread Rolls White 6", "Bread Rolls Brown 6", "Bread Rolls Sesame 6",
      "Pizza Dough Fresh", "Puff Pastry Sheet", "Shortcrust Pastry Sheet",
      "Filo Pastry", "Spring Roll Wrappers",
      "Gluten-Free Bread", "Gluten-Free Rolls 4-pack",
    ],
    units: ["per piece", "per pack", "per loaf", "per 4-pack", "per 6-pack", "per 200g"],
  },
  "Pantry": {
    names: [
      "Spaghetti 500g", "Penne 500g", "Fusilli 500g", "Macaroni 500g", "Tagliatelle 500g", "Farfalle 500g",
      "Lasagne Sheets", "Noodles Egg 500g", "Noodles Rice 400g", "Noodles Udon 300g", "Noodles Ramen 5-pack",
      "Basmati Rice 1kg", "Jasmine Rice 1kg", "Long Grain Rice 1kg", "Brown Rice 1kg", "Risotto Rice 500g", "Sushi Rice 500g",
      "Couscous 500g", "Quinoa 400g", "Bulgur Wheat 500g", "Polenta 500g",
      "Flour All-Purpose 1kg", "Flour Self-Raising 1kg", "Flour Bread 1kg", "Flour Wholemeal 1kg",
      "Sugar White 1kg", "Sugar Brown 500g", "Sugar Icing 250g", "Sugar Cane 1kg",
      "Olive Oil Extra Virgin 500ml", "Olive Oil 1L", "Sunflower Oil 1L", "Coconut Oil 500ml", "Rapeseed Oil 1L",
      "Vinegar White 500ml", "Vinegar Apple Cider 500ml", "Vinegar Balsamic 250ml", "Vinegar Red Wine 500ml",
      "Salt Fine 1kg", "Salt Sea 500g", "Pepper Black Ground 50g", "Pepper Black Whole 50g",
      "Tomato Sauce 500g", "Tomato Passata 500g", "Tomato Paste 200g", "Chopped Tomatoes 400g", "Peeled Tomatoes 400g",
      "Ketchup 500ml", "Mustard Dijon 200g", "Mustard Wholegrain 200g", "Mayonnaise 500ml", "Mayonnaise Light 500ml",
      "Soy Sauce 250ml", "Worcestershire Sauce 250ml", "Hot Sauce 150ml", "BBQ Sauce 350ml",
      "Pesto Green 190g", "Pesto Red 190g", "Pasta Sauce Bolognese 400g", "Pasta Sauce Arrabbiata 400g",
      "Honey 350g", "Maple Syrup 250ml", "Golden Syrup 450g", "Nutella 400g", "Peanut Butter 350g", "Almond Butter 350g",
      "Jam Strawberry 450g", "Jam Apricot 450g", "Jam Raspberry 450g", "Marmalade Orange 450g",
      "Canned Tuna in Oil 200g", "Canned Tuna in Water 200g", "Canned Sardines 125g", "Canned Mackerel 125g",
      "Canned Chickpeas 400g", "Canned Kidney Beans 400g", "Canned White Beans 400g", "Canned Lentils 400g",
      "Canned Corn 340g", "Canned Peas 400g", "Canned Mixed Vegetables 400g",
      "Canned Soup Tomato", "Canned Soup Chicken", "Canned Soup Mushroom",
      "Chicken Stock Cubes", "Beef Stock Cubes", "Vegetable Stock Cubes",
      "Baking Powder 100g", "Baking Soda 250g", "Vanilla Extract 50ml", "Yeast Dried 7g 5-pack",
      "Coconut Milk 400ml", "Coconut Cream 200ml",
      "Corn Flakes 500g", "Muesli 500g", "Granola 500g", "Oats Rolled 500g", "Oats Instant 500g",
      "Porridge Sachets 10-pack",
      "Tea Black 20 bags", "Tea Green 20 bags", "Tea Herbal 20 bags", "Tea Earl Grey 20 bags",
      "Coffee Ground 250g", "Coffee Beans 500g", "Coffee Instant 200g", "Coffee Pods 10-pack", "Coffee Capsules 10-pack",
      "Cocoa Powder 250g", "Hot Chocolate Mix 400g",
      "Dried Pasta Soup Mix", "Cup Noodles", "Instant Mashed Potato",
      "Breadcrumbs 200g", "Panko Breadcrumbs 200g",
      "Curry Powder 50g", "Paprika Sweet 50g", "Cumin Ground 50g", "Cinnamon Ground 50g", "Turmeric 50g",
      "Mixed Herbs 20g", "Italian Seasoning 20g", "Chili Flakes 30g",
      "Canned Pineapple 425g", "Canned Peaches 425g", "Canned Fruit Cocktail 425g",
      "Dried Cranberries 200g", "Raisins 250g", "Dried Apricots 200g",
      "Walnuts 200g", "Cashews 200g", "Mixed Nuts 300g", "Peanuts Roasted 300g", "Pistachios 200g",
      "Sunflower Seeds 200g", "Pumpkin Seeds 200g", "Chia Seeds 200g", "Flax Seeds 200g",
    ],
    units: ["per pack", "per bottle", "per 500g", "per 1kg", "per 250ml", "per piece", "per tin", "per jar"],
  },
  "Beverages": {
    names: [
      "Coca-Cola 1.5L", "Coca-Cola 6x330ml", "Coca-Cola Zero 1.5L", "Coca-Cola Zero 6x330ml",
      "Pepsi 1.5L", "Pepsi Max 1.5L", "7Up 1.5L", "7Up 6x330ml",
      "Fanta Orange 1.5L", "Fanta Lemon 1.5L", "Sprite 1.5L",
      "Schweppes Tonic 1L", "Schweppes Ginger Ale 1L",
      "Still Water 1.5L", "Still Water 6x1.5L", "Sparkling Water 1.5L", "Sparkling Water 6x1.5L",
      "Spa Reine 1L", "Spa Barisart 1L", "Chaudfontaine Still 1L", "Chaudfontaine Sparkling 1L",
      "Orange Juice 1L", "Orange Juice Fresh 1L", "Orange Juice No Pulp 1L",
      "Apple Juice 1L", "Multivitamin Juice 1L", "Grape Juice 1L", "Cranberry Juice 1L",
      "Tomato Juice 1L", "Carrot Juice 750ml", "Beetroot Juice 750ml",
      "Smoothie Strawberry Banana 250ml", "Smoothie Green 250ml", "Smoothie Mango 250ml",
      "Lipton Ice Tea Peach 1.5L", "Lipton Ice Tea Lemon 1.5L", "Fuze Tea Green 1.5L",
      "Energy Drink 250ml", "Energy Drink 4x250ml", "Energy Drink Sugar-Free 250ml",
      "Red Bull 250ml", "Red Bull 4x250ml", "Monster Energy 500ml",
      "Capri-Sun 10-pack", "Fruit Shoot 4-pack",
      "Tonic Water 4x200ml", "Ginger Beer 4x330ml", "Bitter Lemon 4x200ml",
      "Coconut Water 330ml", "Aloe Vera Drink 500ml",
      "Beer Lager 6x330ml", "Beer Lager 12x330ml", "Beer Pilsner 6x250ml",
      "Beer Wheat 6x330ml", "Beer Blonde 6x330ml", "Beer Tripel 330ml", "Beer IPA 330ml",
      "Beer Leffe Blonde 6x330ml", "Beer Duvel 330ml", "Beer Chimay Blue 330ml",
      "Beer Jupiler 6x330ml", "Beer Stella Artois 6x330ml", "Beer Maes 6x330ml",
      "Wine Red Cabernet 750ml", "Wine Red Merlot 750ml", "Wine Red Pinot Noir 750ml",
      "Wine White Chardonnay 750ml", "Wine White Sauvignon Blanc 750ml", "Wine White Pinot Grigio 750ml",
      "Wine Rosé 750ml", "Prosecco 750ml", "Champagne 750ml", "Cava 750ml",
      "Cider Apple 330ml", "Cider Pear 330ml",
      "Hot Chocolate Pods 8-pack", "Latte Pods 10-pack",
      "Kombucha Original 330ml", "Kombucha Ginger 330ml",
      "Syrup Grenadine 750ml", "Syrup Elderflower 500ml", "Syrup Lemon 500ml",
    ],
    units: ["per bottle", "per pack", "per can", "per 6-pack", "per liter", "per 330ml", "per 1.5L"],
  },
  "Snacks": {
    names: [
      "Potato Chips Natural 200g", "Potato Chips Paprika 200g", "Potato Chips Salt & Vinegar 200g",
      "Potato Chips Cheese & Onion 200g", "Potato Chips BBQ 200g",
      "Tortilla Chips 200g", "Tortilla Chips Chili 200g", "Nachos Cheese 200g",
      "Pringles Original 165g", "Pringles Sour Cream 165g", "Pringles Paprika 165g",
      "Popcorn Sweet 100g", "Popcorn Salty 100g", "Popcorn Caramel 100g", "Microwave Popcorn 3-pack",
      "Pretzels 200g", "Pretzels Sticks 200g", "Breadsticks Grissini",
      "Mixed Nuts 200g", "Cashews Salted 150g", "Peanuts Salted 300g", "Peanuts Honey Roasted 200g",
      "Trail Mix 200g", "Dried Mango 100g", "Dried Banana Chips 150g",
      "Rice Crackers 100g", "Rice Crackers Wasabi 100g",
      "Chocolate Bar Milk 200g", "Chocolate Bar Dark 200g", "Chocolate Bar White 200g",
      "Chocolate Box Pralines 200g", "Chocolate Truffles 150g",
      "Côte d'Or Milk 200g", "Côte d'Or Dark 200g", "Côte d'Or Nuts 200g",
      "Chocolate Biscuits 200g", "Speculoos Biscuits 250g", "Butter Biscuits 200g",
      "Oreo Cookies 154g", "Oreo Double Stuff 157g",
      "Wafer Bars 5-pack", "Kit Kat 4-pack", "Twix 4-pack", "Mars 4-pack", "Snickers 4-pack",
      "M&M's Peanut 200g", "M&M's Chocolate 200g", "Smarties 150g",
      "Gummy Bears 250g", "Wine Gums 250g", "Liquorice 250g", "Sour Candy 200g",
      "Fruit Pastilles 200g", "Jelly Beans 200g",
      "Cereal Bars 6-pack", "Granola Bars Chocolate 5-pack", "Protein Bar 50g",
      "Hummus Classic 200g", "Hummus Red Pepper 200g", "Guacamole 200g", "Tzatziki 200g",
      "Salsa Mild 300g", "Salsa Hot 300g",
      "Cheese Straws 100g", "Mini Cheddars 150g",
      "Beef Jerky 50g", "Turkey Jerky 50g",
      "Energy Balls Dates 150g", "Fruit Bar 5-pack",
      "Olives Green 200g", "Olives Black 200g", "Olives Stuffed 200g",
      "Crisps Vegetable 100g", "Lentil Chips 100g",
    ],
    units: ["per pack", "per 200g", "per 150g", "per 100g", "per bag", "per box"],
  },
  "Frozen": {
    names: [
      "Frozen Peas 1kg", "Frozen Green Beans 750g", "Frozen Spinach 450g", "Frozen Broccoli 750g",
      "Frozen Mixed Vegetables 1kg", "Frozen Corn 750g", "Frozen Stir-Fry Mix 600g",
      "Frozen Strawberries 500g", "Frozen Blueberries 300g", "Frozen Raspberries 300g", "Frozen Mango Chunks 500g",
      "Frozen Mixed Berries 500g", "Frozen Smoothie Mix 400g",
      "Frozen French Fries 1kg", "Frozen French Fries Oven 1kg", "Frozen Wedges 750g",
      "Frozen Croquettes 750g", "Frozen Hash Browns 750g",
      "Frozen Pizza Margherita", "Frozen Pizza Pepperoni", "Frozen Pizza 4 Cheese", "Frozen Pizza Veggie",
      "Frozen Pizza Mini 9-pack", "Frozen Calzone",
      "Frozen Fish Fingers 10-pack", "Frozen Fish Fillets Breaded 4-pack",
      "Frozen Cod Fillets 400g", "Frozen Salmon Fillets 400g", "Frozen Shrimp 400g",
      "Frozen Chicken Nuggets 500g", "Frozen Chicken Strips 400g", "Frozen Chicken Kiev 2-pack",
      "Frozen Burger Patties 4-pack", "Frozen Meatballs 750g",
      "Frozen Lasagne 1kg", "Frozen Moussaka 750g", "Frozen Shepherd's Pie 750g",
      "Frozen Spring Rolls 10-pack", "Frozen Samosas 8-pack", "Frozen Dim Sum 12-pack",
      "Frozen Gyoza 10-pack", "Frozen Falafel 12-pack",
      "Frozen Bread Dough 500g", "Frozen Croissants 6-pack", "Frozen Garlic Bread",
      "Ice Cream Vanilla 1L", "Ice Cream Chocolate 1L", "Ice Cream Strawberry 1L",
      "Ice Cream Ben & Jerry's Cookie Dough 465ml", "Ice Cream Häagen-Dazs Vanilla 460ml",
      "Ice Cream Magnum Classic 4-pack", "Ice Cream Magnum Almond 4-pack",
      "Ice Cream Cornetto 6-pack", "Ice Lollies 8-pack",
      "Frozen Waffles 10-pack", "Frozen Pancakes 12-pack",
      "Frozen Puff Pastry", "Frozen Filo Pastry",
      "Frozen Soup Tomato 600ml", "Frozen Soup Butternut 600ml",
      "Frozen Ready Meal Curry 400g", "Frozen Ready Meal Pasta 400g", "Frozen Ready Meal Thai 400g",
      "Frozen Baguettes 2-pack", "Frozen Ciabatta 2-pack",
    ],
    units: ["per pack", "per kg", "per 500g", "per piece", "per 750g", "per 4-pack", "per 1L"],
  },
  "Household": {
    names: [
      "Toilet Paper 8 rolls", "Toilet Paper 12 rolls", "Toilet Paper 24 rolls",
      "Kitchen Roll 2-pack", "Kitchen Roll 4-pack",
      "Tissues Box 100", "Tissues Pocket 10-pack",
      "Bin Bags 20L 20-pack", "Bin Bags 30L 20-pack", "Bin Bags 60L 10-pack",
      "Cling Film 30m", "Aluminium Foil 10m", "Baking Paper 10m",
      "Freezer Bags Small 50-pack", "Freezer Bags Large 30-pack", "Zip Lock Bags 20-pack",
      "Washing Up Liquid 500ml", "Washing Up Liquid 1L",
      "Dishwasher Tablets 30-pack", "Dishwasher Tablets All-in-1 40-pack", "Dishwasher Rinse Aid 500ml", "Dishwasher Salt 1kg",
      "Laundry Detergent Liquid 1.5L", "Laundry Detergent Powder 2kg", "Laundry Pods 30-pack",
      "Fabric Softener 1.5L", "Fabric Softener Sheets 40-pack",
      "Stain Remover Spray 500ml", "Stain Remover Powder 500g",
      "All-Purpose Cleaner 750ml", "All-Purpose Cleaner 1L",
      "Bathroom Cleaner 750ml", "Toilet Cleaner 750ml", "Toilet Cleaner Bleach 750ml",
      "Glass Cleaner 750ml", "Kitchen Cleaner Spray 750ml",
      "Floor Cleaner 1L", "Floor Cleaner All Surfaces 1.5L",
      "Bleach 1L", "Disinfectant Spray 500ml",
      "Sponges 5-pack", "Scouring Pads 3-pack", "Microfibre Cloths 3-pack",
      "Rubber Gloves M", "Rubber Gloves L",
      "Mop Refill", "Broom Head",
      "Air Freshener Spray 300ml", "Air Freshener Plug-In Refill", "Scented Candle",
      "Matches 3-box", "Lighter",
      "Batteries AA 4-pack", "Batteries AAA 4-pack", "Batteries AA 8-pack",
      "Light Bulb LED E27", "Light Bulb LED E14",
      "Candles Household 10-pack", "Tea Lights 50-pack",
      "Insect Repellent Spray", "Ant Killer",
      "Pet Food Cat Pouches 12-pack", "Pet Food Dog Tin 400g", "Cat Litter 10L",
      "Plant Food Liquid 500ml",
    ],
    units: ["per pack", "per piece", "per bottle", "per roll", "per box"],
  },
  "Personal Care": {
    names: [
      "Shower Gel 250ml", "Shower Gel 500ml", "Shower Gel Men 250ml",
      "Body Wash Sensitive 400ml", "Body Wash Moisturising 400ml",
      "Shampoo Normal 250ml", "Shampoo Anti-Dandruff 250ml", "Shampoo Dry Hair 250ml",
      "Shampoo Coloured Hair 250ml", "Shampoo 2-in-1 250ml",
      "Conditioner 250ml", "Conditioner Deep Repair 200ml",
      "Hair Mask 200ml", "Hair Oil 100ml", "Hair Spray 250ml", "Hair Gel 200ml",
      "Toothpaste 75ml", "Toothpaste Whitening 75ml", "Toothpaste Sensitive 75ml",
      "Toothpaste Kids 50ml",
      "Toothbrush Medium", "Toothbrush Soft", "Toothbrush Electric Refill 2-pack",
      "Mouthwash 500ml", "Dental Floss 50m",
      "Deodorant Roll-On 50ml", "Deodorant Spray 150ml", "Deodorant Stick 50g",
      "Deodorant Men Roll-On 50ml", "Deodorant Men Spray 150ml",
      "Face Wash 150ml", "Face Cream Day 50ml", "Face Cream Night 50ml",
      "Face Mask Sheet 1-pack", "Facial Scrub 150ml",
      "Body Lotion 400ml", "Body Lotion Dry Skin 250ml", "Hand Cream 100ml",
      "Lip Balm", "Sun Cream SPF30 200ml", "Sun Cream SPF50 200ml", "After Sun 200ml",
      "Razor Disposable 5-pack", "Razor Blades Refill 4-pack", "Shaving Cream 200ml", "Shaving Gel 200ml",
      "Soap Bar 100g", "Soap Bar Pack 3-pack", "Liquid Soap 300ml", "Liquid Soap Refill 500ml",
      "Cotton Pads 100-pack", "Cotton Buds 200-pack",
      "Wet Wipes 80-pack", "Baby Wipes 64-pack", "Makeup Remover Wipes 25-pack",
      "Nappies Size 3 30-pack", "Nappies Size 4 28-pack", "Nappies Size 5 24-pack",
      "Sanitary Pads Regular 14-pack", "Sanitary Pads Night 10-pack", "Tampons Regular 16-pack",
      "Plasters Assorted 20-pack", "First Aid Kit",
      "Pain Relief Tablets 24-pack", "Vitamin C Tablets 60-pack", "Multivitamin Tablets 60-pack",
      "Hand Sanitizer 100ml", "Hand Sanitizer 500ml",
      "Tissue Travel Pack 10-pack",
    ],
    units: ["per piece", "per pack", "per bottle", "per tube", "per 250ml", "per 100ml"],
  },
};

function generatePrice(category: string): number {
  const range = PRICE_RANGES[category] || [0.99, 9.99];
  const base = range[0] + Math.random() * (range[1] - range[0]);
  // Round to .X9 or .X5 patterns common in grocery
  const rounded = Math.round(base * 100) / 100;
  const lastDigit = Math.round(rounded * 100) % 10;
  if (lastDigit < 5) return Math.floor(rounded * 10) / 10 + 0.09;
  return Math.floor(rounded * 10) / 10 + 0.09;
}

function storePrice(basePrice: number, storeId: string): number {
  const mult = STORE_MULTIPLIERS[storeId] || [0.95, 1.05];
  const factor = mult[0] + Math.random() * (mult[1] - mult[0]);
  const price = basePrice * factor;
  return Math.round(price * 100) / 100;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    let batchNum = 0;
    let targetTotal = 5000;
    try {
      const body = await req.json();
      batchNum = body.batch || 0;
      targetTotal = body.target || 5000;
    } catch {}

    // Get current product count
    const { count: currentCount } = await supabase
      .from("products")
      .select("*", { count: "exact", head: true });

    const remaining = targetTotal - (currentCount || 0);
    if (remaining <= 0) {
      return new Response(
        JSON.stringify({ success: true, done: true, message: `Already have ${currentCount} products`, total: currentCount }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get existing product names to avoid duplicates
    const { data: existingProducts } = await supabase
      .from("products")
      .select("name")
      .order("name");
    const existingNames = new Set((existingProducts || []).map((p: any) => p.name.toLowerCase()));

    // Build product list from template
    const allNewProducts: { name: string; category: string; unit: string; brand: string }[] = [];
    const categories = Object.keys(PRODUCTS_DATA);

    for (const category of categories) {
      const { names, units } = PRODUCTS_DATA[category];
      const brands = BRANDS[category] || ["Generic"];

      for (const name of names) {
        for (const brand of brands) {
          const fullName = `${brand} ${name}`;
          if (!existingNames.has(fullName.toLowerCase()) && !existingNames.has(name.toLowerCase())) {
            const unit = units[Math.floor(Math.random() * units.length)];
            allNewProducts.push({ name: fullName, category, unit, brand });
          }
          if (allNewProducts.length >= remaining) break;
        }
        if (allNewProducts.length >= remaining) break;
      }
      if (allNewProducts.length >= remaining) break;
    }

    // If we still need more, create size/variant combos
    if (allNewProducts.length < remaining) {
      const sizes = ["Small", "Medium", "Large", "XL", "Family Size", "Economy", "Value", "Premium", "Organic", "Light", "Extra", "Classic", "Original", "Special Edition"];
      for (const category of categories) {
        const { names, units } = PRODUCTS_DATA[category];
        const brands = BRANDS[category] || ["Generic"];
        for (const size of sizes) {
          for (const name of names) {
            const brand = brands[Math.floor(Math.random() * brands.length)];
            const fullName = `${brand} ${name} ${size}`;
            if (!existingNames.has(fullName.toLowerCase())) {
              const unit = units[Math.floor(Math.random() * units.length)];
              allNewProducts.push({ name: fullName, category, unit, brand });
            }
            if (allNewProducts.length >= remaining) break;
          }
          if (allNewProducts.length >= remaining) break;
        }
        if (allNewProducts.length >= remaining) break;
      }
    }

    // Process in batch of 200
    const BATCH_SIZE = 200;
    const startIdx = batchNum * BATCH_SIZE;
    const batch = allNewProducts.slice(startIdx, startIdx + BATCH_SIZE);

    if (batch.length === 0) {
      return new Response(
        JSON.stringify({ success: true, done: true, message: "No more products to add", total: currentCount }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Insert products
    const productInserts = batch.map(p => ({
      name: p.name,
      category: p.category,
      unit: p.unit,
      brand: p.brand,
      image: null,
    }));

    const { data: inserted, error: insertErr } = await supabase
      .from("products")
      .insert(productInserts)
      .select("id, name, category");

    if (insertErr) {
      console.error("Insert error:", insertErr);
      return new Response(
        JSON.stringify({ success: false, error: insertErr.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate prices for all stores
    const priceInserts: any[] = [];
    for (const product of (inserted || [])) {
      const basePrice = generatePrice(product.category);
      for (const store of STORES) {
        priceInserts.push({
          product_id: product.id,
          store_id: store,
          price: storePrice(basePrice, store),
          on_sale: Math.random() < 0.08, // 8% chance of sale
          scraped_at: new Date().toISOString(),
        });
      }
    }

    // Insert prices in chunks of 500
    for (let i = 0; i < priceInserts.length; i += 500) {
      const chunk = priceInserts.slice(i, i + 500);
      const { error: priceErr } = await supabase
        .from("product_prices")
        .insert(chunk);
      if (priceErr) {
        console.error("Price insert error:", priceErr);
      }
    }

    const newTotal = (currentCount || 0) + (inserted || []).length;
    const hasMore = startIdx + BATCH_SIZE < allNewProducts.length && newTotal < targetTotal;

    return new Response(
      JSON.stringify({
        success: true,
        done: !hasMore,
        products_added: (inserted || []).length,
        prices_added: priceInserts.length,
        total: newTotal,
        next_batch: hasMore ? batchNum + 1 : null,
        remaining_to_generate: Math.max(0, targetTotal - newTotal),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Seed error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

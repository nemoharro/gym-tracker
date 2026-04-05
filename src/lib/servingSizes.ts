export interface ServingSize {
  label: string;
  grams: number;
}

interface ServingSizeEntry {
  keywords: string[];
  servings: ServingSize[];
}

const SERVING_SIZES: ServingSizeEntry[] = [
  // Fruits
  { keywords: ["banana"], servings: [
    { label: "Small", grams: 90 },
    { label: "Medium", grams: 120 },
    { label: "Large", grams: 135 },
  ]},
  { keywords: ["apple"], servings: [
    { label: "Small", grams: 130 },
    { label: "Medium", grams: 180 },
    { label: "Large", grams: 220 },
  ]},
  { keywords: ["orange"], servings: [
    { label: "Small", grams: 100 },
    { label: "Medium", grams: 140 },
    { label: "Large", grams: 185 },
  ]},
  { keywords: ["mango"], servings: [
    { label: "Small", grams: 150 },
    { label: "Medium", grams: 200 },
    { label: "Large", grams: 280 },
  ]},
  { keywords: ["avocado", "avo"], servings: [
    { label: "Half", grams: 75 },
    { label: "Whole", grams: 150 },
  ]},
  { keywords: ["strawberry", "strawberries"], servings: [
    { label: "1 cup", grams: 150 },
    { label: "Punnet", grams: 250 },
  ]},
  { keywords: ["blueberry", "blueberries"], servings: [
    { label: "Handful", grams: 40 },
    { label: "1 cup", grams: 150 },
    { label: "Punnet", grams: 125 },
  ]},
  { keywords: ["grapes", "grape"], servings: [
    { label: "Small bunch", grams: 75 },
    { label: "1 cup", grams: 150 },
    { label: "Large bunch", grams: 250 },
  ]},
  { keywords: ["watermelon"], servings: [
    { label: "1 slice", grams: 280 },
    { label: "2 slices", grams: 560 },
  ]},
  { keywords: ["pear"], servings: [
    { label: "Small", grams: 150 },
    { label: "Medium", grams: 180 },
    { label: "Large", grams: 230 },
  ]},
  { keywords: ["peach", "nectarine"], servings: [
    { label: "Small", grams: 100 },
    { label: "Medium", grams: 150 },
    { label: "Large", grams: 175 },
  ]},
  { keywords: ["kiwi", "kiwifruit"], servings: [
    { label: "1 kiwi", grams: 75 },
    { label: "2 kiwis", grams: 150 },
  ]},
  { keywords: ["mandarin", "tangerine"], servings: [
    { label: "1 small", grams: 75 },
    { label: "1 large", grams: 110 },
  ]},
  { keywords: ["pineapple"], servings: [
    { label: "1 slice", grams: 85 },
    { label: "1 cup", grams: 165 },
  ]},

  // Drinks
  { keywords: ["coffee", "latte", "cappuccino", "flat white", "long black"], servings: [
    { label: "Small", grams: 180 },
    { label: "Regular", grams: 250 },
    { label: "Large", grams: 350 },
  ]},
  { keywords: ["espresso", "short black"], servings: [
    { label: "Single", grams: 30 },
    { label: "Double", grams: 60 },
  ]},
  { keywords: ["protein shake", "protein smoothie"], servings: [
    { label: "1 scoop + water", grams: 330 },
    { label: "2 scoops + water", grams: 630 },
  ]},
  { keywords: ["juice", "orange juice", "apple juice"], servings: [
    { label: "Small glass", grams: 200 },
    { label: "Large glass", grams: 350 },
    { label: "Bottle", grams: 500 },
  ]},
  { keywords: ["milk", "full cream milk", "skim milk"], servings: [
    { label: "Splash", grams: 30 },
    { label: "Small glass", grams: 200 },
    { label: "Large glass", grams: 350 },
  ]},
  { keywords: ["smoothie"], servings: [
    { label: "Small", grams: 300 },
    { label: "Regular", grams: 450 },
    { label: "Large", grams: 600 },
  ]},
  { keywords: ["tea", "green tea", "black tea"], servings: [
    { label: "1 cup", grams: 250 },
    { label: "1 mug", grams: 350 },
  ]},
  { keywords: ["soft drink", "coke", "pepsi", "sprite", "fanta", "soda"], servings: [
    { label: "Can", grams: 375 },
    { label: "Bottle", grams: 600 },
  ]},
  { keywords: ["energy drink", "monster", "red bull"], servings: [
    { label: "Small can", grams: 250 },
    { label: "Large can", grams: 500 },
  ]},

  // Eggs
  { keywords: ["egg", "eggs", "boiled egg", "fried egg", "scrambled egg", "poached egg"], servings: [
    { label: "1 egg", grams: 50 },
    { label: "2 eggs", grams: 100 },
    { label: "3 eggs", grams: 150 },
  ]},

  // Bread & baked
  { keywords: ["bread", "toast", "white bread", "wholemeal bread", "sourdough"], servings: [
    { label: "1 slice", grams: 35 },
    { label: "2 slices", grams: 70 },
  ]},
  { keywords: ["wrap", "tortilla", "pita"], servings: [
    { label: "Small", grams: 40 },
    { label: "Regular", grams: 65 },
    { label: "Large", grams: 85 },
  ]},
  { keywords: ["muffin", "blueberry muffin", "choc muffin"], servings: [
    { label: "Small", grams: 60 },
    { label: "Large", grams: 130 },
  ]},
  { keywords: ["croissant"], servings: [
    { label: "Small", grams: 45 },
    { label: "Regular", grams: 65 },
    { label: "Large", grams: 85 },
  ]},
  { keywords: ["bagel"], servings: [
    { label: "Regular", grams: 85 },
    { label: "Large", grams: 110 },
  ]},
  { keywords: ["english muffin"], servings: [
    { label: "1 muffin", grams: 57 },
  ]},

  // Grains & carbs
  { keywords: ["rice", "white rice", "brown rice", "basmati", "jasmine rice"], servings: [
    { label: "Small bowl", grams: 130 },
    { label: "Medium bowl", grams: 200 },
    { label: "Large bowl", grams: 280 },
  ]},
  { keywords: ["pasta", "spaghetti", "penne", "fettuccine", "macaroni"], servings: [
    { label: "Small serve", grams: 150 },
    { label: "Medium serve", grams: 220 },
    { label: "Large serve", grams: 300 },
  ]},
  { keywords: ["oats", "porridge", "oatmeal"], servings: [
    { label: "Small (dry)", grams: 30 },
    { label: "Medium (dry)", grams: 50 },
    { label: "Large (dry)", grams: 80 },
  ]},
  { keywords: ["cereal", "weetbix", "weet-bix", "cornflakes"], servings: [
    { label: "Small bowl", grams: 30 },
    { label: "Regular bowl", grams: 45 },
    { label: "Large bowl", grams: 60 },
  ]},
  { keywords: ["potato", "potatoes"], servings: [
    { label: "Small", grams: 120 },
    { label: "Medium", grams: 175 },
    { label: "Large", grams: 250 },
  ]},
  { keywords: ["sweet potato"], servings: [
    { label: "Small", grams: 120 },
    { label: "Medium", grams: 180 },
    { label: "Large", grams: 250 },
  ]},

  // Snacks
  { keywords: ["protein bar"], servings: [
    { label: "1 bar", grams: 60 },
  ]},
  { keywords: ["muesli bar", "granola bar"], servings: [
    { label: "1 bar", grams: 30 },
  ]},
  { keywords: ["almonds", "nuts", "cashews", "peanuts", "walnuts", "macadamia"], servings: [
    { label: "Small handful", grams: 15 },
    { label: "Handful", grams: 30 },
    { label: "Large handful", grams: 50 },
  ]},
  { keywords: ["peanut butter", "almond butter", "nut butter"], servings: [
    { label: "1 tbsp", grams: 16 },
    { label: "2 tbsp", grams: 32 },
  ]},
  { keywords: ["yoghurt", "yogurt", "greek yoghurt", "greek yogurt"], servings: [
    { label: "Small tub", grams: 100 },
    { label: "Regular tub", grams: 170 },
    { label: "Large tub", grams: 200 },
  ]},
  { keywords: ["cheese", "cheddar", "tasty cheese"], servings: [
    { label: "1 slice", grams: 20 },
    { label: "2 slices", grams: 40 },
    { label: "Small block", grams: 30 },
  ]},
  { keywords: ["cream cheese"], servings: [
    { label: "1 tbsp", grams: 15 },
    { label: "2 tbsp", grams: 30 },
  ]},
  { keywords: ["honey"], servings: [
    { label: "1 tsp", grams: 7 },
    { label: "1 tbsp", grams: 21 },
  ]},
  { keywords: ["butter", "margarine"], servings: [
    { label: "Scrape", grams: 5 },
    { label: "1 pat", grams: 10 },
    { label: "Thick spread", grams: 20 },
  ]},
  { keywords: ["protein powder", "whey protein", "whey"], servings: [
    { label: "1 scoop", grams: 30 },
    { label: "2 scoops", grams: 60 },
  ]},
  { keywords: ["chocolate", "dark chocolate", "milk chocolate"], servings: [
    { label: "2 squares", grams: 20 },
    { label: "1 row", grams: 40 },
    { label: "Half block", grams: 100 },
  ]},
  { keywords: ["chips", "potato chips", "crisps"], servings: [
    { label: "Small bag", grams: 28 },
    { label: "Share bag", grams: 90 },
    { label: "Large bag", grams: 175 },
  ]},
  { keywords: ["ice cream"], servings: [
    { label: "1 scoop", grams: 65 },
    { label: "2 scoops", grams: 130 },
  ]},
  { keywords: ["tim tam", "biscuit", "cookie"], servings: [
    { label: "1 biscuit", grams: 20 },
    { label: "2 biscuits", grams: 40 },
    { label: "3 biscuits", grams: 60 },
  ]},

  // Common meals / takeaway
  { keywords: ["sushi", "sushi roll"], servings: [
    { label: "Small roll (6pc)", grams: 160 },
    { label: "Large roll (8pc)", grams: 220 },
  ]},
  { keywords: ["pizza"], servings: [
    { label: "1 slice", grams: 110 },
    { label: "2 slices", grams: 220 },
    { label: "3 slices", grams: 330 },
  ]},
  { keywords: ["salad"], servings: [
    { label: "Side salad", grams: 100 },
    { label: "Main salad", grams: 250 },
    { label: "Large salad", grams: 350 },
  ]},
  { keywords: ["soup"], servings: [
    { label: "Small bowl", grams: 250 },
    { label: "Large bowl", grams: 400 },
  ]},
  { keywords: ["sandwich"], servings: [
    { label: "Half", grams: 130 },
    { label: "Whole", grams: 260 },
  ]},

  // Vegetables
  { keywords: ["broccoli"], servings: [
    { label: "Small serve", grams: 75 },
    { label: "1 cup", grams: 90 },
    { label: "Large serve", grams: 150 },
  ]},
  { keywords: ["spinach", "baby spinach"], servings: [
    { label: "Handful", grams: 30 },
    { label: "1 cup", grams: 30 },
    { label: "Big serve", grams: 60 },
  ]},
  { keywords: ["carrot", "carrots"], servings: [
    { label: "1 small", grams: 60 },
    { label: "1 medium", grams: 80 },
    { label: "1 large", grams: 120 },
  ]},
  { keywords: ["tomato", "tomatoes"], servings: [
    { label: "1 small", grams: 90 },
    { label: "1 medium", grams: 125 },
    { label: "1 large", grams: 180 },
  ]},
  { keywords: ["cucumber"], servings: [
    { label: "Half", grams: 150 },
    { label: "Whole", grams: 300 },
  ]},
  { keywords: ["corn", "corn on the cob"], servings: [
    { label: "1 cob", grams: 150 },
    { label: "Half cup kernels", grams: 75 },
  ]},
  { keywords: ["mushroom", "mushrooms"], servings: [
    { label: "1 cup sliced", grams: 70 },
    { label: "Large serve", grams: 150 },
  ]},
  { keywords: ["capsicum", "bell pepper", "pepper"], servings: [
    { label: "Half", grams: 80 },
    { label: "Whole", grams: 160 },
  ]},
  { keywords: ["onion"], servings: [
    { label: "Small", grams: 70 },
    { label: "Medium", grams: 110 },
    { label: "Large", grams: 170 },
  ]},
  { keywords: ["zucchini", "courgette"], servings: [
    { label: "Small", grams: 120 },
    { label: "Medium", grams: 180 },
    { label: "Large", grams: 250 },
  ]},
];

export function getServingSizes(foodName: string): ServingSize[] | null {
  if (!foodName || foodName.length < 2) return null;
  const lower = foodName.toLowerCase().trim();

  for (const entry of SERVING_SIZES) {
    for (const keyword of entry.keywords) {
      if (lower.includes(keyword) || keyword.includes(lower)) {
        return entry.servings;
      }
    }
  }

  return null;
}

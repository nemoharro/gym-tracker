// Comprehensive Australian food nutrition database
// Values per 100g, sourced from FSANZ AFCD, CalorieKing AU, and manufacturer labels
// All values are per 100g

export interface FoodEntry {
  name: string;
  category: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
  saturated_fat: number;
  sodium: number;
}

export const FOOD_DATABASE: FoodEntry[] = [
  // ============================================
  // POULTRY - RAW
  // ============================================
  { name: "chicken breast raw", category: "Poultry", calories: 100, protein: 21.4, carbs: 0, fat: 1.5, fiber: 0, sugar: 0, saturated_fat: 0.4, sodium: 63 },
  { name: "chicken breast skinless raw", category: "Poultry", calories: 100, protein: 21.4, carbs: 0, fat: 1.5, fiber: 0, sugar: 0, saturated_fat: 0.4, sodium: 63 },
  { name: "chicken thigh raw", category: "Poultry", calories: 119, protein: 19.7, carbs: 0, fat: 4.3, fiber: 0, sugar: 0, saturated_fat: 1.2, sodium: 75 },
  { name: "chicken thigh skinless raw", category: "Poultry", calories: 119, protein: 19.7, carbs: 0, fat: 4.3, fiber: 0, sugar: 0, saturated_fat: 1.2, sodium: 75 },
  { name: "chicken drumstick raw", category: "Poultry", calories: 130, protein: 18.2, carbs: 0, fat: 6.3, fiber: 0, sugar: 0, saturated_fat: 1.7, sodium: 80 },
  { name: "chicken wing raw", category: "Poultry", calories: 191, protein: 17.5, carbs: 0, fat: 13.4, fiber: 0, sugar: 0, saturated_fat: 3.8, sodium: 73 },
  { name: "chicken mince raw", category: "Poultry", calories: 143, protein: 17.4, carbs: 0, fat: 8.1, fiber: 0, sugar: 0, saturated_fat: 2.4, sodium: 65 },
  { name: "turkey breast raw", category: "Poultry", calories: 104, protein: 23.7, carbs: 0, fat: 0.7, fiber: 0, sugar: 0, saturated_fat: 0.2, sodium: 55 },
  { name: "turkey mince raw", category: "Poultry", calories: 148, protein: 19.3, carbs: 0, fat: 7.7, fiber: 0, sugar: 0, saturated_fat: 2.3, sodium: 70 },

  // POULTRY - COOKED
  { name: "chicken breast cooked", category: "Poultry", calories: 165, protein: 31, carbs: 0, fat: 3.6, fiber: 0, sugar: 0, saturated_fat: 1, sodium: 74 },
  { name: "chicken breast grilled", category: "Poultry", calories: 165, protein: 31, carbs: 0, fat: 3.6, fiber: 0, sugar: 0, saturated_fat: 1, sodium: 74 },
  { name: "chicken breast baked", category: "Poultry", calories: 165, protein: 31, carbs: 0, fat: 3.6, fiber: 0, sugar: 0, saturated_fat: 1, sodium: 74 },
  { name: "chicken thigh cooked", category: "Poultry", calories: 209, protein: 26, carbs: 0, fat: 10.9, fiber: 0, sugar: 0, saturated_fat: 3, sodium: 84 },
  { name: "chicken drumstick cooked", category: "Poultry", calories: 172, protein: 28.3, carbs: 0, fat: 5.7, fiber: 0, sugar: 0, saturated_fat: 1.5, sodium: 90 },
  { name: "chicken schnitzel", category: "Poultry", calories: 223, protein: 18.5, carbs: 12, fat: 11.5, fiber: 0.5, sugar: 0.8, saturated_fat: 2.5, sodium: 450 },
  { name: "rotisserie chicken", category: "Poultry", calories: 190, protein: 27, carbs: 0, fat: 8.5, fiber: 0, sugar: 0, saturated_fat: 2.4, sodium: 370 },
  { name: "chicken nuggets", category: "Poultry", calories: 250, protein: 14, carbs: 16, fat: 15, fiber: 1, sugar: 1, saturated_fat: 3.5, sodium: 550 },
  { name: "chicken tenders", category: "Poultry", calories: 230, protein: 16, carbs: 14, fat: 12, fiber: 0.5, sugar: 0.5, saturated_fat: 2.5, sodium: 500 },

  // ============================================
  // BEEF - RAW
  // ============================================
  { name: "beef mince raw", category: "Beef", calories: 176, protein: 18.5, carbs: 0, fat: 11, fiber: 0, sugar: 0, saturated_fat: 4.5, sodium: 66 },
  { name: "lean beef mince raw", category: "Beef", calories: 137, protein: 20.8, carbs: 0, fat: 5.8, fiber: 0, sugar: 0, saturated_fat: 2.5, sodium: 66 },
  { name: "beef steak raw", category: "Beef", calories: 135, protein: 21, carbs: 0, fat: 5.4, fiber: 0, sugar: 0, saturated_fat: 2.2, sodium: 57 },
  { name: "beef rump steak raw", category: "Beef", calories: 127, protein: 21.4, carbs: 0, fat: 4.4, fiber: 0, sugar: 0, saturated_fat: 1.8, sodium: 55 },
  { name: "beef sirloin raw", category: "Beef", calories: 143, protein: 21, carbs: 0, fat: 6.3, fiber: 0, sugar: 0, saturated_fat: 2.6, sodium: 55 },
  { name: "beef eye fillet raw", category: "Beef", calories: 133, protein: 22, carbs: 0, fat: 4.9, fiber: 0, sugar: 0, saturated_fat: 2, sodium: 50 },
  { name: "beef scotch fillet raw", category: "Beef", calories: 200, protein: 19, carbs: 0, fat: 13.5, fiber: 0, sugar: 0, saturated_fat: 5.5, sodium: 55 },
  { name: "beef sausages raw", category: "Beef", calories: 250, protein: 13, carbs: 5, fat: 20, fiber: 0.5, sugar: 1, saturated_fat: 8.5, sodium: 700 },

  // BEEF - COOKED
  { name: "beef mince cooked", category: "Beef", calories: 250, protein: 26, carbs: 0, fat: 15, fiber: 0, sugar: 0, saturated_fat: 6, sodium: 66 },
  { name: "lean beef mince cooked", category: "Beef", calories: 176, protein: 26, carbs: 0, fat: 8, fiber: 0, sugar: 0, saturated_fat: 3.5, sodium: 66 },
  { name: "beef steak cooked", category: "Beef", calories: 180, protein: 28, carbs: 0, fat: 7.5, fiber: 0, sugar: 0, saturated_fat: 3, sodium: 57 },
  { name: "beef steak grilled", category: "Beef", calories: 180, protein: 28, carbs: 0, fat: 7.5, fiber: 0, sugar: 0, saturated_fat: 3, sodium: 57 },
  { name: "beef roast", category: "Beef", calories: 175, protein: 27, carbs: 0, fat: 7, fiber: 0, sugar: 0, saturated_fat: 2.8, sodium: 55 },
  { name: "beef jerky", category: "Beef", calories: 320, protein: 50, carbs: 10, fat: 8, fiber: 0, sugar: 8, saturated_fat: 3, sodium: 1800 },
  { name: "beef burger patty", category: "Beef", calories: 255, protein: 20, carbs: 3, fat: 18, fiber: 0, sugar: 0.5, saturated_fat: 7.5, sodium: 400 },

  // ============================================
  // LAMB & PORK
  // ============================================
  { name: "lamb chop raw", category: "Lamb", calories: 206, protein: 17.1, carbs: 0, fat: 15.3, fiber: 0, sugar: 0, saturated_fat: 6.8, sodium: 60 },
  { name: "lamb chop cooked", category: "Lamb", calories: 270, protein: 25.5, carbs: 0, fat: 18, fiber: 0, sugar: 0, saturated_fat: 8, sodium: 65 },
  { name: "lamb mince raw", category: "Lamb", calories: 206, protein: 17.5, carbs: 0, fat: 15, fiber: 0, sugar: 0, saturated_fat: 6.5, sodium: 65 },
  { name: "lamb leg raw", category: "Lamb", calories: 155, protein: 20, carbs: 0, fat: 8.2, fiber: 0, sugar: 0, saturated_fat: 3.5, sodium: 60 },
  { name: "lamb leg roast", category: "Lamb", calories: 200, protein: 26, carbs: 0, fat: 10, fiber: 0, sugar: 0, saturated_fat: 4.5, sodium: 65 },
  { name: "pork loin raw", category: "Pork", calories: 120, protein: 21, carbs: 0, fat: 3.5, fiber: 0, sugar: 0, saturated_fat: 1.2, sodium: 50 },
  { name: "pork loin cooked", category: "Pork", calories: 165, protein: 28, carbs: 0, fat: 5, fiber: 0, sugar: 0, saturated_fat: 1.8, sodium: 55 },
  { name: "pork chop raw", category: "Pork", calories: 155, protein: 20, carbs: 0, fat: 8.2, fiber: 0, sugar: 0, saturated_fat: 3, sodium: 55 },
  { name: "pork chop cooked", category: "Pork", calories: 200, protein: 26, carbs: 0, fat: 10, fiber: 0, sugar: 0, saturated_fat: 3.5, sodium: 60 },
  { name: "pork belly raw", category: "Pork", calories: 393, protein: 11, carbs: 0, fat: 39, fiber: 0, sugar: 0, saturated_fat: 14, sodium: 40 },
  { name: "pork mince raw", category: "Pork", calories: 170, protein: 17.5, carbs: 0, fat: 11, fiber: 0, sugar: 0, saturated_fat: 4, sodium: 60 },
  { name: "pork sausages raw", category: "Pork", calories: 268, protein: 13.5, carbs: 4, fat: 22, fiber: 0.5, sugar: 1, saturated_fat: 8, sodium: 750 },
  { name: "bacon raw", category: "Pork", calories: 250, protein: 14, carbs: 0.5, fat: 21, fiber: 0, sugar: 0.5, saturated_fat: 7.5, sodium: 1200 },
  { name: "bacon cooked", category: "Pork", calories: 370, protein: 21, carbs: 0.5, fat: 31, fiber: 0, sugar: 0.5, saturated_fat: 11, sodium: 1500 },
  { name: "ham", category: "Pork", calories: 120, protein: 18, carbs: 1, fat: 5, fiber: 0, sugar: 0.5, saturated_fat: 1.8, sodium: 1100 },
  { name: "prosciutto", category: "Pork", calories: 240, protein: 26, carbs: 0.5, fat: 14, fiber: 0, sugar: 0, saturated_fat: 5, sodium: 2400 },

  // ============================================
  // SEAFOOD
  // ============================================
  { name: "salmon raw", category: "Seafood", calories: 146, protein: 20, carbs: 0, fat: 7, fiber: 0, sugar: 0, saturated_fat: 1.5, sodium: 44 },
  { name: "salmon cooked", category: "Seafood", calories: 208, protein: 20, carbs: 0, fat: 13, fiber: 0, sugar: 0, saturated_fat: 3.1, sodium: 59 },
  { name: "salmon smoked", category: "Seafood", calories: 117, protein: 18, carbs: 0, fat: 4.5, fiber: 0, sugar: 0, saturated_fat: 0.9, sodium: 784 },
  { name: "tuna raw", category: "Seafood", calories: 108, protein: 24, carbs: 0, fat: 0.5, fiber: 0, sugar: 0, saturated_fat: 0.2, sodium: 39 },
  { name: "tuna canned in water", category: "Seafood", calories: 96, protein: 22, carbs: 0, fat: 0.8, fiber: 0, sugar: 0, saturated_fat: 0.2, sodium: 350 },
  { name: "tuna canned in oil", category: "Seafood", calories: 186, protein: 26, carbs: 0, fat: 8.5, fiber: 0, sugar: 0, saturated_fat: 1.4, sodium: 350 },
  { name: "prawns raw", category: "Seafood", calories: 85, protein: 18, carbs: 0.2, fat: 1.2, fiber: 0, sugar: 0, saturated_fat: 0.3, sodium: 185 },
  { name: "prawns cooked", category: "Seafood", calories: 99, protein: 21, carbs: 0.2, fat: 1.4, fiber: 0, sugar: 0, saturated_fat: 0.3, sodium: 200 },
  { name: "barramundi raw", category: "Seafood", calories: 97, protein: 20.5, carbs: 0, fat: 1.5, fiber: 0, sugar: 0, saturated_fat: 0.4, sodium: 55 },
  { name: "barramundi cooked", category: "Seafood", calories: 130, protein: 27, carbs: 0, fat: 2, fiber: 0, sugar: 0, saturated_fat: 0.5, sodium: 60 },
  { name: "fish fingers", category: "Seafood", calories: 220, protein: 12, carbs: 20, fat: 10, fiber: 1, sugar: 1, saturated_fat: 2, sodium: 450 },
  { name: "calamari", category: "Seafood", calories: 92, protein: 15.6, carbs: 3.1, fat: 1.4, fiber: 0, sugar: 0, saturated_fat: 0.4, sodium: 44 },
  { name: "sardines canned", category: "Seafood", calories: 208, protein: 25, carbs: 0, fat: 11, fiber: 0, sugar: 0, saturated_fat: 1.5, sodium: 505 },

  // ============================================
  // EGGS & DAIRY
  // ============================================
  { name: "eggs", category: "Eggs & Dairy", calories: 155, protein: 13, carbs: 1.1, fat: 11, fiber: 0, sugar: 1.1, saturated_fat: 3.3, sodium: 124 },
  { name: "egg white", category: "Eggs & Dairy", calories: 52, protein: 11, carbs: 0.7, fat: 0.2, fiber: 0, sugar: 0.7, saturated_fat: 0, sodium: 166 },
  { name: "egg yolk", category: "Eggs & Dairy", calories: 322, protein: 16, carbs: 3.6, fat: 27, fiber: 0, sugar: 0.6, saturated_fat: 9.6, sodium: 48 },
  { name: "scrambled eggs", category: "Eggs & Dairy", calories: 166, protein: 11, carbs: 1.6, fat: 12.5, fiber: 0, sugar: 1.4, saturated_fat: 4.5, sodium: 170 },
  { name: "boiled egg", category: "Eggs & Dairy", calories: 155, protein: 13, carbs: 1.1, fat: 11, fiber: 0, sugar: 1.1, saturated_fat: 3.3, sodium: 124 },
  { name: "whole milk", category: "Eggs & Dairy", calories: 61, protein: 3.2, carbs: 4.8, fat: 3.3, fiber: 0, sugar: 4.8, saturated_fat: 1.9, sodium: 44 },
  { name: "skim milk", category: "Eggs & Dairy", calories: 34, protein: 3.4, carbs: 5, fat: 0.1, fiber: 0, sugar: 5, saturated_fat: 0.1, sodium: 42 },
  { name: "almond milk", category: "Eggs & Dairy", calories: 15, protein: 0.6, carbs: 0.3, fat: 1.1, fiber: 0.2, sugar: 0, saturated_fat: 0.1, sodium: 60 },
  { name: "oat milk", category: "Eggs & Dairy", calories: 43, protein: 0.4, carbs: 7, fat: 1.5, fiber: 0.8, sugar: 3.2, saturated_fat: 0.2, sodium: 40 },
  { name: "soy milk", category: "Eggs & Dairy", calories: 33, protein: 2.8, carbs: 1.2, fat: 1.8, fiber: 0.4, sugar: 0.4, saturated_fat: 0.2, sodium: 40 },
  { name: "greek yogurt", category: "Eggs & Dairy", calories: 59, protein: 10, carbs: 3.6, fat: 0.4, fiber: 0, sugar: 3.6, saturated_fat: 0.1, sodium: 36 },
  { name: "natural yogurt", category: "Eggs & Dairy", calories: 61, protein: 3.5, carbs: 4.7, fat: 3.3, fiber: 0, sugar: 4.7, saturated_fat: 2.1, sodium: 46 },
  { name: "chobani yogurt", category: "Eggs & Dairy", calories: 59, protein: 10, carbs: 3.6, fat: 0.4, fiber: 0, sugar: 3.6, saturated_fat: 0.1, sodium: 36 },
  { name: "cottage cheese", category: "Eggs & Dairy", calories: 98, protein: 11, carbs: 3.4, fat: 4.3, fiber: 0, sugar: 2.7, saturated_fat: 1.7, sodium: 364 },
  { name: "cheddar cheese", category: "Eggs & Dairy", calories: 403, protein: 25, carbs: 1.3, fat: 33, fiber: 0, sugar: 0.5, saturated_fat: 21, sodium: 621 },
  { name: "mozzarella", category: "Eggs & Dairy", calories: 280, protein: 28, carbs: 3.1, fat: 17, fiber: 0, sugar: 1, saturated_fat: 11, sodium: 627 },
  { name: "parmesan", category: "Eggs & Dairy", calories: 431, protein: 38, carbs: 4, fat: 29, fiber: 0, sugar: 0.9, saturated_fat: 19, sodium: 1529 },
  { name: "cream cheese", category: "Eggs & Dairy", calories: 342, protein: 6, carbs: 4, fat: 34, fiber: 0, sugar: 3.5, saturated_fat: 19, sodium: 321 },
  { name: "butter", category: "Eggs & Dairy", calories: 717, protein: 0.9, carbs: 0.1, fat: 81, fiber: 0, sugar: 0.1, saturated_fat: 51, sodium: 11 },
  { name: "thickened cream", category: "Eggs & Dairy", calories: 345, protein: 2, carbs: 2.8, fat: 36, fiber: 0, sugar: 2.8, saturated_fat: 23, sodium: 25 },

  // ============================================
  // GRAINS & CEREALS - RAW/DRY
  // ============================================
  { name: "white rice dry", category: "Grains", calories: 360, protein: 7, carbs: 80, fat: 0.6, fiber: 1.3, sugar: 0, saturated_fat: 0.2, sodium: 5 },
  { name: "brown rice dry", category: "Grains", calories: 362, protein: 7.5, carbs: 76, fat: 2.7, fiber: 3.6, sugar: 0.7, saturated_fat: 0.5, sodium: 4 },
  { name: "basmati rice dry", category: "Grains", calories: 360, protein: 7, carbs: 80, fat: 0.6, fiber: 1.3, sugar: 0, saturated_fat: 0.2, sodium: 5 },
  { name: "pasta dry", category: "Grains", calories: 350, protein: 12, carbs: 72, fat: 1.5, fiber: 3, sugar: 2, saturated_fat: 0.3, sodium: 5 },
  { name: "spaghetti dry", category: "Grains", calories: 350, protein: 12, carbs: 72, fat: 1.5, fiber: 3, sugar: 2, saturated_fat: 0.3, sodium: 5 },
  { name: "penne dry", category: "Grains", calories: 350, protein: 12, carbs: 72, fat: 1.5, fiber: 3, sugar: 2, saturated_fat: 0.3, sodium: 5 },
  { name: "oats", category: "Grains", calories: 389, protein: 17, carbs: 66, fat: 6.9, fiber: 10.6, sugar: 0, saturated_fat: 1.2, sodium: 2 },
  { name: "rolled oats", category: "Grains", calories: 389, protein: 17, carbs: 66, fat: 6.9, fiber: 10.6, sugar: 0, saturated_fat: 1.2, sodium: 2 },
  { name: "quinoa dry", category: "Grains", calories: 368, protein: 14, carbs: 64, fat: 6.1, fiber: 7, sugar: 0, saturated_fat: 0.7, sodium: 5 },
  { name: "couscous dry", category: "Grains", calories: 376, protein: 13, carbs: 77, fat: 0.6, fiber: 5, sugar: 0, saturated_fat: 0.1, sodium: 10 },

  // GRAINS - COOKED
  { name: "white rice cooked", category: "Grains", calories: 130, protein: 2.7, carbs: 28, fat: 0.3, fiber: 0.4, sugar: 0, saturated_fat: 0.1, sodium: 1 },
  { name: "brown rice cooked", category: "Grains", calories: 112, protein: 2.3, carbs: 24, fat: 0.8, fiber: 1.8, sugar: 0.4, saturated_fat: 0.2, sodium: 1 },
  { name: "basmati rice cooked", category: "Grains", calories: 130, protein: 2.7, carbs: 28, fat: 0.3, fiber: 0.4, sugar: 0, saturated_fat: 0.1, sodium: 1 },
  { name: "pasta cooked", category: "Grains", calories: 155, protein: 5, carbs: 31, fat: 1.1, fiber: 1.8, sugar: 0.6, saturated_fat: 0.2, sodium: 1 },
  { name: "spaghetti cooked", category: "Grains", calories: 155, protein: 5, carbs: 31, fat: 1.1, fiber: 1.8, sugar: 0.6, saturated_fat: 0.2, sodium: 1 },
  { name: "quinoa cooked", category: "Grains", calories: 120, protein: 4.4, carbs: 21, fat: 1.9, fiber: 2.8, sugar: 0.9, saturated_fat: 0.2, sodium: 7 },
  { name: "oatmeal cooked", category: "Grains", calories: 71, protein: 2.5, carbs: 12, fat: 1.5, fiber: 1.7, sugar: 0.3, saturated_fat: 0.3, sodium: 5 },
  { name: "porridge", category: "Grains", calories: 71, protein: 2.5, carbs: 12, fat: 1.5, fiber: 1.7, sugar: 0.3, saturated_fat: 0.3, sodium: 5 },

  // ============================================
  // BREAD & BAKERY
  // ============================================
  { name: "white bread", category: "Bread", calories: 265, protein: 9, carbs: 49, fat: 3.2, fiber: 2.7, sugar: 5, saturated_fat: 0.7, sodium: 491 },
  { name: "wholemeal bread", category: "Bread", calories: 247, protein: 10, carbs: 43, fat: 3.5, fiber: 6, sugar: 4.5, saturated_fat: 0.7, sodium: 450 },
  { name: "multigrain bread", category: "Bread", calories: 250, protein: 10, carbs: 42, fat: 4, fiber: 5, sugar: 4, saturated_fat: 0.8, sodium: 430 },
  { name: "sourdough bread", category: "Bread", calories: 260, protein: 9, carbs: 50, fat: 2.5, fiber: 2, sugar: 3, saturated_fat: 0.5, sodium: 480 },
  { name: "wraps", category: "Bread", calories: 300, protein: 8, carbs: 50, fat: 7, fiber: 2, sugar: 3, saturated_fat: 3, sodium: 550 },
  { name: "pita bread", category: "Bread", calories: 275, protein: 9, carbs: 55, fat: 1.2, fiber: 2, sugar: 1.5, saturated_fat: 0.2, sodium: 480 },
  { name: "english muffin", category: "Bread", calories: 235, protein: 8, carbs: 46, fat: 1.5, fiber: 2.5, sugar: 4, saturated_fat: 0.3, sodium: 430 },
  { name: "bagel", category: "Bread", calories: 270, protein: 10, carbs: 53, fat: 1.3, fiber: 2.3, sugar: 5, saturated_fat: 0.2, sodium: 470 },
  { name: "croissant", category: "Bread", calories: 406, protein: 8, carbs: 45, fat: 21, fiber: 2, sugar: 7, saturated_fat: 12, sodium: 330 },

  // ============================================
  // VEGETABLES
  // ============================================
  { name: "potato raw", category: "Vegetables", calories: 77, protein: 2, carbs: 17, fat: 0.1, fiber: 2.2, sugar: 0.8, saturated_fat: 0, sodium: 6 },
  { name: "potato cooked", category: "Vegetables", calories: 87, protein: 1.9, carbs: 20, fat: 0.1, fiber: 1.8, sugar: 0.9, saturated_fat: 0, sodium: 5 },
  { name: "potato mashed", category: "Vegetables", calories: 100, protein: 2, carbs: 16, fat: 3.5, fiber: 1.5, sugar: 1.2, saturated_fat: 1.5, sodium: 300 },
  { name: "sweet potato raw", category: "Vegetables", calories: 86, protein: 1.6, carbs: 20, fat: 0.1, fiber: 3, sugar: 4.2, saturated_fat: 0, sodium: 55 },
  { name: "sweet potato cooked", category: "Vegetables", calories: 90, protein: 2, carbs: 21, fat: 0.1, fiber: 3.3, sugar: 6.5, saturated_fat: 0, sodium: 36 },
  { name: "broccoli raw", category: "Vegetables", calories: 34, protein: 2.8, carbs: 7, fat: 0.4, fiber: 2.6, sugar: 1.7, saturated_fat: 0.1, sodium: 33 },
  { name: "broccoli cooked", category: "Vegetables", calories: 35, protein: 2.4, carbs: 7, fat: 0.4, fiber: 3.3, sugar: 1.4, saturated_fat: 0.1, sodium: 20 },
  { name: "spinach raw", category: "Vegetables", calories: 23, protein: 2.9, carbs: 3.6, fat: 0.4, fiber: 2.2, sugar: 0.4, saturated_fat: 0.1, sodium: 79 },
  { name: "spinach cooked", category: "Vegetables", calories: 23, protein: 3, carbs: 3.8, fat: 0.3, fiber: 2.4, sugar: 0.4, saturated_fat: 0, sodium: 70 },
  { name: "carrot", category: "Vegetables", calories: 41, protein: 0.9, carbs: 10, fat: 0.2, fiber: 2.8, sugar: 4.7, saturated_fat: 0, sodium: 69 },
  { name: "capsicum", category: "Vegetables", calories: 26, protein: 1, carbs: 6, fat: 0.2, fiber: 1.7, sugar: 4, saturated_fat: 0, sodium: 2 },
  { name: "tomato", category: "Vegetables", calories: 18, protein: 0.9, carbs: 3.9, fat: 0.2, fiber: 1.2, sugar: 2.6, saturated_fat: 0, sodium: 5 },
  { name: "onion", category: "Vegetables", calories: 40, protein: 1.1, carbs: 9, fat: 0.1, fiber: 1.7, sugar: 4.2, saturated_fat: 0, sodium: 4 },
  { name: "mushrooms", category: "Vegetables", calories: 22, protein: 3.1, carbs: 3.3, fat: 0.3, fiber: 1, sugar: 2, saturated_fat: 0, sodium: 5 },
  { name: "zucchini", category: "Vegetables", calories: 17, protein: 1.2, carbs: 3.1, fat: 0.3, fiber: 1, sugar: 2.5, saturated_fat: 0.1, sodium: 8 },
  { name: "corn", category: "Vegetables", calories: 86, protein: 3.3, carbs: 19, fat: 1.2, fiber: 2.7, sugar: 3.2, saturated_fat: 0.2, sodium: 15 },
  { name: "peas", category: "Vegetables", calories: 81, protein: 5.4, carbs: 14, fat: 0.4, fiber: 5.1, sugar: 5.7, saturated_fat: 0.1, sodium: 5 },
  { name: "green beans", category: "Vegetables", calories: 31, protein: 1.8, carbs: 7, fat: 0.1, fiber: 3.4, sugar: 1.4, saturated_fat: 0, sodium: 6 },
  { name: "asparagus", category: "Vegetables", calories: 20, protein: 2.2, carbs: 3.9, fat: 0.1, fiber: 2.1, sugar: 1.9, saturated_fat: 0, sodium: 2 },
  { name: "cauliflower", category: "Vegetables", calories: 25, protein: 1.9, carbs: 5, fat: 0.3, fiber: 2, sugar: 1.9, saturated_fat: 0.1, sodium: 30 },
  { name: "cucumber", category: "Vegetables", calories: 15, protein: 0.7, carbs: 3.6, fat: 0.1, fiber: 0.5, sugar: 1.7, saturated_fat: 0, sodium: 2 },
  { name: "lettuce", category: "Vegetables", calories: 15, protein: 1.4, carbs: 2.9, fat: 0.2, fiber: 1.3, sugar: 0.8, saturated_fat: 0, sodium: 28 },
  { name: "avocado", category: "Vegetables", calories: 160, protein: 2, carbs: 9, fat: 15, fiber: 6.7, sugar: 0.7, saturated_fat: 2.1, sodium: 7 },
  { name: "kale", category: "Vegetables", calories: 35, protein: 2.9, carbs: 4.4, fat: 1.5, fiber: 4.1, sugar: 0.8, saturated_fat: 0.2, sodium: 53 },
  { name: "cabbage", category: "Vegetables", calories: 25, protein: 1.3, carbs: 5.8, fat: 0.1, fiber: 2.5, sugar: 3.2, saturated_fat: 0, sodium: 18 },
  { name: "eggplant", category: "Vegetables", calories: 25, protein: 1, carbs: 6, fat: 0.2, fiber: 3, sugar: 3.5, saturated_fat: 0, sodium: 2 },
  { name: "pumpkin", category: "Vegetables", calories: 26, protein: 1, carbs: 6.5, fat: 0.1, fiber: 0.5, sugar: 2.8, saturated_fat: 0, sodium: 1 },

  // ============================================
  // FRUIT
  // ============================================
  { name: "banana", category: "Fruit", calories: 89, protein: 1.1, carbs: 23, fat: 0.3, fiber: 2.6, sugar: 12, saturated_fat: 0.1, sodium: 1 },
  { name: "apple", category: "Fruit", calories: 52, protein: 0.3, carbs: 14, fat: 0.2, fiber: 2.4, sugar: 10, saturated_fat: 0, sodium: 1 },
  { name: "orange", category: "Fruit", calories: 47, protein: 0.9, carbs: 12, fat: 0.1, fiber: 2.4, sugar: 9.4, saturated_fat: 0, sodium: 0 },
  { name: "strawberries", category: "Fruit", calories: 33, protein: 0.7, carbs: 8, fat: 0.3, fiber: 2, sugar: 4.9, saturated_fat: 0, sodium: 1 },
  { name: "blueberries", category: "Fruit", calories: 57, protein: 0.7, carbs: 14, fat: 0.3, fiber: 2.4, sugar: 10, saturated_fat: 0, sodium: 1 },
  { name: "mango", category: "Fruit", calories: 60, protein: 0.8, carbs: 15, fat: 0.4, fiber: 1.6, sugar: 14, saturated_fat: 0.1, sodium: 1 },
  { name: "watermelon", category: "Fruit", calories: 30, protein: 0.6, carbs: 8, fat: 0.2, fiber: 0.4, sugar: 6.2, saturated_fat: 0, sodium: 1 },
  { name: "grapes", category: "Fruit", calories: 69, protein: 0.7, carbs: 18, fat: 0.2, fiber: 0.9, sugar: 16, saturated_fat: 0.1, sodium: 2 },
  { name: "pineapple", category: "Fruit", calories: 50, protein: 0.5, carbs: 13, fat: 0.1, fiber: 1.4, sugar: 10, saturated_fat: 0, sodium: 1 },
  { name: "kiwi fruit", category: "Fruit", calories: 61, protein: 1.1, carbs: 15, fat: 0.5, fiber: 3, sugar: 9, saturated_fat: 0, sodium: 3 },
  { name: "pear", category: "Fruit", calories: 57, protein: 0.4, carbs: 15, fat: 0.1, fiber: 3.1, sugar: 10, saturated_fat: 0, sodium: 1 },
  { name: "peach", category: "Fruit", calories: 39, protein: 0.9, carbs: 10, fat: 0.3, fiber: 1.5, sugar: 8.4, saturated_fat: 0, sodium: 0 },
  { name: "dates", category: "Fruit", calories: 282, protein: 2.5, carbs: 75, fat: 0.4, fiber: 8, sugar: 63, saturated_fat: 0, sodium: 2 },

  // ============================================
  // LEGUMES & BEANS
  // ============================================
  { name: "chickpeas canned", category: "Legumes", calories: 127, protein: 7, carbs: 20, fat: 2.1, fiber: 6, sugar: 1, saturated_fat: 0.2, sodium: 280 },
  { name: "chickpeas cooked", category: "Legumes", calories: 164, protein: 8.9, carbs: 27, fat: 2.6, fiber: 7.6, sugar: 4.8, saturated_fat: 0.3, sodium: 7 },
  { name: "lentils cooked", category: "Legumes", calories: 116, protein: 9, carbs: 20, fat: 0.4, fiber: 7.9, sugar: 1.8, saturated_fat: 0.1, sodium: 2 },
  { name: "black beans cooked", category: "Legumes", calories: 132, protein: 8.9, carbs: 24, fat: 0.5, fiber: 8.7, sugar: 0.3, saturated_fat: 0.1, sodium: 1 },
  { name: "kidney beans cooked", category: "Legumes", calories: 127, protein: 8.7, carbs: 23, fat: 0.5, fiber: 6.4, sugar: 2, saturated_fat: 0.1, sodium: 2 },
  { name: "baked beans", category: "Legumes", calories: 85, protein: 4.6, carbs: 14, fat: 0.4, fiber: 4.5, sugar: 5.5, saturated_fat: 0.1, sodium: 450 },
  { name: "edamame", category: "Legumes", calories: 121, protein: 12, carbs: 9, fat: 5, fiber: 5, sugar: 2.2, saturated_fat: 0.6, sodium: 6 },
  { name: "tofu firm", category: "Legumes", calories: 76, protein: 8, carbs: 1.9, fat: 4.2, fiber: 0.3, sugar: 0.6, saturated_fat: 0.6, sodium: 7 },

  // ============================================
  // NUTS & SEEDS
  // ============================================
  { name: "almonds", category: "Nuts", calories: 579, protein: 21, carbs: 22, fat: 49, fiber: 12.5, sugar: 4.4, saturated_fat: 3.7, sodium: 1 },
  { name: "peanuts", category: "Nuts", calories: 567, protein: 26, carbs: 16, fat: 49, fiber: 8.5, sugar: 4, saturated_fat: 6.8, sodium: 18 },
  { name: "walnuts", category: "Nuts", calories: 654, protein: 15, carbs: 14, fat: 65, fiber: 6.7, sugar: 2.6, saturated_fat: 6.1, sodium: 2 },
  { name: "cashews", category: "Nuts", calories: 553, protein: 18, carbs: 30, fat: 44, fiber: 3.3, sugar: 5.9, saturated_fat: 7.8, sodium: 12 },
  { name: "macadamia nuts", category: "Nuts", calories: 718, protein: 8, carbs: 14, fat: 76, fiber: 8.6, sugar: 4.6, saturated_fat: 12, sodium: 5 },
  { name: "peanut butter", category: "Nuts", calories: 588, protein: 25, carbs: 20, fat: 50, fiber: 6, sugar: 9, saturated_fat: 10, sodium: 459 },
  { name: "almond butter", category: "Nuts", calories: 614, protein: 21, carbs: 19, fat: 56, fiber: 10, sugar: 4, saturated_fat: 4, sodium: 7 },
  { name: "chia seeds", category: "Nuts", calories: 486, protein: 17, carbs: 42, fat: 31, fiber: 34, sugar: 0, saturated_fat: 3.3, sodium: 16 },
  { name: "flaxseeds", category: "Nuts", calories: 534, protein: 18, carbs: 29, fat: 42, fiber: 27, sugar: 1.6, saturated_fat: 3.7, sodium: 30 },
  { name: "sunflower seeds", category: "Nuts", calories: 584, protein: 21, carbs: 20, fat: 51, fiber: 8.6, sugar: 2.6, saturated_fat: 4.5, sodium: 9 },
  { name: "pumpkin seeds", category: "Nuts", calories: 559, protein: 30, carbs: 11, fat: 49, fiber: 6, sugar: 1.4, saturated_fat: 8.7, sodium: 7 },

  // ============================================
  // OILS & FATS
  // ============================================
  { name: "olive oil", category: "Oils", calories: 884, protein: 0, carbs: 0, fat: 100, fiber: 0, sugar: 0, saturated_fat: 14, sodium: 2 },
  { name: "coconut oil", category: "Oils", calories: 862, protein: 0, carbs: 0, fat: 100, fiber: 0, sugar: 0, saturated_fat: 82, sodium: 0 },
  { name: "canola oil", category: "Oils", calories: 884, protein: 0, carbs: 0, fat: 100, fiber: 0, sugar: 0, saturated_fat: 7, sodium: 0 },
  { name: "vegetable oil", category: "Oils", calories: 884, protein: 0, carbs: 0, fat: 100, fiber: 0, sugar: 0, saturated_fat: 15, sodium: 0 },

  // ============================================
  // SUPPLEMENTS & SPORTS NUTRITION
  // ============================================
  { name: "whey protein", category: "Supplements", calories: 400, protein: 80, carbs: 10, fat: 5, fiber: 0, sugar: 5, saturated_fat: 2, sodium: 200 },
  { name: "whey protein isolate", category: "Supplements", calories: 370, protein: 90, carbs: 2, fat: 1, fiber: 0, sugar: 1, saturated_fat: 0.5, sodium: 150 },
  { name: "casein protein", category: "Supplements", calories: 370, protein: 80, carbs: 4, fat: 3, fiber: 0, sugar: 2, saturated_fat: 1, sodium: 200 },
  { name: "protein bar", category: "Supplements", calories: 350, protein: 20, carbs: 40, fat: 12, fiber: 3, sugar: 20, saturated_fat: 5, sodium: 200 },
  { name: "creatine", category: "Supplements", calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0, saturated_fat: 0, sodium: 0 },

  // ============================================
  // SNACKS & SWEETS
  // ============================================
  { name: "rice cakes", category: "Snacks", calories: 387, protein: 8, carbs: 82, fat: 2.8, fiber: 4.2, sugar: 0, saturated_fat: 0.6, sodium: 130 },
  { name: "popcorn", category: "Snacks", calories: 387, protein: 13, carbs: 78, fat: 4.5, fiber: 15, sugar: 0.9, saturated_fat: 0.6, sodium: 8 },
  { name: "dark chocolate", category: "Snacks", calories: 546, protein: 5, carbs: 60, fat: 31, fiber: 7, sugar: 48, saturated_fat: 19, sodium: 12 },
  { name: "milk chocolate", category: "Snacks", calories: 535, protein: 7, carbs: 59, fat: 30, fiber: 2, sugar: 52, saturated_fat: 18, sodium: 75 },
  { name: "chips", category: "Snacks", calories: 536, protein: 7, carbs: 53, fat: 33, fiber: 4.4, sugar: 0.5, saturated_fat: 3, sodium: 550 },
  { name: "tim tams", category: "Snacks", calories: 505, protein: 5.5, carbs: 60, fat: 27, fiber: 2, sugar: 45, saturated_fat: 16, sodium: 130 },
  { name: "vegemite", category: "Snacks", calories: 174, protein: 25, carbs: 15, fat: 0.5, fiber: 0, sugar: 0, saturated_fat: 0, sodium: 3450 },

  // ============================================
  // CONDIMENTS & SAUCES
  // ============================================
  { name: "tomato sauce", category: "Condiments", calories: 100, protein: 1, carbs: 24, fat: 0.2, fiber: 0.4, sugar: 22, saturated_fat: 0, sodium: 900 },
  { name: "soy sauce", category: "Condiments", calories: 53, protein: 8, carbs: 4.9, fat: 0, fiber: 0.8, sugar: 0.4, saturated_fat: 0, sodium: 5493 },
  { name: "mayonnaise", category: "Condiments", calories: 680, protein: 1, carbs: 1, fat: 75, fiber: 0, sugar: 1, saturated_fat: 6, sodium: 635 },
  { name: "hummus", category: "Condiments", calories: 166, protein: 8, carbs: 14, fat: 9.6, fiber: 6, sugar: 0.3, saturated_fat: 1.4, sodium: 379 },
  { name: "tzatziki", category: "Condiments", calories: 54, protein: 3, carbs: 4, fat: 3, fiber: 0.2, sugar: 3, saturated_fat: 1.5, sodium: 220 },
  { name: "pesto", category: "Condiments", calories: 400, protein: 5, carbs: 5, fat: 40, fiber: 1, sugar: 2, saturated_fat: 7, sodium: 750 },
  { name: "pasta sauce", category: "Condiments", calories: 50, protein: 1.5, carbs: 8, fat: 1.5, fiber: 1.5, sugar: 5, saturated_fat: 0.2, sodium: 400 },
  { name: "honey", category: "Condiments", calories: 304, protein: 0.3, carbs: 82, fat: 0, fiber: 0.2, sugar: 82, saturated_fat: 0, sodium: 4 },
  { name: "maple syrup", category: "Condiments", calories: 260, protein: 0, carbs: 67, fat: 0, fiber: 0, sugar: 60, saturated_fat: 0, sodium: 12 },
  { name: "jam", category: "Condiments", calories: 250, protein: 0.4, carbs: 62, fat: 0.1, fiber: 0.5, sugar: 49, saturated_fat: 0, sodium: 15 },

  // ============================================
  // DRINKS
  // ============================================
  { name: "orange juice", category: "Drinks", calories: 45, protein: 0.7, carbs: 10, fat: 0.2, fiber: 0.2, sugar: 8.4, saturated_fat: 0, sodium: 1 },
  { name: "apple juice", category: "Drinks", calories: 46, protein: 0.1, carbs: 11, fat: 0.1, fiber: 0.1, sugar: 10, saturated_fat: 0, sodium: 4 },
  { name: "coconut water", category: "Drinks", calories: 19, protein: 0.7, carbs: 3.7, fat: 0.2, fiber: 1.1, sugar: 2.6, saturated_fat: 0.2, sodium: 105 },
  { name: "coca cola", category: "Drinks", calories: 42, protein: 0, carbs: 10.6, fat: 0, fiber: 0, sugar: 10.6, saturated_fat: 0, sodium: 4 },
  { name: "beer", category: "Drinks", calories: 43, protein: 0.5, carbs: 3.6, fat: 0, fiber: 0, sugar: 0, saturated_fat: 0, sodium: 4 },
  { name: "red wine", category: "Drinks", calories: 85, protein: 0.1, carbs: 2.6, fat: 0, fiber: 0, sugar: 0.6, saturated_fat: 0, sodium: 4 },
  { name: "white wine", category: "Drinks", calories: 82, protein: 0.1, carbs: 2.6, fat: 0, fiber: 0, sugar: 1, saturated_fat: 0, sodium: 5 },

  // ============================================
  // PREPARED / COMMON MEALS
  // ============================================
  { name: "fried rice", category: "Meals", calories: 163, protein: 4.5, carbs: 24, fat: 5.5, fiber: 1, sugar: 1.5, saturated_fat: 1, sodium: 500 },
  { name: "butter chicken", category: "Meals", calories: 150, protein: 12, carbs: 6, fat: 9, fiber: 1, sugar: 3, saturated_fat: 4, sodium: 400 },
  { name: "sushi roll", category: "Meals", calories: 140, protein: 5, carbs: 26, fat: 2, fiber: 1, sugar: 5, saturated_fat: 0.4, sodium: 400 },
  { name: "pizza margherita", category: "Meals", calories: 250, protein: 11, carbs: 30, fat: 10, fiber: 2, sugar: 3, saturated_fat: 4.5, sodium: 550 },
  { name: "meat pie", category: "Meals", calories: 280, protein: 10, carbs: 24, fat: 16, fiber: 1, sugar: 2, saturated_fat: 7, sodium: 500 },
  { name: "sausage roll", category: "Meals", calories: 320, protein: 10, carbs: 22, fat: 22, fiber: 1, sugar: 1, saturated_fat: 10, sodium: 600 },
  { name: "dim sim", category: "Meals", calories: 200, protein: 7, carbs: 22, fat: 9, fiber: 1, sugar: 2, saturated_fat: 3.5, sodium: 500 },
  { name: "spring roll", category: "Meals", calories: 220, protein: 5, carbs: 25, fat: 11, fiber: 1.5, sugar: 2, saturated_fat: 2.5, sodium: 400 },
  { name: "pad thai", category: "Meals", calories: 155, protein: 8, carbs: 20, fat: 5, fiber: 1, sugar: 5, saturated_fat: 1, sodium: 650 },
  { name: "burrito", category: "Meals", calories: 170, protein: 8, carbs: 22, fat: 5, fiber: 2, sugar: 1.5, saturated_fat: 2, sodium: 500 },
  { name: "fish and chips", category: "Meals", calories: 210, protein: 10, carbs: 22, fat: 9, fiber: 1.5, sugar: 0.5, saturated_fat: 2, sodium: 350 },
  { name: "hot chips", category: "Meals", calories: 270, protein: 3, carbs: 35, fat: 14, fiber: 3, sugar: 0.3, saturated_fat: 2, sodium: 300 },
  { name: "wedges", category: "Meals", calories: 230, protein: 3, carbs: 30, fat: 11, fiber: 2.5, sugar: 0.3, saturated_fat: 1.5, sodium: 350 },
];

// Search function with smart matching
export function searchFoodDatabase(query: string): FoodEntry[] {
  const q = query.toLowerCase().trim();
  if (!q) return [];

  // Exact match first
  const exact = FOOD_DATABASE.filter((f) => f.name === q);
  if (exact.length > 0) return exact;

  // Strong match: query contains food name or food name contains query
  const strong = FOOD_DATABASE.filter((f) => f.name.includes(q) || q.includes(f.name));
  if (strong.length > 0) return strong;

  // Word-based match: all words in query appear in food name
  const words = q.split(/\s+/).filter((w) => w.length > 1);
  const wordMatch = FOOD_DATABASE.filter((f) =>
    words.every((w) => f.name.includes(w))
  );
  if (wordMatch.length > 0) return wordMatch;

  // Fuzzy: any word matches
  const fuzzy = FOOD_DATABASE.filter((f) =>
    words.some((w) => f.name.includes(w))
  );
  return fuzzy.slice(0, 10);
}

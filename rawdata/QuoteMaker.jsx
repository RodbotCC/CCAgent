import React, { useState, useMemo, useEffect } from "react";
import { Search, Plus, Minus, X, FileDown, Users, ChevronRight, Trash2 } from "lucide-react";

const MENU_DATA = {"Appetizers": [{"_section": "Cold Appetizers"}, {"name": "Asparagus and Broccoli Mix", "price": 3.0}, {"name": "Asparagus wrap", "price": 5.0}, {"name": "Avocado Skins", "price": 4.25}, {"name": "Bread & Butter", "price": 1.99}, {"name": "Bruschetta", "price": 2.5}, {"name": "Chicken Salad Mini Cups", "price": 2.5}, {"name": "Chicken Salad Sandwiches on Cheese Bread", "price": 3.5}, {"name": "Endive", "price": 6.0}, {"name": "Fruit Skewers or Caprese Skewers", "price": 2.95}, {"name": "Figs", "price": 6.5}, {"name": "Quinoa & Chickpea Salad in Mini Cups", "price": 2.5}, {"name": "Spanakopita Cups", "price": 5.0}, {"name": "Stuffed Mushrooms", "price": 3.0}, {"_section": "Hot Appetizers"}, {"name": "Assorted Croquettes (3-in-1 Sampler)", "price": 8.5}, {"name": "Buffalo Chicken Dip", "price": 3.0}, {"name": "Chicken Wings", "price": 7.0}, {"name": "Papa Rellena (Mashed potato balls with meat filling)", "price": 3.75}, {"name": "Fried Polenta (Corn)", "price": 2.5}, {"name": "Garlic Bread or garlic pamesan bread", "price": 2.99}, {"_section": "Seafood"}, {"name": "Garlic Shrimp", "price": 5.0}, {"name": "Grilled Tequila Lime Shrimp", "price": 7.0}, {"name": "Scallops & Bacon", "price": 9.5}, {"_section": "Croquettes"}, {"name": "Assorted Croquettes (3-in-1 Sampler)", "price": 8.5}, {"name": "Beef & Yuca Croquettes", "price": 3.5}, {"name": "Corn & Cheese Croquettes", "price": 3.5}, {"name": "Chicken & Cheese Croquettes", "price": 3.5}, {"name": "Chicken Only Croquettes (Coxhina)", "price": 3.5}, {"_section": "Pão de Queijo (Cheese Bread)"}, {"name": "Parmesan Garlic Pão de Queijo", "price": 2.99}, {"name": "Traditional Classic Pão de Queijo", "price": 2.5}, {"_section": "Mini Turnovers"}, {"name": "Beef Mini Turnovers", "price": 2.5}, {"name": "Cheese Mini Turnovers", "price": 2.5}, {"name": "Chicken Mini Turnovers", "price": 2.5}, {"name": "Mini Turnover Sampler (3-in-1 Appetizer)", "price": 5.95}, {"_section": "Meatballs"}, {"name": "BBQ Meatballs", "price": 5.0}, {"name": "Italian Meatballs", "price": 5.0}, {"name": "Swedish Meatballs", "price": 5.0}, {"name": "Sweet & Sour Meatballs", "price": 5.0}], "Mains": [{"_section": "Beef"}, {"name": "Beef Short Ribs", "price": 5.0}, {"name": "Beef Wellington", "price": 10.0}, {"name": "Beef or Chicken Fajitas"}, {"name": "Beef Stroganoff"}, {"name": "Flank Steak w/ Chimichurri"}, {"name": "Garlic Prime Sirloin (Picanha)", "price": 3.0}, {"name": "Prime Sirloin (Picanha)", "price": 3.0}, {"name": "Ribeye", "price": 9.0}, {"name": "Filet Mignon", "price": 8.0}, {"name": "Beef brisket w/madeira sauce"}, {"name": "Steak Florentine", "price": 7.0}, {"_section": "Chicken"}, {"name": "Oven roasted garlic & Rosemary chicken"}, {"name": "½ Chicken"}, {"name": "Stuffed Boneless Chicken"}, {"name": "Chicken  Marsala", "price": 2.0}, {"name": "Chicken Pasta Primavera"}, {"name": "Chicken, Beef or Tofu Stir Fry"}, {"name": "Chicken Broccoli Fettuccine Alfredo"}, {"name": "Veal Marsala", "price": 4.0}, {"name": "Coq Au Vin", "price": 4.0}, {"_section": "Pork"}, {"name": "Pork Tenderloin"}, {"name": "Pork Chops"}, {"name": "Pork Sausage"}, {"name": "Garlic Butter Porkloin"}, {"name": "Pig Roast", "price": 6.5}, {"_section": "Seafood"}, {"name": "Sea Bass", "price": 9.0}, {"name": "Tuna Steaks", "price": 11.0}, {"name": "Sesame Soy Tilapia", "price": 10.0}, {"name": "Salmon", "price": 8.0}, {"name": "Haddock", "price": 9.0}, {"name": "Baked Stuffed Seafood", "price": 10.0}, {"name": "Grilled Tilapia"}, {"_section": "Lamb"}, {"name": "Lamb Chops", "price": 7.0}, {"name": "Leg of Lamb", "price": 2.0}, {"_section": "Vegetarian"}, {"name": "Cauliflower Steak"}, {"name": "Tofu Steaks"}, {"name": "Stuffed Peppers"}, {"name": "Radicchio Cups", "price": 3.0}, {"name": "Stuffed Eggplant"}, {"name": "Lentil Loaf"}, {"name": "Vegetable Lasagna"}, {"name": "Beef Lasagna"}, {"name": "Chicken Lasagna"}, {"_section": "Deals"}, {"name": "Free Added Protein for Deluxe Churrasco or Higher", "price": -6.5}, {"name": "$19/pp Special", "price": -5.9}, {"_section": "Brunch"}, {"name": "Quiche - Broccoli & Spinach"}, {"name": "Quiche Bacon & Cheese"}, {"name": "Eggs (Scrambled with Cheese)"}, {"name": "Bacon"}, {"name": "Sausage"}], "Sides": [{"_section": "Potatoes"}, {"name": "Baked Potatoes"}, {"name": "Oven Roasted Potatoes"}, {"name": "Scalloped Potatoes", "price": 2.0}, {"name": "Twice Baked Potatoes", "price": 2.0}, {"name": "Mashed Potato Casserole", "price": 2.0}, {"name": "Garlic Mashed Potatoes"}, {"_section": "Rice & Grains"}, {"name": "Spanish Rice"}, {"name": "Spinach Rice"}, {"name": "Confetti Rice", "price": 2.0}, {"name": "Papa Rellena (Mashed potato balls with meat filling)", "price": 3.5}, {"name": "Brown Rice"}, {"name": "Wild Rice"}, {"name": "Risotto", "price": 2.0}, {"name": "Couscous"}, {"name": "Quinoa"}, {"name": "Brazilian Risotto (Piemontese Rice)"}, {"name": "Rice"}, {"_section": "Vegetables"}, {"name": "Carrots (savory, tarragon, glazed)"}, {"name": "Sautéed Green Beans"}, {"name": "Asparagus Wraps", "price": 5.0}, {"name": "Steamed Asparagus", "price": 3.0}, {"name": "Summer Squash and Zucchini"}, {"name": "Broccoli"}, {"name": "Cauliflower"}, {"name": "Vegetable Medley"}, {"name": "Collard Greens"}, {"_section": "Beans"}, {"name": "Beans"}, {"name": "Tropeiro Beans"}, {"name": "Black Beans"}, {"_section": "Specialty Items"}, {"name": "Mac N Cheese"}, {"name": "Buttered Cavatappi Pasta"}, {"name": "Yuca (Fried)"}, {"name": "Plantains"}, {"name": "Papa Rellena (Spanish mashed potato balls with savory filling, fried)", "price": 3.75}, {"_section": "Brunch"}, {"name": "Yogurt"}, {"name": "Pancakes"}, {"name": "Dadinhos de Tapioca with Jelly"}], "Platters & Boards": [{"_section": "Platters"}, {"name": "Cheese and Crackers", "desc": "A variety of domestic and imported cheese, as well as cheese spreads served with an array of flavorful crackers and crostini.", "price": 4.95}, {"name": "Fruit Platter", "desc": "Seasonal Fruits such as:\nWatermelon, Honeydew, Pineapple\nGrapes, Cantelope", "price": 4.95}, {"name": "Veggie Platter", "desc": "Carrots, Broccoli, Celery, Cherry Tomatoes\nwith Ranch Dipping Sauce.", "price": 4.95}, {"name": "Grilled Vegetable Medley", "desc": "Summer Squash, Zucchini, Carrots, Broccoli.", "price": 4.95}, {"name": "Hummus", "desc": "Roasted garlic hummus, red pepper hummus, lemon fennel, and sun-dried tomato\nbasil hummus. Served with tortilla chips, pita chips, crostini, and fresh baby carrots, celery, and peppers.", "price": 6.5}, {"name": "Shrimp Cocktail", "desc": "Cooked shrimp served with fresh lemon wedges and spicy cocktail sauce\non top of a bed of shaved ice garnished with sprigs of parsley.", "price": 12.0}, {"_section": "Charcuterie"}, {"name": "Charcuterie Board:\nClassic Meats & Cheeses", "desc": "What's on It:\nCheeses: Sharp cheddar, gouda, and brie\nMeats: Salami, prosciutto, and pepperoni\nAccompaniments: Crackers, mixed nuts, and olives", "price": 12.5}, {"name": "Charcuterie Board:\nVegetarian Board", "desc": "What's On It:\nCheeses: Goat cheese, cheddar, and havarti\nAccompaniments: Fresh vegetables (carrot sticks, cherry tomatoes, cucumber slices), hummus, ranch, and mixed nuts\nExtras: Grapes and apple slices", "price": 9.0}, {"_section": "Tabletops"}, {"name": "Tabletop Hot Appetizer Platter", "desc": "Each table of 6–7 gets its own hot sampler: mini empanadas, croquettes, and zesty rose dipping sauce.", "price": 7.5}, {"name": "Mini Charcuterie", "desc": "Mini board, major flavors: salami, pepperoni, mixed nuts, berries, cheese: 1 board at each table for approx. 6–7 guests covered.", "price": 8.95}], "Soups & Salads": [{"_section": "Complimentary Salads"}, {"name": "Complimentary Cesar Salad", "price": 0.01}, {"name": "Complimentary Garden Salad", "price": 0.01}, {"name": "Remove Salad from Package", "price": -3.5}, {"_section": "Salads"}, {"name": "Asian Vegetable Salad", "price": 5.0}, {"name": "Beet & Radish Salad", "price": 6.0}, {"name": "Broccoli Salad", "price": 3.5}, {"name": "Caesar Salad", "price": 3.5}, {"name": "Chefs Salad", "price": 3.5}, {"name": "Garden Salad", "price": 3.5}, {"name": "Pasta Salad", "price": 3.5}, {"name": "The Wedge", "price": 3.5}, {"name": "Quinoa Chickpea Feta Salad w/Balsamic Drizzle", "price": 3.5}, {"name": "Quinoa Spinach Salad", "price": 4.0}, {"name": "Vinaigrette Salad", "price": 3.5}, {"name": "Spinach Arugula Green Salad", "price": 3.5}, {"name": "Potato Salad", "price": 3.5}, {"name": "Roasted Zucchini & Summer squash", "price": 3.5}, {"name": "Mango & Mint Salad", "price": 4.0}, {"name": "Brazilian style chicken salad (salpicao)", "price": 6.5}, {"name": "Brazilian tropical corn salad", "price": 4.25}, {"_section": "Soups"}, {"name": "Chicken Soup", "price": 6.5}, {"name": "Turkey Soup", "price": 6.5}, {"name": "Beef Vegetable", "price": 6.5}, {"name": "Broccoli & Cheese", "price": 6.5}, {"name": "Chickpea & Kale", "price": 6.5}, {"name": "Clam Chowder", "price": 8.5}, {"name": "Corn Chowder", "price": 6.5}, {"name": "French Onion Soup", "price": 6.5}, {"name": "Mushroom Veloute", "price": 6.5}, {"name": "Beef Stew", "price": 6.5}, {"name": "Chicken Stew", "price": 6.5}, {"name": "Turkey Stew", "price": 6.5}, {"name": "Tomato Basil Soup", "price": 6.5}, {"name": "Lobster Bisque", "price": 9.5}, {"_section": "Desserts"}, {"name": "Flan", "price": 4.95}, {"name": "Brigadeiro", "price": 4.95}, {"name": "Chocolate Truffle", "price": 4.95}, {"name": "Passion Fruit Mousse", "price": 4.95}, {"name": "Chocolate Mousse", "price": 4.95}, {"name": "Grilled Pineapple w/ Cin. Sugar", "price": 4.95}, {"name": "FREE COMPLIMENTARY COOKIES", "price": "FREE"}], "Bar/Beverage": [{"_section": "Set Up"}, {"name": "Non-Alcoholic Station Setup", "desc": "Setup includes, equipment disposable napkins, straws, ice, cups, garnishes, etc.", "price": 85.0}, {"name": "Standard Bar Setup", "desc": "Complete bar setup with all essentials\n—equipment, ice, disposable cups, garnishes, and liability coverage", "price": 150.0}, {"name": "Beverage Package Only", "desc": "Select Beverage Package Below {disposable cups  }", "price": 0.01}, {"name": "Brunch", "desc": "Select Beverage Package Below", "price": 0.01}, {"_section": "Cash Bar"}, {"name": "Standard Cash Bar", "desc": "Cash Bar Pricing: Specialty Drinks: $9-10, Liquor Drinks: $6-8, Beers: $6, White or Red Sangria: $6, Red Wine & White Wine: $6. Soft Drinks: $2.", "price": 6.5}, {"name": "Extra Hour Cash Bar", "desc": "Extend your bar service beyond the standard 4 hours with an additional hour.", "price": 1.95}, {"name": "Add Open Bar Time: Beer & Wine", "desc": "Beer & Wine: Open Bar (1 Hour)", "price": 12.0}, {"name": "Add Open Bar Time: Full Bar", "desc": "Full Bar: Open Bar (1 Hour)", "price": 15.0}, {"_section": "Open Bar"}, {"name": "Open Bar: Beer & Wine", "desc": "$22 per person. Includes beer, red & white wine, red/white sangria, and soft drinks.  If desired to do just 1 hr open bar, 1st hour open bar will be  $11\nExtra Hour for beer & wine would be: $7", "price": 22.0}, {"name": "Open Bar: Beer & Wine \nw/ 3 Signature Drinks", "desc": "$27 per person. Includes 3 specialty drinks, beer, red & white wine, red/white sangria, and soft drinks.  If desired to do just 1 hr open bar, 1st hour open bar will be  $12\nExtra Hour would be full bar + 3 sig. drinks would be: $8", "price": 27.0}, {"name": "Open Bar: Full Bar", "desc": "$30 per person. beer, red & white wine, red/white sangria, liquor, and soft drinks. If desired to do just 1 hr open bar, 1st hour open bar will be  $16\nAdd top shelf option: $4 - $8 per person.\nExtra Hour would be for full bar would be: $8", "price": 30.0}, {"name": "Open Bar: Full Bar + 2 Signature Drinks", "desc": "$35 per person. beer, red & white wine, red/white sangria, liquor, 2 signature drinks, and soft drinks.  If desired to do just 1 hr open bar, 1st hour open bar will be  $19\nAdd top shelf option: $4 - $8 per person.\nExtra Hour would be for full bar + 2 sig. drinks would be: $9", "price": 35.0}, {"_section": "Extras"}, {"name": "Wine pouring service", "desc": "Our team will personally offer wine to your guests during the event.", "price": 3.0}, {"name": "Water service at table (disposable)", "desc": "Disposable water service at each table, ensuring guests stay refreshed.", "price": 2.5}, {"name": "Water Station", "desc": "Tabled Station:\nCome with Water Pitchers staying filled, Disposable Cups, and Ice", "price": 2.0}, {"name": "Real glass water glass", "desc": "Glassware", "price": 1.25}, {"name": "Real wine glass", "desc": "Glassware", "price": 1.25}, {"name": "Real champagne glass", "desc": "Glassware", "price": 1.5}, {"name": "Champagne service (disposable flutes)", "desc": "Bar Service", "price": 3.99}, {"name": "Champagne service (real flutes)", "desc": "Bar Service", "price": 5.95}, {"name": "Mocktail Dispenser Station", "desc": "Pick 2\nLemonade Iced Tea Twist\nTropical Citrus Cooler\nPassion Fruit Spritzer\nCranberry Citrus Fizz\nBlueberry Lemonade Cooler", "price": 3.0}, {"name": "Beverage Package", "desc": "Coke, Sprite, Diet Coke Cans, Bottled Water \nand 2 refillable table dispensers \n(can be lemonade, ice tea or one of our juices)", "price": 6.5}, {"_section": "Brunch"}, {"name": "Tea, Juices and Mimosas", "desc": "A variety of hot teas, fresh juices & sparkling mimosas to brighten your brunch.", "price": 13.0}], "Kids Menu": [{"name": "Chicken Fingers and Fries", "price": 4.5}, {"name": "Mac & Cheese", "price": 3.0}, {"name": "Penne Pasta w/Butter or Marinara Sauce", "price": 3.0}, {"name": "Mini Burger Sliders w/Fries", "price": 4.5}, {"name": "Full Dinner (Half Off)", "price": 12.45}], "Rentals/Extras": [{"name": "Cake Cutting", "desc": "Expert cake cutting, from slicing to plating and serving, ensuring your guests enjoy dessert promptly. Comes with Free High End Disposable Flatware", "price": 7.5}, {"name": "Real china set Apps+Dinner+Bussing", "desc": "Real China\nUpgrade your dining experience with real china, \nappetizer plate, dinner plate, silverware.\nIncludes Table Bussing in this upgrade at $4/pp", "price": 9.95}, {"name": "Real china set Apps+Dinner+Bussing+Setup", "desc": "Real China\nUpgrade your dining experience with real china, \nappetizer plate, dinner plate, silverware.\nIncludes Table Setup in this upgrade at $4/pp\nIncludes Table Bussing in this upgrade at $4/pp", "price": 13.95}, {"name": "Real china: Dinner Only+Bussing", "desc": "Real China\nUpgrade your dining experience with real china, \nincludes flatware and silverware\n(Dinner Only - No Appetizers)\nIncludes Table Bussing in this upgrade at $4/pp", "price": 7.5}, {"name": "Real china: Dinner Only+Bussing+Setup", "desc": "Real China\nUpgrade your dining experience with real china, \nincludes flatware and silverware\n(Dinner Only - No Appetizers)\nIncludes Table Setup in this upgrade at $4/pp\nIncludes Table Bussing in this upgrade at $4/pp", "price": 11.5}, {"name": "Real china: Add Desserts/Cake", "desc": "Real China\nUpgrade your dining experience with real china, \nincludes flatware and silverware\n(Desserts / Cake)\n\nIncludes Table Bussing in this upgrade at $1/pp", "price": 2.95}, {"name": "Real Fork, Knife & Spoon", "desc": "...", "price": 2.5}, {"name": "Passed Hors-d'Oeuvres Service", "desc": "Servers will offer your guests appetizers from elegant trays.", "price": 0.01}, {"name": "Tableware  High-end disposable plates, silverware", "desc": "& napkins", "price": 3.5}, {"name": "Coffee & Tea Service", "desc": "Coffee & Tea Service", "price": 2.5}, {"name": "Cloth Napkins", "desc": "color and size TBD", "price": 3.0}, {"name": "Table Clearing: Disposables", "desc": "Table Clearing (Bussers): Responsible for clearing plates, utensils, and maintaining clean dining tables, ensuring a tidy and comfortable environment for your guests.", "price": 4.5}, {"name": "Table Clearing: China", "desc": "Table Clearing (Bussers): Responsible for clearing plates, utensils, and maintaining clean dining tables, ensuring a tidy and comfortable environment for your guests.", "price": 4.5}, {"name": "Table Setup - Linens Only", "desc": "Setting Up Tables for: Tablecloths & Napkins (if applicable) Only", "price": 4.5}, {"name": "Table Setup - China & Silverware Only", "desc": "Setting Up Tables for: China & Silverware Only", "price": 9.0}, {"name": "Table Setup - China & Linens", "desc": "Setting Up Tables for: China & Linens", "price": 4.5}, {"name": "Table Setup - Misc", "desc": "Setting Up Tables for: China"}, {"name": "Rodizio: Family Style Sides", "desc": "Serving your side dishes tableside", "price": 5.0}, {"name": "Churrasco: Family Style", "desc": "Upgrade your Churrasco Buffet with a Family Style Service\nwhere our staff serves hearty selections in portions designed for all to share", "price": 10.0}, {"name": "Churrasco: Plated Style", "desc": "Upgrade your Churrasco Buffet into a Plated Service\nwhere our professional staff serve each guest their choice of protein alongside two sides, all from a custom curated menu provided in advance", "price": 15.0}, {"name": "Drop Off: \nWire Chafers & Sternos for Drop Off", "desc": "Self-Heating Trays with Sternos Flame so you can keep your drop off warm", "price": "#VALUE!"}, {"name": "Drop Off: \nBuffet Setup Service", "desc": "Self-Heating Trays with Sternos Flame so you can keep your drop off warm", "price": "#VALUE!"}, {"name": "FREE High end Disposable Flatware & Silverware", "desc": "& napkins", "price": 0.01}, {"name": "Cake Cutting ( Special Set up)", "desc": "Expert cake cutting, from slicing to plating and we will arrange it on your Buffet table .  Comes with Free High End Disposable Flatware", "price": 4.0}], "Services": [{"name": "Mini Buffet", "desc": "Self-Serve Attended Buffet\n1 main course + 2 sides + 1 Salad\nAttended: Setup + Breakdown + Refreshing Buffet\nBudget Option: Switch to drop off & save $3/pp", "price": 24.9, "mains": 1.0, "sides": 2.0, "staff": 3.0}, {"name": "Full Buffet", "desc": "Self-Serve Attended Buffet\n2 main course + 3 sides + 1 Salad\nAttended: Setup + Breakdown + Refreshing Buffet\nBudget Option: Switch to drop off & save $3/pp", "price": 31.9, "mains": 2.0, "sides": 3.0, "staff": 3.0}, {"name": "Deluxe Buffet", "desc": "Self-Serve Attended Buffet\n3 main course + 3 sides + 1 Salad\nAttended: Setup + Breakdown + Refreshing Buffet\nBudget Option: Switch to drop off & save $3/pp", "price": 37.9, "mains": 3.0, "sides": 3.0, "staff": 3.0}, {"name": "Family Style: Mini", "desc": "Staff & Service: Family-Style Presentation\n1 Main  + 2 Sides + 1 Salad\nCelebrate togetherness with our family-style service, where our staff serves hearty selections in portions designed for all to share.", "price": 29.9, "mains": 1.0, "sides": 2.0, "staff": 10.0}, {"name": "Family Style: Full", "desc": "Staff & Service: Family-Style Presentation\n2 Mains + 4 Sides + 1 Salad\nCelebrate togetherness with our family-style service, where our staff serves hearty selections in portions designed for all to share.", "price": 35.9, "mains": 2.0, "sides": 4.0, "staff": 10.0}, {"name": "Family Style: Deluxe", "desc": "Staff & Service: Family-Style Presentation\n3 Mains + 6 sides + 1 Salad\nCelebrate togetherness with our family-style service, where our staff serves hearty selections in portions designed for all to share.", "price": 44.1, "mains": 3.0, "sides": 6.0, "staff": 10.0}, {"name": "Mini Plated Service", "desc": "Staff & Service: Personalized Plated Presentation\n1 Protein Choice + 2 Sides + 1 salad\nExperience plated catering as our professional staff serve each guest their choice of protein alongside two sides, all from a custom curated menu provided in advance.\nBudget Option: Switch to Family Style Plated & save $5/pp", "price": 32.4, "mains": 1.0, "sides": 2.0, "staff": 15.0}, {"name": "Full Plated Service", "desc": "Staff & Service: Personalized Plated Presentation\n2 Protein Choices + 4 Sides + 1 salad\nExperience plated catering as our professional staff serve each guest their choice of protein alongside two sides, all from a custom curated menu provided in advance.\nBudget Option: Switch to Family Style Plated & save $5/pp", "price": 38.4, "mains": 2.0, "sides": 4.0, "staff": 15.0}, {"name": "Deluxe Plated Service", "desc": "Staff & Service: Personalized Plated Presentation\n3 Protein Choices + 6 sides + 1 salad\nExperience plated catering as our professional staff serve each guest their choice of protein alongside two sides, all from a custom curated menu provided in advance.\nBudget Option: Switch to Family Style Plated & save $5/pp", "price": 44.1, "mains": 3.0, "sides": 6.0, "staff": 15.0}, {"name": "Mini Drop Off", "desc": "Drop Off Buffet Tray Service\n1 main course + 2 sides + 1 Salad\nRecommended: Upgrade to Add Self-Heating Wire Chafers & Sternos +5%\nRequires: Delivery Service $2/mi\nRecommended: Add a Buffet Setup Service +5%", "price": 24.9, "mains": 1.0, "sides": 2.0, "staff": 0.0}, {"name": "Full Drop Off", "desc": "Drop Off Buffet Tray Service\n2 main course + 3 sides + 1 Salad\nRecommended: Upgrade to Add Self-Heating Wire Chafers & Sternos +5%\nRequires: Delivery Service $2/mi\nRecommended: Add a Buffet Setup Service +5%", "price": 31.9, "mains": 2.0, "sides": 3.0, "staff": 0.0}, {"name": "Deluxe Drop Off", "desc": "Drop Off Buffet Tray Service\n3 main course + 3 sides + 1 Salad\nRecommended: Upgrade to Add Self-Heating Wire Chafers & Sternos +5%\nRequires: Delivery Service $2/mi\nRecommended: Add a Buffet Setup Service +5%", "price": 37.9, "mains": 3.0, "sides": 3.0, "staff": 0.0}, {"name": "Mini Churrasco", "desc": "Churrasco Self-Serve Attended Buffet \n1 meat + 2 sides + 1 salad\nAttended: Setup + Breakdown + Refreshing Buffet\nBring the Brazilian grill to your event with our Churrasco service, featuring onsite grilling and an optional Rodizio upgrade (+$20/pp) for continuous tableside service.", "price": 29.95, "mains": 1.0, "sides": 2.0, "staff": 3.0}, {"name": "Full Churrasco", "desc": "Churrasco Self-Serve Attended Buffet\n2 meats + 3 sides + 1 salad\nAttended: Setup + Breakdown + Refreshing Buffet\nBring the Brazilian grill to your event with our Churrasco service, featuring onsite grilling and an optional Rodizio upgrade (+$20/pp) for continuous tableside service.", "price": 36.9, "mains": 2.0, "sides": 3.0, "staff": 3.0}, {"name": "Deluxe Churrasco", "desc": "Churrasco Self-Serve Attended Buffet\n3 meats + 3 sides + 1 salad\nAttended: Setup + Breakdown + Refreshing Buffet\nBring the Brazilian grill to your event with our Churrasco service, featuring onsite grilling and an optional Rodizio upgrade (+$20/pp) for continuous tableside service.", "price": 41.9, "mains": 3.0, "sides": 3.0, "staff": 3.0}, {"name": "Supreme Churrasco", "desc": "Churrasco Self-Serve Attended Buffet\n4 meats +  3 sides + 1 salad\nAttended: Setup + Breakdown + Refreshing Buffet\nBring the Brazilian grill to your event with our Churrasco service, featuring onsite grilling and an optional Rodizio upgrade (+$20/pp) for continuous tableside service.", "price": 46.9, "mains": 4.0, "sides": 3.0, "staff": 3.0}, {"name": "Supreme+ Churrasco", "desc": "Churrasco Self-Serve Attended Buffet\n5 meats+ 3 sides + 2 salads\nAttended: Setup + Breakdown + Refreshing Buffet\nBring the Brazilian grill to your event with our Churrasco service, featuring onsite grilling and an optional Rodizio upgrade (+$20/pp) for continuous tableside service.", "price": 59.9, "mains": 5.0, "sides": 3.0, "staff": 3.0}, {"name": "Mini Churrasco Rodizio", "desc": "Churrasco w/Tableside Rodizio Service\n1 meat + 2 sides + 1 salad\nBring the Brazilian grill to your event with our Churrasco service, featuring onsite grilling and tableside meat service, with skewers brought to guests as part of the Churrasco experience, creating an authentic Brazilian dining atmosphere.\nRecommended: Add Family Style Sides for +$5/pp", "price": 29.95, "mains": 1.0, "sides": 2.0, "staff": 20.0}, {"name": "Full Churrasco Rodizio", "desc": "Churrasco w/Tableside Rodizio Service\n2 meats + 3 sides + 1 salad\nBring the Brazilian grill to your event with our Churrasco service, featuring onsite grilling and tableside meat service, with skewers brought to guests as part of the Churrasco experience, creating an authentic Brazilian dining atmosphere.\nRecommended: Add Family Style Sides for +$5/pp", "price": 36.9, "mains": 2.0, "sides": 3.0, "staff": 20.0}, {"name": "Deluxe Churrasco Rodizio", "desc": "Churrasco w/Tableside Rodizio Service\n3 meats + 3 sides + 1 salad\nBring the Brazilian grill to your event with our Churrasco service, featuring onsite grilling and tableside meat service, with skewers brought to guests as part of the Churrasco experience, creating an authentic Brazilian dining atmosphere.\nRecommended: Add Family Style Sides for +$5/pp", "price": 41.9, "mains": 3.0, "sides": 3.0, "staff": 20.0}, {"name": "Supreme Churrasco Rodizio", "desc": "Churrasco w/Tableside Rodizio Service\n4 meats +  3 sides + 1 salad\nBring the Brazilian grill to your event with our Churrasco service, featuring onsite grilling and tableside meat service, with skewers brought to guests as part of the Churrasco experience, creating an authentic Brazilian dining atmosphere.\nRecommended: Add Family Style Sides for +$5/pp", "price": 46.9, "mains": 4.0, "sides": 3.0, "staff": 20.0}, {"name": "Supreme+ Churrasco Rodizio", "desc": "Churrasco w/Tableside Rodizio Service\n5 meats+ 3 sides + 2 salads\nBring the Brazilian grill to your event with our Churrasco service, featuring onsite grilling and tableside meat service, with skewers brought to guests as part of the Churrasco experience, creating an authentic Brazilian dining atmosphere.\nRecommended: Add Family Style Sides for +$5/pp", "price": 59.9, "mains": 5.0, "sides": 3.0, "staff": 20.0}], "Extras": [{"name": "Added Main", "price": 6.5}, {"name": "Added Side", "price": 3.5}, {"name": "Added Salad", "price": 3.5}, {"name": "Table Clearing", "price": 3.0}, {"name": "Delivery Service", "price": 2.0}], "Vendor Meals": [{"name": "Vendor Meal (1 Protein + 2 Sides + Salad)\nBuffet", "price": "_Please specify in notes section what the dish selections are\nGarden or Cesar Salad\n5 Vendor Minimum"}, {"name": "Vendor Meals (2 Protein + 3 Sides + Salad)\nBuffet", "price": "_Please specify in notes section what the dish selections are\nGarden or Cesar Salad\n5 Vendor Minimum"}], "Brunch": [{"name": "Seasonal Fruit Salad", "price": 3.5}, {"name": "Yogurt", "price": 3.5}, {"name": "Deluxe Charcuterie Board", "price": 12.5}, {"name": "Fruit Platter", "price": 4.95}, {"name": "Veggie Platter", "price": 4.95}, {"name": "Assorted Bread, Butter & Jam Platter", "price": 5.95}, {"name": "Croissant & Assorted Muffins", "price": 6.5}, {"name": "Pancakes", "price": 4.95}, {"name": "Classic Bruchetta", "price": 2.75}, {"name": "Pao de Quejo (Cheese Bread) Plain", "price": 2.75}, {"name": "Pao de Quejo and Goiaba", "price": 3.0}, {"name": "Chicken Salad Mini Cups", "price": 2.75}, {"name": "Dadinhos de Tapioca with Jelly", "price": 3.75}, {"name": "Assorted Croquettes", "price": 5.95}, {"name": "Assorted Turnovers", "price": 5.95}, {"name": "Quiche: Brocolli & Spinach", "price": 8.5}, {"name": "Eggs, Bacon, Sausage", "price": 8.75}, {"name": "Eggs", "price": 2.75}, {"name": "Bacon", "price": 3.0}, {"name": "Sausage", "price": 3.0}, {"name": "Coffee & Tea", "price": 2.5}, {"name": "Juices (starts at $4/pp)", "price": 4.0}, {"name": "Extra Juices", "price": 2.0}, {"_section": "BAR"}, {"name": "Mimosa Open Bar (4hrs)", "price": 16.0}, {"name": "Mimosa Open Bar (1hr)", "price": 10.0}, {"name": "Mimosa Cash Bar + Bartender Service ($100)", "price": 2.75}]};

const CATEGORY_ORDER = [
  "Services", "Appetizers", "Mains", "Sides", "Soups & Salads",
  "Platters & Boards", "Bar/Beverage", "Brunch", "Kids Menu",
  "Vendor Meals", "Rentals/Extras", "Extras"
];

// Items that are flat-fee by nature (not per-person)
const FLAT_FEE_HINT = (item) => {
  const p = item.price;
  if (typeof p !== "number") return false;
  if (p >= 75) return true;
  // Setups, station fees, etc.
  const n = (item.name || "").toLowerCase();
  if (n.includes("setup") || n.includes("set up") || n.includes("station")) return true;
  return false;
};

const fmt = (n) => `$${(n || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const STORAGE_KEY = "comeketo_quote_v1";

export default function QuoteMaker() {
  const [activeCategory, setActiveCategory] = useState("Services");
  const [search, setSearch] = useState("");
  const [headcount, setHeadcount] = useState(50);
  const [eventName, setEventName] = useState("");
  const [clientName, setClientName] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [lineItems, setLineItems] = useState([]); // {id, category, name, desc, unitPrice, mode: 'pp'|'flat', qty}
  const [taxRate, setTaxRate] = useState(7);
  const [gratuityRate, setGratuityRate] = useState(18);
  const [hydrated, setHydrated] = useState(false);

  // Persist
  useEffect(() => {
    (async () => {
      try {
        const r = await window.storage.get(STORAGE_KEY);
        if (r && r.value) {
          const s = JSON.parse(r.value);
          setHeadcount(s.headcount ?? 50);
          setEventName(s.eventName ?? "");
          setClientName(s.clientName ?? "");
          setEventDate(s.eventDate ?? "");
          setLineItems(s.lineItems ?? []);
          setTaxRate(s.taxRate ?? 7);
          setGratuityRate(s.gratuityRate ?? 18);
        }
      } catch (e) {}
      setHydrated(true);
    })();
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const payload = JSON.stringify({ headcount, eventName, clientName, eventDate, lineItems, taxRate, gratuityRate });
    window.storage.set(STORAGE_KEY, payload).catch(() => {});
  }, [hydrated, headcount, eventName, clientName, eventDate, lineItems, taxRate, gratuityRate]);

  const filteredItems = useMemo(() => {
    if (search.trim()) {
      const q = search.toLowerCase();
      const all = [];
      Object.entries(MENU_DATA).forEach(([cat, items]) => {
        items.forEach((it) => {
          if (it._section) return;
          if ((it.name || "").toLowerCase().includes(q) || (it.desc || "").toLowerCase().includes(q)) {
            all.push({ ...it, _category: cat });
          }
        });
      });
      return { __search: true, items: all };
    }
    const items = MENU_DATA[activeCategory] || [];
    return { __search: false, items };
  }, [activeCategory, search]);

  const addItem = (item, category) => {
    const id = Math.random().toString(36).slice(2, 10);
    const isFlat = FLAT_FEE_HINT(item);
    setLineItems((prev) => [
      ...prev,
      {
        id,
        category: category || activeCategory,
        name: item.name,
        desc: item.desc || "",
        unitPrice: typeof item.price === "number" ? item.price : 0,
        mode: isFlat ? "flat" : "pp",
        qty: 1,
        // service package metadata
        mains: item.mains,
        sides: item.sides,
        staff: item.staff,
      },
    ]);
  };

  const removeItem = (id) => setLineItems((p) => p.filter((x) => x.id !== id));
  const updateItem = (id, patch) => setLineItems((p) => p.map((x) => (x.id === id ? { ...x, ...patch } : x)));

  const lineTotal = (li) => {
    const base = li.mode === "pp" ? li.unitPrice * headcount * li.qty : li.unitPrice * li.qty;
    return base;
  };

  const subtotal = lineItems.reduce((s, li) => s + lineTotal(li), 0);
  const tax = subtotal * (taxRate / 100);
  const gratuity = subtotal * (gratuityRate / 100);
  const total = subtotal + tax + gratuity;
  const perGuest = headcount > 0 ? total / headcount : 0;

  const exportQuote = () => {
    const html = buildExportHTML({
      eventName, clientName, eventDate, headcount,
      lineItems, lineTotal, subtotal, tax, gratuity, total, perGuest,
      taxRate, gratuityRate
    });
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `comeketo-quote-${(clientName || "draft").replace(/\s+/g, "-").toLowerCase()}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const clearAll = () => {
    if (confirm("Clear all line items and event details?")) {
      setLineItems([]);
      setEventName(""); setClientName(""); setEventDate("");
    }
  };

  return (
    <div className="qm-root">
      <style>{CSS}</style>

      {/* Header */}
      <header className="qm-header">
        <div className="qm-header-inner">
          <div className="qm-eyebrow">01 · QUOTE MAKER</div>
          <div className="qm-brand">Comeketo Catering.</div>
        </div>
        <h1 className="qm-title">Build a quote. <span className="qm-italic">Fast.</span></h1>
        <p className="qm-sub">Pick items, set headcount, ship the number.</p>
      </header>

      {/* Event details bar */}
      <section className="qm-event-bar">
        <div className="qm-field">
          <label>EVENT NAME</label>
          <input value={eventName} onChange={(e) => setEventName(e.target.value)} placeholder="Saturday at the Hendricks" />
        </div>
        <div className="qm-field">
          <label>CLIENT</label>
          <input value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="Hendricks family" />
        </div>
        <div className="qm-field">
          <label>DATE</label>
          <input type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} />
        </div>
        <div className="qm-field qm-field-headcount">
          <label>HEADCOUNT</label>
          <div className="qm-headcount">
            <button onClick={() => setHeadcount(Math.max(1, headcount - 5))} aria-label="decrease">−</button>
            <input type="number" min="1" value={headcount} onChange={(e) => setHeadcount(Math.max(1, parseInt(e.target.value) || 1))} />
            <button onClick={() => setHeadcount(headcount + 5)} aria-label="increase">+</button>
          </div>
        </div>
      </section>

      {/* Main split */}
      <main className="qm-main">
        {/* Left: catalog */}
        <section className="qm-catalog">
          <div className="qm-catalog-head">
            <div className="qm-search">
              <Search size={14} strokeWidth={1.6} />
              <input
                placeholder="Search the whole menu…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && <button onClick={() => setSearch("")} className="qm-clear-search"><X size={12} /></button>}
            </div>
          </div>

          {!search && (
            <div className="qm-tabs">
              {CATEGORY_ORDER.filter(c => MENU_DATA[c]).map((cat) => {
                const count = MENU_DATA[cat].filter(i => i.name).length;
                return (
                  <button
                    key={cat}
                    className={`qm-tab ${activeCategory === cat ? "qm-tab-active" : ""}`}
                    onClick={() => setActiveCategory(cat)}
                  >
                    <span>{cat}</span>
                    <span className="qm-tab-count">{count}</span>
                  </button>
                );
              })}
            </div>
          )}

          <div className="qm-items">
            {filteredItems.__search ? (
              filteredItems.items.length === 0 ? (
                <div className="qm-empty">No matches. Try a different word.</div>
              ) : (
                <>
                  <div className="qm-section-head">
                    <span>SEARCH</span>
                    <span className="qm-section-meta">{filteredItems.items.length} matches</span>
                  </div>
                  {filteredItems.items.map((it, i) => (
                    <ItemRow key={i} item={it} category={it._category} onAdd={() => addItem(it, it._category)} showCategory />
                  ))}
                </>
              )
            ) : (
              filteredItems.items.map((it, i) => {
                if (it._section) {
                  return (
                    <div key={i} className="qm-section-head">
                      <span>{it._section.toUpperCase()}</span>
                    </div>
                  );
                }
                return <ItemRow key={i} item={it} category={activeCategory} onAdd={() => addItem(it, activeCategory)} />;
              })
            )}
          </div>
        </section>

        {/* Right: quote panel */}
        <aside className="qm-quote">
          <div className="qm-quote-head">
            <div>
              <div className="qm-eyebrow">02 · LIVE QUOTE</div>
              <h2 className="qm-quote-title">The quote</h2>
            </div>
            {lineItems.length > 0 && (
              <button onClick={clearAll} className="qm-clear-all" title="Clear everything">
                <Trash2 size={13} strokeWidth={1.6} />
              </button>
            )}
          </div>

          {lineItems.length === 0 ? (
            <div className="qm-quote-empty">
              <p>Empty.</p>
              <p className="qm-quote-empty-sub">Add items from the catalog to build the quote.</p>
            </div>
          ) : (
            <>
              <div className="qm-line-items">
                {lineItems.map((li) => (
                  <LineItem
                    key={li.id}
                    li={li}
                    headcount={headcount}
                    total={lineTotal(li)}
                    onUpdate={(patch) => updateItem(li.id, patch)}
                    onRemove={() => removeItem(li.id)}
                  />
                ))}
              </div>

              <div className="qm-totals">
                <div className="qm-totals-row">
                  <span>Subtotal</span>
                  <span className="qm-tabular">{fmt(subtotal)}</span>
                </div>
                <div className="qm-totals-row qm-rate-row">
                  <span>
                    Tax
                    <input
                      type="number"
                      className="qm-rate-input"
                      value={taxRate}
                      onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                      step="0.5"
                      min="0"
                    />
                    %
                  </span>
                  <span className="qm-tabular">{fmt(tax)}</span>
                </div>
                <div className="qm-totals-row qm-rate-row">
                  <span>
                    Gratuity
                    <input
                      type="number"
                      className="qm-rate-input"
                      value={gratuityRate}
                      onChange={(e) => setGratuityRate(parseFloat(e.target.value) || 0)}
                      step="1"
                      min="0"
                    />
                    %
                  </span>
                  <span className="qm-tabular">{fmt(gratuity)}</span>
                </div>
                <div className="qm-totals-row qm-totals-grand">
                  <span>Total</span>
                  <span className="qm-tabular">{fmt(total)}</span>
                </div>
                <div className="qm-totals-row qm-totals-pg">
                  <span>Per guest</span>
                  <span className="qm-tabular">{fmt(perGuest)}</span>
                </div>
              </div>

              <button onClick={exportQuote} className="qm-export">
                <FileDown size={14} strokeWidth={1.6} />
                Export quote
              </button>
            </>
          )}
        </aside>
      </main>
    </div>
  );
}

function ItemRow({ item, category, onAdd, showCategory }) {
  const priceDisplay = typeof item.price === "number"
    ? `${fmt(item.price)}${FLAT_FEE_HINT(item) ? " flat" : "/pp"}`
    : "—";

  return (
    <div className="qm-item">
      <div className="qm-item-main">
        <div className="qm-item-name">
          {item.name}
          {showCategory && <span className="qm-item-cat">· {category}</span>}
        </div>
        {item.desc && <div className="qm-item-desc">{item.desc.split("\n")[0]}</div>}
        {(item.mains || item.sides) && (
          <div className="qm-item-includes">
            {item.mains ? `${item.mains} main${item.mains > 1 ? "s" : ""}` : ""}
            {item.mains && item.sides ? " · " : ""}
            {item.sides ? `${item.sides} side${item.sides > 1 ? "s" : ""}` : ""}
            {item.staff ? ` · ${item.staff} staff` : ""}
          </div>
        )}
      </div>
      <div className="qm-item-price qm-tabular">{priceDisplay}</div>
      <button className="qm-add-btn" onClick={onAdd} aria-label="Add to quote">
        <Plus size={14} strokeWidth={2} />
      </button>
    </div>
  );
}

function LineItem({ li, headcount, total, onUpdate, onRemove }) {
  return (
    <div className="qm-li">
      <div className="qm-li-row1">
        <div className="qm-li-name">{li.name}</div>
        <button onClick={onRemove} className="qm-li-remove" aria-label="Remove">
          <X size={12} strokeWidth={1.8} />
        </button>
      </div>
      <div className="qm-li-row2">
        <div className="qm-li-controls">
          <div className="qm-li-mode">
            <button
              className={li.mode === "pp" ? "active" : ""}
              onClick={() => onUpdate({ mode: "pp" })}
            >/pp</button>
            <button
              className={li.mode === "flat" ? "active" : ""}
              onClick={() => onUpdate({ mode: "flat" })}
            >flat</button>
          </div>
          <div className="qm-li-price">
            <span className="qm-li-dollar">$</span>
            <input
              type="number"
              value={li.unitPrice}
              onChange={(e) => onUpdate({ unitPrice: parseFloat(e.target.value) || 0 })}
              step="0.01"
              min="0"
            />
          </div>
          <div className="qm-li-qty">
            <button onClick={() => onUpdate({ qty: Math.max(1, li.qty - 1) })}>−</button>
            <span>×{li.qty}</span>
            <button onClick={() => onUpdate({ qty: li.qty + 1 })}>+</button>
          </div>
        </div>
        <div className="qm-li-total qm-tabular">{fmt(total)}</div>
      </div>
      <div className="qm-li-meta">
        {li.mode === "pp" ? `${fmt(li.unitPrice)} × ${headcount} guests${li.qty > 1 ? ` × ${li.qty}` : ""}` : `${fmt(li.unitPrice)}${li.qty > 1 ? ` × ${li.qty}` : ""} flat`}
      </div>
    </div>
  );
}

function buildExportHTML({ eventName, clientName, eventDate, headcount, lineItems, lineTotal, subtotal, tax, gratuity, total, perGuest, taxRate, gratuityRate }) {
  const fmtN = (n) => `$${(n || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const dateStr = eventDate ? new Date(eventDate + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" }) : "—";

  const grouped = {};
  lineItems.forEach(li => {
    if (!grouped[li.category]) grouped[li.category] = [];
    grouped[li.category].push(li);
  });

  const rows = Object.entries(grouped).map(([cat, items]) => {
    const itemsHtml = items.map(li => `
      <tr>
        <td class="li-name">
          <div>${escapeHtml(li.name)}</div>
          <div class="li-meta">${li.mode === "pp" ? `${fmtN(li.unitPrice)} × ${headcount}${li.qty > 1 ? ` × ${li.qty}` : ""}` : `${fmtN(li.unitPrice)}${li.qty > 1 ? ` × ${li.qty}` : ""} flat`}</div>
        </td>
        <td class="li-total">${fmtN(lineTotal(li))}</td>
      </tr>
    `).join("");
    return `
      <tr class="cat-head"><td colspan="2">${escapeHtml(cat).toUpperCase()}</td></tr>
      ${itemsHtml}
    `;
  }).join("");

  return `<!doctype html>
<html><head><meta charset="utf-8"><title>Quote · ${escapeHtml(clientName || "Comeketo Catering")}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,600;1,9..144,400&family=Inter:wght@400;500;600&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Inter, system-ui, sans-serif; background: #EBE8E0; color: #1f1d1a; padding: 60px 40px; }
  .doc { max-width: 760px; margin: 0 auto; background: #f5f3ec; padding: 60px 56px; border: 1px solid #d8d3c6; }
  .head { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 48px; padding-bottom: 24px; border-bottom: 1px solid #d8d3c6; }
  .eyebrow { font-size: 11px; letter-spacing: 0.12em; color: #8a8478; font-family: 'JetBrains Mono', ui-monospace, monospace; }
  .brand { font-family: Fraunces, serif; font-size: 22px; font-style: italic; }
  h1 { font-family: Fraunces, serif; font-size: 44px; font-weight: 400; line-height: 1.05; margin-top: 8px; letter-spacing: -0.01em; }
  .meta-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 32px; margin-bottom: 40px; }
  .meta-grid .label { font-size: 11px; letter-spacing: 0.12em; color: #8a8478; margin-bottom: 6px; font-family: 'JetBrains Mono', monospace; }
  .meta-grid .val { font-size: 16px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 32px; }
  td { padding: 12px 0; vertical-align: top; }
  .cat-head td { font-size: 11px; letter-spacing: 0.12em; color: #8a8478; font-family: 'JetBrains Mono', monospace; padding-top: 24px; padding-bottom: 8px; border-bottom: 1px solid #e3ddd0; }
  .cat-head:first-child td { padding-top: 0; }
  tr:not(.cat-head) td { border-bottom: 1px solid #ede8db; font-size: 14px; }
  .li-name div:first-child { font-weight: 500; }
  .li-meta { color: #8a8478; font-size: 12px; margin-top: 2px; font-family: 'JetBrains Mono', monospace; font-feature-settings: "tnum"; }
  .li-total { text-align: right; font-feature-settings: "tnum"; font-family: 'JetBrains Mono', monospace; font-size: 13px; }
  .totals { margin-top: 32px; padding-top: 24px; border-top: 1px solid #d8d3c6; }
  .totals-row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 14px; }
  .totals-row .num { font-feature-settings: "tnum"; font-family: 'JetBrains Mono', monospace; }
  .totals-row.grand { font-family: Fraunces, serif; font-size: 28px; padding-top: 16px; margin-top: 8px; border-top: 1px solid #d8d3c6; }
  .totals-row.pg { color: #8a8478; font-size: 13px; }
  .footer { margin-top: 56px; padding-top: 24px; border-top: 1px solid #d8d3c6; font-size: 12px; color: #8a8478; text-align: center; font-family: 'JetBrains Mono', monospace; letter-spacing: 0.05em; }
  @media print { body { padding: 0; background: white; } .doc { border: none; box-shadow: none; } }
</style></head>
<body>
<div class="doc">
  <div class="head">
    <div>
      <div class="eyebrow">QUOTE</div>
      <h1>${escapeHtml(eventName || "Untitled event")}</h1>
    </div>
    <div class="brand">Comeketo<br>Catering.</div>
  </div>
  <div class="meta-grid">
    <div><div class="label">CLIENT</div><div class="val">${escapeHtml(clientName || "—")}</div></div>
    <div><div class="label">DATE</div><div class="val">${dateStr}</div></div>
    <div><div class="label">HEADCOUNT</div><div class="val">${headcount} guests</div></div>
  </div>
  <table>${rows}</table>
  <div class="totals">
    <div class="totals-row"><span>Subtotal</span><span class="num">${fmtN(subtotal)}</span></div>
    <div class="totals-row"><span>Tax (${taxRate}%)</span><span class="num">${fmtN(tax)}</span></div>
    <div class="totals-row"><span>Gratuity (${gratuityRate}%)</span><span class="num">${fmtN(gratuity)}</span></div>
    <div class="totals-row grand"><span>Total</span><span class="num">${fmtN(total)}</span></div>
    <div class="totals-row pg"><span>Per guest</span><span class="num">${fmtN(perGuest)}</span></div>
  </div>
  <div class="footer">PREPARED BY COMEKETO CATERING · ${new Date().toLocaleDateString()}</div>
</div>
</body></html>`;
}

function escapeHtml(s) {
  return String(s || "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,500;0,9..144,600;1,9..144,400&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');

.qm-root {
  --bg: #EBE8E0;
  --bg-2: #f5f3ec;
  --bg-3: #faf8f1;
  --ink: #1f1d1a;
  --ink-2: #4a4640;
  --ink-3: #8a8478;
  --line: #d8d3c6;
  --line-2: #e3ddd0;
  --sage: #d6e3cc;
  --sage-ink: #3d5a2c;
  --lavender: #d8d2e8;
  --lavender-ink: #4a3a7a;
  --coral: #f0c9c2;
  --coral-ink: #8a3a2a;
  --cream: #e6dfcd;
  --cream-ink: #6a5d3e;
  --amber: #ead6b3;
  --amber-ink: #7a5a1e;
  background: var(--bg);
  color: var(--ink);
  min-height: 100vh;
  font-family: 'Inter', system-ui, sans-serif;
  padding: 32px 40px 60px;
}

.qm-tabular { font-family: 'JetBrains Mono', ui-monospace, monospace; font-feature-settings: "tnum"; }

/* Header */
.qm-header { max-width: 1500px; margin: 0 auto 32px; }
.qm-header-inner { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
.qm-eyebrow { font-family: 'JetBrains Mono', monospace; font-size: 11px; letter-spacing: 0.12em; color: var(--ink-3); }
.qm-brand { font-family: 'Fraunces', serif; font-style: italic; font-size: 18px; color: var(--ink); }
.qm-title { font-family: 'Fraunces', serif; font-weight: 400; font-size: clamp(40px, 5vw, 64px); line-height: 1; letter-spacing: -0.015em; margin-bottom: 8px; }
.qm-italic { font-style: italic; color: var(--ink-2); }
.qm-sub { font-size: 14px; color: var(--ink-3); }

/* Event bar */
.qm-event-bar {
  max-width: 1500px; margin: 0 auto 24px;
  display: grid; grid-template-columns: 1.4fr 1fr 1fr 0.9fr;
  gap: 1px;
  background: var(--line);
  border: 1px solid var(--line);
}
.qm-field { background: var(--bg-2); padding: 14px 18px; }
.qm-field label {
  display: block;
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px; letter-spacing: 0.14em; color: var(--ink-3);
  margin-bottom: 6px;
}
.qm-field input {
  width: 100%; background: transparent; border: none;
  font-family: 'Inter', sans-serif; font-size: 15px;
  color: var(--ink); padding: 0;
}
.qm-field input:focus { outline: none; }
.qm-field input::placeholder { color: var(--ink-3); opacity: 0.6; }

.qm-headcount { display: flex; align-items: center; gap: 4px; }
.qm-headcount button {
  width: 24px; height: 24px; border: 1px solid var(--line);
  background: var(--bg-3); color: var(--ink-2);
  font-size: 14px; cursor: pointer; border-radius: 999px;
  display: flex; align-items: center; justify-content: center;
  transition: all 0.15s;
}
.qm-headcount button:hover { background: var(--ink); color: var(--bg-2); border-color: var(--ink); }
.qm-headcount input {
  width: 60px; text-align: center;
  font-family: 'JetBrains Mono', monospace !important;
  font-size: 18px !important; font-weight: 500;
}

/* Main split */
.qm-main {
  max-width: 1500px; margin: 0 auto;
  display: grid; grid-template-columns: 1fr 460px;
  gap: 24px;
}

/* Catalog */
.qm-catalog { background: var(--bg-2); border: 1px solid var(--line); }
.qm-catalog-head { padding: 16px 20px; border-bottom: 1px solid var(--line); }
.qm-search {
  display: flex; align-items: center; gap: 10px;
  padding: 8px 14px; background: var(--bg-3);
  border: 1px solid var(--line);
}
.qm-search input {
  flex: 1; background: transparent; border: none;
  font-family: 'Inter', sans-serif; font-size: 14px;
  color: var(--ink);
}
.qm-search input:focus { outline: none; }
.qm-search input::placeholder { color: var(--ink-3); }
.qm-clear-search {
  background: var(--line); border: none; cursor: pointer;
  width: 18px; height: 18px; border-radius: 999px;
  display: flex; align-items: center; justify-content: center;
  color: var(--ink-2);
}

.qm-tabs {
  display: flex; flex-wrap: wrap; gap: 4px;
  padding: 14px 20px; border-bottom: 1px solid var(--line);
}
.qm-tab {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 6px 12px; border: 1px solid transparent;
  background: transparent; color: var(--ink-2);
  font-family: 'Inter', sans-serif; font-size: 13px;
  cursor: pointer; border-radius: 999px;
  transition: all 0.15s;
}
.qm-tab:hover { background: var(--bg-3); color: var(--ink); }
.qm-tab-active {
  background: var(--ink); color: var(--bg-2);
  border-color: var(--ink);
}
.qm-tab-active:hover { background: var(--ink); color: var(--bg-2); }
.qm-tab-count {
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px; opacity: 0.6;
}

.qm-items { padding: 8px 0; max-height: calc(100vh - 360px); overflow-y: auto; }

.qm-section-head {
  padding: 18px 20px 8px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px; letter-spacing: 0.14em; color: var(--ink-3);
  display: flex; justify-content: space-between;
}
.qm-section-meta { font-weight: 400; }

.qm-item {
  display: grid; grid-template-columns: 1fr auto auto;
  gap: 16px; align-items: center;
  padding: 12px 20px;
  border-bottom: 1px solid var(--line-2);
  transition: background 0.12s;
}
.qm-item:hover { background: var(--bg-3); }
.qm-item:last-child { border-bottom: none; }

.qm-item-main { min-width: 0; }
.qm-item-name {
  font-size: 14px; font-weight: 500; color: var(--ink);
  margin-bottom: 2px;
}
.qm-item-cat {
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px; color: var(--ink-3); margin-left: 8px;
  font-weight: 400;
}
.qm-item-desc {
  font-size: 12px; color: var(--ink-3);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  max-width: 480px;
}
.qm-item-includes {
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px; color: var(--ink-3); margin-top: 3px;
  letter-spacing: 0.02em;
}
.qm-item-price {
  font-size: 13px; color: var(--ink-2);
  white-space: nowrap;
}
.qm-add-btn {
  width: 28px; height: 28px;
  border: 1px solid var(--line);
  background: var(--bg-2); color: var(--ink-2);
  cursor: pointer; border-radius: 999px;
  display: flex; align-items: center; justify-content: center;
  transition: all 0.15s;
}
.qm-add-btn:hover {
  background: var(--ink); color: var(--bg-2); border-color: var(--ink);
  transform: scale(1.05);
}

.qm-empty {
  padding: 40px 20px; text-align: center;
  color: var(--ink-3); font-size: 14px;
}

/* Quote panel */
.qm-quote {
  background: var(--bg-2); border: 1px solid var(--line);
  position: sticky; top: 32px;
  max-height: calc(100vh - 64px);
  display: flex; flex-direction: column;
}
.qm-quote-head {
  padding: 20px 24px;
  border-bottom: 1px solid var(--line);
  display: flex; justify-content: space-between; align-items: flex-start;
}
.qm-quote-title {
  font-family: 'Fraunces', serif;
  font-size: 28px; font-weight: 400; line-height: 1;
  margin-top: 6px; letter-spacing: -0.01em;
}
.qm-clear-all {
  background: transparent; border: 1px solid var(--line);
  width: 28px; height: 28px; border-radius: 999px;
  cursor: pointer; color: var(--ink-3);
  display: flex; align-items: center; justify-content: center;
  transition: all 0.15s;
}
.qm-clear-all:hover { background: var(--coral); color: var(--coral-ink); border-color: var(--coral-ink); }

.qm-quote-empty {
  padding: 40px 24px; text-align: left;
}
.qm-quote-empty p {
  font-family: 'Fraunces', serif; font-style: italic;
  font-size: 24px; color: var(--ink-2);
}
.qm-quote-empty-sub {
  font-family: 'Inter', sans-serif !important;
  font-style: normal !important;
  font-size: 13px !important; color: var(--ink-3) !important;
  margin-top: 8px;
}

.qm-line-items {
  overflow-y: auto;
  flex: 1; min-height: 0;
}

.qm-li {
  padding: 14px 24px;
  border-bottom: 1px solid var(--line-2);
}
.qm-li-row1 {
  display: flex; justify-content: space-between; align-items: flex-start;
  gap: 12px; margin-bottom: 8px;
}
.qm-li-name {
  font-size: 14px; font-weight: 500; color: var(--ink);
  line-height: 1.3;
}
.qm-li-remove {
  background: transparent; border: none; cursor: pointer;
  color: var(--ink-3); padding: 2px;
  display: flex; align-items: center; justify-content: center;
  border-radius: 999px; flex-shrink: 0;
  transition: all 0.15s;
}
.qm-li-remove:hover { background: var(--coral); color: var(--coral-ink); }

.qm-li-row2 {
  display: flex; justify-content: space-between; align-items: center;
  gap: 12px;
}
.qm-li-controls { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }

.qm-li-mode {
  display: flex; border: 1px solid var(--line); border-radius: 999px;
  overflow: hidden; background: var(--bg-3);
}
.qm-li-mode button {
  padding: 3px 8px; border: none; background: transparent;
  font-family: 'JetBrains Mono', monospace; font-size: 10px;
  color: var(--ink-3); cursor: pointer;
  transition: all 0.12s;
}
.qm-li-mode button.active {
  background: var(--ink); color: var(--bg-2);
}

.qm-li-price {
  display: inline-flex; align-items: center; gap: 2px;
  background: var(--bg-3); border: 1px solid var(--line);
  padding: 2px 8px; border-radius: 4px;
}
.qm-li-dollar { font-family: 'JetBrains Mono', monospace; font-size: 11px; color: var(--ink-3); }
.qm-li-price input {
  width: 52px; border: none; background: transparent;
  font-family: 'JetBrains Mono', monospace; font-size: 12px;
  color: var(--ink); text-align: right;
}
.qm-li-price input:focus { outline: none; }
.qm-li-price input::-webkit-outer-spin-button,
.qm-li-price input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }

.qm-li-qty {
  display: inline-flex; align-items: center; gap: 4px;
  background: var(--bg-3); border: 1px solid var(--line);
  border-radius: 999px; padding: 2px 6px;
}
.qm-li-qty button {
  border: none; background: transparent; cursor: pointer;
  font-size: 12px; color: var(--ink-2); width: 16px;
}
.qm-li-qty span {
  font-family: 'JetBrains Mono', monospace; font-size: 11px;
  color: var(--ink); min-width: 24px; text-align: center;
}

.qm-li-total {
  font-size: 14px; color: var(--ink); font-weight: 500;
  white-space: nowrap;
}

.qm-li-meta {
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px; color: var(--ink-3);
  margin-top: 6px; letter-spacing: 0.02em;
}

/* Totals */
.qm-totals {
  padding: 18px 24px; border-top: 1px solid var(--line);
}
.qm-totals-row {
  display: flex; justify-content: space-between; align-items: center;
  padding: 4px 0; font-size: 13px; color: var(--ink-2);
}
.qm-totals-grand {
  font-family: 'Fraunces', serif !important;
  font-size: 24px !important;
  color: var(--ink) !important;
  padding-top: 12px !important;
  margin-top: 8px;
  border-top: 1px solid var(--line);
}
.qm-totals-pg { font-size: 11px !important; color: var(--ink-3) !important; padding-top: 4px !important; }
.qm-rate-input {
  width: 36px; padding: 1px 4px; margin: 0 2px;
  border: 1px solid var(--line); background: var(--bg-3);
  font-family: 'JetBrains Mono', monospace; font-size: 11px;
  text-align: center; border-radius: 3px;
}
.qm-rate-input:focus { outline: none; border-color: var(--ink-2); }

.qm-export {
  margin: 0 24px 20px;
  padding: 12px 20px;
  background: var(--ink); color: var(--bg-2);
  border: none; cursor: pointer;
  font-family: 'Inter', sans-serif; font-size: 14px; font-weight: 500;
  display: flex; align-items: center; justify-content: center; gap: 8px;
  transition: all 0.15s;
  border-radius: 4px;
}
.qm-export:hover {
  background: var(--ink-2);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
}

/* Scrollbars */
.qm-items::-webkit-scrollbar,
.qm-line-items::-webkit-scrollbar { width: 8px; }
.qm-items::-webkit-scrollbar-track,
.qm-line-items::-webkit-scrollbar-track { background: transparent; }
.qm-items::-webkit-scrollbar-thumb,
.qm-line-items::-webkit-scrollbar-thumb {
  background: var(--line); border-radius: 999px;
}
.qm-items::-webkit-scrollbar-thumb:hover,
.qm-line-items::-webkit-scrollbar-thumb:hover { background: var(--ink-3); }

/* Responsive */
@media (max-width: 1100px) {
  .qm-main { grid-template-columns: 1fr; }
  .qm-quote { position: static; max-height: none; }
  .qm-event-bar { grid-template-columns: 1fr 1fr; }
}
@media (max-width: 600px) {
  .qm-root { padding: 20px 16px 40px; }
  .qm-event-bar { grid-template-columns: 1fr; }
  .qm-item { grid-template-columns: 1fr auto; gap: 8px; }
  .qm-item-price { grid-column: 1 / 2; font-size: 12px; }
}
`;

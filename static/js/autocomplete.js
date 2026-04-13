const ALL_PRODUCTS = [
  // APPLE LAPTOPS
  "MacBook Air M1", "MacBook Air M2", "MacBook Air M3",
  "MacBook Air 13-inch M3", "MacBook Air 15-inch M3",
  "MacBook Pro 14-inch M3", "MacBook Pro 14-inch M3 Pro",
  "MacBook Pro 14-inch M3 Max", "MacBook Pro 16-inch M3",
  "MacBook Pro 16-inch M3 Pro", "MacBook Pro 16-inch M3 Max",
  "MacBook Pro M4", "MacBook Pro 14-inch M4",
  "MacBook Pro 16-inch M4", "MacBook Air M4",
  "MacBook Pro M2", "MacBook Pro M1",

  // APPLE PHONES
  "iPhone 15", "iPhone 15 Plus", "iPhone 15 Pro",
  "iPhone 15 Pro Max", "iPhone 16", "iPhone 16 Plus",
  "iPhone 16 Pro", "iPhone 16 Pro Max",
  "iPhone 14", "iPhone 14 Plus", "iPhone 14 Pro",
  "iPhone 14 Pro Max", "iPhone 13", "iPhone 13 Mini",
  "iPhone SE 3rd Gen", "iPhone SE 4th Gen",

  // APPLE OTHER
  "iPad Pro 11-inch M4", "iPad Pro 13-inch M4",
  "iPad Air 11-inch M2", "iPad Air 13-inch M2",
  "iPad Mini 7", "iPad 10th Gen",
  "Apple Watch Series 10", "Apple Watch Ultra 2",
  "Apple Watch SE", "AirPods Pro 2",
  "AirPods 4", "AirPods Max",
  "Apple TV 4K", "HomePod Mini", "HomePod 2",
  "Apple Vision Pro",

  // SAMSUNG PHONES
  "Samsung Galaxy S24", "Samsung Galaxy S24 Plus",
  "Samsung Galaxy S24 Ultra", "Samsung Galaxy S24 FE",
  "Samsung Galaxy S25", "Samsung Galaxy S25 Plus",
  "Samsung Galaxy S25 Ultra", "Samsung Galaxy S25 Edge",
  "Samsung Galaxy A55", "Samsung Galaxy A35",
  "Samsung Galaxy A15", "Samsung Galaxy A05",
  "Samsung Galaxy Z Fold 6", "Samsung Galaxy Z Flip 6",
  "Samsung Galaxy Z Fold 5", "Samsung Galaxy Z Flip 5",
  "Samsung Galaxy M55", "Samsung Galaxy M35",
  "Samsung Galaxy F55", "Samsung Galaxy F35",

  // SAMSUNG TABLETS & OTHER
  "Samsung Galaxy Tab S9", "Samsung Galaxy Tab S9 Plus",
  "Samsung Galaxy Tab S9 Ultra", "Samsung Galaxy Tab S9 FE",
  "Samsung Galaxy Tab S10", "Samsung Galaxy Tab S10 Plus",
  "Samsung Galaxy Tab A9", "Samsung Galaxy Tab A9 Plus",
  "Samsung Galaxy Watch 7", "Samsung Galaxy Watch Ultra",
  "Samsung Galaxy Buds 3", "Samsung Galaxy Buds 3 Pro",
  "Samsung 65-inch QLED TV", "Samsung 55-inch OLED TV",
  "Samsung 75-inch Neo QLED", "Samsung Galaxy Book4",
  "Samsung Galaxy Book4 Pro", "Samsung Galaxy Book4 360",

  // DELL LAPTOPS
  "Dell XPS 13", "Dell XPS 13 Plus", "Dell XPS 15",
  "Dell XPS 16", "Dell XPS 17",
  "Dell Inspiron 14", "Dell Inspiron 15", "Dell Inspiron 16",
  "Dell Inspiron 14 2-in-1", "Dell Inspiron 16 Plus",
  "Dell Latitude 5540", "Dell Latitude 7440",
  "Dell Latitude 9440", "Dell Latitude 5440",
  "Dell Vostro 14", "Dell Vostro 15", "Dell Vostro 16",
  "Dell Alienware m16", "Dell Alienware m18",
  "Dell Alienware x14", "Dell Alienware x16",
  "Dell Precision 5480", "Dell Precision 7680",
  "Dell G15 Gaming", "Dell G16 Gaming",

  // HP LAPTOPS
  "HP Spectre x360 14", "HP Spectre x360 16",
  "HP Envy x360 13", "HP Envy x360 15",
  "HP Pavilion 15", "HP Pavilion 14",
  "HP EliteBook 840", "HP EliteBook 860",
  "HP ProBook 450", "HP ProBook 440",
  "HP Omen 16", "HP Omen 17",
  "HP Victus 15", "HP Victus 16",
  "HP ZBook Firefly 14", "HP ZBook Studio 16",
  "HP Chromebook Plus", "HP Laptop 15s",

  // LENOVO LAPTOPS
  "Lenovo ThinkPad X1 Carbon", "Lenovo ThinkPad X1 Extreme",
  "Lenovo ThinkPad T14s", "Lenovo ThinkPad T16",
  "Lenovo ThinkPad E14", "Lenovo ThinkPad E16",
  "Lenovo IdeaPad Slim 5", "Lenovo IdeaPad Slim 3",
  "Lenovo IdeaPad Pro 5", "Lenovo IdeaPad Gaming 3",
  "Lenovo Legion 5", "Lenovo Legion 5 Pro",
  "Lenovo Legion 7", "Lenovo Legion Pro 5",
  "Lenovo Yoga 7", "Lenovo Yoga 9",
  "Lenovo Yoga Slim 7", "Lenovo Yoga Book 9",
  "Lenovo V15", "Lenovo V14",

  // ASUS LAPTOPS
  "ASUS ZenBook 14", "ASUS ZenBook 15",
  "ASUS ZenBook Pro 14", "ASUS ZenBook Duo",
  "ASUS VivoBook 15", "ASUS VivoBook 14",
  "ASUS VivoBook Pro 15", "ASUS VivoBook S15",
  "ASUS ROG Zephyrus G14", "ASUS ROG Zephyrus G16",
  "ASUS ROG Strix G15", "ASUS ROG Strix G17",
  "ASUS ROG Flow X13", "ASUS ROG Flow X16",
  "ASUS TUF Gaming A15", "ASUS TUF Gaming F15",
  "ASUS ExpertBook B9", "ASUS ProArt Studiobook",
  "ASUS Chromebook Plus",

  // MICROSOFT
  "Microsoft Surface Pro 9", "Microsoft Surface Pro 10",
  "Microsoft Surface Laptop 5", "Microsoft Surface Laptop 6",
  "Microsoft Surface Laptop Studio 2",
  "Microsoft Surface Go 4", "Microsoft Surface Duo 2",
  "Microsoft Xbox Series X", "Microsoft Xbox Series S",
  "Microsoft Xbox Controller",

  // GOOGLE PRODUCTS
  "Google Pixel 9", "Google Pixel 9 Pro",
  "Google Pixel 9 Pro XL", "Google Pixel 9 Pro Fold",
  "Google Pixel 8a", "Google Pixel 8", "Google Pixel 8 Pro",
  "Google Pixel Tablet", "Google Pixel Watch 3",
  "Google Pixel Buds Pro 2", "Google Nest Hub Max",
  "Google Nest Hub 2nd Gen", "Google Nest Mini",
  "Google Nest WiFi Pro", "Google Chromecast 4K",

  // ONEPLUS
  "OnePlus 13", "OnePlus 12", "OnePlus 11",
  "OnePlus Nord 4", "OnePlus Nord CE4", "OnePlus Nord CE3",
  "OnePlus Open", "OnePlus Pad 2",
  "OnePlus Watch 2", "OnePlus Buds Pro 3",

  // XIAOMI / REDMI / POCO
  "Xiaomi 14", "Xiaomi 14 Pro", "Xiaomi 14 Ultra",
  "Xiaomi 13T", "Xiaomi 13T Pro",
  "Redmi Note 13 Pro Plus", "Redmi Note 13 Pro",
  "Redmi Note 13", "Redmi Note 12",
  "Redmi 13C", "Redmi A3", "Redmi 13",
  "POCO X6 Pro", "POCO X6", "POCO M6 Pro",
  "POCO F6", "POCO F6 Pro", "POCO C65",
  "Xiaomi Pad 6", "Xiaomi Watch S3",

  // REALME
  "Realme GT 6", "Realme GT 6T", "Realme GT Neo 6",
  "Realme 13 Pro Plus", "Realme 13 Pro", "Realme 13",
  "Realme Narzo 70 Pro", "Realme Narzo 70",
  "Realme C67", "Realme C65", "Realme C55",
  "Realme 12 Pro Plus", "Realme 12 Pro",

  // VIVO / IQOO
  "Vivo X100 Pro", "Vivo X100", "Vivo V30 Pro",
  "Vivo V30", "Vivo Y200", "Vivo Y100",
  "iQOO 12", "iQOO 12 Pro", "iQOO Neo 9 Pro",
  "iQOO Z9 Pro", "iQOO Z9",

  // OPPO
  "OPPO Find X8 Pro", "OPPO Find X8",
  "OPPO Reno 12 Pro", "OPPO Reno 12",
  "OPPO A3 Pro", "OPPO A60", "OPPO A80",
  "OPPO F27 Pro", "OPPO F25 Pro",

  // SONY
  "Sony Xperia 1 VI", "Sony Xperia 5 VI",
  "Sony Xperia 10 VI", "Sony WH-1000XM5",
  "Sony WH-1000XM6", "Sony WF-1000XM5",
  "Sony PlayStation 5", "Sony PS5 Digital Edition",
  "Sony PS5 Slim", "Sony DualSense Controller",
  "Sony 65-inch Bravia XR OLED",
  "Sony 55-inch Bravia XR", "Sony A7 IV Camera",
  "Sony A7C II Camera", "Sony ZV-E10 Camera",

  // AUDIO
  "JBL Charge 5", "JBL Flip 6", "JBL Xtreme 3",
  "JBL Tune 770NC", "JBL Live Pro 2",
  "Bose QuietComfort 45", "Bose QuietComfort Ultra",
  "Bose SoundLink Max", "Bose Sport Earbuds",
  "Sennheiser Momentum 4", "Sennheiser HD 560S",
  "Boat Rockerz 550", "Boat Airdopes 141",
  "Boat Stone 1200", "Noise ColorFit Pro 5",

  // SMARTWATCHES & WEARABLES
  "Garmin Fenix 7", "Garmin Forerunner 965",
  "Garmin Venu 3", "Garmin Instinct 2",
  "Fitbit Charge 6", "Fitbit Sense 2",
  "Amazfit GTR 4", "Amazfit GTS 4",
  "Fire-Boltt Phoenix Pro", "Noise ColorFit Ultra 3",

  // CAMERAS
  "Canon EOS R50", "Canon EOS R6 Mark II",
  "Canon EOS R8", "Nikon Z5 II",
  "Nikon Z30", "Fujifilm X100VI",
  "Fujifilm X-T5", "GoPro Hero 13",
  "DJI Osmo Pocket 3", "Insta360 X4",

  // GAMING
  "PlayStation 5", "PS5 Slim Digital",
  "Xbox Series X", "Xbox Series S",
  "Nintendo Switch OLED", "Nintendo Switch Lite",
  "Steam Deck OLED", "Razer Blade 15",
  "ASUS ROG Phone 8", "ASUS ROG Phone 8 Pro",
  "Lenovo Legion Phone Duel 2", "Black Shark 5 Pro",

  // SMART HOME & IOT
  "Amazon Echo Dot 5th Gen", "Amazon Echo Show 10",
  "Amazon Fire TV Stick 4K Max", "Amazon Kindle Paperwhite",
  "Amazon Kindle Scribe", "Ring Video Doorbell Pro",
  "Philips Hue Starter Kit", "Nest Thermostat",
  "TP-Link Deco XE75", "TP-Link Archer AXE75",

  // PRINTERS & ACCESSORIES
  "HP LaserJet Pro", "Canon PIXMA G3010",
  "Epson EcoTank L3252", "Brother HL-L2321D",
  "Logitech MX Master 3S", "Logitech MX Keys S",
  "Logitech G Pro X", "Razer DeathAdder V3",
  "SteelSeries Arctis Nova Pro",

  // MONITORS
  "LG 27-inch 4K UHD Monitor", "LG 32-inch UltraWide",
  "Samsung 27-inch Odyssey G5", "Dell 27-inch 4K",
  "ASUS ProArt 27-inch Display", "BenQ 24-inch IPS",

  // HOTEL ROOMS
  "Hotel Deluxe Room", "Hotel Standard Room",
  "Hotel Suite", "Hotel Premium Suite",
  "Hotel Executive Suite", "Hotel Presidential Suite",
  "Hotel Penthouse", "Hotel Family Room",
  "Hotel Twin Room", "Hotel Ocean View Room",
  "Hotel City View Room", "Hotel Garden View Room",
  "Budget Hotel Room", "Boutique Hotel Suite",
  "Resort Deluxe Villa", "Resort Beach Cottage",
  "Resort Pool Villa", "Resort Overwater Bungalow",
  "Airbnb Entire Apartment", "Airbnb Private Room",
  "Airbnb Shared Room", "Airbnb Studio",
  "Airbnb Villa", "Airbnb Beachhouse",
  "Airbnb Cottage", "Airbnb Treehouse",
  "OYO Deluxe Room", "OYO Premium Room",
  "Treebo Standard Room", "FabHotel Classic Room",

  // FLIGHTS
  "Flight Economy Class - Domestic",
  "Flight Business Class - Domestic",
  "Flight First Class - Domestic",
  "Flight Economy Class - International",
  "Flight Business Class - International",
  "Flight First Class - International",
  "IndiGo Economy Seat", "Air India Business Class",
  "Vistara Premium Economy", "SpiceJet Economy",
  "Emirates Business Class", "Singapore Airlines First Class",
  "Lufthansa Economy", "Qatar Airways Business",

  // RIDES & TRANSPORT
  "Uber Mini Ride", "Uber Sedan Ride",
  "Uber SUV Ride", "Uber Auto",
  "Ola Mini", "Ola Sedan", "Ola Prime SUV",
  "Ola Auto", "Rapido Bike Taxi",
  "Rapido Auto", "BluSmart Electric Cab",
  "Meru Cabs Premium", "Taxi Economy",
  "Bus Ticket - Sleeper", "Bus Ticket - AC Sleeper",
  "Train Ticket - Sleeper", "Train Ticket - 3AC",
  "Train Ticket - 2AC", "Train Ticket - 1AC",

  // FOOD & RESTAURANTS
  "Restaurant Table Booking - 2 Pax",
  "Restaurant Table Booking - 4 Pax",
  "Fine Dining Table - Premium",
  "Cafe Seating - Standard",
  "Cloud Kitchen Delivery Slot",
  "Zomato Gold Subscription", "Swiggy One Subscription",

  // SAAS & SOFTWARE
  "Netflix Basic Plan", "Netflix Standard Plan",
  "Netflix Premium Plan", "Netflix Mobile Plan",
  "Amazon Prime Monthly", "Amazon Prime Annual",
  "Spotify Free", "Spotify Premium Individual",
  "Spotify Premium Duo", "Spotify Premium Family",
  "Microsoft 365 Personal", "Microsoft 365 Family",
  "Microsoft 365 Business Basic",
  "Google One 100GB", "Google One 200GB",
  "Google One 2TB", "Google Workspace Starter",
  "Adobe Creative Cloud All Apps",
  "Adobe Photoshop Plan", "Adobe Illustrator Plan",
  "Figma Starter", "Figma Professional",
  "Canva Pro", "Canva for Teams",
  "Zoom Pro Plan", "Zoom Business Plan",
  "Slack Pro", "Slack Business Plus",
  "Notion Personal Pro", "Notion Team Plan",
  "Dropbox Plus", "Dropbox Business",
  "GitHub Pro", "GitHub Team",
  "AWS EC2 Instance", "AWS S3 Storage Plan",
  "Azure Virtual Machine", "Google Cloud Compute",
  "Shopify Basic Plan", "Shopify Standard Plan",
  "Shopify Advanced Plan", "WooCommerce Extension",
  "HubSpot Starter CRM", "Salesforce Essentials",
  "Mailchimp Standard Plan", "Semrush Pro Plan",
  "Hostinger Web Hosting", "GoDaddy Domain + Hosting",
  "Bluehost WordPress Hosting",

  // ECOMMERCE PRODUCTS
  "Nike Air Max 270", "Nike Air Force 1",
  "Nike Air Jordan 1", "Nike Revolution 7",
  "Adidas Ultraboost 22", "Adidas Stan Smith",
  "Puma RS-X", "Puma Suede Classic",
  "Levi's 511 Slim Jeans", "Levi's 501 Original",
  "Zara Formal Shirt", "H&M Casual T-Shirt",
  "Woodland Trekking Shoes", "Red Tape Formal Shoes",
  "Wildcraft Backpack 30L", "American Tourister Trolley",
  "Samsonite Spinner 75cm", "VIP Trolley Bag",
  "Prestige Induction Cooktop", "Bajaj Mixer Grinder",
  "Philips Air Fryer", "Instant Pot Duo",
  "Dyson V15 Vacuum", "Eureka Forbes Vacuum",
  "Whirlpool 1.5 Ton AC", "Voltas 1.5 Ton Split AC",
  "Daikin 1.5 Ton Inverter AC", "LG 1.5 Ton AC",
  "Samsung 8kg Washing Machine", "LG Front Load Washer",
  "Whirlpool Top Load 7kg", "Bosch 8kg Washer",
  "Samsung 253L Refrigerator", "LG 260L Double Door Fridge",
  "Godrej 190L Single Door", "Haier 320L French Door",

  // BOOKS & EDUCATION
  "Udemy Web Development Course",
  "Coursera Data Science Specialization",
  "Coursera Machine Learning Certificate",
  "NPTEL Online Course", "Great Learning Pro Plan",
  "Scaler Academy DSA Course",
  "Newton School Full Stack Course",
  "Physics Wallah Lakshya Batch",
  "Allen Distance Learning Program",
  "BYJU's JEE Preparation Package",
  "Unacademy Plus Subscription",
  "Apna College Sigma Batch",

  // HEALTHCARE & FITNESS
  "1mg Medicine Delivery Subscription",
  "PharmEasy Plus Membership",
  "Apollo 24/7 Health Plan",
  "Practo Care Subscription",
  "Cult.fit Gym Membership Monthly",
  "Cult.fit Annual Membership",
  "Fitpass Pro Monthly", "Gold's Gym Membership",
  "Yoga Class - Monthly Pack",
  "Personal Trainer Session - 1hr",
  "Online Dietitian Consultation",
  "Full Body Health Checkup Package"
];

const CATEGORY_MAP = {
  // Laptops & Computers
  "MacBook": { icon: "💻", category: "saas" }, // Since the only options are hotel, flight, ride, ecommerce, saas. The prompt says: MacBook/Dell/HP/Lenovo/ASUS → select "saas"
  "Dell": { icon: "💻", category: "saas" },
  "HP": { icon: "💻", category: "saas" },
  "Lenovo": { icon: "💻", category: "saas" },
  "ASUS": { icon: "💻", category: "saas" },
  "Microsoft Surface": { icon: "💻", category: "saas" },
  
  // Phones & Tablets
  "iPhone": { icon: "📱", category: "ecommerce" }, // Prompt: iPhone/Samsung/OnePlus/Pixel → E-commerce
  "iPad": { icon: "📱", category: "ecommerce" },
  "Samsung": { icon: "📱", category: "ecommerce" },
  "OnePlus": { icon: "📱", category: "ecommerce" },
  "Pixel": { icon: "📱", category: "ecommerce" },
  "Xiaomi": { icon: "📱", category: "ecommerce" },
  "Redmi": { icon: "📱", category: "ecommerce" },
  "POCO": { icon: "📱", category: "ecommerce" },
  "Realme": { icon: "📱", category: "ecommerce" },
  "Vivo": { icon: "📱", category: "ecommerce" },
  "iQOO": { icon: "📱", category: "ecommerce" },
  "OPPO": { icon: "📱", category: "ecommerce" },
  "Sony": { icon: "📱", category: "ecommerce" },
  
  // Hotels & Stays
  "Hotel": { icon: "🏨", category: "hotel" },
  "Resort": { icon: "🏨", category: "hotel" },
  "Airbnb": { icon: "🏨", category: "hotel" },
  "OYO": { icon: "🏨", category: "hotel" },
  "Treebo": { icon: "🏨", category: "hotel" },
  "FabHotel": { icon: "🏨", category: "hotel" },
  
  // Flights
  "Flight": { icon: "✈️", category: "flight" },
  "IndiGo": { icon: "✈️", category: "flight" },
  "Air India": { icon: "✈️", category: "flight" },
  "Vistara": { icon: "✈️", category: "flight" },
  "SpiceJet": { icon: "✈️", category: "flight" },
  "Emirates": { icon: "✈️", category: "flight" },
  "Singapore Airlines": { icon: "✈️", category: "flight" },
  "Lufthansa": { icon: "✈️", category: "flight" },
  "Qatar Airways": { icon: "✈️", category: "flight" },
  
  // Rides & Transport
  "Uber": { icon: "🚗", category: "ride" },
  "Ola": { icon: "🚗", category: "ride" },
  "Rapido": { icon: "🚗", category: "ride" },
  "BluSmart": { icon: "🚗", category: "ride" },
  "Meru": { icon: "🚗", category: "ride" },
  "Taxi": { icon: "🚗", category: "ride" },
  "Bus": { icon: "🚗", category: "ride" },
  "Train": { icon: "🚗", category: "ride" },
  
  // Gaming
  "PlayStation": { icon: "🎮", category: "ecommerce" },
  "Xbox": { icon: "🎮", category: "ecommerce" },
  "Nintendo": { icon: "🎮", category: "ecommerce" },
  "Steam Deck": { icon: "🎮", category: "ecommerce" },
  
  // Audio & Wearables
  "AirPods": { icon: "🎵", category: "ecommerce" },
  "JBL": { icon: "🎵", category: "ecommerce" },
  "Bose": { icon: "🎵", category: "ecommerce" },
  "Sennheiser": { icon: "🎵", category: "ecommerce" },
  "Boat": { icon: "🎵", category: "ecommerce" },
  "Watch": { icon: "🎵", category: "ecommerce" },
  "Garmin": { icon: "🎵", category: "ecommerce" },
  "Fitbit": { icon: "🎵", category: "ecommerce" },
  "Amazfit": { icon: "🎵", category: "ecommerce" },
  
  // SaaS & Software
  "Netflix": { icon: "☁️", category: "saas" },
  "Spotify": { icon: "☁️", category: "saas" },
  "Adobe": { icon: "☁️", category: "saas" },
  "Amazon Prime": { icon: "☁️", category: "saas" },
  "Microsoft": { icon: "☁️", category: "saas" },
  "Google Workspace": { icon: "☁️", category: "saas" },
  "Google One": { icon: "☁️", category: "saas" },
  "Figma": { icon: "☁️", category: "saas" },
  "Canva": { icon: "☁️", category: "saas" },
  "Zoom": { icon: "☁️", category: "saas" },
  "Slack": { icon: "☁️", category: "saas" },
  "Notion": { icon: "☁️", category: "saas" },
  "Dropbox": { icon: "☁️", category: "saas" },
  "GitHub": { icon: "☁️", category: "saas" },
  "AWS": { icon: "☁️", category: "saas" },
  "Azure": { icon: "☁️", category: "saas" },
  "Shopify": { icon: "☁️", category: "saas" },
  
  // Food & Dining
  "Restaurant": { icon: "🍕", category: "hotel" }, // Defaulting food to hotel/service for now 
  "Cafe": { icon: "🍕", category: "hotel" },
  "Zomato": { icon: "🍕", category: "saas" },
  "Swiggy": { icon: "🍕", category: "saas" },
  
  // Education
  "Course": { icon: "📚", category: "saas" },
  "Udemy": { icon: "📚", category: "saas" },
  "Coursera": { icon: "📚", category: "saas" },
  "Unacademy": { icon: "📚", category: "saas" },
  
  // Health & Fitness
  "Subscription": { icon: "💊", category: "saas" },
  "Gym": { icon: "💊", category: "hotel" },
  "Yoga": { icon: "💊", category: "hotel" }
};

function getCategoryInfo(productName) {
  for (const [key, info] of Object.entries(CATEGORY_MAP)) {
    if (productName.includes(key)) {
      return info;
    }
  }
  return { icon: "📦", category: "ecommerce" }; // Default to ecommerce
}

document.addEventListener("DOMContentLoaded", () => {
  const inputEl = document.getElementById("prod_name");
  if (!inputEl) return;
  
  // Wrap existing input dynamically so we don't break dashboard.html logic manually if not needed, 
  // but wait it's better to wrap in html or js? I will rely on HTML wrapping later.
  // Actually, wait, let's just create the dropdown element dynamically to make it perfectly sandboxed and drop-in.
  
  const wrapper = document.createElement("div");
  wrapper.className = "autocomplete-wrapper";
  wrapper.style.position = "relative";
  
  inputEl.parentNode.insertBefore(wrapper, inputEl);
  wrapper.appendChild(inputEl);
  
  const dropdown = document.createElement("div");
  dropdown.id = "autocomplete-dropdown";
  dropdown.className = "autocomplete-dropdown";
  dropdown.style.display = "none";
  wrapper.appendChild(dropdown);

  // Initialize Fuse
  const fuseOptions = {
    threshold: 0.4,
    includeMatches: true
  };
  const fuse = new Fuse(ALL_PRODUCTS, fuseOptions);

  let currentFocus = -1;
  let debounceTimer;

  // Local Storage functions
  function getRecentSearches() {
    try {
      const searches = localStorage.getItem("nexus_recent_products");
      return searches ? JSON.parse(searches) : [];
    } catch {
      return [];
    }
  }

  function addRecentSearch(product) {
    let searches = getRecentSearches();
    searches = searches.filter(s => s !== product);
    searches.unshift(product);
    if (searches.length > 5) searches.pop();
    localStorage.setItem("nexus_recent_products", JSON.stringify(searches));
  }
  
  function updateCategory(product) {
      const info = getCategoryInfo(product);
      const categorySelect = document.getElementById("category");
      if (categorySelect && info.category) {
          categorySelect.value = info.category;
      }
  }

  function renderSuggestions(suggestions, isRecent = false) {
    dropdown.innerHTML = "";
    if (suggestions.length === 0) {
      dropdown.style.display = "none";
      return;
    }

    if (isRecent) {
      const recentHeader = document.createElement("div");
      recentHeader.textContent = "Recent";
      recentHeader.style.padding = "8px 12px";
      recentHeader.style.fontSize = "0.75rem";
      recentHeader.style.color = "rgba(255,255,255,0.5)";
      recentHeader.style.textTransform = "uppercase";
      recentHeader.style.letterSpacing = "1px";
      dropdown.appendChild(recentHeader);
    }

    suggestions.forEach((item, index) => {
      const div = document.createElement("div");
      div.className = "suggestion-item";
      
      const info = getCategoryInfo(item);
      div.innerHTML = `<span style="margin-right:8px">${info.icon}</span>${item}`;
      
      div.addEventListener("click", () => {
        inputEl.value = item;
        addRecentSearch(item);
        updateCategory(item);
        closeDropdown();
      });
      dropdown.appendChild(div);
    });

    dropdown.style.display = "block";
    currentFocus = -1;
  }

  function closeDropdown() {
    dropdown.style.display = "none";
  }

  inputEl.addEventListener("input", (e) => {
    clearTimeout(debounceTimer);
    const val = e.target.value;

    if (val.length < 2) {
      if (val.length === 0) {
        // Show recent searches on empty if they click it later, but on backspace to empty, let's keep it clean
        const recent = getRecentSearches();
        if (recent.length > 0) renderSuggestions(recent, true);
        else closeDropdown();
      } else {
        closeDropdown();
      }
      return;
    }

    debounceTimer = setTimeout(() => {
      const results = fuse.search(val);
      const matches = results.map(r => r.item).slice(0, 8);
      renderSuggestions(matches);
    }, 300);
  });

  inputEl.addEventListener("click", () => {
    if (inputEl.value.length < 2) {
      const recent = getRecentSearches();
      if (recent.length > 0) {
        renderSuggestions(recent, true);
      }
    }
  });

  inputEl.addEventListener("keydown", (e) => {
    if (dropdown.style.display === "none") return;
    
    // We skip the Recent header if present
    const items = dropdown.querySelectorAll(".suggestion-item");
    if (items.length === 0) return;

    if (e.key === "ArrowDown") {
      currentFocus++;
      addActive(items);
      e.preventDefault();
    } else if (e.key === "ArrowUp") {
      currentFocus--;
      addActive(items);
      e.preventDefault();
    } else if (e.key === "Enter") {
      if (currentFocus > -1) {
        if (items[currentFocus]) {
          items[currentFocus].click();
          e.preventDefault();
        }
      }
    } else if (e.key === "Escape") {
      closeDropdown();
      e.preventDefault();
    }
  });

  function addActive(items) {
    if (!items) return;
    removeActive(items);
    if (currentFocus >= items.length) currentFocus = 0;
    if (currentFocus < 0) currentFocus = items.length - 1;
    items[currentFocus].classList.add("autocomplete-active");
    // Ensure scroll visibility
    items[currentFocus].scrollIntoView({ block: "nearest", behavior: "smooth" });
  }

  function removeActive(items) {
    for (let i = 0; i < items.length; i++) {
      items[i].classList.remove("autocomplete-active");
    }
  }

  document.addEventListener("click", (e) => {
    if (e.target !== inputEl && e.target !== dropdown) {
      closeDropdown();
    }
  });
});

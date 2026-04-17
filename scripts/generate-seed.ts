import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

const hindiTemplates = [
  "Yaar ye battery bahut kharab hai, ek din bhi nahi chalta",
  "Packaging bilkul sahi thi, phone safe aaya",
  "Customer support se baat ki, koi jawab nahi mila",
  "Bahut bekar phone hai, paise waste ho gaye 😤",
];

const sarcasticTemplates = [
  "Oh wow, 2 hours of battery life. Absolutely revolutionary technology.",
  "The packaging was SO good it took 20 minutes to open. 10/10.",
];

const generalReviews = [
  "Good product for the price.",
  "Display is nice, but it gets hot while gaming.",
  "Camera quality is impressive, especially at night.",
  "Delivery was delayed by two days but otherwise fine."
];

export function generateSeedData() {
  const reviews = [];
  const baseDate = new Date();
  
  for (let i = 1; i <= 260; i++) {
    let text = "";
    // Seeded Trap: Reviews 151-260 have 40% battery_negative
    if (i > 150 && Math.random() < 0.40) {
       text = "battery drains way too fast now, definitely an issue.";
    } else if (Math.random() < 0.15) {
       text = hindiTemplates[Math.floor(Math.random() * hindiTemplates.length)];
    } else if (Math.random() < 0.06) {
       text = sarcasticTemplates[Math.floor(Math.random() * sarcasticTemplates.length)];
    } else {
       text = generalReviews[Math.floor(Math.random() * generalReviews.length)];
    }

    reviews.push({
      id: crypto.randomUUID(),
      product_id: "smartphones",
      text,
      created_at: new Date(baseDate.getTime() - (260 - i) * 3600000).toISOString()
    });
  }

  const outDir = path.join(__dirname, '../data/seed');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }
  
  fs.writeFileSync(path.join(outDir, 'smartphones.json'), JSON.stringify(reviews, null, 2));
  console.log('Seed data generated successfully.');
}

if (require.main === module) {
  generateSeedData();
}

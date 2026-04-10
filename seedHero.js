const cloudinary = require('cloudinary').v2;
const path = require("path");
require('dotenv').config({ path: path.join(__dirname, ".env") });

// Cloudinary Configuration
cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.CLOUD_API_KEY,
    api_secret: process.env.CLOUD_API_SECRET
});

// A curated list of Tranquil, Minimalist, and Natural Home IDs
const heroUnsplashIds = [
    "1502672260266-1c1ef2d93688", // Minimalist interior
    "1518780664697-55e3ad937233", // Cozy cottage
    "1523217582562-09d0def993a6", // Modern house in nature
    "1501183638710-841dd1904471", // Bright living room
    "1449156001428-c1901308a0d2", // Wooden cabin
    "1600210492486-724fe5c33838", // Scandi interior
    "1600607687920-4e2a09cf159d", // Luxury kitchen
    "1613545325278-f24b0cae1224", // Modern exterior
    "1484154218962-a197022b5858", // Sunny dining
    "1600566753190-17f0bb2a6d36", // Modern bedroom
    "1600585154340-be6161a56a0c", // Contemporary home
    "1600596542815-ffad4c1539a9", // Elegant living
    "1580587767526-17b46d03f6f1", // Suburban luxury
    "1512917774080-9991f1c4c750", // Tuscan style
    "1513584684034-5984462d708e", // Modern lighting
    "1505691722218-368865a73e81", // Moody kitchen
    "1448630360428-a1bc4063251a", // Warm interior
    "1494438639946-1ebd1d20bf85", // Plant-filled room
    "1510798831971-661eb04b3739", // Forest cabin
    "1598227071624-99881fc1829e"  // Clean architecture
];

async function seedHeroImages() {
    console.log("🚀 Starting Cloudinary Hero Image Seeding...");
    const uploadedUrls = [];

    for (let i = 0; i < heroUnsplashIds.length; i++) {
        const id = heroUnsplashIds[i];
        const sourceUrl = `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=1920&q=80`;
        
        try {
            const result = await cloudinary.uploader.upload(sourceUrl, {
                folder: "wanderlust_hero_images",
                public_id: `hero_${i + 1}`,
                overwrite: true
            });
            uploadedUrls.push(result.secure_url);
            console.log(`✅ Uploaded [${i + 1}/20]: ${result.secure_url}`);
        } catch (error) {
            console.error(`❌ Failed to upload image ${i + 1}:`, error.message);
        }
    }

    console.log("\n✨ SUCCESS! Copy these 20 URLs into your index.ejs heroImages array:");
    console.log(JSON.stringify(uploadedUrls, null, 2));
}

seedHeroImages();

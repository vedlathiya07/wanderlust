const cloudinary = require('cloudinary').v2;
const path = require("path");
require('dotenv').config({ path: path.join(__dirname, ".env") });

// Cloudinary Configuration
cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.CLOUD_API_KEY,
    api_secret: process.env.CLOUD_API_SECRET
});

// A curated list of stunning 4K Luxury Travel Unsplash IDs
const heroUnsplashIds = [
    "542314831-c6a4d27160c9", "571896349-84233c89424d", "1499793983690-e29da59ef1c2", 
    "1520250497591-112f2f40a3f4", "1502672260266-1c1ef2d93688", "1613553507447-514873c27eb4",
    "1512917774080-9991f1c4c750", "1564013489117-69f20c7a48d9", "1600585154340-be6161a56a0c",
    "1600596542815-ffad4c1539a9", "1600210492486-724fe5c33838", "1600607687920-4e2a09cf159d",
    "1449156001428-c1901308a0d2", "1512918766775-9411bc256673", "1510798831971-661eb04b3739",
    "1533105079780-92b9be482077", "1580587767526-17b46d03f6f1", "1582268611958-ebfd161ef9cf",
    "1502005229762-bc13e3c99026", "1513584684034-5984462d708e"
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

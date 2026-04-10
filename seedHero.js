const cloudinary = require('cloudinary').v2;
const path = require("path");
require('dotenv').config({ path: path.join(__dirname, ".env") });

// Cloudinary Configuration
cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.CLOUD_API_KEY,
    api_secret: process.env.CLOUD_API_SECRET
});

// User-provided Unsplash View URLs
const heroUrls = [
    "https://unsplash.com/photos/modern-house-with-pool-at-dusk-near-mountain-hap-fa_gV1A",
    "https://unsplash.com/photos/a-house-with-a-pool-in-the-yard-gLyBSJqGyk4",
    "https://unsplash.com/photos/white-and-brown-concrete-building-under-blue-sky-during-daytime-_TPTXZd9mOo",
    "https://unsplash.com/photos/white-and-grey-concrete-building-near-swimming-pool-under-clear-sky-during-daytime-2d4lAQAlbDA",
    "https://unsplash.com/photos/a-house-with-a-car-parked-in-front-of-it-4LLHJHyXQVk",
    "https://unsplash.com/photos/white-concrete-building-under-blue-sky-during-daytime-mR1CIDduGLc",
    "https://unsplash.com/photos/white-concrete-building-g39p1kDjvSY",
    "https://unsplash.com/photos/white-and-blue-concrete-building-tVzyDSV84w8",
    "https://unsplash.com/photos/a-building-with-a-pool-z6UAWpQAhXs",
    "https://unsplash.com/photos/people-on-beach-during-daytime-_u8KhAZRGHs",
    "https://unsplash.com/photos/white-and-brown-concrete-building-near-green-trees-during-sunset-Q4HbxLVWvJQ",
    "https://unsplash.com/photos/a-house-with-a-pool-in-front-of-it-puk9ju-kWHI",
    "https://unsplash.com/photos/an-aerial-view-of-a-house-with-a-swimming-pool-UbfL4BUmI4o",
    "https://unsplash.com/photos/luxury-home-with-a-pool-at-sunset-rGxOOZ4E4EE"
];

async function seedHeroImages() {
    console.log("🚀 Starting Cloudinary Hero Image Seeding (using Exact URLs)...");
    const uploadedUrls = [];

    for (let i = 0; i < heroUrls.length; i++) {
        const url = heroUrls[i];
        const id = url.split("-").pop() || url.split("/").pop();
        
        // Strategy: Try the most reliable redirect patterns
        const strategies = [
            `https://unsplash.com/photos/${id}/download?force=true`,
            `https://source.unsplash.com/${id}/1600x900`
        ];

        let success = false;
        for (const sourceUrl of strategies) {
            try {
                const result = await cloudinary.uploader.upload(sourceUrl, {
                    folder: "wanderlust_hero_images",
                    public_id: `hero_final_${i + 1}`,
                    overwrite: true
                });
                uploadedUrls.push(result.secure_url);
                console.log(`✅ Uploaded [${i + 1}/${heroUrls.length}]: ${result.secure_url}`);
                success = true;
                break; // Stop if strategy works
            } catch (error) {
                continue; // Try next strategy
            }
        }
        if (!success) console.error(`❌ All strategies failed for image ${i + 1} (${id})`);
    }

    console.log("\n✨ SUCCESS! Copy these 20 URLs into your index.ejs heroImages array:");
    console.log(JSON.stringify(uploadedUrls, null, 2));
}

seedHeroImages();

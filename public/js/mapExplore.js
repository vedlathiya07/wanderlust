// Persistence State Management
const STORAGE_KEY_MAP = "WANDERLUST_MAP_STATE";
const STORAGE_KEY_GEO = "WANDERLUST_GEO_CACHE";

const savedState = JSON.parse(sessionStorage.getItem(STORAGE_KEY_MAP) || "{}");
const geoCache = JSON.parse(localStorage.getItem(STORAGE_KEY_GEO) || "{}");

const map = new maplibregl.Map({
    container: "exploreMap",
    style: `https://maps.geoapify.com/v1/styles/osm-carto/style.json?apiKey=${mapToken}`,
    center: savedState.center || [77.2090, 28.6139], 
    zoom: savedState.zoom || 4
});

map.addControl(new maplibregl.NavigationControl());

// Store position on change
map.on("moveend", () => {
    sessionStorage.setItem(STORAGE_KEY_MAP, JSON.stringify({
        center: map.getCenter(),
        zoom: map.getZoom()
    }));
});

// Marker Management
const activeMarkers = {}; // id -> markerInstance

async function renderListings(listings) {
    for (const listing of listings) {
        // Skip if already rendered
        if (activeMarkers[listing.id]) continue;

        let coords = listing.coordinates;
        
        // Check local geocoding cache
        if ((!coords || coords.length !== 2 || coords[0] === 0) && listing.location) {
            const cacheKey = `${listing.location}-${listing.country}`;
            if (geoCache[cacheKey]) {
                coords = geoCache[cacheKey];
            } else {
                try {
                    const res = await fetch(`https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(listing.location + ', ' + listing.country)}&apiKey=${mapToken}`);
                    const data = await res.json();
                    if (data.features && data.features.length > 0) {
                        coords = data.features[0].geometry.coordinates;
                        // Save to cache
                        geoCache[cacheKey] = coords;
                        localStorage.setItem(STORAGE_KEY_GEO, JSON.stringify(geoCache));
                    }
                } catch (e) {
                    console.error("Geocoding failed", e);
                }
            }
        }
        
        if (coords && coords.length === 2 && coords[0] !== 0) {
            const popupHTML = `
                <div style="width: 220px; padding: 5px;">
                    <img src="${listing.image}" style="width: 100%; height: 140px; object-fit: cover; border-radius: 12px; margin-bottom: 12px;">
                    <h6 style="margin: 0; font-weight: 700; font-size: 1.1rem; color: #333; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${listing.title}</h6>
                    <p style="margin: 4px 0; font-size: 0.85rem; color: #666;"><i class="fa-solid fa-location-dot me-1"></i>${listing.location}</p>
                    <p style="margin: 8px 0; font-weight: 700; font-size: 1.1rem; color: #000;">&#8377; ${listing.price.toLocaleString("en-IN")} <span style="font-size: 0.8rem; font-weight: normal; color: #666;">/night</span></p>
                    <a href="/listings/${listing.id}" class="btn w-100 mt-2" style="background-color: #5C715E; color: white; border-radius: 8px; padding: 10px 0; font-size: 0.95rem; font-weight: 600; transition: transform 0.2s;">View Property</a>
                </div>
            `;
            
            const marker = new maplibregl.Marker({ color: "#5C715E" })
                .setLngLat(coords)
                .setPopup(new maplibregl.Popup({ offset: 25, maxWidth: "300px" }).setHTML(popupHTML))
                .addTo(map);
            
            activeMarkers[listing.id] = marker;
        }
    }

    // Cleanup: Remove markers for listings that no longer exist
    const currentIds = listings.map(l => l.id);
    Object.keys(activeMarkers).forEach(id => {
        if (!currentIds.includes(id)) {
            activeMarkers[id].remove();
            delete activeMarkers[id];
        }
    });
}

// Background sync function
async function syncMapData() {
    try {
        const res = await fetch("/listings/api/map-data");
        const freshData = await res.json();
        renderListings(freshData);
    } catch (e) {
        console.warn("Background sync failed", e);
    }
}

// Initial render with server data
if (window.rawListings) {
    renderListings(window.rawListings);
}

// Start silent background sync (every 30s)
setInterval(syncMapData, 30000);

// Find Me Logic
document.getElementById("findMeBtn").addEventListener("click", () => {
    if (navigator.geolocation) {
        const btn = document.getElementById("findMeBtn");
        btn.innerHTML = `<div class="spinner-border spinner-border-sm text-light me-2" role="status"></div><span>Locating...</span>`;
        
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const userLocation = [position.coords.longitude, position.coords.latitude];
                
                new maplibregl.Marker({ color: "#E07B54" }) 
                    .setLngLat(userLocation)
                    .setPopup(new maplibregl.Popup({ offset: 25 }).setHTML('<h6 style="margin:0; font-weight:bold; color:#333;">📍 Your Current Spot</h6>'))
                    .addTo(map);

                map.flyTo({
                    center: userLocation,
                    zoom: 12,
                    speed: 1.2,
                    essential: true
                });
                
                btn.innerHTML = `<i class="fa-solid fa-check me-2"></i><span>Found!</span>`;
                btn.classList.replace("btn-dark", "btn-success");
                
                setTimeout(() => {
                    btn.style.opacity = '0';
                    setTimeout(() => btn.style.display = 'none', 300);
                }, 2500);
            },
            () => {
                alert("Permission Denied: Could not locate you.");
                btn.innerHTML = `<i class="fa-solid fa-location-crosshairs me-2"></i><span>Find Nearby Listings</span>`;
            }
        );
    }
});

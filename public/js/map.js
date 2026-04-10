const map = new maplibregl.Map({
    container: "map",
    style: `https://maps.geoapify.com/v1/styles/osm-carto/style.json?apiKey=${window.mapToken}`,
    center: window.coordinates || [77.2090, 28.6139],
    zoom: window.coordinates ? 9.5 : 4
});

map.addControl(new maplibregl.NavigationControl());

async function plotMap() {
    let coords = window.coordinates;
    
    if (!coords && window.listingLocation) {
        try {
            const res = await fetch(`https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(window.listingLocation)}&apiKey=${window.mapToken}`);
            const data = await res.json();
            if (data.features && data.features.length > 0) {
                coords = data.features[0].geometry.coordinates;
                map.setCenter(coords);
                map.setZoom(9.5);
            }
        } catch (e) {
            console.error("Geocoding failed", e);
        }
    }

    if (coords && coords.length === 2 && coords[0] !== 0) {
        new maplibregl.Marker({ color: "#5C715E" })
            .setLngLat(coords)
            .setPopup(new maplibregl.Popup({ offset: 35, className: 'luxury-popup' })
            .setHTML(`
                <div class="px-2 py-1">
                    <h6 class="fw-bold mb-1" style="font-size: 0.95rem; color: #333;">${window.listingTitle}</h6>
                    <p class="text-muted mb-1" style="font-size: 0.75rem;"><i class="fa-solid fa-location-dot me-1"></i>${window.listingLocation}</p>
                    <p class="mb-0" style="font-size: 0.85rem;"><span class="fw-bold text-dark">&#8377; ${window.listingPrice}</span> / night</p>
                </div>
            `))
            .addTo(map);
    }
}

plotMap();

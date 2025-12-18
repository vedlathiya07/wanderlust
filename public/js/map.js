Radar.initialize(window.mapToken);

const map = new maplibregl.Map({
    container: "map",
    style: `https://api.radar.io/maps/styles/radar-default-v1?publishableKey=${window.mapToken}`,
    center: window.coordinates,
    zoom: 9.5
});

map.addControl(new maplibregl.NavigationControl());

if (window.coordinates && window.coordinates.length === 2) {
    const marker = Radar.ui.marker({
        color: "red",
        width: 40,
        height: 80,
        popup: { text: 'Listing location' }
    })
        .setLngLat(window.coordinates)  // Must be [lng, lat]
        .addTo(map);
} else {
    console.warn("No valid coordinates for this listing");
}


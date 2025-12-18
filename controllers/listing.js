const Listing = require("../models/listing.js");
const axios = require("axios");

const radarKey = process.env.RADAR_PUBLISHABLE_KEY;

module.exports.index = async (req, res) => {
    const allListings = await Listing.find({});
    res.render("listings/index", { allListings });
};

module.exports.renderNewForm = (req, res) => {
    res.render("listings/new");
};

module.exports.showListing = async (req, res) => {
    const { id } = req.params;

    const listing = await Listing.findById(id)
        .populate({
            path: "reviews",
            populate: {
                path: "author"
            },
        })
        .populate("owner");
    if (!listing) {
        req.flash("error", "Listing that you requested does not exist");
        return res.redirect("/listings");
    }

    let coordinates = null;

    if (
        listing.geometry &&
        listing.geometry.coordinates &&
        listing.geometry.coordinates.length === 2
    ) {
        coordinates = listing.geometry.coordinates;
    }

    res.render("listings/show", { listing, coordinates, radarKey: process.env.RADAR_PUBLISHABLE_KEY, currUser: req.user });
};

module.exports.createListing = async (req, res, next) => {

    const locationQuery = req.body.listing.location;

    // Radar forward geocoding API call
    const radarRes = await axios.get("https://api.radar.io/v1/geocode/forward", {
        params: { query: locationQuery },
        headers: { Authorization: radarKey }
    });

    const radarGeo = radarRes.data.addresses[0].geometry;

    // Convert Radar → GeoJSON format
    const geometry = {
        type: "Point",
        coordinates: radarGeo.coordinates
    };

    let url = req.file.path;
    let filename = req.file.filename;
    const newListing = new Listing(req.body.listing);
    newListing.owner = req.user._id;
    newListing.image = { url, filename };

    newListing.geometry = geometry;
    await newListing.save();

    req.flash("success", "New Listing Created!");
    res.redirect("/listings");
};

module.exports.renderEditForm = async (req, res) => {
    const { id } = req.params;
    const listing = await Listing.findById(id);
    if (!listing) {
        req.flash("error", "Listing that you requested does not exist");
        return res.redirect("/listings");
    }
    let originalImageUrl = listing.image.url;
    originalImageUrl = originalImageUrl.replace("/upload", "/upload/w_250");
    res.render("listings/edit", { listing, originalImageUrl });
};

module.exports.updateListing = async (req, res) => {
    const { id } = req.params;
    const listing = await Listing.findByIdAndUpdate(id, { ...req.body.listing });

    if (typeof req.file !== "undefined") {
        let url = req.file.path;
        let filename = req.file.filename;
        listing.image = { url, filename };
        await listing.save();
    }

    req.flash("success", "Listing Updated!");
    res.redirect(`/listings/${id}`);
};

module.exports.destroyListing = async (req, res) => {
    const { id } = req.params;
    await Listing.findByIdAndDelete(id);
    req.flash("success", "Listing Deleted!");
    res.redirect("/listings");
};
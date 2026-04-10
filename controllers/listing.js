const Listing = require("../models/listing.js");
const axios = require("axios");
const { encodeId } = require("../utils/obfuscate.js");

module.exports.index = async (req, res) => {
    let query = {};
    if (req.query.search) {
        query = {
            $or: [
                { title: { $regex: req.query.search, $options: 'i' } },
                { location: { $regex: req.query.search, $options: 'i' } },
                { country: { $regex: req.query.search, $options: 'i' } }
            ]
        };
    }
    if (req.query.category && req.query.category !== 'All') {
        query.category = req.query.category;
    }

    let sortOptions = {};
    if (req.query.sort === 'price_asc') {
        sortOptions = { price: 1 };
    } else if (req.query.sort === 'price_desc') {
        sortOptions = { price: -1 };
    } else if (req.query.sort === 'newest') {
        sortOptions = { _id: -1 };
    }

    const allListings = await Listing.find(query).sort(sortOptions);
    const activeCategory = req.query.category || 'All';
    const currentSort = req.query.sort || 'default';
    
    res.render("listings/index", { allListings, activeCategory, currentSort, title: "Explore All Homes" });
};

module.exports.mapExplore = async (req, res) => {
    const allListings = await Listing.find({});
    res.render("listings/mapExplore", { allListings, geoapifyKey: process.env.GEOAPIFY_API_KEY, title: "Map View" });
};

module.exports.renderNewForm = (req, res) => {
    res.render("listings/new", { title: "Host Your Home" });
};

module.exports.showListing = async (req, res) => {
    const { id } = req.params;
    const mongoose = require("mongoose");
    if (!mongoose.Types.ObjectId.isValid(id)) {
        req.flash("error", "The property you are looking for does not exist or the link is invalid.");
        return res.redirect("/listings");
    }

    const listing = await Listing.findById(id)
        .populate({ path: "reviews", populate: { path: "author" } })
        .populate("owner")
        .populate("bookings");
    if (!listing) {
        req.flash("error", "Listing not found");
        return res.redirect("/listings");
    }

    let coordinates = (listing.geometry && listing.geometry.coordinates && listing.geometry.coordinates.length === 2) ? listing.geometry.coordinates : null;
    res.render("listings/show", { listing, coordinates, geoapifyKey: process.env.GEOAPIFY_API_KEY, currUser: req.user, title: listing.title });
};

module.exports.createListing = async (req, res, next) => {
    const geoapifyRes = await axios.get("https://api.geoapify.com/v1/geocode/search", {
        params: { text: req.body.listing.location, apiKey: process.env.GEOAPIFY_API_KEY }
    });
    let coordinates = [0, 0];
    if (geoapifyRes.data && geoapifyRes.data.features && geoapifyRes.data.features.length > 0) {
        coordinates = geoapifyRes.data.features[0].geometry.coordinates;
    }
    const geometry = { type: "Point", coordinates: coordinates };
    const newListing = new Listing(req.body.listing);
    newListing.owner = req.user._id;
    if (req.files && req.files.length > 0) {
        newListing.images = req.files.map(f => ({ url: f.path, filename: f.filename }));
    }
    newListing.geometry = geometry;
    await newListing.save();
    req.flash("success", "Your property is now live on Wanderlust! Start welcoming guests.");
    res.redirect(`/listings/${encodeId(newListing._id)}`);
};

module.exports.renderEditForm = async (req, res) => {
    const { id } = req.params;
    const listing = await Listing.findById(id);
    if (!listing) {
        req.flash("error", "Listing not found");
        return res.redirect("/listings");
    }
    let originalImageUrl = (listing.images && listing.images.length > 0) ? listing.images[0].url.replace("/upload", "/upload/w_250") : "";
    res.render("listings/edit", { listing, originalImageUrl, title: `Edit ${listing.title}` });
};

module.exports.updateListing = async (req, res) => {
    const { id } = req.params;
    const listing = await Listing.findByIdAndUpdate(id, { ...req.body.listing });
    if (req.files && req.files.length > 0) {
        listing.images = req.files.map(f => ({ url: f.path, filename: f.filename }));
        await listing.save();
    }
    req.flash("success", "Listing details have been successfully updated.");
    res.redirect(`/listings/${encodeId(id)}`);
};

module.exports.destroyListing = async (req, res) => {
    const { id } = req.params;
    await Listing.findByIdAndDelete(id);
    req.flash("success", "The property listing has been removed from Wanderlust.");
    res.redirect("/listings");
};
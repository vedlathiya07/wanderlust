const express = require("express");
const router = express.Router({ mergeParams: true });
const wrapAsync = require("../utils/wrapAsync.js");
const Booking = require("../models/booking.js");
const Listing = require("../models/listing.js");
const { isLoggedIn } = require("../middleware.js");
const { encodeId, decodeId } = require("../utils/obfuscate.js");

// Decode obfuscated IDs for this router
router.param('id', (req, res, next, id) => {
    try { req.params.id = decodeId(id); } catch(e) {}
    next();
});

router.param('bookingId', (req, res, next, bookingId) => {
    try { req.params.bookingId = decodeId(bookingId); } catch(e) {}
    next();
});

router.delete("/:bookingId", isLoggedIn, wrapAsync(async (req, res) => {
    const { id, bookingId } = req.params;
    await Booking.findByIdAndUpdate(bookingId, { status: "cancelled" });
    await Listing.findByIdAndUpdate(id, { $pull: { bookings: bookingId } });
    req.flash("success", "Your reservation has been successfully cancelled. We hope to host you another time!");
    res.redirect("/my-bookings");
}));

router.post("/", isLoggedIn, wrapAsync(async (req, res) => {
    const { id } = req.params;
    const { checkIn, checkOut } = req.body.booking;
    const listing = await Listing.findById(id);
    if (!listing) {
        req.flash("error", "Listing not found!");
        return res.redirect("/listings");
    }
    const startDate = new Date(checkIn);
    const endDate = new Date(checkOut);
    if (startDate >= endDate) {
        req.flash("error", "Check-out date must be after Check-in date.");
        return res.redirect(`/listings/${encodeId(id)}`);
    }
    const conflict = await Booking.findOne({
        listing: id,
        $or: [
            { checkIn: { $lt: endDate, $gt: startDate } },
            { checkOut: { $lt: endDate, $gt: startDate } },
            { checkIn: { $lte: startDate }, checkOut: { $gte: endDate } }
        ]
    });
    if (conflict) {
        req.flash("error", "These dates are already booked.");
        return res.redirect(`/listings/${encodeId(id)}`);
    }
    const diffDays = Math.ceil(Math.abs(endDate - startDate) / (1000 * 60 * 60 * 24));
    const newBooking = new Booking({
        listing: id,
        user: req.user._id,
        checkIn: startDate,
        checkOut: endDate,
        totalPrice: listing.price * diffDays,
        status: "upcoming",
    });
    const savedBooking = await newBooking.save();
    await Listing.findByIdAndUpdate(id, { $push: { bookings: savedBooking._id } });
    req.flash("success", "Reservation confirmed! Your stay has been successfully locked in.");
    res.redirect("/my-bookings");
}));

module.exports = router;

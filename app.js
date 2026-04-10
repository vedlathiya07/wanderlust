if (process.env.NODE_ENV != "production") {
  require("dotenv").config();
}

const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const ExpressError = require("./utils/ExpressError.js");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user.js");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");

const listingRouter = require("./routes/listing.js");
const reviewRouter = require("./routes/review.js");
const userRouter = require("./routes/user.js");
const bookingRouter = require("./routes/booking.js");

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride("_method"));
app.engine("ejs", ejsMate);
app.use(express.static(path.join(__dirname, "/public")));

app.use((req, res, next) => {
  res.locals.currPath = req.path;
  next();
});

// Security Middlewares
app.use(mongoSanitize());
app.use(helmet({ contentSecurityPolicy: false }));

const dbUrl = process.env.ATLASDB_URL;

main()
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
  });

async function main() {
  await mongoose.connect(dbUrl);
}

const store = MongoStore.create({
  mongoUrl: process.env.ATLASDB_URL,
  secret: process.env.SECRET,
  touchAfter: 24 * 3600,
});

store.on("error", function (e) {
  console.log("SESSION STORE ERROR", e);
});

const sessionOptions = {
  store,
  secret: process.env.SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 * 7,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production", // Only use secure cookies in production (over HTTPS)
  },
};

app.use(session(sessionOptions));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

const { encodeId, decodeId } = require("./utils/obfuscate.js");

// Global parameter decoders for obfuscated IDs
app.param("id", (req, res, next, val) => {
  try {
    req.params.id = decodeId(val);
  } catch (e) {}
  next();
});
app.param("bookingId", (req, res, next, val) => {
  try {
    req.params.bookingId = decodeId(val);
  } catch (e) {}
  next();
});
app.param("reviewId", (req, res, next, val) => {
  try {
    req.params.reviewId = decodeId(val);
  } catch (e) {}
  next();
});

app.use((req, res, next) => {
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  res.locals.currUser = req.user;
  res.locals.currPath = req.path;
  res.locals.encodeId = encodeId;
  res.locals.title = undefined; // Default
  next();
});

// Legal Routes
app.get("/privacy", (req, res) => {
  res.render("legal/privacy");
});

app.get("/terms", (req, res) => {
  res.render("legal/terms");
});

// Map API for silent updates
app.get("/listings/api/map-data", async (req, res) => {
  const Listing = require("./models/listing.js");
  const allListings = await Listing.find({});
  const data = allListings.map((l) => ({
    id: l._id,
    title: l.title,
    price: l.price,
    location: l.location,
    country: l.country,
    image:
      l.images && l.images.length > 0
        ? l.images[0].url
        : l.image
          ? l.image.url
          : "",
    coordinates:
      l.geometry && l.geometry.coordinates ? l.geometry.coordinates : null,
  }));
  res.json(data);
});

app.use("/listings", listingRouter);
app.use("/listings/:id/reviews", reviewRouter);
app.use("/listings/:id/bookings", bookingRouter);
app.use("/", userRouter);

app.use((req, res, next) => {
  next(new ExpressError(404, "Page Not Found!"));
});

app.use((err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }
  let { statusCode = 500, message = "some error occured" } = err;
  res.status(statusCode).render("error.ejs", { message });
});

const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

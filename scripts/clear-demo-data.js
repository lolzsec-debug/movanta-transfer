// Paste into the browser DevTools console while on localhost:3000/app,
// then reload the page. Clears all bookings and listings belonging to the
// two seeded accounts (Alex / demo_user and Test Renter / test_renter_user),
// plus any chat messages tied to those bookings. Other accounts, users, and
// mock vehicle data are untouched.
(function () {
  const ids = ["demo_user", "test_renter_user"];

  const allBookings = JSON.parse(localStorage.getItem("movanta_bookings") || "[]");
  const removedBookingIds = allBookings.filter((b) => ids.includes(b.userId) || ids.includes(b.ownerId)).map((b) => b.id);
  const keptBookings = allBookings.filter((b) => !ids.includes(b.userId) && !ids.includes(b.ownerId));
  localStorage.setItem("movanta_bookings", JSON.stringify(keptBookings));

  const allListings = JSON.parse(localStorage.getItem("movanta_listings") || "[]");
  const keptListings = allListings.filter((l) => !ids.includes(l.ownerId));
  localStorage.setItem("movanta_listings", JSON.stringify(keptListings));

  const allMessages = JSON.parse(localStorage.getItem("movanta_messages") || "[]");
  const keptMessages = allMessages.filter((m) => !removedBookingIds.includes(m.bookingId));
  localStorage.setItem("movanta_messages", JSON.stringify(keptMessages));

  console.log(
    `Cleared ${allBookings.length - keptBookings.length} booking(s), ${allListings.length - keptListings.length} listing(s), ${allMessages.length - keptMessages.length} message(s).`
  );
})();

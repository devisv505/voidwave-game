/* =====================================================================
   VOIDWAVE — SITE CONFIG
   ---------------------------------------------------------------------
   👉 THIS IS THE ONLY FILE YOU NEED TO EDIT TO GO LIVE.
   Replace the placeholder URLs below with your real ones. Every button,
   icon and link on the site reads from here automatically.

   • steam     — your Steam store / "Coming Soon" page
   • discord   — your Discord invite link
   • instagram — your Instagram profile
   • youtube   — your YouTube channel (or trailer link)
   • twitter   — optional; set to "" to hide the X/Twitter icon
   • press     — email for press / creator enquiries
   • newsletter— optional mailing-list signup URL (set "" to hide the form)

   Tip: until you have a Steam page, keep `demoLive` = false to show the
   "Demo coming soon" wording. Flip it to true on launch day.
   ===================================================================== */
window.VOIDWAVE = {
  links: {
    steam:     "",                                   // paste your Steam page URL when you have one
    discord:   "https://discord.gg/He2xhEyNwB",      // ✓ live
    instagram: "https://www.instagram.com/voidwavegame/", // ✓ live
    youtube:   "https://www.youtube.com/@devisv505",  // ✓ live
    twitter:   "",                                   // optional — "" hides it
    press:     "mailto:press@voidwave.game",         // TODO: your press email
    newsletter: ""                                   // optional signup endpoint
  },

  // Studio / developer name shown in the footer & press kit.
  studio:   "DEV505",
  // Set true once the playable demo is live on Steam.
  demoLive: false,
  // Steam page not up yet → the Wishlist buttons show "Coming soon".
  // When you have a Steam page: paste its URL in links.steam above AND set this to true.
  steamLive: false
};

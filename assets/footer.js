// Shared site footer — single source of truth for the markup and the
// Sanity-driven bits (address/hours/maps/social links), included on every
// page via `<script src="assets/footer.js"></script>` right after an empty
// `<footer class="foot" id="visit"></footer>` mount point.
//
// Previously this exact footer (markup + injection JS) was duplicated
// independently across index.html, event.html and artist.html — which is
// how editing the WhatsApp link in Sanity silently did nothing: the
// duplicated copies had drifted, and none of them actually read
// siteSettings.socialLinks. One module now owns all of it.
(function () {
  var PROJECT_ID = "xdtj605l";
  var DATASET = "production";
  var API_VERSION = "v2024-01-01";

  var FOOTER_HTML = `
  <div class="foot-cols">
    <div class="foot-col">
      <div class="foot-col-head">The Wonder Cabinet</div>
      <div class="foot-col-body">
        <p id="footer-address">Karkafeh Street<br>Bethlehem, Palestine<br>(Next to Arij)</p>
        <p id="footer-hours">Every day<br>9:00 – 23:00</p>
        <a id="footer-maps" href="https://goo.gl/maps/9BhxnnrTfYZZVoMU9" target="_blank" rel="noopener">Google Maps →</a>
      </div>
    </div>
    <div class="foot-col">
      <div class="foot-col-head">Programme</div>
      <div class="foot-col-body">
        <a href="index.html#programme">Events</a>
        <a href="/bar">The Bar</a>
        <a href="index.html">Archive</a>
        <a href="index.html">Contribute</a>
        <a href="index.html">About</a>
      </div>
    </div>
    <div class="foot-col">
      <div class="foot-col-head">Follow</div>
      <div class="foot-col-body">
        <a id="footer-instagram" href="https://www.instagram.com/wonder.cabinet/" target="_blank" rel="noopener">Instagram</a>
        <a id="footer-facebook" href="https://www.facebook.com/wondercabinetbethlehem" target="_blank" rel="noopener">Facebook</a>
        <a id="footer-whatsapp" href="https://chat.whatsapp.com/I8ETsHie2Ye87kURhWnZY1" target="_blank" rel="noopener">WhatsApp</a>
        <button class="foot-newsletter-btn">Subscribe to Newsletter</button>
      </div>
    </div>
    <div class="foot-col">
      <div class="foot-col-head">Contact</div>
      <div class="foot-col-body">
        <a href="mailto:office@wondercabinet.space">office@wondercabinet.space</a>
        <a href="https://radioalhara.net" target="_blank" rel="noopener">Radio Alhara</a>
        <a href="index.html">Local Industries</a>
        <a href="https://www.aauanastas.com" target="_blank" rel="noopener">AAU Anastas</a>
      </div>
    </div>
  </div>
  <div class="foot-base">
    <span>© The Wonder Cabinet · Bethlehem, Palestine</span>
    <span><a href="index.html">مجلس العجب</a></span>
  </div>`;

  function mount() {
    var el = document.getElementById("visit");
    if (!el) return;
    el.innerHTML = FOOTER_HTML;
  }

  // Exposed so a page that's already fetching siteSettings for its own
  // reasons (e.g. index.html needs ogImage) can hand the same doc over
  // instead of triggering a second, redundant fetch.
  function injectSettings(settingsDoc) {
    if (!settingsDoc) return;
    var fAddr = document.getElementById("footer-address");
    var fHours = document.getElementById("footer-hours");
    var fMaps = document.getElementById("footer-maps");
    if (fAddr && settingsDoc.address && settingsDoc.address.en) {
      fAddr.innerHTML =
        '<span class="en-only">' + settingsDoc.address.en.replace(/\n/g, "<br>") + "</span>" +
        (settingsDoc.address.ar ? '<span class="ar-only ar" dir="rtl">' + settingsDoc.address.ar.replace(/\n/g, "<br>") + "</span>" : "");
    }
    if (fHours && settingsDoc.hours && settingsDoc.hours.en) {
      fHours.innerHTML =
        '<span class="en-only">' + settingsDoc.hours.en + "</span>" +
        (settingsDoc.hours.ar ? '<span class="ar-only ar" dir="rtl">' + settingsDoc.hours.ar + "</span>" : "");
    }
    if (fMaps && settingsDoc.mapsUrl) fMaps.href = settingsDoc.mapsUrl;

    var socialByLabel = {};
    (settingsDoc.socialLinks || []).forEach(function (l) {
      if (l && l.label && l.url) socialByLabel[l.label.trim().toLowerCase()] = l.url;
    });
    var fIg = document.getElementById("footer-instagram");
    var fFb = document.getElementById("footer-facebook");
    var fWa = document.getElementById("footer-whatsapp");
    if (fIg && socialByLabel["instagram"]) fIg.href = socialByLabel["instagram"];
    if (fFb && socialByLabel["facebook"]) fFb.href = socialByLabel["facebook"];
    if (fWa && socialByLabel["whatsapp"]) fWa.href = socialByLabel["whatsapp"];
  }

  function fetchSettings() {
    var query = '*[_type == "siteSettings"][0]{ address, hours, mapsUrl, socialLinks }';
    var url = `https://${PROJECT_ID}.api.sanity.io/${API_VERSION}/data/query/${DATASET}?query=${encodeURIComponent(query)}`;
    return fetch(url)
      .then(function (r) { return r.json(); })
      .then(function (j) { return j.result; });
  }

  mount();
  fetchSettings()
    .then(injectSettings)
    .catch(function (err) { console.warn("[WC] footer settings fetch failed", err); });

  window.WCFooter = { injectSettings: injectSettings };
})();

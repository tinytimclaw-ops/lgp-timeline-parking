// LGP Timeline Parking Search

// Airport name lookup
const AIRPORT_NAMES = {
  LHR: "Heathrow", LGW: "Gatwick", MAN: "Manchester", STN: "Stansted",
  LTN: "Luton", BHX: "Birmingham", EDI: "Edinburgh", BRS: "Bristol",
  NCL: "Newcastle", LBA: "Leeds Bradford", EMA: "East Midlands",
  LPL: "Liverpool", GLA: "Glasgow", EXT: "Exeter", LCY: "London City"
};
const DEFAULT_AIRPORT = "Airport";

// Helper functions
function datePlus(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

function defaultInFromOut(outDateStr) {
  const d = new Date(outDateStr);
  d.setDate(d.getDate() + 8);
  return d.toISOString().split("T")[0];
}

function formatDateShort(dateStr) {
  const d = new Date(dateStr);
  const options = { day: 'numeric', month: 'short' };
  return d.toLocaleDateString('en-GB', options);
}

function daysDifference(startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end - start);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

let inDateManuallyChanged = false;
let isDragging = false;
let dragMarker = null;

// Update timeline visuals
function updateTimeline() {
  const outDate = document.getElementById('outDate').value;
  const inDate = document.getElementById('inDate').value;
  const outTime = document.getElementById('outTime').value;
  const inTime = document.getElementById('inTime').value;

  if (!outDate || !inDate) return;

  // Update display labels
  document.getElementById('startDateDisplay').textContent = formatDateShort(outDate);
  document.getElementById('startTimeDisplay').textContent = outTime;
  document.getElementById('endDateDisplay').textContent = formatDateShort(inDate);
  document.getElementById('endTimeDisplay').textContent = inTime;

  // Calculate duration
  const days = daysDifference(outDate, inDate);
  document.getElementById('durationText').textContent =
    `Duration: ${days} day${days !== 1 ? 's' : ''}`;

  // Update marker positions (10% to 90% range)
  const today = new Date();
  const maxDays = 60; // Visual range: 60 days
  const startDiff = daysDifference(today.toISOString().split('T')[0], outDate);
  const endDiff = daysDifference(today.toISOString().split('T')[0], inDate);

  const startPercent = Math.min(90, Math.max(10, 10 + (startDiff / maxDays) * 80));
  const endPercent = Math.min(90, Math.max(10, 10 + (endDiff / maxDays) * 80));

  const markerStart = document.getElementById('markerStart');
  const markerEnd = document.getElementById('markerEnd');
  const timelineRange = document.getElementById('timelineRange');

  if (!isDragging) {
    markerStart.style.left = `${startPercent}%`;
    markerEnd.style.left = `${endPercent}%`;
  }

  timelineRange.style.left = `${startPercent}%`;
  timelineRange.style.width = `${endPercent - startPercent}%`;
}

// Convert marker position to date
function percentToDate(percent) {
  const today = new Date();
  const maxDays = 60;
  const dayOffset = Math.round(((percent - 10) / 80) * maxDays);
  const d = new Date(today);
  d.setDate(d.getDate() + dayOffset);
  return d.toISOString().split('T')[0];
}

// Drag functionality
function initDragging() {
  const markerStart = document.getElementById('markerStart');
  const markerEnd = document.getElementById('markerEnd');
  const timelineVisual = document.querySelector('.timeline-visual');

  function startDrag(marker, e) {
    isDragging = true;
    dragMarker = marker;
    marker.classList.add('dragging');
    e.preventDefault();
  }

  function onDrag(e) {
    if (!isDragging || !dragMarker) return;

    const rect = timelineVisual.getBoundingClientRect();
    const x = (e.type.includes('touch') ? e.touches[0].clientX : e.clientX) - rect.left;
    const percent = Math.min(90, Math.max(10, (x / rect.width) * 100));

    dragMarker.style.left = `${percent}%`;

    // Update date input based on position
    const newDate = percentToDate(percent);
    if (dragMarker === markerStart) {
      document.getElementById('outDate').value = newDate;
      if (!inDateManuallyChanged) {
        document.getElementById('inDate').value = defaultInFromOut(newDate);
      }
    } else {
      document.getElementById('inDate').value = newDate;
      inDateManuallyChanged = true;
    }

    updateTimeline();
  }

  function endDrag() {
    if (isDragging && dragMarker) {
      dragMarker.classList.remove('dragging');
      isDragging = false;
      dragMarker = null;
    }
  }

  // Mouse events
  markerStart.addEventListener('mousedown', (e) => startDrag(markerStart, e));
  markerEnd.addEventListener('mousedown', (e) => startDrag(markerEnd, e));
  document.addEventListener('mousemove', onDrag);
  document.addEventListener('mouseup', endDrag);

  // Touch events
  markerStart.addEventListener('touchstart', (e) => startDrag(markerStart, e));
  markerEnd.addEventListener('touchstart', (e) => startDrag(markerEnd, e));
  document.addEventListener('touchmove', onDrag);
  document.addEventListener('touchend', endDrag);
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
  // Set default dates
  const outDateInput = document.getElementById('outDate');
  const inDateInput = document.getElementById('inDate');

  outDateInput.value = datePlus(1);
  inDateInput.value = datePlus(9);

  // Update timeline on any change
  outDateInput.addEventListener('change', function() {
    if (!inDateManuallyChanged) {
      inDateInput.value = defaultInFromOut(this.value);
    }
    updateTimeline();
  });

  inDateInput.addEventListener('change', function() {
    inDateManuallyChanged = true;
    updateTimeline();
  });

  document.getElementById('outTime').addEventListener('change', updateTimeline);
  document.getElementById('inTime').addEventListener('change', updateTimeline);

  // Initial timeline render
  updateTimeline();

  // Initialize dragging
  initDragging();

  // Resolve airport from URL
  const urlParams = new URLSearchParams(window.location.search);
  const locationParam = (urlParams.get("Location") || urlParams.get("location") || "").toUpperCase();
  const airportSelect = document.getElementById('airport');

  if (locationParam && AIRPORT_NAMES[locationParam]) {
    airportSelect.value = locationParam;
  }

  // Resolve airport name for title
  const depart = airportSelect.value || locationParam || "LGW";
  const airportName = AIRPORT_NAMES[depart] || DEFAULT_AIRPORT;
  document.getElementById('pageTitle').textContent = `${airportName} Parking`;
  document.getElementById('bannerHeadline').textContent =
    `Slide through your ${airportName.toLowerCase()} parking journey`;

  // Form submission
  document.getElementById('searchForm').addEventListener('submit', function(e) {
    e.preventDefault();

    const outDate = document.getElementById('outDate').value;
    const outTime = document.getElementById('outTime').value;
    const inDate = document.getElementById('inDate').value;
    const inTime = document.getElementById('inTime').value;
    const depart = document.getElementById('airport').value;

    const agent = urlParams.get("agent") || "WY992";
    const flight = urlParams.get("flight") || "default";
    const adcode = urlParams.get("adcode") || "";
    const promotionCode = urlParams.get("promotionCode") || "";

    // Domain resolution (LGP swaps www -> app)
    const host = window.location.host;
    const isLocal = host.startsWith("127") || host.includes("github.io");
    const basedomain = isLocal ? "www.holidayextras.com" : host.replace("www", "app");

    // URL-encode times
    const outTimeEncoded = outTime.replace(":", "%3A");
    const inTimeEncoded = inTime.replace(":", "%3A");

    // Build search URL
    const searchUrl = `https://${basedomain}/static/?selectProduct=cp&#/categories?agent=${agent}&ppts=&customer_ref=&lang=en&adults=2&depart=${depart}&terminal=&arrive=&flight=${flight}&in=${inDate}&out=${outDate}&park_from=${outTimeEncoded}&park_to=${inTimeEncoded}&filter_meetandgreet=&filter_parkandride=&children=0&infants=0&redirectReferal=carpark&from_categories=true&adcode=${adcode}&promotionCode=${promotionCode}`;

    window.location.href = searchUrl;
  });
});

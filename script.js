/*************************************************
 * VARIABLES GLOBALES
 *************************************************/
const locationDiv = document.getElementById("location");
const resultCard = document.getElementById("result");
const lightDiv = document.getElementById("light");
const moonDiv = document.getElementById("moon");
const calendarDiv = document.getElementById("iss-calendar");
const eventsDiv = document.getElementById("events");
const mapFrame = document.getElementById("lightMap");

const scoreDiv = document.createElement("div");
scoreDiv.className = "event";
resultCard.prepend(scoreDiv);

let userLocationName = "tu ubicación";
let currentBortle = 8;
let issVisibleTonight = false;
let starlinkPossibleTonight = false;

/*************************************************
 * BACKEND URL (AUTO)
 *************************************************/
const BACKEND_URL = `${window.location.protocol}//${window.location.hostname}:5050`;

/*************************************************
 * GEOLOCALIZACIÓN
 *************************************************/
navigator.geolocation.getCurrentPosition(initApp, geoError);

function initApp(pos) {
  const lat = pos.coords.latitude;
  const lon = pos.coords.longitude;

  resultCard.classList.remove("hidden");

  getCityAndBortle(lat, lon);
  loadLightMap(lat, lon);

  const moonData = showMoon();
  showISSCalendar(lat, lon);
  showAstronomicalEvents();
  evaluateStarlink();

  setTimeout(() => {
    calculateNightScore(moonData);
  }, 800);
}

function geoError() {
  locationDiv.textContent = "📍 Ubicación no detectada (modo manual)";
  resultCard.classList.remove("hidden");

  // Coordenadas por defecto (ej. Madrid)
  const lat = 40.4168;
  const lon = -3.7038;

  getCityAndBortle(lat, lon);
  loadLightMap(lat, lon);

  const moonData = showMoon();
  showISSCalendar(lat, lon);
  showAstronomicalEvents();
  evaluateStarlink();

  setTimeout(() => {
    calculateNightScore(moonData);
  }, 800);
}


/*************************************************
 * UBICACIÓN + CONTAMINACIÓN
 *************************************************/
function getCityAndBortle(lat, lon) {
  fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`)
    .then(r => r.json())
    .then(data => {
      const a = data.address || {};
      const city = a.city || a.town || a.village || "tu ubicación";

      userLocationName = city;
      locationDiv.textContent = `📍 ${city}`;

      const type = a.city ? "city" : a.town ? "town" : a.village ? "village" : "rural";
      const bortle = estimateBortle(type);
      currentBortle = bortle.level;

      lightDiv.innerHTML = `
        Nivel estimado: <strong>Bortle ${bortle.level}</strong><br>
        ${bortle.text}
      `;
    });
}

function estimateBortle(type) {
  if (type === "city") return { level: 8, text: "Cielo urbano muy iluminado." };
  if (type === "town") return { level: 7, text: "Cielo urbano/suburbano." };
  if (type === "village") return { level: 6, text: "Cielo suburbano." };
  return { level: 5, text: "Cielo relativamente oscuro." };
}

/*************************************************
 * MAPA
 *************************************************/
function loadLightMap(lat, lon) {
  mapFrame.src =
    `https://www.lightpollutionmap.info/#zoom=8&lat=${lat}&lon=${lon}&layers=B0FFFFFFFTFFFFFFFFFF`;
}

/*************************************************
 * LUNA
 *************************************************/
function showMoon() {
  const p = moonPhaseData();
  moonDiv.innerHTML = `🌙 Impacto lunar: <strong>${p.label}</strong>`;
  return p;
}

function moonPhaseData() {
  const now = new Date();
  const newMoon = new Date("2000-01-06T18:14:00Z");
  const days = (now - newMoon) / 86400000;
  const phase = days % 29.53;

  if (phase < 1) return { score: 2, label: "Visibilidad Excelente" };
  if (phase < 7) return { score: 1, label: "Visibilidad Buena" };
  if (phase < 15) return { score: 0, label: "Visibilidad Mala" };
  return { score: 1, label: "Visibilidad Aceptable" };
}

/*************************************************
 * EEI
 *************************************************/
function showISSCalendar(lat, lon) {
  issVisibleTonight = false;
  calendarDiv.innerHTML = "";

 fetch(`${BACKEND_URL}/iss/next-passes?lat=${lat}&lon=${lon}`)
.then(r => r.json())
    .then(data => {
      data.passes.forEach(p => {
        if (p.visible) issVisibleTonight = true;

        calendarDiv.innerHTML += `
          <div class="event">
            🛰️ <strong>Estación Espacial Internacional</strong><br>
            📅 ${formatDate(p.date)}<br>
            🕒 ${p.start} – ${p.end}<br>
            ⬆️ Altura máx: ${p.max_altitude}°<br>
            👀 ${p.visible ? "Visible 🌙" : "No visible ☀️"}<br>
            📍 ${p.azimuth}
          </div>
        `;
      });
    });
}

/*************************************************
 * EVENTOS ASTRONÓMICOS (ARREGLADO)
 *************************************************/
function showAstronomicalEvents() {
  eventsDiv.innerHTML = "";

  const today = new Date();
  const oneWeekLater = new Date();
  oneWeekLater.setDate(today.getDate() + 7);

  const events = [
    {
      title: "🌠 Lluvia de estrellas (Perseidas)",
      dateObj: new Date(today.getFullYear(), 7, 12),
      dateText: "12–13 de agosto",
      time: "02:00 – 05:00",
      visibility: "Media",
      moon: "Molesta al inicio, mejora al amanecer",
      info: "Mirar hacia el noreste"
    },
    {
      title: "🌑 Eclipse lunar parcial",
      dateObj: new Date(today.getFullYear(), 8, 18),
      dateText: "18 de septiembre",
      time: "21:30 – 23:00",
      visibility: "Alta",
      moon: "No afecta",
      info: "Visible a simple vista"
    },
    {
      title: "🪐 Oposición de Saturno",
      dateObj: new Date(today.getFullYear(), 8, 8),
      dateText: "8 de septiembre",
      time: "22:00 – 03:00",
      visibility: "Alta",
      moon: "Impacto bajo",
      info: "Ideal con prismáticos o telescopio"
    },
    {
      title: "☄️ Cometa visible (estimado)",
      dateObj: new Date(today.getFullYear(), 9, 10),
      dateText: "Octubre",
      time: "Antes del amanecer",
      visibility: "Baja–Media",
      moon: "Depende de la fase lunar",
      info: "Buscar bajo en el horizonte este"
    },
    {
      title: "🌠 Lluvia de estrellas (Gemínidas)",
      dateObj: new Date(today.getFullYear(), 11, 13),
      dateText: "13–14 de diciembre",
      time: "01:00 – 06:00",
      visibility: "Alta",
      moon: "Condiciones favorables",
      info: "Una de las mejores del año"
    }
  ];

  // Ordenar por fecha
  events.sort((a, b) => a.dateObj - b.dateObj);

  events.forEach((e, index) => {
    let badge = null;
    if (sameDay(e.dateObj, today)) badge = "HOY";
    else if (e.dateObj <= oneWeekLater) badge = "ESTA SEMANA";

    const eventId = `event-details-${index}`;

    eventsDiv.innerHTML += `
      <div class="event">

        ${badge ? `
  <div style="
    margin-bottom:8px;
    display:block;
  ">
    <span style="
      display:inline-block;
      background:#ffb74d;
      color:#0b0f1a;
      font-size:0.7rem;
      font-weight:600;
      padding:3px 8px;
      border-radius:999px;
    ">
      ${badge}
    </span>
  </div>
` : ""}

<div style="display:block; font-weight:600;">
  ${e.title}
</div>

        📅 ${e.dateText}<br>
        🕒 ${e.time}<br>
        👀 Visibilidad desde ${userLocationName}: <strong>${e.visibility}</strong><br>

        <button
          onclick="toggleEventDetails('${eventId}')"
          style="
            margin-top:6px;
            background:#1d2450;
            border:none;
            color:#fff;
            border-radius:6px;
            padding:6px 10px;
            cursor:pointer;
          "
        >
          ➕ Ver detalles
        </button>

        <div id="${eventId}" style="display:none; margin-top:6px;">
          🌙 Luna: ${e.moon}<br>
          ℹ️ ${e.info}
        </div>

      </div>
    `;
  });
}


/*************************************************
 * STARLINK
 *************************************************/
function evaluateStarlink() {
  const hour = new Date().getHours();
  if ((hour >= 20 || hour <= 6) && currentBortle <= 7) {
    starlinkPossibleTonight = true;
    eventsDiv.innerHTML += `
      <div class="event">
        🛰️ <strong>Starlink (estimado)</strong><br>
        👀 Posible tras el atardecer
      </div>
    `;
  }
}
/*************************************************
 * SCORE
 *************************************************/
function calculateNightScore(moonData) {
  let score = moonData.score;

  if (currentBortle <= 6) score += 2;
  else if (currentBortle === 7) score += 1;

  if (issVisibleTonight) score += 1;
  if (starlinkPossibleTonight) score += 1;

  // Normalizar a 0–5 estrellas
  const stars = Math.max(0, Math.min(5, Math.round((score / 6) * 5)));

  // Etiqueta descriptiva
  let label = "Noche normal";
  if (stars === 5) label = "Noche excelente para observar";
  else if (stars === 4) label = "Buena noche para observar";
  else if (stars === 3) label = "Noche aceptable";
  else if (stars === 2) label = "Noche poco recomendable";
  else label = "Mala noche para observar";

  // Construir estrellas
  let starsHTML = "";
  for (let i = 1; i <= 5; i++) {
    if (i <= stars) {
      starsHTML += `<span class="star active">★</span>`;
    } else {
      starsHTML += `<span class="star inactive">★</span>`;
    }
  }

  // Pintar score
  scoreDiv.innerHTML = `
    <div class="score-title">⭐ Score de la noche</div>
    <div class="score-stars tooltip">
  ${starsHTML}
  <span class="tooltip-text">
    ⭐ Score de la noche<br><br>
    Se calcula según:<br>
    • Fase de la Luna<br>
    • Contaminación lumínica<br>
    • Visibilidad de la EEI<br>
    • Posibles pases Starlink
  </span>
</div>

    <div class="score-label">${label}</div>
  `;
}



/*************************************************
 * UTILIDADES
 *************************************************/
function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long"
  });
}

function sameDay(d1, d2) {
  return d1.toDateString() === d2.toDateString();
}

function toggleEventDetails(id) {
  const el = document.getElementById(id);
  el.style.display = el.style.display === "none" ? "block" : "none";
}
function saveFavoriteCity(city) {
  localStorage.setItem("favoriteCity", city);
}
function getFavoriteCity() {
  return localStorage.getItem("favoriteCity");
}
function useFavoriteCity() {
  const city = getFavoriteCity();
  if (!city) {
    alert("No hay ciudad guardada todavía");
    return;
  }

  locationDiv.textContent = `📍 ${city} (favorita)`;
  saveFavoriteCity(city);

}

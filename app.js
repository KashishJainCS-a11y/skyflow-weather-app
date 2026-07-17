/**
 * SkyFlow - Premium Weather Web App Controller
 * Built from scratch. Connects to Open-Meteo & Nominatim APIs.
 */

// ==========================================================================
// STATE MANAGEMENT & CONSTANTS
// ==========================================================================
const state = {
  unit: 'C', // 'C' or 'F'
  location: {
    lat: 51.5074,
    lon: -0.1278,
    name: 'London, United Kingdom'
  },
  weatherData: null, // Cached raw weather JSON
  searchDebounceTimer: null
};

// WMO weather code dictionary mapping codes to descriptions, themes, and icon keys
const WEATHER_CODES = {
  0: { label: "Clear Sky", theme: "sunny", icon: "clear" },
  1: { label: "Mainly Clear", theme: "sunny", icon: "partly_cloudy" },
  2: { label: "Partly Cloudy", theme: "cloudy", icon: "partly_cloudy" },
  3: { label: "Overcast", theme: "cloudy", icon: "cloudy" },
  45: { label: "Foggy", theme: "cloudy", icon: "fog" },
  48: { label: "Depositing Rime Fog", theme: "cloudy", icon: "fog" },
  51: { label: "Light Drizzle", theme: "rainy", icon: "drizzle" },
  53: { label: "Moderate Drizzle", theme: "rainy", icon: "drizzle" },
  55: { label: "Dense Drizzle", theme: "rainy", icon: "drizzle" },
  56: { label: "Light Freezing Drizzle", theme: "snowy", icon: "sleet" },
  57: { label: "Dense Freezing Drizzle", theme: "snowy", icon: "sleet" },
  61: { label: "Slight Rain", theme: "rainy", icon: "rain" },
  63: { label: "Moderate Rain", theme: "rainy", icon: "rain" },
  65: { label: "Heavy Rain", theme: "rainy", icon: "rain" },
  66: { label: "Light Freezing Rain", theme: "snowy", icon: "sleet" },
  67: { label: "Heavy Freezing Rain", theme: "snowy", icon: "sleet" },
  71: { label: "Slight Snowfall", theme: "snowy", icon: "snow" },
  73: { label: "Moderate Snowfall", theme: "snowy", icon: "snow" },
  75: { label: "Heavy Snowfall", theme: "snowy", icon: "snow" },
  77: { label: "Snow Grains", theme: "snowy", icon: "snow" },
  80: { label: "Slight Rain Showers", theme: "rainy", icon: "showers" },
  81: { label: "Moderate Rain Showers", theme: "rainy", icon: "showers" },
  82: { label: "Violent Rain Showers", theme: "rainy", icon: "showers" },
  85: { label: "Slight Snow Showers", theme: "snowy", icon: "snow" },
  86: { label: "Heavy Snow Showers", theme: "snowy", icon: "snow" },
  95: { label: "Thunderstorm", theme: "stormy", icon: "storm" },
  96: { label: "Thunderstorm with Slight Hail", theme: "stormy", icon: "storm" },
  99: { label: "Thunderstorm with Heavy Hail", theme: "stormy", icon: "storm" }
};

// ==========================================================================
// SVG WEATHER ICONS TEMPLATES (with CSS keyframe classes)
// ==========================================================================
function getIconSVG(iconKey, isDay) {
  const strokeColor = "currentColor";
  const fillYellow = "#facc15";
  const fillCloud = "#e2e8f0";
  const fillBlue = "#38bdf8";

  // Override clear sky icons during nighttime
  if (iconKey === "clear" && !isDay) iconKey = "moon";
  if (iconKey === "partly_cloudy" && !isDay) iconKey = "partly_cloudy_night";

  switch (iconKey) {
    case "clear":
      return `
        <svg class="w-icon" viewBox="0 0 24 24" fill="none" stroke="${strokeColor}">
          <circle class="w-icon-sun" cx="12" cy="12" r="5" fill="${fillYellow}" stroke="${fillYellow}" stroke-width="1.5" />
          <g class="w-icon-sun" stroke="${fillYellow}" stroke-width="2.5" stroke-linecap="round">
            <line x1="12" y1="1" x2="12" y2="3" />
            <line x1="12" y1="21" x2="12" y2="23" />
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
            <line x1="1" y1="12" x2="3" y2="12" />
            <line x1="21" y1="12" x2="23" y2="12" />
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
          </g>
        </svg>`;
    
    case "moon":
      return `
        <svg class="w-icon" viewBox="0 0 24 24" fill="none" stroke="${strokeColor}">
          <path class="w-icon-moon" d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9z" fill="#94a3b8" stroke="#cbd5e1" stroke-width="1.5" />
          <circle cx="16" cy="7" r="0.5" fill="#fff" />
          <circle cx="19" cy="10" r="0.5" fill="#fff" />
        </svg>`;

    case "partly_cloudy":
      return `
        <svg class="w-icon" viewBox="0 0 24 24" fill="none" stroke="${strokeColor}">
          <circle class="w-icon-sun" cx="8" cy="8" r="3.5" fill="${fillYellow}" stroke="${fillYellow}" stroke-width="1" />
          <g class="w-icon-sun" stroke="${fillYellow}" stroke-width="1.5" stroke-linecap="round">
            <line x1="8" y1="1" x2="8" y2="2.5" />
            <line x1="8" y1="13.5" x2="8" y2="15" />
            <line x1="3" y1="8" x2="1.5" y2="8" />
            <line x1="14.5" y1="8" x2="13" y2="8" />
          </g>
          <path class="w-icon-cloud" d="M20 17.5a2.5 2.5 0 0 0-2.5-2.5h-.07a4.5 4.5 0 0 0-8.75-.85A3 3 0 0 0 5.5 15a3 3 0 0 0 0 6h12a2.5 2.5 0 0 0 2.5-2.5z" fill="${fillCloud}" stroke="#94a3b8" stroke-width="1.5" />
        </svg>`;

    case "partly_cloudy_night":
      return `
        <svg class="w-icon" viewBox="0 0 24 24" fill="none" stroke="${strokeColor}">
          <path class="w-icon-moon" d="M10 4.5a3.5 3.5 0 0 0 5.25 5.25 5.25 5.25 0 1 1-5.25-5.25z" fill="#94a3b8" stroke="#cbd5e1" stroke-width="1" />
          <path class="w-icon-cloud" d="M20 17.5a2.5 2.5 0 0 0-2.5-2.5h-.07a4.5 4.5 0 0 0-8.75-.85A3 3 0 0 0 5.5 15a3 3 0 0 0 0 6h12a2.5 2.5 0 0 0 2.5-2.5z" fill="${fillCloud}" stroke="#94a3b8" stroke-width="1.5" />
        </svg>`;

    case "cloudy":
      return `
        <svg class="w-icon" viewBox="0 0 24 24" fill="none" stroke="${strokeColor}">
          <path class="w-icon-cloud" d="M19 16.5a3.5 3.5 0 0 0-3.5-3.5h-.1A6 6 0 0 0 4 14.5a4 4 0 0 0 0 8h11.5a3.5 3.5 0 0 0 3.5-3.5z" fill="#cbd5e1" stroke="#64748b" stroke-width="1.5" />
          <path class="w-icon-cloud" d="M20 12.5a2.5 2.5 0 0 0-2.5-2.5h-.07a4.5 4.5 0 0 0-8.75-.85A3 3 0 0 0 5.5 10a3 3 0 0 0 0 6h12A2.5 2.5 0 0 0 20 12.5z" fill="${fillCloud}" stroke="#94a3b8" stroke-width="1.2" opacity="0.9" style="transform: translate(-2px, -3px);" />
        </svg>`;

    case "fog":
      return `
        <svg class="w-icon" viewBox="0 0 24 24" fill="none" stroke="${strokeColor}">
          <path class="w-icon-cloud" d="M19 13.5a3.5 3.5 0 0 0-3.5-3.5h-.1a6 6 0 0 0-11.4 1.5 4 4 0 0 0 0 8h11.5a3.5 3.5 0 0 0 3.5-3.5z" fill="${fillCloud}" stroke="#94a3b8" stroke-width="1.5" opacity="0.6" />
          <g stroke="#cbd5e1" stroke-width="2" stroke-linecap="round" class="w-icon-wind-line">
            <line x1="3" y1="16" x2="21" y2="16" />
            <line x1="5" y1="19" x2="19" y2="19" />
            <line x1="2" y1="22" x2="16" y2="22" />
          </g>
        </svg>`;

    case "drizzle":
      return `
        <svg class="w-icon" viewBox="0 0 24 24" fill="none" stroke="${strokeColor}">
          <path class="w-icon-cloud" d="M19 11.5a3.5 3.5 0 0 0-3.5-3.5h-.1a6 6 0 0 0-11.4 1.5 4 4 0 0 0 0 8h11.5a3.5 3.5 0 0 0 3.5-3.5z" fill="${fillCloud}" stroke="#94a3b8" stroke-width="1.5" />
          <g stroke="${fillBlue}" stroke-width="2" stroke-linecap="round">
            <line class="w-icon-rain-drop" x1="9" y1="15" x2="7" y2="18" />
            <line class="w-icon-rain-drop" x1="14" y1="15" x2="12" y2="18" />
          </g>
        </svg>`;

    case "rain":
    case "showers":
      return `
        <svg class="w-icon" viewBox="0 0 24 24" fill="none" stroke="${strokeColor}">
          <path class="w-icon-cloud" d="M19 10.5a3.5 3.5 0 0 0-3.5-3.5h-.1a6 6 0 0 0-11.4 1.5 4 4 0 0 0 0 8h11.5a3.5 3.5 0 0 0 3.5-3.5z" fill="#94a3b8" stroke="#475569" stroke-width="1.5" />
          <g stroke="${fillBlue}" stroke-width="2.5" stroke-linecap="round">
            <line class="w-icon-rain-drop" x1="8" y1="14" x2="6" y2="19" />
            <line class="w-icon-rain-drop" x1="12" y1="14" x2="10" y2="19" />
            <line class="w-icon-rain-drop" x1="16" y1="14" x2="14" y2="19" />
          </g>
        </svg>`;

    case "snow":
    case "sleet":
      return `
        <svg class="w-icon" viewBox="0 0 24 24" fill="none" stroke="${strokeColor}">
          <path class="w-icon-cloud" d="M19 11.5a3.5 3.5 0 0 0-3.5-3.5h-.1a6 6 0 0 0-11.4 1.5 4 4 0 0 0 0 8h11.5a3.5 3.5 0 0 0 3.5-3.5z" fill="${fillCloud}" stroke="#cbd5e1" stroke-width="1.5" />
          <g stroke="#93c5fd" stroke-width="1" stroke-linecap="round" fill="none">
            <circle class="w-icon-snow-flake" cx="8" cy="16" r="1.2" fill="#fff" />
            <circle class="w-icon-snow-flake" cx="12" cy="18" r="1.5" fill="#fff" />
            <circle class="w-icon-snow-flake" cx="16" cy="15" r="1.2" fill="#fff" />
          </g>
        </svg>`;

    case "storm":
      return `
        <svg class="w-icon" viewBox="0 0 24 24" fill="none" stroke="${strokeColor}">
          <path class="w-icon-cloud" d="M19 10.5a3.5 3.5 0 0 0-3.5-3.5h-.1a6 6 0 0 0-11.4 1.5 4 4 0 0 0 0 8h11.5a3.5 3.5 0 0 0 3.5-3.5z" fill="#475569" stroke="#1e293b" stroke-width="1.5" />
          <polygon class="w-icon-bolt" points="13,12 10,16 12,16 11,20 15,14 13,14" fill="${fillYellow}" stroke="${fillYellow}" stroke-width="0.5" />
          <g stroke="${fillBlue}" stroke-width="2" stroke-linecap="round">
            <line class="w-icon-rain-drop" x1="7" y1="15" x2="5" y2="18" />
            <line class="w-icon-rain-drop" x1="16" y1="15" x2="14" y2="18" />
          </g>
        </svg>`;

    default:
      return `
        <svg class="w-icon" viewBox="0 0 24 24" fill="none" stroke="${strokeColor}" stroke-width="2">
          <circle cx="12" cy="12" r="10" />
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>`;
  }
}

// ==========================================================================
// TEMPERATURE UTILITIES
// ==========================================================================
function formatTemp(celsius) {
  if (state.unit === 'F') {
    const fahr = (celsius * 9) / 5 + 32;
    return Math.round(fahr);
  }
  return Math.round(celsius);
}

// ==========================================================================
// WEATHER DATA CONVERTERS & FORMATTERS
// ==========================================================================
function getUVIndexRating(uv) {
  if (uv <= 2) return { text: 'Low', class: 'green' };
  if (uv <= 5) return { text: 'Moderate', class: 'yellow' };
  if (uv <= 7) return { text: 'High', class: 'orange' };
  if (uv <= 10) return { text: 'Very High', class: 'red' };
  return { text: 'Extreme', class: 'purple' };
}

function getHumidityComment(hum) {
  if (hum < 30) return 'Very Dry Air';
  if (hum <= 60) return 'Comfortable Air';
  if (hum <= 80) return 'Humid Air';
  return 'Extremely Sticky';
}

function getApparentTempComment(cTemp, fTemp) {
  const diff = cTemp - fTemp;
  if (Math.abs(diff) < 1.5) return 'Similar to actual temp';
  if (diff > 0) return 'Wind chill is making it colder';
  return 'Humidity is making it feel warmer';
}

function getPressureComment(hpa) {
  if (hpa < 1009) return 'Low Pressure System';
  if (hpa <= 1020) return 'Normal Pressure';
  return 'High Pressure System';
}

function getWindDirectionLabel(deg) {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(((deg %= 360) < 0 ? deg + 360 : deg) / 22.5) % 16;
  return directions[index];
}

function formatISOTime(isoString) {
  const date = new Date(isoString);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
}

function getDayOfWeekName(isoString) {
  const date = new Date(isoString);
  return date.toLocaleDateString('en-US', { weekday: 'long' });
}

function getShortDayOfWeekName(isoString) {
  const date = new Date(isoString);
  const today = new Date();
  if (date.toDateString() === today.toDateString()) return 'Today';
  return date.toLocaleDateString('en-US', { weekday: 'short' });
}

// ==========================================================================
// WEATHER DATA RETRIEVAL (API FETCHING)
// ==========================================================================
async function fetchWeather(lat, lon) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,rain,showers,snowfall,weather_code,cloud_cover,pressure_msl,wind_speed_10m,wind_direction_10m&hourly=temperature_2m,relative_humidity_2m,weather_code,precipitation_probability,uv_index&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max&timezone=auto`;
  
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch weather data');
    const data = await response.json();
    state.weatherData = data;
    renderUI();
  } catch (error) {
    console.error('Weather Fetch Error:', error);
    alert('Could not load weather information. Please check your network and try again.');
  }
}

// Reverse geocode lat/lon to friendly city name
async function reverseGeocode(lat, lon) {
  try {
    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`);
    if (response.ok) {
      const data = await response.json();
      const city = data.address.city || data.address.town || data.address.village || data.address.county || 'Detected Location';
      const country = data.address.country || '';
      state.location.name = country ? `${city}, ${country}` : city;
    } else {
      state.location.name = `Position (${lat.toFixed(2)}, ${lon.toFixed(2)})`;
    }
  } catch (e) {
    state.location.name = `Location (${lat.toFixed(2)}, ${lon.toFixed(2)})`;
  }
}

// ==========================================================================
// UI RENDERING ENGINE
// ==========================================================================
function renderUI() {
  const data = state.weatherData;
  if (!data) return;

  const current = data.current;
  const hourly = data.hourly;
  const daily = data.daily;
  const wCode = current.weather_code;
  const isDay = current.is_day;
  const codeInfo = WEATHER_CODES[wCode] || { label: "Unknown Conditions", theme: "cloudy", icon: "question" };

  // 1. Update background body theme class
  let themeClass = `weather-${codeInfo.theme}`;
  if (codeInfo.theme === 'sunny' && !isDay) {
    themeClass = 'weather-night';
  }
  document.body.className = '';
  document.body.classList.add(themeClass);

  // 2. Main Hero Panel
  const currentTemp = current.temperature_2m;
  document.getElementById('current-temp').innerText = formatTemp(currentTemp);
  document.getElementById('location-display').innerText = state.location.name;
  document.getElementById('weather-description').innerText = codeInfo.label;
  
  // Icon injection
  const iconContainer = document.getElementById('current-icon-container');
  iconContainer.innerHTML = getIconSVG(codeInfo.icon, isDay);

  // High / Low for today
  const todayHigh = daily.temperature_2m_max[0];
  const todayLow = daily.temperature_2m_min[0];
  document.getElementById('today-high').innerText = `${formatTemp(todayHigh)}°`;
  document.getElementById('today-low').innerText = `${formatTemp(todayLow)}°`;

  // Local Time
  const timeOptions = { hour: 'numeric', minute: '2-digit', weekday: 'short', month: 'short', day: 'numeric' };
  document.getElementById('current-time-date').innerText = new Date().toLocaleDateString([], timeOptions);

  // 3. Metrics Cards
  // Apparent Temp
  const appTemp = current.apparent_temperature;
  document.getElementById('apparent-temp').innerText = `${formatTemp(appTemp)}°`;
  document.getElementById('apparent-temp-comment').innerText = getApparentTempComment(currentTemp, appTemp);

  // Humidity
  const hum = current.relative_humidity_2m;
  document.getElementById('humidity').innerText = `${hum}%`;
  document.getElementById('humidity-comment').innerText = getHumidityComment(hum);

  // Wind
  const windSpd = current.wind_speed_10m;
  const windDir = current.wind_direction_10m;
  document.getElementById('wind-speed').innerText = `${windSpd.toFixed(1)} km/h`;
  document.getElementById('wind-direction').innerText = `Angle: ${windDir}° (${getWindDirectionLabel(windDir)})`;
  document.getElementById('compass-arrow').style.transform = `rotate(${windDir}deg)`;

  // UV Index
  // Find current hour UV index (matches the current API time)
  const currentHourString = current.time.slice(0, 13) + ":00";
  const hourIdx = hourly.time.findIndex(t => t.startsWith(currentHourString));
  const currentUV = hourIdx !== -1 ? hourly.uv_index[hourIdx] : daily.uv_index_max[0];
  document.getElementById('uv-index').innerText = currentUV.toFixed(1);
  const uvRating = getUVIndexRating(currentUV);
  document.getElementById('uv-comment').innerText = `${uvRating.text} Exposure`;

  // Pressure
  const pressure = current.pressure_msl;
  document.getElementById('pressure').innerText = `${Math.round(pressure)} hPa`;
  document.getElementById('pressure-comment').innerText = getPressureComment(pressure);

  // Sunrise / Sunset
  const sunriseTimeStr = formatISOTime(daily.sunrise[0]);
  const sunsetTimeStr = formatISOTime(daily.sunset[0]);
  document.getElementById('sunrise-time').innerText = sunriseTimeStr;
  document.getElementById('sunset-time').innerText = sunsetTimeStr;

  // 4. Hourly Forecast (Scrollable)
  const hourlyContainer = document.getElementById('hourly-forecast-container');
  hourlyContainer.innerHTML = '';

  // Draw 24 hours starting from the current hour index
  const startHourIdx = hourIdx !== -1 ? hourIdx : 0;
  for (let i = startHourIdx; i < startHourIdx + 24; i++) {
    if (i >= hourly.time.length) break;

    const timeVal = hourly.time[i];
    const tempVal = hourly.temperature_2m[i];
    const precipVal = hourly.precipitation_probability[i];
    const hourCode = hourly.weather_code[i];
    
    // Parse is_day for hourly (approximate using daily sunrise/sunset hours)
    const dateObj = new Date(timeVal);
    const hourNum = dateObj.getHours();
    const sunriseHour = new Date(daily.sunrise[0]).getHours();
    const sunsetHour = new Date(daily.sunset[0]).getHours();
    const hourIsDay = (hourNum >= sunriseHour && hourNum < sunsetHour) ? 1 : 0;

    const hourCodeInfo = WEATHER_CODES[hourCode] || { icon: 'question' };

    const hourCard = document.createElement('div');
    hourCard.className = 'hourly-item';
    
    // Display "Now" for the very first item
    const displayTime = i === startHourIdx ? 'Now' : dateObj.toLocaleTimeString([], { hour: 'numeric', hour12: true });

    hourCard.innerHTML = `
      <span class="hourly-time">${displayTime}</span>
      <div class="hourly-icon">${getIconSVG(hourCodeInfo.icon, hourIsDay)}</div>
      <span class="hourly-temp">${formatTemp(tempVal)}°</span>
      <span class="hourly-rain">${precipVal > 0 ? precipVal + '%' : '&nbsp;'}</span>
    `;
    hourlyContainer.appendChild(hourCard);
  }

  // 5. 7-Day Forecast (Vertical)
  const weeklyContainer = document.getElementById('weekly-forecast-container');
  weeklyContainer.innerHTML = '';

  // Get absolute max and min temperatures for the entire week to size the Apple-style temperature bars
  const weeklyMaxes = daily.temperature_2m_max;
  const weeklyMines = daily.temperature_2m_min;
  const absoluteMax = Math.max(...weeklyMaxes);
  const absoluteMin = Math.min(...weeklyMines);
  const absoluteDiff = absoluteMax - absoluteMin || 1; // avoid division by 0

  for (let d = 0; d < daily.time.length; d++) {
    const dayDate = daily.time[d];
    const dayMax = daily.temperature_2m_max[d];
    const dayMin = daily.temperature_2m_min[d];
    const dayCode = daily.weather_code[d];
    const dayCodeInfo = WEATHER_CODES[dayCode] || { label: "Clouds", icon: "cloudy" };

    // Calculate bar fills
    const leftPercent = ((dayMin - absoluteMin) / absoluteDiff) * 100;
    const widthPercent = ((dayMax - dayMin) / absoluteDiff) * 100;

    const weeklyRow = document.createElement('div');
    weeklyRow.className = 'weekly-row';
    weeklyRow.innerHTML = `
      <div class="weekly-day">${getShortDayOfWeekName(dayDate)}</div>
      <div class="weekly-condition-container">
        <div class="weekly-icon">${getIconSVG(dayCodeInfo.icon, 1)}</div>
        <span class="weekly-desc">${dayCodeInfo.label}</span>
      </div>
      <div class="weekly-temp-range">
        <span class="temp-bar-min">${formatTemp(dayMin)}°</span>
        <div class="temp-bar-track">
          <div class="temp-bar-fill" style="left: ${leftPercent}%; width: ${widthPercent}%;"></div>
        </div>
        <span class="temp-bar-max">${formatTemp(dayMax)}°</span>
      </div>
    `;
    weeklyContainer.appendChild(weeklyRow);
  }
}

// ==========================================================================
// SEARCH & AUTO-SUGGEST
// ==========================================================================
const searchInput = document.getElementById('city-search');
const suggestionsList = document.getElementById('search-suggestions');

searchInput.addEventListener('input', (e) => {
  const query = e.target.value.trim();
  clearTimeout(state.searchDebounceTimer);
  
  if (query.length < 2) {
    suggestionsList.classList.add('hidden');
    return;
  }

  state.searchDebounceTimer = setTimeout(async () => {
    try {
      const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5&language=en&format=json`);
      if (response.ok) {
        const data = await response.json();
        if (data.results && data.results.length > 0) {
          renderSuggestions(data.results);
        } else {
          suggestionsList.classList.add('hidden');
        }
      }
    } catch (err) {
      console.error('Suggestions error:', err);
    }
  }, 350);
});

function renderSuggestions(results) {
  suggestionsList.innerHTML = '';
  suggestionsList.classList.remove('hidden');

  results.forEach(res => {
    const item = document.createElement('div');
    item.className = 'suggestion-item';
    
    const stateStr = res.admin1 ? `, ${res.admin1}` : '';
    const name = `${res.name}${stateStr}`;
    const country = res.country || '';

    item.innerHTML = `
      <span class="suggestion-title">${res.name}</span>
      <span class="suggestion-subtitle">${res.admin1 ? res.admin1 + ', ' : ''}${country}</span>
    `;

    item.addEventListener('click', () => {
      state.location.lat = res.latitude;
      state.location.lon = res.longitude;
      state.location.name = country ? `${name}, ${country}` : name;
      
      // Save to local cache
      localStorage.setItem('cached_location', JSON.stringify(state.location));

      suggestionsList.classList.add('hidden');
      searchInput.value = '';
      fetchWeather(res.latitude, res.longitude);
    });

    suggestionsList.appendChild(item);
  });
}

// Hide dropdown when clicking outside
document.addEventListener('click', (e) => {
  if (!searchInput.contains(e.target) && !suggestionsList.contains(e.target)) {
    suggestionsList.classList.add('hidden');
  }
});

// Search input Enter key trigger
searchInput.addEventListener('keydown', async (e) => {
  if (e.key === 'Enter') {
    const query = searchInput.value.trim();
    if (!query) return;
    
    // Fetch directly using the first auto-suggestion result if available
    try {
      const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1&language=en&format=json`);
      if (response.ok) {
        const data = await response.json();
        if (data.results && data.results.length > 0) {
          const res = data.results[0];
          state.location.lat = res.latitude;
          state.location.lon = res.longitude;
          const stateStr = res.admin1 ? `, ${res.admin1}` : '';
          state.location.name = res.country ? `${res.name}${stateStr}, ${res.country}` : `${res.name}${stateStr}`;
          
          localStorage.setItem('cached_location', JSON.stringify(state.location));
          suggestionsList.classList.add('hidden');
          searchInput.value = '';
          fetchWeather(res.latitude, res.longitude);
        }
      }
    } catch (err) {
      console.error(err);
    }
  }
});

// ==========================================================================
// GEOLOCATION
// ==========================================================================
const locationBtn = document.getElementById('location-btn');
locationBtn.addEventListener('click', () => {
  if (!navigator.geolocation) {
    alert('Geolocation is not supported by your browser');
    return;
  }

  locationBtn.classList.add('pulse');
  navigator.geolocation.getCurrentPosition(
    async (position) => {
      const lat = position.coords.latitude;
      const lon = position.coords.longitude;
      
      state.location.lat = lat;
      state.location.lon = lon;
      
      await reverseGeocode(lat, lon);
      localStorage.setItem('cached_location', JSON.stringify(state.location));
      await fetchWeather(lat, lon);
      locationBtn.classList.remove('pulse');
    },
    (error) => {
      console.error('Geolocation Error:', error);
      alert('Could not retrieve your location. Make sure GPS permissions are enabled.');
      locationBtn.classList.remove('pulse');
    }
  );
});

// ==========================================================================
// UNIT SWITCHER
// ==========================================================================
const btnC = document.getElementById('unit-c');
const btnF = document.getElementById('unit-f');

btnC.addEventListener('click', () => {
  if (state.unit === 'C') return;
  state.unit = 'C';
  btnC.classList.add('active');
  btnF.classList.remove('active');
  renderUI();
});

btnF.addEventListener('click', () => {
  if (state.unit === 'F') return;
  state.unit = 'F';
  btnF.classList.add('active');
  btnC.classList.remove('active');
  renderUI();
});

// ==========================================================================
// INITIALIZER
// ==========================================================================
window.addEventListener('DOMContentLoaded', () => {
  // Load location from cache or default to London
  const cache = localStorage.getItem('cached_location');
  if (cache) {
    try {
      state.location = JSON.parse(cache);
    } catch (e) {
      console.error(e);
    }
  }
  
  fetchWeather(state.location.lat, state.location.lon);
});

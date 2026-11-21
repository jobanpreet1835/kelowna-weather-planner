// COSC 219 M2 prototype — no API key is needed for Open-Meteo.
const searchForm = document.querySelector("#search-form");
const cityInput = document.querySelector("#city-input");
const searchButton = document.querySelector("#search-button");
const statusMessage = document.querySelector("#status");
const forecastList = document.querySelector("#forecast-list");
const favoriteButton = document.querySelector("#favorite-button");
const favoritesList = document.querySelector("#favorites-list");
const unitButtons = document.querySelectorAll("[data-unit]");

// Start with Kelowna, so real API data loads as soon as the page opens.
let currentCity = {
  name: "Kelowna",
  country: "Canada",
  latitude: 49.888,
  longitude: -119.496
};

function readSaved(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value === null ? fallback : JSON.parse(value);
  } catch {
    return fallback;
  }
}

function save(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // The weather app still works even if browser storage is unavailable.
  }
}

let unit = readSaved("weather-unit", "celsius");
if (unit !== "fahrenheit") unit = "celsius";
let favorites = readSaved("weather-favorites", []);
if (!Array.isArray(favorites)) favorites = [];
// Ignore saved entries that are not valid city objects.
favorites = favorites.filter(city =>
  city && typeof city.name === "string" &&
  Number.isFinite(city.latitude) && Number.isFinite(city.longitude)
);
let latestRequest = 0;

function showStatus(message, kind = "") {
  statusMessage.className = kind ? `status ${kind}` : "status";
  statusMessage.textContent = message;
}

// Open-Meteo weather codes are WMO weather interpretation codes.
function weatherDescription(code) {
  if (code === 0) return { icon: "☀️", text: "Clear sky" };
  if (code === 1 || code === 2) return { icon: "🌤️", text: "Partly cloudy" };
  if (code === 3) return { icon: "☁️", text: "Overcast" };
  if ([45, 48].includes(code)) return { icon: "🌫️", text: "Fog" };
  if ([51, 53, 55, 56, 57].includes(code)) return { icon: "🌦️", text: "Drizzle" };
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return { icon: "🌧️", text: "Rain" };
  if ([71, 73, 75, 77, 85, 86].includes(code)) return { icon: "❄️", text: "Snow" };
  if ([95, 96, 99].includes(code)) return { icon: "⛈️", text: "Thunderstorm" };
  return { icon: "🌡️", text: "Weather conditions" };
}

function formatTemperature(value) {
  return value == null ? "--" : `${Math.round(value)}°`;
}

function updateUnitButtons() {
  for (const button of unitButtons) {
    button.setAttribute("aria-pressed", String(button.dataset.unit === unit));
  }
}

async function getJson(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`API error: ${response.status}`);
  const data = await response.json();
  if (data.error) throw new Error(data.reason || "Weather service error");
  return data;
}

function buildWeatherUrl(city) {
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", city.latitude);
  url.searchParams.set("longitude", city.longitude);
  url.searchParams.set("current", "temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m");
  url.searchParams.set("daily", "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max");
  url.searchParams.set("temperature_unit", unit);
  url.searchParams.set("timezone", "auto");
  url.searchParams.set("forecast_days", "7");
  return url;
}

function renderCurrent(city, data) {
  const now = data.current;
  const weather = weatherDescription(now.weather_code);

  document.querySelector("#current-heading").textContent = `${city.name}, ${city.country}`;
  document.querySelector("#updated-at").textContent = `Weather as of ${now.time.replace("T", " ")} (local time)`;
  document.querySelector("#weather-icon").textContent = weather.icon;
  document.querySelector("#temperature").textContent = formatTemperature(now.temperature_2m);
  document.querySelector("#description").textContent = weather.text;
  document.querySelector("#feels-like").textContent = formatTemperature(now.apparent_temperature);
  document.querySelector("#humidity").textContent = `${now.relative_humidity_2m}%`;
  document.querySelector("#wind-speed").textContent = `${Math.round(now.wind_speed_10m)} km/h`;
}

function renderForecast(data) {
  forecastList.replaceChildren();
  const days = data.daily;

  days.time.forEach((date, index) => {
    const weather = weatherDescription(days.weather_code[index]);
    const card = document.createElement("article");
    card.className = "day-card";

    const day = document.createElement("p");
    day.className = "day";
    day.textContent = index === 0
      ? "Today"
      : new Intl.DateTimeFormat("en-CA", { weekday: "short", timeZone: "UTC" })
          .format(new Date(`${date}T12:00:00Z`));

    const icon = document.createElement("span");
    icon.className = "day-icon";
    icon.setAttribute("aria-label", weather.text);
    icon.textContent = weather.icon;

    const temperatures = document.createElement("p");
    temperatures.className = "day-temps";
    temperatures.textContent = `${formatTemperature(days.temperature_2m_max[index])} / ${formatTemperature(days.temperature_2m_min[index])}`;

    const rain = document.createElement("p");
    rain.className = "day-rain";
    const chance = days.precipitation_probability_max[index];
    rain.textContent = `Rain: ${chance == null ? "--" : chance + "%"}`;

    card.append(day, icon, temperatures, rain);
    forecastList.append(card);
  });
}

function isFavorite(city) {
  return favorites.some(favorite => favorite.latitude === city.latitude && favorite.longitude === city.longitude);
}

function renderFavorites() {
  favoriteButton.setAttribute("aria-pressed", String(isFavorite(currentCity)));
  favoriteButton.textContent = isFavorite(currentCity) ? "★ Saved" : "☆ Save city";
  favoritesList.replaceChildren();

  if (favorites.length === 0) {
    const message = document.createElement("p");
    message.className = "muted";
    message.textContent = "No favourite cities yet. Choose ‘Save city’ above.";
    favoritesList.append(message);
    return;
  }

  favorites.forEach(city => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = `${city.name}, ${city.country}`;
    button.addEventListener("click", () => loadWeather(city));
    favoritesList.append(button);
  });
}

async function loadWeather(city) {
  const requestNumber = ++latestRequest;
  showStatus(`Loading live weather for ${city.name}…`);
  searchButton.disabled = true;

  try {
    const data = await getJson(buildWeatherUrl(city));
    if (requestNumber !== latestRequest) return;
    if (!data.current || !data.daily || !Array.isArray(data.daily.time)) {
      throw new Error("Incomplete weather data from the API");
    }
    currentCity = city;
    renderCurrent(city, data);
    renderForecast(data);
    renderFavorites();
    showStatus(`Showing live weather for ${city.name}.`);
  } catch (error) {
    if (requestNumber !== latestRequest) return;
    showStatus(`Could not load the weather. Check your connection and try again. (${error.message})`, "error");
  } finally {
    if (requestNumber === latestRequest) searchButton.disabled = false;
  }
}

// Interactivity 1: type a city name, geocode it, then fetch its weather.
searchForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const name = cityInput.value.trim();
  if (!name) {
    showStatus("Enter a city name to search.", "empty");
    return;
  }

  searchButton.disabled = true;
  showStatus(`Searching for ${name}…`);
  const thisSearch = ++latestRequest;

  try {
    const url = new URL("https://geocoding-api.open-meteo.com/v1/search");
    url.searchParams.set("name", name);
    url.searchParams.set("count", "1");
    url.searchParams.set("language", "en");
    url.searchParams.set("format", "json");
    const data = await getJson(url);
    if (thisSearch !== latestRequest) return;
    if (!data.results || data.results.length === 0) {
      // Empty result: the API worked, but there was no matching city.
      showStatus(`No cities found for “${name}”. Try a different spelling.`, "empty");
      return;
    }
    const place = data.results[0];
    const city = {
      name: place.name,
      country: place.country || "Unknown country",
      latitude: place.latitude,
      longitude: place.longitude
    };
    await loadWeather(city);
  } catch (error) {
    if (thisSearch !== latestRequest) return;
    showStatus(error.message, "error");
  } finally {
    if (thisSearch === latestRequest) searchButton.disabled = false;
  }
});

// Interactivity 2: switch between Celsius and Fahrenheit.
unitButtons.forEach(button => {
  button.addEventListener("click", () => {
    if (unit === button.dataset.unit) return;
    unit = button.dataset.unit;
    save("weather-unit", unit);
    updateUnitButtons();
    loadWeather(currentCity);
  });
});

// Interactivity 3: save/remove favourites using localStorage.
favoriteButton.addEventListener("click", () => {
  if (isFavorite(currentCity)) {
    favorites = favorites.filter(city => !(
      city.latitude === currentCity.latitude && city.longitude === currentCity.longitude
    ));
  } else {
    favorites.push({ ...currentCity });
  }
  save("weather-favorites", favorites);
  renderFavorites();
});

updateUnitButtons();
renderFavorites();
loadWeather(currentCity);

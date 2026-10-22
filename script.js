
const API_KEY = "0f624b15e68d7707abf1d4f498d70452";
const searchForm = document.querySelector("#search-form");
const cityInput = document.querySelector("#city-input");
const statusMessage = document.querySelector("#status");

const weatherIcons = {
  clear: "☀️", clouds: "☁️", rain: "🌧️", drizzle: "🌦️", thunderstorm: "⛈️", snow: "❄️", mist: "🌫️", smoke: "🌫️", haze: "🌫️", dust: "🌫️", fog: "🌫️", sand: "🌫️", ash: "🌫️", squall: "💨", tornado: "🌪️"
};

function iconFor(condition) {
  return weatherIcons[condition?.toLowerCase()] || "🌤️";
}

function showStatus(message, isError = false) {
  statusMessage.textContent = message;
  statusMessage.style.color = isError ? "#ffaaa7" : "#93a1b5";
}

function renderCurrent(data) {
  document.querySelector("#location").textContent = `${data.name}, ${data.sys.country}`;
  document.querySelector("#temperature").textContent = Math.round(data.main.temp);
  document.querySelector("#condition").textContent = data.weather[0].description.replace(/^./, c => c.toUpperCase());
  document.querySelector("#weather-art").textContent = iconFor(data.weather[0].main);
  document.querySelector("#feels-like").textContent = Math.round(data.main.feels_like);
  document.querySelector("#humidity").textContent = data.main.humidity;
  document.querySelector("#wind").textContent = Math.round(data.wind.speed * 3.6);
  document.querySelector("#today-label").textContent = new Intl.DateTimeFormat(undefined, { weekday: "long" }).format(new Date()).toUpperCase();
}

function renderForecast(data) {

  const byDay = new Map();
  for (const item of data.list) {
    const date = item.dt_txt.split(" ")[0];
    if (!byDay.has(date)) byDay.set(date, []);
    byDay.get(date).push(item);
  }
  const days = [...byDay.entries()].slice(0, 5);
  document.querySelector("#forecast-list").innerHTML = days.map(([date, readings]) => {
    const noon = readings.reduce((best, item) => Math.abs(Number(item.dt_txt.slice(11, 13)) - 12) < Math.abs(Number(best.dt_txt.slice(11, 13)) - 12) ? item : best);
    const low = Math.min(...readings.map(item => item.main.temp_min));
    const day = new Intl.DateTimeFormat(undefined, { weekday: "short" }).format(new Date(`${date}T12:00:00`));
    const label = noon.weather[0].description.replace(/^./, c => c.toUpperCase());
    return `<div class="forecast-row"><span class="forecast-day">${day}</span><span class="forecast-icon">${iconFor(noon.weather[0].main)}</span><span class="forecast-condition">${label}</span><span class="forecast-temp">${Math.round(noon.main.temp)}° <span>/ ${Math.round(low)}°</span></span></div>`;
  }).join("");
}

async function getWeather(city) {
  if (!API_KEY || API_KEY === "YOUR_OPENWEATHERMAP_API_KEY") {
    showStatus("Add your OpenWeatherMap API key in script.js to enable live weather.", true);
    return;
  }
  showStatus(`Finding the latest weather for ${city}…`);
  try {
    const query = encodeURIComponent(city.trim());
    const [currentResponse, forecastResponse] = await Promise.all([
      fetch(`https://api.openweathermap.org/data/2.5/weather?q=${query}&appid=${API_KEY}&units=metric`),
      fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${query}&appid=${API_KEY}&units=metric`)
    ]);
    if (currentResponse.status === 404 || forecastResponse.status === 404) throw new Error("We couldn't find that city. Check the spelling and try again.");
    if (!currentResponse.ok || !forecastResponse.ok) throw new Error("Weather data could not be loaded. Check your API key and try again.");
    const [current, forecast] = await Promise.all([currentResponse.json(), forecastResponse.json()]);
    renderCurrent(current);
    renderForecast(forecast);
    showStatus(`Weather updated for ${current.name}.`);
  } catch (error) {
    showStatus(error.message || "Something went wrong. Please try again.", true);
  }
}

searchForm.addEventListener("submit", event => {
  event.preventDefault();
  const city = cityInput.value.trim();
  if (city) getWeather(city);
});

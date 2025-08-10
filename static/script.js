const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');

const loginErrorMsg = document.getElementById('login-error-msg');
const registerErrorMsg = document.getElementById('register-error-msg');

const dashboard = document.getElementById('dashboard');
const welcomeMsg = document.getElementById('welcome-msg');
const logoutBtn = document.getElementById('logout-btn');

const showRegisterBtn = document.getElementById('show-register-btn');
const showLoginBtn = document.getElementById('show-login-btn');

const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');

const API_BASE_URL = 'http://localhost:8000';

// Alternar para formulário de registro
showRegisterBtn.addEventListener('click', () => {
  loginForm.classList.remove('active-form');
  loginForm.classList.add('hidden-form');
  registerForm.classList.remove('hidden-form');
  registerForm.classList.add('active-form');
  loginErrorMsg.textContent = '';
  registerErrorMsg.textContent = '';
});

// Alternar para formulário de login
showLoginBtn.addEventListener('click', () => {
  registerForm.classList.remove('active-form');
  registerForm.classList.add('hidden-form');
  loginForm.classList.remove('hidden-form');
  loginForm.classList.add('active-form');
  loginErrorMsg.textContent = '';
  registerErrorMsg.textContent = '';
});

function saveToken(token) {
  localStorage.setItem('access_token', token);
}

function getToken() {
  return localStorage.getItem('access_token');
}

function clearToken() {
  localStorage.removeItem('access_token');
}

function isLoggedIn() {
  return !!getToken();
}

async function fetchMarketData(query = "finance") {
  const token = getToken();
  try {
    const url = new URL(`${API_BASE_URL}/market-data`);
    url.searchParams.append("q", query);

    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${token}` },
    });

    if (!response.ok) throw new Error('Falha ao carregar dados do mercado');
    const data = await response.json();
    renderMarketData(data);

  } catch (error) {
    alert(error.message);
  }
}

searchBtn.addEventListener('click', () => {
  const query = searchInput.value.trim();
  if (!query) {
    alert("Digite uma palavra-chave para pesquisa.");
    return;
  }
  fetchMarketData(query);
});

async function showDashboard(username) {
  loginForm.classList.remove('active-form');
  loginForm.classList.add('hidden-form');
  registerForm.classList.remove('active-form');
  registerForm.classList.add('hidden-form');

  dashboard.classList.add('active');
  welcomeMsg.textContent = `Bem-vindo, ${username}!`;

  fetchMarketData();
  fetchWeather();
}

function renderMarketData(data) {
  const newsList = document.getElementById('news-list');
  newsList.innerHTML = '';

  if (!data.data || data.data.length === 0) {
    newsList.innerHTML = `<p>Nenhuma notícia disponível.</p>`;
    return;
  }

  data.data.slice(0, 6).forEach(item => {
    const li = document.createElement('li');
    const title = document.createElement('strong');
    title.textContent = item.title;
    const source = document.createElement('p');
    source.textContent = `Fonte: ${item.source?.name || "Desconhecida"}`;
    const url = document.createElement('a');
    url.href = item.url;
    url.target = '_blank';
    url.textContent = 'Leia mais';

    li.append(title, source, url);
    newsList.appendChild(li);
  });
}

async function fetchWeather() {
  try {
    if (!navigator.geolocation) throw new Error('Geolocalização não suportada');

    const position = await new Promise((res, rej) =>
      navigator.geolocation.getCurrentPosition(res, rej)
    );

    const lat = position.coords.latitude;
    const lon = position.coords.longitude;
    const token = getToken();
    const url = new URL(`${API_BASE_URL}/weather`);
    url.searchParams.append("lat", lat);
    url.searchParams.append("lon", lon);

    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${token}` },
    });

    if (!response.ok) throw new Error('Falha ao obter dados do clima');
    const data = await response.json();
    updateWeather(data);

  } catch (error) {
    updateWeather(null, error.message.includes('denied') ? "Sem acesso à localização" : "Erro ao obter clima");
  }
}

function updateWeather(data, errorMsg) {
  const weatherDiv = document.getElementById('weather');
  if (errorMsg || !data?.current) {
    weatherDiv.querySelector('.temp').textContent = '--';
    weatherDiv.querySelector('.condition').textContent = errorMsg || 'Dados indisponíveis';
    weatherDiv.querySelector('.location').textContent = '';
    return;
  }
  weatherDiv.querySelector('.temp').textContent = `${data.current.temp_c}°C`;
  weatherDiv.querySelector('.condition').textContent = data.current.condition.text;
  weatherDiv.querySelector('.location').textContent = `${data.location.name}, ${data.location.region}`;
}

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  loginErrorMsg.textContent = '';
  const username = document.getElementById('login-username').value.trim();
  const password = document.getElementById('login-password').value.trim();

  try {
    const response = await fetch(`${API_BASE_URL}/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ username, password }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Falha no login');
    }

    const data = await response.json();
    saveToken(data.access_token);
    showDashboard(username);

  } catch (error) {
    loginErrorMsg.textContent = error.message;
  }
});

registerForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  registerErrorMsg.textContent = '';
  const username = document.getElementById('register-username').value.trim();
  const password = document.getElementById('register-password').value.trim();

  try {
    const response = await fetch(`${API_BASE_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Falha no registro');
    }

    alert('Registro realizado com sucesso! Faça login agora.');
    showLoginBtn.click(); // volta para o login

  } catch (error) {
    registerErrorMsg.textContent = error.message;
  }
});

logoutBtn.addEventListener('click', () => {
  clearToken();
  dashboard.classList.remove('active');
  loginForm.classList.remove('hidden-form');
  loginForm.classList.add('active-form');
  registerForm.classList.remove('active-form');
  registerForm.classList.add('hidden-form');
  loginErrorMsg.textContent = '';
  registerErrorMsg.textContent = '';
});

window.addEventListener('DOMContentLoaded', () => {
  if (isLoggedIn()) {
    showDashboard("Usuário");
  } else {
    loginForm.classList.add('active-form');
    registerForm.classList.add('hidden-form');
  }
});

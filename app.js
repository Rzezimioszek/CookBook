const days = ["Poniedziałek", "Wtorek", "Środa", "Czwartek", "Piątek", "Sobota", "Niedziela"];
const selectedRecipe = { title: null };
const mealPlan = {};

const daysContainer = document.getElementById("days");
days.forEach(day => {
  const div = document.createElement("div");
  div.innerHTML = `<strong>${day}:</strong> <span id="slot-${day}">—</span>`;
  div.onclick = () => {
    if (selectedRecipe.title) {
  const repeat = confirm("Czy chcesz zaplanować ten posiłek na 2 dni?");
  const currentIndex = days.indexOf(day);
  mealPlan[day] = { title: selectedRecipe.title, days: 1 };
  if (repeat && currentIndex < days.length - 1) {
    const nextDay = days[currentIndex + 1];
    mealPlan[nextDay] = { title: selectedRecipe.title, days: 1 };
  }
  updatePlannerUI();
}
 else {
      alert("Najpierw wybierz przepis.");
    }
  };
  daysContainer.appendChild(div);
});

function updatePlannerUI() {
  days.forEach(day => {
    const slot = document.getElementById("slot-" + day);
    if (mealPlan[day]) {
      slot.textContent = `${mealPlan[day].title} (${mealPlan[day].days} dni)`;
    } else {
      slot.textContent = "—";
    }
  });
}

document.getElementById("exportBtn").onclick = () => {
  const baseDate = new Date(); // dziś
  const dayMap = {
    "Poniedziałek": 1, "Wtorek": 2, "Środa": 3,
    "Czwartek": 4, "Piątek": 5, "Sobota": 6, "Niedziela": 0
  };

  for (const [day, info] of Object.entries(mealPlan)) {
    const offset = (dayMap[day] - baseDate.getDay() + 7) % 7;
    const eventDate = new Date(baseDate);
    eventDate.setDate(baseDate.getDate() + offset);

    for (let i = 0; i < info.days; i++) {
      const start = new Date(eventDate);
      start.setDate(start.getDate() + i);
      const end = new Date(start);
      end.setHours(end.getHours() + 1); // godzina

      const title = encodeURIComponent(info.title);
      const startStr = start.toISOString().replace(/-|:|\.\d\d\d/g, "").slice(0, 15);
      const endStr = end.toISOString().replace(/-|:|\.\d\d\d/g, "").slice(0, 15);

      const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startStr}/${endStr}&details=Zaplanowany posiłek`;

      window.open(url, "_blank");
    }
  }
};

function toggleDrawer(type) {
  const recent = document.getElementById('drawerRecent');
  const favorites = document.getElementById('drawerFavorites');

  if (type === 'recent') {
    favorites.classList.remove('open');
    recent.classList.toggle('open');
  } else {
    recent.classList.remove('open');
    favorites.classList.toggle('open');
  }

  displayStoredRecipes(); // aktualizuj zawartość
}

function displayStoredRecipes() {
  const recent = JSON.parse(localStorage.getItem('recentRecipes') || '[]');
  const favorites = JSON.parse(localStorage.getItem('favoriteRecipes') || '[]');

  const recentContainer = document.getElementById('recentRecipes');
  const favContainer = document.getElementById('favoriteRecipes');

  recentContainer.innerHTML = '';
  for (const recipe of recent) {

    const el = document.createElement('a');
    el.href = `?category=${encodeURIComponent(recipe.category)}&title=${encodeURIComponent(recipe.title)}`;
    el.textContent = `${recipe.title}\n`;
    const di = document.createElement('div');
    di.appendChild(el)
    recentContainer.appendChild(di);
  }

  favContainer.innerHTML = '';
  for (const recipe of favorites) {
    const el = document.createElement('a');
    el.href = `?category=${encodeURIComponent(recipe.category)}&title=${encodeURIComponent(recipe.title)}`;
    el.textContent = `${recipe.title}\n`;
    const di = document.createElement('div');
    di.appendChild(el)
    favContainer.appendChild(di);
  }
}


function addToRecentRecipes(recipe) {
  const stored = JSON.parse(localStorage.getItem('recentRecipes') || '[]');
  
  // Usuń jeśli już istnieje
  const filtered = stored.filter(r => r.title !== recipe.title);
  // Dodaj na początek
  filtered.unshift(recipe);
  // Maksymalnie 10
  const updated = filtered.slice(0,10);

  localStorage.setItem('recentRecipes', JSON.stringify(updated));
}

function toggleFavorite(recipe) {
  const favorites = JSON.parse(localStorage.getItem('favoriteRecipes') || '[]');

  /*const exists = favorites.some(r => r.title !== recipe.title);*/
  var exists = favorites.filter(r => r.title !== recipe.title);

  const index = exists.findIndex(r => r.title !== recipe.title);
  if (isRecipeFavorite(recipe.title)) {
    // Usuń jeśli już istnieje
    exists = favorites.filter(r => r.title !== recipe.title);
    alert("Przepis usunięty z ulubionych");
  } else {
    // Dodaj nowy
    exists.unshift(recipe);
    alert("Przepis dodany do ulubionych");
  }

  
  
  /*const updated = exists
    ? favorites.filter(r => r.title !== recipe.title)
    : [...favorites, recipe];
  */
  /*localStorage.setItem('favoriteRecipes', JSON.stringify(updated));*/
  localStorage.setItem('favoriteRecipes', JSON.stringify(exists));
  updateFavoriteIcon(recipe.title);
}

function isRecipeFavorite(title) {
  const favorites = JSON.parse(localStorage.getItem('favoriteRecipes')) || [];
  return favorites.some(r => r.title === title);
}

function updateFavoriteIcon(title) {
  const icon = document.getElementById('addFav');
  const favIcon = document.getElementById('favIcon');
  if (!icon) return;

  if (isRecipeFavorite(title)) {
    // w ulubionych
    favIcon.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6 text-red-500" fill="currentColor" viewBox="0 0 24 24">
        <path fill-rule="evenodd" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 
        8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41 0.81 
        4.5 2.09C13.09 3.81 14.76 3 16.5 3 
        19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 
        11.54L12 21.35z" clip-rule="evenodd"/>
      </svg>
    `;
  } else {
    //icon.textContent = '🤍'; // nie w ulubionych
    favIcon.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1"
              d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 
        8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41 0.81 
        4.5 2.09C13.09 3.81 14.76 3 16.5 3 
        19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 
        11.54L12 21.35z"
              />
      </svg>
    `;
  }
}

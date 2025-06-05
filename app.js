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
/**
 * CookBook - Main Application Logic
 */

// --- State ---
const selectedRecipe = { title: null, category: null, path: null };
let allRecipesData = [];

// --- DOM Elements ---
const recipeList = document.getElementById("recipeList");
const searchInput = document.getElementById("search");
const preview = document.getElementById("preview");
const previewPanel = document.getElementById("previewPanel");
const recipeTitle = document.getElementById("recipeTitle");
const siteTitle = document.getElementById("siteTitle");
const sidePanel = document.getElementById("sidePanel");
const burgerBtn = document.getElementById("burgerBtn");
const favoritesBtn = document.getElementById("favoritesBtn");
const installBtn = document.getElementById("installBtn");
const exportBtn = document.getElementById("exportPdfBtn");
const copyTextBtn = document.getElementById("copyTextBtn");
const copyLinkBtn = document.getElementById("copyLinkBtn");
const addFavBtn = document.getElementById("addFav");
const favIcon = document.getElementById("favIcon");
const suggestedRecipes = document.getElementById("suggestedRecipes");
const drawerRecent = document.getElementById('drawerRecent');
const drawerFavorites = document.getElementById('drawerFavorites');
const recentRecipesContainer = document.getElementById('recentRecipes');
const favoriteRecipesContainer = document.getElementById('favoriteRecipes');

// Dock Tabs
const tabIngredientsBtn = document.getElementById('tabIngredientsBtn');
const tabPreparationBtn = document.getElementById('tabPreparationBtn');
const dockSeparator = document.querySelector('.dock-separator');

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

function initApp() {
    fetchRecipes();
    setupEventListeners();
    setupIntersectionObserver();
}

// --- Fetch & Data Handling ---
function fetchRecipes() {
    fetch("recipes.json")
        .then(res => res.json())
        .then(data => {
            allRecipesData = data;
            renderRecipeList(data);
            handleInitialRoute();
        })
        .catch(err => {
            console.error("Error loading recipes:", err);
            recipeList.innerHTML = `<p style="color:red">Błąd ładowania danych.</p>`;
        });
}

function handleInitialRoute() {
    const urlParams = new URLSearchParams(window.location.search);
    const title = decodeURIComponent(urlParams.get("title") || "");
    const category = decodeURIComponent(urlParams.get("category") || "");

    if (title && category) {
        const cat = allRecipesData.find(c => c.category === category);
        const recipe = cat ? cat.recipes.find(r => r.title === title) : null;
        if (recipe) {
            loadRecipe(recipe.path, recipe.title, cat.category);
            return;
        }
    }
    showSuggestedRecipes(12);
}

// --- Recipe Display ---
function loadRecipe(path, title, category) {
    document.body.classList.add('recipe-active');
    fetch(path)
        .then(res => res.text())
        .then(md => {
            selectedRecipe.title = title;
            selectedRecipe.category = category;
            selectedRecipe.path = path;

            recipeTitle.textContent = title;
            preview.innerHTML = formatRecipeContent(marked.parse(md));
            
            // UI state
            suggestedRecipes.style.display = 'none';
            previewPanel.style.display = 'block';
            [exportBtn, copyTextBtn, copyLinkBtn, addFavBtn].forEach(b => b.style.display = 'flex');
            
            showDockTabs(true);
            activateTab('ingredients');

            // Close mobile panels
            sidePanel.classList.remove("open");
            drawerFavorites.classList.remove("open");
            drawerRecent.classList.remove("open");

            updateUrl(category, title);
            addToRecentRecipes(selectedRecipe);
            updateFavoriteIcon(title);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
}

function formatRecipeContent(html) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const nodes = Array.from(doc.body.childNodes);

    let imageHtml = '', ingredientsContent = '', preparationContent = '';
    let currentSection = 0, hasIngredients = false;

    const ingredientsRegex = /składniki|skladniki/i;
    const preparationRegex = /przygotowanie|wykonanie|instrukcja/i;

    nodes.forEach(node => {
        if (node.nodeName === 'P' && node.querySelector('img')) {
            imageHtml += node.outerHTML; return;
        }
        if (/^H[1-6]$/.test(node.nodeName)) {
            const text = node.textContent.trim();
            if (ingredientsRegex.test(text)) { currentSection = 1; hasIngredients = true; }
            else if (preparationRegex.test(text)) { currentSection = 2; }
        }
        const outer = node.nodeType === Node.ELEMENT_NODE ? node.outerHTML : node.textContent;
        if (currentSection === 1) ingredientsContent += outer;
        else if (currentSection === 2) preparationContent += outer;
        else {
            if (node.nodeName === 'UL' && !hasIngredients) { ingredientsContent += outer; currentSection = 1; }
            else preparationContent += outer;
        }
    });

    return `${imageHtml}<div class="recipe-split-layout">
        <div id="tab-ingredients" class="section-ingredients">${ingredientsContent || '<p>Brak składników.</p>'}</div>
        <div id="tab-preparation" class="section-preparation">${preparationContent || '<p>Brak opisu.</p>'}</div>
    </div>`;
}

// --- Dock Tabs ---
function showDockTabs(show) {
    const display = show ? 'flex' : 'none';
    if(tabIngredientsBtn) tabIngredientsBtn.style.display = display;
    if(tabPreparationBtn) tabPreparationBtn.style.display = display;
    if(dockSeparator) dockSeparator.style.display = show ? 'block' : 'none';
}

function activateTab(target) {
    const sI = document.getElementById('tab-ingredients');
    const sP = document.getElementById('tab-preparation');
    if(!sI || !sP) return;

    tabIngredientsBtn.classList.toggle('active', target === 'ingredients');
    tabPreparationBtn.classList.toggle('active', target === 'preparation');

    if (window.innerWidth < 1100) {
        sI.style.display = target === 'ingredients' ? 'block' : 'none';
        sP.style.display = target === 'preparation' ? 'block' : 'none';
    } else {
        sI.style.display = sP.style.display = 'block';
    }
}

// --- Lists & Suggested ---
function renderRecipeList(data) {
    recipeList.innerHTML = "";
    data.forEach(cat => {
        const det = document.createElement("details");
        const sum = document.createElement("summary");
        sum.textContent = cat.category;
        det.appendChild(sum);
        const ul = document.createElement("ul");
        cat.recipes.forEach(r => {
            const li = document.createElement("li");
            const a = document.createElement("a");
            a.href = "#"; a.textContent = r.title;
            a.onclick = (e) => {
                e.preventDefault();
                loadRecipe(r.path, r.title, cat.category);
            };
            li.appendChild(a); ul.appendChild(li);
        });
        det.appendChild(ul); recipeList.appendChild(det);
    });
}

async function showSuggestedRecipes(count = 12) {
    document.body.classList.remove('recipe-active');
    suggestedRecipes.style.display = 'grid';
    previewPanel.style.display = 'none';
    showDockTabs(false);

    const recent = JSON.parse(localStorage.getItem('recentRecipes') || '[]');
    if (recent.length === 0) {
        suggestedRecipes.innerHTML = '<p style="grid-column:1/-1;text-align:center">Wybierz przepis z listy po lewej.</p>';
        return;
    }

    suggestedRecipes.innerHTML = '';
    for (const r of recent.slice(0, count)) {
        const card = document.createElement('div');
        card.className = 'recipe-card';
        let img = 'dish.jpeg';
        try {
            const res = await fetch(r.path);
            const text = await res.text();
            const match = text.match(/!\[.*?\]\((.*?)\)/);
            if (match) img = match[1];
        } catch(e){}

        card.innerHTML = `<a href="?category=${encodeURIComponent(r.category)}&title=${encodeURIComponent(r.title)}">
            <div class="recipe-image" style="background-image:url('${img}')"><h3 class="recipe-title">${r.title}</h3></div>
        </a>`;
        card.querySelector('a').onclick = (e) => {
            e.preventDefault(); loadRecipe(r.path, r.title, r.category);
        };
        suggestedRecipes.appendChild(card);
    }
}

// --- State Management ---
function addToRecentRecipes(recipe) {
    const stored = JSON.parse(localStorage.getItem('recentRecipes') || '[]');
    const filtered = stored.filter(r => r.title !== recipe.title);
    filtered.unshift({...recipe});
    localStorage.setItem('recentRecipes', JSON.stringify(filtered.slice(0, 20)));
}

function toggleFavorite(recipe) {
    if (!recipe.title) return;
    let favs = JSON.parse(localStorage.getItem('favoriteRecipes') || '[]');
    if (favs.some(r => r.title === recipe.title)) {
        favs = favs.filter(r => r.title !== recipe.title);
    } else {
        favs.unshift({...recipe});
    }
    localStorage.setItem('favoriteRecipes', JSON.stringify(favs));
    updateFavoriteIcon(recipe.title);
    displayStoredRecipes();
}

function updateFavoriteIcon(title) {
    const favs = JSON.parse(localStorage.getItem('favoriteRecipes') || '[]');
    const isFav = favs.some(r => r.title === title);
    if (favIcon) {
        favIcon.innerHTML = isFav 
            ? `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="#ef4444" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41 0.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>`
            : `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg>`;
    }
}

function displayStoredRecipes() {
    const recent = JSON.parse(localStorage.getItem('recentRecipes') || '[]');
    const favs = JSON.parse(localStorage.getItem('favoriteRecipes') || '[]');

    recentRecipesContainer.innerHTML = recent.map(r => `<div><a href="#" onclick="event.preventDefault(); loadRecipe('${r.path}','${r.title}','${r.category}')">${r.title}</a></div>`).join('');
    favoriteRecipesContainer.innerHTML = favs.map(r => `<div><a href="#" onclick="event.preventDefault(); loadRecipe('${r.path}','${r.title}','${r.category}')">${r.title}</a></div>`).join('');
}

function toggleDrawer(type) {
    if (type === 'favorites') {
        drawerRecent.classList.remove('open');
        drawerFavorites.classList.toggle('open');
    } else {
        drawerFavorites.classList.remove('open');
        drawerRecent.classList.toggle('open');
    }
    displayStoredRecipes();
}

function setupEventListeners() {
    searchInput.oninput = () => {
        const term = searchInput.value.toLowerCase();
        const filtered = allRecipesData.map(c => ({
            category: c.category,
            recipes: c.recipes.filter(r => r.title.toLowerCase().includes(term))
        })).filter(c => c.recipes.length > 0);
        renderRecipeList(filtered);
    };

    burgerBtn.onclick = () => {
        sidePanel.classList.toggle("open");
        drawerFavorites.classList.remove("open");
    };

    favoritesBtn.onclick = () => toggleDrawer('favorites');
    tabIngredientsBtn.onclick = () => activateTab('ingredients');
    tabPreparationBtn.onclick = () => activateTab('preparation');
    exportBtn.onclick = () => window.print();
    addFavBtn.onclick = () => toggleFavorite(selectedRecipe);
    
    copyTextBtn.onclick = () => {
        navigator.clipboard.writeText(preview.innerText).then(() => alert("Skopiowano tekst."));
    };
    copyLinkBtn.onclick = () => {
        navigator.clipboard.writeText(window.location.href).then(() => alert("Skopiowano link."));
    };
}

function updateUrl(category, title) {
    const url = new URL(window.location);
    url.searchParams.set("category", category);
    url.searchParams.set("title", title);
    history.pushState(null, "", url);
}

function setupIntersectionObserver() {
    const obs = new IntersectionObserver(entries => {
        entries.forEach(e => {
            siteTitle.textContent = e.isIntersecting ? "CookBook" : (recipeTitle.textContent || "CookBook");
        });
    }, { threshold: 0 });
    if (recipeTitle) obs.observe(recipeTitle);
}

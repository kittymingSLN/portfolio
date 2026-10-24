console.log("IT'S ALIVE!");

function $$(selector, context = document) {
  return Array.from(context.querySelectorAll(selector));
}

// Step 3.1: list of pages in the nav
let pages = [
  { url: "", title: "Home" },
  { url: "projects/", title: "Projects" },
  { url: "resume/", title: "Resume" },
  { url: "contact/", title: "Contact" },
  { url: "https://github.com/kittymingSLN", title: "GitHub" },
];

// Where the site lives: "/" on Live Server, "/portfolio/" on GitHub Pages
const BASE_PATH =
  location.hostname === "localhost" || location.hostname === "127.0.0.1"
    ? "/"
    : "/portfolio/";

// Make an empty <nav> and put it at the top of the page
let nav = document.createElement("nav");
document.body.prepend(nav);

// Add one link per page
for (let p of pages) {
  let url = p.url;
  let title = p.title;

  // Internal links get the base path in front
  url = !url.startsWith("http") ? BASE_PATH + url : url;

  // Step 3.2: build the link
  let a = document.createElement("a");
  a.href = url;
  a.textContent = title;

  // Highlight the page we're on
  if (a.host === location.host && a.pathname === location.pathname) {
    a.classList.add("current");
  }

  // Open outside sites (GitHub) in a new tab
  if (a.host !== location.host) {
    a.target = "_blank";
  }

  nav.append(a);
}

// Step 4.2: add the theme dropdown to the page
document.body.insertAdjacentHTML(
  "afterbegin",
  `
  <label class="color-scheme">
    Theme:
    <select>
      <option value="light dark">Automatic</option>
      <option value="light">Light</option>
      <option value="dark">Dark</option>
    </select>
  </label>`,
);

let select = document.querySelector(".color-scheme select");

// Change the color scheme and keep the dropdown in sync
function setColorScheme(colorScheme) {
  document.documentElement.style.setProperty("color-scheme", colorScheme);
  select.value = colorScheme;
}

// Step 4.5: on page load, use the saved choice if there is one
if ("colorScheme" in localStorage) {
  setColorScheme(localStorage.colorScheme);
}

// Step 4.4: when the user picks an option, apply it and save it
select.addEventListener("input", function (event) {
  setColorScheme(event.target.value);
  localStorage.colorScheme = event.target.value;
});


// Step 1.2: load a JSON file and return its data
export async function fetchJSON(url) {
  try {
    // Fetch the JSON file from the given URL
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to fetch projects: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching or parsing JSON data:', error);
  }
}

// Step 1.4: build one <article> per project inside a container
export function renderProjects(projects, containerElement, headingLevel = 'h2') {
  // Stop if the container doesn't exist on this page
  if (!containerElement) return;

  // Clear out anything already in the container
  containerElement.innerHTML = '';

  for (let project of projects) {
    const article = document.createElement('article');
    article.innerHTML = `
      <${headingLevel}>${project.title}</${headingLevel}>
      <img src="${project.image}" alt="${project.title}">
      <p>${project.description}</p>
    `;
    containerElement.appendChild(article);
  }
}
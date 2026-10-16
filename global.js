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
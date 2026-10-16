console.log("IT'S ALIVE!");

function $$(selector, context = document) {
  return Array.from(context.querySelectorAll(selector));
}


// Step 2.1: get all the nav links
let navLinks = $$("nav a");

// Step 2.2: find the link that points to the page we're on
let currentLink = navLinks.find(
  (a) => a.host === location.host && a.pathname === location.pathname,
);

// Step 2.3: give that link the "current" class
currentLink?.classList.add("current");
import { fetchJSON, renderProjects } from '../global.js';

// Load the project data
const projects = await fetchJSON('../lib/projects.json');

// Find the container on the page
const projectsContainer = document.querySelector('.projects');

// Show the projects
renderProjects(projects, projectsContainer, 'h2');

// Step 1.6: show how many projects there are
const title = document.querySelector('.projects-title');
title.textContent = `${projects.length} Projects`;
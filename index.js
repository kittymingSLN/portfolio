import { fetchJSON, renderProjects } from './global.js';

// Load all projects, then keep only the first 3
const projects = await fetchJSON('./lib/projects.json');
const latestProjects = projects.slice(0, 3);

// Find the container on the homepage
const projectsContainer = document.querySelector('.projects');

// Show the 3 projects
renderProjects(latestProjects, projectsContainer, 'h2');
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';
import { fetchJSON, renderProjects } from '../global.js';

// Load the project data
const projects = await fetchJSON('../lib/projects.json');

// Find the container on the page
const projectsContainer = document.querySelector('.projects');

// Show the projects
renderProjects(projects, projectsContainer, 'h2');

// Show how many projects there are
const title = document.querySelector('.projects-title');
title.textContent = `${projects.length} Projects`;

// ---------- Lab 5: pie chart ----------

// Step 3: count how many projects there are in each year
let rolledData = d3.rollups(
  projects,
  (v) => v.length,
  (d) => d.year,
);

// Turn [['2026', 3], ...] into [{ value: 3, label: '2026' }, ...]
let data = rolledData.map(([year, count]) => {
  return { value: count, label: year };
});

// Step 1: tools that turn data into pie slices
let arcGenerator = d3.arc().innerRadius(0).outerRadius(50);
let sliceGenerator = d3.pie().value((d) => d.value);
let arcData = sliceGenerator(data);
let arcs = arcData.map((d) => arcGenerator(d));

// One color per slice
let colors = d3.scaleOrdinal(d3.schemeTableau10);

// Draw one <path> per slice
let svg = d3.select('#projects-pie-plot');
arcs.forEach((arc, idx) => {
  svg.append('path').attr('d', arc).attr('fill', colors(idx));
});

// Step 2: build the legend, one <li> per slice
let legend = d3.select('.legend');
data.forEach((d, idx) => {
  legend
    .append('li')
    .attr('style', `--color:${colors(idx)}`)
    .attr('class', 'legend-item')
    .html(`<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`);
});
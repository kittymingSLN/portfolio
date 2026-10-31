import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';
import { fetchJSON, renderProjects } from '../global.js';

// Load the project data
const projects = await fetchJSON('../lib/projects.json');

// Find the container on the page
const projectsContainer = document.querySelector('.projects');

// Show how many projects there are
const title = document.querySelector('.projects-title');
title.textContent = `${projects.length} Projects`;

// ---------- Lab 5 ----------

// One color per year (same year = same color, even after filtering)
let colors = d3.scaleOrdinal(d3.schemeTableau10);

// The two filters, remembered in one place
let query = '';           // what's typed in the search bar
let selectedYear = null;  // the clicked pie slice (null = none)

// Keep only projects that match the search text
function searchProjects() {
  return projects.filter((project) => {
    let values = Object.values(project).join('\n').toLowerCase();
    return values.includes(query.toLowerCase());
  });
}

// Apply BOTH filters, then redraw the pie and the cards
function updatePage() {
  // 1. Search filter: the pie shows these projects
  let searched = searchProjects();
  renderPieChart(searched);

  // 2. Year filter on top: the cards show these projects
  let visible = selectedYear
    ? searched.filter((p) => p.year === selectedYear)
    : searched;
  renderProjects(visible, projectsContainer, 'h2');
}

// Click a slice or legend row: select it, or deselect if it was already selected
function toggleYear(year) {
  selectedYear = selectedYear === year ? null : year;
  updatePage();
}

// Draw the pie chart + legend for whatever projects we give it
function renderPieChart(projectsGiven) {
  // Count how many projects there are in each year
  let rolledData = d3.rollups(
    projectsGiven,
    (v) => v.length,
    (d) => d.year,
  );

  // Turn [['2026', 3], ...] into [{ value: 3, label: '2026' }, ...]
  let data = rolledData.map(([year, count]) => {
    return { value: count, label: year };
  });

  // Tools that turn data into pie slices
  let arcGenerator = d3.arc().innerRadius(0).outerRadius(50);
  let sliceGenerator = d3.pie().value((d) => d.value);
  let arcData = sliceGenerator(data);
  let arcs = arcData.map((d) => arcGenerator(d));

  // Clear the old pie and legend before drawing new ones
  let svg = d3.select('#projects-pie-plot');
  svg.selectAll('path').remove();
  let legend = d3.select('.legend');
  legend.selectAll('li').remove();

  // Draw one clickable <path> per slice
  arcs.forEach((arc, i) => {
    let year = data[i].label;
    svg
      .append('path')
      .attr('d', arc)
      .attr('fill', colors(year))
      .attr('class', year === selectedYear ? 'selected' : '')
      .on('click', () => toggleYear(year));
  });

  // Build one clickable legend row per slice
  data.forEach((d) => {
    legend
      .append('li')
      .attr('style', `--color:${colors(d.label)}`)
      .attr('class', d.label === selectedYear ? 'legend-item selected' : 'legend-item')
      .html(`<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`)
      .on('click', () => toggleYear(d.label));
  });
}

// Search: update the text, then apply both filters
let searchInput = document.querySelector('.searchBar');
searchInput.addEventListener('input', (event) => {
  query = event.target.value;
  updatePage();
});

// Draw everything once when the page loads
updatePage();
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

// One color per year (same year = same color, even after filtering)
let colors = d3.scaleOrdinal(d3.schemeTableau10);

// Step 5.2: which slice is selected (-1 means none)
let selectedIndex = -1;

// Step 4.4: draw the pie chart + legend for whatever projects we give it
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

  // Draw one <path> per slice, and make each one clickable
  arcs.forEach((arc, i) => {
    svg
      .append('path')
      .attr('d', arc)
      .attr('fill', colors(data[i].label))
      .on('click', () => {
        // Step 5.2: click once to select, click again to deselect
        selectedIndex = selectedIndex === i ? -1 : i;

        // Highlight the selected slice and its legend row
        svg
          .selectAll('path')
          .attr('class', (_, idx) => (idx === selectedIndex ? 'selected' : ''));
        legend
          .selectAll('li')
          .attr('class', (_, idx) =>
            idx === selectedIndex ? 'legend-item selected' : 'legend-item',
          );

        // Step 5.3: show only that year's projects (or all if none selected)
        if (selectedIndex === -1) {
          renderProjects(projects, projectsContainer, 'h2');
        } else {
          let selectedYear = data[selectedIndex].label;
          let yearProjects = projects.filter((p) => p.year === selectedYear);
          renderProjects(yearProjects, projectsContainer, 'h2');
        }
      });
  });

  // Build the legend, one <li> per slice
  data.forEach((d) => {
    legend
      .append('li')
      .attr('style', `--color:${colors(d.label)}`)
      .attr('class', 'legend-item')
      .html(`<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`);
  });
}

// Draw the pie once when the page loads
renderPieChart(projects);

// ---------- Step 4: search ----------

let query = '';
let searchInput = document.querySelector('.searchBar');

searchInput.addEventListener('input', (event) => {
  // Update the search text
  query = event.target.value;

  // Keep only projects that contain the search text anywhere
  let filteredProjects = projects.filter((project) => {
    let values = Object.values(project).join('\n').toLowerCase();
    return values.includes(query.toLowerCase());
  });

  // Redraw the cards and the pie with only those projects
  renderProjects(filteredProjects, projectsContainer, 'h2');
  renderPieChart(filteredProjects);
});
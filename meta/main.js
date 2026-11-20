import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

// ---------- Step 1.1: load the CSV ----------
async function loadData() {
  const data = await d3.csv('loc.csv', (row) => ({
    ...row,
    line: Number(row.line),
    depth: Number(row.depth),
    length: Number(row.length),
    date: new Date(row.date + 'T00:00' + row.timezone),
    datetime: new Date(row.datetime),
  }));
  return data;
}

// ---------- Step 1.2: one object per commit ----------
function processCommits(data) {
  return d3
    .groups(data, (d) => d.commit)
    .map(([commit, lines]) => {
      let first = lines[0];
      let { author, date, time, timezone, datetime } = first;
      let ret = {
        id: commit,
        url: 'https://github.com/kittymingSLN/portfolio/commit/' + commit,
        author,
        date,
        time,
        timezone,
        datetime,
        hourFrac: datetime.getHours() + datetime.getMinutes() / 60,
        totalLines: lines.length,
      };

      // Keep the lines, but hide them when we print the commit
      Object.defineProperty(ret, 'lines', {
        value: lines,
        configurable: false,
        writable: false,
        enumerable: false,
      });

      return ret;
    })
    .sort((a, b) => a.datetime - b.datetime); // Lab 8: oldest commit first
}

// ---------- Step 1.3: summary stats ----------
function renderCommitInfo(data, commits) {
  // Lab 8: clear the old stats first, so we can call this again with filtered commits
  d3.select('#stats').html('');
  const dl = d3.select('#stats').append('dl').attr('class', 'stats');

  // Total lines of code
  dl.append('dt').html('Total <abbr title="Lines of code">LOC</abbr>');
  dl.append('dd').text(data.length);

  // Total commits
  dl.append('dt').text('Total commits');
  dl.append('dd').text(commits.length);

  // Number of files
  dl.append('dt').text('Files');
  dl.append('dd').text(d3.group(data, (d) => d.file).size);

  // Longest line (in characters)
  dl.append('dt').text('Longest line');
  dl.append('dd').text(d3.max(data, (d) => d.length));

  // Deepest indentation
  dl.append('dt').text('Max depth');
  dl.append('dd').text(d3.max(data, (d) => d.depth));

  // Time of day when most code was written
  const workByPeriod = d3.rollups(
    data,
    (v) => v.length,
    (d) => d.datetime.toLocaleString('en', { dayPeriod: 'short' }),
  );
  const maxPeriod = d3.greatest(workByPeriod, (d) => d[1])?.[0];
  dl.append('dt').text('Most work done');
  dl.append('dd').text(maxPeriod.replace('in the ', ''));
}

// ---------- Step 3: tooltip helpers ----------

// Fill the tooltip with one commit's info
function renderTooltipContent(commit) {
  if (Object.keys(commit).length === 0) return;

  const link = document.getElementById('commit-link');
  link.href = commit.url;
  link.textContent = commit.id;

  document.getElementById('commit-date').textContent =
    commit.datetime?.toLocaleString('en', { dateStyle: 'full' });
  document.getElementById('commit-clock').textContent =
    commit.datetime?.toLocaleString('en', { timeStyle: 'short' });
  document.getElementById('commit-author').textContent = commit.author;
  document.getElementById('commit-lines').textContent = commit.totalLines;
}

// Step 3.3: show or hide the tooltip
function updateTooltipVisibility(isVisible) {
  const tooltip = document.getElementById('commit-tooltip');
  tooltip.hidden = !isVisible;
}

// Step 3.4: move the tooltip next to the mouse
function updateTooltipPosition(event) {
  const tooltip = document.getElementById('commit-tooltip');
  tooltip.style.left = `${event.clientX + 10}px`;
  tooltip.style.top = `${event.clientY + 10}px`;
}

// The scales live out here so the brush code can use them too (Step 5.4)
let xScale;
let yScale;

// ---------- Step 2: scatterplot ----------
function renderScatterPlot(data, commits) {
  const width = 1000;
  const height = 600;

  const svg = d3
    .select('#chart')
    .append('svg')
    .attr('viewBox', `0 0 ${width} ${height}`)
    .style('overflow', 'visible');

  // Step 2.2: leave room for the axes
  const margin = { top: 10, right: 10, bottom: 30, left: 20 };
  const usableArea = {
    top: margin.top,
    right: width - margin.right,
    bottom: height - margin.bottom,
    left: margin.left,
    width: width - margin.left - margin.right,
    height: height - margin.top - margin.bottom,
  };

  // Step 2.1: scales (date -> x, hour of day -> y)
  xScale = d3
    .scaleTime()
    .domain(d3.extent(commits, (d) => d.datetime))
    .range([usableArea.left, usableArea.right])
    .nice();

  yScale = d3
    .scaleLinear()
    .domain([0, 24])
    .range([usableArea.bottom, usableArea.top]);

  // Step 2.3: faint horizontal grid lines (drawn first, so they sit behind)
  svg
    .append('g')
    .attr('class', 'gridlines')
    .attr('transform', `translate(${usableArea.left}, 0)`)
    .call(d3.axisLeft(yScale).tickFormat('').tickSize(-usableArea.width));

  // Step 4.1 + 4.2: dot size = lines edited (sqrt so the AREA matches)
  const [minLines, maxLines] = d3.extent(commits, (d) => d.totalLines);
  const rScale = d3.scaleSqrt().domain([minLines, maxLines]).range([2, 30]);

  // Step 4.3: draw big dots first so small dots stay on top
  const sortedCommits = d3.sort(commits, (d) => -d.totalLines);

  // The dots, with hover events
  const dots = svg.append('g').attr('class', 'dots');
  dots
    .selectAll('circle')
    .data(sortedCommits, (d) => d.id) // Lab 8 Step 1.3: key = commit id
    .join('circle')
    .attr('cx', (d) => xScale(d.datetime))
    .attr('cy', (d) => yScale(d.hourFrac))
    .attr('r', (d) => rScale(d.totalLines))
    .attr('fill', 'steelblue')
    .style('fill-opacity', 0.7)
    .on('mouseenter', (event, commit) => {
      d3.select(event.currentTarget).style('fill-opacity', 1);
      renderTooltipContent(commit);
      updateTooltipVisibility(true);
      updateTooltipPosition(event);
    })
    .on('mouseleave', (event) => {
      d3.select(event.currentTarget).style('fill-opacity', 0.7);
      updateTooltipVisibility(false);
    });

  // Step 2.2: axes (fewer x labels so they don't overlap)
  const xAxis = d3.axisBottom(xScale).ticks(8);
  const yAxis = d3
    .axisLeft(yScale)
    .tickFormat((d) => String(d % 24).padStart(2, '0') + ':00');

  svg
    .append('g')
    .attr('transform', `translate(0, ${usableArea.bottom})`)
    .attr('class', 'x-axis') // Lab 8 Step 1.2: mark it so we can update it
    .call(xAxis);

  svg
    .append('g')
    .attr('transform', `translate(${usableArea.left}, 0)`)
    .attr('class', 'y-axis') // just for consistency
    .call(yAxis);

  // Step 5.1 + 5.2: brushing, with the dots raised above the brush overlay
  svg.call(d3.brush().on('start brush end', brushed));
  svg.selectAll('.dots, .overlay ~ *').raise();
}

// ---------- Lab 8 Step 1.2: update the existing scatterplot ----------
function updateScatterPlot(data, commits) {
  const width = 1000;
  const height = 600;
  const margin = { top: 10, right: 10, bottom: 30, left: 20 };
  const usableArea = {
    top: margin.top,
    right: width - margin.right,
    bottom: height - margin.bottom,
    left: margin.left,
    width: width - margin.left - margin.right,
    height: height - margin.top - margin.bottom,
  };

  // Use the svg that's already there (don't make a new one)
  const svg = d3.select('#chart').select('svg');

  xScale = xScale.domain(d3.extent(commits, (d) => d.datetime));

  const [minLines, maxLines] = d3.extent(commits, (d) => d.totalLines);
  const rScale = d3.scaleSqrt().domain([minLines, maxLines]).range([2, 30]);

  // Clear out the old x-axis and draw the new one
  const xAxis = d3.axisBottom(xScale).ticks(8);
  const xAxisGroup = svg.select('g.x-axis');
  xAxisGroup.selectAll('*').remove();
  xAxisGroup.call(xAxis);

  const dots = svg.select('g.dots');

  const sortedCommits = d3.sort(commits, (d) => -d.totalLines);
  dots
    .selectAll('circle')
    .data(sortedCommits, (d) => d.id) // Step 1.3: key = commit id
    .join('circle')
    .attr('cx', (d) => xScale(d.datetime))
    .attr('cy', (d) => yScale(d.hourFrac))
    .attr('r', (d) => rScale(d.totalLines))
    .attr('fill', 'steelblue')
    .style('fill-opacity', 0.7)
    .on('mouseenter', (event, commit) => {
      d3.select(event.currentTarget).style('fill-opacity', 1);
      renderTooltipContent(commit);
      updateTooltipVisibility(true);
      updateTooltipPosition(event);
    })
    .on('mouseleave', (event) => {
      d3.select(event.currentTarget).style('fill-opacity', 0.7);
      updateTooltipVisibility(false);
    });
}

// ---------- Lab 8 Step 2: unit visualization (one dot per line) ----------

// Step 2.4: one color per technology (css, js, html)
let colors = d3.scaleOrdinal(d3.schemeTableau10);

function updateFileDisplay(filteredCommits) {
  // Step 2.1: get every line, then group the lines by file
  let lines = filteredCommits.flatMap((d) => d.lines);
  let files = d3
    .groups(lines, (d) => d.file)
    .map(([name, lines]) => {
      return { name, lines };
    })
    // Step 2.3: biggest file first
    .sort((a, b) => b.lines.length - a.lines.length);

  // One <div> per file, each with a <dt> and a <dd>
  let filesContainer = d3
    .select('#files')
    .selectAll('div')
    .data(files, (d) => d.name)
    .join(
      // This code only runs when the div is first created
      (enter) =>
        enter.append('div').call((div) => {
          div.append('dt');
          div.append('dd');
        }),
    );

  // Update the file name + line count
  filesContainer
    .select('dt')
    .html((d) => `<code>${d.name}</code><small>${d.lines.length} lines</small>`);

  // Step 2.2: one dot per line, colored by technology (Step 2.4)
  filesContainer
    .select('dd')
    .selectAll('div')
    .data((d) => d.lines)
    .join('div')
    .attr('class', 'loc')
    .attr('style', (d) => `--color: ${colors(d.type)}`);
}

// ---------- Step 5: brushing ----------

// Step 5.4: is this commit's dot inside the brush box?
function isCommitSelected(selection, commit) {
  if (!selection) return false;
  const [[x0, y0], [x1, y1]] = selection;
  const x = xScale(commit.datetime);
  const y = yScale(commit.hourFrac);
  return x >= x0 && x <= x1 && y >= y0 && y <= y1;
}

// Step 5.5: "N commits selected"
function renderSelectionCount(selection) {
  const selectedCommits = selection
    ? filteredCommits.filter((d) => isCommitSelected(selection, d))
    : [];

  const countElement = document.querySelector('#selection-count');
  countElement.textContent = `${selectedCommits.length || 'No'} commits selected`;

  return selectedCommits;
}

// Step 5.6: lines per language in the selected commits
function renderLanguageBreakdown(selection) {
  const selectedCommits = selection
    ? filteredCommits.filter((d) => isCommitSelected(selection, d))
    : [];
  const container = document.getElementById('language-breakdown');

  if (selectedCommits.length === 0) {
    container.innerHTML = '';
    return;
  }

  const lines = selectedCommits.flatMap((d) => d.lines);

  // Count lines per language (css, js, html)
  const breakdown = d3.rollup(
    lines,
    (v) => v.length,
    (d) => d.type,
  );

  container.innerHTML = '';
  for (const [language, count] of breakdown) {
    const proportion = count / lines.length;
    const formatted = d3.format('.1~%')(proportion);
    container.innerHTML += `
      <dt>${language}</dt>
      <dd>${count} lines (${formatted})</dd>
    `;
  }
}

// Runs every time the brush box moves
function brushed(event) {
  const selection = event.selection;
  d3.selectAll('circle').classed('selected', (d) =>
    isCommitSelected(selection, d),
  );
  renderSelectionCount(selection);
  renderLanguageBreakdown(selection);
}

// ---------- Run everything ----------
let data = await loadData();
let commits = processCommits(data);

renderCommitInfo(data, commits);
renderScatterPlot(data, commits);

// ---------- Lab 8 Step 1.1: time slider ----------
let commitProgress = 100;

let timeScale = d3
  .scaleTime()
  .domain([
    d3.min(commits, (d) => d.datetime),
    d3.max(commits, (d) => d.datetime),
  ])
  .range([0, 100]);

let commitMaxTime = timeScale.invert(commitProgress);

// Step 1.2: will get updated as the user changes the slider
let filteredCommits = commits;

const slider = document.getElementById('commit-progress');
const selectedTime = document.getElementById('commit-time');

function onTimeSliderChange() {
  // 1. slider value -> commitProgress
  commitProgress = Number(slider.value);

  // 2. commitProgress -> date
  commitMaxTime = timeScale.invert(commitProgress);

  // 3. show the date
  selectedTime.textContent = commitMaxTime.toLocaleString('en', {
    dateStyle: 'long',
    timeStyle: 'short',
  });

  // Step 1.2: only keep commits up to that date, and update the page
  filteredCommits = commits.filter((d) => d.datetime <= commitMaxTime);
  const filteredData = filteredCommits.flatMap((d) => d.lines);

  updateScatterPlot(data, filteredCommits);
  renderCommitInfo(filteredData, filteredCommits);
  updateFileDisplay(filteredCommits); // Step 2
}

slider.addEventListener('input', onTimeSliderChange);
onTimeSliderChange(); // run once on page load
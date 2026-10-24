import { fetchJSON, renderProjects, fetchGitHubData } from './global.js';

// Load all projects, then keep only the first 3
const projects = await fetchJSON('./lib/projects.json');
const latestProjects = projects.slice(0, 3);

// Find the container on the homepage
const projectsContainer = document.querySelector('.projects');

// Show the 3 projects
renderProjects(latestProjects, projectsContainer, 'h2');

// Step 3: load my GitHub stats
const githubData = await fetchGitHubData('kittymingSLN');

// Find the spot on the page for the stats
const profileStats = document.querySelector('#profile-stats');

// Fill it in, only if that spot exists
if (profileStats) {
    profileStats.innerHTML = `
    <dl>
        <dt>Public Repos</dt><dd>${githubData.public_repos}</dd>
        <dt>Public Gists</dt><dd>${githubData.public_gists}</dd>
        <dt>Followers</dt><dd>${githubData.followers}</dd>
        <dt>Following</dt><dd>${githubData.following}</dd>
    </dl>
    `;
}
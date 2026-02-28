const DATA_PATH = "assets/data/projects.json";

const projectsContainer = document.getElementById("projects-container");
const resultsCount = document.getElementById("results-count");
const searchInput = document.getElementById("project-search");
const sectionFilter = document.getElementById("section-filter");
const navToggle = document.getElementById("nav-toggle");
const navMenu = document.getElementById("nav-menu");
const projectTemplate = document.getElementById("project-template");

let projects = [];

function toggleMenu() {
  const expanded = navToggle.getAttribute("aria-expanded") === "true";
  navToggle.setAttribute("aria-expanded", String(!expanded));
  navMenu.classList.toggle("open", !expanded);
}

function closeMenuOnOutsideClick(event) {
  if (window.innerWidth > 700) {
    return;
  }
  if (!navMenu.contains(event.target) && !navToggle.contains(event.target)) {
    navToggle.setAttribute("aria-expanded", "false");
    navMenu.classList.remove("open");
  }
}

function getAllTags(data) {
  const unique = new Set();
  data.forEach((project) => {
    (project.tags || []).forEach((tag) => unique.add(tag));
  });
  return [...unique].sort((a, b) => a.localeCompare(b));
}

function populateTagFilter(data) {
  const tags = getAllTags(data);
  tags.forEach((tag) => {
    const option = document.createElement("option");
    option.value = tag;
    option.textContent = tag;
    sectionFilter.append(option);
  });
}

function projectReleases(project) {
  return project.releases || [];
}

function matchesSearch(project, query) {
  if (!query) {
    return true;
  }

  const releaseText = projectReleases(project)
    .map((release) =>
      [release.version, release.date, ...(release.builds || []).map((build) => build.os)].join(" "),
    )
    .join(" ");

  const pool = [
    project.title,
    project.summary,
    project.description,
    ...(project.tags || []),
    releaseText,
  ]
    .join(" ")
    .toLowerCase();

  return pool.includes(query);
}

function matchesTag(project, tag) {
  if (tag === "all") {
    return true;
  }
  return (project.tags || []).includes(tag);
}

function filteredProjects() {
  const query = searchInput.value.trim().toLowerCase();
  const selectedTag = sectionFilter.value;

  return projects.filter(
    (project) => matchesSearch(project, query) && matchesTag(project, selectedTag),
  );
}

function createGallery(images = []) {
  const wrapper = document.createDocumentFragment();

  images.forEach((image) => {
    const figure = document.createElement("figure");
    figure.className = "gallery-item";

    const img = document.createElement("img");
    img.src = image.src;
    img.alt = image.alt || "Project image";
    img.loading = "lazy";

    const caption = document.createElement("figcaption");
    caption.textContent = image.caption || "";

    figure.append(img, caption);
    wrapper.append(figure);
  });

  return wrapper;
}

function renderProject(project) {
  const clone = projectTemplate.content.cloneNode(true);

  clone.querySelector(".project-title").textContent = project.title;
  clone.querySelector(".project-summary").textContent = project.summary;
  clone.querySelector(".project-description").textContent = project.description;

  const tagsList = clone.querySelector(".project-tags");
  (project.tags || []).forEach((tag) => {
    const tagItem = document.createElement("li");
    tagItem.textContent = tag;
    tagsList.append(tagItem);
  });

  clone.querySelector(".project-gallery").append(createGallery(project.images));

  const detailsLink = clone.querySelector(".details-link");
  detailsLink.href = `project.html?id=${encodeURIComponent(project.id)}`;

  return clone;
}

function renderProjects(data) {
  projectsContainer.innerHTML = "";

  if (!data.length) {
    const empty = document.createElement("p");
    empty.className = "empty-state";
    empty.textContent = "No projects found for this filter.";
    projectsContainer.append(empty);
    resultsCount.textContent = "0 projects shown";
    return;
  }

  const fragment = document.createDocumentFragment();
  data.forEach((project) => fragment.append(renderProject(project)));
  projectsContainer.append(fragment);
  resultsCount.textContent = `${data.length} project${data.length === 1 ? "" : "s"} shown`;
}

function updateView() {
  renderProjects(filteredProjects());
}

async function init() {
  try {
    const response = await fetch(DATA_PATH);
    if (!response.ok) {
      throw new Error(`Failed to load projects: ${response.status}`);
    }

    projects = await response.json();
    populateTagFilter(projects);
    renderProjects(projects);
  } catch (error) {
    projectsContainer.innerHTML = "";
    const message = document.createElement("p");
    message.className = "empty-state";
    message.textContent =
      window.location.protocol === "file:"
        ? "Could not load project data from file://. Run a local server (for example: python3 -m http.server 8000) and open http://localhost:8000."
        : "Could not load project data. Check assets/data/projects.json.";
    projectsContainer.append(message);
    resultsCount.textContent = "Error loading projects";
    console.error(error);
  }
}

searchInput.addEventListener("input", updateView);
sectionFilter.addEventListener("change", updateView);
navToggle.addEventListener("click", toggleMenu);
document.addEventListener("click", closeMenuOnOutsideClick);

init();

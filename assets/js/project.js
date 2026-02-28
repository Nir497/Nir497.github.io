const DATA_PATH = "assets/data/projects.json";

const projectRoot = document.getElementById("project-root");
const template = document.getElementById("project-detail-template");

function compareSemverDesc(a = "", b = "") {
  const normalize = (v) =>
    String(v)
      .split(".")
      .map((part) => Number(part) || 0);

  const av = normalize(a);
  const bv = normalize(b);
  const maxLen = Math.max(av.length, bv.length);

  for (let i = 0; i < maxLen; i += 1) {
    const diff = (bv[i] || 0) - (av[i] || 0);
    if (diff !== 0) {
      return diff;
    }
  }

  return 0;
}

function sortReleases(releases = []) {
  return [...releases].sort((a, b) => {
    if (a.date && b.date && a.date !== b.date) {
      return a.date < b.date ? 1 : -1;
    }
    return compareSemverDesc(a.version, b.version);
  });
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

function getProjectId() {
  const params = new URLSearchParams(window.location.search);
  return params.get("id");
}

function showError(message) {
  projectRoot.innerHTML = "";
  const error = document.createElement("p");
  error.className = "empty-state";
  error.textContent = message;
  projectRoot.append(error);
}

function optionLabel(release, isLatest) {
  const versionText = release.version || "Unversioned";
  return isLatest ? `${versionText} (latest)` : versionText;
}

function renderProject(project) {
  const clone = template.content.cloneNode(true);
  const detailNode = clone.querySelector(".project-detail");

  clone.querySelector(".project-title").textContent = project.title;
  clone.querySelector(".project-summary").textContent = project.summary;
  clone.querySelector(".project-meta").textContent = `Year: ${project.year || "N/A"} | Featured: ${project.featured ? "Yes" : "No"}`;
  clone.querySelector(".project-description").textContent = project.description;

  const tags = clone.querySelector(".project-tags");
  (project.tags || []).forEach((tag) => {
    const item = document.createElement("li");
    item.textContent = tag;
    tags.append(item);
  });

  clone.querySelector(".project-gallery").append(createGallery(project.images || []));

  projectRoot.innerHTML = "";
  projectRoot.append(clone);

  const releases = sortReleases(project.releases || []);
  if (!releases.length) {
    const panel = projectRoot.querySelector(".download-panel");
    panel.innerHTML = "<p class=\"empty-state\">No releases available yet.</p>";
    return;
  }

  const versionSelect = detailNode.querySelector("#version-select");
  const osSelect = detailNode.querySelector("#os-select");
  const downloadButton = detailNode.querySelector("#download-button");
  const downloadMeta = detailNode.querySelector("#download-meta");

  releases.forEach((release, index) => {
    const option = document.createElement("option");
    option.value = String(index);
    option.textContent = optionLabel(release, index === 0);
    versionSelect.append(option);
  });

  versionSelect.selectedIndex = 0;

  function refreshOsOptions() {
    const selectedRelease = releases[Number(versionSelect.value)] || releases[0];
    const builds = selectedRelease.builds || [];

    osSelect.innerHTML = "";
    builds.forEach((build, idx) => {
      const option = document.createElement("option");
      option.value = String(idx);
      option.textContent = build.os || "Unknown OS";
      osSelect.append(option);
    });

    osSelect.selectedIndex = 0;
    refreshDownloadButton();
  }

  function refreshDownloadButton() {
    const selectedRelease = releases[Number(versionSelect.value)] || releases[0];
    const build = (selectedRelease.builds || [])[Number(osSelect.value)] || null;

    if (!build) {
      downloadButton.href = "#";
      downloadButton.setAttribute("aria-disabled", "true");
      downloadMeta.textContent = "No build available for this selection.";
      return;
    }

    downloadButton.href = build.file;
    downloadButton.removeAttribute("aria-disabled");
    downloadMeta.textContent = `${build.label || "Build"} | ${build.type || "File"} | ${selectedRelease.date || "Date N/A"}`;
  }

  versionSelect.addEventListener("change", refreshOsOptions);
  osSelect.addEventListener("change", refreshDownloadButton);

  refreshOsOptions();
}

async function init() {
  const id = getProjectId();
  if (!id) {
    showError("Missing project id. Open a project from the main list page.");
    return;
  }

  try {
    const response = await fetch(DATA_PATH);
    if (!response.ok) {
      throw new Error(`Failed to load projects: ${response.status}`);
    }

    const projects = await response.json();
    const project = projects.find((item) => item.id === id);

    if (!project) {
      showError("Project not found. Return to the project list and try again.");
      return;
    }

    renderProject(project);
  } catch (error) {
    showError(
      window.location.protocol === "file:"
        ? "Could not load project data from file://. Run a local server (python3 -m http.server 8000) and open http://localhost:8000."
        : "Could not load project data. Check assets/data/projects.json.",
    );
    console.error(error);
  }
}

init();

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
  const fromQuery = params.get("id");
  if (fromQuery) {
    return fromQuery;
  }
  const hash = window.location.hash.replace(/^#/, "").trim();
  if (hash.startsWith("id=")) {
    return hash.slice(3);
  }
  return hash || null;
}

function showError(message) {
  projectRoot.innerHTML = "";
  const error = document.createElement("p");
  error.className = "empty-state";
  error.textContent = message;
  projectRoot.append(error);
}

function candidateDataPaths() {
  const candidates = new Set(["assets/data/projects.json", "./assets/data/projects.json"]);
  const pathParts = window.location.pathname.split("/").filter(Boolean);
  const firstPart = pathParts[0] || "";
  const isLikelyProjectSite =
    window.location.hostname.endsWith(".github.io") &&
    firstPart &&
    !firstPart.includes(".") &&
    firstPart !== "index.html" &&
    firstPart !== "project.html";

  if (isLikelyProjectSite) {
    candidates.add(`/${firstPart}/assets/data/projects.json`);
  } else {
    candidates.add("/assets/data/projects.json");
  }

  return [...candidates];
}

async function loadProjectsData() {
  const attempts = [];
  for (const path of candidateDataPaths()) {
    try {
      const response = await fetch(path);
      if (response.ok) {
        return await response.json();
      }
      attempts.push(`${path} (${response.status})`);
    } catch (_error) {
      attempts.push(`${path} (network error)`);
    }
  }
  throw new Error(`Failed to load project data. Attempts: ${attempts.join(", ")}`);
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
  let currentRelease = null;
  let currentBuild = null;

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
    currentRelease = selectedRelease;
    currentBuild = build;

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

  downloadButton.addEventListener("click", (event) => {
    if (downloadButton.getAttribute("aria-disabled") === "true" || !currentBuild || !currentRelease) {
      event.preventDefault();
      return;
    }

    event.preventDefault();

    // Trigger the selected file download, then route to next steps guidance.
    const downloader = document.createElement("a");
    downloader.href = currentBuild.file;
    downloader.setAttribute("download", "");
    document.body.append(downloader);
    downloader.click();
    downloader.remove();

    const params = new URLSearchParams({
      id: project.id,
      version: currentRelease.version || "",
      os: currentBuild.os || "",
    });
    window.setTimeout(() => {
      window.location.href = `next-steps.html?${params.toString()}`;
    }, 250);
  });

  versionSelect.addEventListener("change", refreshOsOptions);
  osSelect.addEventListener("change", refreshDownloadButton);

  refreshOsOptions();
}

async function init() {
  try {
    const projects = await loadProjectsData();
    const id = getProjectId();
    let project = null;

    if (id) {
      project = projects.find((item) => item.id === id);
    }

    if (!project) {
      project = projects[0] || null;
    }

    if (!project) {
      showError("No projects were found in project data.");
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

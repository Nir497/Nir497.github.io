const root = document.getElementById("next-steps-root");
const template = document.getElementById("next-steps-template");

function candidateDataPaths() {
  const candidates = new Set(["assets/data/projects.json", "./assets/data/projects.json"]);
  const pathParts = window.location.pathname.split("/").filter(Boolean);
  const firstPart = pathParts[0] || "";
  const isLikelyProjectSite =
    window.location.hostname.endsWith(".github.io") &&
    firstPart &&
    !firstPart.includes(".") &&
    firstPart !== "index.html" &&
    firstPart !== "project.html" &&
    firstPart !== "next-steps.html";

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

function params() {
  const q = new URLSearchParams(window.location.search);
  return {
    id: q.get("id") || "",
    version: q.get("version") || "",
    os: q.get("os") || "",
  };
}

function showError(message) {
  root.innerHTML = "";
  const error = document.createElement("p");
  error.className = "empty-state";
  error.textContent = message;
  root.append(error);
}

function defaultSteps(projectTitle, os, version) {
  return [
    `Extract the downloaded package for ${projectTitle}.`,
    `Open the ${os || "target OS"} build and run the installer or executable.`,
    "Review the included README or docs for first-run configuration.",
    `Confirm you are running version ${version || "latest"} after install.`,
  ];
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;")
    .replaceAll("'", "&#39;");
}

function renderInlineMarkdown(text) {
  let html = escapeHtml(text);
  html = html.replace(/`([^`]+)`/g, "<code>$1</code>");
  html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\*([^*]+)\*/g, "<em>$1</em>");
  html = html.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
  return html;
}

function renderMarkdown(markdown) {
  const lines = String(markdown).split("\n");
  const html = [];
  let inList = false;

  function closeList() {
    if (inList) {
      html.push("</ul>");
      inList = false;
    }
  }

  lines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed) {
      closeList();
      return;
    }

    if (trimmed.startsWith("### ")) {
      closeList();
      html.push(`<h3>${renderInlineMarkdown(trimmed.slice(4))}</h3>`);
      return;
    }
    if (trimmed.startsWith("## ")) {
      closeList();
      html.push(`<h2>${renderInlineMarkdown(trimmed.slice(3))}</h2>`);
      return;
    }
    if (trimmed.startsWith("# ")) {
      closeList();
      html.push(`<h1>${renderInlineMarkdown(trimmed.slice(2))}</h1>`);
      return;
    }
    if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      if (!inList) {
        html.push("<ul>");
        inList = true;
      }
      html.push(`<li>${renderInlineMarkdown(trimmed.slice(2))}</li>`);
      return;
    }

    closeList();
    html.push(`<p>${renderInlineMarkdown(trimmed)}</p>`);
  });

  closeList();
  return html.join("");
}

function render(project, build, selectedVersion, selectedOs) {
  const clone = template.content.cloneNode(true);

  const subtitle = clone.querySelector("#next-steps-subtitle");
  subtitle.textContent = `${project.title} | Version ${selectedVersion || "latest"} | ${selectedOs || "OS"}`;

  const stepsList = clone.querySelector("#next-steps-list");
  const markdownContainer = clone.querySelector("#next-steps-markdown");
  const steps = project.nextSteps && project.nextSteps.length
    ? project.nextSteps
    : defaultSteps(project.title, selectedOs, selectedVersion);
  const markdownText = (project.nextStepsMarkdown || "").trim();

  if (markdownText) {
    stepsList.style.display = "none";
    markdownContainer.innerHTML = renderMarkdown(markdownText);
  } else {
    markdownContainer.style.display = "none";
    steps.forEach((step) => {
      const item = document.createElement("li");
      item.innerHTML = renderInlineMarkdown(step);
      stepsList.append(item);
    });
  }

  const backToProject = clone.querySelector("#back-to-project");
  backToProject.href = `project.html?id=${encodeURIComponent(project.id)}`;

  const redownload = clone.querySelector("#redownload-button");
  redownload.href = build ? build.file : "#";

  root.innerHTML = "";
  root.append(clone);
}

async function init() {
  try {
    const { id, version, os } = params();
    if (!id) {
      showError("Missing project id. Open a project and download from its details page.");
      return;
    }

    const projects = await loadProjectsData();
    const project = projects.find((item) => item.id === id);

    if (!project) {
      showError("Project not found.");
      return;
    }

    const release = (project.releases || []).find((entry) => (entry.version || "") === version) ||
      (project.releases || [])[0] || null;
    const build = (release && release.builds || []).find((entry) => (entry.os || "") === os) ||
      (release && release.builds || [])[0] || null;

    render(project, build, release ? release.version : version, build ? build.os : os);
  } catch (error) {
    showError(
      window.location.protocol === "file:"
        ? "Could not load project data from file://. Run a local server (python3 -m http.server 8000) and open http://localhost:8000."
        : "Could not load next steps data.",
    );
    console.error(error);
  }
}

init();

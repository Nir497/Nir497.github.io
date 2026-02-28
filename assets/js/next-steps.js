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
  const container = document.createElement("div");
  let orderedList = null;
  let unorderedList = null;
  let nestedUnorderedList = null;
  let lastOrderedItem = null;

  function resetListPointers() {
    orderedList = null;
    unorderedList = null;
    nestedUnorderedList = null;
    lastOrderedItem = null;
  }

  lines.forEach((line) => {
    const raw = String(line).replace(/\t/g, "    ");
    const trimmed = raw.trim();
    const indent = raw.match(/^ */)?.[0].length || 0;

    if (!trimmed) {
      resetListPointers();
      return;
    }

    if (trimmed.startsWith("### ")) {
      resetListPointers();
      const el = document.createElement("h3");
      el.innerHTML = renderInlineMarkdown(trimmed.slice(4));
      container.append(el);
      return;
    }
    if (trimmed.startsWith("## ")) {
      resetListPointers();
      const el = document.createElement("h2");
      el.innerHTML = renderInlineMarkdown(trimmed.slice(3));
      container.append(el);
      return;
    }
    if (trimmed.startsWith("# ")) {
      resetListPointers();
      const el = document.createElement("h1");
      el.innerHTML = renderInlineMarkdown(trimmed.slice(2));
      container.append(el);
      return;
    }

    if (/^\d+\.\s+/.test(trimmed)) {
      if (!orderedList) {
        orderedList = document.createElement("ol");
        container.append(orderedList);
      }
      unorderedList = null;
      nestedUnorderedList = null;

      const li = document.createElement("li");
      li.innerHTML = renderInlineMarkdown(trimmed.replace(/^\d+\.\s+/, ""));
      orderedList.append(li);
      lastOrderedItem = li;
      return;
    }

    if (/^[-*]\s+/.test(trimmed)) {
      const text = trimmed.replace(/^[-*]\s+/, "");
      const li = document.createElement("li");
      li.innerHTML = renderInlineMarkdown(text);

      if (orderedList && lastOrderedItem && indent >= 2) {
        if (!nestedUnorderedList) {
          nestedUnorderedList = document.createElement("ul");
          lastOrderedItem.append(nestedUnorderedList);
        }
        nestedUnorderedList.append(li);
        return;
      }

      if (!unorderedList) {
        unorderedList = document.createElement("ul");
        container.append(unorderedList);
      }
      orderedList = null;
      nestedUnorderedList = null;
      lastOrderedItem = null;
      unorderedList.append(li);
      return;
    }

    resetListPointers();
    const paragraph = document.createElement("p");
    paragraph.innerHTML = renderInlineMarkdown(trimmed);
    container.append(paragraph);
  });

  return container.innerHTML;
}

function render(project, build, selectedVersion, selectedOs) {
  const clone = template.content.cloneNode(true);

  const subtitle = clone.querySelector("#next-steps-subtitle");
  subtitle.textContent = `${project.title} | Version ${selectedVersion || "latest"} | ${selectedOs || "OS"}`;

  const stepsList = clone.querySelector("#next-steps-list");
  const markdownContainer = clone.querySelector("#next-steps-markdown");
  const fallbackSteps = defaultSteps(project.title, selectedOs, selectedVersion);
  const nextStepsValue = project.nextSteps;
  const steps = Array.isArray(nextStepsValue) && nextStepsValue.length ? nextStepsValue : fallbackSteps;
  const markdownText = typeof project.nextStepsMarkdown === "string" ? project.nextStepsMarkdown.trim() : "";
  const markdownFromTextBox = typeof nextStepsValue === "string" ? nextStepsValue.trim() : "";

  if (markdownText) {
    stepsList.style.display = "none";
    markdownContainer.innerHTML = renderMarkdown(markdownText);
  } else if (markdownFromTextBox) {
    stepsList.style.display = "none";
    markdownContainer.innerHTML = renderMarkdown(markdownFromTextBox);
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

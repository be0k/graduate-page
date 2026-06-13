async function urlExists(url) {
  try {
    const response = await fetch(url, { method: "HEAD", cache: "no-store" });
    return response.ok;
  } catch {
    return false;
  }
}

async function resolveVideoSrc(src) {
  if (!/\.mp4($|\?)/i.test(src) || !document.createElement("video").canPlayType("video/webm")) {
    return src;
  }

  const webmSrc = src.replace(/\.mp4($|\?)/i, ".webm$1");
  return (await urlExists(webmSrc)) ? webmSrc : src;
}

async function selectCaseMedia(caseStudy, card) {
  const selectedVideo = caseStudy.querySelector(".selected-video");
  const selectedSource = selectedVideo?.querySelector("source");
  const selectedImage = caseStudy.querySelector(".selected-image");
  const selectedTitle = caseStudy.querySelector(".selected-title");
  const selectedDescription = caseStudy.querySelector(".selected-description");
  const src = card.dataset.src;
  const kind = card.dataset.kind || (/\.(png|jpe?g|webp|gif|svg)$/i.test(src) ? "image" : "video");

  if (!selectedVideo || !selectedSource || !selectedImage || !src) return;

  if (kind === "image") {
    selectedVideo.pause();
    selectedVideo.hidden = true;
    selectedImage.src = src;
    selectedImage.alt = `${card.dataset.title || "Selected"} result`;
    selectedImage.hidden = false;
  } else {
    const videoSrc = await resolveVideoSrc(src);

    selectedImage.hidden = true;
    selectedImage.removeAttribute("src");
    selectedVideo.hidden = false;
    selectedVideo.muted = true;
    selectedSource.src = videoSrc;
    selectedVideo.poster = card.dataset.poster || "";
    selectedVideo.load();
    selectedVideo.play().catch(() => {});
  }

  if (selectedTitle) selectedTitle.textContent = card.dataset.title || "";
  if (selectedDescription) selectedDescription.textContent = card.dataset.description || "";

  caseStudy.querySelectorAll(".media-card").forEach((item) => {
    const isSelected = item === card;
    item.classList.toggle("is-selected", isSelected);
    item.setAttribute("aria-pressed", String(isSelected));
  });
}

document.querySelectorAll("[data-case]").forEach((caseStudy) => {
  caseStudy.querySelectorAll(".media-card").forEach((card) => {
    card.addEventListener("click", () => selectCaseMedia(caseStudy, card));
  });
});

document.querySelectorAll("video").forEach((video) => {
  const source = video.querySelector("source");
  video.muted = true;
  if (!source?.getAttribute("src")) {
    video.play().catch(() => {});
    return;
  }

  resolveVideoSrc(source.getAttribute("src")).then((src) => {
    if (src !== source.getAttribute("src")) {
      source.src = src;
      video.load();
    }
    video.play().catch(() => {});
  });
});

(() => {
  "use strict";

  // Reveal-on-scroll: series headers only (photos show immediately).
  const revealTargets = document.querySelectorAll(".series-head");
  if (revealTargets.length && "IntersectionObserver" in window) {
    const revealObserver = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add("in-view");
          revealObserver.unobserve(entry.target);
        }
      }
    }, { threshold: 0.15, rootMargin: "0px 0px -8% 0px" });
    revealTargets.forEach((el) => revealObserver.observe(el));
  } else {
    revealTargets.forEach((el) => el.classList.add("in-view"));
  }

  // Nav scroll-spy: highlight the series whose section owns the top of the viewport.
  const navLinks = Array.from(document.querySelectorAll(".nav-series"));
  const sections = navLinks
    .map((link) => document.getElementById(link.getAttribute("data-target")))
    .filter(Boolean);

  if (navLinks.length && sections.length && "IntersectionObserver" in window) {
    const setActive = (id) => {
      navLinks.forEach((link) => {
        link.classList.toggle("active", link.getAttribute("data-target") === id);
      });
    };

    const spy = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible.length) setActive(visible[0].target.id);
      },
      { rootMargin: "-35% 0px -55% 0px", threshold: [0, 0.25, 0.5, 0.75, 1] }
    );
    sections.forEach((section) => spy.observe(section));
    setActive(sections[0].id);
  }

  // Click a series name -> smooth-scroll to it (native anchor handles same-page case;
  // this also covers links that arrive with a hash from another page).
  navLinks.forEach((link) => {
    link.addEventListener("click", (event) => {
      const targetId = link.getAttribute("data-target");
      const targetEl = document.getElementById(targetId);
      if (targetEl) {
        event.preventDefault();
        targetEl.scrollIntoView({ behavior: "smooth", block: "start" });
        history.replaceState(null, "", "#" + targetId);
      }
    });
  });

  // Arriving from another page with a #hash: scroll to it after layout settles.
  if (window.location.hash) {
    const targetEl = document.getElementById(window.location.hash.slice(1));
    if (targetEl) {
      requestAnimationFrame(() => targetEl.scrollIntoView({ behavior: "auto", block: "start" }));
    }
  }

  // ---------- Lightbox ----------
  // Every series-grid is its own gallery: clicking a photo opens it full-size,
  // with prev/next scoped to that same grid.
  const galleries = Array.from(document.querySelectorAll(".series-grid"));
  if (galleries.length) {
    const overlay = document.createElement("div");
    overlay.className = "lightbox";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.innerHTML = `
      <button class="lightbox-close" aria-label="Fermer">&times;</button>
      <button class="lightbox-prev" aria-label="Photo précédente">&#8249;</button>
      <button class="lightbox-next" aria-label="Photo suivante">&#8250;</button>
      <figure class="lightbox-frame">
        <img alt="">
        <figcaption class="lightbox-count"></figcaption>
      </figure>
    `;
    document.body.appendChild(overlay);

    const imgEl = overlay.querySelector("img");
    const countEl = overlay.querySelector(".lightbox-count");
    const closeBtn = overlay.querySelector(".lightbox-close");
    const prevBtn = overlay.querySelector(".lightbox-prev");
    const nextBtn = overlay.querySelector(".lightbox-next");

    let currentList = [];
    let currentIndex = 0;
    let lastFocused = null;

    const show = (index) => {
      currentIndex = (index + currentList.length) % currentList.length;
      const img = currentList[currentIndex];
      imgEl.src = img.currentSrc || img.src;
      imgEl.alt = img.alt || "";
      countEl.textContent = `${currentIndex + 1} / ${currentList.length}`;
      const multi = currentList.length > 1;
      prevBtn.style.display = multi ? "" : "none";
      nextBtn.style.display = multi ? "" : "none";
    };

    const open = (list, index) => {
      currentList = list;
      lastFocused = document.activeElement;
      show(index);
      overlay.classList.add("open");
      document.body.style.overflow = "hidden";
      closeBtn.focus();
    };

    const close = () => {
      overlay.classList.remove("open");
      document.body.style.overflow = "";
      imgEl.src = "";
      if (lastFocused) lastFocused.focus();
    };

    galleries.forEach((grid) => {
      const imgs = Array.from(grid.querySelectorAll("img"));
      imgs.forEach((img, i) => {
        img.closest("figure").addEventListener("click", () => open(imgs, i));
      });
    });

    closeBtn.addEventListener("click", close);
    prevBtn.addEventListener("click", () => show(currentIndex - 1));
    nextBtn.addEventListener("click", () => show(currentIndex + 1));
    overlay.addEventListener("click", (event) => {
      if (event.target === overlay) close();
    });
    document.addEventListener("keydown", (event) => {
      if (!overlay.classList.contains("open")) return;
      if (event.key === "Escape") close();
      else if (event.key === "ArrowLeft") show(currentIndex - 1);
      else if (event.key === "ArrowRight") show(currentIndex + 1);
    });
  }

  // ---------- Contact form ----------
  // No backend: the submit button stays disabled until every required field
  // validates, then "sending" opens the visitor's mail client with the
  // message pre-filled.
  const contactForm = document.getElementById("contact-form");
  if (contactForm) {
    const submitBtn = contactForm.querySelector(".btn-submit");
    const updateState = () => {
      submitBtn.disabled = !contactForm.checkValidity();
    };
    contactForm.addEventListener("input", updateState);
    updateState();

    contactForm.addEventListener("submit", (event) => {
      event.preventDefault();
      if (!contactForm.checkValidity()) return;

      const data = new FormData(contactForm);
      const firstName = data.get("first-name").trim();
      const lastName = data.get("last-name").trim();
      const subject = data.get("subject").trim();
      const email = data.get("email").trim();
      const message = data.get("message").trim();

      const to = "[ton@email.fr]";
      const body = `Nom : ${firstName} ${lastName}\nEmail : ${email}\n\n${message}`;
      const mailto =
        `mailto:${to}?subject=${encodeURIComponent(subject)}` +
        `&body=${encodeURIComponent(body)}`;
      window.location.href = mailto;
    });
  }
})();

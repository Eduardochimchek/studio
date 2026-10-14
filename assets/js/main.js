/* Eduardo Jeronimo · Studio: renderização dos trabalhos e comportamento da página. */
(function () {
  "use strict";

  var root = document.documentElement;
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  var hasIO = "IntersectionObserver" in window;
  var data = typeof WORKS !== "undefined" ? WORKS : {};
  var showPlaceholders = typeof SHOW_PLACEHOLDERS !== "undefined" && SHOW_PLACEHOLDERS === true;

  /* Utilitário para criar elementos sem innerHTML */
  function h(tag, attrs, children) {
    var el = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (key) {
        var value = attrs[key];
        if (value === undefined || value === null || value === false) return;
        if (key === "text") el.textContent = value;
        else el.setAttribute(key, value === true ? "" : value);
      });
    }
    (children || []).forEach(function (child) {
      if (child) el.appendChild(child);
    });
    return el;
  }

  var ICON_PAUSE = '<svg viewBox="0 0 14 14" aria-hidden="true" focusable="false"><rect x="3" y="2" width="2.5" height="10" fill="currentColor"/><rect x="8.5" y="2" width="2.5" height="10" fill="currentColor"/></svg>';
  var ICON_PLAY = '<svg viewBox="0 0 14 14" aria-hidden="true" focusable="false"><path d="M4 2.2v9.6L11.6 7z" fill="currentColor"/></svg>';

  function placeholder() {
    return h("div", { class: "placeholder" }, [h("span", { text: "Em breve" })]);
  }

  /* Troca o conteúdo de uma mídia pelo placeholder (arquivo ausente ou com erro) */
  function fallback(media) {
    media.textContent = "";
    media.appendChild(placeholder());
    media.classList.add("is-fallback");
  }

  function guardImage(img, media) {
    img.addEventListener("error", function () { fallback(media); });
  }

  /* Vídeos --------------------------------------------------------------- */

  var videoObserver = hasIO
    ? new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          var video = entry.target;
          if (entry.isIntersecting) {
            if (!reduceMotion.matches && !video.dataset.userPaused) play(video);
          } else if (!video.paused) {
            video.pause();
          }
        });
      }, { threshold: 0.5 })
    : null;

  function play(video) {
    var promise = video.play();
    if (promise && promise.catch) promise.catch(function () {});
  }

  function syncToggle(video, button, title) {
    var playing = !video.paused;
    button.innerHTML = playing ? ICON_PAUSE : ICON_PLAY;
    button.setAttribute("aria-label", (playing ? "Pausar vídeo: " : "Reproduzir vídeo: ") + title);
  }

  function renderVideo(item) {
    var media = h("div", { class: "media media--vertical" });

    if (item.placeholder) {
      media.appendChild(placeholder());
    } else {
      var video = h("video", {
        src: item.src,
        poster: item.poster,
        loop: true,
        playsinline: true,
        preload: "metadata",
        "aria-label": item.title + ", " + item.client
      });
      video.muted = true;
      video.defaultMuted = true;
      video.setAttribute("muted", "");

      var button = h("button", { class: "media-toggle", type: "button" });
      media.appendChild(video);
      media.appendChild(button);
      syncToggle(video, button, item.title);

      video.addEventListener("play", function () { syncToggle(video, button, item.title); });
      video.addEventListener("pause", function () { syncToggle(video, button, item.title); });
      button.addEventListener("click", function () {
        if (video.paused) {
          delete video.dataset.userPaused;
          play(video);
        } else {
          video.dataset.userPaused = "1";
          video.pause();
        }
      });

      video.addEventListener("error", function () {
        if (videoObserver) videoObserver.unobserve(video);
        fallback(media);
      });

      /* Poster ausente: remove o atributo para o navegador exibir o primeiro quadro */
      if (item.poster) {
        var probe = new Image();
        probe.onerror = function () { video.removeAttribute("poster"); };
        probe.src = item.poster;
      }

      if (videoObserver) videoObserver.observe(video);
    }

    return h("article", { class: "card video-card" }, [
      media,
      h("div", { class: "card-body" }, [
        h("p", { class: "card-client", text: item.client }),
        h("h4", { class: "card-title", text: item.title }),
        item.description ? h("p", { class: "card-desc", text: item.description }) : null
      ]),
      item.placeholder ? null : renderGallery(item.gallery)
    ]);
  }

  /* Galeria de imagens 16:9 abaixo do vídeo ------------------------------ */

  function renderGallery(images) {
    if (!images || !images.length) return null;
    var list = h("ul", { class: "gallery" });

    images.forEach(function (image) {
      var label = image.caption || image.alt || "";
      var img = h("img", {
        src: image.src,
        alt: image.alt || image.caption || "",
        width: "1600",
        height: "900",
        loading: "lazy",
        decoding: "async"
      });
      var open = h("button", {
        class: "gallery-open",
        type: "button",
        "aria-haspopup": "dialog",
        "aria-label": "Ampliar imagem" + (label ? ": " + label : "")
      }, [img]);
      var entry = h("li", { class: "gallery-item" }, [
        h("figure", null, [
          open,
          image.caption ? h("figcaption", { class: "caption", text: image.caption }) : null
        ])
      ]);

      /* Imagem com erro some; galeria sem nenhuma imagem também */
      img.addEventListener("error", function () {
        entry.hidden = true;
        if (!list.querySelector(".gallery-item:not([hidden])")) list.hidden = true;
      });
      open.addEventListener("click", function () {
        lightbox.open(image, open);
      });

      list.appendChild(entry);
    });

    return list;
  }

  /* Lightbox: <dialog> nativo (foco preso, Esc fecha), clique fora fecha */
  var lightbox = (function () {
    var dialog, img, caption, trigger;

    function build() {
      img = h("img", { class: "lightbox-image", alt: "" });
      caption = h("figcaption", { class: "lightbox-caption" });
      var close = h("button", { class: "lightbox-close", type: "button", "aria-label": "Fechar imagem" });
      close.innerHTML = '<svg viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M3 3l10 10M13 3L3 13" stroke="currentColor" stroke-width="1.5" fill="none"/></svg>';
      dialog = h("dialog", { class: "lightbox", "aria-label": "Imagem ampliada" }, [
        close,
        h("figure", { class: "lightbox-figure" }, [img, caption])
      ]);
      document.body.appendChild(dialog);

      close.addEventListener("click", function () { dialog.close(); });
      /* O dialog ocupa a tela; clique em qualquer área que não seja a imagem ou a legenda fecha */
      dialog.addEventListener("click", function (event) {
        if (event.target !== img && event.target !== caption) dialog.close();
      });
      dialog.addEventListener("close", function () {
        root.classList.remove("has-lightbox");
        img.removeAttribute("src");
        if (trigger) trigger.focus();
      });
    }

    return {
      open: function (image, from) {
        if (!dialog) build();
        /* Navegador sem <dialog>: abre a imagem direto */
        if (typeof dialog.showModal !== "function") {
          window.open(image.src, "_blank", "noopener");
          return;
        }
        trigger = from;
        img.src = image.src;
        img.alt = image.alt || image.caption || "";
        caption.textContent = image.caption || "";
        caption.hidden = !image.caption;
        dialog.setAttribute("aria-label", image.caption || "Imagem ampliada");
        root.classList.add("has-lightbox");
        dialog.showModal();
      }
    };
  })();

  /* Landing pages -------------------------------------------------------- */

  function renderPage(item) {
    var media = h("div", { class: "media media--page" });

    if (item.placeholder) {
      media.appendChild(placeholder());
    } else {
      var img = h("img", {
        src: item.image,
        alt: item.alt || "Prévia da " + item.title.charAt(0).toLowerCase() + item.title.slice(1),
        loading: "lazy",
        decoding: "async"
      });
      guardImage(img, media);
      media.appendChild(img);
    }

    var link = !item.placeholder && item.url
      ? h("a", {
          class: "card-link",
          href: item.url,
          target: "_blank",
          rel: "noopener",
          text: "Ver página",
          "aria-label": "Ver página: " + item.title + " (abre em nova aba)"
        })
      : null;

    return h("article", { class: "card page-card" }, [
      media,
      h("div", { class: "card-body" }, [
        h("p", { class: "card-client", text: item.segment }),
        h("h4", { class: "card-title", text: item.title }),
        link
      ])
    ]);
  }

  /* Criativos ------------------------------------------------------------ */

  function renderCreative(item) {
    var format = item.format || "post";
    var media = h("div", { class: "media media--" + format });

    if (item.placeholder) {
      media.appendChild(placeholder());
    } else {
      var img = h("img", {
        src: item.image,
        alt: item.alt || item.caption,
        loading: "lazy",
        decoding: "async"
      });
      guardImage(img, media);
      media.appendChild(img);
    }

    return h("figure", { class: "card creative-card" }, [
      media,
      h("figcaption", { class: "caption", text: item.caption })
    ]);
  }

  /* Montagem dos blocos -------------------------------------------------- */

  var BLOCKS = [
    { id: "videos", key: "videos", render: renderVideo },
    { id: "landing-pages", key: "landingPages", render: renderPage },
    { id: "criativos", key: "criativos", render: renderCreative }
  ];

  function setNavVisible(name, visible) {
    document.querySelectorAll('[data-nav="' + name + '"]').forEach(function (el) {
      el.hidden = !visible;
    });
  }

  var visibleBlocks = 0;
  var revealTargets = [];

  BLOCKS.forEach(function (block) {
    var section = document.getElementById(block.id);
    var list = section && section.querySelector("[data-list]");
    var items = (data[block.key] || []).filter(function (item) {
      return showPlaceholders || !item.placeholder;
    });

    if (!section || !list || items.length === 0) {
      if (section) section.hidden = true;
      setNavVisible(block.id, false);
      return;
    }

    items.forEach(function (item, index) {
      var card = block.render(item);
      card.classList.add("reveal");
      card.style.setProperty("--i", String(index % 4));
      list.appendChild(card);
      revealTargets.push(card);
    });

    list.classList.toggle("grid--single", block.id === "videos" && items.length === 1);
    section.hidden = false;
    setNavVisible(block.id, true);
    visibleBlocks += 1;
  });

  /* Sem nenhum trabalho visível, a seção e os atalhos para ela somem */
  var works = document.getElementById("trabalhos");
  if (works) works.hidden = visibleBlocks === 0;
  setNavVisible("trabalhos", visibleBlocks > 0);

  var worksNav = document.querySelector(".works-nav");
  if (worksNav) worksNav.hidden = visibleBlocks < 2;

  /* Entrada escalonada ---------------------------------------------------- */

  if (hasIO && !reduceMotion.matches) {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.1 });
    revealTargets.forEach(function (el) { revealObserver.observe(el); });
  } else {
    revealTargets.forEach(function (el) { el.classList.add("is-visible"); });
  }

  /* Hero: começa quando as fontes estiverem prontas, para a linha não mudar no meio */
  function ready() {
    requestAnimationFrame(function () { root.classList.add("is-ready"); });
  }
  if (document.fonts && document.fonts.ready) {
    Promise.race([
      document.fonts.ready,
      new Promise(function (resolve) { setTimeout(resolve, 1200); })
    ]).then(ready);
  } else {
    ready();
  }

  /* Header ganha o fio inferior depois que a página rola */
  var header = document.querySelector(".site-header");
  var sentinel = document.querySelector(".header-sentinel");
  if (header && sentinel && hasIO) {
    new IntersectionObserver(function (entries) {
      header.classList.toggle("is-scrolled", !entries[0].isIntersecting);
    }).observe(sentinel);
  }

  /* Se o usuário passar a preferir menos movimento, pausa os vídeos */
  var onMotionChange = function () {
    if (reduceMotion.matches) {
      document.querySelectorAll(".video-card video").forEach(function (v) { v.pause(); });
    }
  };
  if (reduceMotion.addEventListener) reduceMotion.addEventListener("change", onMotionChange);
})();

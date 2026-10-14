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
  var ICON_EXPAND = '<svg viewBox="0 0 14 14" aria-hidden="true" focusable="false"><path d="M8.5 1.5h4v4M12.5 1.5L8 6M5.5 12.5h-4v-4M1.5 12.5L6 8" stroke="currentColor" stroke-width="1.4" fill="none"/></svg>';

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
      var expand = h("button", {
        class: "media-expand",
        type: "button",
        "aria-haspopup": "dialog",
        "aria-label": "Ampliar vídeo: " + item.title
      });
      expand.innerHTML = ICON_EXPAND;
      media.appendChild(video);
      media.appendChild(expand);
      media.appendChild(button);
      syncToggle(video, button, item.title);

      /* Clique no vídeo ou no botão de ampliar abre o player grande */
      video.addEventListener("click", function () { player.open(item, video, expand); });
      expand.addEventListener("click", function () { player.open(item, video, expand); });

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

  /* Player de vídeo ampliado ---------------------------------------------
     Mesmo <dialog> do lightbox, com controles para estudar o vídeo por etapas:
     pausar, voltar/avançar 5s, quadro a quadro, velocidade e tela cheia.
     Atalhos: Espaço/K pausa, ← → 5s, J L 10s, , . quadro a quadro,
     Home/End início e fim, M som, F tela cheia, Esc fecha. */
  var ICON_BACK = '<svg viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M8 3.5A4.5 4.5 0 1 1 3.6 9" stroke="currentColor" stroke-width="1.4" fill="none"/><path d="M8 1v5L5 3.5z" fill="currentColor"/></svg>';
  var ICON_FORWARD = '<svg viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M8 3.5A4.5 4.5 0 1 0 12.4 9" stroke="currentColor" stroke-width="1.4" fill="none"/><path d="M8 1v5l3-2.5z" fill="currentColor"/></svg>';
  var ICON_FRAME_BACK = '<svg viewBox="0 0 16 16" aria-hidden="true" focusable="false"><rect x="3" y="3" width="1.6" height="10" fill="currentColor"/><path d="M13 3v10L6 8z" fill="currentColor"/></svg>';
  var ICON_FRAME_FORWARD = '<svg viewBox="0 0 16 16" aria-hidden="true" focusable="false"><rect x="11.4" y="3" width="1.6" height="10" fill="currentColor"/><path d="M3 3v10l7-5z" fill="currentColor"/></svg>';
  var ICON_SOUND = '<svg viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M2 6h3l4-3v10l-4-3H2z" fill="currentColor"/><path d="M11 5.5a3.5 3.5 0 0 1 0 5M12.8 3.5a6 6 0 0 1 0 9" stroke="currentColor" stroke-width="1.3" fill="none"/></svg>';
  var ICON_MUTED = '<svg viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M2 6h3l4-3v10l-4-3H2z" fill="currentColor"/><path d="M11 6l4 4M15 6l-4 4" stroke="currentColor" stroke-width="1.3"/></svg>';
  var ICON_FULLSCREEN = '<svg viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M2 6V2h4M10 2h4v4M14 10v4h-4M6 14H2v-4" stroke="currentColor" stroke-width="1.4" fill="none"/></svg>';
  var SPEEDS = [1, 0.5, 0.25];

  var player = (function () {
    var dialog, stage, video, seek, time, playBtn, speedBtn, soundBtn, fullBtn, caption;
    var trigger, cardVideo, cardWasPlaying, fps, raf;

    function formatTime(seconds) {
      if (!isFinite(seconds)) seconds = 0;
      var m = Math.floor(seconds / 60);
      var s = seconds - m * 60;
      return m + ":" + (s < 10 ? "0" : "") + s.toFixed(1).replace(".", ",");
    }

    function formatSpeed(speed) {
      return String(speed).replace(".", ",") + "×";
    }

    function control(label, icon, extraClass) {
      var b = h("button", { class: "player-btn" + (extraClass ? " " + extraClass : ""), type: "button", "aria-label": label, title: label });
      b.innerHTML = icon;
      return b;
    }

    function updateTime() {
      var d = video.duration || 0;
      var t = video.currentTime || 0;
      seek.max = String(d);
      seek.value = String(t);
      seek.style.setProperty("--progress", d ? (t / d) * 100 + "%" : "0%");
      var label = formatTime(t) + " / " + formatTime(d);
      time.textContent = label + (video.paused ? " · quadro " + (Math.floor(t * fps + 0.001) + 1) : "");
      seek.setAttribute("aria-valuetext", formatTime(t) + " de " + formatTime(d));
    }

    function syncPlay() {
      var playing = !video.paused;
      playBtn.innerHTML = playing ? ICON_PAUSE : ICON_PLAY;
      playBtn.setAttribute("aria-label", playing ? "Pausar" : "Reproduzir");
      playBtn.title = playing ? "Pausar (Espaço)" : "Reproduzir (Espaço)";
      updateTime();
    }

    /* Enquanto toca, a barra anda suave (timeupdate só dispara ~4 vezes por segundo) */
    function loop() {
      updateTime();
      if (!video.paused) raf = requestAnimationFrame(loop);
    }

    function toggle() {
      if (video.paused) play(video);
      else video.pause();
    }

    function jump(seconds) {
      var d = video.duration || 0;
      video.currentTime = Math.max(0, Math.min(d, video.currentTime + seconds));
    }

    /* Quadro a quadro: pausa e vai para o meio do quadro vizinho, para o
       navegador não mostrar o quadro de antes por arredondamento */
    function stepFrame(direction) {
      video.pause();
      var current = Math.floor(video.currentTime * fps + 0.001);
      var last = Math.max(0, Math.floor((video.duration || 0) * fps) - 1);
      var next = Math.max(0, Math.min(last, current + direction));
      video.currentTime = (next + 0.5) / fps;
    }

    function cycleSpeed() {
      var i = SPEEDS.indexOf(video.playbackRate);
      video.playbackRate = SPEEDS[(i + 1) % SPEEDS.length];
      speedBtn.textContent = formatSpeed(video.playbackRate);
      speedBtn.setAttribute("aria-label", "Velocidade: " + formatSpeed(video.playbackRate));
    }

    function syncSound() {
      soundBtn.innerHTML = video.muted ? ICON_MUTED : ICON_SOUND;
      soundBtn.setAttribute("aria-label", video.muted ? "Ativar som" : "Desativar som");
      soundBtn.title = video.muted ? "Ativar som (M)" : "Desativar som (M)";
    }

    function toggleFullscreen() {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else if (stage.requestFullscreen) {
        stage.requestFullscreen().catch(function () {});
      } else if (video.webkitEnterFullscreen) {
        video.webkitEnterFullscreen(); /* iPhone */
      }
    }

    function onKey(event) {
      if (event.altKey || event.ctrlKey || event.metaKey) return;
      var tag = event.target.tagName;
      var onButton = tag === "BUTTON";
      var onSeek = event.target === seek;
      var handled = true;

      switch (event.key) {
        case " ":
          /* Espaço num botão aciona o próprio botão */
          if (onButton) return;
          toggle();
          break;
        case "k": case "K": toggle(); break;
        case "ArrowLeft": if (onSeek) return; jump(-5); break;
        case "ArrowRight": if (onSeek) return; jump(5); break;
        case "j": case "J": jump(-10); break;
        case "l": case "L": jump(10); break;
        case ",": stepFrame(-1); break;
        case ".": stepFrame(1); break;
        case "Home": if (onSeek) return; video.currentTime = 0; break;
        case "End": if (onSeek) return; video.currentTime = video.duration || 0; break;
        case "m": case "M": video.muted = !video.muted; break;
        case "f": case "F": toggleFullscreen(); break;
        default: handled = false;
      }
      if (handled) event.preventDefault();
    }

    function build() {
      video = h("video", { class: "player-video", playsinline: true, preload: "auto" });
      stage = h("div", { class: "player-stage" }, [video]);
      seek = h("input", { class: "player-seek", type: "range", min: "0", max: "0", step: "any", value: "0", "aria-label": "Posição no vídeo" });
      time = h("span", { class: "player-time", "aria-hidden": "true" });

      var close = h("button", { class: "lightbox-close", type: "button", "aria-label": "Fechar vídeo" });
      close.innerHTML = '<svg viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M3 3l10 10M13 3L3 13" stroke="currentColor" stroke-width="1.5" fill="none"/></svg>';

      playBtn = control("Reproduzir", ICON_PLAY, "player-btn--main");
      var back = control("Voltar 5 segundos (←)", ICON_BACK);
      var frameBack = control("Quadro anterior (,)", ICON_FRAME_BACK);
      var frameForward = control("Próximo quadro (.)", ICON_FRAME_FORWARD);
      var forward = control("Avançar 5 segundos (→)", ICON_FORWARD);
      speedBtn = h("button", { class: "player-btn player-btn--text", type: "button", "aria-label": "Velocidade: 1×", title: "Velocidade", text: "1×" });
      soundBtn = control("Desativar som", ICON_SOUND);
      fullBtn = control("Tela cheia (F)", ICON_FULLSCREEN);
      caption = h("p", { class: "player-caption" });

      dialog = h("dialog", { class: "lightbox player", "aria-label": "Vídeo ampliado" }, [
        close,
        h("div", { class: "player-layout" }, [
          stage,
          h("div", { class: "player-bar" }, [
            h("div", { class: "player-timeline" }, [seek, time]),
            h("div", { class: "player-controls" }, [
              h("div", { class: "player-group" }, [back, frameBack, playBtn, frameForward, forward]),
              h("div", { class: "player-group" }, [speedBtn, soundBtn, fullBtn])
            ]),
            h("p", { class: "player-hint", text: "Atalhos: Espaço pausa · ← → 5 segundos · , . quadro a quadro" })
          ]),
          caption
        ])
      ]);
      document.body.appendChild(dialog);

      video.addEventListener("click", toggle);
      video.addEventListener("play", function () { syncPlay(); cancelAnimationFrame(raf); loop(); });
      video.addEventListener("pause", syncPlay);
      video.addEventListener("ended", syncPlay);
      video.addEventListener("seeked", updateTime);
      video.addEventListener("loadedmetadata", updateTime);
      video.addEventListener("volumechange", syncSound);

      seek.addEventListener("input", function () {
        video.currentTime = parseFloat(seek.value) || 0;
        updateTime();
      });
      playBtn.addEventListener("click", toggle);
      back.addEventListener("click", function () { jump(-5); });
      forward.addEventListener("click", function () { jump(5); });
      frameBack.addEventListener("click", function () { stepFrame(-1); });
      frameForward.addEventListener("click", function () { stepFrame(1); });
      speedBtn.addEventListener("click", cycleSpeed);
      soundBtn.addEventListener("click", function () { video.muted = !video.muted; });
      fullBtn.addEventListener("click", toggleFullscreen);
      close.addEventListener("click", function () { dialog.close(); });

      dialog.addEventListener("keydown", onKey);
      /* Clique fora do vídeo e dos controles fecha, como no lightbox de imagens */
      dialog.addEventListener("click", function (event) {
        if (event.target === dialog || event.target.classList.contains("player-layout")) dialog.close();
      });
      dialog.addEventListener("close", function () {
        cancelAnimationFrame(raf);
        if (document.fullscreenElement) document.exitFullscreen();
        video.pause();
        video.removeAttribute("src");
        video.load();
        root.classList.remove("has-lightbox");
        if (cardVideo && cardWasPlaying && !cardVideo.dataset.userPaused) play(cardVideo);
        if (trigger) trigger.focus();
      });
    }

    return {
      open: function (item, fromVideo, from) {
        if (!dialog) build();
        /* Navegador sem <dialog>: abre o arquivo direto */
        if (typeof dialog.showModal !== "function") {
          window.open(item.src, "_blank", "noopener");
          return;
        }
        trigger = from;
        cardVideo = fromVideo;
        cardWasPlaying = !fromVideo.paused;
        fromVideo.pause();

        fps = item.fps || 30;
        video.src = item.src;
        if (item.poster) video.poster = item.poster;
        else video.removeAttribute("poster");
        video.muted = false;
        video.playbackRate = 1;
        speedBtn.textContent = formatSpeed(1);
        speedBtn.setAttribute("aria-label", "Velocidade: " + formatSpeed(1));
        caption.textContent = item.title + " · " + item.client;
        dialog.setAttribute("aria-label", item.title);
        syncSound();
        updateTime();

        root.classList.add("has-lightbox");
        dialog.showModal();
        playBtn.focus();
        /* aberto por um clique, então pode tocar com som */
        play(video);
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

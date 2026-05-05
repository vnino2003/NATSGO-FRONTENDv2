import { nextTick } from "vue";
import { useRouter } from "vue-router";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";

const TOUR_KEY = "natsgo_commuter_driver_tour_done";

const CAPY_OPEN = "/mascots/natsgo-capy-open.png";
const CAPY_CLOSED = "/mascots/natsgo-capy-closed.png";

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function capyDescription(text) {
  return `
    <div class="capy-tour" data-capy-tour>
      <div class="capy-tour__mascot-wrap">
        <img
          src="${CAPY_CLOSED}"
          data-capy-img
          data-capy-open="${CAPY_OPEN}"
          data-capy-closed="${CAPY_CLOSED}"
          alt="NatsGo Capy"
          class="capy-tour__img"
        />
      </div>

      <div class="capy-tour__bubble">
        <p class="capy-tour__name">NatsGo Capy</p>
        <p class="capy-tour__text" data-capy-text="${escapeHtml(text)}"></p>
      </div>
    </div>
  `;
}

function startCapyTalking() {
  stopCapyTalking();

  const tour = document.querySelector("[data-capy-tour]");
  const img = tour?.querySelector("[data-capy-img]");
  const textEl = tour?.querySelector("[data-capy-text]");

  if (!img || !textEl) return;

  const openSrc = img.dataset.capyOpen || CAPY_OPEN;
  const closedSrc = img.dataset.capyClosed || CAPY_CLOSED;
  const fullText = textEl.dataset.capyText || "";

  let textIndex = 0;
  let mouthOpen = false;

  textEl.textContent = "";
  img.src = closedSrc;
  img.classList.add("is-talking");

  window.__capyMouthTimer = window.setInterval(() => {
    mouthOpen = !mouthOpen;
    img.setAttribute("src", mouthOpen ? openSrc : closedSrc);
  }, 150);

  window.__capyTypeTimer = window.setInterval(() => {
    if (textIndex < fullText.length) {
      textEl.textContent += fullText[textIndex];
      textIndex += 1;
      return;
    }

    stopCapyTalking();
    img.setAttribute("src", closedSrc);
  }, 18);
}

function stopCapyTalking() {
  if (window.__capyTypeTimer) {
    clearInterval(window.__capyTypeTimer);
    window.__capyTypeTimer = null;
  }

  if (window.__capyMouthTimer) {
    clearInterval(window.__capyMouthTimer);
    window.__capyMouthTimer = null;
  }

  const tour = document.querySelector("[data-capy-tour]");
  const img = tour?.querySelector("[data-capy-img]");

  if (img) {
    img.classList.remove("is-talking");
    img.setAttribute("src", img.dataset.capyClosed || CAPY_CLOSED);
  }
}

/* =========================
   Tour Complete Celebration
========================= */

function injectTourCelebrationStyle() {
  if (document.getElementById("natsgo-tour-celebration-style")) return;

  const style = document.createElement("style");
  style.id = "natsgo-tour-celebration-style";
  style.textContent = `
    .tour-complete-overlay {
      position: fixed;
      inset: 0;
      z-index: 100000;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 18px;
      background: rgba(15, 23, 42, 0.38);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      animation: tourFadeIn 0.25s ease both;
    }

    .tour-complete-card {
      position: relative;
      width: min(360px, 100%);
      overflow: hidden;
      border-radius: 26px;
      background:
        radial-gradient(circle at top left, rgba(96, 165, 250, 0.26), transparent 35%),
        radial-gradient(circle at bottom right, rgba(34, 197, 94, 0.2), transparent 35%),
        #ffffff;
      border: 1px solid rgba(226, 232, 240, 0.95);
      box-shadow: 0 24px 70px rgba(15, 23, 42, 0.22);
      padding: 26px 22px 22px;
      text-align: center;
      animation: tourPopIn 0.38s cubic-bezier(.2,.9,.2,1.2) both;
    }

    .tour-complete-confetti {
      position: absolute;
      inset: 0;
      pointer-events: none;
      overflow: hidden;
    }

    .tour-complete-confetti span {
      position: absolute;
      top: -22px;
      font-size: 18px;
      animation: tourConfettiFall 1.9s linear infinite;
      opacity: 0.9;
    }

    .tour-complete-confetti span:nth-child(1) { left: 8%; animation-delay: 0s; }
    .tour-complete-confetti span:nth-child(2) { left: 18%; animation-delay: .3s; }
    .tour-complete-confetti span:nth-child(3) { left: 31%; animation-delay: .1s; }
    .tour-complete-confetti span:nth-child(4) { left: 45%; animation-delay: .45s; }
    .tour-complete-confetti span:nth-child(5) { left: 58%; animation-delay: .15s; }
    .tour-complete-confetti span:nth-child(6) { left: 72%; animation-delay: .35s; }
    .tour-complete-confetti span:nth-child(7) { left: 85%; animation-delay: .05s; }
    .tour-complete-confetti span:nth-child(8) { left: 94%; animation-delay: .5s; }

    .tour-complete-badge {
      width: 76px;
      height: 76px;
      margin: 0 auto 14px;
      border-radius: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #2563eb, #22c55e);
      color: #fff;
      font-size: 32px;
      box-shadow: 0 14px 30px rgba(37, 99, 235, 0.28);
      animation: tourBadgeBounce 0.9s ease infinite alternate;
    }

    .tour-complete-progress {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 7px 11px;
      border-radius: 999px;
      background: #eff6ff;
      color: #2563eb;
      font-size: 12px;
      font-weight: 800;
      margin-bottom: 10px;
    }

    .tour-complete-title {
      margin: 0;
      color: #0f172a;
      font-size: 21px;
      font-weight: 900;
      letter-spacing: -0.03em;
    }

    .tour-complete-text {
      margin: 8px auto 18px;
      max-width: 270px;
      color: #64748b;
      font-size: 13px;
      font-weight: 600;
      line-height: 1.55;
    }

    .tour-complete-btn {
      width: 100%;
      border: 0;
      border-radius: 15px;
      padding: 13px 16px;
      background: #2563eb;
      color: #fff;
      font-size: 14px;
      font-weight: 800;
      cursor: pointer;
      box-shadow: 0 10px 22px rgba(37, 99, 235, 0.25);
      transition: transform 0.15s ease, box-shadow 0.15s ease;
    }

    .tour-complete-btn:active {
      transform: scale(0.97);
      box-shadow: 0 6px 14px rgba(37, 99, 235, 0.2);
    }

    @keyframes tourFadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes tourPopIn {
      from {
        opacity: 0;
        transform: translateY(18px) scale(0.94);
      }
      to {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }

    @keyframes tourBadgeBounce {
      from { transform: translateY(0) rotate(-3deg); }
      to { transform: translateY(-5px) rotate(3deg); }
    }

    @keyframes tourConfettiFall {
      0% {
        transform: translateY(-20px) rotate(0deg);
        opacity: 0;
      }
      15% {
        opacity: 1;
      }
      100% {
        transform: translateY(390px) rotate(260deg);
        opacity: 0;
      }
    }
  `;

  document.head.appendChild(style);
}

function showTourCompleteCelebration(totalSteps = 19) {
  injectTourCelebrationStyle();

  const oldOverlay = document.querySelector(".tour-complete-overlay");
  if (oldOverlay) oldOverlay.remove();

  const overlay = document.createElement("div");
  overlay.className = "tour-complete-overlay";

  overlay.innerHTML = `
    <div class="tour-complete-card">
      <div class="tour-complete-confetti" aria-hidden="true">
        <span>🎉</span>
        <span>✨</span>
        <span>🎊</span>
        <span>⭐</span>
        <span>🎉</span>
        <span>✨</span>
        <span>🎊</span>
        <span>⭐</span>
      </div>

      <div class="tour-complete-badge">
        <i class="fas fa-check"></i>
      </div>

      <div class="tour-complete-progress">
        <i class="fas fa-flag-checkered"></i>
        ${totalSteps}/${totalSteps} Complete
      </div>

      <h2 class="tour-complete-title">You’re all set!</h2>

      <p class="tour-complete-text">
        Nice! You finished the NatsGo app guide. You can now use the main features confidently.
      </p>

      <button class="tour-complete-btn" type="button" data-close-tour-complete>
        Start Using NatsGo
      </button>
    </div>
  `;

  document.body.appendChild(overlay);

  const closeBtn = overlay.querySelector("[data-close-tour-complete]");

  function closeCelebration() {
    overlay.style.opacity = "0";
    overlay.style.transition = "opacity 0.2s ease";

    setTimeout(() => {
      overlay.remove();
    }, 220);
  }

  closeBtn?.addEventListener("click", closeCelebration);

  setTimeout(() => {
    if (document.body.contains(overlay)) {
      closeCelebration();
    }
  }, 4500);
}

export function useCommuterDriverTour() {
  const router = useRouter();

  const steps = [
    {
      route: "/home",
      element: '[data-tour="home-header"]',
      popover: {
        title: "Welcome to NatsGo!",
        description: capyDescription(
          "Hi! I’m NatsGo Capy. I’ll guide you through the important parts of the commuter app."
        ),
        side: "bottom",
        align: "center",
      },
    },
    {
      route: "/home",
      element: '[data-tour="home-menu"]',
      popover: {
        title: "Menu",
        description: capyDescription(
          "Open this menu to access contact options, the Facebook page, arrival notices, and account settings."
        ),
        side: "bottom",
        align: "start",
      },
    },
    {
      route: "/home",
      element: '[data-tour="home-search"]',
      popover: {
        title: "Search",
        description: capyDescription(
          "Use this search bar to quickly find routes, terminals, or commuter information."
        ),
        side: "bottom",
        align: "center",
      },
    },
    {
      route: "/home",
      element: '[data-tour="home-notification"]',
      popover: {
        title: "Notifications",
        description: capyDescription(
          "Check this area for nearby bus alerts and other important commuter updates."
        ),
        side: "bottom",
        align: "end",
      },
    },
    {
      route: "/home",
      element: '[data-tour="weather-card"]',
      popover: {
        title: "Weather",
        description: capyDescription(
          "This card shows the weather for your current location, including important weather alerts when available."
        ),
        side: "bottom",
        align: "center",
      },
    },
    {
      route: "/home",
      element: '[data-tour="home-tabs"]',
      popover: {
        title: "Home Sections",
        description: capyDescription(
          "Switch between Explore, Fares and Promos, and Updates from here."
        ),
        side: "bottom",
        align: "center",
      },
    },

    {
      route: "/home",
      element: '[data-tour="service-track"]',
      popover: {
        title: "Live Bus Tracking",
        description: capyDescription(
          "Open the live map to see available buses, their current or last known location, and route details."
        ),
        side: "bottom",
        align: "center",
      },
    },
    {
      route: "/home",
      element: '[data-tour="service-terminal"]',
      popover: {
        title: "Terminals",
        description: capyDescription(
          "View terminal information, check available terminals, and see buses connected to each terminal."
        ),
        side: "bottom",
        align: "center",
      },
    },
    {
      route: "/home",
      element: '[data-tour="service-facebook"]',
      popover: {
        title: "Announcements",
        description: capyDescription(
          "Open the Facebook page to view announcements, service updates, and other news."
        ),
        side: "bottom",
        align: "center",
      },
    },
    {
      route: "/home",
      element: '[data-tour="service-help"]',
      popover: {
        title: "App Guide",
        description: capyDescription(
          "Use this whenever you want to repeat the app guide and learn the main features again."
        ),
        side: "bottom",
        align: "center",
      },
    },
    {
      route: "/home",
      element: '[data-tour="nearby-buses"]',
      popover: {
        title: "Nearby Buses",
        description: capyDescription(
          "When location access is enabled, this section shows buses near you."
        ),
        side: "top",
        align: "center",
      },
    },
    {
      route: "/home",
      element: '[data-tour="bottom-nav"]',
      popover: {
        title: "Bottom Navigation",
        description: capyDescription(
          "Use this navigation bar to switch between Home, Track, Terminal, and Settings anytime."
        ),
        side: "top",
        align: "center",
      },
    },
    {
      route: "/track-bus",
      element: '[data-tour="track-map"]',
      popover: {
        title: "Live Map",
        description: capyDescription(
          "This map shows the live or last known location of buses."
        ),
        side: "bottom",
        align: "center",
      },
    },
    {
      route: "/track-bus",
      element: '[data-tour="track-center-user"]',
      popover: {
        title: "My Location Button",
        description: capyDescription(
          "Tap this button to move the map back to your current location when location access is enabled."
        ),
        side: "left",
        align: "center",
      },
    },
    {
      route: "/track-bus",
      element: '[data-tour="track-open-list"]',
      popover: {
        title: "Bus List Button",
        description: capyDescription(
          "Tap this button to open the bus list and view filters such as Nearby, All Buses, Terminal, and En Route."
        ),
        side: "left",
        align: "center",
      },
    },
    {
      route: "/track-bus",
      element: '[data-tour="track-sheet"]',
      popover: {
        title: "Bus List",
        description: capyDescription(
          "This panel shows bus details, filters, status, distance, and estimated arrival time."
        ),
        side: "top",
        align: "center",
      },
    },
    {
      route: "/terminal",
      element: '[data-tour="terminal-header"]',
      popover: {
        title: "Terminals",
        description: capyDescription(
          "This page shows the available terminals in the system."
        ),
        side: "bottom",
        align: "center",
      },
    },
    {
      route: "/terminal",
      element: '[data-tour="terminal-search"]',
      popover: {
        title: "Search Terminals",
        description: capyDescription(
          "Use this search field to quickly find a terminal by name or city."
        ),
        side: "bottom",
        align: "center",
      },
    },
    {
      route: "/terminal",
      element: '[data-tour="terminal-list"]',
      popover: {
        title: "Terminal Cards",
        description: capyDescription(
          "Tap a terminal card to view its details or open it on the live tracking map."
        ),
        side: "top",
        align: "center",
      },
    },
  ];

  async function goToStepRoute(step) {
    if (!step?.route) return;

    await router.push(step.route).catch(() => {});
    await wait(380);
    await nextTick();
  }

  function finishTour(driverObj) {
    stopCapyTalking();
    localStorage.setItem(TOUR_KEY, "true");

    if (driverObj) {
      driverObj.destroy();
    }

    setTimeout(() => {
      showTourCompleteCelebration(steps.length);
    }, 180);
  }

  function createDriver(force = false) {
    const completed = localStorage.getItem(TOUR_KEY) === "true";

    if (completed && !force) return null;

    let driverObj = null;

    driverObj = driver({
      showProgress: true,
      animate: true,
      smoothScroll: true,
      allowClose: true,
      overlayClickBehavior: "close",
      popoverClass: "capy-driver-popover",
      nextBtnText: "Next",
      prevBtnText: "Back",
      doneBtnText: "Done",
      steps,

      onHighlighted: () => {
        setTimeout(() => {
          startCapyTalking();
        }, 250);
      },

      onNextClick: async (_element, _step, options) => {
        stopCapyTalking();

        const currentIndex = options.state.activeIndex;
        const nextIndex = currentIndex + 1;
        const nextStep = steps[nextIndex];

        if (nextIndex >= steps.length) {
          finishTour(driverObj);
          return;
        }

        if (nextStep?.route) {
          await goToStepRoute(nextStep);
        }

        driverObj.moveNext();
      },

      onPrevClick: async (_element, _step, options) => {
        stopCapyTalking();

        const prevIndex = options.state.activeIndex - 1;
        const prevStep = steps[prevIndex];

        if (prevStep?.route) {
          await goToStepRoute(prevStep);
        }

        driverObj.movePrevious();
      },

      onCloseClick: () => {
        stopCapyTalking();
        localStorage.setItem(TOUR_KEY, "true");
        driverObj.destroy();
      },

      onDestroyStarted: () => {
        stopCapyTalking();
      },

      onDestroyed: () => {
        stopCapyTalking();
      },
    });

    return driverObj;
  }

  async function startTour(force = false) {
    const driverObj = createDriver(force);

    if (!driverObj) return;

    await goToStepRoute(steps[0]);

    driverObj.drive();

    setTimeout(() => {
      startCapyTalking();
    }, 350);
  }

  function resetTour() {
    localStorage.removeItem(TOUR_KEY);
  }

  return {
    startTour,
    resetTour,
  };
}
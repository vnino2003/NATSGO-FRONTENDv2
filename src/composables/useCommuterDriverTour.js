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

  const img = document.querySelector("[data-capy-img]");
  const textEl = document.querySelector("[data-capy-text]");

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
    img.src = mouthOpen ? openSrc : closedSrc;
  }, 150);

  window.__capyTypeTimer = window.setInterval(() => {
    if (textIndex < fullText.length) {
      textEl.textContent += fullText[textIndex];
      textIndex += 1;
      return;
    }

    stopCapyTalking();
    img.src = closedSrc;
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

  const img = document.querySelector("[data-capy-img]");
  if (img) {
    img.classList.remove("is-talking");
    img.src = img.dataset.capyClosed || CAPY_CLOSED;
  }
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
          "Hi! Ako si NatsGo Capy. Ituturo ko sa’yo kung saan makikita ang important parts ng commuter app."
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
          "Dito mo mabubuksan ang side menu para sa contact, Facebook page, arrival notice, and account options."
        ),
        side: "bottom",
        align: "start",
      },
    },
    {
      route: "/home",
      element: '[data-tour="home-search"]',
      popover: {
        title: "Search Routes",
        description: capyDescription(
          "Dito ka puwedeng maghanap ng bus routes or other commuter info."
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
          "Dito lalabas ang nearby bus alerts and other important commuter notifications."
        ),
        side: "bottom",
        align: "end",
      },
    },
    {
      route: "/home",
      element: '[data-tour="weather-card"]',
      popover: {
        title: "Weather Card",
        description: capyDescription(
          "Dito mo makikita ang weather sa current location mo, including alerts kapag may important update."
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
          "Dito ka puwedeng lumipat between Explore, Fare & Promos, and Updates."
        ),
        side: "bottom",
        align: "center",
      },
    },
    {
      route: "/home",
      element: '[data-tour="service-track"]',
      popover: {
        title: "Quick Track",
        description: capyDescription(
          "Tap this kapag gusto mong diretso makita ang live bus location."
        ),
        side: "bottom",
        align: "center",
      },
    },
    {
      route: "/home",
      element: '[data-tour="service-terminal"]',
      popover: {
        title: "Terminal Shortcut",
        description: capyDescription(
          "Dito ka mabilis makakapunta sa terminal information."
        ),
        side: "bottom",
        align: "center",
      },
    },
    {
      route: "/home",
      element: '[data-tour="service-facebook"]',
      popover: {
        title: "Facebook Page",
        description: capyDescription(
          "Tap this para makita ang official Facebook page for news, announcements, and updates."
        ),
        side: "bottom",
        align: "center",
      },
    },
    {
      route: "/home",
      element: '[data-tour="service-help"]',
      popover: {
        title: "Help Guide",
        description: capyDescription(
          "Dito ka pupunta kapag kailangan mo ng guide kung paano gamitin ang NATSGO."
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
          "Dito makikita ang buses na malapit sa’yo kapag naka-on ang location."
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
          "Ito ang main navigation mo. Dito ka lilipat papunta sa Home, Track, Terminal, and Settings anytime."
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
          "Ito ang map kung saan makikita ang live or last known location ng buses."
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
          "Tap this para ibalik ang map sa current location mo kapag naka-on ang location."
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
          "Tap this para buksan ang bus list sa baba at makita ang nearby, all buses, terminal, and en route filters."
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
          "Dito mo makikita ang list ng buses, filters, status, distance, and ETA."
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
          "Dito mo makikita ang list ng available terminals."
        ),
        side: "bottom",
        align: "center",
      },
    },
    {
      route: "/terminal",
      element: '[data-tour="terminal-search"]',
      popover: {
        title: "Search Terminal",
        description: capyDescription(
          "Gamitin ito para mabilis hanapin ang terminal by name or city."
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
          "Tap a terminal card para makita ang details or open it on live tracking."
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
        }, 80);
      },

      onNextClick: async (_element, _step, options) => {
        stopCapyTalking();

        const nextIndex = options.state.activeIndex + 1;
        const nextStep = steps[nextIndex];

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
        localStorage.setItem(TOUR_KEY, "true");
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
    }, 200);
  }

  function resetTour() {
    localStorage.removeItem(TOUR_KEY);
  }

  return {
    startTour,
    resetTour,
  };
}
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

    /* Explore guide */
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
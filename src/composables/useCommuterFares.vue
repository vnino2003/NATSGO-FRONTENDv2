import { ref, computed } from "vue";
import api from "../services/api/http";

export function useCommuterFares() {
  const fares = ref([]);
  const promos = ref([]);
  const fareImage = ref(null);

  const loading = ref(false);
  const error = ref("");

  const hasFareImage = computed(() => !!fareImage.value?.url);

  function imageUrl(url) {
    if (!url) return "";

    // If backend already returns full URL
    if (url.startsWith("http")) return url;

    // If api baseURL is like http://localhost:3000/api,
    // remove /api so image becomes http://localhost:3000/uploads/fares/...
    const base = api.defaults.baseURL || "";
    const serverBase = base.replace(/\/api\/?$/, "");

    return `${serverBase}${url}`;
  }

  async function load() {
    loading.value = true;
    error.value = "";

    try {
      // 1. Try image first
      try {
        const imgRes = await api.get("/fares/image");
        fareImage.value = imgRes.data;
      } catch (imgErr) {
        // 404 means no uploaded fare image, so use table mode
        fareImage.value = null;
      }

      // 2. Always load promos
      const promoReq = api.get("/promotions");

      // 3. Load fare table only if no image
      const fareReq = hasFareImage.value
        ? Promise.resolve({ data: [] })
        : api.get("/fares");

      const [fRes, pRes] = await Promise.all([fareReq, promoReq]);

      fares.value = fRes.data;
      promos.value = pRes.data;
    } catch (err) {
      console.error("load commuter fares error:", err);
      error.value =
        err.response?.data?.message ||
        "Failed to load fares and promotions.";
    } finally {
      loading.value = false;
    }
  }

  function getDiscountedFare(row, key) {
    const base = Number(row.fares?.[key] || 0);

    const labelMap = {
      regular: "Regular",
      student: "Student",
      senior: "Senior Citizen",
      pwd: "PWD",
    };

    const routeLabel = `${row.from_name} → ${row.to_name}`;

    const promo = promos.value.find((p) => {
      if (p.status !== "active") return false;

      const okPassenger = p.appliesTo?.includes(labelMap[key]);

      const okRoute =
        !p.routes?.length ||
        p.routes.includes(routeLabel);

      return okPassenger && okRoute;
    });

    if (!promo) return base;

    let final = base;

    if (promo.type === "percent") {
      final = base - (base * Number(promo.value || 0)) / 100;
    }

    if (promo.type === "flat") {
      final = base - Number(promo.value || 0);
    }

    return Math.max(0, Number(final.toFixed(2)));
  }

  const formattedFares = computed(() =>
    fares.value.map((r) => ({
      route: `${r.from_name} → ${r.to_name}`,
      type: r.type,
      regular: getDiscountedFare(r, "regular"),
      student: getDiscountedFare(r, "student"),
      senior: getDiscountedFare(r, "senior"),
      pwd: getDiscountedFare(r, "pwd"),
    }))
  );

  const formattedPromos = computed(() =>
    promos.value
      .filter((p) => p.status === "active")
      .map((p) => ({
        id: p.id,
        title: p.name,
        desc: p.description,
        date: p.startDate,
        type:
          p.type === "percent"
            ? "blue"
            : p.type === "flat"
            ? "green"
            : "amber",
      }))
  );

  const fareImageUrl = computed(() => imageUrl(fareImage.value?.url));

  return {
    fares,
    promos,
    fareImage,
    fareImageUrl,
    hasFareImage,
    loading,
    error,
    formattedFares,
    formattedPromos,
    getDiscountedFare,
    load,
  };
}
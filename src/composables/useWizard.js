import { ref, computed } from "vue";

export function useWizard(steps = [], storageKey = "natsgo_wizard_completed") {
  const currentStep = ref(0);
  const isOpen = ref(false);

  const step = computed(() => steps[currentStep.value] || null);

  const isFirst = computed(() => currentStep.value === 0);
  const isLast = computed(() => currentStep.value === steps.length - 1);

  function hasCompletedWizard() {
    return localStorage.getItem(storageKey) === "true";
  }

  function startWizard(force = false) {
    if (!Array.isArray(steps) || steps.length === 0) return;

    const completed = hasCompletedWizard();

    if (!completed || force) {
      currentStep.value = 0;
      isOpen.value = true;
    }
  }

  function nextStep() {
    if (isLast.value) {
      finishWizard();
      return;
    }

    currentStep.value += 1;
  }

  function prevStep() {
    if (!isFirst.value) {
      currentStep.value -= 1;
    }
  }

  function finishWizard() {
    localStorage.setItem(storageKey, "true");
    isOpen.value = false;
  }

  function closeWizard() {
    isOpen.value = false;
  }

  function resetWizard() {
    localStorage.removeItem(storageKey);
    currentStep.value = 0;
    isOpen.value = true;
  }

  return {
    currentStep,
    isOpen,
    step,
    isFirst,
    isLast,
    hasCompletedWizard,
    startWizard,
    nextStep,
    prevStep,
    finishWizard,
    closeWizard,
    resetWizard,
  };
}
<template>
  <div class="home-tabs-wrap">

    <!-- Pills -->
    <div class="pill-tabs">
      <button
        class="pill-tab"
        :class="{ active: activeTab === 'explore' }"
        @click="scrollTo('explore')"
      >
        Explore
      </button>

      <button
        class="pill-tab"
        :class="{ active: activeTab === 'promos' }"
        @click="scrollTo('promos')"
      >
        Fare & Promos
      </button>

      <button
        class="pill-tab"
        :class="{ active: activeTab === 'updates' }"
        @click="scrollTo('updates')"
      >
        Updates
      </button>
    </div>

    <!-- Swipe container -->
    <div
      ref="container"
      class="tab-slider"
      @scroll.passive="onScroll"
    >
      <div class="tab-panel" data-tab="explore">
        <ExploreTab />
      </div>

      <div class="tab-panel" data-tab="promos">
        <PromosTab />
      </div>

      <div class="tab-panel" data-tab="updates">
        <UpdatesTab
          :items="announcements"
          @read="emit('read', $event)"
        />
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref } from "vue"
import ExploreTab from "./ExploreTab.vue"
import PromosTab from "./PromosTab.vue"
import UpdatesTab from "./UpdatesTab.vue"

defineProps({
  announcements: { type: Array, default: () => [] }
})

const emit = defineEmits(["read"])

const activeTab = ref("explore")
const container = ref(null)

function scrollTo(tab) {
  const el = container.value
  const index = ["explore", "promos", "updates"].indexOf(tab)

  activeTab.value = tab

  el.scrollTo({
    left: el.clientWidth * index,
    behavior: "smooth"
  })
}

function onScroll() {
  const el = container.value
  const index = Math.round(el.scrollLeft / el.clientWidth)

  activeTab.value = ["explore", "promos", "updates"][index]
}
</script>

<style scoped>
.home-tabs-wrap {
  margin-bottom: 8px;
}

/* pills */
.pill-tabs {
  display: flex;
  background: #f1f5f9;
  border-radius: 10px;
  padding: 3px;
  gap: 2px;
  margin-bottom: 12px;
}

.pill-tab {
  flex: 1;
  padding: 7px 4px;
  border: none;
  cursor: pointer;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 500;
  background: none;
  color: #6b7280;
}

.pill-tab.active {
  background: #fff;
  color: #1E88E5;
  box-shadow: 0 1px 3px rgba(0,0,0,0.08);
}

/* 🔥 swipe area */
.tab-slider {
  display: flex;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  scroll-behavior: smooth;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
}

.tab-slider::-webkit-scrollbar {
  display: none;
}

/* each tab */
.tab-panel {
  flex: 0 0 100%;
  scroll-snap-align: start;
  padding-right: 2px;
}
</style>
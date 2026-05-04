<!-- src/components/commuters/home/HomeTabs/ExploreTab.vue -->
<template>
  <div class="explore-tab">
    <div class="services-grid">
      <!-- Track -->
      <RouterLink to="/track-bus" class="service-card service-card--primary"   data-tour="service-track"
> 
        <div class="service-icon">
          <i class="fas fa-location-crosshairs"></i>
        </div>

        <div class="service-info">
          <p>Track</p>
          <span>Live bus location</span>
        </div>

        <i class="fas fa-chevron-right service-arrow"></i>
      </RouterLink>

      <!-- Terminal -->
      <RouterLink to="/terminal" class="service-card"   data-tour="service-terminal"
>
        <div class="service-icon">
          <i class="fas fa-bus-alt"></i>
        </div>

        <div class="service-info">
          <p>Terminal</p>
          <span>Bus terminal info</span>
        </div>

        <i class="fas fa-chevron-right service-arrow"></i>
      </RouterLink>

      <!-- Facebook -->
      <a
        class="service-card"
          data-tour="service-facebook"

        href="https://www.facebook.com/"
        target="_blank"
        rel="noopener noreferrer"
      >
        <div class="service-icon">
          <i class="fab fa-facebook-f"></i>
        </div>

        <div class="service-info">
          <p>Facebook</p>
          <span>News and updates</span>
        </div>

        <i class="fas fa-up-right-from-square service-arrow"></i>
      </a>

      <!-- Help / Guide -->
      <RouterLink to="/help" class="service-card"   data-tour="service-help"
>
        <div class="service-icon">
          <i class="fas fa-circle-question"></i>
        </div>

        <div class="service-info">
          <p>Help</p>
          <span>How to use NATSGO</span>
        </div>

        <i class="fas fa-chevron-right service-arrow"></i>
      </RouterLink>
    </div>

    <NearestBusesSection />
  </div>
</template>

<script setup>
import NearestBusesSection from "@/components/commuters/home/NearestBusCard.vue";
</script>

<style scoped>
.explore-tab {
  width: 100%;
  padding: 0 2px 12px;
}

.services-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  margin-bottom: 12px;
}

.service-card {
  position: relative;
  min-height: 66px;
  padding: 12px 10px;
  border-radius: 13px;
  border: 1px solid rgba(15, 23, 42, 0.08);
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 5px 14px rgba(15, 23, 42, 0.06);
  text-decoration: none;
  color: #0f172a;
  display: flex;
  align-items: center;
  gap: 9px;
  overflow: hidden;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transform: translateY(0) scale(1);
  transition:
    transform 0.22s cubic-bezier(0.2, 0.8, 0.2, 1),
    box-shadow 0.22s ease,
    border-color 0.22s ease,
    background 0.22s ease;
}

.service-card::before {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(
    135deg,
    rgba(37, 99, 235, 0.08),
    rgba(6, 182, 212, 0.04)
  );
  opacity: 0;
  transition: opacity 0.22s ease;
}

.service-card:hover {
  transform: translateY(-2px) scale(1.01);
  border-color: rgba(37, 99, 235, 0.22);
  box-shadow: 0 8px 20px rgba(15, 23, 42, 0.1);
}

.service-card:hover::before {
  opacity: 1;
}

.service-card:active {
  transform: translateY(0) scale(0.97);
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.08);
}

.service-card:active::before {
  opacity: 1;
}

.service-card--primary {
  background: linear-gradient(135deg, #ffffff, #f0f8ff);
  border-color: rgba(37, 99, 235, 0.18);
}

.service-card--primary .service-icon {
  background: rgba(37, 99, 235, 0.12);
  color: #1677f2;
}

.service-icon {
  position: relative;
  z-index: 1;
  width: 32px;
  height: 32px;
  flex: 0 0 32px;
  border-radius: 11px;
  background: rgba(37, 99, 235, 0.1);
  color: #1677f2;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 15px;
  transition:
    transform 0.22s ease,
    background 0.22s ease;
}

.service-card:hover .service-icon {
  transform: scale(1.06);
}

.service-card:active .service-icon {
  transform: scale(0.96);
}

.service-info {
  position: relative;
  z-index: 1;
  min-width: 0;
  flex: 1;
}

.service-info p {
  margin: 0;
  font-size: 11px;
  font-weight: 800;
  color: #0f172a;
  line-height: 1.15;
}

.service-info span {
  display: block;
  margin-top: 3px;
  font-size: 9px;
  font-weight: 600;
  color: #64748b;
  line-height: 1.15;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.service-arrow {
  position: relative;
  z-index: 1;
  font-size: 9px;
  color: #94a3b8;
  flex: 0 0 auto;
  transition:
    transform 0.22s ease,
    color 0.22s ease;
}

.service-card:hover .service-arrow {
  transform: translateX(2px);
  color: #2563eb;
}

/* Smaller phones */
@media (max-width: 360px) {
  .services-grid {
    gap: 8px;
  }

  .service-card {
    min-height: 62px;
    padding: 10px 8px;
    gap: 8px;
  }

  .service-icon {
    width: 29px;
    height: 29px;
    flex-basis: 29px;
    font-size: 13px;
  }

  .service-info p {
    font-size: 10px;
  }

  .service-info span {
    font-size: 8px;
  }
}
</style>
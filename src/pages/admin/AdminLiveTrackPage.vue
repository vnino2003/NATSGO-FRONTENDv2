<!-- src/pages/admin/LiveTrackingPage.vue -->
<template>
  <div class="lt">
    <!-- Header -->
    <div class="lt-header">
      <div class="lt-header-left">
        <div class="lt-title-row">
          <h1 class="lt-title">Live Tracking</h1>
          <span class="lt-live-badge">
            <span class="lt-live-dot"></span>
            Live
          </span>
        </div>
        <p class="lt-subtitle">Real-time bus monitoring · GPS · Terminals · Analytics</p>
      </div>

      <div class="lt-header-right">
        <button class="lt-btn-ghost" @click="refreshOnce">
          <i class="fas fa-rotate"></i>
          Refresh
        </button>

        <button v-if="view === 'tracking'" class="lt-btn-primary" @click="fitAll">
          <i class="fas fa-location-crosshairs"></i>
          Fit All
        </button>
      </div>
    </div>

    <!-- Summary cards -->
    <div class="lt-summary">
      <div class="lt-stat">
        <div class="lt-stat-value">{{ uiBuses.length }}</div>
        <div class="lt-stat-label">Total Buses</div>
      </div>

      <div class="lt-stat lt-stat--green">
        <div class="lt-stat-value">{{ countBy('Online') }}</div>
        <div class="lt-stat-label">Online</div>
      </div>

      <div class="lt-stat lt-stat--amber">
        <div class="lt-stat-value">{{ countBy('Warning') }}</div>
        <div class="lt-stat-label">Warning</div>
      </div>

      <div class="lt-stat lt-stat--red">
        <div class="lt-stat-value">{{ countBy('Offline') }}</div>
        <div class="lt-stat-label">Offline</div>
      </div>

      <div class="lt-stat lt-stat--blue">
        <div class="lt-stat-value">{{ (terminals || []).length }}</div>
        <div class="lt-stat-label">Terminals</div>
      </div>
    </div>

    <!-- Tabs -->
    <div class="lt-tabs">
      <button
        class="lt-tab"
        :class="{ 'lt-tab--active': view === 'tracking' }"
        @click="view = 'tracking'"
      >
        <i class="fas fa-location-dot"></i>
        Tracking
      </button>

      <button
        class="lt-tab"
        :class="{ 'lt-tab--active': view === 'analytics' }"
        @click="view = 'analytics'"
      >
        <i class="fas fa-chart-line"></i>
        Analytics
      </button>
    </div>

    <!-- Tracking View -->
    <div class="lt-grid" v-if="view === 'tracking'">
      <!-- Map -->
      <div class="lt-map-card">
        <div class="lt-card-head">
          <div class="lt-card-title">
            <i class="fas fa-map"></i>
            Map
          </div>

          <div class="lt-map-controls">
            <button class="lt-icon-btn" @click="zoomIn" title="Zoom in">
              <i class="fas fa-plus"></i>
            </button>

            <button class="lt-icon-btn" @click="zoomOut" title="Zoom out">
              <i class="fas fa-minus"></i>
            </button>

            <button class="lt-icon-btn" @click="centerOnMe" title="My location">
              <i class="fas fa-location-arrow"></i>
            </button>
          </div>
        </div>

        <div class="lt-map-canvas" ref="mapEl">
          <div class="lt-legend">
            <div class="lt-legend-item">
              <span class="lt-dot lt-dot--green"></span>
              Online
            </div>

            <div class="lt-legend-item">
              <span class="lt-dot lt-dot--amber"></span>
              Warning
            </div>

            <div class="lt-legend-item">
              <span class="lt-dot lt-dot--red"></span>
              Offline
            </div>

            <div class="lt-legend-sep"></div>

            <div class="lt-legend-item">
              <span class="lt-dot lt-dot--blue"></span>
              Terminal
            </div>

            <div class="lt-legend-item">
              <span class="lt-dot lt-dot--range"></span>
              Range ({{ TERMINAL_RANGE_M }}m)
            </div>
          </div>
        </div>
      </div>

      <!-- Side panel -->
      <div class="lt-panel-card">
        <div class="lt-card-head">
          <div class="lt-card-title">
            <i
              class="fas"
              :class="panelView === 'buses' ? 'fa-satellite-dish' : 'fa-building'"
            ></i>
            {{ panelView === 'buses' ? 'Tracked Buses' : 'Terminals' }}
            <span class="lt-badge">
              {{ panelView === 'buses' ? filteredBuses.length : filteredTerminals.length }}
            </span>
          </div>

          <div class="lt-panel-switch">
            <button
              class="lt-switch-btn"
              :class="{ 'lt-switch-btn--active': panelView === 'buses' }"
              @click="panelView = 'buses'"
            >
              <i class="fas fa-bus"></i>
              Buses
            </button>

            <button
              class="lt-switch-btn"
              :class="{ 'lt-switch-btn--active': panelView === 'terminals' }"
              @click="panelView = 'terminals'"
            >
              <i class="fas fa-building"></i>
              Terminals
            </button>
          </div>
        </div>

        <!-- Search / filters -->
        <div class="lt-panel-tools">
          <div class="lt-search">
            <i class="fas fa-magnifying-glass lt-search-icon"></i>

            <input
              v-if="panelView === 'buses'"
              v-model="q"
              class="lt-search-input"
              type="text"
              placeholder="Search bus..."
            />

            <input
              v-else
              v-model="tq"
              class="lt-search-input"
              type="text"
              placeholder="Search terminal..."
            />

            <button
              v-if="panelView === 'buses' ? q : tq"
              class="lt-search-clear"
              @click="panelView === 'buses' ? (q = '') : (tq = '')"
            >
              <i class="fas fa-xmark"></i>
            </button>
          </div>

          <div class="lt-filters" v-if="panelView === 'buses'">
            <button
              class="lt-pill"
              :class="{ 'lt-pill--active': filter === 'all' }"
              @click="filter = 'all'"
            >
              All
              <span class="lt-pill-count">{{ uiBuses.length }}</span>
            </button>

            <button
              class="lt-pill"
              :class="{ 'lt-pill--active': filter === 'online' }"
              @click="filter = 'online'"
            >
              Online
            </button>

            <button
              class="lt-pill"
              :class="{ 'lt-pill--active': filter === 'warning' }"
              @click="filter = 'warning'"
            >
              Warning
            </button>

            <button
              class="lt-pill"
              :class="{ 'lt-pill--active': filter === 'offline' }"
              @click="filter = 'offline'"
            >
              Offline
            </button>
          </div>

          <div class="lt-term-hint" v-else>
            <i class="fas fa-circle-info"></i>
            Click a terminal to show its range on the map
          </div>
        </div>

        <!-- Bus list -->
        <div class="lt-list" v-if="panelView === 'buses'">
          <button
            v-for="b in filteredBuses"
            :key="b.id"
            class="lt-bus-item"
            :class="{ 'lt-bus-item--active': selectedBus?.id === b.id }"
            @click="selectBus(b)"
          >
            <div class="lt-bus-item-top">
              <div class="lt-bus-item-left">
                <div class="lt-bus-code">{{ b.code }}</div>

                <div class="lt-bus-meta">
                  <span class="lt-mono">{{ b.plate || '—' }}</span>
                  <span class="lt-sep">·</span>
                  <span>{{ b.route || 'Unknown route' }}</span>
                  <span class="lt-sep">·</span>
                  <span class="lt-pax">
                    <i class="fas fa-users"></i>
                    {{ b.passengerCount }}/{{ b.capacity || '—' }}
                    <span v-if="b.occPct != null">({{ b.occPct }}%)</span>
                  </span>
                </div>
              </div>

              <div class="lt-bus-item-right">
                <div class="lt-speed">
                  <span class="lt-speed-num">{{ b.speed }}</span>
                  <span class="lt-speed-unit">km/h</span>
                </div>

                <span
                  class="lt-status-chip"
                  :class="`lt-status-chip--${statusKey(b.status)}`"
                >
                  <i class="fas" :class="statusIcon(b.status)"></i>
                  {{ b.status }}
                </span>
              </div>
            </div>

            <div class="lt-bus-item-bottom">
              <span class="lt-meta-item">
                <i class="fas fa-location-crosshairs"></i>
                {{ safeFixed(b.lat) }}, {{ safeFixed(b.lng) }}
              </span>

              <span class="lt-sep">·</span>

              <span class="lt-meta-item">
                <i class="fas fa-road"></i>
                {{ b.terminalAt ? 'at terminal' : 'on road' }}
                <span v-if="b.distM != null"> · {{ Math.round(b.distM) }}m</span>
              </span>

              <span class="lt-sep">·</span>

              <span class="lt-meta-item">
                <i class="fas fa-signal"></i>
                {{ b.signal || '—' }}
              </span>

              <span class="lt-sep">·</span>

              <span class="lt-meta-item">
                <i class="fas fa-clock"></i>
                {{ b.lastSeen || '—' }}
              </span>
            </div>
          </button>

          <div v-if="!filteredBuses.length" class="lt-empty">
            <i class="fas fa-bus"></i>
            <p>No buses found</p>
            <small>Try another keyword or filter</small>
          </div>
        </div>

        <!-- Terminal list -->
        <div class="lt-list" v-else>
          <button
            v-for="t in filteredTerminals"
            :key="t.terminal_id"
            class="lt-term-item"
            :class="{ 'lt-term-item--active': selectedTerminal?.terminal_id === t.terminal_id }"
            @click="selectTerminal(t)"
          >
            <div class="lt-term-item-top">
              <div class="lt-term-left">
                <div class="lt-term-icon-wrap">
                  <i class="fas fa-building"></i>
                </div>

                <div class="lt-term-info">
                  <div class="lt-term-name-row">
                    <span class="lt-term-name">{{ t.terminal_name || 'Terminal' }}</span>
                    <span class="lt-term-id-badge">ID {{ t.terminal_id }}</span>
                  </div>

                  <div class="lt-term-city">
                    <i class="fas fa-city"></i>
                    {{ t.city || '—' }}
                  </div>
                </div>
              </div>

              <span class="lt-term-bus-count">
                <i class="fas fa-bus"></i>
                {{ Number(t.bus_count ?? 0) }}
              </span>
            </div>

            <div class="lt-term-item-bottom">
              <span class="lt-meta-item">
                <i class="fas fa-location-crosshairs"></i>
                {{ safeFixed(t.lat) }}, {{ safeFixed(t.lng) }}
              </span>

              <span class="lt-sep">·</span>

              <span class="lt-meta-item">
                <i class="fas fa-bullseye"></i>
                {{ TERMINAL_RANGE_M }}m range
              </span>

              <span class="lt-sep">·</span>

              <span class="lt-meta-item">
                <i class="fas fa-clock"></i>
                {{ fmtTime(t.available_from) }}–{{ fmtTime(t.available_to) }}
              </span>
            </div>
          </button>

          <div v-if="!filteredTerminals.length" class="lt-empty">
            <i class="fas fa-building"></i>
            <p>No terminals found</p>
            <small>Try another keyword</small>
          </div>
        </div>
      </div>
    </div>

    <!-- Analytics View -->
    <div v-else class="an">
      <!-- Analytics Header -->
      <div class="an-header">
        <div class="an-header-left">
          <div class="an-header-title">
            <i class="fas fa-chart-line"></i>
            Fleet Analytics
          </div>

          <p class="an-header-sub">
            Live operational analytics · Based on current fleet, terminal, GPS, and passenger sensor data
          </p>
        </div>

        <div class="an-period-pills">
          <button
            v-for="p in periods"
            :key="p.key"
            class="an-period-pill"
            :class="{ 'an-period-pill--active': analyticsPeriod === p.key }"
            @click="analyticsPeriod = p.key"
          >
            {{ p.label }}
          </button>
        </div>
      </div>

      <div v-if="analyticsError" class="an-alert an-alert--error">
        <i class="fas fa-triangle-exclamation"></i>
        {{ analyticsError }}
      </div>

      <div v-if="analyticsLoading" class="an-loading">
        <i class="fas fa-circle-notch fa-spin"></i>
        Loading analytics...
      </div>

      <!-- KPI Row -->
      <div class="an-kpi-row">
        <div class="an-kpi an-kpi--blue">
          <div class="an-kpi-icon">
            <i class="fas fa-users"></i>
          </div>

          <div class="an-kpi-body">
            <div class="an-kpi-value">
              {{ analyticsSummary.currentPassengers.toLocaleString() }}
            </div>
            <div class="an-kpi-label">Current Passengers</div>
            <div class="an-kpi-trend an-kpi-trend--neutral">
              <i class="fas fa-bus"></i>
              Live ToF count
            </div>
          </div>
        </div>

        <div class="an-kpi an-kpi--green">
          <div class="an-kpi-icon">
            <i class="fas fa-person-walking-arrow-right"></i>
          </div>

          <div class="an-kpi-body">
            <div class="an-kpi-value">
              {{ analyticsSummary.totalPassengers.toLocaleString() }}
            </div>
            <div class="an-kpi-label">Passenger Entries</div>
            <div class="an-kpi-trend an-kpi-trend--neutral">
              <i class="fas fa-clock"></i>
              {{ periodLabel }}
            </div>
          </div>
        </div>

        <div class="an-kpi an-kpi--amber">
          <div class="an-kpi-icon">
            <i class="fas fa-gauge-high"></i>
          </div>

          <div class="an-kpi-body">
            <div class="an-kpi-value">
              {{ analyticsSummary.avgSpeed }}
              <span class="an-kpi-unit">km/h</span>
            </div>
            <div class="an-kpi-label">Average Speed</div>
            <div class="an-kpi-trend an-kpi-trend--neutral">
              <i class="fas fa-satellite-dish"></i>
              Current GPS logs
            </div>
          </div>
        </div>

        <div class="an-kpi an-kpi--purple">
          <div class="an-kpi-icon">
            <i class="fas fa-percent"></i>
          </div>

          <div class="an-kpi-body">
            <div class="an-kpi-value">
              {{ analyticsSummary.avgOccupancy }}
              <span class="an-kpi-unit">%</span>
            </div>
            <div class="an-kpi-label">Avg Occupancy</div>
            <div class="an-kpi-trend an-kpi-trend--neutral">
              <i class="fas fa-users"></i>
              Passenger / capacity
            </div>
          </div>
        </div>
      </div>

      <!-- Mini Row -->
      <div class="an-mini-row">
        <div class="an-mini-card">
          <span>Total Buses</span>
          <strong>{{ analyticsSummary.totalBuses }}</strong>
        </div>

        <div class="an-mini-card an-mini-card--green">
          <span>Online</span>
          <strong>{{ analyticsSummary.onlineBuses }}</strong>
        </div>

        <div class="an-mini-card an-mini-card--amber">
          <span>Warning</span>
          <strong>{{ analyticsSummary.warningBuses }}</strong>
        </div>

        <div class="an-mini-card an-mini-card--red">
          <span>Offline</span>
          <strong>{{ analyticsSummary.offlineBuses }}</strong>
        </div>

        <div class="an-mini-card an-mini-card--blue">
          <span>Terminal Routes</span>
          <strong>{{ analyticsSummary.activeRoutes }}</strong>
        </div>
      </div>

      <!-- Row 1 -->
      <div class="an-row-2">
        <!-- Passenger Volume -->
        <div class="an-card an-card--wide">
          <div class="an-card-head">
            <div class="an-card-title">
              <i class="fas fa-chart-column"></i>
              Passenger Volume by Hour
            </div>

            <div class="an-card-meta">
              Peak: {{ analyticsData.peakHour?.label || 'No data' }}
            </div>
          </div>

          <div class="an-chart-area">
            <div class="an-bar-chart">
              <div
                v-for="h in analyticsData.hourlyPassengers"
                :key="h.hour"
                class="an-bar-col"
              >
                <div
                  class="an-bar-label-top"
                  v-if="h.count > 0 && h.count === analyticsData.maxHourly"
                >
                  <span class="an-peak-badge">Peak</span>
                </div>

                <div class="an-bar-wrap">
                  <div
                    class="an-bar"
                    :class="{ 'an-bar--peak': h.count > 0 && h.count === analyticsData.maxHourly }"
                    :style="{
                      height: analyticsData.maxHourly
                        ? (h.count / analyticsData.maxHourly * 100) + '%'
                        : '0%',
                    }"
                    :title="`${h.label} — ${h.count} passenger entries`"
                  ></div>
                </div>

                <div class="an-bar-x">{{ h.hour }}</div>
              </div>
            </div>

            <div class="an-bar-y-labels">
              <span>{{ analyticsData.maxHourly }}</span>
              <span>{{ Math.round(analyticsData.maxHourly * 0.75) }}</span>
              <span>{{ Math.round(analyticsData.maxHourly * 0.5) }}</span>
              <span>{{ Math.round(analyticsData.maxHourly * 0.25) }}</span>
              <span>0</span>
            </div>
          </div>

          <div class="an-chart-caption">
            <i class="fas fa-circle-info"></i>
            Based on ToF passenger entry events for the selected period
          </div>
        </div>

        <!-- Fleet Status -->
        <div class="an-card">
          <div class="an-card-head">
            <div class="an-card-title">
              <i class="fas fa-circle-half-stroke"></i>
              Fleet Status
            </div>
          </div>

          <div class="an-donut-wrap">
            <svg class="an-donut-svg" viewBox="0 0 120 120">
              <circle
                cx="60"
                cy="60"
                r="48"
                fill="none"
                stroke="#f1f5f9"
                stroke-width="18"
              />

              <circle
                cx="60"
                cy="60"
                r="48"
                fill="none"
                stroke="#10b981"
                stroke-width="18"
                :stroke-dasharray="donutDash(analyticsFleetStatus.online)"
                stroke-dashoffset="75.4"
                stroke-linecap="round"
              />

              <circle
                cx="60"
                cy="60"
                r="48"
                fill="none"
                stroke="#f59e0b"
                stroke-width="18"
                :stroke-dasharray="donutDash(analyticsFleetStatus.warning)"
                :stroke-dashoffset="donutOffset(analyticsFleetStatus.online)"
                stroke-linecap="round"
              />

              <circle
                cx="60"
                cy="60"
                r="48"
                fill="none"
                stroke="#ef4444"
                stroke-width="18"
                :stroke-dasharray="donutDash(analyticsFleetStatus.offline)"
                :stroke-dashoffset="
                  donutOffset(analyticsFleetStatus.online + analyticsFleetStatus.warning)
                "
                stroke-linecap="round"
              />

              <circle
                cx="60"
                cy="60"
                r="48"
                fill="none"
                stroke="#94a3b8"
                stroke-width="18"
                :stroke-dasharray="donutDash(analyticsFleetStatus.noDevice)"
                :stroke-dashoffset="
                  donutOffset(
                    analyticsFleetStatus.online +
                      analyticsFleetStatus.warning +
                      analyticsFleetStatus.offline
                  )
                "
                stroke-linecap="round"
              />

              <text x="60" y="56" text-anchor="middle" class="an-donut-num">
                {{ analyticsTotalFleet }}
              </text>

              <text x="60" y="70" text-anchor="middle" class="an-donut-sub">
                Buses
              </text>
            </svg>
          </div>

          <div class="an-donut-legend">
            <div class="an-dl-item">
              <span class="an-dl-dot an-dl-dot--green"></span>
              <span class="an-dl-label">Online</span>
              <span class="an-dl-val">{{ analyticsFleetStatus.online }}</span>
              <div class="an-dl-bar-wrap">
                <div
                  class="an-dl-bar an-dl-bar--green"
                  :style="{
                    width:
                      (analyticsFleetStatus.online / Math.max(analyticsTotalFleet, 1)) *
                        100 +
                      '%',
                  }"
                ></div>
              </div>
            </div>

            <div class="an-dl-item">
              <span class="an-dl-dot an-dl-dot--amber"></span>
              <span class="an-dl-label">Warning</span>
              <span class="an-dl-val">{{ analyticsFleetStatus.warning }}</span>
              <div class="an-dl-bar-wrap">
                <div
                  class="an-dl-bar an-dl-bar--amber"
                  :style="{
                    width:
                      (analyticsFleetStatus.warning / Math.max(analyticsTotalFleet, 1)) *
                        100 +
                      '%',
                  }"
                ></div>
              </div>
            </div>

            <div class="an-dl-item">
              <span class="an-dl-dot an-dl-dot--red"></span>
              <span class="an-dl-label">Offline</span>
              <span class="an-dl-val">{{ analyticsFleetStatus.offline }}</span>
              <div class="an-dl-bar-wrap">
                <div
                  class="an-dl-bar an-dl-bar--red"
                  :style="{
                    width:
                      (analyticsFleetStatus.offline / Math.max(analyticsTotalFleet, 1)) *
                        100 +
                      '%',
                  }"
                ></div>
              </div>
            </div>

            <div class="an-dl-item">
              <span class="an-dl-dot an-dl-dot--gray"></span>
              <span class="an-dl-label">No Device</span>
              <span class="an-dl-val">{{ analyticsFleetStatus.noDevice }}</span>
              <div class="an-dl-bar-wrap">
                <div
                  class="an-dl-bar an-dl-bar--gray"
                  :style="{
                    width:
                      (analyticsFleetStatus.noDevice / Math.max(analyticsTotalFleet, 1)) *
                        100 +
                      '%',
                  }"
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Row 2 -->
      <div class="an-row-2">
        <!-- Terminal Route Performance -->
        <div class="an-card">
          <div class="an-card-head">
            <div class="an-card-title">
              <i class="fas fa-ranking-star"></i>
              Terminal Route Performance
            </div>

            <div class="an-card-meta">Current terminal → target terminal</div>
          </div>

          <div class="an-route-list">
            <div
              v-for="(r, i) in analyticsData.routePerformance"
              :key="r.key || r.route"
              class="an-route-row"
            >
              <div class="an-route-rank" :class="`an-rank--${Math.min(i + 1, 4)}`">
                {{ i + 1 }}
              </div>

              <div class="an-route-body">
                <div class="an-route-top">
                  <span class="an-route-name">{{ r.route }}</span>
                  <span class="an-route-pax">
                    <i class="fas fa-users"></i>
                    {{ r.totalPassengers.toLocaleString() }}
                  </span>
                </div>

                <div class="an-route-bar-wrap">
                  <div
                    class="an-route-bar"
                    :style="{
                      width: analyticsData.routePerformance[0]?.totalPassengers
                        ? (r.totalPassengers /
                            analyticsData.routePerformance[0].totalPassengers) *
                            100 +
                          '%'
                        : r.totalBuses
                          ? '20%'
                          : '0%',
                    }"
                  ></div>
                </div>

                <div class="an-route-meta">
                  <span><i class="fas fa-bus"></i> {{ r.totalBuses }} buses</span>
                  <span><i class="fas fa-road"></i> {{ r.enRouteBuses }} en route</span>
                  <span><i class="fas fa-building"></i> {{ r.atTerminalBuses }} terminal</span>
                  <span
                    class="an-occ-pill"
                    :class="
                      r.occupancy >= 80
                        ? 'an-occ--high'
                        : r.occupancy >= 50
                          ? 'an-occ--mid'
                          : 'an-occ--low'
                    "
                  >
                    {{ r.occupancy }}% occ.
                  </span>
                </div>
              </div>
            </div>

            <div v-if="!analyticsData.routePerformance.length" class="an-empty">
              <i class="fas fa-route"></i>
              <p>No active terminal routes yet</p>
              <small>
                Route analytics will appear once buses have current and target terminal
                states.
              </small>
            </div>
          </div>
        </div>

        <!-- Device Attention -->
        <div class="an-card">
          <div class="an-card-head">
            <div class="an-card-title">
              <i class="fas fa-triangle-exclamation"></i>
              Device Attention
            </div>

            <div class="an-card-meta">Current issues</div>
          </div>

          <div class="an-offline-list">
            <div
              v-for="b in analyticsData.deviceAttention"
              :key="`${b.busId}-${b.reason}`"
              class="an-offline-row"
            >
              <div class="an-offline-left">
                <div
                  class="an-offline-icon"
                  :class="
                    b.status === 'offline' || b.status === 'no_device'
                      ? 'an-offline-icon--red'
                      : 'an-offline-icon--amber'
                  "
                >
                  <i class="fas fa-bus"></i>
                </div>

                <div>
                  <div class="an-offline-code">{{ b.code }}</div>
                  <div class="an-offline-plate">{{ b.plate || '—' }}</div>
                </div>
              </div>

              <div class="an-offline-right">
                <span
                  class="an-offline-count"
                  :class="
                    b.status === 'offline' || b.status === 'no_device'
                      ? 'an-offline-count--red'
                      : ''
                  "
                >
                  {{ b.reason }}
                </span>
              </div>
            </div>

            <div v-if="!analyticsData.deviceAttention.length" class="an-empty">
              <i class="fas fa-circle-check"></i>
              <p>No device issues</p>
              <small>All buses look healthy right now.</small>
            </div>
          </div>
        </div>
      </div>

      <!-- Row 3 -->
      <div class="an-row-2">
        <!-- Terminal Utilization -->
        <div class="an-card an-card--wide">
          <div class="an-card-head">
            <div class="an-card-title">
              <i class="fas fa-building-columns"></i>
              Terminal Utilization
            </div>

            <div class="an-card-meta">Inside + incoming buses</div>
          </div>

          <div class="an-terminal-grid">
            <div
              v-for="t in analyticsData.terminalUtilization"
              :key="t.id"
              class="an-term-util-card"
            >
              <div class="an-tuc-icon">
                <i class="fas fa-building"></i>
              </div>

              <div class="an-tuc-name">{{ t.name }}</div>
              <div class="an-tuc-city">{{ t.city }}</div>

              <div class="an-tuc-gauge-wrap">
                <div
                  class="an-tuc-gauge"
                  :class="
                    t.pct >= 80
                      ? 'an-tuc-gauge--high'
                      : t.pct >= 40
                        ? 'an-tuc-gauge--mid'
                        : 'an-tuc-gauge--low'
                  "
                  :style="{ width: t.pct + '%' }"
                ></div>
              </div>

              <div class="an-tuc-stats">
                <span class="an-tuc-count">{{ t.busesInside }} inside</span>
                <span class="an-tuc-pct">{{ t.busesIncoming }} incoming</span>
              </div>
            </div>

            <div v-if="!analyticsData.terminalUtilization.length" class="an-empty">
              <i class="fas fa-building"></i>
              <p>No terminal data</p>
              <small>Add terminals or update bus terminal states.</small>
            </div>
          </div>
        </div>

        <!-- Speed Distribution -->
        <div class="an-card">
          <div class="an-card-head">
            <div class="an-card-title">
              <i class="fas fa-gauge-simple-high"></i>
              Speed Distribution
            </div>

            <div class="an-card-meta">Current GPS speed</div>
          </div>

          <div class="an-speed-grid">
            <div
              v-for="s in analyticsData.speedDistribution"
              :key="s.label"
              class="an-speed-cell"
              :class="s.cls"
              :title="`${s.label}: ${s.count} buses`"
            >
              <div class="an-speed-cell-val">{{ s.count }}</div>
              <div class="an-speed-cell-label">{{ s.range }}</div>
            </div>
          </div>

          <div class="an-speed-legend">
            <span class="an-sl-item an-sl--low">
              <i class="fas fa-square"></i>
              Stopped
            </span>

            <span class="an-sl-item an-sl--slow">
              <i class="fas fa-square"></i>
              Slow
            </span>

            <span class="an-sl-item an-sl--med">
              <i class="fas fa-square"></i>
              Normal
            </span>

            <span class="an-sl-item an-sl--fast">
              <i class="fas fa-square"></i>
              Fast
            </span>
          </div>
        </div>
      </div>

      <!-- Insights -->
      <div class="an-insights">
        <div class="an-insights-header">
          <i class="fas fa-lightbulb"></i>
          Key Insights
        </div>

        <div class="an-insights-grid">
          <div
            v-for="item in analyticsData.insights"
            :key="`${item.title}-${item.message}`"
            class="an-insight-card"
            :class="insightClass(item.type)"
          >
            <i class="fas" :class="item.icon || 'fa-circle-info'"></i>

            <div class="an-insight-text">
              <strong>{{ item.title }}:</strong>
              {{ item.message }}
            </div>
          </div>

          <div
            v-if="!analyticsData.insights.length"
            class="an-insight-card an-insight--blue"
          >
            <i class="fas fa-circle-info"></i>

            <div class="an-insight-text">
              <strong>No insights yet:</strong>
              Analytics will generate insights once fleet data is available.
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Floating selected bus -->
    <Transition name="lt-float">
      <div v-if="selectedBus" class="lt-float">
        <div class="lt-float-left">
          <div class="lt-float-title">
            <i class="fas fa-bus"></i>
            {{ selectedBus.code }}

            <span
              class="lt-status-chip"
              :class="`lt-status-chip--${statusKey(selectedBus.status)}`"
            >
              <i class="fas" :class="statusIcon(selectedBus.status)"></i>
              {{ selectedBus.status }}
            </span>
          </div>

          <div class="lt-float-sub">
            <span class="lt-mono">{{ selectedBus.plate }}</span>
            <span class="lt-sep">·</span>
            {{ selectedBus.route || 'Unknown route' }}
            <span class="lt-sep">·</span>
            <i class="fas fa-users"></i>
            {{ selectedBus.passengerCount }}/{{ selectedBus.capacity || '—' }}
            <span v-if="selectedBus.occPct != null">({{ selectedBus.occPct }}%)</span>
            <span class="lt-sep">·</span>
            {{ selectedBus.terminalAt ? 'at terminal' : 'on road' }}
            <span v-if="selectedBus.distM != null">
              · {{ Math.round(selectedBus.distM) }}m
            </span>
          </div>
        </div>

        <div class="lt-float-actions">
          <button class="lt-btn-ghost lt-btn-sm" @click="centerOnSelectedBus">
            <i class="fas fa-crosshairs"></i>
            Center
          </button>

          <button class="lt-btn-danger lt-btn-sm" @click="clearSelected">
            <i class="fas fa-xmark"></i>
            Close
          </button>
        </div>
      </div>
    </Transition>

    <!-- Floating selected terminal -->
    <Transition name="lt-float">
      <div v-if="selectedTerminal" class="lt-float lt-float--terminal">
        <div class="lt-float-left">
          <div class="lt-float-title">
            <i class="fas fa-building"></i>
            {{ selectedTerminal.terminal_name || 'Terminal' }}

            <span class="lt-term-bus-count">
              <i class="fas fa-bus"></i>
              {{ Number(selectedTerminal.bus_count ?? 0) }}
            </span>
          </div>

          <div class="lt-float-sub">
            {{ selectedTerminal.city || '—' }}
            <span class="lt-sep">·</span>
            <span class="lt-mono">
              {{ safeFixed(selectedTerminal.lat) }},
              {{ safeFixed(selectedTerminal.lng) }}
            </span>
            <span class="lt-sep">·</span>
            {{ fmtTime(selectedTerminal.available_from) }}–{{
              fmtTime(selectedTerminal.available_to)
            }}
            <span class="lt-sep">·</span>
            <i class="fas fa-bullseye"></i>
            {{ TERMINAL_RANGE_M }}m range
          </div>
        </div>

        <div class="lt-float-actions">
          <button class="lt-btn-ghost lt-btn-sm" @click="centerOnSelectedTerminal">
            <i class="fas fa-crosshairs"></i>
            Center
          </button>

          <button class="lt-btn-danger lt-btn-sm" @click="clearSelected">
            <i class="fas fa-xmark"></i>
            Close
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from "vue";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import { useAdminLiveBuses } from "@/composables/useAdminLiveBuses";
import { useTerminals } from "@/composables/useTerminal";
import { getAdminAnalyticsDashboard } from "@/services/api/adminAnalyticsService";

const view = ref("tracking");
const panelView = ref("buses");

const q = ref("");
const tq = ref("");
const filter = ref("all");

const selectedBus = ref(null);
const selectedTerminal = ref(null);

const mapEl = ref(null);
let map = null;
let myMarker = null;

const busMarkers = new Map();
const terminalMarkers = new Map();

const FALLBACK = { lat: 12.8797, lng: 121.774 };
const TERMINAL_RANGE_M = 60;

let terminalRangeCircle = null;
let terminalPoll = null;

const analyticsPeriod = ref("today");
const periods = [
  { key: "today", label: "Today" },
  { key: "week", label: "This Week" },
  { key: "month", label: "This Month" },
];

const analyticsLoading = ref(false);
const analyticsError = ref("");

const analytics = ref({
  summary: {
    totalBuses: 0,
    onlineBuses: 0,
    warningBuses: 0,
    offlineBuses: 0,
    noDeviceBuses: 0,
    busesAtTerminal: 0,
    busesEnRoute: 0,
    currentPassengers: 0,
    totalPassengers: 0,
    avgSpeed: 0,
    avgOccupancy: 0,
    activeRoutes: 0,
  },
  fleetStatus: {
    online: 0,
    warning: 0,
    offline: 0,
    noDevice: 0,
  },
  hourlyPassengers: [],
  maxHourly: 0,
  peakHour: {
    hour: "—",
    label: "No data",
    count: 0,
  },
  routePerformance: [],
  speedDistribution: [],
  terminalUtilization: [],
  deviceAttention: [],
  insights: [],
});

const { buses, start, stop, fetchOnce } = useAdminLiveBuses({ intervalMs: 2000 });
const { rows: terminals, fetchTerminals } = useTerminals();

const uiBuses = computed(() => buses.value || []);

const analyticsData = computed(() => analytics.value);
const analyticsSummary = computed(() => analytics.value.summary || {});
const analyticsFleetStatus = computed(() => analytics.value.fleetStatus || {});

const periodLabel = computed(() => {
  if (analyticsPeriod.value === "week") return "This week";
  if (analyticsPeriod.value === "month") return "This month";
  return "Today";
});

const analyticsTotalFleet = computed(() => {
  const fs = analyticsFleetStatus.value;

  return (
    Number(fs.online || 0) +
    Number(fs.warning || 0) +
    Number(fs.offline || 0) +
    Number(fs.noDevice || 0)
  );
});

const donutCircumference = 301.6;

const filteredBuses = computed(() => {
  const kw = q.value.trim().toLowerCase();

  return uiBuses.value
    .filter((b) => {
      if (!kw) return true;

      return [
        b.code,
        b.plate,
        b.route,
        b.status,
        b.signal,
        b.passengerCount,
        b.capacity,
      ]
        .join(" ")
        .toLowerCase()
        .includes(kw);
    })
    .filter((b) => {
      if (filter.value === "online") return b.status === "Online";
      if (filter.value === "warning") return b.status === "Warning";
      if (filter.value === "offline") return b.status === "Offline";
      return true;
    });
});

const filteredTerminals = computed(() => {
  const kw = tq.value.trim().toLowerCase();

  return (terminals.value || []).filter((t) => {
    if (!kw) return true;

    return [t.terminal_name, t.city, t.terminal_id]
      .join(" ")
      .toLowerCase()
      .includes(kw);
  });
});

function countBy(status) {
  return uiBuses.value.filter((b) => b.status === status).length;
}

function safeFixed(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n.toFixed(5) : "—";
}

function fmtTime(v) {
  const s = String(v || "");
  return s ? s.slice(0, 5) : "—";
}

function statusKey(s) {
  if (s === "Online") return "green";
  if (s === "Warning") return "amber";
  return "red";
}

function statusIcon(s) {
  if (s === "Online") return "fa-circle-check";
  if (s === "Warning") return "fa-triangle-exclamation";
  return "fa-circle-xmark";
}

function donutDash(value) {
  const total = Math.max(analyticsTotalFleet.value, 1);
  return `${(Number(value || 0) / total) * donutCircumference} ${donutCircumference}`;
}

function donutOffset(previousValue) {
  const total = Math.max(analyticsTotalFleet.value, 1);
  return 75.4 - (Number(previousValue || 0) / total) * donutCircumference;
}

function insightClass(type) {
  const t = String(type || "info").toLowerCase();

  if (t === "success") return "an-insight--green";
  if (t === "warning") return "an-insight--amber";
  if (t === "danger" || t === "error") return "an-insight--red";

  return "an-insight--blue";
}

/* Analytics */
async function loadAnalytics() {
  analyticsLoading.value = true;
  analyticsError.value = "";

  try {
    const res = await getAdminAnalyticsDashboard(analyticsPeriod.value);
    const payload = res?.data || {};

    if (!payload.ok) {
      throw new Error(payload.message || "Failed to load analytics.");
    }

    analytics.value = {
      summary: {
        totalBuses: 0,
        onlineBuses: 0,
        warningBuses: 0,
        offlineBuses: 0,
        noDeviceBuses: 0,
        busesAtTerminal: 0,
        busesEnRoute: 0,
        currentPassengers: 0,
        totalPassengers: 0,
        avgSpeed: 0,
        avgOccupancy: 0,
        activeRoutes: 0,
        ...(payload.summary || {}),
      },
      fleetStatus: {
        online: 0,
        warning: 0,
        offline: 0,
        noDevice: 0,
        ...(payload.fleetStatus || {}),
      },
      hourlyPassengers: Array.isArray(payload.hourlyPassengers)
        ? payload.hourlyPassengers
        : [],
      maxHourly: Number(payload.maxHourly || 0),
      peakHour: payload.peakHour || {
        hour: "—",
        label: "No data",
        count: 0,
      },
      routePerformance: Array.isArray(payload.routePerformance)
        ? payload.routePerformance
        : [],
      speedDistribution: Array.isArray(payload.speedDistribution)
        ? payload.speedDistribution
        : [],
      terminalUtilization: Array.isArray(payload.terminalUtilization)
        ? payload.terminalUtilization
        : [],
      deviceAttention: Array.isArray(payload.deviceAttention)
        ? payload.deviceAttention
        : [],
      insights: Array.isArray(payload.insights) ? payload.insights : [],
    };
  } catch (err) {
    console.error("loadAnalytics error:", err);

    analyticsError.value =
      err?.response?.data?.message ||
      err?.message ||
      "Failed to load analytics.";
  } finally {
    analyticsLoading.value = false;
  }
}

/* Terminal range */
function clearTerminalRangeCircle() {
  if (terminalRangeCircle && map) {
    map.removeLayer(terminalRangeCircle);
  }

  terminalRangeCircle = null;
}

function drawTerminalRangeCircle(t) {
  if (!map || !t) return;

  const lat = Number(t.lat);
  const lng = Number(t.lng);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

  clearTerminalRangeCircle();

  terminalRangeCircle = L.circle([lat, lng], {
    radius: TERMINAL_RANGE_M,
    color: "#3b82f6",
    weight: 2,
    opacity: 0.8,
    fillColor: "#3b82f6",
    fillOpacity: 0.08,
  }).addTo(map);
}

/* Terminal loading */
async function loadTerminalsOnce() {
  await fetchTerminals({ q: "" });
  await nextTick();
  syncTerminalMarkers();
}

/* Selection */
function clearSelected() {
  selectedBus.value = null;
  selectedTerminal.value = null;

  clearTerminalRangeCircle();
  refreshAllMarkerIcons();
}

function selectBus(b) {
  selectedTerminal.value = null;
  clearTerminalRangeCircle();

  selectedBus.value = b;
  panelView.value = "buses";

  refreshAllMarkerIcons();
  centerOnSelectedBus();
}

function selectTerminal(t) {
  selectedBus.value = null;

  selectedTerminal.value = t;
  panelView.value = "terminals";

  refreshAllMarkerIcons();
  drawTerminalRangeCircle(t);
  centerOnSelectedTerminal();
}

/* Map icons */
function makeBusDivIcon(bus, isSelected = false) {
  const key = statusKey(bus.status);
  const sel = isSelected ? "sel" : "";

  return L.divIcon({
    className: "",
    html: `<div class="lt-map-bus ${key} ${sel}"><i class="fas fa-bus"></i></div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  });
}

function makeTerminalDivIcon(isSelected = false) {
  const sel = isSelected ? "selected" : "";

  return L.divIcon({
    className: "lt-leaflet-term-icon",
    html: `
      <div class="lt-leaflet-term-pill ${sel}" aria-label="terminal">
        <i class="fas fa-building"></i>
      </div>
    `,
    iconSize: [34, 34],
    iconAnchor: [17, 30],
  });
}

function makeMyDivIcon() {
  return L.divIcon({
    className: "",
    html: `<div class="lt-map-me"></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  });
}

/* Leaflet */
function initLeaflet() {
  if (!mapEl.value || map) return;

  map = L.map(mapEl.value, {
    zoomControl: false,
    attributionControl: false,
    tap: true,
  }).setView([FALLBACK.lat, FALLBACK.lng], 6);

  L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
    maxZoom: 20,
  }).addTo(map);

  map.on("click", () => {
    clearSelected();
  });

  requestAnimationFrame(() => map?.invalidateSize());
  setTimeout(() => map?.invalidateSize(), 350);
}

function addOrUpdateBusMarker(bus) {
  if (!map || !Number.isFinite(Number(bus.lat)) || !Number.isFinite(Number(bus.lng))) {
    return;
  }

  const pos = [Number(bus.lat), Number(bus.lng)];
  const existing = busMarkers.get(bus.id);

  if (existing) {
    existing.setLatLng(pos);
    existing.setIcon(makeBusDivIcon(bus, selectedBus.value?.id === bus.id));
    return;
  }

  const marker = L.marker(pos, {
    icon: makeBusDivIcon(bus, selectedBus.value?.id === bus.id),
  }).addTo(map);

  marker.on("click", (e) => {
    L.DomEvent.stopPropagation(e);
    selectBus(bus);
  });

  busMarkers.set(bus.id, marker);
}

function removeBusMarker(id) {
  const marker = busMarkers.get(id);

  if (marker && map) {
    map.removeLayer(marker);
  }

  busMarkers.delete(id);
}

function addOrUpdateTerminalMarker(t) {
  if (!map) return;

  const id = t.terminal_id;
  const lat = Number(t.lat);
  const lng = Number(t.lng);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

  const pos = [lat, lng];
  const existing = terminalMarkers.get(id);

  if (existing) {
    existing.setLatLng(pos);
    existing.setIcon(makeTerminalDivIcon(selectedTerminal.value?.terminal_id === id));
    return;
  }

  const marker = L.marker(pos, {
    icon: makeTerminalDivIcon(selectedTerminal.value?.terminal_id === id),
  }).addTo(map);

  marker.on("click", (e) => {
    L.DomEvent.stopPropagation(e);
    selectTerminal(t);
  });

  terminalMarkers.set(id, marker);
}

function removeTerminalMarker(id) {
  const marker = terminalMarkers.get(id);

  if (marker && map) {
    map.removeLayer(marker);
  }

  terminalMarkers.delete(id);
}

function refreshAllMarkerIcons() {
  for (const b of uiBuses.value) {
    const marker = busMarkers.get(b.id);

    if (marker) {
      marker.setIcon(makeBusDivIcon(b, selectedBus.value?.id === b.id));
    }
  }

  for (const t of terminals.value || []) {
    const marker = terminalMarkers.get(t.terminal_id);

    if (marker) {
      marker.setIcon(
        makeTerminalDivIcon(selectedTerminal.value?.terminal_id === t.terminal_id)
      );
    }
  }
}

function syncBusMarkers() {
  if (!map) return;

  const nextIds = new Set(uiBuses.value.map((b) => b.id));

  for (const id of busMarkers.keys()) {
    if (!nextIds.has(id)) {
      removeBusMarker(id);
    }
  }

  uiBuses.value.forEach(addOrUpdateBusMarker);

  if (selectedBus.value) {
    const updated = uiBuses.value.find((x) => x.id === selectedBus.value.id);

    if (updated) {
      selectedBus.value = updated;
    }
  }

  refreshAllMarkerIcons();
}

function syncTerminalMarkers() {
  if (!map) return;

  const list = terminals.value || [];
  const nextIds = new Set(list.map((t) => t.terminal_id));

  for (const id of terminalMarkers.keys()) {
    if (!nextIds.has(id)) {
      removeTerminalMarker(id);
    }
  }

  list.forEach(addOrUpdateTerminalMarker);

  if (selectedTerminal.value) {
    const updated = list.find(
      (x) => x.terminal_id === selectedTerminal.value.terminal_id
    );

    if (updated) {
      selectedTerminal.value = updated;
      drawTerminalRangeCircle(updated);
    }
  }

  refreshAllMarkerIcons();
}

/* Map controls */
function fitAll() {
  if (!map) return;

  const pts = [];

  uiBuses.value.forEach((b) => {
    const lat = Number(b.lat);
    const lng = Number(b.lng);

    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      pts.push([lat, lng]);
    }
  });

  (terminals.value || []).forEach((t) => {
    const lat = Number(t.lat);
    const lng = Number(t.lng);

    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      pts.push([lat, lng]);
    }
  });

  if (!pts.length) return;

  map.fitBounds(L.latLngBounds(pts), {
    padding: [40, 40],
  });
}

function centerOnSelectedBus() {
  if (!map || !selectedBus.value) return;

  const lat = Number(selectedBus.value.lat);
  const lng = Number(selectedBus.value.lng);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

  map.flyTo([lat, lng], Math.max(map.getZoom(), 16), {
    duration: 0.5,
  });
}

function centerOnSelectedTerminal() {
  if (!map || !selectedTerminal.value) return;

  const lat = Number(selectedTerminal.value.lat);
  const lng = Number(selectedTerminal.value.lng);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

  map.flyTo([lat, lng], Math.max(map.getZoom(), 15), {
    duration: 0.5,
  });
}

function zoomIn() {
  map?.zoomIn();
}

function zoomOut() {
  map?.zoomOut();
}

function centerOnMe() {
  if (!map || !navigator.geolocation) return;

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;

      if (!myMarker) {
        myMarker = L.marker([lat, lng], {
          icon: makeMyDivIcon(),
          interactive: false,
        }).addTo(map);
      } else {
        myMarker.setLatLng([lat, lng]);
      }

      map.flyTo([lat, lng], 15, {
        duration: 0.6,
      });
    },
    () => {},
    {
      enableHighAccuracy: true,
      timeout: 12000,
    }
  );
}

/* Refresh */
function refreshOnce() {
  fetchOnce();
  loadTerminalsOnce();

  if (view.value === "analytics") {
    loadAnalytics();
  }
}

/* Watchers */
watch(
  buses,
  () => {
    syncBusMarkers();
  },
  { deep: true }
);

watch(
  terminals,
  async () => {
    await nextTick();
    syncTerminalMarkers();
  },
  { deep: true }
);

watch(analyticsPeriod, () => {
  loadAnalytics();
});

watch(view, async (nextView) => {
  if (nextView === "analytics") {
    await loadAnalytics();
  } else {
    await nextTick();
    setTimeout(() => map?.invalidateSize(), 250);
  }
});

/* Lifecycle */
onMounted(async () => {
  initLeaflet();

  start();

  await fetchOnce();
  await loadTerminalsOnce();
  await loadAnalytics();

  terminalPoll = setInterval(loadTerminalsOnce, 8000);

  await nextTick();

  syncBusMarkers();
  syncTerminalMarkers();

  setTimeout(() => map?.invalidateSize(), 350);
});

onUnmounted(() => {
  stop();

  if (terminalPoll) {
    clearInterval(terminalPoll);
  }

  clearTerminalRangeCircle();

  if (map) {
    map.off();
    map.remove();
    map = null;
  }
});
</script>

<style scoped>
.lt {
  --green: #10b981;
  --amber: #f59e0b;
  --red: #ef4444;
  --blue: #3b82f6;
  --purple: #8b5cf6;
  --border: #e2e8f0;
  --bg: #f8fafc;
  --card: #ffffff;
  --text: #0f172a;
  --muted: #64748b;
  --radius: 14px;

  min-height: 100vh;
  padding: 24px;
  background: var(--bg);
  color: var(--text);
  font-family: "DM Sans", "Segoe UI", sans-serif;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* Header */
.lt-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.lt-title-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.lt-title {
  margin: 0;
  font-size: 22px;
  font-weight: 900;
  letter-spacing: -0.5px;
}

.lt-subtitle {
  margin: 4px 0 0;
  color: var(--muted);
  font-size: 12px;
  font-weight: 600;
}

.lt-live-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 999px;
  background: rgba(16, 185, 129, 0.1);
  color: var(--green);
  font-size: 11px;
  font-weight: 800;
}

.lt-live-dot {
  width: 7px;
  height: 7px;
  border-radius: 999px;
  background: currentColor;
  animation: ltPulse 1.4s ease-in-out infinite;
}

@keyframes ltPulse {
  0%,
  100% {
    opacity: 1;
    transform: scale(1);
  }

  50% {
    opacity: 0.35;
    transform: scale(0.8);
  }
}

.lt-header-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* Buttons */
.lt-btn-ghost,
.lt-btn-primary,
.lt-btn-danger {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  height: 36px;
  padding: 0 14px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 800;
  cursor: pointer;
  transition:
    background 0.15s,
    border-color 0.15s,
    color 0.15s,
    transform 0.15s,
    opacity 0.15s;
}

.lt-btn-ghost {
  border: 1px solid var(--border);
  background: var(--card);
  color: var(--muted);
}

.lt-btn-ghost:hover {
  color: var(--text);
  border-color: #94a3b8;
}

.lt-btn-primary {
  border: none;
  background: var(--text);
  color: #fff;
}

.lt-btn-primary:hover {
  opacity: 0.88;
}

.lt-btn-danger {
  height: 32px;
  padding: 0 12px;
  border: 1px solid rgba(239, 68, 68, 0.2);
  background: rgba(239, 68, 68, 0.06);
  color: var(--red);
  font-size: 12px;
}

.lt-btn-danger:hover {
  background: rgba(239, 68, 68, 0.12);
}

.lt-btn-sm {
  height: 32px;
  padding: 0 12px;
  font-size: 12px;
}

/* Summary */
.lt-summary {
  display: grid;
  grid-template-columns: repeat(5, minmax(120px, 1fr));
  gap: 12px;
}

.lt-stat {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 14px 18px;
}

.lt-stat-value {
  font-size: 26px;
  line-height: 1;
  font-weight: 950;
  letter-spacing: -1px;
}

.lt-stat-label {
  margin-top: 5px;
  color: var(--muted);
  font-size: 11px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.45px;
}

.lt-stat--green .lt-stat-value {
  color: var(--green);
}

.lt-stat--amber .lt-stat-value {
  color: var(--amber);
}

.lt-stat--red .lt-stat-value {
  color: var(--red);
}

.lt-stat--blue .lt-stat-value {
  color: var(--blue);
}

/* Tabs */
.lt-tabs {
  display: flex;
  gap: 4px;
  border-bottom: 1px solid var(--border);
}

.lt-tab {
  height: 40px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 0 14px;
  margin-bottom: -1px;
  border: none;
  border-bottom: 2px solid transparent;
  background: transparent;
  color: var(--muted);
  font-size: 13px;
  font-weight: 800;
  cursor: pointer;
  transition:
    color 0.15s,
    border-color 0.15s;
}

.lt-tab:hover {
  color: var(--text);
}

.lt-tab--active {
  color: var(--blue);
  border-bottom-color: var(--blue);
}

/* Tracking layout */
.lt-grid {
  display: grid;
  grid-template-columns: 1fr 380px;
  gap: 16px;
  align-items: stretch;
  min-height: 620px;
}

.lt-map-card,
.lt-panel-card,
.an-card {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  overflow: hidden;
}

.lt-panel-card {
  display: flex;
  flex-direction: column;
  min-height: 620px;
}

.lt-card-head,
.an-card-head {
  min-height: 54px;
  padding: 12px 14px;
  border-bottom: 1px solid var(--border);
  background: #f8fafc;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.lt-card-title,
.an-card-title {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--text);
  font-size: 13px;
  font-weight: 900;
}

.lt-card-title i,
.an-card-title i {
  color: var(--muted);
  font-size: 13px;
}

.lt-badge {
  min-width: 22px;
  height: 22px;
  padding: 0 7px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  background: #dbeafe;
  color: #1e40af;
  border: 1px solid #bfdbfe;
  font-size: 11px;
  font-weight: 900;
}

/* Map */
.lt-map-controls {
  display: flex;
  gap: 6px;
}

.lt-icon-btn {
  width: 32px;
  height: 32px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: #fff;
  color: var(--muted);
  cursor: pointer;
  transition:
    background 0.15s,
    color 0.15s,
    border-color 0.15s;
}

.lt-icon-btn:hover {
  background: var(--bg);
  color: var(--text);
  border-color: #94a3b8;
}

.lt-map-canvas {
  position: relative;
  min-height: 566px;
}

.lt-map-canvas :deep(.leaflet-container) {
  width: 100% !important;
  height: 100% !important;
  min-height: 566px;
}

.lt-legend {
  position: absolute;
  left: 12px;
  bottom: 12px;
  z-index: 500;
  padding: 10px 12px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.94);
  border: 1px solid var(--border);
  backdrop-filter: blur(10px);
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.1);
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.lt-legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--muted);
  font-size: 11px;
  font-weight: 800;
}

.lt-legend-sep {
  height: 1px;
  background: var(--border);
}

.lt-dot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
}

.lt-dot--green {
  background: var(--green);
}

.lt-dot--amber {
  background: var(--amber);
}

.lt-dot--red {
  background: var(--red);
}

.lt-dot--blue {
  background: var(--blue);
}

.lt-dot--range {
  background: rgba(59, 130, 246, 0.25);
  border: 1px solid rgba(59, 130, 246, 0.65);
}

/* Leaflet custom markers */
:deep(.lt-map-bus) {
  width: 36px;
  height: 36px;
  border-radius: 999px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  box-shadow:
    0 12px 24px rgba(15, 23, 42, 0.22),
    0 0 0 4px rgba(255, 255, 255, 0.9);
  border: 2px solid #fff;
  transition: transform 0.15s;
}

:deep(.lt-leaflet-term-icon) {
  background: transparent;
  border: none;
}

:deep(.lt-leaflet-term-pill) {
  width: 34px;
  height: 34px;
  border-radius: 12px 12px 12px 4px;
  background: white;
  border: 2px solid #0369a1;
  color: #0369a1;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 18px rgba(0, 0, 0, 0.12);
  transform: rotate(-45deg);
  transition:
    transform 0.15s ease,
    box-shadow 0.15s ease;
}

:deep(.lt-leaflet-term-pill i) {
  transform: rotate(45deg);
  font-size: 14px;
}

:deep(.lt-leaflet-term-pill.selected) {
  transform: rotate(-45deg) scale(1.16);
  box-shadow:
    0 12px 26px rgba(15, 23, 42, 0.22),
    0 0 0 4px rgba(255, 255, 255, 0.9);
}
/* Panel */
.lt-panel-switch {
  display: flex;
  gap: 5px;
}

.lt-switch-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 30px;
  padding: 0 10px;
  border-radius: 9px;
  border: 1px solid var(--border);
  background: #fff;
  color: var(--muted);
  font-size: 12px;
  font-weight: 900;
  cursor: pointer;
}

.lt-switch-btn--active {
  background: var(--text);
  border-color: var(--text);
  color: #fff;
}

.lt-panel-tools {
  padding: 12px;
  border-bottom: 1px solid var(--border);
}

.lt-search {
  height: 36px;
  padding: 0 10px;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: var(--bg);
  display: flex;
  align-items: center;
  gap: 8px;
}

.lt-search:focus-within {
  background: #fff;
  border-color: var(--blue);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.12);
}

.lt-search-icon {
  color: var(--muted);
  font-size: 12px;
}

.lt-search-input {
  flex: 1;
  min-width: 0;
  border: none;
  outline: none;
  background: transparent;
  color: var(--text);
  font-size: 13px;
  font-weight: 700;
}

.lt-search-input::placeholder {
  color: #94a3b8;
}

.lt-search-clear {
  border: none;
  background: transparent;
  color: var(--muted);
  cursor: pointer;
}

.lt-filters {
  display: flex;
  gap: 6px;
  margin-top: 10px;
  flex-wrap: wrap;
}

.lt-pill {
  height: 28px;
  padding: 0 10px;
  border-radius: 999px;
  border: 1px solid var(--border);
  background: #fff;
  color: var(--muted);
  font-size: 11px;
  font-weight: 900;
  cursor: pointer;
}

.lt-pill--active {
  background: var(--text);
  color: #fff;
  border-color: var(--text);
}

.lt-pill-count {
  margin-left: 4px;
  padding: 1px 6px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.2);
}

.lt-pill:not(.lt-pill--active) .lt-pill-count {
  background: var(--bg);
  color: var(--muted);
}

.lt-term-hint {
  margin-top: 10px;
  color: var(--muted);
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 11px;
  font-weight: 800;
}

.lt-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 7px;
}

/* Bus item */
.lt-bus-item,
.lt-term-item {
  width: 100%;
  border: 1px solid var(--border);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.62);
  padding: 12px;
  text-align: left;
  cursor: pointer;
  transition:
    background 0.15s,
    border-color 0.15s,
    transform 0.15s;
}

.lt-bus-item:hover,
.lt-term-item:hover {
  background: rgba(59, 130, 246, 0.04);
  border-color: #cbd5e1;
}

.lt-bus-item--active,
.lt-term-item--active {
  background: #dbeafe;
  border-color: var(--blue);
}

.lt-bus-item-top,
.lt-term-item-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 10px;
}

.lt-bus-code {
  font-size: 13px;
  font-weight: 950;
  color: var(--text);
}

.lt-bus-meta,
.lt-bus-item-bottom,
.lt-term-item-bottom {
  margin-top: 5px;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 5px;
  color: var(--muted);
  font-size: 11px;
  font-weight: 700;
}

.lt-mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}

.lt-sep {
  color: #cbd5e1;
}

.lt-pax,
.lt-meta-item {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.lt-pax {
  color: var(--text);
  font-weight: 900;
}

.lt-bus-item-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 6px;
  flex-shrink: 0;
}

.lt-speed {
  display: flex;
  align-items: baseline;
  gap: 3px;
}

.lt-speed-num {
  font-size: 16px;
  font-weight: 950;
}

.lt-speed-unit {
  color: var(--muted);
  font-size: 10px;
  font-weight: 800;
}

.lt-status-chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 8px;
  border-radius: 999px;
  font-size: 10px;
  font-weight: 950;
}

.lt-status-chip--green {
  color: #047857;
  background: #d1fae5;
}

.lt-status-chip--amber {
  color: #b45309;
  background: #fef3c7;
}

.lt-status-chip--red {
  color: #b91c1c;
  background: #fee2e2;
}

/* Terminal item */
.lt-term-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.lt-term-icon-wrap {
  width: 38px;
  height: 38px;
  border-radius: 12px;
  background: #dbeafe;
  color: #1d4ed8;
  display: flex;
  align-items: center;
  justify-content: center;
}

.lt-term-name-row {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.lt-term-name {
  color: var(--text);
  font-size: 13px;
  font-weight: 950;
}

.lt-term-id-badge {
  padding: 2px 6px;
  border-radius: 999px;
  background: var(--bg);
  color: var(--muted);
  font-size: 10px;
  font-weight: 900;
}

.lt-term-city {
  margin-top: 4px;
  color: var(--muted);
  font-size: 11px;
  font-weight: 800;
  display: flex;
  align-items: center;
  gap: 5px;
}

.lt-term-bus-count {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 8px;
  border-radius: 999px;
  background: #f1f5f9;
  color: var(--text);
  font-size: 11px;
  font-weight: 950;
}

.lt-empty {
  min-height: 170px;
  border: 1px dashed var(--border);
  border-radius: 14px;
  color: var(--muted);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  text-align: center;
}

.lt-empty i {
  font-size: 24px;
}

.lt-empty p {
  margin: 0;
  color: var(--text);
  font-weight: 900;
}

.lt-empty small {
  font-weight: 700;
}

/* Floating panel */
.lt-float {
  position: fixed;
  left: 50%;
  bottom: 22px;
  transform: translateX(-50%);
  z-index: 1000;
  width: min(860px, calc(100vw - 32px));
  padding: 14px;
  border: 1px solid var(--border);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(14px);
  box-shadow: 0 24px 60px rgba(15, 23, 42, 0.18);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
}

.lt-float-title {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--text);
  font-size: 14px;
  font-weight: 950;
}

.lt-float-sub {
  margin-top: 5px;
  color: var(--muted);
  font-size: 12px;
  font-weight: 800;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
}

.lt-float-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.lt-float-enter-active,
.lt-float-leave-active {
  transition:
    opacity 0.18s,
    transform 0.18s;
}

.lt-float-enter-from,
.lt-float-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(12px);
}

/* Analytics */
.an {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.an-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;
  flex-wrap: wrap;
}

.an-header-title {
  display: flex;
  align-items: center;
  gap: 9px;
  color: var(--text);
  font-size: 20px;
  font-weight: 950;
  letter-spacing: -0.4px;
}

.an-header-title i {
  color: var(--blue);
}

.an-header-sub {
  margin: 5px 0 0;
  color: var(--muted);
  font-size: 12px;
  font-weight: 700;
}

.an-period-pills {
  display: flex;
  gap: 7px;
  flex-wrap: wrap;
}

.an-period-pill {
  height: 34px;
  padding: 0 12px;
  border-radius: 999px;
  border: 1px solid var(--border);
  background: #fff;
  color: var(--muted);
  font-size: 12px;
  font-weight: 900;
  cursor: pointer;
}

.an-period-pill--active {
  background: var(--text);
  border-color: var(--text);
  color: #fff;
}

.an-alert {
  display: flex;
  align-items: center;
  gap: 8px;
  border-radius: 12px;
  padding: 12px 14px;
  font-size: 13px;
  font-weight: 800;
}

.an-alert--error {
  color: #b91c1c;
  background: #fef2f2;
  border: 1px solid #fecaca;
}

.an-loading {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--muted);
  font-size: 13px;
  font-weight: 800;
  padding: 12px 14px;
  background: #fff;
  border: 1px solid var(--border);
  border-radius: 12px;
}

.an-kpi-row {
  display: grid;
  grid-template-columns: repeat(4, minmax(170px, 1fr));
  gap: 12px;
}

.an-kpi {
  position: relative;
  overflow: hidden;
  background: #fff;
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 16px;
  display: flex;
  gap: 13px;
}

.an-kpi::after {
  content: "";
  position: absolute;
  inset: auto -30px -40px auto;
  width: 110px;
  height: 110px;
  border-radius: 999px;
  opacity: 0.09;
  background: currentColor;
}

.an-kpi-icon {
  width: 42px;
  height: 42px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.an-kpi--blue {
  color: var(--blue);
}

.an-kpi--green {
  color: var(--green);
}

.an-kpi--amber {
  color: var(--amber);
}

.an-kpi--purple {
  color: var(--purple);
}

.an-kpi--blue .an-kpi-icon {
  background: #dbeafe;
}

.an-kpi--green .an-kpi-icon {
  background: #d1fae5;
}

.an-kpi--amber .an-kpi-icon {
  background: #fef3c7;
}

.an-kpi--purple .an-kpi-icon {
  background: #ede9fe;
}

.an-kpi-body {
  min-width: 0;
}

.an-kpi-value {
  color: var(--text);
  font-size: 26px;
  line-height: 1;
  font-weight: 950;
  letter-spacing: -1px;
}

.an-kpi-unit {
  color: var(--muted);
  font-size: 13px;
  font-weight: 900;
}

.an-kpi-label {
  margin-top: 5px;
  color: var(--muted);
  font-size: 12px;
  font-weight: 900;
}

.an-kpi-trend {
  margin-top: 8px;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  font-weight: 900;
}

.an-kpi-trend--neutral {
  color: var(--muted);
}

.an-mini-row {
  display: grid;
  grid-template-columns: repeat(5, minmax(120px, 1fr));
  gap: 12px;
}

.an-mini-card {
  background: #fff;
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 14px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.an-mini-card span {
  color: var(--muted);
  font-size: 12px;
  font-weight: 900;
}

.an-mini-card strong {
  font-size: 22px;
  font-weight: 950;
  color: var(--text);
}

.an-mini-card--green strong {
  color: var(--green);
}

.an-mini-card--amber strong {
  color: var(--amber);
}

.an-mini-card--red strong {
  color: var(--red);
}

.an-mini-card--blue strong {
  color: var(--blue);
}

.an-row-2 {
  display: grid;
  grid-template-columns: minmax(0, 1.5fr) minmax(320px, 0.9fr);
  gap: 16px;
  align-items: stretch;
}

.an-card {
  min-width: 0;
}

.an-card--wide {
  min-width: 0;
}

.an-card-meta {
  color: var(--muted);
  font-size: 11px;
  font-weight: 900;
}

/* Bar chart */
.an-chart-area {
  position: relative;
  padding: 18px 42px 14px 18px;
  min-height: 270px;
}

.an-bar-chart {
  height: 220px;
  display: grid;
  grid-template-columns: repeat(18, 1fr);
  gap: 7px;
  align-items: end;
}

.an-bar-col {
  height: 100%;
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  align-items: center;
}

.an-bar-label-top {
  height: 24px;
  display: flex;
  align-items: center;
}

.an-peak-badge {
  padding: 2px 6px;
  border-radius: 999px;
  background: #dbeafe;
  color: #1d4ed8;
  font-size: 9px;
  font-weight: 950;
}

.an-bar-wrap {
  width: 100%;
  height: 170px;
  border-radius: 999px;
  background: #f1f5f9;
  display: flex;
  align-items: end;
  overflow: hidden;
}

.an-bar {
  width: 100%;
  min-height: 3px;
  border-radius: 999px 999px 0 0;
  background: #93c5fd;
  transition: height 0.25s;
}

.an-bar--peak {
  background: var(--blue);
}

.an-bar-x {
  margin-top: 7px;
  color: var(--muted);
  font-size: 10px;
  font-weight: 900;
}

.an-bar-y-labels {
  position: absolute;
  top: 40px;
  right: 12px;
  height: 170px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  color: #94a3b8;
  font-size: 10px;
  font-weight: 800;
}

.an-chart-caption {
  padding: 11px 14px;
  border-top: 1px solid var(--border);
  color: var(--muted);
  font-size: 11px;
  font-weight: 800;
  display: flex;
  align-items: center;
  gap: 7px;
}

/* Donut */
.an-donut-wrap {
  padding: 20px 20px 10px;
  display: flex;
  justify-content: center;
}

.an-donut-svg {
  width: 190px;
  height: 190px;
  transform: rotate(-90deg);
}

.an-donut-num,
.an-donut-sub {
  transform: rotate(90deg);
  transform-origin: 60px 60px;
  fill: var(--text);
}

.an-donut-num {
  font-size: 24px;
  font-weight: 950;
}

.an-donut-sub {
  fill: var(--muted);
  font-size: 10px;
  font-weight: 900;
}

.an-donut-legend {
  padding: 0 16px 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.an-dl-item {
  display: grid;
  grid-template-columns: 10px 1fr auto;
  gap: 8px;
  align-items: center;
}

.an-dl-dot {
  width: 9px;
  height: 9px;
  border-radius: 999px;
}

.an-dl-dot--green {
  background: var(--green);
}

.an-dl-dot--amber {
  background: var(--amber);
}

.an-dl-dot--red {
  background: var(--red);
}

.an-dl-dot--gray {
  background: #94a3b8;
}

.an-dl-label {
  color: var(--muted);
  font-size: 12px;
  font-weight: 900;
}

.an-dl-val {
  color: var(--text);
  font-size: 12px;
  font-weight: 950;
}

.an-dl-bar-wrap {
  grid-column: 2 / 4;
  height: 6px;
  border-radius: 999px;
  background: #f1f5f9;
  overflow: hidden;
}

.an-dl-bar {
  height: 100%;
  border-radius: 999px;
}

.an-dl-bar--green {
  background: var(--green);
}

.an-dl-bar--amber {
  background: var(--amber);
}

.an-dl-bar--red {
  background: var(--red);
}

.an-dl-bar--gray {
  background: #94a3b8;
}

/* Route performance */
.an-route-list,
.an-offline-list {
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.an-route-row {
  display: flex;
  gap: 11px;
  padding: 12px;
  border: 1px solid var(--border);
  border-radius: 14px;
  background: #fff;
}

.an-route-rank {
  width: 30px;
  height: 30px;
  border-radius: 10px;
  background: #f1f5f9;
  color: var(--muted);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 950;
  flex-shrink: 0;
}

.an-rank--1 {
  background: #dbeafe;
  color: #1d4ed8;
}

.an-rank--2 {
  background: #ede9fe;
  color: #6d28d9;
}

.an-rank--3 {
  background: #fef3c7;
  color: #b45309;
}

.an-route-body {
  flex: 1;
  min-width: 0;
}

.an-route-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.an-route-name {
  color: var(--text);
  font-size: 13px;
  font-weight: 950;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.an-route-pax {
  color: var(--text);
  font-size: 12px;
  font-weight: 950;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  flex-shrink: 0;
}

.an-route-bar-wrap {
  height: 8px;
  margin-top: 9px;
  border-radius: 999px;
  background: #f1f5f9;
  overflow: hidden;
}

.an-route-bar {
  height: 100%;
  min-width: 4px;
  border-radius: 999px;
  background: linear-gradient(90deg, #3b82f6, #6366f1);
}

.an-route-meta {
  margin-top: 9px;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  color: var(--muted);
  font-size: 11px;
  font-weight: 800;
}

.an-occ-pill {
  padding: 3px 7px;
  border-radius: 999px;
  font-weight: 950;
}

.an-occ--high {
  color: #b91c1c;
  background: #fee2e2;
}

.an-occ--mid {
  color: #b45309;
  background: #fef3c7;
}

.an-occ--low {
  color: #047857;
  background: #d1fae5;
}

/* Device attention */
.an-offline-row {
  padding: 12px;
  border: 1px solid var(--border);
  border-radius: 14px;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.an-offline-left {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.an-offline-icon {
  width: 36px;
  height: 36px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.an-offline-icon--red {
  background: #fee2e2;
  color: #b91c1c;
}

.an-offline-icon--amber {
  background: #fef3c7;
  color: #b45309;
}

.an-offline-code {
  color: var(--text);
  font-size: 13px;
  font-weight: 950;
}

.an-offline-plate {
  margin-top: 3px;
  color: var(--muted);
  font-size: 11px;
  font-weight: 800;
}

.an-offline-right {
  min-width: 0;
  text-align: right;
}

.an-offline-count {
  color: #b45309;
  background: #fef3c7;
  padding: 5px 8px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 950;
  white-space: nowrap;
}

.an-offline-count--red {
  color: #b91c1c;
  background: #fee2e2;
}

/* Terminal utilization */
.an-terminal-grid {
  padding: 12px;
  display: grid;
  grid-template-columns: repeat(4, minmax(140px, 1fr));
  gap: 12px;
}

.an-term-util-card {
  border: 1px solid var(--border);
  border-radius: 14px;
  background: #fff;
  padding: 14px;
}

.an-tuc-icon {
  width: 36px;
  height: 36px;
  border-radius: 12px;
  background: #dbeafe;
  color: #1d4ed8;
  display: flex;
  align-items: center;
  justify-content: center;
}

.an-tuc-name {
  margin-top: 10px;
  color: var(--text);
  font-size: 13px;
  font-weight: 950;
}

.an-tuc-city {
  margin-top: 3px;
  color: var(--muted);
  font-size: 11px;
  font-weight: 800;
}

.an-tuc-gauge-wrap {
  height: 8px;
  margin-top: 12px;
  background: #f1f5f9;
  border-radius: 999px;
  overflow: hidden;
}

.an-tuc-gauge {
  height: 100%;
  min-width: 4px;
  border-radius: 999px;
}

.an-tuc-gauge--high {
  background: var(--green);
}

.an-tuc-gauge--mid {
  background: var(--blue);
}

.an-tuc-gauge--low {
  background: var(--amber);
}

.an-tuc-stats {
  margin-top: 9px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  color: var(--muted);
  font-size: 11px;
  font-weight: 900;
}

.an-tuc-count {
  color: var(--text);
}

/* Speed */
.an-speed-grid {
  padding: 16px;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}

.an-speed-cell {
  min-height: 84px;
  border-radius: 16px;
  border: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.an-speed-cell-val {
  font-size: 28px;
  line-height: 1;
  font-weight: 950;
}

.an-speed-cell-label {
  margin-top: 6px;
  font-size: 12px;
  font-weight: 900;
}

.an-sc--low {
  color: #475569;
  background: #f8fafc;
}

.an-sc--slow {
  color: #b45309;
  background: #fffbeb;
}

.an-sc--med {
  color: #1d4ed8;
  background: #eff6ff;
}

.an-sc--fast {
  color: #047857;
  background: #ecfdf5;
}

.an-sc--vfast {
  color: #b91c1c;
  background: #fef2f2;
}

.an-speed-legend {
  padding: 0 16px 16px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.an-sl-item {
  font-size: 11px;
  font-weight: 900;
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

.an-sl--low {
  color: #475569;
}

.an-sl--slow {
  color: #b45309;
}

.an-sl--med {
  color: #1d4ed8;
}

.an-sl--fast {
  color: #047857;
}

/* Insights */
.an-insights {
  background: #fff;
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 14px;
}

.an-insights-header {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--text);
  font-size: 14px;
  font-weight: 950;
}

.an-insights-header i {
  color: var(--amber);
}

.an-insights-grid {
  margin-top: 12px;
  display: grid;
  grid-template-columns: repeat(2, minmax(220px, 1fr));
  gap: 10px;
}

.an-insight-card {
  border-radius: 14px;
  padding: 12px;
  display: flex;
  align-items: flex-start;
  gap: 10px;
  font-size: 12px;
  font-weight: 800;
  line-height: 1.45;
}

.an-insight-card > i {
  margin-top: 2px;
}

.an-insight-text strong {
  font-weight: 950;
}

.an-insight--blue {
  color: #1d4ed8;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
}

.an-insight--amber {
  color: #b45309;
  background: #fffbeb;
  border: 1px solid #fde68a;
}

.an-insight--red {
  color: #b91c1c;
  background: #fef2f2;
  border: 1px solid #fecaca;
}

.an-insight--green {
  color: #047857;
  background: #ecfdf5;
  border: 1px solid #a7f3d0;
}

.an-empty {
  min-height: 140px;
  border: 1px dashed var(--border);
  border-radius: 14px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  color: var(--muted);
  text-align: center;
  padding: 18px;
}

.an-empty i {
  font-size: 24px;
  opacity: 0.8;
}

.an-empty p {
  margin: 0;
  font-size: 13px;
  font-weight: 950;
  color: var(--text);
}

.an-empty small {
  font-size: 11px;
  font-weight: 700;
  color: var(--muted);
}

/* Responsive */
@media (max-width: 1180px) {
  .lt-grid {
    grid-template-columns: 1fr;
  }

  .lt-panel-card {
    min-height: 480px;
  }

  .an-row-2 {
    grid-template-columns: 1fr;
  }

  .an-terminal-grid {
    grid-template-columns: repeat(2, minmax(140px, 1fr));
  }
}

@media (max-width: 900px) {
  .lt-summary,
  .an-kpi-row,
  .an-mini-row {
    grid-template-columns: repeat(2, minmax(120px, 1fr));
  }

  .an-insights-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .lt {
    padding: 16px;
  }

  .lt-summary,
  .an-kpi-row,
  .an-mini-row,
  .an-terminal-grid {
    grid-template-columns: 1fr;
  }

  .lt-header-right {
    width: 100%;
  }

  .lt-btn-ghost,
  .lt-btn-primary {
    flex: 1;
  }

  .lt-float {
    flex-direction: column;
    align-items: stretch;
  }

  .lt-float-actions {
    justify-content: flex-end;
  }

  .an-bar-chart {
    gap: 4px;
  }

  .an-bar-x {
    font-size: 9px;
  }
}
</style>
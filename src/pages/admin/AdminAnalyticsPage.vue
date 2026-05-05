<!-- src/pages/admin/ReportsPage.vue -->
<template>
  <div class="rp">

    <!-- ── Header ── -->
    <div class="rp-header">
      <div class="rp-header-left">
        <div class="rp-title-row">
          <div class="rp-title-icon"><i class="fas fa-file-chart-column"></i></div>
          <div>
            <h1 class="rp-title">Reports</h1>
            <p class="rp-subtitle">Formal records · Export · Print · Summaries</p>
          </div>
        </div>
      </div>
      <div class="rp-header-right">
        <div class="rp-date-range">
          <i class="fas fa-calendar-range"></i>
          <select v-model="dateRange" class="rp-select">
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
            <option value="year">This Year</option>
          </select>
        </div>
        <button class="rp-btn-ghost" @click="printPage">
          <i class="fas fa-print"></i> Print
        </button>
        <button class="rp-btn-primary" @click="exportExcel">
          <i class="fas fa-file-excel"></i> Export Excel
        </button>
        <button class="rp-btn-pdf" @click="exportPDF">
          <i class="fas fa-file-pdf"></i> Export PDF
        </button>
      </div>
    </div>

    <!-- ── Report Meta Bar ── -->
    <div class="rp-meta-bar">
      <div class="rp-meta-item">
        <i class="fas fa-building"></i>
        <span>Transit Management System</span>
      </div>
      <div class="rp-meta-sep"></div>
      <div class="rp-meta-item">
        <i class="fas fa-calendar-check"></i>
        <span>Generated: {{ nowLabel }}</span>
      </div>
      <div class="rp-meta-sep"></div>
      <div class="rp-meta-item">
        <i class="fas fa-clock"></i>
        <span>Period: {{ periodLabel }}</span>
      </div>
      <div class="rp-meta-sep"></div>
      <div class="rp-meta-item rp-meta-item--status">
        <span class="rp-live-dot"></span>
        <span>Live Data Snapshot</span>
      </div>
    </div>

    <!-- ── Report Type Tabs ── -->
    <div class="rp-tabs">
      <button
        v-for="t in reportTabs"
        :key="t.key"
        class="rp-tab"
        :class="{ 'rp-tab--active': activeTab === t.key }"
        @click="activeTab = t.key"
      >
        <i :class="t.icon"></i>
        {{ t.label }}
      </button>
    </div>

    <!-- ══════════════════════════════════════════ -->
    <!-- Revenue Report -->
    <!-- ══════════════════════════════════════════ -->
    <template v-if="activeTab === 'revenue'">

      <!-- Revenue KPIs -->
      <div class="rp-kpi-row">
        <div class="rp-kpi rp-kpi--emerald">
          <div class="rp-kpi-label">Total Revenue</div>
          <div class="rp-kpi-value">₱ {{ fmt(revenue.total) }}</div>
          <div class="rp-kpi-sub"><i class="fas fa-arrow-trend-up"></i> +8.3% vs last period</div>
        </div>
        <div class="rp-kpi rp-kpi--blue">
          <div class="rp-kpi-label">Fare Collection</div>
          <div class="rp-kpi-value">₱ {{ fmt(revenue.fare) }}</div>
          <div class="rp-kpi-sub">{{ pct(revenue.fare, revenue.total) }}% of total</div>
        </div>
        <div class="rp-kpi rp-kpi--violet">
          <div class="rp-kpi-label">Terminal Fees</div>
          <div class="rp-kpi-value">₱ {{ fmt(revenue.terminalFees) }}</div>
          <div class="rp-kpi-sub">{{ pct(revenue.terminalFees, revenue.total) }}% of total</div>
        </div>
        <div class="rp-kpi rp-kpi--amber">
          <div class="rp-kpi-label">Avg Rev / Bus</div>
          <div class="rp-kpi-value">₱ {{ fmt(revenue.avgPerBus) }}</div>
          <div class="rp-kpi-sub">Across {{ busRevenueData.length }} buses</div>
        </div>
        <div class="rp-kpi rp-kpi--rose">
          <div class="rp-kpi-label">Penalties / Deductions</div>
          <div class="rp-kpi-value">₱ {{ fmt(revenue.deductions) }}</div>
          <div class="rp-kpi-sub">Late filings, fines</div>
        </div>
      </div>

      <!-- Revenue breakdown mini chart (CSS bars) -->
      <div class="rp-card">
        <div class="rp-card-head">
          <div class="rp-card-title"><i class="fas fa-chart-bar"></i> Daily Revenue Breakdown — {{ periodLabel }}</div>
          <button class="rp-export-btn" @click="exportExcel"><i class="fas fa-file-excel"></i> Export</button>
        </div>
        <div class="rp-rev-chart">
          <div class="rp-rev-chart-y">
            <span v-for="y in revChartYLabels" :key="y">₱{{ y }}</span>
          </div>
          <div class="rp-rev-bars">
            <div v-for="(d, i) in dailyRevenue" :key="i" class="rp-rev-bar-group">
              <div class="rp-rev-bar-stack">
                <div
                  class="rp-rev-bar rp-rev-bar--fare"
                  :style="{ height: (d.fare / maxDailyRev * 140) + 'px' }"
                  :title="`Fare: ₱${fmt(d.fare)}`"
                ></div>
                <div
                  class="rp-rev-bar rp-rev-bar--term"
                  :style="{ height: (d.terminal / maxDailyRev * 140) + 'px' }"
                  :title="`Terminal: ₱${fmt(d.terminal)}`"
                ></div>
              </div>
              <div class="rp-rev-bar-label">{{ d.label }}</div>
            </div>
          </div>
        </div>
        <div class="rp-rev-legend">
          <span class="rp-rl-item"><span class="rp-rl-dot" style="background:#10b981"></span> Fare Collection</span>
          <span class="rp-rl-item"><span class="rp-rl-dot" style="background:#6366f1"></span> Terminal Fees</span>
        </div>
      </div>

      <!-- Per-Bus Revenue Table -->
      <div class="rp-card">
        <div class="rp-card-head">
          <div class="rp-card-title"><i class="fas fa-bus"></i> Revenue Per Bus</div>
          <div class="rp-card-tools">
            <div class="rp-search-mini">
              <i class="fas fa-magnifying-glass"></i>
              <input v-model="busSearch" placeholder="Search bus…" class="rp-search-mini-input"/>
            </div>
            <button class="rp-export-btn" @click="exportExcel"><i class="fas fa-file-excel"></i> Export</button>
          </div>
        </div>
        <div class="rp-table-wrap">
          <table class="rp-table">
            <thead>
              <tr>
                <th>#</th>
                <th @click="sortBy('code')" class="rp-th-sort">Bus Code <i class="fas fa-sort"></i></th>
                <th @click="sortBy('plate')" class="rp-th-sort">Plate <i class="fas fa-sort"></i></th>
                <th @click="sortBy('route')" class="rp-th-sort">Route <i class="fas fa-sort"></i></th>
                <th @click="sortBy('trips')" class="rp-th-sort">Trips <i class="fas fa-sort"></i></th>
                <th @click="sortBy('passengers')" class="rp-th-sort">Passengers <i class="fas fa-sort"></i></th>
                <th @click="sortBy('fareRev')" class="rp-th-sort">Fare Revenue <i class="fas fa-sort"></i></th>
                <th @click="sortBy('terminalRev')" class="rp-th-sort">Terminal Fees <i class="fas fa-sort"></i></th>
                <th @click="sortBy('totalRev')" class="rp-th-sort">Total Revenue <i class="fas fa-sort"></i></th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(b, i) in filteredBusRevenue"
                :key="b.code"
                class="rp-tr"
              >
                <td class="rp-td-num">{{ i + 1 }}</td>
                <td><span class="rp-bus-code-chip">{{ b.code }}</span></td>
                <td class="rp-mono">{{ b.plate }}</td>
                <td>{{ b.route }}</td>
                <td class="rp-td-num">{{ b.trips }}</td>
                <td class="rp-td-num">{{ b.passengers.toLocaleString() }}</td>
                <td class="rp-td-money">₱ {{ fmt(b.fareRev) }}</td>
                <td class="rp-td-money rp-td-money--violet">₱ {{ fmt(b.terminalRev) }}</td>
                <td class="rp-td-money rp-td-money--strong">₱ {{ fmt(b.totalRev) }}</td>
                <td>
                  <span class="rp-status-chip" :class="`rp-sc--${b.status.toLowerCase()}`">
                    <i class="fas" :class="b.status === 'Online' ? 'fa-circle-check' : b.status === 'Warning' ? 'fa-triangle-exclamation' : 'fa-circle-xmark'"></i>
                    {{ b.status }}
                  </span>
                </td>
              </tr>
            </tbody>
            <tfoot>
              <tr class="rp-tfoot">
                <td colspan="4"><strong>TOTAL</strong></td>
                <td class="rp-td-num"><strong>{{ totalTrips }}</strong></td>
                <td class="rp-td-num"><strong>{{ totalPassengers.toLocaleString() }}</strong></td>
                <td class="rp-td-money rp-td-money--strong">₱ {{ fmt(totalFareRev) }}</td>
                <td class="rp-td-money rp-td-money--strong">₱ {{ fmt(totalTerminalRev) }}</td>
                <td class="rp-td-money rp-td-money--strong rp-td-money--grand">₱ {{ fmt(totalFareRev + totalTerminalRev) }}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </template>

    <!-- ══════════════════════════════════════════ -->
    <!-- Commuter / Passenger Report -->
    <!-- ══════════════════════════════════════════ -->
    <template v-else-if="activeTab === 'commuter'">
      <div class="rp-kpi-row">
        <div class="rp-kpi rp-kpi--blue">
          <div class="rp-kpi-label">Total Commuters</div>
          <div class="rp-kpi-value">{{ commuterStats.total.toLocaleString() }}</div>
          <div class="rp-kpi-sub"><i class="fas fa-arrow-trend-up"></i> +12.4% vs last period</div>
        </div>
        <div class="rp-kpi rp-kpi--emerald">
          <div class="rp-kpi-label">Regular Fare Riders</div>
          <div class="rp-kpi-value">{{ commuterStats.regular.toLocaleString() }}</div>
          <div class="rp-kpi-sub">{{ pct(commuterStats.regular, commuterStats.total) }}% of total</div>
        </div>
        <div class="rp-kpi rp-kpi--violet">
          <div class="rp-kpi-label">Discounted (PWD/Senior)</div>
          <div class="rp-kpi-value">{{ commuterStats.discounted.toLocaleString() }}</div>
          <div class="rp-kpi-sub">{{ pct(commuterStats.discounted, commuterStats.total) }}% of total</div>
        </div>
        <div class="rp-kpi rp-kpi--amber">
          <div class="rp-kpi-label">Students</div>
          <div class="rp-kpi-value">{{ commuterStats.students.toLocaleString() }}</div>
          <div class="rp-kpi-sub">{{ pct(commuterStats.students, commuterStats.total) }}% of total</div>
        </div>
        <div class="rp-kpi rp-kpi--rose">
          <div class="rp-kpi-label">Peak Hour Load</div>
          <div class="rp-kpi-value">{{ commuterStats.peakLoad }}%</div>
          <div class="rp-kpi-sub">At 17:00 — highest today</div>
        </div>
      </div>

      <div class="rp-card">
        <div class="rp-card-head">
          <div class="rp-card-title"><i class="fas fa-users"></i> Monthly Commuter Report by Route</div>
          <button class="rp-export-btn" @click="exportPDF"><i class="fas fa-file-pdf"></i> PDF</button>
        </div>
        <div class="rp-table-wrap">
          <table class="rp-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Route</th>
                <th>Buses Assigned</th>
                <th>Total Trips</th>
                <th>Total Commuters</th>
                <th>Regular</th>
                <th>Discounted</th>
                <th>Students</th>
                <th>Avg Load / Trip</th>
                <th>Peak Hour</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(r, i) in commuterRoutes" :key="r.route" class="rp-tr">
                <td class="rp-td-num">{{ i + 1 }}</td>
                <td><span class="rp-route-chip">{{ r.route }}</span></td>
                <td class="rp-td-num">{{ r.buses }}</td>
                <td class="rp-td-num">{{ r.trips }}</td>
                <td class="rp-td-num rp-td-money--strong">{{ r.total.toLocaleString() }}</td>
                <td class="rp-td-num">{{ r.regular.toLocaleString() }}</td>
                <td class="rp-td-num">{{ r.discounted.toLocaleString() }}</td>
                <td class="rp-td-num">{{ r.students.toLocaleString() }}</td>
                <td class="rp-td-num">
                  <div class="rp-load-wrap">
                    <div class="rp-load-bar" :style="{ width: r.avgLoad + '%' }" :class="r.avgLoad >= 80 ? 'rp-lb--high' : r.avgLoad >= 50 ? 'rp-lb--mid' : 'rp-lb--low'"></div>
                    <span>{{ r.avgLoad }}%</span>
                  </div>
                </td>
                <td>{{ r.peakHour }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>

    <!-- ══════════════════════════════════════════ -->
    <!-- Bus Assignment Report -->
    <!-- ══════════════════════════════════════════ -->
    <template v-else-if="activeTab === 'assignment'">
      <div class="rp-kpi-row">
        <div class="rp-kpi rp-kpi--blue">
          <div class="rp-kpi-label">Total Buses</div>
          <div class="rp-kpi-value">{{ busRevenueData.length }}</div>
          <div class="rp-kpi-sub">In fleet</div>
        </div>
        <div class="rp-kpi rp-kpi--emerald">
          <div class="rp-kpi-label">Assigned</div>
          <div class="rp-kpi-value">{{ busRevenueData.filter(b => b.route !== 'Unassigned').length }}</div>
          <div class="rp-kpi-sub">Active route assignment</div>
        </div>
        <div class="rp-kpi rp-kpi--amber">
          <div class="rp-kpi-label">On Standby</div>
          <div class="rp-kpi-value">3</div>
          <div class="rp-kpi-sub">Ready to deploy</div>
        </div>
        <div class="rp-kpi rp-kpi--rose">
          <div class="rp-kpi-label">Under Maintenance</div>
          <div class="rp-kpi-value">2</div>
          <div class="rp-kpi-sub">Scheduled repair</div>
        </div>
        <div class="rp-kpi rp-kpi--violet">
          <div class="rp-kpi-label">Unique Routes</div>
          <div class="rp-kpi-value">{{ uniqueRoutes }}</div>
          <div class="rp-kpi-sub">Active corridors</div>
        </div>
      </div>

      <div class="rp-card">
        <div class="rp-card-head">
          <div class="rp-card-title"><i class="fas fa-clipboard-list"></i> Bus Assignment Report</div>
          <div class="rp-card-tools">
            <button class="rp-export-btn" @click="printPage"><i class="fas fa-print"></i> Print</button>
            <button class="rp-export-btn" @click="exportPDF"><i class="fas fa-file-pdf"></i> PDF</button>
          </div>
        </div>
        <div class="rp-table-wrap">
          <table class="rp-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Bus Code</th>
                <th>Plate Number</th>
                <th>Route Assigned</th>
                <th>Driver</th>
                <th>Conductor</th>
                <th>Shift</th>
                <th>Capacity</th>
                <th>Terminal</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(b, i) in busRevenueData" :key="b.code" class="rp-tr">
                <td class="rp-td-num">{{ i + 1 }}</td>
                <td><span class="rp-bus-code-chip">{{ b.code }}</span></td>
                <td class="rp-mono">{{ b.plate }}</td>
                <td>{{ b.route }}</td>
                <td>{{ b.driver }}</td>
                <td>{{ b.conductor }}</td>
                <td><span class="rp-shift-chip" :class="`rp-shift--${b.shift.toLowerCase()}`">{{ b.shift }}</span></td>
                <td class="rp-td-num">{{ b.capacity }}</td>
                <td>{{ b.terminal }}</td>
                <td>
                  <span class="rp-status-chip" :class="`rp-sc--${b.status.toLowerCase()}`">
                    <i class="fas" :class="b.status === 'Online' ? 'fa-circle-check' : b.status === 'Warning' ? 'fa-triangle-exclamation' : 'fa-circle-xmark'"></i>
                    {{ b.status }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>

    <!-- ══════════════════════════════════════════ -->
    <!-- GPS Activity Report -->
    <!-- ══════════════════════════════════════════ -->
    <template v-else-if="activeTab === 'gps'">
      <div class="rp-kpi-row">
        <div class="rp-kpi rp-kpi--blue">
          <div class="rp-kpi-label">Total GPS Pings</div>
          <div class="rp-kpi-value">{{ gpsStats.totalPings.toLocaleString() }}</div>
          <div class="rp-kpi-sub">All devices today</div>
        </div>
        <div class="rp-kpi rp-kpi--emerald">
          <div class="rp-kpi-label">Active Devices</div>
          <div class="rp-kpi-value">{{ gpsStats.activeDevices }}</div>
          <div class="rp-kpi-sub">Reporting in last 5 min</div>
        </div>
        <div class="rp-kpi rp-kpi--rose">
          <div class="rp-kpi-label">Lost Signal Events</div>
          <div class="rp-kpi-value">{{ gpsStats.lostSignal }}</div>
          <div class="rp-kpi-sub">Across all buses</div>
        </div>
        <div class="rp-kpi rp-kpi--amber">
          <div class="rp-kpi-label">Avg Signal Strength</div>
          <div class="rp-kpi-value">{{ gpsStats.avgSignal }}<span style="font-size:14px;font-weight:600;color:var(--muted)"> dBm</span></div>
          <div class="rp-kpi-sub">Fleet average</div>
        </div>
        <div class="rp-kpi rp-kpi--violet">
          <div class="rp-kpi-label">Total KM Logged</div>
          <div class="rp-kpi-value">{{ gpsStats.totalKm.toLocaleString() }}</div>
          <div class="rp-kpi-sub">km driven today</div>
        </div>
      </div>

      <div class="rp-card">
        <div class="rp-card-head">
          <div class="rp-card-title"><i class="fas fa-satellite-dish"></i> Daily GPS Activity Report — Per Bus</div>
          <button class="rp-export-btn" @click="exportExcel"><i class="fas fa-file-excel"></i> Export</button>
        </div>
        <div class="rp-table-wrap">
          <table class="rp-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Bus Code</th>
                <th>Plate</th>
                <th>Device ID</th>
                <th>Total Pings</th>
                <th>Lost Signal</th>
                <th>KM Logged</th>
                <th>Avg Speed</th>
                <th>Max Speed</th>
                <th>Last Ping</th>
                <th>Signal</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(b, i) in gpsActivityData" :key="b.code" class="rp-tr">
                <td class="rp-td-num">{{ i + 1 }}</td>
                <td><span class="rp-bus-code-chip">{{ b.code }}</span></td>
                <td class="rp-mono">{{ b.plate }}</td>
                <td class="rp-mono rp-td-muted">{{ b.deviceId }}</td>
                <td class="rp-td-num">{{ b.pings.toLocaleString() }}</td>
                <td class="rp-td-num" :class="b.lost > 5 ? 'rp-td-danger' : ''">{{ b.lost }}</td>
                <td class="rp-td-num">{{ b.km }} km</td>
                <td class="rp-td-num">{{ b.avgSpeed }} km/h</td>
                <td class="rp-td-num">{{ b.maxSpeed }} km/h</td>
                <td class="rp-td-muted">{{ b.lastPing }}</td>
                <td>
                  <span class="rp-signal-chip" :class="signalClass(b.signal)">
                    <i class="fas fa-signal"></i> {{ b.signal }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>

    <!-- ══════════════════════════════════════════ -->
    <!-- Fare Collection Report -->
    <!-- ══════════════════════════════════════════ -->
    <template v-else-if="activeTab === 'fare'">
      <div class="rp-kpi-row">
        <div class="rp-kpi rp-kpi--emerald">
          <div class="rp-kpi-label">Total Fare Collected</div>
          <div class="rp-kpi-value">₱ {{ fmt(fareStats.total) }}</div>
          <div class="rp-kpi-sub"><i class="fas fa-arrow-trend-up"></i> +9.1% vs yesterday</div>
        </div>
        <div class="rp-kpi rp-kpi--blue">
          <div class="rp-kpi-label">Regular Fare</div>
          <div class="rp-kpi-value">₱ {{ fmt(fareStats.regular) }}</div>
          <div class="rp-kpi-sub">{{ pct(fareStats.regular, fareStats.total) }}% of collection</div>
        </div>
        <div class="rp-kpi rp-kpi--violet">
          <div class="rp-kpi-label">Discounted Fare</div>
          <div class="rp-kpi-value">₱ {{ fmt(fareStats.discounted) }}</div>
          <div class="rp-kpi-sub">PWD, Senior, Students</div>
        </div>
        <div class="rp-kpi rp-kpi--amber">
          <div class="rp-kpi-label">Avg Fare / Commuter</div>
          <div class="rp-kpi-value">₱ {{ fareStats.avgPerCommuter }}</div>
          <div class="rp-kpi-sub">Across all routes</div>
        </div>
        <div class="rp-kpi rp-kpi--rose">
          <div class="rp-kpi-label">Uncollected / Variance</div>
          <div class="rp-kpi-value">₱ {{ fmt(fareStats.variance) }}</div>
          <div class="rp-kpi-sub">Requires reconciliation</div>
        </div>
      </div>

      <div class="rp-card">
        <div class="rp-card-head">
          <div class="rp-card-title"><i class="fas fa-coins"></i> Fare Collection Report — Per Bus</div>
          <div class="rp-card-tools">
            <button class="rp-export-btn" @click="exportExcel"><i class="fas fa-file-excel"></i> Excel</button>
            <button class="rp-export-btn" @click="exportPDF"><i class="fas fa-file-pdf"></i> PDF</button>
          </div>
        </div>
        <div class="rp-table-wrap">
          <table class="rp-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Bus Code</th>
                <th>Plate</th>
                <th>Route</th>
                <th>Trips Made</th>
                <th>Boarding Count</th>
                <th>Regular Fare</th>
                <th>Discounted</th>
                <th>Total Collected</th>
                <th>Expected</th>
                <th>Variance</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(b, i) in farePerBus" :key="b.code" class="rp-tr">
                <td class="rp-td-num">{{ i + 1 }}</td>
                <td><span class="rp-bus-code-chip">{{ b.code }}</span></td>
                <td class="rp-mono">{{ b.plate }}</td>
                <td>{{ b.route }}</td>
                <td class="rp-td-num">{{ b.trips }}</td>
                <td class="rp-td-num">{{ b.boardings.toLocaleString() }}</td>
                <td class="rp-td-money">₱ {{ fmt(b.regular) }}</td>
                <td class="rp-td-money rp-td-money--violet">₱ {{ fmt(b.discounted) }}</td>
                <td class="rp-td-money rp-td-money--strong">₱ {{ fmt(b.collected) }}</td>
                <td class="rp-td-money">₱ {{ fmt(b.expected) }}</td>
                <td class="rp-td-num" :class="b.variance < 0 ? 'rp-td-danger' : 'rp-td-success'">
                  {{ b.variance >= 0 ? '+' : '' }}₱{{ fmt(Math.abs(b.variance)) }}
                </td>
              </tr>
            </tbody>
            <tfoot>
              <tr class="rp-tfoot">
                <td colspan="5"><strong>TOTAL</strong></td>
                <td class="rp-td-num"><strong>{{ farePerBus.reduce((a,b)=>a+b.boardings,0).toLocaleString() }}</strong></td>
                <td class="rp-td-money rp-td-money--strong">₱ {{ fmt(farePerBus.reduce((a,b)=>a+b.regular,0)) }}</td>
                <td class="rp-td-money rp-td-money--strong">₱ {{ fmt(farePerBus.reduce((a,b)=>a+b.discounted,0)) }}</td>
                <td class="rp-td-money rp-td-money--strong rp-td-money--grand">₱ {{ fmt(farePerBus.reduce((a,b)=>a+b.collected,0)) }}</td>
                <td class="rp-td-money rp-td-money--strong">₱ {{ fmt(farePerBus.reduce((a,b)=>a+b.expected,0)) }}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </template>

    <!-- ── Footer stamp ── -->
    <div class="rp-footer">
      <div class="rp-footer-left">
        <i class="fas fa-file-signature"></i>
        Transit Management System · Auto-generated report · {{ nowLabel }}
      </div>
      <div class="rp-footer-right">
        <button class="rp-btn-ghost" @click="printPage"><i class="fas fa-print"></i> Print This Report</button>
      </div>
    </div>

  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from "vue";
import {
  getReportsSummary,
  getRevenueReport,
  getCommuterReport,
  getAssignmentReport,
  getGpsActivityReport,
  getFareCollectionReport,
} from "@/services/api/reportsService";

const dateRange = ref("month");
const activeTab = ref("revenue");
const busSearch = ref("");
const sortKey = ref("totalRev");
const sortDir = ref("desc");

const loading = ref(false);
const error = ref("");

const reportTabs = [
  { key: "revenue", label: "Revenue", icon: "fas fa-peso-sign" },
  { key: "commuter", label: "Commuter Report", icon: "fas fa-users" },
  { key: "assignment", label: "Bus Assignment", icon: "fas fa-clipboard-list" },
  { key: "gps", label: "GPS Activity", icon: "fas fa-satellite-dish" },
  { key: "fare", label: "Fare Collection", icon: "fas fa-coins" },
];

const summaryData = ref(null);
const revenueReport = ref(null);
const commuterReport = ref(null);
const assignmentReport = ref(null);
const gpsReport = ref(null);
const fareReport = ref(null);

const nowLabel = computed(() => {
  const d = new Date();

  return d.toLocaleDateString("en-PH", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
});

const periodLabel = computed(() => {
  const map = {
    today: "Today",
    week: "This Week",
    month: "This Month",
    quarter: "This Quarter",
    year: "This Year",
  };

  return map[dateRange.value] || "This Month";
});

function fmt(n) {
  return Number(n || 0).toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function pct(part, total) {
  const p = Number(part || 0);
  const t = Number(total || 0);

  if (!t) return 0;
  return Math.round((p / t) * 100);
}

function signalClass(s) {
  if (s === "Strong" || s === "Excellent" || s === "Online") {
    return "rp-signal--strong";
  }

  if (s === "Good") {
    return "rp-signal--good";
  }

  if (s === "Weak" || s === "Warning") {
    return "rp-signal--weak";
  }

  return "rp-signal--none";
}

function sortBy(key) {
  if (sortKey.value === key) {
    sortDir.value = sortDir.value === "asc" ? "desc" : "asc";
  } else {
    sortKey.value = key;
    sortDir.value = "desc";
  }
}

function normalizeStatus(status) {
  if (!status) return "Offline";

  const s = String(status).toLowerCase();

  if (s === "online" || s === "active") return "Online";
  if (s === "warning") return "Warning";

  return "Offline";
}

function safeText(value, fallback = "N/A") {
  if (value === null || value === undefined || value === "") return fallback;
  return value;
}

async function loadReports() {
  loading.value = true;
  error.value = "";

  try {
    const [
      summaryRes,
      revenueRes,
      commuterRes,
      assignmentRes,
      gpsRes,
      fareRes,
    ] = await Promise.all([
      getReportsSummary(dateRange.value),
      getRevenueReport(dateRange.value),
      getCommuterReport(dateRange.value),
      getAssignmentReport(),
      getGpsActivityReport(),
      getFareCollectionReport(dateRange.value),
    ]);

    summaryData.value = summaryRes.data;
    revenueReport.value = revenueRes.data;
    commuterReport.value = commuterRes.data;
    assignmentReport.value = assignmentRes.data;
    gpsReport.value = gpsRes.data;
    fareReport.value = fareRes.data;
  } catch (err) {
    console.error("loadReports error:", err);

    error.value =
      err?.response?.data?.message ||
      err?.message ||
      "Failed to load reports.";
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  loadReports();
});

watch(dateRange, () => {
  loadReports();
});

/* ─────────────────────────────
   Assignment + Revenue shared bus rows
───────────────────────────── */

const assignmentRows = computed(() => {
  return Array.isArray(assignmentReport.value?.rows)
    ? assignmentReport.value.rows
    : [];
});

const revenueRows = computed(() => {
  return Array.isArray(revenueReport.value?.rows)
    ? revenueReport.value.rows
    : [];
});

const revenueMap = computed(() => {
  const map = new Map();

  revenueRows.value.forEach((row) => {
    const key = row.code || row.busNumber || row.bus_number || row.busId;
    if (!key) return;

    map.set(String(key), row);
  });

  return map;
});

const busRevenueData = computed(() => {
  const rows = assignmentRows.value.map((row) => {
    const code = safeText(row.code || row.busNumber || row.bus_number, "N/A");
    const rev = revenueMap.value.get(String(code)) || {};

    const fareRev = Number(
      rev.fareRevenue ??
        rev.fare_revenue ??
        rev.fareRev ??
        0
    );

    const terminalRev = Number(
      rev.terminalRevenue ??
        rev.terminal_revenue ??
        rev.terminalRev ??
        0
    );

    const deductions = Number(rev.deductions ?? 0);

    return {
      busId: row.busId || row.bus_id || rev.busId || null,
      code,
      plate: safeText(row.plate || row.plate_number || rev.plate, "N/A"),
      route: safeText(row.route || rev.route, "Unassigned"),

      driver: safeText(row.driver, "N/A"),
      conductor: safeText(row.conductor, "N/A"),
      shift: safeText(row.shift, "N/A"),
      capacity: Number(row.capacity || 0),
      terminal: safeText(row.terminal, "N/A"),

      status: normalizeStatus(row.status),
      trips: Number(rev.trips || rev.transactions || 0),
      passengers: Number(rev.passengers || rev.boardings || 0),

      fareRev,
      terminalRev,
      deductions,
      totalRev: fareRev + terminalRev - deductions,
    };
  });

  revenueRows.value.forEach((rev) => {
    const code = safeText(rev.code || rev.busNumber || rev.bus_number, "N/A");

    const exists = rows.some((item) => String(item.code) === String(code));
    if (exists) return;

    const fareRev = Number(rev.fareRevenue || rev.fare_revenue || 0);
    const terminalRev = Number(rev.terminalRevenue || rev.terminal_revenue || 0);
    const deductions = Number(rev.deductions || 0);

    rows.push({
      busId: rev.busId || null,
      code,
      plate: safeText(rev.plate, "N/A"),
      route: safeText(rev.route, "Unassigned"),
      driver: "N/A",
      conductor: "N/A",
      shift: "N/A",
      capacity: 0,
      terminal: "N/A",
      status: "Offline",
      trips: Number(rev.trips || rev.transactions || 0),
      passengers: Number(rev.passengers || rev.boardings || 0),
      fareRev,
      terminalRev,
      deductions,
      totalRev: fareRev + terminalRev - deductions,
    });
  });

  return rows;
});

const filteredBusRevenue = computed(() => {
  const kw = busSearch.value.trim().toLowerCase();

  let list = busRevenueData.value;

  if (kw) {
    list = list.filter((b) =>
      [b.code, b.plate, b.route, b.status]
        .join(" ")
        .toLowerCase()
        .includes(kw)
    );
  }

  return [...list].sort((a, b) => {
    const mul = sortDir.value === "asc" ? 1 : -1;

    const av = a[sortKey.value];
    const bv = b[sortKey.value];

    if (typeof av === "string") {
      return mul * String(av).localeCompare(String(bv || ""));
    }

    return mul * (Number(av || 0) - Number(bv || 0));
  });
});

const totalTrips = computed(() => {
  return busRevenueData.value.reduce((sum, b) => sum + Number(b.trips || 0), 0);
});

const totalPassengers = computed(() => {
  return busRevenueData.value.reduce(
    (sum, b) => sum + Number(b.passengers || 0),
    0
  );
});

const totalFareRev = computed(() => {
  return busRevenueData.value.reduce(
    (sum, b) => sum + Number(b.fareRev || 0),
    0
  );
});

const totalTerminalRev = computed(() => {
  return busRevenueData.value.reduce(
    (sum, b) => sum + Number(b.terminalRev || 0),
    0
  );
});

const uniqueRoutes = computed(() => {
  return new Set(
    busRevenueData.value
      .map((b) => b.route)
      .filter((route) => route && route !== "Unassigned")
  ).size;
});

/* ─────────────────────────────
   Revenue
───────────────────────────── */

const revenue = computed(() => {
  const kpis = revenueReport.value?.kpis || {};

  const fare = Number(kpis.fareRevenue ?? totalFareRev.value ?? 0);
  const terminalFees = Number(
    kpis.terminalFees ?? totalTerminalRev.value ?? 0
  );
  const deductions = Number(kpis.deductions ?? 0);
  const total = Number(kpis.totalRevenue ?? fare + terminalFees - deductions);

  return {
    total,
    fare,
    terminalFees,
    deductions,
    avgPerBus: Number(
      kpis.avgRevenuePerBus ||
        (busRevenueData.value.length
          ? Math.round(total / busRevenueData.value.length)
          : 0)
    ),
  };
});

const dailyRevenue = computed(() => {
  const rows = Array.isArray(revenueReport.value?.daily)
    ? revenueReport.value.daily
    : [];

  return rows.map((row) => {
    const d = new Date(row.date);

    return {
      label: Number.isNaN(d.getTime())
        ? safeText(row.date, "N/A")
        : d.toLocaleDateString("en-PH", {
            month: "short",
            day: "numeric",
          }),
      fare: Number(row.fare || 0),
      terminal: Number(row.terminal || 0),
    };
  });
});

const maxDailyRev = computed(() => {
  const max = Math.max(
    ...dailyRevenue.value.map((d) => Number(d.fare || 0) + Number(d.terminal || 0)),
    0
  );

  return max > 0 ? max : 1;
});

const revChartYLabels = computed(() => {
  const m = maxDailyRev.value;

  return [
    fmt(m),
    fmt(m * 0.75),
    fmt(m * 0.5),
    fmt(m * 0.25),
    "0",
  ].reverse();
});

/* ─────────────────────────────
   Commuter
───────────────────────────── */

const commuterStats = computed(() => {
  const kpis = commuterReport.value?.kpis || {};

  return {
    total: Number(kpis.totalCommuters || 0),
    regular: Number(kpis.regular || 0),
    discounted: Number(kpis.discounted || 0),
    students: Number(kpis.students || 0),
    peakLoad: Number(kpis.peakLoad || 0),
  };
});

const commuterRoutes = computed(() => {
  const rows = Array.isArray(commuterReport.value?.rows)
    ? commuterReport.value.rows
    : [];

  return rows.map((row) => ({
    route: safeText(row.route, "Unknown Route"),
    buses: Number(row.buses || 0),
    trips: Number(row.trips || 0),
    total: Number(row.total || 0),
    regular: Number(row.regular || 0),
    discounted: Number(row.discounted || 0),
    students: Number(row.students || 0),
    avgLoad: Number(row.avgLoad || 0),
    peakHour: safeText(row.peakHour, "N/A"),
  }));
});

/* ─────────────────────────────
   GPS Activity
   No gps_history.
   Snapshot only.
───────────────────────────── */

const gpsStats = computed(() => {
  const kpis = gpsReport.value?.kpis || {};

  return {
    totalPings: Number(kpis.totalPings || 0),
    activeDevices: Number(kpis.activeDevices || 0),
    lostSignal: Number(kpis.lostSignalEvents || 0),
    avgSignal: Number(kpis.avgSignal || 0),
    totalKm: Number(kpis.totalKmLogged || 0),
  };
});

const gpsActivityData = computed(() => {
  const rows = Array.isArray(gpsReport.value?.rows)
    ? gpsReport.value.rows
    : [];

  return rows.map((row) => {
    const status = normalizeStatus(row.status);

    return {
      code: safeText(row.code, "Unassigned"),
      plate: safeText(row.plate, "N/A"),
      deviceId: safeText(row.deviceId || row.device_code, "No device"),

      // Since hindi ka gumagamit ng gps_history,
      // these historical values stay 0.
      pings: 0,
      lost: status === "Warning" || status === "Offline" ? 1 : 0,
      km: 0,
      avgSpeed: Number(row.speed || 0),
      maxSpeed: Number(row.speed || 0),

      lastPing: safeText(row.lastPing || row.lastSeenLabel, "N/A"),
      signal: status,
    };
  });
});

/* ─────────────────────────────
   Fare Collection
───────────────────────────── */

const fareStats = computed(() => {
  const kpis = fareReport.value?.kpis || {};

  return {
    total: Number(kpis.totalCollected || 0),
    regular: Number(kpis.regularFare || 0),
    discounted: Number(kpis.discountedFare || 0),
    avgPerCommuter: Number(kpis.avgFarePerCommuter || 0),
    variance: Number(kpis.variance || 0),
  };
});

const farePerBus = computed(() => {
  const rows = Array.isArray(fareReport.value?.rows)
    ? fareReport.value.rows
    : [];

  return rows.map((row) => ({
    code: safeText(row.code, "N/A"),
    plate: safeText(row.plate, "N/A"),
    route: safeText(row.route, "Unassigned"),
    trips: Number(row.trips || 0),
    boardings: Number(row.boardings || 0),
    regular: Number(row.regular || 0),
    discounted: Number(row.discounted || 0),
    collected: Number(row.collected || 0),
    expected: Number(row.expected || 0),
    variance: Number(row.variance || 0),
  }));
});

/* ─────────────────────────────
   Export
───────────────────────────── */

function downloadCsv(filename, rows) {
  if (!Array.isArray(rows) || rows.length === 0) {
    alert("No data available to export.");
    return;
  }

  const headers = Object.keys(rows[0]);

  const csv = [
    headers.join(","),
    ...rows.map((row) =>
      headers
        .map((key) => {
          const value = row[key] ?? "";
          return `"${String(value).replaceAll('"', '""')}"`;
        })
        .join(",")
    ),
  ].join("\n");

  const blob = new Blob([csv], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  link.click();

  URL.revokeObjectURL(url);
}

function exportExcel() {
  const range = dateRange.value;

  if (activeTab.value === "revenue") {
    downloadCsv(`revenue-report-${range}.csv`, filteredBusRevenue.value);
    return;
  }

  if (activeTab.value === "commuter") {
    downloadCsv(`commuter-report-${range}.csv`, commuterRoutes.value);
    return;
  }

  if (activeTab.value === "assignment") {
    downloadCsv(`assignment-report-${range}.csv`, busRevenueData.value);
    return;
  }

  if (activeTab.value === "gps") {
    downloadCsv(`gps-report-${range}.csv`, gpsActivityData.value);
    return;
  }

  if (activeTab.value === "fare") {
    downloadCsv(`fare-report-${range}.csv`, farePerBus.value);
    return;
  }
}

function exportPDF() {
  window.print();
}

function printPage() {
  window.print();
}
</script>
<style scoped>
/* ─── Tokens ─────────────────────────────── */
.rp {
  --emerald: #10b981;
  --blue:    #3b82f6;
  --violet:  #7c3aed;
  --amber:   #f59e0b;
  --rose:    #f43f5e;
  --border:  #e2e8f0;
  --bg:      #f8fafc;
  --card:    #ffffff;
  --text:    #0f172a;
  --muted:   #64748b;
  --radius:  13px;

  font-family: 'DM Sans', 'Segoe UI', sans-serif;
  background: var(--bg);
  padding: 24px;
  min-height: 100vh;
  color: var(--text);
  display: flex;
  flex-direction: column;
  gap: 18px;
}

/* ─── Header ─────────────────────────────── */
.rp-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.rp-title-row {
  display: flex;
  align-items: center;
  gap: 14px;
}

.rp-title-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%);
  color: #fff;
  display: grid;
  place-items: center;
  font-size: 18px;
  flex-shrink: 0;
}

.rp-title {
  font-size: 22px;
  font-weight: 900;
  letter-spacing: -0.5px;
  margin: 0;
  color: var(--text);
}

.rp-subtitle {
  font-size: 12px;
  color: var(--muted);
  margin: 3px 0 0;
}

.rp-header-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.rp-date-range {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 36px;
  padding: 0 12px;
  border-radius: 10px;
  border: 1px solid var(--border);
  background: var(--card);
  color: var(--muted);
  font-size: 13px;
}

.rp-select {
  border: none;
  outline: none;
  background: transparent;
  font-size: 13px;
  font-weight: 700;
  color: var(--text);
  cursor: pointer;
}

.rp-btn-ghost {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 36px;
  padding: 0 14px;
  border-radius: 10px;
  border: 1px solid var(--border);
  background: var(--card);
  font-size: 13px;
  font-weight: 700;
  color: var(--muted);
  cursor: pointer;
  transition: all .15s;
}
.rp-btn-ghost:hover { color: var(--text); border-color: #94a3b8; }

.rp-btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 36px;
  padding: 0 14px;
  border-radius: 10px;
  border: none;
  background: #16a34a;
  color: #fff;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: opacity .15s;
}
.rp-btn-primary:hover { opacity: .88; }

.rp-btn-pdf {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 36px;
  padding: 0 14px;
  border-radius: 10px;
  border: none;
  background: #dc2626;
  color: #fff;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: opacity .15s;
}
.rp-btn-pdf:hover { opacity: .88; }

/* ─── Meta Bar ───────────────────────────── */
.rp-meta-bar {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 10px 16px;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  flex-wrap: wrap;
}

.rp-meta-item {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  font-size: 12px;
  font-weight: 600;
  color: var(--muted);
}

.rp-meta-item i { color: var(--blue); font-size: 11px; }

.rp-meta-item--status { color: var(--emerald); font-weight: 700; }

.rp-meta-sep {
  width: 1px;
  height: 16px;
  background: var(--border);
}

.rp-live-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--emerald);
  animation: pulse 1.4s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50%       { opacity: .4; transform: scale(.8); }
}

/* ─── Report Tabs ────────────────────────── */
.rp-tabs {
  display: flex;
  gap: 4px;
  border-bottom: 2px solid var(--border);
  padding-bottom: 0;
  overflow-x: auto;
}

.rp-tab {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  height: 40px;
  padding: 0 16px;
  border: none;
  background: transparent;
  font-size: 13px;
  font-weight: 700;
  color: var(--muted);
  cursor: pointer;
  border-bottom: 2px solid transparent;
  margin-bottom: -2px;
  white-space: nowrap;
  transition: all .15s;
}

.rp-tab:hover { color: var(--text); }

.rp-tab--active {
  color: var(--text);
  border-bottom-color: var(--text);
}

/* ─── KPI Row ────────────────────────────── */
.rp-kpi-row {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 12px;
}

.rp-kpi {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 16px;
  position: relative;
  overflow: hidden;
}

.rp-kpi::after {
  content: "";
  position: absolute;
  bottom: 0; left: 0; right: 0;
  height: 3px;
}

.rp-kpi--emerald::after { background: var(--emerald); }
.rp-kpi--blue::after    { background: var(--blue); }
.rp-kpi--violet::after  { background: var(--violet); }
.rp-kpi--amber::after   { background: var(--amber); }
.rp-kpi--rose::after    { background: var(--rose); }

.rp-kpi-label {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: .5px;
  color: var(--muted);
  margin-bottom: 6px;
}

.rp-kpi-value {
  font-size: 20px;
  font-weight: 900;
  letter-spacing: -0.5px;
  line-height: 1;
  color: var(--text);
}

.rp-kpi-sub {
  margin-top: 7px;
  font-size: 11px;
  font-weight: 600;
  color: var(--muted);
  display: flex;
  align-items: center;
  gap: 4px;
}

.rp-kpi--emerald .rp-kpi-sub i { color: var(--emerald); }

/* ─── Card ───────────────────────────────── */
.rp-card {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  overflow: hidden;
}

.rp-card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border);
  background: #f8fafc;
  gap: 12px;
  flex-wrap: wrap;
}

.rp-card-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 800;
  color: var(--text);
}

.rp-card-title i { color: var(--muted); font-size: 12px; }

.rp-card-tools {
  display: flex;
  align-items: center;
  gap: 8px;
}

.rp-export-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 30px;
  padding: 0 12px;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: var(--card);
  font-size: 12px;
  font-weight: 700;
  color: var(--muted);
  cursor: pointer;
  transition: all .15s;
}
.rp-export-btn:hover { color: var(--text); border-color: #94a3b8; }

/* ─── Search mini ────────────────────────── */
.rp-search-mini {
  display: flex;
  align-items: center;
  gap: 7px;
  height: 30px;
  padding: 0 10px;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: var(--bg);
  font-size: 11px;
  color: var(--muted);
}

.rp-search-mini-input {
  border: none;
  outline: none;
  background: transparent;
  font-size: 12px;
  font-weight: 600;
  color: var(--text);
  width: 140px;
}

.rp-search-mini-input::placeholder { color: var(--muted); }

/* ─── Table ──────────────────────────────── */
.rp-table-wrap {
  overflow-x: auto;
}

.rp-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}

.rp-table thead th {
  padding: 10px 14px;
  text-align: left;
  font-size: 10px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: .5px;
  color: var(--muted);
  background: #fafafa;
  border-bottom: 1px solid var(--border);
  white-space: nowrap;
}

.rp-th-sort { cursor: pointer; user-select: none; }
.rp-th-sort:hover { color: var(--text); }
.rp-th-sort i { font-size: 9px; margin-left: 3px; opacity: .5; }

.rp-tr td {
  padding: 10px 14px;
  border-bottom: 1px solid #f1f5f9;
  vertical-align: middle;
  white-space: nowrap;
}

.rp-tr:hover td { background: rgba(59,130,246,.03); }
.rp-tr:last-child td { border-bottom: none; }

.rp-td-num   { text-align: right; font-weight: 700; font-variant-numeric: tabular-nums; }
.rp-td-money { text-align: right; font-weight: 700; font-variant-numeric: tabular-nums; color: #334155; }
.rp-td-money--violet { color: var(--violet); }
.rp-td-money--strong { color: var(--text); font-weight: 800; }
.rp-td-money--grand  { color: var(--emerald); font-size: 13px; }
.rp-td-muted { color: var(--muted); font-size: 11px; }
.rp-td-danger  { color: var(--rose); font-weight: 800; }
.rp-td-success { color: var(--emerald); font-weight: 800; }
.rp-mono { font-family: monospace; font-size: 11px; }

/* Footer row */
.rp-tfoot td {
  padding: 12px 14px;
  background: #f8fafc;
  border-top: 2px solid var(--border);
  font-size: 12px;
}

/* ─── Chips ──────────────────────────────── */
.rp-bus-code-chip {
  display: inline-block;
  padding: 3px 9px;
  border-radius: 6px;
  background: #f1f5f9;
  border: 1px solid var(--border);
  font-size: 11px;
  font-weight: 800;
  font-family: monospace;
  color: var(--text);
}

.rp-route-chip {
  display: inline-block;
  padding: 3px 9px;
  border-radius: 6px;
  background: rgba(59,130,246,.08);
  border: 1px solid rgba(59,130,246,.2);
  font-size: 11px;
  font-weight: 700;
  color: #1d4ed8;
}

.rp-status-chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 9px;
  border-radius: 999px;
  font-size: 10px;
  font-weight: 700;
  white-space: nowrap;
}

.rp-sc--online  { background: rgba(16,185,129,.1);  color: #065f46; }
.rp-sc--warning { background: rgba(245,158,11,.1);  color: #78350f; }
.rp-sc--offline { background: rgba(239,68,68,.08);  color: #991b1b; }

.rp-shift-chip {
  display: inline-block;
  padding: 2px 9px;
  border-radius: 999px;
  font-size: 10px;
  font-weight: 800;
}

.rp-shift--am { background: rgba(245,158,11,.12); color: #92400e; }
.rp-shift--pm { background: rgba(99,102,241,.1);  color: #3730a3; }

.rp-signal-chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 10px;
  font-weight: 700;
}

.rp-signal--strong { background: rgba(16,185,129,.1); color: #065f46; }
.rp-signal--good   { background: rgba(59,130,246,.1); color: #1e40af; }
.rp-signal--weak   { background: rgba(245,158,11,.1); color: #78350f; }
.rp-signal--none   { background: rgba(239,68,68,.08); color: #991b1b; }

/* ─── Revenue Chart ──────────────────────── */
.rp-rev-chart {
  padding: 16px 16px 0;
  display: flex;
  gap: 12px;
  align-items: flex-end;
}

.rp-rev-chart-y {
  display: flex;
  flex-direction: column-reverse;
  justify-content: space-between;
  font-size: 10px;
  font-weight: 600;
  color: var(--muted);
  height: 160px;
  min-width: 56px;
  text-align: right;
  padding-bottom: 20px;
}

.rp-rev-bars {
  flex: 1;
  display: flex;
  align-items: flex-end;
  gap: 8px;
  height: 160px;
  padding-bottom: 22px;
  position: relative;
}

.rp-rev-bars::before {
  content: "";
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 22px;
  background: repeating-linear-gradient(
    to bottom,
    transparent 0px,
    transparent calc(33.33% - 1px),
    #f1f5f9 calc(33.33% - 1px),
    #f1f5f9 33.33%
  );
  pointer-events: none;
}

.rp-rev-bar-group {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  height: 100%;
}

.rp-rev-bar-stack {
  flex: 1;
  width: 100%;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  gap: 2px;
}

.rp-rev-bar {
  width: 100%;
  border-radius: 4px 4px 0 0;
  min-height: 4px;
  transition: opacity .15s;
  cursor: pointer;
}
.rp-rev-bar:hover { opacity: .8; }

.rp-rev-bar--fare { background: var(--emerald); }
.rp-rev-bar--term { background: #6366f1; }
.rp-rev-bar-label { font-size: 11px; font-weight: 700; color: var(--muted); }

.rp-rev-legend {
  display: flex;
  gap: 16px;
  padding: 10px 16px 14px;
  border-top: 1px solid var(--border);
  margin-top: 14px;
}

.rp-rl-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  font-weight: 600;
  color: var(--muted);
}

.rp-rl-dot {
  width: 10px;
  height: 10px;
  border-radius: 3px;
  flex-shrink: 0;
}

/* ─── Load bar ───────────────────────────── */
.rp-load-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  font-weight: 700;
}

.rp-load-bar {
  height: 6px;
  width: 60px;
  border-radius: 999px;
  flex-shrink: 0;
}

.rp-lb--high { background: var(--rose); }
.rp-lb--mid  { background: var(--amber); }
.rp-lb--low  { background: var(--emerald); }

/* ─── Footer ─────────────────────────────── */
.rp-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 18px;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  font-size: 11px;
  font-weight: 600;
  color: var(--muted);
  flex-wrap: wrap;
  gap: 10px;
}

.rp-footer-left { display: flex; align-items: center; gap: 8px; }
.rp-footer-left i { color: var(--blue); }

/* ─── Print ──────────────────────────────── */
@media print {
  .rp-header-right,
  .rp-export-btn,
  .rp-btn-ghost,
  .rp-btn-primary,
  .rp-btn-pdf,
  .rp-tabs,
  .rp-footer-right { display: none !important; }

  .rp { background: #fff; padding: 12px; }
  .rp-card { break-inside: avoid; }
}

/* ─── Responsive ─────────────────────────── */
@media (max-width: 1100px) {
  .rp-kpi-row { grid-template-columns: repeat(3, 1fr); }
}

@media (max-width: 768px) {
  .rp { padding: 14px; gap: 14px; }
  .rp-kpi-row { grid-template-columns: repeat(2, 1fr); }
  .rp-header { flex-direction: column; }
}

@media (max-width: 520px) {
  .rp-kpi-row { grid-template-columns: 1fr; }
}
</style>
/**
 * 1. MODULE TÍNH TOÁN ÂM LỊCH VIỆT NAM (HỒ NGỌC ĐỨC - UTC+7)
 */
const LunarEngine = (() => {
  const PI = Math.PI;

  function jdFromDate(dd, mm, yy) {
    const a = Math.floor((14 - mm) / 12);
    const y = yy + 4800 - a;
    const m = mm + 12 * a - 3;
    let jd = dd + Math.floor((153 * m + 2) / 5) + 365 * y +
      Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
    if (jd < 2299161) {
      jd = dd + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - 32083;
    }
    return jd;
  }

  function getNewMoonDay(k, timeZone) {
    const T = k / 1236.85;
    const T2 = T * T;
    const T3 = T2 * T;
    const dr = PI / 180;
    let Jd1 = 2415020.75933 + 29.53058868 * k + 0.0001178 * T2 - 0.000000155 * T3;
    Jd1 += 0.00033 * Math.sin((166.56 + 132.87 * T - 0.009173 * T2) * dr);
    const M = 359.2242 + 29.10535608 * k - 0.0000333 * T2 - 0.00000347 * T3;
    const Mpr = 306.0253 + 385.81691806 * k + 0.0107306 * T2 + 0.00001236 * T3;
    const F = 21.2964 + 390.67050646 * k - 0.0016528 * T2 - 0.00000239 * T3;
    let C1 = (0.1734 - 0.000393 * T) * Math.sin(M * dr) + 0.0021 * Math.sin(2 * dr * M);
    C1 -= 0.4068 * Math.sin(Mpr * dr) + 0.0161 * Math.sin(dr * 2 * Mpr);
    C1 -= 0.0004 * Math.sin(dr * 3 * Mpr);
    C1 += 0.0104 * Math.sin(dr * 2 * F) - 0.0051 * Math.sin(dr * (M + Mpr));
    C1 -= 0.0074 * Math.sin(dr * (M - Mpr)) + 0.0004 * Math.sin(dr * (2 * F + M));
    C1 -= 0.0004 * Math.sin(dr * (2 * F - M)) - 0.0006 * Math.sin(dr * (2 * F + Mpr));
    C1 += 0.0010 * Math.sin(dr * (2 * F - Mpr)) + 0.0005 * Math.sin(dr * (2 * Mpr + M));
    const deltat = (T < -11)
      ? (0.001 + 0.000839 * T + 0.0002261 * T2 - 0.00000845 * T3 - 0.000000081 * T * T3)
      : (-0.000278 + 0.000265 * T + 0.000262 * T2);
    const JdNew = Jd1 + C1 - deltat;
    return Math.floor(JdNew + 0.5 + timeZone / 24);
  }

  function getSunLongitude(jdn, timeZone) {
    const T = (jdn - 2451545.5 - timeZone / 24) / 36525;
    const T2 = T * T;
    const dr = PI / 180;
    const M = 357.52910 + 35999.05030 * T - 0.0001559 * T2 - 0.00000048 * T * T2;
    const L0 = 280.46645 + 36000.76983 * T + 0.0003032 * T2;
    let DL = (1.914600 - 0.004817 * T - 0.000014 * T2) * Math.sin(dr * M);
    DL += (0.019993 - 0.000101 * T) * Math.sin(dr * 2 * M) + 0.000290 * Math.sin(dr * 3 * M);
    let L = (L0 + DL) * dr;
    L = L - PI * 2 * Math.floor(L / (PI * 2));
    return Math.floor((L / PI) * 6);
  }

  function getLunarMonth11(yy, timeZone) {
    const off = jdFromDate(31, 12, yy) - 2415021;
    const k = Math.floor(off / 29.530588853);
    let nm = getNewMoonDay(k, timeZone);
    if (getSunLongitude(nm, timeZone) >= 9) {
      nm = getNewMoonDay(k - 1, timeZone);
    }
    return nm;
  }

  function getLeapMonthOffset(a11, timeZone) {
    const k = Math.floor((a11 - 2415021.076998695) / 29.530588853 + 0.5);
    let last = 0;
    let i = 1;
    let arc = getSunLongitude(getNewMoonDay(k + i, timeZone), timeZone);
    do {
      last = arc;
      i++;
      arc = getSunLongitude(getNewMoonDay(k + i, timeZone), timeZone);
    } while (arc !== last && i < 14);
    return i - 1;
  }

  function convertSolar2Lunar(dd, mm, yy, timeZone = 7) {
    const dayNumber = jdFromDate(dd, mm, yy);
    const k = Math.floor((dayNumber - 2415021.076998695) / 29.530588853);
    let monthStart = getNewMoonDay(k + 1, timeZone);
    if (monthStart > dayNumber) {
      monthStart = getNewMoonDay(k, timeZone);
    }
    let a11 = getLunarMonth11(yy, timeZone);
    let b11 = a11;
    let lunarYear;
    if (a11 >= monthStart) {
      lunarYear = yy;
      a11 = getLunarMonth11(yy - 1, timeZone);
    } else {
      lunarYear = yy + 1;
      b11 = getLunarMonth11(yy + 1, timeZone);
    }
    const lunarDay = dayNumber - monthStart + 1;
    const diff = Math.floor((monthStart - a11) / 29);
    let lunarLeap = 0;
    let lunarMonth = diff + 11;
    if (b11 - a11 > 365) {
      const leapMonthDiff = getLeapMonthOffset(a11, timeZone);
      if (diff >= leapMonthDiff) {
        lunarMonth = diff + 10;
        if (diff === leapMonthDiff) {
          lunarLeap = 1;
        }
      }
    }
    if (lunarMonth > 12) lunarMonth -= 12;
    if (lunarMonth >= 11 && diff < 4) lunarYear -= 1;
    return { day: lunarDay, month: lunarMonth, year: lunarYear, leap: lunarLeap };
  }

  return { convertSolar2Lunar };
})();

/**
 * 2. MODULE TIỆN ÍCH NGÀY THÁNG & UI HELPERS
 */
const DateUtils = {
  MONTH_NAMES: [
    "Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4",
    "Tháng 5", "Tháng 6", "Tháng 7", "Tháng 8",
    "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12"
  ],
  WEEKDAYS: ["T2", "T3", "T4", "T5", "T6", "T7", "CN"],

  pad2(n) {
    return String(n).padStart(2, "0");
  },

  toIsoDate(y, m, d) {
    return `${y}-${this.pad2(m)}-${this.pad2(d)}`;
  },

  formatDisplayDate(iso) {
    const [y, m, d] = iso.split("-");
    return `${d}/${m}/${y}`;
  },

  nextIsoDate(iso) {
    const [y, m, d] = iso.split("-").map(Number);
    const dt = new Date(y, m - 1, d + 1);
    return this.toIsoDate(dt.getFullYear(), dt.getMonth() + 1, dt.getDate());
  },

  isMobile() {
    return window.innerWidth < 768;
  },

  toast(msg) {
    const el = document.getElementById("toast");
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(el._timer);
    el._timer = setTimeout(() => el.classList.remove("show"), 2400);
  }
};

/**
 * 3. MODULE QUẢN LÝ TRẠNG THÁI & LƯU TRỮ (STORE)
 */
const Store = (() => {
  const STORAGE_KEY = "vn_lunar_ics_events_v1";
  const now = new Date();

  const DEFAULTS = {
    startTime: "08:00",
    endTime: "09:00",
    alarm: "15",
    status: "CONFIRMED",
    transp: "OPAQUE",
    classification: "PUBLIC",
    priority: "5"
  };

  const state = {
    todayIso: DateUtils.toIsoDate(now.getFullYear(), now.getMonth() + 1, now.getDate()),
    viewYear: now.getFullYear(),
    viewMonth: now.getMonth(),
    pickerBaseYear: Math.floor(now.getFullYear() / 12) * 12,
    selectedDates: new Set(),
    lastClickedDate: null,
    editingId: null,
    events: []
  };

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) state.events = JSON.parse(raw);
    } catch (err) {
      console.error(err);
      state.events = [];
    }
  }

  function persist() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.events));
  }

  function getScheduledDates() {
    const set = new Set();
    for (const ev of state.events) {
      for (const d of ev.dates) set.add(d);
    }
    return set;
  }

  function getUniqueCategories() {
    return Array.from(
      new Set(state.events.map(ev => (ev.categories || "").trim()).filter(Boolean))
    ).sort((a, b) => a.localeCompare(b, "vi"));
  }

  function saveEvent(eventData) {
    if (state.editingId) {
      const idx = state.events.findIndex(item => item.id === state.editingId);
      if (idx !== -1) state.events[idx] = eventData;
    } else {
      state.events.unshift(eventData);
    }
    persist();
  }

  function deleteEvent(id) {
    state.events = state.events.filter(x => x.id !== id);
    persist();
  }

  load();

  return {
    DEFAULTS,
    state,
    persist,
    getScheduledDates,
    getUniqueCategories,
    saveEvent,
    deleteEvent
  };
})();

/**
 * 4. MODULE ĐỌC / GHI CHUẨN iCALENDAR (.ICS - RFC 5545)
 */
const IcsCodec = (() => {
  function escapeText(str) {
    return (str || "")
      .replace(/\\/g, "\\\\")
      .replace(/;/g, "\\;")
      .replace(/,/g, "\\,")
      .replace(/\r?\n/g, "\\n");
  }

  function unescapeText(str) {
    return (str || "")
      .replace(/\\n/gi, "\n")
      .replace(/\\,/g, ",")
      .replace(/\\;/g, ";")
      .replace(/\\\\/g, "\\");
  }

  function formatUtcStamp(date) {
    return (
      date.getUTCFullYear() +
      DateUtils.pad2(date.getUTCMonth() + 1) +
      DateUtils.pad2(date.getUTCDate()) +
      "T" +
      DateUtils.pad2(date.getUTCHours()) +
      DateUtils.pad2(date.getUTCMinutes()) +
      DateUtils.pad2(date.getUTCSeconds()) +
      "Z"
    );
  }

  function parseDateTime(val) {
    const m = val.match(/^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2}))?/);
    if (!m) return null;
    return {
      date: `${m[1]}-${m[2]}-${m[3]}`,
      time: (m[4] && m[5]) ? `${m[4]}:${m[5]}` : ""
    };
  }

  function serialize(events) {
    const lines = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//VN Lunar Calendar Event Builder//VI",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH"
    ];
    const dtstamp = formatUtcStamp(new Date());

    for (const ev of events) {
      for (const dIso of ev.dates) {
        const compactDate = dIso.replace(/-/g, "");
        lines.push("BEGIN:VEVENT");
        lines.push(`UID:${ev.id}-${compactDate}@vnlunar.local`);
        lines.push(`DTSTAMP:${dtstamp}`);

        if (ev.startTime) {
          const st = ev.startTime.replace(":", "") + "00";
          const et = (ev.endTime || ev.startTime).replace(":", "") + "00";
          lines.push(`DTSTART;TZID=Asia/Ho_Chi_Minh:${compactDate}T${st}`);
          lines.push(`DTEND;TZID=Asia/Ho_Chi_Minh:${compactDate}T${et}`);
        } else {
          const nextCompact = DateUtils.nextIsoDate(dIso).replace(/-/g, "");
          lines.push(`DTSTART;VALUE=DATE:${compactDate}`);
          lines.push(`DTEND;VALUE=DATE:${nextCompact}`);
        }

        lines.push(`SUMMARY:${escapeText(ev.summary)}`);
        if (ev.location) lines.push(`LOCATION:${escapeText(ev.location)}`);
        if (ev.description) lines.push(`DESCRIPTION:${escapeText(ev.description)}`);
        if (ev.categories) lines.push(`CATEGORIES:${escapeText(ev.categories)}`);
        if (ev.status) lines.push(`STATUS:${ev.status}`);
        if (ev.transp) lines.push(`TRANSP:${ev.transp}`);
        if (ev.classification) lines.push(`CLASS:${ev.classification}`);
        if (ev.priority && ev.priority !== "0") lines.push(`PRIORITY:${ev.priority}`);
        if (ev.url) lines.push(`URL:${ev.url}`);
        if (ev.organizer) {
          const org = ev.organizer.startsWith("mailto:") ? ev.organizer : `mailto:${ev.organizer}`;
          lines.push(`ORGANIZER:${org}`);
        }
        if (ev.rrule) lines.push(`RRULE:${ev.rrule}`);

        if (ev.alarm !== "" && ev.alarm !== undefined && ev.alarm !== null) {
          const mins = parseInt(ev.alarm, 10);
          lines.push("BEGIN:VALARM");
          lines.push("ACTION:DISPLAY");
          lines.push(`DESCRIPTION:${escapeText(ev.summary)}`);
          lines.push(`TRIGGER:-PT${mins}M`);
          lines.push("END:VALARM");
        }

        lines.push("END:VEVENT");
      }
    }

    lines.push("END:VCALENDAR");
    return lines.join("\r\n");
  }

  function parse(rawText) {
    const unfolded = rawText.replace(/\r?\n[ \t]/g, "");
    const rawLines = unfolded.split(/\r?\n/);

    const vevents = [];
    let current = null;
    let inAlarm = false;

    for (const line of rawLines) {
      if (line === "BEGIN:VEVENT") {
        current = { dates: [] };
        inAlarm = false;
      } else if (line === "END:VEVENT" && current) {
        if (current.dates.length > 0) vevents.push(current);
        current = null;
      } else if (line === "BEGIN:VALARM") {
        inAlarm = true;
      } else if (line === "END:VALARM") {
        inAlarm = false;
      } else if (current) {
        const colonIdx = line.indexOf(":");
        if (colonIdx === -1) continue;
        const propName = line.slice(0, colonIdx).split(";")[0].toUpperCase();
        const valPart = line.slice(colonIdx + 1);

        if (inAlarm) {
          if (propName === "TRIGGER") {
            const m = valPart.match(/-?PT(\d+)M/i);
            if (m) current.alarm = m[1];
          }
          continue;
        }

        switch (propName) {
          case "SUMMARY": current.summary = unescapeText(valPart); break;
          case "LOCATION": current.location = unescapeText(valPart); break;
          case "DESCRIPTION": current.description = unescapeText(valPart); break;
          case "CATEGORIES": current.categories = unescapeText(valPart); break;
          case "STATUS": current.status = valPart.trim(); break;
          case "TRANSP": current.transp = valPart.trim(); break;
          case "CLASS": current.classification = valPart.trim(); break;
          case "PRIORITY": current.priority = valPart.trim(); break;
          case "URL": current.url = valPart.trim(); break;
          case "ORGANIZER": current.organizer = valPart.replace(/^mailto:/i, "").trim(); break;
          case "RRULE": current.rrule = valPart.trim(); break;
          case "DTSTART": {
            const dt = parseDateTime(valPart);
            if (dt) {
              current.dates.push(dt.date);
              if (dt.time) current.startTime = dt.time;
            }
            break;
          }
          case "DTEND": {
            const dt = parseDateTime(valPart);
            if (dt && dt.time) current.endTime = dt.time;
            break;
          }
          case "RDATE": {
            for (const p of valPart.split(",")) {
              const dt = parseDateTime(p.trim());
              if (dt) current.dates.push(dt.date);
            }
            break;
          }
        }
      }
    }

    const grouped = new Map();
    for (const item of vevents) {
      const key = `${item.summary || ""}|${item.startTime || ""}|${item.endTime || ""}|${item.categories || ""}|${item.location || ""}`;
      if (!grouped.has(key)) {
        grouped.set(key, {
          id: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          summary: item.summary || "Sự kiện nhập từ ICS",
          startTime: item.startTime || "",
          endTime: item.endTime || "",
          categories: item.categories || "",
          location: item.location || "",
          description: item.description || "",
          alarm: item.alarm ?? "",
          status: item.status || Store.DEFAULTS.status,
          transp: item.transp || Store.DEFAULTS.transp,
          classification: item.classification || Store.DEFAULTS.classification,
          priority: item.priority || Store.DEFAULTS.priority,
          url: item.url || "",
          organizer: item.organizer || "",
          rrule: item.rrule || "",
          dates: new Set()
        });
      }
      const target = grouped.get(key);
      for (const d of item.dates) target.dates.add(d);
    }

    return Array.from(grouped.values()).map(ev => ({
      ...ev,
      dates: Array.from(ev.dates).sort()
    }));
  }

  return { serialize, parse };
})();

/**
 * 5. MODULE HIỂN THỊ LỊCH & BỘ CHỌN THỜI GIAN (CALENDAR VIEW)
 */
const CalendarView = (() => {
  const dom = {
    grid: document.getElementById("monthsGrid"),
    pickerTrigger: document.getElementById("btnPickerTrigger"),
    pickerPopover: document.getElementById("pickerPopover"),
    pickerTitle: document.getElementById("pickerTitle"),
    pickerGrid: document.getElementById("pickerGrid"),
    selectedDatesLine: document.getElementById("fSelectedDates")
  };

  function updateSelectedDatesLine() {
    const sorted = Array.from(Store.state.selectedDates).sort();
    if (sorted.length === 0) {
      dom.selectedDatesLine.textContent = "Chưa chọn ngày trên lịch";
      dom.selectedDatesLine.title = "";
      dom.selectedDatesLine.classList.add("empty");
    } else {
      const formatted = sorted.map(d => DateUtils.formatDisplayDate(d)).join(", ");
      dom.selectedDatesLine.textContent = formatted;
      dom.selectedDatesLine.title = `${sorted.length} ngày: ${formatted}`;
      dom.selectedDatesLine.classList.remove("empty");
    }
  }

  function render() {
    const { viewYear, viewMonth, selectedDates, todayIso } = Store.state;
    const mobile = DateUtils.isMobile();
    const scheduledSet = Store.getScheduledDates();

    dom.pickerTrigger.textContent = mobile
      ? `${DateUtils.pad2(viewMonth + 1)}/${viewYear}`
      : `${viewYear}`;

    const months = mobile ? [viewMonth] : [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
    const frag = document.createDocumentFragment();

    for (const mIdx of months) {
      const monthNum = mIdx + 1;
      const card = document.createElement("div");
      card.className = "month-card";

      const title = document.createElement("div");
      title.className = "month-title";
      title.innerHTML = `<span>${DateUtils.MONTH_NAMES[mIdx]}</span><span style="font-size:11px;color:var(--text-muted);font-weight:400">${viewYear}</span>`;
      card.appendChild(title);

      const wdRow = document.createElement("div");
      wdRow.className = "weekdays-row";
      wdRow.innerHTML = DateUtils.WEEKDAYS.map(w => `<span>${w}</span>`).join("");
      card.appendChild(wdRow);

      const daysGrid = document.createElement("div");
      daysGrid.className = "days-grid";

      const firstDay = new Date(viewYear, mIdx, 1).getDay();
      const startOffset = (firstDay === 0) ? 6 : firstDay - 1;
      const totalDays = new Date(viewYear, monthNum, 0).getDate();

      for (let i = 0; i < startOffset; i++) {
        const emptyCell = document.createElement("div");
        emptyCell.className = "day-cell empty";
        daysGrid.appendChild(emptyCell);
      }

      for (let d = 1; d <= totalDays; d++) {
        const iso = DateUtils.toIsoDate(viewYear, monthNum, d);
        const dow = new Date(viewYear, mIdx, d).getDay();
        const lunar = LunarEngine.convertSolar2Lunar(d, monthNum, viewYear, 7);

        const cell = document.createElement("div");
        cell.className = "day-cell";
        if (dow === 0) cell.classList.add("sunday");
        if (iso === todayIso) cell.classList.add("today");
        if (selectedDates.has(iso)) cell.classList.add("selected");
        cell.dataset.date = iso;

        const solarSpan = document.createElement("span");
        solarSpan.className = "solar-num";
        solarSpan.textContent = d;

        const lunarSpan = document.createElement("span");
        lunarSpan.className = "lunar-num";
        if (lunar.day === 1 || lunar.day === 15) {
          lunarSpan.classList.add("special");
        }
        lunarSpan.textContent = `${lunar.day}/${lunar.month}${lunar.leap ? "N" : ""}`;

        cell.appendChild(solarSpan);
        cell.appendChild(lunarSpan);

        if (scheduledSet.has(iso)) {
          const dot = document.createElement("span");
          dot.className = "event-dot";
          cell.appendChild(dot);
        }

        daysGrid.appendChild(cell);
      }

      card.appendChild(daysGrid);
      frag.appendChild(card);
    }

    dom.grid.innerHTML = "";
    dom.grid.appendChild(frag);
    updateSelectedDatesLine();
  }

  function renderPicker() {
    const { viewYear, viewMonth, pickerBaseYear } = Store.state;
    dom.pickerGrid.innerHTML = "";

    if (DateUtils.isMobile()) {
      dom.pickerTitle.textContent = `${viewYear}`;
      for (let m = 0; m < 12; m++) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "picker-cell" + (m === viewMonth ? " current" : "");
        btn.textContent = `${DateUtils.pad2(m + 1)}/${viewYear}`;
        btn.onclick = () => {
          Store.state.viewMonth = m;
          dom.pickerPopover.classList.remove("open");
          render();
        };
        dom.pickerGrid.appendChild(btn);
      }
    } else {
      const startY = pickerBaseYear;
      dom.pickerTitle.textContent = `${startY} – ${startY + 11}`;
      for (let i = 0; i < 12; i++) {
        const y = startY + i;
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "picker-cell" + (y === viewYear ? " current" : "");
        btn.textContent = y;
        btn.onclick = () => {
          Store.state.viewYear = y;
          dom.pickerPopover.classList.remove("open");
          render();
        };
        dom.pickerGrid.appendChild(btn);
      }
    }
  }

  return { dom, render, renderPicker };
})();

/**
 * 6. MODULE SIDEBAR: FORM CẤU HÌNH, COMBOBOX NHÃN & DANH SÁCH SỰ KIỆN
 */
const SidebarView = (() => {
  const dom = {
    form: document.getElementById("eventForm"),
    summary: document.getElementById("fSummary"),
    startTime: document.getElementById("fStartTime"),
    endTime: document.getElementById("fEndTime"),
    categories: document.getElementById("fCategories"),
    categoryCombobox: document.getElementById("categoryCombobox"),
    categoryMenu: document.getElementById("categoryMenu"),
    location: document.getElementById("fLocation"),
    description: document.getElementById("fDescription"),
    alarm: document.getElementById("fAlarm"),
    status: document.getElementById("fStatus"),
    transp: document.getElementById("fTransp"),
    classification: document.getElementById("fClass"),
    priority: document.getElementById("fPriority"),
    url: document.getElementById("fUrl"),
    organizer: document.getElementById("fOrganizer"),
    rrule: document.getElementById("fRrule"),
    btnSave: document.getElementById("btnSaveEvent"),
    eventList: document.getElementById("eventList"),
    eventCount: document.getElementById("eventCount")
  };

  function applyDefaults() {
    const d = Store.DEFAULTS;
    dom.form.reset();
    dom.startTime.value = d.startTime;
    dom.endTime.value = d.endTime;
    dom.alarm.value = d.alarm;
    dom.status.value = d.status;
    dom.transp.value = d.transp;
    dom.classification.value = d.classification;
    dom.priority.value = d.priority;
    dom.btnSave.textContent = "Lưu sự kiện";
  }

  function fillForm(ev) {
    dom.summary.value = ev.summary || "";
    dom.startTime.value = ev.startTime || "";
    dom.endTime.value = ev.endTime || "";
    dom.categories.value = ev.categories || "";
    dom.location.value = ev.location || "";
    dom.description.value = ev.description || "";
    dom.alarm.value = ev.alarm ?? Store.DEFAULTS.alarm;
    dom.status.value = ev.status || Store.DEFAULTS.status;
    dom.transp.value = ev.transp || Store.DEFAULTS.transp;
    dom.classification.value = ev.classification || Store.DEFAULTS.classification;
    dom.priority.value = ev.priority || Store.DEFAULTS.priority;
    dom.url.value = ev.url || "";
    dom.organizer.value = ev.organizer || "";
    dom.rrule.value = ev.rrule || "";
    dom.btnSave.textContent = "Cập nhật sự kiện";
  }

  function readForm() {
    return {
      id: Store.state.editingId || `evt_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      summary: dom.summary.value.trim(),
      startTime: dom.startTime.value,
      endTime: dom.endTime.value,
      categories: dom.categories.value.trim(),
      location: dom.location.value.trim(),
      description: dom.description.value.trim(),
      alarm: dom.alarm.value,
      status: dom.status.value,
      transp: dom.transp.value,
      classification: dom.classification.value,
      priority: dom.priority.value,
      url: dom.url.value.trim(),
      organizer: dom.organizer.value.trim(),
      rrule: dom.rrule.value.trim(),
      dates: Array.from(Store.state.selectedDates).sort()
    };
  }

  function renderCategoryMenu(filterText = "") {
    const cats = Store.getUniqueCategories();
    const query = filterText.trim().toLowerCase();
    const matched = query ? cats.filter(c => c.toLowerCase().includes(query)) : cats;

    if (matched.length === 0) {
      dom.categoryMenu.classList.remove("open");
      dom.categoryMenu.innerHTML = "";
      return;
    }

    dom.categoryMenu.innerHTML = "";
    for (const cat of matched) {
      const opt = document.createElement("div");
      opt.className = "combobox-option";
      opt.textContent = cat;
      opt.onmousedown = (e) => {
        e.preventDefault();
        dom.categories.value = cat;
        dom.categoryMenu.classList.remove("open");
      };
      dom.categoryMenu.appendChild(opt);
    }
    dom.categoryMenu.classList.add("open");
  }

  function renderEventList(onSelect, onDelete) {
    const events = Store.state.events;
    dom.eventCount.textContent = `${events.length} sự kiện`;

    if (events.length === 0) {
      dom.eventList.innerHTML = `<div class="empty-state">Chưa có sự kiện nào.<br/>Chọn ngày trên lịch và điền thông tin để tạo.</div>`;
      return;
    }

    const frag = document.createDocumentFragment();
    for (const ev of events) {
      const item = document.createElement("div");
      item.className = "event-item" + (ev.id === Store.state.editingId ? " active" : "");

      const info = document.createElement("div");
      info.className = "event-item-info";

      const title = document.createElement("div");
      title.className = "event-item-title";
      title.textContent = ev.summary;

      const tags = document.createElement("div");
      tags.className = "event-item-tags";

      const dayTag = document.createElement("span");
      dayTag.className = "tag tag-days";
      dayTag.textContent = `${ev.dates.length} ngày`;
      tags.appendChild(dayTag);

      const timeTag = document.createElement("span");
      timeTag.className = "tag";
      if (ev.startTime && ev.endTime) {
        timeTag.textContent = `${ev.startTime}-${ev.endTime}`;
      } else if (ev.startTime) {
        timeTag.textContent = ev.startTime;
      } else {
        timeTag.textContent = "Cả ngày";
      }
      tags.appendChild(timeTag);

      if (ev.categories) {
        const catTag = document.createElement("span");
        catTag.className = "tag tag-cat";
        catTag.textContent = ev.categories;
        tags.appendChild(catTag);
      }

      info.appendChild(title);
      info.appendChild(tags);

      const delBtn = document.createElement("button");
      delBtn.type = "button";
      delBtn.className = "btn btn-danger-ghost";
      delBtn.title = "Xóa sự kiện";
      delBtn.innerHTML = `&times;`;
      delBtn.onclick = (e) => {
        e.stopPropagation();
        onDelete(ev.id);
      };

      item.appendChild(info);
      item.appendChild(delBtn);
      item.onclick = () => onSelect(ev);
      frag.appendChild(item);
    }

    dom.eventList.innerHTML = "";
    dom.eventList.appendChild(frag);
  }

  return { dom, applyDefaults, fillForm, readForm, renderCategoryMenu, renderEventList };
})();

/**
 * 7. MODULE ĐIỀU PHỐI SỰ KIỆN CHÍNH (APP CONTROLLER)
 */
const AppController = (() => {
  function resetWorkspace() {
    Store.state.editingId = null;
    Store.state.selectedDates.clear();
    Store.state.lastClickedDate = null;
    SidebarView.applyDefaults();
    refreshAll();
  }

  function handleSelectEvent(ev) {
    Store.state.editingId = ev.id;
    Store.state.selectedDates = new Set(ev.dates || []);
    SidebarView.fillForm(ev);

    if (ev.dates && ev.dates.length > 0) {
      const [y, m] = ev.dates[0].split("-").map(Number);
      Store.state.viewYear = y;
      Store.state.viewMonth = m - 1;
    }
    refreshAll();
  }

  function handleDeleteEvent(id) {
    Store.deleteEvent(id);
    if (Store.state.editingId === id) {
      resetWorkspace();
    } else {
      refreshAll();
    }
    DateUtils.toast("Đã xóa sự kiện.");
  }

  function refreshAll() {
    SidebarView.renderEventList(handleSelectEvent, handleDeleteEvent);
    CalendarView.render();
  }

  function bindEvents() {
    // Chọn ngày trên lịch (hỗ trợ Shift + Click chọn dải ngày)
    CalendarView.dom.grid.addEventListener("click", (e) => {
      const cell = e.target.closest(".day-cell");
      if (!cell || cell.classList.contains("empty")) return;
      const iso = cell.dataset.date;

      if (e.shiftKey && Store.state.lastClickedDate) {
        const start = new Date(Store.state.lastClickedDate);
        const end = new Date(iso);
        const [minD, maxD] = start <= end ? [start, end] : [end, start];
        const cur = new Date(minD);
        while (cur <= maxD) {
          Store.state.selectedDates.add(
            DateUtils.toIsoDate(cur.getFullYear(), cur.getMonth() + 1, cur.getDate())
          );
          cur.setDate(cur.getDate() + 1);
        }
      } else if (Store.state.selectedDates.has(iso)) {
        Store.state.selectedDates.delete(iso);
      } else {
        Store.state.selectedDates.add(iso);
      }

      Store.state.lastClickedDate = iso;
      CalendarView.render();
    });

    // Bộ chọn Năm / Tháng-Năm trên Header
    CalendarView.dom.pickerTrigger.addEventListener("click", (e) => {
      e.stopPropagation();
      Store.state.pickerBaseYear = Math.floor(Store.state.viewYear / 12) * 12;
      CalendarView.renderPicker();
      CalendarView.dom.pickerPopover.classList.toggle("open");
    });

    document.getElementById("btnPickerPrev").addEventListener("click", (e) => {
      e.stopPropagation();
      if (DateUtils.isMobile()) Store.state.viewYear--;
      else Store.state.pickerBaseYear -= 12;
      CalendarView.renderPicker();
      CalendarView.render();
    });

    document.getElementById("btnPickerNext").addEventListener("click", (e) => {
      e.stopPropagation();
      if (DateUtils.isMobile()) Store.state.viewYear++;
      else Store.state.pickerBaseYear += 12;
      CalendarView.renderPicker();
      CalendarView.render();
    });

    // Vuốt trái/phải trên Mobile để chuyển tháng
    let touchStartX = 0;
    const aside = document.getElementById("calendarAside");
    aside.addEventListener("touchstart", (e) => {
      touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    aside.addEventListener("touchend", (e) => {
      if (!DateUtils.isMobile()) return;
      const diff = e.changedTouches[0].screenX - touchStartX;
      if (Math.abs(diff) > 50) {
        if (diff < 0) {
          Store.state.viewMonth = (Store.state.viewMonth + 1) % 12;
          if (Store.state.viewMonth === 0) Store.state.viewYear++;
        } else {
          Store.state.viewMonth = (Store.state.viewMonth + 11) % 12;
          if (Store.state.viewMonth === 11) Store.state.viewYear--;
        }
        CalendarView.render();
      }
    }, { passive: true });

    // Combobox Nhãn
    SidebarView.dom.categories.addEventListener("focus", () => {
      SidebarView.renderCategoryMenu(SidebarView.dom.categories.value);
    });

    SidebarView.dom.categories.addEventListener("input", () => {
      SidebarView.renderCategoryMenu(SidebarView.dom.categories.value);
    });

    document.getElementById("btnCategoryDropdown").addEventListener("click", (e) => {
      e.stopPropagation();
      if (SidebarView.dom.categoryMenu.classList.contains("open")) {
        SidebarView.dom.categoryMenu.classList.remove("open");
      } else {
        SidebarView.renderCategoryMenu("");
        SidebarView.dom.categories.focus();
      }
    });

    // Đóng các popover khi click ra ngoài
    document.addEventListener("click", (e) => {
      if (!CalendarView.dom.pickerPopover.contains(e.target) && e.target !== CalendarView.dom.pickerTrigger) {
        CalendarView.dom.pickerPopover.classList.remove("open");
      }
      if (!SidebarView.dom.categoryCombobox.contains(e.target)) {
        SidebarView.dom.categoryMenu.classList.remove("open");
      }
    });

    // Mở rộng / thu gọn thuộc tính ICS
    document.getElementById("btnToggleAdv").addEventListener("click", (e) => {
      const adv = document.getElementById("advFields");
      const open = adv.classList.toggle("open");
      e.target.textContent = open ? "- Thu gọn thuộc tính ICS" : "+ Mở rộng thuộc tính ICS";
    });

    // Lưu & Làm mới Form
    SidebarView.dom.form.addEventListener("submit", (e) => {
      e.preventDefault();
      const data = SidebarView.readForm();
      if (!data.summary) {
        DateUtils.toast("Vui lòng nhập tiêu đề sự kiện.");
        return;
      }
      if (data.dates.length === 0) {
        DateUtils.toast("Vui lòng chọn ít nhất 1 ngày trên lịch.");
        return;
      }

      const isUpdate = Boolean(Store.state.editingId);
      Store.saveEvent(data);
      DateUtils.toast(isUpdate ? "Đã cập nhật sự kiện." : "Đã lưu sự kiện mới.");
      resetWorkspace();
    });

    document.getElementById("btnResetForm").addEventListener("click", resetWorkspace);

    // Export .ics
    document.getElementById("btnExport").addEventListener("click", () => {
      if (Store.state.events.length === 0) {
        DateUtils.toast("Danh sách trống, không có dữ liệu để xuất.");
        return;
      }
      const icsContent = IcsCodec.serialize(Store.state.events);
      const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `lich-su-kien-${Store.state.viewYear}.ics`;
      a.click();
      URL.revokeObjectURL(url);
      DateUtils.toast("Đã xuất file .ics thành công.");
    });

    // Import .ics
    const fileInput = document.getElementById("fileImport");
    document.getElementById("btnImport").addEventListener("click", () => fileInput.click());

    fileInput.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const imported = IcsCodec.parse(evt.target.result);
          for (const ev of imported) Store.state.events.unshift(ev);
          Store.persist();

          if (imported.length > 0 && imported[0].dates.length > 0) {
            const [y, m] = imported[0].dates[0].split("-").map(Number);
            Store.state.viewYear = y;
            Store.state.viewMonth = m - 1;
          }
          refreshAll();
          DateUtils.toast(`Đã nhập ${imported.length} sự kiện từ file .ics.`);
        } catch (err) {
          console.error(err);
          DateUtils.toast("File .ics không hợp lệ hoặc bị lỗi định dạng.");
        }
        e.target.value = "";
      };
      reader.readAsText(file, "UTF-8");
    });

    // Responsive chuyển đổi chế độ 12 tháng / 1 tháng
    let lastMobile = DateUtils.isMobile();
    window.addEventListener("resize", () => {
      const currentMobile = DateUtils.isMobile();
      if (currentMobile !== lastMobile) {
        lastMobile = currentMobile;
        CalendarView.dom.pickerPopover.classList.remove("open");
        CalendarView.render();
      }
    });
  }

  function init() {
    SidebarView.applyDefaults();
    bindEvents();
    refreshAll();
  }

  return { init };
})();

AppController.init();
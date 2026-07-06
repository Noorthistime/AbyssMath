const expressionEl = document.getElementById('expression');
const resultEl = document.getElementById('result');
const keypad = document.getElementById('keypad');
const calculatorCard = document.querySelector('.calculator-card');
const modeButtons = document.querySelectorAll('.mode-button');
const standardKeypadMarkup = keypad.innerHTML;

const themeToggle = document.getElementById('themeToggle');
const themeIcon = themeToggle.querySelector('.theme-icon');

const accentToggle = document.getElementById('accentToggle');
const accentDropdown = document.getElementById('accentDropdown');
const accentOptions = document.querySelectorAll('.accent-opt');
const customColorPicker = document.getElementById('customColorPicker');
const customSwatchPreview = document.querySelector('.custom-swatch-preview');

const root = document.documentElement;

let expression = '';
let memoryValue = 0;
let scientificSecond = false;
let scientificHyp = false;
let angleMode = 'DEG';
let currentMode = 'standard';
let programmerBase = 'DEC';
let programmerWordBits = 64;
let programmerShiftMode = 'arithmetic';
let programmerPendingOperation = null;
let programmerPendingValue = null;
let programmerView = 'keypad';
let programmerDropdown = null;
let memoryList = [];
let scientificDropdown = null;
let dateFrom = new Date();
let dateTo = new Date();
let activePicker = null;
let dpCurrentMonth = new Date().getMonth();
let dpCurrentYear = new Date().getFullYear();
let calendarView = 'days';
let dpYearRangeStart = new Date().getFullYear() - 6;
let dateSubMode = 'diff';
let dateAddSubOp = 'add';
let dateAddYears = 0;
let dateAddMonths = 0;
let dateAddDays = 0;

function hexToRgb(hex) {
  const normalized = hex.replace('#', '');
  const value = normalized.length === 3
    ? normalized.split('').map((ch) => ch + ch).join('')
    : normalized;

  const parsed = Number.parseInt(value, 16);
  return {
    r: (parsed >> 16) & 255,
    g: (parsed >> 8) & 255,
    b: parsed & 255
  };
}

function rgbToHex(r, g, b) {
  const toHex = (n) => n.toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function mixRgb(base, target, amount) {
  const clamp = (n) => Math.max(0, Math.min(255, Math.round(n)));
  return {
    r: clamp(base.r + (target.r - base.r) * amount),
    g: clamp(base.g + (target.g - base.g) * amount),
    b: clamp(base.b + (target.b - base.b) * amount)
  };
}

function setCustomAccent(hex) {
  const base = hexToRgb(hex);
  const dark = mixRgb(base, { r: 0, g: 0, b: 0 }, 0.36);
  const hover = mixRgb(base, { r: 255, g: 255, b: 255 }, 0.45);
  const light = mixRgb(base, { r: 255, g: 255, b: 255 }, 0.86);

  root.removeAttribute('data-accent');

  root.style.setProperty('--accent', rgbToHex(base.r, base.g, base.b));
  root.style.setProperty('--accent-rgb', `${base.r}, ${base.g}, ${base.b}`);
  root.style.setProperty('--accent-dark', rgbToHex(dark.r, dark.g, dark.b));
  root.style.setProperty('--accent-dark-rgb', `${dark.r}, ${dark.g}, ${dark.b}`);
  root.style.setProperty('--accent-hover', rgbToHex(hover.r, hover.g, hover.b));
  root.style.setProperty('--accent-light', rgbToHex(light.r, light.g, light.b));

  customColorPicker.value = rgbToHex(base.r, base.g, base.b);
  customSwatchPreview.style.background = rgbToHex(base.r, base.g, base.b);

  localStorage.removeItem('mathAccent');
  localStorage.setItem('mathAccentCustom', rgbToHex(base.r, base.g, base.b));
}

function setPresetAccent(name) {
  const accentName = name === 'red' ? '' : name;

  if (accentName) {
    root.setAttribute('data-accent', accentName);
  } else {
    root.removeAttribute('data-accent');
  }

  root.style.removeProperty('--accent');
  root.style.removeProperty('--accent-rgb');
  root.style.removeProperty('--accent-dark');
  root.style.removeProperty('--accent-dark-rgb');
  root.style.removeProperty('--accent-hover');
  root.style.removeProperty('--accent-light');

  localStorage.removeItem('mathAccentCustom');
  localStorage.setItem('mathAccent', name);

  const computedAccent = getComputedStyle(root).getPropertyValue('--accent').trim();
  if (computedAccent) {
    customColorPicker.value = computedAccent;
    customSwatchPreview.style.background = computedAccent;
  }
}

function syncThemeIcon() {
  const isDark = root.getAttribute('data-theme') === 'dark';
  const sunIcon = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="4"></circle><path d="M12 2v2"></path><path d="M12 20v2"></path><path d="m4.93 4.93 1.41 1.41"></path><path d="m17.66 17.66 1.41 1.41"></path><path d="M2 12h2"></path><path d="M20 12h2"></path><path d="m6.34 17.66-1.41 1.41"></path><path d="m19.07 4.93-1.41 1.41"></path></svg>';
  const moonIcon = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3a7 7 0 1 0 9 9 9 9 0 1 1-9-9z"></path></svg>';

  themeIcon.innerHTML = isDark ? sunIcon : moonIcon;
  themeToggle.setAttribute('aria-pressed', String(isDark));
}

function loadTheme() {
  const savedTheme = localStorage.getItem('mathTheme');
  if (savedTheme === 'dark') {
    root.setAttribute('data-theme', 'dark');
  } else if (savedTheme === 'light') {
    root.removeAttribute('data-theme');
  }

  syncThemeIcon();
}

function loadAccent() {
  const savedCustom = localStorage.getItem('mathAccentCustom');
  const savedPreset = localStorage.getItem('mathAccent');

  if (savedCustom) {
    setCustomAccent(savedCustom);
    return;
  }

  if (savedPreset) {
    setPresetAccent(savedPreset);
    return;
  }

  setPresetAccent('red');
}

function updateDisplay(message = expression ? 'Press = to calculate' : 'Ready') {
  expressionEl.textContent = expression || '0';
  resultEl.textContent = message;
}

function insertValue(value) {
  if (!expression && value === '-') {
    expression = value;
    updateDisplay();
    return;
  }

  if (expression === '0' && /[0-9]/.test(value)) {
    expression = value;
  } else {
    expression += value;
  }

  updateDisplay();
}

function clearAll() {
  expression = '';
  updateDisplay('Ready');
}

function backspace() {
  expression = expression.slice(0, -1);
  updateDisplay();
}

function setKeypadMode(mode) {
  if (!['standard', 'scientific', 'programming', 'date'].includes(mode)) {
    return;
  }

  currentMode = mode;
  programmerView = 'keypad';
  programmerDropdown = null;
  scientificDropdown = null;
  activePicker = null;
  dateSubMode = 'diff';
  dateAddSubOp = 'add';
  dateAddYears = 0;
  dateAddMonths = 0;
  dateAddDays = 0;
  modeButtons.forEach((button) => {
    button.classList.toggle('is-active', button.dataset.mode === mode);
  });

  calculatorCard.classList.toggle('scientific-mode', mode === 'scientific');
  calculatorCard.classList.toggle('programming-mode', mode === 'programming');
  calculatorCard.classList.toggle('date-mode', mode === 'date');

  if (mode === 'standard') {
    keypad.innerHTML = standardKeypadMarkup;
    return;
  }

  if (mode === 'scientific') {
    renderScientificKeypad();
    return;
  }

  if (mode === 'programming') {
    renderProgrammingKeypad();
    return;
  }

  if (mode === 'date') {
    renderDateKeypad();
    return;
  }
}

function renderScientificKeypad() {
  const keyboardKeysHtml = `
    <button data-action="toggle-second" class="key key-function" type="button">2<sup>nd</sup></button>
    <button data-insert="pi" class="key key-function" type="button">π</button>
    <button data-insert="e" class="key key-function" type="button">e</button>
    <button data-action="clear" class="key key-secondary" type="button">C</button>
    <button data-action="backspace" class="key key-secondary" type="button">⌫</button>

    <button data-action="square" class="key key-function" type="button">x<sup>2</sup></button>
    <button data-action="reciprocal" class="key key-function" type="button">1/x</button>
    <button data-action="absolute" class="key key-function" type="button">|x|</button>
    <button data-insert="exp(" class="key key-function" type="button">exp</button>
    <button data-insert=" mod " class="key key-function" type="button">mod</button>

    <button data-insert="sqrt(" class="key key-function" type="button"><sup>2</sup>√x</button>
    <button data-insert="(" class="key key-function" type="button">(</button>
    <button data-insert=")" class="key key-function" type="button">)</button>
    <button data-insert="!" class="key key-function" type="button">n!</button>
    <button data-insert="/" class="key key-operator" type="button">÷</button>

    <button data-insert="^" class="key key-function" type="button">x<sup>y</sup></button>
    <button data-insert="7" class="key" type="button">7</button>
    <button data-insert="8" class="key" type="button">8</button>
    <button data-insert="9" class="key" type="button">9</button>
    <button data-insert="*" class="key key-operator" type="button">×</button>

    <button data-insert="10^" class="key key-function" type="button">10<sup>x</sup></button>
    <button data-insert="4" class="key" type="button">4</button>
    <button data-insert="5" class="key" type="button">5</button>
    <button data-insert="6" class="key" type="button">6</button>
    <button data-insert="-" class="key key-operator" type="button">−</button>

    <button data-insert="log10(" class="key key-function" type="button">log</button>
    <button data-insert="1" class="key" type="button">1</button>
    <button data-insert="2" class="key" type="button">2</button>
    <button data-insert="3" class="key" type="button">3</button>
    <button data-insert="+" class="key key-operator" type="button">+</button>

    <button data-insert="log(" class="key key-function" type="button">ln</button>
    <button data-action="negate" class="key key-function" type="button">+/−</button>
    <button data-insert="0" class="key" type="button">0</button>
    <button data-insert="." class="key" type="button">.</button>
    <button data-action="equals" class="key key-equals" type="button">=</button>
  `;

  let overlayHtml = '';
  if (scientificDropdown === 'trig') {
    overlayHtml = `
      <div class="scientific-overlay-dialog trig-dialog">
        <div class="scientific-panel" data-panel-content="trig">
          <button class="key key-function trig-toggle ${scientificSecond ? 'is-active' : ''}" data-action="toggle-second" type="button">2<sup>nd</sup></button>
          <button class="key key-function" data-action="insert-trig" data-trig="sin" type="button">sin</button>
          <button class="key key-function" data-action="insert-trig" data-trig="cos" type="button">cos</button>
          <button class="key key-function" data-action="insert-trig" data-trig="tan" type="button">tan</button>
          <button class="key key-function trig-toggle ${scientificHyp ? 'is-active' : ''}" data-action="toggle-hyp" type="button">hyp</button>
          <button class="key key-function" data-action="insert-trig" data-trig="sec" type="button">sec</button>
          <button class="key key-function" data-action="insert-trig" data-trig="csc" type="button">csc</button>
          <button class="key key-function" data-action="insert-trig" data-trig="cot" type="button">cot</button>
        </div>
      </div>
    `;
  } else if (scientificDropdown === 'function') {
    overlayHtml = `
      <div class="scientific-overlay-dialog function-dialog">
        <div class="scientific-panel" data-panel-content="function">
          <button class="key key-function" data-action="absolute" type="button">|x|</button>
          <button class="key key-function" data-action="floor" type="button">⌊x⌋</button>
          <button class="key key-function" data-action="ceil" type="button">⌈x⌉</button>
          <button class="key key-function" data-insert="random()" type="button">rand</button>
          <button class="key key-function" data-action="to-dms" type="button">→dms</button>
          <button class="key key-function" data-action="to-deg" type="button">→deg</button>
        </div>
      </div>
    `;
  }

  keypad.innerHTML = `
    <div class="scientific-status-row">
      <button class="scientific-mini" data-action="toggle-angle" type="button">${angleMode}</button>
      <button class="scientific-mini" data-action="format-exponential" type="button">F-E</button>
    </div>

    <div class="scientific-memory-row">
      <button class="scientific-memory" data-action="memory-clear" type="button">MC</button>
      <button class="scientific-memory" data-action="memory-recall" type="button">MR</button>
      <button class="scientific-memory" data-action="memory-add" type="button">M+</button>
      <button class="scientific-memory" data-action="memory-subtract" type="button">M-</button>
      <button class="scientific-memory" data-action="memory-store" type="button">MS</button>
      <button class="scientific-memory" data-action="memory-view" type="button">M⌄</button>
    </div>

    <div class="scientific-toolbar">
      <button class="scientific-tab ${scientificDropdown === 'trig' ? 'is-active' : ''}" data-action="toggle-scientific-panel" data-panel="trig" type="button">△ Trigonometry⌄</button>
      <button class="scientific-tab ${scientificDropdown === 'function' ? 'is-active' : ''}" data-action="toggle-scientific-panel" data-panel="function" type="button">ƒ Function⌄</button>
    </div>

    <div class="scientific-keys-wrapper">
      ${keyboardKeysHtml}
      ${overlayHtml}
    </div>
  `;
}

function renderDateKeypad() {
  const isDiffMode = dateSubMode === 'diff';
  
  let submodeHtml = '';
  if (isDiffMode) {
    submodeHtml = `
      <div class="date-input-group">
        <label class="date-label">To</label>
        <button class="date-picker-trigger" data-action="open-date-picker" data-picker="to" type="button">
          <span id="dateToText">${formatDateString(dateTo)}</span>
          <svg class="date-calendar-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
          </svg>
        </button>
      </div>

      <div class="date-input-group">
        <label class="date-label">Difference</label>
        <div class="date-result-panel">
          <span id="dateResult">${calculateDateDifference(dateFrom, dateTo)}</span>
        </div>
      </div>
    `;
  } else {
    submodeHtml = `
      <!-- Add/Subtract Radio Toggles -->
      <div class="date-radio-group">
        <label class="date-radio-label">
          <input type="radio" name="dateAddSubOp" value="add" ${dateAddSubOp === 'add' ? 'checked' : ''}>
          <span class="radio-custom"></span>
          Add
        </label>
        <label class="date-radio-label">
          <input type="radio" name="dateAddSubOp" value="subtract" ${dateAddSubOp === 'subtract' ? 'checked' : ''}>
          <span class="radio-custom"></span>
          Subtract
        </label>
      </div>

      <!-- Dropdown Selectors for Years, Months, Days -->
      <div class="date-dropdowns-row">
        <div class="date-select-field">
          <label class="date-label">Years</label>
          <div class="select-wrapper">
            <select id="dateAddYears">
              ${renderSelectOptions(0, 100, dateAddYears)}
            </select>
            <svg class="select-chevron" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
          </div>
        </div>
        <div class="date-select-field">
          <label class="date-label">Months</label>
          <div class="select-wrapper">
            <select id="dateAddMonths">
              ${renderSelectOptions(0, 100, dateAddMonths)}
            </select>
            <svg class="select-chevron" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
          </div>
        </div>
        <div class="date-select-field">
          <label class="date-label">Days</label>
          <div class="select-wrapper">
            <select id="dateAddDays">
              ${renderSelectOptions(0, 100, dateAddDays)}
            </select>
            <svg class="select-chevron" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
          </div>
        </div>
      </div>

      <!-- Result Date Display -->
      <div class="date-input-group">
        <label class="date-label">Date</label>
        <div class="date-result-panel">
          <span id="dateResult">${formatDateString(addOrSubtractDate(dateFrom, dateAddYears, dateAddMonths, dateAddDays, dateAddSubOp))}</span>
        </div>
      </div>
    `;
  }

  keypad.innerHTML = `
    <div class="date-calc-container">
      <div class="date-mode-selector">
        <button class="date-dropdown-btn" data-action="toggle-date-mode-menu" type="button">
          <span>${isDiffMode ? 'Difference between dates' : 'Add or subtract days'}</span>
          <svg class="chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
        </button>
        <div class="date-dropdown-menu" id="dateModeMenu" hidden>
          <button class="date-dropdown-item ${isDiffMode ? 'active' : ''}" data-action="select-date-submode" data-submode="diff" type="button">
            <span class="active-indicator"></span>
            Difference between dates
          </button>
          <button class="date-dropdown-item ${!isDiffMode ? 'active' : ''}" data-action="select-date-submode" data-submode="add-sub" type="button">
            <span class="active-indicator"></span>
            Add or subtract days
          </button>
        </div>
      </div>

      <div class="date-input-group">
        <label class="date-label">From</label>
        <button class="date-picker-trigger" data-action="open-date-picker" data-picker="from" type="button">
          <span id="dateFromText">${formatDateString(dateFrom)}</span>
          <svg class="date-calendar-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
          </svg>
        </button>
      </div>

      ${submodeHtml}

      <div class="date-picker-dialog" id="datePickerDialog" hidden>
        <div class="dp-header">
          <button class="dp-nav-btn" data-action="dp-prev" type="button">&lt;</button>
          <span class="dp-month-year">
            <button class="dp-header-btn" data-action="dp-select-month" id="dpMonthBtn" type="button"></button>
            <button class="dp-header-btn" data-action="dp-select-year" id="dpYearBtn" type="button"></button>
          </span>
          <button class="dp-nav-btn" data-action="dp-next" type="button">&gt;</button>
        </div>
        <div class="dp-weekdays">
          <span>Su</span><span>Mo</span><span>Tu</span><span>We</span><span>Th</span><span>Fr</span><span>Sa</span>
        </div>
        <div class="dp-days" id="dpDaysGrid"></div>
      </div>
    </div>
  `;
}

function formatDateString(date) {
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const d = String(date.getDate()).padStart(2, '0');
  const m = monthNames[date.getMonth()];
  const y = date.getFullYear();
  return `${d} ${m} ${y}`;
}

function addOrSubtractDate(baseDate, years, months, days, operation) {
  const result = new Date(baseDate);
  const factor = operation === 'add' ? 1 : -1;

  result.setFullYear(result.getFullYear() + factor * years);
  result.setMonth(result.getMonth() + factor * months);
  result.setDate(result.getDate() + factor * days);

  return result;
}

function renderSelectOptions(min, max, selectedVal) {
  let html = '';
  for (let i = min; i <= max; i++) {
    html += `<option value="${i}" ${i === selectedVal ? 'selected' : ''}>${i}</option>`;
  }
  return html;
}

function updateDateAddSubResult() {
  const resultEl = document.getElementById('dateResult');
  if (resultEl) {
    if (dateSubMode === 'add-sub') {
      const calculated = addOrSubtractDate(dateFrom, dateAddYears, dateAddMonths, dateAddDays, dateAddSubOp);
      resultEl.textContent = formatDateString(calculated);
    } else {
      resultEl.textContent = calculateDateDifference(dateFrom, dateTo);
    }
  }
}

function calculateDateDifference(date1, date2) {
  const d1 = new Date(Math.min(date1, date2));
  const d2 = new Date(Math.max(date1, date2));

  // Reset times to midnight
  d1.setHours(0, 0, 0, 0);
  d2.setHours(0, 0, 0, 0);

  if (d1.getTime() === d2.getTime()) {
    return 'Same dates';
  }

  const totalTime = d2.getTime() - d1.getTime();
  const totalDays = Math.round(totalTime / (1000 * 60 * 60 * 24));

  let years = d2.getFullYear() - d1.getFullYear();
  let months = d2.getMonth() - d1.getMonth();
  let days = d2.getDate() - d1.getDate();

  if (days < 0) {
    months -= 1;
    const prevMonth = new Date(d2.getFullYear(), d2.getMonth(), 0);
    days += prevMonth.getDate();
  }

  if (months < 0) {
    years -= 1;
    months += 12;
  }

  const parts = [];
  if (years > 0) parts.push(years === 1 ? '1 year' : `${years} years`);
  if (months > 0) parts.push(months === 1 ? '1 month' : `${months} months`);
  if (days > 0) parts.push(days === 1 ? '1 day' : `${days} days`);

  const textDesc = parts.join(', ');
  const daysDesc = totalDays === 1 ? '1 day' : `${totalDays} days`;

  if (parts.length === 1 && parts[0].includes('day')) {
    return daysDesc;
  }

  return `${textDesc}\n(${daysDesc})`;
}

function renderCalendarGrid() {
  const monthBtn = document.getElementById('dpMonthBtn');
  const yearBtn = document.getElementById('dpYearBtn');
  const weekdaysEl = document.querySelector('.dp-weekdays');
  const daysGrid = document.getElementById('dpDaysGrid');
  if (!monthBtn || !yearBtn || !daysGrid || !weekdaysEl) return;

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const shortMonthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  monthBtn.textContent = monthNames[dpCurrentMonth];
  yearBtn.textContent = dpCurrentYear;

  daysGrid.innerHTML = '';

  if (calendarView === 'days') {
    weekdaysEl.style.display = 'grid';
    daysGrid.style.gridTemplateColumns = 'repeat(7, 1fr)';

    const firstDay = new Date(dpCurrentYear, dpCurrentMonth, 1).getDay();
    const numDays = new Date(dpCurrentYear, dpCurrentMonth + 1, 0).getDate();
    const selectedDate = activePicker === 'from' ? dateFrom : dateTo;

    for (let i = 0; i < firstDay; i++) {
      const emptyCell = document.createElement('span');
      emptyCell.className = 'dp-empty';
      daysGrid.appendChild(emptyCell);
    }

    for (let day = 1; day <= numDays; day++) {
      const dayBtn = document.createElement('button');
      dayBtn.type = 'button';
      dayBtn.className = 'dp-day-btn';
      dayBtn.textContent = day;

      const isSelected = selectedDate.getDate() === day &&
                         selectedDate.getMonth() === dpCurrentMonth &&
                         selectedDate.getFullYear() === dpCurrentYear;
      if (isSelected) {
        dayBtn.classList.add('is-selected');
      }

      const today = new Date();
      const isToday = today.getDate() === day &&
                      today.getMonth() === dpCurrentMonth &&
                      today.getFullYear() === dpCurrentYear;
      if (isToday) {
        dayBtn.classList.add('is-today');
      }

      dayBtn.addEventListener('click', () => {
        const selected = new Date(dpCurrentYear, dpCurrentMonth, day);
        if (activePicker === 'from') {
          dateFrom = selected;
          document.getElementById('dateFromText').textContent = formatDateString(dateFrom);
        } else {
          dateTo = selected;
          document.getElementById('dateToText').textContent = formatDateString(dateTo);
        }
        
        document.getElementById('datePickerDialog').hidden = true;
        activePicker = null;
        updateDateDifferenceDisplay();
      });

      daysGrid.appendChild(dayBtn);
    }
  } else if (calendarView === 'months') {
    weekdaysEl.style.display = 'none';
    daysGrid.style.gridTemplateColumns = 'repeat(3, 1fr)';

    shortMonthNames.forEach((monthName, index) => {
      const monthSelectBtn = document.createElement('button');
      monthSelectBtn.type = 'button';
      monthSelectBtn.className = 'dp-month-select-btn';
      monthSelectBtn.textContent = monthName;
      if (dpCurrentMonth === index) {
        monthSelectBtn.classList.add('is-selected');
      }

      monthSelectBtn.addEventListener('click', () => {
        dpCurrentMonth = index;
        calendarView = 'days';
        renderCalendarGrid();
      });

      daysGrid.appendChild(monthSelectBtn);
    });
  } else if (calendarView === 'years') {
    weekdaysEl.style.display = 'none';
    daysGrid.style.gridTemplateColumns = 'repeat(3, 1fr)';

    for (let i = 0; i < 12; i++) {
      const yearVal = dpYearRangeStart + i;
      const yearSelectBtn = document.createElement('button');
      yearSelectBtn.type = 'button';
      yearSelectBtn.className = 'dp-year-select-btn';
      yearSelectBtn.textContent = yearVal;
      if (dpCurrentYear === yearVal) {
        yearSelectBtn.classList.add('is-selected');
      }

      yearSelectBtn.addEventListener('click', () => {
        dpCurrentYear = yearVal;
        calendarView = 'days';
        renderCalendarGrid();
      });

      daysGrid.appendChild(yearSelectBtn);
    }
  }
}

function updateDateDifferenceDisplay() {
  updateDateAddSubResult();
}

function parseProgrammerLiteral(text = expression) {
  const normalized = text.trim().replace(/\s+/g, '').toUpperCase();
  if (!normalized) {
    return 0n;
  }

  const sign = normalized.startsWith('-') ? -1n : 1n;
  const digits = normalized.replace(/^-/, '');
  const baseMap = {
    HEX: { radix: 16n, pattern: /^[0-9A-F]+$/ },
    DEC: { radix: 10n, pattern: /^[0-9]+$/ },
    OCT: { radix: 8n, pattern: /^[0-7]+$/ },
    BIN: { radix: 2n, pattern: /^[01]+$/ }
  };
  const config = baseMap[programmerBase];

  if (!config.pattern.test(digits)) {
    return null;
  }

  let value = 0n;
  for (const digit of digits) {
    value = value * config.radix + BigInt(Number.parseInt(digit, Number(config.radix)));
  }

  return value * sign;
}

function formatProgrammerValue(value, base = programmerBase) {
  const sign = value < 0n ? '-' : '';
  const absolute = value < 0n ? -value : value;
  const radix = base === 'HEX' ? 16 : base === 'OCT' ? 8 : base === 'BIN' ? 2 : 10;
  return `${sign}${absolute.toString(radix).toUpperCase()}`;
}

function getProgrammerValueSync() {
  return parseProgrammerLiteral(expression) ?? 0n;
}

function syncProgrammerReadout() {
  if (currentMode !== 'programming') {
    return;
  }

  const value = getProgrammerValueSync();
  const readout = {
    HEX: formatProgrammerValue(value, 'HEX'),
    DEC: formatProgrammerValue(value, 'DEC'),
    OCT: formatProgrammerValue(value, 'OCT'),
    BIN: formatProgrammerValue(value, 'BIN')
  };

  Object.entries(readout).forEach(([base, output]) => {
    const item = keypad.querySelector(`[data-readout="${base}"]`);
    if (item) {
      item.textContent = output;
    }
  });
}

function renderProgrammerBitGrid() {
  const value = BigInt.asUintN(programmerWordBits, getProgrammerValueSync());
  const groupsHtml = [];

  for (let groupStart = programmerWordBits - 4; groupStart >= 0; groupStart -= 4) {
    const bits = [];
    for (let bit = groupStart + 3; bit >= groupStart; bit -= 1) {
      const isOn = ((value >> BigInt(bit)) & 1n) === 1n;
      bits.push(`
        <button class="programmer-bit-btn ${isOn ? 'is-active' : ''}" data-action="toggle-bit" data-bit="${bit}" type="button">
          ${isOn ? '1' : '0'}
        </button>
      `);
    }
    groupsHtml.push(`
      <div class="programmer-bit-group">
        <div class="programmer-bit-buttons">${bits.join('')}</div>
        <span class="programmer-bit-group-label">${groupStart}</span>
      </div>
    `);
  }

  const rowsHtml = [];
  for (let i = 0; i < groupsHtml.length; i += 4) {
    const rowGroups = groupsHtml.slice(i, i + 4);
    rowsHtml.push(`
      <div class="programmer-bit-row">
        ${rowGroups.join('')}
      </div>
    `);
  }

  return `
    <div class="programmer-bits-grid">
      ${rowsHtml.join('')}
    </div>
  `;
}

function renderProgrammingKeypad() {
  const isHex = programmerBase === 'HEX';
  const isDec = programmerBase === 'DEC';
  const isOct = programmerBase === 'OCT';
  const isBin = programmerBase === 'BIN';

  const hexDisabled = !isHex ? 'disabled' : '';
  const binDisabled = isBin ? 'disabled' : '';
  const binOctDisabled = (isBin || isOct) ? 'disabled' : '';

  const bases = ['HEX', 'DEC', 'OCT', 'BIN'];
  const currentValue = getProgrammerValueSync();
  const readoutsHtml = bases.map((base) => {
    const isActive = programmerBase === base;
    const valueStr = formatProgrammerValue(currentValue, base);
    return `
      <button class="programmer-base-btn ${isActive ? 'is-active' : ''}" data-action="set-programmer-base" data-base="${base}" type="button">
        <span>${base}</span>
        <strong data-readout="${base}">${valueStr}</strong>
      </button>
    `;
  }).join('');

  const toolbarHtml = `
    <div class="programmer-toolbar-row">
      <div class="programmer-toolbar-tabs">
        <button class="programmer-tab-btn ${programmerView === 'keypad' ? 'is-active' : ''}" data-action="set-programmer-view" data-view="keypad" type="button" title="Keypad view">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="3" width="4" height="4"></rect>
            <rect x="10" y="3" width="4" height="4"></rect>
            <rect x="17" y="3" width="4" height="4"></rect>
            <rect x="3" y="10" width="4" height="4"></rect>
            <rect x="10" y="10" width="4" height="4"></rect>
            <rect x="17" y="10" width="4" height="4"></rect>
            <rect x="3" y="17" width="4" height="4"></rect>
            <rect x="10" y="17" width="4" height="4"></rect>
            <rect x="17" y="17" width="4" height="4"></rect>
          </svg>
        </button>
        <button class="programmer-tab-btn ${programmerView === 'bits' ? 'is-active' : ''}" data-action="set-programmer-view" data-view="bits" type="button" title="Bit view">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="2" fill="currentColor"></circle>
            <circle cx="8" cy="8" r="2" fill="currentColor"></circle>
            <circle cx="16" cy="8" r="2" fill="currentColor"></circle>
            <circle cx="8" cy="16" r="2" fill="currentColor"></circle>
            <circle cx="16" cy="16" r="2" fill="currentColor"></circle>
          </svg>
        </button>
      </div>
      <div class="programmer-toolbar-actions">
        <button class="programmer-word-btn" data-action="cycle-word-size" type="button">
          ${programmerWordBits === 64 ? 'QWORD' : programmerWordBits === 32 ? 'DWORD' : programmerWordBits === 16 ? 'WORD' : 'BYTE'}
        </button>
        <button class="programmer-mem-btn" data-action="memory-store" type="button">MS</button>
        <button class="programmer-mem-btn ${programmerDropdown === 'memory' ? 'is-active' : ''}" data-action="toggle-memory-dropdown" type="button">M⌄</button>
      </div>
    </div>
  `;

  let contentHtml = '';

  if (programmerView === 'bits') {
    contentHtml = renderProgrammerBitGrid();
  } else {
    const dropdownsHtml = `
      <div class="programmer-dropdowns-row">
        <button class="programmer-dropdown-btn ${programmerDropdown === 'bitwise' ? 'is-active' : ''}" data-action="toggle-bitwise-dropdown" type="button">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M6 4h4a6 6 0 0 1 6 6v0a6 6 0 0 1-6 6H6z"></path>
            <line x1="2" y1="9" x2="6" y2="9"></line>
            <line x1="2" y1="15" x2="6" y2="15"></line>
            <line x1="16" y1="12" x2="22" y2="12"></line>
            <circle cx="17" cy="12" r="1" fill="currentColor"></circle>
          </svg>
          <span>Bitwise</span>
          <svg class="chevron" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
        </button>
        <button class="programmer-dropdown-btn ${programmerDropdown === 'shift' ? 'is-active' : ''}" data-action="toggle-shift-dropdown" type="button">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="13 17 18 12 13 7"></polyline>
            <polyline points="6 17 11 12 6 7"></polyline>
          </svg>
          <span>Bit shift</span>
          <svg class="chevron" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
        </button>
      </div>
    `;

    const keyboardKeysHtml = `
      <button data-insert="A" class="key" type="button" ${hexDisabled}>A</button>
      <button data-action="programmer-shift" data-dir="left" class="key" type="button">&lt;&lt;</button>
      <button data-action="programmer-shift" data-dir="right" class="key" type="button">&gt;&gt;</button>
      <button data-action="clear" class="key key-secondary" type="button">C</button>
      <button data-action="backspace" class="key key-secondary" type="button">⌫</button>

      <button data-insert="B" class="key" type="button" ${hexDisabled}>B</button>
      <button data-insert="(" class="key" type="button">(</button>
      <button data-insert=")" class="key" type="button">)</button>
      <button data-insert="%" class="key" type="button">%</button>
      <button data-insert="/" class="key key-operator" type="button">÷</button>

      <button data-insert="C" class="key" type="button" ${hexDisabled}>C</button>
      <button data-insert="7" class="key" type="button" ${binOctDisabled}>7</button>
      <button data-insert="8" class="key" type="button" ${binOctDisabled}>8</button>
      <button data-insert="9" class="key" type="button" ${binOctDisabled}>9</button>
      <button data-insert="*" class="key key-operator" type="button">×</button>

      <button data-insert="D" class="key" type="button" ${hexDisabled}>D</button>
      <button data-insert="4" class="key" type="button" ${binDisabled}>4</button>
      <button data-insert="5" class="key" type="button" ${binDisabled}>5</button>
      <button data-insert="6" class="key" type="button" ${binDisabled}>6</button>
      <button data-insert="-" class="key key-operator" type="button">−</button>

      <button data-insert="E" class="key" type="button" ${hexDisabled}>E</button>
      <button data-insert="1" class="key" type="button">1</button>
      <button data-insert="2" class="key" type="button" ${binDisabled}>2</button>
      <button data-insert="3" class="key" type="button" ${binDisabled}>3</button>
      <button data-insert="+" class="key key-operator" type="button">+</button>

      <button data-insert="F" class="key" type="button" ${hexDisabled}>F</button>
      <button data-action="negate" class="key" type="button">+/−</button>
      <button data-insert="0" class="key" type="button">0</button>
      <button data-insert="." class="key" type="button" ${binOctDisabled}>.</button>
      <button data-action="equals" class="key key-equals" type="button">=</button>
    `;

    let overlayHtml = '';
    if (programmerDropdown === 'bitwise') {
      overlayHtml = `
        <div class="programmer-overlay-dialog">
          <div class="programmer-dialog-header">
            <span>Bitwise Options</span>
            <button class="programmer-dialog-close" data-action="close-programmer-dropdown" type="button">&times;</button>
          </div>
          <div class="programmer-bitwise-panel">
            <button class="programmer-bitwise-btn" data-action="insert-bitwise" data-op="and" type="button">AND</button>
            <button class="programmer-bitwise-btn" data-action="insert-bitwise" data-op="or" type="button">OR</button>
            <button class="programmer-bitwise-btn" data-action="insert-bitwise" data-op="not" type="button">NOT</button>
            <button class="programmer-bitwise-btn" data-action="insert-bitwise" data-op="nand" type="button">NAND</button>
            <button class="programmer-bitwise-btn" data-action="insert-bitwise" data-op="nor" type="button">NOR</button>
            <button class="programmer-bitwise-btn" data-action="insert-bitwise" data-op="xor" type="button">XOR</button>
          </div>
        </div>
      `;
    } else if (programmerDropdown === 'shift') {
      overlayHtml = `
        <div class="programmer-overlay-dialog">
          <div class="programmer-dialog-header">
            <span>Bit shift Options</span>
            <button class="programmer-dialog-close" data-action="close-programmer-dropdown" type="button">&times;</button>
          </div>
          <div class="programmer-shift-panel">
            <button class="programmer-shift-option ${programmerShiftMode === 'arithmetic' ? 'is-active' : ''}" data-action="set-shift-mode" data-shift-mode="arithmetic" type="button">
              <span class="programmer-radio-circle"><span class="programmer-radio-dot"></span></span>
              Arithmetic shift
            </button>
            <button class="programmer-shift-option ${programmerShiftMode === 'logical' ? 'is-active' : ''}" data-action="set-shift-mode" data-shift-mode="logical" type="button">
              <span class="programmer-radio-circle"><span class="programmer-radio-dot"></span></span>
              Logical shift
            </button>
            <button class="programmer-shift-option ${programmerShiftMode === 'rotate' ? 'is-active' : ''}" data-action="set-shift-mode" data-shift-mode="rotate" type="button">
              <span class="programmer-radio-circle"><span class="programmer-radio-dot"></span></span>
              Rotate circular shift
            </button>
            <button class="programmer-shift-option ${programmerShiftMode === 'rotate-carry' ? 'is-active' : ''}" data-action="set-shift-mode" data-shift-mode="rotate-carry" type="button">
              <span class="programmer-radio-circle"><span class="programmer-radio-dot"></span></span>
              Rotate through carry circular shift
            </button>
          </div>
        </div>
      `;
    } else if (programmerDropdown === 'memory') {
      overlayHtml = `
        <div class="programmer-overlay-dialog">
          <div class="programmer-dialog-header">
            <span>Stored Memory</span>
            <button class="programmer-dialog-close" data-action="close-programmer-dropdown" type="button">&times;</button>
          </div>
          <div class="programmer-memory-panel">
            <div class="programmer-memory-list">
              ${memoryList.length === 0 ? '<div class="programmer-memory-empty">No stored memory</div>' : memoryList.slice().reverse().map((val, idx) => {
        const originalIndex = memoryList.length - 1 - idx;
        return `
                  <button class="programmer-memory-item" data-action="recall-programmer-memory" data-index="${originalIndex}" type="button">
                    <span>${val}</span>
                  </button>
                `;
      }).join('')}
            </div>
            <button class="programmer-memory-clear-btn" data-action="clear-programmer-memory" type="button" title="Clear memory">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
            </button>
          </div>
        </div>
      `;
    }

    contentHtml = `
      ${dropdownsHtml}
      <div class="programmer-keys-wrapper">
        ${keyboardKeysHtml}
        ${overlayHtml}
      </div>
    `;
  }

  keypad.innerHTML = `
    <div class="programmer-readout">
      ${readoutsHtml}
    </div>
    ${toolbarHtml}
    ${contentHtml}
  `;
  syncProgrammerReadout();
}

function toggleScientificPanel(panelName) {
  scientificDropdown = (scientificDropdown === panelName) ? null : panelName;
  renderScientificKeypad();
}

function getTrigFunctionName(name) {
  const inverseMap = {
    sin: 'asin',
    cos: 'acos',
    tan: 'atan',
    sec: 'asec',
    csc: 'acsc',
    cot: 'acot'
  };

  const hyperbolicMap = {
    sin: 'sinh',
    cos: 'cosh',
    tan: 'tanh',
    sec: 'sech',
    csc: 'csch',
    cot: 'coth'
  };

  if (scientificSecond && scientificHyp) {
    return `a${hyperbolicMap[name]}`;
  }

  if (scientificSecond) {
    return inverseMap[name];
  }

  if (scientificHyp) {
    return hyperbolicMap[name];
  }

  return name;
}

function syncTrigToggles() {
  keypad.querySelectorAll('[data-action="toggle-second"]').forEach((button) => {
    button.classList.toggle('is-active', scientificSecond);
  });

  keypad.querySelectorAll('[data-action="toggle-hyp"]').forEach((button) => {
    button.classList.toggle('is-active', scientificHyp);
  });
}

function preprocessExpressionForBackend(expr) {
  let processed = expr
    .replace(/\s*Lsh\s*/g, ' << ')
    .replace(/\s*Rsh\s*/g, programmerShiftMode === 'logical' ? ' >>> ' : ' >> ');

  if (currentMode === 'programming') {
    const prefix = programmerBase === 'HEX' ? '0x' : programmerBase === 'OCT' ? '0o' : programmerBase === 'BIN' ? '0b' : '';
    if (prefix) {
      const keywords = ['BITAND', 'BITOR', 'BITNOT', 'BITXOR', 'BITNAND', 'BITNOR', 'BITROL', 'BITROR', 'BITRCL', 'BITRCR'];
      processed = processed.replace(/\b[0-9A-F]+\b/gi, (match) => {
        if (keywords.includes(match.toUpperCase())) {
          return match;
        }
        return prefix + match;
      });
    }
  }
  return processed;
}

async function getCurrentNumericValue() {
  if (!expression.trim()) {
    return 0;
  }

  const response = await fetch('/api/evaluate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ expression: preprocessExpressionForBackend(expression) })
  });
  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.error || 'Unable to evaluate expression.');
  }

  const numericValue = Number(payload.result);
  if (!Number.isFinite(numericValue)) {
    throw new Error('Current expression is not numeric.');
  }

  return numericValue;
}

function wrapCurrentExpression(prefix, suffix = ')', fallback = '0') {
  if (expression.trim()) {
    expression = `${prefix}${expression}${suffix}`;
  } else {
    expression = `${prefix}${fallback}${suffix}`;
  }

  updateDisplay();
}

function handleShiftInsert(direction) {
  const ws = programmerWordBits;
  if (programmerShiftMode === 'arithmetic' || programmerShiftMode === 'logical') {
    if (direction === 'left') {
      insertValue(' Lsh ');
    } else {
      insertValue(' Rsh ');
    }
  } else if (programmerShiftMode === 'rotate') {
    if (direction === 'left') {
      wrapCurrentExpression('bitRol(', `, 1, ${ws})`, '0');
    } else {
      wrapCurrentExpression('bitRor(', `, 1, ${ws})`, '0');
    }
  } else if (programmerShiftMode === 'rotate-carry') {
    if (direction === 'left') {
      wrapCurrentExpression('bitRcl(', `, 1, ${ws})`, '0');
    } else {
      wrapCurrentExpression('bitRcr(', `, 1, ${ws})`, '0');
    }
  }
}

function convertDegreesToDms(value) {
  const sign = value < 0 ? '-' : '';
  const absolute = Math.abs(value);
  const degrees = Math.floor(absolute);
  const minutesFloat = (absolute - degrees) * 60;
  const minutes = Math.floor(minutesFloat);
  const seconds = ((minutesFloat - minutes) * 60).toFixed(2);
  return `${sign}${degrees}° ${minutes}' ${seconds}"`;
}

async function handleCalculatorAction(action, button) {
  if (action === 'clear') {
    clearAll();
    return;
  }

  if (action === 'backspace') {
    backspace();
    return;
  }

  if (action === 'equals') {
    evaluateExpression();
    return;
  }

  if (action === 'open-date-picker') {
    activePicker = button.dataset.picker;
    const activeDate = activePicker === 'from' ? dateFrom : dateTo;
    dpCurrentMonth = activeDate.getMonth();
    dpCurrentYear = activeDate.getFullYear();
    calendarView = 'days';
    const dialog = document.getElementById('datePickerDialog');
    if (dialog) {
      dialog.hidden = false;
      renderCalendarGrid();
    }
    return;
  }

  if (action === 'toggle-date-mode-menu') {
    const menu = document.getElementById('dateModeMenu');
    if (menu) {
      menu.hidden = !menu.hidden;
    }
    return;
  }

  if (action === 'select-date-submode') {
    dateSubMode = button.dataset.submode;
    renderDateKeypad();
    return;
  }

  if (action === 'dp-select-month') {
    calendarView = calendarView === 'months' ? 'days' : 'months';
    renderCalendarGrid();
    return;
  }

  if (action === 'dp-select-year') {
    calendarView = calendarView === 'years' ? 'days' : 'years';
    if (calendarView === 'years') {
      dpYearRangeStart = dpCurrentYear - 6;
    }
    renderCalendarGrid();
    return;
  }

  if (action === 'dp-prev') {
    if (calendarView === 'days') {
      dpCurrentMonth--;
      if (dpCurrentMonth < 0) {
        dpCurrentMonth = 11;
        dpCurrentYear--;
      }
    } else if (calendarView === 'months') {
      dpCurrentYear--;
    } else if (calendarView === 'years') {
      dpYearRangeStart -= 12;
    }
    renderCalendarGrid();
    return;
  }

  if (action === 'dp-next') {
    if (calendarView === 'days') {
      dpCurrentMonth++;
      if (dpCurrentMonth > 11) {
        dpCurrentMonth = 0;
        dpCurrentYear++;
      }
    } else if (calendarView === 'months') {
      dpCurrentYear++;
    } else if (calendarView === 'years') {
      dpYearRangeStart += 12;
    }
    renderCalendarGrid();
    return;
  }

  if (action === 'toggle-scientific-panel') {
    toggleScientificPanel(button.dataset.panel);
    return;
  }

  if (action === 'close-scientific-dropdown') {
    scientificDropdown = null;
    renderScientificKeypad();
    return;
  }

  if (action === 'toggle-second') {
    scientificSecond = !scientificSecond;
    if (currentMode === 'scientific') {
      renderScientificKeypad();
    } else {
      syncTrigToggles();
    }
    return;
  }

  if (action === 'toggle-hyp') {
    scientificHyp = !scientificHyp;
    if (currentMode === 'scientific') {
      renderScientificKeypad();
    } else {
      syncTrigToggles();
    }
    return;
  }

  if (action === 'insert-trig') {
    insertValue(`${getTrigFunctionName(button.dataset.trig)}(`);
    scientificDropdown = null;
    renderScientificKeypad();
    return;
  }

  if (action === 'square') {
    expression = expression.trim() ? `(${expression})^2` : '0^2';
    updateDisplay();
    return;
  }

  if (action === 'reciprocal') {
    expression = expression.trim() ? `1/(${expression})` : '1/(';
    updateDisplay();
    return;
  }

  if (action === 'absolute') {
    wrapCurrentExpression('abs(');
    scientificDropdown = null;
    renderScientificKeypad();
    return;
  }

  if (action === 'floor') {
    wrapCurrentExpression('floor(');
    scientificDropdown = null;
    renderScientificKeypad();
    return;
  }

  if (action === 'ceil') {
    wrapCurrentExpression('ceil(');
    scientificDropdown = null;
    renderScientificKeypad();
    return;
  }

  if (action === 'negate') {
    if (!expression.trim()) {
      expression = '-';
    } else if (expression.startsWith('-(') && expression.endsWith(')')) {
      expression = expression.slice(2, -1);
    } else {
      expression = `-(${expression})`;
    }
    updateDisplay();
    return;
  }

  if (action === 'toggle-angle') {
    angleMode = angleMode === 'DEG' ? 'RAD' : 'DEG';
    button.textContent = angleMode;
    updateDisplay(`${angleMode} mode`);
    return;
  }

  if (action === 'set-programmer-base') {
    const newBase = button.dataset.base;
    if (newBase !== programmerBase) {
      const currentValue = getProgrammerValueSync();
      programmerBase = newBase;
      expression = formatProgrammerValue(currentValue, newBase);
      renderProgrammingKeypad();
      updateDisplay();
    }
    return;
  }

  if (action === 'set-programmer-view') {
    programmerView = button.dataset.view;
    programmerDropdown = null;
    renderProgrammingKeypad();
    return;
  }

  if (action === 'cycle-word-size') {
    if (programmerWordBits === 64) programmerWordBits = 32;
    else if (programmerWordBits === 32) programmerWordBits = 16;
    else if (programmerWordBits === 16) programmerWordBits = 8;
    else programmerWordBits = 64;

    const currentValue = getProgrammerValueSync();
    const signedValue = BigInt.asIntN(Number(programmerWordBits), currentValue);
    expression = formatProgrammerValue(signedValue, programmerBase);

    renderProgrammingKeypad();
    updateDisplay();
    return;
  }

  if (action === 'toggle-bitwise-dropdown') {
    programmerDropdown = programmerDropdown === 'bitwise' ? null : 'bitwise';
    renderProgrammingKeypad();
    return;
  }

  if (action === 'toggle-shift-dropdown') {
    programmerDropdown = programmerDropdown === 'shift' ? null : 'shift';
    renderProgrammingKeypad();
    return;
  }

  if (action === 'insert-bitwise') {
    const op = button.dataset.op;
    if (op === 'and') {
      insertValue('bitAnd(');
    } else if (op === 'or') {
      insertValue('bitOr(');
    } else if (op === 'not') {
      wrapCurrentExpression('bitNot(', ')', '0');
    } else if (op === 'nand') {
      insertValue('bitNand(');
    } else if (op === 'nor') {
      insertValue('bitNor(');
    } else if (op === 'xor') {
      insertValue('bitXor(');
    }
    programmerDropdown = null;
    renderProgrammingKeypad();
    return;
  }

  if (action === 'set-shift-mode') {
    programmerShiftMode = button.dataset.shiftMode;
    programmerDropdown = null;
    renderProgrammingKeypad();
    return;
  }

  if (action === 'programmer-shift') {
    const direction = button.dataset.dir;
    handleShiftInsert(direction);
    return;
  }

  if (action === 'toggle-bit') {
    const bitIndex = BigInt(button.dataset.bit);
    let currentValue = getProgrammerValueSync();
    currentValue = currentValue ^ (1n << bitIndex);
    expression = formatProgrammerValue(currentValue, programmerBase);
    renderProgrammingKeypad();
    updateDisplay();
    return;
  }

  if (action === 'toggle-memory-dropdown') {
    programmerDropdown = programmerDropdown === 'memory' ? null : 'memory';
    renderProgrammingKeypad();
    return;
  }

  if (action === 'close-programmer-dropdown') {
    programmerDropdown = null;
    renderProgrammingKeypad();
    return;
  }

  if (action === 'recall-programmer-memory') {
    const idx = parseInt(button.dataset.index, 10);
    if (!isNaN(idx) && memoryList[idx] !== undefined) {
      insertValue(String(memoryList[idx]));
    }
    programmerDropdown = null;
    renderProgrammingKeypad();
    return;
  }

  if (action === 'clear-programmer-memory') {
    memoryList = [];
    memoryValue = 0;
    programmerDropdown = null;
    renderProgrammingKeypad();
    return;
  }

  try {
    if (action === 'format-exponential') {
      const value = await getCurrentNumericValue();
      resultEl.textContent = value.toExponential(8);
      return;
    }

    if (action === 'memory-clear') {
      memoryValue = 0;
      memoryList = [];
      updateDisplay('Memory cleared');
      return;
    }

    if (action === 'memory-recall') {
      insertValue(String(memoryValue));
      return;
    }

    if (action === 'memory-add') {
      memoryValue += await getCurrentNumericValue();
      updateDisplay(`Memory: ${memoryValue}`);
      return;
    }

    if (action === 'memory-subtract') {
      memoryValue -= await getCurrentNumericValue();
      updateDisplay(`Memory: ${memoryValue}`);
      return;
    }

    if (action === 'memory-store') {
      memoryValue = await getCurrentNumericValue();
      memoryList.push(memoryValue);
      updateDisplay(`Memory: ${memoryValue}`);
      if (currentMode === 'programming') {
        renderProgrammingKeypad();
      }
      return;
    }

    if (action === 'memory-view') {
      updateDisplay(`Memory: ${memoryValue}`);
      return;
    }

    if (action === 'to-deg') {
      const value = await getCurrentNumericValue();
      expression = String(value * 180 / Math.PI);
      updateDisplay(expression);
      if (currentMode === 'scientific') {
        scientificDropdown = null;
        renderScientificKeypad();
      }
      return;
    }

    if (action === 'to-dms') {
      const value = await getCurrentNumericValue();
      resultEl.textContent = convertDegreesToDms(value);
      if (currentMode === 'scientific') {
        scientificDropdown = null;
        renderScientificKeypad();
      }
      return;
    }
  } catch (error) {
    updateDisplay(error.message || 'Action failed.');
  }
}

async function evaluateExpression() {
  if (!expression.trim()) {
    updateDisplay('Enter a calculation first.');
    return;
  }

  try {
    const response = await fetch('/api/evaluate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ expression: preprocessExpressionForBackend(expression) })
    });

    const payload = await response.json();

    if (!response.ok) {
      updateDisplay(payload.error || 'Calculation failed.');
      return;
    }

    let resultValue = payload.result;
    if (currentMode === 'programming') {
      try {
        const num = Math.round(Number(resultValue));
        if (!isNaN(num)) {
          const val = BigInt(num);
          expression = formatProgrammerValue(val, programmerBase);
        } else {
          expression = resultValue;
        }
      } catch (e) {
        expression = resultValue;
      }
    } else {
      expression = resultValue;
    }
    updateDisplay(expression);
  } catch (error) {
    updateDisplay('Backend unavailable.');
  }
}

keypad.addEventListener('click', async (event) => {
  if (event.target.closest('.scientific-overlay-dialog') || event.target.closest('.scientific-toolbar') || event.target.closest('.date-picker-dialog')) {
    event.stopPropagation();
  }

  const button = event.target.closest('button');
  if (!button) {
    return;
  }

  const value = button.dataset.insert;
  const action = button.dataset.action;

  if (action) {
    await handleCalculatorAction(action, button);
    return;
  }

  if (value) {
    insertValue(value);
  }
});

keypad.addEventListener('change', (event) => {
  const target = event.target;
  if (target.name === 'dateAddSubOp') {
    dateAddSubOp = target.value;
    updateDateAddSubResult();
  } else if (target.id === 'dateAddYears') {
    dateAddYears = parseInt(target.value, 10) || 0;
    updateDateAddSubResult();
  } else if (target.id === 'dateAddMonths') {
    dateAddMonths = parseInt(target.value, 10) || 0;
    updateDateAddSubResult();
  } else if (target.id === 'dateAddDays') {
    dateAddDays = parseInt(target.value, 10) || 0;
    updateDateAddSubResult();
  }
});

modeButtons.forEach((button) => {
  button.addEventListener('click', () => {
    setKeypadMode(button.dataset.mode);
  });
});

themeToggle.addEventListener('click', () => {
  const isDark = root.getAttribute('data-theme') === 'dark';

  if (isDark) {
    root.removeAttribute('data-theme');
    localStorage.setItem('mathTheme', 'light');
  } else {
    root.setAttribute('data-theme', 'dark');
    localStorage.setItem('mathTheme', 'dark');
  }

  syncThemeIcon();
});

accentToggle.addEventListener('click', (event) => {
  event.stopPropagation();
  accentDropdown.classList.toggle('active');
});

accentDropdown.addEventListener('click', (event) => {
  event.stopPropagation();
});

accentOptions.forEach((button) => {
  button.addEventListener('click', () => {
    const accent = button.dataset.accent;
    setPresetAccent(accent);
    accentDropdown.classList.remove('active');
  });
});

customColorPicker.addEventListener('input', (event) => {
  setCustomAccent(event.target.value);
});

document.addEventListener('click', (event) => {
  if (!accentDropdown.contains(event.target) && !accentToggle.contains(event.target)) {
    accentDropdown.classList.remove('active');
  }

  if (currentMode === 'date') {
    const dialog = document.getElementById('datePickerDialog');
    if (dialog && !dialog.hidden) {
      const isTriggerClick = event.target.closest('.date-picker-trigger');
      const isDialogClick = event.target.closest('.date-picker-dialog');
      if (!isTriggerClick && !isDialogClick) {
        dialog.hidden = true;
        activePicker = null;
      }
    }

    const menu = document.getElementById('dateModeMenu');
    if (menu && !menu.hidden) {
      const isDropdownBtn = event.target.closest('.date-dropdown-btn');
      const isDropdownMenu = event.target.closest('.date-dropdown-menu');
      if (!isDropdownBtn && !isDropdownMenu) {
        menu.hidden = true;
      }
    }
  }
});

window.addEventListener('keydown', (event) => {
  const { key } = event;

  if (/[0-9]/.test(key) || ['+', '-', '*', '/', '.', '(', ')', '^'].includes(key)) {
    insertValue(key);
    return;
  }

  if (key === 'Enter' || key === '=') {
    event.preventDefault();
    evaluateExpression();
    return;
  }

  if (key === 'Backspace') {
    backspace();
    return;
  }

  if (key === 'Escape') {
    clearAll();
  }
});

loadTheme();
loadAccent();
updateDisplay();

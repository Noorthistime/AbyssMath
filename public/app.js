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
let resultDpMonth = new Date().getMonth();
let resultDpYear = new Date().getFullYear();

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
  if (currentMode === 'phone') {
    expressionEl.textContent = expression || '0';

    // Evaluate on the fly
    if (!expression) {
      resultEl.textContent = '';
    } else {
      try {
        const processed = preprocessExpressionForBackend(expression);
        // Clean trailing operators and whitespace
        const cleanProcessed = processed.trim().replace(/[\+\-\*\/]+$/, '');
        if (cleanProcessed) {
          const evalResult = math.evaluate(cleanProcessed);
          if (evalResult !== undefined && typeof evalResult !== 'function') {
            resultEl.textContent = String(evalResult);
          } else {
            resultEl.textContent = '';
          }
        } else {
          resultEl.textContent = '';
        }
      } catch (e) {
        // Suppress errors during live preview typing
      }
    }
    return;
  }

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
  if (!['phone', 'standard', 'scientific', 'programming', 'date', 'graphing'].includes(mode)) {
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

  calculatorCard.classList.toggle('phone-mode', mode === 'phone');
  calculatorCard.classList.toggle('scientific-mode', mode === 'scientific');
  calculatorCard.classList.toggle('programming-mode', mode === 'programming');
  calculatorCard.classList.toggle('date-mode', mode === 'date');

  const phoneHeader = calculatorCard.querySelector('.phone-header');
  if (phoneHeader) {
    phoneHeader.style.display = mode === 'phone' ? 'flex' : 'none';
  }

  // Close all phone overlays & hide sci keypad when leaving phone mode
  const phoneSciKeypad = document.getElementById('phoneScientificKeypad');
  if (phoneSciKeypad) {
    if (mode === 'phone' && phoneSciKeypad.dataset.open === '1') {
      phoneSciKeypad.classList.add('is-visible');
      calculatorCard.classList.add('phone-sci-open');
    } else {
      phoneSciKeypad.classList.remove('is-visible');
      calculatorCard.classList.remove('phone-sci-open');
    }
  }
  document.getElementById('phoneHistoryOverlay')?.classList.remove('is-open');
  document.getElementById('phoneSettingsOverlay')?.classList.remove('is-open');
  document.getElementById('phoneAboutOverlay')?.classList.remove('is-open');
  if (mode !== 'standard' && mode !== 'scientific' && mode !== 'programming') {
    if (typeof window.closeStandardHistory === 'function') window.closeStandardHistory();
  }

  const graphingCard = document.getElementById('graphingCard');
  if (graphingCard) {
    if (mode === 'graphing') {
      calculatorCard.style.display = 'none';
      graphingCard.style.display = 'flex';
      initGraphCanvas();
      // Ensure layout is updated and active tab resets to Graph view
      requestAnimationFrame(() => {
        document.getElementById('graphViewBtn')?.click();
        recenterGraph();
      });
      return;
    } else {
      calculatorCard.style.display = 'flex';
      graphingCard.style.display = 'none';
    }
  }

  if (mode === 'phone' || mode === 'standard') {
    keypad.innerHTML = standardKeypadMarkup;
    if (mode === 'phone' && typeof phoneApplySettings === 'function') {
      phoneApplySettings();
    }
    updateDisplay();
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
  } else if (scientificDropdown === 'memory') {
    const memItems = memoryList.length === 0
      ? '<div class="sci-mem-empty">No stored memory</div>'
      : memoryList.slice().reverse().map((val, idx) => {
        const originalIndex = memoryList.length - 1 - idx;
        return `<button class="sci-mem-item" data-action="recall-sci-memory" data-index="${originalIndex}" type="button">${val}</button>`;
      }).join('');
    overlayHtml = `
      <div class="scientific-overlay-dialog memory-dialog">
        <div class="sci-mem-list">${memItems}</div>
        <button class="sci-mem-clear-btn" data-action="clear-sci-memory" type="button" title="Clear all memory">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
        </button>
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
      <button class="scientific-memory" data-action="memory-subtract" type="button">M−</button>
      <button class="scientific-memory" data-action="memory-store" type="button">MS</button>
      <button class="scientific-memory ${scientificDropdown === 'memory' ? 'is-active' : ''}" data-action="toggle-scientific-panel" data-panel="memory" type="button">M⌄</button>
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

  if (isDiffMode) {
    keypad.innerHTML = `
      <div class="date-calc-container">
        <div class="date-mode-selector">
          <button class="date-dropdown-btn" data-action="toggle-date-mode-menu" type="button">
            <span>Difference between dates</span>
            <svg class="chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
          </button>
          <div class="date-dropdown-menu" id="dateModeMenu" hidden>
            <button class="date-dropdown-item active" data-action="select-date-submode" data-submode="diff" type="button">
              <span class="active-indicator"></span>
              Difference between dates
            </button>
            <button class="date-dropdown-item" data-action="select-date-submode" data-submode="add-sub" type="button">
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
    return;
  }

  // Add-sub mode - single column, calendars side by side at bottom
  keypad.innerHTML = `
    <div class="date-calc-container add-sub-layout">
      <div class="date-mode-selector">
        <button class="date-dropdown-btn" data-action="toggle-date-mode-menu" type="button">
          <span>Add or subtract days</span>
          <svg class="chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
        </button>
        <div class="date-dropdown-menu" id="dateModeMenu" hidden>
          <button class="date-dropdown-item" data-action="select-date-submode" data-submode="diff" type="button">
            <span class="active-indicator"></span>
            Difference between dates
          </button>
          <button class="date-dropdown-item active" data-action="select-date-submode" data-submode="add-sub" type="button">
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

      <div class="date-dropdowns-row">
        <div class="date-select-field">
          <label class="date-label">Years</label>
          <div class="select-wrapper">
            <button class="date-number-trigger" data-action="toggle-date-number-dropdown" data-field="years" type="button">
              <span id="dateAddYearsText">${dateAddYears}</span>
              <svg class="chevron" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
            </button>
            <div class="date-number-menu" data-field="years" hidden>
              ${renderNumberOptions(0, 100, dateAddYears)}
            </div>
          </div>
        </div>
        <div class="date-select-field">
          <label class="date-label">Months</label>
          <div class="select-wrapper">
            <button class="date-number-trigger" data-action="toggle-date-number-dropdown" data-field="months" type="button">
              <span id="dateAddMonthsText">${dateAddMonths}</span>
              <svg class="chevron" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
            </button>
            <div class="date-number-menu" data-field="months" hidden>
              ${renderNumberOptions(0, 100, dateAddMonths)}
            </div>
          </div>
        </div>
        <div class="date-select-field">
          <label class="date-label">Days</label>
          <div class="select-wrapper">
            <button class="date-number-trigger" data-action="toggle-date-number-dropdown" data-field="days" type="button">
              <span id="dateAddDaysText">${dateAddDays}</span>
              <svg class="chevron" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
            </button>
            <div class="date-number-menu" data-field="days" hidden>
              ${renderNumberOptions(0, 100, dateAddDays)}
            </div>
          </div>
        </div>
      </div>

      <div class="date-input-group">
        <label class="date-label">Date will be</label>
        <button class="date-picker-trigger" disabled type="button">
          <span id="dateResult">${formatDateString(addOrSubtractDate(dateFrom, dateAddYears, dateAddMonths, dateAddDays, dateAddSubOp))}</span>
          <svg class="date-calendar-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
        </button>
      </div>

      <div class="date-calendar-row">
        <div class="date-picker-dialog" id="datePickerDialog">
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

        <div class="date-result-calendar" id="dateResultCalendar">
          <div class="dp-header">
            <button class="dp-nav-btn" data-action="result-dp-prev" type="button">&lt;</button>
            <span class="dp-month-year">
              <span class="dp-header-btn" id="resultDpMonthBtn"></span>
              <span class="dp-header-btn" id="resultDpYearBtn"></span>
            </span>
            <button class="dp-nav-btn" data-action="result-dp-next" type="button">&gt;</button>
          </div>
          <div class="dp-weekdays">
            <span>Su</span><span>Mo</span><span>Tu</span><span>We</span><span>Th</span><span>Fr</span><span>Sa</span>
          </div>
          <div class="dp-days" id="resultDpDaysGrid"></div>
        </div>
      </div>
    </div>
  `;

  const calculated = addOrSubtractDate(dateFrom, dateAddYears, dateAddMonths, dateAddDays, dateAddSubOp);
  resultDpMonth = calculated.getMonth();
  resultDpYear = calculated.getFullYear();
  renderResultCalendar();

  activePicker = 'from';
  dpCurrentMonth = dateFrom.getMonth();
  dpCurrentYear = dateFrom.getFullYear();
  calendarView = 'days';
  renderCalendarGrid();
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

function renderNumberOptions(min, max, selectedVal) {
  let html = '';
  for (let i = min; i <= max; i++) {
    html += `<button class="date-number-item ${i === selectedVal ? 'is-selected' : ''}" data-action="select-date-number" data-value="${i}" type="button">${i}</button>`;
  }
  return html;
}

function renderResultCalendar() {
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const monthBtn = document.getElementById('resultDpMonthBtn');
  const yearBtn = document.getElementById('resultDpYearBtn');
  const daysGrid = document.getElementById('resultDpDaysGrid');
  if (!monthBtn || !yearBtn || !daysGrid) return;

  const calculated = addOrSubtractDate(dateFrom, dateAddYears, dateAddMonths, dateAddDays, dateAddSubOp);

  monthBtn.textContent = monthNames[resultDpMonth];
  yearBtn.textContent = resultDpYear;

  daysGrid.innerHTML = '';

  const firstDay = new Date(resultDpYear, resultDpMonth, 1).getDay();
  const numDays = new Date(resultDpYear, resultDpMonth + 1, 0).getDate();

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
    dayBtn.disabled = true;

    const isSelected = calculated.getDate() === day &&
      calculated.getMonth() === resultDpMonth &&
      calculated.getFullYear() === resultDpYear;
    if (isSelected) {
      dayBtn.classList.add('is-selected');
    }

    const today = new Date();
    const isToday = today.getDate() === day &&
      today.getMonth() === resultDpMonth &&
      today.getFullYear() === resultDpYear;
    if (isToday) {
      dayBtn.classList.add('is-today');
    }

    daysGrid.appendChild(dayBtn);
  }
}

function updateDateAddSubResult() {
  const resultEl = document.getElementById('dateResult');
  if (resultEl) {
    if (dateSubMode === 'add-sub') {
      const calculated = addOrSubtractDate(dateFrom, dateAddYears, dateAddMonths, dateAddDays, dateAddSubOp);
      resultEl.textContent = formatDateString(calculated);
      resultDpMonth = calculated.getMonth();
      resultDpYear = calculated.getFullYear();
      renderResultCalendar();
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

        if (currentMode === 'date' && dateSubMode === 'add-sub') {
          const dialog = document.getElementById('datePickerDialog');
          if (dialog) {
            dpCurrentMonth = selected.getMonth();
            dpCurrentYear = selected.getFullYear();
            renderCalendarGrid();
          }
          updateDateDifferenceDisplay();
        } else {
          document.getElementById('datePickerDialog').hidden = true;
          activePicker = null;
          updateDateDifferenceDisplay();
        }
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
      if (currentMode === 'date' && dateSubMode === 'add-sub') {
        renderCalendarGrid();
      } else {
        dialog.hidden = false;
        renderCalendarGrid();
      }
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

  if (action === 'toggle-date-number-dropdown') {
    document.querySelectorAll('.date-number-menu').forEach(menu => {
      if (menu.dataset.field !== button.dataset.field) {
        menu.hidden = true;
      }
    });
    const menu = document.querySelector(`.date-number-menu[data-field="${button.dataset.field}"]`);
    if (menu) {
      menu.hidden = !menu.hidden;
    }
    return;
  }

  if (action === 'select-date-number') {
    const value = parseInt(button.dataset.value, 10);
    const menu = button.closest('.date-number-menu');
    const field = menu.dataset.field;
    if (field === 'years') {
      dateAddYears = value;
      document.getElementById('dateAddYearsText').textContent = value;
    } else if (field === 'months') {
      dateAddMonths = value;
      document.getElementById('dateAddMonthsText').textContent = value;
    } else if (field === 'days') {
      dateAddDays = value;
      document.getElementById('dateAddDaysText').textContent = value;
    }
    menu.hidden = true;
    updateDateAddSubResult();
    return;
  }

  if (action === 'result-dp-prev') {
    resultDpMonth--;
    if (resultDpMonth < 0) {
      resultDpMonth = 11;
      resultDpYear--;
    }
    renderResultCalendar();
    return;
  }

  if (action === 'result-dp-next') {
    resultDpMonth++;
    if (resultDpMonth > 11) {
      resultDpMonth = 0;
      resultDpYear++;
    }
    renderResultCalendar();
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
      toggleScientificPanel('memory');
      return;
    }

    if (action === 'recall-sci-memory') {
      const idx = parseInt(button.getAttribute('data-index'));
      if (!isNaN(idx) && memoryList[idx] !== undefined) {
        insertValue(String(memoryList[idx]));
      }
      return;
    }

    if (action === 'clear-sci-memory') {
      memoryList = [];
      memoryValue = 0;
      toggleScientificPanel('memory');
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
      if (currentMode === 'phone') {
        resultEl.textContent = payload.error || 'Error';
      } else {
        updateDisplay(payload.error || 'Calculation failed.');
      }
      return;
    }

    let resultValue = payload.result;
    if (currentMode === 'phone') {
      expressionEl.textContent = expression;
      resultEl.textContent = resultValue;
      expression = resultValue;
      return;
    }

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
    if (currentMode === 'phone') {
      resultEl.textContent = 'Error';
    } else {
      updateDisplay('Backend unavailable.');
    }
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
    if (dialog && !dialog.hidden && !(dateSubMode === 'add-sub')) {
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

    document.querySelectorAll('.date-number-menu:not([hidden])').forEach(numberMenu => {
      const isTrigger = event.target.closest(`.date-number-trigger[data-field="${numberMenu.dataset.field}"]`);
      const isMenu = event.target.closest(`.date-number-menu[data-field="${numberMenu.dataset.field}"]`);
      if (!isTrigger && !isMenu) {
        numberMenu.hidden = true;
      }
    });
  }
});

window.addEventListener('keydown', (event) => {
  const { key } = event;

  if (currentMode !== 'phone') {
    let button = null;
    const modeSel = '.calculator-card';
    if (/[0-9]/.test(key)) {
      button = document.querySelector(`${modeSel} .key[data-insert="${key}"]`);
    } else if (['+', '-', '*', '/', '.', '(', ')', '^', '%'].includes(key)) {
      button = document.querySelector(`${modeSel} .key[data-insert="${key}"], ${modeSel} .key-sci[data-insert="${key}"]`);
    } else if (key === 'Enter' || key === '=') {
      button = document.querySelector(`${modeSel} .key[data-action="equals"]`);
    } else if (key === 'Backspace') {
      button = document.querySelector(`${modeSel} .key[data-action="backspace"]`);
    } else if (key === 'Escape') {
      button = document.querySelector(`${modeSel} .key[data-action="clear"]`);
    }

    if (button) {
      let disableHaptics = false;
      try {
        const s = localStorage.getItem('phoneSettings');
        if (s) disableHaptics = JSON.parse(s).disableHaptics;
      } catch (e) {}
      
      if (!disableHaptics && navigator.vibrate) {
        navigator.vibrate(12);
      }
      
      button.classList.add('active-click');
      setTimeout(() => button.classList.remove('active-click'), 100);
    }
  }

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

// ==========================================
// Graphing Mode Logic
// ==========================================
let graphCanvas = null;
let graphCtx = null;
let graphInitialized = false;

let graphOffsetX = 0;
let graphOffsetY = 0;
let graphScale = 50; // pixels per unit
let isDraggingGraph = false;
let dragStartX = 0;
let dragStartY = 0;
let isTracing = false;
let currentMouseX = 0;
let currentMouseY = 0;
let isMouseInCanvas = false;
let currentAngleUnit = 'radians';
let graphLineWidth = 2;

function initGraphCanvas() {
  if (graphInitialized) {
    resizeGraphCanvas();
    return;
  }

  graphCanvas = document.getElementById('graphCanvas');
  if (!graphCanvas) return;

  graphCtx = graphCanvas.getContext('2d');

  // Setup interactions
  graphCanvas.addEventListener('mousedown', onGraphMouseDown);
  window.addEventListener('mousemove', onGraphMouseMove);
  window.addEventListener('mouseup', onGraphMouseUp);
  graphCanvas.addEventListener('wheel', onGraphWheel, { passive: false });

  // Resize observer to handle dynamic sizing
  const resizeObserver = new ResizeObserver(() => {
    if (currentMode === 'graphing') {
      resizeGraphCanvas();
    }
  });
  resizeObserver.observe(graphCanvas.parentElement);

  // Buttons
  document.getElementById('zoomInBtn')?.addEventListener('click', () => zoomGraph(1.5, graphCanvas.width / 2, graphCanvas.height / 2));
  document.getElementById('zoomOutBtn')?.addEventListener('click', () => zoomGraph(1 / 1.5, graphCanvas.width / 2, graphCanvas.height / 2));
  document.getElementById('recenterBtn')?.addEventListener('click', recenterGraph);

  document.getElementById('traceBtn')?.addEventListener('click', () => {
    isTracing = !isTracing;
    const traceBtn = document.getElementById('traceBtn');
    if (traceBtn) traceBtn.classList.toggle('is-active', isTracing);

    if (isTracing) {
      graphCanvas.style.cursor = 'none';
    } else {
      graphCanvas.style.cursor = 'grab';
    }
    drawGraph();
  });

  graphCanvas.addEventListener('mouseenter', () => {
    isMouseInCanvas = true;
  });
  graphCanvas.addEventListener('mouseleave', () => {
    isMouseInCanvas = false;
    drawGraph();
  });

  graphInitialized = true;
  recenterGraph(); // Also handles initial resize & draw
}

function resizeGraphCanvas() {
  if (!graphCanvas) return;
  const rect = graphCanvas.parentElement.getBoundingClientRect();
  graphCanvas.width = rect.width;
  graphCanvas.height = rect.height;
  drawGraph();
}

function onGraphMouseDown(e) {
  isDraggingGraph = true;
  dragStartX = e.clientX;
  dragStartY = e.clientY;
  if (!isTracing) graphCanvas.style.cursor = 'grabbing';
}

function onGraphMouseMove(e) {
  if (e.target === graphCanvas) {
    isMouseInCanvas = true;
    const rect = graphCanvas.getBoundingClientRect();
    currentMouseX = e.clientX - rect.left;
    currentMouseY = e.clientY - rect.top;
  } else {
    isMouseInCanvas = false;
  }

  if (isDraggingGraph) {
    const dx = e.clientX - dragStartX;
    const dy = e.clientY - dragStartY;
    graphOffsetX += dx;
    graphOffsetY += dy;
    dragStartX = e.clientX;
    dragStartY = e.clientY;
  }

  if (isDraggingGraph || isTracing) {
    drawGraph();
  }
}

function onGraphMouseUp(e) {
  if (isDraggingGraph) {
    isDraggingGraph = false;
    if (!isTracing) graphCanvas.style.cursor = 'grab';
  }
}

function onGraphWheel(e) {
  e.preventDefault();
  const rect = graphCanvas.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;

  const zoomFactor = e.deltaY < 0 ? 1.1 : 1 / 1.1;
  zoomGraph(zoomFactor, mouseX, mouseY);
}

function zoomGraph(factor, centerX, centerY) {
  const prevScale = graphScale;
  graphScale *= factor;

  // Constrain zoom
  if (graphScale < 0.05) graphScale = 0.05;
  if (graphScale > 5000) graphScale = 5000;

  const actualFactor = graphScale / prevScale;

  // Adjust offset so we zoom towards the center point
  graphOffsetX = centerX - (centerX - graphOffsetX) * actualFactor;
  graphOffsetY = centerY - (centerY - graphOffsetY) * actualFactor;

  drawGraph();
}

function recenterGraph() {
  if (!graphCanvas) return;
  graphOffsetX = graphCanvas.width / 2;
  graphOffsetY = graphCanvas.height / 2;
  graphScale = 50;
  drawGraph();
}

function drawGraph() {
  if (!graphCtx || !graphCanvas) return;

  const width = graphCanvas.width;
  const height = graphCanvas.height;

  // Clear canvas
  graphCtx.clearRect(0, 0, width, height);

  // Get computed styles for theming
  const isDarkMode = root.getAttribute('data-theme') === 'dark';
  const gridColor = isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)';
  const majorGridColor = isDarkMode ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.12)';
  const axisColor = isDarkMode ? 'rgba(255, 255, 255, 0.8)' : 'rgba(15, 23, 42, 0.8)';
  const textColor = isDarkMode ? 'rgba(255, 255, 255, 0.9)' : 'rgba(15, 23, 42, 0.9)';

  graphCtx.lineWidth = 1;

  // Calculate view bounds in math coordinates
  const minX = -graphOffsetX / graphScale;
  const maxX = (width - graphOffsetX) / graphScale;
  const minY = -(height - graphOffsetY) / graphScale;
  const maxY = graphOffsetY / graphScale;

  // Dynamic grid step based on scale
  let step = 1;
  let majorStep = 5;

  // Calculate ideal unit spacing (about 50 pixels)
  const idealSpacing = 50 / graphScale;
  const magnitude = Math.pow(10, Math.floor(Math.log10(idealSpacing)));
  const normalized = idealSpacing / magnitude;

  if (normalized < 1.5) {
    step = magnitude * 1;
  } else if (normalized < 3.5) {
    step = magnitude * 2;
  } else if (normalized < 7.5) {
    step = magnitude * 5;
  } else {
    step = magnitude * 10;
  }

  majorStep = step * 5;

  // Draw Grid
  graphCtx.beginPath();
  for (let x = Math.floor(minX / step) * step; x <= maxX; x += step) {
    const canvasX = graphOffsetX + x * graphScale;
    graphCtx.moveTo(canvasX, 0);
    graphCtx.lineTo(canvasX, height);
  }
  for (let y = Math.floor(minY / step) * step; y <= maxY; y += step) {
    const canvasY = graphOffsetY - y * graphScale;
    graphCtx.moveTo(0, canvasY);
    graphCtx.lineTo(width, canvasY);
  }
  graphCtx.strokeStyle = gridColor;
  graphCtx.stroke();

  // Draw Coordinate Numbers
  graphCtx.fillStyle = textColor;
  graphCtx.font = "italic 13px 'Inter', sans-serif";

  graphCtx.textAlign = 'center';
  graphCtx.textBaseline = 'top';
  for (let x = Math.floor(minX / majorStep) * majorStep; x <= maxX; x += majorStep) {
    if (x === 0) continue;
    const canvasX = graphOffsetX + x * graphScale;
    // Keep labels slightly below the X axis
    graphCtx.fillText(x.toString(), canvasX, graphOffsetY + 8);
  }

  graphCtx.textAlign = 'right';
  graphCtx.textBaseline = 'middle';
  for (let y = Math.floor(minY / majorStep) * majorStep; y <= maxY; y += majorStep) {
    if (y === 0) continue;
    const canvasY = graphOffsetY - y * graphScale;
    // Keep labels slightly to the left of the Y axis
    graphCtx.fillText(y.toString(), graphOffsetX - 8, canvasY);
  }

  // Draw Axes
  graphCtx.beginPath();
  // X Axis
  graphCtx.moveTo(0, graphOffsetY);
  graphCtx.lineTo(width, graphOffsetY);
  // Y Axis
  graphCtx.moveTo(graphOffsetX, 0);
  graphCtx.lineTo(graphOffsetX, height);

  graphCtx.strokeStyle = axisColor;
  graphCtx.lineWidth = graphLineWidth;
  graphCtx.stroke();

  // Draw Axis Arrows
  graphCtx.beginPath();
  // Y Axis arrow (top)
  graphCtx.moveTo(graphOffsetX - 4, 10);
  graphCtx.lineTo(graphOffsetX, 0);
  graphCtx.lineTo(graphOffsetX + 4, 10);
  // X Axis arrow (right)
  graphCtx.moveTo(width - 10, graphOffsetY - 4);
  graphCtx.lineTo(width, graphOffsetY);
  graphCtx.lineTo(width - 10, graphOffsetY + 4);
  graphCtx.strokeStyle = axisColor;
  graphCtx.stroke();

  // Labels
  graphCtx.fillStyle = textColor;
  graphCtx.font = "italic 14px 'Inter', sans-serif";

  // Origin '0'
  graphCtx.fillText("0", graphOffsetX - 12, graphOffsetY + 16);
  // 'x' label
  graphCtx.fillText("x", width - 15, graphOffsetY + 20);
  // 'y' label
  graphCtx.fillText("y", graphOffsetX - 15, 15);

  // Plot active expressions
  if (typeof activeExpressions !== 'undefined') {
    activeExpressions.forEach((item, index) => {
      plotExpression(item.text, item.color);
    });
  }

  if (isTracing && isMouseInCanvas && activeExpressions.length > 0) {
    const mathX = (currentMouseX - graphOffsetX) / graphScale;
    const mathY = -(currentMouseY - graphOffsetY) / graphScale;

    let closestExpr = null;
    let closestYVal = null;
    let closestDist = Infinity;
    let closestColor = null;

    activeExpressions.forEach((item, index) => {
      let cleanExpr = item.text.replace(/^\s*y\s*=\s*/i, '');
      if (!cleanExpr.trim()) return;
      const jsExpr = mathToJS(cleanExpr);
      try {
        const fn = new Function('x',
          'var PI=Math.PI,E=Math.E,sin=Math.sin,cos=Math.cos,tan=Math.tan,' +
          'abs=Math.abs,sqrt=Math.sqrt,log=Math.log10,ln=Math.log,' +
          'pow=Math.pow,exp=Math.exp,ceil=Math.ceil,floor=Math.floor,round=Math.round;' +
          'return ' + jsExpr + ';'
        );
        const yVal = fn(mathX);
        if (!isNaN(yVal) && isFinite(yVal)) {
          const dist = Math.abs(yVal - mathY);
          if (dist < closestDist) {
            closestDist = dist;
            closestExpr = item.text;
            closestYVal = yVal;
            closestColor = item.color;
          }
        }
      } catch (e) { }
    });

    if (closestYVal !== null) {
      const snapCanvasX = currentMouseX;
      const snapCanvasY = graphOffsetY - closestYVal * graphScale;

      // 1. Draw snap dot
      graphCtx.beginPath();
      graphCtx.arc(snapCanvasX, snapCanvasY, 5, 0, 2 * Math.PI);
      graphCtx.fillStyle = closestColor;
      graphCtx.fill();
      graphCtx.strokeStyle = 'white';
      graphCtx.lineWidth = 1.5;
      graphCtx.stroke();

      // 2. Draw tooltip box to the left
      const text = `(${mathX.toFixed(1)}, ${closestYVal.toFixed(14)})`;
      graphCtx.font = "14px 'Inter', sans-serif";
      const textWidth = graphCtx.measureText(text).width;
      const rectWidth = textWidth + 24;
      const rectHeight = 36;
      const rectX = snapCanvasX - rectWidth - 12;
      const rectY = snapCanvasY - rectHeight / 2;

      // Draw rounded rectangle
      graphCtx.beginPath();
      const radius = 8;
      if (typeof graphCtx.roundRect === 'function') {
        graphCtx.roundRect(rectX, rectY, rectWidth, rectHeight, radius);
      } else {
        graphCtx.rect(rectX, rectY, rectWidth, rectHeight);
      }
      graphCtx.fillStyle = 'rgba(30, 30, 30, 0.9)';
      graphCtx.fill();
      graphCtx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      graphCtx.lineWidth = 1;
      graphCtx.stroke();

      // Draw text
      graphCtx.fillStyle = 'white';
      graphCtx.textAlign = 'center';
      graphCtx.textBaseline = 'middle';
      graphCtx.fillText(text, rectX + rectWidth / 2, rectY + rectHeight / 2);

      // 3. Draw trace cursor at snapped position
      drawTraceCursor(snapCanvasX, snapCanvasY);
    } else {
      drawTraceCursor(currentMouseX, currentMouseY);
    }
  } else if (isTracing && isMouseInCanvas) {
    drawTraceCursor(currentMouseX, currentMouseY);
  }

  // Update settings inputs if open
  if (typeof updateGraphSettingsInputs === 'function') {
    updateGraphSettingsInputs();
  }
}

function drawTraceCursor(x, y) {
  graphCtx.save();
  graphCtx.beginPath();
  graphCtx.moveTo(x, y);
  graphCtx.lineTo(x, y + 17);
  graphCtx.lineTo(x + 4, y + 13);
  graphCtx.lineTo(x + 7, y + 20);
  graphCtx.lineTo(x + 10, y + 19);
  graphCtx.lineTo(x + 7, y + 12);
  graphCtx.lineTo(x + 12, y + 12);
  graphCtx.closePath();

  graphCtx.fillStyle = 'white';
  graphCtx.fill();

  graphCtx.strokeStyle = 'black';
  graphCtx.lineWidth = 1.5;
  graphCtx.stroke();
  graphCtx.restore();
}

// Logo cross toggle — each mouseenter flips between ≠ (cross) and = (no cross)
// The state persists after cursor leaves, toggling again on next hover
const logoEl = document.querySelector('.logo');
if (logoEl) {
  logoEl.addEventListener('mouseenter', () => {
    logoEl.classList.toggle('logo-equals-only');
  });
}

// Graph Settings logic
let isSettingsPanelOpen = false;

function initGraphSettings() {
  const settingsBtn = document.getElementById('graphSettingsBtn');
  const settingsPanel = document.getElementById('graphSettingsPanel');
  if (!settingsBtn || !settingsPanel) return;

  settingsBtn.addEventListener('click', () => {
    isSettingsPanelOpen = !isSettingsPanelOpen;
    settingsPanel.style.display = isSettingsPanelOpen ? 'flex' : 'none';
    if (isSettingsPanelOpen) {
      updateGraphSettingsInputs();
    }
  });

  // Window Inputs
  const inputs = ['xMinInput', 'xMaxInput', 'yMinInput', 'yMaxInput'].map(id => document.getElementById(id));

  function applyWindowInputs() {
    if (!graphCanvas) return;
    const xMin = parseFloat(inputs[0].value);
    const xMax = parseFloat(inputs[1].value);
    const yMin = parseFloat(inputs[2].value);
    const yMax = parseFloat(inputs[3].value);

    if (isNaN(xMin) || isNaN(xMax) || isNaN(yMin) || isNaN(yMax)) return;
    if (xMin >= xMax || yMin >= yMax) return;

    // Isotropic scaling based on X range
    const width = graphCanvas.width;
    const height = graphCanvas.height;

    graphScale = width / (xMax - xMin);
    graphOffsetX = -xMin * graphScale;

    // Recenter Y based on provided min/max bounds
    const yCenter = (yMin + yMax) / 2;
    graphOffsetY = height / 2 + yCenter * graphScale;

    drawGraph();
  }

  inputs.forEach(input => {
    if (input) {
      input.addEventListener('change', applyWindowInputs);
      input.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') applyWindowInputs();
      });
    }
  });

  // Reset view
  document.getElementById('resetViewBtn')?.addEventListener('click', () => {
    recenterGraph();
    updateGraphSettingsInputs();
  });

  // Unit Toggles
  const unitGroup = document.getElementById('angleUnitGroup');
  if (unitGroup) {
    unitGroup.addEventListener('click', (e) => {
      if (e.target.classList.contains('toggle-btn')) {
        Array.from(unitGroup.children).forEach(c => c.classList.remove('is-active'));
        e.target.classList.add('is-active');
        currentAngleUnit = e.target.getAttribute('data-value');
      }
    });
  }

  // Line Thickness - Custom Dropdown
  const dropdown = document.getElementById('lineThicknessDropdown');
  if (dropdown) {
    const trigger = dropdown.querySelector('.custom-select-trigger');
    const options = dropdown.querySelectorAll('.custom-select-option');
    const triggerPreview = trigger.querySelector('.line-preview');

    trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      dropdown.classList.toggle('is-open');
    });

    options.forEach(option => {
      option.addEventListener('click', (e) => {
        e.stopPropagation();
        const val = parseInt(option.getAttribute('data-value'));
        graphLineWidth = val;

        // Update selected state
        options.forEach(o => o.classList.remove('is-selected'));
        option.classList.add('is-selected');

        // Update trigger preview
        triggerPreview.setAttribute('data-thickness', val.toString());

        // Close dropdown
        dropdown.classList.remove('is-open');

        drawGraph();
      });
    });

    // Close on outside click
    document.addEventListener('click', () => {
      dropdown.classList.remove('is-open');
    });
  }
}

function updateGraphSettingsInputs() {
  if (!isSettingsPanelOpen || !graphCanvas) return;
  const width = graphCanvas.width;
  const height = graphCanvas.height;

  const minX = -graphOffsetX / graphScale;
  const maxX = (width - graphOffsetX) / graphScale;
  const minY = -(height - graphOffsetY) / graphScale;
  const maxY = graphOffsetY / graphScale;

  const xMinEl = document.getElementById('xMinInput');
  const xMaxEl = document.getElementById('xMaxInput');
  const yMinEl = document.getElementById('yMinInput');
  const yMaxEl = document.getElementById('yMaxInput');

  // Only update if not currently focused to avoid messing with user typing
  if (xMinEl && document.activeElement !== xMinEl) xMinEl.value = minX.toFixed(4);
  if (xMaxEl && document.activeElement !== xMaxEl) xMaxEl.value = maxX.toFixed(4);
  if (yMinEl && document.activeElement !== yMinEl) yMinEl.value = minY.toFixed(4);
  if (yMaxEl && document.activeElement !== yMaxEl) yMaxEl.value = maxY.toFixed(4);
}

// ==========================================
// Graphing Calculator Function Plotting Logic
// ==========================================
let activeExpressions = [];

function getExpressionColor(index) {
  const colors = [
    '#3b82f6', '#06b6d4', '#a855f7', '#22c55e', '#10b981',
    '#ef4444', '#ec4899', '#f43f5e', '#f59e0b', '#f97316'
  ];
  return colors[index % colors.length];
}

initGraphSettings();
initGraphTabs();
initFxKeypad();

function mathToJS(expr) {
  let jsExpr = expr
    .replace(/π/g, 'Math.PI')
    .replace(/\be\b/g, 'Math.E')
    .replace(/sin\(/g, 'Math.sin(')
    .replace(/cos\(/g, 'Math.cos(')
    .replace(/tan\(/g, 'Math.tan(')
    .replace(/abs\(/g, 'Math.abs(')
    .replace(/sqrt\(/g, 'Math.sqrt(')
    .replace(/log\(/g, 'Math.log10(')
    .replace(/ln\(/g, 'Math.log(')
    .replace(/²/g, '**2')
    .replace(/³/g, '**3')
    .replace(/⁻¹/g, '**(-1)')
    .replace(/\(-\)/g, '-');

  jsExpr = jsExpr.replace(/\^/g, '**');

  jsExpr = jsExpr.replace(/(\d+)([a-zA-Z\(])/g, '$1*$2');
  jsExpr = jsExpr.replace(/(\))([a-zA-Z0-9\(])/g, '$1*$2');

  return jsExpr;
}

function plotExpression(expr, color) {
  let cleanExpr = expr.replace(/^\s*y\s*=\s*/i, '');
  if (!cleanExpr.trim()) return;

  let inequality = null;
  let inequalitySide = ''; // 'below' or 'above'

  if (cleanExpr.includes('<=')) {
    inequality = '<=';
    inequalitySide = 'below';
  } else if (cleanExpr.includes('>=')) {
    inequality = '>=';
    inequalitySide = 'above';
  } else if (cleanExpr.includes('<')) {
    inequality = '<';
    inequalitySide = 'below';
  } else if (cleanExpr.includes('>')) {
    inequality = '>';
    inequalitySide = 'above';
  }

  let formula = cleanExpr;
  if (inequality) {
    const parts = cleanExpr.split(inequality);
    if (parts[0].trim() === 'y') {
      formula = parts[1];
    } else {
      formula = parts[0];
      if (inequalitySide === 'above') inequalitySide = 'below';
      else inequalitySide = 'above';
    }
  }

  const jsExpr = mathToJS(formula);

  let fn;
  try {
    fn = new Function('x',
      'var PI=Math.PI,E=Math.E,sin=Math.sin,cos=Math.cos,tan=Math.tan,' +
      'asin=Math.asin,acos=Math.acos,atan=Math.atan,' +
      'sinh=Math.sinh,cosh=Math.cosh,tanh=Math.tanh,' +
      'asinh=Math.asinh,acosh=Math.acosh,atanh=Math.atanh,' +
      'abs=Math.abs,sqrt=Math.sqrt,log=Math.log10,ln=Math.log,' +
      'sec=function(a){return 1/Math.cos(a);},csc=function(a){return 1/Math.sin(a);},' +
      'cot=function(a){return 1/Math.tan(a);},asec=function(a){return Math.acos(1/a);},' +
      'acsc=function(a){return Math.asin(1/a);},acot=function(a){return Math.atan(1/a);},' +
      'pow=Math.pow,exp=Math.exp,ceil=Math.ceil,floor=Math.floor,round=Math.round;' +
      'return ' + jsExpr + ';'
    );
  } catch (e) {
    return;
  }

  const width = graphCanvas.width;
  const height = graphCanvas.height;

  // Collect points
  const points = [];
  for (let canvasX = 0; canvasX <= width; canvasX++) {
    const mathX = (canvasX - graphOffsetX) / graphScale;
    let mathY;
    try {
      mathY = fn(mathX);
    } catch (e) {
      points.push({ x: canvasX, y: null });
      continue;
    }

    if (isNaN(mathY) || !isFinite(mathY)) {
      points.push({ x: canvasX, y: null });
      continue;
    }

    const canvasY = graphOffsetY - mathY * graphScale;
    points.push({ x: canvasX, y: canvasY });
  }

  // Draw the boundary line
  graphCtx.beginPath();
  let first = true;
  points.forEach(pt => {
    if (pt.y === null || pt.y < -height || pt.y > height * 2) {
      first = true;
    } else {
      if (first) {
        graphCtx.moveTo(pt.x, pt.y);
        first = false;
      } else {
        graphCtx.lineTo(pt.x, pt.y);
      }
    }
  });

  graphCtx.strokeStyle = color;
  graphCtx.lineWidth = Math.max(1.5, graphLineWidth * 1.25);
  if (inequality === '<' || inequality === '>') {
    graphCtx.setLineDash([6, 6]);
  } else {
    graphCtx.setLineDash([]);
  }
  graphCtx.stroke();
  graphCtx.setLineDash([]); // Reset line dash

  // Draw shaded region if inequality
  if (inequalitySide) {
    graphCtx.beginPath();
    let firstFill = true;
    points.forEach(pt => {
      if (pt.y !== null) {
        if (firstFill) {
          graphCtx.moveTo(pt.x, pt.y);
          firstFill = false;
        } else {
          graphCtx.lineTo(pt.x, pt.y);
        }
      }
    });

    if (!firstFill) {
      if (inequalitySide === 'below') {
        graphCtx.lineTo(width, height);
        graphCtx.lineTo(0, height);
      } else {
        graphCtx.lineTo(width, 0);
        graphCtx.lineTo(0, 0);
      }
      graphCtx.closePath();
      graphCtx.fillStyle = color.startsWith('#') ? color + '18' : 'rgba(239, 68, 68, 0.09)';
      graphCtx.fill();
    }
  }
}

function initGraphTabs() {
  const graphViewBtn = document.getElementById('graphViewBtn');
  const fxViewBtn = document.getElementById('fxViewBtn');
  const fxPanel = document.getElementById('fxPanel');
  const graphCanvas = document.getElementById('graphCanvas');
  const floatingTr = document.querySelector('.graphing-floating-tr');
  const floatingBr = document.querySelector('.graphing-floating-br');
  const settingsPanel = document.getElementById('graphSettingsPanel');

  if (!graphViewBtn || !fxViewBtn) return;

  graphViewBtn.addEventListener('click', () => {
    graphViewBtn.classList.add('is-active');
    fxViewBtn.classList.remove('is-active');
    if (fxPanel) fxPanel.style.display = 'none';
    if (graphCanvas) graphCanvas.style.display = 'block';
    if (floatingTr) floatingTr.style.display = 'flex';
    if (floatingBr) floatingBr.style.display = 'flex';
    resizeGraphCanvas();
    drawGraph();
  });

  fxViewBtn.addEventListener('click', () => {
    fxViewBtn.classList.add('is-active');
    graphViewBtn.classList.remove('is-active');
    if (fxPanel) fxPanel.style.display = 'flex';
    if (graphCanvas) graphCanvas.style.display = 'none';
    if (floatingTr) floatingTr.style.display = 'none';
    if (floatingBr) floatingBr.style.display = 'none';
    if (settingsPanel) settingsPanel.style.display = 'none';
  });
}

function initFxKeypad() {
  const keypad = document.getElementById('fxKeypad');
  const input = document.getElementById('fxExpressionInput');
  const list = document.getElementById('fxExpressionList');
  if (!keypad || !input) return;

  function insertAtCaret(text) {
    const start = input.selectionStart;
    const end = input.selectionEnd;
    const oldVal = input.value;
    input.value = oldVal.substring(0, start) + text + oldVal.substring(end);
    input.selectionStart = input.selectionEnd = start + text.length;
    input.focus();
  }

  const trigBtn = document.getElementById('fxTrigBtn');
  const ineqBtn = document.getElementById('fxIneqBtn');
  const funcBtn = document.getElementById('fxFuncBtn');

  const catDropdown = document.getElementById('fxCatDropdown');
  const gridTrig = document.getElementById('fxGridTrig');
  const gridIneq = document.getElementById('fxGridIneq');
  const gridFunc = document.getElementById('fxGridFunc');

  let is2ndActive = false;
  let isHypActive = false;

  function toggleCatDropdown(activeBtn, targetGrid) {
    const isCurrentlyActive = activeBtn.classList.contains('is-active');

    // Deactivate all buttons and hide all grids
    [trigBtn, ineqBtn, funcBtn].forEach(btn => btn?.classList.remove('is-active'));
    [gridTrig, gridIneq, gridFunc].forEach(grid => {
      if (grid) grid.style.display = 'none';
    });

    if (isCurrentlyActive) {
      if (catDropdown) catDropdown.style.display = 'none';
    } else {
      activeBtn.classList.add('is-active');
      if (catDropdown) catDropdown.style.display = 'block';
      if (targetGrid) targetGrid.style.display = 'grid';
    }
  }

  trigBtn?.addEventListener('click', () => toggleCatDropdown(trigBtn, gridTrig));
  ineqBtn?.addEventListener('click', () => toggleCatDropdown(ineqBtn, gridIneq));
  funcBtn?.addEventListener('click', () => toggleCatDropdown(funcBtn, gridFunc));

  function updateTrigLabels() {
    const sinBtn = document.querySelector('#fxGridTrig [data-insert*="sin"]');
    const cosBtn = document.querySelector('#fxGridTrig [data-insert*="cos"]');
    const tanBtn = document.querySelector('#fxGridTrig [data-insert*="tan"]');
    const secBtn = document.querySelector('#fxGridTrig [data-insert*="sec"]');
    const cscBtn = document.querySelector('#fxGridTrig [data-insert*="csc"]');
    const cotBtn = document.querySelector('#fxGridTrig [data-insert*="cot"]');

    if (!sinBtn || !cosBtn || !tanBtn) return;

    let prefix = "";
    let suffix = "";
    if (is2ndActive && isHypActive) {
      prefix = "a";
      suffix = "h";
    } else if (is2ndActive) {
      prefix = "a";
    } else if (isHypActive) {
      suffix = "h";
    }

    sinBtn.textContent = `${prefix}sin${suffix}`;
    sinBtn.setAttribute('data-insert', `${prefix}sin${suffix}(`);
    cosBtn.textContent = `${prefix}cos${suffix}`;
    cosBtn.setAttribute('data-insert', `${prefix}cos${suffix}(`);
    tanBtn.textContent = `${prefix}tan${suffix}`;
    tanBtn.setAttribute('data-insert', `${prefix}tan${suffix}(`);

    if (is2ndActive) {
      secBtn.textContent = `asec`;
      secBtn.setAttribute('data-insert', `asec(`);
      cscBtn.textContent = `acsc`;
      cscBtn.setAttribute('data-insert', `acsc(`);
      cotBtn.textContent = `acot`;
      cotBtn.setAttribute('data-insert', `acot(`);
    } else {
      secBtn.textContent = `sec`;
      secBtn.setAttribute('data-insert', `sec(`);
      cscBtn.textContent = `csc`;
      cscBtn.setAttribute('data-insert', `csc(`);
      cotBtn.textContent = `cot`;
      cotBtn.setAttribute('data-insert', `cot(`);
    }
  }

  catDropdown?.addEventListener('click', (e) => {
    const key = e.target.closest('.fx-key');
    if (!key) return;

    const insertText = key.getAttribute('data-insert');
    const action = key.getAttribute('data-action');

    if (insertText) {
      insertAtCaret(insertText);
    } else if (action === 'trig-2nd') {
      is2ndActive = !is2ndActive;
      key.classList.toggle('is-active', is2ndActive);
      updateTrigLabels();
    } else if (action === 'trig-hyp') {
      isHypActive = !isHypActive;
      key.classList.toggle('is-active', isHypActive);
      updateTrigLabels();
    }
  });

  keypad.addEventListener('click', (e) => {
    const key = e.target.closest('.fx-key');
    if (!key) return;

    const insertText = key.getAttribute('data-insert');
    const action = key.getAttribute('data-action');

    if (insertText) {
      insertAtCaret(insertText);
    } else if (action === 'clear') {
      input.value = '';
      input.focus();
    } else if (action === 'backspace') {
      const start = input.selectionStart;
      const end = input.selectionEnd;
      const oldVal = input.value;
      if (start === end) {
        if (start > 0) {
          input.value = oldVal.substring(0, start - 1) + oldVal.substring(end);
          input.selectionStart = input.selectionEnd = start - 1;
        }
      } else {
        input.value = oldVal.substring(0, start) + oldVal.substring(end);
        input.selectionStart = input.selectionEnd = start;
      }
      input.focus();
    } else if (action === '2nd') {
      key.classList.toggle('is-active');
    } else if (action === 'enter') {
      submitFxExpression();
    }
  });

  input.addEventListener('keyup', (e) => {
    if (e.key === 'Enter') {
      submitFxExpression();
    }
  });

  function submitFxExpression() {
    const val = input.value.trim();
    if (!val) return;

    const color = getExpressionColor(activeExpressions.length);
    activeExpressions.push({ text: val, color: color });
    renderFxExpressions();
    input.value = '';
    drawGraph();
  }

  function renderFxExpressions() {
    if (!list) return;
    list.innerHTML = '';

    activeExpressions.forEach((item, index) => {
      const expr = item.text;
      const color = item.color;

      const row = document.createElement('div');
      row.className = 'fx-expression-item';
      row.innerHTML = `
        <span class="fx-expr-color-dot" style="background-color: ${color};"></span>
        <span class="fx-expr-text">${expr}</span>
        <div class="fx-expr-actions">
          <button type="button" class="fx-expr-color-btn" aria-label="Line color options">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12c0 2.21 1.79 4 4 4h.5c.55 0 1 .45 1 1v.5c0 2.21 1.79 4 4 4z"/><circle cx="7.5" cy="10.5" r="1.5"/><circle cx="11.5" cy="7.5" r="1.5"/><circle cx="16.5" cy="9.5" r="1.5"/></svg>
          </button>
          <button type="button" class="fx-expr-delete-btn" aria-label="Delete expression">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>
        
        <!-- Color Popover -->
        <div class="fx-line-options-popover" style="display: none;">
          <h4 class="popover-title">Line options</h4>
          <span class="popover-label">Color</span>
          <div class="popover-colors-grid">
            ${[
          '#3b82f6', '#06b6d4', '#a855f7', '#22c55e', '#10b981',
          '#ef4444', '#ec4899', '#f43f5e', '#f59e0b', '#f97316'
        ].map(c => `
              <button type="button" class="color-swatch-btn ${c.toLowerCase() === color.toLowerCase() ? 'is-selected' : ''}" 
                data-color="${c}" style="background-color: ${c};"></button>
            `).join('')}
          </div>
        </div>
      `;

      // Color Options Button Toggle
      const colorBtn = row.querySelector('.fx-expr-color-btn');
      const popover = row.querySelector('.fx-line-options-popover');

      colorBtn.addEventListener('click', (e) => {
        e.stopPropagation();

        // Close all other open popovers first
        document.querySelectorAll('.fx-line-options-popover').forEach(pop => {
          if (pop !== popover) pop.style.display = 'none';
        });

        const isOpen = popover.style.display === 'flex';
        popover.style.display = isOpen ? 'none' : 'flex';
      });

      // Handle Color Swatch Click
      const swatches = popover.querySelectorAll('.color-swatch-btn');
      swatches.forEach(swatch => {
        swatch.addEventListener('click', (e) => {
          e.stopPropagation();
          const selectedColor = swatch.getAttribute('data-color');

          // Update model state
          item.color = selectedColor;

          // Update swatch selections in UI
          swatches.forEach(s => s.classList.remove('is-selected'));
          swatch.classList.add('is-selected');

          // Update left color dot in UI
          row.querySelector('.fx-expr-color-dot').style.backgroundColor = selectedColor;

          // Close popover
          popover.style.display = 'none';

          // Redraw graph canvas
          drawGraph();
        });
      });

      // Close popover on document click
      document.addEventListener('click', () => {
        popover.style.display = 'none';
      });

      // Prevent popover clicks from bubble/close
      popover.addEventListener('click', (e) => {
        e.stopPropagation();
      });

      // Delete Button Event
      row.querySelector('.fx-expr-delete-btn').addEventListener('click', () => {
        activeExpressions.splice(index, 1);
        renderFxExpressions();
        drawGraph();
      });

      list.appendChild(row);
    });
  }
}

/* ==============================================================
   PHONE MODE — NxCalculator Logic
   Only active when currentMode === 'phone'.
   ============================================================== */
(function initPhoneMode() {
  // ---- State ----
  let phoneHistory = JSON.parse(localStorage.getItem('phoneHistory') || '[]');
  let phoneInverted = false;
  let phoneAngleMode = 'RAD'; // RAD or DEG

  // ---- Defaults for settings ----
  const PHONE_DEFAULTS = {
    theme: 'dark',
    shape: 'mixed',
    density: 'normal',
    numpadFont: 'NType',
    displayFont: 'NType',
    swapDecimalZero: false,
    bottomToolbar: false,
    hideCalcText: false,
    preferIconsToText: false,
    preventDuplicate: false,
    startExtended: false,
    disableHaptics: false,
  };

  function phoneGetSettings() {
    try {
      return { ...PHONE_DEFAULTS, ...JSON.parse(localStorage.getItem('phoneSettings') || '{}') };
    } catch { return { ...PHONE_DEFAULTS }; }
  }

  function phoneSaveSettings(s) {
    localStorage.setItem('phoneSettings', JSON.stringify(s));
  }

  // ---- Apply visual settings to the card ----
  function phoneApplySettingsInner() {
    const s = phoneGetSettings();
    const card = document.querySelector('.calculator-card');
    if (!card) return;

    // Theme
    card.classList.toggle('phone-light', s.theme === 'light');

    // Shape
    card.classList.remove('shape-circular', 'shape-rounded', 'shape-mixed');
    card.classList.add('shape-' + s.shape);

    // Density
    card.classList.remove('density-comfy', 'density-normal', 'density-dense');
    card.classList.add('density-' + s.density);

    // Fonts
    ['NothingDotted', 'Nothing', 'NothingPremium', 'Inter', 'NDot', 'NType', 'SpaceMono', 'LetteraMono', 'Playfair'].forEach(f => card.classList.remove('font-numpad-' + f));
    card.classList.add('font-numpad-' + s.numpadFont);
    ['NothingDotted', 'Nothing', 'NothingPremium', 'Inter', 'NDot', 'NType', 'SpaceMono', 'LetteraMono', 'Playfair'].forEach(f => card.classList.remove('font-display-' + f));
    card.classList.add('font-display-' + s.displayFont);

    // Hide "Calculator" text
    const phoneTitle = document.getElementById('phoneTitle');
    if (phoneTitle) phoneTitle.style.display = s.hideCalcText ? 'none' : '';

    // Swap decimal and zero
    const keys = document.querySelectorAll('#keypad .key');
    let dotBtn = null, zeroBtn = null;
    keys.forEach(k => {
      if (k.dataset.insert === '.') dotBtn = k;
      if (k.dataset.insert === '0') zeroBtn = k;
    });
    if (dotBtn && zeroBtn) {
      if (s.swapDecimalZero) {
        if (dotBtn.compareDocumentPosition(zeroBtn) & Node.DOCUMENT_POSITION_FOLLOWING) {
          dotBtn.parentNode.insertBefore(zeroBtn, dotBtn);
        }
      } else {
        if (zeroBtn.compareDocumentPosition(dotBtn) & Node.DOCUMENT_POSITION_FOLLOWING) {
          zeroBtn.parentNode.insertBefore(dotBtn, zeroBtn);
        }
      }
    }

    // Prefer icon for clear button
    const clearBtn = document.querySelector('#keypad .key[data-action="clear"]');
    if (clearBtn) {
      clearBtn.innerHTML = s.preferIconsToText
        ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>'
        : 'AC';
    }

    // Scientific keypad visibility — driven purely by startExtended setting
    const sciKeypad = document.getElementById('phoneScientificKeypad');
    const funcBtn = document.getElementById('phoneFunctionsBtn');
    if (sciKeypad) {
      if (s.startExtended) {
        sciKeypad.classList.add('is-visible');
        card?.classList.add('phone-sci-open');
        sciKeypad.dataset.open = '1';
        funcBtn?.classList.add('is-active');
      } else {
        sciKeypad.classList.remove('is-visible');
        card?.classList.remove('phone-sci-open');
        sciKeypad.dataset.open = '0';
        funcBtn?.classList.remove('is-active');
      }
    }

    // Sync settings UI inputs if visible
    syncSettingsUI(s);
  }

  // Expose globally so setKeypadMode can call it
  window.phoneApplySettings = phoneApplySettingsInner;

  function syncSettingsUI(s) {
    const el = (id) => document.getElementById(id);
    if (el('settingPhoneTheme')) el('settingPhoneTheme').value = s.theme;
    if (el('settingPhoneShape')) el('settingPhoneShape').value = s.shape;
    if (el('settingPhoneDensity')) el('settingPhoneDensity').value = s.density;
    if (el('settingPhoneNumpadFont')) el('settingPhoneNumpadFont').value = s.numpadFont;
    if (el('settingPhoneDisplayFont')) el('settingPhoneDisplayFont').value = s.displayFont;
    if (el('settingPhoneSwapDecimalZero')) el('settingPhoneSwapDecimalZero').checked = s.swapDecimalZero;
    if (el('settingPhoneBottomToolbar')) el('settingPhoneBottomToolbar').checked = s.bottomToolbar;
    if (el('settingPhoneHideCalcText')) el('settingPhoneHideCalcText').checked = s.hideCalcText;
    if (el('settingPhonePreferIconsToText')) el('settingPhonePreferIconsToText').checked = s.preferIconsToText;
    if (el('settingPhonePreventDuplicate')) el('settingPhonePreventDuplicate').checked = s.preventDuplicate;
    if (el('settingPhoneStartExtended')) el('settingPhoneStartExtended').checked = s.startExtended;
    if (el('settingPhoneDisableHaptics')) el('settingPhoneDisableHaptics').checked = s.disableHaptics;
  }

  // ---- Haptic feedback ----
  function phoneHaptic() {
    const s = phoneGetSettings();
    if (s.disableHaptics) return;
    if (navigator.vibrate) navigator.vibrate(12);
  }

  // ---- History ----
  function phoneRenderHistory() {
    const list = document.getElementById('phoneHistoryList');
    if (!list) return;
    if (phoneHistory.length === 0) {
      list.innerHTML = '<div class="phone-history-empty">No history yet</div>';
      return;
    }
    list.innerHTML = phoneHistory.slice().reverse().map((item, i) => {
      const idx = phoneHistory.length - 1 - i;
      return `<div class="phone-history-item" data-idx="${idx}">
        <button class="phone-history-delete-btn" data-idx="${idx}" title="Delete entry" type="button">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          </svg>
        </button>
        <div class="phone-history-expr">${item.expr}</div>
        <div class="phone-history-res">${item.result}</div>
      </div>`;
    }).join('');

    list.querySelectorAll('.phone-history-item').forEach(el => {
      el.addEventListener('click', (e) => {
        if (e.target.closest('.phone-history-delete-btn')) return;
        const idx = parseInt(el.dataset.idx);
        if (phoneHistory[idx]) {
          expression = phoneHistory[idx].result;
          updateDisplay();
          document.getElementById('phoneHistoryOverlay')?.classList.remove('is-open');
        }
      });
    });

    list.querySelectorAll('.phone-history-delete-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        phoneHaptic();
        const idx = parseInt(btn.dataset.idx);
        phoneHistory.splice(idx, 1);
        localStorage.setItem('phoneHistory', JSON.stringify(phoneHistory));
        phoneRenderHistory();
      });
    });
  }

  function phoneSaveHistory(expr, result) {
    const s = phoneGetSettings();
    if (s.preventDuplicate && phoneHistory.length > 0) {
      const last = phoneHistory[phoneHistory.length - 1];
      if (last.expr === expr && last.result === result) return;
    }
    phoneHistory.push({ expr, result });
    if (phoneHistory.length > 100) phoneHistory.shift();
    localStorage.setItem('phoneHistory', JSON.stringify(phoneHistory));
  }

  // ---- Overlay helpers ----
  function phoneOpenOverlay(id) {
    document.getElementById(id)?.classList.add('is-open');
  }
  function phoneCloseOverlay(id) {
    document.getElementById(id)?.classList.remove('is-open');
  }

  // ---- Header button events ----
  document.getElementById('phoneFunctionsBtn')?.addEventListener('click', () => {
    if (currentMode !== 'phone') return;
    phoneHaptic();
    // Toggle the startExtended setting — this keeps the fx button and settings toggle in sync
    const s = phoneGetSettings();
    s.startExtended = !s.startExtended;
    phoneSaveSettings(s);
    syncSettingsUI(s);       // keep the checkbox in the settings panel in sync
    phoneApplySettingsInner(); // apply show/hide immediately
  });

  document.getElementById('phoneHistoryBtn')?.addEventListener('click', () => {
    if (currentMode !== 'phone') return;
    phoneHaptic();
    phoneRenderHistory();
    phoneOpenOverlay('phoneHistoryOverlay');
  });

  document.getElementById('phoneHistoryBackBtn')?.addEventListener('click', () => {
    phoneCloseOverlay('phoneHistoryOverlay');
  });

  document.getElementById('phoneHistoryClearBtn')?.addEventListener('click', () => {
    phoneHistory = [];
    localStorage.removeItem('phoneHistory');
    phoneRenderHistory();
  });

  document.getElementById('phoneMenuBtn')?.addEventListener('click', () => {
    if (currentMode !== 'phone') return;
    phoneHaptic();
    syncSettingsUI(phoneGetSettings());
    phoneOpenOverlay('phoneSettingsOverlay');
  });

  document.getElementById('phoneSettingsBackBtn')?.addEventListener('click', () => {
    phoneCloseOverlay('phoneSettingsOverlay');
  });

  document.getElementById('phoneSettingsResetBtn')?.addEventListener('click', () => {
    phoneSaveSettings({ ...PHONE_DEFAULTS });
    phoneApplySettingsInner();
    syncSettingsUI(PHONE_DEFAULTS);
  });

  // ---- About / Privacy / Licenses ----
  document.getElementById('phoneBtnPrivacy')?.addEventListener('click', () => {
    const content = document.getElementById('phoneAboutContent');
    const title = document.getElementById('phoneAboutTitle');
    if (content && title) {
      title.textContent = 'Privacy Policy';
      content.innerHTML = `
        <p style="margin-bottom: 0.6rem; font-style: italic; color: #666; font-size: 0.78rem;">Effective Date: 11 July 2026</p>
        <div class="phone-license-section">
          <span class="phone-license-header">1. Data Collection</span>
          <p style="margin: 0;">No personal information or user data is collected. No data leaves the device.</p>
        </div>
        <hr class="phone-license-divider">
        <div class="phone-license-section">
          <span class="phone-license-header">2. Local Storage</span>
          <p style="margin: 0;">Calculation history and settings are stored locally in browser storage only. No internet access is required for calculator operations.</p>
        </div>
        <hr class="phone-license-divider">
        <div class="phone-license-section">
          <span class="phone-license-header">3. Data Deletion</span>
          <p style="margin: 0;">All stored data can be removed by clearing browser data or resetting settings within the app.</p>
        </div>
        <hr class="phone-license-divider">
        <div class="phone-license-section">
          <span class="phone-license-header">4. Third-Party Services</span>
          <p style="margin: 0;">No third-party analytics, advertising, or data-sharing services are integrated.</p>
        </div>
        <hr class="phone-license-divider">
        <div class="phone-license-section">
          <span class="phone-license-header">5. Contact</span>
          <p style="margin: 0;">For inquiries: <a href="mailto:noorsayyed.atwork@gmail.com" style="color: #e30000; text-decoration: none; font-weight: 600;">noorsayyed.atwork@gmail.com</a></p>
        </div>
      `;
    }
    phoneOpenOverlay('phoneAboutOverlay');
  });

  document.getElementById('phoneBtnLicenses')?.addEventListener('click', () => {
    const content = document.getElementById('phoneAboutContent');
    const title = document.getElementById('phoneAboutTitle');
    if (content && title) {
      title.textContent = 'Open Source Licenses';
      content.innerHTML = `
        <div class="phone-license-section">
          <span class="phone-license-header">NxCalculator</span>
          <p style="margin: 0;">MIT License — Copyright (c) <a href="https://github.com/Noorthistime" target="_blank" style="color: #e30000; text-decoration: none; font-weight: 600;">Noorthistime</a></p>
        </div>
        <hr class="phone-license-divider">
        <div class="phone-license-section">
          <span class="phone-license-header">NxDesign</span>
          <p style="margin: 0;">MIT License — Copyright (c) <a href="https://github.com/Noorthistime" target="_blank" style="color: #e30000; text-decoration: none; font-weight: 600;">Noorthistime</a></p>
        </div>
        <hr class="phone-license-divider">
        <div class="phone-license-section">
          <span class="phone-license-header">Nothing OS Fonts</span>
          <p style="margin: 0;">Licensed under their respective terms by Nothing Technology Limited.</p>
        </div>
        <hr class="phone-license-divider">
        <div class="phone-license-section">
          <span class="phone-license-header">mathjs</span>
          <p style="margin: 0;">Apache License 2.0 — Copyright (c) Jos de Jong</p>
        </div>
        <hr class="phone-license-divider">
        <p style="margin-top: 1.5rem; font-style: italic; color: #666; line-height: 1.4;">This calculator UI is inspired by the NxCalculator app for Nothing OS.</p>
      `;
    }
    phoneOpenOverlay('phoneAboutOverlay');
  });

  document.getElementById('phoneAboutBackBtn')?.addEventListener('click', () => {
    phoneCloseOverlay('phoneAboutOverlay');
  });

  // ---- Settings change handlers ----
  const settingSelects = ['settingPhoneTheme', 'settingPhoneShape', 'settingPhoneDensity', 'settingPhoneNumpadFont', 'settingPhoneDisplayFont'];
  settingSelects.forEach(id => {
    document.getElementById(id)?.addEventListener('change', () => {
      const s = phoneGetSettings();
      if (id === 'settingPhoneTheme') s.theme = document.getElementById(id).value;
      if (id === 'settingPhoneShape') s.shape = document.getElementById(id).value;
      if (id === 'settingPhoneDensity') s.density = document.getElementById(id).value;
      if (id === 'settingPhoneNumpadFont') s.numpadFont = document.getElementById(id).value;
      if (id === 'settingPhoneDisplayFont') s.displayFont = document.getElementById(id).value;
      phoneSaveSettings(s);
      phoneApplySettingsInner();
    });
  });

  const settingToggles = [
    ['settingPhoneSwapDecimalZero', 'swapDecimalZero'],
    ['settingPhoneBottomToolbar', 'bottomToolbar'],
    ['settingPhoneHideCalcText', 'hideCalcText'],
    ['settingPhonePreferIconsToText', 'preferIconsToText'],
    ['settingPhonePreventDuplicate', 'preventDuplicate'],
    ['settingPhoneStartExtended', 'startExtended'],
    ['settingPhoneDisableHaptics', 'disableHaptics'],
  ];
  settingToggles.forEach(([id, key]) => {
    document.getElementById(id)?.addEventListener('change', () => {
      const s = phoneGetSettings();
      s[key] = document.getElementById(id).checked;
      phoneSaveSettings(s);
      phoneApplySettingsInner();
    });
  });

  // ---- Scientific Keypad Click Handling ----
  document.getElementById('phoneScientificKeypad')?.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    if (currentMode !== 'phone') return;
    phoneHaptic();

    const action = btn.dataset.action;
    const insert = btn.dataset.insert;

    if (insert) {
      insertValue(insert);
      return;
    }

    if (!action) return;

    // INV toggle
    if (action === 'phone-sci-invert') {
      phoneInverted = !phoneInverted;
      btn.classList.toggle('sci-active', phoneInverted);
      phoneUpdateSciLabels();
      return;
    }

    // DEG/RAD toggle
    if (action === 'phone-sci-mode') {
      phoneAngleMode = phoneAngleMode === 'RAD' ? 'DEG' : 'RAD';
      btn.textContent = phoneAngleMode;
      btn.classList.toggle('sci-active', phoneAngleMode === 'DEG');
      return;
    }

    // Trig functions
    if (action === 'phone-sci-sin') {
      if (phoneInverted) { insertValue('asin('); } else { insertValue(phoneAngleMode === 'DEG' ? 'sin(pi/180*' : 'sin('); }
      return;
    }
    if (action === 'phone-sci-cos') {
      if (phoneInverted) { insertValue('acos('); } else { insertValue(phoneAngleMode === 'DEG' ? 'cos(pi/180*' : 'cos('); }
      return;
    }
    if (action === 'phone-sci-tan') {
      if (phoneInverted) { insertValue('atan('); } else { insertValue(phoneAngleMode === 'DEG' ? 'tan(pi/180*' : 'tan('); }
      return;
    }

    // sqrt / x²
    if (action === 'phone-sci-root') {
      if (phoneInverted) {
        insertValue('^2');
      } else {
        insertValue('sqrt(');
      }
      return;
    }

    // ln / e^x
    if (action === 'phone-sci-ln') {
      if (phoneInverted) {
        insertValue('exp(');
      } else {
        insertValue('log(');
      }
      return;
    }

    // log / 10^x
    if (action === 'phone-sci-log') {
      if (phoneInverted) {
        insertValue('10^');
      } else {
        insertValue('log10(');
      }
      return;
    }

    // factorial
    if (action === 'phone-sci-factorial') {
      insertValue('!');
      return;
    }
  });

  function phoneUpdateSciLabels() {
    const sciKeypad = document.getElementById('phoneScientificKeypad');
    if (!sciKeypad) return;
    const btns = sciKeypad.querySelectorAll('button');
    btns.forEach(btn => {
      const action = btn.dataset.action;
      if (action === 'phone-sci-root') btn.textContent = phoneInverted ? 'x²' : '√';
      if (action === 'phone-sci-sin') btn.textContent = phoneInverted ? 'sin⁻¹' : 'sin';
      if (action === 'phone-sci-cos') btn.textContent = phoneInverted ? 'cos⁻¹' : 'cos';
      if (action === 'phone-sci-tan') btn.textContent = phoneInverted ? 'tan⁻¹' : 'tan';
      if (action === 'phone-sci-ln') btn.textContent = phoneInverted ? 'eˣ' : 'ln';
      if (action === 'phone-sci-log') btn.textContent = phoneInverted ? '10ˣ' : 'log';
    });
  }

  // ---- Override evaluateExpression for phone history ----
  const originalEvaluateExpression = evaluateExpression;
  evaluateExpression = async function () {
    if (currentMode !== 'phone') {
      return await originalEvaluateExpression();
    }

    if (!expression.trim()) {
      updateDisplay('Enter a calculation first.');
      return;
    }

    const exprBefore = expression;
    phoneHaptic();

    try {
      const response = await fetch('/api/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ expression: preprocessExpressionForBackend(expression) })
      });

      const payload = await response.json();

      if (!response.ok) {
        resultEl.textContent = payload.error || 'Error';
        return;
      }

      const resultValue = payload.result;
      expressionEl.textContent = exprBefore;
      resultEl.textContent = resultValue;

      // Save to history
      phoneSaveHistory(exprBefore, String(resultValue));

      expression = String(resultValue);
    } catch (error) {
      resultEl.textContent = 'Error';
    }
  };

  // Patch the handleCalculatorAction to add haptics for phone mode
  const origHandleCalcAction = handleCalculatorAction;
  handleCalculatorAction = async function (action, button) {
    // Phone-specific haptic on any keypress
    if (currentMode === 'phone') {
      phoneHaptic();
    }
    return origHandleCalcAction(action, button);
  };

  // Also add haptic to insert for phone mode
  const origInsertValue = insertValue;
  insertValue = function (value) {
    if (currentMode === 'phone') phoneHaptic();
    return origInsertValue(value);
  };

  // Handle haptic animation and feedback on physical keyboard keydown
  window.addEventListener('keydown', (event) => {
    if (currentMode !== 'phone') return;
    const s = phoneGetSettings();
    if (s.disableHaptics) return;

    const { key } = event;
    let button = null;

    if (/[0-9]/.test(key)) {
      button = document.querySelector(`.phone-mode .key[data-insert="${key}"]`);
    } else if (key === '+') {
      button = document.querySelector('.phone-mode .key[data-insert="+"]');
    } else if (key === '-') {
      button = document.querySelector('.phone-mode .key[data-insert="-"]');
    } else if (key === '*') {
      button = document.querySelector('.phone-mode .key[data-insert="*"]');
    } else if (key === '/') {
      button = document.querySelector('.phone-mode .key[data-insert="/"]');
    } else if (key === '.') {
      button = document.querySelector('.phone-mode .key[data-insert="."]');
    } else if (key === '(' || key === ')') {
      button = document.querySelector('.phone-mode .key[data-insert="("]');
    } else if (key === '^') {
      button = document.querySelector('.phone-mode .key-sci[data-insert="^"]');
    } else if (key === '%') {
      button = document.querySelector('.phone-mode .key[data-insert="%"]');
    } else if (key === 'Enter' || key === '=') {
      button = document.querySelector('.phone-mode .key[data-action="equals"]');
    } else if (key === 'Backspace') {
      button = document.querySelector('.phone-mode .key[data-action="backspace"]');
    } else if (key === 'Escape') {
      button = document.querySelector('.phone-mode .key[data-action="clear"]');
    }

    if (button) {
      // Avoid double haptic trigger if standard keydown handler will trigger it via insertValue/evaluateExpression
      const isAlreadyHaptic = /[0-9]/.test(key) || ['+', '-', '*', '/', '.', '(', ')', '^', 'Enter', '='].includes(key);
      if (!isAlreadyHaptic) {
        phoneHaptic();
      }
      button.classList.add('active-click');
      setTimeout(() => {
        button.classList.remove('active-click');
      }, 100);
    }
  });

})();

// ---- Standard History Mode ----
(function initStandardHistory() {
  let standardHistory = [];
  try {
    standardHistory = JSON.parse(localStorage.getItem('standardHistory') || '[]');
  } catch (e) {}

  function renderStandardHistory() {
    const list = document.getElementById('standardHistoryList');
    if (!list) return;

    if (standardHistory.length === 0) {
      list.innerHTML = '<div class="standard-history-empty">No history yet</div>';
      return;
    }

    list.innerHTML = standardHistory.slice().reverse().map((item, i) => {
      const idx = standardHistory.length - 1 - i;
      return `
        <div class="standard-history-item" data-idx="${idx}">
          <button class="standard-history-delete-btn" data-idx="${idx}" title="Delete entry" type="button">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
          <div class="standard-history-expr">${item.expr}</div>
          <div class="standard-history-res">${item.result}</div>
        </div>
      `;
    }).join('');

    // Setup click handlers for items
    list.querySelectorAll('.standard-history-item').forEach(itemEl => {
      itemEl.addEventListener('click', (e) => {
        if (e.target.closest('.standard-history-delete-btn')) return;
        const idx = parseInt(itemEl.dataset.idx, 10);
        if (standardHistory[idx]) {
          expression = standardHistory[idx].result;
          updateDisplay();
        }
      });
    });

    // Setup click handlers for delete buttons
    list.querySelectorAll('.standard-history-delete-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const idx = parseInt(btn.dataset.idx, 10);
        standardHistory.splice(idx, 1);
        localStorage.setItem('standardHistory', JSON.stringify(standardHistory));
        renderStandardHistory();
      });
    });
  }

  // Intercept standard evaluation to save to standardHistory
  const originalEvaluateExpression = evaluateExpression;
  evaluateExpression = async function () {
    if (currentMode === 'phone' || currentMode === 'date' || currentMode === 'graphing') {
      return await originalEvaluateExpression();
    }

    if (!expression.trim()) {
      updateDisplay('Enter a calculation first.');
      return;
    }

    const exprBefore = expression;
    try {
      await originalEvaluateExpression();
      // If result is evaluated successfully and displays in resultEl (or standard output)
      // wait, in non-phone modes, originalEvaluateExpression sets expression = resultValue.
      // So expression contains the evaluated result. Let's save standardHistory.
      const resultValue = expression; 
      
      // Prevent saving error messages or duplicates
      if (resultValue && resultValue !== 'Error' && resultValue !== exprBefore) {
        // Check duplicate
        if (standardHistory.length > 0) {
          const last = standardHistory[standardHistory.length - 1];
          if (last.expr === exprBefore && last.result === resultValue) return;
        }
        standardHistory.push({ expr: exprBefore, result: resultValue });
        if (standardHistory.length > 100) standardHistory.shift();
        localStorage.setItem('standardHistory', JSON.stringify(standardHistory));
        renderStandardHistory();
      }
    } catch (e) {
      // calculation failed
    }
  };

  // Toggle Standard History Panel
  const workspace = document.querySelector('.workspace');
  const sidebar = document.getElementById('standardHistorySidebar');
  const btn = document.getElementById('standardHistoryBtn');

  function openStandardHistory() {
    if (sidebar && workspace) {
      sidebar.style.display = 'flex';
      workspace.classList.add('has-history');
      renderStandardHistory();
    }
  }

  function closeStandardHistory() {
    if (sidebar && workspace) {
      sidebar.style.display = 'none';
      workspace.classList.remove('has-history');
    }
  }

  btn?.addEventListener('click', () => {
    if (workspace?.classList.contains('has-history')) {
      closeStandardHistory();
    } else {
      openStandardHistory();
    }
  });

  document.getElementById('standardHistoryClearBtn')?.addEventListener('click', () => {
    standardHistory = [];
    localStorage.removeItem('standardHistory');
    renderStandardHistory();
  });

  // Export closeStandardHistory to global scope so setKeypadMode can call it
  window.closeStandardHistory = closeStandardHistory;

})();

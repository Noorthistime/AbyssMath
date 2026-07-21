# AbyssMath
A full-stack scientific, programming, and graphing calculator web application featuring a modern Nothing/Apple-inspired UI, date calculations, and expression history.

## Project Structure
```text
AbyssMath/
├── backend/              # Node.js Express server and math evaluator
│   └── server.js
├── frontend/             # Frontend template markup, logic, and design system
│   ├── Nothing_Fonts/    # Custom Nothing OS system fonts
│   ├── fonts/            # Main project UI fonts
│   ├── app.js            # Core interactive calculator logic & canvas graphing
│   ├── index.html        # Main template interface layout
│   └── styles.css        # Responsive layouts & typography styling
├── package.json          # Node project dependencies & run scripts
├── package-lock.json
└── README.md             # Project documentation
```

## Features
### 1. Calculator Modes
* Multiple mode support (Standard, Scientific, Programming, Date Calculation, Graphing)
* Interactive keypads tailored to each calculation type
* Real-time evaluation feedback and responsive input display
* Haptic click animations for phone layout simulations

### 2. Advanced Math Engine
* Expression parsing and evaluation powered by math.js
* Custom bitwise operations (NAND, NOR, ROL, ROR, RCL, RCR)
* Carry-in bit selectors and word size options for low-level computations

### 3. Date Calculations
* Calculate differences between two calendar dates (in years, months, weeks, and days)
* Add or subtract days, months, and years from any given date
* Stacked and scrollable dual calendars for mobile responsiveness

### 4. Graphing System
* Interactive HTML5 2D canvas curve plotter
* Multi-expression input panel (fx) supporting standard and trigonometric functions
* Touchscreen gestures: single-finger dragging to pan, two-finger pinching to zoom
* Dynamic tracing cursor showing exact coordinate coordinates along the curve

### 5. History and Customizations
* Persistent workspace calculation logs with a delete-all option
* Native custom accent color pickers with automatic OS resetting prevention
* Theme toggles (Light Mode / Dark Mode) with active styles

## Technologies Used
* **Backend:** Node.js, Express
* **Math Library:** math.js
* **Build/Package Tool:** npm
* **Web Server:** Express Dev Server
* **Frontend:** HTML5, CSS3 (Vanilla), JavaScript (Vanilla)

## Database Setup
### Prerequisites
* Node.js (16.0 or higher)
* npm (8.0 or higher)
* Any modern web browser

### Installation Steps
1. **Clone Project**
   ```bash
   git clone <repository_url>
   ```
2. **Install Dependencies**
   Navigate to the project folder and run:
   ```bash
   npm install
   ```
3. **Database Configuration**
   No database server is required. User configurations, calculation history logs, and layout settings are managed client-side using the browser's native LocalStorage API.

## Building the Project
### Using npm
```bash
# Clean and reinstall dependencies
npm ci

# Launch development server
npm run dev
```

## Running the Application
1. Start backend server:
   ```bash
   npm start
   ```
2. Access the application:
   ```
   http://localhost:3000
   ```

## Default Calculator Configurations
* **Angle Units:** Radians (Togglable to Degrees or Gradians)
* **Word Size:** 64-bit (Togglable to 32-bit, 16-bit, or 8-bit in Programming Mode)
* **Accent Color:** Nothing Accent (Red/Monochrome)

## API Endpoints
### Authentication
This application uses anonymous guest access (no login or sessions required).

### Evaluations
* **POST `/api/evaluate`** - Evaluates mathematical expressions using the backend math.js library.

### Page Routing
* **GET `*`** - Wildcard serving of the main index.html frontend interface.

## LocalStorage Tables
### Settings (`phoneSettings`)
* `theme` (light/dark)
* `disableHaptics` (true/false)
* `customColor` (HEX color string)

### History (`calcHistory`)
* `id` (timestamp)
* `expr` (expression string)
* `result` (result string)
* `mode` (standard/scientific/programming)

## Numerical Bases Supported
* DEC (Decimal - Base 10)
* HEX (Hexadecimal - Base 16)
* OCT (Octal - Base 8)
* BIN (Binary - Base 2)

## Security Features
* Input sanitization for math evaluations
* Safe expression parsing with constrained mathjs configuration
* No SQL execution (injection immune)
* XSS protection via safe DOM rendering methods

## Future Enhancements
* Graphing coordinate export in CSV/SVG formats
* User cloud account sync for settings and calculations logs
* Matrix, vector, and calculus solvers
* Unit converter panel for physical quantities
* Custom macro scripting for repetitive calculations
* Offline PWA (Progressive Web App) offline support

## Troubleshooting
### Port Already In Use
If the port (e.g. 3000) is locked, check if another node process is running:
* **Windows:**
  ```powershell
  Stop-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess -Force
  ```

### Expression Errors
Ensure formulas are mathematically valid (e.g., division by zero is caught safely but triggers alerts).

### npm Dependencies Issues
Clean npm cache and reinstall node modules:
```bash
rm -rf node_modules package-lock.json
npm install
```

## Performance Optimization
* GPU accelerated 2D canvas rendering
* Dynamic keypress vibration throttling
* Asynchronous layout resize listening
* CSS custom property caching for live accent themes

## License
This project is open source and available under the MIT License.

## Author
Developed by: Fahad / AbyssMath Contributors

## Support
For issues and questions, please refer to the documentation or contact support.

## Deployment Checklist
* [x] Node.js and npm installed
* [x] Package dependencies resolved
* [x] Backend paths configured to serve frontend/ folder
* [x] Server runs successfully on designated port
* [x] LocalStorage reads/writes verify correctly
* [x] Responsive screens stack and scroll correctly

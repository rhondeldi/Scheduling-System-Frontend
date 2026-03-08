# Scheduling System Frontend

[![build](https://github.com/mrdcvlsc/scheduling-system-frontend/actions/workflows/build.yml/badge.svg)](https://github.com/mrdcvlsc/scheduling-system-frontend/actions/workflows/build.yml)
[![tests](https://github.com/mrdcvlsc/scheduling-system-frontend/actions/workflows/tests.yml/badge.svg)](https://github.com/mrdcvlsc/scheduling-system-frontend/actions/workflows/tests.yml)
[![release](https://github.com/mrdcvlsc/scheduling-system-frontend/actions/workflows/release.yml/badge.svg)](https://github.com/mrdcvlsc/scheduling-system-frontend/actions/workflows/release.yml)

Frontend application for **SUBJECT SCHEDULING SYSTEM USING GENETIC ALGORITHMS AND ARTIFICIAL NEURAL NETWORKS**

## 📋 Overview

A modern web-based interface for managing and optimizing academic scheduling using advanced AI algorithms. This system enables educational institutions to efficiently create class schedules, manage instructors, rooms, subjects, and curriculums while leveraging genetic algorithms and neural networks for optimal scheduling solutions.

## ✨ Features

- **Department Management** - Create and manage academic departments
- **Instructor Management** - Add, view, and manage instructor profiles with availability tracking
- **Subject Management** - Organize subjects and course offerings
- **Room Scheduling** - Manage classroom and facility allocations
- **Curriculum Management** - Define curriculum structures and requirements
- **Automated Schedule Generation** - Generate optimized schedules using GA and ANN
- **Interactive Timetables** - View and print class schedules and instructor timetables
- **User Authentication** - Secure login system for departments and administrators
- **Responsive Design** - Works seamlessly across desktop and mobile devices

## 🛠️ Tech Stack

- **Frontend Framework:** React 19
- **Build Tool:** Vite 6
- **UI Library:** Material-UI (MUI) 6
- **Styling:** Emotion (CSS-in-JS)
- **Icons:** Material Icons
- **Routing:** Client-side routing
- **Print Support:** react-to-print
- **Linting:** ESLint 9

## 📦 Installation

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Setup

1. Clone the repository:

```bash
git clone https://github.com/mrdcvlsc/scheduling-system-frontend.git
cd scheduling-system-frontend
```

2. Install dependencies:

```bash
npm install
```

3. Configure environment variables (if needed):

```bash
# Create a .env file for API endpoints and other configurations
cp .env.example .env
```

## 🚀 Usage

### Development Mode

Run the development server with hot reload:

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### Production Build

Build the application for production:

```bash
npm run build
```

Built files will be in the `dist/` directory.

### Preview Production Build

Preview the production build locally:

```bash
npm run preview
```

### Linting

Run ESLint to check code quality:

```bash
npm run lint
```

## 📁 Project Structure

```
src/
├── assets/           # CSS files and styling resources
├── components/       # Reusable React components
├── contexts/         # React Context providers
├── curriculums/      # Curriculum management pages
├── department_login/ # Department authentication
├── departments/      # Department management
├── instructors/      # Instructor management and views
├── js/               # Utility functions and business logic
├── login/            # Login page
├── rooms/            # Room management and scheduling
├── schedule/         # Schedule generation and viewing
├── subjects/         # Subject management
├── survey/           # Class schedule survey
├── utils/            # Helper utilities
├── view_instructors/ # Instructor viewing interface
├── view_schedule/    # Schedule viewing interface
├── main.jsx          # Application entry point
└── index.css         # Global styles
```

## 🎨 Key Components

- **Header** - Navigation and application header
- **ContextMenu** - Right-click context menu functionality
- **Loading** - Loading states and spinners
- **TimeTable** - Interactive timetable grid views
- **PrintHeader** - Formatted headers for printing

## 🧠 Core Modules

- **basics.js** - Fundamental utilities and configurations
- **instructors.js / instructors_v2.js** - Instructor data management
- **schedule.js** - Scheduling algorithm integration
- **subjects.js** - Subject database operations
- **rooms.js** - Room allocation logic
- **curriculums.js** - Curriculum structure handling
- **departments.js** - Department data operations
- **instructor-time-slot-bit-map.js** - Instructor availability tracking
- **week-time-table-grid-functions.js** - Timetable grid rendering utilities

## 🔐 Authentication

The system includes two authentication levels:

- **Admin Login** - Full system access
- **Department Login** - Department-specific access

## 🖨️ Printing

The application supports printing schedules and timetables using the `react-to-print` library with custom formatting.

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is part of an academic research on scheduling optimization using genetic algorithms and artificial neural networks.

## 🐛 Known Issues

Please report bugs and issues on the [GitHub Issues page](https://github.com/mrdcvlsc/scheduling-system-frontend/issues).

## 📧 Contact

For questions or collaboration inquiries, please open an issue or contact the maintainers.

---

**Note:** This frontend requires a compatible backend API for full functionality. Ensure the backend service is running and properly configured.

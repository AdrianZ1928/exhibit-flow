Exhibit-Flow
The better flow for curators
A comprehensive desktop application designed to streamline exhibition management for art curators, gallery managers, and museum staff. Exhibit-Flow centralizes artwork management, floor planning, and task coordination into one intuitive platform.
Description
Exhibit-Flow addresses critical inefficiencies in art exhibition management by providing a unified solution for planning, organizing, and executing art exhibitions. The application eliminates the need for fragmented tools like spreadsheets and paper sketches, reducing setup errors and improving overall exhibition quality through integrated digital workflows.
Key Features:

User authentication with secure account management
Exhibition lifecycle management (create, edit, track)
Comprehensive artwork database with metadata
Interactive drag-and-drop floor planning system
Task management with priority and deadline tracking
Real-time statistics and progress monitoring

Installation Instructions
Prerequisites

Node.js (version 14.0 or higher)
npm (Node Package Manager)

Step-by-Step Installation

Clone the repository:
bashgit clone [your-repository-url]
cd exhibit-flow

Install dependencies:
bashnpm install

Install Electron globally (if not already installed):
bashnpm install -g electron

Start the application:
bashnpm start
or
bashelectron .


Building for Distribution
To create a distributable package:
bashnpm run build
How to Use
Getting Started

Launch the application - Run the installation commands above
Create an account - Click "Register" and create a new user account with secure password
Login - Enter your credentials to access the dashboard

Basic Workflow

Dashboard - View all your exhibitions, create new ones, or edit existing projects
Create Exhibition - Click the "+" card to start a new exhibition with basic details
Exhibition Editor - Use the tabbed interface to manage different aspects:

Overview: Set dates, venue, priority, and description
Artworks: Add artwork details including title, artist, medium, dimensions
Floor Plan: Drag and drop artworks onto the gallery layout
Tasks: Create and track exhibition setup tasks with deadlines
Settings: Add curator notes, budget information, or delete exhibition



Key Features

Filtering & Sorting: Use sidebar filters to organize exhibitions by status, priority, or date
Visual Floor Planning: Interactive SVG gallery layout with professional room designs
Task Management: Priority-based task system with overdue indicators
Data Persistence: All data automatically saved per user account

License Information
This project is licensed under the MIT License - see the LICENSE file for details.
Visuals
Dashboard Interface
Show Image
Main dashboard showing exhibition cards with filtering options
Exhibition Editor
Show Image
Tabbed exhibition editor with artwork management
Floor Plan System
Show Image
Interactive drag-and-drop floor planning with SVG gallery layout
Acknowledgements

Electron Framework - For enabling cross-platform desktop application development
CSS Grid & Flexbox - For responsive layout systems
SVG Graphics - For creating detailed gallery floor plans
LocalStorage API - For client-side data persistence
Modern JavaScript ES6+ - For clean, maintainable code architecture

Special thanks to the open-source community for inspiration and best practices in desktop application development.
Author Details
Adrian Zapata
Year 12 Software Engineering Student
Broughton Anglican College
Project Information:

Course: Software Engineering Year 12 Stage 6
Assessment: Individual Software Project (Assessment Task 3)
Development Period: January - March 2025
Technologies: HTML5, CSS3, JavaScript ES6, Electron Framework

Contact:

Project Repository: [GitHub Repository Link]
Documentation: Available in /docs folder
Support: See project documentation for troubleshooting guide

Clean Directory Structure
exhibit-flow/
├── src/
│   ├── index.html              # Login page
│   ├── dashboard.html          # Main dashboard
│   ├── exhibit-editor.html     # Exhibition editor
│   ├── style.css              # Application styling
│   ├── renderer.js            # Login functionality
│   ├── dashboard.js           # Dashboard functionality
│   └── exhibit-editor.js      # Editor functionality
├── main.js                    # Electron main process
├── package.json              # Project dependencies
├── README.md                 # This file
├── docs/                     # Project documentation
│   ├── data-flow-diagrams/
│   ├── structure-charts/
│   └── algorithm-specifications/
└── screenshots/              # Application screenshots
    ├── dashboard.png
    ├── editor.png
    └── floorplan.png
Additional Details
System Requirements

Operating System: Windows 10+, macOS 10.14+, or Linux distributions
RAM: Minimum 4GB recommended
Storage: 150MB for application and user data
Display: 1024x768 minimum resolution (1920x1080 recommended)

Development Environment Setup
For developers wanting to contribute or modify the application:

Clone and install as described above
Development tools: Any text editor (VS Code recommended)
Debugging: Use Electron DevTools (Ctrl/Cmd + Shift + I)
File structure: Follow existing patterns in /src directory
Code style: ES6+ JavaScript, semantic HTML, modern CSS

Troubleshooting

Installation issues: Ensure Node.js and npm are correctly installed
Application won't start: Check console for error messages
Data not saving: Verify localStorage permissions and browser settings
Performance issues: Close other applications, restart Electron app

Future Enhancements

Cloud data synchronization
Collaborative editing features
Advanced reporting and analytics
Integration with external gallery management systems
Mobile companion app for field use
// Debug log to confirm dashboard script has loaded
console.log("Dashboard loaded");

// Date formatting helper functions for DD/MM/YYYY format
// Converts date from internal format to user-friendly DD/MM/YYYY display
function formatDateForDisplay(dateString) {
  if (!dateString) return 'Not set'; // Handle empty dates
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 'Invalid date'; // Handle invalid dates
  
  // Extract day, month, year and pad with zeros if needed
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0'); // Month is 0-indexed
  const year = date.getFullYear();
  
  return `${day}/${month}/${year}`; // Return in DD/MM/YYYY format
}

// Converts date to YYYY-MM-DD format for HTML date inputs
function formatDateForInput(dateString) {
  if (!dateString) return ''; // Handle empty dates
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return ''; // Handle invalid dates
  
  // Extract year, month, day and pad with zeros
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  
  return `${year}-${month}-${day}`; // Return in YYYY-MM-DD format for input fields
}

// Apply dashboard styling to the page
document.body.className = "dashboard-mode";

// Simple localStorage-based storage (account-specific)
// Retrieves exhibitions for the currently logged-in user
function getExhibitions() {
  const currentUser = localStorage.getItem("loggedInUser"); // Get current user
  if (currentUser) {
    // Get user-specific exhibitions data
    const data = localStorage.getItem(`${currentUser}_exhibitions`);
    return JSON.parse(data || "[]"); // Parse JSON or return empty array
  }
  return []; // Return empty array if no user logged in
}

// Saves exhibitions array to localStorage for current user
function saveExhibitions(exhibitions) {
  const currentUser = localStorage.getItem("loggedInUser");
  if (currentUser) {
    // Save exhibitions with user-specific key
    localStorage.setItem(`${currentUser}_exhibitions`, JSON.stringify(exhibitions));
    console.log("Exhibitions saved for", currentUser);
  }
}

// Gets the currently selected/active exhibition
function getCurrentExhibition() {
  return JSON.parse(localStorage.getItem("currentExhibition") || "null");
}

// Saves the currently selected exhibition (for navigation between pages)
function saveCurrentExhibition(exhibition) {
  localStorage.setItem("currentExhibition", JSON.stringify(exhibition));
}

// Initialize filters to start unchecked (reset all filter controls)
function initializeFilters() {
  // Clear all status filter checkboxes
  document.getElementById("filter-planning").checked = false;
  document.getElementById("filter-active").checked = false;
  document.getElementById("filter-completed").checked = false;
  
  // Clear all priority filter checkboxes
  document.getElementById("filter-high").checked = false;
  document.getElementById("filter-medium").checked = false;
  document.getElementById("filter-low").checked = false;
  
  // Reset sort dropdown to default
  document.getElementById("sort-by").value = "newest";
}

// Load and display exhibitions in the dashboard grid
function loadExhibitions() {
  const exhibitions = getExhibitions(); // Get user's exhibitions
  const grid = document.getElementById("exhibitions-grid"); // Get grid container
  
  if (!grid) return; // Exit if grid element not found
  
  grid.innerHTML = ""; // Clear existing content
  
  // Add create new exhibition card (always first)
  const createCard = document.createElement("div");
  createCard.className = "exhibition-card create-card";
  createCard.innerHTML = `
    <div class="create-icon">+</div>
    <div>Create New Exhibition</div>
  `;
  // Add click handler to open creation modal
  createCard.addEventListener("click", function() {
    console.log("Create card clicked");
    createNewExhibition();
  });
  grid.appendChild(createCard);
  
  // Add existing exhibitions as cards
  exhibitions.forEach((exhibition, index) => {
    const card = document.createElement("div");
    card.className = "exhibition-card";
    
    // Calculate statistics for the exhibition
    const artworksCount = exhibition.artworks ? exhibition.artworks.length : 0;
    const tasksCount = exhibition.tasks ? exhibition.tasks.length : 0;
    const completedTasks = exhibition.tasks ? exhibition.tasks.filter(t => t.completed).length : 0;
    const placedArtworks = exhibition.floorPlan ? exhibition.floorPlan.length : 0;
    
    // Format dates for display using helper function
    const startDate = formatDateForDisplay(exhibition.startDate);
    const endDate = formatDateForDisplay(exhibition.endDate);
    
    // Build card HTML with exhibition information
    card.innerHTML = `
      <div class="exhibition-info">
        <h3>${exhibition.name}</h3>
        <p class="exhibition-meta">
          <span class="priority-indicator priority-${exhibition.priority || 'medium'}"></span>
          ${startDate} - ${endDate}
        </p>
        <p class="exhibition-meta">${exhibition.venue || 'Venue not set'}</p>
        <div class="exhibition-status status-${exhibition.status || 'planning'}">${exhibition.status || 'planning'}</div>
      </div>
      <div class="exhibition-stats">
        <div class="stat">
          <span class="stat-number">${artworksCount}</span>
          <span class="stat-label">Artworks</span>
        </div>
        <div class="stat">
          <span class="stat-number">${placedArtworks}</span>
          <span class="stat-label">Placed</span>
        </div>
        <div class="stat">
          <span class="stat-number">${completedTasks}/${tasksCount}</span>
          <span class="stat-label">Tasks</span>
        </div>
      </div>
    `;
    
    // Add click handler to open this exhibition
    card.addEventListener("click", function() {
      console.log("Exhibition card clicked:", exhibition.name);
      openExhibition(index);
    });
    grid.appendChild(card);
  });
  
  // Show message if no exhibitions exist
  if (exhibitions.length === 0) {
    const emptyMessage = document.createElement("div");
    emptyMessage.style.gridColumn = "1 / -1"; // Span full grid width
    emptyMessage.style.textAlign = "center";
    emptyMessage.style.color = "#666";
    emptyMessage.style.padding = "20px";
    emptyMessage.innerHTML = `<p>No exhibitions yet. Click the card above to create your first exhibition!</p>`;
    grid.appendChild(emptyMessage);
  }
}

// Create new exhibition - opens the modal dialog
function createNewExhibition() {
  console.log("createNewExhibition called");
  
  const modal = document.getElementById("create-exhibition-modal");
  if (modal) {
    modal.style.display = "flex"; // Show modal
    // Focus on name input after modal appears
    setTimeout(() => {
      document.getElementById("new-exhibition-name").focus();
    }, 100);
  } else {
    console.error("Modal not found");
  }
}

// Close modal and reset form fields
function closeCreateModal() {
  const modal = document.getElementById("create-exhibition-modal");
  if (modal) {
    modal.style.display = "none"; // Hide modal
    // Clear form inputs
    document.getElementById("new-exhibition-name").value = "";
    document.getElementById("new-exhibition-venue").value = "";
  }
}

// Confirm and create exhibition - validates input and creates new exhibition
function confirmCreateExhibition() {
  console.log("confirmCreateExhibition called");
  
  // Get form input elements
  const nameInput = document.getElementById("new-exhibition-name");
  const venueInput = document.getElementById("new-exhibition-venue");
  
  // Get trimmed values
  const name = nameInput.value.trim();
  const venue = venueInput.value.trim();
  
  // Validate required fields
  if (!name) {
    alert("Please enter an exhibition name.");
    nameInput.focus();
    return;
  }
  
  console.log("Creating exhibition:", name);
  
  // Get current exhibitions array
  let exhibitions = getExhibitions();
  console.log("Current exhibitions:", exhibitions);
  
  // Ensure we have a valid array
  if (!exhibitions || !Array.isArray(exhibitions)) {
    console.log("Creating new exhibitions array");
    exhibitions = [];
  }
  
  // Create new exhibition object with default values
  const newExhibition = {
    id: Date.now(), // Use timestamp as unique ID
    name: name,
    description: "",
    startDate: "",
    endDate: "",
    venue: venue,
    priority: "medium", // Default priority
    status: "planning", // Default status
    artworks: [], // Empty arrays for related data
    floorPlan: [],
    tasks: [],
    curatorNotes: "",
    budget: "",
    dateCreated: new Date().toISOString(), // Creation timestamp
    lastModified: new Date().toISOString() // Modification timestamp
  };
  
  console.log("New exhibition object:", newExhibition);
  
  // Add to exhibitions array
  exhibitions.push(newExhibition);
  console.log("Exhibitions after push:", exhibitions);
  
  // Save updated array to localStorage
  saveExhibitions(exhibitions);
  
  // Close the modal
  closeCreateModal();
  
  // Set as current exhibition for editing
  saveCurrentExhibition(newExhibition);
  
  // Navigate to exhibition editor page
  window.location.href = "exhibit-editor.html";
}

// Open exhibition - FIXED: Actually navigate to editor
function openExhibition(index) {
  const exhibitions = getExhibitions();
  const exhibition = exhibitions[index];
  
  if (exhibition) {
    saveCurrentExhibition(exhibition); // Set as current
    // Navigate to the exhibition editor
    window.location.href = "exhibit-editor.html";
  }
}

// Filter functionality - FIXED: applies status, priority, and sorting filters
function applyFilters() {
  console.log("Applying filters...");
  const exhibitions = getExhibitions();
  let filteredExhibitions = [...exhibitions]; // Create copy for filtering
  
  // Status filters - check which status checkboxes are selected
  const statusFilters = [];
  if (document.getElementById("filter-planning").checked) statusFilters.push("planning");
  if (document.getElementById("filter-active").checked) statusFilters.push("active");
  if (document.getElementById("filter-completed").checked) statusFilters.push("completed");
  
  // Apply status filter only if some (but not all) statuses are selected
  if (statusFilters.length > 0 && statusFilters.length < 3) {
    filteredExhibitions = filteredExhibitions.filter(ex => 
      statusFilters.includes(ex.status || "planning")
    );
  }
  
  // Priority filters - check which priority checkboxes are selected
  const priorityFilters = [];
  if (document.getElementById("filter-high").checked) priorityFilters.push("high");
  if (document.getElementById("filter-medium").checked) priorityFilters.push("medium");
  if (document.getElementById("filter-low").checked) priorityFilters.push("low");
  
  // Apply priority filter only if some (but not all) priorities are selected
  if (priorityFilters.length > 0 && priorityFilters.length < 3) {
    filteredExhibitions = filteredExhibitions.filter(ex => 
      priorityFilters.includes(ex.priority || "medium")
    );
  }
  
  // Sort filtered results based on dropdown selection
  const sortBy = document.getElementById("sort-by").value;
  switch (sortBy) {
    case "newest":
      // Sort by creation date (newest first)
      filteredExhibitions.sort((a, b) => new Date(b.dateCreated) - new Date(a.dateCreated));
      break;
    case "oldest":
      // Sort by creation date (oldest first)
      filteredExhibitions.sort((a, b) => new Date(a.dateCreated) - new Date(b.dateCreated));
      break;
    case "name":
      // Sort alphabetically by name
      filteredExhibitions.sort((a, b) => a.name.localeCompare(b.name));
      break;
    case "priority":
      // Sort by priority (high to low)
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      filteredExhibitions.sort((a, b) => 
        (priorityOrder[b.priority] || 2) - (priorityOrder[a.priority] || 2)
      );
      break;
  }
  
  // Display the filtered and sorted results
  displayFilteredExhibitions(filteredExhibitions);
}

// Display filtered exhibitions - FIXED to properly show filtered results
function displayFilteredExhibitions(exhibitions) {
  const grid = document.getElementById("exhibitions-grid");
  
  if (!grid) return;
  
  grid.innerHTML = ""; // Clear existing content
  
  // Add create new exhibition card (always shown)
  const createCard = document.createElement("div");
  createCard.className = "exhibition-card create-card";
  createCard.innerHTML = `
    <div class="create-icon">+</div>
    <div>Create New Exhibition</div>
  `;
  createCard.addEventListener("click", function() {
    console.log("Create card clicked");
    createNewExhibition();
  });
  grid.appendChild(createCard);
  
  // Add filtered exhibitions (same card creation logic as loadExhibitions)
  exhibitions.forEach((exhibition, originalIndex) => {
    const card = document.createElement("div");
    card.className = "exhibition-card";
    
    // Calculate statistics for the exhibition
    const artworksCount = exhibition.artworks ? exhibition.artworks.length : 0;
    const tasksCount = exhibition.tasks ? exhibition.tasks.length : 0;
    const completedTasks = exhibition.tasks ? exhibition.tasks.filter(t => t.completed).length : 0;
    const placedArtworks = exhibition.floorPlan ? exhibition.floorPlan.length : 0;
    
    // Use the date formatting function
    const startDate = formatDateForDisplay(exhibition.startDate);
    const endDate = formatDateForDisplay(exhibition.endDate);
    
    // Build card HTML
    card.innerHTML = `
      <div class="exhibition-info">
        <h3>${exhibition.name}</h3>
        <p class="exhibition-meta">
          <span class="priority-indicator priority-${exhibition.priority || 'medium'}"></span>
          ${startDate} - ${endDate}
        </p>
        <p class="exhibition-meta">${exhibition.venue || 'Venue not set'}</p>
        <div class="exhibition-status status-${exhibition.status || 'planning'}">${exhibition.status || 'planning'}</div>
      </div>
      <div class="exhibition-stats">
        <div class="stat">
          <span class="stat-number">${artworksCount}</span>
          <span class="stat-label">Artworks</span>
        </div>
        <div class="stat">
          <span class="stat-number">${placedArtworks}</span>
          <span class="stat-label">Placed</span>
        </div>
        <div class="stat">
          <span class="stat-number">${completedTasks}/${tasksCount}</span>
          <span class="stat-label">Tasks</span>
        </div>
      </div>
    `;
    
    card.addEventListener("click", function() {
      console.log("Exhibition card clicked:", exhibition.name);
      // Find the original index in the unfiltered array (important for correct navigation)
      const allExhibitions = getExhibitions();
      const realIndex = allExhibitions.findIndex(ex => ex.id === exhibition.id);
      openExhibition(realIndex);
    });
    grid.appendChild(card);
  });
  
  // Show message if no exhibitions match filters
  if (exhibitions.length === 0) {
    const emptyMessage = document.createElement("div");
    emptyMessage.style.gridColumn = "1 / -1"; // Span full grid width
    emptyMessage.style.textAlign = "center";
    emptyMessage.style.color = "#666";
    emptyMessage.style.padding = "20px";
    emptyMessage.innerHTML = `<p>No exhibitions match your current filters.</p>`;
    grid.appendChild(emptyMessage);
  }
}

// Clear filters - FIXED to properly reset all filters and show all exhibitions
function clearFilters() {
  console.log("Clearing filters");
  initializeFilters(); // Reset all filter controls
  loadExhibitions(); // Show all exhibitions again (unfiltered)
}

// Initialize on page load - main entry point when DOM is ready
document.addEventListener("DOMContentLoaded", function() {
  // Check if user is logged in
  const loggedUser = localStorage.getItem("loggedInUser");
  if (!loggedUser) {
    // Redirect to login if not logged in
    window.location.href = "index.html";
    return;
  }
  
  // Update welcome message with username
  document.getElementById("logged-user").textContent = `Welcome, ${loggedUser}!`;
  
  // Initialize filters to default state
  initializeFilters();
  
  // Load and display exhibitions
  loadExhibitions();
  
  // Set up logout functionality
  document.getElementById("logout-btn").addEventListener("click", () => {
    // Clear user session data
    localStorage.removeItem("loggedInUser");
    localStorage.removeItem("currentExhibition");
    // Redirect to login page
    window.location.href = "index.html";
  });
  
  // Add event listeners to filter controls for real-time filtering
  const filterElements = [
    "filter-planning", "filter-active", "filter-completed", // Status filters
    "filter-high", "filter-medium", "filter-low", // Priority filters
    "sort-by" // Sort dropdown
  ];
  
  // Attach change event listeners to all filter controls
  filterElements.forEach(id => {
    const element = document.getElementById(id);
    if (element) {
      element.addEventListener("change", function() {
        console.log("Filter changed:", id);
        applyFilters(); // Apply filters when any control changes
      });
    }
  });
  
  // Add keyboard support for modal (accessibility)
  document.addEventListener("keydown", function(e) {
    const modal = document.getElementById("create-exhibition-modal");
    if (modal && modal.style.display === "flex") {
      if (e.key === "Escape") {
        closeCreateModal(); // Close modal on Escape key
      } else if (e.key === "Enter") {
        confirmCreateExhibition(); // Submit on Enter key
      }
    }
  });
  
  // Add enter key support to exhibition name input for quick submission
  const nameInput = document.getElementById("new-exhibition-name");
  if (nameInput) {
    nameInput.addEventListener("keypress", function(e) {
      if (e.key === "Enter") {
        confirmCreateExhibition(); // Submit form on Enter key
      }
    });
  }
});
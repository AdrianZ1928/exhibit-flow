// Debug log to confirm exhibit editor script has loaded
console.log("Exhibit Editor loaded");

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

// Global variables to track current state
let currentExhibition = null; // Stores the exhibition being edited
let editingArtworkIndex = -1; // Tracks which artwork is being edited (-1 = new artwork)
let editingTaskIndex = -1; // Tracks which task is being edited (-1 = new task)

// Data storage helpers - FIXED: Use user-specific storage like dashboard
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

// Initialize on page load - main entry point when DOM is ready
document.addEventListener("DOMContentLoaded", function() {
  // Check if user is logged in
  const loggedUser = localStorage.getItem("loggedInUser");
  if (!loggedUser) {
    // Redirect to login if not logged in
    window.location.href = "index.html";
    return;
  }
  
  // Get the exhibition to edit
  currentExhibition = getCurrentExhibition();
  if (!currentExhibition) {
    // Redirect to dashboard if no exhibition selected
    alert("No exhibition selected. Redirecting to dashboard.");
    window.location.href = "dashboard.html";
    return;
  }
  
  // Load all exhibition data into the interface
  loadExhibitionData(); // Load form fields with exhibition data
  updateStats(); // Update statistics display
  loadArtworks(); // Load artworks grid
  loadAvailableArtworks(); // Load draggable artworks for floor plan
  loadTasks(); // Load tasks list
  
  // Set up title editing functionality
  const titleElement = document.getElementById("exhibit-title");
  titleElement.addEventListener("blur", updateExhibitionTitle); // Save when user clicks away
  titleElement.addEventListener("keypress", function(e) {
    if (e.key === "Enter") {
      e.preventDefault();
      this.blur(); // Trigger save when Enter is pressed
    }
  });
  
  // Set up floor plan drag and drop functionality
  setupFloorPlanDragDrop();
});

// Load exhibition data into form fields
function loadExhibitionData() {
  // Set editable title and metadata
  document.getElementById("exhibit-title").textContent = currentExhibition.name;
  document.getElementById("exhibit-meta").textContent = `Last edited: ${formatDateForDisplay(currentExhibition.lastModified)}`;
  
  // Fill form fields with exhibition data
  document.getElementById("exhibit-description").value = currentExhibition.description || "";
  
  // Format dates for HTML date inputs (these need YYYY-MM-DD format)
  document.getElementById("exhibit-start-date").value = formatDateForInput(currentExhibition.startDate);
  document.getElementById("exhibit-end-date").value = formatDateForInput(currentExhibition.endDate);
  
  // Set dropdown and input values
  document.getElementById("exhibit-priority").value = currentExhibition.priority || "medium";
  document.getElementById("exhibit-venue").value = currentExhibition.venue || "";
  document.getElementById("exhibit-status").value = currentExhibition.status || "planning";
  document.getElementById("curator-notes").value = currentExhibition.curatorNotes || "";
  document.getElementById("exhibit-budget").value = currentExhibition.budget || "";
}

// Update exhibition title when user finishes editing
function updateExhibitionTitle() {
  const newTitle = document.getElementById("exhibit-title").textContent.trim();
  if (newTitle && newTitle !== currentExhibition.name) {
    currentExhibition.name = newTitle; // Update title
    saveExhibit(); // Save changes
  }
}

// Navigation functions
// Return to the main dashboard
function goBackToDashboard() {
  window.location.href = "dashboard.html";
}

// UPDATED: Modified showEditorTab to load floor plan when switching to that tab
// Handles tab switching in the editor interface
function showEditorTab(tabName) {
  // Hide all tabs by removing active class
  document.querySelectorAll('.editor-tab').forEach(tab => {
    tab.classList.remove('active');
  });
  
  // Remove active class from all navigation items
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.remove('active');
  });
  
  // Show selected tab
  document.getElementById(tabName).classList.add('active');
  
  // Add active class to clicked navigation item
  event.target.classList.add('active');
  
  // Update data when switching to specific tabs
  if (tabName === 'floorplan') {
    loadAvailableArtworks(); // Refresh available artworks
    loadExistingFloorPlan(); // NEW: Load existing placements
  }
}

// Save exhibition - persists all changes to localStorage
function saveExhibit() {
  // Update exhibition data from form fields
  currentExhibition.name = document.getElementById("exhibit-title").textContent.trim();
  currentExhibition.description = document.getElementById("exhibit-description").value;
  
  // Convert HTML date inputs to ISO format for storage
  const startDateValue = document.getElementById("exhibit-start-date").value;
  const endDateValue = document.getElementById("exhibit-end-date").value;
  
  // Convert to ISO strings for consistent storage
  currentExhibition.startDate = startDateValue ? new Date(startDateValue).toISOString() : "";
  currentExhibition.endDate = endDateValue ? new Date(endDateValue).toISOString() : "";
  
  // Update other form fields
  currentExhibition.priority = document.getElementById("exhibit-priority").value;
  currentExhibition.venue = document.getElementById("exhibit-venue").value;
  currentExhibition.status = document.getElementById("exhibit-status").value;
  currentExhibition.curatorNotes = document.getElementById("curator-notes").value;
  currentExhibition.budget = document.getElementById("exhibit-budget").value;
  currentExhibition.lastModified = new Date().toISOString(); // Update timestamp
  
  // Save to exhibitions array - Use user-specific storage
  const exhibitions = getExhibitions();
  const index = exhibitions.findIndex(ex => ex.id === currentExhibition.id);
  if (index !== -1) {
    exhibitions[index] = currentExhibition; // Update existing exhibition
    saveExhibitions(exhibitions);
  }
  
  // Update current exhibition in localStorage
  saveCurrentExhibition(currentExhibition);
  
  // Update UI with formatted date
  document.getElementById("exhibit-meta").textContent = `Last edited: ${formatDateForDisplay(new Date().toISOString())}`;
  updateStats(); // Refresh statistics
  
  // Show save confirmation with visual feedback
  const saveBtn = document.querySelector(".btn-save");
  const originalText = saveBtn.textContent;
  saveBtn.textContent = "Saved!";
  saveBtn.style.background = "#28a745";
  setTimeout(() => {
    saveBtn.textContent = originalText;
    saveBtn.style.background = "";
  }, 1000);
}

// Update statistics display in the overview tab
function updateStats() {
  // Calculate various counts from exhibition data
  const artworksCount = currentExhibition.artworks ? currentExhibition.artworks.length : 0;
  const tasksCount = currentExhibition.tasks ? currentExhibition.tasks.length : 0;
  const completedTasks = currentExhibition.tasks ? currentExhibition.tasks.filter(t => t.completed).length : 0;
  const placedArtworks = currentExhibition.floorPlan ? currentExhibition.floorPlan.length : 0;
  
  // Update UI elements with calculated statistics
  document.getElementById("stat-artworks").textContent = artworksCount;
  document.getElementById("stat-placed").textContent = placedArtworks;
  document.getElementById("stat-tasks").textContent = tasksCount;
  document.getElementById("stat-completed-tasks").textContent = completedTasks;
}

// ARTWORK MANAGEMENT
// Show the add artwork form
function showAddArtworkForm() {
  document.getElementById("artwork-form").style.display = "block";
  editingArtworkIndex = -1; // Reset to new artwork mode
  clearArtworkForm(); // Clear form fields
}

// Hide the add artwork form
function cancelAddArtwork() {
  document.getElementById("artwork-form").style.display = "none";
  editingArtworkIndex = -1; // Reset editing state
  clearArtworkForm(); // Clear form fields
}

// Clear all artwork form fields and reset button state
function clearArtworkForm() {
  // Clear all input fields
  document.getElementById("artwork-title").value = "";
  document.getElementById("artwork-artist").value = "";
  document.getElementById("artwork-year").value = "";
  document.getElementById("artwork-medium").value = "";
  document.getElementById("artwork-dimensions").value = "";
  document.getElementById("artwork-value").value = "";
  document.getElementById("artwork-description").value = "";
  
  // Reset button text to "Add" mode
  const addButton = document.querySelector("#artwork-form .btn-primary");
  addButton.textContent = "Add Artwork";
  addButton.onclick = addArtworkToExhibit;
}

// Add or update artwork in the exhibition
function addArtworkToExhibit() {
  // Get required fields and validate
  const title = document.getElementById("artwork-title").value.trim();
  const artist = document.getElementById("artwork-artist").value.trim();
  
  if (!title || !artist) {
    alert("Please fill in at least the title and artist fields.");
    return;
  }
  
  // Create artwork object with form data
  const artwork = {
    id: Date.now(), // Unique ID based on timestamp
    title: title,
    artist: artist,
    year: document.getElementById("artwork-year").value,
    medium: document.getElementById("artwork-medium").value,
    dimensions: document.getElementById("artwork-dimensions").value,
    value: document.getElementById("artwork-value").value,
    description: document.getElementById("artwork-description").value,
    dateAdded: new Date().toISOString() // Creation timestamp
  };
  
  // Initialize artworks array if it doesn't exist
  if (!currentExhibition.artworks) {
    currentExhibition.artworks = [];
  }
  
  // Add or update artwork based on editing state
  if (editingArtworkIndex >= 0) {
    // Update existing artwork
    currentExhibition.artworks[editingArtworkIndex] = artwork;
  } else {
    // Add new artwork
    currentExhibition.artworks.push(artwork);
  }
  
  // Save changes and refresh displays
  saveExhibit();
  loadArtworks(); // Refresh artworks grid
  loadAvailableArtworks(); // Refresh floor plan palette
  cancelAddArtwork(); // Hide form
}

// Load and display artworks in the artworks tab
function loadArtworks() {
  const grid = document.getElementById("artworks-grid");
  if (!grid) return;
  
  grid.innerHTML = ""; // Clear existing content
  
  // Show empty state if no artworks
  if (!currentExhibition.artworks || currentExhibition.artworks.length === 0) {
    grid.innerHTML = '<p class="empty-state">No artworks added yet. Click "Add Artwork" to get started!</p>';
    return;
  }
  
  // Create cards for each artwork
  currentExhibition.artworks.forEach((artwork, index) => {
    const card = document.createElement("div");
    card.className = "artwork-card";
    card.innerHTML = `
      <div class="artwork-info">
        <h4>${artwork.title}</h4>
        <p><strong>Artist:</strong> ${artwork.artist}</p>
        <p><strong>Year:</strong> ${artwork.year || 'Unknown'}</p>
        <p><strong>Medium:</strong> ${artwork.medium || 'Not specified'}</p>
        <p><strong>Dimensions:</strong> ${artwork.dimensions || 'Not specified'}</p>
        <p><strong>Value:</strong> ${artwork.value || 'Not specified'}</p>
        <p class="artwork-description">${artwork.description || 'No description'}</p>
      </div>
      <div class="artwork-actions">
        <button onclick="editArtwork(${index})" class="btn-primary">Edit</button>
        <button onclick="deleteArtwork(${index})" class="btn-danger">Delete</button>
      </div>
    `;
    grid.appendChild(card);
  });
}

// Edit an existing artwork - loads data into form
function editArtwork(index) {
  const artwork = currentExhibition.artworks[index];
  editingArtworkIndex = index; // Set editing mode
  
  // Fill form with artwork data
  document.getElementById("artwork-title").value = artwork.title;
  document.getElementById("artwork-artist").value = artwork.artist;
  document.getElementById("artwork-year").value = artwork.year || "";
  document.getElementById("artwork-medium").value = artwork.medium || "";
  document.getElementById("artwork-dimensions").value = artwork.dimensions || "";
  document.getElementById("artwork-value").value = artwork.value || "";
  document.getElementById("artwork-description").value = artwork.description || "";
  
  // Show form and update button text
  showAddArtworkForm();
  const addButton = document.querySelector("#artwork-form .btn-primary");
  addButton.textContent = "Update Artwork";
}

// Delete an artwork with confirmation
function deleteArtwork(index) {
  if (confirm("Are you sure you want to delete this artwork?")) {
    currentExhibition.artworks.splice(index, 1); // Remove from array
    saveExhibit(); // Save changes
    loadArtworks(); // Refresh display
    loadAvailableArtworks(); // Refresh floor plan palette
  }
}

// FLOOR PLAN MANAGEMENT
// Load available artworks into the draggable palette
function loadAvailableArtworks() {
  const container = document.getElementById("available-artworks");
  if (!container) return;
  
  container.innerHTML = ""; // Clear existing content
  
  // Show empty state if no artworks
  if (!currentExhibition.artworks || currentExhibition.artworks.length === 0) {
    container.innerHTML = '<p class="empty-state">No artworks available. Add some artworks first!</p>';
    return;
  }
  
  // Create draggable items for each artwork
  currentExhibition.artworks.forEach((artwork, index) => {
    const item = document.createElement("div");
    item.className = "artwork-item";
    item.draggable = true; // Enable drag functionality
    item.dataset.artworkIndex = index; // Store index for drag operations
    item.innerHTML = `
      <strong>${artwork.title}</strong><br>
      <small>by ${artwork.artist}</small>
    `;
    
    // Add drag start event handler
    item.addEventListener("dragstart", handleDragStart);
    container.appendChild(item);
  });
}

// Set up drag and drop functionality for the floor plan
function setupFloorPlanDragDrop() {
  const floorPlan = document.getElementById("floor-plan");
  if (!floorPlan) return;
  
  // Allow dropping on the floor plan
  floorPlan.addEventListener("dragover", function(e) {
    e.preventDefault(); // Allow drop
  });
  
  // Handle artwork drops on the floor plan
  floorPlan.addEventListener("drop", function(e) {
    e.preventDefault();
    const artworkIndex = e.dataTransfer.getData("text/plain"); // Get dragged artwork
    const artwork = currentExhibition.artworks[artworkIndex];
    
    if (!artwork) return;
    
    // Calculate drop position relative to floor plan
    const rect = floorPlan.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Place the artwork at the drop location
    placeArtworkOnFloor(artwork, x, y, artworkIndex);
  });
}

// Handle the start of a drag operation
function handleDragStart(e) {
  // Store the artwork index for the drop handler
  e.dataTransfer.setData("text/plain", e.target.dataset.artworkIndex);
}

// NEW: Load existing floor plan placements when page loads
function loadExistingFloorPlan() {
  const floorPlan = document.getElementById("floor-plan");
  if (!floorPlan || !currentExhibition.floorPlan) return;
  
  // Clear any existing placements first
  const existingPlacements = floorPlan.querySelectorAll(".artwork-placement");
  existingPlacements.forEach(p => p.remove());
  
  // Recreate all saved placements
  currentExhibition.floorPlan.forEach(placement => {
    const artwork = currentExhibition.artworks[placement.artworkIndex];
    if (artwork) {
      createArtworkPlacement(artwork, placement.x, placement.y, placement.artworkIndex);
    }
  });
}

// NEW: Helper function to create artwork placement without saving (used for loading)
function createArtworkPlacement(artwork, x, y, artworkIndex) {
  const floorPlan = document.getElementById("floor-plan");
  
  // Create placement element
  const placementElement = document.createElement("div");
  placementElement.className = "artwork-placement";
  placementElement.style.left = x + "px";
  placementElement.style.top = y + "px";
  placementElement.style.position = "absolute";
  placementElement.style.cursor = "move";
  placementElement.style.zIndex = "10";
  placementElement.dataset.artworkIndex = artworkIndex;
  placementElement.innerHTML = `
    <div class="placement-title">${artwork.title}</div>
    <div class="placement-artist">${artwork.artist}</div>
    <button class="remove-placement" onclick="removePlacement(this)">×</button>
  `;
  
  // Add drag functionality for repositioning
  let isDragging = false;
  let startX, startY, initialX, initialY;
  
  // Start dragging when mouse is pressed
  placementElement.addEventListener("mousedown", function(e) {
    if (e.target.classList.contains('remove-placement')) {
      return; // Don't drag if clicking remove button
    }
    
    isDragging = true;
    startX = e.clientX;
    startY = e.clientY;
    initialX = placementElement.offsetLeft;
    initialY = placementElement.offsetTop;
    
    // Visual feedback during drag
    placementElement.style.opacity = "0.8";
    placementElement.style.zIndex = "20";
    
    e.preventDefault(); // Prevent text selection
  });
  
  // Handle dragging movement
  document.addEventListener("mousemove", function(e) {
    if (!isDragging) return;
    
    e.preventDefault();
    
    // Calculate new position
    const newX = initialX + (e.clientX - startX);
    const newY = initialY + (e.clientY - startY);
    
    // Keep within floor plan bounds
    const maxX = floorPlan.offsetWidth - placementElement.offsetWidth;
    const maxY = floorPlan.offsetHeight - placementElement.offsetHeight;
    
    const boundedX = Math.max(0, Math.min(newX, maxX));
    const boundedY = Math.max(0, Math.min(newY, maxY));
    
    // Update position
    placementElement.style.left = boundedX + "px";
    placementElement.style.top = boundedY + "px";
  });
  
  // Finish dragging when mouse is released
  document.addEventListener("mouseup", function(e) {
    if (!isDragging) return;
    
    isDragging = false;
    // Reset visual feedback
    placementElement.style.opacity = "1";
    placementElement.style.zIndex = "10";
    
    // Save new position
    updateFloorPlanPosition(artworkIndex, placementElement.offsetLeft, placementElement.offsetTop);
  });
  
  floorPlan.appendChild(placementElement);
}

// IMPROVED: Enhanced placeArtworkOnFloor function with full drag-and-drop control
function placeArtworkOnFloor(artwork, x, y, artworkIndex) {
  const floorPlan = document.getElementById("floor-plan");
  
  // Create placement element with drag functionality
  const placement = document.createElement("div");
  placement.className = "artwork-placement";
  placement.style.left = x + "px";
  placement.style.top = y + "px";
  placement.style.position = "absolute";
  placement.style.cursor = "move";
  placement.style.zIndex = "10";
  placement.dataset.artworkIndex = artworkIndex;
  placement.innerHTML = `
    <div class="placement-title">${artwork.title}</div>
    <div class="placement-artist">${artwork.artist}</div>
    <button class="remove-placement" onclick="removePlacement(this)">×</button>
  `;
  
  // Make it draggable within the floor plan with improved handling
  let isDragging = false;
  let startX, startY, initialX, initialY;
  
  // Start dragging
  placement.addEventListener("mousedown", function(e) {
    // Don't start dragging if clicking the remove button
    if (e.target.classList.contains('remove-placement')) {
      return;
    }
    
    isDragging = true;
    startX = e.clientX;
    startY = e.clientY;
    initialX = placement.offsetLeft;
    initialY = placement.offsetTop;
    
    // Visual feedback
    placement.style.opacity = "0.8";
    placement.style.zIndex = "20";
    
    // Prevent text selection during drag
    e.preventDefault();
  });
  
  // Handle dragging
  document.addEventListener("mousemove", function(e) {
    if (!isDragging) return;
    
    e.preventDefault();
    
    const floorPlanRect = floorPlan.getBoundingClientRect();
    const newX = initialX + (e.clientX - startX);
    const newY = initialY + (e.clientY - startY);
    
    // Keep placement within bounds of floor plan
    const maxX = floorPlan.offsetWidth - placement.offsetWidth;
    const maxY = floorPlan.offsetHeight - placement.offsetHeight;
    
    const boundedX = Math.max(0, Math.min(newX, maxX));
    const boundedY = Math.max(0, Math.min(newY, maxY));
    
    placement.style.left = boundedX + "px";
    placement.style.top = boundedY + "px";
  });
  
  // Finish dragging
  document.addEventListener("mouseup", function(e) {
    if (!isDragging) return;
    
    isDragging = false;
    // Reset visual feedback
    placement.style.opacity = "1";
    placement.style.zIndex = "10";
    
    // Update floor plan data with new position
    updateFloorPlanPosition(artworkIndex, placement.offsetLeft, placement.offsetTop);
  });
  
  floorPlan.appendChild(placement);
  
  // Save floor plan data
  if (!currentExhibition.floorPlan) {
    currentExhibition.floorPlan = [];
  }
  
  // Add placement to floor plan data
  currentExhibition.floorPlan.push({
    artworkIndex: parseInt(artworkIndex),
    x: x,
    y: y,
    artworkId: artwork.id
  });
  
  saveExhibit(); // Save changes
}

// NEW: Function to update floor plan positions when artworks are moved
function updateFloorPlanPosition(artworkIndex, newX, newY) {
  if (!currentExhibition.floorPlan) return;
  
  // Find and update the placement data
  const placement = currentExhibition.floorPlan.find(p => p.artworkIndex === parseInt(artworkIndex));
  if (placement) {
    placement.x = newX;
    placement.y = newY;
    saveExhibit(); // Save changes
  }
}

// Remove an artwork placement from the floor plan
function removePlacement(button) {
  const placement = button.parentElement;
  const artworkIndex = placement.dataset.artworkIndex;
  
  // Remove from floor plan data
  if (currentExhibition.floorPlan) {
    currentExhibition.floorPlan = currentExhibition.floorPlan.filter(
      p => p.artworkIndex !== parseInt(artworkIndex)
    );
  }
  
  placement.remove(); // Remove from DOM
  saveExhibit(); // Save changes
}

// Clear all artwork placements from the floor plan
function clearFloorPlan() {
  if (confirm("Are you sure you want to clear the floor plan?")) {
    const floorPlan = document.getElementById("floor-plan");
    const placements = floorPlan.querySelectorAll(".artwork-placement");
    placements.forEach(p => p.remove()); // Remove from DOM
    
    currentExhibition.floorPlan = []; // Clear data
    saveExhibit(); // Save changes
  }
}

// Placeholder function for blueprint upload feature
function uploadBlueprint() {
  alert("Blueprint upload feature coming soon! For now, you can use the default gallery layout.");
}

// Placeholder function for floor plan export feature
function exportFloorPlan() {
  alert("Floor plan export feature coming soon! Your layout is automatically saved.");
}

// TASK MANAGEMENT
// Show the add task form
function showAddTaskForm() {
  document.getElementById("task-form").style.display = "block";
  editingTaskIndex = -1; // Reset to new task mode
  clearTaskForm(); // Clear form fields
}

// Hide the add task form
function cancelAddTask() {
  document.getElementById("task-form").style.display = "none";
  editingTaskIndex = -1; // Reset editing state
  clearTaskForm(); // Clear form fields
}

// Clear all task form fields and reset button state
function clearTaskForm() {
  // Clear all input fields
  document.getElementById("task-title").value = "";
  document.getElementById("task-priority").value = "medium";
  document.getElementById("task-deadline").value = "";
  document.getElementById("task-category").value = "setup";
  document.getElementById("task-description").value = "";
  
  // Reset button text to "Add" mode
  const addButton = document.querySelector("#task-form .btn-primary");
  addButton.textContent = "Add Task";
  addButton.onclick = addTaskToExhibit;
}

// Add or update task in the exhibition
function addTaskToExhibit() {
  const title = document.getElementById("task-title").value.trim();
  
  if (!title) {
    alert("Please enter a task title.");
    return;
  }
  
  const deadlineValue = document.getElementById("task-deadline").value;
  
  // Create task object with form data
  const task = {
    id: Date.now(), // Unique ID based on timestamp
    title: title,
    priority: document.getElementById("task-priority").value,
    deadline: deadlineValue ? new Date(deadlineValue).toISOString() : "", // Convert to ISO string
    category: document.getElementById("task-category").value,
    description: document.getElementById("task-description").value,
    completed: false, // New tasks start incomplete
    dateCreated: new Date().toISOString() // Creation timestamp
  };
  
  // Initialize tasks array if it doesn't exist
  if (!currentExhibition.tasks) {
    currentExhibition.tasks = [];
  }
  
  // Add or update task based on editing state
  if (editingTaskIndex >= 0) {
    // Update existing task (preserve completion status)
    task.completed = currentExhibition.tasks[editingTaskIndex].completed;
    currentExhibition.tasks[editingTaskIndex] = task;
  } else {
    // Add new task
    currentExhibition.tasks.push(task);
  }
  
  // Save changes and refresh displays
  saveExhibit();
  loadTasks(); // Refresh tasks list
  cancelAddTask(); // Hide form
}

// Load and display tasks in the tasks tab
function loadTasks() {
  const container = document.getElementById("tasks-list");
  if (!container) return;
  
  container.innerHTML = ""; // Clear existing content
  
  // Show empty state if no tasks
  if (!currentExhibition.tasks || currentExhibition.tasks.length === 0) {
    container.innerHTML = '<p class="empty-state">No tasks added yet. Click "Add Task" to get started!</p>';
    return;
  }
  
  // Create items for each task
  currentExhibition.tasks.forEach((task, index) => {
    const item = document.createElement("div");
    item.className = `task-item ${task.completed ? 'completed' : ''}`;
    
    // Check if task is overdue
    const isOverdue = task.deadline && new Date(task.deadline) < new Date() && !task.completed;
    
    // Format the deadline using DD/MM/YYYY
    const formattedDeadline = task.deadline ? formatDateForDisplay(task.deadline) : '';
    
    // Build task item HTML
    item.innerHTML = `
      <div class="task-info">
        <h4>${task.title}</h4>
        <p><strong>Priority:</strong> <span class="priority-${task.priority}">${task.priority}</span
        <p><strong>Category:</strong> ${task.category}</p>
       ${task.deadline ? `<p class="task-deadline ${isOverdue ? 'overdue' : ''}">Due: ${formattedDeadline}</p>` : ''}
       <p class="task-description">${task.description || 'No description'}</p>
     </div>
     <div class="task-actions">
       <button onclick="toggleTaskComplete(${index})" class="btn-toggle">
         ${task.completed ? 'Mark Incomplete' : 'Mark Complete'}
       </button>
       <button onclick="editTask(${index})" class="btn-primary">Edit</button>
       <button onclick="deleteTask(${index})" class="btn-danger">Delete</button>
     </div>
   `;
   
   container.appendChild(item);
 });
}

// Toggle task completion status
function toggleTaskComplete(index) {
 // Flip the completed status
 currentExhibition.tasks[index].completed = !currentExhibition.tasks[index].completed;
 saveExhibit(); // Save changes
 loadTasks(); // Refresh display
}

// Edit an existing task - loads data into form
function editTask(index) {
 const task = currentExhibition.tasks[index];
 editingTaskIndex = index; // Set editing mode
 
 // Fill form with task data
 document.getElementById("task-title").value = task.title;
 document.getElementById("task-priority").value = task.priority;
 document.getElementById("task-deadline").value = formatDateForInput(task.deadline); // Convert for date input
 document.getElementById("task-category").value = task.category;
 document.getElementById("task-description").value = task.description || "";
 
 // Show form and update button text
 showAddTaskForm();
 const addButton = document.querySelector("#task-form .btn-primary");
 addButton.textContent = "Update Task";
}

// Delete a task with confirmation
function deleteTask(index) {
 if (confirm("Are you sure you want to delete this task?")) {
   currentExhibition.tasks.splice(index, 1); // Remove from array
   saveExhibit(); // Save changes
   loadTasks(); // Refresh display
 }
}

// SETTINGS
// Delete the entire exhibition with confirmation
function deleteExhibition() {
 if (confirm("Are you sure you want to delete this exhibition? This action cannot be undone.")) {
   // Get all exhibitions and filter out the current one
   const exhibitions = getExhibitions();
   const filteredExhibitions = exhibitions.filter(ex => ex.id !== currentExhibition.id);
   saveExhibitions(filteredExhibitions); // Save updated list
   
   // Clear current exhibition from localStorage
   localStorage.removeItem("currentExhibition");
   
   // Redirect to dashboard
   window.location.href = "dashboard.html";
 }
}
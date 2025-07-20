// Debug log to confirm renderer script has loaded
console.log("Renderer loaded!");

// Use Node.js modules for file operations (Electron-specific)
const { ipcRenderer } = require('electron');

// User management with file persistence
// Retrieves all users from the main process via IPC (Inter-Process Communication)
async function getUsers() {
  try {
    // Call main process to get users data from file system
    const users = await ipcRenderer.invoke('get-users');
    return users || {}; // Return users object or empty object if none exist
  } catch (error) {
    console.error("Error getting users:", error);
    return {}; // Return empty object on error
  }
}

// Saves a new user to the file system via main process
async function saveUser(username, password) {
  try {
    // Create user data object with password and metadata
    const userData = {
      password: password, // Store password (in production, this should be hashed)
      dateCreated: new Date().toISOString(), // Account creation timestamp
      exhibitions: [] // Initialize empty exhibitions array for this user
    };
    
    // Send user data to main process for file storage
    const success = await ipcRenderer.invoke('save-user', username, userData);
    if (success) {
      console.log(`User ${username} saved successfully`);
      return true; // Indicate successful save
    }
    return false; // Indicate save failure
  } catch (error) {
    console.error("Error saving user:", error);
    return false; // Return false on error
  }
}

// Verifies user credentials by checking against stored data
async function verifyUser(username, password) {
  try {
    const users = await getUsers(); // Get all users from storage
    // Check if user exists and password matches
    return users[username] && users[username].password === password;
  } catch (error) {
    console.error("Error verifying user:", error);
    return false; // Return false on error (deny access)
  }
}

// Password validation (same as before)
// Checks password against various security requirements
function validatePassword(password) {
  return {
    length: password.length >= 8, // Minimum 8 characters
    uppercase: /[A-Z]/.test(password), // Contains uppercase letter
    lowercase: /[a-z]/.test(password), // Contains lowercase letter
    number: /\d/.test(password), // Contains digit
    special: /[!@#$%^&*(),.?":{}|<>]/.test(password) // Contains special character
  };
}

// Determines if password meets all security requirements
function isPasswordValid(password) {
  const req = validatePassword(password);
  // All requirements must be true for password to be valid
  return req.length && req.uppercase && req.lowercase && req.number && req.special;
}

// UI state tracking
let registerMode = false; // Tracks whether interface is in registration mode

// Switches interface to registration mode
function showRegisterMode() {
  registerMode = true; // Set state flag
  
  // Get UI elements for modification
  const loginBtn = document.getElementById("login-btn");
  const registerBtn = document.getElementById("register-btn");
  const loginMsg = document.getElementById("login-msg");
  
  // Change button text and styling for registration mode
  loginBtn.textContent = "Back to Login";
  loginBtn.style.backgroundColor = "#6c757d"; // Gray color for back button
  registerBtn.textContent = "Create Account";
  registerBtn.style.backgroundColor = "#28a745"; // Green color for create button
  
  // Display password requirements to user
  loginMsg.innerHTML = `
    <div style="text-align: left; margin-top: 10px; padding: 10px; background: #f8f9fa; border-radius: 5px; font-size: 12px;">
      <strong>Password Requirements:</strong><br>
      • At least 8 characters<br>
      • At least one uppercase letter<br>
      • At least one lowercase letter<br>
      • At least one number<br>
      • At least one special character (!@#$%^&*)
    </div>
  `;
  loginMsg.style.color = "#666"; // Gray text for informational message
  
  // Clear input fields when switching modes
  document.getElementById("username").value = "";
  document.getElementById("password").value = "";
}

// Switches interface back to login mode
function showLoginMode() {
  registerMode = false; // Reset state flag
  
  // Get UI elements for modification
  const loginBtn = document.getElementById("login-btn");
  const registerBtn = document.getElementById("register-btn");
  const loginMsg = document.getElementById("login-msg");
  
  // Reset button text and styling for login mode
  loginBtn.textContent = "Log In";
  loginBtn.style.backgroundColor = "#007aff"; // Blue color for login
  registerBtn.textContent = "Register";
  registerBtn.style.backgroundColor = "#007aff"; // Blue color for register
  
  // Clear any messages
  loginMsg.textContent = "";
}

// Event handlers
// Login button click handler - handles both login and "back to login" actions
document.getElementById("login-btn").addEventListener("click", async () => {
  // If in register mode, just switch back to login mode
  if (registerMode) {
    showLoginMode();
    return;
  }
  
  // Get user input values
  const user = document.getElementById("username").value.trim();
  const pass = document.getElementById("password").value;
  
  // Validate that both fields are filled
  if (!user || !pass) {
    document.getElementById("login-msg").textContent = "Please enter username and password.";
    document.getElementById("login-msg").style.color = "#d33"; // Red color for error
    return;
  }

  // Verify user credentials against stored data
  const isValid = await verifyUser(user, pass);
  if (isValid) {
    // Store logged-in user in localStorage for session management
    localStorage.setItem("loggedInUser", user);
    // Redirect to main dashboard on successful login
    window.location.href = "dashboard.html";
  } else {
    // Show error message for invalid credentials
    document.getElementById("login-msg").textContent = "Incorrect username or password.";
    document.getElementById("login-msg").style.color = "#d33"; // Red color for error
  }
});

// Register button click handler - handles both mode switch and account creation
document.getElementById("register-btn").addEventListener("click", async () => {
  // If not in register mode, switch to register mode
  if (!registerMode) {
    showRegisterMode();
    return;
  }
  
  // Get user input values
  const user = document.getElementById("username").value.trim();
  const pass = document.getElementById("password").value;
  
  // Validate that both fields are filled
  if (!user || !pass) {
    document.getElementById("login-msg").textContent = "Please enter username and password.";
    document.getElementById("login-msg").style.color = "#d33"; // Red color for error
    return;
  }
  
  // Validate username length (minimum 3 characters)
  if (user.length < 3) {
    document.getElementById("login-msg").textContent = "Username must be at least 3 characters.";
    document.getElementById("login-msg").style.color = "#d33"; // Red color for error
    return;
  }
  
  // Validate password meets security requirements
  if (!isPasswordValid(pass)) {
    document.getElementById("login-msg").textContent = "Password does not meet requirements.";
    document.getElementById("login-msg").style.color = "#d33"; // Red color for error
    return;
  }

  // Check if username already exists
  const users = await getUsers();
  if (users[user]) {
    // Username taken - show error
    document.getElementById("login-msg").textContent = "Username already exists.";
    document.getElementById("login-msg").style.color = "#d33"; // Red color for error
  } else {
    // Attempt to create new user account
    const success = await saveUser(user, pass);
    if (success) {
      // Account created successfully
      document.getElementById("login-msg").textContent = "Account created! You can now log in.";
      document.getElementById("login-msg").style.color = "#28a745"; // Green color for success
      
      // Auto-switch back to login mode after 2 seconds and pre-fill username
      setTimeout(() => {
        showLoginMode();
        document.getElementById("username").value = user; // Pre-fill username
        document.getElementById("password").value = ""; // Clear password field
      }, 2000);
    } else {
      // Account creation failed
      document.getElementById("login-msg").textContent = "Error creating account.";
      document.getElementById("login-msg").style.color = "#d33"; // Red color for error
    }
  }
});

// Enter key support for form submission
document.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    // Submit appropriate form based on current mode
    if (registerMode) {
      document.getElementById("register-btn").click(); // Trigger registration
    } else {
      document.getElementById("login-btn").click(); // Trigger login
    }
  }
});
// script.js

// Initialize necessary variables
let deviceIntervals = {}; // Interval timers for each device (for updating timers)
let currentDeviceStates = {}; // Placeholder for state-tracking (currently unused)
let currentCampus; // Variable to store the current campus (DCA or IAD)

// Function to load Firebase config from localFirebase.json
function loadFirebaseConfig() {
  return fetch("localFirebase.json") // Fetch the Firebase configuration from localFirebase.json
    .then((response) => response.json()) // Parse the JSON file
    .then((config) => {
      // Initialize Firebase with the loaded config
      firebase.initializeApp(config);
      return config;
    })
    .catch((error) => {
      console.error("Error loading Firebase config:", error);
      throw error; // Re-throw the error after logging it
    });
}

// Function to show/hide content based on selected tab and authentication status
const showTabContent = (tab) => {
  const adminContent = document.getElementById("admin-content");
  const devicesContainer = document.getElementById("deviceAccordion");
  const loginForm = document.getElementById("login-form");
  const signupForm = document.getElementById("signup-form");
  const logoutNavItem = document.getElementById("logout-nav-item");

  const user = firebase.auth().currentUser;

  if (user) {
    // User is authenticated
    loginForm.style.display = "none";
    signupForm.style.display = "none";
    logoutNavItem.style.display = "block";

    if (tab === "Admin") {
      adminContent.style.display = "block";
      devicesContainer.style.display = "none";
      // Load admin content
      loadEmailAddresses();
    } else {
      adminContent.style.display = "none";
      devicesContainer.style.display = "block";
      // Load devices for the selected campus
      loadDevices();
    }
  } else {
    // User is not authenticated
    loginForm.style.display = "block";
    signupForm.style.display = "none";
    adminContent.style.display = "none";
    devicesContainer.style.display = "none";
    logoutNavItem.style.display = "none";
  }
};

// Function to start the application
function startApp() {
  // Set the campus based on URL parameter or default to DCA
  currentCampus = getCampusFromURL();
  setActiveTab(currentCampus);

  // Event listeners for campus tab switching
  const dcaTab = document.getElementById("dca-tab");
  const iadTab = document.getElementById("iad-tab");
  const adminTab = document.getElementById("admin-tab");

  if (dcaTab) {
    dcaTab.addEventListener("click", () => {
      currentCampus = "DCA";
      setActiveTab(currentCampus);
    });
  }

  if (iadTab) {
    iadTab.addEventListener("click", () => {
      currentCampus = "IAD";
      setActiveTab(currentCampus);
    });
  }

  if (adminTab) {
    adminTab.addEventListener("click", () => {
      setActiveTab("Admin");
    });
  }

  // Event listeners for adding emails
  const addEmailButtonDCA = document.getElementById("addEmailButtonDCA");
  const addEmailButtonIAD = document.getElementById("addEmailButtonIAD");

  if (addEmailButtonDCA) {
    addEmailButtonDCA.addEventListener("click", () => addEmailAddress("DCA"));
  }

  if (addEmailButtonIAD) {
    addEmailButtonIAD.addEventListener("click", () => addEmailAddress("IAD"));
  }

// Login Logic
const loginButton = document.getElementById("login-button");
if (loginButton) {
  loginButton.addEventListener("click", () => {
    const email = document.getElementById("login-email").value;
    const password = document.getElementById("login-password").value;

    firebase
      .auth()
      .signInWithEmailAndPassword(email, password)
      .then(() => {
        console.log("Logged in successfully");
        setActiveTab(currentCampus); // Update the UI after login
      })
      .catch((error) => {
        console.error("Login failed:", error);
        if (error.code === 'auth/user-disabled') {
          alert('Your account has been disabled. Please contact support.');
        } else {
          alert('Login failed: ' + error.message);
        }
      });
  });
}

  // Logout Logic for the Logout link in the navbar
  const logoutLink = document.getElementById("logout-link");
  if (logoutLink) {
    logoutLink.addEventListener("click", (event) => {
      event.preventDefault(); // Prevent default link behavior
      firebase
        .auth()
        .signOut()
        .then(() => {
          console.log("Logged out successfully");
          setActiveTab(currentCampus); // Update the UI after logout
        })
        .catch((error) => {
          console.error("Logout failed:", error);
          alert("Logout failed: " + error.message);
        });
    });
  }

  // Event listener for the sign-up button
  const signupButton = document.getElementById("signup-button");
  if (signupButton) {
    signupButton.addEventListener("click", () => {
      document.getElementById("login-form").style.display = "none";
      document.getElementById("signup-form").style.display = "block";
    });
  }

  // Event listener for back to login button
  const backToLoginButton = document.getElementById("back-to-login-button");
  if (backToLoginButton) {
    backToLoginButton.addEventListener("click", () => {
      document.getElementById("signup-form").style.display = "none";
      document.getElementById("login-form").style.display = "block";
    });
  }

// Sign-up Logic
const createAccountButton = document.getElementById('create-account-button');
if (createAccountButton) {
  createAccountButton.addEventListener('click', () => {
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;

    // Commented out the client-side check
    // if (!email.endsWith('@mwaa.com')) {
    //   alert('Only MWAA email addresses are allowed.');
    //   return;
    // }

    firebase
      .auth()
      .createUserWithEmailAndPassword(email, password)
      .then(() => {
        console.log('Account created successfully');
        alert('Account created successfully. Please check your email for further instructions.');
        // Sign out the user to force a login attempt
        firebase.auth().signOut();
        // Redirect to login form
        document.getElementById("signup-form").style.display = "none";
        document.getElementById("login-form").style.display = "block";
      })
      .catch((error) => {
        console.error('Account creation failed:', error);
        alert('Account creation failed: ' + error.message);
      });
  });
}

  // Monitor authentication state and update UI accordingly
firebase.auth().onAuthStateChanged((user) => {
  if (user) {
    // User is signed in
    setActiveTab(currentCampus);
  } else {
    // User is signed out
    showTabContent('login');
  }
});
}

// Function to set the active tab and update the URL
const setActiveTab = (tab) => {
  document.querySelectorAll(".nav-link").forEach((link) => {
    link.classList.remove("active");
  });
  document.getElementById(`${tab.toLowerCase()}-tab`).classList.add("active");

  history.pushState({}, "", `?campus=${tab}`);

  showTabContent(tab);
};

// Function to load email addresses for both campuses in the admin tab
const loadEmailAddresses = () => {
  const emailListDCA = document.getElementById("emailListDCA");
  const emailListIAD = document.getElementById("emailListIAD");
  emailListDCA.innerHTML = ""; // Clear existing emails for DCA
  emailListIAD.innerHTML = ""; // Clear existing emails for IAD

  const emailsRef = firebase.database().ref(`/alertEmails`);
  emailsRef.once("value", (snapshot) => {
    const emails = snapshot.val();

    if (emails) {
      // Load emails for DCA
      Object.entries(emails.DCA || {}).forEach(([key, email]) => {
        const listItem = createEmailListItem(email, key, "DCA");
        emailListDCA.appendChild(listItem);
      });

      // Load emails for IAD
      Object.entries(emails.IAD || {}).forEach(([key, email]) => {
        const listItem = createEmailListItem(email, key, "IAD");
        emailListIAD.appendChild(listItem);
      });
    }
  });
};

// Function to create a list item for an email address
const createEmailListItem = (email, key, campus) => {
  const listItem = document.createElement("li");
  listItem.className =
    "list-group-item d-flex justify-content-between align-items-center";
  listItem.textContent = email;

  const removeButton = document.createElement("button");
  removeButton.className = "btn btn-danger btn-sm";
  removeButton.textContent = "Remove";
  removeButton.onclick = () => removeEmail(key, campus);

  listItem.appendChild(removeButton);
  return listItem;
};

// Function to add a new email address based on campus
const addEmailAddress = (campus) => {
  const newEmailInput = document.getElementById(`newEmail${campus}`);
  const newEmail = newEmailInput.value.trim();
  if (newEmail) {
    const emailsRef = firebase.database().ref(`/alertEmails/${campus}`);
    emailsRef.push(newEmail, () => {
      newEmailInput.value = ""; // Clear input field
      loadEmailAddresses(); // Refresh email list
    });
  } else {
    alert('Please enter a valid email address.');
  }
};

// Function to remove an email address based on campus
const removeEmail = (emailKey, campus) => {
  const emailsRef = firebase
    .database()
    .ref(`/alertEmails/${campus}/${emailKey}`);
  emailsRef.remove(() => {
    loadEmailAddresses(); // Refresh email list
  });
};

// Attach event listeners to each device card for showing outage logs
const attachCardEventListeners = () => {
  document.querySelectorAll(".device-card").forEach((card) => {
    card.addEventListener("click", (event) => {
      const deviceID = event.currentTarget.getAttribute("data-id");
      showOutageLogs(deviceID);
    });
  });
};

// Load and display devices for the selected campus (DCA or IAD)
const loadDevices = () => {
  const user = firebase.auth().currentUser;
  if (!user) {
    console.error("User not authenticated, cannot load devices.");
    return;
  }

  const db = firebase.database();
  const devicesRef = db.ref(`/devices/${currentCampus}`);

  devicesRef.on("value", (snapshot) => {
    const devices = snapshot.val();
    const devicesContainer = document.getElementById("deviceAccordion");
    devicesContainer.innerHTML = ""; // Clear existing devices

    const deviceTypes = {
      elevator: "Elevators",
      escalator: "Escalators",
      sidewalk: "Moving Sidewalks",
    };

    const groupedDevices = {
      elevator: [],
      escalator: [],
      sidewalk: [],
    };

    // Group devices by type
    for (let type in devices) {
      type = type.toLowerCase(); // Normalize type to lowercase
      if (!groupedDevices[type]) continue; // Skip if type is not recognized
      for (const deviceID in devices[type]) {
        const device = devices[type][deviceID];
        groupedDevices[type].push({ type, deviceID, ...device });
      }
    }

    // Display devices by type using accordion
    for (const type in groupedDevices) {
      if (groupedDevices[type].length > 0) {
        // Sort devices so that online devices come first
        groupedDevices[type].sort((a, b) => {
          const getStatusValue = (device) => {
            if (!device.monitored) return 2; // Unmonitored devices last
            if (device.power && !device.alarm) return 0; // Online devices first
            return 1; // Offline devices in between
          };

          return getStatusValue(a) - getStatusValue(b);
        });

        const accordionItem = document.createElement('div');
        accordionItem.classList.add('accordion-item');
        accordionItem.setAttribute('data-type', type);

        const headingId = `heading-${type}`;
        const collapseId = `collapse-${type}`;
        const isExpanded = true; // Open by default
        const showClass = isExpanded ? 'show' : '';

        // Count online devices
        const onlineCount = groupedDevices[type].filter(
          (device) => device.monitored && device.power && !device.alarm
        ).length;
        const totalCount = groupedDevices[type].length;

        // Create accordion header and body
        accordionItem.innerHTML = `
          <h2 class="accordion-header" id="${headingId}">
            <button class="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#${collapseId}" aria-expanded="${isExpanded}" aria-controls="${collapseId}">
              ${deviceTypes[type]}<span class="lead"> (${onlineCount} of ${totalCount} online)</span>
            </button>
          </h2>
          <div id="${collapseId}" class="accordion-collapse collapse ${showClass}" aria-labelledby="${headingId}" data-bs-parent="#deviceAccordion">
            <div class="accordion-body">
              <div class="row"></div>
            </div>
          </div>
        `;

        devicesContainer.appendChild(accordionItem);

        const rowDiv = accordionItem.querySelector('.row');

        // Create a card for each device and display its status
        groupedDevices[type].forEach((device) => {
          const deviceID = device.deviceID;
          const isMonitored = device.monitored;
          const deviceStatus =
            isMonitored && device.power && !device.alarm ? "online" : "offline";
          const timeLabel =
            deviceStatus === "online" ? "Time Online" : "Time Offline";
          const lastStatusChangeTimestamp = device.lastStatusChangeTimestamp;
          const lastStatusCheckTimestamp = device.last_statuscheck_timestamp;

          // Create device card
          const deviceDiv = document.createElement("div");
          deviceDiv.classList.add("device-card");
          deviceDiv.setAttribute("data-id", deviceID);

          // Prepare extra info HTML if device is monitored
          let extraInfoHTML = '';
          if (isMonitored) {
            extraInfoHTML = `
              <p class="card-text extra-info">
                <small class="text-muted">Hours Uptime this Month:</small> <span id="uptime-hours-${deviceID}">${device.currentMonthUptime ? device.currentMonthUptime.uptimeHours : "N/A"}</span><br>
                <small class="text-muted">% Uptime this Month:</small> <span id="uptime-percentage-${deviceID}">${device.currentMonthUptime ? device.currentMonthUptime.uptimePercentage : "N/A"}</span>%<br>
                <small class="text-muted" id="last-reading-${deviceID}">Last sensor reading: ${new Date(lastStatusCheckTimestamp * 1000).toLocaleString()}</small>
              </p>
            `;
          }

          // Build the card HTML
          deviceDiv.innerHTML = `
            <div class="card device ${isMonitored ? deviceStatus : "unmonitored"}">
              <div class="card-body">
                <h4 class="card-title">${deviceID}</h4>
                <p class="card-text small text-muted">${device.location || "Location unknown"}</p>
                <p class="card-text">
                  <strong>Power:</strong> <span class="power-indicator" style="color: ${
                    isMonitored ? (device.power ? "green" : "red") : "grey"
                  };"><i class="fas fa-circle"></i></span><br>
                  <strong>Alarm:</strong> <span class="alarm-indicator" style="color: ${
                    isMonitored ? (device.alarm ? "red" : "green") : "grey"
                  };"><i class="fas fa-circle"></i></span><br>
                  <strong>${timeLabel}:</strong> <span id="timer-${deviceID}">${
                    isMonitored ? "" : "-"
                  }</span>
                </p>
                ${extraInfoHTML}
              </div>
            </div>
          `;

          // Append the device card to the row
          rowDiv.appendChild(deviceDiv);

          // Set up interval to update timer and status
          if (isMonitored) {
            if (deviceIntervals[deviceID]) {
              clearInterval(deviceIntervals[deviceID]);
            }

            deviceIntervals[deviceID] = setInterval(() => {
              const now = Math.floor(Date.now() / 1000);
              const uptime = now - lastStatusChangeTimestamp;
              const days = Math.floor(uptime / (24 * 3600));
              const hours = Math.floor((uptime % (24 * 3600)) / 3600);
              const minutes = Math.floor((uptime % 3600) / 60);
              const seconds = uptime % 60;

              const timerElement = deviceDiv.querySelector(`#timer-${deviceID}`);
              if (timerElement) {
                timerElement.innerText = `${days}d ${hours}h ${minutes}m ${seconds}s`;
              }

              // Update power and alarm indicators
              const powerIndicator = deviceDiv.querySelector(".power-indicator");
              const alarmIndicator = deviceDiv.querySelector(".alarm-indicator");

              powerIndicator.style.color = device.power ? "green" : "red";
              alarmIndicator.style.color = device.alarm ? "red" : "green";

              // Update last sensor reading
              const lastReadingElement = deviceDiv.querySelector(`#last-reading-${deviceID}`);
              if (lastReadingElement) {
                lastReadingElement.innerText = `Last sensor reading: ${new Date(lastStatusCheckTimestamp * 1000).toLocaleString()}`;
              }

              // Highlight card if sensor is offline (no data for over 90 seconds)
              const cardElement = deviceDiv.querySelector(".card");
              if (now - lastStatusCheckTimestamp > 90) {
                cardElement.classList.add("sensor-offline-box");
              } else {
                cardElement.classList.remove("sensor-offline-box");
              }
            }, 1000);
          }
        });
      }
    }

    // Attach event listeners to the device cards for showing outage logs
    attachCardEventListeners();
  }, (error) => {
    console.error("Error loading devices:", error);
    if (error.code === 'PERMISSION_DENIED') {
      alert('You do not have permission to access this data.');
      firebase.auth().signOut(); // Optionally sign out the user
    }
  });
};

// Function to show outage logs in a modal
const showOutageLogs = (deviceID) => {
  const outageLogList = document.getElementById("outageLogList");
  const modalDeviceID = document.getElementById("modalDeviceID");

  // Clear previous logs
  outageLogList.innerHTML = '';
  modalDeviceID.textContent = deviceID;

  // Reference to the outage logs in Firebase
  const outageLogsRef = firebase.database().ref(`/outageLogs/${currentCampus}/elevator/${deviceID}/outages`).limitToLast(10);
  outageLogsRef.once("value", (snapshot) => {
    const outages = snapshot.val();

    if (outages) {
      // Iterate over each outage and display the details
      Object.entries(outages).forEach(([key, outage]) => {
        const start = new Date(outage.start * 1000).toLocaleString();
        const end = outage.end ? new Date(outage.end * 1000).toLocaleString() : 'Ongoing';
        const duration = outage.end ? (outage.end - outage.start) : (Math.floor(Date.now() / 1000) - outage.start);
        const hours = Math.floor(duration / 3600);
        const minutes = Math.floor((duration % 3600) / 60);
        const seconds = duration % 60;

        const listItem = document.createElement("li");
        listItem.className = "list-group-item";
        listItem.innerHTML = `<strong>Start:</strong> ${start} <br> 
                              <strong>End:</strong> ${end} <br> 
                              <strong>Duration:</strong> ${hours}h ${minutes}m ${seconds}s`;

        outageLogList.appendChild(listItem);
      });
    } else {
      // No outages recorded
      const listItem = document.createElement("li");
      listItem.className = "list-group-item";
      listItem.textContent = "No recorded outages.";
      outageLogList.appendChild(listItem);
    }

    // Show the modal
    const outageLogModal = new bootstrap.Modal(document.getElementById('outageLogModal'));
    outageLogModal.show();
  });
};

// Function to get the campus from the URL parameters
const getCampusFromURL = () => {
  const params = new URLSearchParams(window.location.search);
  return params.get("campus") || "DCA"; // Default to DCA if no campus is specified
};

// Ensure the DOM is fully loaded before executing any scripts
document.addEventListener("DOMContentLoaded", function () {
  // Ensure the Firebase config is loaded and initialized first
  loadFirebaseConfig()
    .then(() => {
      console.log("Firebase config loaded and initialized.");
      startApp(); // Start the application
    })
    .catch((err) => {
      console.error("Failed to initialize Firebase:", err);
    });
});

// script.js

// Global variables
let deviceIntervals = {}; // Interval timers for each device (for updating timers)
let devicesRef; // Reference to the devices in Firebase
let devicesListener; // Listener for the devices reference

// Function to load Firebase config from localFirebase.json
function loadFirebaseConfig() {
  return fetch('localFirebase.json')
    .then((response) => response.json())
    .then((config) => {
      if (!firebase.apps.length) {
        firebase.initializeApp(config);
      }
      return config;
    })
    .catch((error) => {
      console.error('Error loading Firebase config:', error);
      throw error; // Re-throw the error after logging it
    });
}

// No campus selection; devices are loaded directly from the root

// Load and display devices
const loadDevices = () => {
  const db = firebase.database();

  // Remove any existing listener
  if (devicesRef && devicesListener) {
    devicesRef.off('value', devicesListener);
  }

  devicesRef = db.ref(`/devices`);

  devicesListener = devicesRef.on(
    'value',
    (snapshot) => {
      const devices = snapshot.val();
      const devicesContainer = document.getElementById('deviceAccordion');
      devicesContainer.innerHTML = ''; // Clear existing devices

      const deviceTypes = {
        elevator: 'Elevators',
        escalator: 'Escalators',
        sidewalk: 'Moving Sidewalks',
      };

      const groupedDevices = {
        elevator: [],
        escalator: [],
        sidewalk: [],
      };

      // Group devices by type
      for (let type in devices) {
        const normalizedType = normalizeDeviceType(type);
        if (!groupedDevices[normalizedType]) continue; // Skip if type is not recognized
        for (const deviceID in devices[type]) {
          const device = devices[type][deviceID];
          groupedDevices[normalizedType].push({
            type: normalizedType,
            deviceID,
            ...device,
          });
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
            const deviceName = device.device_name || deviceID;
            const isMonitored = device.monitored;
            const deviceStatus =
              isMonitored && device.power && !device.alarm
                ? 'online'
                : 'offline';
            const timeLabel =
              deviceStatus === 'online' ? 'Time Online' : 'Time Offline';
            const lastStatusChangeTimestamp = device.lastStatusChangeTimestamp;
            const lastStatusCheckTimestamp = device.last_statuscheck_timestamp;

            // Create device card
            const deviceDiv = document.createElement('div');
            deviceDiv.classList.add('device-card');
            deviceDiv.setAttribute('data-id', deviceID);
            deviceDiv.setAttribute('data-type', type);

            // Prepare extra info HTML if device is monitored
            let extraInfoHTML = '';
            if (isMonitored) {
              extraInfoHTML = `
                <p class="card-text extra-info">
                  <small class="text-muted">Hours Uptime this Month:</small> <span id="uptime-hours-${deviceID}">${
                device.currentMonthUptime
                  ? device.currentMonthUptime.uptimeHours
                  : 'N/A'
              }</span><br>
                  <small class="text-muted">% Uptime this Month:</small> <span id="uptime-percentage-${deviceID}">${
                device.currentMonthUptime
                  ? device.currentMonthUptime.uptimePercentage
                  : 'N/A'
              }%</span><br>
                  <small class="text-muted" id="last-reading-${deviceID}">Last sensor reading: ${new Date(
                lastStatusCheckTimestamp * 1000
              ).toLocaleString()}</small>
                </p>
              `;
            }

            deviceDiv.innerHTML = `
              <div class="card mb-3 ${deviceStatus === 'online' ? 'border-success' : 'border-danger'}">
                <div class="card-body">
                  <h4 class="card-title">${deviceName}</h4>
                  <p class="card-text small text-muted">${
                    device.location || 'Location unknown'
                  }</p>
                  <p class="card-text">
                    <strong>Power:</strong> <span class="power-indicator" style="color: ${
                      isMonitored ? (device.power ? 'green' : 'red') : 'grey'
                    };"><i class="fas fa-circle"></i></span><br>
                    <strong>Alarm:</strong> <span class="alarm-indicator" style="color: ${
                      isMonitored ? (device.alarm ? 'red' : 'green') : 'grey'
                    };"><i class="fas fa-circle"></i></span><br>
                    <strong>${timeLabel}:</strong> <span id="timer-${deviceID}">${
              isMonitored ? '' : '-'
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

                const timerElement = deviceDiv.querySelector(
                  `#timer-${deviceID}`
                );
                if (timerElement) {
                  timerElement.innerText = `${days}d ${hours}h ${minutes}m ${seconds}s`;
                }

                // Update power and alarm indicators
                const powerIndicator =
                  deviceDiv.querySelector('.power-indicator');
                const alarmIndicator =
                  deviceDiv.querySelector('.alarm-indicator');

                powerIndicator.style.color = device.power ? 'green' : 'red';
                alarmIndicator.style.color = device.alarm ? 'red' : 'green';

                // Update last sensor reading
                const lastReadingElement = deviceDiv.querySelector(
                  `#last-reading-${deviceID}`
                );
                if (lastReadingElement) {
                  lastReadingElement.innerText = `Last sensor reading: ${new Date(
                    lastStatusCheckTimestamp * 1000
                  ).toLocaleString()}`;
                }

                // Highlight card if sensor is offline (no data for over 90 seconds)
                const cardElement = deviceDiv.querySelector('.card');
                if (now - lastStatusCheckTimestamp > 90) {
                  cardElement.classList.add('sensor-offline-box');
                } else {
                  cardElement.classList.remove('sensor-offline-box');
                }
              }, 1000);
            }
          });
        }
      }

    },
    (error) => {
      console.error('Error loading devices:', error);
      if (error.code === 'PERMISSION_DENIED') {
        showAlert('You do not have permission to access this data.', 'danger');
      }
    }
  );
};


// Function to show Bootstrap alerts
function showAlert(message, type = 'info') {
  const alertContainer = document.getElementById('alert-container');
  const alertDiv = document.createElement('div');
  alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
  alertDiv.role = 'alert';
  alertDiv.innerHTML = `
    ${message}
    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
  `;
  alertContainer.appendChild(alertDiv);

  // Automatically remove the alert after 5 seconds
  setTimeout(() => {
    alertDiv.classList.remove('show');
    alertDiv.classList.add('hide');
    alertDiv.addEventListener('transitionend', () => alertDiv.remove());
  }, 5000);
}

// Ensure the DOM is fully loaded before executing any scripts
document.addEventListener('DOMContentLoaded', function () {
  // Ensure the Firebase config is loaded and initialized first
  loadFirebaseConfig()
    .then(() => {
      console.log('Firebase config loaded and initialized.');

      loadDevices();
    })
    .catch((err) => {
      console.error('Failed to initialize Firebase:', err);
    });
});


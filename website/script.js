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
      const devicesContainer = document.getElementById('deviceContainer');
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

      // Display devices by type using simple sections
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

          const section = document.createElement('section');
          section.classList.add('mb-8');
          section.setAttribute('data-type', type);

          // Count online devices
          const onlineCount = groupedDevices[type].filter(
            (device) => device.monitored && device.power && !device.alarm
          ).length;
          const totalCount = groupedDevices[type].length;

          // Section header
          const header = document.createElement('h2');
          header.className = 'text-xl font-semibold mb-4';
          header.innerHTML = `${deviceTypes[type]} <span class="text-sm font-normal">(${onlineCount} of ${totalCount} online)</span>`;
          section.appendChild(header);

          // Grid container for cards
          const gridDiv = document.createElement('div');
          gridDiv.className =
            'grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3';
          section.appendChild(gridDiv);

          devicesContainer.appendChild(section);

          // Create a card for each device and display its status
          groupedDevices[type].forEach((device) => {
            const deviceID = device.deviceID;
            const deviceName = device.device_name || deviceID;
            // Treat devices as monitored by default if the field is undefined.
            const isMonitored =
              device.monitored !== undefined ? device.monitored : true;
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
                <p class="mt-2 text-xs text-gray-500" id="last-reading-${deviceID}">Last sensor reading: ${new Date(
                lastStatusCheckTimestamp * 1000
              ).toLocaleString()}</p>
              `;
            }

            // Prepare location HTML only if a location is provided
            const locationHTML = device.location
              ? `<p class="text-sm text-gray-500">${device.location}</p>`
              : '';

            deviceDiv.innerHTML = `
              <div class="device-card-inner border ${
                deviceStatus === 'online' ? 'border-green-500' : 'border-red-500'
              } p-4 bg-white">
                <h4 class="text-lg font-bold">${deviceName}</h4>
                ${locationHTML}
                <p class="text-sm mt-2">
                  <strong>Power:</strong> <span class="power-indicator" style="color: ${
                    isMonitored ? getPowerColor(device.power) : 'grey'
                  };"><i class="fas fa-circle"></i></span><br>
                  <strong>Alarm:</strong> <span class="alarm-indicator" style="color: ${
                    isMonitored ? getAlarmColor(device.alarm) : 'grey'
                  };"><i class="fas fa-circle"></i></span><br>
                  <strong>${timeLabel}:</strong> <span id="timer-${deviceID}">${
              isMonitored ? '' : '-'
            }</span>
                </p>
                ${extraInfoHTML}
              </div>
            `;

            // Append the device card to the grid
            gridDiv.appendChild(deviceDiv);

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

                powerIndicator.style.color = getPowerColor(device.power);
                alarmIndicator.style.color = getAlarmColor(device.alarm);

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
                const cardElement = deviceDiv.querySelector('.device-card-inner');
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

// Function to show alerts styled with Tailwind
function showAlert(message, type = 'info') {
  const alertContainer = document.getElementById('alert-container');
  const alertDiv = document.createElement('div');

  const typeClasses = {
    info: 'bg-blue-100 border-blue-400 text-blue-700',
    success: 'bg-green-100 border-green-400 text-green-700',
    warning: 'bg-yellow-100 border-yellow-400 text-yellow-700',
    danger: 'bg-red-100 border-red-400 text-red-700',
  };

  alertDiv.className = `mb-2 border-l-4 p-4 rounded ${
    typeClasses[type] || typeClasses.info
  }`;
  alertDiv.role = 'alert';
  alertDiv.textContent = message;
  alertContainer.appendChild(alertDiv);

  // Automatically remove the alert after 5 seconds
  setTimeout(() => {
    alertDiv.remove();
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

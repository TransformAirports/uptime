# Uptime EEMW Monitoring System for Airports

This repository contains the source code and documentation for the **_Uptime_ Elevator, Escalator, and Moving Walkway (EEMW) Monitoring System**, an open-source tool designed to help airport operators monitor the real-time operational status of critical conveyance devices. By providing instant notifications during downtime, the system enables airports to swiftly dispatch maintenance contractors, ensuring safe and efficient passenger flows at a fraction of the cost of traditional monitoring solutions.

![V2 Sensor Image](https://github.com/AirportLabs/uptime/blob/main/photos/sensor_v2.png)

## Table of Contents

- [Repository Structure](#repository-structure)
- [Features](#features)
- [Concept](#concept)
- [Technical Background](#technical-background)
- [Hardware Information](#hardware-information)
- [Software Information](#software-information)
- [API Information](#api-information)
- [Software-as-a-Service (SaaS) Services](#software-as-a-service-saas-services)
- [Compliance and Security](#compliance-and-security)
- [Technical Instructions](#technical-instructions)
- [Setting up Local Software Environment](#setting-up-local-software-environment)
- [Installing Hardware](#installing-hardware)
- [Contributing](#contributing)
- [License](#license)

## Repository Structure

- **/API**: Contains the Firebase Functions code that handles API requests, processes sensor data, and sends email notifications via the Postmark App API.
- **/public**: Contains the deployable code that is hosted on Firebase Hosting.
- **/hardware**: Contains sensor code, wiring diagrams, and design schematics for the sensor cases.
- **/website**: Contains the frontend code for the dashboard.

## Features

- **Real‑time Uptime Monitoring**: Sensors deployed on EEMWs send data every minute—or immediately when an incident is detected—which is processed by the API.
- **Automatic Outage Detection**: If a sensor reports power loss or an alarm condition, the device is marked as offline.
- **Delayed Notification**: To avoid false alarms caused by transient issues, email notifications are delayed by 30 seconds.

# Concept

### System Components

- **Monitoring Device**  
  - Compact IoT hardware equipped with Wi‑Fi connectivity.  
  - Monitors two critical relays per conveyance unit:  
    - **Operational Status Relay** (active / inactive)  
    - **Fault Indicator Relay** (fault / no fault)

- **Cloud Backend**  
  - Receives real‑time status updates from devices.  
  - Processes relay signals into actionable notifications.

- **Notification Interface**  
  - Issues immediate alerts via email to designated maintenance staff or contractors.  
  - Web‑based dashboard for monitoring current status.

### Operation Flow

1. **Relay Monitoring** – IoT modules continually monitor relay outputs that reflect each unit’s operational and fault status.  
2. **Event Detection & Reporting** – On detecting a state change, the device connects via Wi‑Fi and reports the event to the cloud backend.  
3. **Backend Processing** – The cloud platform interprets incoming signals and updates device state.  
4. **Immediate Notification** – Critical faults trigger instant alerts to maintenance contractors or airport operations teams.  
5. **Status Resolution** – Once the issue is cleared, relay status returns to normal, automatically closing the notification loop.

### Connectivity and Installation Simplicity

- **Wi‑Fi Connectivity** – Eliminates the cost and complexity of extensive cabling.  
- **Universal Compatibility** – Relay‑based monitoring works with virtually any EEMW system, regardless of brand or age.

### Benefits of the System

- **Cost Efficiency** – Avoids the heavy costs of full‑featured commercial monitoring platforms.  
- **Rapid Response** – Immediate notifications help minimize downtime.  
- **Scalability & Adaptability** – Easily expandable to additional devices or sensors.  
- **Transparency & Accountability** – Open‑source model encourages collaborative improvement.

By combining a straightforward relay‑based detection method with efficient cloud communication, the *Uptime* monitoring system offers a right‑sized solution tailored to the operational realities of airports.

# Technical Background

Each monitoring unit is built around an ESP32 microcontroller that watches the elevator/escalator’s relay outputs for power status and fault conditions. When a state change is detected (for example, an escalator losing power or triggering an alarm), the ESP32 connects via Wi‑Fi and sends an instant update to the cloud backend. The cloud service interprets these signals and updates a centralized database of device statuses, while simultaneously handling notifications – for critical outages, an alert email is generated immediately to inform maintenance staff. This architecture ensures airports receive immediate downtime alerts without the need for complex on-premise systems. By relying on standard relay contacts and Wi‑Fi networking, the solution remains hardware-agnostic (compatible with any EEMW make or model) and simple to deploy – there’s no extensive cabling or proprietary integration required.

## Hardware Information

### ESP32 Microcontroller Integration

The core of the monitoring system is the ESP32 microcontroller, which is responsible for data acquisition, processing, and communication over the Wi‑Fi network. The microcontroller directly interacts with sensors that capture power and alarm signals from the EEMW units.

### Input Signal Conditioning

Input signal conditioning plays a vital role in monitoring the status of up to three EEMW units via the ESP32’s GPIO pins. Signal‑conditioning circuits filter out noise, ensuring that readings from the equipment are accurate and reliable.

### Voltage Regulation

The system incorporates a voltage‑regulation circuit that converts incoming 5–35 V AC/DC power supplies to a stable 3.3 V DC, ensuring reliable operation of the ESP32.

### LED Indicators

On‑device LED indicators provide visual feedback on power status, connectivity, and error conditions, facilitating on‑site troubleshooting by maintenance personnel.

### Input Isolation

Optocouplers/isolators protect the ESP32 from electrical surges and provide logic‑level conversion from incoming 24 V DC logic to the 3.3 V microcontroller logic. This ensures safe operation by isolating the device from the EEMW equipment.

### Self‑Monitoring

The monitors will automatically attempt reconnection and reboot if communication issues occur, ensuring continuous operation.

### Wiring Diagrams

Detailed wiring diagrams show the connection between power sources, sensors, and the ESP32 microcontroller and can be found in the /hardware/Circuit Board Design folder.

### Enclosure Design

The sensor enclosures are designed to protect hardware components from environmental factors, ensuring longevity and consistent performance. Security tamper‑resistant screws discourage unauthorised access. The design files for 3D printing can be found in the /hardware/Case Design folder.

## Software Information

The Uptime dashboard is a lightweight web application powered by modern, open-source tools. It is built with standard HTML5, CSS, and JavaScript, using Tailwind CSS for a responsive and clean user interface. The dashboard does not require a traditional server – instead, it runs as a static site served via Firebase Hosting. Live data updates are enabled through the Firebase Realtime Database: the browser connects to this cloud database using Firebase’s JavaScript SDK, allowing device status changes to appear on the dashboard instantly as they occur. All communication with the backend is secured over TLS.

Airports can deploy the dashboard in two ways:

1. **Self‑Hosted** – Clone this repository and host the dashboard in your own cloud environment.  
2. **Managed Service** – Request a unique API key from the maintainers. Using this key, your equipment will appear on the shared dashboard at <https://uptime.transformairports.com>. Filters ensure that each airport can see only its own devices.

## API Information

The Uptime API is implemented as a serverless cloud function using Google Firebase Functions. It runs in a Node.js environment, which executes backend logic in response to HTTP requests from the field devices. This function is the heart of the system’s cloud backend – it receives incoming status data (HTTP POSTs from the sensors), processes the JSON payload, and updates the central Firebase Realtime Database with the new device state. The API layer utilizes the Firebase Admin SDK to interface with both the Realtime Database (for current device status and logs) and Firestore (which stores the list of alert email recipients for each airport or API key). Crucially, the cloud function also integrates with the Postmark email service to send out notifications – whenever a device goes offline and meets the notification criteria, the function invokes Postmark’s Node.js client to email all configured recipients about the outage. Environment secrets (such as the API authorization key and Postmark API token) are managed via Firebase’s built-in secret storage, and the function checks the api_key on each request to authenticate devices.

Airports can access the API in two ways:

1. **Self‑Hosted** – Clone this repository and host the API in your own cloud environment.  
2. **Managed Service** – Request a unique API key from the maintainers. Using this key, allows you to use the shared API (https://us-central1-uptime-eb91e.cloudfunctions.net/uptime).

## Software‑as‑a‑Service (SaaS) Services

This project utilises several Software‑as‑a‑Service (SaaS) products to ensure reliable operation:

#### Google Firebase Realtime Database

- **Purpose** – Maintains the real‑time status of EEMWs.  
- **Functionality** – Cloud‑hosted NoSQL database that synchronises data to all connected clients in real‑time.

#### Google Firebase Functions

- **Purpose** – Executes backend code in response to HTTP requests, database changes, or other triggers.  
- **Functionality** – Processes sensor data and triggers email alerts when necessary.

#### Google Firebase Hosting

- **Purpose** – Hosts the static HTML, JavaScript, and CSS files for the Uptime dashboard.  
- **Functionality** – Provides fast and secure hosting for web applications.

#### Google Firebase Firestore

- **Purpose** – Stores the list of email addresses that should receive outage alerts for a given airport.  
- **Functionality** – Recipient lists are kept in a dedicated Firestore collection keyed by each airport’s API token, ensuring recipient data remains logically separated.

#### Postmark

- **Purpose** – Sends transactional alert emails when a device goes offline.  
- **Functionality** – Provides reliable email delivery for time‑sensitive notifications.

## Compliance and Security

#### Data Transmission

All data transmissions use TLS and modern cloud‑application standards.  

#### Data Integrity

While communication is secure, the telemetry itself is read‑only and effectively open‑data, enabling monitoring without exposing sensitive information.

#### Microcontroller Security: ESP32 Devices

ESP32 devices do not run a full operating system, reducing the attack surface associated with OS vulnerabilities. They communicate solely with the API, limiting exposure to sensitive data.

#### Network Segmentation

Logical network segmentation through public Wi-Fi ensures that the monitoring system operates in isolation from the airport’s non‑public networks, minimising security risks.

#### Physical Segmentation

Sensors should be deployed in designated electrical and equipment rooms, restricting access to authorised personnel.

# Technical Instructions

## API Endpoint

**URL** – `https://us-central1-uptime-eb91e.cloudfunctions.net/uptime`  
**Method** – `POST`  
**Content‑Type** – `application/json`

| Parameter   | Type    | Description                                                              | Required |
|-------------|---------|--------------------------------------------------------------------------|----------|
| deviceID    | String  | Unique identifier for the device (e.g. "Escalator01").                  | Yes      |
| device_name | String  | Human‑readable name for the device (e.g. "North Escalator").            | Yes      |
| type        | String  | Device type: `escalator`, `elevator`, or `movingsidewalk`.              | Yes      |
| power       | Boolean | Current power status; `true` = powered, `false` = offline.              | Yes      |
| alarm       | Boolean | Current alarm status; `true` = no alarm, `false` = alarm triggered.     | Yes      |
| api_key     | String  | API key issued to the airport; authenticates the request.               | Yes      |

---

#### Example Request

```bash
curl --location 'https://us-central1-uptime-eb91e.cloudfunctions.net/uptime' --header 'Content-Type: application/json' --data '{
  "api_key": "YOUR_UNIQUE_API_KEY",
  "deviceID": "escalator-north-XYZ",
  "device_name": "North Escalator (Concourse A)",
  "type": "escalator",
  "power": true,
  "alarm": false
}'
```

---

#### Response Codes

- **200 OK** – Device status updated successfully.  
- **400 Bad Request** – Missing or invalid parameters.  
- **500 Internal Server Error** – Server‑side processing error.

## Setting up Local Software Environment

Fire up Terminal on any Apple macOS machine and paste the commands below—within an hour you’ll have Node, Firebase, and the entire Uptime codebase cloned, configured, and ready to deploy as your own white-label EEMW monitoring system. 

```bash
# 1. Install Xcode Command-Line Tools
xcode-select --install

# 2. Install Homebrew (the one-liner everyone pastes from brew.sh)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# 3. Install Node.js
brew install node

# 4. Install the Firebase CLI globally so you can init, deploy, etc.
npm install -g firebase-tools

# 5. Install the GitHub CLI
brew install gh

# 6. Authenticate the GitHub CLI
gh auth login

# 7. Clone your repo
gh repo clone TransformAirports/uptime
cd uptime

# 8. Pull project dependencies
npm install

# 9. Authenticate into Firebase (once per machine)
firebase login

# 10. Create a new Firebase project
firebase projects:create uptime-monitoring --display-name "Uptime Monitoring"

# 11. Tell the CLI which project this folder should point to
firebase use --add  # then pick uptime-monitoring

# 12. Scaffold the code + config for all four Firebase products
firebase init functions,database,firestore,hosting

# 13. Install Cloud Functions dependencies
cd functions && npm install && cd ..

# 14. Add your custom Uptime API key
firebase functions:secrets:set SECRET_API_KEY

# 15. Add Postmark API key for managing email alerts
firebase functions:secrets:set POSTMARK_KEY

# 16. Deploy to Firebase (all targets in one go)
firebase deploy --only "functions,database,firestore,hosting"

# 17. Open the hosted dashboard in your browser
firebase open hosting:site
```

## Installing Hardware

Installing the **Uptime** hardware is a five-step process. Steps&nbsp;2‑5 match the workflow you drafted; Step&nbsp;1 adds the firmware‑flashing details you requested.

1. **Flash the ESP32 firmware via the Arduino IDE**  
   1. Plug the sensor’s ESP32 board into your computer with a USB‑C cable.  
   2. In **Arduino IDE → Preferences → Additional Boards Manager URLs**, add  
      `https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json`  
      (if you haven’t already), then open **Tools → Board → Boards Manager** and install **esp32**.  
   3. Select **Tools → Board → SparkFun ESP32 Thing Plus**.  
   4. Open `/hardware/Sensor Code/Uptime/Uptime.ino` and edit the following constants:  

      ```cpp
      const char* DEVICE_NAME = "EEMW-SENSOR-01";  // any unique name
      const char* DEVICE_ID   = "01-A-N";          // any unique identifier
      const char* WIFI_SSID   = "your-ssid";
      const char* WIFI_PASS   = "your-password";
      ```  

   5. Choose the correct **Port/COM** entry under **Tools → Port**.  
   6. Click **Sketch → Upload** (or press ⌘/Ctrl + U). When upload completes, the serial monitor should show the device booting and attempting a Wi‑Fi connection.

2. **Mount the Sensor Unit**  
   Secure the 3D‑printed enclosure (tamper‑resistant screws included) inside the control cabinet or nearby electrical room, clear of moving parts and moisture.

3. **Wiring Connections**  
   * Tie the sensor’s opto‑isolated inputs to the elevator/escalator relay contacts: one channel for **run/stop**, another for **fault/alarm** (supports up to three EEMW units).  
   * Follow the wiring diagram in `/hardware/Circuit Board Design`.  
   * Land wires on the same screw terminals (or adjacent pass‑through terminals) and tug‑test for security.

4. **Power Supply**  
   Provide 5 – 35 V DC (or AC) from the equipment panel. The onboard regulator feeds the ESP32 at 3.3 V. Verify the **PWR** and **STATUS** LEDs illuminate and the **WIFI** LED blinks as it negotiates a network connection.

5. **Testing and Verification**  
   * Open the Uptime dashboard and confirm the device appears **Online**.  
   * Trip the monitored relay (e.g., simulate a fault) and watch the status flip to **Offline** while an alert email arrives.  
   * Restore normal operation; the dashboard should return to **Online**. This end‑to‑end test confirms wiring, firmware, cloud function, and notifications are working.


## Contributing

Contributions are welcome! For significant changes, please open an issue to discuss your proposal before submitting a pull request.

## License

This project is released under the MIT License. See [LICENSE](LICENSE) for details.

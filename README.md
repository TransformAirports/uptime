# Uptime EEMW Monitoring System

This repository contains the source code and documentation for the **_Uptime_ Elevator, Escalator, and Moving Walkway (EEMW) Monitoring System**, an open-source tool designed to help airport operators monitor the real-time operational status of critical conveyance devices. By providing instant notifications during downtime, the system enables airports to swiftly dispatch maintenance contractors, ensuring safe and efficient passenger flows at a fraction of the cost of traditional monitoring solutions.

![V2 Sensor Image](https://github.com/AirportLabs/uptime/blob/main/photos/sensor_v2.png)

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

XXX

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

### Security and Reliability

- All data transmissions use TLS and modern cloud‑application standards.  
- While communication is secure, the telemetry itself is read‑only and effectively open‑data, enabling transparent monitoring without exposing sensitive information.

### Dashboard Access

Airports can deploy the dashboard in two ways:

1. **Self‑Hosted** – Clone this repository and host the dashboard in your own cloud environment.  
2. **Managed Service** – Request a unique API key from the maintainers. Using this key, your equipment will appear on the shared dashboard at <https://uptime.transformairports.com>. Filters ensure that each airport can see only its own devices.

## API Information

### API Access

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

XXXX

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

```bash
# Run dashboard locally
gulp local

# Deploy or update dashboard code
gulp deploy

# Deploy or update API code
firebase deploy --only functions

# Set or update your API keys
firebase functions:secrets:set SECRET_API_KEY
firebase functions:secrets:set SECRET_POSTMARK_API
```

## Installing Hardware

XXXXX

## Contributing

Contributions are welcome! For significant changes, please open an issue to discuss your proposal before submitting a pull request.

## License

This project is released under the MIT License. See [LICENSE](LICENSE) for details.

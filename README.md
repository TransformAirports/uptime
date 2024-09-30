# Uptime Monitoring System

This repository contains the source code and documentation for the Uptime Monitoring System to be deployed at Ronald Reagan Washington National Airport and Washington Dulles International Airport. The system monitors the uptime of elevators, escalators, and moving walkways (EEMWs) and sends notifications when any device experiences downtime. This helps ensure operational efficiency and safety within airport facilities, particularly in high-traffic areas.

![V2 Sensor Image](https://github.com/AirportLabs/uptime/blob/main/photos/sensor_v2.png)

### Principals and Points of Contact

#### Christian Kessler
**Role**: Airports Transformation and Innovation Division Manager  
**Responsibilities**: Lead for backend development and dashboard integration.

#### Patrick Skelton
**Role**: Innovation Research & Development Program Manager  
**Responsibilities**: Lead for hardware design and implementation.

## Repository Structure

- **/functions**: Contains the Firebase Functions code that handles API requests, processes sensor data, and sends email notifications via the Postmark App API.
- **/public**: Contains the frontend code for the dashboard.
- **/hardware**: Contains sensor code, wiring diagrams, and design schematics for the sensor cases.
- **/dev**: Contains the deployable code that is hosted on Firebase Hosting.

## Features

- **Real-time Uptime Monitoring**: Sensors deployed on EEMWs send data every minute or when an incident is detected, which is processed by the Firebase Function.
- **Automatic Outage Detection**: If a sensor reports power loss or an alarm condition, the device is marked as offline.
- **Delayed Notification**: To avoid false alarms due to transient issues, email notifications are delayed by 30 seconds.
- **Uptime Calculation**: A scheduled job calculates uptime metrics monthly, providing insights into device performance.

## Theory of Operation: EEMW Monitors (Hardware)

### Purpose and Goals

The EEMW monitors serve to:

- Provide accurate real-time monitoring of EEMW equipment.
- Facilitate a smooth transition from the legacy building management system to the upgraded system, ensuring continued monitoring capabilities.
- Enhance response times for maintenance teams by enabling proactive fault detection and minimizing downtime.

### Integration with Legacy and New Monitoring Systems

The existing EEMW monitoring system captures two critical signals (power and alarm status) from each EEMW set and relays this information to a central server via the building management system. The new EEMW monitoring solution replicates this functionality by capturing the same power and alarm signals but establishes a modern data path to transmit this status information via the guest Wi-Fi network to a secure web-based dashboard. This ensures that monitoring capabilities remain uninterrupted during and after the transition to the upgraded building management system.

### Data Transmission and Communication Path

- **Legacy Data Path**: Previously, the system relied on hardwired connections to transmit data through the building management system.
- **New Data Path**: The EEMW monitor processes incoming EEMW signals and transmits equipment status data securely over the guest Wi-Fi network using HTTPS, ensuring encrypted communication with the cloud API.

## Hardware Details and Electronics Theory of Operation

### ESP32 Microcontroller Integration:

The core of the monitoring system is the ESP32 microcontroller, which is responsible for data acquisition, processing, and communication over the Wi-Fi network. The microcontroller directly interacts with sensors that capture power and alarm signals from the EEMW units.

### Input Signal Conditioning:

Input signal conditioning plays a vital role in monitoring the status of up to three EEMW units via the ESP32’s GPIO pins. Signal conditioning circuits filter out noise, ensuring that readings from the equipment are accurate and reliable.

### Voltage Regulation:

The system incorporates a voltage regulation circuit that converts incoming 5-35V AC/DC power supplies to a stable 3.3V DC, ensuring reliable operation of the ESP32 microcontroller.

### LED Indicators:

On-device LED indicators provide visual feedback on power status, connectivity, and error conditions, facilitating on-site troubleshooting by maintenance personnel.

### Input Isolation:

Optocouplers/isolators protect the ESP32 from electrical surges and provide logic level conversion from incoming 24VDC logic to the 3.3V microcontroller logic.  This ensures safe operation by isolating the device from the from the EEMW equipment.

### Wiring Diagrams

Detailed wiring diagrams show the connection between power sources, sensors, and the ESP32 microcontroller. These diagrams ensure accurate installation and troubleshooting.

### Enclosure Design

The sensor enclosures are designed to protect hardware components from environmental factors, ensuring longevity and consistent performance. The materials and design considerations ensure that the hardware is protected aginst phisical damage and dust.

### Monitoring and Notifications

The system monitors EEMWs and notifies relevant stakeholders via email when an outage is detected.

### Dashboard Access

The Dashboard is accessible via uptime.transformairports.com. Admins can log in to manage alert email addresses for different campuses (DCA, IAD).

## Maintenance and Monitoring

### Self-Monitoring:

The EEMW monitors are programmed to automatically attempt reconnection and reboot if communication issues occur, ensuring continuous operation.

### LED Indicators:

LED indicators provide real-time status feedback simplifying troubleshooting for maintenance personnel.

### Continuous Monitoring and Incident Response

The Uptime Monitoring System was created to be redundantly simple, allowing the StratOps team to manage any difficulties without involving IT support individuals.

#### Direct Communication with Work Control Centers

- **Clear Communication Channels**: We will ensure that the Work Control Centers at both Ronald Reagan Washington National Airport and Washington Dulles International Airport understand that any issues related to the Uptime Monitoring System should not be directed to IT's TechWorks support desk. Instead, a direct line of communication will be established with our team.

#### Collaboration with TechWorks

- **Development of SOP**: We will work closely with TechWorks to develop a Standard Operating Procedure (SOP) that outlines the process for handling any calls or outreach concerning the Uptime Monitoring System. This SOP will ensure that any reports made to TechWorks are efficiently redirected to our team.

#### Failback Plan

- **Reversion to Manual Monitoring**: In the event of a system failure or significant issue, the fallback plan would involve reverting to the Work Control Centers actively monitoring calls and emails for outages. This approach ensures that there is no disruption to operational monitoring, even if the Uptime Monitoring System experiences temporary downtime.

## Compliance and Security

The system was custom-developed to address the specific needs of MWAA relevant MWAA requirements such as the [Enterprise Technology Management Directive](#enterprise-technology-management-compliance) and [Information Security Directive](#information-security-compliance). At the same time, it follows our internal guidelines to prioritize fast, minimally viable product (MVP) innovation.

The Uptime Monitoring System was custom-developed to address the specific needs of MWAA, recognizing that while we do not perform the maintenance on Elevators, Escalators, and Moving Walkways (EEMWs) ourselves, it is crucial to monitor their status, track key performance indicators (KPIs), and promptly alert the maintenance contractors. This solution was identified as a high-value opportunity, providing a focused and efficient alternative to the more complex and time-consuming procurement or traditional application development processes.

By developing a tailored solution, we ensured that our system could be implemented rapidly and cost-effectively, bypassing the need for commercial offering that would typically involve a seven-figure investment. This approach not only meets the immediate operational requirements but also exemplifies the ROI-driven mindset encouraged by MWAA. The use of the Firebase platform further supports these goals by offering a scalable and secure environment that aligns with MWAA’s directive to "Re-Use" existing technology, "Buy" off-the-shelf solutions where applicable, and "Build" customized solutions only when necessary.

#### Microcontroller Security: ESP32 Devices

The ESP32 devices are configured to communicate solely with the API, not directly with the database, providing an additional layer of security.

#### Network Segmentation

Network segmentation ensures that the EEMW monitoring system operates in isolation from MWAA’s non-public networks, minimizing security risks.

#### Rationale for the Chosen Development Process

The development process for the Uptime Monitoring System was deliberately designed to follow a rapid, Minimum Viable Product (MVP) approach. This decision was made based on several key factors, each aligned with MWAA's goals of operational efficiency, cost-effectiveness, and innovation:

##### 1. **Speed to Market**
   - **Rationale**: The pressing need to monitor elevators, escalators, and moving walkways (EEMWs) at DCA and IAD required a solution that could be deployed quickly. Traditional development and procurement processes would have significantly delayed the system's implementation, potentially leaving critical infrastructure without adequate monitoring.
   - **Benefit**: By adopting an MVP approach, we were able to deploy a functional version of the system in a fraction of the time, providing immediate value and allowing us to gather real-world feedback early on.

##### 2. **Cost-Effectiveness**
   - **Rationale**: The MVP approach enabled us to minimize upfront costs by focusing on essential features that deliver the most immediate impact. This method avoided the high costs typically associated with comprehensive, off-the-shelf software solutions that may include unnecessary features.
   - **Benefit**: This approach aligns with MWAA's directive to control costs by leveraging existing technology and only building customized solutions when necessary. The cost savings from avoiding a full-scale traditional procurement could potentially run into seven figures.

##### 3. **Iterative Improvement and Flexibility**
   - **Rationale**: The MVP approach allows for iterative development, meaning the system can evolve based on actual user needs and feedback. This flexibility is crucial in adapting to the specific operational requirements of EEMW monitoring, which might not be fully anticipated during the initial planning stages.
   - **Benefit**: This iterative process ensures that resources are allocated effectively, focusing on developing features that provide the most significant benefit and allowing for continuous improvement without the need for extensive rework.

##### 4. **Innovation and Agility**
   - **Rationale**: The MVP approach supports MWAA's broader innovation goals by fostering a culture of agility and responsiveness. By enabling rapid prototyping and testing, the development team can explore new technologies and approaches that might be too risky or unproven for traditional IT processes.
   - **Benefit**: This approach not only accelerates the deployment of new solutions but also positions MWAA as a leader in adopting innovative practices that can be scaled across other areas of the organization.

## Services

This project utilizes a variety of Software as a Service (SaaS) products to ensure the reliable operation and management of the Uptime Monitoring System, including Google Firebase for real-time data synchronization, serverless compute via Firebase Functions, and Postmark for sending transactional emails.

#### Google Firebase Realtime Database

- **Purpose**: Maintains the real-time status of elevators, escalators, and moving walkways (EEMWs) across the monitored facilities.
- **Functionality**: The Firebase Realtime Database is a cloud-hosted NoSQL database that synchronizes data in real-time to all connected clients. This service ensures that the status of all devices is always up-to-date and accessible for monitoring and alerting purposes.

#### Google Firebase Functions

- **Purpose**: Runs the Node.js-based API that processes incoming data from the sensors and handles business logic.
- **Functionality**: Firebase Functions is a serverless compute service that allows the system to execute backend code in response to HTTPS requests, database changes, or other triggers. This service is central to processing sensor data and triggering email alerts when necessary.

#### Google Firebase Hosting

- **Purpose**: Hosts the static HTML, JavaScript, and CSS files for the Uptime Dashboard.
- **Functionality**: Firebase Hosting provides fast and secure hosting for web applications. The dashboard, accessible at [uptime.transformairports.com](https://uptime.transformairports.com/), is served from this platform, allowing stakeholders to monitor the status of EEMWs in real-time.

#### Google Firebase Authentication

- **Purpose**: Ensures that only authorized users with MWAA.com email addresses can administer the site.
- **Functionality**: Firebase Authentication manages user identity and access control, providing a secure way to authenticate users and restrict access to the administration features of the dashboard. This ensures that only permitted personnel can modify settings or manage alert email addresses.

#### Postmark

- **Purpose**: Used for sending transactional alert emails when a device goes offline.
- **Functionality**: Postmark is a reliable email delivery service specifically designed for transactional emails. The Uptime Monitoring System uses Postmark to send timely notifications to stakeholders when an EEMW experiences downtime, ensuring that issues are promptly addressed.

## API Endpoint

**URL**: `https://us-central1-uptime-eb91e.cloudfunctions.net/updateUptime`

**Method**: `POST`

**Content-Type**: `application/json`

#### Request Parameters

| Parameter  | Type    | Description                                                                 | Required |
|------------|---------|-----------------------------------------------------------------------------|----------|
| deviceID   | String  | Unique identifier for the device (e.g., "Escalator01").                      | Yes      |
| type       | String  | Type of the device; must be one of the following: `escalator`, `elevator`, or `movingsidewalk`. | Yes      |
| campus     | String  | Identifier for the campus; must be either `IAD` or `DCA`.                   | Yes      |
| power      | Boolean | The current power status of the device; `true` for powered, `false` for offline.  | Yes      |
| alarm      | Boolean | The current alarm status of the device; `true` for no alarm, `false` for alarm triggered. | Yes      |
| apikey      | String | API key | Yes      |

---

#### Example Request

Below is an example of how to send data to the API using `curl`:

```bash
curl --location 'https://us-central1-uptime-eb91e.cloudfunctions.net/updateUptime' \
--header 'Content-Type: application/json' \
--data '{
  "deviceID": "Escalator01",
  "type": "escalator",
  "campus": "IAD",
  "power": true,
  "alarm": true,
  "apikey": "XXX"
}'
```

---

#### Response

- **Success (200 OK)**: Returns a confirmation that the device status has been successfully updated.

- **Error (400 Bad Request)**: Returned if the request parameters are incorrect or missing. The response will include details about which parameters are invalid.

- **Error (500 Internal Server Error)**: Returned if there is an issue processing the request on the server side. This could be due to database issues, network problems, or other unforeseen errors.

#### Notes

- The API is designed to handle requests that update the status of devices deployed across MWAA facilities. It is critical that all parameters are provided accurately to ensure the proper monitoring and alerting of EEMWs.
- The `power` and `alarm` parameters must be carefully monitored and updated to reflect the true status of the device, as they are essential for triggering notifications and logging uptime/downtime events.

## Contributing

Contributions to this project are managed through GitHub. For significant changes, please submit an issue to discuss the proposal before making a pull request.

## License

This project is intended for MWAA internal use only. Unauthorized use or distribution outside of MWAA is prohibited.

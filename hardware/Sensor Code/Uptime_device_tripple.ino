#include <WiFi.h>
#include <HTTPClient.h>

// Wi-Fi credentials
const char* ssid = "InnovationNet";
const char* password = "Mwaa1987!";

// API endpoint
const char* apiURL = "https://us-central1-uptime-eb91e.cloudfunctions.net/uptime";

// API key for authentication
const char* apiKey = "YOUR_API_KEY";

// Unit 1 configuration
const char* deviceID1 = "Sidewalk01";  // Unique ID for each ESP32
const char* type1 = "sidewalk";  // Options: "elevator", "escalator", "sidewalk"

// Unit 2 configuration
const char* deviceID2 = "Sidewalk02";  // Unique ID for each ESP32
const char* type2 = "sidewalk";  // Options: "elevator", "escalator", "sidewalk"

// Unit 3 configuration
const char* deviceID3 = "Sidewalk03";  // Unique ID for each ESP32
const char* type3 = "sidewalk";  // Options: "elevator", "escalator", "sidewalk"

// Enable or disable the second and third units
bool enableSecondUnit = true;
bool enableThirdUnit = true;

// Active high or active low configuration for each input pin
// Device 1
bool powerPin1ActiveHigh = true;  // true for active high, false for active low
bool alarmPin1ActiveHigh = true;  // true for active high, false for active low

// Device 2
bool powerPin2ActiveHigh = true;  // true for active high, false for active low
bool alarmPin2ActiveHigh = true;  // true for active high, false for active low

// Device 3
bool powerPin3ActiveHigh = true;  // true for active high, false for active low
bool alarmPin3ActiveHigh = true;  // true for active high, false for active low

// Input pins for status monitoring
const int powerPin1 = 32;  // GPIO pin for power input of unit 1
const int alarmPin1 = 33;  // GPIO pin for alarm input of unit 1
const int powerPin2 = 25;  // GPIO pin for power input of unit 2
const int alarmPin2 = 26;  // GPIO pin for alarm input of unit 2
const int powerPin3 = 34;  // GPIO 34 for the third unit power pin
const int alarmPin3 = 35;  // GPIO 35 for the third unit alarm pin

// Device states
bool powerState1 = LOW;
bool alarmState1 = LOW;
bool powerState2 = LOW;
bool alarmState2 = LOW;
bool powerState3 = LOW;
bool alarmState3 = LOW;

// Send interval in milliseconds (default to 1 minute)
unsigned long sendInterval = 60000; // 1 minute
unsigned long lastSendTime = 0;

// Wi-Fi reconnection
void reconnectWiFi() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("Reconnecting to WiFi...");
    WiFi.disconnect();
    WiFi.begin(ssid, password);
    while (WiFi.status() != WL_CONNECTED) {
      delay(1000);
      Serial.println("Reconnecting to WiFi...");
    }
    Serial.println("Reconnected to WiFi");
  }
}

void setup() {
  Serial.begin(115200);

  // Initialize input pins for unit 1
  pinMode(powerPin1, INPUT);
  pinMode(alarmPin1, INPUT);

  // Initialize input pins for unit 2 if enabled
  if (enableSecondUnit) {
    pinMode(powerPin2, INPUT);
    pinMode(alarmPin2, INPUT);
  }

  // Initialize input pins for unit 3 if enabled
  if (enableThirdUnit) {
    pinMode(powerPin3, INPUT);
    pinMode(alarmPin3, INPUT);
  }

  // Connect to Wi-Fi
  Serial.println("Connecting to WiFi...");
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(1000);
    Serial.println("Connecting to WiFi...");
  }
  Serial.println("Connected to WiFi");
}

void loop() {
  bool newPowerState1 = digitalRead(powerPin1);
  bool newAlarmState1 = digitalRead(alarmPin1);
  bool newPowerState2 = enableSecondUnit ? digitalRead(powerPin2) : LOW;
  bool newAlarmState2 = enableSecondUnit ? digitalRead(alarmPin2) : LOW;
  bool newPowerState3 = enableThirdUnit ? digitalRead(powerPin3) : LOW;
  bool newAlarmState3 = enableThirdUnit ? digitalRead(alarmPin3) : LOW;

  // Adjust state readings based on active high or active low configuration
  newPowerState1 = powerPin1ActiveHigh ? newPowerState1 : !newPowerState1;
  newAlarmState1 = alarmPin1ActiveHigh ? newAlarmState1 : !newAlarmState1;
  if (enableSecondUnit) {
    newPowerState2 = powerPin2ActiveHigh ? newPowerState2 : !newPowerState2;
    newAlarmState2 = alarmPin2ActiveHigh ? newAlarmState2 : !newAlarmState2;
  }
  if (enableThirdUnit) {
    newPowerState3 = powerPin3ActiveHigh ? newPowerState3 : !newPowerState3;
    newAlarmState3 = alarmPin3ActiveHigh ? newAlarmState3 : !newAlarmState3;
  }

  // Check if there is a state change for unit 1
  if (newPowerState1 != powerState1 || newAlarmState1 != alarmState1) {
    powerState1 = newPowerState1;
    alarmState1 = newAlarmState1;
    sendStatus(deviceID1, type1, powerState1, alarmState1);
  }

  // Check if there is a state change for unit 2
  if (enableSecondUnit && (newPowerState2 != powerState2 || newAlarmState2 != alarmState2)) {
    powerState2 = newPowerState2;
    alarmState2 = newAlarmState2;
    sendStatus(deviceID2, type2, powerState2, alarmState2);
  }

  // Check if there is a state change for unit 3
  if (enableThirdUnit && (newPowerState3 != powerState3 || newAlarmState3 != alarmState3)) {
    powerState3 = newPowerState3;
    alarmState3 = newAlarmState3;
    sendStatus(deviceID3, type3, powerState3, alarmState3);
  }

  // Check if it's time to send the current status based on the send interval
  if (millis() - lastSendTime >= sendInterval) {
    sendStatus(deviceID1, type1, powerState1, alarmState1);
    if (enableSecondUnit) {
      sendStatus(deviceID2, type2, powerState2, alarmState2);
    }
    if (enableThirdUnit) {
      sendStatus(deviceID3, type3, powerState3, alarmState3);
    }
    lastSendTime = millis();
  }

  delay(1000);  // Check status every second
}

void sendStatus(const char* deviceID, const char* type, bool powerState, bool alarmState) {
  reconnectWiFi();
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.setTimeout(5000);  // Set timeout to 5000 ms
    http.begin(apiURL);
    http.addHeader("Content-Type", "application/json");

    String payload = "{";
    payload += "\"api_key\":\"" + String(apiKey) + "\",";
    payload += "\"deviceID\":\"" + String(deviceID) + "\",";
    payload += "\"type\":\"" + String(type) + "\",";
    payload += "\"power\":" + String(powerState ? "true" : "false") + ",";
    payload += "\"alarm\":" + String(alarmState ? "true" : "false");
    payload += "}";

    // Print the exact payload
    Serial.println("Sending payload: " + payload);

    int httpResponseCode;
    int retryCount = 0;
    const int maxRetries = 3;
    bool success = false;

    do {
      httpResponseCode = http.POST(payload);

      if (httpResponseCode > 0) {
        String response = http.getString();
        Serial.println("HTTP Response code: " + String(httpResponseCode));
        Serial.println("Response: " + response);
        if (response.indexOf("Device status updated successfully") != -1) {
          success = true;
          break;  // Exit the loop if the POST request is successful and response is as expected
        }
      } else {
               Serial.print("Error on sending POST: ");
        Serial.println(httpResponseCode);
        if (httpResponseCode == HTTPC_ERROR_CONNECTION_REFUSED) {
          Serial.println("Connection refused by server");
        } else if (httpResponseCode == HTTPC_ERROR_SEND_HEADER_FAILED) {
          Serial.println("Send header failed");
        } else if (httpResponseCode == HTTPC_ERROR_SEND_PAYLOAD_FAILED) {
          Serial.println("Send payload failed");
        } else if (httpResponseCode == HTTPC_ERROR_NOT_CONNECTED) {
          Serial.println("Not connected");
        } else if (httpResponseCode == HTTPC_ERROR_CONNECTION_LOST) {
          Serial.println("Connection lost");
        } else if (httpResponseCode == HTTPC_ERROR_NO_HTTP_SERVER) {
          Serial.println("No HTTP server");
        } else {
          Serial.println("Unknown error");
        }
        delay(10000);  // Wait 10 seconds before retrying
      }

      retryCount++;
    } while (!success && retryCount < maxRetries);

    http.end();

    // Log available heap memory
    Serial.print("Free heap: ");
    Serial.println(ESP.getFreeHeap());

    if (!success) {
      Serial.println("Rebooting due to failure in sending data...");
      ESP.restart();
    }
  } else {
    Serial.println("WiFi Disconnected");
  }
}
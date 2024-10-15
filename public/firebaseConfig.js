async function loadFirebaseConfig() {
  const response = await fetch('localFirebase.json');
  const config = await response.json();
  // Initialize Firebase with the loaded config
  if (!firebase.apps.length) {
    firebase.initializeApp(config);
  }
  return config;
}

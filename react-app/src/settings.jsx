if (!window.electronAPI) {
  console.error('window.electronAPI is not available');
  throw new Error('window.electronAPI is not available');
}

if (typeof window.electronAPI.readSettings !== 'function' || typeof window.electronAPI.writeSettings !== 'function') {
  console.error('readSettings or writeSettings is not a function on window.electronAPI');
  throw new Error('readSettings or writeSettings is not a function on window.electronAPI');
}

// Function to read settings
async function readSettings() {
  const settings = await window.electronAPI.readSettings();
  return settings;
}

// Function to write settings
async function writeSettings(newSettings) {
  const result = await window.electronAPI.writeSettings(newSettings);
  if (result.success) {
    console.log('Settings saved successfully!');
  } else {
    console.error('Failed to save settings:', result.error);
  }
}

export { readSettings, writeSettings };
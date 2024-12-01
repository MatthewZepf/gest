const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const url = require('url');
const fs = require('fs');

let pythonProcess;

function createWindow() {
    const mainWindow = new BrowserWindow({
      width: 800,
      height: 600,
      webPreferences: {
        preload: path.join(__dirname, 'preloader.js'), // Adjust path as needed
        contextIsolation: true, // Enable context isolation for security
        nodeIntegration: false, // Disable nodeIntegration for security
      },
    });
  
    const indexPath = path.join(__dirname, '..', 'react-app', 'build', 'index.html');
    if (fs.existsSync(indexPath)) {
      mainWindow.loadFile(indexPath);
    } else {
      console.error('index.html not found at:', indexPath);
      mainWindow.loadURL('http://localhost:3000'); // Fallback to local server
    }
    // mainWindow.loadURL('http://localhost:3000');
    mainWindow.webContents.openDevTools();
}
  

function killPythonProcess() {
  if (pythonProcess) {
    pythonProcess.kill('SIGINT');
    pythonProcess = null;
  }
}

function startPythonProcess() {
  // Run run_python.sh to activate the virtual environment and start the Python script
  // pythonProcess = spawn('sh', [path.join(__dirname, '..', 'backend', 'run_python.sh')]);
  pythonProcess = spawn('python', [path.join(__dirname, '..', 'backend', 'main.py')]);

  pythonProcess.stdout.on('data', (data) => {
    console.log(`Python stdout: ${data}`);
  });

  pythonProcess.stderr.on('data', (data) => {
    console.error(`Python stderr: ${data}`);
  });

  pythonProcess.on('close', (code) => {
    console.log(`Python process exited with code ${code}`);
  });
}

app.whenReady().then(() => {
  startPythonProcess(); // Start the Python process before creating the window

  // Wait for socket_port.txt to be created
  const checkPortFile = setInterval(() => {
    const filePath = path.join(__dirname, 'socket_port.txt');
    if (fs.existsSync(filePath)) {
      clearInterval(checkPortFile);
      createWindow();
    }
  }, 500); // Check every second

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  killPythonProcess();
  app.quit();
});

app.on('before-quit', () => {
  killPythonProcess();
  app.exit();
});

// Read the port file and send its content to the renderer process
ipcMain.handle('get-port', async () => {
    try {
      const filePath = path.join(__dirname, 'socket_port.txt');
      const port = fs.readFileSync(filePath, 'utf-8').trim();
      return port;
    } catch (error) {
      console.error('Error reading port file:', error);
      throw new Error('Failed to read WebSocket port');
    }
  });

const settingsPath = path.join(__dirname, 'settings.json');

// Handle read request
ipcMain.handle('read-settings', async () => {
  try {
    const data = fs.readFileSync(settingsPath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading settings:', error);
    return null; // Return null if there's an error
  }
});

// Handle write request
ipcMain.handle('write-settings', async (event, newactionParameters) => {
  try {
    const data = fs.readFileSync(settingsPath, 'utf-8');
    const settings = JSON.parse(data);
    settings.action_parameters = newactionParameters; // Update only action_parameters
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
    return { success: true };
  } catch (error) {
    console.error('Error writing settings:', error);
    return { success: false, error };
  }
});

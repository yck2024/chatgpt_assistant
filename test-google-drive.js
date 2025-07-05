// Google Drive Test Page JavaScript
// This file contains all the functionality for testing Google Drive integration

// Import Google Drive service
let googleDriveService = null;

// Initialize Google Drive service
async function initGoogleDriveService() {
    try {
        googleDriveService = new GoogleDriveService();
        return true;
    } catch (error) {
        console.error('Failed to initialize Google Drive service:', error);
        return false;
    }
}

// Test functions
async function checkExtensionStatus() {
    const statusDiv = document.getElementById('extension-status');
    statusDiv.innerHTML = '<div class="status info">Checking extension status...</div>';
    
    try {
        if (!googleDriveService) {
            await initGoogleDriveService();
        }

        const manifest = chrome.runtime.getManifest();
        const isAuth = await googleDriveService.isAuthenticated();
        const file = isAuth ? await googleDriveService.findFile() : null;

        statusDiv.innerHTML = `
            <div class="status success">
                <strong>Extension Status:</strong> OK<br>
                <strong>Extension ID:</strong> ${chrome.runtime.id}<br>
                <strong>Version:</strong> ${manifest.version}<br>
                <strong>Authenticated:</strong> ${isAuth}<br>
                <strong>File Found:</strong> ${file ? 'Yes' : 'No'}<br>
                ${file ? `<strong>File Name:</strong> ${file.name}<br><strong>Modified:</strong> ${new Date(file.modifiedTime).toLocaleString()}` : ''}
            </div>
        `;
    } catch (error) {
        statusDiv.innerHTML = `<div class="status error">Extension error: ${error.message}</div>`;
    }
}

async function testAuth() {
    const statusDiv = document.getElementById('auth-status');
    statusDiv.innerHTML = '<div class="status info">Authenticating...</div>';
    
    try {
        if (!googleDriveService) {
            await initGoogleDriveService();
        }

        await googleDriveService.authenticate();
        const isAuth = await googleDriveService.isAuthenticated();
        
        if (isAuth) {
            statusDiv.innerHTML = '<div class="status success">Authentication successful!</div>';
        } else {
            statusDiv.innerHTML = '<div class="status error">Authentication failed</div>';
        }
    } catch (error) {
        statusDiv.innerHTML = `<div class="status error">Authentication error: ${error.message}</div>`;
    }
}

async function checkAuthStatus() {
    const statusDiv = document.getElementById('auth-status');
    statusDiv.innerHTML = '<div class="status info">Checking auth status...</div>';
    
    try {
        if (!googleDriveService) {
            await initGoogleDriveService();
        }

        const isAuth = await googleDriveService.isAuthenticated();
        const file = isAuth ? await googleDriveService.findFile() : null;
        
        statusDiv.innerHTML = `
            <div class="status ${isAuth ? 'success' : 'error'}">
                <strong>Auth Status:</strong> ${isAuth ? 'Authenticated' : 'Not authenticated'}<br>
                ${file ? `<strong>File:</strong> ${file.name}<br><strong>Modified:</strong> ${new Date(file.modifiedTime).toLocaleString()}` : ''}
            </div>
        `;
    } catch (error) {
        statusDiv.innerHTML = `<div class="status error">Auth status error: ${error.message}</div>`;
    }
}

async function testUpload() {
    const statusDiv = document.getElementById('file-status');
    statusDiv.innerHTML = '<div class="status info">Uploading test data...</div>';
    
    const testPrompts = {
        "testUpload": "This is a test upload from the test page",
        "timestamp": new Date().toISOString()
    };
    
    try {
        if (!googleDriveService) {
            await initGoogleDriveService();
        }

        await googleDriveService.uploadPrompts(testPrompts);
        statusDiv.innerHTML = '<div class="status success">Upload successful!</div>';
    } catch (error) {
        statusDiv.innerHTML = `<div class="status error">Upload error: ${error.message}</div>`;
    }
}

async function testDownload() {
    const statusDiv = document.getElementById('file-status');
    statusDiv.innerHTML = '<div class="status info">Downloading data...</div>';
    
    try {
        if (!googleDriveService) {
            await initGoogleDriveService();
        }

        const prompts = await googleDriveService.downloadPrompts();
        statusDiv.innerHTML = `
            <div class="status success">
                <strong>Download successful!</strong><br>
                <strong>Prompts found:</strong> ${Object.keys(prompts).length}<br>
                <pre>${JSON.stringify(prompts, null, 2)}</pre>
            </div>
        `;
    } catch (error) {
        statusDiv.innerHTML = `<div class="status error">Download error: ${error.message}</div>`;
    }
}

async function testDisconnect() {
    const statusDiv = document.getElementById('file-status');
    statusDiv.innerHTML = '<div class="status info">Disconnecting...</div>';
    
    try {
        if (!googleDriveService) {
            await initGoogleDriveService();
        }

        await googleDriveService.init();
        await googleDriveService.clearAllData();
        statusDiv.innerHTML = '<div class="status success">Disconnected successfully!</div>';
    } catch (error) {
        statusDiv.innerHTML = `<div class="status error">Disconnect error: ${error.message}</div>`;
    }
}

async function uploadTestData() {
    const statusDiv = document.getElementById('file-status');
    const testDataText = document.getElementById('test-prompts').value;
    
    try {
        const testPrompts = JSON.parse(testDataText);
        statusDiv.innerHTML = '<div class="status info">Uploading custom test data...</div>';
        
        if (!googleDriveService) {
            await initGoogleDriveService();
        }

        await googleDriveService.uploadPrompts(testPrompts);
        statusDiv.innerHTML = '<div class="status success">Custom test data uploaded successfully!</div>';
    } catch (error) {
        statusDiv.innerHTML = `<div class="status error">Upload error: ${error.message}</div>`;
    }
}

// Setup event listeners when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Add event listeners to buttons
    document.getElementById('check-extension-btn').addEventListener('click', checkExtensionStatus);
    document.getElementById('test-auth-btn').addEventListener('click', testAuth);
    document.getElementById('check-auth-btn').addEventListener('click', checkAuthStatus);
    document.getElementById('test-upload-btn').addEventListener('click', testUpload);
    document.getElementById('test-download-btn').addEventListener('click', testDownload);
    document.getElementById('test-disconnect-btn').addEventListener('click', testDisconnect);
    document.getElementById('upload-test-data-btn').addEventListener('click', uploadTestData);

    // Auto-check extension status on page load
    setTimeout(checkExtensionStatus, 1000);
}); 
// OAuth2 Debug Page JavaScript
// This file contains all the functionality for debugging OAuth2 configuration

// Get extension information
async function getExtensionInfo() {
    const infoDiv = document.getElementById('extension-info');
    infoDiv.innerHTML = '<div class="status info">Getting extension information...</div>';
    
    try {
        const manifest = chrome.runtime.getManifest();
        const extensionId = chrome.runtime.id;
        
        infoDiv.innerHTML = `
            <div class="status success">
                <strong>Extension ID:</strong> ${extensionId}<br>
                <strong>Version:</strong> ${manifest.version}<br>
                <strong>Name:</strong> ${manifest.name}<br>
                <strong>OAuth2 Client ID:</strong> ${manifest.oauth2?.client_id || 'Not configured'}<br>
                <strong>OAuth2 Scopes:</strong> ${manifest.oauth2?.scopes?.join(', ') || 'Not configured'}
            </div>
            <div class="status warning">
                <strong>Important:</strong> Make sure this Extension ID matches exactly in your Google Cloud Console OAuth2 credentials.
            </div>
        `;
    } catch (error) {
        infoDiv.innerHTML = `<div class="status error">Error getting extension info: ${error.message}</div>`;
    }
}

// Test OAuth2 configuration
async function testOAuthConfig() {
    const configDiv = document.getElementById('oauth-config');
    configDiv.innerHTML = '<div class="status info">Testing OAuth2 configuration...</div>';
    
    try {
        // Test if identity API is available
        if (!chrome.identity) {
            configDiv.innerHTML = '<div class="status error">Chrome identity API not available. Make sure "identity" permission is in manifest.json</div>';
            return;
        }

        // Test getting auth token with interactive: false first
        const token = await new Promise((resolve, reject) => {
            chrome.identity.getAuthToken({ interactive: false }, (token) => {
                if (chrome.runtime.lastError) {
                    reject(new Error(chrome.runtime.lastError.message));
                } else {
                    resolve(token);
                }
            });
        });

        configDiv.innerHTML = `
            <div class="status success">
                <strong>OAuth2 Configuration:</strong> Working!<br>
                <strong>Token obtained:</strong> ${token ? 'Yes' : 'No'}<br>
                <strong>Token preview:</strong> ${token ? token.substring(0, 20) + '...' : 'None'}
            </div>
        `;
    } catch (error) {
        configDiv.innerHTML = `
            <div class="status error">
                <strong>OAuth2 Configuration Error:</strong> ${error.message}<br>
                <strong>Common causes:</strong>
                <ul>
                    <li>Extension ID mismatch in Google Cloud Console</li>
                    <li>OAuth consent screen not configured</li>
                    <li>Google Drive API not enabled</li>
                    <li>User not added as test user</li>
                </ul>
            </div>
        `;
    }
}

// Show setup checklist
function showChecklist() {
    const configDiv = document.getElementById('oauth-config');
    configDiv.innerHTML = `
        <div class="checklist">
            <h4>OAuth2 Setup Checklist</h4>
            <ul>
                <li>✅ Create Google Cloud Project</li>
                <li>✅ Enable Google Drive API</li>
                <li>✅ Configure OAuth Consent Screen</li>
                <li>✅ Add scope: https://www.googleapis.com/auth/drive.file</li>
                <li>✅ Add your email as test user</li>
                <li>✅ Create OAuth 2.0 Client ID (Chrome Extension type)</li>
                <li>✅ Set Application ID to your extension ID</li>
                <li>✅ Update manifest.json with client_id</li>
                <li>✅ Update google-drive-service.js with client_id</li>
                <li>✅ Reload extension in Chrome</li>
            </ul>
            <p><strong>Extension ID to use:</strong> <code>${chrome.runtime.id}</code></p>
        </div>
    `;
}

// Test detailed authentication
async function testDetailedAuth() {
    const testDiv = document.getElementById('detailed-test');
    testDiv.innerHTML = '<div class="status info">Testing detailed authentication...</div>';
    
    try {
        // Step 1: Test non-interactive token
        testDiv.innerHTML = '<div class="status info">Step 1: Testing non-interactive token...</div>';
        
        const nonInteractiveToken = await new Promise((resolve, reject) => {
            chrome.identity.getAuthToken({ interactive: false }, (token) => {
                if (chrome.runtime.lastError) {
                    reject(new Error(chrome.runtime.lastError.message));
                } else {
                    resolve(token);
                }
            });
        });

        testDiv.innerHTML = '<div class="status success">Step 1: Non-interactive token obtained successfully</div>';
        
        // Step 2: Test interactive token
        testDiv.innerHTML += '<div class="status info">Step 2: Testing interactive token...</div>';
        
        const interactiveToken = await new Promise((resolve, reject) => {
            chrome.identity.getAuthToken({ interactive: true }, (token) => {
                if (chrome.runtime.lastError) {
                    reject(new Error(chrome.runtime.lastError.message));
                } else {
                    resolve(token);
                }
            });
        });

        testDiv.innerHTML += '<div class="status success">Step 2: Interactive token obtained successfully</div>';
        testDiv.innerHTML += '<div class="status success"><strong>Authentication Test:</strong> PASSED!</div>';
        
    } catch (error) {
        testDiv.innerHTML = `
            <div class="status error">
                <strong>Authentication Test Failed:</strong> ${error.message}<br>
                <pre>${error.stack}</pre>
            </div>
        `;
    }
}

// Test manual token
async function testManualToken() {
    const testDiv = document.getElementById('manual-test');
    testDiv.innerHTML = '<div class="status info">Testing manual token retrieval...</div>';
    
    try {
        const token = await new Promise((resolve, reject) => {
            chrome.identity.getAuthToken({ interactive: true }, (token) => {
                if (chrome.runtime.lastError) {
                    reject(new Error(chrome.runtime.lastError.message));
                } else {
                    resolve(token);
                }
            });
        });

        if (token) {
            // Test the token with a simple Google API call
            const response = await fetch('https://www.googleapis.com/oauth2/v1/userinfo', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const userInfo = await response.json();
                testDiv.innerHTML = `
                    <div class="status success">
                        <strong>Token Test:</strong> SUCCESS!<br>
                        <strong>User Email:</strong> ${userInfo.email}<br>
                        <strong>Token Valid:</strong> Yes
                    </div>
                `;
            } else {
                testDiv.innerHTML = `
                    <div class="status error">
                        <strong>Token Test:</strong> FAILED<br>
                        <strong>Response Status:</strong> ${response.status}<br>
                        <strong>Response Text:</strong> ${await response.text()}
                    </div>
                `;
            }
        } else {
            testDiv.innerHTML = '<div class="status error">No token obtained</div>';
        }
    } catch (error) {
        testDiv.innerHTML = `
            <div class="status error">
                <strong>Manual Token Test Failed:</strong> ${error.message}
            </div>
        `;
    }
}

// Setup event listeners when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Add event listeners to buttons
    document.getElementById('get-extension-info-btn').addEventListener('click', getExtensionInfo);
    document.getElementById('test-oauth-config-btn').addEventListener('click', testOAuthConfig);
    document.getElementById('show-checklist-btn').addEventListener('click', showChecklist);
    document.getElementById('test-detailed-auth-btn').addEventListener('click', testDetailedAuth);
    document.getElementById('test-manual-token-btn').addEventListener('click', testManualToken);

    // Auto-run extension info on page load
    setTimeout(getExtensionInfo, 1000);
}); 
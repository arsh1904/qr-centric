// ==========================================================================
// MATRIXFORGE DECODER SYSTEM LOGIC & HEURISTIC THREAT ENGINE
// ==========================================================================

let html5QrcodeScanner = null;

document.addEventListener("DOMContentLoaded", () => {
    initMatrixScanner();
    
    // Wire up our premium file selector input
    const fileInput = document.getElementById('custom-file-input');
    if (fileInput) {
        fileInput.addEventListener('change', handleFileSelection);
    }
});

function initMatrixScanner() {
    html5QrcodeScanner = new Html5QrcodeScanner(
        "reader", 
        { 
            fps: 24, 
            qrbox: { width: 250, height: 250 },
            rememberLastUsedCamera: true
        },
        false
    );
    
    html5QrcodeScanner.render(onScanSuccess, onScanFailure);

    // Watcher loop to safely detect video hardware and display/hide Stop controls panel
    setInterval(() => {
        const videoStreamActive = document.querySelector('#reader video');
        const stopControlPanel = document.getElementById('camera-controls');
        
        if (stopControlPanel) {
            if (videoStreamActive) {
                stopControlPanel.classList.remove('hidden');
            } else {
                stopControlPanel.classList.add('hidden');
            }
        }
    }, 600);

    // Bind event handler directly to stop camera action
    const stopButton = document.getElementById('stop-cam-btn');
    if (stopButton) {
        stopButton.addEventListener('click', terminateCameraFeedProtocol);
    }
}

// Clear camera thread loop safely via native cleanup methods
function terminateCameraFeedProtocol() {
    if (html5QrcodeScanner) {
        html5QrcodeScanner.clear().then(() => {
            document.getElementById('camera-controls').classList.add('hidden');
            
            // Clean view window and inject custom boot button
            document.getElementById('reader').innerHTML = `
                <div style="text-align:center; padding: 40px; color:#64748b; font-family:'JetBrains Mono';">
                    [ CAMERA STREAM TERMINATED ]<br><br>
                    <button onclick="location.reload()" style="max-width:220px; padding:12px; font-size:12px;">Re-Initialize Mainframe</button>
                </div>`;
        }).catch(err => console.error("Critical failure during camera sweep context release.", err));
    }
}

// Success Decoded Handler Panel
function onScanSuccess(decodedText, decodedResult) {
    const resultContainer = document.getElementById('result-container');
    const scannedResultDisplay = document.getElementById('scanned-result');
    
    if (resultContainer && scannedResultDisplay) {
        resultContainer.classList.remove('hidden');
        scannedResultDisplay.innerText = decodedText;
        
        // Pass decoded data directly into static heuristic parser
        analyzeQRThreatLevel(decodedText);
    }
}

function onScanFailure(error) {
    // Intercept frame noise errors silently
}

// Image Selection Upload Handler
function handleFileSelection(e) {
    if (e.target.files.length === 0) return;
    
    const imageFile = e.target.files[0];
    const html5QrCode = new Html5Qrcode("reader");
    
    html5QrCode.scanFile(imageFile, true)
        .then(decodedText => {
            onScanSuccess(decodedText, null);
        })
        .catch(err => {
            const resultContainer = document.getElementById('result-container');
            const scannedResultDisplay = document.getElementById('scanned-result');
            if (resultContainer && scannedResultDisplay) {
                resultContainer.classList.remove('hidden');
                scannedResultDisplay.innerText = "ERROR: Failed to resolve valid matrix string from data packet.";
                document.getElementById('safety-badge').innerText = "MALFORMED RECOVERY";
            }
        });
}

// Heuristic Static-Analysis Validation Rules
function analyzeQRThreatLevel(scannedUrl) {
    const safetyBadge = document.getElementById('safety-badge');
    const warningText = document.getElementById('safety-warning-text');
    
    if (!safetyBadge || !warningText) return;
    
    warningText.classList.add('hidden');
    warningText.innerText = '';

    const fraudPatterns = [
        /^(http|https):\/\/(\d{1,3}\.){3}\d{1,3}/i,
        /\.(xyz|top|click|country|stream|download)$/i,
        /wp-admin|login|secure-bank|credential/i
    ];

    const suspiciousPatterns = [
        /bit\.ly|tinyurl\.com|t\.co|goo\.gl|is\.gd/i,
        /^http:\/\//i
    ];

    if (fraudPatterns.some(pattern => pattern.test(scannedUrl))) {
        safetyBadge.innerText = "CRITICAL THREAT / FRAUD";
        safetyBadge.style.background = "rgba(255, 51, 102, 0.15)";
        safetyBadge.style.color = "#ff3366";
        safetyBadge.style.border = "1px solid rgba(255, 51, 102, 0.4)";
        
        warningText.innerText = "WARNING: Phishing vector or raw untrusted mainframe node detected. Navigation protocol aborted.";
        warningText.classList.remove('hidden');
        warningText.style.color = "#ff3366";
        warningText.style.marginTop = "12px";

    } else if (suspiciousPatterns.some(pattern => pattern.test(scannedUrl))) {
        safetyBadge.innerText = "SUSPICIOUS UNVERIFIED";
        safetyBadge.style.background = "rgba(255, 170, 0, 0.15)";
        safetyBadge.style.color = "#ffaa00";
        safetyBadge.style.border = "1px solid rgba(255, 170, 0, 0.4)";
        
        warningText.innerText = "NOTICE: Masked URL alias or unencrypted link shortener identified. Verify target credentials.";
        warningText.classList.remove('hidden');
        warningText.style.color = "#ffaa00";
        warningText.style.marginTop = "12px";

    } else {
        safetyBadge.innerText = "SECURE PROTOCOL / SAFE";
        safetyBadge.style.background = "rgba(0, 255, 135, 0.15)";
        safetyBadge.style.color = "#00ff87";
        safetyBadge.style.border = "1px solid rgba(0, 255, 135, 0.4)";
    }
}
document.addEventListener("DOMContentLoaded", () => {
    const resultContainer = document.getElementById("result-container");
    const scannedResult = document.getElementById("scanned-result");
    const resetBtn = document.getElementById("reset-btn");
    const laser = document.querySelector(".scanner-laser");
    const fileInput = document.getElementById("custom-file-input");
    const safetyBadge = document.getElementById("safety-badge");
    const safetyWarningText = document.getElementById("safety-warning-text");

    const config = {
        fps: 15, 
        qrbox: { width: 260, height: 260 },
        aspectRatio: 1.0
    };

    const html5QrcodeScanner = new Html5QrcodeScanner("reader", config, false);

    // --- SECURITY ANALYSIS ENGINE ---
    function analyzeURLSafety(text) {
        // Default clean state for plain text data strings
        let safetyScore = "SAFE"; 
        let message = "This code contains raw text data and doesn't redirect to an external link.";

        if (text.startsWith("http://") || text.startsWith("https://")) {
            const urlString = text.toLowerCase();
            
            // 1. Check for insecure unencrypted protocols
            if (urlString.startsWith("http://")) {
                return {
                    status: "DANGEROUS",
                    class: "status-danger",
                    message: "🚨 CRITICAL: This link uses an unencrypted (HTTP) connection. Attackers can spy on your session or steal credentials."
                };
            }

            // 2. Scan for high-risk phishing keywords disguised inside domain structures
            const phishingKeywords = ["login", "verify", "signin", "banking", "secure-update", "wallet", "kyc", "paypal"];
            let foundKeywords = phishingKeywords.filter(keyword => urlString.includes(keyword));

            // 3. Scan for untrusted suspicious top-level domain zones commonly used by bad actors
            const untrustedTLDs = [".zip", ".mov", ".top", ".xyz", ".click", ".gq", ".tk", ".cf"];
            let matchingTLD = untrustedTLDs.find(tld => urlString.includes(tld));

            if (foundKeywords.length > 0) {
                safetyScore = "SUSPICIOUS";
                message = `⚠️ WARNING: This URL contains words often used in scam pages (${foundKeywords.join(", ")}). Inspect the domain closely before proceeding.`;
            } else if (matchingTLD) {
                safetyScore = "SUSPICIOUS";
                message = `⚠️ WARNING: This link goes to an unusual domain extension (${matchingTLD}) frequently used to deploy hidden downloads or malicious scripts.`;
            } else {
                safetyScore = "VERIFIED SAFE";
                message = "🛡️ SECURE: This link uses high-grade HTTPS encryption and shows zero immediate red flags.";
            }
        }

        return {
            status: safetyScore,
            class: safetyScore === "VERIFIED SAFE" ? "status-safe" : "status-suspicious",
            message: message
        };
    }

    function onScanSuccess(decodedText) {
        html5QrcodeScanner.clear();
        laser.style.display = "none"; 

        // Run the security appraisal engine on decoded payload data
        const analysis = analyzeURLSafety(decodedText);

        // Update Safety Badges UI styles dynamically
        safetyBadge.innerText = anonymityOverride(analysis.status);
        safetyBadge.className = `safety-badge-placeholder ${analysis.class}`;
        
        safetyWarningText.innerText = analysis.message;
        safetyWarningText.className = `safety-warning-text ${analysis.class} warning-visible`;

        // Render target url strings as clickable elements safely
        if (decodedText.startsWith("http://") || decodedText.startsWith("https://")) {
            scannedResult.innerHTML = `<a href="${decodedText}" target="_blank">${decodedText}</a>`;
        } else {
            scannedResult.innerText = decodedText;
        }

        resultContainer.classList.remove("hidden");
    }

    function anonymityOverride(status) {
        return status;
    }

    html5QrcodeScanner.render(onScanSuccess, (err) => {});

    fileInput.addEventListener("change", e => {
        if (e.target.files.length === 0) return;
        const imageFile = e.target.files[0];
        const html5QrCode = new Html5Qrcode("reader");
        
        html5QrCode.scanFile(imageFile, true)
            .then(decodedText => {
                onScanSuccess(decodedText);
            })
            .catch(err => {
                alert("Could not find a valid QR code in this image.");
            });
    });

    const observer = new MutationObserver(() => {
        const videoElement = document.querySelector("#reader video");
        laser.style.display = videoElement ? "block" : "none";
    });
    observer.observe(document.getElementById("reader"), { childList: true, subtree: true });

    resetBtn.addEventListener("click", () => {
        resultContainer.classList.add("hidden");
        scannedResult.innerHTML = "";
        safetyWarningText.className = "hidden";
        fileInput.value = "";
        html5QrcodeScanner.render(onScanSuccess, (err) => {});
    });
});
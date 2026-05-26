document.addEventListener("DOMContentLoaded", () => {
    const resultContainer = document.getElementById("result-container");
    const scannedResult = document.getElementById("scanned-result");
    const resetBtn = document.getElementById("reset-btn");
    const laser = document.querySelector(".scanner-laser");
    const fileInput = document.getElementById("custom-file-input");

    const config = {
        fps: 15, 
        qrbox: { width: 260, height: 260 },
        aspectRatio: 1.0
    };

    const html5QrcodeScanner = new Html5QrcodeScanner("reader", config, false);

    function onScanSuccess(decodedText) {
        html5QrcodeScanner.clear();
        laser.style.display = "none"; 

        if (decodedText.startsWith("http://") || decodedText.startsWith("https://")) {
            scannedResult.innerHTML = `<a href="${decodedText}" target="_blank">${decodedText}</a>`;
        } else {
            scannedResult.innerText = decodedText;
        }

        resultContainer.classList.remove("hidden");
    }

    html5QrcodeScanner.render(onScanSuccess, (err) => {});

    // Intercept manual file input modifications
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

    // Track active DOM view transformations for execution animations
    const observer = new MutationObserver(() => {
        const videoElement = document.querySelector("#reader video");
        laser.style.display = videoElement ? "block" : "none";
    });
    observer.observe(document.getElementById("reader"), { childList: true, subtree: true });

    resetBtn.addEventListener("click", () => {
        resultContainer.classList.add("hidden");
        scannedResult.innerHTML = "";
        fileInput.value = "";
        html5QrcodeScanner.render(onScanSuccess, (err) => {});
    });
});
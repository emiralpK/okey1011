// Global variables
let video = document.getElementById('video');
let canvasOutput = document.getElementById('canvasOutput');
let ctx = canvasOutput.getContext('2d');
let startBtn = document.getElementById('startBtn');
let snapBtn = document.getElementById('snapBtn');
let flipBtn = document.getElementById('flipBtn');
let statusElement = document.getElementById('status');
let scoreElement = document.getElementById('score');
let detectedTokensElement = document.getElementById('detectedTokens');
let loadingOverlay = document.getElementById('loadingOverlay');
let debugToggle = document.getElementById('debugToggle');

// OpenCV modules
let cv = {};
let src, dst, cap;
let isProcessing = false;
let isCameraStarted = false;
let usingFrontCamera = false;
let isDebugMode = false;

// Processing interval handler
let processIntervalId = null;

// Initialize the application when OpenCV is ready
function onOpenCvReady() {
    cv = window.cv;
    updateStatus('OpenCV.js yüklendi! Başlat butonuna basın.');
    loadingOverlay.style.display = 'none';
    
    startBtn.disabled = false;
    
    // Set up event listeners
    startBtn.addEventListener('click', toggleCamera);
    snapBtn.addEventListener('click', processFrame);
    flipBtn.addEventListener('click', flipCamera);
    debugToggle.addEventListener('change', (e) => {
        isDebugMode = e.target.checked;
    });

    // Make sure we free resources when page is unloaded
    window.addEventListener('beforeunload', () => {
        stopCamera();
    });
}

function onOpenCvError() {
    updateStatus('OpenCV.js yüklenirken hata oluştu!', 'danger');
    loadingOverlay.style.display = 'none';
}

// Toggle camera on/off
function toggleCamera() {
    if (!isCameraStarted) {
        startCamera();
    } else {
        stopCamera();
    }
}

// Start the camera
async function startCamera() {
    try {
        updateStatus('Kamera erişimi isteniyor...', 'info');
        
        // Define constraints - requesting back camera by default
        const constraints = {
            video: {
                facingMode: usingFrontCamera ? 'user' : 'environment',
                width: { ideal: 1280 },
                height: { ideal: 720 }
            }
        };

        // Get access to the camera
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        
        // Update UI
        video.srcObject = stream;
        canvasOutput.width = video.videoWidth || 640;
        canvasOutput.height = video.videoHeight || 480;
        
        // Wait for video to be ready
        await new Promise(resolve => {
            video.onloadedmetadata = () => {
                resolve();
            };
        });
        
        // Update status and buttons
        updateStatus('Kamera başlatıldı! Okey tahtasını gösterin.', 'success');
        startBtn.textContent = 'Durdur';
        snapBtn.disabled = false;
        isCameraStarted = true;
        
        // Initialize OpenCV video capture
        cap = new cv.VideoCapture(video);
        src = new cv.Mat(video.height, video.width, cv.CV_8UC4);
        dst = new cv.Mat(video.height, video.width, cv.CV_8UC4);
        
        // Start continuous processing
        startContinuousProcessing();
        
    } catch (error) {
        console.error('Kamera erişiminde hata:', error);
        updateStatus('Kamera erişim hatası: ' + error.message, 'danger');
    }
}

// Stop the camera
function stopCamera() {
    if (isCameraStarted) {
        // Stop video track
        const stream = video.srcObject;
        const tracks = stream.getTracks();
        tracks.forEach(track => track.stop());
        video.srcObject = null;
        
        // Stop processing
        stopContinuousProcessing();
        
        // Free OpenCV resources
        if (src) src.delete();
        if (dst) dst.delete();
        
        // Update UI
        updateStatus('Kamera durduruldu', 'info');
        startBtn.textContent = 'Başlat';
        snapBtn.disabled = true;
        isCameraStarted = false;
    }
}

// Flip between front and back camera
async function flipCamera() {
    if (isCameraStarted) {
        stopCamera();
        usingFrontCamera = !usingFrontCamera;
        await startCamera();
    } else {
        usingFrontCamera = !usingFrontCamera;
        updateStatus(`Kamera ${usingFrontCamera ? 'ön' : 'arka'} olarak ayarlandı`, 'info');
    }
}

// Start continuous frame processing
function startContinuousProcessing() {
    stopContinuousProcessing(); // Ensure we don't have multiple intervals
    
    // Process frame every 500ms
    processIntervalId = setInterval(() => {
        if (!isProcessing && isCameraStarted) {
            processFrame();
        }
    }, 500);
}

// Stop continuous processing
function stopContinuousProcessing() {
    if (processIntervalId) {
        clearInterval(processIntervalId);
        processIntervalId = null;
    }
}

// Process a single frame
function processFrame() {
    if (!isCameraStarted || isProcessing) return;
    
    isProcessing = true;
    
    try {
        // Capture frame from video
        cap.read(src);
        
        // Process the frame
        let boardFound = detectBoard(src, dst, isDebugMode);
        
        if (boardFound) {
            // If board is detected, detect tokens
            let tokens = detectTokens(dst, isDebugMode);
            
            // Calculate score based on detected tokens
            let score = calculateScore(tokens);
            
            // Update UI with score
            updateScoreUI(score);
            
            // Update UI with detected tokens
            displayDetectedTokens(tokens);
        } else {
            updateStatus('Okey tahtası bulunamadı. Lütfen tahtayı kameraya gösterin.', 'warning');
            scoreElement.textContent = 'Senin elin: 0 puan';
            detectedTokensElement.innerHTML = '';
        }
        
        // Display the processed image
        cv.imshow('canvasOutput', dst);
        
    } catch (error) {
        console.error('Frame processing error:', error);
        updateStatus('Görüntü işleme hatası: ' + error.message, 'danger');
    } finally {
        isProcessing = false;
    }
}

// Update status message
function updateStatus(message, type = 'info') {
    statusElement.className = 'alert alert-' + type;
    statusElement.textContent = message;
}

// Update the score UI
function updateScoreUI(score) {
    scoreElement.textContent = `Senin elin: ${score} puan`;
    scoreElement.classList.add('score-highlight');
    
    // Remove the highlight effect after 2 seconds
    setTimeout(() => {
        scoreElement.classList.remove('score-highlight');
    }, 2000);
}

// Display detected tokens in the UI
function displayDetectedTokens(tokens) {
    detectedTokensElement.innerHTML = '';
    
    tokens.forEach(token => {
        const tokenElement = document.createElement('div');
        tokenElement.classList.add('token');
        
        // Set appropriate class based on color
        if (token.color === 'red') {
            tokenElement.classList.add('red-token');
        } else if (token.color === 'black') {
            tokenElement.classList.add('black-token');
        } else if (token.color === 'yellow') {
            tokenElement.classList.add('yellow-token');
        } else if (token.color === 'blue') {
            tokenElement.classList.add('blue-token');
        } else if (token.color === 'joker') {
            tokenElement.classList.add('joker-token');
        }
        
        // Set the token value
        tokenElement.textContent = token.value;
        
        detectedTokensElement.appendChild(tokenElement);
    });
    
    // Update status message
    updateStatus(`${tokens.length} taş tespit edildi`, 'success');
}
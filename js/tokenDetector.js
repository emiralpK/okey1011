/**
 * Token Detection Module
 * This module handles detecting Okey game tokens ("taşlar") 
 * and recognizing their colors and numbers
 */

// Detect and recognize tokens on the board
function detectTokens(src, debug = false) {
    // Array to store the detected tokens
    let tokens = [];
    
    // Create temporary matrices
    let gray = new cv.Mat();
    let hsv = new cv.Mat();
    let blurred = new cv.Mat();
    let thresh = new cv.Mat();
    let hierarchy = new cv.Mat();
    let contours = new cv.MatVector();
    
    try {
        // Convert to HSV for color detection
        cv.cvtColor(src, hsv, cv.COLOR_RGBA2RGB);
        cv.cvtColor(hsv, hsv, cv.COLOR_RGB2HSV);
        
        // Convert to grayscale for shape detection
        cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
        
        // Apply Gaussian blur to reduce noise
        cv.GaussianBlur(gray, blurred, new cv.Size(5, 5), 0);
        
        // Apply adaptive threshold to find token contours
        cv.adaptiveThreshold(blurred, thresh, 255, 
                            cv.ADAPTIVE_THRESH_GAUSSIAN_C, 
                            cv.THRESH_BINARY_INV, 11, 2);
        
        // Find contours
        cv.findContours(thresh, contours, hierarchy, 
                       cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);
        
        // Draw contours if in debug mode
        if (debug) {
            let contoursColor = new cv.Scalar(0, 255, 0, 255);
            cv.drawContours(src, contours, -1, contoursColor, 2);
        }
        
        // Process each contour
        for (let i = 0; i < contours.size(); ++i) {
            const contour = contours.get(i);
            const area = cv.contourArea(contour);
            
            // Filter by area - tokens should have a reasonable size
            if (area > 1000 && area < 15000) {
                // Get the bounding rectangle
                const rect = cv.boundingRect(contour);
                
                // Check if it has roughly token proportions (height > width)
                if (rect.height > rect.width * 1.2 && rect.height < rect.width * 2) {
                    // Draw rectangle if in debug mode
                    if (debug) {
                        let point1 = new cv.Point(rect.x, rect.y);
                        let point2 = new cv.Point(rect.x + rect.width, rect.y + rect.height);
                        cv.rectangle(src, point1, point2, new cv.Scalar(255, 0, 0, 255), 2);
                    }
                    
                    // Extract the token region
                    let roi = src.roi(rect);
                    let roiHsv = hsv.roi(rect);
                    
                    // Determine the color of the token
                    const tokenColor = determineTokenColor(roiHsv);
                    
                    // Determine the value of the token
                    const tokenValue = recognizeTokenValue(roi);
                    
                    // Add the token to our collection
                    tokens.push({
                        color: tokenColor,
                        value: tokenValue,
                        rect: rect
                    });
                    
                    // Label the token if in debug mode
                    if (debug) {
                        let text = `${tokenValue} (${tokenColor})`;
                        let textPoint = new cv.Point(rect.x, rect.y - 10);
                        cv.putText(src, text, textPoint, cv.FONT_HERSHEY_SIMPLEX, 
                                  0.5, new cv.Scalar(255, 255, 255, 255), 2);
                    }
                }
            }
        }
    } finally {
        // Cleanup temporary matrices
        gray.delete();
        hsv.delete();
        blurred.delete();
        thresh.delete();
        contours.delete();
        hierarchy.delete();
    }
    
    return tokens;
}

// Determine the color of a token from its HSV image
function determineTokenColor(hsvRoi) {
    // Create masks for different colors
    let redMask1 = new cv.Mat();
    let redMask2 = new cv.Mat();
    let blackMask = new cv.Mat();
    let yellowMask = new cv.Mat();
    let blueMask = new cv.Mat();
    let greenMask = new cv.Mat(); // For joker detection
    
    try {
        // Define HSV ranges for each color
        // Red wraps around the H value in HSV, so we need two ranges
        cv.inRange(hsvRoi, new cv.Scalar(0, 100, 100), new cv.Scalar(10, 255, 255), redMask1);
        cv.inRange(hsvRoi, new cv.Scalar(160, 100, 100), new cv.Scalar(180, 255, 255), redMask2);
        
        // Black has low saturation and value
        cv.inRange(hsvRoi, new cv.Scalar(0, 0, 0), new cv.Scalar(180, 50, 100), blackMask);
        
        // Yellow range
        cv.inRange(hsvRoi, new cv.Scalar(20, 100, 100), new cv.Scalar(35, 255, 255), yellowMask);
        
        // Blue range
        cv.inRange(hsvRoi, new cv.Scalar(100, 100, 100), new cv.Scalar(130, 255, 255), blueMask);
        
        // Green range (for joker)
        cv.inRange(hsvRoi, new cv.Scalar(40, 100, 100), new cv.Scalar(80, 255, 255), greenMask);
        
        // Combine red masks
        let redMask = new cv.Mat();
        cv.add(redMask1, redMask2, redMask);
        
        // Count non-zero pixels for each color
        const redPixels = cv.countNonZero(redMask);
        const blackPixels = cv.countNonZero(blackMask);
        const yellowPixels = cv.countNonZero(yellowMask);
        const bluePixels = cv.countNonZero(blueMask);
        const greenPixels = cv.countNonZero(greenMask);
        
        redMask.delete();
        
        // Determine dominant color
        const colorCounts = [
            { color: 'red', count: redPixels },
            { color: 'black', count: blackPixels },
            { color: 'yellow', count: yellowPixels },
            { color: 'blue', count: bluePixels },
            { color: 'joker', count: greenPixels }
        ];
        
        // Sort by pixel count in descending order
        colorCounts.sort((a, b) => b.count - a.count);
        
        // Return the dominant color if it has enough pixels
        if (colorCounts[0].count > 100) {
            return colorCounts[0].color;
        }
        
        // Default to black if no clear color is detected
        return 'black';
        
    } finally {
        // Cleanup masks
        redMask1.delete();
        redMask2.delete();
        blackMask.delete();
        yellowMask.delete();
        blueMask.delete();
        greenMask.delete();
    }
}

// Recognize the value (number) on a token
function recognizeTokenValue(roi) {
    // For simplicity in this version, we'll use a basic approach to number recognition
    // A more robust implementation would use OCR or pre-trained models
    
    // Create grayscale and binary image for digit recognition
    let gray = new cv.Mat();
    let binary = new cv.Mat();
    
    try {
        cv.cvtColor(roi, gray, cv.COLOR_RGBA2GRAY);
        
        // Apply adaptive threshold to isolate the digit
        cv.adaptiveThreshold(gray, binary, 255, 
                            cv.ADAPTIVE_THRESH_GAUSSIAN_C, 
                            cv.THRESH_BINARY_INV, 11, 5);
        
        // For this simplified version, we'll extract features based on the 
        // location and density of pixels in the top vs bottom half of the token
        
        // Divide the image into upper and lower halves
        const height = binary.rows;
        const width = binary.cols;
        const halfHeight = Math.floor(height / 2);
        
        let upperHalf = binary.roi(new cv.Rect(0, 0, width, halfHeight));
        let lowerHalf = binary.roi(new cv.Rect(0, halfHeight, width, height - halfHeight));
        
        // Count white pixels in each half
        const upperPixels = cv.countNonZero(upperHalf);
        const lowerPixels = cv.countNonZero(lowerHalf);
        
        // Calculate density ratios
        const totalPixels = width * height;
        const upperRatio = upperPixels / (width * halfHeight);
        const lowerRatio = lowerPixels / (width * (height - halfHeight));
        const ratio = upperRatio / lowerRatio;
        
        // Simple heuristic rules for number recognition
        // These rules are very simplified and would need to be improved
        // for a production system with OCR or machine learning
        
        // Use density patterns to guess the number
        if (ratio < 0.5) {
            return '9'; // More pixels in bottom
        } else if (ratio > 1.8) {
            return '7'; // More pixels in top
        } else if (upperRatio > 0.3 && lowerRatio > 0.3) {
            return '8'; // Balanced density
        } else if (upperRatio < 0.15) {
            return '1'; // Few pixels overall, mostly in bottom
        } else {
            // For simplicity, we'll return random numbers
            // In a real app, we would use template matching or OCR
            return String(Math.floor(Math.random() * 13) + 1);
        }
    } finally {
        gray.delete();
        binary.delete();
    }
}
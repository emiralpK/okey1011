/**
 * Board Detection Module
 * This module handles detecting the Okey 101 board in the image
 */

// Detect the Okey board in the image and perform perspective correction
function detectBoard(src, dst, debug = false) {
    // Make a copy of the source image
    src.copyTo(dst);
    
    // Create temporary matrices for processing
    let gray = new cv.Mat();
    let blurred = new cv.Mat();
    let edges = new cv.Mat();
    let hierarchy = new cv.Mat();
    let contours = new cv.MatVector();
    
    try {
        // Convert to grayscale for processing
        cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
        
        // Apply Gaussian blur to reduce noise
        cv.GaussianBlur(gray, blurred, new cv.Size(5, 5), 0);
        
        // Detect edges using Canny
        cv.Canny(blurred, edges, 75, 200);
        
        // Find contours
        cv.findContours(edges, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);
        
        // Draw contours if in debug mode
        if (debug) {
            let contoursColor = new cv.Scalar(0, 255, 0, 255);
            cv.drawContours(dst, contours, -1, contoursColor, 2);
        }
        
        // Find the largest contour which might be the board
        let maxArea = 0;
        let maxContourIndex = -1;
        
        for (let i = 0; i < contours.size(); ++i) {
            const contour = contours.get(i);
            const area = cv.contourArea(contour);
            
            if (area > maxArea) {
                maxArea = area;
                maxContourIndex = i;
            }
        }
        
        // If we found a contour with significant area
        if (maxArea > 10000) {
            const contour = contours.get(maxContourIndex);
            
            // Approximate the contour to find the rectangle
            let epsilon = 0.02 * cv.arcLength(contour, true);
            let approx = new cv.Mat();
            cv.approxPolyDP(contour, approx, epsilon, true);
            
            // The board should be approximately a rectangle (4 points)
            if (approx.rows === 4) {
                // Draw the contour in red if in debug mode
                if (debug) {
                    let boardColor = new cv.Scalar(255, 0, 0, 255);
                    cv.drawContours(dst, contours, maxContourIndex, boardColor, 4);
                    
                    // Draw the corners
                    for (let i = 0; i < 4; i++) {
                        let point = new cv.Point(approx.data32S[i*2], approx.data32S[i*2+1]);
                        cv.circle(dst, point, 10, new cv.Scalar(0, 0, 255, 255), -1);
                    }
                }
                
                // Apply perspective transform to get a top-down view of the board
                let boardCorners = [];
                for (let i = 0; i < 4; i++) {
                    boardCorners.push({
                        x: approx.data32S[i*2],
                        y: approx.data32S[i*2+1]
                    });
                }
                
                // Sort corners in order: top-left, top-right, bottom-right, bottom-left
                boardCorners = sortCorners(boardCorners);
                
                // Calculate the width and height of the board
                let width = Math.max(
                    distance(boardCorners[0], boardCorners[1]),
                    distance(boardCorners[3], boardCorners[2])
                );
                let height = Math.max(
                    distance(boardCorners[0], boardCorners[3]),
                    distance(boardCorners[1], boardCorners[2])
                );
                
                // Make width and height consistent for a nice rectangle
                width = Math.max(width, height * 2 / 3);
                height = Math.max(height, width * 2 / 3);
                
                // Create source and destination points for perspective transform
                let srcTri = cv.matFromArray(4, 1, cv.CV_32FC2, [
                    boardCorners[0].x, boardCorners[0].y,
                    boardCorners[1].x, boardCorners[1].y,
                    boardCorners[2].x, boardCorners[2].y,
                    boardCorners[3].x, boardCorners[3].y
                ]);
                
                let dstTri = cv.matFromArray(4, 1, cv.CV_32FC2, [
                    0, 0,
                    width-1, 0,
                    width-1, height-1,
                    0, height-1
                ]);
                
                // Perform the perspective transform
                let M = cv.getPerspectiveTransform(srcTri, dstTri);
                let warped = new cv.Mat();
                cv.warpPerspective(src, warped, M, new cv.Size(width, height));
                
                // Copy the warped image to dst
                cv.resize(warped, dst, new cv.Size(src.cols, src.rows));
                
                // Cleanup temporary matrices
                srcTri.delete();
                dstTri.delete();
                M.delete();
                warped.delete();
                approx.delete();
                
                return true;
            }
            approx.delete();
        }
    } finally {
        // Cleanup all temporary matrices
        gray.delete();
        blurred.delete();
        edges.delete();
        contours.delete();
        hierarchy.delete();
    }
    
    return false;
}

// Helper function to calculate distance between two points
function distance(pt1, pt2) {
    return Math.sqrt(Math.pow(pt2.x - pt1.x, 2) + Math.pow(pt2.y - pt1.y, 2));
}

// Helper function to sort corner points
function sortCorners(corners) {
    // First, calculate the center point
    let center = {x: 0, y: 0};
    corners.forEach(corner => {
        center.x += corner.x;
        center.y += corner.y;
    });
    center.x /= corners.length;
    center.y /= corners.length;
    
    // Separate corners into top and bottom
    let top = [];
    let bottom = [];
    
    corners.forEach(corner => {
        if (corner.y < center.y) {
            top.push(corner);
        } else {
            bottom.push(corner);
        }
    });
    
    // Sort top corners by x-coordinate (left to right)
    top.sort((a, b) => a.x - b.x);
    
    // Sort bottom corners by x-coordinate (left to right)
    bottom.sort((a, b) => a.x - b.x);
    
    // Return corners in clockwise order: top-left, top-right, bottom-right, bottom-left
    return [top[0], top[top.length-1], bottom[bottom.length-1], bottom[0]];
}
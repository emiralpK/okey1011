/**
 * Scoring Module
 * This module calculates the score of an Okey 101 hand
 * based on the detected tokens
 */

// Calculate the score based on the detected tokens
function calculateScore(tokens) {
    // If no tokens detected, return 0
    if (!tokens || tokens.length === 0) {
        return 0;
    }
    
    // Group tokens by their values
    const valueGroups = groupTokensByValue(tokens);
    
    // Group tokens by their colors
    const colorGroups = groupTokensByColor(tokens);
    
    // Calculate score for groups (same value, different colors)
    const groupScore = calculateGroupScore(valueGroups);
    
    // Calculate score for runs (consecutive values, same color)
    const runScore = calculateRunScore(colorGroups);
    
    // The final score is the higher of group and run scores
    return Math.max(groupScore, runScore);
}

// Group tokens by their value (number)
function groupTokensByValue(tokens) {
    const groups = {};
    
    tokens.forEach(token => {
        if (!groups[token.value]) {
            groups[token.value] = [];
        }
        groups[token.value].push(token);
    });
    
    return groups;
}

// Group tokens by their color
function groupTokensByColor(tokens) {
    const groups = {
        'red': [],
        'black': [],
        'yellow': [],
        'blue': [],
        'joker': []
    };
    
    tokens.forEach(token => {
        if (groups[token.color]) {
            groups[token.color].push(token);
        }
    });
    
    return groups;
}

// Calculate score for groups (same value, different colors)
function calculateGroupScore(valueGroups) {
    let totalScore = 0;
    let jokerCount = 0;
    
    // Count jokers separately
    if (valueGroups['joker']) {
        jokerCount = valueGroups['joker'].length;
        delete valueGroups['joker'];
    }
    
    // Calculate score for each value group
    for (const value in valueGroups) {
        const group = valueGroups[value];
        
        // Groups need at least 3 tokens or 2 tokens + joker(s)
        if (group.length + jokerCount >= 3) {
            const tokensToUse = Math.min(group.length, 4); // Max 4 colors
            const jokersToUse = Math.min(jokerCount, 3 - group.length);
            
            // Each token in the group scores its face value
            totalScore += parseInt(value) * (tokensToUse + jokersToUse);
            
            // Deduct used jokers from available jokers
            jokerCount -= jokersToUse;
        }
    }
    
    return totalScore;
}

// Calculate score for runs (consecutive values, same color)
function calculateRunScore(colorGroups) {
    let totalScore = 0;
    const jokers = colorGroups['joker'] || [];
    
    // Process each color separately
    for (const color in colorGroups) {
        if (color === 'joker') continue; // Skip joker color
        
        const colorTokens = colorGroups[color];
        if (colorTokens.length === 0) continue;
        
        // Sort tokens by value
        colorTokens.sort((a, b) => parseInt(a.value) - parseInt(b.value));
        
        // Find runs with optional jokers
        const runs = findRuns(colorTokens, jokers);
        
        // Add up the score from each run
        runs.forEach(run => {
            totalScore += calculateRunValue(run);
        });
    }
    
    return totalScore;
}

// Find runs (sequences) in a color with optional jokers
function findRuns(tokens, jokers) {
    if (tokens.length === 0) return [];
    
    const runs = [];
    let currentRun = [tokens[0]];
    let availableJokers = jokers.length;
    
    // Process tokens to find runs
    for (let i = 1; i < tokens.length; i++) {
        const prev = parseInt(currentRun[currentRun.length - 1].value);
        const current = parseInt(tokens[i].value);
        
        if (current === prev) {
            // Skip duplicates
            continue;
        } else if (current === prev + 1) {
            // Consecutive token, add to run
            currentRun.push(tokens[i]);
        } else {
            // Gap in sequence
            const gap = current - prev - 1;
            
            // If we have enough jokers to fill the gap
            if (gap <= availableJokers) {
                // Add jokers to fill the gap
                for (let j = 0; j < gap; j++) {
                    currentRun.push({ 
                        color: 'joker', 
                        value: String(prev + j + 1)
                    });
                }
                availableJokers -= gap;
                currentRun.push(tokens[i]);
            } else {
                // Gap too large, end the current run if it's valid
                if (currentRun.length >= 3) {
                    runs.push([...currentRun]);
                }
                currentRun = [tokens[i]];
            }
        }
    }
    
    // Add the last run if valid
    if (currentRun.length >= 3) {
        runs.push(currentRun);
    }
    
    return runs;
}

// Calculate the value of a run
function calculateRunValue(run) {
    let score = 0;
    
    run.forEach(token => {
        // Each token in a run scores its face value
        score += parseInt(token.value);
    });
    
    return score;
}
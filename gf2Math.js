/**
 * Performs XOR operation on two binary strings.
 * @param {string} aStr - First binary string.
 * @param {string} bStr - Second binary string (must be same length as aStr).
 * @returns {string} Binary string representing aStr XOR bStr.
 */
function xor(aStr, bStr) {
    let result = '';
    for (let i = 0; i < aStr.length; i++) {
        result += (parseInt(aStr[i]) ^ parseInt(bStr[i])).toString();
    }
    return result;
}

/**
 * Calculates the steps for binary polynomial division.
 * @param {string} dividendStr - The dividend binary string.
 * @param {string} divisorStr - The divisor binary string.
 * @returns {Array<object>} An array of step objects for the division process.
 */
function calculateDivisionSteps(dividendStr, divisorStr) {
    const divisorLen = divisorStr.length;
    let remainderLen = divisorLen - 1;
    if (remainderLen < 0) remainderLen = 0; // Should not happen with guard divisorLen >= 1

    // Edge Case: Dividend shorter than divisor OR Divisor length is 1
    // As per issue: "Guard divisor length = 1 and “dividend shorter than divisor” early;
    // produce quotient “0” and remainder dividend.padStart(divisorLen-1, '0')"
    if (dividendStr.length < divisorLen || divisorLen === 1) {
        const finalRem = dividendStr.padStart(remainderLen, '0');
        // For display, currentDividendSegmentForStepRow should be the part of dividend
        // that would align with divisor, or full dividend if it's shorter.
        // If divisorLen is 1, take first bit of dividend.
        // If dividend is shorter, take full dividend.
        let displaySegment = dividendStr.substring(0, divisorLen);
        if (dividendStr.length < divisorLen) {
            displaySegment = dividendStr;
        }
        displaySegment = displaySegment.padStart(divisorLen, '0');


        let xorOp = '0'.repeat(divisorLen);
        let xorRes = displaySegment; // Effectively, segment XOR 0s is segment
        if (divisorLen === 1 && dividendStr.startsWith('1')) { // Specific for divisor "1" if we want to show actual XOR
             // This part deviates from the strict "quotient 0" rule if we want to show a logical step for divisor "1"
             // However, the rule implies quotient "0" regardless. So we stick to that.
        }


        return [{
            quotient: "0",
            currentDividendSegmentForStepRow: displaySegment,
            xorOperand: xorOp, // Show XOR with zeros for consistency if segment is shown
            xorResult: xorRes,   // Result of that XOR
            newRemainderSegment: finalRem, // This is the key result
            stepAlignmentChars: 0,
            isFinalStep: true,
            finalRemainderValue: finalRem,
            mainDividendHighlightStart: 0,
            mainDividendHighlightEnd: dividendStr.length, // Highlight the whole dividend as it becomes remainder
            broughtDownBitOriginalIndex: -1,
            newQuotientBitIndex: -1,
            latestQuotientBit: '',
            bitBroughtDownForExplanation: ''
        }];
    }

    let steps = [];
    let currentDividendSegment = dividendStr.substring(0, divisorLen);
    let quotient = "";
    let dividendProcessedIndex = divisorLen;

    // Initial Step (Step 0)
    steps.push({
        quotient: "",
        currentDividendSegmentForStepRow: currentDividendSegment,
        xorOperand: "", // No XOR yet
        xorResult: "",  // No XOR yet
        newRemainderSegment: currentDividendSegment, 
        stepAlignmentChars: 0,
        isFinalStep: false, // Will be true if loop doesn't run (e.g. dividend len == divisor len)
        finalRemainderValue: null,
        mainDividendHighlightStart: 0,
        mainDividendHighlightEnd: divisorLen,
        broughtDownBitOriginalIndex: -1,
        newQuotientBitIndex: -1,
        latestQuotientBit: '',
        bitBroughtDownForExplanation: ''
    });

    // Main Algorithm Loop
    for (let i = 0; i <= dividendStr.length - divisorLen; i++) {
        const quotientBit = (currentDividendSegment[0] === '1') ? '1' : '0';
        quotient += quotientBit;

        const xorOperand = (quotientBit === '1') ? divisorStr : '0'.repeat(divisorLen);
        const xorResult = xor(currentDividendSegment, xorOperand);

        let nextBitBroughtDown = '';
        if (dividendProcessedIndex < dividendStr.length) {
            nextBitBroughtDown = dividendStr[dividendProcessedIndex];
        }

        const remainderAfterXor = xorResult.substring(1);
        const newSegmentForNextStep = remainderAfterXor + nextBitBroughtDown;
        
        const isFinalIteration = (dividendProcessedIndex === dividendStr.length);
        // If it's the first actual processing step (i=0) AND it's also the final iteration
        // (meaning dividend.length == divisor.length), then this step becomes the final one.
        if (i === 0 && dividendStr.length === divisorLen) {
             // This condition is implicitly handled by isFinalIteration logic below
        }


        const finalPaddedRemainder = isFinalIteration ? remainderAfterXor.padStart(remainderLen, '0') : null;

        // Update step 0 if this is the first pass of the loop (i=0) and it's also the final step
        // This handles the case where dividend.length === divisor.length
        if (i === 0 && isFinalIteration) {
            steps[0].isFinalStep = true;
            steps[0].finalRemainderValue = finalPaddedRemainder;
            steps[0].quotient = quotient; // Update quotient for step 0
            steps[0].xorOperand = xorOperand;
            steps[0].xorResult = xorResult;
            // newRemainderSegment for step 0 in this case is actually the final remainder
            steps[0].newRemainderSegment = remainderAfterXor; // before padding for display segment
            steps[0].latestQuotientBit = quotientBit;
            steps[0].newQuotientBitIndex = quotient.length -1;
            // No more steps to add
        } else if (i === 0) { // First step, but not final
             steps[0].quotient = quotient;
             steps[0].xorOperand = xorOperand;
             steps[0].xorResult = xorResult;
             steps[0].newRemainderSegment = newSegmentForNextStep;
             steps[0].latestQuotientBit = quotientBit;
             steps[0].newQuotientBitIndex = quotient.length -1;
             steps[0].bitBroughtDownForExplanation = nextBitBroughtDown;
             steps[0].broughtDownBitOriginalIndex = (nextBitBroughtDown !== '') ? dividendProcessedIndex : -1;
             steps[0].mainDividendHighlightEnd = Math.min(divisorLen + 1, dividendStr.length);


        } else {
             steps.push({
                quotient: quotient,
                currentDividendSegmentForStepRow: currentDividendSegment,
                xorOperand: xorOperand,
                xorResult: xorResult,
                newRemainderSegment: newSegmentForNextStep,
                stepAlignmentChars: i,
                isFinalStep: isFinalIteration,
                finalRemainderValue: finalPaddedRemainder,
                mainDividendHighlightStart: i,
                mainDividendHighlightEnd: i + divisorLen + (nextBitBroughtDown !== '' ? 1:0), // Highlight up to the brought down bit
                broughtDownBitOriginalIndex: (nextBitBroughtDown !== '') ? dividendProcessedIndex : -1,
                newQuotientBitIndex: quotient.length - 1,
                latestQuotientBit: quotientBit,
                bitBroughtDownForExplanation: nextBitBroughtDown
            });
        }
        
        currentDividendSegment = newSegmentForNextStep;
        dividendProcessedIndex++;
         // If the first step (step 0) was made final (dividend len == divisor len), exit loop.
        if (steps[0].isFinalStep && steps.length === 1) break;
    }
    
    // Adjusting step 0's newRemainderSegment if loop ran.
    // Step 0's newRemainderSegment should be what it had *before* the first actual XOR if it's not the only step.
    // The loop logic above for (i===0) already updates step[0] with the result of the first XOR.
    // If dividendStr.length === divisorStr.length, steps[0] is the only step and correctly configured.
    // If dividendStr.length > divisorStr.length, steps[0] is updated by the first iteration (i=0),
    // and then subsequent steps are pushed.
    
    // The initial step (before any XOR) should show the initial segment.
    // The first "action" step should show the first XOR.
    // Let's refine the structure:
    // Step 0: Initial state.
    // Step 1 (from loop i=0): First XOR op.
    // Step 2 (from loop i=1): Second XOR op. ...

    if (dividendStr.length > divisorLen) { // If the loop ran more than once or updated step 0 significantly
        const firstProcessingStep = steps[0]; // This is now the result of the first XOR operation
        
        // Create a *true* initial step (Step 0) that shows the state *before* any processing
        const initialDisplaySegment = dividendStr.substring(0, divisorLen);
        const trueInitialStep = {
            quotient: "",
            currentDividendSegmentForStepRow: initialDisplaySegment,
            xorOperand: "", 
            xorResult: "",  
            newRemainderSegment: initialDisplaySegment, 
            stepAlignmentChars: 0,
            isFinalStep: false, 
            finalRemainderValue: null,
            mainDividendHighlightStart: 0,
            mainDividendHighlightEnd: divisorLen,
            broughtDownBitOriginalIndex: -1,
            newQuotientBitIndex: -1,
            latestQuotientBit: '',
            bitBroughtDownForExplanation: ''
        };

        // Reconstruct 'steps' array
        let newSteps = [trueInitialStep];
        let loopIteration = 0;
        currentDividendSegment = dividendStr.substring(0, divisorLen); // Reset for logic
        quotient = "";
        dividendProcessedIndex = divisorLen;

        for (let i = 0; i <= dividendStr.length - divisorLen; i++) {
            const quotientBit = (currentDividendSegment[0] === '1') ? '1' : '0';
            quotient += quotientBit;
            const xorOperand = (quotientBit === '1') ? divisorStr : '0'.repeat(divisorLen);
            const xorResult = xor(currentDividendSegment, xorOperand);
            let nextBitBroughtDown = (dividendProcessedIndex < dividendStr.length) ? dividendStr[dividendProcessedIndex] : '';
            const remainderAfterXor = xorResult.substring(1);
            const newSegmentForNextStep = remainderAfterXor + nextBitBroughtDown;
            const isFinalIteration = (dividendProcessedIndex === dividendStr.length);
            const finalPaddedRemainder = isFinalIteration ? remainderAfterXor.padStart(remainderLen, '0') : null;

            newSteps.push({
                quotient: quotient,
                currentDividendSegmentForStepRow: currentDividendSegment,
                xorOperand: xorOperand,
                xorResult: xorResult,
                newRemainderSegment: newSegmentForNextStep, // This is for the *next* step's currentDividendSegment
                stepAlignmentChars: i, // This aligns the operation block
                isFinalStep: isFinalIteration,
                finalRemainderValue: finalPaddedRemainder,
                mainDividendHighlightStart: i, 
                mainDividendHighlightEnd: i + divisorLen + (nextBitBroughtDown !== '' ? 1 : 0) -1, // Highlight up to and including current segment
                broughtDownBitOriginalIndex: (nextBitBroughtDown !== '') ? dividendProcessedIndex : -1,
                newQuotientBitIndex: quotient.length - 1,
                latestQuotientBit: quotientBit,
                bitBroughtDownForExplanation: nextBitBroughtDown
            });
            currentDividendSegment = newSegmentForNextStep;
            dividendProcessedIndex++;
        }
        // Correct mainDividendHighlightEnd for the last step to not exceed dividend length
        if (newSteps.length > 1) {
            const lastProcessedStep = newSteps[newSteps.length-1];
            lastProcessedStep.mainDividendHighlightEnd = dividendStr.length;
            if (lastProcessedStep.broughtDownBitOriginalIndex === -1) { // No bit brought down, end of dividend processed
                 lastProcessedStep.mainDividendHighlightEnd = lastProcessedStep.mainDividendHighlightStart + divisorLen;
            } else {
                 lastProcessedStep.mainDividendHighlightEnd = lastProcessedStep.broughtDownBitOriginalIndex +1;
            }


            // For all other steps, mainDividendHighlightEnd should be start + divisorLen unless a bit is brought down
             for(let k=1; k < newSteps.length -1; k++) {
                const step = newSteps[k];
                 if (step.broughtDownBitOriginalIndex !== -1) {
                    step.mainDividendHighlightEnd = step.broughtDownBitOriginalIndex + 1;
                 } else {
                    step.mainDividendHighlightEnd = step.mainDividendHighlightStart + divisorLen;
                 }
             }
        }


        return newSteps;
    } else if (dividendStr.length === divisorLen) { // Only step 0 was modified, which is correct
        steps[0].mainDividendHighlightEnd = dividendStr.length; // ensure highlight is correct
        return steps;
    }


    return steps; // Should ideally be covered by the refined logic above
}

export { xor, calculateDivisionSteps };

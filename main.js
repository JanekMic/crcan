// main.js
import { calculateDivisionSteps } from './gf2Math.js';
import { 
    cacheDOMElements, renderDividend, renderDivisor, renderQuotient, 
    renderCurrentRemainder, renderFinalRemainder, updateStepDisplay, 
    updateExplanationText, updateCurrentValuesDisplay, renderDivisionSteps, 
    toggleSummaryView, clearArrows, addArrow, updateButtonStates 
} from './uiRenderer.js';

// State Variables
const initialDividend = "1100110000";
const initialDivisor = "11001";
let currentDividendStr = initialDividend;
let currentDivisorStr = initialDivisor;
let steps = [];
let currentStepIndex = 0;
let isPlaying = false;
let animationFrameId = null; // Stores ID from requestAnimationFrame
let lastFrameTime = 0;    // Timestamp of the last frame
let animationSpeed = 1500; // Default speed in ms per step
let summaryVisible = false;

// Bit Caches - these arrays will store the DOM elements for each bit
const dividendBitsCache = [];
const divisorBitsCache = [];
const quotientBitsCache = [];
const currentRemainderBitsCache = [];
const finalRemainderBitsCache = [];
const divisionStepsRenderCache = {}; // For more complex step rendering later

// DOM Element IDs Mapping
const domElementIds = {
    dividendDisplay: 'dividend-display',
    divisorDisplay: 'divisor-display',
    quotientDisplay: 'quotient-display',
    divisionSteps: 'division-steps',
    currentRemainderDisplay: 'current-remainder-display',
    finalRemainderDisplay: 'final-remainder-display',
    arrowContainer: 'arrow-container',
    stepDisplay: 'step-display',
    explanationText: 'explanation-text',
    currentValuesDisplay: 'current-values-display',
    summarySection: 'summary-section',
    summaryViewContent: 'summary-view-content',
    animationSection: 'animation-section',
    // Buttons
    prevBtn: 'prev-btn',
    playPauseBtn: 'play-pause-btn',
    nextBtn: 'next-btn',
    resetBtn: 'reset-btn',
    summaryBtn: 'summary-btn',
    // Inputs
    dividendInput: 'dividend-input',
    divisorInput: 'divisor-input',
    applyInputsBtn: 'apply-inputs-btn',
    speedSelect: 'speed-select',
    // Error messages
    dividendError: 'dividend-error',
    divisorError: 'divisor-error'
};

// Store DOM elements for main.js specific use (event listeners, direct manipulation)
const mainDom = {}; 

// Store DOM elements for main.js specific use (event listeners, direct manipulation)
const mainDom = {}; 

// --- Helper functions for input validation ---
function showInputError(fieldKey, message) {
    const errorEl = mainDom[fieldKey + 'Error']; // e.g., mainDom['dividendError']
    const inputEl = mainDom[fieldKey + 'Input']; // e.g., mainDom['dividendInput']
    if (errorEl) {
        errorEl.textContent = message;
        errorEl.classList.remove('hidden');
    }
    if (inputEl) inputEl.classList.add('border-red-500');
}

function clearInputError(fieldKey) {
    const errorEl = mainDom[fieldKey + 'Error'];
    const inputEl = mainDom[fieldKey + 'Input'];
    if (errorEl) {
        errorEl.textContent = '';
        errorEl.classList.add('hidden');
    }
    if (inputEl) inputEl.classList.remove('border-red-500');
}

function validateBinaryInputs(dividend, divisor) {
    const binaryRegex = /^[01]+$/;
    if (!dividend) return { isValid: false, field: 'dividend', message: "Dividend darf nicht leer sein." };
    if (!binaryRegex.test(dividend)) return { isValid: false, field: 'dividend', message: "Dividend darf nur '0' und '1' enthalten." };
    
    if (!divisor) return { isValid: false, field: 'divisor', message: "Divisor darf nicht leer sein." };
    if (!binaryRegex.test(divisor)) return { isValid: false, field: 'divisor', message: "Divisor darf nur '0' und '1' enthalten." };
    if (divisor.length < 2) return { isValid: false, field: 'divisor', message: "Divisor muss mindestens 2 Bit lang sein." };
    if (!divisor.startsWith('1')) return { isValid: false, field: 'divisor', message: "Divisor muss mit '1' beginnen." };
    
    if (dividend.length < divisor.length && divisor.length > 1) { 
         return { isValid: false, field: 'dividend', message: "Dividend muss bei Divisorlänge > 1 mindestens so lang sein wie der Divisor." };
    }
    return { isValid: true };
}

// --- Helper functions for styling/highlights ---
function getDividendHighlights(stepData) {
    if (!stepData) return {};
    const highlights = {};
    // Highlight the portion of the dividend currently being processed or aligned with the divisor.
    if (stepData.mainDividendHighlightStart !== undefined && stepData.mainDividendHighlightEnd !== undefined) {
        for (let i = stepData.mainDividendHighlightStart; i < stepData.mainDividendHighlightEnd; i++) {
            if (i < currentDividendStr.length) { // Ensure we don't try to highlight beyond actual dividend length
                 highlights[i] = (highlights[i] || []).concat('active');
            }
        }
    }
    // Highlight the bit that was just "brought down".
    if (stepData.broughtDownBitOriginalIndex !== -1 && stepData.broughtDownBitOriginalIndex < currentDividendStr.length) {
        highlights[stepData.broughtDownBitOriginalIndex] = (highlights[stepData.broughtDownBitOriginalIndex] || []).concat('brought-down');
    }
    return highlights;
}

function getQuotientHighlights(stepData) {
    if (!stepData || stepData.newQuotientBitIndex === undefined || stepData.newQuotientBitIndex === -1) return {};
    // Highlight the most recently calculated quotient bit.
    return { [stepData.newQuotientBitIndex]: 'quotient-bit-new' };
}

function getExplanationForStep(stepIndex, stepData, dividend, divisor) {
    if (!stepData) return "Lade Schrittdaten...";
    
    // More detailed explanation based on stepData fields from gf2Math.js
    let exp = \`<strong>Schritt \${stepIndex}:</strong> \`;
    if (stepIndex === 0 && steps.length > 1 && !steps[1].isFinalStep && dividend.length >= divisor.length) { // gf2Math step 0 is pre-computation
        exp += \`Startzustand. Dividend: <strong>\${dividend}</strong>, Divisor: <strong>\${divisor}</strong>. Das erste Segment des Dividenden (<strong>\${stepData.currentDividendSegmentForStepRow}</strong>) wird betrachtet.\`;
        return exp;
    }
    
    if (dividend.length < divisor.length || divisor.length === 1) { // Edge case handled by gf2Math
        exp += \`Dividend (<strong>\${dividend}</strong>) ist kürzer als Divisor (<strong>\${divisor}</strong>) oder Divisorlänge ist 1. Quotient ist <strong>0</strong>. Rest ist <strong>\${stepData.finalRemainderValue}</strong>.\`;
        return exp;
    }

    const currentSegment = stepData.currentDividendSegmentForStepRow;
    const quotientBit = stepData.latestQuotientBit;

    if (quotientBit === '1') {
        exp += \`Das erste Bit des aktuellen Segments (<strong>\${currentSegment}</strong>) ist '1'. Das nächste Quotientenbit ist <strong>'1'</strong>. \`;
        exp += \`XOR-Verknüpfung mit dem Divisor (<strong>\${stepData.xorOperand}</strong>). Ergebnis: <strong>\${stepData.xorResult}</strong>.\`;
    } else {
        exp += \`Das erste Bit des aktuellen Segments (<strong>\${currentSegment}</strong>) ist '0'. Das nächste Quotientenbit ist <strong>'0'</strong>. \`;
        exp += \`XOR-Verknüpfung mit Nullen (<strong>\${stepData.xorOperand}</strong>). Ergebnis: <strong>\${stepData.xorResult}</strong>.\`;
    }

    if (!stepData.isFinalStep) {
        if (stepData.bitBroughtDownForExplanation !== '') {
            exp += \` Das linkeste Bit ('\${stepData.xorResult[0]}') wird verworfen. Das nächste Bit '<strong>\${stepData.bitBroughtDownForExplanation}</strong>' vom Dividenden wird heruntergezogen. Neues Arbeitssegment: <strong>\${stepData.newRemainderSegment}</strong>.\`;
        } else {
            exp += \` Das linkeste Bit ('\${stepData.xorResult[0]}') wird verworfen. Kein weiteres Bit zum Herunterziehen. Neues Arbeitssegment: <strong>\${stepData.newRemainderSegment}</strong>.\`;
        }
    } else {
        exp += \` Das linkeste Bit ('\${stepData.xorResult[0]}') wird verworfen. Keine weiteren Bits zum Herunterziehen.\`;
        if (stepData.finalRemainderValue !== null) {
            exp += \` Der finale Rest ist: <strong>\${stepData.finalRemainderValue}</strong>.\`;
        }
    }
     if (stepData.isFinalStep) {
        exp += \`<br><strong>Division abgeschlossen.</strong> Finaler Quotient: <strong>\${stepData.quotient}</strong>, Finaler Rest: <strong>\${stepData.finalRemainderValue}</strong>.\`;
    }
    return exp;
}


// --- Core UI Update Function ---
function updateFullDisplay() {
    if (!steps || steps.length === 0 || currentStepIndex < 0 || currentStepIndex >= steps.length) {
        // console.warn("No steps data available or invalid currentStepIndex:", currentStepIndex, steps);
        renderDividend("", {}, dividendBitsCache);
        renderDivisor("", {}, divisorBitsCache);
        renderQuotient("", {}, quotientBitsCache);
        renderCurrentRemainder("", {}, currentRemainderBitsCache);
        renderFinalRemainder("", {}, finalRemainderBitsCache);
        updateStepDisplay("Fehler: Keine Schrittdaten");
        updateExplanationText("Bitte Eingaben überprüfen und neu starten.");
        updateButtonStates({
            prevDisabled: true,
            nextDisabled: true,
            playPauseText: 'Start',
            summaryDisabled: true
        });
        return;
    }
    const stepData = steps[currentStepIndex];
    if (!stepData) {
        // console.warn("Step data is undefined for currentStepIndex:", currentStepIndex, "Steps length:", steps.length);
        renderDividend("", {}, dividendBitsCache);
        renderDivisor("", {}, divisorBitsCache);
        renderQuotient("", {}, quotientBitsCache);
        renderCurrentRemainder("", {}, currentRemainderBitsCache);
        renderFinalRemainder("", {}, finalRemainderBitsCache);
        updateStepDisplay("Fehler: Keine Schrittdaten");
        updateExplanationText("Bitte Eingaben überprüfen und neu starten.");
        updateButtonStates({
            prevDisabled: true,
            nextDisabled: true,
            playPauseText: 'Start',
            summaryDisabled: true
        });
        return;
    }

    const dividendHighlightConfig = getDividendHighlights(stepData);
    renderDividend(currentDividendStr, { specialClasses: dividendHighlightConfig }, dividendBitsCache);
    
    renderDivisor(currentDivisorStr, {}, divisorBitsCache);
    
    const quotientHighlightConfig = getQuotientHighlights(stepData);
    renderQuotient(stepData.quotient || "", { specialClasses: quotientHighlightConfig }, quotientBitsCache);

    renderCurrentRemainder(stepData.newRemainderSegment || "", {}, currentRemainderBitsCache); 

    const finalRemVal = (stepData.isFinalStep && stepData.finalRemainderValue !== null && stepData.finalRemainderValue !== undefined) 
                        ? stepData.finalRemainderValue 
                        : "";
    renderFinalRemainder(finalRemVal, {}, finalRemainderBitsCache);

    // User-facing step numbers are usually 1-based for step 0 from array if it's a "setup" step.
    // Or, if gf2Math's step 0 is the first actual operation, then currentStepIndex could be direct.
    // Assuming gf2Math's step 0 is the initial state before operations.
    let userFacingStep = currentStepIndex; 
    if (steps.length > 1 && currentDividendStr.length >= currentDivisorStr.length && currentDivisorStr.length > 1) {
      // If not edge case and multiple steps, step 0 from array is setup, actual ops start at index 1
      // but we want to display "Schritt 0" for the setup and "Schritt 1" for the first op.
      // This means direct mapping is fine if gf2Math aligns its step array indices with user perception.
      // The getExplanationForStep handles step 0 specifically.
    }
    updateStepDisplay(\`Schritt \${userFacingStep}\`);
    updateExplanationText(getExplanationForStep(currentStepIndex, stepData, currentDividendStr, currentDivisorStr));

    updateButtonStates({
        prevDisabled: currentStepIndex === 0,
        nextDisabled: currentStepIndex >= steps.length - 1,
        playPauseText: isPlaying ? 'Pause' : (currentStepIndex >= steps.length - 1 && steps.length > 0 ? 'Start' : 'Fortsetzen'),
        summaryDisabled: !(steps[steps.length -1]?.isFinalStep && currentStepIndex === steps.length -1)
    });

    clearArrows();
    if (stepData.broughtDownBitOriginalIndex !== -1 && stepData.broughtDownBitOriginalIndex < dividendBitsCache.length) {
        if(dividendBitsCache[stepData.broughtDownBitOriginalIndex]) {
             addArrow(dividendBitsCache[stepData.broughtDownBitOriginalIndex]);
        }
    }
    
    // renderDivisionSteps is still a major stub, will be filled later
    renderDivisionSteps(currentStepIndex, steps, divisionStepsRenderCache);
}

// --- Event Handlers ---
function handleApplyInputs() {
    clearInputError('dividend');
    clearInputError('divisor');

    const dividendValue = mainDom.dividendInput.value.trim();
    const divisorValue = mainDom.divisorInput.value.trim();

    const validationResult = validateBinaryInputs(dividendValue, divisorValue);

    if (!validationResult.isValid) {
        showInputError(validationResult.field, validationResult.message);
        if (mainDom[validationResult.field + 'Input']) {
            mainDom[validationResult.field + 'Input'].focus();
        }
        return;
    }

    currentDividendStr = dividendValue;
    currentDivisorStr = divisorValue;
    resetAnimation(true);
}

function handleNextStep() {
    if (isPlaying && currentStepIndex >= steps.length - 1 && steps.length > 0) { 
        isPlaying = false;
        cancelAnimationFrame(animationFrameId);
        updateFullDisplay(); 
        return;
    }
    if (currentStepIndex < steps.length - 1) {
        currentStepIndex++;
        updateFullDisplay();
    }
}

function handlePrevStep() {
    if (currentStepIndex > 0) {
        currentStepIndex--;
        updateFullDisplay();
    }
}

function animationLoop(currentTime) {
    if (!isPlaying) return;

    const deltaTime = currentTime - lastFrameTime;

    if (deltaTime >= animationSpeed) {
        lastFrameTime = currentTime - (deltaTime % animationSpeed); 
        handleNextStep(); 
    }
    
    if (isPlaying) { 
        animationFrameId = requestAnimationFrame(animationLoop);
    }
}

function togglePlayPause() {
    isPlaying = !isPlaying;
    if (isPlaying) {
        if (currentStepIndex >= steps.length - 1 && steps.length > 0) { 
            currentStepIndex = 0;
            if (typeof renderDivisionSteps === 'function') {
                 renderDivisionSteps(currentStepIndex, steps, divisionStepsRenderCache, true); 
            }
        }
        updateFullDisplay(); 

        lastFrameTime = performance.now();
        animationFrameId = requestAnimationFrame(animationLoop);

        if (summaryVisible) {
            summaryVisible = false;
            toggleSummaryView(false, null); 
        }
    } else {
        cancelAnimationFrame(animationFrameId);
    }
    updateFullDisplay(); 
}

function handleSummaryToggle() {
    // Only allow toggle if animation is at the final step
    if (steps && steps.length > 0 && steps[steps.length - 1].isFinalStep && currentStepIndex === steps.length - 1) {
        summaryVisible = !summaryVisible;
        toggleSummaryView(summaryVisible, { allSteps: steps, dividend: currentDividendStr, divisor: currentDivisorStr }); 
        updateFullDisplay(); 
    }
}

function handleSpeedChange(event) {
    animationSpeed = parseInt(event.target.value);
}

function handleKeydown(event) {
    if (event.target === mainDom.dividendInput || event.target === mainDom.divisorInput) {
        return; // Ignore keyboard shortcuts if typing in input fields
    }
    switch (event.key) {
        case ' ':
            event.preventDefault();
            togglePlayPause();
            break;
        case 'ArrowRight':
            event.preventDefault();
            if (!isPlaying) handleNextStep(); // Only manually step if not playing
            break;
        case 'ArrowLeft':
            event.preventDefault();
            if (!isPlaying) handlePrevStep(); // Only manually step if not playing
            break;
    }
}

// --- Animation Control ---
function resetAnimation(isNewInput = false) {
    isPlaying = false;
    cancelAnimationFrame(animationFrameId); 
    animationFrameId = null; 
    lastFrameTime = 0;
    currentStepIndex = 0;
    
    if (summaryVisible) { 
        summaryVisible = false;
        toggleSummaryView(false, null); 
    }

    if (isNewInput) {
        currentDividendStr = mainDom.dividendInput ? mainDom.dividendInput.value.trim() : initialDividend;
        currentDivisorStr = mainDom.divisorInput ? mainDom.divisorInput.value.trim() : initialDivisor;
        
        if (!currentDividendStr) { 
            currentDividendStr = initialDividend;
            if(mainDom.dividendInput) mainDom.dividendInput.value = currentDividendStr;
        }
        if (!currentDivisorStr) { 
            currentDivisorStr = initialDivisor;
            if(mainDom.divisorInput) mainDom.divisorInput.value = currentDivisorStr;
        }

        steps = calculateDivisionSteps(currentDividendStr, currentDivisorStr);
        updateCurrentValuesDisplay(currentDividendStr, currentDivisorStr); 
        
        dividendBitsCache.length = 0;
        divisorBitsCache.length = 0;
        quotientBitsCache.length = 0;
        currentRemainderBitsCache.length = 0;
        finalRemainderBitsCache.length = 0;
        
        Object.keys(divisionStepsRenderCache).forEach(key => delete divisionStepsRenderCache[key]);
        if (typeof renderDivisionSteps === 'function') { 
            renderDivisionSteps(currentStepIndex, steps, divisionStepsRenderCache, true); 
        }
    }
    updateFullDisplay();
}

// --- Initialization ---
function init() {
    // Cache DOM elements for uiRenderer
    cacheDOMElements(domElementIds); 

    // Cache DOM elements for main.js event listeners and direct access
    for (const key in domElementIds) {
        mainDom[key] = document.getElementById(domElementIds[key]);
        if (!mainDom[key] && (key.endsWith('Btn') || key.endsWith('Input') || key.endsWith('Select') || key.endsWith('Error'))) { 
            // console.warn(`Main.js DOM element not found for key '${key}' with ID '${domElementIds[key]}'`);
        }
    }

    if (mainDom.dividendInput) mainDom.dividendInput.value = initialDividend;
    if (mainDom.divisorInput) mainDom.divisorInput.value = initialDivisor;
    
    resetAnimation(true); // This will read from inputs

    // Event Listeners using mainDom references
    if (mainDom.applyInputsBtn) mainDom.applyInputsBtn.addEventListener('click', handleApplyInputs);
    if (mainDom.playPauseBtn) mainDom.playPauseBtn.addEventListener('click', togglePlayPause);
    if (mainDom.nextBtn) mainDom.nextBtn.addEventListener('click', handleNextStep);
    if (mainDom.prevBtn) mainDom.prevBtn.addEventListener('click', handlePrevStep);
    if (mainDom.resetBtn) mainDom.resetBtn.addEventListener('click', () => resetAnimation(false)); 
    if (mainDom.summaryBtn) mainDom.summaryBtn.addEventListener('click', handleSummaryToggle);
    if (mainDom.speedSelect) {
        mainDom.speedSelect.addEventListener('change', handleSpeedChange);
        mainDom.speedSelect.value = animationSpeed.toString(); 
    }
    window.addEventListener('keydown', handleKeydown);
}

document.addEventListener('DOMContentLoaded', init);

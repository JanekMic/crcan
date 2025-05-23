// uiRenderer.js

// Helper to get DOM elements by ID or use passed element
function getElement(idOrElement) {
    if (typeof idOrElement === 'string') {
        return document.getElementById(idOrElement);
    }
    return idOrElement; // Assumed to be an element already
}

// Store frequently used DOM elements, populated by cacheDOMElements
const dom = {};

function cacheDOMElements(elementsToCache) {
  for (const key in elementsToCache) {
    dom[key] = getElement(elementsToCache[key]);
    if (!dom[key]) {
        // console.warn is useful for debugging but can be noisy if elements are conditionally rendered
        // console.warn(`DOM element not found for key '${key}' with ID '${elementsToCache[key]}'`);
    }
  }
}

function createBitElement(bitValue, classes = []) {
    const bitDiv = document.createElement('div');
    const effectiveClasses = Array.isArray(classes) ? classes : (classes ? [classes] : []);
    // Ensure 'bit' is always present and filter out any falsey class values
    const allClasses = ['bit', ...effectiveClasses.filter(c => c && typeof c === 'string')];
    // Deduplicate classes
    bitDiv.className = [...new Set(allClasses)].join(' ');
    bitDiv.textContent = bitValue;
    return bitDiv;
}

function renderBitContainer(containerElementOrId, bitString, config = {}) {
    const container = getElement(containerElementOrId);
    if (!container) {
        // Silently return if container isn't there, might be legit if UI part is hidden or not yet initialized
        return; 
    }

    const {
        specialClasses = {},
        baseBitClass = '',
        bitCache = [], 
        startIndex = 0
    } = config;

    // Ensure bitCache is treated as an array passed by reference for modification
    if (!Array.isArray(config.bitCache)) {
        // This function expects bitCache to be provided and managed by the caller.
        // If it's not an array, it cannot be updated by reference, so we might log an error or handle.
        // For now, we'll assume the caller initializes it correctly.
    }

    const desiredTotalBits = bitString.length + startIndex;

    // Adjust Cache/DOM Length: Remove surplus bits
    while (bitCache.length > desiredTotalBits) {
        const removedBit = bitCache.pop(); // Remove from cache
        if (removedBit && removedBit.parentNode === container) {
            container.removeChild(removedBit); // Remove from DOM
        }
    }

    // Adjust Cache/DOM Length: Add needed bits
    while (bitCache.length < desiredTotalBits) {
        const newBit = createBitElement('', []); // Create with minimal classes; will be fully styled in the update loop
        container.appendChild(newBit);
        bitCache.push(newBit); // Add to cache
    }
    
    const effectiveBaseClasses = Array.isArray(baseBitClass) ? baseBitClass.filter(Boolean) : (baseBitClass ? [baseBitClass] : []);

    // Update invisible placeholder bits (first `startIndex` bits in cache)
    for (let i = 0; i < startIndex; i++) {
        const bitElement = bitCache[i];
        if (bitElement) { // Check if bitElement exists (it should, due to loop above)
            bitElement.textContent = '';
            const placeholderClasses = ['bit', 'invisible', ...effectiveBaseClasses].filter(Boolean);
            bitElement.className = [...new Set(placeholderClasses)].join(' ');
        }
    }
    
    // Update actual bits (from `startIndex` to end of `bitString`)
    for (let i = 0; i < bitString.length; i++) {
        const cacheIndex = i + startIndex;
        const bitElement = bitCache[cacheIndex];
        if (bitElement) { // Check if bitElement exists
            bitElement.textContent = bitString[i];

            const currentSpecialClasses = specialClasses[i] 
                ? (Array.isArray(specialClasses[i]) ? specialClasses[i].filter(Boolean) : [specialClasses[i]].filter(Boolean)) 
                : [];
            
            const allClasses = ['bit', ...effectiveBaseClasses, ...currentSpecialClasses].filter(Boolean);
            bitElement.className = [...new Set(allClasses)].join(' ');
        }
    }
}

// --- Rendering functions using renderBitContainer ---
function renderDividend(dividendStr, config = {}, cache) { 
    if (!dom.dividendDisplay) return;
    renderBitContainer(dom.dividendDisplay, dividendStr, { ...config, bitCache: cache });
}

function renderDivisor(divisorStr, config = {}, cache) { 
    if (!dom.divisorDisplay) return;
    renderBitContainer(dom.divisorDisplay, divisorStr, { ...config, bitCache: cache });
}

function renderQuotient(quotientStr, config = {}, cache) { 
    if (!dom.quotientDisplay) return;
    renderBitContainer(dom.quotientDisplay, quotientStr, { ...config, bitCache: cache });
}

function renderCurrentRemainder(remainderStr, config = {}, cache) {
    if (!dom.currentRemainderDisplay) return;
    renderBitContainer(dom.currentRemainderDisplay, remainderStr, { ...config, bitCache: cache });
}

function renderFinalRemainder(remainderStr, config = {}, cache) {
    if (!dom.finalRemainderDisplay) return;
    renderBitContainer(dom.finalRemainderDisplay, remainderStr, { baseBitClass: 'result', ...config, bitCache: cache });
}

// --- Other UI update functions (Stubs or simple implementations) ---
function updateStepDisplay(currentStepText) {
    if (dom.stepDisplay) dom.stepDisplay.textContent = currentStepText;
}

function updateExplanationText(htmlContent) {
    if (dom.explanationText) dom.explanationText.innerHTML = htmlContent;
}

function updateCurrentValuesDisplay(dividend, divisor) {
    if (dom.currentValuesDisplay) {
        // Escape HTML for security if dividend/divisor could come from untrusted sources.
        // For this app, they are binary strings from validated input or defaults.
        const esc = (str) => str.replace(/</g, "&lt;").replace(/>/g, "&gt;");
        dom.currentValuesDisplay.innerHTML = \`Die Animation veranschaulicht die Bit-weise binäre Polynomdivision (Modulo-2-Arithmetik)
            für die Bitfolge <span class="font-mono bg-gray-200 px-1 py-0.5 rounded">\${esc(dividend)}</span>
            und das Generatorpolynom <span class="font-mono bg-gray-200 px-1 py-0.5 rounded">\${esc(divisor)}</span>.\`;
    }
}

function renderDivisionSteps(currentStepIndex, allStepsData, stepRenderCache = {}) { 
    if (dom.divisionSteps) {
      // Basic stub: Clear and indicate it's a placeholder.
      // Full implementation will be complex, involving loops, cloning templates, caching step elements etc.
      dom.divisionSteps.innerHTML = \`<p class="text-sm text-gray-500">Logik für detaillierte Schritte (aktueller Schritt: \${currentStepIndex + 1}) wird hier implementiert.</p>\`; 
    }
}

function toggleSummaryView(show, summaryRenderData = null) {
    if (!dom.summarySection || !dom.animationSection || !dom.explanationSection || !dom.summaryViewContent) {
        // console.warn("Summary view related DOM elements not found.");
        return;
    }
    if (show) {
        dom.summarySection.classList.remove('hidden');
        dom.animationSection.classList.add('hidden');
        dom.explanationSection.classList.add('hidden');
        // Placeholder for summary content rendering
        dom.summaryViewContent.innerHTML = '<p class="text-center">Zusammenfassungsdaten werden hier geladen...</p>'; 
        if (summaryRenderData) {
            // Actual rendering logic for summaryRenderData would go here
            // For example: dom.summaryViewContent.innerHTML = generateSummaryHTML(summaryRenderData);
        }
    } else {
        dom.summarySection.classList.add('hidden');
        dom.animationSection.classList.remove('hidden');
        dom.explanationSection.classList.remove('hidden');
    }
}

function clearArrows() {
    if (dom.arrowContainer) dom.arrowContainer.innerHTML = '';
}

function addArrow(targetBitElement, arrowContainer = dom.arrowContainer) {
    // Stub: Full logic for creating, positioning, and adding arrow to be implemented.
    // This is a simplified placeholder.
    if (!targetBitElement || !arrowContainer) return;
    // const arrow = document.createElement('div');
    // arrow.className = 'arrow-down'; // Assuming 'arrow-down' CSS class exists
    // arrow.style.position = 'absolute'; // Arrows usually need absolute positioning
    // Complex positioning logic based on targetBitElement.getBoundingClientRect() and arrowContainer.getBoundingClientRect()
    // arrowContainer.appendChild(arrow);
}

function updateButtonStates({ prevDisabled, nextDisabled, playPauseText, summaryDisabled }) {
    if (dom.prevBtn) dom.prevBtn.disabled = prevDisabled;
    if (dom.nextBtn) dom.nextBtn.disabled = nextDisabled;
    if (dom.playPauseBtn) dom.playPauseBtn.textContent = playPauseText;
    if (dom.summaryBtn) dom.summaryBtn.disabled = summaryDisabled;
}

export {
    // getElement, // Typically not exported, internal helper
    cacheDOMElements,
    createBitElement,
    renderBitContainer,
    renderDividend,
    renderDivisor,
    renderQuotient,
    renderCurrentRemainder,
    renderFinalRemainder,
    updateStepDisplay,
    updateExplanationText,
    updateCurrentValuesDisplay,
    renderDivisionSteps,
    toggleSummaryView,
    clearArrows,
    addArrow,
    updateButtonStates,
    // dom object is module-scoped, not exported directly
};

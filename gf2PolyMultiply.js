// gf2PolyMultiply.js

function multiplyGF2(poly1Str, poly2Str) {
    // Normalize inputs
    let p1 = poly1Str.replace(/^0+(?!$)/, ''); // Remove leading zeros, unless it's "0"
    let p2 = poly2Str.replace(/^0+(?!$)/, '');

    if (p1 === "0" || p2 === "0" || !p1 || !p2) {
        return "0";
    }

    const len1 = p1.length;
    const len2 = p2.length;
    const resultLen = len1 + len2 - 1;
    const resultArray = new Array(resultLen).fill(0);

    for (let i = 0; i < len1; i++) {
        if (p1[i] === '1') {
            for (let j = 0; j < len2; j++) {
                if (p2[j] === '1') {
                    // p1[i] is coeff of x^(len1 - 1 - i)
                    // p2[j] is coeff of x^(len2 - 1 - j)
                    // Product term power: (len1 - 1 - i) + (len2 - 1 - j)
                    const power = (len1 - 1 - i) + (len2 - 1 - j);
                    // Index in resultArray (where index 0 is highest power x^(resultLen-1))
                    const resultIndex = resultLen - 1 - power;
                    resultArray[resultIndex] = resultArray[resultIndex] ^ 1;
                }
            }
        }
    }

    const resultStr = resultArray.join('');
    // Normalize result: remove leading zeros, unless it's "0"
    // Also handles if resultStr was all zeros, which would become "" after replace, so make it "0"
    const finalResult = resultStr.replace(/^0+(?!$)/, '');
    return finalResult === "" ? "0" : finalResult; 
}

// ESM export
export { multiplyGF2 };

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.retry = retry;
async function retry(fn, times = 40, delayMs = 1500) {
    let last;
    for (let i = 0; i < times; i += 1) {
        try {
            return await fn();
        }
        catch (e) {
            last = e;
            await new Promise((r) => setTimeout(r, delayMs));
        }
    }
    throw last;
}

/**
 * MathHelpers - Common math utilities
 */

/**
 * Linear interpolation between two values
 */
export function lerp(start: number, end: number, t: number): number {
    return start + (end - start) * t;
}

/**
 * Clamp a value between min and max
 */
export function clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
}

/**
 * Map a value from one range to another
 */
export function mapRange(
    value: number, 
    inMin: number, 
    inMax: number, 
    outMin: number, 
    outMax: number
): number {
    return ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
}

/**
 * Smooth damp - Unity-style smooth interpolation
 */
export function smoothDamp(
    current: number,
    target: number,
    velocity: { value: number },
    smoothTime: number,
    maxSpeed: number,
    deltaTime: number
): number {
    smoothTime = Math.max(0.0001, smoothTime);
    const omega = 2 / smoothTime;
    const x = omega * deltaTime;
    const exp = 1 / (1 + x + 0.48 * x * x + 0.235 * x * x * x);
    
    let change = current - target;
    const originalTo = target;
    
    const maxChange = maxSpeed * smoothTime;
    change = clamp(change, -maxChange, maxChange);
    target = current - change;
    
    const temp = (velocity.value + omega * change) * deltaTime;
    velocity.value = (velocity.value - omega * temp) * exp;
    
    let output = target + (change + temp) * exp;
    
    if (originalTo - current > 0 === output > originalTo) {
        output = originalTo;
        velocity.value = (output - originalTo) / deltaTime;
    }
    
    return output;
}

/**
 * Approach - Move toward target by a fixed amount
 */
export function approach(current: number, target: number, amount: number): number {
    if (current < target) {
        return Math.min(current + amount, target);
    } else if (current > target) {
        return Math.max(current - amount, target);
    }
    return target;
}

/**
 * Calculate angle between two points
 */
export function angleBetween(x1: number, y1: number, x2: number, y2: number): number {
    return Math.atan2(y2 - y1, x2 - x1);
}

/**
 * Normalize an angle to be between -PI and PI
 */
export function normalizeAngle(angle: number): number {
    while (angle > Math.PI) angle -= Math.PI * 2;
    while (angle < -Math.PI) angle += Math.PI * 2;
    return angle;
}

/**
 * Check if a value is approximately equal to another
 */
export function approximately(a: number, b: number, epsilon: number = 0.0001): boolean {
    return Math.abs(a - b) < epsilon;
}

/**
 * Random float between min and max
 */
export function randomRange(min: number, max: number): number {
    return min + Math.random() * (max - min);
}

/**
 * Random integer between min and max (inclusive)
 */
export function randomInt(min: number, max: number): number {
    return Math.floor(randomRange(min, max + 1));
}

/**
 * Ease in-out cubic
 */
export function easeInOutCubic(t: number): number {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/**
 * Ease out elastic (for bouncy effects)
 */
export function easeOutElastic(t: number): number {
    const c4 = (2 * Math.PI) / 3;
    return t === 0
        ? 0
        : t === 1
        ? 1
        : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
}

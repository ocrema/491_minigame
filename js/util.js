export function rotateXNoGBL(euler, angle) {
    const order = euler.order;
    euler.reorder('YZX');
    euler.x += angle;
    euler.reorder(order);
}

export function rotateYNoGBL(euler, angle) {
    const order = euler.order;
    euler.reorder('XZY');
    euler.y += angle;
    euler.reorder(order);
}

export function rotateZNoGBL(euler, angle) {
    const order = euler.order;
    euler.reorder('XYZ');
    euler.z += angle;
    euler.reorder(order);
}
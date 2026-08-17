import * as THREE from "three";

/**
 * Builds a rounded-rectangle outline centered on the origin. Extruding this
 * shape produces a slab with flat front/back faces and a rounded perimeter —
 * the correct topology for a smartphone chassis. (A `RoundedBox` instead rounds
 * every edge, which makes both faces domed and causes the "two rounded slabs"
 * look.)
 */
export function roundedRectShape(
  width: number,
  height: number,
  radius: number,
): THREE.Shape {
  const x = -width / 2;
  const y = -height / 2;
  const r = Math.min(radius, width / 2, height / 2);

  const shape = new THREE.Shape();
  shape.moveTo(x + r, y);
  shape.lineTo(x + width - r, y);
  shape.quadraticCurveTo(x + width, y, x + width, y + r);
  shape.lineTo(x + width, y + height - r);
  shape.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  shape.lineTo(x + r, y + height);
  shape.quadraticCurveTo(x, y + height, x, y + height - r);
  shape.lineTo(x, y + r);
  shape.quadraticCurveTo(x, y, x + r, y);
  return shape;
}

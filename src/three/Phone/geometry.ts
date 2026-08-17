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

/**
 * A flat, texture-ready rounded-rectangle geometry.
 *
 * THREE.ShapeGeometry emits UVs equal to the shape's local coordinates (centered
 * on the origin), not the [0,1] range a texture expects. This remaps them to
 * [0,1] across the shape's bounding box so a screen texture maps edge-to-edge.
 */
export function roundedRectGeometry(
  width: number,
  height: number,
  radius: number,
): THREE.ShapeGeometry {
  const shape = roundedRectShape(width, height, radius);
  const geometry = new THREE.ShapeGeometry(shape, 8);

  const position = geometry.getAttribute("position") as THREE.BufferAttribute;
  const uv = geometry.getAttribute("uv") as THREE.BufferAttribute;

  for (let i = 0; i < position.count; i++) {
    const u = (position.getX(i) + width / 2) / width;
    const v = (position.getY(i) + height / 2) / height;
    uv.setXY(i, u, v);
  }
  uv.needsUpdate = true;

  return geometry;
}

/* eslint-disable @typescript-eslint/naming-convention */
// Version 0.9.0 - Copyright 2012 - 2021 -  Jim Riecken <jimr@jimr.ca>
//
// Released under the MIT License - https://github.com/jriecken/sat-js
//
// A simple library for determining intersections of circles and
// polygons using the Separating Axis Theorem.
/** @preserve SAT.js - Version 0.9.0 - Copyright 2012 - 2021 - Jim Riecken <jimr@jimr.ca> - released under the MIT License. https://github.com/jriecken/sat-js */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { type, Schema } from '@colyseus/schema';
export class Vector extends Schema {
    x;
    y;
    constructor(x = 0, y = 0) {
        super();
        this.x = x;
        this.y = y;
    }
    copy(other) {
        this.x = other.x;
        this.y = other.y;
        return this;
    }
    clone() {
        return new Vector(this.x, this.y);
    }
    perp() {
        const { x } = this;
        this.x = this.y;
        this.y = -x;
        return this;
    }
    rotate(angle) {
        const { x } = this;
        const { y } = this;
        this.x = x * Math.cos(angle) - y * Math.sin(angle);
        this.y = x * Math.sin(angle) + y * Math.cos(angle);
        return this;
    }
    reverse() {
        this.x = -this.x;
        this.y = -this.y;
        return this;
    }
    normalize() {
        const mag = this.len();
        if (mag > 0) {
            this.x /= mag;
            this.y /= mag;
        }
        return this;
    }
    add(other) {
        this.x += other.x;
        this.y += other.y;
        return this;
    }
    sub(other) {
        this.x -= other.x;
        this.y -= other.y;
        return this;
    }
    scale(x, y) {
        this.x *= x;
        this.y *= typeof y === 'undefined' ? x : y;
        return this;
    }
    project(other) {
        const amt = this.dot(other) / other.len2();
        this.x = amt * other.x;
        this.y = amt * other.y;
        return this;
    }
    projectN(other) {
        const amt = this.dot(other);
        this.x = amt * other.x;
        this.y = amt * other.y;
        return this;
    }
    reflect(axis) {
        const { x } = this;
        const { y } = this;
        this.project(axis).scale(2);
        this.x -= x;
        this.y -= y;
        return this;
    }
    reflectN(axis) {
        const { x } = this;
        const { y } = this;
        this.projectN(axis).scale(2);
        this.x = x - this.x;
        this.y = y - this.y;
        return this;
    }
    dot(other) {
        return this.x * other.x + this.y * other.y;
    }
    len2() {
        return this.dot(this);
    }
    len() {
        return Math.sqrt(this.len2());
    }
}
__decorate([
    type('number')
], Vector.prototype, "x", void 0);
__decorate([
    type('number')
], Vector.prototype, "y", void 0);
export class Circle extends Schema {
    pos;
    r;
    offset;
    constructor(pos, r = 0) {
        super();
        this.pos = pos || new Vector();
        this.r = r;
        this.offset = new Vector();
    }
    getAABBAsBox() {
        const { r } = this;
        const corner = this.pos.clone().add(this.offset).sub(new Vector(r, r));
        return new Box(corner, r * 2, r * 2);
    }
    getAABB() {
        return this.getAABBAsBox().toPolygon();
    }
    setOffset(offset) {
        this.offset = offset;
        return this;
    }
}
__decorate([
    type(Vector)
], Circle.prototype, "pos", void 0);
__decorate([
    type('number')
], Circle.prototype, "r", void 0);
__decorate([
    type(Vector)
], Circle.prototype, "offset", void 0);
export class Polygon extends Schema {
    pos;
    angle = 0;
    offset = new Vector();
    points = new Array();
    calcPoints = new Array();
    edges = new Array();
    normals = new Array();
    constructor(pos = new Vector(), points = []) {
        super();
        this.pos = pos;
        this.setPoints(points);
    }
    setPoints(points) {
        // Only re-allocate if this is a new polygon or the number of points has changed.
        const lengthChanged = !this.points || this.points.length !== points.length;
        if (lengthChanged) {
            let i;
            this.calcPoints = [];
            this.edges = [];
            this.normals = [];
            const { calcPoints } = this;
            const { edges } = this;
            const { normals } = this;
            // Allocate the vector arrays for the calculated properties
            for (i = 0; i < points.length; i++) {
                // Remove consecutive duplicate points
                const p1 = points[i];
                const p2 = i < points.length - 1 ? points[i + 1] : points[0];
                if (p1 !== p2 && p1.x === p2.x && p1.y === p2.y) {
                    points.splice(i, 1);
                    i -= 1;
                    continue;
                }
                calcPoints.push(new Vector());
                edges.push(new Vector());
                normals.push(new Vector());
            }
        }
        this.points.push(...points);
        this._recalc();
        return this;
    }
    setAngle(angle) {
        this.angle = angle;
        this._recalc();
        return this;
    }
    setOffset(offset) {
        this.offset.copy(offset);
        this._recalc();
        return this;
    }
    rotate(angle) {
        const { points } = this;
        const len = points.length;
        for (let i = 0; i < len; i++) {
            points[i].rotate(angle);
        }
        this._recalc();
        return this;
    }
    translate(x, y) {
        const { points } = this;
        const len = points.length;
        for (let i = 0; i < len; i++) {
            points[i].x += x;
            points[i].y += y;
        }
        this._recalc();
        return this;
    }
    _recalc() {
        // Calculated points - this is what is used for underlying collisions and takes into account
        // the angle/offset set on the polygon.
        const { calcPoints } = this;
        // The edges here are the direction of the `n`th edge of the polygon, relative to
        // the `n`th point. If you want to draw a given edge from the edge value, you must
        // first translate to the position of the starting point.
        const { edges } = this;
        // The normals here are the direction of the normal for the `n`th edge of the polygon, relative
        // to the position of the `n`th point. If you want to draw an edge normal, you must first
        // translate to the position of the starting point.
        const { normals } = this;
        // Copy the original points array and apply the offset/angle
        const { points } = this;
        const { offset } = this;
        const { angle } = this;
        const len = points.length;
        let i;
        for (i = 0; i < len; i++) {
            const calcPoint = calcPoints[i].copy(points[i]);
            calcPoint.x += offset.x;
            calcPoint.y += offset.y;
            if (angle !== 0) {
                calcPoint.rotate(angle);
            }
        }
        // Calculate the edges/normals
        for (i = 0; i < len; i++) {
            const p1 = calcPoints[i];
            const p2 = i < len - 1 ? calcPoints[i + 1] : calcPoints[0];
            const e = edges[i].copy(p2).sub(p1);
            normals[i].copy(e).perp().normalize();
        }
        return this;
    }
    getAABBAsBox() {
        const points = this.calcPoints;
        const len = points.length;
        let xMin = points[0].x;
        let yMin = points[0].y;
        let xMax = points[0].x;
        let yMax = points[0].y;
        for (let i = 1; i < len; i++) {
            const point = points[i];
            if (point.x < xMin) {
                xMin = point.x;
            }
            else if (point.x > xMax) {
                xMax = point.x;
            }
            if (point.y < yMin) {
                yMin = point.y;
            }
            else if (point.y > yMax) {
                yMax = point.y;
            }
        }
        return new Box(this.pos.clone().add(new Vector(xMin, yMin)), xMax - xMin, yMax - yMin);
    }
    getAABB() {
        return this.getAABBAsBox().toPolygon();
    }
    getCentroid() {
        const points = this.calcPoints;
        const len = points.length;
        let cx = 0;
        let cy = 0;
        let ar = 0;
        for (let i = 0; i < len; i++) {
            const p1 = points[i];
            const p2 = i === len - 1 ? points[0] : points[i + 1]; // Loop around if last point
            const a = p1.x * p2.y - p2.x * p1.y;
            cx += (p1.x + p2.x) * a;
            cy += (p1.y + p2.y) * a;
            ar += a;
        }
        ar *= 3; // We want 1 / 6 the area and we currently have 2*area
        cx /= ar;
        cy /= ar;
        return new Vector(cx, cy);
    }
}
__decorate([
    type(Vector)
], Polygon.prototype, "pos", void 0);
__decorate([
    type('number')
], Polygon.prototype, "angle", void 0);
__decorate([
    type(Vector)
], Polygon.prototype, "offset", void 0);
__decorate([
    type([Vector])
], Polygon.prototype, "points", void 0);
export class Box extends Schema {
    pos;
    w;
    h;
    constructor(pos = new Vector(), w = 0, h = 0) {
        super();
        this.pos = pos;
        this.w = w;
        this.h = h;
    }
    toPolygon() {
        const { pos } = this;
        const { w } = this;
        const { h } = this;
        return new Polygon(new Vector(pos.x, pos.y), [
            new Vector(),
            new Vector(w, 0),
            new Vector(w, h),
            new Vector(0, h),
        ]);
    }
}
__decorate([
    type(Vector)
], Box.prototype, "pos", void 0);
__decorate([
    type('number')
], Box.prototype, "w", void 0);
__decorate([
    type('number')
], Box.prototype, "h", void 0);
export class Response {
    a;
    b;
    aInB;
    bInA;
    overlap;
    overlapN;
    overlapV;
    constructor() {
        this.a = null;
        this.b = null;
        this.overlapN = new Vector();
        this.overlapV = new Vector();
        this.clear();
    }
    clear() {
        this.aInB = true;
        this.bInA = true;
        this.overlap = Number.MAX_VALUE;
        return this;
    }
}
const T_VECTORS = [];
for (let i = 0; i < 10; i++) {
    T_VECTORS.push(new Vector());
}
const T_ARRAYS = [];
for (let i = 0; i < 5; i++) {
    T_ARRAYS.push([]);
}
const T_RESPONSE = new Response();
const TEST_POINT = new Box(new Vector(), 0.000001, 0.000001).toPolygon();
export function flattenPointsOn(points, normal, result) {
    let min = Number.MAX_VALUE;
    let max = -Number.MAX_VALUE;
    const len = points.length;
    for (let i = 0; i < len; i++) {
        // The magnitude of the projection of the point onto the normal
        const dot = points[i].dot(normal);
        if (dot < min) {
            min = dot;
        }
        if (dot > max) {
            max = dot;
        }
    }
    result[0] = min;
    result[1] = max;
}
export function isSeparatingAxis(aPos, bPos, aPoints, bPoints, axis, response) {
    const rangeA = T_ARRAYS.pop();
    const rangeB = T_ARRAYS.pop();
    // The magnitude of the offset between the two polygons
    const offsetV = T_VECTORS.pop().copy(bPos).sub(aPos);
    const projectedOffset = offsetV.dot(axis);
    // Project the polygons onto the axis.
    flattenPointsOn(aPoints, axis, rangeA);
    flattenPointsOn(bPoints, axis, rangeB);
    // Move B's range to its position relative to A.
    rangeB[0] += projectedOffset;
    rangeB[1] += projectedOffset;
    // Check if there is a gap. If there is, this is a separating axis and we can stop
    if (rangeA[0] > rangeB[1] || rangeB[0] > rangeA[1]) {
        T_VECTORS.push(offsetV);
        T_ARRAYS.push(rangeA);
        T_ARRAYS.push(rangeB);
        return true;
    }
    // This is not a separating axis. If we're calculating a response, calculate the overlap.
    if (response) {
        let overlap = 0;
        // A starts further left than B
        if (rangeA[0] < rangeB[0]) {
            response.aInB = false;
            // A ends before B does. We have to pull A out of B
            if (rangeA[1] < rangeB[1]) {
                overlap = rangeA[1] - rangeB[0];
                response.bInA = false;
                // B is fully inside A.  Pick the shortest way out.
            }
            else {
                const option1 = rangeA[1] - rangeB[0];
                const option2 = rangeB[1] - rangeA[0];
                overlap = option1 < option2 ? option1 : -option2;
            }
            // B starts further left than A
        }
        else {
            response.bInA = false;
            // B ends before A ends. We have to push A out of B
            if (rangeA[1] > rangeB[1]) {
                overlap = rangeA[0] - rangeB[1];
                response.aInB = false;
                // A is fully inside B.  Pick the shortest way out.
            }
            else {
                const option1 = rangeA[1] - rangeB[0];
                const option2 = rangeB[1] - rangeA[0];
                overlap = option1 < option2 ? option1 : -option2;
            }
        }
        // If this is the smallest amount of overlap we've seen so far, set it as the minimum overlap.
        const absOverlap = Math.abs(overlap);
        if (absOverlap < response.overlap) {
            response.overlap = absOverlap;
            response.overlapN.copy(axis);
            if (overlap < 0) {
                response.overlapN.reverse();
            }
        }
    }
    T_VECTORS.push(offsetV);
    T_ARRAYS.push(rangeA);
    T_ARRAYS.push(rangeB);
    return false;
}
export function voronoiRegion(line, point) {
    const len2 = line.len2();
    const dp = point.dot(line);
    // If the point is beyond the start of the line, it is in the
    // left voronoi region.
    if (dp < 0) {
        return LEFT_VORONOI_REGION;
    }
    // If the point is beyond the end of the line, it is in the
    // right voronoi region.
    if (dp > len2) {
        return RIGHT_VORONOI_REGION;
    }
    // Otherwise, it's in the middle one.
    return MIDDLE_VORONOI_REGION;
}
// Constants for Voronoi regions
const LEFT_VORONOI_REGION = -1;
const MIDDLE_VORONOI_REGION = 0;
const RIGHT_VORONOI_REGION = 1;
// ## Collision Tests
// Check if a point is inside a circle.
export function pointInCircle(p, c) {
    const differenceV = T_VECTORS.pop().copy(p).sub(c.pos).sub(c.offset);
    const radiusSq = c.r * c.r;
    const distanceSq = differenceV.len2();
    T_VECTORS.push(differenceV);
    // If the distance between is smaller than the radius then the point is inside the circle.
    return distanceSq <= radiusSq;
}
// Check if a point is inside a convex polygon.
export function pointInPolygon(p, poly) {
    TEST_POINT.pos.copy(p);
    T_RESPONSE.clear();
    let result = testPolygonPolygon(TEST_POINT, poly, T_RESPONSE);
    if (result) {
        result = T_RESPONSE.aInB;
    }
    return result;
}
// Check if two circles collide.
export function testCircleCircle(a, b, response = undefined) {
    // Check if the distance between the centers of the two
    // circles is greater than their combined radius.
    const differenceV = T_VECTORS.pop().copy(b.pos).add(b.offset).sub(a.pos).sub(a.offset);
    const totalRadius = a.r + b.r;
    const totalRadiusSq = totalRadius * totalRadius;
    const distanceSq = differenceV.len2();
    // If the distance is bigger than the combined radius, they don't intersect.
    if (distanceSq > totalRadiusSq) {
        T_VECTORS.push(differenceV);
        return false;
    }
    // They intersect.  If we're calculating a response, calculate the overlap.
    if (response) {
        const dist = Math.sqrt(distanceSq);
        response.a = a;
        response.b = b;
        response.overlap = totalRadius - dist;
        response.overlapN.copy(differenceV.normalize());
        response.overlapV.copy(differenceV).scale(response.overlap);
        response.aInB = a.r <= b.r && dist <= b.r - a.r;
        response.bInA = b.r <= a.r && dist <= a.r - b.r;
    }
    T_VECTORS.push(differenceV);
    return true;
}
// Check if a polygon and a circle collide.
// eslint-disable-next-line complexity
export function testPolygonCircle(polygon, circle, response = undefined) {
    // Get the position of the circle relative to the polygon.
    const circlePos = T_VECTORS.pop().copy(circle.pos).add(circle.offset).sub(polygon.pos);
    const radius = circle.r;
    const radius2 = radius * radius;
    const points = polygon.calcPoints;
    const len = points.length;
    const edge = T_VECTORS.pop();
    const point = T_VECTORS.pop();
    // For each edge in the polygon:
    for (let i = 0; i < len; i++) {
        const next = i === len - 1 ? 0 : i + 1;
        const prev = i === 0 ? len - 1 : i - 1;
        let overlap = 0;
        let overlapN = null;
        // Get the edge.
        edge.copy(polygon.edges[i]);
        // Calculate the center of the circle relative to the starting point of the edge.
        point.copy(circlePos).sub(points[i]);
        // If the distance between the center of the circle and the point
        // is bigger than the radius, the polygon is definitely not fully in
        // the circle.
        if (response && point.len2() > radius2) {
            response.aInB = false;
        }
        // Calculate which Voronoi region the center of the circle is in.
        let region = voronoiRegion(edge, point);
        // If it's the left region:
        if (region === LEFT_VORONOI_REGION) {
            // We need to make sure we're in the RIGHT_VORONOI_REGION of the previous edge.
            edge.copy(polygon.edges[prev]);
            // Calculate the center of the circle relative the starting point of the previous edge
            const point2 = T_VECTORS.pop().copy(circlePos).sub(points[prev]);
            region = voronoiRegion(edge, point2);
            if (region === RIGHT_VORONOI_REGION) {
                // It's in the region we want.  Check if the circle intersects the point.
                const dist = point.len();
                if (dist > radius) {
                    // No intersection
                    T_VECTORS.push(circlePos);
                    T_VECTORS.push(edge);
                    T_VECTORS.push(point);
                    T_VECTORS.push(point2);
                    return false;
                }
                if (response) {
                    // It intersects, calculate the overlap.
                    response.bInA = false;
                    overlapN = point.normalize();
                    overlap = radius - dist;
                }
            }
            T_VECTORS.push(point2);
            // If it's the right region:
        }
        else if (region === RIGHT_VORONOI_REGION) {
            // We need to make sure we're in the left region on the next edge
            edge.copy(polygon.edges[next]);
            // Calculate the center of the circle relative to the starting point of the next edge.
            point.copy(circlePos).sub(points[next]);
            region = voronoiRegion(edge, point);
            if (region === LEFT_VORONOI_REGION) {
                // It's in the region we want.  Check if the circle intersects the point.
                const dist = point.len();
                if (dist > radius) {
                    // No intersection
                    T_VECTORS.push(circlePos);
                    T_VECTORS.push(edge);
                    T_VECTORS.push(point);
                    return false;
                }
                if (response) {
                    // It intersects, calculate the overlap.
                    response.bInA = false;
                    overlapN = point.normalize();
                    overlap = radius - dist;
                }
            }
            // Otherwise, it's the middle region:
        }
        else {
            // Need to check if the circle is intersecting the edge,
            // Change the edge into its "edge normal".
            const normal = edge.perp().normalize();
            // Find the perpendicular distance between the center of the
            // circle and the edge.
            const dist = point.dot(normal);
            const distAbs = Math.abs(dist);
            // If the circle is on the outside of the edge, there is no intersection.
            if (dist > 0 && distAbs > radius) {
                // No intersection
                T_VECTORS.push(circlePos);
                T_VECTORS.push(normal);
                T_VECTORS.push(point);
                return false;
            }
            if (response) {
                // It intersects, calculate the overlap.
                overlapN = normal;
                overlap = radius - dist;
                // If the center of the circle is on the outside of the edge, or part of the
                // circle is on the outside, the circle is not fully inside the polygon.
                if (dist >= 0 || overlap < 2 * radius) {
                    response.bInA = false;
                }
            }
        }
        // If this is the smallest overlap we've seen, keep it.
        // (overlapN may be null if the circle was in the wrong Voronoi region).
        if (overlapN && response && Math.abs(overlap) < Math.abs(response.overlap)) {
            response.overlap = overlap;
            response.overlapN.copy(overlapN);
        }
    }
    // Calculate the final overlap vector - based on the smallest overlap.
    if (response) {
        response.a = polygon;
        response.b = circle;
        response.overlapV.copy(response.overlapN).scale(response.overlap);
    }
    T_VECTORS.push(circlePos);
    T_VECTORS.push(edge);
    T_VECTORS.push(point);
    return true;
}
export function testCirclePolygon(circle, polygon, response) {
    // Test the polygon against the circle.
    const result = testPolygonCircle(polygon, circle, response);
    if (result && response) {
        // Swap A and B in the response.
        const { a } = response;
        const { aInB } = response;
        response.overlapN.reverse();
        response.overlapV.reverse();
        response.a = response.b;
        response.b = a;
        response.aInB = response.bInA;
        response.bInA = aInB;
    }
    return result;
}
// Checks whether polygons collide.
export function testPolygonPolygon(a, b, response) {
    const aPoints = a.calcPoints;
    const aLen = aPoints.length;
    const bPoints = b.calcPoints;
    const bLen = bPoints.length;
    // If any of the edge normals of A is a separating axis, no intersection.
    for (let i = 0; i < aLen; i++) {
        if (isSeparatingAxis(a.pos, b.pos, aPoints, bPoints, a.normals[i], response)) {
            return false;
        }
    }
    // If any of the edge normals of B is a separating axis, no intersection.
    for (let i = 0; i < bLen; i++) {
        if (isSeparatingAxis(a.pos, b.pos, aPoints, bPoints, b.normals[i], response)) {
            return false;
        }
    }
    // Since none of the edge normals of A or B are a separating axis, there is an intersection
    // and we've already calculated the smallest overlap (in isSeparatingAxis).  Calculate the
    // final overlap vector.
    if (response) {
        response.a = a;
        response.b = b;
        response.overlapV.copy(response.overlapN).scale(response.overlap);
    }
    return true;
}
//# sourceMappingURL=SAT.js.map
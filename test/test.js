const SAT = require('../dist/SAT.js');
const assert = require('assert');

console.log(SAT);

describe('Vector.scale', () => {
	it('should scale by zero properly', () => {
		const V = SAT.Vector;
		const v1 = new V(5, 5);
		v1.scale(10, 10);
		assert(v1.x === 50);
		assert(v1.y === 50);

		v1.scale(0, 1);
		assert(v1.x === 0);
		assert(v1.y === 50);

		v1.scale(1, 0);
		console.log(v1.x, v1.y);
		assert(v1.x === 0);
		assert(v1.y === 0);
	});
});

describe('Polygon.getCentroid', () => {
	it('should calculate the correct value for a square', () => {
		const V = SAT.Vector;
		const P = SAT.Polygon;

		// A square
		const polygon = new P(new V(0, 0), [
			new V(0, 0), new V(40, 0), new V(40, 40), new V(0, 40),
		]);
		const c = polygon.getCentroid();
		assert(c.x === 20);
		assert(c.y === 20);
	});

	it('should calculate the correct value for a triangle', () => {
		const V = SAT.Vector;
		const P = SAT.Polygon;

		// A triangle
		const polygon = new P(new V(0, 0), [
			new V(0, 0), new V(100, 0), new V(50, 99),
		]);
		const c = polygon.getCentroid();
		assert(c.x === 50);
		assert(c.y === 33);
	});
});

describe('Collision', () => {
	it('testCircleCircle', () => {
		const V = SAT.Vector;
		const C = SAT.Circle;

		const circle1 = new C(new V(0, 0), 20);
		const circle2 = new C(new V(30, 0), 20);
		const response = new SAT.Response();
		let collided = SAT.testCircleCircle(circle1, circle2, response);

		assert(collided);
		assert(response.overlap == 10);
		assert(response.overlapV.x == 10 && response.overlapV.y === 0);

		circle1.offset = new V(-10, -10);
		collided = SAT.testCircleCircle(circle1, circle2, response);
		assert(!collided);
	});

	it('testPolygonCircle', () => {
		const V = SAT.Vector;
		const C = SAT.Circle;
		const P = SAT.Polygon;

		const circle = new C(new V(50, 50), 20);
		// A square
		const polygon = new P(new V(0, 0), [
			new V(0, 0), new V(40, 0), new V(40, 40), new V(0, 40),
		]);
		const response = new SAT.Response();
		let collided = SAT.testPolygonCircle(polygon, circle, response);

		assert(collided);
		assert(response.overlap.toFixed(2) == '5.86');
		assert(
			response.overlapV.x.toFixed(2) == '4.14'
      && response.overlapV.y.toFixed(2) == '4.14',
		);

		circle.offset = new V(10, 10);
		collided = SAT.testPolygonCircle(polygon, circle, response);
		assert(!collided);
	});

	it('testPolygonCircle - line - not collide', () => {
		const V = SAT.Vector;
		const C = SAT.Circle;
		const B = SAT.Box;

		const circle = new C(new V(50, 50), 20);
		const polygon = new B(new V(1000, 1000), 100, 0).toPolygon();
		const response = new SAT.Response();
		const collided = SAT.testPolygonCircle(polygon, circle, response);
		assert(!collided);
	});

	it('testPolygonCircle - line - collide', () => {
		const V = SAT.Vector;
		const C = SAT.Circle;
		const B = SAT.Box;

		const circle = new C(new V(50, 50), 20);
		const polygon = new B(new V(50, 50), 100, 0).toPolygon();
		const response = new SAT.Response();
		const collided = SAT.testPolygonCircle(polygon, circle, response);

		assert(collided);
		assert(response.overlap.toFixed(2) == '20.00');
	});

	it('testPolygonPolygon', () => {
		const V = SAT.Vector;
		const P = SAT.Polygon;

		// A square
		const polygon1 = new P(new V(0, 0), [
			new V(0, 0), new V(40, 0), new V(40, 40), new V(0, 40),
		]);
		// A triangle
		const polygon2 = new P(new V(30, 0), [
			new V(0, 0), new V(30, 0), new V(0, 30),
		]);
		const response = new SAT.Response();
		const collided = SAT.testPolygonPolygon(polygon1, polygon2, response);

		assert(collided);
		assert(response.overlap == 10);
		assert(response.overlapV.x == 10 && response.overlapV.y === 0);
	});
});

describe('No collision', () => {
	it('testPolygonPolygon', () => {
		const V = SAT.Vector;
		const B = SAT.Box;

		const box1 = new B(new V(0, 0), 20, 20).toPolygon();
		const box2 = new B(new V(100, 100), 20, 20).toPolygon();
		const collided = SAT.testPolygonPolygon(box1, box2);
	});
});

describe('Point testing', () => {
	it('pointInCircle', () => {
		const V = SAT.Vector;
		const C = SAT.Circle;

		const circle = new C(new V(100, 100), 20);

		assert(!SAT.pointInCircle(new V(0, 0), circle)); // False
		assert(SAT.pointInCircle(new V(110, 110), circle)); // True

		circle.offset = new V(-10, -10);
		assert(!SAT.pointInCircle(new V(110, 110), circle)); // False
	});

	it('pointInPolygon', () => {
		const V = SAT.Vector;
		const C = SAT.Circle;
		const P = SAT.Polygon;

		const triangle = new P(new V(30, 0), [
			new V(0, 0), new V(30, 0), new V(0, 30),
		]);
		assert(!SAT.pointInPolygon(new V(0, 0), triangle)); // False
		assert(SAT.pointInPolygon(new V(35, 5), triangle)); // True
	});

	it('pointInPolygon (small)', () => {
		const V = SAT.Vector;
		const C = SAT.Circle;
		const P = SAT.Polygon;

		const v1 = new V(1, 1.1);
		const p1 = new P(new V(0, 0), [new V(2, 1), new V(2, 2), new V(1, 3), new V(0, 2), new V(0, 1), new V(1, 0)]);
		assert(SAT.pointInPolygon(v1, p1));
	});
});

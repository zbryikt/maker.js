﻿/*
__________________________________________________________________________________________________________________________________________            
 __________________________________________________________________________________________________________________________________________           
  ________/\\\\____________/\\\\_____/\\\\\\\\\_____/\\\________/\\\__/\\\\\\\\\\\\\\\__/\\\\\\\\\\\________________________________________          
   _______\/\\\\\\________/\\\\\\___/\\\\/////\\\\__\/\\\_____/\\\//__\/\\\///////////__\/\\\///////\\\_______________/\\\___________________         
    _______\/\\\//\\\____/\\\//\\\__/\\\/____\///\\\_\/\\\__/\\\//_____\/\\\_____________\/\\\_____\/\\\______________\///____________________        
     _______\/\\\\///\\\/\\\/_\/\\\_\/\\\_______\/\\\_\/\\\\\\//\\\_____\/\\\\\\\\\\\_____\/\\\\\\\\\\\/________________/\\\__/\\\\\\\\\\______       
      _______\/\\\__\///\\\/___\/\\\_\/\\\\\\\\\\\\\\\_\/\\\//_\//\\\____\/\\\///////______\/\\\//////\\\_______________\/\\\_\/\\\//////_______      
       _______\/\\\____\///_____\/\\\_\/\\\/////////\\\_\/\\\____\//\\\___\/\\\_____________\/\\\____\//\\\______________\/\\\_\/\\\\\\\\\\______     
        _______\/\\\_____________\/\\\_\/\\\_______\/\\\_\/\\\_____\//\\\__\/\\\_____________\/\\\_____\//\\\_________/\\_\/\\\_\////////\\\______    
         _______\/\\\_____________\/\\\_\/\\\_______\/\\\_\/\\\______\//\\\_\/\\\\\\\\\\\\\\\_\/\\\______\//\\\__/\\\_\//\\\\\\___/\\\\\\\\\\______   
          _______\///______________\///__\///________\///__\///________\///__\///////////////__\///________\///__\///___\//////___\//////////_______  
           __________________________________________________________________________________________________________________________________________ 
            __________________________________________________________________________________________________________________________________________

Maker.js
https://github.com/Microsoft/maker.js

Copyright (c) Microsoft Corporation. All rights reserved. 
Licensed under the Apache License, Version 2.0 (the "License"); you may not use
this file except in compliance with the License. You may obtain a copy of the
License at http://www.apache.org/licenses/LICENSE-2.0  
 
THIS CODE IS PROVIDED ON AN *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED
WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE, 
MERCHANTABLITY OR NON-INFRINGEMENT. 
 
See the Apache Version 2.0 License for specific language governing permissions
and limitations under the License.

*/
/**
 * Root module for Maker.js.
 *
 * Example: get a reference to Maker.js
 * ```
 * var makerjs = require('makerjs');
 * ```
 *
 */
var MakerJs;
(function (MakerJs) {
    /**
     * Version info
     */
    MakerJs.version = 'debug';
    /**
     * Enumeration of environment types.
     */
    MakerJs.environmentTypes = {
        BrowserUI: 'browser',
        NodeJs: 'node',
        WebWorker: 'worker',
        Unknown: 'unknown'
    };
    /**
     * @private
     */
    function tryEval(name) {
        try {
            var value = eval(name);
            return value;
        }
        catch (e) { }
        return;
    }
    /**
     * @private
     */
    function detectEnvironment() {
        if (tryEval('WorkerGlobalScope') && tryEval('self')) {
            return MakerJs.environmentTypes.WebWorker;
        }
        if (tryEval('window') && tryEval('document')) {
            return MakerJs.environmentTypes.BrowserUI;
        }
        //put node last since packagers usually add shims for it
        if (tryEval('global') && tryEval('process')) {
            return MakerJs.environmentTypes.NodeJs;
        }
        return MakerJs.environmentTypes.Unknown;
    }
    /**
     * Current execution environment type, should be one of environmentTypes.
     */
    MakerJs.environment = detectEnvironment();
    //units
    /**
     * String-based enumeration of unit types: imperial, metric or otherwise.
     * A model may specify the unit system it is using, if any. When importing a model, it may have different units.
     * Unit conversion function is makerjs.units.conversionScale().
     * Important: If you add to this, you must also add a corresponding conversion ratio in the unit.ts file!
     */
    MakerJs.unitType = {
        Centimeter: 'cm',
        Foot: 'foot',
        Inch: 'inch',
        Meter: 'm',
        Millimeter: 'mm'
    };
    /**
     * Numeric rounding
     *
     * Example: round to 3 decimal places
     * ```
     * makerjs.round(3.14159, .001); //returns 3.142
     * ```
     *
     * @param n The number to round off.
     * @param accuracy Optional exemplar of number of decimal places.
     * @returns Rounded number.
     */
    function round(n, accuracy) {
        if (accuracy === void 0) { accuracy = .0000001; }
        var exp = 1 - String(1 / accuracy).length;
        //Adapted from https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/round
        // If the exp is undefined or zero...
        if (typeof exp === 'undefined' || +exp === 0) {
            return Math.round(n);
        }
        n = +n;
        exp = +exp;
        // If the value is not a number or the exp is not an integer...
        if (isNaN(n) || !(typeof exp === 'number' && exp % 1 === 0)) {
            return NaN;
        }
        // If the value is negative...
        if (n < 0) {
            return -round(-n, accuracy);
        }
        // Shift
        var a = n.toString().split('e');
        n = Math.round(+(a[0] + 'e' + (a[1] ? (+a[1] - exp) : -exp)));
        // Shift back
        a = n.toString().split('e');
        return +(a[0] + 'e' + (a[1] ? (+a[1] + exp) : exp));
    }
    MakerJs.round = round;
    /**
     * Create a string representation of a route array.
     *
     * @param route Array of strings which are segments of a route.
     * @returns String of the flattened array.
     */
    function createRouteKey(route) {
        var converted = [];
        for (var i = 0; i < route.length; i++) {
            var element = route[i];
            var newElement;
            if (i % 2 === 0) {
                newElement = (i > 0 ? '.' : '') + element;
            }
            else {
                newElement = JSON.stringify([element]);
            }
            converted.push(newElement);
        }
        return converted.join('');
    }
    MakerJs.createRouteKey = createRouteKey;
    /**
     * Travel along a route inside of a model to extract a specific node in its tree.
     *
     * @param modelContext Model to travel within.
     * @param route String of a flattened route, or a string array of route segments.
     * @returns Model or Path object within the modelContext tree.
     */
    function travel(modelContext, route) {
        if (!modelContext || !route)
            return null;
        var routeArray;
        if (Array.isArray(route)) {
            routeArray = route;
        }
        else {
            routeArray = JSON.parse(route);
        }
        var props = routeArray.slice();
        var ref = modelContext;
        var origin = modelContext.origin || [0, 0];
        while (props.length) {
            var prop = props.shift();
            ref = ref[prop];
            if (!ref)
                return null;
            if (ref.origin && props.length) {
                origin = MakerJs.point.add(origin, ref.origin);
            }
        }
        return {
            result: ref,
            offset: origin
        };
    }
    MakerJs.travel = travel;
    /**
     * @private
     */
    var clone = require('clone');
    /**
     * Clone an object.
     *
     * @param objectToClone The object to clone.
     * @returns A new clone of the original object.
     */
    function cloneObject(objectToClone) {
        return clone(objectToClone);
    }
    MakerJs.cloneObject = cloneObject;
    /**
     * Copy the properties from one object to another object.
     *
     * Example:
     * ```
     * makerjs.extendObject({ abc: 123 }, { xyz: 789 }); //returns { abc: 123, xyz: 789 }
     * ```
     *
     * @param target The object to extend. It will receive the new properties.
     * @param other An object containing properties to merge in.
     * @returns The original object after merging.
     */
    function extendObject(target, other) {
        if (target && other) {
            for (var key in other) {
                if (typeof other[key] !== 'undefined') {
                    target[key] = other[key];
                }
            }
        }
        return target;
    }
    MakerJs.extendObject = extendObject;
    /**
     * Test to see if a variable is a function.
     *
     * @param value The object to test.
     * @returns True if the object is a function type.
     */
    function isFunction(value) {
        return typeof value === 'function';
    }
    MakerJs.isFunction = isFunction;
    /**
     * Test to see if a variable is a number.
     *
     * @param value The object to test.
     * @returns True if the object is a number type.
     */
    function isNumber(value) {
        return typeof value === 'number';
    }
    MakerJs.isNumber = isNumber;
    /**
     * Test to see if a variable is an object.
     *
     * @param value The object to test.
     * @returns True if the object is an object type.
     */
    function isObject(value) {
        return typeof value === 'object';
    }
    MakerJs.isObject = isObject;
    //points
    /**
     * Test to see if an object implements the required properties of a point.
     *
     * @param item The item to test.
     */
    function isPoint(item) {
        return item && Array.isArray(item) && item.length == 2 && isNumber(item[0]) && isNumber(item[1]);
    }
    MakerJs.isPoint = isPoint;
    /**
     * Test to see if an object implements the required properties of a path.
     *
     * @param item The item to test.
     */
    function isPath(item) {
        return item && item.type && isPoint(item.origin);
    }
    MakerJs.isPath = isPath;
    /**
     * Test to see if an object implements the required properties of a line.
     *
     * @param item The item to test.
     */
    function isPathLine(item) {
        return isPath(item) && item.type == MakerJs.pathType.Line && isPoint(item.end);
    }
    MakerJs.isPathLine = isPathLine;
    /**
     * Test to see if an object implements the required properties of a circle.
     *
     * @param item The item to test.
     */
    function isPathCircle(item) {
        return isPath(item) && item.type == MakerJs.pathType.Circle && isNumber(item.radius);
    }
    MakerJs.isPathCircle = isPathCircle;
    /**
     * Test to see if an object implements the required properties of an arc.
     *
     * @param item The item to test.
     */
    function isPathArc(item) {
        return isPath(item) && item.type == MakerJs.pathType.Arc && isNumber(item.radius) && isNumber(item.startAngle) && isNumber(item.endAngle);
    }
    MakerJs.isPathArc = isPathArc;
    /**
     * Test to see if an object implements the required properties of an arc in a bezier curve.
     *
     * @param item The item to test.
     */
    function isPathArcInBezierCurve(item) {
        return isPathArc(item) && isObject(item.bezierData) && isNumber(item.bezierData.startT) && isNumber(item.bezierData.endT);
    }
    MakerJs.isPathArcInBezierCurve = isPathArcInBezierCurve;
    /**
     * String-based enumeration of all paths types.
     *
     * Examples: use pathType instead of string literal when creating a circle.
     * ```
     * var circle: IPathCircle = { type: pathType.Circle, origin: [0, 0], radius: 7 };   //typescript
     * var circle = { type: pathType.Circle, origin: [0, 0], radius: 7 };   //javascript
     * ```
     */
    MakerJs.pathType = {
        Line: "line",
        Circle: "circle",
        Arc: "arc",
        BezierSeed: "bezier-seed"
    };
    /**
     * Test to see if an object implements the required properties of a model.
     */
    function isModel(item) {
        return item && (item.paths || item.models);
    }
    MakerJs.isModel = isModel;
    /**
     * Test to see if an object implements the required properties of a chain.
     *
     * @param item The item to test.
     */
    function isChain(item) {
        var x = item;
        return x && x.links && Array.isArray(x.links) && isNumber(x.pathLength);
    }
    MakerJs.isChain = isChain;
    /**
     * @private
     */
    var Cascade = (function () {
        function Cascade(_module, $initial) {
            this._module = _module;
            this.$initial = $initial;
            for (var methodName in this._module)
                this._shadow(methodName);
            this.$result = $initial;
        }
        Cascade.prototype._shadow = function (methodName) {
            var _this = this;
            this[methodName] = function () {
                return _this._apply(_this._module[methodName], arguments);
            };
        };
        Cascade.prototype._apply = function (fn, carriedArguments) {
            var args = [].slice.call(carriedArguments);
            args.unshift(this.$result);
            this.$result = fn.apply(undefined, args);
            return this;
        };
        Cascade.prototype.$reset = function () {
            this.$result = this.$initial;
            return this;
        };
        return Cascade;
    }());
    function $(context) {
        if (isModel(context)) {
            return new Cascade(MakerJs.model, context);
        }
        else if (isPath(context)) {
            return new Cascade(MakerJs.path, context);
        }
        else if (isPoint(context)) {
            return new Cascade(MakerJs.point, context);
        }
    }
    MakerJs.$ = $;
})(MakerJs || (MakerJs = {}));
//CommonJs
module.exports = MakerJs;
//This file is generated by ./target/cascadable.js
var MakerJs;
(function (MakerJs) {
    var angle;
    (function (angle) {
        /**
         * Ensures an angle is not greater than 360
         *
         * @param angleInDegrees Angle in degrees.
         * @returns Same polar angle but not greater than 360 degrees.
         */
        function noRevolutions(angleInDegrees) {
            var revolutions = Math.floor(angleInDegrees / 360);
            var a = angleInDegrees - (360 * revolutions);
            return a < 0 ? a + 360 : a;
        }
        angle.noRevolutions = noRevolutions;
        /**
         * Convert an angle from degrees to radians.
         *
         * @param angleInDegrees Angle in degrees.
         * @returns Angle in radians.
         */
        function toRadians(angleInDegrees) {
            return noRevolutions(angleInDegrees) * Math.PI / 180.0;
        }
        angle.toRadians = toRadians;
        /**
         * Convert an angle from radians to degrees.
         *
         * @param angleInRadians Angle in radians.
         * @returns Angle in degrees.
         */
        function toDegrees(angleInRadians) {
            return angleInRadians * 180.0 / Math.PI;
        }
        angle.toDegrees = toDegrees;
        /**
         * Get an arc's end angle, ensured to be greater than its start angle.
         *
         * @param arc An arc path object.
         * @returns End angle of arc.
         */
        function ofArcEnd(arc) {
            //compensate for values past zero. This allows easy compute of total angle size.
            //for example 0 = 360
            if (arc.endAngle < arc.startAngle) {
                return 360 + arc.endAngle;
            }
            return arc.endAngle;
        }
        angle.ofArcEnd = ofArcEnd;
        /**
         * Get the angle in the middle of an arc's start and end angles.
         *
         * @param arc An arc path object.
         * @param ratio Optional number between 0 and 1 specifying percentage between start and end angles. Default is .5
         * @returns Middle angle of arc.
         */
        function ofArcMiddle(arc, ratio) {
            if (ratio === void 0) { ratio = .5; }
            return arc.startAngle + ofArcSpan(arc) * ratio;
        }
        angle.ofArcMiddle = ofArcMiddle;
        /**
         * Total angle of an arc between its start and end angles.
         *
         * @param arc The arc to measure.
         * @returns Angle of arc.
         */
        function ofArcSpan(arc) {
            var endAngle = angle.ofArcEnd(arc);
            var a = MakerJs.round(endAngle - arc.startAngle);
            if (a > 360) {
                return noRevolutions(a);
            }
            else {
                return a;
            }
        }
        angle.ofArcSpan = ofArcSpan;
        /**
         * Angle of a line path.
         *
         * @param line The line path to find the angle of.
         * @returns Angle of the line path, in degrees.
         */
        function ofLineInDegrees(line) {
            return noRevolutions(toDegrees(ofPointInRadians(line.origin, line.end)));
        }
        angle.ofLineInDegrees = ofLineInDegrees;
        /**
         * Angle of a line through a point, in degrees.
         *
         * @param pointToFindAngle The point to find the angle.
         * @param origin Point of origin of the angle.
         * @returns Angle of the line throught the point, in degrees.
         */
        function ofPointInDegrees(origin, pointToFindAngle) {
            return toDegrees(ofPointInRadians(origin, pointToFindAngle));
        }
        angle.ofPointInDegrees = ofPointInDegrees;
        /**
         * Angle of a line through a point, in radians.
         *
         * @param pointToFindAngle The point to find the angle.
         * @param origin Point of origin of the angle.
         * @returns Angle of the line throught the point, in radians.
         */
        function ofPointInRadians(origin, pointToFindAngle) {
            var d = MakerJs.point.subtract(pointToFindAngle, origin);
            var x = d[0];
            var y = d[1];
            return Math.atan2(-y, -x) + Math.PI;
        }
        angle.ofPointInRadians = ofPointInRadians;
        /**
         * Mirror an angle on either or both x and y axes.
         *
         * @param angleInDegrees The angle to mirror.
         * @param mirrorX Boolean to mirror on the x axis.
         * @param mirrorY Boolean to mirror on the y axis.
         * @returns Mirrored angle.
         */
        function mirror(angleInDegrees, mirrorX, mirrorY) {
            if (mirrorY) {
                angleInDegrees = 360 - angleInDegrees;
            }
            if (mirrorX) {
                angleInDegrees = (angleInDegrees < 180 ? 180 : 540) - angleInDegrees;
            }
            return angleInDegrees;
        }
        angle.mirror = mirror;
    })(angle = MakerJs.angle || (MakerJs.angle = {}));
})(MakerJs || (MakerJs = {}));
var MakerJs;
(function (MakerJs) {
    var point;
    (function (point) {
        /**
         * Add two points together and return the result as a new point object.
         *
         * @param a First point.
         * @param b Second point.
         * @param subtract Optional boolean to subtract instead of add.
         * @returns A new point object.
         */
        function add(a, b, subtract) {
            var newPoint = clone(a);
            if (!b)
                return newPoint;
            for (var i = 2; i--;) {
                if (subtract) {
                    newPoint[i] -= b[i];
                }
                else {
                    newPoint[i] += b[i];
                }
            }
            return newPoint;
        }
        point.add = add;
        /**
         * Get the average of two points.
         *
         * @param a First point.
         * @param b Second point.
         * @returns New point object which is the average of a and b.
         */
        function average(a, b) {
            function avg(i) {
                return (a[i] + b[i]) / 2;
            }
            return [avg(0), avg(1)];
        }
        point.average = average;
        /**
         * Clone a point into a new point.
         *
         * @param pointToClone The point to clone.
         * @returns A new point with same values as the original.
         */
        function clone(pointToClone) {
            if (!pointToClone)
                return point.zero();
            return [pointToClone[0], pointToClone[1]];
        }
        point.clone = clone;
        /**
         * From an array of points, find the closest point to a given reference point.
         *
         * @param referencePoint The reference point.
         * @param pointOptions Array of points to choose from.
         * @returns The first closest point from the pointOptions.
         */
        function closest(referencePoint, pointOptions) {
            var smallest = {
                index: 0,
                distance: -1
            };
            for (var i = 0; i < pointOptions.length; i++) {
                var distance = MakerJs.measure.pointDistance(referencePoint, pointOptions[i]);
                if (smallest.distance == -1 || distance < smallest.distance) {
                    smallest.distance = distance;
                    smallest.index = i;
                }
            }
            return pointOptions[smallest.index];
        }
        point.closest = closest;
        /**
         * Get a point from its polar coordinates.
         *
         * @param angleInRadians The angle of the polar coordinate, in radians.
         * @param radius The radius of the polar coordinate.
         * @returns A new point object.
         */
        function fromPolar(angleInRadians, radius) {
            return [
                radius * Math.cos(angleInRadians),
                radius * Math.sin(angleInRadians)
            ];
        }
        point.fromPolar = fromPolar;
        /**
         * Get a point on a circle or arc path, at a given angle.
         * @param angleInDegrees The angle at which you want to find the point, in degrees.
         * @param circle A circle or arc.
         * @returns A new point object.
         */
        function fromAngleOnCircle(angleInDegrees, circle) {
            return add(circle.origin, fromPolar(MakerJs.angle.toRadians(angleInDegrees), circle.radius));
        }
        point.fromAngleOnCircle = fromAngleOnCircle;
        /**
         * Get the two end points of an arc path.
         *
         * @param arc The arc path object.
         * @returns Array with 2 elements: [0] is the point object corresponding to the start angle, [1] is the point object corresponding to the end angle.
         */
        function fromArc(arc) {
            return [fromAngleOnCircle(arc.startAngle, arc), fromAngleOnCircle(arc.endAngle, arc)];
        }
        point.fromArc = fromArc;
        /**
         * @private
         */
        var pathEndsMap = {};
        pathEndsMap[MakerJs.pathType.Arc] = function (arc) {
            return point.fromArc(arc);
        };
        pathEndsMap[MakerJs.pathType.Line] = function (line) {
            return [line.origin, line.end];
        };
        pathEndsMap[MakerJs.pathType.BezierSeed] = pathEndsMap[MakerJs.pathType.Line];
        /**
         * Get the two end points of a path.
         *
         * @param pathContext The path object.
         * @returns Array with 2 elements: [0] is the point object corresponding to the origin, [1] is the point object corresponding to the end.
         */
        function fromPathEnds(pathContext, pathOffset) {
            var result = null;
            var fn = pathEndsMap[pathContext.type];
            if (fn) {
                result = fn(pathContext);
                if (pathOffset) {
                    result = result.map(function (p) { return add(p, pathOffset); });
                }
            }
            return result;
        }
        point.fromPathEnds = fromPathEnds;
        /**
         * @private
         */
        function verticalIntersectionPoint(verticalLine, nonVerticalSlope) {
            var x = verticalLine.origin[0];
            var y = nonVerticalSlope.slope * x + nonVerticalSlope.yIntercept;
            return [x, y];
        }
        /**
         * Calculates the intersection of slopes of two lines.
         *
         * @param lineA First line to use for slope.
         * @param lineB Second line to use for slope.
         * @param options Optional IPathIntersectionOptions.
         * @returns point of intersection of the two slopes, or null if the slopes did not intersect.
         */
        function fromSlopeIntersection(lineA, lineB, options) {
            if (options === void 0) { options = {}; }
            var slopeA = MakerJs.measure.lineSlope(lineA);
            var slopeB = MakerJs.measure.lineSlope(lineB);
            //see if slope are parallel 
            if (MakerJs.measure.isSlopeParallel(slopeA, slopeB)) {
                if (MakerJs.measure.isSlopeEqual(slopeA, slopeB)) {
                    //check for overlap
                    options.out_AreOverlapped = MakerJs.measure.isLineOverlapping(lineA, lineB, options.excludeTangents);
                }
                return null;
            }
            var pointOfIntersection;
            if (!slopeA.hasSlope) {
                pointOfIntersection = verticalIntersectionPoint(lineA, slopeB);
            }
            else if (!slopeB.hasSlope) {
                pointOfIntersection = verticalIntersectionPoint(lineB, slopeA);
            }
            else {
                // find intersection by line equation
                var x = (slopeB.yIntercept - slopeA.yIntercept) / (slopeA.slope - slopeB.slope);
                var y = slopeA.slope * x + slopeA.yIntercept;
                pointOfIntersection = [x, y];
            }
            return pointOfIntersection;
        }
        point.fromSlopeIntersection = fromSlopeIntersection;
        /**
         * @private
         */
        function midCircle(circle, midAngle) {
            return point.add(circle.origin, point.fromPolar(MakerJs.angle.toRadians(midAngle), circle.radius));
        }
        /**
         * @private
         */
        var middleMap = {};
        middleMap[MakerJs.pathType.Arc] = function (arc, ratio) {
            var midAngle = MakerJs.angle.ofArcMiddle(arc, ratio);
            return midCircle(arc, midAngle);
        };
        middleMap[MakerJs.pathType.Circle] = function (circle, ratio) {
            return midCircle(circle, 360 * ratio);
        };
        middleMap[MakerJs.pathType.Line] = function (line, ratio) {
            function ration(a, b) {
                return a + (b - a) * ratio;
            }
            ;
            return [
                ration(line.origin[0], line.end[0]),
                ration(line.origin[1], line.end[1])
            ];
        };
        middleMap[MakerJs.pathType.BezierSeed] = function (seed, ratio) {
            return MakerJs.models.BezierCurve.computePoint(seed, ratio);
        };
        /**
         * Get the middle point of a path.
         *
         * @param pathContext The path object.
         * @param ratio Optional ratio (between 0 and 1) of point along the path. Default is .5 for middle.
         * @returns Point on the path, in the middle of the path.
         */
        function middle(pathContext, ratio) {
            if (ratio === void 0) { ratio = .5; }
            var midPoint = null;
            var fn = middleMap[pathContext.type];
            if (fn) {
                midPoint = fn(pathContext, ratio);
            }
            return midPoint;
        }
        point.middle = middle;
        /**
         * Create a clone of a point, mirrored on either or both x and y axes.
         *
         * @param pointToMirror The point to mirror.
         * @param mirrorX Boolean to mirror on the x axis.
         * @param mirrorY Boolean to mirror on the y axis.
         * @returns Mirrored point.
         */
        function mirror(pointToMirror, mirrorX, mirrorY) {
            var p = clone(pointToMirror);
            if (mirrorX) {
                p[0] = -p[0];
            }
            if (mirrorY) {
                p[1] = -p[1];
            }
            return p;
        }
        point.mirror = mirror;
        /**
         * Round the values of a point.
         *
         * @param pointContext The point to serialize.
         * @param accuracy Optional exemplar number of decimal places.
         * @returns A new point with the values rounded.
         */
        function rounded(pointContext, accuracy) {
            return [MakerJs.round(pointContext[0], accuracy), MakerJs.round(pointContext[1], accuracy)];
        }
        point.rounded = rounded;
        /**
         * Rotate a point.
         *
         * @param pointToRotate The point to rotate.
         * @param angleInDegrees The amount of rotation, in degrees.
         * @param rotationOrigin The center point of rotation.
         * @returns A new point.
         */
        function rotate(pointToRotate, angleInDegrees, rotationOrigin) {
            if (rotationOrigin === void 0) { rotationOrigin = [0, 0]; }
            var pointAngleInRadians = MakerJs.angle.ofPointInRadians(rotationOrigin, pointToRotate);
            var d = MakerJs.measure.pointDistance(rotationOrigin, pointToRotate);
            var rotatedPoint = fromPolar(pointAngleInRadians + MakerJs.angle.toRadians(angleInDegrees), d);
            return add(rotationOrigin, rotatedPoint);
        }
        point.rotate = rotate;
        /**
         * Scale a point's coordinates.
         *
         * @param pointToScale The point to scale.
         * @param scaleValue The amount of scaling.
         * @returns A new point.
         */
        function scale(pointToScale, scaleValue) {
            var p = clone(pointToScale);
            for (var i = 2; i--;) {
                p[i] *= scaleValue;
            }
            return p;
        }
        point.scale = scale;
        /**
         * Distort a point's coordinates.
         *
         * @param pointToDistort The point to distort.
         * @param scaleX The amount of x scaling.
         * @param scaleY The amount of y scaling.
         * @returns A new point.
         */
        function distort(pointToDistort, scaleX, scaleY) {
            return [pointToDistort[0] * scaleX, pointToDistort[1] * scaleY];
        }
        point.distort = distort;
        /**
         * Subtract a point from another point, and return the result as a new point. Shortcut to Add(a, b, subtract = true).
         *
         * @param a First point.
         * @param b Second point.
         * @returns A new point object.
         */
        function subtract(a, b) {
            return add(a, b, true);
        }
        point.subtract = subtract;
        /**
         * A point at 0,0 coordinates.
         * NOTE: It is important to call this as a method, with the empty parentheses.
         *
         * @returns A new point.
         */
        function zero() {
            return [0, 0];
        }
        point.zero = zero;
    })(point = MakerJs.point || (MakerJs.point = {}));
})(MakerJs || (MakerJs = {}));
var MakerJs;
(function (MakerJs) {
    var path;
    (function (path) {
        /**
         * Add a path to a model. This is basically equivalent to:
         * ```
         * parentModel.paths[pathId] = childPath;
         * ```
         * with additional checks to make it safe for cascading.
         *
         * @param childPath The path to add.
         * @param parentModel The model to add to.
         * @param pathId The id of the path.
         * @param overwrite Optional flag to overwrite any path referenced by pathId. Default is false, which will create an id similar to pathId.
         * @returns The original path (for cascading).
         */
        function addTo(childPath, parentModel, pathId, overwrite) {
            if (overwrite === void 0) { overwrite = false; }
            MakerJs.model.addPath(parentModel, childPath, pathId, overwrite);
            return childPath;
        }
        path.addTo = addTo;
        /**
         * @private
         */
        function copyLayer(pathA, pathB) {
            if (pathA && pathB && ('layer' in pathA)) {
                pathB.layer = pathA.layer;
            }
            //carry extra props if this is an IPathArcInBezierCurve
            if (pathA && pathB && ('bezierData' in pathA)) {
                pathB.bezierData = pathA.bezierData;
            }
        }
        /**
         * Create a clone of a path. This is faster than cloneObject.
         *
         * @param pathToClone The path to clone.
         * @param offset Optional point to move path a relative distance.
         * @returns Cloned path.
         */
        function clone(pathToClone, offset) {
            var result = { type: pathToClone.type, origin: MakerJs.point.add(pathToClone.origin, offset) };
            switch (pathToClone.type) {
                case MakerJs.pathType.Arc:
                    result.radius = pathToClone.radius;
                    result.startAngle = pathToClone.startAngle;
                    result.endAngle = pathToClone.endAngle;
                    break;
                case MakerJs.pathType.Circle:
                    result.radius = pathToClone.radius;
                    break;
                case MakerJs.pathType.Line:
                    result.end = MakerJs.point.add(pathToClone.end, offset);
                    break;
                case MakerJs.pathType.BezierSeed:
                    result.end = MakerJs.point.add(pathToClone.end, offset);
                    result.controls = pathToClone.controls.map(function (p) { return MakerJs.point.add(p, offset); });
                    break;
            }
            copyLayer(pathToClone, result);
            return result;
        }
        path.clone = clone;
        /**
         * @private
         */
        var mirrorMap = {};
        mirrorMap[MakerJs.pathType.Line] = function (line, origin, mirrorX, mirrorY) {
            return new MakerJs.paths.Line(origin, MakerJs.point.mirror(line.end, mirrorX, mirrorY));
        };
        mirrorMap[MakerJs.pathType.Circle] = function (circle, origin, mirrorX, mirrorY) {
            return new MakerJs.paths.Circle(origin, circle.radius);
        };
        mirrorMap[MakerJs.pathType.Arc] = function (arc, origin, mirrorX, mirrorY) {
            var startAngle = MakerJs.angle.mirror(arc.startAngle, mirrorX, mirrorY);
            var endAngle = MakerJs.angle.mirror(MakerJs.angle.ofArcEnd(arc), mirrorX, mirrorY);
            var xor = mirrorX != mirrorY;
            return new MakerJs.paths.Arc(origin, arc.radius, xor ? endAngle : startAngle, xor ? startAngle : endAngle);
        };
        mirrorMap[MakerJs.pathType.BezierSeed] = function (seed, origin, mirrorX, mirrorY) {
            var mirrored = mirrorMap[MakerJs.pathType.Line](seed, origin, mirrorX, mirrorY);
            mirrored.type = MakerJs.pathType.BezierSeed;
            mirrored.controls = seed.controls.map(function (c) { return MakerJs.point.mirror(c, mirrorX, mirrorY); });
            return mirrored;
        };
        /**
         * Set the layer of a path. This is equivalent to:
         * ```
         * pathContext.layer = layer;
         * ```
         *
         * @param pathContext The path to set the layer.
         * @param layer The layer name.
         * @returns The original path (for cascading).
         */
        function layer(pathContext, layer) {
            pathContext.layer = layer;
            return pathContext;
        }
        path.layer = layer;
        /**
         * Create a clone of a path, mirrored on either or both x and y axes.
         *
         * @param pathToMirror The path to mirror.
         * @param mirrorX Boolean to mirror on the x axis.
         * @param mirrorY Boolean to mirror on the y axis.
         * @returns Mirrored path.
         */
        function mirror(pathToMirror, mirrorX, mirrorY) {
            var newPath = null;
            if (pathToMirror) {
                var origin = MakerJs.point.mirror(pathToMirror.origin, mirrorX, mirrorY);
                var fn = mirrorMap[pathToMirror.type];
                if (fn) {
                    newPath = fn(pathToMirror, origin, mirrorX, mirrorY);
                }
            }
            copyLayer(pathToMirror, newPath);
            return newPath;
        }
        path.mirror = mirror;
        /**
         * @private
         */
        var moveMap = {};
        moveMap[MakerJs.pathType.Line] = function (line, origin) {
            var delta = MakerJs.point.subtract(line.end, line.origin);
            line.end = MakerJs.point.add(origin, delta);
        };
        /**
         * Move a path to an absolute point.
         *
         * @param pathToMove The path to move.
         * @param origin The new origin for the path.
         * @returns The original path (for cascading).
         */
        function move(pathToMove, origin) {
            if (pathToMove) {
                var fn = moveMap[pathToMove.type];
                if (fn) {
                    fn(pathToMove, origin);
                }
                pathToMove.origin = origin;
            }
            return pathToMove;
        }
        path.move = move;
        /**
         * @private
         */
        var moveRelativeMap = {};
        moveRelativeMap[MakerJs.pathType.Line] = function (line, delta, subtract) {
            line.end = MakerJs.point.add(line.end, delta, subtract);
        };
        moveRelativeMap[MakerJs.pathType.BezierSeed] = function (seed, delta, subtract) {
            moveRelativeMap[MakerJs.pathType.Line](seed, delta, subtract);
            seed.controls = seed.controls.map(function (c) { return MakerJs.point.add(c, delta, subtract); });
        };
        /**
         * Move a path's origin by a relative amount.
         *
         * @param pathToMove The path to move.
         * @param delta The x & y adjustments as a point object.
         * @param subtract Optional boolean to subtract instead of add.
         * @returns The original path (for cascading).
         */
        function moveRelative(pathToMove, delta, subtract) {
            if (pathToMove && delta) {
                pathToMove.origin = MakerJs.point.add(pathToMove.origin, delta, subtract);
                var fn = moveRelativeMap[pathToMove.type];
                if (fn) {
                    fn(pathToMove, delta, subtract);
                }
            }
            return pathToMove;
        }
        path.moveRelative = moveRelative;
        /**
         * Move some paths relatively during a task execution, then unmove them.
         *
         * @param pathsToMove The paths to move.
         * @param deltas The x & y adjustments as a point object array.
         * @param task The function to call while the paths are temporarily moved.
         */
        function moveTemporary(pathsToMove, deltas, task) {
            var subtract = false;
            function move(pathToOffset, i) {
                if (deltas[i]) {
                    moveRelative(pathToOffset, deltas[i], subtract);
                }
            }
            pathsToMove.map(move);
            task();
            subtract = true;
            pathsToMove.map(move);
        }
        path.moveTemporary = moveTemporary;
        /**
         * @private
         */
        var rotateMap = {};
        rotateMap[MakerJs.pathType.Line] = function (line, angleInDegrees, rotationOrigin) {
            line.end = MakerJs.point.rotate(line.end, angleInDegrees, rotationOrigin);
        };
        rotateMap[MakerJs.pathType.Arc] = function (arc, angleInDegrees, rotationOrigin) {
            arc.startAngle = MakerJs.angle.noRevolutions(arc.startAngle + angleInDegrees);
            arc.endAngle = MakerJs.angle.noRevolutions(arc.endAngle + angleInDegrees);
        };
        rotateMap[MakerJs.pathType.BezierSeed] = function (seed, angleInDegrees, rotationOrigin) {
            rotateMap[MakerJs.pathType.Line](seed, angleInDegrees, rotationOrigin);
            seed.controls = seed.controls.map(function (c) { return MakerJs.point.rotate(c, angleInDegrees, rotationOrigin); });
        };
        /**
         * Rotate a path.
         *
         * @param pathToRotate The path to rotate.
         * @param angleInDegrees The amount of rotation, in degrees.
         * @param rotationOrigin The center point of rotation.
         * @returns The original path (for cascading).
         */
        function rotate(pathToRotate, angleInDegrees, rotationOrigin) {
            if (rotationOrigin === void 0) { rotationOrigin = [0, 0]; }
            if (!pathToRotate || !angleInDegrees)
                return pathToRotate;
            pathToRotate.origin = MakerJs.point.rotate(pathToRotate.origin, angleInDegrees, rotationOrigin);
            var fn = rotateMap[pathToRotate.type];
            if (fn) {
                fn(pathToRotate, angleInDegrees, rotationOrigin);
            }
            return pathToRotate;
        }
        path.rotate = rotate;
        /**
         * @private
         */
        var scaleMap = {};
        scaleMap[MakerJs.pathType.Line] = function (line, scaleValue) {
            line.end = MakerJs.point.scale(line.end, scaleValue);
        };
        scaleMap[MakerJs.pathType.BezierSeed] = function (seed, scaleValue) {
            scaleMap[MakerJs.pathType.Line](seed, scaleValue);
            seed.controls = seed.controls.map(function (c) { return MakerJs.point.scale(c, scaleValue); });
        };
        scaleMap[MakerJs.pathType.Circle] = function (circle, scaleValue) {
            circle.radius *= scaleValue;
        };
        scaleMap[MakerJs.pathType.Arc] = scaleMap[MakerJs.pathType.Circle];
        /**
         * Scale a path.
         *
         * @param pathToScale The path to scale.
         * @param scaleValue The amount of scaling.
         * @returns The original path (for cascading).
         */
        function scale(pathToScale, scaleValue) {
            if (!pathToScale || scaleValue == 1)
                return pathToScale;
            pathToScale.origin = MakerJs.point.scale(pathToScale.origin, scaleValue);
            var fn = scaleMap[pathToScale.type];
            if (fn) {
                fn(pathToScale, scaleValue);
            }
            return pathToScale;
        }
        path.scale = scale;
        /**
         * @private
         */
        var distortMap = {};
        distortMap[MakerJs.pathType.Arc] = function (arc, scaleX, scaleY) {
            return new MakerJs.models.EllipticArc(arc, scaleX, scaleY);
        };
        distortMap[MakerJs.pathType.Circle] = function (circle, scaleX, scaleY) {
            var ellipse = new MakerJs.models.Ellipse(circle.radius * scaleX, circle.radius * scaleY);
            ellipse.origin = MakerJs.point.distort(circle.origin, scaleX, scaleY);
            return ellipse;
        };
        distortMap[MakerJs.pathType.Line] = function (line, scaleX, scaleY) {
            return new MakerJs.paths.Line([line.origin, line.end].map(function (p) { return MakerJs.point.distort(p, scaleX, scaleY); }));
        };
        distortMap[MakerJs.pathType.BezierSeed] = function (seed, scaleX, scaleY) {
            var d = MakerJs.point.distort;
            return {
                type: MakerJs.pathType.BezierSeed,
                origin: d(seed.origin, scaleX, scaleY),
                controls: seed.controls.map(function (c) { return d(c, scaleX, scaleY); }),
                end: d(seed.end, scaleX, scaleY)
            };
        };
        /**
         * Distort a path - scale x and y individually.
         *
         * @param pathToDistort The path to distort.
         * @param scaleX The amount of x scaling.
         * @param scaleY The amount of y scaling.
         * @returns A new IModel (for circles and arcs) or IPath (for lines and bezier seeds).
         */
        function distort(pathToDistort, scaleX, scaleY) {
            if (!pathToDistort)
                return null;
            var fn = distortMap[pathToDistort.type];
            if (fn) {
                return fn(pathToDistort, scaleX, scaleY);
            }
            return null;
        }
        path.distort = distort;
        /**
         * Connect 2 lines at their slope intersection point.
         *
         * @param lineA First line to converge.
         * @param lineB Second line to converge.
         * @param useOriginA Optional flag to converge the origin point of lineA instead of the end point.
         * @param useOriginB Optional flag to converge the origin point of lineB instead of the end point.
         * @returns point of convergence.
         */
        function converge(lineA, lineB, useOriginA, useOriginB) {
            var p = MakerJs.point.fromSlopeIntersection(lineA, lineB);
            if (p) {
                var lines = [lineA, lineB];
                var useOrigin = [useOriginA, useOriginB];
                if (arguments.length === 2) {
                    //converge to closest
                    lines.forEach(function (line, i) {
                        useOrigin[i] = (MakerJs.point.closest(p, [line.origin, line.end]) === line.origin);
                    });
                }
                function setPoint(line, useOrigin) {
                    var setP;
                    if (useOrigin) {
                        setP = line.origin;
                    }
                    else {
                        setP = line.end;
                    }
                    setP[0] = p[0];
                    setP[1] = p[1];
                }
                lines.forEach(function (line, i) {
                    setPoint(line, useOrigin[i]);
                });
            }
            return p;
        }
        path.converge = converge;
        /**
         * @private
         */
        var alterMap = {};
        alterMap[MakerJs.pathType.Arc] = function (arc, pathLength, distance, useOrigin) {
            var span = MakerJs.angle.ofArcSpan(arc);
            var delta = ((pathLength + distance) * span / pathLength) - span;
            if (useOrigin) {
                arc.startAngle -= delta;
            }
            else {
                arc.endAngle += delta;
            }
        };
        alterMap[MakerJs.pathType.Circle] = function (circle, pathLength, distance, useOrigin) {
            circle.radius *= (pathLength + distance) / pathLength;
        };
        alterMap[MakerJs.pathType.Line] = function (line, pathLength, distance, useOrigin) {
            var delta = MakerJs.point.scale(MakerJs.point.subtract(line.end, line.origin), distance / pathLength);
            if (useOrigin) {
                line.origin = MakerJs.point.subtract(line.origin, delta);
            }
            else {
                line.end = MakerJs.point.add(line.end, delta);
            }
        };
        /**
         * Alter a path by lengthening or shortening it.
         *
         * @param pathToAlter Path to alter.
         * @param distance Numeric amount of length to add or remove from the path. Use a positive number to lengthen, negative to shorten. When shortening: this function will not alter the path and will return null if the resulting path length is less than or equal to zero.
         * @param useOrigin Optional flag to alter from the origin instead of the end of the path.
         * @returns The original path (for cascading), or null if the path could not be altered.
         */
        function alterLength(pathToAlter, distance, useOrigin) {
            if (useOrigin === void 0) { useOrigin = false; }
            if (!pathToAlter || !distance)
                return null;
            var fn = alterMap[pathToAlter.type];
            if (fn) {
                var pathLength = MakerJs.measure.pathLength(pathToAlter);
                if (!pathLength || -distance >= pathLength)
                    return null;
                fn(pathToAlter, pathLength, distance, useOrigin);
                return pathToAlter;
            }
            return null;
        }
        path.alterLength = alterLength;
        /**
         * Get points along a path.
         *
         * @param pathContext Path to get points from.
         * @param numberOfPoints Number of points to divide the path.
         * @returns Array of points which are on the path spread at a uniform interval.
         */
        function toPoints(pathContext, numberOfPoints) {
            //avoid division by zero when there is only one point
            if (numberOfPoints == 1) {
                return [MakerJs.point.middle(pathContext)];
            }
            var points = [];
            var base = numberOfPoints;
            if (pathContext.type != MakerJs.pathType.Circle)
                base--;
            for (var i = 0; i < numberOfPoints; i++) {
                points.push(MakerJs.point.middle(pathContext, i / base));
            }
            return points;
        }
        path.toPoints = toPoints;
        /**
         * @private
         */
        var numberOfKeyPointsMap = {};
        numberOfKeyPointsMap[MakerJs.pathType.Line] = function (line) {
            return 2;
        };
        numberOfKeyPointsMap[MakerJs.pathType.Circle] = function (circle, maxPointDistance) {
            var len = MakerJs.measure.pathLength(circle);
            if (!len)
                return 0;
            maxPointDistance = maxPointDistance || len;
            return Math.max(8, Math.ceil(len / (maxPointDistance || len)));
        };
        numberOfKeyPointsMap[MakerJs.pathType.Arc] = function (arc, maxPointDistance) {
            var len = MakerJs.measure.pathLength(arc);
            if (!len)
                return 0;
            var minPoints = Math.ceil(MakerJs.angle.ofArcSpan(arc) / 45) + 1;
            return Math.max(minPoints, Math.ceil(len / (maxPointDistance || len)));
        };
        /**
         * Get key points (a minimal a number of points) along a path.
         *
         * @param pathContext Path to get points from.
         * @param maxArcFacet Optional maximum length between points on an arc or circle.
         * @returns Array of points which are on the path.
         */
        function toKeyPoints(pathContext, maxArcFacet) {
            if (pathContext.type == MakerJs.pathType.BezierSeed) {
                var curve = new MakerJs.models.BezierCurve(pathContext);
                var curveKeyPoints;
                MakerJs.model.findChains(curve, function (chains, loose, layer) {
                    if (chains.length == 1) {
                        var c = chains[0];
                        switch (c.links[0].walkedPath.pathId) {
                            case 'arc_0':
                            case 'line_0':
                                break;
                            default:
                                MakerJs.chain.reverse(c);
                        }
                        curveKeyPoints = MakerJs.chain.toKeyPoints(c);
                    }
                    else if (loose.length === 1) {
                        curveKeyPoints = toKeyPoints(loose[0].pathContext);
                    }
                });
                return curveKeyPoints;
            }
            else {
                var fn = numberOfKeyPointsMap[pathContext.type];
                if (fn) {
                    var numberOfKeyPoints = fn(pathContext, maxArcFacet);
                    if (numberOfKeyPoints) {
                        return toPoints(pathContext, numberOfKeyPoints);
                    }
                }
            }
            return [];
        }
        path.toKeyPoints = toKeyPoints;
        /**
         * Center a path at [0, 0].
         *
         * @param pathToCenter The path to center.
         * @returns The original path (for cascading).
         */
        function center(pathToCenter) {
            var m = MakerJs.measure.pathExtents(pathToCenter);
            var c = MakerJs.point.average(m.high, m.low);
            var o = MakerJs.point.subtract(pathToCenter.origin || [0, 0], c);
            move(pathToCenter, o);
            return pathToCenter;
        }
        path.center = center;
        /**
         * Move a path so its bounding box begins at [0, 0].
         *
         * @param pathToZero The path to zero.
         * @returns The original path (for cascading).
         */
        function zero(pathToZero) {
            var m = MakerJs.measure.pathExtents(pathToZero);
            var z = MakerJs.point.subtract(pathToZero.origin || [0, 0], m.low);
            move(pathToZero, z);
            return pathToZero;
        }
        path.zero = zero;
    })(path = MakerJs.path || (MakerJs.path = {}));
})(MakerJs || (MakerJs = {}));
var MakerJs;
(function (MakerJs) {
    var path;
    (function (path_1) {
        /**
         * @private
         */
        var breakPathFunctionMap = {};
        breakPathFunctionMap[MakerJs.pathType.Arc] = function (arc, pointOfBreak) {
            var angleAtBreakPoint = MakerJs.angle.ofPointInDegrees(arc.origin, pointOfBreak);
            if (MakerJs.measure.isAngleEqual(angleAtBreakPoint, arc.startAngle) || MakerJs.measure.isAngleEqual(angleAtBreakPoint, arc.endAngle)) {
                return null;
            }
            function getAngleStrictlyBetweenArcAngles() {
                var startAngle = MakerJs.angle.noRevolutions(arc.startAngle);
                var endAngle = startAngle + MakerJs.angle.ofArcEnd(arc) - arc.startAngle;
                var tries = [0, 1, -1];
                for (var i = 0; i < tries.length; i++) {
                    var add = +360 * tries[i];
                    if (MakerJs.measure.isBetween(angleAtBreakPoint + add, startAngle, endAngle, true)) {
                        return arc.startAngle + angleAtBreakPoint + add - startAngle;
                    }
                }
                return null;
            }
            var angleAtBreakPointBetween = getAngleStrictlyBetweenArcAngles();
            if (angleAtBreakPointBetween == null) {
                return null;
            }
            var savedEndAngle = arc.endAngle;
            arc.endAngle = angleAtBreakPointBetween;
            //clone the original to carry other properties
            var copy = MakerJs.cloneObject(arc);
            copy.startAngle = angleAtBreakPointBetween;
            copy.endAngle = savedEndAngle;
            return copy;
        };
        breakPathFunctionMap[MakerJs.pathType.Circle] = function (circle, pointOfBreak) {
            //breaking a circle turns it into an arc
            circle.type = MakerJs.pathType.Arc;
            var arc = circle;
            var angleAtBreakPoint = MakerJs.angle.ofPointInDegrees(circle.origin, pointOfBreak);
            arc.startAngle = angleAtBreakPoint;
            arc.endAngle = angleAtBreakPoint + 360;
            return null;
        };
        breakPathFunctionMap[MakerJs.pathType.Line] = function (line, pointOfBreak) {
            if (!MakerJs.measure.isBetweenPoints(pointOfBreak, line, true)) {
                return null;
            }
            var savedEndPoint = line.end;
            line.end = pointOfBreak;
            //clone the original to carry other properties
            var copy = MakerJs.cloneObject(line);
            copy.origin = pointOfBreak;
            copy.end = savedEndPoint;
            return copy;
        };
        /**
         * Breaks a path in two. The supplied path will end at the supplied pointOfBreak,
         * a new path is returned which begins at the pointOfBreak and ends at the supplied path's initial end point.
         * For Circle, the original path will be converted in place to an Arc, and null is returned.
         *
         * @param pathToBreak The path to break.
         * @param pointOfBreak The point at which to break the path.
         * @returns A new path of the same type, when path type is line or arc. Returns null for circle.
         */
        function breakAtPoint(pathToBreak, pointOfBreak) {
            if (pathToBreak && pointOfBreak) {
                var fn = breakPathFunctionMap[pathToBreak.type];
                if (fn) {
                    var result = fn(pathToBreak, pointOfBreak);
                    if (result && ('layer' in pathToBreak)) {
                        result.layer = pathToBreak.layer;
                    }
                    return result;
                }
            }
            return null;
        }
        path_1.breakAtPoint = breakAtPoint;
    })(path = MakerJs.path || (MakerJs.path = {}));
})(MakerJs || (MakerJs = {}));
var MakerJs;
(function (MakerJs) {
    var paths;
    (function (paths) {
        /**
         * Class for arc path.
         */
        var Arc = (function () {
            function Arc() {
                var args = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    args[_i] = arguments[_i];
                }
                function getSpan(origin) {
                    var startAngle = MakerJs.angle.ofPointInDegrees(origin, args[clockwise ? 1 : 0]);
                    var endAngle = MakerJs.angle.ofPointInDegrees(origin, args[clockwise ? 0 : 1]);
                    if (endAngle < startAngle) {
                        endAngle += 360;
                    }
                    return {
                        origin: origin,
                        startAngle: startAngle,
                        endAngle: endAngle,
                        size: endAngle - startAngle
                    };
                }
                switch (args.length) {
                    case 5:
                        //SVG style arc designation
                        var pointA = args[0];
                        var pointB = args[1];
                        this.radius = args[2];
                        var largeArc = args[3];
                        var clockwise = args[4];
                        var span;
                        //make sure arc can reach. if not, scale up.
                        var smallestRadius = MakerJs.measure.pointDistance(pointA, pointB) / 2;
                        if (MakerJs.round(this.radius - smallestRadius) <= 0) {
                            this.radius = smallestRadius;
                            span = getSpan(MakerJs.point.average(pointA, pointB));
                        }
                        else {
                            //find the 2 potential origins
                            var origins = MakerJs.path.intersection(new Circle(pointA, this.radius), new Circle(pointB, this.radius));
                            var spans = [];
                            for (var i = origins.intersectionPoints.length; i--;) {
                                span = getSpan(origins.intersectionPoints[i]);
                                //insert sorted by size ascending
                                if (spans.length == 0 || span.size > spans[0].size) {
                                    spans.push(span);
                                }
                                else {
                                    spans.unshift(span);
                                }
                            }
                            var index = largeArc ? 1 : 0;
                            span = spans[index];
                        }
                        this.origin = span.origin;
                        this.startAngle = span.startAngle;
                        this.endAngle = span.endAngle;
                        break;
                    case 4:
                        this.origin = args[0];
                        this.radius = args[1];
                        this.startAngle = args[2];
                        this.endAngle = args[3];
                        break;
                    case 3:
                        if (MakerJs.isPoint(args[2])) {
                            //from 3 points
                            Circle.apply(this, args);
                            var angles = [];
                            for (var i = 0; i < 3; i++) {
                                angles.push(MakerJs.angle.ofPointInDegrees(this.origin, args[i]));
                            }
                            this.startAngle = angles[0];
                            this.endAngle = angles[2];
                            //swap start and end angles if this arc does not contain the midpoint
                            if (!MakerJs.measure.isBetweenArcAngles(angles[1], this, false)) {
                                this.startAngle = angles[2];
                                this.endAngle = angles[0];
                            }
                            //do not fall through if this was 3 points
                            break;
                        }
                    //fall through to below if 2 points
                    case 2:
                        //from 2 points (and optional clockwise flag)
                        var clockwise = args[2];
                        Circle.call(this, args[0], args[1]);
                        this.startAngle = MakerJs.angle.ofPointInDegrees(this.origin, args[clockwise ? 1 : 0]);
                        this.endAngle = MakerJs.angle.ofPointInDegrees(this.origin, args[clockwise ? 0 : 1]);
                        break;
                }
                //do this after Circle.apply / Circle.call to make sure this is an arc
                this.type = MakerJs.pathType.Arc;
            }
            return Arc;
        }());
        paths.Arc = Arc;
        /**
         * Class for circle path.
         */
        var Circle = (function () {
            function Circle() {
                var args = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    args[_i] = arguments[_i];
                }
                this.type = MakerJs.pathType.Circle;
                switch (args.length) {
                    case 1:
                        this.origin = [0, 0];
                        this.radius = args[0];
                        break;
                    case 2:
                        if (MakerJs.isNumber(args[1])) {
                            this.origin = args[0];
                            this.radius = args[1];
                        }
                        else {
                            //Circle from 2 points
                            this.origin = MakerJs.point.average(args[0], args[1]);
                            this.radius = MakerJs.measure.pointDistance(this.origin, args[0]);
                        }
                        break;
                    default:
                        //Circle from 3 points
                        //create 2 lines with 2nd point in common
                        var lines = [
                            new Line(args[0], args[1]),
                            new Line(args[1], args[2])
                        ];
                        //create perpendicular lines
                        var perpendiculars = [];
                        for (var i = 2; i--;) {
                            var midpoint = MakerJs.point.middle(lines[i]);
                            perpendiculars.push(MakerJs.path.rotate(lines[i], 90, midpoint));
                        }
                        //find intersection of slopes of perpendiculars
                        var origin = MakerJs.point.fromSlopeIntersection(perpendiculars[0], perpendiculars[1]);
                        if (origin) {
                            this.origin = origin;
                            //radius is distance to any of the 3 points
                            this.radius = MakerJs.measure.pointDistance(this.origin, args[0]);
                        }
                        else {
                            throw 'invalid parameters - attempted to construct a circle from 3 points on a line: ' + JSON.stringify(args);
                        }
                        break;
                }
            }
            return Circle;
        }());
        paths.Circle = Circle;
        /**
         * Class for line path.
         */
        var Line = (function () {
            function Line() {
                var args = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    args[_i] = arguments[_i];
                }
                this.type = MakerJs.pathType.Line;
                switch (args.length) {
                    case 1:
                        var points = args[0];
                        this.origin = points[0];
                        this.end = points[1];
                        break;
                    case 2:
                        this.origin = args[0];
                        this.end = args[1];
                        break;
                }
            }
            return Line;
        }());
        paths.Line = Line;
        /**
         * Class for chord, which is simply a line path that connects the endpoints of an arc.
         *
         * @param arc Arc to use as the basic for the chord.
         */
        var Chord = (function () {
            function Chord(arc) {
                var arcPoints = MakerJs.point.fromArc(arc);
                this.type = MakerJs.pathType.Line;
                this.origin = arcPoints[0];
                this.end = arcPoints[1];
            }
            return Chord;
        }());
        paths.Chord = Chord;
        /**
         * Class for a parallel line path.
         *
         * @param toLine A line to be parallel to.
         * @param distance Distance between parallel and original line.
         * @param nearPoint Any point to determine which side of the line to place the parallel.
         */
        var Parallel = (function () {
            function Parallel(toLine, distance, nearPoint) {
                this.type = MakerJs.pathType.Line;
                this.origin = MakerJs.point.clone(toLine.origin);
                this.end = MakerJs.point.clone(toLine.end);
                var angleOfLine = MakerJs.angle.ofLineInDegrees(this);
                function getNewOrigin(offsetAngle) {
                    var origin = MakerJs.point.add(toLine.origin, MakerJs.point.fromPolar(MakerJs.angle.toRadians(angleOfLine + offsetAngle), distance));
                    return {
                        origin: origin,
                        nearness: MakerJs.measure.pointDistance(origin, nearPoint)
                    };
                }
                var newOrigins = [getNewOrigin(-90), getNewOrigin(90)];
                var newOrigin = (newOrigins[0].nearness < newOrigins[1].nearness) ? newOrigins[0].origin : newOrigins[1].origin;
                MakerJs.path.move(this, newOrigin);
            }
            return Parallel;
        }());
        paths.Parallel = Parallel;
    })(paths = MakerJs.paths || (MakerJs.paths = {}));
})(MakerJs || (MakerJs = {}));
var MakerJs;
(function (MakerJs) {
    var model;
    (function (model) {
        /**
         * Add a path as a child. This is basically equivalent to:
         * ```
         * parentModel.paths[childPathId] = childPath;
         * ```
         * with additional checks to make it safe for cascading.
         *
         * @param modelContext The model to add to.
         * @param pathContext The path to add.
         * @param pathId The id of the path.
         * @param overWrite Optional flag to overwrite any path referenced by pathId. Default is false, which will create an id similar to pathId.
         * @returns The original model (for cascading).
         */
        function addPath(modelContext, pathContext, pathId, overWrite) {
            if (overWrite === void 0) { overWrite = false; }
            var id = overWrite ? pathId : getSimilarPathId(modelContext, pathId);
            modelContext.paths = modelContext.paths || {};
            modelContext.paths[id] = pathContext;
            return modelContext;
        }
        model.addPath = addPath;
        /**
         * Add a model as a child. This is basically equivalent to:
         * ```
         * parentModel.models[childModelId] = childModel;
         * ```
         * with additional checks to make it safe for cascading.
         *
         * @param parentModel The model to add to.
         * @param childModel The model to add.
         * @param childModelId The id of the child model.
         * @param overWrite Optional flag to overwrite any model referenced by childModelId. Default is false, which will create an id similar to childModelId.
         * @returns The original model (for cascading).
         */
        function addModel(parentModel, childModel, childModelId, overWrite) {
            if (overWrite === void 0) { overWrite = false; }
            var id = overWrite ? childModelId : getSimilarModelId(parentModel, childModelId);
            parentModel.models = parentModel.models || {};
            parentModel.models[id] = childModel;
            return parentModel;
        }
        model.addModel = addModel;
        /**
         * Add a model as a child of another model. This is basically equivalent to:
         * ```
         * parentModel.models[childModelId] = childModel;
         * ```
         * with additional checks to make it safe for cascading.
         *
         * @param childModel The model to add.
         * @param parentModel The model to add to.
         * @param childModelId The id of the child model.
         * @param overWrite Optional flag to overwrite any model referenced by childModelId. Default is false, which will create an id similar to childModelId.
         * @returns The original model (for cascading).
         */
        function addTo(childModel, parentModel, childModelId, overWrite) {
            if (overWrite === void 0) { overWrite = false; }
            addModel(parentModel, childModel, childModelId, overWrite);
            return childModel;
        }
        model.addTo = addTo;
        /**
         * Clone a model. Alias of makerjs.cloneObject(modelToClone)
         *
         * @param modelToClone The model to clone.
         * @returns A clone of the model you passed.
         */
        function clone(modelToClone) {
            return MakerJs.cloneObject(modelToClone);
        }
        model.clone = clone;
        /**
         * Count the number of child models within a given model.
         *
         * @param modelContext The model containing other models.
         * @returns Number of child models.
         */
        function countChildModels(modelContext) {
            var count = 0;
            if (modelContext.models) {
                for (var id in modelContext.models) {
                    count++;
                }
            }
            return count;
        }
        model.countChildModels = countChildModels;
        /**
         * @private
         */
        function getSimilarId(map, id) {
            if (!map)
                return id;
            var i = 0;
            var newId = id;
            while (newId in map) {
                i++;
                newId = [id, i].join('_');
            }
            return newId;
        }
        /**
         * Get an unused id in the models map with the same prefix.
         *
         * @param modelContext The model containing the models map.
         * @param modelId The id to use directly (if unused), or as a prefix.
         */
        function getSimilarModelId(modelContext, modelId) {
            return getSimilarId(modelContext.models, modelId);
        }
        model.getSimilarModelId = getSimilarModelId;
        /**
         * Get an unused id in the paths map with the same prefix.
         *
         * @param modelContext The model containing the paths map.
         * @param pathId The id to use directly (if unused), or as a prefix.
         */
        function getSimilarPathId(modelContext, pathId) {
            return getSimilarId(modelContext.paths, pathId);
        }
        model.getSimilarPathId = getSimilarPathId;
        /**
         * Set the layer of a model. This is equivalent to:
         * ```
         * modelContext.layer = layer;
         * ```
         *
         * @param modelContext The model to set the layer.
         * @param layer The layer name.
         * @returns The original model (for cascading).
         */
        function layer(modelContext, layer) {
            modelContext.layer = layer;
            return modelContext;
        }
        model.layer = layer;
        /**
         * Moves all of a model's children (models and paths, recursively) in reference to a single common origin. Useful when points between children need to connect to each other.
         *
         * @param modelToOriginate The model to originate.
         * @param origin Optional offset reference point.
         * @returns The original model (for cascading).
         */
        function originate(modelToOriginate, origin) {
            function innerOriginate(m, o) {
                if (!m)
                    return;
                var newOrigin = MakerJs.point.add(m.origin, o);
                if (m.type === MakerJs.models.BezierCurve.typeName) {
                    MakerJs.path.moveRelative(m.seed, newOrigin);
                }
                if (m.paths) {
                    for (var id in m.paths) {
                        MakerJs.path.moveRelative(m.paths[id], newOrigin);
                    }
                }
                if (m.models) {
                    for (var id in m.models) {
                        innerOriginate(m.models[id], newOrigin);
                    }
                }
                m.origin = MakerJs.point.zero();
            }
            innerOriginate(modelToOriginate, origin ? MakerJs.point.subtract([0, 0], origin) : [0, 0]);
            if (origin) {
                modelToOriginate.origin = origin;
            }
            return modelToOriginate;
        }
        model.originate = originate;
        /**
         * Center a model at [0, 0].
         *
         * @param modelToCenter The model to center.
         * @param centerX Boolean to center on the x axis. Default is true.
         * @param centerY Boolean to center on the y axis. Default is true.
         * @returns The original model (for cascading).
         */
        function center(modelToCenter, centerX, centerY) {
            if (centerX === void 0) { centerX = true; }
            if (centerY === void 0) { centerY = true; }
            var m = MakerJs.measure.modelExtents(modelToCenter);
            var o = modelToCenter.origin || [0, 0];
            if (centerX)
                o[0] -= m.center[0];
            if (centerY)
                o[1] -= m.center[1];
            modelToCenter.origin = o;
            return modelToCenter;
        }
        model.center = center;
        /**
         * Create a clone of a model, mirrored on either or both x and y axes.
         *
         * @param modelToMirror The model to mirror.
         * @param mirrorX Boolean to mirror on the x axis.
         * @param mirrorY Boolean to mirror on the y axis.
         * @returns Mirrored model.
         */
        function mirror(modelToMirror, mirrorX, mirrorY) {
            var newModel = {};
            if (!modelToMirror)
                return null;
            if (modelToMirror.origin) {
                newModel.origin = MakerJs.point.mirror(modelToMirror.origin, mirrorX, mirrorY);
            }
            if (modelToMirror.type) {
                newModel.type = modelToMirror.type;
            }
            if (modelToMirror.units) {
                newModel.units = modelToMirror.units;
            }
            if (modelToMirror.type === MakerJs.models.BezierCurve.typeName) {
                newModel.type = MakerJs.models.BezierCurve.typeName;
                newModel.seed = MakerJs.path.mirror(modelToMirror.seed, mirrorX, mirrorY);
            }
            if (modelToMirror.paths) {
                newModel.paths = {};
                for (var id in modelToMirror.paths) {
                    var pathToMirror = modelToMirror.paths[id];
                    if (!pathToMirror)
                        continue;
                    var pathMirrored = MakerJs.path.mirror(pathToMirror, mirrorX, mirrorY);
                    if (!pathMirrored)
                        continue;
                    newModel.paths[id] = pathMirrored;
                }
            }
            if (modelToMirror.models) {
                newModel.models = {};
                for (var id in modelToMirror.models) {
                    var childModelToMirror = modelToMirror.models[id];
                    if (!childModelToMirror)
                        continue;
                    var childModelMirrored = mirror(childModelToMirror, mirrorX, mirrorY);
                    if (!childModelMirrored)
                        continue;
                    newModel.models[id] = childModelMirrored;
                }
            }
            return newModel;
        }
        model.mirror = mirror;
        /**
         * Move a model to an absolute point. Note that this is also accomplished by directly setting the origin property. This function exists for cascading.
         *
         * @param modelToMove The model to move.
         * @param origin The new position of the model.
         * @returns The original model (for cascading).
         */
        function move(modelToMove, origin) {
            modelToMove.origin = MakerJs.point.clone(origin);
            return modelToMove;
        }
        model.move = move;
        /**
         * Move a model's origin by a relative amount.
         *
         * @param modelToMove The model to move.
         * @param delta The x & y adjustments as a point object.
         * @returns The original model (for cascading).
         */
        function moveRelative(modelToMove, delta) {
            if (modelToMove) {
                modelToMove.origin = MakerJs.point.add(modelToMove.origin || MakerJs.point.zero(), delta);
            }
            return modelToMove;
        }
        model.moveRelative = moveRelative;
        /**
         * Prefix the ids of paths in a model.
         *
         * @param modelToPrefix The model to prefix.
         * @param prefix The prefix to prepend on paths ids.
         * @returns The original model (for cascading).
         */
        function prefixPathIds(modelToPrefix, prefix) {
            var walkedPaths = [];
            //first collect the paths because we don't want to modify keys during an iteration on keys
            walk(modelToPrefix, {
                onPath: function (walkedPath) {
                    walkedPaths.push(walkedPath);
                }
            });
            //now modify the ids in our own iteration
            for (var i = 0; i < walkedPaths.length; i++) {
                var walkedPath = walkedPaths[i];
                delete walkedPath.modelContext.paths[walkedPath.pathId];
                walkedPath.modelContext.paths[prefix + walkedPath.pathId] = walkedPath.pathContext;
            }
            return modelToPrefix;
        }
        model.prefixPathIds = prefixPathIds;
        /**
         * Rotate a model.
         *
         * @param modelToRotate The model to rotate.
         * @param angleInDegrees The amount of rotation, in degrees.
         * @param rotationOrigin The center point of rotation.
         * @returns The original model (for cascading).
         */
        function rotate(modelToRotate, angleInDegrees, rotationOrigin) {
            if (rotationOrigin === void 0) { rotationOrigin = [0, 0]; }
            if (!modelToRotate || !angleInDegrees)
                return modelToRotate;
            var offsetOrigin = MakerJs.point.subtract(rotationOrigin, modelToRotate.origin);
            if (modelToRotate.type === MakerJs.models.BezierCurve.typeName) {
                MakerJs.path.rotate(modelToRotate.seed, angleInDegrees, offsetOrigin);
            }
            if (modelToRotate.paths) {
                for (var id in modelToRotate.paths) {
                    MakerJs.path.rotate(modelToRotate.paths[id], angleInDegrees, offsetOrigin);
                }
            }
            if (modelToRotate.models) {
                for (var id in modelToRotate.models) {
                    rotate(modelToRotate.models[id], angleInDegrees, offsetOrigin);
                }
            }
            return modelToRotate;
        }
        model.rotate = rotate;
        /**
         * Scale a model.
         *
         * @param modelToScale The model to scale.
         * @param scaleValue The amount of scaling.
         * @param scaleOrigin Optional boolean to scale the origin point. Typically false for the root model.
         * @returns The original model (for cascading).
         */
        function scale(modelToScale, scaleValue, scaleOrigin) {
            if (scaleOrigin === void 0) { scaleOrigin = false; }
            if (scaleOrigin && modelToScale.origin) {
                modelToScale.origin = MakerJs.point.scale(modelToScale.origin, scaleValue);
            }
            if (modelToScale.type === MakerJs.models.BezierCurve.typeName) {
                MakerJs.path.scale(modelToScale.seed, scaleValue);
            }
            if (modelToScale.paths) {
                for (var id in modelToScale.paths) {
                    MakerJs.path.scale(modelToScale.paths[id], scaleValue);
                }
            }
            if (modelToScale.models) {
                for (var id in modelToScale.models) {
                    scale(modelToScale.models[id], scaleValue, true);
                }
            }
            return modelToScale;
        }
        model.scale = scale;
        /**
         * Convert a model to match a different unit system.
         *
         * @param modeltoConvert The model to convert.
         * @param destUnitType The unit system.
         * @returns The scaled model (for cascading).
         */
        function convertUnits(modeltoConvert, destUnitType) {
            var validUnitType = false;
            for (var id in MakerJs.unitType) {
                if (MakerJs.unitType[id] == destUnitType) {
                    validUnitType = true;
                    break;
                }
            }
            if (modeltoConvert.units && validUnitType) {
                var ratio = MakerJs.units.conversionScale(modeltoConvert.units, destUnitType);
                if (ratio != 1) {
                    scale(modeltoConvert, ratio);
                    //update the model with its new unit type
                    modeltoConvert.units = destUnitType;
                }
            }
            return modeltoConvert;
        }
        model.convertUnits = convertUnits;
        /**
         * DEPRECATED - use model.walk instead.
         * Recursively walk through all paths for a given model.
         *
         * @param modelContext The model to walk.
         * @param callback Callback for each path.
         */
        function walkPaths(modelContext, callback) {
            if (modelContext.paths) {
                for (var pathId in modelContext.paths) {
                    if (!modelContext.paths[pathId])
                        continue;
                    callback(modelContext, pathId, modelContext.paths[pathId]);
                }
            }
            if (modelContext.models) {
                for (var id in modelContext.models) {
                    if (!modelContext.models[id])
                        continue;
                    walkPaths(modelContext.models[id], callback);
                }
            }
        }
        model.walkPaths = walkPaths;
        /**
         * Recursively walk through all child models and paths for a given model.
         *
         * @param modelContext The model to walk.
         * @param options Object containing callbacks.
         * @returns The original model (for cascading).
         */
        function walk(modelContext, options) {
            if (!modelContext)
                return;
            function walkRecursive(modelContext, layer, offset, route, routeKey) {
                var newOffset = MakerJs.point.add(modelContext.origin, offset);
                layer = (layer != undefined) ? layer : '';
                if (modelContext.paths) {
                    for (var pathId in modelContext.paths) {
                        var pathContext = modelContext.paths[pathId];
                        if (!pathContext)
                            continue;
                        var walkedPath = {
                            modelContext: modelContext,
                            layer: (pathContext.layer != undefined) ? pathContext.layer : layer,
                            offset: newOffset,
                            pathContext: pathContext,
                            pathId: pathId,
                            route: route.concat(['paths', pathId]),
                            routeKey: routeKey + (routeKey ? '.' : '') + 'paths' + JSON.stringify([pathId])
                        };
                        if (options.onPath)
                            options.onPath(walkedPath);
                    }
                }
                if (modelContext.models) {
                    for (var modelId in modelContext.models) {
                        var childModel = modelContext.models[modelId];
                        if (!childModel)
                            continue;
                        var walkedModel = {
                            parentModel: modelContext,
                            layer: (childModel.layer != undefined) ? childModel.layer : layer,
                            offset: newOffset,
                            route: route.concat(['models', modelId]),
                            routeKey: routeKey + (routeKey ? '.' : '') + 'models' + JSON.stringify([modelId]),
                            childId: modelId,
                            childModel: childModel
                        };
                        if (options.beforeChildWalk) {
                            if (!options.beforeChildWalk(walkedModel))
                                continue;
                        }
                        walkRecursive(walkedModel.childModel, walkedModel.layer, newOffset, walkedModel.route, walkedModel.routeKey);
                        if (options.afterChildWalk) {
                            options.afterChildWalk(walkedModel);
                        }
                    }
                }
            }
            walkRecursive(modelContext, modelContext.layer, [0, 0], [], '');
            return modelContext;
        }
        model.walk = walk;
        /**
         * Move a model so its bounding box begins at [0, 0].
         *
         * @param modelToZero The model to zero.
         * @param zeroX Boolean to zero on the x axis. Default is true.
         * @param zeroY Boolean to zero on the y axis. Default is true.
         * @returns The original model (for cascading).
         */
        function zero(modelToZero, zeroX, zeroY) {
            if (zeroX === void 0) { zeroX = true; }
            if (zeroY === void 0) { zeroY = true; }
            var m = MakerJs.measure.modelExtents(modelToZero);
            var z = modelToZero.origin || [0, 0];
            if (zeroX)
                z[0] -= m.low[0];
            if (zeroY)
                z[1] -= m.low[1];
            modelToZero.origin = z;
            return modelToZero;
        }
        model.zero = zero;
    })(model = MakerJs.model || (MakerJs.model = {}));
})(MakerJs || (MakerJs = {}));
var MakerJs;
(function (MakerJs) {
    var model;
    (function (model) {
        /**
         * @private
         */
        function getNonZeroSegments(pathToSegment, breakPoint) {
            var segment1 = MakerJs.cloneObject(pathToSegment);
            if (!segment1)
                return null;
            var segment2 = MakerJs.path.breakAtPoint(segment1, breakPoint);
            if (segment2) {
                var segments = [segment1, segment2];
                for (var i = 2; i--;) {
                    if (MakerJs.round(MakerJs.measure.pathLength(segments[i]), .0001) == 0) {
                        return null;
                    }
                }
                return segments;
            }
            else if (pathToSegment.type == MakerJs.pathType.Circle) {
                return [segment1];
            }
            return null;
        }
        /**
         * @private
         */
        function breakAlongForeignPath(crossedPath, overlappedSegments, foreignWalkedPath) {
            var foreignPath = foreignWalkedPath.pathContext;
            var segments = crossedPath.segments;
            if (MakerJs.measure.isPathEqual(segments[0].path, foreignPath, .0001, crossedPath.offset, foreignWalkedPath.offset)) {
                segments[0].overlapped = true;
                segments[0].duplicate = true;
                overlappedSegments.push(segments[0]);
                return;
            }
            var foreignPathEndPoints;
            for (var i = 0; i < segments.length; i++) {
                var pointsToCheck;
                var options = { path1Offset: crossedPath.offset, path2Offset: foreignWalkedPath.offset };
                var foreignIntersection = MakerJs.path.intersection(segments[i].path, foreignPath, options);
                if (foreignIntersection) {
                    pointsToCheck = foreignIntersection.intersectionPoints;
                }
                else if (options.out_AreOverlapped) {
                    segments[i].overlapped = true;
                    overlappedSegments.push(segments[i]);
                    if (!foreignPathEndPoints) {
                        //make sure endpoints are in absolute coords
                        foreignPathEndPoints = MakerJs.point.fromPathEnds(foreignPath, foreignWalkedPath.offset);
                    }
                    pointsToCheck = foreignPathEndPoints;
                }
                if (pointsToCheck) {
                    //break the path which intersected, and add the shard to the end of the array so it can also be checked in this loop for further sharding.
                    var subSegments = null;
                    var p = 0;
                    while (!subSegments && p < pointsToCheck.length) {
                        //cast absolute points to path relative space
                        subSegments = getNonZeroSegments(segments[i].path, MakerJs.point.subtract(pointsToCheck[p], crossedPath.offset));
                        p++;
                    }
                    if (subSegments) {
                        crossedPath.broken = true;
                        segments[i].path = subSegments[0];
                        if (subSegments[1]) {
                            var newSegment = {
                                path: subSegments[1],
                                pathId: segments[0].pathId,
                                overlapped: segments[i].overlapped,
                                uniqueForeignIntersectionPoints: [],
                                offset: crossedPath.offset
                            };
                            if (segments[i].overlapped) {
                                overlappedSegments.push(newSegment);
                            }
                            segments.push(newSegment);
                        }
                        //re-check this segment for another deep intersection
                        i--;
                    }
                }
            }
        }
        /**
         * DEPRECATED - use measure.isPointInsideModel instead.
         * Check to see if a path is inside of a model.
         *
         * @param pathContext The path to check.
         * @param modelContext The model to check against.
         * @param farPoint Optional point of reference which is outside the bounds of the modelContext.
         * @returns Boolean true if the path is inside of the modelContext.
         */
        function isPathInsideModel(pathContext, modelContext, pathOffset, farPoint, measureAtlas) {
            var options = {
                farPoint: farPoint,
                measureAtlas: measureAtlas
            };
            var p = MakerJs.point.add(MakerJs.point.middle(pathContext), pathOffset);
            return MakerJs.measure.isPointInsideModel(p, modelContext, options);
        }
        model.isPathInsideModel = isPathInsideModel;
        /**
         * DEPRECATED
         * Break a model's paths everywhere they intersect with another path.
         *
         * @param modelToBreak The model containing paths to be broken.
         * @param modelToIntersect Optional model containing paths to look for intersection, or else the modelToBreak will be used.
         * @returns The original model (for cascading).
         */
        function breakPathsAtIntersections(modelToBreak, modelToIntersect) {
            var modelToBreakAtlas = new MakerJs.measure.Atlas(modelToBreak);
            modelToBreakAtlas.measureModels();
            var modelToIntersectAtlas;
            if (!modelToIntersect) {
                modelToIntersect = modelToBreak;
                modelToIntersectAtlas = modelToBreakAtlas;
            }
            else {
                modelToIntersectAtlas = new MakerJs.measure.Atlas(modelToIntersect);
                modelToIntersectAtlas.measureModels();
            }
            ;
            breakAllPathsAtIntersections(modelToBreak, modelToIntersect || modelToBreak, false, modelToBreakAtlas, modelToIntersectAtlas);
            return modelToBreak;
        }
        model.breakPathsAtIntersections = breakPathsAtIntersections;
        /**
         * @private
         */
        function breakAllPathsAtIntersections(modelToBreak, modelToIntersect, checkIsInside, modelToBreakAtlas, modelToIntersectAtlas, farPoint) {
            var crossedPaths = [];
            var overlappedSegments = [];
            var walkModelToBreakOptions = {
                onPath: function (outerWalkedPath) {
                    //clone this path and make it the first segment
                    var segment = {
                        path: MakerJs.cloneObject(outerWalkedPath.pathContext),
                        pathId: outerWalkedPath.pathId,
                        overlapped: false,
                        uniqueForeignIntersectionPoints: [],
                        offset: outerWalkedPath.offset
                    };
                    var thisPath = outerWalkedPath;
                    thisPath.broken = false;
                    thisPath.segments = [segment];
                    var walkModelToIntersectOptions = {
                        onPath: function (innerWalkedPath) {
                            if (outerWalkedPath.pathContext !== innerWalkedPath.pathContext && MakerJs.measure.isMeasurementOverlapping(modelToBreakAtlas.pathMap[outerWalkedPath.routeKey], modelToIntersectAtlas.pathMap[innerWalkedPath.routeKey])) {
                                breakAlongForeignPath(thisPath, overlappedSegments, innerWalkedPath);
                            }
                        },
                        beforeChildWalk: function (innerWalkedModel) {
                            //see if there is a model measurement. if not, it is because the model does not contain paths.
                            var innerModelMeasurement = modelToIntersectAtlas.modelMap[innerWalkedModel.routeKey];
                            return innerModelMeasurement && MakerJs.measure.isMeasurementOverlapping(modelToBreakAtlas.pathMap[outerWalkedPath.routeKey], innerModelMeasurement);
                        }
                    };
                    //keep breaking the segments anywhere they intersect with paths of the other model
                    model.walk(modelToIntersect, walkModelToIntersectOptions);
                    if (checkIsInside) {
                        //check each segment whether it is inside or outside
                        for (var i = 0; i < thisPath.segments.length; i++) {
                            var p = MakerJs.point.add(MakerJs.point.middle(thisPath.segments[i].path), thisPath.offset);
                            var pointInsideOptions = { measureAtlas: modelToIntersectAtlas, farPoint: farPoint };
                            thisPath.segments[i].isInside = MakerJs.measure.isPointInsideModel(p, modelToIntersect, pointInsideOptions);
                            thisPath.segments[i].uniqueForeignIntersectionPoints = pointInsideOptions.out_intersectionPoints;
                        }
                    }
                    crossedPaths.push(thisPath);
                }
            };
            model.walk(modelToBreak, walkModelToBreakOptions);
            return { crossedPaths: crossedPaths, overlappedSegments: overlappedSegments };
        }
        /**
         * @private
         */
        function checkForEqualOverlaps(crossedPathsA, crossedPathsB, pointMatchingDistance) {
            function compareSegments(segment1, segment2) {
                if (MakerJs.measure.isPathEqual(segment1.path, segment2.path, pointMatchingDistance, segment1.offset, segment2.offset)) {
                    segment1.duplicate = segment2.duplicate = true;
                }
            }
            function compareAll(segment) {
                for (var i = 0; i < crossedPathsB.length; i++) {
                    compareSegments(crossedPathsB[i], segment);
                }
            }
            for (var i = 0; i < crossedPathsA.length; i++) {
                compareAll(crossedPathsA[i]);
            }
        }
        /**
         * @private
         */
        function addOrDeleteSegments(crossedPath, includeInside, includeOutside, keepDuplicates, atlas, trackDeleted) {
            function addSegment(modelContext, pathIdBase, segment) {
                var id = model.getSimilarPathId(modelContext, pathIdBase);
                var newRouteKey = (id == pathIdBase) ? crossedPath.routeKey : MakerJs.createRouteKey(crossedPath.route.slice(0, -1).concat([id]));
                modelContext.paths[id] = segment.path;
                if (crossedPath.broken) {
                    //save the new segment's measurement
                    var measurement = MakerJs.measure.pathExtents(segment.path, crossedPath.offset);
                    atlas.pathMap[newRouteKey] = measurement;
                    atlas.modelsMeasured = false;
                }
                else {
                    //keep the original measurement
                    atlas.pathMap[newRouteKey] = savedMeasurement;
                }
            }
            function checkAddSegment(modelContext, pathIdBase, segment) {
                if (segment.isInside && includeInside || !segment.isInside && includeOutside) {
                    addSegment(modelContext, pathIdBase, segment);
                }
                else {
                    atlas.modelsMeasured = false;
                    trackDeleted(segment.path, crossedPath.routeKey, segment.offset, 'segment is ' + (segment.isInside ? 'inside' : 'outside') + ' intersectionPoints=' + JSON.stringify(segment.uniqueForeignIntersectionPoints));
                }
            }
            //save the original measurement
            var savedMeasurement = atlas.pathMap[crossedPath.routeKey];
            //delete the original, its segments will be added
            delete crossedPath.modelContext.paths[crossedPath.pathId];
            delete atlas.pathMap[crossedPath.routeKey];
            for (var i = 0; i < crossedPath.segments.length; i++) {
                if (crossedPath.segments[i].duplicate) {
                    if (keepDuplicates) {
                        addSegment(crossedPath.modelContext, crossedPath.pathId, crossedPath.segments[i]);
                    }
                    else {
                        trackDeleted(crossedPath.segments[i].path, crossedPath.routeKey, crossedPath.offset, 'segment is duplicate');
                    }
                }
                else {
                    checkAddSegment(crossedPath.modelContext, crossedPath.pathId, crossedPath.segments[i]);
                }
            }
        }
        /**
         * Combine 2 models. Each model will be modified accordingly.
         *
         * @param modelA First model to combine.
         * @param modelB Second model to combine.
         * @param includeAInsideB Flag to include paths from modelA which are inside of modelB.
         * @param includeAOutsideB Flag to include paths from modelA which are outside of modelB.
         * @param includeBInsideA Flag to include paths from modelB which are inside of modelA.
         * @param includeBOutsideA Flag to include paths from modelB which are outside of modelA.
         * @param options Optional ICombineOptions object.
         * @returns A new model containing both of the input models as "a" and "b".
         */
        function combine(modelA, modelB, includeAInsideB, includeAOutsideB, includeBInsideA, includeBOutsideA, options) {
            if (includeAInsideB === void 0) { includeAInsideB = false; }
            if (includeAOutsideB === void 0) { includeAOutsideB = true; }
            if (includeBInsideA === void 0) { includeBInsideA = false; }
            if (includeBOutsideA === void 0) { includeBOutsideA = true; }
            var opts = {
                trimDeadEnds: true,
                pointMatchingDistance: .005,
                out_deleted: [{ paths: {} }, { paths: {} }]
            };
            MakerJs.extendObject(opts, options);
            opts.measureA = opts.measureA || new MakerJs.measure.Atlas(modelA);
            opts.measureB = opts.measureB || new MakerJs.measure.Atlas(modelB);
            //make sure model measurements capture all paths
            opts.measureA.measureModels();
            opts.measureB.measureModels();
            if (!opts.farPoint) {
                var measureBoth = MakerJs.measure.increase(MakerJs.measure.increase({ high: [null, null], low: [null, null] }, opts.measureA.modelMap['']), opts.measureB.modelMap['']);
                opts.farPoint = MakerJs.point.add(measureBoth.high, [1, 1]);
            }
            var pathsA = breakAllPathsAtIntersections(modelA, modelB, true, opts.measureA, opts.measureB, opts.farPoint);
            var pathsB = breakAllPathsAtIntersections(modelB, modelA, true, opts.measureB, opts.measureA, opts.farPoint);
            checkForEqualOverlaps(pathsA.overlappedSegments, pathsB.overlappedSegments, opts.pointMatchingDistance);
            function trackDeleted(which, deletedPath, routeKey, offset, reason) {
                model.addPath(opts.out_deleted[which], deletedPath, 'deleted');
                MakerJs.path.moveRelative(deletedPath, offset);
                var p = deletedPath;
                p.reason = reason;
                p.routeKey = routeKey;
            }
            for (var i = 0; i < pathsA.crossedPaths.length; i++) {
                addOrDeleteSegments(pathsA.crossedPaths[i], includeAInsideB, includeAOutsideB, true, opts.measureA, function (p, id, o, reason) { return trackDeleted(0, p, id, o, reason); });
            }
            for (var i = 0; i < pathsB.crossedPaths.length; i++) {
                addOrDeleteSegments(pathsB.crossedPaths[i], includeBInsideA, includeBOutsideA, false, opts.measureB, function (p, id, o, reason) { return trackDeleted(1, p, id, o, reason); });
            }
            var result = { models: { a: modelA, b: modelB } };
            if (opts.trimDeadEnds) {
                var shouldKeep;
                //union
                if (!includeAInsideB && !includeBInsideA) {
                    shouldKeep = function (walkedPath) {
                        //When A and B share an outer contour, the segments marked as duplicate will not pass the "inside" test on either A or B.
                        //Duplicates were discarded from B but kept in A
                        for (var i = 0; i < pathsA.overlappedSegments.length; i++) {
                            if (pathsA.overlappedSegments[i].duplicate && walkedPath.pathContext === pathsA.overlappedSegments[i].path) {
                                return false;
                            }
                        }
                        //default - keep the path
                        return true;
                    };
                }
                model.removeDeadEnds(result, null, shouldKeep, function (wp, reason) {
                    var which = wp.route[1] === 'a' ? 0 : 1;
                    trackDeleted(which, wp.pathContext, wp.routeKey, wp.offset, reason);
                });
            }
            //pass options back to caller
            MakerJs.extendObject(options, opts);
            return result;
        }
        model.combine = combine;
        /**
         * Combine 2 models, resulting in a intersection. Each model will be modified accordingly.
         *
         * @param modelA First model to combine.
         * @param modelB Second model to combine.
         * @returns A new model containing both of the input models as "a" and "b".
         */
        function combineIntersection(modelA, modelB) {
            return combine(modelA, modelB, true, false, true, false);
        }
        model.combineIntersection = combineIntersection;
        /**
         * Combine 2 models, resulting in a subtraction of B from A. Each model will be modified accordingly.
         *
         * @param modelA First model to combine.
         * @param modelB Second model to combine.
         * @returns A new model containing both of the input models as "a" and "b".
         */
        function combineSubtraction(modelA, modelB) {
            return combine(modelA, modelB, false, true, true, false);
        }
        model.combineSubtraction = combineSubtraction;
        /**
         * Combine 2 models, resulting in a union. Each model will be modified accordingly.
         *
         * @param modelA First model to combine.
         * @param modelB Second model to combine.
         * @returns A new model containing both of the input models as "a" and "b".
         */
        function combineUnion(modelA, modelB) {
            return combine(modelA, modelB, false, true, false, true);
        }
        model.combineUnion = combineUnion;
    })(model = MakerJs.model || (MakerJs.model = {}));
})(MakerJs || (MakerJs = {}));
var MakerJs;
(function (MakerJs) {
    /**
     * Collects items that share a common key.
     */
    var Collector = (function () {
        function Collector(comparer) {
            this.comparer = comparer;
            this.collections = [];
        }
        Collector.prototype.addItemToCollection = function (key, item) {
            var found = this.findCollection(key);
            if (found) {
                found.push(item);
            }
            else {
                var collection = { key: key, items: [item] };
                this.collections.push(collection);
            }
        };
        Collector.prototype.findCollection = function (key, action) {
            for (var i = 0; i < this.collections.length; i++) {
                var collection = this.collections[i];
                if (this.comparer(key, collection.key)) {
                    if (action) {
                        action(i);
                    }
                    return collection.items;
                }
            }
            return null;
        };
        Collector.prototype.removeCollection = function (key) {
            var _this = this;
            if (this.findCollection(key, function (index) { _this.collections.splice(index, 1); })) {
                return true;
            }
            return false;
        };
        Collector.prototype.removeItemFromCollection = function (key, item) {
            var collection = this.findCollection(key);
            if (!collection)
                return;
            for (var i = 0; i < collection.length; i++) {
                if (collection[i] === item) {
                    collection.splice(i, 1);
                    return true;
                }
            }
            return false;
        };
        Collector.prototype.getCollectionsOfMultiple = function (cb) {
            for (var i = 0; i < this.collections.length; i++) {
                var collection = this.collections[i];
                if (collection.items.length > 1) {
                    cb(collection.key, collection.items);
                }
            }
        };
        return Collector;
    }());
    MakerJs.Collector = Collector;
})(MakerJs || (MakerJs = {}));
var MakerJs;
(function (MakerJs) {
    var model;
    (function (model) {
        /**
         * @private
         */
        function checkForOverlaps(refPaths, isOverlapping, overlapUnion) {
            var currIndex = 0;
            do {
                var root = refPaths[currIndex];
                do {
                    var overlaps = false;
                    for (var i = currIndex + 1; i < refPaths.length; i++) {
                        var arcRef = refPaths[i];
                        overlaps = isOverlapping(root.pathContext, arcRef.pathContext, false);
                        if (overlaps) {
                            overlapUnion(root.pathContext, arcRef.pathContext);
                            delete arcRef.modelContext.paths[arcRef.pathId];
                            refPaths.splice(i, 1);
                            break;
                        }
                    }
                } while (overlaps);
                currIndex++;
            } while (currIndex < refPaths.length);
        }
        /**
         * Simplify a model's paths by reducing redundancy: combine multiple overlapping paths into a single path. The model must be originated.
         *
         * @param modelContext The originated model to search for similar paths.
         * @param options Optional options object.
         * @returns The simplified model (for cascading).
         */
        function simplify(modelToSimplify, options) {
            function compareCircles(circleA, circleB) {
                if (Math.abs(circleA.radius - circleB.radius) <= opts.scalarMatchingDistance) {
                    var distance = MakerJs.measure.pointDistance(circleA.origin, circleB.origin);
                    return distance <= opts.pointMatchingDistance;
                }
                return false;
            }
            var similarArcs = new MakerJs.Collector(compareCircles);
            var similarCircles = new MakerJs.Collector(compareCircles);
            var similarLines = new MakerJs.Collector(MakerJs.measure.isSlopeEqual);
            var map = {};
            map[MakerJs.pathType.Arc] = function (arcRef) {
                similarArcs.addItemToCollection(arcRef.pathContext, arcRef);
            };
            map[MakerJs.pathType.Circle] = function (circleRef) {
                similarCircles.addItemToCollection(circleRef.pathContext, circleRef);
            };
            map[MakerJs.pathType.Line] = function (lineRef) {
                var slope = MakerJs.measure.lineSlope(lineRef.pathContext);
                similarLines.addItemToCollection(slope, lineRef);
            };
            var opts = {
                scalarMatchingDistance: .001,
                pointMatchingDistance: .005
            };
            MakerJs.extendObject(opts, options);
            //walk the model and collect: arcs on same center / radius, circles on same center / radius, lines on same y-intercept / slope.
            var walkOptions = {
                onPath: function (walkedPath) {
                    var fn = map[walkedPath.pathContext.type];
                    if (fn) {
                        fn(walkedPath);
                    }
                }
            };
            model.walk(modelToSimplify, walkOptions);
            //for all arcs that are similar, see if they overlap.
            //combine overlapping arcs into the first one and delete the second.
            similarArcs.getCollectionsOfMultiple(function (key, arcRefs) {
                checkForOverlaps(arcRefs, MakerJs.measure.isArcOverlapping, function (arcA, arcB) {
                    //find ends within the other
                    var aEndsInB = MakerJs.measure.isBetweenArcAngles(arcA.endAngle, arcB, false);
                    var bEndsInA = MakerJs.measure.isBetweenArcAngles(arcB.endAngle, arcA, false);
                    //check for complete circle
                    if (aEndsInB && bEndsInA) {
                        arcA.endAngle = arcA.startAngle + 360;
                        return;
                    }
                    //find the leader, in polar terms
                    var ordered = aEndsInB ? [arcA, arcB] : [arcB, arcA];
                    //save in arcA
                    arcA.startAngle = MakerJs.angle.noRevolutions(ordered[0].startAngle);
                    arcA.endAngle = ordered[1].endAngle;
                });
            });
            //for all circles that are similar, delete all but the first.
            similarCircles.getCollectionsOfMultiple(function (key, circleRefs) {
                for (var i = 1; i < circleRefs.length; i++) {
                    var circleRef = circleRefs[i];
                    delete circleRef.modelContext.paths[circleRef.pathId];
                }
            });
            //for all lines that are similar, see if they overlap.
            //combine overlapping lines into the first one and delete the second.
            similarLines.getCollectionsOfMultiple(function (slope, arcRefs) {
                checkForOverlaps(arcRefs, MakerJs.measure.isLineOverlapping, function (lineA, lineB) {
                    var box = { paths: { lineA: lineA, lineB: lineB } };
                    var m = MakerJs.measure.modelExtents(box);
                    if (!slope.hasSlope) {
                        //vertical
                        lineA.origin[1] = m.low[1];
                        lineA.end[1] = m.high[1];
                    }
                    else {
                        //non-vertical
                        if (slope.slope < 0) {
                            //downward
                            lineA.origin = [m.low[0], m.high[1]];
                            lineA.end = [m.high[0], m.low[1]];
                        }
                        else if (slope.slope > 0) {
                            //upward
                            lineA.origin = m.low;
                            lineA.end = m.high;
                        }
                        else {
                            //horizontal
                            lineA.origin[0] = m.low[0];
                            lineA.end[0] = m.high[0];
                        }
                    }
                });
            });
            return modelToSimplify;
        }
        model.simplify = simplify;
    })(model = MakerJs.model || (MakerJs.model = {}));
})(MakerJs || (MakerJs = {}));
var MakerJs;
(function (MakerJs) {
    var path;
    (function (path) {
        /**
         * @private
         */
        var map = {};
        map[MakerJs.pathType.Arc] = function (arc, expansion, isolateCaps) {
            return new MakerJs.models.OvalArc(arc.startAngle, arc.endAngle, arc.radius, expansion, false, isolateCaps);
        };
        map[MakerJs.pathType.Circle] = function (circle, expansion, isolateCaps) {
            return new MakerJs.models.Ring(circle.radius + expansion, circle.radius - expansion);
        };
        map[MakerJs.pathType.Line] = function (line, expansion, isolateCaps) {
            return new MakerJs.models.Slot(line.origin, line.end, expansion, isolateCaps);
        };
        /**
         * Expand path by creating a model which surrounds it.
         *
         * @param pathToExpand Path to expand.
         * @param expansion Distance to expand.
         * @param isolateCaps Optional flag to put the end caps into a separate model named "caps".
         * @returns Model which surrounds the path.
         */
        function expand(pathToExpand, expansion, isolateCaps) {
            if (!pathToExpand)
                return null;
            var result = null;
            var fn = map[pathToExpand.type];
            if (fn) {
                result = fn(pathToExpand, expansion, isolateCaps);
                result.origin = pathToExpand.origin;
            }
            return result;
        }
        path.expand = expand;
        /**
         * Represent an arc using straight lines.
         *
         * @param arc Arc to straighten.
         * @param bevel Optional flag to bevel the angle to prevent it from being too sharp.
         * @param prefix Optional string prefix to apply to path ids.
         * @param close Optional flag to make a closed geometry by connecting the endpoints.
         * @returns Model of straight lines with same endpoints as the arc.
         */
        function straighten(arc, bevel, prefix, close) {
            var arcSpan = MakerJs.angle.ofArcSpan(arc);
            var joints = 1;
            if (arcSpan >= 270) {
                joints = 4;
            }
            else if (arcSpan > 180) {
                joints = 3;
            }
            else if (arcSpan > 150 || bevel) {
                joints = 2;
            }
            var jointAngleInRadians = MakerJs.angle.toRadians(arcSpan / joints);
            var circumscribedRadius = MakerJs.models.Polygon.circumscribedRadius(arc.radius, jointAngleInRadians);
            var ends = MakerJs.point.fromArc(arc);
            var points = [MakerJs.point.subtract(ends[0], arc.origin)];
            var a = MakerJs.angle.toRadians(arc.startAngle) + jointAngleInRadians / 2;
            for (var i = 0; i < joints; i++) {
                points.push(MakerJs.point.fromPolar(a, circumscribedRadius));
                a += jointAngleInRadians;
            }
            points.push(MakerJs.point.subtract(ends[1], arc.origin));
            var result = new MakerJs.models.ConnectTheDots(close, points);
            result.origin = arc.origin;
            if (typeof prefix === 'string' && prefix.length) {
                MakerJs.model.prefixPathIds(result, prefix);
            }
            return result;
        }
        path.straighten = straighten;
    })(path = MakerJs.path || (MakerJs.path = {}));
})(MakerJs || (MakerJs = {}));
(function (MakerJs) {
    var model;
    (function (model) {
        /**
         * Expand all paths in a model, then combine the resulting expansions.
         *
         * @param modelToExpand Model to expand.
         * @param distance Distance to expand.
         * @param joints Number of points at a joint between paths. Use 0 for round joints, 1 for pointed joints, 2 for beveled joints.
         * @param combineOptions Optional object containing combine options.
         * @returns Model which surrounds the paths of the original model.
         */
        function expandPaths(modelToExpand, distance, joints, combineOptions) {
            if (joints === void 0) { joints = 0; }
            if (combineOptions === void 0) { combineOptions = {}; }
            if (distance <= 0)
                return null;
            var result = {
                models: {
                    expansions: { models: {} },
                    caps: { models: {} }
                }
            };
            var first = true;
            var lastFarPoint = combineOptions.farPoint;
            var walkOptions = {
                onPath: function (walkedPath) {
                    //don't expand paths shorter than the tolerance for combine operations
                    if (combineOptions.pointMatchingDistance && MakerJs.measure.pathLength(walkedPath.pathContext) < combineOptions.pointMatchingDistance)
                        return;
                    var expandedPathModel = MakerJs.path.expand(walkedPath.pathContext, distance, true);
                    if (expandedPathModel) {
                        model.moveRelative(expandedPathModel, walkedPath.offset);
                        var newId = model.getSimilarModelId(result.models['expansions'], walkedPath.pathId);
                        model.prefixPathIds(expandedPathModel, walkedPath.pathId + '_');
                        model.originate(expandedPathModel);
                        if (!first) {
                            model.combine(result, expandedPathModel, false, true, false, true, combineOptions);
                            combineOptions.measureA.modelsMeasured = false;
                            lastFarPoint = combineOptions.farPoint;
                            delete combineOptions.farPoint;
                            delete combineOptions.measureB;
                        }
                        result.models['expansions'].models[newId] = expandedPathModel;
                        if (expandedPathModel.models) {
                            var caps = expandedPathModel.models['Caps'];
                            if (caps) {
                                delete expandedPathModel.models['Caps'];
                                result.models['caps'].models[newId] = caps;
                            }
                        }
                        first = false;
                    }
                }
            };
            model.walk(modelToExpand, walkOptions);
            if (joints) {
                var roundCaps = result.models['caps'];
                var straightCaps = { models: {} };
                result.models['straightcaps'] = straightCaps;
                model.simplify(roundCaps);
                //straighten each cap, optionally beveling
                for (var id in roundCaps.models) {
                    //add a model container to the straight caps
                    straightCaps.models[id] = { models: {} };
                    model.walk(roundCaps.models[id], {
                        onPath: function (walkedPath) {
                            var arc = walkedPath.pathContext;
                            //make a small closed shape using the straightened arc
                            var straightened = MakerJs.path.straighten(arc, joints == 2, walkedPath.pathId + '_', true);
                            //union this little pointy shape with the rest of the result
                            model.combine(result, straightened, false, true, false, true, combineOptions);
                            combineOptions.measureA.modelsMeasured = false;
                            lastFarPoint = combineOptions.farPoint;
                            delete combineOptions.farPoint;
                            delete combineOptions.measureB;
                            //replace the rounded path with the straightened model
                            straightCaps.models[id].models[walkedPath.pathId] = straightened;
                            //delete all the paths in the model containing this path
                            delete walkedPath.modelContext.paths;
                        }
                    });
                }
                //delete the round caps
                delete result.models['caps'];
            }
            combineOptions.farPoint = lastFarPoint;
            return result;
        }
        model.expandPaths = expandPaths;
        /**
         * @private
         */
        function getEndlessChains(modelContext) {
            var endlessChains = [];
            model.findChains(modelContext, function (chains, loose, layer) {
                endlessChains = chains.filter(function (chain) { return chain.endless; });
            });
            return endlessChains;
        }
        /**
         * @private
         */
        function getClosedGeometries(modelContext) {
            //get endless chains from the model
            var endlessChains = getEndlessChains(modelContext);
            if (endlessChains.length == 0)
                return null;
            //make a new model with only closed geometries
            var closed = { models: {} };
            endlessChains.forEach(function (c, i) {
                closed.models[i] = MakerJs.chain.toNewModel(c);
            });
            return closed;
        }
        /**
         * Outline a model by a specified distance. Useful for accommodating for kerf.
         *
         * @param modelToOutline Model to outline.
         * @param distance Distance to outline.
         * @param joints Number of points at a joint between paths. Use 0 for round joints, 1 for pointed joints, 2 for beveled joints.
         * @param inside Optional boolean to draw lines inside the model instead of outside.
         * @param options Options to send to combine() function.
         * @returns Model which surrounds the paths outside of the original model.
         */
        function outline(modelToOutline, distance, joints, inside, options) {
            if (joints === void 0) { joints = 0; }
            if (inside === void 0) { inside = false; }
            if (options === void 0) { options = {}; }
            var expanded = expandPaths(modelToOutline, distance, joints, options);
            if (!expanded)
                return null;
            //get closed geometries from the model
            var closed = getClosedGeometries(modelToOutline);
            if (closed) {
                var childCount = 0;
                var result = { models: {} };
                //get closed geometries from the expansion
                var chains = getEndlessChains(expanded);
                chains.forEach(function (c) {
                    //sample one link from the chain
                    var wp = c.links[0].walkedPath;
                    //see if it is inside the original model
                    var isInside = MakerJs.measure.isPointInsideModel(MakerJs.point.middle(wp.pathContext), closed, wp.offset);
                    //save the ones we want
                    if (inside && isInside || !inside && !isInside) {
                        result.models[childCount++] = MakerJs.chain.toNewModel(c);
                    }
                    ;
                });
                return result;
            }
            else {
                return expanded;
            }
        }
        model.outline = outline;
    })(model = MakerJs.model || (MakerJs.model = {}));
})(MakerJs || (MakerJs = {}));
var MakerJs;
(function (MakerJs) {
    var units;
    (function (units) {
        /**
         * The base type is arbitrary. Other conversions are then based off of this.
         * @private
         */
        var base = MakerJs.unitType.Millimeter;
        /**
         * Initialize all known conversions here.
         * @private
         */
        function init() {
            addBaseConversion(MakerJs.unitType.Centimeter, 10);
            addBaseConversion(MakerJs.unitType.Meter, 1000);
            addBaseConversion(MakerJs.unitType.Inch, 25.4);
            addBaseConversion(MakerJs.unitType.Foot, 25.4 * 12);
        }
        /**
         * Table of conversions. Lazy load upon first conversion.
         * @private
         */
        var table;
        /**
         * Add a conversion, and its inversion.
         * @private
         */
        function addConversion(srcUnitType, destUnitType, value) {
            function row(unitType) {
                if (!table[unitType]) {
                    table[unitType] = {};
                }
                return table[unitType];
            }
            row(srcUnitType)[destUnitType] = value;
            row(destUnitType)[srcUnitType] = 1 / value;
        }
        /**
         * Add a conversion of the base unit.
         * @private
         */
        function addBaseConversion(destUnitType, value) {
            addConversion(destUnitType, base, value);
        }
        /**
         * Get a conversion ratio between a source unit and a destination unit.
         *
         * @param srcUnitType unitType converting from.
         * @param destUnitType unitType converting to.
         * @returns Numeric ratio of the conversion.
         */
        function conversionScale(srcUnitType, destUnitType) {
            if (srcUnitType == destUnitType) {
                return 1;
            }
            //This will lazy load the table with initial conversions.
            if (!table) {
                table = {};
                init();
            }
            //look for a cached conversion in the table.
            if (!table[srcUnitType][destUnitType]) {
                //create a new conversionsand cache it in the table.
                addConversion(srcUnitType, destUnitType, table[srcUnitType][base] * table[base][destUnitType]);
            }
            return table[srcUnitType][destUnitType];
        }
        units.conversionScale = conversionScale;
    })(units = MakerJs.units || (MakerJs.units = {}));
})(MakerJs || (MakerJs = {}));
var MakerJs;
(function (MakerJs) {
    var measure;
    (function (measure) {
        /**
         * Find out if two angles are equal.
         *
         * @param angleA First angle.
         * @param angleB Second angle.
         * @returns true if angles are the same, false if they are not
         */
        function isAngleEqual(angleA, angleB, accuracy) {
            if (accuracy === void 0) { accuracy = .0001; }
            var a = MakerJs.angle.noRevolutions(angleA);
            var b = MakerJs.angle.noRevolutions(angleB);
            var d = MakerJs.angle.noRevolutions(MakerJs.round(b - a, accuracy));
            return d == 0;
        }
        measure.isAngleEqual = isAngleEqual;
        /**
         * @private
         */
        var pathAreEqualMap = {};
        pathAreEqualMap[MakerJs.pathType.Line] = function (lineA, lineB, withinPointDistance) {
            return (isPointEqual(lineA.origin, lineB.origin, withinPointDistance) && isPointEqual(lineA.end, lineB.end, withinPointDistance))
                || (isPointEqual(lineA.origin, lineB.end, withinPointDistance) && isPointEqual(lineA.end, lineB.origin, withinPointDistance));
        };
        pathAreEqualMap[MakerJs.pathType.Circle] = function (circleA, circleB, withinPointDistance) {
            return isPointEqual(circleA.origin, circleB.origin, withinPointDistance) && circleA.radius == circleB.radius;
        };
        pathAreEqualMap[MakerJs.pathType.Arc] = function (arcA, arcB, withinPointDistance) {
            return pathAreEqualMap[MakerJs.pathType.Circle](arcA, arcB, withinPointDistance) && isAngleEqual(arcA.startAngle, arcB.startAngle) && isAngleEqual(arcA.endAngle, arcB.endAngle);
        };
        /**
         * Find out if two paths are equal.
         *
         * @param pathA First path.
         * @param pathB Second path.
         * @returns true if paths are the same, false if they are not
         */
        function isPathEqual(pathA, pathB, withinPointDistance, pathAOffset, pathBOffset) {
            var result = false;
            if (pathA.type == pathB.type) {
                var fn = pathAreEqualMap[pathA.type];
                if (fn) {
                    function getResult() {
                        result = fn(pathA, pathB, withinPointDistance);
                    }
                    if (pathAOffset || pathBOffset) {
                        MakerJs.path.moveTemporary([pathA, pathB], [pathAOffset, pathBOffset], getResult);
                    }
                    else {
                        getResult();
                    }
                }
            }
            return result;
        }
        measure.isPathEqual = isPathEqual;
        /**
         * Find out if two points are equal.
         *
         * @param a First point.
         * @param b Second point.
         * @returns true if points are the same, false if they are not
         */
        function isPointEqual(a, b, withinDistance) {
            if (!withinDistance) {
                return MakerJs.round(a[0] - b[0]) == 0 && MakerJs.round(a[1] - b[1]) == 0;
            }
            else {
                if (!a || !b)
                    return false;
                var distance = measure.pointDistance(a, b);
                return distance <= withinDistance;
            }
        }
        measure.isPointEqual = isPointEqual;
        /**
         * Find out if point is on a slope.
         *
         * @param p Point to check.
         * @param b Slope.
         * @returns true if point is on the slope
         */
        function isPointOnSlope(p, slope, withinDistance) {
            if (slope.hasSlope) {
                // y = mx * b
                return MakerJs.round(p[1] - (slope.slope * p[0] + slope.yIntercept)) === 0;
            }
            else {
                //vertical slope
                return MakerJs.round(p[0] - slope.line.origin[0]) === 0;
            }
        }
        measure.isPointOnSlope = isPointOnSlope;
        /**
         * Check for slope equality.
         *
         * @param slopeA The ISlope to test.
         * @param slopeB The ISlope to check for equality.
         * @returns Boolean true if slopes are equal.
         */
        function isSlopeEqual(slopeA, slopeB) {
            if (!isSlopeParallel(slopeA, slopeB))
                return false;
            if (!slopeA.hasSlope && !slopeB.hasSlope) {
                //lines are both vertical, see if x are the same
                return MakerJs.round(slopeA.line.origin[0] - slopeB.line.origin[0]) == 0;
            }
            //lines are parallel, but not vertical, see if y-intercept is the same
            return MakerJs.round(slopeA.yIntercept - slopeB.yIntercept, .00001) == 0;
        }
        measure.isSlopeEqual = isSlopeEqual;
        /**
         * Check for parallel slopes.
         *
         * @param slopeA The ISlope to test.
         * @param slopeB The ISlope to check for parallel.
         * @returns Boolean true if slopes are parallel.
         */
        function isSlopeParallel(slopeA, slopeB) {
            if (!slopeA.hasSlope && !slopeB.hasSlope) {
                return true;
            }
            if (slopeA.hasSlope && slopeB.hasSlope && (MakerJs.round(slopeA.slope - slopeB.slope, .00001) == 0)) {
                //lines are parallel
                return true;
            }
            return false;
        }
        measure.isSlopeParallel = isSlopeParallel;
    })(measure = MakerJs.measure || (MakerJs.measure = {}));
})(MakerJs || (MakerJs = {}));
var MakerJs;
(function (MakerJs) {
    var measure;
    (function (measure) {
        /**
         * Increase a measurement by an additional measurement.
         *
         * @param baseMeasure The measurement to increase.
         * @param addMeasure The additional measurement.
         * @param addOffset Optional offset point of the additional measurement.
         * @returns The increased original measurement (for cascading).
         */
        function increase(baseMeasure, addMeasure) {
            function getExtreme(basePoint, newPoint, fn) {
                if (!newPoint)
                    return;
                for (var i = 2; i--;) {
                    if (newPoint[i] == null)
                        continue;
                    if (basePoint[i] == null) {
                        basePoint[i] = newPoint[i];
                    }
                    else {
                        basePoint[i] = fn(basePoint[i], newPoint[i]);
                    }
                }
            }
            if (addMeasure) {
                getExtreme(baseMeasure.low, addMeasure.low, Math.min);
                getExtreme(baseMeasure.high, addMeasure.high, Math.max);
            }
            return baseMeasure;
        }
        measure.increase = increase;
        /**
         * Check for arc being concave or convex towards a given point.
         *
         * @param arc The arc to test.
         * @param towardsPoint The point to test.
         * @returns Boolean true if arc is concave towards point.
         */
        function isArcConcaveTowardsPoint(arc, towardsPoint) {
            if (pointDistance(arc.origin, towardsPoint) <= arc.radius) {
                return true;
            }
            var midPointToNearPoint = new MakerJs.paths.Line(MakerJs.point.middle(arc), towardsPoint);
            var options = {};
            var intersectionPoint = MakerJs.path.intersection(midPointToNearPoint, new MakerJs.paths.Chord(arc), options);
            if (intersectionPoint || options.out_AreOverlapped) {
                return true;
            }
            return false;
        }
        measure.isArcConcaveTowardsPoint = isArcConcaveTowardsPoint;
        /**
         * Check for arc overlapping another arc.
         *
         * @param arcA The arc to test.
         * @param arcB The arc to check for overlap.
         * @param excludeTangents Boolean to exclude exact endpoints and only look for deep overlaps.
         * @returns Boolean true if arcA is overlapped with arcB.
         */
        function isArcOverlapping(arcA, arcB, excludeTangents) {
            var pointsOfIntersection = [];
            function checkAngles(a, b) {
                function checkAngle(n) {
                    return measure.isBetweenArcAngles(n, a, excludeTangents);
                }
                return checkAngle(b.startAngle) || checkAngle(b.endAngle);
            }
            return checkAngles(arcA, arcB) || checkAngles(arcB, arcA) || (arcA.startAngle == arcB.startAngle && arcA.endAngle == arcB.endAngle);
        }
        measure.isArcOverlapping = isArcOverlapping;
        /**
         * Check if a given number is between two given limits.
         *
         * @param valueInQuestion The number to test.
         * @param limitA First limit.
         * @param limitB Second limit.
         * @param exclusive Flag to exclude equaling the limits.
         * @returns Boolean true if value is between (or equal to) the limits.
         */
        function isBetween(valueInQuestion, limitA, limitB, exclusive) {
            if (exclusive) {
                return Math.min(limitA, limitB) < valueInQuestion && valueInQuestion < Math.max(limitA, limitB);
            }
            else {
                return Math.min(limitA, limitB) <= valueInQuestion && valueInQuestion <= Math.max(limitA, limitB);
            }
        }
        measure.isBetween = isBetween;
        /**
         * Check if a given angle is between an arc's start and end angles.
         *
         * @param angleInQuestion The angle to test.
         * @param arc Arc to test against.
         * @param exclusive Flag to exclude equaling the start or end angles.
         * @returns Boolean true if angle is between (or equal to) the arc's start and end angles.
         */
        function isBetweenArcAngles(angleInQuestion, arc, exclusive) {
            var startAngle = MakerJs.angle.noRevolutions(arc.startAngle);
            var span = MakerJs.angle.ofArcSpan(arc);
            var endAngle = startAngle + span;
            angleInQuestion = MakerJs.angle.noRevolutions(angleInQuestion);
            //computed angles will not be negative, but the arc may have specified a negative angle, so check against one revolution forward and backward
            return (isBetween(angleInQuestion, startAngle, endAngle, exclusive) || isBetween(angleInQuestion, startAngle + 360, endAngle + 360, exclusive) || isBetween(angleInQuestion, startAngle - 360, endAngle - 360, exclusive));
        }
        measure.isBetweenArcAngles = isBetweenArcAngles;
        /**
         * Check if a given point is between a line's end points.
         *
         * @param pointInQuestion The point to test.
         * @param line Line to test against.
         * @param exclusive Flag to exclude equaling the origin or end points.
         * @returns Boolean true if point is between (or equal to) the line's origin and end points.
         */
        function isBetweenPoints(pointInQuestion, line, exclusive) {
            var oneDimension = false;
            for (var i = 2; i--;) {
                if (MakerJs.round(line.origin[i] - line.end[i], .000001) == 0) {
                    if (oneDimension)
                        return false;
                    oneDimension = true;
                    continue;
                }
                var origin_value = MakerJs.round(line.origin[i]);
                var end_value = MakerJs.round(line.end[i]);
                if (!isBetween(MakerJs.round(pointInQuestion[i]), origin_value, end_value, exclusive))
                    return false;
            }
            return true;
        }
        measure.isBetweenPoints = isBetweenPoints;
        /**
         * Check if a given bezier seed has all points on the same slope.
         *
         * @param seed The bezier seed to test.
         * @param exclusive Optional boolean to test only within the boundary of the endpoints.
         * @returns Boolean true if bezier seed has control points on the line slope and between the line endpoints.
         */
        function isBezierSeedLinear(seed, exclusive) {
            //create a slope from the endpoints
            var slope = lineSlope(seed);
            for (var i = 0; i < seed.controls.length; i++) {
                if (!(measure.isPointOnSlope(seed.controls[i], slope))) {
                    if (!exclusive)
                        return false;
                    if (isBetweenPoints(seed.controls[i], seed, false))
                        return false;
                }
            }
            return true;
        }
        measure.isBezierSeedLinear = isBezierSeedLinear;
        var graham_scan = require('graham_scan');
        /**
         * @private
         */
        function serializePoint(p) {
            return p.join(',');
        }
        /**
         * Check for flow of paths in a chain being clockwise or not.
         *
         * @param chainContext The chain to test.
         * @param out_result Optional output object, if provided, will be populated with convex hull results.
         * @returns Boolean true if paths in the chain flow clockwise.
         */
        function isChainClockwise(chainContext, out_result) {
            //cannot do non-endless or circle
            if (!chainContext.endless || chainContext.links.length === 1) {
                return null;
            }
            var convexHull = new graham_scan();
            var pointsInChainOrder = [];
            function add(endPoint) {
                convexHull.addPoint(endPoint[0], endPoint[1]);
                pointsInChainOrder.push(serializePoint(endPoint));
            }
            var keyPoints = MakerJs.chain.toKeyPoints(chainContext);
            keyPoints.forEach(add);
            //we only need to deal with 3 points
            var hull = convexHull.getHull();
            var hullPoints = hull.slice(0, 3).map(function (p) { return serializePoint([p.x, p.y]); });
            var ordered = [];
            pointsInChainOrder.forEach(function (p) {
                if (~hullPoints.indexOf(p))
                    ordered.push(p);
            });
            //now make sure endpoints of hull are endpoints of ordered. do this by managing the middle point
            switch (ordered.indexOf(hullPoints[1])) {
                case 0:
                    //shift down
                    ordered.unshift(ordered.pop());
                    break;
                case 2:
                    //shift up
                    ordered.push(ordered.shift());
                    break;
            }
            if (out_result) {
                out_result.hullPoints = hull.map(function (p) { return [p.x, p.y]; });
                out_result.keyPoints = keyPoints;
            }
            //the hull is counterclockwise, so the result is clockwise if the first elements do not match
            return hullPoints[0] != ordered[0];
        }
        measure.isChainClockwise = isChainClockwise;
        /**
         * Check for line overlapping another line.
         *
         * @param lineA The line to test.
         * @param lineB The line to check for overlap.
         * @param excludeTangents Boolean to exclude exact endpoints and only look for deep overlaps.
         * @returns Boolean true if lineA is overlapped with lineB.
         */
        function isLineOverlapping(lineA, lineB, excludeTangents) {
            var pointsOfIntersection = [];
            function checkPoints(index, a, b) {
                function checkPoint(p) {
                    return measure.isBetweenPoints(p, a, excludeTangents);
                }
                return checkPoint(b.origin) || checkPoint(b.end);
            }
            return checkPoints(0, lineA, lineB) || checkPoints(1, lineB, lineA);
        }
        measure.isLineOverlapping = isLineOverlapping;
        /**
         * Check for measurement overlapping another measurement.
         *
         * @param measureA The measurement to test.
         * @param measureB The measurement to check for overlap.
         * @returns Boolean true if measureA is overlapped with measureB.
         */
        function isMeasurementOverlapping(measureA, measureB) {
            for (var i = 2; i--;) {
                if (!(MakerJs.round(measureA.low[i] - measureB.high[i]) <= 0 && MakerJs.round(measureA.high[i] - measureB.low[i]) >= 0))
                    return false;
            }
            return true;
        }
        measure.isMeasurementOverlapping = isMeasurementOverlapping;
        /**
         * Gets the slope of a line.
         */
        function lineSlope(line) {
            var dx = line.end[0] - line.origin[0];
            if (MakerJs.round(dx) == 0) {
                return {
                    line: line,
                    hasSlope: false
                };
            }
            var dy = line.end[1] - line.origin[1];
            var slope = dy / dx;
            var yIntercept = line.origin[1] - slope * line.origin[0];
            return {
                line: line,
                hasSlope: true,
                slope: slope,
                yIntercept: yIntercept
            };
        }
        measure.lineSlope = lineSlope;
        /**
         * Calculates the distance between two points.
         *
         * @param a First point.
         * @param b Second point.
         * @returns Distance between points.
         */
        function pointDistance(a, b) {
            var dx = b[0] - a[0];
            var dy = b[1] - a[1];
            return Math.sqrt(dx * dx + dy * dy);
        }
        measure.pointDistance = pointDistance;
        /**
         * @private
         */
        function getExtremePoint(a, b, fn) {
            return [
                fn(a[0], b[0]),
                fn(a[1], b[1])
            ];
        }
        /**
         * @private
         */
        var pathExtentsMap = {};
        pathExtentsMap[MakerJs.pathType.Line] = function (line) {
            return {
                low: getExtremePoint(line.origin, line.end, Math.min),
                high: getExtremePoint(line.origin, line.end, Math.max)
            };
        };
        pathExtentsMap[MakerJs.pathType.Circle] = function (circle) {
            var r = circle.radius;
            return {
                low: MakerJs.point.add(circle.origin, [-r, -r]),
                high: MakerJs.point.add(circle.origin, [r, r])
            };
        };
        pathExtentsMap[MakerJs.pathType.Arc] = function (arc) {
            var r = arc.radius;
            var arcPoints = MakerJs.point.fromArc(arc);
            function extremeAngle(xyAngle, value, fn) {
                var extremePoint = getExtremePoint(arcPoints[0], arcPoints[1], fn);
                for (var i = 2; i--;) {
                    if (isBetweenArcAngles(xyAngle[i], arc, false)) {
                        extremePoint[i] = value + arc.origin[i];
                    }
                }
                return extremePoint;
            }
            return {
                low: extremeAngle([180, 270], -r, Math.min),
                high: extremeAngle([360, 90], r, Math.max)
            };
        };
        /**
         * Calculates the smallest rectangle which contains a path.
         *
         * @param pathToMeasure The path to measure.
         * @returns object with low and high points.
         */
        function pathExtents(pathToMeasure, addOffset) {
            if (pathToMeasure) {
                var fn = pathExtentsMap[pathToMeasure.type];
                if (fn) {
                    var m = fn(pathToMeasure);
                    if (addOffset) {
                        m.high = MakerJs.point.add(m.high, addOffset);
                        m.low = MakerJs.point.add(m.low, addOffset);
                    }
                    return m;
                }
            }
            return { low: null, high: null };
        }
        measure.pathExtents = pathExtents;
        /**
         * @private
         */
        var pathLengthMap = {};
        pathLengthMap[MakerJs.pathType.Line] = function (line) {
            return pointDistance(line.origin, line.end);
        };
        pathLengthMap[MakerJs.pathType.Circle] = function (circle) {
            return 2 * Math.PI * circle.radius;
        };
        pathLengthMap[MakerJs.pathType.Arc] = function (arc) {
            var value = pathLengthMap[MakerJs.pathType.Circle](arc);
            var pct = MakerJs.angle.ofArcSpan(arc) / 360;
            value *= pct;
            return value;
        };
        pathLengthMap[MakerJs.pathType.BezierSeed] = function (seed) {
            return MakerJs.models.BezierCurve.computeLength(seed);
        };
        /**
         * Measures the length of a path.
         *
         * @param pathToMeasure The path to measure.
         * @returns Length of the path.
         */
        function pathLength(pathToMeasure) {
            if (pathToMeasure) {
                var fn = pathLengthMap[pathToMeasure.type];
                if (fn) {
                    return fn(pathToMeasure);
                }
            }
            return 0;
        }
        measure.pathLength = pathLength;
        /**
         * Measures the length of all paths in a model.
         *
         * @param modelToMeasure The model containing paths to measure.
         * @returns Length of all paths in the model.
         */
        function modelPathLength(modelToMeasure) {
            var total = 0;
            MakerJs.model.walk(modelToMeasure, {
                onPath: function (walkedPath) {
                    total += pathLength(walkedPath.pathContext);
                }
            });
            return total;
        }
        measure.modelPathLength = modelPathLength;
        /**
         * @private
         */
        function cloneMeasure(measureToclone) {
            return {
                high: MakerJs.point.clone(measureToclone.high),
                low: MakerJs.point.clone(measureToclone.low)
            };
        }
        /**
         * Measures the smallest rectangle which contains a model.
         *
         * @param modelToMeasure The model to measure.
         * @param atlas Optional atlas to save measurements.
         * @returns object with low and high points.
         */
        function modelExtents(modelToMeasure, atlas) {
            function increaseParentModel(childRoute, childMeasurement) {
                if (!childMeasurement)
                    return;
                //to get the parent route, just traverse backwards 2 to remove id and 'paths' / 'models'
                var parentRoute = childRoute.slice(0, -2);
                var parentRouteKey = MakerJs.createRouteKey(parentRoute);
                if (!(parentRouteKey in atlas.modelMap)) {
                    //just start with the known size
                    atlas.modelMap[parentRouteKey] = cloneMeasure(childMeasurement);
                }
                else {
                    measure.increase(atlas.modelMap[parentRouteKey], childMeasurement);
                }
            }
            if (!atlas)
                atlas = new measure.Atlas(modelToMeasure);
            var walkOptions = {
                onPath: function (walkedPath) {
                    //trust that the path measurement is good
                    if (!(walkedPath.routeKey in atlas.pathMap)) {
                        atlas.pathMap[walkedPath.routeKey] = measure.pathExtents(walkedPath.pathContext, walkedPath.offset);
                    }
                    increaseParentModel(walkedPath.route, atlas.pathMap[walkedPath.routeKey]);
                },
                afterChildWalk: function (walkedModel) {
                    //model has been updated by all its children, update parent
                    increaseParentModel(walkedModel.route, atlas.modelMap[walkedModel.routeKey]);
                }
            };
            MakerJs.model.walk(modelToMeasure, walkOptions);
            atlas.modelsMeasured = true;
            var m = atlas.modelMap[''];
            if (m) {
                return augment(m);
            }
            return m;
        }
        measure.modelExtents = modelExtents;
        /**
         * Augment a measurement - add more properties such as center point, height and width.
         *
         * @param measureToAugment The measurement to augment.
         * @returns Measurement object with augmented properties.
         */
        function augment(measureToAugment) {
            var m = measureToAugment;
            m.center = MakerJs.point.average(m.high, m.low);
            m.width = m.high[0] - m.low[0];
            m.height = m.high[1] - m.low[1];
            return m;
        }
        measure.augment = augment;
        /**
         * A list of maps of measurements.
         *
         * @param modelToMeasure The model to measure.
         * @param atlas Optional atlas to save measurements.
         * @returns object with low and high points.
         */
        var Atlas = (function () {
            /**
             * Constructor.
             * @param modelContext The model to measure.
             */
            function Atlas(modelContext) {
                this.modelContext = modelContext;
                /**
                 * Flag that models have been measured.
                 */
                this.modelsMeasured = false;
                /**
                 * Map of model measurements, mapped by routeKey.
                 */
                this.modelMap = {};
                /**
                 * Map of path measurements, mapped by routeKey.
                 */
                this.pathMap = {};
            }
            Atlas.prototype.measureModels = function () {
                if (!this.modelsMeasured) {
                    modelExtents(this.modelContext, this);
                }
            };
            return Atlas;
        }());
        measure.Atlas = Atlas;
        /**
         * @private
         */
        function loopIndex(base, i) {
            if (i >= base)
                return i - base;
            if (i < 0)
                return i + base;
            return i;
        }
        /**
         * @private
         */
        function yAtX(slope, x) {
            return slope.slope * x + slope.yIntercept;
        }
        /**
         * @private
         */
        function pointOnSlopeAtX(line, x) {
            var slope = lineSlope(line);
            return [x, yAtX(slope, x)];
        }
        /**
         * @private
         */
        function isCircular(bounds) {
            for (var i = 1; i < 3; i++) {
                if (!measure.isPointEqual(bounds[0].center, bounds[i].center, .000001) || !(MakerJs.round(bounds[0].width - bounds[i].width) === 0)) {
                    return false;
                }
            }
            return true;
        }
        /**
         * @private
         */
        function getAngledBounds(index, modelToMeasure, rotateModel, rotatePaths) {
            MakerJs.model.rotate(modelToMeasure, rotateModel);
            var m = modelExtents(modelToMeasure);
            var result = {
                index: index,
                rotation: rotatePaths,
                center: MakerJs.point.rotate(m.center, rotatePaths),
                //model is sideways, so width is based on Y, height is based on X
                width: m.height,
                height: m.width,
                bottom: new MakerJs.paths.Line(m.low, [m.high[0], m.low[1]]),
                middle: new MakerJs.paths.Line([m.low[0], m.center[1]], [m.high[0], m.center[1]]),
                top: new MakerJs.paths.Line(m.high, [m.low[0], m.high[1]])
            };
            [result.top, result.middle, result.bottom].forEach(function (line) { return MakerJs.path.rotate(line, rotatePaths); });
            return result;
        }
        /**
         * @private
         */
        function hexSolution(lines, bounds) {
            var tip = lines[1].origin;
            var tipX = tip[0];
            var left = lines[3].origin[0];
            var right = lines[0].origin[0];
            //see if left edge is in bounds if right edge is on the hex boundary
            var altRight = tipX - right;
            if ((right - left) > 2 * altRight)
                return null;
            //see if right edge is in bounds if left edge is on the hex boundary
            var altLeft = (tipX - left) / 3;
            if (altRight < altLeft)
                return null;
            var altitudeViaSide = Math.min(altLeft, altRight);
            var radiusViaSide = MakerJs.solvers.equilateralSide(altitudeViaSide);
            //find peaks, then find highest peak
            var peakPoints = [MakerJs.point.fromSlopeIntersection(lines[1], lines[2]), MakerJs.point.fromSlopeIntersection(lines[4], lines[5])];
            var peakRadii = peakPoints.map(function (p) { return Math.abs(p[1] - tip[1]); });
            var peakNum = (peakRadii[0] > peakRadii[1]) ? 0 : 1; //top = 0, bottom = 1
            var radiusViaPeak = peakRadii[peakNum];
            if (radiusViaPeak > radiusViaSide) {
                var altitudeViaPeak = MakerJs.solvers.equilateralAltitude(radiusViaPeak);
                var peakX = tipX - 2 * altitudeViaPeak;
                //see if it will contain right side
                if (right > peakX + altitudeViaPeak)
                    return null;
                //see if it will contain left side
                if (left < peakX - altitudeViaPeak)
                    return null;
                //at this point, [tipX - 2 * altitudeViaPeak, tip[1]] is a solution for origin.
                //but we want to best center the result by sliding along the boundary middle, balancing the smallest gap
                var leftGap = left - peakX + altitudeViaPeak;
                var peakGap = 2 * altitudeViaPeak - bounds[peakNum + 1].width;
                var minHalfGap = Math.min(leftGap, peakGap) / 2;
                return {
                    origin: pointOnSlopeAtX(bounds[2 - peakNum].middle, peakX + minHalfGap),
                    radius: radiusViaPeak,
                    type: 'peak ' + peakNum
                };
            }
            else {
                return {
                    origin: [tipX - 2 * altitudeViaSide, tip[1]],
                    radius: radiusViaSide,
                    type: 'side'
                };
            }
        }
        /**
         * Measures the minimum bounding hexagon surrounding a model. The hexagon is oriented such that the right and left sides are vertical, and the top and bottom are pointed.
         *
         * @param modelToMeasure The model to measure.
         * @returns IBoundingHex object which is a hexagon model, with an additional radius property.
         */
        function boundingHexagon(modelToMeasure) {
            var originalMeasure = modelExtents(modelToMeasure);
            var clone = MakerJs.cloneObject(modelToMeasure);
            var bounds = [];
            var scratch = { paths: {} };
            MakerJs.model.center(clone);
            function result(radius, origin1, notes) {
                return {
                    radius: radius,
                    paths: new MakerJs.models.Polygon(6, radius, 30).paths,
                    origin: MakerJs.point.add(origin1, MakerJs.point.subtract(originalMeasure.center, modelToMeasure.origin)),
                    //models: { scratch: scratch },
                    notes: notes
                };
            }
            var boundRotations = [[90, -90], [-60, -30], [-60, 30]];
            while (boundRotations.length) {
                var rotation = boundRotations.shift();
                var bound = getAngledBounds(bounds.length, clone, rotation[0], rotation[1]);
                var side = MakerJs.solvers.equilateralSide(bound.width / 2);
                if (side >= bound.height) {
                    return result(side, bound.center, 'solved by bound ' + bounds.length);
                }
                bounds.push(bound);
            }
            //model.rotate(clone, 30);
            //scratch.models = { clone: clone };
            //check for a circular solution
            if (isCircular(bounds)) {
                return result(MakerJs.solvers.equilateralSide(bounds[0].width / 2), bounds[0].center, 'solved as circular');
            }
            var perimeters = bounds.map(function (b) { return b.top; }).concat(bounds.map(function (b) { return b.bottom; }));
            perimeters.forEach(function (p, i) {
                scratch.paths[i] = p;
                //converge alternate lines to form two triangles
                MakerJs.path.converge(perimeters[loopIndex(6, i + 2)], p, true);
            });
            bounds.forEach(function (b, i) {
                scratch.paths['m' + i] = b.middle;
            });
            var boundCopy = bounds.slice();
            var solution;
            //solve a hexagon for every tip, keeping the smallest one
            for (var i = 0; i < 6; i++) {
                //rotate the scratch area so that we always reference the tip at polar 0
                if (i > 0) {
                    perimeters.push(perimeters.shift());
                    boundCopy.push(boundCopy.shift());
                    MakerJs.model.rotate(scratch, -60);
                }
                var s = hexSolution(perimeters, boundCopy);
                if (s) {
                    if (!solution || s.radius < solution.radius) {
                        solution = s;
                        solution.index = i;
                    }
                }
            }
            var p = MakerJs.point.rotate(solution.origin, solution.index * 60);
            return result(solution.radius, p, 'solved by ' + solution.index + ' as ' + solution.type);
        }
        measure.boundingHexagon = boundingHexagon;
        /**
         * @private
         */
        function addUniquePoints(pointArray, pointsToAdd) {
            var added = 0;
            function addUniquePoint(pointToAdd) {
                for (var i = 0; i < pointArray.length; i++) {
                    if (measure.isPointEqual(pointArray[i], pointToAdd, .000000001)) {
                        return;
                    }
                }
                pointArray.push(pointToAdd);
                added++;
            }
            for (var i = 0; i < pointsToAdd.length; i++) {
                addUniquePoint(pointsToAdd[i]);
            }
            return added;
        }
        /**
         * @private
         */
        function getFarPoint(modelContext, farPoint, measureAtlas) {
            if (farPoint)
                return farPoint;
            var high = measure.modelExtents(modelContext).high;
            if (high) {
                return MakerJs.point.add(high, [1, 1]);
            }
            return [7654321, 1234567];
        }
        /**
         * Check to see if a point is inside of a model.
         *
         * @param pointToCheck The point to check.
         * @param modelContext The model to check against.
         * @param options Optional IMeasurePointInsideOptions object.
         * @returns Boolean true if the path is inside of the modelContext.
         */
        function isPointInsideModel(pointToCheck, modelContext, options) {
            if (options === void 0) { options = {}; }
            if (!options.farPoint) {
                options.farPoint = getFarPoint(modelContext, options.farPoint, options.measureAtlas);
            }
            options.out_intersectionPoints = [];
            var isInside;
            var lineToFarPoint = new MakerJs.paths.Line(pointToCheck, options.farPoint);
            var measureFarPoint = measure.pathExtents(lineToFarPoint);
            var walkOptions = {
                onPath: function (walkedPath) {
                    if (options.measureAtlas && !measure.isMeasurementOverlapping(measureFarPoint, options.measureAtlas.pathMap[walkedPath.routeKey])) {
                        return;
                    }
                    var intersectOptions = { path2Offset: walkedPath.offset };
                    var farInt = MakerJs.path.intersection(lineToFarPoint, walkedPath.pathContext, intersectOptions);
                    if (farInt) {
                        var added = addUniquePoints(options.out_intersectionPoints, farInt.intersectionPoints);
                        //if number of intersections is an odd number, flip the flag.
                        if (added % 2 == 1) {
                            isInside = !!!isInside;
                        }
                    }
                },
                beforeChildWalk: function (innerWalkedModel) {
                    if (!options.measureAtlas) {
                        return true;
                    }
                    //see if there is a model measurement. if not, it is because the model does not contain paths.
                    var innerModelMeasurement = options.measureAtlas.modelMap[innerWalkedModel.routeKey];
                    return innerModelMeasurement && measure.isMeasurementOverlapping(measureFarPoint, innerModelMeasurement);
                }
            };
            MakerJs.model.walk(modelContext, walkOptions);
            return !!isInside;
        }
        measure.isPointInsideModel = isPointInsideModel;
    })(measure = MakerJs.measure || (MakerJs.measure = {}));
})(MakerJs || (MakerJs = {}));
var MakerJs;
(function (MakerJs) {
    var exporter;
    (function (exporter) {
        /**
         * Try to get the unit system from a model
         * @private
         */
        function tryGetModelUnits(itemToExport) {
            if (MakerJs.isModel(itemToExport)) {
                return itemToExport.units;
            }
        }
        exporter.tryGetModelUnits = tryGetModelUnits;
        /**
         * Named colors, safe for CSS and DXF
         * 17 colors from https://www.w3.org/TR/CSS21/syndata.html#value-def-color mapped to DXF equivalent AutoDesk Color Index
         */
        exporter.colors = {
            black: 0,
            red: 1,
            yellow: 2,
            lime: 3,
            aqua: 4,
            blue: 5,
            fuschia: 6,
            white: 7,
            gray: 9,
            maroon: 14,
            orange: 30,
            olive: 58,
            green: 94,
            teal: 134,
            navy: 174,
            purple: 214,
            silver: 254
        };
    })(exporter = MakerJs.exporter || (MakerJs.exporter = {}));
})(MakerJs || (MakerJs = {}));
var MakerJs;
(function (MakerJs) {
    var importer;
    (function (importer) {
        /**
         * Create a numeric array from a string of numbers. The numbers may be delimited by anything non-numeric.
         *
         * Example:
         * ```
         * var n = makerjs.importer.parseNumericList('5, 10, 15.20 25-30-35 4e1 .5');
         * ```
         *
         * @param s The string of numbers.
         * @returns Array of numbers.
         */
        function parseNumericList(s) {
            var result = [];
            //http://stackoverflow.com/questions/638565/parsing-scientific-notation-sensibly
            var re = /[\.-]?(?:0|[1-9]\d*)(?:\.\d*)?(?:[eE][+\-]?\d+)?/g;
            var matches;
            while ((matches = re.exec(s)) !== null) {
                if (matches.index === re.lastIndex) {
                    re.lastIndex++;
                }
                result.push(parseFloat(matches[0]));
            }
            return result;
        }
        importer.parseNumericList = parseNumericList;
    })(importer = MakerJs.importer || (MakerJs.importer = {}));
})(MakerJs || (MakerJs = {}));
var MakerJs;
(function (MakerJs) {
    var exporter;
    (function (exporter) {
        /**
         * Renders an item in AutoDesk DFX file format.
         *
         * @param itemToExport Item to render: may be a path, an array of paths, or a model object.
         * @param options Rendering options object.
         * @param options.units String of the unit system. May be omitted. See makerjs.unitType for possible values.
         * @returns String of DXF content.
         */
        function toDXF(itemToExport, options) {
            //DXF format documentation:
            //http://images.autodesk.com/adsk/files/acad_dxf0.pdf
            if (options === void 0) { options = {}; }
            var opts = {};
            var layerIds = [];
            var dxf = { "top": [], "bottom": [] };
            var dxfIndex = "top";
            function append(value) {
                dxf[dxfIndex].push(value);
            }
            MakerJs.extendObject(opts, options);
            if (MakerJs.isModel(itemToExport)) {
                var modelToExport = itemToExport;
                if (modelToExport.exporterOptions) {
                    MakerJs.extendObject(opts, modelToExport.exporterOptions['toDXF']);
                }
            }
            function colorLayerOptions(layer) {
                if (opts.layerOptions && opts.layerOptions[layer])
                    return opts.layerOptions[layer];
                if (layer in exporter.colors) {
                    return {
                        color: exporter.colors[layer]
                    };
                }
            }
            function defaultLayer(pathContext, parentLayer) {
                var layerId = pathContext.layer || parentLayer || '0';
                if (layerIds.indexOf(layerId) < 0) {
                    layerIds.push(layerId);
                }
                return layerId;
            }
            var map = {};
            map[MakerJs.pathType.Line] = function (id, line, offset, layer) {
                append("0");
                append("LINE");
                append("8");
                append(defaultLayer(line, layer));
                append("10");
                append(line.origin[0] + offset[0]);
                append("20");
                append(line.origin[1] + offset[1]);
                append("11");
                append(line.end[0] + offset[0]);
                append("21");
                append(line.end[1] + offset[1]);
            };
            map[MakerJs.pathType.Circle] = function (id, circle, offset, layer) {
                append("0");
                append("CIRCLE");
                append("8");
                append(defaultLayer(circle, layer));
                append("10");
                append(circle.origin[0] + offset[0]);
                append("20");
                append(circle.origin[1] + offset[1]);
                append("40");
                append(circle.radius);
            };
            map[MakerJs.pathType.Arc] = function (id, arc, offset, layer) {
                append("0");
                append("ARC");
                append("8");
                append(defaultLayer(arc, layer));
                append("10");
                append(arc.origin[0] + offset[0]);
                append("20");
                append(arc.origin[1] + offset[1]);
                append("40");
                append(arc.radius);
                append("50");
                append(arc.startAngle);
                append("51");
                append(arc.endAngle);
            };
            //TODO - handle scenario if any bezier seeds get passed
            //map[pathType.BezierSeed]
            function section(sectionFn) {
                append("0");
                append("SECTION");
                sectionFn();
                append("0");
                append("ENDSEC");
            }
            function tables(tableFn) {
                append("2");
                append("TABLES");
                append("0");
                append("TABLE");
                tableFn();
                append("0");
                append("ENDTAB");
            }
            function layerOut(layerId, layerColor) {
                append("0");
                append("LAYER");
                append("2");
                append(layerId);
                append("70");
                append("0");
                append("62");
                append(layerColor);
                append("6");
                append("CONTINUOUS");
            }
            function layersOut() {
                append("2");
                append("LAYER");
                layerIds.forEach(function (layerId) {
                    var layerOptions = colorLayerOptions(layerId);
                    if (layerOptions) {
                        layerOut(layerId, layerOptions.color);
                    }
                });
            }
            function header() {
                var units = dxfUnit[opts.units];
                append("2");
                append("HEADER");
                append("9");
                append("$INSUNITS");
                append("70");
                append(units);
            }
            function entities() {
                append("2");
                append("ENTITIES");
                var walkOptions = {
                    onPath: function (walkedPath) {
                        var fn = map[walkedPath.pathContext.type];
                        if (fn) {
                            fn(walkedPath.pathId, walkedPath.pathContext, walkedPath.offset, walkedPath.layer);
                        }
                    }
                };
                MakerJs.model.walk(modelToExport, walkOptions);
            }
            //fixup options
            if (!opts.units) {
                var units = exporter.tryGetModelUnits(itemToExport);
                if (units) {
                    opts.units = units;
                }
            }
            //also pass back to options parameter
            MakerJs.extendObject(options, opts);
            //begin dxf output
            if (opts.units) {
                section(header);
            }
            dxfIndex = "bottom";
            section(entities);
            dxfIndex = "top";
            section(function () { return tables(layersOut); });
            dxfIndex = "bottom";
            append("0");
            append("EOF");
            return dxf["top"].concat(dxf["bottom"]).join('\n');
        }
        exporter.toDXF = toDXF;
        /**
         * @private
         */
        var dxfUnit = {};
        //DXF format documentation:
        //http://images.autodesk.com/adsk/files/acad_dxf0.pdf
        //Default drawing units for AutoCAD DesignCenter blocks:
        //0 = Unitless; 1 = Inches; 2 = Feet; 3 = Miles; 4 = Millimeters; 5 = Centimeters; 6 = Meters; 7 = Kilometers; 8 = Microinches;
        dxfUnit[''] = 0;
        dxfUnit[MakerJs.unitType.Inch] = 1;
        dxfUnit[MakerJs.unitType.Foot] = 2;
        dxfUnit[MakerJs.unitType.Millimeter] = 4;
        dxfUnit[MakerJs.unitType.Centimeter] = 5;
        dxfUnit[MakerJs.unitType.Meter] = 6;
    })(exporter = MakerJs.exporter || (MakerJs.exporter = {}));
})(MakerJs || (MakerJs = {}));
var MakerJs;
(function (MakerJs) {
    var solvers;
    (function (solvers) {
        /**
         * @private
         */
        var equilateral = Math.sqrt(3) / 2;
        /**
         * Solves for the altitude of an equilateral triangle when you know its side length.
         *
         * @param sideLength Length of a side of the equilateral triangle (all 3 sides are equal).
         * @returns Altitude of the equilateral triangle.
         */
        function equilateralAltitude(sideLength) {
            return sideLength * equilateral;
        }
        solvers.equilateralAltitude = equilateralAltitude;
        /**
         * Solves for the side length of an equilateral triangle when you know its altitude.
         *
         * @param altitude Altitude of the equilateral triangle.
         * @returns Length of the side of the equilateral triangle (all 3 sides are equal).
         */
        function equilateralSide(altitude) {
            return altitude / equilateral;
        }
        solvers.equilateralSide = equilateralSide;
        /**
         * Solves for the angle of a triangle when you know lengths of 3 sides.
         *
         * @param lengthA Length of side of triangle, opposite of the angle you are trying to find.
         * @param lengthB Length of any other side of the triangle.
         * @param lengthC Length of the remaining side of the triangle.
         * @returns Angle opposite of the side represented by the first parameter.
         */
        function solveTriangleSSS(lengthA, lengthB, lengthC) {
            return MakerJs.angle.toDegrees(Math.acos((lengthB * lengthB + lengthC * lengthC - lengthA * lengthA) / (2 * lengthB * lengthC)));
        }
        solvers.solveTriangleSSS = solveTriangleSSS;
        /**
         * Solves for the length of a side of a triangle when you know length of one side and 2 angles.
         *
         * @param oppositeAngleInDegrees Angle which is opposite of the side you are trying to find.
         * @param lengthOfSideBetweenAngles Length of one side of the triangle which is between the provided angles.
         * @param otherAngleInDegrees An other angle of the triangle.
         * @returns Length of the side of the triangle which is opposite of the first angle parameter.
         */
        function solveTriangleASA(oppositeAngleInDegrees, lengthOfSideBetweenAngles, otherAngleInDegrees) {
            var angleOppositeSide = 180 - oppositeAngleInDegrees - otherAngleInDegrees;
            return (lengthOfSideBetweenAngles * Math.sin(MakerJs.angle.toRadians(oppositeAngleInDegrees))) / Math.sin(MakerJs.angle.toRadians(angleOppositeSide));
        }
        solvers.solveTriangleASA = solveTriangleASA;
        /**
         * Solves for the angles of the tangent lines between 2 circles.
         *
         * @param a First circle.
         * @param b Second circle.
         * @param inner Boolean to use inner tangents instead of outer tangents.
         * @returns Array of angles in degrees where 2 lines between the circles will be tangent to both circles.
         */
        function circleTangentAngles(a, b, inner) {
            if (inner === void 0) { inner = false; }
            var connect = new MakerJs.paths.Line(a.origin, b.origin);
            var distance = MakerJs.measure.pointDistance(a.origin, b.origin);
            //no tangents if either circle encompasses the other
            if (a.radius >= distance + b.radius || b.radius >= distance + a.radius)
                return null;
            //no inner tangents when circles touch or overlap
            if (inner && (a.radius + b.radius >= distance))
                return null;
            var tangentAngles;
            if (!inner && MakerJs.round(a.radius - b.radius) == 0) {
                tangentAngles = [90, 270];
            }
            else {
                //solve for circles on the x axis at the distance
                var d2 = distance / 2;
                var between = new MakerJs.paths.Circle([d2, 0], d2);
                var diff = new MakerJs.paths.Circle(((a.radius > b.radius) ? a : b).origin, inner ? (a.radius + b.radius) : Math.abs(a.radius - b.radius));
                var int = MakerJs.path.intersection(diff, between);
                if (!int || !int.path1Angles)
                    return null;
                tangentAngles = int.path1Angles;
            }
            var connectAngle = MakerJs.angle.ofLineInDegrees(connect);
            //add the line's angle to the result
            return tangentAngles.map(function (a) { return MakerJs.angle.noRevolutions(a + connectAngle); });
        }
        solvers.circleTangentAngles = circleTangentAngles;
    })(solvers = MakerJs.solvers || (MakerJs.solvers = {}));
})(MakerJs || (MakerJs = {}));
var MakerJs;
(function (MakerJs) {
    var path;
    (function (path) {
        /**
         * @private
         */
        var map = {};
        map[MakerJs.pathType.Arc] = {};
        map[MakerJs.pathType.Circle] = {};
        map[MakerJs.pathType.Line] = {};
        map[MakerJs.pathType.Arc][MakerJs.pathType.Arc] = function (arc1, arc2, options, swapOffsets) {
            var result = null;
            moveTemp([arc1, arc2], options, swapOffsets, function () {
                var angles = circleToCircle(arc1, arc2, options);
                if (angles) {
                    var arc1Angles = getAnglesWithinArc(angles[0], arc1, options);
                    var arc2Angles = getAnglesWithinArc(angles[1], arc2, options);
                    if (arc1Angles && arc2Angles) {
                        //must correspond to the same angle indexes
                        if (arc1Angles.length === 1 || arc2Angles.length === 1) {
                            for (var i1 = 0; i1 < arc1Angles.length; i1++) {
                                for (var i2 = 0; i2 < arc2Angles.length; i2++) {
                                    var p1 = MakerJs.point.fromAngleOnCircle(arc1Angles[i1], arc1);
                                    var p2 = MakerJs.point.fromAngleOnCircle(arc2Angles[i2], arc2);
                                    //if they do not correspond then they don't intersect
                                    if (MakerJs.measure.isPointEqual(p1, p2, .0001)) {
                                        result = {
                                            intersectionPoints: [p1],
                                            path1Angles: [arc1Angles[i1]],
                                            path2Angles: [arc2Angles[i2]]
                                        };
                                        return;
                                    }
                                }
                            }
                        }
                        else {
                            result = {
                                intersectionPoints: pointsFromAnglesOnCircle(arc1Angles, arc1),
                                path1Angles: arc1Angles,
                                path2Angles: arc2Angles
                            };
                        }
                    }
                }
                else {
                    if (options.out_AreOverlapped) {
                        //overlapped for circle, reset and see if arcs actually overlap.
                        options.out_AreOverlapped = MakerJs.measure.isArcOverlapping(arc1, arc2, options.excludeTangents);
                    }
                }
            });
            return result;
        };
        map[MakerJs.pathType.Arc][MakerJs.pathType.Circle] = function (arc, circle, options, swapOffsets) {
            var result = null;
            moveTemp([arc, circle], options, swapOffsets, function () {
                var angles = circleToCircle(arc, circle, options);
                if (angles) {
                    var arcAngles = getAnglesWithinArc(angles[0], arc, options);
                    if (arcAngles) {
                        var circleAngles;
                        //if both point are on arc, use both on circle
                        if (arcAngles.length == 2) {
                            circleAngles = angles[1];
                        }
                        else {
                            //use the corresponding point on circle 
                            var index = findCorrespondingAngleIndex(angles, arcAngles);
                            circleAngles = [angles[1][index]];
                        }
                        result = {
                            intersectionPoints: pointsFromAnglesOnCircle(arcAngles, arc),
                            path1Angles: arcAngles,
                            path2Angles: circleAngles
                        };
                    }
                }
            });
            return result;
        };
        map[MakerJs.pathType.Arc][MakerJs.pathType.Line] = function (arc, line, options, swapOffsets) {
            var result = null;
            moveTemp([arc, line], options, swapOffsets, function () {
                var angles = lineToCircle(line, arc, options);
                if (angles) {
                    var arcAngles = getAnglesWithinArc(angles, arc, options);
                    if (arcAngles) {
                        result = {
                            intersectionPoints: pointsFromAnglesOnCircle(arcAngles, arc),
                            path1Angles: arcAngles
                        };
                    }
                }
            });
            return result;
        };
        map[MakerJs.pathType.Circle][MakerJs.pathType.Arc] = function (circle, arc, options) {
            var result = map[MakerJs.pathType.Arc][MakerJs.pathType.Circle](arc, circle, options, true);
            if (result) {
                return swapAngles(result);
            }
            return null;
        };
        map[MakerJs.pathType.Circle][MakerJs.pathType.Circle] = function (circle1, circle2, options, swapOffsets) {
            var result = null;
            moveTemp([circle1, circle2], options, swapOffsets, function () {
                var angles = circleToCircle(circle1, circle2, options);
                if (angles) {
                    result = {
                        intersectionPoints: pointsFromAnglesOnCircle(angles[0], circle1),
                        path1Angles: angles[0],
                        path2Angles: angles[1]
                    };
                }
            });
            return result;
        };
        map[MakerJs.pathType.Circle][MakerJs.pathType.Line] = function (circle, line, options, swapOffsets) {
            var result = null;
            moveTemp([circle, line], options, swapOffsets, function () {
                var angles = lineToCircle(line, circle, options);
                if (angles) {
                    result = {
                        intersectionPoints: pointsFromAnglesOnCircle(angles, circle),
                        path1Angles: angles
                    };
                }
            });
            return result;
        };
        map[MakerJs.pathType.Line][MakerJs.pathType.Arc] = function (line, arc, options) {
            var result = map[MakerJs.pathType.Arc][MakerJs.pathType.Line](arc, line, options, true);
            if (result) {
                return swapAngles(result);
            }
            return null;
        };
        map[MakerJs.pathType.Line][MakerJs.pathType.Circle] = function (line, circle, options) {
            var result = map[MakerJs.pathType.Circle][MakerJs.pathType.Line](circle, line, options, true);
            if (result) {
                return swapAngles(result);
            }
            return null;
        };
        map[MakerJs.pathType.Line][MakerJs.pathType.Line] = function (line1, line2, options, swapOffsets) {
            var result = null;
            moveTemp([line1, line2], options, swapOffsets, function () {
                var intersectionPoint = MakerJs.point.fromSlopeIntersection(line1, line2, options);
                if (intersectionPoint) {
                    //we have the point of intersection of endless lines, now check to see if the point is between both segemnts
                    if (MakerJs.measure.isBetweenPoints(intersectionPoint, line1, options.excludeTangents) && MakerJs.measure.isBetweenPoints(intersectionPoint, line2, options.excludeTangents)) {
                        result = {
                            intersectionPoints: [intersectionPoint]
                        };
                    }
                }
            });
            return result;
        };
        /**
         * @private
         */
        function moveTemp(pathsToOffset, options, swapOffsets, task) {
            var offsets = swapOffsets ? [options.path2Offset, options.path1Offset] : [options.path1Offset, options.path2Offset];
            path.moveTemporary(pathsToOffset, offsets, task);
        }
        ;
        /**
         * @private
         */
        function swapAngles(result) {
            var temp = result.path1Angles;
            if (result.path2Angles) {
                result.path1Angles = result.path2Angles;
            }
            else {
                delete result.path1Angles;
            }
            if (temp) {
                result.path2Angles = temp;
            }
            return result;
        }
        /**
         * Find the point(s) where 2 paths intersect.
         *
         * @param path1 First path to find intersection.
         * @param path2 Second path to find intersection.
         * @param options Optional IPathIntersectionOptions.
         * @returns IPathIntersection object, with points(s) of intersection (and angles, when a path is an arc or circle); or null if the paths did not intersect.
         */
        function intersection(path1, path2, options) {
            if (options === void 0) { options = {}; }
            if (path1 && path2) {
                var fn = map[path1.type][path2.type];
                if (fn) {
                    return fn(path1, path2, options);
                }
            }
            return null;
        }
        path.intersection = intersection;
        /**
         * @private
         */
        function findCorrespondingAngleIndex(circleAngles, arcAngle) {
            for (var i = 0; i < circleAngles.length; i++) {
                if (circleAngles[i][0] == arcAngle[0])
                    return i;
            }
        }
        /**
         * @private
         */
        function pointsFromAnglesOnCircle(anglesInDegrees, circle) {
            var result = [];
            for (var i = 0; i < anglesInDegrees.length; i++) {
                result.push(MakerJs.point.fromAngleOnCircle(anglesInDegrees[i], circle));
            }
            return result;
        }
        /**
         * @private
         */
        function getAnglesWithinArc(angles, arc, options) {
            if (!angles)
                return null;
            var anglesWithinArc = [];
            for (var i = 0; i < angles.length; i++) {
                if (MakerJs.measure.isBetweenArcAngles(angles[i], arc, options.excludeTangents)) {
                    anglesWithinArc.push(angles[i]);
                }
            }
            if (anglesWithinArc.length == 0)
                return null;
            return anglesWithinArc;
        }
        /**
         * @private
         */
        function lineToCircle(line, circle, options) {
            var radius = MakerJs.round(circle.radius);
            //no-op for degenerate circle
            if (circle.radius <= 0) {
                return null;
            }
            //clone the line
            var clonedLine = new MakerJs.paths.Line(MakerJs.point.subtract(line.origin, circle.origin), MakerJs.point.subtract(line.end, circle.origin));
            //get angle of line
            var lineAngleNormal = MakerJs.angle.ofLineInDegrees(line);
            //use the positive horizontal angle
            var lineAngle = (lineAngleNormal >= 180) ? lineAngleNormal - 360 : lineAngleNormal;
            //rotate the line to horizontal
            path.rotate(clonedLine, -lineAngle, MakerJs.point.zero());
            //remember how to undo the rotation we just did
            function unRotate(resultAngle) {
                var unrotated = resultAngle + lineAngle;
                return MakerJs.round(MakerJs.angle.noRevolutions(unrotated));
            }
            //line is horizontal, get the y value from any point
            var lineY = MakerJs.round(clonedLine.origin[1]);
            var lineYabs = Math.abs(lineY);
            //if y is greater than radius, there is no intersection
            if (lineYabs > radius) {
                return null;
            }
            var anglesOfIntersection = [];
            //if horizontal Y is the same as the radius, we know it's 90 degrees
            if (lineYabs == radius) {
                if (options.excludeTangents) {
                    return null;
                }
                anglesOfIntersection.push(unRotate(lineY > 0 ? 90 : 270));
            }
            else {
                function intersectionBetweenEndpoints(x, angleOfX) {
                    if (MakerJs.measure.isBetween(MakerJs.round(x), MakerJs.round(clonedLine.origin[0]), MakerJs.round(clonedLine.end[0]), options.excludeTangents)) {
                        anglesOfIntersection.push(unRotate(angleOfX));
                    }
                }
                //find angle where line intersects
                var intersectRadians = Math.asin(lineY / radius);
                var intersectDegrees = MakerJs.angle.toDegrees(intersectRadians);
                //line may intersect in 2 places
                var intersectX = Math.cos(intersectRadians) * radius;
                intersectionBetweenEndpoints(-intersectX, 180 - intersectDegrees);
                intersectionBetweenEndpoints(intersectX, intersectDegrees);
            }
            if (anglesOfIntersection.length > 0) {
                return anglesOfIntersection;
            }
            return null;
        }
        /**
         * @private
         */
        function circleToCircle(circle1, circle2, options) {
            //no-op if either circle is degenerate
            if (circle1.radius <= 0 || circle2.radius <= 0) {
                return null;
            }
            //see if circles are the same
            if (circle1.radius == circle2.radius && MakerJs.measure.isPointEqual(circle1.origin, circle2.origin, .0001)) {
                options.out_AreOverlapped = true;
                return null;
            }
            //get offset from origin
            var offset = MakerJs.point.subtract(MakerJs.point.zero(), circle1.origin);
            //clone circle1 and move to origin
            var c1 = new MakerJs.paths.Circle(MakerJs.point.zero(), circle1.radius);
            //clone circle2 and move relative to circle1
            var c2 = new MakerJs.paths.Circle(MakerJs.point.subtract(circle2.origin, circle1.origin), circle2.radius);
            //rotate circle2 to horizontal, c2 will be to the right of the origin.
            var c2Angle = MakerJs.angle.ofPointInDegrees(MakerJs.point.zero(), c2.origin);
            path.rotate(c2, -c2Angle, MakerJs.point.zero());
            function unRotate(resultAngle) {
                var unrotated = resultAngle + c2Angle;
                return MakerJs.angle.noRevolutions(unrotated);
            }
            //get X of c2 origin
            var x = c2.origin[0];
            //see if circles are tangent interior on left side
            if (MakerJs.round(c2.radius - x - c1.radius) == 0) {
                if (options.excludeTangents) {
                    return null;
                }
                return [[unRotate(180)], [unRotate(180)]];
            }
            //see if circles are tangent interior on right side
            if (MakerJs.round(c2.radius + x - c1.radius) == 0) {
                if (options.excludeTangents) {
                    return null;
                }
                return [[unRotate(0)], [unRotate(0)]];
            }
            //see if circles are tangent exterior
            if (MakerJs.round(x - c2.radius - c1.radius) == 0) {
                if (options.excludeTangents) {
                    return null;
                }
                return [[unRotate(0)], [unRotate(180)]];
            }
            //see if c2 is outside of c1
            if (MakerJs.round(x - c2.radius) > c1.radius) {
                return null;
            }
            //see if c2 is within c1
            if (MakerJs.round(x + c2.radius) < c1.radius) {
                return null;
            }
            //see if c1 is within c2
            if (MakerJs.round(x - c2.radius) < -c1.radius) {
                return null;
            }
            function bothAngles(oneAngle) {
                return [unRotate(oneAngle), unRotate(MakerJs.angle.mirror(oneAngle, false, true))];
            }
            var c1IntersectionAngle = MakerJs.solvers.solveTriangleSSS(c2.radius, c1.radius, x);
            var c2IntersectionAngle = MakerJs.solvers.solveTriangleSSS(c1.radius, x, c2.radius);
            return [bothAngles(c1IntersectionAngle), bothAngles(180 - c2IntersectionAngle)];
        }
    })(path = MakerJs.path || (MakerJs.path = {}));
})(MakerJs || (MakerJs = {}));
var MakerJs;
(function (MakerJs) {
    var path;
    (function (path) {
        /**
         * @private
         */
        var propertyNamesMap = {};
        propertyNamesMap[MakerJs.pathType.Arc] = function (arc) {
            return ['startAngle', 'endAngle'];
        };
        propertyNamesMap[MakerJs.pathType.Line] = function (line) {
            return ['origin', 'end'];
        };
        /**
         * @private
         */
        function getPointProperties(pathToInspect) {
            var points = MakerJs.point.fromPathEnds(pathToInspect);
            if (points) {
                function pointProperty(index) {
                    return { point: points[index], propertyName: propertyNames[index] };
                }
                var propertyNames = null;
                var fn = propertyNamesMap[pathToInspect.type];
                if (fn) {
                    propertyNames = fn(pathToInspect);
                    return [pointProperty(0), pointProperty(1)];
                }
            }
            return null;
        }
        /**
         * @private
         */
        function getMatchingPointProperties(pathA, pathB, options) {
            var pathAProperties = getPointProperties(pathA);
            var pathBProperties = getPointProperties(pathB);
            var result = null;
            function makeMatch(pathContext, pointProperties, index) {
                return {
                    path: pathContext,
                    isStart: index == 0,
                    propertyName: pointProperties[index].propertyName,
                    point: pointProperties[index].point,
                    oppositePoint: pointProperties[1 - index].point
                };
            }
            function check(iA, iB) {
                if (MakerJs.measure.isPointEqual(pathAProperties[iA].point, pathBProperties[iB].point, .0001)) {
                    result = [
                        makeMatch(pathA, pathAProperties, iA),
                        makeMatch(pathB, pathBProperties, iB)
                    ];
                    return true;
                }
                return false;
            }
            check(0, 0) || check(0, 1) || check(1, 0) || check(1, 1);
            return result;
        }
        /**
         * @private
         */
        function populateShardPointsFromReferenceCircle(filletRadius, center, properties, options) {
            var referenceCircle = new MakerJs.paths.Circle(center, filletRadius);
            //get reference circle intersection points
            for (var i = 0; i < 2; i++) {
                var circleIntersection = path.intersection(referenceCircle, properties[i].path);
                if (!circleIntersection) {
                    return false;
                }
                properties[i].shardPoint = circleIntersection.intersectionPoints[0];
                if (MakerJs.measure.isPointEqual(properties[i].point, circleIntersection.intersectionPoints[0], .0001)) {
                    if (circleIntersection.intersectionPoints.length > 1) {
                        properties[i].shardPoint = circleIntersection.intersectionPoints[1];
                    }
                    else {
                        return false;
                    }
                }
            }
            return true;
        }
        /**
         * @private
         */
        function cloneAndBreakPath(pathToShard, shardPoint) {
            var shardStart = path.clone(pathToShard);
            var shardEnd = path.breakAtPoint(shardStart, shardPoint);
            return [shardStart, shardEnd];
        }
        /**
         * @private
         */
        var guidePathMap = {};
        guidePathMap[MakerJs.pathType.Arc] = function (arc, filletRadius, nearPoint, shardPoint, isStart) {
            var guideRadius = arc.radius;
            //see if the guideline should be external or internal to the context arc.
            var guideArcShard = cloneAndBreakPath(arc, shardPoint)[isStart ? 0 : 1];
            if (guideArcShard) {
                if (MakerJs.measure.isArcConcaveTowardsPoint(guideArcShard, nearPoint)) {
                    guideRadius -= filletRadius;
                }
                else {
                    guideRadius += filletRadius;
                }
                if (MakerJs.round(guideRadius) <= 0)
                    return null;
                return new MakerJs.paths.Arc(arc.origin, guideRadius, arc.startAngle, arc.endAngle);
            }
            return null;
        };
        guidePathMap[MakerJs.pathType.Line] = function (line, filletRadius, nearPoint, shardPoint, isStart) {
            return new MakerJs.paths.Parallel(line, filletRadius, nearPoint);
        };
        /**
         * @private
         */
        function getGuidePath(context, filletRadius, nearPoint) {
            var result = null;
            var fn = guidePathMap[context.path.type];
            if (fn) {
                result = fn(context.path, filletRadius, nearPoint, context.shardPoint, context.isStart);
            }
            return result;
        }
        /**
         * @private
         */
        var filletResultMap = {};
        filletResultMap[MakerJs.pathType.Arc] = function (arc, propertyName, filletRadius, filletCenter) {
            var guideLine = new MakerJs.paths.Line(arc.origin, filletCenter);
            var guideLineAngle = MakerJs.angle.ofLineInDegrees(guideLine);
            var filletAngle = guideLineAngle;
            //the context is an arc and the fillet is an arc so they will be tangent. If the fillet is external to the arc then the tangent is opposite.
            if (!MakerJs.measure.isArcConcaveTowardsPoint(arc, filletCenter)) {
                filletAngle += 180;
            }
            return {
                filletAngle: MakerJs.angle.noRevolutions(filletAngle),
                clipPath: function () {
                    arc[propertyName] = guideLineAngle;
                }
            };
        };
        filletResultMap[MakerJs.pathType.Line] = function (line, propertyName, filletRadius, filletCenter) {
            //make a small vertical line
            var guideLine = new MakerJs.paths.Line([0, 0], [0, 1]);
            //rotate this vertical line the same angle as the line context. It will be perpendicular.
            var lineAngle = MakerJs.angle.ofLineInDegrees(line);
            path.rotate(guideLine, lineAngle, [0, 0]);
            path.moveRelative(guideLine, filletCenter);
            //get the intersection point of the slopes of the context line and the perpendicular line. This is where the fillet meets the line.
            var intersectionPoint = MakerJs.point.fromSlopeIntersection(line, guideLine);
            if (intersectionPoint) {
                return {
                    filletAngle: MakerJs.angle.ofPointInDegrees(filletCenter, intersectionPoint),
                    clipPath: function () {
                        line[propertyName] = intersectionPoint;
                    }
                };
            }
            return null;
        };
        /**
         * @private
         */
        function getFilletResult(context, filletRadius, filletCenter) {
            var result = null;
            var fn = filletResultMap[context.path.type];
            if (fn) {
                result = fn(context.path, context.propertyName, filletRadius, filletCenter);
            }
            if (!testFilletResult(context, result)) {
                result = null;
            }
            return result;
        }
        /**
         * @private
         */
        function getDogboneResult(context, filletCenter) {
            var result = {
                filletAngle: MakerJs.angle.ofPointInDegrees(filletCenter, context.shardPoint),
                clipPath: function () {
                    context.path[context.propertyName] = context.shardPoint;
                }
            };
            if (!testFilletResult(context, result)) {
                result = null;
            }
            return result;
        }
        /**
         * @private
         */
        function testFilletResult(context, result) {
            var test = false;
            if (result) {
                //temporarily clip the path.
                var originalValue = context.path[context.propertyName];
                result.clipPath();
                //don't allow a fillet which effectivly eliminates the path.
                if (MakerJs.measure.pathLength(context.path) > 0) {
                    test = true;
                }
                //revert the clipping we just did.
                context.path[context.propertyName] = originalValue;
            }
            return test;
        }
        /**
         * @private
         */
        function getLineRatio(lines) {
            var totalLength = 0;
            var lengths = [];
            for (var i = 0; i < lines.length; i++) {
                var length = MakerJs.measure.pathLength(lines[i]);
                lengths.push(length);
                totalLength += length;
            }
            return lengths[0] / totalLength;
        }
        /**
         * Adds a round corner to the outside angle between 2 lines. The lines must meet at one point.
         *
         * @param lineA First line to fillet, which will be modified to fit the fillet.
         * @param lineB Second line to fillet, which will be modified to fit the fillet.
         * @returns Arc path object of the new fillet.
         */
        function dogbone(lineA, lineB, filletRadius, options) {
            if (MakerJs.isPathLine(lineA) && MakerJs.isPathLine(lineB) && filletRadius && filletRadius > 0) {
                var opts = {
                    pointMatchingDistance: .005
                };
                MakerJs.extendObject(opts, options);
                //first find the common point
                var commonProperty = getMatchingPointProperties(lineA, lineB, options);
                if (commonProperty) {
                    //get the ratio comparison of the two lines
                    var ratio = getLineRatio([lineA, lineB]);
                    //draw a line between the two endpoints, and get the bisection point at the ratio
                    var span = new MakerJs.paths.Line(commonProperty[0].oppositePoint, commonProperty[1].oppositePoint);
                    var midRatioPoint = MakerJs.point.middle(span, ratio);
                    //use the bisection theorem to get the angle bisecting the lines
                    var bisectionAngle = MakerJs.angle.ofPointInDegrees(commonProperty[0].point, midRatioPoint);
                    var center = MakerJs.point.add(commonProperty[0].point, MakerJs.point.fromPolar(MakerJs.angle.toRadians(bisectionAngle), filletRadius));
                    if (!populateShardPointsFromReferenceCircle(filletRadius, center, commonProperty, opts)) {
                        return null;
                    }
                    //get the angles of the fillet and a function which clips the path to the fillet.
                    var results = [];
                    for (var i = 0; i < 2; i++) {
                        var result = getDogboneResult(commonProperty[i], center);
                        if (!result) {
                            return null;
                        }
                        results.push(result);
                    }
                    var filletArc = new MakerJs.paths.Arc(center, filletRadius, results[0].filletAngle, results[1].filletAngle);
                    //make sure midpoint of fillet is outside of the angle
                    if (MakerJs.round(MakerJs.angle.noRevolutions(MakerJs.angle.ofArcMiddle(filletArc))) == MakerJs.round(bisectionAngle)) {
                        filletArc.startAngle = results[1].filletAngle;
                        filletArc.endAngle = results[0].filletAngle;
                    }
                    //clip the paths and return the fillet arc.
                    results[0].clipPath();
                    results[1].clipPath();
                    return filletArc;
                }
            }
            return null;
        }
        path.dogbone = dogbone;
        /**
         * Adds a round corner to the inside angle between 2 paths. The paths must meet at one point.
         *
         * @param pathA First path to fillet, which will be modified to fit the fillet.
         * @param pathB Second path to fillet, which will be modified to fit the fillet.
         * @param filletRadius Radius of the fillet.
         * @param options Optional IPointMatchOptions object to specify pointMatchingDistance.
         * @returns Arc path object of the new fillet.
         */
        function fillet(pathA, pathB, filletRadius, options) {
            if (pathA && pathB && filletRadius && filletRadius > 0) {
                var opts = {
                    pointMatchingDistance: .005
                };
                MakerJs.extendObject(opts, options);
                //first find the common point
                var commonProperty = getMatchingPointProperties(pathA, pathB, options);
                if (commonProperty) {
                    //since arcs can curl beyond, we need a local reference point. 
                    //An intersection with a circle of the same radius as the desired fillet should suffice.
                    if (!populateShardPointsFromReferenceCircle(filletRadius, commonProperty[0].point, commonProperty, opts)) {
                        return null;
                    }
                    //get "parallel" guidelines
                    var guidePaths = [];
                    for (var i = 0; i < 2; i++) {
                        var otherPathShardPoint = commonProperty[1 - i].shardPoint;
                        if (!otherPathShardPoint) {
                            return null;
                        }
                        var guidePath = getGuidePath(commonProperty[i], filletRadius, otherPathShardPoint);
                        guidePaths.push(guidePath);
                    }
                    //the center of the fillet is the point where the guidelines intersect.
                    var intersectionPoint = path.intersection(guidePaths[0], guidePaths[1]);
                    if (intersectionPoint) {
                        var center;
                        //if guidelines intersect in more than one place, choose the closest one.
                        if (intersectionPoint.intersectionPoints.length == 1) {
                            center = intersectionPoint.intersectionPoints[0];
                        }
                        else {
                            center = MakerJs.point.closest(commonProperty[0].point, intersectionPoint.intersectionPoints);
                        }
                        //get the angles of the fillet and a function which clips the path to the fillet.
                        var results = [];
                        for (var i = 0; i < 2; i++) {
                            var result = getFilletResult(commonProperty[i], filletRadius, center);
                            if (!result) {
                                return null;
                            }
                            results.push(result);
                        }
                        //the two paths may actually be on the same line
                        if (MakerJs.round(results[0].filletAngle - results[1].filletAngle) == 0)
                            return null;
                        var filletArc = new MakerJs.paths.Arc(center, filletRadius, results[0].filletAngle, results[1].filletAngle);
                        var filletSpan = MakerJs.angle.ofArcSpan(filletArc);
                        //the algorithm is only valid for fillet less than 180 degrees
                        if (filletSpan == 180) {
                            return null;
                        }
                        if (filletSpan > 180) {
                            //swap to make smallest angle
                            filletArc.startAngle = results[1].filletAngle;
                            filletArc.endAngle = results[0].filletAngle;
                        }
                        //clip the paths and return the fillet arc.
                        results[0].clipPath();
                        results[1].clipPath();
                        return filletArc;
                    }
                }
            }
            return null;
        }
        path.fillet = fillet;
    })(path = MakerJs.path || (MakerJs.path = {}));
})(MakerJs || (MakerJs = {}));
(function (MakerJs) {
    var chain;
    (function (chain) {
        /**
         * Adds a fillet between each link in a chain. Each path will be cropped to fit a fillet, and all fillets will be returned as paths in a returned model object.
         *
         * @param chainToFillet The chain to add fillets to.
         * @param filletRadius Radius of the fillet.
         * @returns Model object containing paths which fillet the joints in the chain.
         */
        function fillet(chainToFillet, filletRadius) {
            var result = { paths: {} };
            var added = 0;
            var links = chainToFillet.links;
            function add(i1, i2) {
                var p1 = links[i1].walkedPath, p2 = links[i2].walkedPath;
                if (p1.modelContext === p2.modelContext && p1.modelContext.type == MakerJs.models.BezierCurve.typeName)
                    return;
                MakerJs.path.moveTemporary([p1.pathContext, p2.pathContext], [p1.offset, p2.offset], function () {
                    var f = MakerJs.path.fillet(p1.pathContext, p2.pathContext, filletRadius);
                    if (f) {
                        result.paths['fillet' + added] = f;
                        added++;
                    }
                });
            }
            for (var i = 1; i < links.length; i++) {
                add(i - 1, i);
            }
            if (chainToFillet.endless) {
                add(i - 1, 0);
            }
            if (!added)
                return null;
            return result;
        }
        chain.fillet = fillet;
    })(chain = MakerJs.chain || (MakerJs.chain = {}));
})(MakerJs || (MakerJs = {}));
var MakerJs;
(function (MakerJs) {
    var kit;
    (function (kit) {
        //construct a model
        /**
         * Helper function to use the JavaScript "apply" function in conjunction with the "new" keyword.
         *
         * @param ctor The constructor for the class which is an IKit.
         * @param args The array of parameters passed to the constructor.
         * @returns A new instance of the class, which implements the IModel interface.
         */
        function construct(ctor, args) {
            function F() {
                return ctor.apply(this, args);
            }
            F.prototype = ctor.prototype;
            return new F();
        }
        kit.construct = construct;
        /**
         * Extract just the initial sample values from a kit.
         *
         * @param ctor The constructor for the class which is an IKit.
         * @returns Array of the inital sample values provided in the metaParameters array.
         */
        function getParameterValues(ctor) {
            var parameters = [];
            var metaParams = ctor.metaParameters;
            if (metaParams) {
                for (var i = 0; i < metaParams.length; i++) {
                    var value = metaParams[i].value;
                    if (Array.isArray(value)) {
                        value = value[0];
                    }
                    parameters.push(value);
                }
            }
            return parameters;
        }
        kit.getParameterValues = getParameterValues;
    })(kit = MakerJs.kit || (MakerJs.kit = {}));
})(MakerJs || (MakerJs = {}));
var MakerJs;
(function (MakerJs) {
    var model;
    (function (model) {
        /**
         * @private
         */
        function getOpposedLink(linkedPaths, pathContext) {
            if (linkedPaths[0].walkedPath.pathContext === pathContext) {
                return linkedPaths[1];
            }
            return linkedPaths[0];
        }
        /**
         * @private
         */
        function followLinks(connections, chainFound, chainNotFound) {
            function followLink(currLink, chain, firstLink) {
                while (currLink) {
                    chain.links.push(currLink);
                    chain.pathLength += currLink.pathLength;
                    var next = currLink.reversed ? 0 : 1;
                    var nextPoint = currLink.endPoints[next];
                    var items = connections.findCollection(nextPoint);
                    if (!items || items.length === 0) {
                        break;
                    }
                    var nextLink = getOpposedLink(items, currLink.walkedPath.pathContext);
                    //remove the first 2 items, which should be currlink and nextlink
                    items.splice(0, 2);
                    if (!nextLink) {
                        break;
                    }
                    if (nextLink.walkedPath.pathContext === firstLink.walkedPath.pathContext) {
                        chain.endless = true;
                        break;
                    }
                    currLink = nextLink;
                }
            }
            for (var i = 0; i < connections.collections.length; i++) {
                var linkedPaths = connections.collections[i].items;
                if (linkedPaths && linkedPaths.length > 0) {
                    var chain = {
                        links: [],
                        pathLength: 0
                    };
                    followLink(linkedPaths[0], chain, linkedPaths[0]);
                    if (chain.endless) {
                        chainFound(chain);
                    }
                    else {
                        //need to go in reverse
                        chain.links.reverse();
                        var firstLink = chain.links[0];
                        chain.links.map(function (link) { link.reversed = !link.reversed; });
                        //remove the last link, it will be added in the call
                        chain.pathLength -= chain.links[chain.links.length - 1].pathLength;
                        var currLink = chain.links.pop();
                        followLink(currLink, chain, firstLink);
                        if (chain.links.length > 1) {
                            chainFound(chain);
                        }
                        else {
                            chainNotFound(chain.links[0].walkedPath);
                        }
                    }
                    //if there were more than 2 paths on this point, follow those too.
                    if (linkedPaths.length > 0) {
                        i--;
                    }
                }
            }
        }
        /**
         * Find a single chain within a model, across all layers. Shorthand of findChains; useful when you know there is only one chain to find in your model.
         *
         * @param modelContext The model to search for a chain.
         * @returns A chain object or null if chains were not found.
         */
        function findSingleChain(modelContext) {
            var singleChain = null;
            findChains(modelContext, function (chains, loose, layer) {
                singleChain = chains[0];
            }, { byLayers: false });
            return singleChain;
        }
        model.findSingleChain = findSingleChain;
        function findChains(modelContext) {
            var args = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                args[_i - 1] = arguments[_i];
            }
            var options;
            var callback;
            switch (args.length) {
                case 1:
                    if (typeof args[0] === 'function') {
                        callback = args[0];
                    }
                    else {
                        options = args[0];
                    }
                    break;
                case 2:
                    callback = args[0];
                    options = args[1];
                    break;
            }
            var opts = {
                pointMatchingDistance: .005
            };
            MakerJs.extendObject(opts, options);
            function comparePoint(pointA, pointB) {
                var distance = MakerJs.measure.pointDistance(pointA, pointB);
                return distance <= opts.pointMatchingDistance;
            }
            var connectionMap = {};
            var chainsByLayer = {};
            var ignored = {};
            var walkOptions = {
                onPath: function (walkedPath) {
                    var layer = opts.byLayers ? walkedPath.layer : '';
                    if (!connectionMap[layer]) {
                        connectionMap[layer] = new MakerJs.Collector(comparePoint);
                    }
                    var connections = connectionMap[layer];
                    var pathLength = MakerJs.measure.pathLength(walkedPath.pathContext);
                    //circles are loops by nature
                    if (walkedPath.pathContext.type === MakerJs.pathType.Circle ||
                        (walkedPath.pathContext.type === MakerJs.pathType.Arc && MakerJs.round(MakerJs.angle.ofArcSpan(walkedPath.pathContext) - 360) === 0) ||
                        (walkedPath.pathContext.type === MakerJs.pathType.BezierSeed && MakerJs.measure.isPointEqual(walkedPath.pathContext.origin, walkedPath.pathContext.end, opts.pointMatchingDistance))) {
                        var chain = {
                            links: [{
                                    walkedPath: walkedPath,
                                    reversed: null,
                                    endPoints: null,
                                    pathLength: pathLength
                                }],
                            endless: true,
                            pathLength: pathLength
                        };
                        //store circles so that layers fire grouped
                        if (!chainsByLayer[layer]) {
                            chainsByLayer[layer] = [];
                        }
                        chainsByLayer[layer].push(chain);
                    }
                    else {
                        //don't add lines which are shorter than the tolerance
                        if (pathLength < opts.pointMatchingDistance) {
                            if (!ignored[layer]) {
                                ignored[layer] = [];
                            }
                            ignored[layer].push(walkedPath);
                            return;
                        }
                        //gather both endpoints from all non-circle segments
                        var endPoints = MakerJs.point.fromPathEnds(walkedPath.pathContext, walkedPath.offset);
                        for (var i = 0; i < 2; i++) {
                            var link = {
                                walkedPath: walkedPath,
                                endPoints: endPoints,
                                reversed: i != 0,
                                pathLength: pathLength
                            };
                            connections.addItemToCollection(endPoints[i], link);
                        }
                    }
                }
            };
            if (opts.shallow) {
                walkOptions.beforeChildWalk = function () { return false; };
            }
            var beziers;
            if (opts.unifyBeziers) {
                beziers = getBezierModels(modelContext);
                swapBezierPathsWithSeeds(beziers, true);
            }
            model.walk(modelContext, walkOptions);
            for (var layer in connectionMap) {
                var connections = connectionMap[layer];
                var loose = [];
                if (!chainsByLayer[layer]) {
                    chainsByLayer[layer] = [];
                }
                //follow paths to find endless chains
                followLinks(connections, function (chain) {
                    chain.endless = !!chain.endless;
                    chainsByLayer[layer].push(chain);
                }, function (walkedPath) {
                    loose.push(walkedPath);
                });
                //sort to return largest chains first
                chainsByLayer[layer].sort(function (a, b) { return b.pathLength - a.pathLength; });
                if (opts.contain) {
                    var containChainsOptions = MakerJs.isObject(opts.contain) ? opts.contain : { alternateDirection: false };
                    var containedChains = getContainment(chainsByLayer[layer], containChainsOptions);
                    chainsByLayer[layer] = containedChains;
                }
                if (callback)
                    callback(chainsByLayer[layer], loose, layer, ignored[layer]);
            }
            if (beziers) {
                swapBezierPathsWithSeeds(beziers, false);
            }
            if (opts.byLayers) {
                return chainsByLayer;
            }
            else {
                return chainsByLayer[''];
            }
        }
        model.findChains = findChains;
        /**
         * @private
         */
        function getContainment(allChains, opts) {
            var chainsAsModels = allChains.map(function (c) { return MakerJs.chain.toNewModel(c); });
            var parents = [];
            //see which are inside of each other
            allChains.forEach(function (chainContext, i1) {
                if (!chainContext.endless)
                    return;
                var wp = chainContext.links[0].walkedPath;
                var firstPath = MakerJs.path.clone(wp.pathContext, wp.offset);
                allChains.forEach(function (otherChain, i2) {
                    if (chainContext === otherChain)
                        return;
                    if (!otherChain.endless)
                        return;
                    if (MakerJs.measure.isPointInsideModel(MakerJs.point.middle(firstPath), chainsAsModels[i2])) {
                        //since chains were sorted by pathLength, the smallest pathLength parent will be the parent if contained in multiple chains.
                        parents[i1] = otherChain;
                    }
                });
            });
            //convert parent to children
            var result = [];
            allChains.forEach(function (chainContext, i) {
                var parent = parents[i];
                if (!parent) {
                    result.push(chainContext);
                }
                else {
                    if (!parent.contains) {
                        parent.contains = [];
                    }
                    parent.contains.push(chainContext);
                }
            });
            if (opts.alternateDirection) {
                function alternate(chains, shouldBeClockwise) {
                    chains.forEach(function (chainContext, i) {
                        var isClockwise = MakerJs.measure.isChainClockwise(chainContext);
                        if (isClockwise !== null) {
                            if (!isClockwise && shouldBeClockwise || isClockwise && !shouldBeClockwise) {
                                MakerJs.chain.reverse(chainContext);
                            }
                        }
                        if (chainContext.contains) {
                            alternate(chainContext.contains, !shouldBeClockwise);
                        }
                    });
                }
                alternate(result, true);
            }
            return result;
        }
        /**
         * @private
         */
        function getBezierModels(modelContext) {
            var beziers = [];
            function checkIsBezier(wm) {
                if (wm.childModel.type === MakerJs.models.BezierCurve.typeName) {
                    beziers.push(wm);
                }
            }
            var options = {
                beforeChildWalk: function (walkedModel) {
                    checkIsBezier(walkedModel);
                    return true;
                }
            };
            var rootModel = {
                childId: '',
                childModel: modelContext,
                layer: modelContext.layer,
                offset: modelContext.origin,
                parentModel: null,
                route: [],
                routeKey: ''
            };
            checkIsBezier(rootModel);
            model.walk(modelContext, options);
            return beziers;
        }
        /**
         * @private
         */
        function swapBezierPathsWithSeeds(beziers, swap) {
            var tempKey = 'tempPaths';
            var tempLayerKey = 'tempLayer';
            beziers.forEach(function (wm) {
                var b = wm.childModel;
                if (swap) {
                    //set layer prior to looking for seeds by layer
                    if (wm.layer != undefined && wm.layer !== '') {
                        b[tempLayerKey] = b.layer;
                        b.layer = wm.layer;
                    }
                    //use seeds as path, hide the arc paths from findChains()
                    var bezierSeedsByLayer = MakerJs.models.BezierCurve.getBezierSeeds(b, { byLayers: true });
                    for (var layer in bezierSeedsByLayer) {
                        var bezierSeeds = bezierSeedsByLayer[layer];
                        if (bezierSeeds.length > 0) {
                            b[tempKey] = b.paths;
                            var newPaths = {};
                            bezierSeeds.forEach(function (seed, i) {
                                seed.layer = layer;
                                newPaths['seed_' + i] = seed;
                            });
                            b.paths = newPaths;
                        }
                    }
                }
                else {
                    //revert the above
                    if (tempKey in b) {
                        b.paths = b[tempKey];
                        delete b[tempKey];
                    }
                    if (tempLayerKey in b) {
                        if (b[tempLayerKey] == undefined) {
                            delete b.layer;
                        }
                        else {
                            b.layer = b[tempLayerKey];
                        }
                        delete b[tempLayerKey];
                    }
                }
            });
        }
    })(model = MakerJs.model || (MakerJs.model = {}));
})(MakerJs || (MakerJs = {}));
(function (MakerJs) {
    var chain;
    (function (chain) {
        /**
         * Shift the links of an endless chain.
         *
         * @param chainContext Chain to cycle through. Must be endless.
         * @param amount Optional number of links to shift. May be negative to cycle backwards.
         * @returns The chainContext for cascading.
         */
        function cycle(chainContext, amount) {
            if (amount === void 0) { amount = 1; }
            if (!chainContext.endless)
                return;
            var n = Math.abs(amount);
            for (var i = 0; i < n; i++) {
                if (amount < 0) {
                    //remove from beginning, add to end
                    chainContext.links.push(chainContext.links.shift());
                }
                else {
                    //remove from end, add to beginning
                    chainContext.links.unshift(chainContext.links.pop());
                }
            }
            return chainContext;
        }
        chain.cycle = cycle;
        /**
         * Reverse the links of a chain.
         *
         * @param chainContext Chain to reverse.
         * @returns The chainContext for cascading.
         */
        function reverse(chainContext) {
            chainContext.links.reverse();
            chainContext.links.forEach(function (link) { return link.reversed = !link.reversed; });
            return chainContext;
        }
        chain.reverse = reverse;
        /**
         * Set the beginning of an endless chain to a known routeKey of a path.
         *
         * @param chainContext Chain to cycle through. Must be endless.
         * @param routeKey RouteKey of the desired path to start the chain with.
         * @returns The chainContext for cascading.
         */
        function startAt(chainContext, routeKey) {
            if (!chainContext.endless)
                return;
            var index = -1;
            for (var i = 0; i < chainContext.links.length; i++) {
                if (chainContext.links[i].walkedPath.routeKey == routeKey) {
                    index = i;
                    break;
                }
            }
            if (index > 0) {
                cycle(chainContext, index);
            }
            return chainContext;
        }
        chain.startAt = startAt;
        /**
         * Convert a chain to a new model, independent of any model from where the chain was found.
         *
         * @param chainContext Chain to convert to a model.
         * @param detachFromOldModel Flag to remove the chain's paths from their current parent model. If false, each path will be cloned. If true, the original path will be re-parented into the resulting new model. Default is false.
         * @returns A new model containing paths from the chain.
         */
        function toNewModel(chainContext, detachFromOldModel) {
            if (detachFromOldModel === void 0) { detachFromOldModel = false; }
            var result = { paths: {} };
            for (var i = 0; i < chainContext.links.length; i++) {
                var wp = chainContext.links[i].walkedPath;
                if (wp.pathContext.type === MakerJs.pathType.BezierSeed) {
                    if (detachFromOldModel) {
                        delete wp.modelContext.paths[wp.pathId];
                    }
                    if (!result.models) {
                        result.models = {};
                    }
                    var modelId = MakerJs.model.getSimilarModelId(result, wp.pathId);
                    result.models[modelId] = MakerJs.model.moveRelative(new MakerJs.models.BezierCurve(wp.pathContext), wp.offset);
                }
                else {
                    var newPath;
                    if (detachFromOldModel) {
                        newPath = wp.pathContext;
                        delete wp.modelContext.paths[wp.pathId];
                    }
                    else {
                        newPath = MakerJs.path.clone(wp.pathContext);
                    }
                    var pathId = MakerJs.model.getSimilarPathId(result, wp.pathId);
                    result.paths[pathId] = MakerJs.path.moveRelative(newPath, wp.offset);
                }
            }
            return result;
        }
        chain.toNewModel = toNewModel;
        /**
         * @private
         */
        function removeDuplicateEnds(endless, points) {
            if (!endless || points.length < 2)
                return;
            if (MakerJs.measure.isPointEqual(points[0], points[points.length - 1], .00001)) {
                points.pop();
            }
        }
        /**
         * Get points along a chain of paths.
         *
         * @param chainContext Chain of paths to get points from.
         * @param distance Numeric distance along the chain between points, or numeric array of distances along the chain between each point.
         * @param maxPoints Maximum number of points to retrieve.
         * @returns Array of points which are on the chain spread at a uniform interval.
         */
        function toPoints(chainContext, distanceOrDistances, maxPoints) {
            var result = [];
            var di = 0;
            var t = 0;
            var distanceArray;
            if (Array.isArray(distanceOrDistances)) {
                distanceArray = distanceOrDistances;
            }
            for (var i = 0; i < chainContext.links.length; i++) {
                var link = chainContext.links[i];
                var wp = link.walkedPath;
                var len = link.pathLength;
                while (MakerJs.round(len - t) > 0) {
                    var r = t / len;
                    if (link.reversed) {
                        r = 1 - r;
                    }
                    result.push(MakerJs.point.add(MakerJs.point.middle(wp.pathContext, r), wp.offset));
                    if (maxPoints && result.length >= maxPoints)
                        return result;
                    var distance;
                    if (distanceArray) {
                        distance = distanceArray[di];
                        di++;
                        if (di > distanceArray.length) {
                            return result;
                        }
                    }
                    else {
                        distance = distanceOrDistances;
                    }
                    t += distance;
                }
                t -= len;
            }
            removeDuplicateEnds(chainContext.endless, result);
            return result;
        }
        chain.toPoints = toPoints;
        /**
         * Get key points (a minimal a number of points) along a chain of paths.
         *
         * @param chainContext Chain of paths to get points from.
         * @param maxArcFacet The maximum length between points on an arc or circle.
         * @returns Array of points which are on the chain.
         */
        function toKeyPoints(chainContext, maxArcFacet) {
            var result = [];
            for (var i = 0; i < chainContext.links.length; i++) {
                var link = chainContext.links[i];
                var wp = link.walkedPath;
                var keyPoints = MakerJs.path.toKeyPoints(wp.pathContext, maxArcFacet);
                if (keyPoints.length > 0) {
                    if (link.reversed) {
                        keyPoints.reverse();
                    }
                    if (i > 0) {
                        keyPoints.shift();
                    }
                    var offsetPathPoints = keyPoints.map(function (p) { return MakerJs.point.add(p, wp.offset); });
                    result.push.apply(result, offsetPathPoints);
                }
            }
            removeDuplicateEnds(chainContext.endless, result);
            return result;
        }
        chain.toKeyPoints = toKeyPoints;
    })(chain = MakerJs.chain || (MakerJs.chain = {}));
})(MakerJs || (MakerJs = {}));
var MakerJs;
(function (MakerJs) {
    var model;
    (function (model) {
        /**
         * @private
         */
        function getOpposedLink(linkedPaths, pathContext) {
            if (linkedPaths[0].path === pathContext) {
                return linkedPaths[1];
            }
            return linkedPaths[0];
        }
        /**
         * @private
         */
        function getFirstPathFromModel(modelContext) {
            if (!modelContext.paths)
                return null;
            for (var pathId in modelContext.paths) {
                return modelContext.paths[pathId];
            }
            return null;
        }
        /**
         * @private
         */
        function collectLoop(loop, loops, detach) {
            loops.push(loop);
            if (detach) {
                detachLoop(loop);
            }
        }
        /**
         * @private
         */
        function follow(connections, loops, detach) {
            //for a given point, follow the paths that connect to each other to form loops
            for (var i = 0; i < connections.collections.length; i++) {
                var linkedPaths = connections.collections[i].items;
                if (linkedPaths && linkedPaths.length > 0) {
                    var loopModel = {
                        paths: {},
                        insideCount: 0
                    };
                    var firstLink = linkedPaths[0];
                    var currLink = firstLink;
                    while (true) {
                        var currPath = currLink.path;
                        currPath.reversed = currLink.reversed;
                        var id = model.getSimilarPathId(loopModel, currPath.pathId);
                        loopModel.paths[id] = currPath;
                        var items = connections.findCollection(currLink.nextConnection);
                        if (!items || items.length == 0)
                            break;
                        var nextLink = getOpposedLink(items, currLink.path);
                        //remove the first 2 items, which should be currlink and nextlink
                        items.splice(0, 2);
                        if (!nextLink)
                            break;
                        currLink = nextLink;
                        if (currLink.path === firstLink.path) {
                            //loop is closed
                            collectLoop(loopModel, loops, detach);
                            break;
                        }
                    }
                }
            }
        }
        /**
         * Find paths that have common endpoints and form loops.
         *
         * @param modelContext The model to search for loops.
         * @param options Optional options object.
         * @returns A new model with child models ranked according to their containment within other found loops. The paths of models will be IPathDirectionalWithPrimeContext.
         */
        function findLoops(modelContext, options) {
            var loops = [];
            var result = { models: {} };
            var opts = {
                pointMatchingDistance: .005
            };
            MakerJs.extendObject(opts, options);
            function spin(callback) {
                for (var i = 0; i < loops.length; i++) {
                    callback(loops[i]);
                }
            }
            function getModelByDepth(depth) {
                var id = depth.toString();
                if (!(id in result.models)) {
                    var newModel = { models: {} };
                    result.models[id] = newModel;
                }
                return result.models[id];
            }
            function comparePoint(pointA, pointB) {
                var distance = MakerJs.measure.pointDistance(pointA, pointB);
                return distance <= opts.pointMatchingDistance;
            }
            var connections = new MakerJs.Collector(comparePoint);
            //todo: remove dead ends first
            model.originate(modelContext);
            //find loops by looking at all paths in this model
            var walkOptions = {
                onPath: function (walkedPath) {
                    var safePath = MakerJs.path.clone(walkedPath.pathContext);
                    safePath.pathId = walkedPath.pathId;
                    safePath.modelContext = modelContext;
                    //circles are loops by nature
                    if (safePath.type == MakerJs.pathType.Circle || (safePath.type == MakerJs.pathType.Arc && MakerJs.angle.ofArcSpan(walkedPath.pathContext) == 360)) {
                        var loopModel = {
                            paths: {},
                            insideCount: 0
                        };
                        loopModel.paths[walkedPath.pathId] = safePath;
                        collectLoop(loopModel, loops, opts.removeFromOriginal);
                    }
                    else {
                        //gather both endpoints from all non-circle segments
                        safePath.endPoints = MakerJs.point.fromPathEnds(safePath);
                        //don't add lines which are shorter than the tolerance
                        if (safePath.type == MakerJs.pathType.Line) {
                            var distance = MakerJs.measure.pointDistance(safePath.endPoints[0], safePath.endPoints[1]);
                            if (distance < opts.pointMatchingDistance) {
                                return;
                            }
                        }
                        for (var i = 2; i--;) {
                            var linkedPath = {
                                path: safePath,
                                nextConnection: safePath.endPoints[1 - i],
                                reversed: i != 0
                            };
                            connections.addItemToCollection(safePath.endPoints[i], linkedPath);
                        }
                    }
                }
            };
            model.walk(modelContext, walkOptions);
            //follow paths to find loops
            follow(connections, loops, opts.removeFromOriginal);
            //now we have all loops, we need to see which are inside of each other
            spin(function (firstLoop) {
                var firstPath = getFirstPathFromModel(firstLoop);
                if (!firstPath)
                    return;
                spin(function (secondLoop) {
                    if (firstLoop === secondLoop)
                        return;
                    if (MakerJs.measure.isPointInsideModel(MakerJs.point.middle(firstPath), secondLoop)) {
                        firstLoop.insideCount++;
                    }
                });
            });
            //now we can group similar loops by their nested level
            spin(function (loop) {
                var depthModel = getModelByDepth(loop.insideCount);
                var id = model.countChildModels(depthModel).toString();
                delete loop.insideCount;
                depthModel.models[id] = loop;
            });
            return result;
        }
        model.findLoops = findLoops;
        /**
         * Remove all paths in a loop model from the model(s) which contained them.
         *
         * @param loopToDetach The model to search for loops.
         */
        function detachLoop(loopToDetach) {
            for (var id in loopToDetach.paths) {
                var pathDirectionalWithOriginalContext = loopToDetach.paths[id];
                var primeModel = pathDirectionalWithOriginalContext.modelContext;
                if (primeModel && primeModel.paths && pathDirectionalWithOriginalContext.pathId) {
                    delete primeModel.paths[pathDirectionalWithOriginalContext.pathId];
                }
            }
        }
        model.detachLoop = detachLoop;
        /**
         * @private
         */
        var DeadEndFinder = (function () {
            function DeadEndFinder(pointMatchingDistance, keep, trackDeleted) {
                this.pointMatchingDistance = pointMatchingDistance;
                this.keep = keep;
                this.trackDeleted = trackDeleted;
                pointMatchingDistance = pointMatchingDistance || .005;
                function comparePoint(pointA, pointB) {
                    var distance = MakerJs.measure.pointDistance(pointA, pointB);
                    return distance <= pointMatchingDistance;
                }
                this.pointMap = new MakerJs.Collector(comparePoint);
            }
            DeadEndFinder.prototype.removePathRef = function (pathRef, reason) {
                var _this = this;
                var removePath = function (p) {
                    var pathRefs = _this.pointMap.findCollection(p);
                    for (var i = 0; i < pathRefs.length; i++) {
                        if (pathRefs[i] === pathRef) {
                            pathRefs.splice(i, 1);
                            return;
                        }
                    }
                };
                for (var i = 2; i--;) {
                    removePath(pathRef.endPoints[i]);
                }
                delete pathRef.modelContext.paths[pathRef.pathId];
                if (this.trackDeleted) {
                    this.trackDeleted(pathRef, reason);
                }
            };
            DeadEndFinder.prototype.removeDeadEnd = function (baseCount) {
                var _this = this;
                var found = 0;
                for (var i = 0; i < this.pointMap.collections.length; i++) {
                    var pathRefs = this.pointMap.collections[i].items;
                    if (pathRefs.length % 2 == 0)
                        continue;
                    if (pathRefs.length == 1) {
                        this.removePathRef(pathRefs[0], "dead end " + (baseCount + found));
                        found++;
                    }
                    else if (this.keep) {
                        //allow caller to decide to keep each path
                        pathRefs.forEach(function (pathRef) {
                            if (!_this.keep(pathRef)) {
                                _this.removePathRef(pathRef, "not keeping");
                                found++;
                            }
                        });
                    }
                }
                return found;
            };
            return DeadEndFinder;
        }());
        /**
         * Remove paths from a model which have endpoints that do not connect to other paths.
         *
         * @param modelContext The model to search for dead ends.
         * @param pointMatchingDistance Optional max distance to consider two points as the same.
         * @param keep Optional callback function (which should return a boolean) to decide if a dead end path should be kept instead.
         * @param trackDeleted Optional callback function which will log discarded paths and the reason they were discarded.
         * @returns The input model (for cascading).
         */
        function removeDeadEnds(modelContext, pointMatchingDistance, keep, trackDeleted) {
            var deadEndFinder = new DeadEndFinder(pointMatchingDistance, keep, trackDeleted);
            var walkOptions = {
                onPath: function (walkedPath) {
                    var endPoints = MakerJs.point.fromPathEnds(walkedPath.pathContext, walkedPath.offset);
                    if (!endPoints)
                        return;
                    var pathRef = walkedPath;
                    pathRef.endPoints = endPoints;
                    for (var i = 2; i--;) {
                        deadEndFinder.pointMap.addItemToCollection(endPoints[i], pathRef);
                    }
                }
            };
            model.walk(modelContext, walkOptions);
            var total = 0;
            var pass = 0;
            while (pass = deadEndFinder.removeDeadEnd(total)) {
                total += pass;
            }
            return modelContext;
        }
        model.removeDeadEnds = removeDeadEnds;
    })(model = MakerJs.model || (MakerJs.model = {}));
})(MakerJs || (MakerJs = {}));
var MakerJs;
(function (MakerJs) {
    var exporter;
    (function (exporter) {
        /**
         * Class for an XML tag.
         * @private
         */
        var XmlTag = (function () {
            /**
             * @param name Name of the XML tag.
             * @param attrs Optional attributes for the tag.
             */
            function XmlTag(name, attrs) {
                this.name = name;
                this.attrs = attrs;
                /**
                 * Text between the opening and closing tags.
                 */
                this.innerText = '';
            }
            /**
             * Escapes certain characters within a string so that it can appear in a tag or its attribute.
             *
             * @returns Escaped string.
             */
            XmlTag.escapeString = function (value) {
                var escape = {
                    '&': '&amp;',
                    '<': '&lt;',
                    '>': '&gt;',
                    '"': '&quot;'
                };
                for (var code in escape) {
                    //.split then .join is a 'replace'
                    value = value.split(code).join(escape[code]);
                }
                return value;
            };
            /**
             * Get the opening tag.
             *
             * @param selfClose Flag to determine if opening tag should be self closing.
             */
            XmlTag.prototype.getOpeningTag = function (selfClose) {
                var attrs = '';
                function outputAttr(attrName, attrValue) {
                    if (attrValue == null || typeof attrValue === 'undefined')
                        return;
                    if (Array.isArray(attrValue) || typeof attrValue === 'object') {
                        attrValue = JSON.stringify(attrValue);
                    }
                    if (typeof attrValue === 'string') {
                        attrValue = XmlTag.escapeString(attrValue);
                    }
                    attrs += ' ' + attrName + '="' + attrValue + '"';
                }
                for (var name in this.attrs) {
                    outputAttr(name, this.attrs[name]);
                }
                return '<' + this.name + attrs + (selfClose ? '/' : '') + '>';
            };
            /**
             * Get the inner text.
             */
            XmlTag.prototype.getInnerText = function () {
                if (this.innerTextEscaped) {
                    return this.innerText;
                }
                else {
                    return XmlTag.escapeString(this.innerText);
                }
            };
            /**
             * Get the closing tag.
             */
            XmlTag.prototype.getClosingTag = function () {
                return '</' + this.name + '>';
            };
            /**
             * Output the entire tag as a string.
             */
            XmlTag.prototype.toString = function () {
                var selfClose = !this.innerText;
                if (selfClose && !this.closingTags) {
                    return this.getOpeningTag(true);
                }
                else {
                    return this.getOpeningTag(false) + this.getInnerText() + this.getClosingTag();
                }
            };
            return XmlTag;
        }());
        exporter.XmlTag = XmlTag;
    })(exporter = MakerJs.exporter || (MakerJs.exporter = {}));
})(MakerJs || (MakerJs = {}));
var MakerJs;
(function (MakerJs) {
    var exporter;
    (function (exporter) {
        /**
         * @private
         */
        function wrap(prefix, content, condition) {
            if (condition) {
                return prefix + '(' + content + ')';
            }
            else {
                return content;
            }
        }
        /**
         * @private
         */
        function facetSizeToResolution(arcOrCircle, facetSize) {
            if (!facetSize)
                return;
            var circle = new MakerJs.paths.Circle([0, 0], arcOrCircle.radius);
            var length = MakerJs.measure.pathLength(circle);
            if (!length)
                return;
            return length / facetSize;
        }
        /**
         * @private
         */
        function pathsToOpenJsCad(modelContext, facetSize) {
            var head = '';
            var tail = '';
            var first = true;
            var exit = false;
            var reverseTail = false;
            var beginMap = {};
            beginMap[MakerJs.pathType.Circle] = function (circle, dirPath) {
                var circleOptions = {
                    center: MakerJs.point.rounded(circle.origin),
                    radius: circle.radius,
                    resolution: facetSizeToResolution(circle, facetSize)
                };
                head = wrap('CAG.circle', JSON.stringify(circleOptions), true);
                exit = true;
            };
            beginMap[MakerJs.pathType.Line] = function (line, dirPath) {
                head = wrap('new CSG.Path2D', JSON.stringify(dirPath.reversed ? [dirPath.endPoints[1], dirPath.endPoints[0]] : dirPath.endPoints), true);
            };
            beginMap[MakerJs.pathType.Arc] = function (arc, dirPath) {
                var endAngle = MakerJs.angle.ofArcEnd(arc);
                if (dirPath.reversed) {
                    reverseTail = true;
                }
                var arcOptions = {
                    center: MakerJs.point.rounded(arc.origin),
                    radius: arc.radius,
                    startangle: arc.startAngle,
                    endangle: endAngle,
                    resolution: facetSizeToResolution(arc, facetSize)
                };
                head = wrap('new CSG.Path2D.arc', JSON.stringify(arcOptions), true);
            };
            var appendMap = {};
            appendMap[MakerJs.pathType.Line] = function (line, dirPath) {
                var reverse = (reverseTail != dirPath.reversed);
                var endPoint = MakerJs.point.rounded(dirPath.endPoints[reverse ? 0 : 1]);
                append(wrap('.appendPoint', JSON.stringify(endPoint), true));
            };
            appendMap[MakerJs.pathType.Arc] = function (arc, dirPath) {
                var reverse = (reverseTail != dirPath.reversed);
                var endAngle = MakerJs.angle.ofArcEnd(arc);
                var arcOptions = {
                    radius: arc.radius,
                    clockwise: reverse,
                    large: Math.abs(endAngle - arc.startAngle) > 180,
                    resolution: facetSizeToResolution(arc, facetSize)
                };
                var endPoint = MakerJs.point.rounded(dirPath.endPoints[reverse ? 0 : 1]);
                append(wrap('.appendArc', JSON.stringify(endPoint) + ',' + JSON.stringify(arcOptions), true));
            };
            function append(s) {
                if (reverseTail) {
                    tail = s + tail;
                }
                else {
                    tail += s;
                }
            }
            for (var pathId in modelContext.paths) {
                var pathContext = modelContext.paths[pathId];
                var fn = first ? beginMap[pathContext.type] : appendMap[pathContext.type];
                if (fn) {
                    fn(pathContext, pathContext);
                }
                if (exit) {
                    return head;
                }
                first = false;
            }
            return head + tail + '.close().innerToCAG()';
        }
        /**
         * Creates a string of JavaScript code for execution with the OpenJsCad engine.
         *
         * @param modelToExport Model object to export.
         * @param options Export options object.
         * @param options.extrusion Height of 3D extrusion.
         * @param options.resolution Size of facets.
         * @returns String of JavaScript containing a main() function for OpenJsCad.
         */
        function toOpenJsCad(itemToExport, options) {
            if (!itemToExport)
                return '';
            var modelToExport;
            var all = '';
            var depth = 0;
            var depthModel;
            var opts = {
                extrusion: 1,
                pointMatchingDistance: .005,
                functionName: 'main'
            };
            MakerJs.extendObject(opts, options);
            if (MakerJs.isModel(itemToExport)) {
                modelToExport = itemToExport;
            }
            else {
                if (Array.isArray(itemToExport)) {
                    modelToExport = { paths: {} };
                    itemToExport.forEach(function (p, i) { return modelToExport.paths[i] = p; });
                }
                else {
                    modelToExport = { paths: { 0: itemToExport } };
                }
            }
            if (modelToExport.exporterOptions) {
                MakerJs.extendObject(opts, modelToExport.exporterOptions['toOpenJsCad']);
            }
            //pass options back into calling object
            MakerJs.extendObject(options, opts);
            if (opts && opts.modelMap) {
                all = exportFromOptionsMap(modelToExport, opts.modelMap);
            }
            if (!all) {
                var result = [];
                var loops = MakerJs.model.findLoops(modelToExport, opts);
                while (depthModel = loops.models[depth]) {
                    var union = '';
                    for (var modelId in depthModel.models) {
                        var subModel = depthModel.models[modelId];
                        union += wrap('.union', pathsToOpenJsCad(subModel, opts.facetSize), union);
                    }
                    var operator = (depth % 2 == 0) ? '.union' : '.subtract';
                    result.push(wrap(operator, union, result.length));
                    depth++;
                }
                var extrudeOptions = { offset: [0, 0, opts.extrusion] };
                result.push(wrap('.extrude', JSON.stringify(extrudeOptions), true));
                all = 'return ' + result.join('');
            }
            return 'function ' + opts.functionName + '(){' + all + ';}';
        }
        exporter.toOpenJsCad = toOpenJsCad;
        function exportFromOptionsMap(modelToExport, optionsMap) {
            if (!modelToExport.models)
                return;
            var result = [];
            var union = [];
            var i = 0;
            for (var key in optionsMap) {
                var fName = 'f' + i;
                var options = optionsMap[key];
                options.functionName = fName;
                var childModel = modelToExport.models[key];
                if (childModel) {
                    result.push(toOpenJsCad(childModel, options));
                    union.push('(' + fName + '())');
                }
                i++;
            }
            if (!result.length)
                return;
            result.push('return ' + union.join('.union'));
            return result.join(' ');
        }
        /**
         * Executes a JavaScript string with the OpenJsCad engine - converts 2D to 3D.
         *
         * @param modelToExport Model object to export.
         * @param options Export options object.
         * @param options.extrusion Height of 3D extrusion.
         * @param options.resolution Size of facets.
         * @returns String of STL format of 3D object.
         */
        function toSTL(modelToExport, options) {
            if (options === void 0) { options = {}; }
            if (!modelToExport)
                return '';
            var container;
            switch (MakerJs.environment) {
                case MakerJs.environmentTypes.BrowserUI:
                    if (!('CAG' in window) || !('CSG' in window)) {
                        throw "OpenJsCad library not found. Download http://maker.js.org/external/OpenJsCad/csg.js and http://maker.js.org/external/OpenJsCad/formats.js to your website and add script tags.";
                    }
                    container = window;
                    break;
                case MakerJs.environmentTypes.NodeJs:
                    //this can throw if not found
                    container = require('openjscad-csg');
                    break;
                case MakerJs.environmentTypes.WebWorker:
                    if (!('CAG' in self) || !('CSG' in self)) {
                        throw "OpenJsCad library not found. Download http://maker.js.org/external/OpenJsCad/csg.js and http://maker.js.org/external/OpenJsCad/formats.js to your website and add an importScripts statement.";
                    }
                    container = self;
                    break;
            }
            var script = toOpenJsCad(modelToExport, options);
            script += 'return ' + options.functionName + '();';
            var f = new Function('CAG', 'CSG', script);
            var csg = f(container.CAG, container.CSG);
            return csg.toStlString();
        }
        exporter.toSTL = toSTL;
    })(exporter = MakerJs.exporter || (MakerJs.exporter = {}));
})(MakerJs || (MakerJs = {}));
var MakerJs;
(function (MakerJs) {
    var exporter;
    (function (exporter) {
        /**
         * Injects drawing into a PDFKit document.
         *
         * @param modelToExport Model object to export.
         * @param options Export options object.
         * @returns String of PDF file contents.
         */
        function toPDF(doc, modelToExport, options) {
            if (!modelToExport)
                return;
            //fixup options
            var opts = {
                origin: [0, 0],
                stroke: "#000"
            };
            MakerJs.extendObject(opts, options);
            //try to get the unit system from the itemToExport
            var scale = 1;
            var exportUnits = opts.units || modelToExport.units;
            if (exportUnits) {
                //convert to inch
                scale = MakerJs.units.conversionScale(exportUnits, MakerJs.unitType.Inch);
            }
            else {
                //assume pixels, convert to inch
                scale = 1 / 100;
            }
            //from inch to PDF PPI
            scale *= 72;
            //TODO scale each element without a whole clone
            var scaledModel = MakerJs.model.scale(MakerJs.cloneObject(modelToExport), scale);
            var size = MakerJs.measure.modelExtents(scaledModel);
            var left = -size.low[0];
            var offset = [left, size.high[1]];
            offset = MakerJs.point.add(offset, options.origin);
            MakerJs.model.findChains(scaledModel, function (chains, loose, layer) {
                function single(walkedPath) {
                    var pathData = exporter.pathToSVGPathData(walkedPath.pathContext, walkedPath.offset, offset);
                    doc.path(pathData).stroke(opts.stroke);
                }
                chains.map(function (chain) {
                    if (chain.links.length > 1) {
                        var pathData = exporter.chainToSVGPathData(chain, offset);
                        doc.path(pathData).stroke(opts.stroke);
                    }
                    else {
                        var walkedPath = chain.links[0].walkedPath;
                        if (walkedPath.pathContext.type === MakerJs.pathType.Circle) {
                            var fixedPath;
                            MakerJs.path.moveTemporary([walkedPath.pathContext], [walkedPath.offset], function () {
                                fixedPath = MakerJs.path.mirror(walkedPath.pathContext, false, true);
                            });
                            MakerJs.path.moveRelative(fixedPath, offset);
                            //TODO use only chainToSVGPathData instead of circle, so that we can use fill
                            doc.circle(fixedPath.origin[0], fixedPath.origin[1], walkedPath.pathContext.radius).stroke(opts.stroke);
                        }
                        else {
                            single(walkedPath);
                        }
                    }
                });
                loose.map(single);
            }, { byLayers: false });
        }
        exporter.toPDF = toPDF;
    })(exporter = MakerJs.exporter || (MakerJs.exporter = {}));
})(MakerJs || (MakerJs = {}));
var MakerJs;
(function (MakerJs) {
    var exporter;
    (function (exporter) {
        /**
         * @private
         */
        var chainLinkToPathDataMap = {};
        chainLinkToPathDataMap[MakerJs.pathType.Arc] = function (arc, endPoint, reversed, d, accuracy) {
            d.push('A');
            svgArcData(d, arc.radius, endPoint, accuracy, MakerJs.angle.ofArcSpan(arc) > 180, reversed ? (arc.startAngle > arc.endAngle) : (arc.startAngle < arc.endAngle));
        };
        chainLinkToPathDataMap[MakerJs.pathType.Line] = function (line, endPoint, reversed, d, accuracy) {
            d.push('L', MakerJs.round(endPoint[0], accuracy), MakerJs.round(endPoint[1], accuracy));
        };
        chainLinkToPathDataMap[MakerJs.pathType.BezierSeed] = function (seed, endPoint, reversed, d, accuracy) {
            svgBezierData(d, seed, accuracy, reversed);
        };
        /**
         * @private
         */
        function svgCoords(p) {
            return MakerJs.point.mirror(p, false, true);
        }
        /**
         * Convert a chain to SVG path data.
         *
         * @param chain Chain to convert.
         * @param offset IPoint relative offset point.
         * @param accuracy Optional accuracy of SVG path data.
         * @returns String of SVG path data.
         */
        function chainToSVGPathData(chain, offset, accuracy) {
            function offsetPoint(p) {
                return MakerJs.point.add(p, offset);
            }
            var first = chain.links[0];
            var firstPoint = offsetPoint(svgCoords(first.endPoints[first.reversed ? 1 : 0]));
            var d = ['M', MakerJs.round(firstPoint[0], accuracy), MakerJs.round(firstPoint[1], accuracy)];
            for (var i = 0; i < chain.links.length; i++) {
                var link = chain.links[i];
                var pathContext = link.walkedPath.pathContext;
                var fn = chainLinkToPathDataMap[pathContext.type];
                if (fn) {
                    var fixedPath;
                    MakerJs.path.moveTemporary([pathContext], [link.walkedPath.offset], function () {
                        fixedPath = MakerJs.path.mirror(pathContext, false, true);
                    });
                    MakerJs.path.moveRelative(fixedPath, offset);
                    fn(fixedPath, offsetPoint(svgCoords(link.endPoints[link.reversed ? 0 : 1])), link.reversed, d, accuracy);
                }
            }
            if (chain.endless) {
                d.push('Z');
            }
            return d.join(' ');
        }
        exporter.chainToSVGPathData = chainToSVGPathData;
        /**
         * @private
         */
        function startSvgPathData(start, d, accuracy) {
            return ["M", MakerJs.round(start[0], accuracy), MakerJs.round(start[1], accuracy)].concat(d);
        }
        /**
         * @private
         */
        var svgPathDataMap = {};
        svgPathDataMap[MakerJs.pathType.Line] = function (line, accuracy) {
            return startSvgPathData(line.origin, MakerJs.point.rounded(line.end, accuracy), accuracy);
        };
        svgPathDataMap[MakerJs.pathType.Circle] = function (circle, accuracy, clockwiseCircle) {
            return startSvgPathData(circle.origin, svgCircleData(circle.radius, accuracy, clockwiseCircle), accuracy);
        };
        svgPathDataMap[MakerJs.pathType.Arc] = function (arc, accuracy) {
            var arcPoints = MakerJs.point.fromArc(arc);
            if (MakerJs.measure.isPointEqual(arcPoints[0], arcPoints[1])) {
                return svgPathDataMap[MakerJs.pathType.Circle](arc, accuracy);
            }
            else {
                var d = ['A'];
                svgArcData(d, arc.radius, arcPoints[1], accuracy, MakerJs.angle.ofArcSpan(arc) > 180, arc.startAngle > arc.endAngle);
                return startSvgPathData(arcPoints[0], d, accuracy);
            }
        };
        svgPathDataMap[MakerJs.pathType.BezierSeed] = function (seed, accuracy) {
            var d = [];
            svgBezierData(d, seed, accuracy);
            return startSvgPathData(seed.origin, d, accuracy);
        };
        /**
         * Export a path to SVG path data.
         *
         * @param pathToExport IPath to export.
         * @param pathOffset IPoint relative offset of the path object.
         * @param exportOffset IPoint relative offset point of the export.
         * @param accuracy Optional accuracy of SVG path data.
         * @param clockwiseCircle Optional flag to use clockwise winding for circles.
         * @returns String of SVG path data.
         */
        function pathToSVGPathData(pathToExport, pathOffset, exportOffset, accuracy, clockwiseCircle) {
            var fn = svgPathDataMap[pathToExport.type];
            if (fn) {
                var fixedPath;
                MakerJs.path.moveTemporary([pathToExport], [pathOffset], function () {
                    fixedPath = MakerJs.path.mirror(pathToExport, false, true);
                });
                MakerJs.path.moveRelative(fixedPath, exportOffset);
                var d = fn(fixedPath, accuracy, clockwiseCircle);
                return d.join(' ');
            }
            return '';
        }
        exporter.pathToSVGPathData = pathToSVGPathData;
        /**
         * @private
         */
        function getPathDataByLayer(modelToExport, offset, options, accuracy) {
            var pathDataByLayer = {};
            options.unifyBeziers = true;
            MakerJs.model.findChains(modelToExport, function (chains, loose, layer) {
                function single(walkedPath, clockwise) {
                    var pathData = pathToSVGPathData(walkedPath.pathContext, walkedPath.offset, offset, accuracy, clockwise);
                    pathDataByLayer[layer].push(pathData);
                }
                pathDataByLayer[layer] = [];
                function doChains(cs, clockwise) {
                    cs.forEach(function (chain) {
                        if (chain.links.length > 1) {
                            var pathData = chainToSVGPathData(chain, offset, accuracy);
                            pathDataByLayer[layer].push(pathData);
                        }
                        else {
                            single(chain.links[0].walkedPath, clockwise);
                        }
                        if (chain.contains) {
                            doChains(chain.contains, !clockwise);
                        }
                    });
                }
                doChains(chains, true);
                loose.forEach(function (wp) { return single(wp); });
            }, options);
            return pathDataByLayer;
        }
        /**
         * Convert a model to SVG path data.
         *
         * @param modelToExport Model to export.
         * @param byLayers_orFindChainsOptions Boolean flag (default true) to return a map of path data by layer, or an IFindChainsOptions object
         * @param origin Optional reference origin.
         * @param accuracy Optional accuracy of SVG decimals.
         * @returns String of SVG path data (if byLayers is false) or an object map of path data by layer .
         */
        function toSVGPathData(modelToExport, byLayers_orFindChainsOptions, origin, accuracy) {
            var findChainsOptions;
            if (byLayers_orFindChainsOptions == undefined) {
                findChainsOptions = {
                    byLayers: true
                };
            }
            else if (typeof byLayers_orFindChainsOptions === 'boolean') {
                findChainsOptions = {
                    byLayers: byLayers_orFindChainsOptions
                };
            }
            var size = MakerJs.measure.modelExtents(modelToExport);
            if (!origin) {
                origin = [-size.low[0], size.high[1]];
            }
            var pathDataArrayByLayer = getPathDataByLayer(modelToExport, origin, findChainsOptions, accuracy);
            var pathDataStringByLayer = {};
            for (var layer in pathDataArrayByLayer) {
                pathDataStringByLayer[layer] = pathDataArrayByLayer[layer].join(' ');
            }
            return findChainsOptions.byLayers ? pathDataStringByLayer : pathDataStringByLayer[''];
        }
        exporter.toSVGPathData = toSVGPathData;
        /**
         * Renders an item in SVG markup.
         *
         * @param itemToExport Item to render: may be a path, an array of paths, or a model object.
         * @param options Rendering options object.
         * @param options.annotate Boolean to indicate that the id's of paths should be rendered as SVG text elements.
         * @param options.origin point object for the rendered reference origin.
         * @param options.scale Number to scale the SVG rendering.
         * @param options.stroke String color of the rendered paths.
         * @param options.strokeWidth String numeric width and optional units of the rendered paths.
         * @param options.units String of the unit system. May be omitted. See makerjs.unitType for possible values.
         * @param options.useSvgPathOnly Boolean to use SVG path elements instead of line, circle etc.
         * @returns String of XML / SVG content.
         */
        function toSVG(itemToExport, options) {
            function append(value, layer, forcePush) {
                if (forcePush === void 0) { forcePush = false; }
                if (!forcePush && typeof layer == "string" && layer.length > 0) {
                    if (!(layer in layers)) {
                        layers[layer] = [];
                    }
                    layers[layer].push(value);
                }
                else {
                    elements.push(value);
                }
            }
            function cssStyle(elOpts) {
                var a = [];
                function push(name, val) {
                    if (val === undefined)
                        return;
                    a.push(name + ':' + val);
                }
                push('stroke', elOpts.stroke);
                push('stroke-width', elOpts.strokeWidth);
                push('fill', elOpts.fill);
                return a.join(';');
            }
            function addSvgAttrs(attrs, elOpts) {
                if (!elOpts)
                    return;
                MakerJs.extendObject(attrs, {
                    "stroke": elOpts.stroke,
                    "stroke-width": elOpts.strokeWidth,
                    "fill": elOpts.fill,
                    "style": elOpts.cssStyle || cssStyle(elOpts)
                });
            }
            function colorLayerOptions(layer) {
                if (opts.layerOptions && opts.layerOptions[layer])
                    return opts.layerOptions[layer];
                if (layer in exporter.colors) {
                    return {
                        stroke: layer
                    };
                }
            }
            function createElement(tagname, attrs, layer, innerText, forcePush) {
                if (innerText === void 0) { innerText = null; }
                if (forcePush === void 0) { forcePush = false; }
                if (tagname !== 'text') {
                    addSvgAttrs(attrs, colorLayerOptions(layer));
                }
                if (!opts.scalingStroke) {
                    attrs['vector-effect'] = 'non-scaling-stroke';
                }
                var tag = new exporter.XmlTag(tagname, attrs);
                tag.closingTags = opts.closingTags;
                if (innerText) {
                    tag.innerText = innerText;
                }
                append(tag.toString(), layer, forcePush);
            }
            function fixPoint(pointToFix) {
                //in DXF Y increases upward. in SVG, Y increases downward
                var pointMirroredY = svgCoords(pointToFix);
                return MakerJs.point.scale(pointMirroredY, opts.scale);
            }
            function fixPath(pathToFix, origin) {
                //mirror creates a copy, so we don't modify the original
                var mirrorY = MakerJs.path.mirror(pathToFix, false, true);
                return MakerJs.path.moveRelative(MakerJs.path.scale(mirrorY, opts.scale), origin);
            }
            //fixup options
            var opts = {
                accuracy: .001,
                annotate: false,
                origin: null,
                scale: 1,
                stroke: "#000",
                strokeLineCap: "round",
                strokeWidth: '0.25mm',
                fill: "none",
                fillRule: "evenodd",
                fontSize: '9pt',
                useSvgPathOnly: true,
                viewBox: true
            };
            MakerJs.extendObject(opts, options);
            var modelToExport;
            var itemToExportIsModel = MakerJs.isModel(itemToExport);
            if (itemToExportIsModel) {
                modelToExport = itemToExport;
                if (modelToExport.exporterOptions) {
                    MakerJs.extendObject(opts, modelToExport.exporterOptions['toSVG']);
                }
            }
            var elements = [];
            var layers = {};
            //measure the item to move it into svg area
            if (itemToExportIsModel) {
                modelToExport = itemToExport;
            }
            else if (Array.isArray(itemToExport)) {
                //issue: this won't handle an array of models
                var paths = {};
                itemToExport.forEach(function (p, i) { paths[i] = p; });
                modelToExport = { paths: paths };
            }
            else if (MakerJs.isPath(itemToExport)) {
                modelToExport = { paths: { modelToMeasure: itemToExport } };
            }
            var size = MakerJs.measure.modelExtents(modelToExport);
            //try to get the unit system from the itemToExport
            if (!opts.units) {
                var unitSystem = exporter.tryGetModelUnits(itemToExport);
                if (unitSystem) {
                    opts.units = unitSystem;
                }
            }
            //convert unit system (if it exists) into SVG's units. scale if necessary.
            var useSvgUnit = exporter.svgUnit[opts.units];
            if (useSvgUnit && opts.viewBox) {
                opts.scale *= useSvgUnit.scaleConversion;
            }
            if (size && !opts.origin) {
                var left = -size.low[0] * opts.scale;
                opts.origin = [left, size.high[1] * opts.scale];
            }
            //also pass back to options parameter
            MakerJs.extendObject(options, opts);
            //begin svg output
            var svgAttrs;
            if (size && opts.viewBox) {
                var width = MakerJs.round(size.width * opts.scale, opts.accuracy);
                var height = MakerJs.round(size.height * opts.scale, opts.accuracy);
                var viewBox = [0, 0, width, height];
                var unit = useSvgUnit ? useSvgUnit.svgUnitType : '';
                svgAttrs = {
                    width: width + unit,
                    height: height + unit,
                    viewBox: viewBox.join(' ')
                };
            }
            var svgTag = new exporter.XmlTag('svg', MakerJs.extendObject(svgAttrs || {}, opts.svgAttrs));
            append(svgTag.getOpeningTag(false));
            var groupAttrs = {
                id: 'svgGroup',
                "stroke-linecap": opts.strokeLineCap,
                "fill-rule": opts.fillRule,
                "font-size": opts.fontSize
            };
            addSvgAttrs(groupAttrs, opts);
            var svgGroup = new exporter.XmlTag('g', groupAttrs);
            append(svgGroup.getOpeningTag(false));
            if (opts.useSvgPathOnly) {
                var findChainsOptions = {
                    byLayers: true
                };
                if (opts.fillRule === 'nonzero') {
                    findChainsOptions.contain = {
                        alternateDirection: true
                    };
                }
                var pathDataByLayer = getPathDataByLayer(modelToExport, opts.origin, findChainsOptions, opts.accuracy);
                for (var layer in pathDataByLayer) {
                    var pathData = pathDataByLayer[layer].join(' ');
                    var attrs = { "d": pathData };
                    if (layer.length > 0) {
                        attrs["id"] = layer;
                    }
                    createElement("path", attrs, layer, null, true);
                }
            }
            else {
                function drawText(id, textPoint, layer) {
                    createElement("text", {
                        "id": id + "_text",
                        "x": MakerJs.round(textPoint[0], opts.accuracy),
                        "y": MakerJs.round(textPoint[1], opts.accuracy)
                    }, layer, id);
                }
                function drawPath(id, x, y, d, layer, route, textPoint) {
                    createElement("path", {
                        "id": id,
                        "data-route": route,
                        "d": ["M", MakerJs.round(x, opts.accuracy), MakerJs.round(y, opts.accuracy)].concat(d).join(" ")
                    }, layer);
                    if (opts.annotate) {
                        drawText(id, textPoint, layer);
                    }
                }
                function circleInPaths(id, center, radius, layer, route) {
                    var d = svgCircleData(radius, opts.accuracy);
                    drawPath(id, center[0], center[1], d, layer, route, center);
                }
                var map = {};
                map[MakerJs.pathType.Line] = function (id, line, origin, layer, route) {
                    var start = line.origin;
                    var end = line.end;
                    createElement("line", {
                        "id": id,
                        "data-route": route,
                        "x1": MakerJs.round(start[0], opts.accuracy),
                        "y1": MakerJs.round(start[1], opts.accuracy),
                        "x2": MakerJs.round(end[0], opts.accuracy),
                        "y2": MakerJs.round(end[1], opts.accuracy)
                    }, layer);
                    if (opts.annotate) {
                        drawText(id, MakerJs.point.middle(line), layer);
                    }
                };
                map[MakerJs.pathType.Circle] = function (id, circle, origin, layer, route) {
                    var center = circle.origin;
                    createElement("circle", {
                        "id": id,
                        "data-route": route,
                        "r": circle.radius,
                        "cx": MakerJs.round(center[0], opts.accuracy),
                        "cy": MakerJs.round(center[1], opts.accuracy)
                    }, layer);
                    if (opts.annotate) {
                        drawText(id, center, layer);
                    }
                };
                map[MakerJs.pathType.Arc] = function (id, arc, origin, layer, route) {
                    var arcPoints = MakerJs.point.fromArc(arc);
                    if (MakerJs.measure.isPointEqual(arcPoints[0], arcPoints[1])) {
                        circleInPaths(id, arc.origin, arc.radius, layer, route);
                    }
                    else {
                        var d = ['A'];
                        svgArcData(d, arc.radius, arcPoints[1], opts.accuracy, MakerJs.angle.ofArcSpan(arc) > 180, arc.startAngle > arc.endAngle);
                        drawPath(id, arcPoints[0][0], arcPoints[0][1], d, layer, route, MakerJs.point.middle(arc));
                    }
                };
                map[MakerJs.pathType.BezierSeed] = function (id, seed, origin, layer, route) {
                    var d = [];
                    svgBezierData(d, seed, opts.accuracy);
                    drawPath(id, seed.origin[0], seed.origin[1], d, layer, route, MakerJs.point.middle(seed));
                };
                function beginModel(id, modelContext) {
                    modelGroup.attrs = { id: id };
                    append(modelGroup.getOpeningTag(false), modelContext.layer);
                }
                function endModel(modelContext) {
                    append(modelGroup.getClosingTag(), modelContext.layer);
                }
                var modelGroup = new exporter.XmlTag('g');
                var walkOptions = {
                    beforeChildWalk: function (walkedModel) {
                        beginModel(walkedModel.childId, walkedModel.childModel);
                        return true;
                    },
                    onPath: function (walkedPath) {
                        var fn = map[walkedPath.pathContext.type];
                        if (fn) {
                            var offset = MakerJs.point.add(fixPoint(walkedPath.offset), opts.origin);
                            fn(walkedPath.pathId, fixPath(walkedPath.pathContext, offset), offset, walkedPath.layer, walkedPath.route);
                        }
                    },
                    afterChildWalk: function (walkedModel) {
                        endModel(walkedModel.childModel);
                    }
                };
                beginModel('0', modelToExport);
                MakerJs.model.walk(modelToExport, walkOptions);
                //export layers as groups
                for (var layer in layers) {
                    var layerGroup = new exporter.XmlTag('g', { id: layer });
                    addSvgAttrs(layerGroup.attrs, colorLayerOptions(layer));
                    for (var i = 0; i < layers[layer].length; i++) {
                        layerGroup.innerText += layers[layer][i];
                    }
                    layerGroup.innerTextEscaped = true;
                    append(layerGroup.toString());
                }
            }
            append(svgGroup.getClosingTag());
            append(svgTag.getClosingTag());
            return elements.join('');
        }
        exporter.toSVG = toSVG;
        /**
         * @private
         */
        function svgCircleData(radius, accuracy, clockwiseCircle) {
            var r = MakerJs.round(radius, accuracy);
            var d = ['m', -r, 0];
            function halfCircle(sign) {
                d.push('a');
                svgArcData(d, r, [2 * r * sign, 0], accuracy, false, !clockwiseCircle);
            }
            halfCircle(1);
            halfCircle(-1);
            d.push('z');
            return d;
        }
        /**
         * @private
         */
        function svgBezierData(d, seed, accuracy, reversed) {
            if (seed.controls.length === 1) {
                d.push('Q', MakerJs.round(seed.controls[0][0], accuracy), MakerJs.round(seed.controls[0][1], accuracy));
            }
            else {
                var controls = reversed ? [seed.controls[1], seed.controls[0]] : seed.controls;
                d.push('C', MakerJs.round(controls[0][0], accuracy), MakerJs.round(controls[0][1], accuracy), MakerJs.round(controls[1][0], accuracy), MakerJs.round(controls[1][1], accuracy));
            }
            var final = reversed ? seed.origin : seed.end;
            d.push(MakerJs.round(final[0], accuracy), MakerJs.round(final[1], accuracy));
        }
        /**
         * @private
         */
        function svgArcData(d, radius, endPoint, accuracy, largeArc, increasing) {
            var r = MakerJs.round(radius, accuracy);
            var end = endPoint;
            d.push(r, r);
            d.push(0); //0 = x-axis rotation
            d.push(largeArc ? 1 : 0); //large arc=1, small arc=0
            d.push(increasing ? 0 : 1); //sweep-flag 0=increasing, 1=decreasing 
            d.push(MakerJs.round(end[0], accuracy), MakerJs.round(end[1], accuracy));
        }
        /**
         * Map of MakerJs unit system to SVG unit system
         */
        exporter.svgUnit = {};
        //SVG Coordinate Systems, Transformations and Units documentation:
        //http://www.w3.org/TR/SVG/coords.html
        //The supported length unit identifiers are: em, ex, px, pt, pc, cm, mm, in, and percentages.
        exporter.svgUnit[MakerJs.unitType.Inch] = { svgUnitType: "in", scaleConversion: 1 };
        exporter.svgUnit[MakerJs.unitType.Millimeter] = { svgUnitType: "mm", scaleConversion: 1 };
        exporter.svgUnit[MakerJs.unitType.Centimeter] = { svgUnitType: "cm", scaleConversion: 1 };
        //Add conversions for all unitTypes
        exporter.svgUnit[MakerJs.unitType.Foot] = { svgUnitType: "in", scaleConversion: 12 };
        exporter.svgUnit[MakerJs.unitType.Meter] = { svgUnitType: "cm", scaleConversion: 100 };
    })(exporter = MakerJs.exporter || (MakerJs.exporter = {}));
})(MakerJs || (MakerJs = {}));
(function (MakerJs) {
    var importer;
    (function (importer) {
        /**
         * Create a model from SVG path data.
         *
         * @param pathData SVG path data.
         * @param options ISVGImportOptions object.
         * @param options.bezierAccuracy Optional accuracy of Bezier curves.
         * @returns An IModel object.
         */
        function fromSVGPathData(pathData, options) {
            if (options === void 0) { options = {}; }
            var result = {};
            function addPath(p) {
                if (!result.paths) {
                    result.paths = {};
                }
                result.paths['p_' + ++pathCount] = p;
            }
            function addModel(m) {
                if (!result.models) {
                    result.models = {};
                }
                result.models['p_' + ++pathCount] = m;
            }
            function getPoint(cmd, offset) {
                if (offset === void 0) { offset = 0; }
                var p = MakerJs.point.mirror([cmd.data[0 + offset], cmd.data[1 + offset]], false, true);
                if (cmd.absolute) {
                    return p;
                }
                else {
                    return MakerJs.point.add(p, cmd.from);
                }
            }
            function lineTo(cmd, end) {
                if (!MakerJs.measure.isPointEqual(cmd.from, end)) {
                    addPath(new MakerJs.paths.Line(cmd.from, end));
                }
                return end;
            }
            var map = {};
            map['M'] = function (cmd) {
                firstPoint = getPoint(cmd);
                return firstPoint;
            };
            map['Z'] = function (cmd) {
                return lineTo(cmd, firstPoint);
            };
            map['H'] = function (cmd) {
                var end = MakerJs.point.clone(cmd.from);
                if (cmd.absolute) {
                    end[0] = cmd.data[0];
                }
                else {
                    end[0] += cmd.data[0];
                }
                return lineTo(cmd, end);
            };
            map['V'] = function (cmd) {
                var end = MakerJs.point.clone(cmd.from);
                //subtract to mirror on y axis: SVG coords
                if (cmd.absolute) {
                    end[1] = -cmd.data[0];
                }
                else {
                    end[1] -= cmd.data[0];
                }
                return lineTo(cmd, end);
            };
            map['L'] = function (cmd) {
                var end = getPoint(cmd);
                return lineTo(cmd, end);
            };
            map['A'] = function (cmd) {
                var rx = cmd.data[0];
                var ry = cmd.data[1];
                var rotation = cmd.data[2];
                var large = cmd.data[3] === 1;
                var decreasing = cmd.data[4] === 1;
                var end = getPoint(cmd, 5);
                var elliptic = rx !== ry;
                //first, rotate so we are dealing with a zero angle x-axis
                var xAxis = new MakerJs.paths.Line(cmd.from, MakerJs.point.rotate(end, rotation, cmd.from));
                //next, un-distort any ellipse back into a circle in terms of x axis
                if (elliptic) {
                    xAxis = MakerJs.path.distort(xAxis, 1, rx / ry);
                }
                //now create an arc, making sure we use the large and decreasing flags
                var arc = new MakerJs.paths.Arc(xAxis.origin, xAxis.end, rx, large, decreasing);
                if (elliptic) {
                    //scale up if radius was insufficient.
                    if (rx < arc.radius) {
                        var scaleUp = arc.radius / rx;
                        rx *= scaleUp;
                        ry *= scaleUp;
                    }
                    //create an elliptical arc, this will re-distort
                    var e = new MakerJs.models.EllipticArc(arc, 1, ry / rx, options.bezierAccuracy);
                    //un-rotate back to where it should be.
                    MakerJs.model.rotate(e, -rotation, cmd.from);
                    addModel(e);
                }
                else {
                    //just use the arc
                    //un-rotate back to where it should be.
                    MakerJs.path.rotate(arc, -rotation, cmd.from);
                    addPath(arc);
                }
                return end;
            };
            map['C'] = function (cmd) {
                var control1 = getPoint(cmd, 0);
                var control2 = getPoint(cmd, 2);
                var end = getPoint(cmd, 4);
                addModel(new MakerJs.models.BezierCurve(cmd.from, control1, control2, end, options.bezierAccuracy));
                return end;
            };
            map['S'] = function (cmd) {
                var control1;
                var prevControl2;
                if (cmd.prev.command === 'C') {
                    prevControl2 = getPoint(cmd.prev, 2);
                    control1 = MakerJs.point.rotate(prevControl2, 180, cmd.from);
                }
                else if (cmd.prev.command === 'S') {
                    prevControl2 = getPoint(cmd.prev, 0);
                    control1 = MakerJs.point.rotate(prevControl2, 180, cmd.from);
                }
                else {
                    control1 = cmd.from;
                }
                var control2 = getPoint(cmd, 0);
                var end = getPoint(cmd, 2);
                addModel(new MakerJs.models.BezierCurve(cmd.from, control1, control2, end, options.bezierAccuracy));
                return end;
            };
            map['Q'] = function (cmd) {
                var control = getPoint(cmd, 0);
                var end = getPoint(cmd, 2);
                addModel(new MakerJs.models.BezierCurve(cmd.from, control, end, options.bezierAccuracy));
                return end;
            };
            map['T'] = function (cmd) {
                var control;
                var prevControl;
                if (cmd.prev.command === 'Q') {
                    prevControl = getPoint(cmd.prev, 0);
                    control = MakerJs.point.rotate(prevControl, 180, cmd.from);
                }
                else if (cmd.prev.command === 'T') {
                    prevControl = getPoint(cmd.prev, 2); //see below *
                    control = MakerJs.point.rotate(prevControl, 180, cmd.from);
                }
                else {
                    control = cmd.from;
                }
                //* save the control point in the data list, will be accessible from index 2
                var p = MakerJs.point.mirror(control, false, true);
                cmd.data.push.apply(cmd.data, p);
                var end = getPoint(cmd, 0);
                addModel(new MakerJs.models.BezierCurve(cmd.from, control, end, options.bezierAccuracy));
                return end;
            };
            var firstPoint = [0, 0];
            var currPoint = [0, 0];
            var pathCount = 0;
            var prevCommand;
            var regexpCommands = /([achlmqstvz])([0-9e\.,\+-\s]*)/ig;
            var commandMatches;
            while ((commandMatches = regexpCommands.exec(pathData)) !== null) {
                if (commandMatches.index === regexpCommands.lastIndex) {
                    regexpCommands.lastIndex++;
                }
                var command = commandMatches[1]; //0 = command and data, 1 = command, 2 = data
                var dataString = commandMatches[2];
                var currCmd = {
                    command: command.toUpperCase(),
                    data: [],
                    from: currPoint,
                    prev: prevCommand
                };
                if (command === currCmd.command) {
                    currCmd.absolute = true;
                }
                currCmd.data = importer.parseNumericList(dataString);
                var fn = map[currCmd.command];
                if (fn) {
                    currPoint = fn(currCmd);
                }
                prevCommand = currCmd;
            }
            return result;
        }
        importer.fromSVGPathData = fromSVGPathData;
    })(importer = MakerJs.importer || (MakerJs.importer = {}));
})(MakerJs || (MakerJs = {}));
var MakerJs;
(function (MakerJs) {
    var layout;
    (function (layout) {
        /**
         * @private
         */
        function getChildPlacement(parentModel, baseline) {
            //measure everything and cache the results
            var atlas = new MakerJs.measure.Atlas(parentModel);
            var measureParent = MakerJs.measure.modelExtents(parentModel, atlas);
            //measure height of the model from the baseline 0
            var parentTop = measureParent.high[1];
            var cpa = [];
            var xMap = {};
            var walkOptions = {
                beforeChildWalk: function (context) {
                    var child = context.childModel;
                    //get cached measurement of the child
                    var m = atlas.modelMap[context.routeKey];
                    if (!m)
                        return;
                    var childMeasure = MakerJs.measure.augment(m);
                    //set a new origin at the x-center and y-baseline of the child
                    MakerJs.model.originate(child, [childMeasure.center[0], parentTop * baseline]);
                    //get the x-center of the child
                    var x = child.origin[0] - measureParent.low[0];
                    xMap[context.childId] = x;
                    //get the x-center of the child as a percentage
                    var xRatio = x / measureParent.width;
                    cpa.push({ childId: context.childId, xRatio: xRatio });
                    //do not walk the grandchildren. This is only for immediate children of the parentModel.
                    return false;
                }
            };
            MakerJs.model.walk(parentModel, walkOptions);
            cpa.sort(function (a, b) { return a.xRatio - b.xRatio; });
            var first = cpa[0];
            var last = cpa[cpa.length - 1];
            var min = first.xRatio;
            var max = last.xRatio;
            var span = max - min;
            cpa.forEach(function (cp) { return cp.xRatio = (cp.xRatio - min) / span; });
            return {
                cpa: cpa,
                firstX: xMap[first.childId],
                lastX: measureParent.width - xMap[last.childId]
            };
        }
        /**
         * @private
         */
        function moveAndRotate(parentModel, cpa, rotate) {
            cpa.forEach(function (cp) {
                var child = parentModel.models[cp.childId];
                //move the child to the new location
                child.origin = cp.origin;
                //rotate the child
                if (rotate)
                    MakerJs.model.rotate(child, cp.angle, cp.origin);
            });
        }
        /**
         * @private
         */
        var onPathMap = {};
        onPathMap[MakerJs.pathType.Arc] = function (arc, reversed, cpa) {
            var arcSpan = MakerJs.angle.ofArcSpan(arc);
            cpa.forEach(function (p) { return p.angle = reversed ? arc.endAngle - p.xRatio * arcSpan - 90 : arc.startAngle + p.xRatio * arcSpan + 90; });
        };
        onPathMap[MakerJs.pathType.Line] = function (line, reversed, cpa) {
            var lineAngle = MakerJs.angle.ofLineInDegrees(line);
            cpa.forEach(function (p) { return p.angle = lineAngle; });
        };
        /**
         * Layout the children of a model along a path.
         * The x-position of each child will be projected onto the path so that the proportion between children is maintained.
         * Each child will be rotated such that it will be perpendicular to the path at the child's x-center.
         *
         * @param parentModel The model containing children to lay out.
         * @param onPath The path on which to lay out.
         * @param baseline Numeric percentage value of vertical displacement from the path. Default is zero.
         * @param reversed Flag to travel along the path in reverse. Default is false.
         * @param contain Flag to contain the children layout within the length of the path. Default is false.
         * @param rotate Flag to rotate the child to perpendicular. Default is true.
         * @returns The parentModel, for cascading.
         */
        function childrenOnPath(parentModel, onPath, baseline, reversed, contain, rotate) {
            if (baseline === void 0) { baseline = 0; }
            if (reversed === void 0) { reversed = false; }
            if (contain === void 0) { contain = false; }
            if (rotate === void 0) { rotate = true; }
            var result = getChildPlacement(parentModel, baseline);
            var cpa = result.cpa;
            var chosenPath = onPath;
            if (contain) {
                //see if we need to clip
                var onPathLength = MakerJs.measure.pathLength(onPath);
                if (result.firstX + result.lastX < onPathLength) {
                    chosenPath = MakerJs.path.clone(onPath);
                    MakerJs.path.alterLength(chosenPath, -result.firstX, true);
                    MakerJs.path.alterLength(chosenPath, -result.lastX);
                }
            }
            cpa.forEach(function (p) { return p.origin = MakerJs.point.middle(chosenPath, reversed ? 1 - p.xRatio : p.xRatio); });
            var fn = onPathMap[chosenPath.type];
            if (fn) {
                fn(chosenPath, reversed, cpa);
            }
            moveAndRotate(parentModel, cpa, rotate);
            return parentModel;
        }
        layout.childrenOnPath = childrenOnPath;
        /**
         * @private
         */
        function miterAngles(points, offsetAngle) {
            var arc = new MakerJs.paths.Arc([0, 0], 0, 0, 0);
            return points.map(function (p, i) {
                var a;
                if (i === 0) {
                    a = MakerJs.angle.ofPointInDegrees(p, points[i + 1]) + 90;
                }
                else if (i === points.length - 1) {
                    a = MakerJs.angle.ofPointInDegrees(points[i - 1], p) + 90;
                }
                else {
                    arc.origin = p;
                    arc.startAngle = MakerJs.angle.ofPointInDegrees(p, points[i + 1]);
                    arc.endAngle = MakerJs.angle.ofPointInDegrees(p, points[i - 1]);
                    a = MakerJs.angle.ofArcMiddle(arc);
                }
                return a + offsetAngle;
            });
        }
        /**
         * Layout the children of a model along a chain.
         * The x-position of each child will be projected onto the chain so that the proportion between children is maintained.
         * The projected positions of the children will become an array of points that approximate the chain.
         * Each child will be rotated such that it will be mitered according to the vertex angles formed by this series of points.
         *
         * @param parentModel The model containing children to lay out.
         * @param onChain The chain on which to lay out.
         * @param baseline Numeric percentage value of vertical displacement from the chain. Default is zero.
         * @param reversed Flag to travel along the chain in reverse. Default is false.
         * @param contain Flag to contain the children layout within the length of the chain. Default is false.
         * @param rotate Flag to rotate the child to mitered angle. Default is true.
         * @returns The parentModel, for cascading.
         */
        function childrenOnChain(parentModel, onChain, baseline, reversed, contain, rotated) {
            if (baseline === void 0) { baseline = 0; }
            if (reversed === void 0) { reversed = false; }
            if (contain === void 0) { contain = false; }
            if (rotated === void 0) { rotated = true; }
            var result = getChildPlacement(parentModel, baseline);
            var cpa = result.cpa;
            var chainLength = onChain.pathLength;
            if (contain)
                chainLength -= result.firstX + result.lastX;
            var absolutes = cpa.map(function (cp) { return (reversed ? 1 - cp.xRatio : cp.xRatio) * chainLength; });
            var relatives;
            if (reversed)
                absolutes.reverse();
            relatives = absolutes.map(function (ab, i) { return Math.abs(ab - (i == 0 ? 0 : absolutes[i - 1])); });
            if (contain) {
                relatives[0] += reversed ? result.lastX : result.firstX;
            }
            else {
                relatives.shift();
            }
            //chain.toPoints always follows the chain in its order, from beginning to end. This is why we needed to contort the points input
            var points = MakerJs.chain.toPoints(onChain, relatives);
            if (points.length < cpa.length) {
                //add last point of chain, since our distances exceeded the chain
                var endLink = onChain.links[onChain.links.length - 1];
                points.push(endLink.endPoints[endLink.reversed ? 0 : 1]);
            }
            if (contain)
                points.shift(); //delete the first point which is the beginning of the chain
            if (reversed)
                points.reverse();
            var angles = miterAngles(points, -90);
            cpa.forEach(function (cp, i) {
                cp.angle = angles[i];
                cp.origin = points[i];
            });
            moveAndRotate(parentModel, cpa, rotated);
            return parentModel;
        }
        layout.childrenOnChain = childrenOnChain;
        /**
         * Layout clones in a radial format.
         *
         * Example:
         * ```
         * //daisy petals
         * var makerjs = require('makerjs');
         *
         * var belt = new makerjs.models.Belt(5, 50, 20);
         *
         * makerjs.model.move(belt, [25, 0]);
         *
         * var petals = makerjs.layout.cloneToRadial(belt, 8, 45);
         *
         * document.write(makerjs.exporter.toSVG(petals));
         * ```
         *
         * @param itemToClone: Either a model or a path object.
         * @param count Number of clones in the radial result.
         * @param angleInDegrees angle of rotation between clones..
         * @returns A new model with clones in a radial format.
         */
        function cloneToRadial(itemToClone, count, angleInDegrees, rotationOrigin) {
            var result = {};
            var add;
            var rotateFn;
            if (MakerJs.isModel(itemToClone)) {
                add = result.models = {};
                rotateFn = MakerJs.model.rotate;
            }
            else {
                add = result.paths = {};
                rotateFn = MakerJs.path.rotate;
            }
            for (var i = 0; i < count; i++) {
                add[i] = rotateFn(MakerJs.cloneObject(itemToClone), i * angleInDegrees, rotationOrigin);
            }
            return result;
        }
        layout.cloneToRadial = cloneToRadial;
        /**
         * @private
         */
        function cloneTo(dimension, itemToClone, count, margin) {
            var result = {};
            var add;
            var measureFn;
            var moveFn;
            if (MakerJs.isModel(itemToClone)) {
                measureFn = MakerJs.measure.modelExtents;
                add = result.models = {};
                moveFn = MakerJs.model.move;
            }
            else {
                measureFn = MakerJs.measure.pathExtents;
                add = result.paths = {};
                moveFn = MakerJs.path.move;
            }
            var m = measureFn(itemToClone);
            var size = m.high[dimension] - m.low[dimension];
            for (var i = 0; i < count; i++) {
                var origin = [0, 0];
                origin[dimension] = i * (size + margin);
                add[i] = moveFn(MakerJs.cloneObject(itemToClone), origin);
            }
            return result;
        }
        /**
         * Layout clones in a column format.
         *
         * Example:
         * ```
         * //Grooves for a finger joint
         * var m = require('makerjs');
         *
         * var dogbone = new m.models.Dogbone(50, 20, 2, -1, false);
         *
         * var grooves = m.layout.cloneToColumn(dogbone, 5, 20);
         *
         * document.write(m.exporter.toSVG(grooves));
         * ```
         *
         * @param itemToClone: Either a model or a path object.
         * @param count Number of clones in the column.
         * @param margin Optional distance between each clone.
         * @returns A new model with clones in a column.
         */
        function cloneToColumn(itemToClone, count, margin) {
            if (margin === void 0) { margin = 0; }
            return cloneTo(1, itemToClone, count, margin);
        }
        layout.cloneToColumn = cloneToColumn;
        /**
         * Layout clones in a row format.
         *
         * Example:
         * ```
         * //Tongue and grooves for a box joint
         * var m = require('makerjs');
         * var tongueWidth = 60;
         * var grooveWidth = 50;
         * var grooveDepth = 30;
         * var groove = new m.models.Dogbone(grooveWidth, grooveDepth, 5, 0, true);
         *
         * groove.paths['leftTongue'] = new m.paths.Line([-tongueWidth / 2, 0], [0, 0]);
         * groove.paths['rightTongue'] = new m.paths.Line([grooveWidth, 0], [grooveWidth + tongueWidth / 2, 0]);
         *
         * var tongueAndGrooves = m.layout.cloneToRow(groove, 3);
         *
         * document.write(m.exporter.toSVG(tongueAndGrooves));
         * ```
         *
         * @param itemToClone: Either a model or a path object.
         * @param count Number of clones in the row.
         * @param margin Optional distance between each clone.
         * @returns A new model with clones in a row.
         */
        function cloneToRow(itemToClone, count, margin) {
            if (margin === void 0) { margin = 0; }
            return cloneTo(0, itemToClone, count, margin);
        }
        layout.cloneToRow = cloneToRow;
        /**
         * Layout clones in a grid format.
         *
         * Example:
         * ```
         * //Grid of squares
         * var m = require('makerjs');
         * var square = new m.models.Square(43);
         * var grid = m.layout.cloneToGrid(square, 5, 5, 7);
         * document.write(m.exporter.toSVG(grid));
         * ```
         *
         * @param itemToClone: Either a model or a path object.
         * @param xCount Number of columns in the grid.
         * @param yCount Number of rows in the grid.
         * @param margin Optional numeric distance between each clone. Can also be a 2 dimensional array of numbers, to specify distances in x and y dimensions.
         * @returns A new model with clones in a grid layout.
         */
        function cloneToGrid(itemToClone, xCount, yCount, margin) {
            var margins = getMargins(margin);
            return cloneToColumn(cloneToRow(itemToClone, xCount, margins[0]), yCount, margins[1]);
        }
        layout.cloneToGrid = cloneToGrid;
        /**
         * @private
         */
        function getMargins(margin) {
            if (Array.isArray(margin)) {
                return margin;
            }
            else {
                return [margin, margin];
            }
        }
        /**
         * @private
         */
        function cloneToAlternatingRows(itemToClone, xCount, yCount, spacingFn) {
            var modelToMeasure;
            if (MakerJs.isModel(itemToClone)) {
                modelToMeasure = itemToClone;
            }
            else {
                modelToMeasure = { paths: { "0": itemToClone } };
            }
            var spacing = spacingFn(modelToMeasure);
            var result = { models: {} };
            for (var i = 0; i < yCount; i++) {
                var i2 = i % 2;
                result.models[i] = MakerJs.model.move(cloneToRow(itemToClone, xCount + i2, spacing.xMargin), [i2 * spacing.x, i * spacing.y]);
            }
            return result;
        }
        /**
         * Layout clones in a brick format. Alternating rows will have an additional item in each row.
         *
         * Examples:
         * ```
         * //Brick wall
         * var m = require('makerjs');
         * var brick = new m.models.RoundRectangle(50, 30, 4);
         * var wall = m.layout.cloneToBrick(brick, 8, 6, 3);
         * document.write(m.exporter.toSVG(wall));
         * ```
         *
         * ```
         * //Fish scales
         * var m = require('makerjs');
         * var arc = new m.paths.Arc([0, 0], 50, 20, 160);
         * var scales = m.layout.cloneToBrick(arc, 8, 20);
         * document.write(m.exporter.toSVG(scales));
         * ```
         *
         * @param itemToClone: Either a model or a path object.
         * @param xCount Number of columns in the brick grid.
         * @param yCount Number of rows in the brick grid.
         * @param margin Optional numeric distance between each clone. Can also be a 2 dimensional array of numbers, to specify distances in x and y dimensions.
         * @returns A new model with clones in a brick layout.
         */
        function cloneToBrick(itemToClone, xCount, yCount, margin) {
            var margins = getMargins(margin);
            function spacing(modelToMeasure) {
                var m = MakerJs.measure.modelExtents(modelToMeasure);
                var xMargin = margins[0] || 0;
                var yMargin = margins[1] || 0;
                return { x: (m.width + xMargin) / -2, y: m.height + yMargin, xMargin: xMargin };
            }
            return cloneToAlternatingRows(itemToClone, xCount, yCount, spacing);
        }
        layout.cloneToBrick = cloneToBrick;
        /**
         * Layout clones in a honeycomb format. Alternating rows will have an additional item in each row.
         *
         * Examples:
         * ```
         * //Honeycomb
         * var m = require('makerjs');
         * var hex = new m.models.Polygon(6, 50, 30);
         * var pattern = m.layout.cloneToHoneycomb(hex, 8, 9, 10);
         * document.write(m.exporter.toSVG(pattern));
         * ```
         *
         * @param itemToClone: Either a model or a path object.
         * @param xCount Number of columns in the honeycomb grid.
         * @param yCount Number of rows in the honeycomb grid.
         * @param margin Optional distance between each clone.
         * @returns A new model with clones in a honeycomb layout.
         */
        function cloneToHoneycomb(itemToClone, xCount, yCount, margin) {
            if (margin === void 0) { margin = 0; }
            function spacing(modelToMeasure) {
                var hex = MakerJs.measure.boundingHexagon(modelToMeasure);
                var width = 2 * MakerJs.solvers.equilateralAltitude(hex.radius);
                var s = width + margin;
                return { x: s / -2, y: MakerJs.solvers.equilateralAltitude(s), xMargin: margin };
            }
            return cloneToAlternatingRows(itemToClone, xCount, yCount, spacing);
        }
        layout.cloneToHoneycomb = cloneToHoneycomb;
    })(layout = MakerJs.layout || (MakerJs.layout = {}));
})(MakerJs || (MakerJs = {}));
var MakerJs;
(function (MakerJs) {
    var models;
    (function (models) {
        /**
         * @private
         */
        var hasLib = false;
        /**
         * @private
         */
        function ensureBezierLib() {
            if (hasLib)
                return;
            try {
                var lib = Bezier.prototype;
                hasLib = true;
            }
            catch (e) {
                throw "Bezier library not found. If you are using Node, try running 'npm install' or if you are in the browser, download http://pomax.github.io/bezierjs/bezier.js to your website and add a script tag.";
            }
        }
        /**
         * @private
         */
        var scratch;
        /**
         * @private
         */
        function getScratch(seed) {
            var points = [seed.origin];
            points.push.apply(points, seed.controls);
            points.push(seed.end);
            var bezierJsPoints = points.map(function (p) {
                var bp = {
                    x: p[0], y: p[1]
                };
                return bp;
            });
            if (!scratch) {
                ensureBezierLib();
                scratch = new Bezier(bezierJsPoints);
            }
            else {
                //invoke the constructor on the same object
                Bezier.apply(scratch, bezierJsPoints);
            }
            return scratch;
        }
        /**
         * @private
         */
        function BezierToSeed(b, range) {
            var points = b.points.map(getIPoint);
            var seed = new BezierSeed(points);
            if (range) {
                seed.parentRange = range;
            }
            return seed;
        }
        /**
         * @private
         */
        function seedToBezier(seed) {
            var coords = [];
            coords.push.apply(coords, seed.origin);
            coords.push.apply(coords, seed.controls[0]);
            if (seed.controls.length > 1) {
                coords.push.apply(coords, seed.controls[1]);
            }
            coords.push.apply(coords, seed.end);
            ensureBezierLib();
            return new Bezier(coords);
        }
        /**
         * @private
         */
        function getExtrema(b) {
            var extrema = b.extrema().values
                .map(function (m) { return MakerJs.round(m); })
                .filter(function (value, index, self) { return self.indexOf(value) === index; })
                .sort();
            if (extrema.length === 0)
                return [0, 1];
            //ensure leading zero
            if (extrema[0] !== 0) {
                extrema.unshift(0);
            }
            //ensure ending 1
            if (extrema[extrema.length - 1] !== 1) {
                extrema.push(1);
            }
            return extrema;
        }
        /**
         * @private
         */
        function getIPoint(p) {
            return [p.x, p.y];
        }
        /**
         * @private
         */
        var TPoint = (function () {
            function TPoint(b, t, offset) {
                this.t = t;
                this.point = MakerJs.point.add(getIPoint(b.get(t)), offset);
            }
            return TPoint;
        }());
        /**
         * @private
         */
        function getError(b, startT, endT, arc, arcReversed) {
            var tSpan = endT - startT;
            function m(ratio) {
                var t = startT + tSpan * ratio;
                var bp = getIPoint(b.get(t));
                var ap = MakerJs.point.middle(arc, arcReversed ? 1 - ratio : ratio);
                return MakerJs.measure.pointDistance(ap, bp);
            }
            return m(0.25) + m(0.75);
        }
        /**
         * @private
         */
        function getLargestArc(b, startT, endT, accuracy) {
            var arc, lastGoodArc;
            var start = new TPoint(b, startT);
            var end = new TPoint(b, endT);
            var upper = end;
            var lower = start;
            var count = 0;
            var test = upper;
            var reversed;
            while (count < 100) {
                var middle = getIPoint(b.get((start.t + test.t) / 2));
                //if the 3 points are linear, this may throw
                try {
                    arc = new MakerJs.paths.Arc(start.point, middle, test.point);
                }
                catch (e) {
                    if (lastGoodArc) {
                        return lastGoodArc;
                    }
                    else {
                        break;
                    }
                }
                //only need to test once to see if this arc is polar / clockwise
                if (reversed === undefined) {
                    reversed = MakerJs.measure.isPointEqual(start.point, MakerJs.point.fromAngleOnCircle(arc.endAngle, arc));
                }
                //now we have a valid arc, measure the error.
                var error = getError(b, startT, test.t, arc, reversed);
                //if error is within accuracy, this becomes the lower
                if (error <= accuracy) {
                    arc.bezierData = {
                        startT: startT,
                        endT: test.t
                    };
                    lower = test;
                    lastGoodArc = arc;
                }
                else {
                    upper = test;
                }
                //exit if lower is the end
                if (lower.t === upper.t || (lastGoodArc && (lastGoodArc !== arc) && (MakerJs.angle.ofArcSpan(arc) - MakerJs.angle.ofArcSpan(lastGoodArc)) < .5)) {
                    return lastGoodArc;
                }
                count++;
                test = new TPoint(b, (lower.t + upper.t) / 2);
            }
            //arc failed, so return a line
            var line = new MakerJs.paths.Line(start.point, test.point);
            line.bezierData = {
                startT: startT,
                endT: test.t
            };
            return line;
        }
        /**
         * @private
         */
        function getArcs(bc, b, accuracy, startT, endT, base) {
            var added = 0;
            var arc;
            while (startT < endT) {
                arc = getLargestArc(b, startT, endT, accuracy);
                //add an arc
                startT = arc.bezierData.endT;
                var len = MakerJs.measure.pathLength(arc);
                if (len < .0001) {
                    continue;
                }
                bc.paths[arc.type + '_' + (base + added)] = arc;
                added++;
            }
            return added;
        }
        /**
         * @private
         * Class for bezier seed.
         */
        var BezierSeed = (function () {
            function BezierSeed() {
                var args = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    args[_i] = arguments[_i];
                }
                this.type = MakerJs.pathType.BezierSeed;
                switch (args.length) {
                    case 1://point array
                        var points = args[0];
                        this.origin = points[0];
                        if (points.length === 3) {
                            this.controls = [points[1]];
                            this.end = points[2];
                        }
                        else if (points.length === 4) {
                            this.controls = [points[1], points[2]];
                            this.end = points[3];
                        }
                        else {
                            this.end = points[1];
                        }
                        break;
                    case 3://quadratic or cubic
                        if (Array.isArray(args[1])) {
                            this.controls = args[1];
                        }
                        else {
                            this.controls = [args[1]];
                        }
                        this.end = args[2];
                        break;
                    case 4://cubic params
                        this.controls = [args[1], args[2]];
                        this.end = args[3];
                        break;
                }
            }
            return BezierSeed;
        }());
        var BezierCurve = (function () {
            function BezierCurve() {
                var args = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    args[_i] = arguments[_i];
                }
                this.type = BezierCurve.typeName;
                var isArrayArg0 = Array.isArray(args[0]);
                switch (args.length) {
                    case 2:
                        if (isArrayArg0) {
                            this.accuracy = args[1];
                        }
                        else {
                            //seed
                            this.seed = args[0];
                            this.accuracy = args[1];
                            break;
                        }
                    //fall through to point array
                    case 1://point array or seed
                        if (isArrayArg0) {
                            var points = args[0];
                            this.seed = new BezierSeed(points);
                        }
                        else {
                            this.seed = args[0];
                        }
                        break;
                    default:
                        switch (args.length) {
                            case 4:
                                if (MakerJs.isPoint(args[3])) {
                                    this.seed = new BezierSeed(args);
                                    break;
                                }
                                else {
                                    this.accuracy = args[3];
                                    //fall through
                                }
                            case 3:
                                if (isArrayArg0) {
                                    this.seed = new BezierSeed(args.slice(0, 3));
                                }
                                break;
                            case 5:
                                this.accuracy = args[4];
                                this.seed = new BezierSeed(args.slice(0, 4));
                                break;
                        }
                        break;
                }
                this.paths = {};
                if (MakerJs.measure.isBezierSeedLinear(this.seed)) {
                    //use a line and exit
                    var line = new MakerJs.paths.Line(MakerJs.point.clone(this.seed.origin), MakerJs.point.clone(this.seed.end));
                    line.bezierData = {
                        startT: 0,
                        endT: 1
                    };
                    this.paths = {
                        "0": line
                    };
                    return;
                }
                var b = seedToBezier(this.seed);
                var extrema = getExtrema(b);
                this.paths = {};
                //use arcs
                if (!this.accuracy) {
                    //get a default accuracy relative to the size of the bezier
                    var len = b.length();
                    //set the default to be a combination of fast rendering and good smoothing.
                    this.accuracy = len / 100;
                }
                var count = 0;
                for (var i = 1; i < extrema.length; i++) {
                    var extremaSpan = extrema[i] - extrema[i - 1];
                    count += getArcs(this, b, this.accuracy * extremaSpan, extrema[i - 1], extrema[i], count);
                }
            }
            BezierCurve.getBezierSeeds = function (curve, options) {
                if (options === void 0) { options = {}; }
                options.shallow = true;
                var seedsByLayer = {};
                function getActualBezierRange(arc, endpoints, offset) {
                    var b = getScratch(curve.seed);
                    var tPoints = [arc.bezierData.startT, arc.bezierData.endT].map(function (t) { return new TPoint(b, t, offset); });
                    var ends = endpoints.slice();
                    //clipped arcs will still have endpoints closer to the original endpoints
                    var endpointDistancetoStart = ends.map(function (e) { return MakerJs.measure.pointDistance(e, tPoints[0].point); });
                    if (endpointDistancetoStart[0] > endpointDistancetoStart[1])
                        ends.reverse();
                    for (var i = 2; i--;) {
                        if (!MakerJs.measure.isPointEqual(ends[i], tPoints[i].point)) {
                            return null;
                        }
                    }
                    return arc.bezierData;
                }
                MakerJs.model.findChains(curve, function (chains, loose, layer) {
                    function addToLayer(pathToAdd, clone) {
                        if (clone === void 0) { clone = false; }
                        if (!seedsByLayer[layer]) {
                            seedsByLayer[layer] = [];
                        }
                        seedsByLayer[layer].push(clone ? MakerJs.path.clone(pathToAdd) : pathToAdd);
                    }
                    function getChainBezierRange(c) {
                        var endLinks = [c.links[0], c.links[c.links.length - 1]];
                        if (endLinks[0].walkedPath.pathContext.bezierData.startT > endLinks[1].walkedPath.pathContext.bezierData.startT) {
                            MakerJs.chain.reverse(c);
                            endLinks.reverse();
                        }
                        var actualBezierRanges = endLinks.map(function (endLink) { return getActualBezierRange(endLink.walkedPath.pathContext, endLink.endPoints, endLink.walkedPath.offset); });
                        var result = {
                            startT: actualBezierRanges[0] ? actualBezierRanges[0].startT : null,
                            endT: actualBezierRanges[1] ? actualBezierRanges[1].endT : null
                        };
                        if (result.startT !== null && result.endT !== null) {
                            return result;
                        }
                        else if (c.links.length > 2) {
                            if (result.startT === null) {
                                //exclude the first from the chain
                                addToLayer(c.links[0].walkedPath.pathContext, true);
                                result.startT = c.links[1].walkedPath.pathContext.bezierData.startT;
                            }
                            if (result.endT === null) {
                                //exclude the last from the chain
                                addToLayer(c.links[c.links.length - 1].walkedPath.pathContext, true);
                                result.endT = c.links[c.links.length - 2].walkedPath.pathContext.bezierData.endT;
                            }
                            return result;
                        }
                        return null;
                    }
                    chains.forEach(function (c) {
                        var range = getChainBezierRange(c);
                        if (range) {
                            var b = getScratch(curve.seed);
                            var piece = b.split(range.startT, range.endT);
                            addToLayer(BezierToSeed(piece));
                        }
                        else {
                            c.links.forEach(function (link) { return addToLayer(link.walkedPath.pathContext, true); });
                        }
                    });
                    loose.forEach(function (wp) {
                        if (wp.pathContext.type === MakerJs.pathType.Line) {
                            //bezier is linear
                            return addToLayer(wp.pathContext, true);
                        }
                        var range = getActualBezierRange(wp.pathContext, MakerJs.point.fromPathEnds(wp.pathContext), wp.offset);
                        if (range) {
                            var b = getScratch(curve.seed);
                            var piece = b.split(range.startT, range.endT);
                            addToLayer(BezierToSeed(piece));
                        }
                        else {
                            addToLayer(wp.pathContext, true);
                        }
                    });
                }, options);
                if (options.byLayers) {
                    return seedsByLayer;
                }
                else {
                    return seedsByLayer[''];
                }
            };
            BezierCurve.computeLength = function (seed) {
                var b = seedToBezier(seed);
                return b.length();
            };
            BezierCurve.computePoint = function (seed, t) {
                var s = getScratch(seed);
                var computedPoint = s.compute(t);
                return getIPoint(computedPoint);
            };
            BezierCurve.typeName = 'BezierCurve';
            return BezierCurve;
        }());
        models.BezierCurve = BezierCurve;
        BezierCurve.metaParameters = [
            {
                title: "points", type: "select", value: [
                    [[100, 0], [-80, -60], [100, 220], [100, 60]],
                    [[0, 0], [100, 0], [100, 100]],
                    [[0, 0], [20, 0], [80, 100], [100, 100]]
                ]
            }
        ];
    })(models = MakerJs.models || (MakerJs.models = {}));
})(MakerJs || (MakerJs = {}));
var MakerJs;
(function (MakerJs) {
    var models;
    (function (models) {
        /**
         * @private
         * Our maximum circular arc span for accurate representation by a cubic curve.
         */
        var maxBezierArcspan = 45;
        /**
         * @private
         */
        function controlYForCircularCubic(arcSpanInRadians) {
            //from http://pomax.github.io/bezierinfo/#circles_cubic
            return 4 * (Math.tan(arcSpanInRadians / 4) / 3);
        }
        /**
         * @private
         */
        function controlPointsForCircularCubic(arc) {
            var arcSpan = MakerJs.angle.ofArcSpan(arc);
            //compute y for radius of 1
            var y = controlYForCircularCubic(MakerJs.angle.toRadians(arcSpan));
            //multiply by radius
            var c1 = [arc.radius, arc.radius * y];
            //get second control point by mirroring, then rotating
            var c2 = MakerJs.point.rotate(MakerJs.point.mirror(c1, false, true), arcSpan, [0, 0]);
            //rotate again to start angle, then offset by arc's origin
            return [c1, c2].map(function (p) { return MakerJs.point.add(arc.origin, MakerJs.point.rotate(p, arc.startAngle, [0, 0])); });
        }
        /**
         * @private
         */
        function bezierSeedFromArc(arc) {
            var span = MakerJs.angle.ofArcSpan(arc);
            if (span <= 90) {
                var endPoints = MakerJs.point.fromPathEnds(arc);
                var controls = controlPointsForCircularCubic(arc);
                return {
                    type: MakerJs.pathType.BezierSeed,
                    origin: endPoints[0],
                    controls: controls,
                    end: endPoints[1]
                };
            }
            return null;
        }
        var Ellipse = (function () {
            function Ellipse() {
                var args = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    args[_i] = arguments[_i];
                }
                var _this = this;
                this.models = {};
                var n = 360 / maxBezierArcspan;
                var accuracy;
                var isPointArgs0 = MakerJs.isPoint(args[0]);
                var realArgs = function (numArgs) {
                    switch (numArgs) {
                        case 2:
                            if (isPointArgs0) {
                                //origin, radius
                                _this.origin = args[0];
                            }
                            break;
                        case 3:
                            //origin, rx, ry
                            _this.origin = args[0];
                            break;
                        case 4:
                            //cx, cy, rx, ry
                            _this.origin = [args[0], args[1]];
                            break;
                    }
                    //construct a bezier approximation for an arc with radius of 1.
                    var a = 360 / n;
                    var arc = new MakerJs.paths.Arc([0, 0], 1, 0, a);
                    //clone and rotate to complete a circle
                    for (var i = 0; i < n; i++) {
                        var seed = bezierSeedFromArc(arc);
                        switch (numArgs) {
                            case 1:
                                //radius
                                seed = MakerJs.path.scale(seed, args[0]);
                                break;
                            case 2:
                                if (isPointArgs0) {
                                    //origin, radius
                                    seed = MakerJs.path.scale(seed, args[1]);
                                }
                                else {
                                    //rx, ry
                                    seed = MakerJs.path.distort(seed, args[0], args[1]);
                                }
                                break;
                            case 3:
                                //origin, rx, ry
                                seed = MakerJs.path.distort(seed, args[1], args[2]);
                                break;
                            case 4:
                                //cx, cy, rx, ry
                                seed = MakerJs.path.distort(seed, args[2], args[3]);
                                break;
                        }
                        _this.models['Curve_' + (1 + i)] = new models.BezierCurve(seed, accuracy);
                        arc.startAngle += a;
                        arc.endAngle += a;
                    }
                };
                switch (args.length) {
                    case 2:
                        realArgs(2);
                        break;
                    case 3:
                        if (isPointArgs0) {
                            realArgs(3);
                        }
                        else {
                            accuracy = args[2];
                            realArgs(2);
                        }
                        break;
                    case 4:
                        if (isPointArgs0) {
                            accuracy = args[3];
                            realArgs(3);
                        }
                        else {
                            realArgs(4);
                        }
                        break;
                    case 5:
                        accuracy = args[4];
                        realArgs(4);
                        break;
                }
            }
            return Ellipse;
        }());
        models.Ellipse = Ellipse;
        Ellipse.metaParameters = [
            { title: "radiusX", type: "range", min: 1, max: 50, value: 50 },
            { title: "radiusY", type: "range", min: 1, max: 50, value: 25 }
        ];
        var EllipticArc = (function () {
            function EllipticArc() {
                var args = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    args[_i] = arguments[_i];
                }
                this.models = {};
                var arc;
                var accuracy;
                var distortX;
                var distortY;
                if (MakerJs.isPathArc(args[0])) {
                    arc = args[0];
                    distortX = args[1];
                    distortY = args[2];
                    accuracy = args[3];
                }
                else {
                    arc = new MakerJs.paths.Arc([0, 0], 1, args[0], args[1]);
                    distortX = args[2];
                    distortY = args[3];
                    accuracy = args[4];
                }
                var span = MakerJs.angle.ofArcSpan(arc);
                //split into equal chunks, no larger than max chunk size
                var count = Math.ceil(span / maxBezierArcspan);
                var subSpan = span / count;
                var subArc = MakerJs.path.clone(arc);
                for (var i = 0; i < count; i++) {
                    subArc.startAngle = arc.startAngle + (i * subSpan);
                    subArc.endAngle = subArc.startAngle + subSpan;
                    var seed = bezierSeedFromArc(subArc);
                    seed = MakerJs.path.distort(seed, distortX, distortY);
                    this.models['Curve_' + (1 + i)] = new models.BezierCurve(seed, accuracy);
                }
            }
            return EllipticArc;
        }());
        models.EllipticArc = EllipticArc;
        EllipticArc.metaParameters = [
            { title: "startAngle", type: "range", min: 0, max: 90, value: 0 },
            { title: "endAngle", type: "range", min: 90, max: 360, value: 180 },
            { title: "radiusX", type: "range", min: 1, max: 50, value: 50 },
            { title: "radiusY", type: "range", min: 1, max: 50, value: 25 }
        ];
    })(models = MakerJs.models || (MakerJs.models = {}));
})(MakerJs || (MakerJs = {}));
var MakerJs;
(function (MakerJs) {
    var models;
    (function (models) {
        /**
         * @private
         */
        function getPoints(arg) {
            var coords;
            if (Array.isArray(arg)) {
                if (MakerJs.isPoint(arg[0])) {
                    return arg;
                }
                coords = arg;
            }
            else {
                coords = MakerJs.importer.parseNumericList(arg);
            }
            var points = [];
            for (var i = 0; i < coords.length; i += 2) {
                points.push([coords[i], coords[i + 1]]);
            }
            return points;
        }
        var ConnectTheDots = (function () {
            function ConnectTheDots() {
                var args = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    args[_i] = arguments[_i];
                }
                var _this = this;
                this.paths = {};
                var isClosed;
                var points;
                switch (args.length) {
                    case 1:
                        isClosed = true;
                        points = getPoints(args[0]);
                        break;
                    case 2:
                        isClosed = args[0];
                        points = getPoints(args[1]);
                        break;
                }
                var connect = function (a, b, skipZeroDistance) {
                    if (skipZeroDistance === void 0) { skipZeroDistance = false; }
                    if (skipZeroDistance && MakerJs.measure.pointDistance(points[a], points[b]) == 0)
                        return;
                    _this.paths["ShapeLine" + i] = new MakerJs.paths.Line(points[a], points[b]);
                };
                for (var i = 1; i < points.length; i++) {
                    connect(i - 1, i);
                }
                if (isClosed && points.length > 2) {
                    connect(points.length - 1, 0, true);
                }
            }
            return ConnectTheDots;
        }());
        models.ConnectTheDots = ConnectTheDots;
        ConnectTheDots.metaParameters = [
            { title: "closed", type: "bool", value: true },
            {
                title: "points", type: "select", value: [
                    [[0, 0], [40, 40], [60, 20], [100, 100], [60, 60], [40, 80]],
                    [[0, 0], [100, 0], [50, 87]],
                    [-10, 0, 10, 0, 0, 20],
                    '-10 0 10 0 0 20',
                ]
            }
        ];
    })(models = MakerJs.models || (MakerJs.models = {}));
})(MakerJs || (MakerJs = {}));
var MakerJs;
(function (MakerJs) {
    var models;
    (function (models) {
        var Polygon = (function () {
            function Polygon(numberOfSides, radius, firstCornerAngleInDegrees, circumscribed) {
                this.paths = {};
                this.paths = new models.ConnectTheDots(true, Polygon.getPoints(numberOfSides, radius, firstCornerAngleInDegrees, circumscribed)).paths;
            }
            Polygon.circumscribedRadius = function (radius, angleInRadians) {
                return radius / Math.cos(angleInRadians / 2);
            };
            Polygon.getPoints = function (numberOfSides, radius, firstCornerAngleInDegrees, circumscribed) {
                if (firstCornerAngleInDegrees === void 0) { firstCornerAngleInDegrees = 0; }
                if (circumscribed === void 0) { circumscribed = false; }
                var points = [];
                var a1 = MakerJs.angle.toRadians(firstCornerAngleInDegrees);
                var a = 2 * Math.PI / numberOfSides;
                if (circumscribed) {
                    radius = Polygon.circumscribedRadius(radius, a);
                }
                for (var i = 0; i < numberOfSides; i++) {
                    points.push(MakerJs.point.fromPolar(a * i + a1, radius));
                }
                return points;
            };
            return Polygon;
        }());
        models.Polygon = Polygon;
        Polygon.metaParameters = [
            { title: "number of sides", type: "range", min: 3, max: 24, value: 6 },
            { title: "radius", type: "range", min: 1, max: 100, value: 50 },
            { title: "offset angle", type: "range", min: 0, max: 180, value: 0 },
            { title: "radius on flats (vs radius on vertexes)", type: "bool", value: false }
        ];
    })(models = MakerJs.models || (MakerJs.models = {}));
})(MakerJs || (MakerJs = {}));
var MakerJs;
(function (MakerJs) {
    var models;
    (function (models) {
        var Holes = (function () {
            /**
             * Create an array of circles of the same radius from an array of center points.
             *
             * Example:
             * ```
             * //Create some holes from an array of points
             * var makerjs = require('makerjs');
             * var model = new makerjs.models.Holes(10, [[0, 0],[50, 0],[25, 40]]);
             * var svg = makerjs.exporter.toSVG(model);
             * document.write(svg);
             * ```
             *
             * @param holeRadius Hole radius.
             * @param points Array of points for origin of each hole.
             * @param ids Optional array of corresponding path ids for the holes.
             */
            function Holes(holeRadius, points, ids) {
                this.paths = {};
                for (var i = 0; i < points.length; i++) {
                    var id = ids ? ids[i] : i.toString();
                    this.paths[id] = new MakerJs.paths.Circle(points[i], holeRadius);
                }
            }
            return Holes;
        }());
        models.Holes = Holes;
        Holes.metaParameters = [
            { title: "holeRadius", type: "range", min: .1, max: 10, step: .1, value: 1 },
            {
                title: "points", type: "select", value: [
                    [[0, 0], [10, 10], [20, 20], [30, 30], [40, 40], [50, 50], [60, 60], [70, 70], [80, 80]],
                    [[0, 0], [0, 25], [0, 50], [0, 75], [0, 100], [25, 50], [50, 50], [75, 50], [100, 100], [100, 75], [100, 50], [100, 25], [100, 0]]
                ]
            }
        ];
    })(models = MakerJs.models || (MakerJs.models = {}));
})(MakerJs || (MakerJs = {}));
var MakerJs;
(function (MakerJs) {
    var models;
    (function (models) {
        var BoltCircle = (function () {
            function BoltCircle(boltRadius, holeRadius, boltCount, firstBoltAngleInDegrees) {
                if (firstBoltAngleInDegrees === void 0) { firstBoltAngleInDegrees = 0; }
                this.paths = {};
                var points = models.Polygon.getPoints(boltCount, boltRadius, firstBoltAngleInDegrees);
                var ids = points.map(function (p, i) { return "bolt " + i; });
                this.paths = new models.Holes(holeRadius, points, ids).paths;
            }
            return BoltCircle;
        }());
        models.BoltCircle = BoltCircle;
        BoltCircle.metaParameters = [
            { title: "bolt circle radius", type: "range", min: 1, max: 100, value: 50 },
            { title: "hole radius", type: "range", min: 1, max: 50, value: 5 },
            { title: "bolt count", type: "range", min: 3, max: 24, value: 12 },
            { title: "offset angle", type: "range", min: 0, max: 180, value: 0 }
        ];
    })(models = MakerJs.models || (MakerJs.models = {}));
})(MakerJs || (MakerJs = {}));
var MakerJs;
(function (MakerJs) {
    var models;
    (function (models) {
        var BoltRectangle = (function () {
            function BoltRectangle(width, height, holeRadius) {
                this.paths = {};
                var points = [[0, 0], [width, 0], [width, height], [0, height]];
                var ids = ["BottomLeft_bolt", "BottomRight_bolt", "TopRight_bolt", "TopLeft_bolt"];
                this.paths = new models.Holes(holeRadius, points, ids).paths;
            }
            return BoltRectangle;
        }());
        models.BoltRectangle = BoltRectangle;
        BoltRectangle.metaParameters = [
            { title: "width", type: "range", min: 1, max: 100, value: 100 },
            { title: "height", type: "range", min: 1, max: 100, value: 50 },
            { title: "hole radius", type: "range", min: 1, max: 50, value: 5 }
        ];
    })(models = MakerJs.models || (MakerJs.models = {}));
})(MakerJs || (MakerJs = {}));
var MakerJs;
(function (MakerJs) {
    var models;
    (function (models) {
        var Dogbone = (function () {
            /**
             * Create a dogbone from width, height, corner radius, style, and bottomless flag.
             *
             * Example:
             * ```
             * var d = new makerjs.models.Dogbone(50, 100, 5);
             * ```
             *
             * @param width Width of the rectangle.
             * @param height Height of the rectangle.
             * @param radius Corner radius.
             * @param style Optional corner style: 0 (default) for dogbone, 1 for vertical, -1 for horizontal.
             * @param bottomless Optional flag to omit the bottom line and bottom corners (default false).
             */
            function Dogbone(width, height, radius, style, bottomless) {
                if (style === void 0) { style = 0; }
                if (bottomless === void 0) { bottomless = false; }
                this.paths = {};
                var maxSide = Math.min(height, width) / 2;
                var maxRadius;
                switch (style) {
                    case -1: //horizontal
                    case 1://vertical
                        maxRadius = maxSide / 2;
                        break;
                    case 0: //equal
                    default:
                        maxRadius = maxSide * Math.SQRT2 / 2;
                        break;
                }
                radius = Math.min(radius, maxRadius);
                var ax;
                var ay;
                var lx;
                var ly;
                var apexes;
                switch (style) {
                    case -1:
                        ax = 0;
                        ay = radius;
                        lx = 0;
                        ly = radius * 2;
                        apexes = [180, 0, 0, 180];
                        break;
                    case 1:
                        ax = radius;
                        ay = 0;
                        lx = radius * 2;
                        ly = 0;
                        apexes = [270, 270, 90, 90];
                        break;
                    case 0:
                    default:
                        ax = ay = radius / Math.SQRT2;
                        lx = ly = ax * 2;
                        apexes = [225, 315, 45, 135];
                        break;
                }
                if (bottomless) {
                    this.paths['Left'] = new MakerJs.paths.Line([0, 0], [0, height - ly]);
                    this.paths['Right'] = new MakerJs.paths.Line([width, 0], [width, height - ly]);
                }
                else {
                    this.paths['Left'] = new MakerJs.paths.Line([0, ly], [0, height - ly]);
                    this.paths['Right'] = new MakerJs.paths.Line([width, ly], [width, height - ly]);
                    this.paths['Bottom'] = new MakerJs.paths.Line([lx, 0], [width - lx, 0]);
                    this.paths["BottomLeft"] = new MakerJs.paths.Arc([ax, ay], radius, apexes[0] - 90, apexes[0] + 90);
                    this.paths["BottomRight"] = new MakerJs.paths.Arc([width - ax, ay], radius, apexes[1] - 90, apexes[1] + 90);
                }
                this.paths["TopRight"] = new MakerJs.paths.Arc([width - ax, height - ay], radius, apexes[2] - 90, apexes[2] + 90);
                this.paths["TopLeft"] = new MakerJs.paths.Arc([ax, height - ay], radius, apexes[3] - 90, apexes[3] + 90);
                this.paths['Top'] = new MakerJs.paths.Line([lx, height], [width - lx, height]);
            }
            return Dogbone;
        }());
        models.Dogbone = Dogbone;
        Dogbone.metaParameters = [
            { title: "width", type: "range", min: 1, max: 100, value: 50 },
            { title: "height", type: "range", min: 1, max: 100, value: 100 },
            { title: "radius", type: "range", min: 0, max: 50, value: 5 },
            { title: "style", type: "select", value: [0, 1, -1] },
            { title: "bottomless", type: "bool", value: false }
        ];
    })(models = MakerJs.models || (MakerJs.models = {}));
})(MakerJs || (MakerJs = {}));
var MakerJs;
(function (MakerJs) {
    var models;
    (function (models) {
        var Dome = (function () {
            function Dome(width, height, radius, bottomless) {
                this.paths = {};
                var w2 = width / 2;
                if (radius < 0)
                    radius = 0;
                if (radius === void 0)
                    radius = w2;
                radius = Math.min(radius, w2);
                radius = Math.min(radius, height);
                var wt = Math.max(w2 - radius, 0);
                var hr = Math.max(height - radius, 0);
                if (!bottomless) {
                    this.paths["Bottom"] = new MakerJs.paths.Line([-w2, 0], [w2, 0]);
                }
                if (hr) {
                    this.paths["Left"] = new MakerJs.paths.Line([-w2, 0], [-w2, hr]);
                    this.paths["Right"] = new MakerJs.paths.Line([w2, 0], [w2, hr]);
                }
                if (radius > 0) {
                    this.paths["TopLeft"] = new MakerJs.paths.Arc([-wt, hr], radius, 90, 180);
                    this.paths["TopRight"] = new MakerJs.paths.Arc([wt, hr], radius, 0, 90);
                }
                if (wt) {
                    this.paths["Top"] = new MakerJs.paths.Line([-wt, height], [wt, height]);
                }
            }
            return Dome;
        }());
        models.Dome = Dome;
        Dome.metaParameters = [
            { title: "width", type: "range", min: 1, max: 100, value: 50 },
            { title: "height", type: "range", min: 1, max: 100, value: 100 },
            { title: "radius", type: "range", min: 0, max: 50, value: 25 },
            { title: "bottomless", type: "bool", value: false }
        ];
    })(models = MakerJs.models || (MakerJs.models = {}));
})(MakerJs || (MakerJs = {}));
var MakerJs;
(function (MakerJs) {
    var models;
    (function (models) {
        var RoundRectangle = (function () {
            function RoundRectangle() {
                var args = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    args[_i] = arguments[_i];
                }
                this.paths = {};
                var width;
                var height;
                var radius = 0;
                switch (args.length) {
                    case 3:
                        width = args[0];
                        height = args[1];
                        radius = args[2];
                        break;
                    case 2:
                        radius = args[1];
                    //fall through to 1
                    case 1:
                        var m = MakerJs.measure.modelExtents(args[0]);
                        this.origin = MakerJs.point.subtract(m.low, [radius, radius]);
                        width = m.high[0] - m.low[0] + 2 * radius;
                        height = m.high[1] - m.low[1] + 2 * radius;
                        break;
                }
                var maxRadius = Math.min(height, width) / 2;
                radius = Math.min(radius, maxRadius);
                var wr = width - radius;
                var hr = height - radius;
                if (radius > 0) {
                    this.paths["BottomLeft"] = new MakerJs.paths.Arc([radius, radius], radius, 180, 270);
                    this.paths["BottomRight"] = new MakerJs.paths.Arc([wr, radius], radius, 270, 0);
                    this.paths["TopRight"] = new MakerJs.paths.Arc([wr, hr], radius, 0, 90);
                    this.paths["TopLeft"] = new MakerJs.paths.Arc([radius, hr], radius, 90, 180);
                }
                if (wr - radius > 0) {
                    this.paths["Bottom"] = new MakerJs.paths.Line([radius, 0], [wr, 0]);
                    this.paths["Top"] = new MakerJs.paths.Line([wr, height], [radius, height]);
                }
                if (hr - radius > 0) {
                    this.paths["Right"] = new MakerJs.paths.Line([width, radius], [width, hr]);
                    this.paths["Left"] = new MakerJs.paths.Line([0, hr], [0, radius]);
                }
            }
            return RoundRectangle;
        }());
        models.RoundRectangle = RoundRectangle;
        RoundRectangle.metaParameters = [
            { title: "width", type: "range", min: 1, max: 100, value: 50 },
            { title: "height", type: "range", min: 1, max: 100, value: 100 },
            { title: "radius", type: "range", min: 0, max: 50, value: 11 }
        ];
    })(models = MakerJs.models || (MakerJs.models = {}));
})(MakerJs || (MakerJs = {}));
var MakerJs;
(function (MakerJs) {
    var models;
    (function (models) {
        var Oval = (function () {
            function Oval(width, height) {
                this.paths = {};
                this.paths = new models.RoundRectangle(width, height, Math.min(height / 2, width / 2)).paths;
            }
            return Oval;
        }());
        models.Oval = Oval;
        Oval.metaParameters = [
            { title: "width", type: "range", min: 1, max: 100, value: 50 },
            { title: "height", type: "range", min: 1, max: 100, value: 100 }
        ];
    })(models = MakerJs.models || (MakerJs.models = {}));
})(MakerJs || (MakerJs = {}));
var MakerJs;
(function (MakerJs) {
    var models;
    (function (models) {
        var OvalArc = (function () {
            function OvalArc(startAngle, endAngle, sweepRadius, slotRadius, selfIntersect, isolateCaps) {
                if (selfIntersect === void 0) { selfIntersect = false; }
                if (isolateCaps === void 0) { isolateCaps = false; }
                var _this = this;
                this.paths = {};
                var capRoot;
                if (isolateCaps) {
                    capRoot = { models: {} };
                    this.models = { 'Caps': capRoot };
                }
                if (slotRadius <= 0 || sweepRadius <= 0)
                    return;
                startAngle = MakerJs.angle.noRevolutions(startAngle);
                endAngle = MakerJs.angle.noRevolutions(endAngle);
                if (MakerJs.round(startAngle - endAngle) == 0)
                    return;
                if (endAngle < startAngle)
                    endAngle += 360;
                var addCap = function (id, tiltAngle, offsetStartAngle, offsetEndAngle) {
                    var capModel;
                    if (isolateCaps) {
                        capModel = { paths: {} };
                        capRoot.models[id] = capModel;
                    }
                    else {
                        capModel = _this;
                    }
                    return capModel.paths[id] = new MakerJs.paths.Arc(MakerJs.point.fromPolar(MakerJs.angle.toRadians(tiltAngle), sweepRadius), slotRadius, tiltAngle + offsetStartAngle, tiltAngle + offsetEndAngle);
                };
                var addSweep = function (id, offsetRadius) {
                    return _this.paths[id] = new MakerJs.paths.Arc([0, 0], sweepRadius + offsetRadius, startAngle, endAngle);
                };
                addSweep("Outer", slotRadius);
                var hasInner = (sweepRadius - slotRadius) > 0;
                if (hasInner) {
                    addSweep("Inner", -slotRadius);
                }
                var caps = [];
                caps.push(addCap("StartCap", startAngle, 180, 0));
                caps.push(addCap("EndCap", endAngle, 0, 180));
                //the distance between the cap origins
                var d = MakerJs.measure.pointDistance(caps[0].origin, caps[1].origin);
                if ((d / 2) < slotRadius) {
                    //the caps intersect
                    var int = MakerJs.path.intersection(caps[0], caps[1]);
                    if (int) {
                        if (!hasInner || !selfIntersect) {
                            caps[0].startAngle = int.path1Angles[0];
                            caps[1].endAngle = int.path2Angles[0];
                        }
                        if (!selfIntersect && hasInner && int.intersectionPoints.length == 2) {
                            addCap("StartCap2", startAngle, 180, 0).endAngle = int.path1Angles[1];
                            addCap("EndCap2", endAngle, 0, 180).startAngle = int.path2Angles[1] + 360;
                        }
                    }
                }
            }
            return OvalArc;
        }());
        models.OvalArc = OvalArc;
        OvalArc.metaParameters = [
            { title: "start angle", type: "range", min: -360, max: 360, step: 1, value: 180 },
            { title: "end angle", type: "range", min: -360, max: 360, step: 1, value: 0 },
            { title: "sweep", type: "range", min: 0, max: 100, step: 1, value: 50 },
            { title: "radius", type: "range", min: 0, max: 100, step: 1, value: 15 },
            { title: "self intersect", type: "bool", value: false }
        ];
    })(models = MakerJs.models || (MakerJs.models = {}));
})(MakerJs || (MakerJs = {}));
var MakerJs;
(function (MakerJs) {
    var models;
    (function (models) {
        var Rectangle = (function () {
            function Rectangle() {
                var args = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    args[_i] = arguments[_i];
                }
                this.paths = {};
                var width;
                var height;
                if (args.length === 2 && !MakerJs.isObject(args[0])) {
                    width = args[0];
                    height = args[1];
                }
                else {
                    var margin = 0;
                    var m;
                    if (MakerJs.isModel(args[0])) {
                        m = MakerJs.measure.modelExtents(args[0]);
                        if (args.length === 2) {
                            margin = args[1];
                        }
                    }
                    else {
                        //use measurement
                        m = args[0];
                    }
                    this.origin = MakerJs.point.subtract(m.low, [margin, margin]);
                    width = m.high[0] - m.low[0] + 2 * margin;
                    height = m.high[1] - m.low[1] + 2 * margin;
                }
                this.paths = new models.ConnectTheDots(true, [[0, 0], [width, 0], [width, height], [0, height]]).paths;
            }
            return Rectangle;
        }());
        models.Rectangle = Rectangle;
        Rectangle.metaParameters = [
            { title: "width", type: "range", min: 1, max: 100, value: 50 },
            { title: "height", type: "range", min: 1, max: 100, value: 100 }
        ];
    })(models = MakerJs.models || (MakerJs.models = {}));
})(MakerJs || (MakerJs = {}));
var MakerJs;
(function (MakerJs) {
    var models;
    (function (models) {
        var Ring = (function () {
            function Ring(outerRadius, innerRadius) {
                this.paths = {};
                var radii = {
                    "Ring_outer": outerRadius,
                    "Ring_inner": innerRadius
                };
                for (var id in radii) {
                    if (radii[id] === void 0)
                        continue;
                    this.paths[id] = new MakerJs.paths.Circle(MakerJs.point.zero(), radii[id]);
                }
            }
            return Ring;
        }());
        models.Ring = Ring;
        Ring.metaParameters = [
            { title: "outer radius", type: "range", min: 0, max: 100, step: 1, value: 50 },
            { title: "inner radius", type: "range", min: 0, max: 100, step: 1, value: 20 }
        ];
    })(models = MakerJs.models || (MakerJs.models = {}));
})(MakerJs || (MakerJs = {}));
var MakerJs;
(function (MakerJs) {
    var models;
    (function (models) {
        var Belt = (function () {
            function Belt(leftRadius, distance, rightRadius) {
                this.paths = {};
                var left = new MakerJs.paths.Arc([0, 0], leftRadius, 0, 360);
                var right = new MakerJs.paths.Arc([distance, 0], rightRadius, 0, 360);
                var angles = MakerJs.solvers.circleTangentAngles(left, right);
                if (!angles) {
                    this.paths["Belt"] = new MakerJs.paths.Circle(Math.max(leftRadius, rightRadius));
                }
                else {
                    angles = angles.sort(function (a, b) { return a - b; });
                    left.startAngle = angles[0];
                    left.endAngle = angles[1];
                    right.startAngle = angles[1];
                    right.endAngle = angles[0];
                    this.paths["Left"] = left;
                    this.paths["Right"] = right;
                    this.paths["Top"] = new MakerJs.paths.Line(MakerJs.point.fromAngleOnCircle(angles[0], left), MakerJs.point.fromAngleOnCircle(angles[0], right));
                    this.paths["Bottom"] = new MakerJs.paths.Line(MakerJs.point.fromAngleOnCircle(angles[1], left), MakerJs.point.fromAngleOnCircle(angles[1], right));
                }
            }
            return Belt;
        }());
        models.Belt = Belt;
        Belt.metaParameters = [
            { title: "left radius", type: "range", min: 0, max: 100, value: 30 },
            { title: "distance between centers", type: "range", min: 0, max: 100, value: 50 },
            { title: "right radius", type: "range", min: 0, max: 100, value: 15 }
        ];
    })(models = MakerJs.models || (MakerJs.models = {}));
})(MakerJs || (MakerJs = {}));
var MakerJs;
(function (MakerJs) {
    var models;
    (function (models) {
        var SCurve = (function () {
            function SCurve(width, height) {
                this.paths = {};
                function findRadius(x, y) {
                    return x + (y * y - x * x) / (2 * x);
                }
                var h2 = height / 2;
                var w2 = width / 2;
                var radius;
                var startAngle;
                var endAngle;
                var arcOrigin;
                if (width > height) {
                    radius = findRadius(h2, w2);
                    startAngle = 270;
                    endAngle = 360 - MakerJs.angle.toDegrees(Math.acos(w2 / radius));
                    arcOrigin = [0, radius];
                }
                else {
                    radius = findRadius(w2, h2);
                    startAngle = 180 - MakerJs.angle.toDegrees(Math.asin(h2 / radius));
                    endAngle = 180;
                    arcOrigin = [radius, 0];
                }
                var curve = new MakerJs.paths.Arc(arcOrigin, radius, startAngle, endAngle);
                this.paths['curve_start'] = curve;
                this.paths['curve_end'] = MakerJs.path.moveRelative(MakerJs.path.mirror(curve, true, true), [width, height]);
            }
            return SCurve;
        }());
        models.SCurve = SCurve;
        SCurve.metaParameters = [
            { title: "width", type: "range", min: 1, max: 100, value: 50 },
            { title: "height", type: "range", min: 1, max: 100, value: 100 }
        ];
    })(models = MakerJs.models || (MakerJs.models = {}));
})(MakerJs || (MakerJs = {}));
var MakerJs;
(function (MakerJs) {
    var models;
    (function (models) {
        var Slot = (function () {
            function Slot(origin, endPoint, radius, isolateCaps) {
                if (isolateCaps === void 0) { isolateCaps = false; }
                var _this = this;
                this.paths = {};
                var capRoot;
                if (isolateCaps) {
                    capRoot = { models: {} };
                    this.models = { 'Caps': capRoot };
                }
                var addCap = function (id, capPath) {
                    var capModel;
                    if (isolateCaps) {
                        capModel = { paths: {} };
                        capRoot.models[id] = capModel;
                    }
                    else {
                        capModel = _this;
                    }
                    capModel.paths[id] = capPath;
                };
                var a = MakerJs.angle.ofPointInDegrees(origin, endPoint);
                var len = MakerJs.measure.pointDistance(origin, endPoint);
                this.paths['Top'] = new MakerJs.paths.Line([0, radius], [len, radius]);
                this.paths['Bottom'] = new MakerJs.paths.Line([0, -radius], [len, -radius]);
                addCap('StartCap', new MakerJs.paths.Arc([0, 0], radius, 90, 270));
                addCap('EndCap', new MakerJs.paths.Arc([len, 0], radius, 270, 90));
                MakerJs.model.rotate(this, a, [0, 0]);
                this.origin = origin;
            }
            return Slot;
        }());
        models.Slot = Slot;
        Slot.metaParameters = [
            {
                title: "origin", type: "select", value: [
                    [0, 0],
                    [10, 0],
                    [10, 10]
                ]
            },
            {
                title: "end", type: "select", value: [
                    [80, 0],
                    [0, 30],
                    [10, 30]
                ]
            },
            { title: "radius", type: "range", min: 1, max: 50, value: 10 }
        ];
    })(models = MakerJs.models || (MakerJs.models = {}));
})(MakerJs || (MakerJs = {}));
var MakerJs;
(function (MakerJs) {
    var models;
    (function (models) {
        var Square = (function () {
            function Square(side) {
                this.paths = {};
                this.paths = new models.Rectangle(side, side).paths;
            }
            return Square;
        }());
        models.Square = Square;
        Square.metaParameters = [
            { title: "side", type: "range", min: 1, max: 100, value: 100 }
        ];
    })(models = MakerJs.models || (MakerJs.models = {}));
})(MakerJs || (MakerJs = {}));
var MakerJs;
(function (MakerJs) {
    var models;
    (function (models) {
        var Star = (function () {
            function Star(numberOfPoints, outerRadius, innerRadius, skipPoints) {
                if (skipPoints === void 0) { skipPoints = 2; }
                this.paths = {};
                if (!innerRadius) {
                    innerRadius = outerRadius * Star.InnerRadiusRatio(numberOfPoints, skipPoints);
                }
                var outerPoints = models.Polygon.getPoints(numberOfPoints, outerRadius);
                var innerPoints = models.Polygon.getPoints(numberOfPoints, innerRadius, 180 / numberOfPoints);
                var allPoints = [];
                for (var i = 0; i < numberOfPoints; i++) {
                    allPoints.push(outerPoints[i]);
                    allPoints.push(innerPoints[i]);
                }
                var model = new models.ConnectTheDots(true, allPoints);
                this.paths = model.paths;
                delete model.paths;
            }
            Star.InnerRadiusRatio = function (numberOfPoints, skipPoints) {
                //formula from http://www.jdawiseman.com/papers/easymath/surds_star_inner_radius.html
                //Cos(Pi()*m/n) / Cos(Pi()*(m-1)/n)
                if (numberOfPoints > 0 && skipPoints > 1 && skipPoints < numberOfPoints / 2) {
                    return Math.cos(Math.PI * skipPoints / numberOfPoints) / Math.cos(Math.PI * (skipPoints - 1) / numberOfPoints);
                }
                return 0;
            };
            return Star;
        }());
        models.Star = Star;
        Star.metaParameters = [
            { title: "number of sides", type: "range", min: 3, max: 24, value: 8 },
            { title: "outer radius", type: "range", min: 1, max: 100, value: 50 },
            { title: "inner radius", type: "range", min: 0, max: 100, value: 15 },
            { title: "skip points (when inner radius is zero)", type: "range", min: 0, max: 12, value: 2 }
        ];
    })(models = MakerJs.models || (MakerJs.models = {}));
})(MakerJs || (MakerJs = {}));
var MakerJs;
(function (MakerJs) {
    var models;
    (function (models) {
        var Text = (function () {
            function Text(font, text, fontSize, combine, centerCharacterOrigin, bezierAccuracy, opentypeOptions) {
                if (combine === void 0) { combine = false; }
                if (centerCharacterOrigin === void 0) { centerCharacterOrigin = false; }
                var _this = this;
                this.models = {};
                var charIndex = 0;
                var prevDeleted;
                var prevChar;
                var cb = function (glyph, x, y, _fontSize, options) {
                    var charModel = {};
                    var firstPoint;
                    var currPoint;
                    var pathCount = 0;
                    function addPath(p) {
                        if (!charModel.paths) {
                            charModel.paths = {};
                        }
                        charModel.paths['p_' + ++pathCount] = p;
                    }
                    function addModel(m) {
                        if (!charModel.models) {
                            charModel.models = {};
                        }
                        charModel.models['p_' + ++pathCount] = m;
                    }
                    var p = glyph.getPath(0, 0, _fontSize);
                    p.commands.map(function (command, i) {
                        var points = [[command.x, command.y], [command.x1, command.y1], [command.x2, command.y2]].map(function (p) {
                            if (p[0] !== void 0) {
                                return MakerJs.point.mirror(p, false, true);
                            }
                        });
                        switch (command.type) {
                            case 'M':
                                firstPoint = points[0];
                                break;
                            case 'Z':
                                points[0] = firstPoint;
                            //fall through to line
                            case 'L':
                                if (!MakerJs.measure.isPointEqual(currPoint, points[0])) {
                                    addPath(new MakerJs.paths.Line(currPoint, points[0]));
                                }
                                break;
                            case 'C':
                                addModel(new models.BezierCurve(currPoint, points[1], points[2], points[0], bezierAccuracy));
                                break;
                            case 'Q':
                                addModel(new models.BezierCurve(currPoint, points[1], points[0], bezierAccuracy));
                                break;
                        }
                        currPoint = points[0];
                    });
                    charModel.origin = [x, 0];
                    if (centerCharacterOrigin && (charModel.paths || charModel.models)) {
                        var m = MakerJs.measure.modelExtents(charModel);
                        if (m) {
                            var w = m.high[0] - m.low[0];
                            MakerJs.model.originate(charModel, [m.low[0] + w / 2, 0]);
                        }
                    }
                    if (combine && charIndex > 0) {
                        var combineOptions = {};
                        var prev;
                        if (prevDeleted) {
                            //form a temporary complete geometry of the previous character using the previously deleted segments
                            prev = {
                                models: {
                                    deleted: prevDeleted,
                                    char: prevChar
                                }
                            };
                        }
                        else {
                            prev = prevChar;
                        }
                        MakerJs.model.combine(prev, charModel, false, true, false, true, combineOptions);
                        //save the deleted segments from this character for the next iteration
                        prevDeleted = combineOptions.out_deleted[1];
                    }
                    _this.models[charIndex] = charModel;
                    charIndex++;
                    prevChar = charModel;
                };
                font.forEachGlyph(text, 0, 0, fontSize, opentypeOptions, cb);
            }
            return Text;
        }());
        models.Text = Text;
        Text.metaParameters = [
            { title: "font", type: "font", value: '*' },
            { title: "text", type: "text", value: 'Hello' },
            { title: "font size", type: "range", min: 10, max: 200, value: 72 },
            { title: "combine", type: "bool", value: false },
            { title: "center character origin", type: "bool", value: false }
        ];
    })(models = MakerJs.models || (MakerJs.models = {}));
})(MakerJs || (MakerJs = {}));
MakerJs.version = "0.9.73";
﻿var Bezier = require('bezier-js');

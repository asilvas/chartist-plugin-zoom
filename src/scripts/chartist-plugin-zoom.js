/**
 * Chartist.js zoom plugin.
 *
 */
 (function (window, document, Chartist) {
    'use strict';

    var defaultOptions = {
        // onZoom
    };

    Chartist.plugins = Chartist.plugins || {};
    Chartist.plugins.zoom = function (options) {

        options = Chartist.extend({}, defaultOptions, options);

        return function zoom(chart) {

            var rect, svg, axisX, axisY, chartRect;
            var downPosition;
            var onZoom = options.onZoom;
            
            chart.on('draw', function(data) {
                var type = data.type;
                if (type === 'line' || type === 'bar' || type === 'area' || type === 'point') {
                    data.element.attr({
                        'clip-path': 'url(#zoom-mask)'
                    });
                }
            });
            
            chart.on('created', function (data) {
                if (chart instanceof Chartist.Line) {
                    axisX = data.axisX;
                    axisY = data.axisY;
                    chartRect = data.chartRect;
                    svg = data.svg._node;                    
                    rect = data.svg.elem('rect', {
                        x: 10,
                        y: 10,
                        width: 100,
                        height: 100,
                    }, 'ct-zoom-rect');
                    hide(rect);
                
                    var defs = data.svg.querySelector('defs') || data.svg.elem('defs');
                    var width = chartRect.width();
                    var height  = chartRect.height();
    
                    defs
                    .elem('clipPath', {
                        x: chartRect.x1,
                        y: chartRect.y2,
                        width: width,
                        height: height,
                        id: 'zoom-mask'
                    })
                    .elem('rect', {
                        x: chartRect.x1,
                        y: chartRect.y2,
                        width: width,
                        height: height,
                        fill: 'white'
                    });
                    
                    chart.container.addEventListener('mousedown', function (event) {
                        if (event.button === 0) {
                            downPosition = position(event, svg);
                            rect.attr(getRect(downPosition, downPosition));
                            show(rect);
                            event.preventDefault();
                        }
                    });
        
                    var reset = function() {
                        chart.options.axisX.highLow = null;
                        chart.options.axisY.highLow = null;
                        chart.update(chart.data, chart.options);
                    };
                    
                    chart.container.addEventListener('mouseup', function (event) {
                        if (event.button === 0) {
                            var box = getRect(downPosition, position(event, svg));
                            if (box.width > 5 && box.height > 5) {
                                var x1 = box.x - chartRect.x1;
                                var x2 = x1 + box.width;
                                var y2 = chartRect.y1 - box.y;
                                var y1 = y2 - box.height;
        
                                chart.options.axisX.highLow = { low: project(x1, axisX), high: project(x2, axisX) };
                                chart.options.axisY.highLow = { low: project(y1, axisY), high: project(y2, axisY) };
                                
                                chart.update(chart.data, chart.options);
                                onZoom && onZoom(reset);
                            }                            
                            
                            downPosition = null;
                            hide(rect);
                            event.preventDefault();
                        }
                        else if (event.button === 2) {
                            reset();
                            event.preventDefault();
                        }
                    });
        
                    chart.container.addEventListener('mousemove', function (event) {                    
                        if (downPosition) {
                            var point = position(event, svg);
                            rect.attr(getRect(downPosition, point));
                            event.preventDefault();
                        }
                    });
                }
            });
        };

        
    };

    function hide(rect) {
        rect.attr({ style : 'display:none'});
    }

    function show(rect) {
        rect.attr({ style: 'display:block' });
    }

    function getRect(firstPoint, secondPoint) {
        var x = firstPoint.x;
        var y = firstPoint.y;
        var width = secondPoint.x - x;
        var height = secondPoint.y - y;
        if (width < 0) {
            width = -width;
            x = secondPoint.x;
        }
        if (height < 0) {
            height = -height;
            y = secondPoint.y;
        }
        return {
            x: x,
            y: y,
            width: width,
            height: height
        };
    }

    function position(event, svg) {
        var x = event.pageX;
        var y = event.pageY;
        return transform(x, y, svg);
    }

    function transform(x, y, svgElement) {
        svgElement = svgElement;
        var svg = svgElement.tagName === 'svg' ? svgElement : svgElement.ownerSVGElement;
        var matrix = svgElement.getScreenCTM();
        var point = svg.createSVGPoint();
        point.x = x;
        point.y = y;
        point = point.matrixTransform(matrix.inverse());
        return point;
    }

    function project(value, axis) {
        var max = axis.bounds.max;
        var min = axis.bounds.min;
        if (axis.scale && axis.scale.type === 'log') {
            var base = axis.scale.base;
            return Math.pow(base,
                value * baseLog(max / min, base) / axis.axisLength) * min;
        }
        return (value * axis.bounds.range / axis.axisLength) + min;                
    }

    function baseLog(val, base) {
        return Math.log(val) / Math.log(base);
    }

} (window, document, Chartist));

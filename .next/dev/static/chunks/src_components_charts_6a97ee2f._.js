(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/src/components/charts/widgets/ShapeManager.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ShapeManager",
    ()=>ShapeManager
]);
class ShapeManager {
    _shapes = new Map();
    _listeners = new Map();
    register(shape) {
        this._shapes.set(shape.id, shape);
        this.emit('drawing', {
            type: 'create',
            id: shape.id,
            shape
        });
    }
    unregister(id) {
        const shape = this._shapes.get(id);
        if (shape) {
            this._shapes.delete(id);
            this.emit('drawing', {
                type: 'remove',
                id
            });
        }
    }
    get(id) {
        return this._shapes.get(id) || null;
    }
    getAll() {
        return Array.from(this._shapes.values());
    }
    // --- Events ---
    subscribe(event, callback) {
        if (!this._listeners.has(event)) {
            this._listeners.set(event, new Set());
        }
        this._listeners.get(event)?.add(callback);
    }
    unsubscribe(event, callback) {
        this._listeners.get(event)?.delete(callback);
    }
    emit(event, params) {
        this._listeners.get(event)?.forEach((cb)=>cb(params));
    }
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/components/charts/widgets/adapters/LongShortPositionAdapter.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "LongShortPositionAdapter",
    ()=>LongShortPositionAdapter
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$uuid$2f$dist$2f$v4$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__v4$3e$__ = __turbopack_context__.i("[project]/node_modules/uuid/dist/v4.js [app-client] (ecmascript) <export default as v4>");
;
class LongShortPositionAdapter {
    id;
    name;
    _tool;
    _selectionEnabled = true;
    onExecute;
    constructor(tool, type){
        this.id = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$uuid$2f$dist$2f$v4$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__v4$3e$__["v4"])();
        this.name = type;
        this._tool = tool;
        this._tool.onExecute = (trade)=>{
            this.onExecute?.(trade);
        };
    }
    getPoints() {
        const state = this._tool.getData();
        return [
            {
                time: state.timeIndex,
                price: state.entryPrice
            }
        ];
    }
    setPoints(points) {
        if (points.length === 0) return;
        const p = points[0];
        // Use custom update logic if needed, or simply update entry
        this._tool.updatePoint('body', {
            time: p.time,
            price: p.price
        });
        // Trigger update via tool
        this._tool.setSelected(this._tool.isSelected());
    }
    getProperties() {
        const state = this._tool.getData();
        const prefix = this.name === 'Riskrewardlong' ? 'linetoolriskrewardlong' : 'linetoolriskrewardshort';
        return {
            [`${prefix}.stopLevel`]: state.stopLossPrice,
            [`${prefix}.profitLevel`]: state.takeProfitPrice,
            [`${prefix}.entryPrice`]: state.entryPrice,
            [`${prefix}.riskReward`]: state.riskReward,
            [`${prefix}.fixedLeg`]: state.fixedLeg,
            [`${prefix}.fixedStates`]: state.fixedStates,
            [`${prefix}.orderType`]: state.orderType,
            [`${prefix}.lineColor`]: state.lineColor,
            [`${prefix}.stopColor`]: state.stopColor,
            [`${prefix}.profitColor`]: state.profitColor,
            [`${prefix}.fillLabelBackground`]: state.fillLabelBackground,
            [`${prefix}.accountSize`]: state.accountSize,
            [`${prefix}.riskSize`]: state.riskSize,
            [`${prefix}.riskDisplayMode`]: state.riskDisplayMode,
            [`${prefix}.alwaysShowStats`]: state.alwaysShowStats,
            [`${prefix}.compact`]: state.compact,
            [`${prefix}.entryAnchor`]: state.entryAnchor,
            [`${prefix}.slAnchor`]: state.slAnchor,
            [`${prefix}.tpAnchor`]: state.tpAnchor
        };
    }
    setProperties(props) {
        const state = this._tool.getData();
        const prefix = this.name === 'Riskrewardlong' ? 'linetoolriskrewardlong' : 'linetoolriskrewardshort';
        if (typeof props[`${prefix}.stopLevel`] === 'number') state.stopLossPrice = props[`${prefix}.stopLevel`];
        if (typeof props[`${prefix}.profitLevel`] === 'number') state.takeProfitPrice = props[`${prefix}.profitLevel`];
        if (typeof props[`${prefix}.entryPrice`] === 'number') state.entryPrice = props[`${prefix}.entryPrice`];
        if (typeof props[`${prefix}.riskReward`] === 'number') state.riskReward = props[`${prefix}.riskReward`];
        if (typeof props[`${prefix}.fixedLeg`] === 'string') state.fixedLeg = props[`${prefix}.fixedLeg`];
        if (props[`${prefix}.fixedStates`]) state.fixedStates = props[`${prefix}.fixedStates`];
        if (typeof props[`${prefix}.orderType`] === 'string') state.orderType = props[`${prefix}.orderType`];
        if (typeof props[`${prefix}.lineColor`] === 'string') state.lineColor = props[`${prefix}.lineColor`];
        if (typeof props[`${prefix}.stopColor`] === 'string') state.stopColor = props[`${prefix}.stopColor`];
        if (typeof props[`${prefix}.profitColor`] === 'string') state.profitColor = props[`${prefix}.profitColor`];
        if (typeof props[`${prefix}.fillLabelBackground`] === 'boolean') state.fillLabelBackground = props[`${prefix}.fillLabelBackground`];
        if (typeof props[`${prefix}.accountSize`] === 'number') state.accountSize = props[`${prefix}.accountSize`];
        if (typeof props[`${prefix}.riskSize`] === 'number') state.riskSize = props[`${prefix}.riskSize`];
        if (typeof props[`${prefix}.riskDisplayMode`] === 'string') state.riskDisplayMode = props[`${prefix}.riskDisplayMode`];
        if (typeof props[`${prefix}.alwaysShowStats`] === 'boolean') state.alwaysShowStats = props[`${prefix}.alwaysShowStats`];
        if (typeof props[`${prefix}.compact`] === 'boolean') state.compact = props[`${prefix}.compact`];
        if (props[`${prefix}.entryAnchor`] !== undefined) state.entryAnchor = props[`${prefix}.entryAnchor`];
        if (props[`${prefix}.slAnchor`] !== undefined) state.slAnchor = props[`${prefix}.slAnchor`];
        if (props[`${prefix}.tpAnchor`] !== undefined) state.tpAnchor = props[`${prefix}.tpAnchor`];
        this._tool.setSelected(this._tool.isSelected());
    }
    isSelectionEnabled() {
        return this._selectionEnabled;
    }
    setSelection(selected) {
        this._tool.setSelected(selected);
    }
    // Helper to get the raw tool
    getTool() {
        return this._tool;
    }
    getPrimitive() {
        return this._tool;
    }
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/components/charts/widgets/BaseWidget.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "BaseWidget",
    ()=>BaseWidget,
    "WidgetState",
    ()=>WidgetState
]);
var WidgetState = /*#__PURE__*/ function(WidgetState) {
    WidgetState["Idle"] = "Idle";
    WidgetState["Hover"] = "Hover";
    WidgetState["Selected"] = "Selected";
    return WidgetState;
}({});
class BaseWidget {
    _chart = null;
    _series = null;
    _requestUpdate = null;
    _data;
    _state = "Idle";
    _cursor = 'default';
    // Geometry Cache
    _anchors = [];
    // View/Renderer
    _paneViews;
    _visible = true;
    constructor(initialData){
        this._data = initialData;
        this._paneViews = [
            new BaseWidgetPaneView(this)
        ];
    }
    setVisible(visible) {
        this._visible = visible;
        this._requestUpdate?.();
    }
    isVisible() {
        return this._visible;
    }
    // --- ISeriesPrimitive Implementation ---
    attached(param) {
        this._chart = param.chart;
        this._series = param.series;
        this._requestUpdate = param.requestUpdate;
        const container = this._chart.chartElement();
        this.subscribeToEvents(container);
        this.onAttached();
    }
    detached() {
        if (this._chart) {
            const container = this._chart.chartElement();
            this.unsubscribeFromEvents(container);
        }
        this._chart = null;
        this._series = null;
        this._requestUpdate = null;
        this.onDetached();
    }
    paneViews() {
        return this._paneViews;
    }
    // --- Core Behavior (Pillars 1 & 2) ---
    // 1. Visual State Machine
    setSelected(selected) {
        if (selected) {
            this._state = "Selected";
        } else {
            this._state = "Idle";
        }
        this.requestUpdate();
    }
    getState() {
        return this._state;
    }
    // 2. Interaction Logic & Hit Testing
    hitTest(x, y) {
        const point = {
            x,
            y
        };
        const result = this.hitTestInternal(point);
        if (result) {
            return {
                externalId: result.target,
                zOrder: 'top'
            };
        }
        return null;
    }
    hitTestInternal(point) {
        // Priority A: Anchors
        // Only valid if Selected or Hovered (depending on design, usually Hover/Selected shows anchors)
        if (this._state !== "Idle") {
            for (const anchor of this._anchors){
                const dist = Math.sqrt(Math.pow(point.x - anchor.x, 2) + Math.pow(point.y - anchor.y, 2));
                if (dist <= (anchor.radius || 6) + 2) {
                    return {
                        target: anchor.id,
                        cursor: anchor.cursor || 'pointer'
                    };
                }
            }
        }
        // Priority B: Body
        if (this.hitTestBody(point)) {
            return {
                target: 'body',
                cursor: 'move'
            };
        }
        return null;
    }
    // --- Event Handling ---
    _dragTarget = null;
    _dragStartPoint = null;
    _isDragging = false;
    onMouseDown = (e)=>{
        if (!this._chart) return;
        const point = this.getPoint(e);
        const hit = this.hitTestInternal(point);
        if (hit) {
            this._isDragging = true;
            this._dragTarget = hit.target;
            this._dragStartPoint = point;
            this.setSelected(true);
            // Lock chart scroll
            this._chart.applyOptions({
                handleScroll: false,
                handleScale: false
            });
        } else {
            // Clicked outside -> Deselect? 
            // Usually managed by a global ToolManager, but self-management:
            if (this._state === "Selected") {
                this.setSelected(false);
            }
        }
    };
    onMouseMove = (e)=>{
        if (!this._chart) return;
        const rawPoint = this.getPoint(e);
        if (this._isDragging && this._dragTarget && this._dragStartPoint) {
            // DRAGGING
            let targetPoint = {
                ...rawPoint
            };
            // Apply Axis Locks
            const anchor = this._anchors.find((a)=>a.id === this._dragTarget);
            if (anchor && anchor.axisLock) {
                if (anchor.axisLock === 'vertical_only') {
                    targetPoint.x = this._dragStartPoint.x;
                } else if (anchor.axisLock === 'horizontal_only') {
                    targetPoint.y = this._dragStartPoint.y;
                }
            }
            // TODO: Magnet Integration here (Pillar 3)
            // const snapped = MagnetService.snap(targetPoint, ...)
            this.applyDrag(this._dragTarget, targetPoint);
            this.requestUpdate();
            return;
        }
        // HOVERING
        const hit = this.hitTestInternal(rawPoint);
        if (hit) {
            document.body.style.cursor = hit.cursor;
            if (this._state === "Idle") {
                this._state = "Hover";
                this.requestUpdate();
            }
        } else {
            document.body.style.cursor = 'default';
            if (this._state === "Hover") {
                this._state = "Idle";
                this.requestUpdate();
            }
        }
    };
    onMouseUp = ()=>{
        if (this._isDragging) {
            this._isDragging = false;
            this._dragTarget = null;
            this._chart?.applyOptions({
                handleScroll: true,
                handleScale: true
            });
        }
    };
    // --- Helpers ---
    getPoint(e) {
        const rect = e.target.getBoundingClientRect();
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    }
    subscribeToEvents(el) {
        el.addEventListener('mousedown', this.onMouseDown);
        el.addEventListener('mousemove', this.onMouseMove);
        el.addEventListener('mouseup', this.onMouseUp);
        el.addEventListener('mouseleave', this.onMouseUp);
        // Global keydown (attached to document/window, but scope managed via Selection)
        // Note: ChartElement doesn't focus easily. We attach to document but check chart focus/hover?
        // Simpler: attach to document and check if this tool is Selected.
        document.addEventListener('keydown', this.onKeyDown);
    }
    unsubscribeFromEvents(el) {
        el.removeEventListener('mousedown', this.onMouseDown);
        el.removeEventListener('mousemove', this.onMouseMove);
        el.removeEventListener('mouseup', this.onMouseUp);
        el.removeEventListener('mouseleave', this.onMouseUp);
        document.removeEventListener('keydown', this.onKeyDown);
    }
    onKeyDown = (e)=>{
        if (this._state === "Selected") {
            if (e.key === 'Delete' || e.key === 'Backspace') {
                e.preventDefault();
                e.stopPropagation();
                // Self-Destruct
                this._series?.detachPrimitive(this);
            }
        }
    };
    requestUpdate() {
        this._requestUpdate?.();
    }
    // Hooks
    onAttached() {}
    onDetached() {}
    // --- Accessors for Renderer ---
    getChart() {
        return this._chart;
    }
    getSeries() {
        return this._series;
    }
    getAnchors() {
        return this._anchors;
    }
    setAnchors(anchors) {
        this._anchors = anchors;
    }
}
// --- Internal Renderer Classes ---
class BaseWidgetRenderer {
    _widget;
    constructor(_widget){
        this._widget = _widget;
    }
    draw(target) {
        if (!this._widget.isVisible()) return;
        const chart = this._widget.getChart();
        const series = this._widget.getSeries();
        if (!chart || !series) return;
        const ctx = target.useMediaCoordinateSpace ? target.context // Newer API might differ slightly, conceptual
         : target.context || target;
        if (target.useMediaCoordinateSpace) {
            target.useMediaCoordinateSpace((scope)=>this._drawImpl(scope.context, chart, series));
        } else {
            this._drawImpl(ctx, chart, series);
        }
    }
    _drawImpl(ctx, chart, series) {
        // 1. Update Geometry (Recalculate screen coords based on current Time/Price)
        // Note: Ideally geometry update happens before draw, but for LWC primitives it's often done here
        // or cached in the View. BaseWidget handles logic.
        this._widget.updateGeometry(chart.timeScale(), series);
        // 2. Draw Body
        ctx.save();
        this._widget.drawBody(ctx);
        ctx.restore();
        // 3. Draw Anchors (if not Idle)
        const state = this._widget.getState();
        if (state !== "Idle") {
            const anchors = this._widget.getAnchors();
            for (const anchor of anchors){
                this.drawAnchor(ctx, anchor, state === "Selected");
            }
        }
    }
    drawAnchor(ctx, anchor, isSelected) {
        ctx.beginPath();
        ctx.arc(anchor.x, anchor.y, anchor.radius || 5, 0, 2 * Math.PI);
        // Style based on Selection
        ctx.fillStyle = isSelected ? anchor.color || '#FFFFFF' : 'rgba(255, 255, 255, 0.5)';
        ctx.fill();
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1;
        ctx.stroke();
    }
}
class BaseWidgetPaneView {
    _renderer;
    constructor(source){
        this._renderer = new BaseWidgetRenderer(source);
    }
    renderer() {
        return this._renderer;
    }
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/components/charts/widgets/adapters/TrendLineAdapter.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "TrendLineAdapter",
    ()=>TrendLineAdapter
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$charts$2f$widgets$2f$BaseWidget$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/charts/widgets/BaseWidget.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$uuid$2f$dist$2f$v4$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__v4$3e$__ = __turbopack_context__.i("[project]/node_modules/uuid/dist/v4.js [app-client] (ecmascript) <export default as v4>");
;
;
class TrendLineAdapter {
    id;
    name;
    _tool;
    _selectionEnabled = true;
    constructor(tool){
        this.id = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$uuid$2f$dist$2f$v4$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__v4$3e$__["v4"])();
        this.name = 'trend_line';
        this._tool = tool;
    }
    getPoints() {
        const data = this._tool.getData();
        return [
            {
                time: data.p1.time,
                price: data.p1.price
            },
            {
                time: data.p2.time,
                price: data.p2.price
            }
        ];
    }
    setPoints(points) {
        if (points.length < 2) return;
        const data = this._tool.getData();
        data.p1.time = points[0].time;
        data.p1.price = points[0].price;
        data.p2.time = points[1].time;
        data.p2.price = points[1].price;
        // Redraw usually triggered by logic or selection
        this._tool.setSelected(this._tool.getState() === __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$charts$2f$widgets$2f$BaseWidget$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WidgetState"].Selected);
    }
    getProperties() {
        const data = this._tool.getData();
        return {
            "linetooltrendline.linecolor": data.color || '#2962FF',
            "linetooltrendline.linewidth": data.width || 2
        };
    }
    setProperties(props) {
        const data = this._tool.getData();
        if (props["linetooltrendline.linecolor"]) data.color = props["linetooltrendline.linecolor"];
        if (props["linetooltrendline.linewidth"]) data.width = props["linetooltrendline.linewidth"];
        this._tool.setSelected(this._tool.getState() === __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$charts$2f$widgets$2f$BaseWidget$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WidgetState"].Selected);
    }
    setSelection(selected) {
        this._tool.setSelected(selected);
    }
    isSelectionEnabled() {
        return this._selectionEnabled;
    }
    getPrimitive() {
        return this._tool;
    }
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/components/charts/widgets/adapters/HorizontalLineAdapter.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "HorizontalLineAdapter",
    ()=>HorizontalLineAdapter
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$uuid$2f$dist$2f$v4$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__v4$3e$__ = __turbopack_context__.i("[project]/node_modules/uuid/dist/v4.js [app-client] (ecmascript) <export default as v4>");
;
class HorizontalLineAdapter {
    id;
    name;
    _tool;
    _selectionEnabled = true;
    constructor(tool){
        this.id = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$uuid$2f$dist$2f$v4$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__v4$3e$__["v4"])();
        this.name = 'horizontal_line';
        this._tool = tool;
    }
    getPoints() {
        const data = this._tool.getData();
        // Return a dummy time for point representation, as line is infinite
        return [
            {
                time: 0,
                price: data.price
            }
        ];
    }
    setPoints(points) {
        if (points.length < 1) return;
        this._tool.updatePoint('body', {
            time: points[0].time,
            price: points[0].price
        });
        this._tool.setSelected(this._tool.getState() === 'selected');
    }
    getProperties() {
        const data = this._tool.getData();
        return {
            "linetoolhorizontalline.linecolor": data.color,
            "linetoolhorizontalline.linewidth": data.width,
            "linetoolhorizontalline.linestyle": data.lineStyle,
            "linetoolhorizontalline.showLabel": data.showLabel
        };
    }
    setProperties(props) {
        const data = this._tool.getData();
        if (props["linetoolhorizontalline.linecolor"]) data.color = props["linetoolhorizontalline.linecolor"];
        if (props["linetoolhorizontalline.linewidth"]) data.width = props["linetoolhorizontalline.linewidth"];
        if (typeof props["linetoolhorizontalline.linestyle"] !== 'undefined') data.lineStyle = props["linetoolhorizontalline.linestyle"];
        if (typeof props["linetoolhorizontalline.showLabel"] !== 'undefined') data.showLabel = props["linetoolhorizontalline.showLabel"];
        this._tool.setSelected(this._tool.getState() === 'selected');
    }
    setSelection(selected) {
        this._tool.setSelected(selected);
    }
    isSelectionEnabled() {
        return this._selectionEnabled;
    }
    getPrimitive() {
        return this._tool;
    }
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/components/charts/widgets/adapters/HorizontalRayAdapter.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "HorizontalRayAdapter",
    ()=>HorizontalRayAdapter
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$uuid$2f$dist$2f$v4$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__v4$3e$__ = __turbopack_context__.i("[project]/node_modules/uuid/dist/v4.js [app-client] (ecmascript) <export default as v4>");
;
class HorizontalRayAdapter {
    id;
    name;
    _tool;
    _selectionEnabled = true;
    constructor(tool){
        this.id = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$uuid$2f$dist$2f$v4$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__v4$3e$__["v4"])();
        this.name = 'horizontal_ray';
        this._tool = tool;
    }
    getPoints() {
        const data = this._tool.getData();
        return [
            {
                time: data.time,
                price: data.price
            }
        ];
    }
    setPoints(points) {
        if (points.length < 1) return;
        this._tool.updatePoint('anchor', {
            time: points[0].time,
            price: points[0].price
        });
        this._tool.setSelected(this._tool.getState() === 'selected');
    }
    getProperties() {
        const data = this._tool.getData();
        return {
            "linetoolhorizontalray.linecolor": data.color,
            "linetoolhorizontalray.linewidth": data.width
        };
    }
    setProperties(props) {
        const data = this._tool.getData();
        if (props["linetoolhorizontalray.linecolor"]) data.color = props["linetoolhorizontalray.linecolor"];
        if (props["linetoolhorizontalray.linewidth"]) data.width = props["linetoolhorizontalray.linewidth"];
        this._tool.setSelected(this._tool.getState() === 'selected');
    }
    setSelection(selected) {
        this._tool.setSelected(selected);
    }
    isSelectionEnabled() {
        return this._selectionEnabled;
    }
    getPrimitive() {
        return this._tool;
    }
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/components/charts/widgets/MagnetService.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "MagnetService",
    ()=>MagnetService
]);
class MagnetService {
    static mode = 'WEAK';
    static snapRadius = 20;
    static listeners = [];
    /**
     * Set the magnet mode.
     */ static setMode(mode) {
        this.mode = mode;
        this.listeners.forEach((l)=>l(mode));
    }
    static getMode() {
        return this.mode;
    }
    static subscribe(listener) {
        this.listeners.push(listener);
        return ()=>{
            this.listeners = this.listeners.filter((l)=>l !== listener);
        };
    }
    /**
     * Set the snapping radius in pixels.
     */ static setSnapRadius(radius) {
        this.snapRadius = radius;
    }
    /**
     * Snap a pixel coordinate to the nearest OHLC value of the candle under the mouse.
     */ static snap(mouseX, mouseY, series, data, timeScale, timeframe) {
        if (this.mode === 'OFF' || !data || data.length === 0) {
            return {
                x: mouseX,
                y: mouseY,
                snapped: false
            };
        }
        // 1. Coordinate Conversion: Find candle index
        const logical = timeScale.coordinateToLogical(mouseX);
        if (logical === null) return {
            x: mouseX,
            y: mouseY,
            snapped: false
        };
        const index = Math.round(logical);
        const candle = data[index]; // Note: data index might not match logical if there are holes, 
        // but for most implementations it's safe or needs offset adjustment.
        // In Lightweight Charts, logical index usually maps to data index for the main series.
        if (!candle) return {
            x: mouseX,
            y: mouseY,
            snapped: false
        };
        // 2. Data Retrieval: O,H,L,C
        const prices = [
            candle.open,
            candle.high,
            candle.low,
            candle.close
        ];
        let bestY = mouseY;
        let minDistance = Infinity;
        let foundSnap = false;
        let bestType = 'close';
        // 3. Screen Mapping: Convert prices to Y-coordinates
        // We iterate specifically to track the type
        const priceMap = [
            {
                type: 'open',
                val: candle.open
            },
            {
                type: 'high',
                val: candle.high
            },
            {
                type: 'low',
                val: candle.low
            },
            {
                type: 'close',
                val: candle.close
            }
        ];
        for (const p of priceMap){
            const py = series.priceToCoordinate(p.val);
            if (py === null) continue;
            const dist = Math.abs(mouseY - py);
            if (dist < minDistance) {
                minDistance = dist;
                bestY = py;
                foundSnap = true;
                bestType = p.type;
            }
        }
        // 4. Mode Logic
        if (this.mode === 'WEAK' && minDistance > this.snapRadius) {
            return {
                x: mouseX,
                y: mouseY,
                snapped: false
            };
        }
        // Snap X to the center of the candle
        const snappedX = timeScale.logicalToCoordinate(index) ?? mouseX;
        // Determine Label (H, L, BH, BL)
        let label = '';
        if (bestType === 'high') label = 'H';
        else if (bestType === 'low') label = 'L';
        else {
            // Body Logic - Independent of Color
            // Body High = Max(Open, Close)
            // Body Low = Min(Open, Close)
            const snappedPrice = series.coordinateToPrice(bestY) ?? candle.close;
            const bodyTop = Math.max(candle.open, candle.close);
            const bodyBottom = Math.min(candle.open, candle.close);
            // Allow small epsilon for floating point comparison if needed, 
            // but strict comparison usually works with snap
            const distTop = Math.abs(snappedPrice - bodyTop);
            const distBottom = Math.abs(snappedPrice - bodyBottom);
            if (distTop < distBottom) {
                label = 'BH';
            } else {
                label = 'BL';
            }
        }
        return {
            x: snappedX,
            y: bestY,
            snapped: foundSnap,
            anchor: foundSnap ? {
                time: candle.time,
                price: series.coordinateToPrice(bestY) ?? candle.close,
                type: bestType,
                timeframe: timeframe,
                label: label,
                timeString: new Date(candle.time * 1000).toISOString().substr(11, 8) // HH:mm:ss for testing
            } : undefined
        };
    }
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/components/charts/widgets/InteractiveChartObject.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "InteractiveChartObject",
    ()=>InteractiveChartObject
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$charts$2f$widgets$2f$MagnetService$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/charts/widgets/MagnetService.ts [app-client] (ecmascript)");
;
class InteractiveChartObject {
    _chart = null;
    _series = null;
    _requestUpdate = null;
    _isSelected = false;
    _isHovered = false;
    _isDragging = false;
    _dragTarget = null;
    _dragStartPoint = null;
    _seriesData = [];
    _lastClickTime = 0;
    _lastClickTarget = null;
    _lastProcessedX = -1;
    _lastProcessedY = -1;
    _paneViews;
    _timeframe = 'D1';
    constructor(){
        this._paneViews = [
            new InteractiveObjectPaneView(this)
        ];
    }
    setTimeframe(tf) {
        this._timeframe = tf;
    }
    /**
     * Called when an object part is double-clicked.
     */ onDoubleClick(handleId) {
    // Default implementation does nothing
    }
    /**
     * Called when an object part is single-clicked.
     */ onClick(handleId) {
    // Default implementation does nothing
    }
    /**
     * Returns the schema for the settings dialog.
     */ getSettingsSchema() {
        return [];
    }
    /**
     * Applies new settings to the tool.
     */ applySettings(settings) {
    // Default implementation does nothing
    }
    // --- ISeriesPrimitive Implementation ---
    attached(param) {
        this._chart = param.chart;
        this._series = param.series;
        this._requestUpdate = param.requestUpdate;
        const container = this._chart.chartElement();
        container.addEventListener('mousedown', this._onMouseDown);
        container.addEventListener('mousemove', this._onMouseMove);
        container.addEventListener('mouseup', this._onMouseUp);
        container.addEventListener('mouseleave', this._onMouseUp);
        document.addEventListener('keydown', this._onKeyDown);
    }
    detached() {
        try {
            if (this._chart) {
                const container = this._chart.chartElement();
                container.removeEventListener('mousedown', this._onMouseDown);
                container.removeEventListener('mousemove', this._onMouseMove);
                container.removeEventListener('mouseup', this._onMouseUp);
                container.removeEventListener('mouseleave', this._onMouseUp);
            }
        } catch (e) {
            // Chart likely disposed already
            console.warn('[InteractiveChartObject] Failed to cleanup listeners (chart disposed):', e);
        }
        document.removeEventListener('keydown', this._onKeyDown);
        this._chart = null;
        this._series = null;
        this._requestUpdate = null;
    }
    paneViews() {
        return this._paneViews;
    }
    // --- Selection API ---
    setSelected(selected) {
        this._isSelected = selected;
        this._requestUpdate?.();
    }
    isSelected() {
        return this._isSelected;
    }
    getState() {
        if (this._isDragging) return 'drag';
        if (this._isSelected) return 'selected';
        if (this._isHovered) return 'hover';
        return 'idle';
    }
    setSeriesData(data) {
        this._seriesData = data;
    }
    // --- Hit Testing ---
    hitTest(x, y) {
        if (!this._chart || !this._series) return null;
        const point = {
            x,
            y
        };
        // 1. Check Handles (Highest Priority)
        // We check handles even if not selected to allow immediate handle interaction/selection
        const handles = this.getHandles();
        for (const h of handles){
            const hx = this._chart.timeScale().timeToCoordinate(h.time);
            const hy = this._series.priceToCoordinate(h.price);
            if (hx !== null && hy !== null) {
                const dist = Math.sqrt(Math.pow(point.x - hx, 2) + Math.pow(point.y - hy, 2));
                if (dist <= 10) return {
                    externalId: h.id,
                    zOrder: 'top'
                }; // Increased radius slightly to 10
            }
        }
        // 2. Check Body (Subclasses provide custom hit test implementation or we could default to drawShape pixel check?)
        // For simplicity and to match the prompt, we'll assume hitTest is managed by the Tool for now, 
        // but the prompt said "Do NOT implement hit-testing... manually". 
        // This might imply the base class should handle it based on the shape.
        // However, without a path logic, we'll keep it simple: if it's not a handle, we'll rely on the Tool's own check if provided.
        if (this.hitTestBody(point)) {
            return {
                externalId: 'body',
                zOrder: 'top'
            };
        }
        return null;
    }
    /**
     * Subclasses can override for custom body hit detection.
     */ hitTestBody(point) {
        return false;
    }
    // --- Internal Logic ---
    _onMouseDown = (e)=>{
        const point = this._getPoint(e);
        const hit = this.hitTest(point.x, point.y);
        const now = Date.now();
        const doubleClickDelay = 400; // Increased to 400ms
        if (hit) {
            // Manual Double Click Detection
            if (hit.externalId === this._lastClickTarget && now - this._lastClickTime < doubleClickDelay) {
                console.log(`[InteractiveChartObject] Manual Double Click Detected on: ${hit.externalId}`);
                this.onDoubleClick(hit.externalId);
                this._lastClickTime = 0; // Reset
                this._lastClickTarget = null;
                return; // Don't start drag on double click fix toggle
            }
            this._lastClickTime = now;
            this._lastClickTarget = hit.externalId;
            // Also notify of single click (can be used for selection or actions)
            this.onClick(hit.externalId);
            this._isDragging = true;
            this._dragTarget = hit.externalId;
            this._dragStartPoint = point;
            this.setSelected(true);
            this._chart?.applyOptions({
                handleScroll: false,
                handleScale: false
            });
        } else {
            if (this._isSelected) this.setSelected(false);
            this._lastClickTime = 0;
            this._lastClickTarget = null;
        }
    };
    _onMouseMove = (e)=>{
        if (!this._chart || !this._series) return;
        const point = this._getPoint(e);
        // 1. Performance Guard: Only process if mouse actually moved significant distance (e.g. 1px)
        const dx = Math.abs(point.x - this._lastProcessedX);
        const dy = Math.abs(point.y - this._lastProcessedY);
        if (dx < 0.5 && dy < 0.5) return;
        this._lastProcessedX = point.x;
        this._lastProcessedY = point.y;
        if (this._isDragging && this._dragTarget && this._dragStartPoint) {
            const timeScale = this._chart.timeScale();
            const series = this._series;
            // 2. Magnet Snapping (Use RAW point for remote snapping)
            const snapped = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$charts$2f$widgets$2f$MagnetService$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["MagnetService"].snap(point.x, point.y, series, this._seriesData, timeScale, this._timeframe);
            // 3. Constrain by Axis Lock AFTER snapping
            let finalX = snapped.x;
            let finalY = snapped.y;
            if (this._dragTarget !== 'body' && this._dragTarget !== null) {
                const handle = this.getHandles().find((h)=>h.id === this._dragTarget);
                if (handle) {
                    if (handle.axisLock === 'vertical_only') {
                        // Keep time constant: Use the coordinate of the handle's logical time
                        const handleX = timeScale.timeToCoordinate(handle.time);
                        if (handleX !== null) finalX = handleX;
                    }
                    if (handle.axisLock === 'horizontal_only') {
                        // Keep price constant
                        const handleY = series.priceToCoordinate(handle.price);
                        if (handleY !== null) finalY = handleY;
                    }
                }
            }
            const time = timeScale.coordinateToTime(finalX);
            const price = series.coordinateToPrice(finalY);
            if (time && price !== null) {
                this.updatePoint(this._dragTarget, {
                    time: time,
                    price,
                    anchor: snapped.anchor
                });
                this._requestUpdate?.();
            }
            return;
        }
        const hoverHit = this.hitTest(point.x, point.y);
        this._isHovered = !!hoverHit;
        if (hoverHit) {
            let cursor = 'default';
            if (hoverHit.externalId === 'body') {
                cursor = 'move';
            } else {
                const handle = this.getHandles().find((h)=>h.id === hoverHit.externalId);
                cursor = handle?.cursor || 'pointer';
            }
            this._chart.chartElement().style.cursor = cursor;
        } else {
            // Reset cursor when not hovering this object
            const container = this._chart.chartElement();
            if (container.style.cursor !== '' && container.style.cursor !== 'auto') {
                container.style.cursor = '';
            }
        }
    };
    _onMouseUp = ()=>{
        if (this._isDragging) {
            this._isDragging = false;
            this._dragTarget = null;
            this._chart?.applyOptions({
                handleScroll: true,
                handleScale: true
            });
        }
    };
    onRemove;
    _onKeyDown = (e)=>{
        if (this._isSelected && (e.key === 'Delete' || e.key === 'Backspace')) {
            if (this.onRemove) {
                this.onRemove();
            } else {
                this._series?.detachPrimitive(this);
            }
        }
    };
    _getPoint(e) {
        const rect = e.currentTarget.getBoundingClientRect();
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    }
    // --- Renderer Helpers ---
    getSelectionState() {
        return {
            selected: this._isSelected,
            hovered: this._isHovered
        };
    }
    getDragState() {
        return {
            isDragging: this._isDragging,
            dragTarget: this._dragTarget
        };
    }
    getHandlesList() {
        return this.getHandles();
    }
    /**
     * Safely retrieves a coordinate for a time, even if the exact time point doesn't exist in the current timeframe data.
     * Strategies:
     * 1. Direct Lookup (Fastest)
     * 2. Snap to previous available bar (for zoom-outs)
     * 3. Handle off-screen to the left (returns -Coordinate)
     */ getSafeTimeCoordinate(targetTime) {
        if (!this._chart) return null;
        const timeScale = this._chart.timeScale();
        // 1. Try direct lookup
        const x = timeScale.timeToCoordinate(targetTime);
        if (x !== null) return x;
        // 2. Fallback: Find closest valid time in series data
        if (!this._seriesData || this._seriesData.length === 0) return null;
        // Binary search for closest time <= targetTime
        let low = 0;
        let high = this._seriesData.length - 1;
        let closestIndex = -1;
        while(low <= high){
            const mid = Math.floor((low + high) / 2);
            const item = this._seriesData[mid];
            const midTime = typeof item.time === 'number' ? item.time : item.time.value || item.time; // Handle diverse time formats
            if (midTime === targetTime) {
                closestIndex = mid;
                break;
            } else if (midTime < targetTime) {
                closestIndex = mid; // Candidate
                low = mid + 1;
            } else {
                high = mid - 1;
            }
        }
        if (closestIndex !== -1) {
            const closestItem = this._seriesData[closestIndex];
            const closestTime = typeof closestItem.time === 'number' ? closestItem.time : closestItem.time;
            return timeScale.timeToCoordinate(closestTime);
        }
        // 3. Fallback for off-screen left (older than all data)
        // If targetTime is smaller than the first data point, return a negative coordinate
        // We can estimate based on index or just return a safe off-screen number
        const firstItem = this._seriesData[0];
        const firstTime = typeof firstItem.time === 'number' ? firstItem.time : firstItem.time;
        if (targetTime < firstTime) {
            // Return a safe off-screen coordinate. 
            // In LWC, negative coordinates are to the left.
            // We can ask LWC for the coordinate of the first item and subtract.
            const firstX = timeScale.timeToCoordinate(firstTime);
            if (firstX !== null) {
                return firstX - 1000; // Arbitrary safe distance
            }
        }
        return null;
    }
}
class InteractiveObjectRenderer {
    _source;
    constructor(_source){
        this._source = _source;
    }
    draw(target) {
        target.useMediaCoordinateSpace((scope)=>{
            const ctx = scope.context;
            this._source.drawShape(ctx);
            const chart = this._source._chart;
            const series = this._source._series;
            if (!chart || !series) return;
            const { selected } = this._source.getSelectionState();
            const { isDragging, dragTarget } = this._source.getDragState();
            // 1. Draw Drag Guidelines (Full-width dotted line)
            if (isDragging && dragTarget && dragTarget !== 'body') {
                const handles = this._source.getHandles();
                const activeHandle = handles.find((h)=>h.id === dragTarget);
                // Only show guidelines for horizontal levels (axisLock is vertical_only)
                if (activeHandle && activeHandle.axisLock === 'vertical_only') {
                    const y = series.priceToCoordinate(activeHandle.price);
                    if (y !== null) {
                        ctx.save();
                        ctx.setLineDash([
                            4,
                            4
                        ]);
                        ctx.strokeStyle = 'rgba(51, 65, 85, 0.9)'; // Darker Slate (Slate-700 approx)
                        ctx.lineWidth = 1;
                        ctx.beginPath();
                        ctx.moveTo(0, y);
                        ctx.lineTo(scope.mediaSize.width, y);
                        ctx.stroke();
                        ctx.restore();
                    }
                }
            }
            // 2. Draw Handles if selected or hovered
            if (selected || this._source._isHovered) {
                const handles = this._source.getHandles();
                for (const h of handles){
                    const x = chart.timeScale().timeToCoordinate(h.time);
                    const y = series.priceToCoordinate(h.price);
                    if (x !== null && y !== null) {
                        this._drawAnchor(ctx, x, y);
                    }
                }
            }
        });
    }
    _drawAnchor(ctx, x, y) {
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, Math.PI * 2);
        ctx.fillStyle = '#FFFFFF';
        ctx.fill();
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1;
        ctx.stroke();
    }
}
class InteractiveObjectPaneView {
    _renderer;
    constructor(source){
        this._renderer = new InteractiveObjectRenderer(source);
    }
    renderer() {
        return this._renderer;
    }
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/components/charts/widgets/LongShortCalculator.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "LongShortCalculator",
    ()=>LongShortCalculator
]);
class LongShortCalculator {
    /**
     * Calculates the missing value based on which leg is fixed.
     */ static recalculate(params, changedId, isLong) {
        const result = {
            ...params
        };
        const { tp: tpFixed, sl: slFixed, rr: rrFixed } = params.fixedStates;
        if (changedId === 'entry') {
            if (rrFixed) {
                // If SL is fixed, update TP. If TP is fixed, update SL. 
                // If neither/both, prioritize updating TP from fixed SL distance.
                if (slFixed && tpFixed) {
                    // Special Case: All fixed. Move Entry implies re-calculating RR if we keep SL/TP fixed?
                    // No, if Entry moves and SL/TP are fixed, RR changes.
                    result.riskReward = this.calculateRR(result.entryPrice, result.stopLossPrice, result.takeProfitPrice, isLong);
                } else if (slFixed) result.takeProfitPrice = this.calculateTP(result.entryPrice, result.stopLossPrice, result.riskReward, isLong);
                else if (tpFixed) result.stopLossPrice = this.calculateSL(result.entryPrice, result.takeProfitPrice, result.riskReward, isLong);
                else result.takeProfitPrice = this.calculateTP(result.entryPrice, result.stopLossPrice, result.riskReward, isLong);
            } else {
                // RR is not fixed. Just update the ratio.
                result.riskReward = this.calculateRR(result.entryPrice, result.stopLossPrice, result.takeProfitPrice, isLong);
            }
        } else if (changedId === 'tp') {
            // EXCEPTION: If SL and TP and RR are ALL fixed, and we are moving TP,
            // we must NOT move SL (violation of fixed SL). We must update RR (violation of fixed RR).
            // User rule: "fixed level must not change" -> implied priority over RR.
            if (rrFixed && slFixed && tpFixed) {
                result.riskReward = this.calculateRR(result.entryPrice, result.stopLossPrice, result.takeProfitPrice, isLong);
            } else if (rrFixed) {
                // RR is fixed, SL must move to maintain R
                result.stopLossPrice = this.calculateSL(result.entryPrice, result.takeProfitPrice, result.riskReward, isLong);
            } else {
                // SL or Entry is fixed (implied by dragging only TP), update RR
                result.riskReward = this.calculateRR(result.entryPrice, result.stopLossPrice, result.takeProfitPrice, isLong);
            }
        } else if (changedId === 'sl') {
            // EXCEPTION: Same as above.
            if (rrFixed && slFixed && tpFixed) {
                result.riskReward = this.calculateRR(result.entryPrice, result.stopLossPrice, result.takeProfitPrice, isLong);
            } else if (rrFixed) {
                // RR is fixed, TP must move to maintain R
                result.takeProfitPrice = this.calculateTP(result.entryPrice, result.stopLossPrice, result.riskReward, isLong);
            } else {
                // TP or Entry is fixed, update RR
                result.riskReward = this.calculateRR(result.entryPrice, result.stopLossPrice, result.takeProfitPrice, isLong);
            }
        } else if (changedId === 'rr') {
            // Manual RR change (from settings or else)
            // If SL is fixed, move TP. If TP is fixed, move SL.
            if (slFixed || !tpFixed) {
                result.takeProfitPrice = this.calculateTP(result.entryPrice, result.stopLossPrice, result.riskReward, isLong);
            } else {
                result.stopLossPrice = this.calculateSL(result.entryPrice, result.takeProfitPrice, result.riskReward, isLong);
            }
        }
        return result;
    }
    static calculateRR(entry, sl, tp, isLong) {
        const risk = Math.abs(entry - sl);
        const reward = Math.abs(tp - entry);
        if (risk === 0) return 0;
        // Directional validation
        const isValid = isLong ? tp > entry && sl < entry : tp < entry && sl > entry;
        if (!isValid) return 0;
        return parseFloat((reward / risk).toFixed(2));
    }
    static calculateTP(entry, sl, rr, isLong) {
        const risk = Math.abs(entry - sl);
        const reward = risk * rr;
        return isLong ? entry + reward : entry - reward;
    }
    static calculateSL(entry, tp, rr, isLong) {
        const reward = Math.abs(entry - tp);
        if (rr === 0) return entry;
        const risk = reward / rr;
        return isLong ? entry - risk : entry + risk;
    }
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/components/charts/LongShortPosition.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "LongShortPosition",
    ()=>LongShortPosition
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$charts$2f$widgets$2f$InteractiveChartObject$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/charts/widgets/InteractiveChartObject.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$charts$2f$widgets$2f$LongShortCalculator$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/charts/widgets/LongShortCalculator.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$TradeLogService$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/services/TradeLogService.ts [app-client] (ecmascript)");
;
;
;
class LongShortPosition extends __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$charts$2f$widgets$2f$InteractiveChartObject$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["InteractiveChartObject"] {
    _data;
    _width = 200;
    _lastMarketPrice = null;
    onExecute;
    constructor(initialData){
        super();
        this._data = initialData;
    }
    /**
     * Define the points for TP, SL, and Entry (Move).
     */ getHandles() {
        return [
            {
                id: 'tp',
                time: this._data.timeIndex,
                price: this._data.takeProfitPrice,
                axisLock: 'vertical_only',
                cursor: 'ns-resize'
            },
            {
                id: 'sl',
                time: this._data.timeIndex,
                price: this._data.stopLossPrice,
                axisLock: 'vertical_only',
                cursor: 'ns-resize'
            },
            {
                id: 'entry',
                time: this._data.timeIndex,
                price: this._data.entryPrice,
                axisLock: 'vertical_only',
                cursor: 'ns-resize'
            }
        ];
    }
    getSettingsSchema() {
        return [
            {
                id: 'riskReward',
                label: 'Risk Reward',
                type: 'number',
                value: this._data.riskReward
            },
            {
                id: 'fixedLeg',
                label: 'Fixed Leg',
                type: 'select',
                value: this._data.fixedLeg,
                options: [
                    'tp',
                    'sl',
                    'rr'
                ]
            },
            {
                id: 'profitColor',
                label: 'Profit Color',
                type: 'color',
                value: this._data.profitColor || 'rgba(20, 184, 166, 0.25)'
            },
            {
                id: 'stopColor',
                label: 'Stop Color',
                type: 'color',
                value: this._data.stopColor || 'rgba(244, 63, 94, 0.25)'
            },
            {
                id: 'lineColor',
                label: 'Line Color',
                type: 'color',
                value: this._data.lineColor || '#94a3b8'
            },
            {
                id: 'riskSize',
                label: 'Risk Amount',
                type: 'number',
                value: this._data.riskSize || 0
            }
        ];
    }
    /**
     * Handles dragging of any part of the tool.
     */ onDoubleClick(hitId) {
        console.log(`[LongShortPosition] Double click on: ${hitId}`);
        // --- 1. Identify what is being toggled ---
        const isRRToggle = hitId === 'rr_panel';
        const isSLToggle = hitId === 'sl';
        const isTPToggle = hitId === 'tp';
        const isEntryToggle = hitId === 'entry';
        // Capture current state BEFORE toggle
        const { sl: slFixed, tp: tpFixed, rr: rrFixed, entry: entryFixed } = this._data.fixedStates;
        // --- 2. Apply Toggle & Enforce Rules ---
        if (isRRToggle) {
            // User wants to toggle RR
            const newRRState = !rrFixed;
            this._data.fixedStates.rr = newRRState;
            if (newRRState) {
                // If turning RR ON, check conflicts
                // Rule: If SL and TP are both fixed, unfix TP (per user request: "takeprofit must resolve its fixation")
                if (slFixed && tpFixed) {
                    this._data.fixedStates.tp = false;
                }
            // Case: Limit Mode (Entry Fixed) - If Entry, SL, RR fixed -> TP Dynamic (Automatic)
            }
        } else if (isSLToggle) {
            // User wants to toggle SL
            const newSLState = !slFixed;
            this._data.fixedStates.sl = newSLState;
            if (newSLState) {
                // If turning SL ON
                // Rule: If TP and RR are fixed, unfix RR (per user request: "rr must be cancelled")
                if (tpFixed && rrFixed) {
                    this._data.fixedStates.rr = false;
                }
            // Limit Mode: Entry, RR, SL fixed -> TP Dynamic (Automatic)
            // Limit Mode: Entry, TP, SL fixed -> RR Dynamic (Automatic)
            // Note: If Entry+RR are fixed, and we fix SL -> We have Entry+RR+SL. TP becomes dynamic.
            // But wait, user said "is entry, tp and rr fixed and we fix sl, then rr is cancelled."
            // My logic above handles "TP and RR fixed", which covers both Market and Limit (since Entry doesn't matter for this collision).
            }
        } else if (isTPToggle) {
            // User wants to toggle TP
            const newTPState = !tpFixed;
            this._data.fixedStates.tp = newTPState;
            if (newTPState) {
                // If turning TP ON
                // Rule: If SL and RR are fixed, unfix RR (Symmetric assumption based on other rules)
                // Also covers user rule for Limit: "is entry, sl and rr fixed and we fix tp, then we cancel rr."
                if (slFixed && rrFixed) {
                    this._data.fixedStates.rr = false;
                }
            }
        } else if (isEntryToggle) {
            // Entry Fixed State mainly meaningful for Limit Orders or "Anchored Market"
            const newEntryState = !entryFixed;
            this._data.fixedStates.entry = newEntryState;
            // If user fixes the entry, it implies a specific price is desired -> Switch to LIMIT
            if (newEntryState) {
                this._data.orderType = 'LIMIT';
            } else {
                // If user unfixes the entry, revert to MARKET
                this._data.orderType = 'MARKET';
                // Snap to current market price immediately if available
                if (this._lastMarketPrice !== null) {
                    this.updateMarketPrice(this._lastMarketPrice, this._data.timeIndex);
                }
            }
        }
        // --- 3. Update Legacy & Request Render ---
        this._updateFixedLegLegacy();
        this._requestUpdate?.();
    }
    updateMarketPrice(price, time) {
        this._lastMarketPrice = price;
        // Don't auto-update if we are currently dragging this specific tool
        if (this._isDragging) return;
        if (this._data.orderType === 'MARKET') {
            const priceDelta = price - this._data.entryPrice;
            const { sl: slFixed, tp: tpFixed, rr: rrFixed } = this._data.fixedStates;
            // Critical Rule: If Entry, SL, TP, and RR are ALL effectively fixed, we CANNOT move anything.
            // If TP and SL and RR are fixed -> Entry is mathematically locked.
            if (tpFixed && slFixed && rrFixed) {
                return;
            }
            // Update timeIndex to track with the current candle
            this._data.timeIndex = time;
            // Case 1: Nothing fixed (except maybe RR) -> Shift everything (body move)
            // This is "floating" mode where the whole structure follows the price
            if (!slFixed && !tpFixed) {
                this._data.entryPrice = price;
                this._data.takeProfitPrice += priceDelta;
                this._data.stopLossPrice += priceDelta;
                // Clear anchors when floating because we are drifting away from original snap
                this._data.slAnchor = null;
                this._data.tpAnchor = null;
                this._data.entryAnchor = null;
            // Note: We don't need to call ApplyCalculations here because RR remains identical by definition of a linear shift
            } else {
                this.updatePoint('entry', {
                    time: time,
                    price: price
                });
            }
            this._requestUpdate?.();
        }
    }
    onClick(hitId) {
        // Renamed hitId logic but catching old ID just in case or using the new semantic
        if (hitId === 'order_type_toggle' || hitId === 'execute_btn') {
            // This button now acts as the Execute Trigger
            const validation = this._validateState();
            if (!validation.isValid) {
                console.warn(`[LongShortPosition] Cannot execute: ${validation.reason}`);
                // Optional: Provide UI feedback (flash red?) - For now console warn and no-op is safer
                return;
            }
            const trade = this.getTradeObject();
            // --- TRADE TRACKING INTEGRATION ---
            // 1. Generate ID
            const tradeId = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$TradeLogService$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TradeLogService"].getNextId();
            // 2. Inject ID
            trade.id = tradeId;
            // 3. Log to DB
            __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$TradeLogService$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TradeLogService"].logTrade(trade);
            // ----------------------------------
            console.log(`[LongShortPosition] Execute clicked! ID: ${tradeId}`, trade);
            this.onExecute?.(trade);
        }
    }
    _updateFixedLegLegacy() {
        if (this._data.fixedStates.rr) this._data.fixedLeg = 'rr';
        else if (this._data.fixedStates.tp) this._data.fixedLeg = 'tp';
        else if (this._data.fixedStates.sl) this._data.fixedLeg = 'sl';
    }
    updatePoint(handleId, newPoint) {
        const isLong = this._data.takeProfitPrice > this._data.entryPrice;
        if (handleId === 'tp') {
            this._data.takeProfitPrice = newPoint.price;
            this._data.tpAnchor = newPoint.anchor || null; // Store anchor if provided, else clear
            this._applyCalculations('tp', isLong);
        } else if (handleId === 'sl') {
            this._data.stopLossPrice = newPoint.price;
            this._data.slAnchor = newPoint.anchor || null; // Store anchor if provided, else clear
            this._applyCalculations('sl', isLong);
        } else if (handleId === 'entry') {
            this._data.entryPrice = newPoint.price;
            this._data.entryAnchor = newPoint.anchor || null;
            this._applyCalculations('entry', isLong);
        } else if (handleId === 'body') {
            const priceDelta = newPoint.price - this._data.entryPrice;
            this._data.entryPrice = newPoint.price;
            this._data.takeProfitPrice += priceDelta;
            this._data.stopLossPrice += priceDelta;
            // Clear anchors on body move
            this._data.slAnchor = null;
            this._data.tpAnchor = null;
            this._data.entryAnchor = null;
            // Safety check for time
            if (newPoint.time && !isNaN(newPoint.time)) {
                this._data.timeIndex = newPoint.time;
            }
        }
    }
    applySettings(settings) {
        const oldRR = this._data.riskReward;
        this._data = {
            ...this._data,
            ...settings
        };
        // If RR manually changed in settings, trigger recalculation
        if (this._data.riskReward !== oldRR) {
            const isLong = this._data.takeProfitPrice > this._data.entryPrice;
            this._applyCalculations('rr', isLong);
        }
        this._requestUpdate?.();
    }
    _applyCalculations(changedId, isLong) {
        const updated = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$charts$2f$widgets$2f$LongShortCalculator$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["LongShortCalculator"].recalculate(this._data, changedId, isLong);
        this._data.entryPrice = updated.entryPrice;
        this._data.stopLossPrice = updated.stopLossPrice;
        this._data.takeProfitPrice = updated.takeProfitPrice;
        this._data.riskReward = updated.riskReward;
    }
    _validateState() {
        const { sl: slFixed, tp: tpFixed, rr: rrFixed, entry: entryFixed } = this._data.fixedStates;
        const { slAnchor, tpAnchor, orderType } = this._data;
        if (orderType === 'MARKET') {
            // Market Rules:
            // 1. Exactly 2 fixed elements out of SL, TP, RR
            const fixedCount = (slFixed ? 1 : 0) + (tpFixed ? 1 : 0) + (rrFixed ? 1 : 0);
            if (fixedCount !== 2) {
                return {
                    isValid: false,
                    reason: 'Market req 2 fixed legs'
                };
            }
            // 2. If SL/TP Fixed -> Must have Anchor
            if (slFixed && !slAnchor) return {
                isValid: false,
                reason: 'SL fixed needs Anchor'
            };
            if (tpFixed && !tpAnchor) return {
                isValid: false,
                reason: 'TP fixed needs Anchor'
            };
        } else {
            // Limit/Stop Rules:
            // Must have Entry fixed (defines limit nature)
            if (!entryFixed) {
                return {
                    isValid: false,
                    reason: 'Limit req Entry fixed'
                };
            }
            // Must have 2 others fixed (SL, TP, RR)
            const remainingFixed = (slFixed ? 1 : 0) + (tpFixed ? 1 : 0) + (rrFixed ? 1 : 0);
            if (remainingFixed < 2) {
                // Technically we need enough info to derive the 3rd.
                // Entry + SL + RR -> TP derived
                // Entry + TP + RR -> SL derived
                // Entry + SL + TP -> RR derived
                return {
                    isValid: false,
                    reason: 'Limit req 2 of SL/TP/RR fixed'
                };
            }
        // Check Anchors only if the leg is actively fixed
        // REMOVED STRICT CHECK: User expects 'Fixed' (Locked Price) to be valid even without 'Anchor' (Magnet Snap)
        // if (slFixed && !slAnchor) return { isValid: false, reason: 'SL needs Anchor' };
        // if (tpFixed && !tpAnchor) return { isValid: false, reason: 'TP needs Anchor' };
        // Entry anchor check skipped as we don't store it yet, fixed state implies user intent
        }
        return {
            isValid: true
        };
    }
    drawShape(ctx) {
        if (!this._chart || !this._series) return;
        const timeScale = this._chart.timeScale();
        const series = this._series;
        const x = timeScale.timeToCoordinate(this._data.timeIndex);
        const yEntry = series.priceToCoordinate(this._data.entryPrice);
        const yTP = series.priceToCoordinate(this._data.takeProfitPrice);
        const ySL = series.priceToCoordinate(this._data.stopLossPrice);
        if (x === null || yEntry === null || yTP === null || ySL === null) return;
        const width = this._width;
        // Colors
        const profitColor = this._data.profitColor || 'rgba(20, 184, 166, 0.25)'; // Higher vibrancy
        const stopColor = this._data.stopColor || 'rgba(244, 63, 94, 0.25)';
        const lineColor = this._data.lineColor || '#94a3b8';
        // 1. Draw Profit Zone
        ctx.fillStyle = profitColor;
        const tpTop = Math.min(yEntry, yTP);
        const tpHeight = Math.abs(yEntry - yTP);
        ctx.fillRect(x, tpTop, width, tpHeight);
        // 2. Draw Loss Zone
        ctx.fillStyle = stopColor;
        const slTop = Math.min(yEntry, ySL);
        const slHeight = Math.abs(yEntry - ySL);
        ctx.fillRect(x, slTop, width, slHeight);
        // --- Draw Levels with visual fix feedback ---
        ctx.save();
        const drawLevel = (y, isFixed, color, label)=>{
            if (y === null || isNaN(y)) return;
            ctx.beginPath();
            if (isFixed) {
                ctx.strokeStyle = '#000000'; // Black for fixed
                ctx.lineWidth = 1;
                ctx.setLineDash([]); // Ensure solid
            } else {
                ctx.strokeStyle = color;
                ctx.lineWidth = 1;
            }
            ctx.moveTo(x, y);
            ctx.lineTo(x + width, y);
            ctx.stroke();
        };
        drawLevel(yTP, this._data.fixedStates.tp, 'rgba(20, 184, 166, 0.8)', 'TP');
        drawLevel(ySL, this._data.fixedStates.sl, 'rgba(244, 63, 94, 0.8)', 'SL');
        drawLevel(yEntry, this._data.fixedStates.entry, '#FFFFFF', 'ENTRY');
        ctx.restore();
        // --- Draw Stats Box (Professional Panel) ---
        const ratio = this._data.riskReward.toFixed(2);
        const isLong = this._data.takeProfitPrice > this._data.entryPrice;
        const boxWidth = 65; // Reduced from 85
        const boxHeight = 18; // Reduced from 26
        const boxX = x + (width - boxWidth) / 2;
        const boxY = yEntry - boxHeight / 2;
        ctx.save();
        // Box Background
        ctx.fillStyle = lineColor;
        ctx.globalAlpha = 0.95;
        this._roundRect(ctx, boxX, boxY, boxWidth, boxHeight, 4);
        ctx.fill();
        // Shadow/Border (Fixed RR feedback)
        if (this._data.fixedStates.rr) {
            ctx.strokeStyle = '#000000'; // Dark border for fixed RR
            ctx.lineWidth = 1; // Thinner border (User request)
            ctx.stroke();
        } else {
            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = 1;
            ctx.globalAlpha = 0.2;
            ctx.stroke();
        }
        ctx.restore();
        // Text
        ctx.font = 'bold 10px Inter, sans-serif'; // Reduced from 12px
        ctx.fillStyle = '#FFFFFF';
        ctx.textAlign = 'center';
        ctx.fillText(`${ratio} R`, boxX + boxWidth / 2, boxY + 13); // Adjusted y-offset for smaller box
        // --- BUTTON LAYOUT LOGIC ---
        // Top Slot: yEntry - (boxHeight/2) - gap - buttonHeight
        // Bottom Slot: yEntry + (boxHeight/2) + gap
        const btnHeight = 16; // Reduced from 20
        const btnWidth = 140; // Increased to 140 for longer labels
        const gap = 8; // Increased from 2 (User request)
        const topY = yEntry - boxHeight / 2 - btnHeight - gap;
        const bottomY = yEntry + boxHeight / 2 + gap;
        const btnX = x + (width - btnWidth) / 2;
        // Single Button Position: Keep "Market" position (Top for Short, Bottom for Long)
        const buttonY = isLong ? bottomY : topY;
        // Validation Check for Border Color
        const validation = this._validateState();
        const isValid = validation.isValid;
        // 1. Trade Type & Execution Button
        ctx.save();
        // Background Color based on Validity
        // Valid -> Green, Invalid -> Red
        const btnColor = isValid ? 'rgba(16, 185, 129, 1)' : 'rgba(239, 68, 68, 1)';
        const shadowColor = 'rgba(0, 0, 0, 0.4)';
        // "Step" Effect (Shadow)
        // Draw a shadow rect slightly offset (y+2)
        ctx.fillStyle = shadowColor;
        this._roundRect(ctx, btnX, buttonY + 2, btnWidth, btnHeight, 4);
        ctx.fill();
        // Main Button Body
        ctx.fillStyle = btnColor;
        this._roundRect(ctx, btnX, buttonY, btnWidth, btnHeight, 4);
        ctx.fill();
        // Border: Thin Black (User request: "schwarze dünne (1px) umrandung")
        ctx.lineWidth = 1;
        ctx.strokeStyle = '#000000';
        ctx.stroke();
        // Label
        ctx.font = 'bold 8px Inter, sans-serif'; // Reduced from 9px
        // White text (User preference reverted)
        ctx.fillStyle = '#FFFFFF';
        ctx.textAlign = 'center';
        let label = '';
        if (this._data.orderType === 'MARKET') {
            label = 'EXECUTE MARKET ORDER';
        } else {
            // Default to LIMIT
            label = 'PLACE LIMIT ORDER';
            if (this._lastMarketPrice !== null) {
                const entry = this._data.entryPrice;
                const market = this._lastMarketPrice;
                if (isLong) {
                    // Buying: Below market = Limit, Above market = Stop
                    label = entry < market ? 'PLACE LIMIT ORDER' : 'PLACE STOP ORDER';
                } else {
                    // Selling: Above market = Limit, Below market = Stop
                    label = entry > market ? 'PLACE LIMIT ORDER' : 'PLACE STOP ORDER';
                }
            }
        }
        ctx.fillText(label, btnX + btnWidth / 2, buttonY + 11); // Adjusted offset for 16px height
        ctx.restore();
        ctx.textAlign = 'start';
    }
    getTradeObject() {
        // Validation Check before object creation? 
        // The execute click handler checks validation, so here we assume valid or return what we have.
        // We ensure data integrity (0 values).
        const isLong = this._data.takeProfitPrice > this._data.entryPrice;
        // Helper to formatting anchor
        const formatAnchor = (anchor)=>{
            if (!anchor) return null;
            return {
                time: anchor.time,
                price: anchor.price,
                type: anchor.type.toUpperCase(),
                timeframe: anchor.timeframe
            };
        };
        // Logic to determine specific Limit vs Stop
        let finalOrderType = this._data.orderType; // 'MARKET' or 'LIMIT'
        if (this._data.orderType === 'LIMIT' && this._lastMarketPrice !== null) {
            const entry = this._data.entryPrice;
            const market = this._lastMarketPrice;
            if (isLong) {
                // Buying: Below market = LIMIT, Above market = STOP
                finalOrderType = entry < market ? 'LIMIT' : 'STOP';
            } else {
                // Selling: Above market = LIMIT, Below market = STOP
                finalOrderType = entry > market ? 'LIMIT' : 'STOP';
            }
        }
        return {
            symbol: this._data.symbol || this._series?._symbol || 'UNKNOWN',
            orderType: finalOrderType,
            direction: isLong ? 'LONG' : 'SHORT',
            // Entry Configuration
            entry: this._data.orderType === 'MARKET' ? {
                type: 'MARKET',
                fixed: this._data.fixedStates.entry,
                price: this._data.fixedStates.entry ? this._data.entryPrice : 0,
                anchor: formatAnchor(this._data.entryAnchor)
            } : {
                type: 'LIMIT',
                fixed: this._data.fixedStates.entry,
                price: this._data.fixedStates.entry ? this._data.entryPrice : 0,
                anchor: formatAnchor(this._data.entryAnchor)
            },
            // Stop Loss Configuration
            sl: {
                type: 'PROTECTION',
                fixed: this._data.fixedStates.sl,
                price: this._data.fixedStates.sl ? this._data.stopLossPrice : 0,
                anchor: formatAnchor(this._data.slAnchor)
            },
            // Take Profit Configuration
            tp: {
                type: 'TARGET',
                fixed: this._data.fixedStates.tp,
                price: this._data.fixedStates.tp ? this._data.takeProfitPrice : 0,
                anchor: formatAnchor(this._data.tpAnchor)
            },
            // Risk Reward - "wenn nicht fixiert, dann 0 übergeben"
            riskReward: {
                value: this._data.fixedStates.rr ? this._data.riskReward : 0,
                fixed: this._data.fixedStates.rr
            },
            // Metadata for Visualization (Concrete Calculated Values)
            meta: {
                initialEntry: this._data.entryPrice,
                initialSL: this._data.stopLossPrice,
                initialTP: this._data.takeProfitPrice
            }
        };
    }
    _roundRect(ctx, x, y, width, height, radius) {
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
    }
    /**
     * Detect hits on the tool body or buttons.
     */ hitTest(x, y) {
        if (!this._chart || !this._series) return null;
        const timeScale = this._chart.timeScale();
        const xPos = timeScale.timeToCoordinate(this._data.timeIndex);
        const yEntry = this._series.priceToCoordinate(this._data.entryPrice);
        if (xPos !== null && yEntry !== null) {
            const boxWidth = 65; // Sync with draw
            const boxHeight = 18; // Sync with draw
            const boxX = xPos + (this._width - boxWidth) / 2;
            const boxY = yEntry - boxHeight / 2;
            // 1. Hit test for the stats box (RR Fix Toggle)
            // We check this BEFORE handles/body to prioritize the stats panel
            if (x >= boxX && x <= boxX + boxWidth && y >= boxY && y <= boxY + boxHeight) {
                return {
                    externalId: 'rr_panel',
                    zOrder: 'top'
                };
            }
            // Button Layout Logic
            const isLong = this._data.takeProfitPrice > this._data.entryPrice;
            const btnHeight = 16; // Sync
            const btnWidth = 140; // Sync
            const gap = 8; // Sync
            const topY = yEntry - 18 / 2 - btnHeight - gap; // 18 is boxHeight
            const bottomY = yEntry + 18 / 2 + gap;
            const btnX = xPos + (this._width - btnWidth) / 2;
            const buttonY = isLong ? bottomY : topY;
            // 2. Hit test for Order Type/Execute Button
            if (x >= btnX && x <= btnX + btnWidth && y >= buttonY && y <= buttonY + btnHeight) {
                return {
                    externalId: 'order_type_toggle',
                    zOrder: 'top'
                };
            }
        }
        // 3. Check handles and body (base class logic)
        return super.hitTest(x, y);
    }
    hitTestBody(point) {
        if (!this._chart || !this._series) return false;
        const x = this._chart.timeScale().timeToCoordinate(this._data.timeIndex);
        const yTP = this._series.priceToCoordinate(this._data.takeProfitPrice);
        const ySL = this._series.priceToCoordinate(this._data.stopLossPrice);
        if (x === null || yTP === null || ySL === null) return false;
        const yTop = Math.min(yTP, ySL);
        const yBottom = Math.max(yTP, ySL);
        return point.x >= x && point.x <= x + this._width && point.y >= yTop && point.y <= yBottom;
    }
    // Accessor for adapters
    getData() {
        return this._data;
    }
    getStorageState() {
        return this._data;
    }
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/components/charts/TrendLineTool.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "TrendLineTool",
    ()=>TrendLineTool
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$charts$2f$widgets$2f$BaseWidget$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/charts/widgets/BaseWidget.ts [app-client] (ecmascript)");
;
class TrendLineTool extends __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$charts$2f$widgets$2f$BaseWidget$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["BaseWidget"] {
    _p1Coords = null;
    _p2Coords = null;
    constructor(initialState){
        super(initialState);
    }
    getData() {
        return this._data;
    }
    updateGeometry(timeScale, series) {
        const { p1, p2 } = this._data;
        const x1 = timeScale.timeToCoordinate(p1.time);
        const y1 = series.priceToCoordinate(p1.price);
        const x2 = timeScale.timeToCoordinate(p2.time);
        const y2 = series.priceToCoordinate(p2.price);
        if (x1 !== null && y1 !== null && x2 !== null && y2 !== null) {
            this._p1Coords = {
                x: x1,
                y: y1
            };
            this._p2Coords = {
                x: x2,
                y: y2
            };
            this.setAnchors([
                {
                    id: 'p1',
                    x: x1,
                    y: y1,
                    color: this._data.color || '#2962FF',
                    cursor: 'move',
                    axisLock: 'free'
                },
                {
                    id: 'p2',
                    x: x2,
                    y: y2,
                    color: this._data.color || '#2962FF',
                    cursor: 'move',
                    axisLock: 'free'
                }
            ]);
        } else {
            this._p1Coords = null;
            this._p2Coords = null;
            this.setAnchors([]);
        }
    }
    drawBody(ctx) {
        if (!this._p1Coords || !this._p2Coords) return;
        ctx.beginPath();
        ctx.moveTo(this._p1Coords.x, this._p1Coords.y);
        ctx.lineTo(this._p2Coords.x, this._p2Coords.y);
        ctx.strokeStyle = this._data.color || '#2962FF';
        ctx.lineWidth = this._data.width || 2;
        if (this._state === __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$charts$2f$widgets$2f$BaseWidget$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WidgetState"].Hover || this._state === __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$charts$2f$widgets$2f$BaseWidget$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WidgetState"].Selected) {
            ctx.shadowBlur = 4;
            ctx.shadowColor = ctx.strokeStyle;
        } else {
            ctx.shadowBlur = 0;
        }
        ctx.stroke();
        ctx.shadowBlur = 0;
    }
    hitTestBody(point) {
        if (!this._p1Coords || !this._p2Coords) return false;
        // Distance from point to line segment
        const dist = this._distToSegment(point, this._p1Coords, this._p2Coords);
        return dist < 6; // 6px tolerance
    }
    applyDrag(target, newPoint) {
        const series = this.getSeries();
        const timeScale = this.getChart()?.timeScale();
        if (!series || !timeScale) return;
        const newPrice = series.coordinateToPrice(newPoint.y);
        const newTime = timeScale.coordinateToTime(newPoint.x);
        if (newPrice === null || newTime === null) return;
        if (target === 'p1') {
            this._data.p1.price = newPrice;
            this._data.p1.time = newTime;
        } else if (target === 'p2') {
            this._data.p2.price = newPrice;
            this._data.p2.time = newTime;
        } else if (target === 'body') {
            // Move both points by delta
            if (!this._p1Coords || !this._p2Coords) return;
            // We need the drag start delta in world coordinates or logic here
            // But applyDrag receives the current mouse point.
            // Simplified: calculate delta from previous p1/p2 (which is what BaseWidget does via this._dragStartPoint)
            // Wait, BaseWidget's onMouseMove calculates the newPoint.
            // Let's use the delta from the start of the drag.
            // I'll need to store the initial state at drag start if I want perfect delta movement.
            // BaseWidget doesn't pass Delta.
            // I'll calculate it against the current data.
            // NOTE: This might accumulate error if done per frame with logical time.
            // Standard approach: calculate delta in pixels, then back to price/time.
            // Since this is called every frame, moving by "delta from entryPrice" (newPrice - oldEntry) is correct.
            const deltaPrice = newPrice - (target === 'body' ? series.coordinateToPrice(this._dragStartPoint.y) : 0); // Simplified for now
            // Actually, let's just use the current point difference.
            // To do this correctly, I need the "last" point.
            // I'll just shift p1 and p2 by the same logical delta.
            const priceP1 = series.coordinateToPrice(newPoint.y);
            const timeP1 = timeScale.coordinateToTime(newPoint.x);
            // BETTER: BaseWidget should probably support "dragBody" better.
            // For now, I'll calculate the delta between newPoint and the point that was clicked (body hit).
            // But wait, applyDrag is generic.
            // Let's use a simpler approach: 
            // If dragging body, calculate how much price/time changed since start of drag.
            const startPrice = series.coordinateToPrice(this._dragStartPoint.y);
            const startTime = timeScale.coordinateToTime(this._dragStartPoint.x);
            if (startPrice !== null && startTime !== null) {
                const dPrice = newPrice - startPrice;
                const dTime = newTime - startTime;
                // We use a backup of the points at drag start to avoid accumulation
                // For now, I'll just apply it once? No, this is called every frame.
                // I'll add a temporary "dragStartData" if I can, or just accept the logic.
                // Let's assume the user wants simple "move all" logic.
                // For TrendLine, "move all" means shifting both points.
                // I'll store the 'originalP1' and 'originalP2' in a temporary field if possible.
                // Or I use the delta since last call.
                // Direct implementation:
                this._data.p1.price += dPrice;
                this._data.p1.time += dTime;
                this._data.p2.price += dPrice;
                this._data.p2.time += dTime;
                // IMPORTANT: Reset dragStartPoint to current so next frame delta is relative to this one.
                // This prevents exponential growth if we don't have "original" backup.
                this._dragStartPoint = {
                    ...newPoint
                };
            }
        }
    }
    _distToSegment(p, v, w) {
        const l2 = Math.pow(v.x - w.x, 2) + Math.pow(v.y - w.y, 2);
        if (l2 === 0) return Math.sqrt(Math.pow(p.x - v.x, 2) + Math.pow(p.y - v.y, 2));
        let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
        t = Math.max(0, Math.min(1, t));
        return Math.sqrt(Math.pow(p.x - (v.x + t * (w.x - v.x)), 2) + Math.pow(p.y - (v.y + t * (w.y - v.y)), 2));
    }
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/components/charts/widgets/HorizontalLineWidget.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "HorizontalLineWidget",
    ()=>HorizontalLineWidget
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$charts$2f$widgets$2f$InteractiveChartObject$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/charts/widgets/InteractiveChartObject.ts [app-client] (ecmascript)");
;
class HorizontalLineWidget extends __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$charts$2f$widgets$2f$InteractiveChartObject$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["InteractiveChartObject"] {
    _data;
    constructor(initialData){
        super();
        this._data = initialData;
        this._timeframe = initialData.anchor?.timeframe || 'D1';
    }
    getHandles() {
        return [
            {
                id: 'drag',
                time: this._data.time,
                price: this._data.price,
                axisLock: 'free',
                // Actually, if we want the line to only move vertically, we should lock vertical_only?
                // But user might want to slide the handle left/right to move it out of the way.
                // Let's use 'free' so the handle follows mouse, and we update price/time.
                cursor: 'move'
            }
        ];
    }
    updatePoint(handleId, newPoint) {
        if (handleId === 'body' || handleId === 'drag') {
            this._data.price = newPoint.price;
            this._data.time = newPoint.time; // Update handle position
            this._data.anchor = newPoint.anchor || null;
            this._requestUpdate?.();
        }
    }
    drawShape(ctx) {
        if (!this._chart || !this._series) return;
        const series = this._series;
        const y = series.priceToCoordinate(this._data.price);
        if (y === null) return;
        const width = ctx.canvas.width; // Approx screen width
        ctx.save();
        ctx.beginPath();
        // Set Styles
        ctx.strokeStyle = this._data.color;
        ctx.lineWidth = this._data.width;
        // Line Pattern
        // LWC LineStyle: 0=Solid, 1=Dotted, 2=Dashed, 3=LargeDashed, 4=SparseDotted
        if (this._data.lineStyle === 1) ctx.setLineDash([
            2,
            2
        ]);
        else if (this._data.lineStyle === 2) ctx.setLineDash([
            6,
            6
        ]);
        else ctx.setLineDash([]);
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
        // Label on Right Axis (Simulated)
        if (this._data.showLabel) {
            const text = series.priceFormatter().format(this._data.price);
            ctx.font = '11px sans-serif';
            ctx.fillStyle = this._data.color;
            ctx.fillText(text, width - 60, y - 4);
        }
        ctx.restore();
    }
    hitTestBody(point) {
        if (!this._series) return false;
        const y = this._series.priceToCoordinate(this._data.price);
        if (y === null) return false;
        const tolerance = 6 + this._data.width / 2;
        return Math.abs(point.y - y) <= tolerance;
    }
    getSettingsSchema() {
        return [
            {
                id: 'color',
                label: 'Color',
                type: 'color',
                value: this._data.color
            },
            {
                id: 'width',
                label: 'Width',
                type: 'number',
                value: this._data.width
            },
            {
                id: 'showLabel',
                label: 'Show Price Label',
                type: 'boolean',
                value: this._data.showLabel
            }
        ];
    }
    applySettings(settings) {
        this._data = {
            ...this._data,
            ...settings
        };
        this._requestUpdate?.();
    }
    getData() {
        return this._data;
    }
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/components/charts/widgets/HorizontalRayWidget.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "HorizontalRayWidget",
    ()=>HorizontalRayWidget
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$charts$2f$widgets$2f$InteractiveChartObject$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/charts/widgets/InteractiveChartObject.ts [app-client] (ecmascript)");
;
class HorizontalRayWidget extends __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$charts$2f$widgets$2f$InteractiveChartObject$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["InteractiveChartObject"] {
    _data;
    constructor(initialData){
        super();
        this._data = initialData;
        this._timeframe = initialData.anchor?.timeframe || 'D1';
    }
    getHandles() {
        return [
            {
                id: 'anchor',
                time: this._data.time,
                price: this._data.price,
                axisLock: 'free',
                cursor: 'move'
            }
        ];
    }
    updatePoint(handleId, newPoint) {
        if (handleId === 'anchor' || handleId === 'body') {
            this._data.time = newPoint.time;
            this._data.price = newPoint.price;
            this._data.anchor = newPoint.anchor || null;
            this._requestUpdate?.();
        }
    }
    drawShape(ctx) {
        if (!this._chart || !this._series) return;
        const timeScale = this._chart.timeScale();
        const series = this._series;
        const x = this.getSafeTimeCoordinate(this._data.time);
        const y = series.priceToCoordinate(this._data.price);
        if (x === null || y === null) return;
        const width = ctx.canvas.width; // Draw to end of canvas
        ctx.save();
        ctx.beginPath();
        // Style
        ctx.strokeStyle = this._data.color;
        ctx.lineWidth = this._data.width;
        ctx.moveTo(x, y);
        ctx.lineTo(width, y);
        ctx.stroke();
        ctx.restore();
    }
    hitTestBody(point) {
        if (!this._series || !this._chart) return false;
        const timeScale = this._chart.timeScale();
        const x = this.getSafeTimeCoordinate(this._data.time);
        const y = this._series.priceToCoordinate(this._data.price);
        if (x === null || y === null) return false;
        const tolerance = 6 + this._data.width / 2;
        // Ray logic: y must match AND x must be >= startX
        return Math.abs(point.y - y) <= tolerance && point.x >= x;
    }
    getSettingsSchema() {
        return [
            {
                id: 'color',
                label: 'Color',
                type: 'color',
                value: this._data.color
            },
            {
                id: 'width',
                label: 'Width',
                type: 'number',
                value: this._data.width
            }
        ];
    }
    applySettings(settings) {
        this._data = {
            ...this._data,
            ...settings
        };
        this._requestUpdate?.();
    }
    getData() {
        return this._data;
    }
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/components/charts/widgets/adapters/VerticalLineAdapter.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "VerticalLineAdapter",
    ()=>VerticalLineAdapter
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$uuid$2f$dist$2f$v4$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__v4$3e$__ = __turbopack_context__.i("[project]/node_modules/uuid/dist/v4.js [app-client] (ecmascript) <export default as v4>");
;
class VerticalLineAdapter {
    id;
    name;
    _tool;
    _selectionEnabled = true;
    constructor(tool){
        this.id = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$uuid$2f$dist$2f$v4$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__v4$3e$__["v4"])();
        this.name = 'vertical_line';
        this._tool = tool;
    }
    getPoints() {
        const data = this._tool.getData();
        return [
            {
                time: data.time,
                price: data.price
            }
        ];
    }
    setPoints(points) {
        if (points.length < 1) return;
        this._tool.updatePoint('body', {
            time: points[0].time,
            price: points[0].price
        });
        this._tool.setSelected(this._tool.getState() === 'selected');
    }
    getProperties() {
        const data = this._tool.getData();
        return {
            "linetoolverticalline.linecolor": data.color,
            "linetoolverticalline.linewidth": data.width,
            "linetoolverticalline.linestyle": data.lineStyle,
            "linetoolverticalline.showLabel": data.showLabel
        };
    }
    setProperties(props) {
        const data = this._tool.getData();
        if (props["linetoolverticalline.linecolor"]) data.color = props["linetoolverticalline.linecolor"];
        if (props["linetoolverticalline.linewidth"]) data.width = props["linetoolverticalline.linewidth"];
        if (typeof props["linetoolverticalline.linestyle"] !== 'undefined') data.lineStyle = props["linetoolverticalline.linestyle"];
        if (typeof props["linetoolverticalline.showLabel"] !== 'undefined') data.showLabel = props["linetoolverticalline.showLabel"];
        this._tool.setSelected(this._tool.getState() === 'selected');
    }
    setSelection(selected) {
        this._tool.setSelected(selected);
    }
    isSelectionEnabled() {
        return this._selectionEnabled;
    }
    getPrimitive() {
        return this._tool;
    }
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/components/charts/widgets/VerticalLineWidget.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "VerticalLineWidget",
    ()=>VerticalLineWidget
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$charts$2f$widgets$2f$InteractiveChartObject$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/charts/widgets/InteractiveChartObject.ts [app-client] (ecmascript)");
;
class VerticalLineWidget extends __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$charts$2f$widgets$2f$InteractiveChartObject$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["InteractiveChartObject"] {
    _data;
    constructor(initialData){
        super();
        this._data = initialData;
        this._timeframe = initialData.anchor?.timeframe || 'D1';
    }
    getHandles() {
        return [
            {
                id: 'drag',
                time: this._data.time,
                price: this._data.price,
                // axisLock: 'horizontal_only', // Ideally we want to lock Y (Price) so handle stays put? 
                // But dragging free allows user to position handle where they want on the line.
                axisLock: 'free',
                cursor: 'ew-resize' // East-West resize
            }
        ];
    }
    updatePoint(handleId, newPoint) {
        if (handleId === 'body' || handleId === 'drag') {
            this._data.time = newPoint.time;
            this._data.price = newPoint.price; // Update handle vertical position too
            this._data.anchor = newPoint.anchor || null;
            this._requestUpdate?.();
        }
    }
    drawShape(ctx) {
        if (!this._chart || !this._series) return;
        const timeScale = this._chart.timeScale();
        const x = timeScale.timeToCoordinate(this._data.time);
        if (x === null) return;
        const height = ctx.canvas.height; // Screen height
        ctx.save();
        ctx.beginPath();
        // Set Styles
        ctx.strokeStyle = this._data.color;
        ctx.lineWidth = this._data.width;
        // Line Pattern
        if (this._data.lineStyle === 1) ctx.setLineDash([
            2,
            2
        ]);
        else if (this._data.lineStyle === 2) ctx.setLineDash([
            6,
            6
        ]);
        else ctx.setLineDash([]);
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
        // Label at bottom or top? Horizontal line has it on right axis.
        // Vertical line logic often has date at bottom.
        // But lightweight-charts handles date axis.
        // Maybe we just draw a small text near the top?
        if (this._data.showLabel) {
            const dateStr = new Date(this._data.time * 1000).toLocaleDateString();
            ctx.font = '11px sans-serif';
            ctx.fillStyle = this._data.color;
            ctx.fillText(dateStr, x + 5, 20); // 20px from top
        }
        ctx.restore();
    }
    hitTestBody(point) {
        if (!this._chart) return false;
        const timeScale = this._chart.timeScale();
        const x = timeScale.timeToCoordinate(this._data.time);
        if (x === null) return false;
        const tolerance = 6 + this._data.width / 2;
        return Math.abs(point.x - x) <= tolerance;
    }
    getSettingsSchema() {
        return [
            {
                id: 'color',
                label: 'Color',
                type: 'color',
                value: this._data.color
            },
            {
                id: 'width',
                label: 'Width',
                type: 'number',
                value: this._data.width
            },
            {
                id: 'showLabel',
                label: 'Show Date Label',
                type: 'boolean',
                value: this._data.showLabel
            }
        ];
    }
    applySettings(settings) {
        this._data = {
            ...this._data,
            ...settings
        };
        this._requestUpdate?.();
    }
    getData() {
        return this._data;
    }
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/components/charts/ActivePositionTool.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ActivePositionTool",
    ()=>ActivePositionTool
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$charts$2f$widgets$2f$InteractiveChartObject$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/charts/widgets/InteractiveChartObject.ts [app-client] (ecmascript)");
;
class ActivePositionTool extends __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$charts$2f$widgets$2f$InteractiveChartObject$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["InteractiveChartObject"] {
    _data;
    _width = 0;
    constructor(data){
        super();
        this._data = data;
    }
    updatePrice(type, price) {
        if (type === 'entry') this._data.entryPrice = price;
        if (type === 'sl') this._data.stopLossPrice = price;
        if (type === 'tp') this._data.takeProfitPrice = price;
        this._requestUpdate?.();
    }
    updateProfit(profit) {
        this._data.currentProfit = profit;
        this._requestUpdate?.();
    }
    /**
     * Called by ChartWidget when a new tick arrives.
     * Calculates PnL locally for instant feedback.
     */ updateMarketPrice(price, time) {
        // Simple PnL Calculation
        // If we have volume, we can try to estimate.
        // For now, if we don't have volume/contract details, we might just trust the external updateProfit?
        // BUT the user complains about sync.
        // If we assume standard Forex/CFD: (Current - Entry) * Volume * ContractSize
        if (this._data.entryPrice && this._data.volume) {
            const diff = price - this._data.entryPrice;
            const dirMult = this._data.direction === 'LONG' ? 1 : -1;
            // Default Contract Size 1 if not set (or 100000?)
            // We need to pass this from the trade data.
            // For now, let's use a simplified multiplier or fallback to just price diff if volume is missing.
            const multiplier = this._data.contractSize || 1;
            const rawPnL = diff * dirMult * this._data.volume * multiplier;
            this._data.currentProfit = rawPnL;
            this._requestUpdate?.();
        }
    }
    getHandles() {
        // We only want handles on the right edge, but for now we can just return standard handles
        // IF we want them draggable later. For now, visual only as per requirements
        // "später aber erst! den level verschieben kann" -> "Only later draggable"
        // So no handles for now? Or just visual handles?
        // User said: "am rechten rand dann eine grifffläche... (später aber erst! den level verschieben kann)"
        // So we draw the grip, but maybe don't enable dragging yet?
        // Or we implement handles but return empty here to disable interaction?
        return [];
    }
    drawShape(ctx) {
        if (!this._chart || !this._series) return;
        const series = this._series;
        const width = this._chart.timeScale().width();
        const range = this._chart.timeScale().getVisibleRange();
        // We draw full width, so we need coordinates from 0 to width?
        // Or we use the visible logical range.
        // Canvas is sized to the chart pane. 0 is left, width is right.
        const drawDashedLine = (price, color)=>{
            if (price === undefined || price === 0) return;
            const y = series.priceToCoordinate(price);
            if (y === null) return;
            ctx.beginPath();
            ctx.strokeStyle = color;
            ctx.lineWidth = 1;
            ctx.setLineDash([
                4,
                4
            ]); // Dashed
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
            ctx.setLineDash([]); // Reset
        };
        const drawHandle = (price, color, label, isEntry = false)=>{
            if (price === undefined || price === 0) return;
            const y = series.priceToCoordinate(price);
            if (y === null) return;
            // Handle Settings
            const marginRight = 5; // Closer to edge
            const handleWidth = 100;
            const handleHeight = 22;
            const handleX = width - marginRight - handleWidth;
            const handleY = y - handleHeight / 2;
            // 1. Clear Line behind Handle (White Background)
            ctx.fillStyle = '#FFFFFF';
            // Note: In Dark Mode this should be dark. We assume White for now or need theme.
            // Ideally we just fill the rect.
            ctx.beginPath();
            ctx.roundRect(handleX, handleY, handleWidth, handleHeight, 4);
            ctx.fill();
            // 2. Border
            ctx.strokeStyle = color;
            ctx.lineWidth = 1;
            ctx.stroke();
            // 3. Text
            // Profit Text smaller to fit 5 digits
            ctx.font = isEntry ? '10px sans-serif' : '11px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            // Profit Color Logic for Entry
            if (isEntry) {
                const p = this._data.currentProfit || 0;
                ctx.fillStyle = p >= 0 ? '#10B981' : '#EF4444'; // Green/Red Text
            } else {
                ctx.fillStyle = color; // Label Color matches Line
            }
            // Calc Text X (Center of payload area?)
            // Area: [Width - CloseBtn]
            const closeBtnWidth = 20;
            const contentWidth = handleWidth - closeBtnWidth;
            const textX = handleX + contentWidth / 2;
            ctx.fillText(label, textX, handleY + handleHeight / 2 + 1);
            // 4. Divider (Light)
            ctx.beginPath();
            ctx.strokeStyle = 'rgba(200, 200, 200, 0.5)';
            ctx.moveTo(handleX + contentWidth, handleY);
            ctx.lineTo(handleX + contentWidth, handleY + handleHeight);
            ctx.stroke();
            // 5. Close "X"
            const closeX = handleX + contentWidth + closeBtnWidth / 2;
            const closeY = handleY + handleHeight / 2;
            ctx.fillStyle = '#94a3b8'; // Slate-400
            ctx.font = '12px sans-serif';
            ctx.fillText('×', closeX, closeY); // Standard Multiplication Sign or 'x'
        };
        // Colors
        // Entry: Blue/Black? User said "Entry: Black" originally. But TV usually Blue.
        const entryColor = this._data.lineColor || '#000000'; // Fallback
        const slColor = this._data.stopColor || 'rgba(239, 68, 68, 1)';
        const tpColor = this._data.profitColor || 'rgba(16, 185, 129, 1)';
        // 1. Draw Lines First (Background)
        drawDashedLine(this._data.takeProfitPrice, tpColor);
        drawDashedLine(this._data.stopLossPrice, slColor);
        drawDashedLine(this._data.entryPrice, entryColor);
        // 2. Draw Handles (Foreground)
        if (this._data.takeProfitPrice) drawHandle(this._data.takeProfitPrice, tpColor, "Take Profit");
        if (this._data.stopLossPrice) drawHandle(this._data.stopLossPrice, slColor, "Stop Loss");
        // Entry Label: Profit
        const profitVal = this._data.currentProfit || 0;
        const cur = this._data.currency || 'USD';
        const profitTxt = `${profitVal > 0 ? '+' : ''}${profitVal.toFixed(2)} ${cur}`;
        drawHandle(this._data.entryPrice, entryColor, profitTxt, true);
    }
    hitTest(x, y) {
        // Interaction disabled for now
        return null;
    }
    updatePoint(handleId, newPoint) {
    // No-op for now as we don't have draggable points yet
    }
    getData() {
        return this._data;
    }
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/components/charts/widgets/adapters/ActivePositionAdapter.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ActivePositionAdapter",
    ()=>ActivePositionAdapter
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$uuid$2f$dist$2f$v4$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__v4$3e$__ = __turbopack_context__.i("[project]/node_modules/uuid/dist/v4.js [app-client] (ecmascript) <export default as v4>");
;
class ActivePositionAdapter {
    id;
    name = 'ActivePosition';
    _tool;
    _selectionEnabled = false;
    constructor(tool){
        this.id = tool.getData().id || (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$uuid$2f$dist$2f$v4$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__v4$3e$__["v4"])(); // Use Trade ID if possible
        this._tool = tool;
    }
    getPoints() {
        // Not really point-based in the traditional sense
        const d = this._tool.getData();
        return [
            {
                time: 0,
                price: d.entryPrice
            }
        ];
    }
    setPoints(points) {
    // No-op
    }
    getProperties() {
        return this._tool.getData();
    }
    setProperties(props) {
        // Update logic if needed
        const d = this._tool.getData();
        if (props.entryPrice !== undefined) d.entryPrice = props.entryPrice;
        if (props.stopLossPrice !== undefined) d.stopLossPrice = props.stopLossPrice;
        if (props.takeProfitPrice !== undefined) d.takeProfitPrice = props.takeProfitPrice;
        if (props.direction !== undefined) d.direction = props.direction;
        if (props.currentProfit !== undefined) d.currentProfit = props.currentProfit;
    }
    isSelectionEnabled() {
        return false;
    }
    setSelection(selected) {
    // No-op
    }
    getTool() {
        return this._tool;
    }
    getPrimitive() {
        return this._tool;
    }
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/components/charts/widgets/ChartWidget.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ChartWidget",
    ()=>ChartWidget
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$charts$2f$widgets$2f$ShapeManager$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/charts/widgets/ShapeManager.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$charts$2f$widgets$2f$adapters$2f$LongShortPositionAdapter$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/charts/widgets/adapters/LongShortPositionAdapter.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$charts$2f$widgets$2f$adapters$2f$TrendLineAdapter$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/charts/widgets/adapters/TrendLineAdapter.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$charts$2f$widgets$2f$adapters$2f$HorizontalLineAdapter$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/charts/widgets/adapters/HorizontalLineAdapter.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$charts$2f$widgets$2f$adapters$2f$HorizontalRayAdapter$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/charts/widgets/adapters/HorizontalRayAdapter.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$charts$2f$LongShortPosition$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/charts/LongShortPosition.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$charts$2f$TrendLineTool$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/charts/TrendLineTool.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$charts$2f$widgets$2f$HorizontalLineWidget$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/charts/widgets/HorizontalLineWidget.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$charts$2f$widgets$2f$HorizontalRayWidget$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/charts/widgets/HorizontalRayWidget.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$charts$2f$widgets$2f$adapters$2f$VerticalLineAdapter$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/charts/widgets/adapters/VerticalLineAdapter.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$charts$2f$widgets$2f$VerticalLineWidget$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/charts/widgets/VerticalLineWidget.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$charts$2f$ActivePositionTool$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/charts/ActivePositionTool.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$charts$2f$widgets$2f$adapters$2f$ActivePositionAdapter$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/charts/widgets/adapters/ActivePositionAdapter.ts [app-client] (ecmascript)");
;
;
;
;
;
;
;
;
;
;
;
;
;
class ChartWidget {
    _chart;
    _series;
    _shapeManager;
    _symbol = 'UNKNOWN';
    _data = [];
    id;
    constructor(id, chart, series){
        this.id = id;
        this._chart = chart;
        this._series = series;
        this._shapeManager = new __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$charts$2f$widgets$2f$ShapeManager$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ShapeManager"]();
    }
    setSymbol(symbol) {
        this._symbol = symbol;
    }
    _currentTimeframe = 'D1';
    // --- Factory Method ---
    async createShape(point, options) {
        let shape = null;
        let primitive = null;
        if (options.shape === 'Riskrewardlong' || options.shape === 'Riskrewardshort') {
            const isLong = options.shape === 'Riskrewardlong';
            let initialState;
            if (options.restoreState) {
                initialState = options.restoreState;
                if (!initialState.symbol) initialState.symbol = this._symbol;
            } else {
                const price = point.price;
                const spread = price * 0.0005;
                initialState = {
                    entryPrice: price,
                    stopLossPrice: isLong ? price - spread : price + spread,
                    takeProfitPrice: isLong ? price + spread * 2 : price - spread * 2,
                    timeIndex: point.time,
                    riskReward: 2.0,
                    fixedLeg: 'rr',
                    fixedStates: {
                        tp: false,
                        sl: false,
                        entry: false,
                        rr: true
                    },
                    orderType: 'MARKET',
                    symbol: this._symbol
                };
            }
            // Apply overrides if any (and not restoring or force override)
            if (options.overrides && !options.restoreState) {
                const overrides = options.overrides;
                const prefix = isLong ? 'linetoolriskrewardlong' : 'linetoolriskrewardshort';
                if (typeof overrides[`${prefix}.stopLevel`] === 'number') initialState.stopLossPrice = overrides[`${prefix}.stopLevel`];
                if (typeof overrides[`${prefix}.profitLevel`] === 'number') initialState.takeProfitPrice = overrides[`${prefix}.profitLevel`];
                if (typeof overrides[`${prefix}.entryPrice`] === 'number') initialState.entryPrice = overrides[`${prefix}.entryPrice`];
                if (typeof overrides[`${prefix}.riskReward`] === 'number') initialState.riskReward = overrides[`${prefix}.riskReward`];
                if (typeof overrides[`${prefix}.fixedLeg`] === 'string') initialState.fixedLeg = overrides[`${prefix}.fixedLeg`];
                if (typeof overrides[`${prefix}.lineColor`] === 'string') initialState.lineColor = overrides[`${prefix}.lineColor`];
                if (typeof overrides[`${prefix}.stopColor`] === 'string') initialState.stopColor = overrides[`${prefix}.stopColor`];
                if (typeof overrides[`${prefix}.profitColor`] === 'string') initialState.profitColor = overrides[`${prefix}.profitColor`];
                if (typeof overrides[`${prefix}.accountSize`] === 'number') initialState.accountSize = overrides[`${prefix}.accountSize`];
                if (typeof overrides[`${prefix}.riskSize`] === 'number') initialState.riskSize = overrides[`${prefix}.riskSize`];
                if (typeof overrides[`${prefix}.riskDisplayMode`] === 'string') initialState.riskDisplayMode = overrides[`${prefix}.riskDisplayMode`];
                if (typeof overrides[`${prefix}.compact`] === 'boolean') initialState.compact = overrides[`${prefix}.compact`];
                if (typeof overrides[`${prefix}.symbol`] === 'string') initialState.symbol = overrides[`${prefix}.symbol`];
            }
            // Create Tool
            const tool = new __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$charts$2f$LongShortPosition$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["LongShortPosition"](initialState);
            // Set Selection if requested
            if (options.disableSelection) {
            // We might need a way to disable selection on the tool
            // tool.setSelectionEnabled(false); // TODO: Add to PositionTool
            }
            // Create Adapter
            shape = new __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$charts$2f$widgets$2f$adapters$2f$LongShortPositionAdapter$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["LongShortPositionAdapter"](tool, options.shape);
            primitive = tool;
            tool.setTimeframe(this._currentTimeframe);
        } else if (options.shape === 'trend_line') {
            // Note: The 'points' array is not directly available in createShape.
            // Assuming 'point' is the first point, and a second point might be added later
            // or this block is intended for createMultipointShape.
            // For now, we'll use 'point' for p1 and a default for p2.
            const p1 = point;
            const p2 = {
                time: p1.time,
                price: p1.price
            }; // Default second point same as first
            const initialState = {
                p1: {
                    ...p1,
                    time: p1.time
                },
                p2: {
                    ...p2,
                    time: p2.time
                },
                color: options.overrides?.["linetooltrendline.linecolor"],
                width: options.overrides?.["linetooltrendline.linewidth"]
            };
            const tool = new __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$charts$2f$TrendLineTool$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TrendLineTool"](initialState);
            shape = new __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$charts$2f$widgets$2f$adapters$2f$TrendLineAdapter$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TrendLineAdapter"](tool);
            primitive = tool;
        } else if (options.shape === 'HorizontalLine') {
            const initialState = {
                price: point.price,
                time: point.time,
                color: options.overrides?.["linetoolhorizontalline.linecolor"] || '#2962FF',
                width: options.overrides?.["linetoolhorizontalline.linewidth"] || 2,
                lineStyle: 0,
                showLabel: true,
                fixed: false,
                anchor: options.overrides?.anchor
            };
            const tool = new __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$charts$2f$widgets$2f$HorizontalLineWidget$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["HorizontalLineWidget"](initialState);
            shape = new __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$charts$2f$widgets$2f$adapters$2f$HorizontalLineAdapter$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["HorizontalLineAdapter"](tool);
            primitive = tool;
        } else if (options.shape === 'HorizontalRay') {
            const initialState = {
                time: point.time,
                price: point.price,
                color: options.overrides?.["linetoolhorizontalray.linecolor"] || '#2962FF',
                width: options.overrides?.["linetoolhorizontalray.linewidth"] || 2,
                anchor: options.overrides?.anchor
            };
            const tool = new __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$charts$2f$widgets$2f$HorizontalRayWidget$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["HorizontalRayWidget"](initialState);
            shape = new __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$charts$2f$widgets$2f$adapters$2f$HorizontalRayAdapter$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["HorizontalRayAdapter"](tool);
            primitive = tool;
        } else if (options.shape === 'VerticalLine') {
            const initialState = {
                time: point.time,
                price: point.price,
                color: options.overrides?.["linetoolverticalline.linecolor"] || '#2962FF',
                width: options.overrides?.["linetoolverticalline.linewidth"] || 2,
                lineStyle: 0,
                showLabel: false,
                fixed: false,
                anchor: options.overrides?.anchor
            };
            const tool = new __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$charts$2f$widgets$2f$VerticalLineWidget$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["VerticalLineWidget"](initialState);
            shape = new __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$charts$2f$widgets$2f$adapters$2f$VerticalLineAdapter$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["VerticalLineAdapter"](tool);
            primitive = tool;
        } else if (options.shape === 'ActivePosition') {
            // New Active Position Tool logic
            // Expect overrides to contain the full state
            const overrides = options.overrides;
            const initialState = {
                id: overrides.id || 'UNKNOWN',
                symbol: overrides.symbol || this._symbol,
                direction: overrides.direction || 'LONG',
                entryPrice: overrides.entryPrice || point.price,
                stopLossPrice: overrides.stopLossPrice,
                takeProfitPrice: overrides.takeProfitPrice,
                // visuals
                lineColor: overrides.lineColor || '#000000',
                stopColor: overrides.stopColor || 'rgba(239, 68, 68, 1)',
                profitColor: overrides.profitColor || 'rgba(16, 185, 129, 1)'
            };
            const tool = new __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$charts$2f$ActivePositionTool$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ActivePositionTool"](initialState);
            shape = new __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$charts$2f$widgets$2f$adapters$2f$ActivePositionAdapter$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ActivePositionAdapter"](tool);
            primitive = tool;
        }
        if (shape && primitive) {
            // Apply Data 
            if (this._data.length > 0 && typeof primitive.setSeriesData === 'function') {
                primitive.setSeriesData(this._data);
            }
            // Register
            this._shapeManager.register(shape);
            // Attach to Chart
            this._series.attachPrimitive(primitive);
            // Register execution listener for the UI to pick up
            if (shape instanceof __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$charts$2f$widgets$2f$adapters$2f$LongShortPositionAdapter$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["LongShortPositionAdapter"]) {
                shape.onExecute = (trade)=>{
                    this._shapeManager.emit('execute', {
                        trade,
                        id: shape?.id
                    });
                };
            }
            // Default Selection for new tools (UX Requirement: Visible handles on creation)
            if (shape && typeof shape.setSelection === 'function') {
                if (!options.restoreState) {
                    shape.setSelection(true);
                }
            }
            // Wire up deletion sync
            if (primitive && primitive.onRemove === undefined) {
                // If not already defined (though we just defined it on the class)
                // We assign it here to control the flow
                primitive.onRemove = ()=>{
                    if (shape) this.removeEntity(shape.id);
                };
            } else if (primitive) {
                // Force override to ensure it calls OUR removeEntity
                primitive.onRemove = ()=>{
                    if (shape) this.removeEntity(shape.id);
                };
            }
            return shape.id;
        }
        throw new Error(`Unsupported shape type: ${options.shape}`);
    }
    setTimeframe(tf) {
        this._currentTimeframe = tf;
        // Propagate to existing tools
        const allShapes = this._shapeManager.getAll();
        allShapes.forEach((s)=>{
            const p = s.getPrimitive();
            if (p && typeof p.setTimeframe === 'function') {
                p.setTimeframe(tf);
            }
        });
    }
    // --- Multipoint ---
    async createMultipointShape(points, options) {
        let shape = null;
        let primitive = null;
        if (options.shape === 'trend_line') {
            const p1 = points[0] || {
                time: 0,
                price: 0
            };
            const p2 = points[1] || {
                time: p1.time,
                price: p1.price
            };
            const initialState = {
                p1: {
                    ...p1,
                    time: p1.time
                },
                p2: {
                    ...p2,
                    time: p2.time
                },
                color: options.overrides?.["linetooltrendline.linecolor"],
                width: options.overrides?.["linetooltrendline.linewidth"]
            };
            const tool = new __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$charts$2f$TrendLineTool$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TrendLineTool"](initialState);
            shape = new __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$charts$2f$widgets$2f$adapters$2f$TrendLineAdapter$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TrendLineAdapter"](tool);
            primitive = tool;
        }
        if (shape && primitive) {
            // Apply Data 
            if (this._data.length > 0 && typeof primitive.setSeriesData === 'function') {
                primitive.setSeriesData(this._data);
            }
            this._shapeManager.register(shape);
            this._series.attachPrimitive(primitive);
            return shape.id;
        }
        throw new Error(`Shape type ${options.shape} not supported in createMultipointShape`);
    }
    // --- Management ---
    getAllShapes() {
        return this._shapeManager.getAll();
    }
    getShapeById(id) {
        return this._shapeManager.get(id);
    }
    /**
     * Hit test for chart widgets.
     * Iterates in reverse order (top-most first) to find the clicked widget.
     */ hitTest(x, y) {
        const shapes = this._shapeManager.getAll();
        // Iterate in reverse order (last added = drawn on top)
        for(let i = shapes.length - 1; i >= 0; i--){
            const shape = shapes[i];
            const primitive = shape.getPrimitive();
            // Check if the primitive has a hitTest method (it should if it inherits from InteractiveChartObject)
            if (primitive && typeof primitive.hitTest === 'function') {
                const hit = primitive.hitTest(x, y);
                if (hit) {
                    return shape;
                }
            }
        }
        return null;
    }
    removeEntity(id) {
        const shape = this._shapeManager.get(id);
        if (shape) {
            // Generic Detach
            const primitive = shape.getPrimitive();
            if (primitive && this._series) {
                try {
                    this._series.detachPrimitive(primitive);
                } catch (e) {
                    console.warn(`[ChartWidget:${this.id}] Failed to detach primitive (Series likely disposed):`, e);
                }
            }
            this._shapeManager.unregister(id);
        }
    }
    removeAllShapes() {
        this.detachAllPrimitives(); // Visual cleanup
        // Data cleanup
        const allShapes = this._shapeManager.getAll();
        allShapes.forEach((shape)=>{
            this._shapeManager.unregister(shape.id);
        });
    }
    /**
     * Detaches all primitives from the series (visual cleanup) but KEEPS them in the registry.
     * This allows saving their state even after the visuals are destroyed.
     */ detachAllPrimitives() {
        const allShapes = this._shapeManager.getAll();
        allShapes.forEach((shape)=>{
            const primitive = shape.getPrimitive();
            if (primitive && this._series) {
                try {
                    this._series.detachPrimitive(primitive);
                } catch (e) {
                    console.warn(`[ChartWidget:${this.id}] Failed to detach primitive (Series likely disposed):`, e);
                }
            }
        });
    }
    deselectAllShapes() {
        const allShapes = this._shapeManager.getAll();
        allShapes.forEach((shape)=>{
            const primitive = shape.getPrimitive();
            if (primitive && typeof primitive.setSelection === 'function') {
                primitive.setSelection(false);
            }
            // Also handle base widget's setSelected if different
            if (primitive && typeof primitive.setSelected === 'function') {
                primitive.setSelected(false);
            }
        });
    }
    setSeriesData(data) {
        this._data = data;
        const allShapes = this._shapeManager.getAll();
        allShapes.forEach((shape)=>{
            const primitive = shape.getPrimitive();
            if (primitive && typeof primitive.setSeriesData === 'function') {
                primitive.setSeriesData(data);
            }
        });
    }
    updateLastPrice(price, time) {
        const allShapes = this._shapeManager.getAll();
        allShapes.forEach((shape)=>{
            const primitive = shape.getPrimitive();
            if (primitive && typeof primitive.updateMarketPrice === 'function') {
                primitive.updateMarketPrice(price, time);
            }
        });
    }
    // --- Events ---
    subscribe(event, callback) {
        this._shapeManager.subscribe(event, callback);
    }
    unsubscribe(event, callback) {
        this._shapeManager.unsubscribe(event, callback);
    }
    // --- Persistence ---
    serializeDrawings() {
        const shapes = this._shapeManager.getAll();
        const serialized = shapes.map((shape)=>{
            const primitive = shape.getPrimitive();
            // Use getStorageState if available, fallback to empty or properties
            const state = primitive.getStorageState ? primitive.getStorageState() : {};
            return {
                id: shape.id,
                type: shape.name || shape.type || 'unknown',
                state
            };
        });
        return JSON.stringify(serialized);
    }
    hydrateDrawings(json) {
        try {
            const shapes = JSON.parse(json);
            if (Array.isArray(shapes) && shapes.length > 0) {
                // We don't necessarily clear here because this might be additive hydration
                // or the caller manages cleanup.
                shapes.forEach((s)=>{
                    // Detect if LongShort
                    if (s.type === 'Riskrewardlong' || s.type === 'Riskrewardshort') {
                        if (s.state) {
                            const point = {
                                time: s.state.timeIndex || 0,
                                price: s.state.entryPrice || 0
                            };
                            this.createShape(point, {
                                shape: s.type,
                                restoreState: s.state,
                                disableSelection: true // restore selection state? maybe
                            });
                        }
                    } else {
                        console.log(`[ChartWidget] Hydration for type ${s.type} not fully implemented yet.`);
                    }
                });
            }
        } catch (e) {
            console.error("Failed to hydrate drawings:", e);
        }
    }
    dispose() {
        this.detachAllPrimitives(); // Only clear visuals, keep data for saving!
        // Nullify references to prevent further usage
        this._chart = null;
        this._series = null;
    }
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/components/charts/LoadingOverlay.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "LoadingOverlay",
    ()=>LoadingOverlay
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$loader$2d$circle$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Loader2$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/loader-circle.js [app-client] (ecmascript) <export default as Loader2>");
;
;
const LoadingOverlay = ({ isVisible, status = "Initializing Data...", error })=>{
    if (!isVisible) return null;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm transition-opacity duration-300",
        children: error ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "flex flex-col items-center text-red-500 space-y-2 animate-in fade-in zoom-in duration-300",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "p-3 rounded-full bg-red-500/10 border border-red-500/20",
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                        width: "32",
                        height: "32",
                        viewBox: "0 0 24 24",
                        fill: "none",
                        stroke: "currentColor",
                        strokeWidth: "2",
                        strokeLinecap: "round",
                        strokeLinejoin: "round",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("circle", {
                                cx: "12",
                                cy: "12",
                                r: "10"
                            }, void 0, false, {
                                fileName: "[project]/src/components/charts/LoadingOverlay.tsx",
                                lineNumber: 19,
                                columnNumber: 29
                            }, ("TURBOPACK compile-time value", void 0)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("line", {
                                x1: "12",
                                y1: "8",
                                x2: "12",
                                y2: "12"
                            }, void 0, false, {
                                fileName: "[project]/src/components/charts/LoadingOverlay.tsx",
                                lineNumber: 20,
                                columnNumber: 29
                            }, ("TURBOPACK compile-time value", void 0)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("line", {
                                x1: "12",
                                y1: "16",
                                x2: "12.01",
                                y2: "16"
                            }, void 0, false, {
                                fileName: "[project]/src/components/charts/LoadingOverlay.tsx",
                                lineNumber: 21,
                                columnNumber: 29
                            }, ("TURBOPACK compile-time value", void 0))
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/charts/LoadingOverlay.tsx",
                        lineNumber: 18,
                        columnNumber: 25
                    }, ("TURBOPACK compile-time value", void 0))
                }, void 0, false, {
                    fileName: "[project]/src/components/charts/LoadingOverlay.tsx",
                    lineNumber: 17,
                    columnNumber: 21
                }, ("TURBOPACK compile-time value", void 0)),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                    className: "font-semibold",
                    children: error
                }, void 0, false, {
                    fileName: "[project]/src/components/charts/LoadingOverlay.tsx",
                    lineNumber: 24,
                    columnNumber: 21
                }, ("TURBOPACK compile-time value", void 0))
            ]
        }, void 0, true, {
            fileName: "[project]/src/components/charts/LoadingOverlay.tsx",
            lineNumber: 16,
            columnNumber: 17
        }, ("TURBOPACK compile-time value", void 0)) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "flex flex-col items-center text-blue-600 dark:text-blue-400 space-y-3 animate-in fade-in zoom-in duration-300",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$loader$2d$circle$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Loader2$3e$__["Loader2"], {
                    className: "w-10 h-10 animate-spin"
                }, void 0, false, {
                    fileName: "[project]/src/components/charts/LoadingOverlay.tsx",
                    lineNumber: 28,
                    columnNumber: 21
                }, ("TURBOPACK compile-time value", void 0)),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                    className: "text-sm font-medium tracking-wide text-gray-600 dark:text-gray-300 animate-pulse",
                    children: status
                }, void 0, false, {
                    fileName: "[project]/src/components/charts/LoadingOverlay.tsx",
                    lineNumber: 29,
                    columnNumber: 21
                }, ("TURBOPACK compile-time value", void 0))
            ]
        }, void 0, true, {
            fileName: "[project]/src/components/charts/LoadingOverlay.tsx",
            lineNumber: 27,
            columnNumber: 17
        }, ("TURBOPACK compile-time value", void 0))
    }, void 0, false, {
        fileName: "[project]/src/components/charts/LoadingOverlay.tsx",
        lineNumber: 14,
        columnNumber: 9
    }, ("TURBOPACK compile-time value", void 0));
};
_c = LoadingOverlay;
var _c;
__turbopack_context__.k.register(_c, "LoadingOverlay");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/components/charts/contextmenu/ContextMenu.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ContextMenu",
    ()=>ContextMenu
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
;
const ContextMenu = ({ x, y, items, onClose })=>{
    _s();
    const menuRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    // Close on click outside
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "ContextMenu.useEffect": ()=>{
            const handleClickOutside = {
                "ContextMenu.useEffect.handleClickOutside": (event)=>{
                    if (menuRef.current && !menuRef.current.contains(event.target)) {
                        onClose();
                    }
                }
            }["ContextMenu.useEffect.handleClickOutside"];
            const handleScroll = {
                "ContextMenu.useEffect.handleScroll": ()=>onClose()
            }["ContextMenu.useEffect.handleScroll"];
            document.addEventListener('mousedown', handleClickOutside);
            document.addEventListener('scroll', handleScroll, true); // Capture scroll to close menu
            return ({
                "ContextMenu.useEffect": ()=>{
                    document.removeEventListener('mousedown', handleClickOutside);
                    document.removeEventListener('scroll', handleScroll, true);
                }
            })["ContextMenu.useEffect"];
        }
    }["ContextMenu.useEffect"], [
        onClose
    ]);
    // Adjust position if it flows out of viewport
    const style = {
        top: y,
        left: x
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        ref: menuRef,
        className: "fixed z-50 min-w-[160px] py-1 bg-[#1E222D] border border-[#2A2E39] rounded shadow-lg text-sm text-[#D1D5DB]",
        style: style,
        onClick: (e)=>e.stopPropagation(),
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("ul", {
            className: "flex flex-col",
            children: items.map((item, index)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        className: `w-full text-left px-4 py-2 hover:bg-[#2A2E39] transition-colors flex items-center gap-2 ${item.danger ? 'text-red-400 hover:text-red-300' : 'text-slate-200'}`,
                        onClick: ()=>{
                            item.action();
                            onClose();
                        },
                        children: item.label
                    }, void 0, false, {
                        fileName: "[project]/src/components/charts/contextmenu/ContextMenu.tsx",
                        lineNumber: 54,
                        columnNumber: 25
                    }, ("TURBOPACK compile-time value", void 0))
                }, index, false, {
                    fileName: "[project]/src/components/charts/contextmenu/ContextMenu.tsx",
                    lineNumber: 53,
                    columnNumber: 21
                }, ("TURBOPACK compile-time value", void 0)))
        }, void 0, false, {
            fileName: "[project]/src/components/charts/contextmenu/ContextMenu.tsx",
            lineNumber: 51,
            columnNumber: 13
        }, ("TURBOPACK compile-time value", void 0))
    }, void 0, false, {
        fileName: "[project]/src/components/charts/contextmenu/ContextMenu.tsx",
        lineNumber: 45,
        columnNumber: 9
    }, ("TURBOPACK compile-time value", void 0));
};
_s(ContextMenu, "lbfKxozlpk19p2tUpYavRIkbEU0=");
_c = ContextMenu;
var _c;
__turbopack_context__.k.register(_c, "ContextMenu");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/components/charts/settings/SettingsModal.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "SettingsModal",
    ()=>SettingsModal
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__X$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/x.js [app-client] (ecmascript) <export default as X>");
;
var _s = __turbopack_context__.k.signature();
;
;
const SettingsModal = ({ isOpen, onClose, onSave, schema, title = 'Settings' })=>{
    _s();
    const [formData, setFormData] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({});
    // Initialize form data from schema values when opened
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "SettingsModal.useEffect": ()=>{
            if (isOpen) {
                const initialData = {};
                schema.forEach({
                    "SettingsModal.useEffect": (field)=>{
                        initialData[field.id] = field.value;
                    }
                }["SettingsModal.useEffect"]);
                setFormData(initialData);
            }
        }
    }["SettingsModal.useEffect"], [
        isOpen,
        schema
    ]);
    if (!isOpen) return null;
    const handleChange = (id, value)=>{
        setFormData((prev)=>({
                ...prev,
                [id]: value
            }));
    };
    const handleSave = ()=>{
        onSave(formData);
        onClose();
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm",
        onClick: onClose,
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "bg-white dark:bg-[#1E222D] border border-slate-300 dark:border-[#2A2E39] rounded-lg shadow-xl w-full max-w-sm overflow-hidden",
            onClick: (e)=>e.stopPropagation(),
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "px-4 py-3 border-b border-slate-200 dark:border-[#2A2E39] flex justify-between items-center bg-slate-50 dark:bg-[#2A2E39]/30",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                            className: "font-semibold text-slate-900 dark:text-slate-200",
                            children: title
                        }, void 0, false, {
                            fileName: "[project]/src/components/charts/settings/SettingsModal.tsx",
                            lineNumber: 46,
                            columnNumber: 21
                        }, ("TURBOPACK compile-time value", void 0)),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            onClick: onClose,
                            className: "text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-colors",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__X$3e$__["X"], {
                                size: 18
                            }, void 0, false, {
                                fileName: "[project]/src/components/charts/settings/SettingsModal.tsx",
                                lineNumber: 48,
                                columnNumber: 25
                            }, ("TURBOPACK compile-time value", void 0))
                        }, void 0, false, {
                            fileName: "[project]/src/components/charts/settings/SettingsModal.tsx",
                            lineNumber: 47,
                            columnNumber: 21
                        }, ("TURBOPACK compile-time value", void 0))
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/components/charts/settings/SettingsModal.tsx",
                    lineNumber: 45,
                    columnNumber: 17
                }, ("TURBOPACK compile-time value", void 0)),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "p-4 space-y-4",
                    children: schema.map((field)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex flex-col gap-1.5",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                    className: "text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide",
                                    children: field.label
                                }, void 0, false, {
                                    fileName: "[project]/src/components/charts/settings/SettingsModal.tsx",
                                    lineNumber: 56,
                                    columnNumber: 29
                                }, ("TURBOPACK compile-time value", void 0)),
                                field.type === 'color' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "flex items-center gap-2",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                            type: "color",
                                            value: formData[field.id] || '#000000',
                                            onChange: (e)=>handleChange(field.id, e.target.value),
                                            className: "h-8 w-12 rounded cursor-pointer bg-transparent border-none p-0"
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/charts/settings/SettingsModal.tsx",
                                            lineNumber: 63,
                                            columnNumber: 37
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: "text-sm font-mono text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-[#2A2E39] px-2 py-1 rounded border border-slate-200 dark:border-transparent",
                                            children: formData[field.id]
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/charts/settings/SettingsModal.tsx",
                                            lineNumber: 69,
                                            columnNumber: 37
                                        }, ("TURBOPACK compile-time value", void 0))
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/components/charts/settings/SettingsModal.tsx",
                                    lineNumber: 62,
                                    columnNumber: 33
                                }, ("TURBOPACK compile-time value", void 0)),
                                field.type === 'number' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                    type: "number",
                                    value: formData[field.id] || 0,
                                    onChange: (e)=>handleChange(field.id, parseFloat(e.target.value)),
                                    className: "bg-white dark:bg-[#131722] border border-slate-300 dark:border-[#2A2E39] rounded px-3 py-2 text-sm text-slate-900 dark:text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors w-full"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/charts/settings/SettingsModal.tsx",
                                    lineNumber: 76,
                                    columnNumber: 33
                                }, ("TURBOPACK compile-time value", void 0)),
                                field.type === 'text' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                    type: "text",
                                    value: formData[field.id] || '',
                                    onChange: (e)=>handleChange(field.id, e.target.value),
                                    className: "bg-white dark:bg-[#131722] border border-slate-300 dark:border-[#2A2E39] rounded px-3 py-2 text-sm text-slate-900 dark:text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors w-full"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/charts/settings/SettingsModal.tsx",
                                    lineNumber: 85,
                                    columnNumber: 33
                                }, ("TURBOPACK compile-time value", void 0)),
                                field.type === 'select' && field.options && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                    value: formData[field.id],
                                    onChange: (e)=>handleChange(field.id, e.target.value),
                                    className: "bg-white dark:bg-[#131722] border border-slate-300 dark:border-[#2A2E39] rounded px-3 py-2 text-sm text-slate-900 dark:text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors w-full",
                                    children: field.options.map((opt)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                            value: opt,
                                            children: opt
                                        }, opt, false, {
                                            fileName: "[project]/src/components/charts/settings/SettingsModal.tsx",
                                            lineNumber: 100,
                                            columnNumber: 41
                                        }, ("TURBOPACK compile-time value", void 0)))
                                }, void 0, false, {
                                    fileName: "[project]/src/components/charts/settings/SettingsModal.tsx",
                                    lineNumber: 94,
                                    columnNumber: 33
                                }, ("TURBOPACK compile-time value", void 0)),
                                field.type === 'boolean' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "flex items-center gap-2",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                            type: "checkbox",
                                            checked: !!formData[field.id],
                                            onChange: (e)=>handleChange(field.id, e.target.checked),
                                            className: "w-4 h-4 rounded border-slate-300 dark:border-slate-600 bg-white dark:bg-[#131722] text-indigo-500 focus:ring-indigo-500 focus:ring-offset-white dark:focus:ring-offset-slate-900"
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/charts/settings/SettingsModal.tsx",
                                            lineNumber: 107,
                                            columnNumber: 37
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: "text-sm text-slate-700 dark:text-slate-300",
                                            children: "Enabled"
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/charts/settings/SettingsModal.tsx",
                                            lineNumber: 113,
                                            columnNumber: 37
                                        }, ("TURBOPACK compile-time value", void 0))
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/components/charts/settings/SettingsModal.tsx",
                                    lineNumber: 106,
                                    columnNumber: 33
                                }, ("TURBOPACK compile-time value", void 0))
                            ]
                        }, field.id, true, {
                            fileName: "[project]/src/components/charts/settings/SettingsModal.tsx",
                            lineNumber: 55,
                            columnNumber: 25
                        }, ("TURBOPACK compile-time value", void 0)))
                }, void 0, false, {
                    fileName: "[project]/src/components/charts/settings/SettingsModal.tsx",
                    lineNumber: 53,
                    columnNumber: 17
                }, ("TURBOPACK compile-time value", void 0)),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "px-4 py-3 bg-slate-50 dark:bg-[#2A2E39]/30 border-t border-slate-200 dark:border-[#2A2E39] flex justify-end gap-2",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            onClick: onClose,
                            className: "px-3 py-1.5 text-sm font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 transition-colors",
                            children: "Cancel"
                        }, void 0, false, {
                            fileName: "[project]/src/components/charts/settings/SettingsModal.tsx",
                            lineNumber: 122,
                            columnNumber: 21
                        }, ("TURBOPACK compile-time value", void 0)),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            onClick: handleSave,
                            className: "px-4 py-1.5 text-sm font-medium bg-indigo-600 hover:bg-indigo-500 text-white rounded shadow-sm transition-colors",
                            children: "Save Changes"
                        }, void 0, false, {
                            fileName: "[project]/src/components/charts/settings/SettingsModal.tsx",
                            lineNumber: 128,
                            columnNumber: 21
                        }, ("TURBOPACK compile-time value", void 0))
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/components/charts/settings/SettingsModal.tsx",
                    lineNumber: 121,
                    columnNumber: 17
                }, ("TURBOPACK compile-time value", void 0))
            ]
        }, void 0, true, {
            fileName: "[project]/src/components/charts/settings/SettingsModal.tsx",
            lineNumber: 40,
            columnNumber: 13
        }, ("TURBOPACK compile-time value", void 0))
    }, void 0, false, {
        fileName: "[project]/src/components/charts/settings/SettingsModal.tsx",
        lineNumber: 39,
        columnNumber: 9
    }, ("TURBOPACK compile-time value", void 0));
};
_s(SettingsModal, "XnOI2K2W9M298y6FLPYECuyF8QY=");
_c = SettingsModal;
var _c;
__turbopack_context__.k.register(_c, "SettingsModal");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/components/charts/indicators/IndicatorRegistry.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "indicatorRegistry",
    ()=>indicatorRegistry
]);
class IndicatorRegistry {
    definitions = new Map();
    register(def) {
        if (this.definitions.has(def.id)) {
            console.warn(`[IndicatorRegistry] Overwriting indicator: ${def.id}`);
        }
        this.definitions.set(def.id, def);
    }
    get(id) {
        return this.definitions.get(id);
    }
    getAll() {
        return Array.from(this.definitions.values());
    }
    createInstance(id, settings) {
        const def = this.get(id);
        if (!def) return null;
        // Merge defaults
        const finalSettings = {
            ...def.defaultSettings,
            ...settings
        };
        return def.pluginFactory(finalSettings);
    }
}
const indicatorRegistry = new IndicatorRegistry();
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/components/charts/ChartContainer.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ChartContainer",
    ()=>ChartContainer
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lightweight$2d$charts$2f$dist$2f$lightweight$2d$charts$2e$development$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/lightweight-charts/dist/lightweight-charts.development.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$chartUtils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/chartUtils.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$context$2f$ChartThemeContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/context/ChartThemeContext.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$charts$2f$widgets$2f$ChartWidget$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/charts/widgets/ChartWidget.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$charts$2f$LoadingOverlay$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/charts/LoadingOverlay.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$charts$2f$widgets$2f$MagnetService$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/charts/widgets/MagnetService.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$right$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronRight$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/chevron-right.js [app-client] (ecmascript) <export default as ChevronRight>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$settings$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Settings$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/settings.js [app-client] (ecmascript) <export default as Settings>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$useContextMenu$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/hooks/useContextMenu.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$charts$2f$contextmenu$2f$ContextMenu$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/charts/contextmenu/ContextMenu.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$charts$2f$settings$2f$SettingsModal$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/charts/settings/SettingsModal.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$charts$2f$indicators$2f$IndicatorRegistry$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/charts/indicators/IndicatorRegistry.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$stores$2f$useBrokerStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/stores/useBrokerStore.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$managers$2f$TradeDistributionManager$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/managers/TradeDistributionManager.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$stores$2f$useWorkspaceStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/stores/useWorkspaceStore.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$useTradeMonitor$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/hooks/useTradeMonitor.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$TradeLogService$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/services/TradeLogService.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
const LongIcon = ()=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
        width: "18",
        height: "18",
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        strokeWidth: "2",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("rect", {
                x: "3",
                y: "12",
                width: "18",
                height: "8",
                rx: "1",
                fill: "currentColor",
                fillOpacity: "0.2"
            }, void 0, false, {
                fileName: "[project]/src/components/charts/ChartContainer.tsx",
                lineNumber: 29,
                columnNumber: 9
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("rect", {
                x: "3",
                y: "4",
                width: "18",
                height: "8",
                rx: "1",
                strokeDasharray: "3 2"
            }, void 0, false, {
                fileName: "[project]/src/components/charts/ChartContainer.tsx",
                lineNumber: 30,
                columnNumber: 9
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                d: "M3 12h18",
                strokeWidth: "2"
            }, void 0, false, {
                fileName: "[project]/src/components/charts/ChartContainer.tsx",
                lineNumber: 31,
                columnNumber: 9
            }, ("TURBOPACK compile-time value", void 0))
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/charts/ChartContainer.tsx",
        lineNumber: 28,
        columnNumber: 5
    }, ("TURBOPACK compile-time value", void 0));
_c = LongIcon;
const ShortIcon = ()=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
        width: "18",
        height: "18",
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        strokeWidth: "2",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("rect", {
                x: "3",
                y: "4",
                width: "18",
                height: "8",
                rx: "1",
                fill: "currentColor",
                fillOpacity: "0.2"
            }, void 0, false, {
                fileName: "[project]/src/components/charts/ChartContainer.tsx",
                lineNumber: 37,
                columnNumber: 9
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("rect", {
                x: "3",
                y: "12",
                width: "18",
                height: "8",
                rx: "1",
                strokeDasharray: "3 2"
            }, void 0, false, {
                fileName: "[project]/src/components/charts/ChartContainer.tsx",
                lineNumber: 38,
                columnNumber: 9
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                d: "M3 12h18",
                strokeWidth: "2"
            }, void 0, false, {
                fileName: "[project]/src/components/charts/ChartContainer.tsx",
                lineNumber: 39,
                columnNumber: 9
            }, ("TURBOPACK compile-time value", void 0))
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/charts/ChartContainer.tsx",
        lineNumber: 36,
        columnNumber: 5
    }, ("TURBOPACK compile-time value", void 0));
_c1 = ShortIcon;
const ChartContainer = /*#__PURE__*/ _s(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].forwardRef(_c2 = _s(({ symbol, symbolB = "", dataA, dataB, timeframe, isActive = false, onTimeframeChange, divergences, height = 500, isLoading = false, onSettingsClick, accounts = [], precision = 5, horizonData = [], timezone, onTimezoneChange, onSymbolChange, botId, onOHLCChange, onCrosshairMove, onVisibleRangeChange, onVisibleLogicalRangeChange, activeIndicators = [], paneId, onChartClick, scrollToTimeRequest, isChartReady = true, syncError }, ref)=>{
    _s();
    var _s1 = __turbopack_context__.k.signature();
    const mainContainerRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const containerRefA = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const containerRefB = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const { theme } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$context$2f$ChartThemeContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useChartTheme"])();
    const { isTestMode } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$stores$2f$useWorkspaceStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useWorkspaceStore"])();
    const chartARef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const chartBRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const seriesARef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const seriesBRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const hasFittedARef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(false);
    const hasFittedBRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(false);
    // DATA REFS for Sync Closure Access
    const dataARef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])([]);
    const dataBRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])([]);
    // --- SCROLL TO TIME EFFECT ---
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "ChartContainer.useEffect": ()=>{
            if (scrollToTimeRequest && chartARef.current && dataARef.current.length > 0) {
                const chart = chartARef.current;
                const data = dataARef.current;
                const targetTime = scrollToTimeRequest.time;
                // Find index of target time
                // Binary search or find? findIndex is O(N) but safer for now.
                // Using findIndex with assumption of sorted data.
                // Optimization: If data is sorted, we can binary search.
                // For now, let's use a simple heuristic:
                // Find the closest bar.
                let closestIndex = -1;
                let minDiff = Infinity;
                // Simple iteration for robustness (performance impact negligible for <50k bars once)
                for(let i = 0; i < data.length; i++){
                    const diff = Math.abs(data[i].time - targetTime);
                    if (diff < minDiff) {
                        minDiff = diff;
                        closestIndex = i;
                    }
                }
                if (closestIndex !== -1) {
                    // Calculate visible range width (zoom level)
                    const visibleRun = chart.timeScale().getVisibleLogicalRange();
                    let width = 100; // Default width
                    if (visibleRun) {
                        width = visibleRun.to - visibleRun.from;
                    }
                    // Center the view on closestIndex
                    const from = closestIndex - width / 2;
                    const to = closestIndex + width / 2;
                    chart.timeScale().setVisibleLogicalRange({
                        from,
                        to
                    });
                    // Disable Realtime Lock
                    setIsAtRealtime(false);
                    // Seed History Focus Ref
                    const fromTime = data[Math.max(0, Math.floor(from))]?.time;
                    const toTime = data[Math.min(data.length - 1, Math.ceil(to))]?.time;
                    if (fromTime && toTime) {
                        historyFocusRef.current = {
                            from: fromTime,
                            to: toTime
                        };
                    }
                } else {
                    // If time is outside data range (e.g. far future or past not loaded), 
                    // we might simply scroll to specific time if it's a timestamp.
                    // LWC supports scrollToPosition but that requires index.
                    // If we have no data there, we can't easily scroll.
                    // Fallback: Notify? Console log?
                    console.warn("[ChartContainer] Target time not found in loaded data", targetTime);
                }
            }
        }
    }["ChartContainer.useEffect"], [
        scrollToTimeRequest
    ]);
    // Use a ref to store the previous timeframe to detect changes
    const prevTimeframeRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(timeframe);
    const seriesHorizonRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const chartWidgetRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const currentMousePosRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const indicatorPluginsRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(new Map());
    // --- INCREMENTAL UPDATE STATE ---
    const prevDataLengthRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(0);
    const prevStartTimeRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(0);
    const prevLastTimeRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(0);
    // ROBUSTNESS: Track the last known "History Focus" to survive empty data states (The Tunnel)
    const historyFocusRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    // LOOP PROTECTION: Flag to suppress event broadcasting during programmatic updates
    const isProgrammaticUpdate = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(false);
    // Active Trades Monitoring
    const { aggregatedTrades } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$useTradeMonitor$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useTradeMonitor"])();
    const activePositionIds = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(new Set());
    // State for Widget Removal
    const [executionSourceId, setExecutionSourceId] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "ChartContainer.useEffect": ()=>{
            // Sync Active Trades to Chart
            if (!chartWidgetRef.current) return;
            const currentSymbol = symbol; // Use current symbol scope
            const activeForSymbol = aggregatedTrades.filter({
                "ChartContainer.useEffect.activeForSymbol": (t)=>t.symbol === currentSymbol && t.status === 'RUNNING' // Only running trades
            }["ChartContainer.useEffect.activeForSymbol"]);
            const activeIds = new Set();
            const logs = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$TradeLogService$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TradeLogService"].getLogs();
            activeForSymbol.forEach({
                "ChartContainer.useEffect": (trade)=>{
                    activeIds.add(trade.tradeId);
                    // 1. Get Concrete Levels from Log (Persistence)
                    const logEntry = logs.find({
                        "ChartContainer.useEffect.logEntry": (l)=>l.id === trade.tradeId
                    }["ChartContainer.useEffect.logEntry"]);
                    // 2. Resolve Levels (Log > Current)
                    const entryPrice = logEntry?.initialEntry || trade.avgEntry;
                    const slPrice = logEntry?.initialSL || trade.avgSl;
                    const tpPrice = logEntry?.initialTP || trade.avgTp;
                    // 3. Create/Update Tool
                    // We use createShape with ID override. If it exists, it might duplicate or we rely on ChartWidget to handle?
                    // ChartWidget.createShape always creates new. We need check if exists.
                    const existing = chartWidgetRef.current?.getShapeById(trade.tradeId);
                    if (!existing) {
                        // Initial Creation
                        chartWidgetRef.current?.createShape({
                            time: Date.now() / 1000,
                            price: entryPrice
                        }, {
                            shape: 'ActivePosition',
                            overrides: {
                                id: trade.tradeId,
                                symbol: trade.symbol,
                                direction: trade.direction === 'BUY' ? 'LONG' : 'SHORT',
                                entryPrice: entryPrice,
                                stopLossPrice: slPrice,
                                takeProfitPrice: tpPrice,
                                lineColor: '#2563EB',
                                stopColor: 'rgba(239, 68, 68, 1)',
                                profitColor: 'rgba(16, 185, 129, 1)',
                                currentProfit: trade.unrealizedPl,
                                currency: 'USD',
                                volume: trade.volume || trade.size || 0,
                                contractSize: 1 // Default to 1 (CFD/Crypto) or need to fetch from broker info
                            }
                        });
                    } else {
                        // Update existing
                        const primitive = existing.getPrimitive();
                        if (primitive && typeof primitive.updateProfit === 'function') {
                            // Update State for generic properties
                            existing.setProperties({
                                stopLossPrice: slPrice,
                                takeProfitPrice: tpPrice
                            });
                            // Update Volume if missing in state
                            if (primitive._data && !primitive._data.volume) {
                                primitive._data.volume = trade.volume || trade.size || 0;
                            }
                            // Direct Profit Update
                            primitive.updateProfit(trade.unrealizedPl);
                        }
                    }
                }
            }["ChartContainer.useEffect"]);
            // 4. Cleanup Closed Trades
            activePositionIds.current.forEach({
                "ChartContainer.useEffect": (id)=>{
                    if (!activeIds.has(id)) {
                        chartWidgetRef.current?.removeEntity(id);
                    }
                }
            }["ChartContainer.useEffect"]);
            activePositionIds.current = activeIds;
        }
    }["ChartContainer.useEffect"], [
        aggregatedTrades,
        symbol
    ]); // Re-run when trades change or symbol changes
    // --- CONTEXT MENU HOOK ---
    const { menuState, settingsState, closeMenu, openSettings, handleDelete, handleRemoveAll, closeSettings, saveSettings } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$useContextMenu$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useContextMenu"])(mainContainerRef, chartWidgetRef);
    // --- IMPERATIVE HANDLE FOR FAST UPDATES ---
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].useImperativeHandle(ref, {
        "ChartContainer.useImperativeHandle": ()=>({
                updateCandle: ({
                    "ChartContainer.useImperativeHandle": (candle)=>{
                        if (seriesARef.current) {
                            seriesARef.current.update(candle);
                            // Also update Widget internal state if needed
                            if (chartWidgetRef.current && candle.close !== undefined) {
                                chartWidgetRef.current.updateLastPrice(candle.close, candle.time);
                            }
                            // --- UPDATE PLUGINS WITH LATEST TIME ---
                            indicatorPluginsRef.current.forEach({
                                "ChartContainer.useImperativeHandle": (plugin)=>{
                                    const p = plugin;
                                    if (p.updateCurrentTime) {
                                        p.updateCurrentTime(candle.time);
                                    }
                                    if (p.updateCandle) {
                                        p.updateCandle(candle);
                                    }
                                }
                            }["ChartContainer.useImperativeHandle"]);
                        }
                    }
                })["ChartContainer.useImperativeHandle"],
                getLatestCandle: ({
                    "ChartContainer.useImperativeHandle": ()=>{
                        return null;
                    }
                })["ChartContainer.useImperativeHandle"],
                getWidget: ({
                    "ChartContainer.useImperativeHandle": ()=>chartWidgetRef.current
                })["ChartContainer.useImperativeHandle"],
                setVisibleRange: ({
                    "ChartContainer.useImperativeHandle": (range)=>{
                        if (chartARef.current) {
                            try {
                                isProgrammaticUpdate.current = true;
                                chartARef.current.timeScale().setVisibleRange(range);
                                // Reset flag immediately (synchronous) or very short timeout?
                                // LWC triggers subs synchronously usually.
                                isProgrammaticUpdate.current = false;
                            } catch (e) {
                                isProgrammaticUpdate.current = false;
                                console.warn("[ChartContainer] setVisibleRange failed (chart likely disposing)", e);
                            }
                        }
                    }
                })["ChartContainer.useImperativeHandle"],
                setLogicalRange: ({
                    "ChartContainer.useImperativeHandle": (range)=>{
                        if (chartARef.current) {
                            // Precise sync: use setVisibleLogicalRange
                            try {
                                // LOOP PROTECTION: Lock for 20ms to cover async event dispatch
                                isProgrammaticUpdate.current = true;
                                // TRACE 0162
                                // console.log(`[ChartContainer:${paneId}] setLogicalRange Called. Anchor: ${range.anchorTime}, Offset: ${range.whitespaceOffset}`);
                                let targetRange = range;
                                const data = dataARef.current;
                                // TIME-ANCHORED SYNC: Adjust indices based on Anchor Time
                                if (range.anchorTime !== undefined && data.length > 0) {
                                    let targetRightIndex = -1;
                                    // Optimization: Check last bar first (Common case: Realtime Sync)
                                    if (data[data.length - 1].time <= range.anchorTime) {
                                        targetRightIndex = data.length - 1;
                                    } else {
                                        // Binary Search
                                        let low = 0, high = data.length - 1;
                                        while(low <= high){
                                            const mid = low + high >>> 1;
                                            if (data[mid].time < range.anchorTime) low = mid + 1;
                                            else high = mid - 1;
                                        }
                                        targetRightIndex = low > 0 && low >= data.length ? data.length - 1 : low;
                                    }
                                    // Sanity Check
                                    if (targetRightIndex >= data.length) targetRightIndex = data.length - 1;
                                    // APPLY WHITESPACE OFFSET (Future Scroll Fix)
                                    // REMOVED CLAMP: Allow full future scrolling to prevent sync fighting (Task 0162)
                                    // TRACE 0162
                                    if (range.whitespaceOffset !== undefined && range.whitespaceOffset > 0) {
                                        // console.log(`[ChartContainer:${paneId}] SYNC-IN Apply Offset: ${range.whitespaceOffset}. BaseIdx: ${targetRightIndex} -> Target: ${targetRightIndex + range.whitespaceOffset}`);
                                        targetRightIndex += range.whitespaceOffset;
                                    }
                                    // Apply Width
                                    const width = range.to - range.from;
                                    const newTo = targetRightIndex;
                                    // Maintain Whitespace Offset if source was projected
                                    // We can't easily know source whitespace without source length.
                                    // But range.to might be > length?
                                    // If range.to > range.from, we apply that width.
                                    targetRange = {
                                        from: newTo - width,
                                        to: newTo
                                    };
                                }
                                chartARef.current.timeScale().setVisibleLogicalRange(targetRange);
                                // Release Lock after short delay
                                setTimeout({
                                    "ChartContainer.useImperativeHandle": ()=>{
                                        isProgrammaticUpdate.current = false;
                                    }
                                }["ChartContainer.useImperativeHandle"], 50);
                            } catch (e) {
                                isProgrammaticUpdate.current = false;
                                console.warn("[ChartContainer] setLogicalRange failed", e);
                            }
                        }
                    }
                })["ChartContainer.useImperativeHandle"],
                setCrosshair: ({
                    "ChartContainer.useImperativeHandle": (time, price)=>{
                        if (chartARef.current && seriesARef.current) {
                            // Defensive: Ensure price and time are strictly not null/undefined
                            if (price !== undefined && price !== null && time !== null && time !== undefined) {
                                try {
                                    chartARef.current.setCrosshairPosition(price, time, seriesARef.current);
                                } catch (e) {
                                // Silent catch to prevent app crash if LWC internal state disagrees
                                }
                            } else {
                                chartARef.current.clearCrosshairPosition();
                            }
                        }
                    }
                })["ChartContainer.useImperativeHandle"],
                closePopups: ({
                    "ChartContainer.useImperativeHandle": ()=>{
                        closeMenu();
                        closeSettings();
                    }
                })["ChartContainer.useImperativeHandle"],
                deselectAll: ({
                    "ChartContainer.useImperativeHandle": ()=>{
                        if (chartWidgetRef.current) {
                            chartWidgetRef.current.deselectAllShapes();
                        }
                    }
                })["ChartContainer.useImperativeHandle"]
            })
    }["ChartContainer.useImperativeHandle"]);
    // --- TIMEFRAME SCROLLER STATE ---
    const tfScrollRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const [canScrollLeft, setCanScrollLeft] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [canScrollRight, setCanScrollRight] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [isAutoScale, setIsAutoScale] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(true);
    const [pendingTrade, setPendingTrade] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [isExecutingTrade, setIsExecutingTrade] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [executionSummary, setExecutionSummary] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    // --- SCROLL TO REALTIME BUTTON STATE ---
    const [isAtRealtime, setIsAtRealtime] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(true);
    const [isHoveringScrollTrigger, setIsHoveringScrollTrigger] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const dataLengthRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(0);
    const checkTfScroll = ()=>{
        if (tfScrollRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = tfScrollRef.current;
            setCanScrollLeft(scrollLeft > 4); // Added 2px margin for reliability
            // Use Math.ceil for scrollWidth to handle sub-pixel issues in various browsers
            setCanScrollRight(Math.ceil(scrollWidth) > Math.ceil(clientWidth + scrollLeft) + 4);
        }
    };
    // Hover state for right scale (managed via mouse move to avoid blocking)
    const [isRightHovered, setIsRightHovered] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    // TIMEZONE STATE
    // If props.timezone is provided, use it. Otherwise default to Browser/UTC.
    // Actually, we should pull from props directly if controlled.
    // But to minimize refactor, let's sync state.
    const [selectedTimezone, setSelectedTimezone] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({
        "ChartContainer.useState": ()=>{
            if (timezone) return timezone;
            try {
                return Intl.DateTimeFormat().resolvedOptions().timeZone;
            } catch (e) {
                return 'UTC';
            }
        }
    }["ChartContainer.useState"]);
    // --- BROKER DATA FETCHING ---
    const { fetchBrokers, brokers } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$stores$2f$useBrokerStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useBrokerStore"])();
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "ChartContainer.useEffect": ()=>{
            fetchBrokers();
        }
    }["ChartContainer.useEffect"], []);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "ChartContainer.useEffect": ()=>{
            if (timezone) setSelectedTimezone(timezone);
        }
    }["ChartContainer.useEffect"], [
        timezone
    ]);
    // --- DATA TRANSFORMATION PIPELINE ---
    // Apply indicator-based overrides (e.g. Imbalance opacity/coloring)
    // We memoize this to prevent recalculation on every render unless data or indicators change.
    const processedData = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].useMemo({
        "ChartContainer.useMemo[processedData]": ()=>{
            let result = [
                ...dataA
            ];
            // ROBUSTNESS: Filter out invalid candles (nulls or missing fields)
            // This prevents "Assertion failed: value of open must be a number" crashes
            result = result.filter({
                "ChartContainer.useMemo[processedData]": (c)=>c && typeof c.time === 'number' && typeof c.open === 'number' && typeof c.high === 'number' && typeof c.low === 'number' && typeof c.close === 'number'
            }["ChartContainer.useMemo[processedData]"]);
            // Apply transformations from active indicators
            activeIndicators.forEach({
                "ChartContainer.useMemo[processedData]": (ind)=>{
                    const def = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$charts$2f$indicators$2f$IndicatorRegistry$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["indicatorRegistry"].get(ind.defId);
                    if (def && def.dataTransformer) {
                        try {
                            result = def.dataTransformer(result, ind.settings);
                        } catch (e) {
                            console.error(`[ChartContainer] Transformer error for ${ind.defId}:`, e);
                        }
                    }
                }
            }["ChartContainer.useMemo[processedData]"]);
            return result;
        }
    }["ChartContainer.useMemo[processedData]"], [
        dataA,
        activeIndicators
    ]);
    const [chartReady, setChartReady] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    // Keep Data Refs Sync'd (Moved here to avoid TDZ)
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "ChartContainer.useEffect": ()=>{
            dataARef.current = processedData;
        }
    }["ChartContainer.useEffect"], [
        processedData
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "ChartContainer.useEffect": ()=>{
            dataBRef.current = dataB;
        }
    }["ChartContainer.useEffect"], [
        dataB
    ]);
    // APPLY TIMEZONE FORMATTER
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "ChartContainer.useEffect": ()=>{
            const applyTimezone = {
                "ChartContainer.useEffect.applyTimezone": (chart)=>{
                    if (!chart) return;
                    chart.applyOptions({
                        timeScale: {
                            tickMarkFormatter: {
                                "ChartContainer.useEffect.applyTimezone": (time, tickMarkType, locale)=>{
                                    const date = new Date(time * 1000);
                                    const opts = {
                                        timeZone: selectedTimezone
                                    };
                                    switch(tickMarkType){
                                        case __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lightweight$2d$charts$2f$dist$2f$lightweight$2d$charts$2e$development$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TickMarkType"].Year:
                                            return date.toLocaleDateString('en-US', {
                                                ...opts,
                                                year: 'numeric'
                                            });
                                        case __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lightweight$2d$charts$2f$dist$2f$lightweight$2d$charts$2e$development$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TickMarkType"].Month:
                                            return date.toLocaleDateString('en-US', {
                                                ...opts,
                                                month: 'short',
                                                year: 'numeric'
                                            });
                                        case __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lightweight$2d$charts$2f$dist$2f$lightweight$2d$charts$2e$development$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TickMarkType"].DayOfMonth:
                                            return date.toLocaleDateString('en-US', {
                                                ...opts,
                                                day: 'numeric',
                                                month: 'short'
                                            });
                                        case __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lightweight$2d$charts$2f$dist$2f$lightweight$2d$charts$2e$development$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TickMarkType"].Time:
                                            return date.toLocaleTimeString('en-US', {
                                                ...opts,
                                                hour: '2-digit',
                                                minute: '2-digit',
                                                hour12: false
                                            });
                                        case __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lightweight$2d$charts$2f$dist$2f$lightweight$2d$charts$2e$development$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TickMarkType"].TimeWithSeconds:
                                            return date.toLocaleTimeString('en-US', {
                                                ...opts,
                                                hour: '2-digit',
                                                minute: '2-digit',
                                                second: '2-digit',
                                                hour12: false
                                            });
                                        default:
                                            return "";
                                    }
                                }
                            }["ChartContainer.useEffect.applyTimezone"]
                        },
                        localization: {
                            dateFormat: 'yyyy-MM-dd',
                            timeFormatter: {
                                "ChartContainer.useEffect.applyTimezone": (time)=>{
                                    const date = new Date(time * 1000);
                                    return date.toLocaleString('en-US', {
                                        timeZone: selectedTimezone,
                                        hour: '2-digit',
                                        minute: '2-digit',
                                        hour12: false,
                                        day: 'numeric',
                                        month: 'short'
                                    });
                                }
                            }["ChartContainer.useEffect.applyTimezone"]
                        }
                    });
                }
            }["ChartContainer.useEffect.applyTimezone"];
            if (chartReady) {
                console.log(`[ChartContainer] Applying Timezone: ${selectedTimezone}`);
                applyTimezone(chartARef.current);
                applyTimezone(chartBRef.current);
            }
        }
    }["ChartContainer.useEffect"], [
        selectedTimezone,
        chartReady
    ]);
    // Sync AutoScale state from chart
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "ChartContainer.useEffect": ()=>{
            const checkAutoScale = {
                "ChartContainer.useEffect.checkAutoScale": ()=>{
                    if (chartARef.current) {
                        const opts = chartARef.current.priceScale('right').options();
                        if (opts.autoScale !== undefined && opts.autoScale !== isAutoScale) {
                            setIsAutoScale(opts.autoScale);
                        }
                    }
                }
            }["ChartContainer.useEffect.checkAutoScale"];
            const interval = setInterval(checkAutoScale, 250); // Poll every 250ms
            return ({
                "ChartContainer.useEffect": ()=>clearInterval(interval)
            })["ChartContainer.useEffect"];
        }
    }["ChartContainer.useEffect"], [
        isAutoScale
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "ChartContainer.useEffect": ()=>{
            const el = tfScrollRef.current;
            if (el) {
                checkTfScroll();
                // Listen for scroll events
                el.addEventListener('scroll', checkTfScroll);
                // Use ResizeObserver for more robust detection of size changes
                const observer = new ResizeObserver({
                    "ChartContainer.useEffect": ()=>checkTfScroll()
                }["ChartContainer.useEffect"]);
                observer.observe(el);
                // Also observe children if they might change size later
                if (el.firstChild) observer.observe(el.firstChild);
                window.addEventListener('resize', checkTfScroll);
                return ({
                    "ChartContainer.useEffect": ()=>{
                        el.removeEventListener('scroll', checkTfScroll);
                        observer.disconnect();
                        window.removeEventListener('resize', checkTfScroll);
                    }
                })["ChartContainer.useEffect"];
            }
        }
    }["ChartContainer.useEffect"], []);
    const scrollTf = (direction)=>{
        if (tfScrollRef.current) {
            const amount = direction === 'left' ? -150 : 150;
            tfScrollRef.current.scrollBy({
                left: amount,
                behavior: 'smooth'
            });
        }
    };
    // Initialize Charts (Run once on mount or when height changes)
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "ChartContainer.useEffect": ()=>{
            // Chart A is mandatory
            if (!containerRefA.current) return;
            // Default dimensions
            const initialWidth = containerRefA.current.clientWidth;
            const initialHeight = typeof height === 'number' ? height / 2 : 300;
            // Helper to normalize background
            const bg = typeof theme.layout.background === 'string' ? {
                type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lightweight$2d$charts$2f$dist$2f$lightweight$2d$charts$2e$development$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ColorType"].Solid,
                color: theme.layout.background
            } : {
                type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lightweight$2d$charts$2f$dist$2f$lightweight$2d$charts$2e$development$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ColorType"].Solid,
                color: theme.layout.background.color
            };
            const chartOptions = {
                layout: {
                    background: bg,
                    textColor: theme.layout.textColor,
                    fontSize: 11
                },
                grid: {
                    vertLines: {
                        color: theme.grid.vertLines.color,
                        visible: theme.grid.vertLines.visible,
                        style: theme.grid.vertLines.style
                    },
                    horzLines: {
                        color: theme.grid.horzLines.color,
                        visible: theme.grid.horzLines.visible,
                        style: theme.grid.horzLines.style
                    }
                },
                crosshair: {
                    mode: 0,
                    vertLine: {
                        color: '#000000',
                        labelBackgroundColor: '#000000'
                    },
                    horzLine: {
                        color: '#000000',
                        labelBackgroundColor: '#000000'
                    }
                },
                timeScale: {
                    timeVisible: true,
                    secondsVisible: false,
                    ticksVisible: true,
                    borderColor: theme.timeScale.borderColor,
                    rightOffset: 20,
                    barSpacing: 10,
                    minBarSpacing: 4,
                    shiftVisibleRangeOnNewBar: false,
                    fixLeftEdge: false,
                    fixRightEdge: false
                },
                rightPriceScale: {
                    borderColor: theme.priceScale.borderColor,
                    autoScale: true,
                    minimumWidth: 60,
                    scaleMargins: {
                        top: 0.1,
                        bottom: 0.1
                    }
                },
                handleScale: {
                    mouseWheel: false
                },
                handleScroll: {
                    mouseWheel: true,
                    pressedMouseMove: true,
                    horzTouchDrag: true,
                    vertTouchDrag: true
                }
            };
            // --- CHART A (Main) ---
            const chartA = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lightweight$2d$charts$2f$dist$2f$lightweight$2d$charts$2e$development$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createChart"])(containerRefA.current, {
                ...chartOptions,
                width: initialWidth,
                height: initialHeight
            });
            const seriesA = chartA.addSeries(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lightweight$2d$charts$2f$dist$2f$lightweight$2d$charts$2e$development$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CandlestickSeries"], {
                upColor: theme.candles.upColor,
                downColor: theme.candles.downColor,
                borderVisible: true,
                wickVisible: true,
                borderUpColor: theme.candles.borderUpColor,
                borderDownColor: theme.candles.borderDownColor,
                wickUpColor: theme.candles.wickUpColor,
                wickDownColor: theme.candles.wickDownColor,
                priceFormat: {
                    type: 'price',
                    precision: precision,
                    minMove: 1 / Math.pow(10, precision)
                }
            });
            // REACTIVE PRECISION UPDATE
            // When 'precision' prop changes, we must force the series to update.
            // We can't rely on recreating the chart, so we use applyOptions.
            // Ideally we would do this in a separate useEffect, but 'seriesA' is local here.
            // Since we are recreating the chart every time 'height' or 'theme' changes, this might be enough if 'precision' triggers remount.
            // CHECK: dependency array of this useEffect? -> currently only on mount + height + theme. layout has no 'precision' dep.
            // FIX: We need a SEPARATE useEffect to handle precision updates reactively without recreating the chart.
            // --- HORIZON SERIES (Phantom Future) ---
            // ROLLBACK: Restored for stability. Used for visual "Future" without breaking auto-scale.
            const seriesHorizon = chartA.addSeries(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lightweight$2d$charts$2f$dist$2f$lightweight$2d$charts$2e$development$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["LineSeries"], {
                color: 'transparent',
                lineWidth: 1,
                crosshairMarkerVisible: false,
                lastValueVisible: false,
                priceLineVisible: false
            });
            seriesHorizonRef.current = seriesHorizon;
            // Dynamic Scroll Removed in favor of Phantom Bars logic
            // Subscribe to Click for Activation
            chartA.subscribeClick({
                "ChartContainer.useEffect": ()=>{
                    if (onChartClick) onChartClick();
                }
            }["ChartContainer.useEffect"]);
            chartARef.current = chartA;
            seriesARef.current = seriesA;
            // Pass Pane ID for Verification
            const widget = new __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$charts$2f$widgets$2f$ChartWidget$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ChartWidget"](paneId || "unknown", chartA, seriesA);
            widget.setSymbol(symbol);
            chartWidgetRef.current = widget;
            // Subscribe to trade execution events
            widget.subscribe('execute', {
                "ChartContainer.useEffect": (params)=>{
                    console.log("[ChartContainer] Execution event received:", params.trade);
                    setPendingTrade(params.trade);
                    if (params.id) {
                        setExecutionSourceId(params.id);
                    }
                }
            }["ChartContainer.useEffect"]);
            // --- CHART B (Optional) ---
            let chartB = null;
            let seriesB = null;
            if (containerRefB.current) {
                chartB = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lightweight$2d$charts$2f$dist$2f$lightweight$2d$charts$2e$development$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createChart"])(containerRefB.current, {
                    ...chartOptions,
                    width: initialWidth,
                    height: initialHeight
                });
                seriesB = chartB.addSeries(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lightweight$2d$charts$2f$dist$2f$lightweight$2d$charts$2e$development$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CandlestickSeries"], {
                    upColor: theme.candles.upColor,
                    downColor: theme.candles.downColor,
                    borderVisible: false,
                    wickUpColor: theme.candles.wickUpColor,
                    wickDownColor: theme.candles.wickDownColor,
                    priceFormat: {
                        type: 'price',
                        precision: precision,
                        minMove: 1 / Math.pow(10, precision)
                    }
                });
                chartBRef.current = chartB;
                seriesBRef.current = seriesB;
            }
            // --- SYNCHRONIZATION (Only if B exists) ---
            if (chartB) {
                let isSyncing = false;
                // Helper for safe sync
                const syncRange = {
                    "ChartContainer.useEffect.syncRange": (sourceChart, targetChart)=>{
                        sourceChart.timeScale().subscribeVisibleLogicalRangeChange({
                            "ChartContainer.useEffect.syncRange": (range)=>{
                                // Internal Loop Protection
                                if (isProgrammaticUpdate.current) return;
                                if (!range || isSyncing) return;
                                if (range.from === null || range.to === null || range.from === undefined || range.to === undefined) return;
                                isSyncing = true;
                                try {
                                    const ts = targetChart.timeScale && targetChart.timeScale();
                                    if (ts) {
                                        isProgrammaticUpdate.current = true;
                                        // TIME-ANCHORED FIXED-WIDTH SYNC
                                        // 1. Get Width and Right Time
                                        const width = range.to - range.from;
                                        // Use Refs to get latest data without closure staleness
                                        const sourceData = sourceChart === chartA ? dataARef.current : dataBRef.current;
                                        const targetData = targetChart === chartA ? dataARef.current : dataBRef.current;
                                        if (sourceData && sourceData.length > 0 && targetData && targetData.length > 0) {
                                            const clampedSourceIdx = Math.max(0, Math.min(Math.floor(range.to), sourceData.length - 1));
                                            const rightTime = sourceData[clampedSourceIdx]?.time;
                                            if (rightTime) {
                                                // Find Time in Target
                                                let targetRightIndex = -1;
                                                // Optimization: Check last bar first (Common case: Realtime Sync)
                                                if (targetData[targetData.length - 1].time <= rightTime) {
                                                    targetRightIndex = targetData.length - 1;
                                                } else {
                                                    // Binary Search for precise history sync
                                                    let low = 0, high = targetData.length - 1;
                                                    while(low <= high){
                                                        const mid = low + high >>> 1;
                                                        if (targetData[mid].time < rightTime) low = mid + 1;
                                                        else high = mid - 1;
                                                    }
                                                    // 'low' is insertion point (first element >= value)
                                                    targetRightIndex = low > 0 && low >= targetData.length ? targetData.length - 1 : low;
                                                }
                                                // Handle Exact Match Logic vs "Closest"
                                                if (targetRightIndex >= targetData.length) targetRightIndex = targetData.length - 1;
                                                // Correct for whitespace offset if source was in whitespace
                                                const whitespaceOffset = range.to - clampedSourceIdx;
                                                if (whitespaceOffset > 0) {
                                                    targetRightIndex += whitespaceOffset;
                                                }
                                                const newTo = targetRightIndex;
                                                const newFrom = newTo - width;
                                                ts.setVisibleLogicalRange({
                                                    from: newFrom,
                                                    to: newTo
                                                });
                                            }
                                        } else {
                                            // Fallback if no data or init
                                            ts.setVisibleLogicalRange(range);
                                        }
                                        isProgrammaticUpdate.current = false;
                                    }
                                } catch (e) {
                                    isProgrammaticUpdate.current = false;
                                }
                                isSyncing = false;
                            }
                        }["ChartContainer.useEffect.syncRange"]);
                    }
                }["ChartContainer.useEffect.syncRange"];
                syncRange(chartA, chartB);
                syncRange(chartB, chartA);
                // Crosshair Sync
                const syncCrosshair = {
                    "ChartContainer.useEffect.syncCrosshair": (sourceChart, targetChart, targetSeries)=>{
                        sourceChart.subscribeCrosshairMove({
                            "ChartContainer.useEffect.syncCrosshair": (param)=>{
                                if (isSyncing || !targetSeries) return;
                                isSyncing = true;
                                try {
                                    if (param.time) targetChart.setCrosshairPosition(param.point?.y || 0, param.time, targetSeries);
                                    else targetChart.clearCrosshairPosition();
                                } catch (e) {}
                                isSyncing = false;
                            }
                        }["ChartContainer.useEffect.syncCrosshair"]);
                    }
                }["ChartContainer.useEffect.syncCrosshair"];
                syncCrosshair(chartA, chartB, seriesB);
                syncCrosshair(chartB, chartA, seriesA); // Chart A always has series
            }
            // --- Crosshair Move Handler for OHLC Overlay ---
            // --- Crosshair Move Handler for OHLC Overlay & Sync ---
            chartA.subscribeCrosshairMove({
                "ChartContainer.useEffect": (param)=>{
                    // Guard against disposed state
                    if (!chartARef.current || !seriesARef.current) return;
                    try {
                        // 1. OHLC Overlay
                        if (param.time) {
                            const data = param.seriesData.get(seriesA);
                            if (data && typeof data === 'object' && 'open' in data) {
                                onOHLCChange?.(data);
                            } else {
                                const candle = dataA.find({
                                    "ChartContainer.useEffect.candle": (d)=>d.time === param.time
                                }["ChartContainer.useEffect.candle"]);
                                if (candle) {
                                    onOHLCChange?.(candle);
                                }
                            }
                        } else {
                            onOHLCChange?.(null);
                        }
                        // 2. Sync / External Reporting
                        if (param.time) {
                            const price = param.seriesData.get(seriesA);
                            // We need the raw price from the coordinate if possible, OR just use the Close of the candle
                            // Param.point.y is the coordinate.
                            let priceVal;
                            try {
                                priceVal = price?.close ?? seriesA.coordinateToPrice(param.point?.y || 0);
                            } catch (innerE) {
                            // If coordinateToPrice fails, fallback or ignore
                            }
                            if (priceVal !== undefined) {
                                onCrosshairMove?.(param.time, priceVal, undefined);
                            }
                        } else {
                            onCrosshairMove?.(null, undefined, undefined);
                        }
                    } catch (e) {
                    // Silent catch for crosshair errors during disposal
                    }
                }
            }["ChartContainer.useEffect"]);
            // Subscribe to Visible Range Changes for Sync
            chartA.timeScale().subscribeVisibleTimeRangeChange({
                "ChartContainer.useEffect": (range)=>{
                    // LOOP PROTECTION
                    if (isProgrammaticUpdate.current) return;
                    try {
                        if (range && range.from && range.to) {
                            onVisibleRangeChange?.({
                                from: range.from,
                                to: range.to
                            });
                        }
                        // HYBRID SYNC: Also emit Logical Range on Time Scroll 
                        // This ensures we catch scroll events that might bypass the logical observer in some LWC versions
                        const logical = chartA.timeScale().getVisibleLogicalRange();
                        if (logical) {
                            onVisibleLogicalRangeChange?.(logical);
                        }
                    } catch (e) {
                    // Silent catch for disposal race conditions
                    }
                }
            }["ChartContainer.useEffect"]);
            // Subscribe to Logical Range Changes for Sync (Precise index-based)
            chartA.timeScale().subscribeVisibleLogicalRangeChange({
                "ChartContainer.useEffect": (range)=>{
                    // LOOP PROTECTION
                    if (isProgrammaticUpdate.current) {
                        // console.log(`[ChartContainer:${paneId}] Skipping emit (programmatic lock active)`);
                        return;
                    }
                    try {
                        let anchorTime;
                        if (range) {
                            const data = dataARef.current;
                            let whitespaceOffset = 0;
                            if (data && data.length > 0) {
                                // Calculate Anchor Time (Right Edge Time)
                                // Use clamped index to stay within valid data bounds
                                const idx = Math.max(0, Math.min(Math.floor(range.to), data.length - 1));
                                anchorTime = data[idx]?.time;
                                // Calculate Whitespace Offset (Fix for "Sticky Right Edge")
                                whitespaceOffset = range.to - (data.length - 1);
                                // DEBUG LOGGING
                                // if (whitespaceOffset > 0) {
                                //     console.log(`[Sync Emit] Offset: ${whitespaceOffset.toFixed(2)}, To: ${range.to.toFixed(2)}, LastIdx: ${data.length - 1}`);
                                // }
                                // TRACE 0162
                                if (Math.abs(whitespaceOffset) > 1 || range.to > data.length) {
                                    console.log(`[ChartContainer:${paneId}] Emit LogicalRange. To: ${range.to.toFixed(2)}, Offset: ${whitespaceOffset.toFixed(2)}, Anchor: ${anchorTime}`);
                                }
                                // Check if at Realtime Edge
                                const dist = data.length - 1 - range.to;
                                const isAtEdge = dist < 2;
                                setIsAtRealtime(isAtEdge);
                                // ROBUSTNESS: While in history, strictly track where we are
                                if (!isAtEdge && data) {
                                    const fIdx = Math.max(0, Math.floor(range.from));
                                    const tIdx = Math.min(data.length - 1, Math.ceil(range.to));
                                    const fTime = data[fIdx]?.time;
                                    const tTime = data[tIdx]?.time;
                                    if (fTime && tTime) {
                                        historyFocusRef.current = {
                                            from: fTime,
                                            to: tTime
                                        };
                                    }
                                }
                            }
                            onVisibleLogicalRangeChange?.({
                                ...range,
                                anchorTime,
                                whitespaceOffset
                            });
                        }
                    } catch (e) {
                    // Silent catch
                    }
                }
            }["ChartContainer.useEffect"]);
            setChartReady(true);
            return ({
                "ChartContainer.useEffect": ()=>{
                    // 1. Lock the door: Prevent external access immediately
                    chartARef.current = null;
                    chartBRef.current = null;
                    seriesARef.current = null;
                    seriesBRef.current = null;
                    // 2. Dispose Widget
                    if (chartWidgetRef.current) {
                        try {
                            chartWidgetRef.current.dispose();
                        } catch (e) {
                            console.warn("[ChartContainer] Widget dispose failed:", e);
                        }
                        chartWidgetRef.current = null;
                    }
                    // 3. Destroy Chart
                    try {
                        chartA.remove();
                        if (chartB) chartB.remove();
                    } catch (e) {
                        console.warn("[ChartContainer] Chart remove error:", e);
                    }
                }
            })["ChartContainer.useEffect"];
        }
    }["ChartContainer.useEffect"], []); // Only run once on mount
    // Resize Logic
    const isSingleMode = !symbolB;
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "ChartContainer.useEffect": ()=>{
            if (!mainContainerRef.current) return;
            const resizeObserver = new ResizeObserver({
                "ChartContainer.useEffect": (entries)=>{
                    if (entries.length === 0) return;
                    const { width, height: containerHeight } = entries[0].contentRect;
                    // Calculate available height for charts
                    // overhead: Header(40) + Footer(42) = 82 if single
                    // overhead: HeaderA(40) + Footer(42) + HeaderB(41) = 123 if dual
                    const overhead = isSingleMode ? 0 : 41;
                    const availableHeight = containerHeight - overhead;
                    if (availableHeight > 0) {
                        const heightPerChart = isSingleMode ? availableHeight : availableHeight / 2;
                        chartARef.current?.applyOptions({
                            width,
                            height: heightPerChart
                        });
                        if (!isSingleMode) {
                            chartBRef.current?.applyOptions({
                                width,
                                height: heightPerChart
                            });
                        }
                    }
                }
            }["ChartContainer.useEffect"]);
            resizeObserver.observe(mainContainerRef.current);
            return ({
                "ChartContainer.useEffect": ()=>resizeObserver.disconnect()
            })["ChartContainer.useEffect"];
        }
    }["ChartContainer.useEffect"], [
        symbolB
    ]); // Re-run when mode changes
    // Handler for Scroll To RealTime
    const handleScrollToRealTime = ()=>{
        if (!chartARef.current || dataARef.current.length === 0) return;
        const dataA = dataARef.current;
        // STRICT REALTIME CLAMP: Ignore future bars in calculation
        const nowSec = Math.floor(Date.now() / 1000) + (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$chartUtils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getTimeframeSeconds"])(timeframe); // Tolerance 1 bar
        let lastRealIndex = dataA.length - 1;
        // Scan backward to find last REAL candle
        for(let i = dataA.length - 1; i >= 0; i--){
            if (dataA[i].time <= nowSec) {
                lastRealIndex = i;
                break;
            }
        }
        // We use the calculated index. Future logic is explicitly disabled.
        // User Requirement: "ensure automatic repositioning never jumps beyond current candle"
        const additionalBars = 0;
        // Get current width to maintain zoom
        const currentRange = chartARef.current.timeScale().getVisibleLogicalRange();
        const width = currentRange ? currentRange.to - currentRange.from : 100;
        // We typically want a bit of right offset (e.g. 5 bars)
        const rightOffset = 5;
        // Target: End of Real Data + Future Gap + Offset
        const newTo = lastRealIndex + additionalBars + rightOffset;
        const newFrom = newTo - width;
        chartARef.current.timeScale().setVisibleLogicalRange({
            from: newFrom,
            to: newTo
        });
        setIsAtRealtime(true);
    };
    // Reset fit flags when symbol changes
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "ChartContainer.useEffect": ()=>{
            hasFittedARef.current = false;
            if (chartWidgetRef.current) {
                chartWidgetRef.current.setSymbol(symbol);
            }
        }
    }["ChartContainer.useEffect"], [
        symbol
    ]);
    // --- HORIZON DATA SYNC ---
    // ROLLBACK: Feed the phantom bars to the invisible series
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "ChartContainer.useEffect": ()=>{
            if (seriesHorizonRef.current && horizonData.length > 0) {
                seriesHorizonRef.current.setData(horizonData);
            }
        }
    }["ChartContainer.useEffect"], [
        horizonData
    ]);
    // Dynamic Scroll Logic Removed (Was causing jumps)
    // State to persist "Intent" across renders until data is ready
    const viewStateRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])({
        type: 'NONE',
        savedBarCount: null,
        savedRightTime: null,
        savedRightOffset: null,
        savedRange: null
    });
    // Ref to track stabilization status during switches to prevent premature sync broadcasts
    const isStabilizingRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(false);
    // Data Update Effect with One-Time Fit AND Scroll Preservation
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "ChartContainer.useEffect": ()=>{
            if (seriesARef.current) {
                // Check if this update coincides with a timeframe switch request
                const isTimeframeSwitchReq = prevTimeframeRef.current !== timeframe;
                if (isTimeframeSwitchReq) {
                    isStabilizingRef.current = true;
                }
                // 1. Snapshot State BEFORE touching data (if switching)
                // Use processedData length for consistent state management
                dataLengthRef.current = processedData.length;
                if (isTimeframeSwitchReq && viewStateRef.current.type === 'NONE') {
                    if (hasFittedARef.current && chartARef.current) {
                        try {
                            const logicRange = chartARef.current.timeScale().getVisibleLogicalRange();
                            if (logicRange && logicRange.from !== null && logicRange.to !== null) {
                                const barCount = logicRange.to - logicRange.from;
                                const lastBarIndex = processedData.length - 1;
                                const distFromEdge = lastBarIndex - logicRange.to; // Positive if looking at history
                                // THRESHOLD: If we are within 5 bars of the "Latest Data" OR in the future (negative), consider it Realtime Mode.
                                // Infinite Scroll Support: Allow arbitrary negative offset (Future).
                                const isAtRealtimeEdge = distFromEdge < 5;
                                if (isAtRealtimeEdge) {
                                    viewStateRef.current = {
                                        type: 'LIVE_EDGE',
                                        savedBarCount: barCount,
                                        savedRightOffset: distFromEdge,
                                        savedRightTime: null,
                                        savedRange: null
                                    };
                                // console.log(`[ChartContainer] Capturing LIVE_EDGE Viewport. Offset: ${distFromEdge.toFixed(2)}`);
                                } else {
                                    // HISTORY MODE: Capture the TIME of the rightmost visible bar
                                    // This ensures that when we switch TF, we find the index corresponding to this TIME.
                                    const clampedRightIdx = Math.max(0, Math.min(Math.floor(logicRange.to), processedData.length - 1));
                                    const rightTime = processedData[clampedRightIdx]?.time;
                                    if (rightTime) {
                                        viewStateRef.current = {
                                            type: 'HISTORY',
                                            savedBarCount: barCount,
                                            savedRightTime: rightTime,
                                            savedRightOffset: null,
                                            savedRange: null
                                        };
                                        console.log(`[ChartContainer] Capturing HISTORY Viewport. RightTime: ${rightTime}`);
                                    }
                                }
                            }
                        } catch (e) {
                            console.warn("[ChartContainer] Failed to capture state for TF switch", e);
                        }
                    }
                } else if (!isTimeframeSwitchReq && viewStateRef.current.type === 'NONE' && hasFittedARef.current && chartARef.current) {
                    // Regular streaming/backfill update - Snapshot TIME range
                    try {
                        const r = chartARef.current.timeScale().getVisibleRange();
                        if (r) {
                            viewStateRef.current = {
                                type: 'TIME',
                                savedRange: r,
                                savedBarCount: null,
                                savedRightTime: null,
                                savedRightOffset: null
                            };
                        } else if (!isAtRealtime && historyFocusRef.current) {
                            // FALLBACK: If chart returned null range (e.g. was empty/loading), but we know we are in history
                            console.log("[ChartContainer] Snapshot failed, using History Fallback");
                            viewStateRef.current = {
                                type: 'TIME',
                                savedRange: {
                                    from: historyFocusRef.current.from,
                                    to: historyFocusRef.current.to
                                },
                                savedBarCount: null,
                                savedRightTime: null,
                                savedRightOffset: null
                            };
                        }
                    } catch (e) {}
                }
                // 2. Analyze Incoming Data for Freshness
                let isDataReady = false;
                if (processedData.length > 1) {
                    const interval = Math.abs(processedData[processedData.length - 1].time - processedData[processedData.length - 2].time);
                    const targetInterval = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$chartUtils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getTimeframeSeconds"])(timeframe);
                    if (interval >= targetInterval * 0.8 && interval <= targetInterval * 5) {
                        isDataReady = true;
                    } else if (processedData.length < 5) {
                        isDataReady = true;
                    }
                } else if (processedData.length > 0) {
                    isDataReady = true;
                } else {
                    isDataReady = true;
                }
                // If we are strictly switching, enforce data readiness before applying logic or updating ref
                if (isTimeframeSwitchReq && !isDataReady) {
                    return;
                }
                // 3. Apply Data (INCREMENTAL vs FULL)
                // Smart update to prevent Crosshair Reset on Ticks
                const prevLen = dataLengthRef.current; // Captured before snapshot logic for accurate comparison? No, that was processedData.length.
                // Better to use a separate Persistent Ref for comparison, as dataLengthRef meant for "Before this render logic"
                // Logic:
                // If NOT switching timeframe AND data is effectively the same (start time match) AND length is same or +1
                // Then UPDATE instead of SET.
                let appliedIncremental = false;
                if (!isTimeframeSwitchReq && processedData.length > 0 && prevDataLengthRef.current > 0) {
                    // Check consistency (Start Time match) - crude check for massive history shift
                    const prevStart = prevStartTimeRef.current;
                    const newStart = processedData[0].time;
                    // Allow tiny tolerance or exact match
                    if (prevStart === newStart) {
                        const lenDiff = processedData.length - prevDataLengthRef.current;
                        const newLastTime = processedData[processedData.length - 1].time;
                        // Allow strictly 0 (update last) or 1 (new tick)
                        // GUARD: Ensure we never try to update with PAST data (Time Reversion) which crashes LWC
                        if (lenDiff >= 0 && lenDiff <= 2 && newLastTime >= prevLastTimeRef.current) {
                            try {
                                // Apply Updates
                                const lastCandle = processedData[processedData.length - 1];
                                seriesARef.current.update(lastCandle);
                                // If we added 2 candles (rare), update the one before too?
                                // update() only affects the specific time.
                                if (lenDiff === 2) {
                                    const secondLast = processedData[processedData.length - 2];
                                    seriesARef.current.update(secondLast); // Update previous just in case
                                    seriesARef.current.update(lastCandle); // Then last
                                }
                                appliedIncremental = true;
                            // console.log(`[ChartContainer:Diagnose] Incremental Tick Applied. Last: ${lastCandle.time}`);
                            } catch (e) {
                                console.warn("[ChartContainer] Incremental update failed, falling back to setData", e);
                                appliedIncremental = false;
                            }
                        } else {
                        // console.log(`[ChartContainer:Diagnose] Incremental skipped. LenDiff: ${lenDiff}, NewLast: ${newLastTime}, PrevLast: ${prevLastTimeRef.current}`);
                        }
                    }
                }
                if (!appliedIncremental) {
                    // console.log(`[ChartContainer:Diagnose] FALLBACK TO SETDATA. Len: ${processedData.length}`);
                    seriesARef.current.setData(processedData);
                }
                // Update Tracking Refs for Next Render
                if (processedData.length > 0) {
                    prevDataLengthRef.current = processedData.length;
                    prevStartTimeRef.current = processedData[0].time;
                    prevLastTimeRef.current = processedData[processedData.length - 1].time;
                    // Critical: Update dataARef for other effects (Dynamic Scroll)
                    dataARef.current = processedData;
                } else {
                    prevDataLengthRef.current = 0;
                    prevStartTimeRef.current = 0;
                    prevLastTimeRef.current = 0;
                    dataARef.current = [];
                }
                // 4. Restore State
                if (processedData.length > 0 && !appliedIncremental) {
                    // console.log(`[ChartContainer:Diagnose] Restore State Triggered. Type: ${viewStateRef.current.type}`);
                    if (!hasFittedARef.current) {
                        // Start with explicit "Last 150 Bars" view instead of fitContent (which zooms out too much/erratically with large offsets)
                        if (chartARef.current && processedData.length > 0) {
                            const lastIdx = processedData.length - 1;
                            const visibleCount = 150; // Standard startup zoom
                            // Set range to: [End - 150, End + 10]
                            // We add +10 margin. The 1000 bar rightOffset is handled by LWC as margin BEYOND this logical range? 
                            // Actually, rightOffset shifts the coordinate system.
                            // Let's just set the logical range indices.
                            chartARef.current.timeScale().setVisibleLogicalRange({
                                from: lastIdx - visibleCount,
                                to: lastIdx + 5 // Small buffer past data end
                            });
                        } else {
                            chartARef.current?.timeScale().fitContent();
                        }
                        hasFittedARef.current = true;
                    } else if (chartARef.current) {
                        // Apply captured view state
                        try {
                            const state = viewStateRef.current;
                            if (state.type === 'TIME' && state.savedRange && state.savedRange.from && state.savedRange.to) {
                                chartARef.current.timeScale().setVisibleRange(state.savedRange);
                            } else if (state.type === 'LIVE_EDGE' && state.savedBarCount != null && state.savedRightOffset != null) {
                                const lastIdx = processedData.length - 1;
                                const newTo = lastIdx - state.savedRightOffset;
                                const newFrom = newTo - state.savedBarCount;
                                chartARef.current.timeScale().setVisibleLogicalRange({
                                    from: newFrom,
                                    to: newTo
                                });
                                console.log(`[ChartContainer] Restored LIVE_EDGE. Offset: ${state.savedRightOffset.toFixed(2)} -> To: ${newTo.toFixed(2)}`);
                            } else if (state.type === 'HISTORY' && state.savedBarCount != null && state.savedRightTime != null) {
                                // Find index close to RightTime
                                let low = 0, high = processedData.length - 1;
                                let idx = -1;
                                while(low <= high){
                                    const mid = low + high >>> 1;
                                    const midTime = processedData[mid].time;
                                    if (midTime < state.savedRightTime) {
                                        low = mid + 1;
                                    } else {
                                        high = mid - 1;
                                    }
                                }
                                idx = low;
                                // idx is now the insertion point (closest bar >= RightTime) OR the exact bar.
                                if (idx < 0) idx = 0;
                                if (idx >= processedData.length) idx = processedData.length - 1;
                                const newTo = idx;
                                const newFrom = idx - state.savedBarCount;
                                chartARef.current.timeScale().setVisibleLogicalRange({
                                    from: newFrom,
                                    to: newTo
                                });
                                console.log(`[ChartContainer] Restored HISTORY. RightTime: ${state.savedRightTime} -> Idx: ${idx}`);
                            }
                        } catch (e) {
                            console.error("[ChartContainer] Error restoring view state:", e);
                        }
                    }
                }
                // 5. Cleanup / Finish Transition
                const isClearing = processedData.length === 0;
                if (!isClearing && (isDataReady || !isTimeframeSwitchReq)) {
                    prevTimeframeRef.current = timeframe;
                    // Reset Intent
                    viewStateRef.current = {
                        type: 'NONE',
                        savedBarCount: null,
                        savedRightTime: null,
                        savedRightOffset: null,
                        savedRange: null
                    };
                    // Mark stabilization complete
                    isStabilizingRef.current = false;
                }
            }
        }
    }["ChartContainer.useEffect"], [
        processedData,
        timeframe
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "ChartContainer.useEffect": ()=>{
            if (seriesBRef.current && dataB.length > 0 && !isSingleMode) {
                seriesBRef.current.setData(dataB);
                if (!hasFittedBRef.current) {
                    chartBRef.current?.timeScale().fitContent();
                    hasFittedBRef.current = true;
                }
            }
        }
    }["ChartContainer.useEffect"], [
        dataB,
        isSingleMode
    ]);
    // --- INDICATOR PLUGIN MANAGEMENT ---
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "ChartContainer.useEffect": ()=>{
            if (!chartReady || !seriesARef.current || !chartARef.current) return;
            const plugins = indicatorPluginsRef.current;
            const currentIds = new Set(activeIndicators.map({
                "ChartContainer.useEffect": (i)=>i.instanceId
            }["ChartContainer.useEffect"]));
            // 1. Remove Detached Indicators
            for (const [id, plugin] of plugins.entries()){
                if (!currentIds.has(id)) {
                    try {
                        seriesARef.current.detachPrimitive(plugin);
                    } catch (e) {}
                    plugins.delete(id);
                    console.log(`[ChartContainer] Detached plugin: ${id}`);
                }
            }
            // 2. Add/Update Indicators
            activeIndicators.forEach({
                "ChartContainer.useEffect": (ind)=>{
                    let plugin = plugins.get(ind.instanceId);
                    // A. Create if missing
                    if (!plugin) {
                        const def = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$charts$2f$indicators$2f$IndicatorRegistry$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["indicatorRegistry"].get(ind.defId);
                        if (def && def.pluginFactory) {
                            plugin = def.pluginFactory(ind.settings);
                            if (plugin) {
                                seriesARef.current?.attachPrimitive(plugin);
                                plugins.set(ind.instanceId, plugin);
                            // console.log(`[ChartContainer] Attached plugin: ${ind.defId} (${ind.instanceId})`);
                            }
                        }
                    } else {
                        // B. Update Settings
                        if (plugin.updateSettings) {
                            plugin.updateSettings(ind.settings);
                        }
                    }
                    // NEW: Push Common State to Plugin
                    const pluginAsAny = plugin;
                    // 1. Timeframe
                    if (pluginAsAny && pluginAsAny.updateTimeframe) {
                        pluginAsAny.updateTimeframe(timeframe);
                    }
                    // 2. Latest Time (for precise clamping)
                    if (pluginAsAny && pluginAsAny.updateCurrentTime && dataA.length > 0) {
                        const latestTime = dataA[dataA.length - 1].time;
                        pluginAsAny.updateCurrentTime(latestTime);
                    }
                    // NEW: Push Full Data to Plugin (for Client-Side Calculation)
                    if (pluginAsAny && pluginAsAny.updateData) {
                        pluginAsAny.updateData(dataA);
                    }
                    // NEW: Push Visibility
                    if (pluginAsAny && typeof pluginAsAny.setVisible === 'function') {
                        pluginAsAny.setVisible(ind.visible ?? true);
                    }
                    // C. Fetch Data Check
                    if (plugin && ind.visible) {
                        const def = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$charts$2f$indicators$2f$IndicatorRegistry$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["indicatorRegistry"].get(ind.defId);
                        if (def && def.dataFetcher) {
                            // Fetch Data logic
                            const fromTime = dataA.length > 0 ? dataA[0].time : Math.floor(Date.now() / 1000) - 86400 * 30;
                            const toTime = dataA.length > 0 ? dataA[dataA.length - 1].time : Math.floor(Date.now() / 1000);
                            def.dataFetcher({
                                symbol: symbol,
                                timeframe: timeframe,
                                from: fromTime * 1000,
                                to: toTime * 1000,
                                settings: ind.settings
                            }).then({
                                "ChartContainer.useEffect": (data)=>{
                                    if (plugin.updateSessions) {
                                        plugin.updateSessions(data);
                                    }
                                }
                            }["ChartContainer.useEffect"]).catch({
                                "ChartContainer.useEffect": (e)=>console.error("Indicator Data Fetch Failed", e)
                            }["ChartContainer.useEffect"]);
                        }
                    }
                }
            }["ChartContainer.useEffect"]);
        }
    }["ChartContainer.useEffect"], [
        activeIndicators,
        symbol,
        timeframe,
        dataA,
        chartReady
    ]);
    // Cleanup Plugins on Unmount
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "ChartContainer.useEffect": ()=>{
            return ({
                "ChartContainer.useEffect": ()=>{
                    const plugins = indicatorPluginsRef.current;
                    if (seriesARef.current && plugins.size > 0) {
                        plugins.forEach({
                            "ChartContainer.useEffect": (plugin)=>{
                                try {
                                    seriesARef.current?.detachPrimitive(plugin);
                                } catch (e) {}
                            }
                        }["ChartContainer.useEffect"]);
                        plugins.clear();
                    }
                }
            })["ChartContainer.useEffect"];
        }
    }["ChartContainer.useEffect"], []);
    // Apply Theme Changes Dynamically
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "ChartContainer.useEffect": ()=>{
            const applyThemeToChart = {
                "ChartContainer.useEffect.applyThemeToChart": (chart, series)=>{
                    if (!chart) return;
                    chart.applyOptions({
                        layout: {
                            background: {
                                type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lightweight$2d$charts$2f$dist$2f$lightweight$2d$charts$2e$development$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ColorType"].Solid,
                                color: typeof theme.layout.background === 'string' ? theme.layout.background : theme.layout.background.color
                            },
                            textColor: theme.layout.textColor
                        },
                        grid: {
                            vertLines: {
                                color: theme.grid.vertLines.color,
                                visible: theme.grid.vertLines.visible,
                                style: theme.grid.vertLines.style
                            },
                            horzLines: {
                                color: theme.grid.horzLines.color,
                                visible: theme.grid.horzLines.visible,
                                style: theme.grid.horzLines.style
                            }
                        },
                        timeScale: {
                            borderColor: theme.timeScale.borderColor,
                            timeVisible: true,
                            secondsVisible: false,
                            ticksVisible: true
                        },
                        rightPriceScale: {
                            borderColor: theme.priceScale.borderColor
                        },
                        crosshair: {
                            vertLine: {
                                color: '#000000',
                                labelBackgroundColor: '#000000'
                            },
                            horzLine: {
                                color: '#000000',
                                labelBackgroundColor: '#000000'
                            }
                        },
                        localization: {
                            priceFormatter: {
                                "ChartContainer.useEffect.applyThemeToChart": (p)=>p.toFixed(precision)
                            }["ChartContainer.useEffect.applyThemeToChart"]
                        },
                        handleScale: {
                            mouseWheel: false
                        },
                        handleScroll: {
                            mouseWheel: true,
                            pressedMouseMove: true,
                            horzTouchDrag: true,
                            vertTouchDrag: true
                        }
                    });
                    if (series) {
                        series.applyOptions({
                            upColor: theme.candles.upColor,
                            downColor: theme.candles.downColor,
                            wickVisible: true,
                            borderVisible: true,
                            wickUpColor: theme.candles.wickUpColor,
                            wickDownColor: theme.candles.wickDownColor,
                            borderUpColor: theme.candles.borderUpColor,
                            borderDownColor: theme.candles.borderDownColor
                        });
                    }
                }
            }["ChartContainer.useEffect.applyThemeToChart"];
            applyThemeToChart(chartARef.current, seriesARef.current);
            applyThemeToChart(chartBRef.current, seriesBRef.current);
        }
    }["ChartContainer.useEffect"], [
        theme
    ]);
    // --- SEPARATE EFFECT: PRECISION ---
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "ChartContainer.useEffect": ()=>{
            if (!seriesARef.current) return;
            const minMove = 1 / Math.pow(10, precision);
            console.log(`[ChartContainer] Applying Precision: ${precision} (minMove: ${minMove})`);
            seriesARef.current.applyOptions({
                priceFormat: {
                    type: 'price',
                    precision: precision,
                    minMove: minMove
                }
            });
            if (seriesBRef.current) {
                seriesBRef.current.applyOptions({
                    priceFormat: {
                        type: 'price',
                        precision: precision,
                        minMove: minMove
                    }
                });
            }
        }
    }["ChartContainer.useEffect"], [
        precision,
        chartReady
    ]); // Depend on chartReady to ensure series exists // Removed precision dependency from here
    // Tool Toggle Logic
    // --- UPDATE MAGNET DATA ---
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "ChartContainer.useEffect": ()=>{
            if (chartWidgetRef.current && dataA.length > 0) {
                chartWidgetRef.current.setSeriesData(dataA);
                // Also update timeframe
                if (timeframe) {
                    chartWidgetRef.current.setTimeframe(timeframe);
                }
                // Fix: Ensure widgets (like position tools) get the latest price immediately on data refresh
                const last = dataA[dataA.length - 1];
                if (last) {
                    chartWidgetRef.current.updateLastPrice(last.close, last.time);
                }
            }
        }
    }["ChartContainer.useEffect"], [
        dataA,
        timeframe
    ]);
    const toggleLongShortTool = (direction)=>{
        console.log(`[ChartContainer] toggleLongShortTool called: ${direction}`);
        if (!seriesARef.current || !chartARef.current) {
            console.error("[ChartContainer] Chart or Series not initialized", {
                chart: !!chartARef.current,
                series: !!seriesARef.current
            });
            return;
        }
        if (dataA.length === 0) {
            console.warn("[ChartContainer] Cannot create tool: dataA is empty");
            return;
        }
        const lastCandle = dataA[dataA.length - 1];
        const currentPrice = lastCandle.close || lastCandle.value;
        console.log(`[ChartContainer] Creating ${direction} tool at ${currentPrice}`);
        // Calculate tighter defaults (0.05% risk/reward base)
        const spread = currentPrice * 0.0005;
        let slPrice, tpPrice;
        if (direction === 'long') {
            slPrice = currentPrice - spread;
            tpPrice = currentPrice + spread * 2; // 1:2 RR default
        } else {
            slPrice = currentPrice + spread;
            tpPrice = currentPrice - spread * 2; // 1:2 RR default
        }
        // Create initial state
        const initialState = {
            entryPrice: currentPrice,
            stopLossPrice: slPrice,
            takeProfitPrice: tpPrice,
            timeIndex: lastCandle.time,
            riskReward: 2.0,
            fixedLeg: 'rr',
            fixedStates: {
                tp: false,
                sl: false,
                entry: false,
                rr: true
            },
            orderType: 'MARKET'
        };
        try {
            if (chartWidgetRef.current) {
                chartWidgetRef.current.createShape({
                    time: lastCandle.time,
                    price: currentPrice
                }, {
                    shape: direction === 'long' ? 'Riskrewardlong' : 'Riskrewardshort',
                    overrides: {
                        [`linetoolriskreward${direction}.stopLevel`]: slPrice,
                        [`linetoolriskreward${direction}.profitLevel`]: tpPrice,
                        [`linetoolriskreward${direction}.entryPrice`]: currentPrice,
                        [`linetoolriskreward${direction}.riskReward`]: 2.0,
                        [`linetoolriskreward${direction}.fixedLeg`]: 'rr',
                        [`linetoolriskreward${direction}.symbol`]: symbol // Pass usage symbol
                    }
                });
            }
            console.log("Tool created successfully via ChartWidget");
        } catch (e) {
            console.error("Error attaching tool:", e);
        }
    };
    const toggleAutoScale = ()=>{
        const newState = !isAutoScale;
        setIsAutoScale(newState);
        chartARef.current?.priceScale('right').applyOptions({
            autoScale: newState
        });
        if (!isSingleMode) {
            chartBRef.current?.priceScale('right').applyOptions({
                autoScale: newState
            });
        }
    };
    // ... (rest of the file until handleConfirmExecution)
    const handleConfirmExecution = async ()=>{
        if (!pendingTrade) return;
        // 1. IMMEDIATE FEEDBACK: Start Loading & Close Dialog
        setIsExecutingTrade(true);
        setPendingTrade(null);
        // Remove the Widget immediately (User Request)
        if (executionSourceId && chartWidgetRef.current) {
            try {
                chartWidgetRef.current.removeEntity(executionSourceId);
                setExecutionSourceId(null);
            } catch (e) {
                console.warn("Failed to remove execution widget", e);
            }
        }
        try {
            console.log("[Chart] Preparing Execution for:", pendingTrade);
            // 2. Get Distribution Config
            const config = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$managers$2f$TradeDistributionManager$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TradeDistributionManager"].getDistributionConfig();
            // 3. Calculate Batches
            const batches = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$managers$2f$TradeDistributionManager$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TradeDistributionManager"].distributeTrade(pendingTrade, accounts, brokers, config, isTestMode);
            console.log("--- DEBUG: DISTRIBUTION PLAN ---");
            console.log(batches);
            if (batches.length === 0) {
                alert("No target accounts found for distribution!");
                return;
            }
            // 4. EXECUTE TRADES (Send to Backend)
            const results = await Promise.all(batches.map(async (batch)=>{
                try {
                    const res = await fetch('/api/distribution/execute', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(batch)
                    });
                    if (res.ok) {
                        const result = await res.json();
                        console.log(`[ChartContainer] Batch for ${batch.brokerId} executed:`, result);
                        return {
                            status: 'success',
                            brokerId: batch.brokerId,
                            accounts: batch.accounts,
                            details: result
                        };
                    } else {
                        console.error(`[ChartContainer] Batch execution failed for ${batch.brokerId}: ${res.statusText}`);
                        return {
                            status: 'error',
                            brokerId: batch.brokerId,
                            accounts: batch.accounts,
                            error: res.statusText
                        };
                    }
                } catch (e) {
                    console.error(`[ChartContainer] Batch Network Error`, e);
                    return {
                        status: 'error',
                        brokerId: batch.brokerId,
                        accounts: batch.accounts,
                        error: e.message || "Network Error"
                    };
                }
            }));
            // 5. SHOW SUMMARY
            setExecutionSummary(results);
        } catch (e) {
            console.error("[ChartContainer] Execution Error", e);
            alert("Failed to prepare or execute trades.");
        } finally{
            setIsExecutingTrade(false);
        }
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        ref: mainContainerRef,
        className: "flex flex-col bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 overflow-hidden w-full relative",
        style: {
            height: typeof height === 'number' ? height : '100%'
        },
        children: [
            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].createElement(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].Fragment, null, _s1(()=>{
                _s1();
                (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
                    "ChartContainer.useEffect": ()=>{
                        const handleKeyDown = {
                            "ChartContainer.useEffect.handleKeyDown": (e)=>{
                                // Alt + H = Horizontal Line
                                // Alt + J = Horizontal Ray
                                if (!isActive || !e.altKey) return;
                                const isLine = e.code === 'KeyH';
                                const isRay = e.code === 'KeyJ';
                                const isVert = e.code === 'KeyV';
                                if ((isLine || isRay || isVert) && currentMousePosRef.current && chartARef.current && seriesARef.current && chartWidgetRef.current) {
                                    e.preventDefault();
                                    const { x, y } = currentMousePosRef.current;
                                    const timeScale = chartARef.current.timeScale();
                                    const series = seriesARef.current;
                                    // Magnet Snap Logic
                                    const snapped = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$charts$2f$widgets$2f$MagnetService$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["MagnetService"].snap(x, y, series, dataA, timeScale, timeframe);
                                    const finalTime = timeScale.coordinateToTime(snapped.x);
                                    const finalPrice = series.coordinateToPrice(snapped.y);
                                    if (finalPrice !== null) {
                                        chartWidgetRef.current.createShape({
                                            time: finalTime || 0,
                                            price: finalPrice
                                        }, {
                                            shape: isVert ? 'VerticalLine' : isLine ? 'HorizontalLine' : 'HorizontalRay',
                                            overrides: {
                                                anchor: snapped.anchor // Passing anchor info for snapping context
                                            }
                                        });
                                    }
                                }
                            }
                        }["ChartContainer.useEffect.handleKeyDown"];
                        window.addEventListener('keydown', handleKeyDown);
                        return ({
                            "ChartContainer.useEffect": ()=>window.removeEventListener('keydown', handleKeyDown)
                        })["ChartContainer.useEffect"];
                    }
                }["ChartContainer.useEffect"], [
                    dataA,
                    timeframe,
                    isActive
                ]);
                return null;
            }, "OD7bBpZva5O2jO+Puf00hKivP7c=")()),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex-1 min-h-0 flex flex-col relative",
                children: [
                    !isAtRealtime && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        // Large Trigger Zone for easy access
                        className: "absolute bottom-[30px] right-[60px] w-40 h-32 flex items-end justify-end z-[50] pb-[15px] pr-[15px]",
                        style: {
                            pointerEvents: 'auto'
                        },
                        onMouseEnter: ()=>setIsHoveringScrollTrigger(true),
                        onMouseLeave: ()=>setIsHoveringScrollTrigger(false),
                        children: isHoveringScrollTrigger && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            onClick: handleScrollToRealTime,
                            // TradingView-like: Small (26px), dark grey bg. Hover: Text becomes white for contrast.
                            className: "bg-white dark:bg-[#2a2e39] hover:bg-slate-100 dark:hover:bg-[#363a45] text-slate-600 dark:text-[#b2b5be] hover:text-slate-900 dark:hover:text-white rounded w-[26px] h-[26px] flex items-center justify-center shadow-md transition-all border border-slate-300 dark:border-[#2a2e39]",
                            title: "Scroll to Realtime",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                width: "20",
                                height: "20",
                                viewBox: "0 0 24 24",
                                fill: "none",
                                stroke: "currentColor",
                                strokeLinecap: "round",
                                strokeLinejoin: "round",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                        d: "M10.75 5l7 7-7 7",
                                        strokeWidth: "2.5"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/charts/ChartContainer.tsx",
                                        lineNumber: 1895,
                                        columnNumber: 37
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                        d: "M6.25 9l3 3-3 3",
                                        strokeWidth: "2.5"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/charts/ChartContainer.tsx",
                                        lineNumber: 1897,
                                        columnNumber: 37
                                    }, ("TURBOPACK compile-time value", void 0))
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/charts/ChartContainer.tsx",
                                lineNumber: 1893,
                                columnNumber: 33
                            }, ("TURBOPACK compile-time value", void 0))
                        }, void 0, false, {
                            fileName: "[project]/src/components/charts/ChartContainer.tsx",
                            lineNumber: 1887,
                            columnNumber: 29
                        }, ("TURBOPACK compile-time value", void 0))
                    }, void 0, false, {
                        fileName: "[project]/src/components/charts/ChartContainer.tsx",
                        lineNumber: 1879,
                        columnNumber: 21
                    }, ("TURBOPACK compile-time value", void 0)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: `w-full relative min-h-0 bg-slate-50 dark:bg-slate-900/10 ${isSingleMode ? 'flex-1' : 'flex-1'}`,
                        onMouseMove: (e)=>{
                            const rect = e.currentTarget.getBoundingClientRect();
                            currentMousePosRef.current = {
                                x: e.clientX - rect.left,
                                y: e.clientY - rect.top
                            };
                            const isRight = e.clientX - rect.left > rect.width - 60;
                            if (isRight !== isRightHovered) {
                                setIsRightHovered(isRight);
                            }
                        },
                        onMouseLeave: ()=>setIsRightHovered(false),
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                ref: containerRefA,
                                className: "absolute inset-0"
                            }, void 0, false, {
                                fileName: "[project]/src/components/charts/ChartContainer.tsx",
                                lineNumber: 1920,
                                columnNumber: 21
                            }, ("TURBOPACK compile-time value", void 0)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: `absolute bottom-[34px] right-2 z-30 transition-all duration-200 pointer-events-auto ${isRightHovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'}`,
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    onClick: (e)=>{
                                        e.stopPropagation();
                                        toggleAutoScale();
                                    },
                                    className: `w-6 h-6 rounded border flex items-center justify-center text-[10px] font-bold shadow-sm transition-colors ${isAutoScale ? 'bg-slate-950 dark:bg-slate-950 text-white border-slate-950 dark:border-slate-950 hover:bg-slate-800' // Active: Black button
                                     : 'bg-white text-black border-slate-300 hover:bg-slate-100' // Inactive: White button
                                    }`,
                                    title: "Toggle Auto Scale",
                                    children: "A"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/charts/ChartContainer.tsx",
                                    lineNumber: 1931,
                                    columnNumber: 25
                                }, ("TURBOPACK compile-time value", void 0))
                            }, void 0, false, {
                                fileName: "[project]/src/components/charts/ChartContainer.tsx",
                                lineNumber: 1927,
                                columnNumber: 21
                            }, ("TURBOPACK compile-time value", void 0)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "absolute bottom-0 right-0 w-[60px] h-[30px] z-20 flex items-center justify-center bg-transparent pointer-events-auto",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    onClick: (e)=>{
                                        e.stopPropagation();
                                        onSettingsClick?.();
                                    },
                                    className: "text-slate-500 hover:text-slate-400 transition-colors p-1",
                                    title: "Chart Settings",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$settings$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Settings$3e$__["Settings"], {
                                        size: 14
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/charts/ChartContainer.tsx",
                                        lineNumber: 1956,
                                        columnNumber: 29
                                    }, ("TURBOPACK compile-time value", void 0))
                                }, void 0, false, {
                                    fileName: "[project]/src/components/charts/ChartContainer.tsx",
                                    lineNumber: 1948,
                                    columnNumber: 25
                                }, ("TURBOPACK compile-time value", void 0))
                            }, void 0, false, {
                                fileName: "[project]/src/components/charts/ChartContainer.tsx",
                                lineNumber: 1947,
                                columnNumber: 21
                            }, ("TURBOPACK compile-time value", void 0))
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/charts/ChartContainer.tsx",
                        lineNumber: 1904,
                        columnNumber: 17
                    }, ("TURBOPACK compile-time value", void 0)),
                    !isSingleMode && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "h-[1px] bg-slate-200 dark:bg-slate-800 shrink-0 mx-4"
                            }, void 0, false, {
                                fileName: "[project]/src/components/charts/ChartContainer.tsx",
                                lineNumber: 1964,
                                columnNumber: 25
                            }, ("TURBOPACK compile-time value", void 0)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "px-4 py-2 bg-slate-50 dark:bg-slate-900 border-b border-t border-slate-200 dark:border-slate-800 flex justify-between items-center h-[40px] shrink-0",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "flex items-center gap-2",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]"
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/charts/ChartContainer.tsx",
                                                lineNumber: 1968,
                                                columnNumber: 33
                                            }, ("TURBOPACK compile-time value", void 0)),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "font-bold text-indigo-300 tracking-tight",
                                                children: symbolB
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/charts/ChartContainer.tsx",
                                                lineNumber: 1969,
                                                columnNumber: 33
                                            }, ("TURBOPACK compile-time value", void 0))
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/components/charts/ChartContainer.tsx",
                                        lineNumber: 1967,
                                        columnNumber: 29
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "text-[10px] font-bold text-indigo-500/50 uppercase tracking-widest",
                                        children: "Correlation"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/charts/ChartContainer.tsx",
                                        lineNumber: 1971,
                                        columnNumber: 29
                                    }, ("TURBOPACK compile-time value", void 0))
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/charts/ChartContainer.tsx",
                                lineNumber: 1966,
                                columnNumber: 25
                            }, ("TURBOPACK compile-time value", void 0)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "w-full relative flex-1 min-h-0 bg-slate-50 dark:bg-slate-900/10",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    ref: containerRefB,
                                    className: "absolute inset-0"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/charts/ChartContainer.tsx",
                                    lineNumber: 1975,
                                    columnNumber: 29
                                }, ("TURBOPACK compile-time value", void 0))
                            }, void 0, false, {
                                fileName: "[project]/src/components/charts/ChartContainer.tsx",
                                lineNumber: 1974,
                                columnNumber: 25
                            }, ("TURBOPACK compile-time value", void 0))
                        ]
                    }, void 0, true),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$charts$2f$LoadingOverlay$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["LoadingOverlay"], {
                        isVisible: isLoading,
                        error: syncError
                    }, void 0, false, {
                        fileName: "[project]/src/components/charts/ChartContainer.tsx",
                        lineNumber: 1983,
                        columnNumber: 17
                    }, ("TURBOPACK compile-time value", void 0))
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/charts/ChartContainer.tsx",
                lineNumber: 1877,
                columnNumber: 13
            }, ("TURBOPACK compile-time value", void 0)),
            menuState.visible && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$charts$2f$contextmenu$2f$ContextMenu$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ContextMenu"], {
                x: menuState.x,
                y: menuState.y,
                items: menuState.type === 'widget' ? [
                    {
                        label: 'Settings...',
                        action: openSettings
                    },
                    {
                        label: 'Bring to Front',
                        action: ()=>{
                            console.log('Bring to front not implemented yet');
                        }
                    },
                    {
                        label: 'Delete',
                        action: handleDelete,
                        danger: true
                    }
                ] : [
                    {
                        label: 'Remove All Drawings',
                        action: handleRemoveAll,
                        danger: true
                    }
                ],
                onClose: closeMenu
            }, void 0, false, {
                fileName: "[project]/src/components/charts/ChartContainer.tsx",
                lineNumber: 1992,
                columnNumber: 17
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$charts$2f$settings$2f$SettingsModal$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SettingsModal"], {
                isOpen: settingsState.isOpen,
                onClose: closeSettings,
                onSave: saveSettings,
                schema: settingsState.schema,
                title: "Widget Settings"
            }, void 0, false, {
                fileName: "[project]/src/components/charts/ChartContainer.tsx",
                lineNumber: 2006,
                columnNumber: 13
            }, ("TURBOPACK compile-time value", void 0)),
            pendingTrade && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "absolute inset-0 z-[100] flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 animate-in fade-in duration-200",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                    className: "text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: pendingTrade.direction === 'LONG' ? "text-emerald-600 dark:text-emerald-500" : "text-rose-600 dark:text-rose-500",
                                        children: [
                                            pendingTrade.direction === 'LONG' ? "Long" : "Short",
                                            " Setup"
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/components/charts/ChartContainer.tsx",
                                        lineNumber: 2020,
                                        columnNumber: 33
                                    }, ("TURBOPACK compile-time value", void 0))
                                }, void 0, false, {
                                    fileName: "[project]/src/components/charts/ChartContainer.tsx",
                                    lineNumber: 2019,
                                    columnNumber: 29
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    onClick: ()=>setPendingTrade(null),
                                    className: "text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$right$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronRight$3e$__["ChevronRight"], {
                                        className: "rotate-90",
                                        size: 20
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/charts/ChartContainer.tsx",
                                        lineNumber: 2025,
                                        columnNumber: 33
                                    }, ("TURBOPACK compile-time value", void 0))
                                }, void 0, false, {
                                    fileName: "[project]/src/components/charts/ChartContainer.tsx",
                                    lineNumber: 2024,
                                    columnNumber: 29
                                }, ("TURBOPACK compile-time value", void 0))
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/components/charts/ChartContainer.tsx",
                            lineNumber: 2018,
                            columnNumber: 25
                        }, ("TURBOPACK compile-time value", void 0)),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "p-0 overflow-hidden",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "w-full text-sm text-left",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "grid grid-cols-[100px_1fr_80px] border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 text-slate-500 font-bold text-[10px] uppercase tracking-wider",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "px-4 py-2",
                                                    children: "Level"
                                                }, void 0, false, {
                                                    fileName: "[project]/src/components/charts/ChartContainer.tsx",
                                                    lineNumber: 2033,
                                                    columnNumber: 37
                                                }, ("TURBOPACK compile-time value", void 0)),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "px-4 py-2",
                                                    children: "Configuration"
                                                }, void 0, false, {
                                                    fileName: "[project]/src/components/charts/ChartContainer.tsx",
                                                    lineNumber: 2034,
                                                    columnNumber: 37
                                                }, ("TURBOPACK compile-time value", void 0)),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "px-4 py-2 text-right",
                                                    children: "Status"
                                                }, void 0, false, {
                                                    fileName: "[project]/src/components/charts/ChartContainer.tsx",
                                                    lineNumber: 2035,
                                                    columnNumber: 37
                                                }, ("TURBOPACK compile-time value", void 0))
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/components/charts/ChartContainer.tsx",
                                            lineNumber: 2032,
                                            columnNumber: 33
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "grid grid-cols-[100px_1fr_80px] border-b border-slate-200 dark:border-slate-800 items-center hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-colors",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "px-4 py-3 font-bold text-rose-600 dark:text-rose-500",
                                                    children: "Stop Loss"
                                                }, void 0, false, {
                                                    fileName: "[project]/src/components/charts/ChartContainer.tsx",
                                                    lineNumber: 2040,
                                                    columnNumber: 37
                                                }, ("TURBOPACK compile-time value", void 0)),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "px-4 py-3 font-mono text-slate-700 dark:text-slate-300",
                                                    children: pendingTrade.sl.anchor ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: "flex items-center gap-2",
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                className: "bg-slate-200 dark:bg-slate-800 px-1.5 rounded text-[10px] text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-700",
                                                                children: pendingTrade.sl.anchor.timeframe
                                                            }, void 0, false, {
                                                                fileName: "[project]/src/components/charts/ChartContainer.tsx",
                                                                lineNumber: 2044,
                                                                columnNumber: 49
                                                            }, ("TURBOPACK compile-time value", void 0)),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                className: "bg-slate-200 dark:bg-slate-800 px-1.5 rounded text-[10px] text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-700 font-bold text-slate-900 dark:text-white",
                                                                children: pendingTrade.sl.anchor.type.toUpperCase()
                                                            }, void 0, false, {
                                                                fileName: "[project]/src/components/charts/ChartContainer.tsx",
                                                                lineNumber: 2045,
                                                                columnNumber: 49
                                                            }, ("TURBOPACK compile-time value", void 0)),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                children: new Date(pendingTrade.sl.anchor.time * 1000).toISOString().substr(11, 5)
                                                            }, void 0, false, {
                                                                fileName: "[project]/src/components/charts/ChartContainer.tsx",
                                                                lineNumber: 2046,
                                                                columnNumber: 49
                                                            }, ("TURBOPACK compile-time value", void 0))
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/src/components/charts/ChartContainer.tsx",
                                                        lineNumber: 2043,
                                                        columnNumber: 45
                                                    }, ("TURBOPACK compile-time value", void 0)) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: "text-slate-500 dark:text-slate-600 italic",
                                                        children: "No Anchor (Price-based)"
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/components/charts/ChartContainer.tsx",
                                                        lineNumber: 2049,
                                                        columnNumber: 45
                                                    }, ("TURBOPACK compile-time value", void 0))
                                                }, void 0, false, {
                                                    fileName: "[project]/src/components/charts/ChartContainer.tsx",
                                                    lineNumber: 2041,
                                                    columnNumber: 37
                                                }, ("TURBOPACK compile-time value", void 0)),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "px-4 py-3 text-right",
                                                    children: pendingTrade.sl.fixed ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: "text-[10px] font-bold text-slate-100 dark:text-slate-950 bg-slate-500 px-1.5 py-0.5 rounded",
                                                        children: "FIX"
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/components/charts/ChartContainer.tsx",
                                                        lineNumber: 2054,
                                                        columnNumber: 45
                                                    }, ("TURBOPACK compile-time value", void 0)) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: "text-[10px] text-slate-500 dark:text-slate-600",
                                                        children: "Dynamic"
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/components/charts/ChartContainer.tsx",
                                                        lineNumber: 2056,
                                                        columnNumber: 45
                                                    }, ("TURBOPACK compile-time value", void 0))
                                                }, void 0, false, {
                                                    fileName: "[project]/src/components/charts/ChartContainer.tsx",
                                                    lineNumber: 2052,
                                                    columnNumber: 37
                                                }, ("TURBOPACK compile-time value", void 0))
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/components/charts/ChartContainer.tsx",
                                            lineNumber: 2039,
                                            columnNumber: 33
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "grid grid-cols-[100px_1fr_80px] border-b border-slate-200 dark:border-slate-800 items-center hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-colors",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "px-4 py-3 font-bold text-slate-800 dark:text-slate-100",
                                                    children: "Entry"
                                                }, void 0, false, {
                                                    fileName: "[project]/src/components/charts/ChartContainer.tsx",
                                                    lineNumber: 2063,
                                                    columnNumber: 37
                                                }, ("TURBOPACK compile-time value", void 0)),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "px-4 py-3 font-mono text-slate-700 dark:text-slate-300",
                                                    children: pendingTrade.entry.type === 'MARKET' ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: "text-amber-600 dark:text-amber-500 font-bold",
                                                        children: "MARKET"
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/components/charts/ChartContainer.tsx",
                                                        lineNumber: 2066,
                                                        columnNumber: 45
                                                    }, ("TURBOPACK compile-time value", void 0)) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        children: "LIMIT"
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/components/charts/ChartContainer.tsx",
                                                        lineNumber: 2068,
                                                        columnNumber: 45
                                                    }, ("TURBOPACK compile-time value", void 0))
                                                }, void 0, false, {
                                                    fileName: "[project]/src/components/charts/ChartContainer.tsx",
                                                    lineNumber: 2064,
                                                    columnNumber: 37
                                                }, ("TURBOPACK compile-time value", void 0)),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "px-4 py-3 text-right",
                                                    children: pendingTrade.entry.fixed ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: "text-[10px] font-bold text-slate-100 dark:text-slate-950 bg-slate-500 px-1.5 py-0.5 rounded",
                                                        children: "FIX"
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/components/charts/ChartContainer.tsx",
                                                        lineNumber: 2073,
                                                        columnNumber: 45
                                                    }, ("TURBOPACK compile-time value", void 0)) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: "text-[10px] text-slate-500 dark:text-slate-600",
                                                        children: "Dynamic"
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/components/charts/ChartContainer.tsx",
                                                        lineNumber: 2075,
                                                        columnNumber: 45
                                                    }, ("TURBOPACK compile-time value", void 0))
                                                }, void 0, false, {
                                                    fileName: "[project]/src/components/charts/ChartContainer.tsx",
                                                    lineNumber: 2071,
                                                    columnNumber: 37
                                                }, ("TURBOPACK compile-time value", void 0))
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/components/charts/ChartContainer.tsx",
                                            lineNumber: 2062,
                                            columnNumber: 33
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "grid grid-cols-[100px_1fr_80px] border-b border-slate-200 dark:border-slate-800 items-center hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-colors",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "px-4 py-3 font-bold text-slate-800 dark:text-slate-100",
                                                    children: "Risk Reward"
                                                }, void 0, false, {
                                                    fileName: "[project]/src/components/charts/ChartContainer.tsx",
                                                    lineNumber: 2082,
                                                    columnNumber: 37
                                                }, ("TURBOPACK compile-time value", void 0)),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "px-4 py-3 font-mono text-emerald-600 dark:text-emerald-400 font-bold",
                                                    children: [
                                                        pendingTrade.riskReward.value.toFixed(2),
                                                        " R"
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/src/components/charts/ChartContainer.tsx",
                                                    lineNumber: 2083,
                                                    columnNumber: 37
                                                }, ("TURBOPACK compile-time value", void 0)),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "px-4 py-3 text-right",
                                                    children: pendingTrade.riskReward.fixed ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: "text-[10px] font-bold text-slate-100 dark:text-slate-950 bg-emerald-500 px-1.5 py-0.5 rounded",
                                                        children: "FIX"
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/components/charts/ChartContainer.tsx",
                                                        lineNumber: 2088,
                                                        columnNumber: 45
                                                    }, ("TURBOPACK compile-time value", void 0)) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: "text-[10px] text-slate-500 dark:text-slate-600",
                                                        children: "Dynamic"
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/components/charts/ChartContainer.tsx",
                                                        lineNumber: 2090,
                                                        columnNumber: 45
                                                    }, ("TURBOPACK compile-time value", void 0))
                                                }, void 0, false, {
                                                    fileName: "[project]/src/components/charts/ChartContainer.tsx",
                                                    lineNumber: 2086,
                                                    columnNumber: 37
                                                }, ("TURBOPACK compile-time value", void 0))
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/components/charts/ChartContainer.tsx",
                                            lineNumber: 2081,
                                            columnNumber: 33
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "grid grid-cols-[100px_1fr_80px] items-center hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-colors",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "px-4 py-3 font-bold text-emerald-600 dark:text-emerald-500",
                                                    children: "Take Profit"
                                                }, void 0, false, {
                                                    fileName: "[project]/src/components/charts/ChartContainer.tsx",
                                                    lineNumber: 2097,
                                                    columnNumber: 37
                                                }, ("TURBOPACK compile-time value", void 0)),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "px-4 py-3 font-mono text-slate-700 dark:text-slate-300",
                                                    children: pendingTrade.tp.anchor ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: "flex items-center gap-2",
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                className: "bg-slate-200 dark:bg-slate-800 px-1.5 rounded text-[10px] text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-700",
                                                                children: pendingTrade.tp.anchor.timeframe
                                                            }, void 0, false, {
                                                                fileName: "[project]/src/components/charts/ChartContainer.tsx",
                                                                lineNumber: 2101,
                                                                columnNumber: 49
                                                            }, ("TURBOPACK compile-time value", void 0)),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                className: "bg-slate-200 dark:bg-slate-800 px-1.5 rounded text-[10px] text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-700 font-bold text-slate-900 dark:text-white",
                                                                children: pendingTrade.tp.anchor.type.toUpperCase()
                                                            }, void 0, false, {
                                                                fileName: "[project]/src/components/charts/ChartContainer.tsx",
                                                                lineNumber: 2102,
                                                                columnNumber: 49
                                                            }, ("TURBOPACK compile-time value", void 0)),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                children: new Date(pendingTrade.tp.anchor.time * 1000).toISOString().substr(11, 5)
                                                            }, void 0, false, {
                                                                fileName: "[project]/src/components/charts/ChartContainer.tsx",
                                                                lineNumber: 2103,
                                                                columnNumber: 49
                                                            }, ("TURBOPACK compile-time value", void 0))
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/src/components/charts/ChartContainer.tsx",
                                                        lineNumber: 2100,
                                                        columnNumber: 45
                                                    }, ("TURBOPACK compile-time value", void 0)) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: "text-slate-500 dark:text-slate-600 italic opacity-50",
                                                        children: "< leer >"
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/components/charts/ChartContainer.tsx",
                                                        lineNumber: 2106,
                                                        columnNumber: 45
                                                    }, ("TURBOPACK compile-time value", void 0))
                                                }, void 0, false, {
                                                    fileName: "[project]/src/components/charts/ChartContainer.tsx",
                                                    lineNumber: 2098,
                                                    columnNumber: 37
                                                }, ("TURBOPACK compile-time value", void 0)),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "px-4 py-3 text-right",
                                                    children: pendingTrade.tp.fixed ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: "text-[10px] font-bold text-slate-100 dark:text-slate-950 bg-slate-500 px-1.5 py-0.5 rounded",
                                                        children: "FIX"
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/components/charts/ChartContainer.tsx",
                                                        lineNumber: 2111,
                                                        columnNumber: 45
                                                    }, ("TURBOPACK compile-time value", void 0)) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: "text-[10px] text-slate-500 dark:text-slate-600",
                                                        children: "Dynamic"
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/components/charts/ChartContainer.tsx",
                                                        lineNumber: 2113,
                                                        columnNumber: 45
                                                    }, ("TURBOPACK compile-time value", void 0))
                                                }, void 0, false, {
                                                    fileName: "[project]/src/components/charts/ChartContainer.tsx",
                                                    lineNumber: 2109,
                                                    columnNumber: 37
                                                }, ("TURBOPACK compile-time value", void 0))
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/components/charts/ChartContainer.tsx",
                                            lineNumber: 2096,
                                            columnNumber: 33
                                        }, ("TURBOPACK compile-time value", void 0))
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/components/charts/ChartContainer.tsx",
                                    lineNumber: 2031,
                                    columnNumber: 29
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "p-4 bg-slate-100 dark:bg-slate-950/50 border-t border-slate-200 dark:border-slate-800 font-mono text-[10px] text-slate-500 dark:text-slate-600 whitespace-pre overflow-auto max-h-[200px]",
                                    children: JSON.stringify(pendingTrade, null, 2)
                                }, void 0, false, {
                                    fileName: "[project]/src/components/charts/ChartContainer.tsx",
                                    lineNumber: 2119,
                                    columnNumber: 29
                                }, ("TURBOPACK compile-time value", void 0))
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/components/charts/ChartContainer.tsx",
                            lineNumber: 2029,
                            columnNumber: 25
                        }, ("TURBOPACK compile-time value", void 0)),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "px-6 py-4 bg-slate-50 dark:bg-slate-900/80 border-t border-slate-200 dark:border-slate-800 flex gap-3",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    onClick: ()=>setPendingTrade(null),
                                    className: "flex-1 px-4 py-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-white rounded-lg font-bold transition-colors border border-slate-300 dark:border-slate-700 shadow-sm",
                                    children: "Cancel"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/charts/ChartContainer.tsx",
                                    lineNumber: 2125,
                                    columnNumber: 29
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    onClick: handleConfirmExecution,
                                    className: "flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold transition-colors shadow-lg shadow-emerald-500/20",
                                    children: "Confirm Execution"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/charts/ChartContainer.tsx",
                                    lineNumber: 2131,
                                    columnNumber: 29
                                }, ("TURBOPACK compile-time value", void 0))
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/components/charts/ChartContainer.tsx",
                            lineNumber: 2124,
                            columnNumber: 25
                        }, ("TURBOPACK compile-time value", void 0))
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/components/charts/ChartContainer.tsx",
                    lineNumber: 2017,
                    columnNumber: 21
                }, ("TURBOPACK compile-time value", void 0))
            }, void 0, false, {
                fileName: "[project]/src/components/charts/ChartContainer.tsx",
                lineNumber: 2016,
                columnNumber: 17
            }, ("TURBOPACK compile-time value", void 0)),
            isExecutingTrade && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "absolute inset-0 z-[110] flex items-center justify-center bg-white/80 dark:bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex flex-col items-center gap-4 bg-white dark:bg-slate-900/90 p-8 rounded-2xl border border-slate-300 dark:border-slate-700 shadow-2xl",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "relative",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "w-16 h-16 border-4 border-slate-200 dark:border-slate-800 rounded-full"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/charts/ChartContainer.tsx",
                                    lineNumber: 2147,
                                    columnNumber: 29
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "absolute top-0 left-0 w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/charts/ChartContainer.tsx",
                                    lineNumber: 2148,
                                    columnNumber: 29
                                }, ("TURBOPACK compile-time value", void 0))
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/components/charts/ChartContainer.tsx",
                            lineNumber: 2146,
                            columnNumber: 25
                        }, ("TURBOPACK compile-time value", void 0)),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex flex-col items-center gap-1",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    className: "text-lg font-bold text-slate-900 dark:text-white tracking-widest text-shadow-glow",
                                    children: "EXECUTING TRADES"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/charts/ChartContainer.tsx",
                                    lineNumber: 2151,
                                    columnNumber: 29
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    className: "text-xs font-mono text-slate-500 dark:text-slate-400",
                                    children: "Please wait..."
                                }, void 0, false, {
                                    fileName: "[project]/src/components/charts/ChartContainer.tsx",
                                    lineNumber: 2152,
                                    columnNumber: 29
                                }, ("TURBOPACK compile-time value", void 0))
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/components/charts/ChartContainer.tsx",
                            lineNumber: 2150,
                            columnNumber: 25
                        }, ("TURBOPACK compile-time value", void 0))
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/components/charts/ChartContainer.tsx",
                    lineNumber: 2145,
                    columnNumber: 21
                }, ("TURBOPACK compile-time value", void 0))
            }, void 0, false, {
                fileName: "[project]/src/components/charts/ChartContainer.tsx",
                lineNumber: 2144,
                columnNumber: 17
            }, ("TURBOPACK compile-time value", void 0)),
            executionSummary && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "absolute inset-0 z-[120] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in zoom-in duration-200",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                    className: "text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: executionSummary.some((r)=>r.status === 'error') ? "text-amber-600 dark:text-amber-500" : "text-emerald-600 dark:text-emerald-500",
                                        children: "Execution Report"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/charts/ChartContainer.tsx",
                                        lineNumber: 2164,
                                        columnNumber: 33
                                    }, ("TURBOPACK compile-time value", void 0))
                                }, void 0, false, {
                                    fileName: "[project]/src/components/charts/ChartContainer.tsx",
                                    lineNumber: 2163,
                                    columnNumber: 29
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    onClick: ()=>setExecutionSummary(null),
                                    className: "text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$right$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronRight$3e$__["ChevronRight"], {
                                        className: "rotate-90",
                                        size: 20
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/charts/ChartContainer.tsx",
                                        lineNumber: 2169,
                                        columnNumber: 33
                                    }, ("TURBOPACK compile-time value", void 0))
                                }, void 0, false, {
                                    fileName: "[project]/src/components/charts/ChartContainer.tsx",
                                    lineNumber: 2168,
                                    columnNumber: 29
                                }, ("TURBOPACK compile-time value", void 0))
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/components/charts/ChartContainer.tsx",
                            lineNumber: 2162,
                            columnNumber: 25
                        }, ("TURBOPACK compile-time value", void 0)),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex-1 overflow-y-auto p-0",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "grid grid-cols-[120px_1fr_100px] border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 text-slate-500 font-bold text-[10px] uppercase tracking-wider sticky top-0 z-10 backdrop-blur-sm",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "px-4 py-2",
                                            children: "Account"
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/charts/ChartContainer.tsx",
                                            lineNumber: 2175,
                                            columnNumber: 33
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "px-4 py-2",
                                            children: "Details"
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/charts/ChartContainer.tsx",
                                            lineNumber: 2176,
                                            columnNumber: 33
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "px-4 py-2 text-right",
                                            children: "Status"
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/charts/ChartContainer.tsx",
                                            lineNumber: 2177,
                                            columnNumber: 33
                                        }, ("TURBOPACK compile-time value", void 0))
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/components/charts/ChartContainer.tsx",
                                    lineNumber: 2174,
                                    columnNumber: 29
                                }, ("TURBOPACK compile-time value", void 0)),
                                executionSummary.flatMap((batch, batchIdx)=>batch.accounts.map((acc, accIdx)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "grid grid-cols-[120px_1fr_100px] border-b border-slate-200 dark:border-slate-800 items-center hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-colors py-2 text-sm",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "px-4 font-mono text-slate-700 dark:text-slate-300 font-bold truncate",
                                                    title: acc.login || acc.id,
                                                    children: acc.login || acc.id
                                                }, void 0, false, {
                                                    fileName: "[project]/src/components/charts/ChartContainer.tsx",
                                                    lineNumber: 2183,
                                                    columnNumber: 41
                                                }, ("TURBOPACK compile-time value", void 0)),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "px-4 text-xs text-slate-500 dark:text-slate-400",
                                                    children: [
                                                        batch.brokerId,
                                                        batch.details && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            className: "text-[10px] text-slate-600 mt-1 truncate",
                                                            children: JSON.stringify(batch.details.message || batch.details)
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/components/charts/ChartContainer.tsx",
                                                            lineNumber: 2189,
                                                            columnNumber: 49
                                                        }, ("TURBOPACK compile-time value", void 0)),
                                                        batch.error && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            className: "text-[10px] text-rose-500 mt-1 truncate font-bold",
                                                            children: batch.error
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/components/charts/ChartContainer.tsx",
                                                            lineNumber: 2194,
                                                            columnNumber: 49
                                                        }, ("TURBOPACK compile-time value", void 0))
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/src/components/charts/ChartContainer.tsx",
                                                    lineNumber: 2186,
                                                    columnNumber: 41
                                                }, ("TURBOPACK compile-time value", void 0)),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "px-4 text-right",
                                                    children: batch.status === 'success' ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: "bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded text-[10px] font-bold border border-emerald-500/20",
                                                        children: "SENT"
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/components/charts/ChartContainer.tsx",
                                                        lineNumber: 2201,
                                                        columnNumber: 49
                                                    }, ("TURBOPACK compile-time value", void 0)) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: "bg-rose-500/10 text-rose-500 px-2 py-0.5 rounded text-[10px] font-bold border border-rose-500/20",
                                                        children: "FAILED"
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/components/charts/ChartContainer.tsx",
                                                        lineNumber: 2203,
                                                        columnNumber: 49
                                                    }, ("TURBOPACK compile-time value", void 0))
                                                }, void 0, false, {
                                                    fileName: "[project]/src/components/charts/ChartContainer.tsx",
                                                    lineNumber: 2199,
                                                    columnNumber: 41
                                                }, ("TURBOPACK compile-time value", void 0))
                                            ]
                                        }, `${batchIdx}-${accIdx}`, true, {
                                            fileName: "[project]/src/components/charts/ChartContainer.tsx",
                                            lineNumber: 2182,
                                            columnNumber: 37
                                        }, ("TURBOPACK compile-time value", void 0))))
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/components/charts/ChartContainer.tsx",
                            lineNumber: 2173,
                            columnNumber: 25
                        }, ("TURBOPACK compile-time value", void 0)),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "px-6 py-4 bg-slate-50 dark:bg-slate-900/80 border-t border-slate-200 dark:border-slate-800 flex justify-end",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                onClick: ()=>setExecutionSummary(null),
                                className: "px-6 py-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-white rounded-lg font-bold transition-colors border border-slate-300 dark:border-slate-700 shadow-sm",
                                children: "Close"
                            }, void 0, false, {
                                fileName: "[project]/src/components/charts/ChartContainer.tsx",
                                lineNumber: 2212,
                                columnNumber: 29
                            }, ("TURBOPACK compile-time value", void 0))
                        }, void 0, false, {
                            fileName: "[project]/src/components/charts/ChartContainer.tsx",
                            lineNumber: 2211,
                            columnNumber: 25
                        }, ("TURBOPACK compile-time value", void 0))
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/components/charts/ChartContainer.tsx",
                    lineNumber: 2161,
                    columnNumber: 21
                }, ("TURBOPACK compile-time value", void 0))
            }, void 0, false, {
                fileName: "[project]/src/components/charts/ChartContainer.tsx",
                lineNumber: 2160,
                columnNumber: 17
            }, ("TURBOPACK compile-time value", void 0))
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/charts/ChartContainer.tsx",
        lineNumber: 1809,
        columnNumber: 9
    }, ("TURBOPACK compile-time value", void 0));
}, "HYgD8O+lxqe79q45ZrRgHZpPLMc=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$context$2f$ChartThemeContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useChartTheme"],
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$stores$2f$useWorkspaceStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useWorkspaceStore"],
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$useTradeMonitor$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useTradeMonitor"],
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$useContextMenu$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useContextMenu"],
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$stores$2f$useBrokerStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useBrokerStore"]
    ];
})), "HYgD8O+lxqe79q45ZrRgHZpPLMc=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$context$2f$ChartThemeContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useChartTheme"],
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$stores$2f$useWorkspaceStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useWorkspaceStore"],
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$useTradeMonitor$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useTradeMonitor"],
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$useContextMenu$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useContextMenu"],
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$stores$2f$useBrokerStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useBrokerStore"]
    ];
});
_c3 = ChartContainer;
var _c, _c1, _c2, _c3;
__turbopack_context__.k.register(_c, "LongIcon");
__turbopack_context__.k.register(_c1, "ShortIcon");
__turbopack_context__.k.register(_c2, "ChartContainer$React.forwardRef");
__turbopack_context__.k.register(_c3, "ChartContainer");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/components/charts/ChartStatusIndicator.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ChartStatusIndicator",
    ()=>ChartStatusIndicator
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$wifi$2d$off$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__WifiOff$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/wifi-off.js [app-client] (ecmascript) <export default as WifiOff>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$refresh$2d$cw$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__RefreshCw$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/refresh-cw.js [app-client] (ecmascript) <export default as RefreshCw>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$context$2f$ChartThemeContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/context/ChartThemeContext.tsx [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
;
;
const ChartStatusIndicator = ({ status, className = "" })=>{
    _s();
    const { mode } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$context$2f$ChartThemeContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useChartTheme"])();
    const isDark = mode === 'dark';
    let content = null;
    let containerClass = "flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold tracking-wider border transition-colors select-none";
    // Explicit Styles based on Chart Theme Mode (ignoring App Global Theme)
    switch(status){
        case 'OFFLINE':
            if (isDark) {
                // Dark Mode: Gray BG, Black Text
                containerClass += " bg-gray-400 text-black border-gray-500";
            } else {
                // Light Mode: Black BG, White Text
                containerClass += " bg-black text-white border-black";
            }
            content = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$wifi$2d$off$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__WifiOff$3e$__["WifiOff"], {
                        size: 10,
                        strokeWidth: 3
                    }, void 0, false, {
                        fileName: "[project]/src/components/charts/ChartStatusIndicator.tsx",
                        lineNumber: 31,
                        columnNumber: 21
                    }, ("TURBOPACK compile-time value", void 0)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        children: "OFFLINE"
                    }, void 0, false, {
                        fileName: "[project]/src/components/charts/ChartStatusIndicator.tsx",
                        lineNumber: 32,
                        columnNumber: 21
                    }, ("TURBOPACK compile-time value", void 0))
                ]
            }, void 0, true);
            break;
        case 'SYNCING':
            if (isDark) {
                // Dark Mode: Gray BG, Amber Text
                containerClass += " bg-gray-400 text-amber-900 border-gray-500";
            } else {
                // Light Mode: Black BG, Yellow Text
                containerClass += " bg-black text-yellow-400 border-black";
            }
            content = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$refresh$2d$cw$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__RefreshCw$3e$__["RefreshCw"], {
                        size: 10,
                        strokeWidth: 3,
                        className: "animate-spin"
                    }, void 0, false, {
                        fileName: "[project]/src/components/charts/ChartStatusIndicator.tsx",
                        lineNumber: 46,
                        columnNumber: 21
                    }, ("TURBOPACK compile-time value", void 0)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        children: "SYNCING"
                    }, void 0, false, {
                        fileName: "[project]/src/components/charts/ChartStatusIndicator.tsx",
                        lineNumber: 47,
                        columnNumber: 21
                    }, ("TURBOPACK compile-time value", void 0))
                ]
            }, void 0, true);
            break;
        case 'ONLINE':
            // Hidden
            return null;
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: `${containerClass} ${className}`,
        children: content
    }, void 0, false, {
        fileName: "[project]/src/components/charts/ChartStatusIndicator.tsx",
        lineNumber: 57,
        columnNumber: 9
    }, ("TURBOPACK compile-time value", void 0));
};
_s(ChartStatusIndicator, "gxx/hLDgVDH034NowatX7VieEtc=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$context$2f$ChartThemeContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useChartTheme"]
    ];
});
_c = ChartStatusIndicator;
var _c;
__turbopack_context__.k.register(_c, "ChartStatusIndicator");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/components/charts/plugins/ICTSessionsPlugin.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ICTSessionsPlugin",
    ()=>ICTSessionsPlugin,
    "ICTSessionsSchema",
    ()=>ICTSessionsSchema
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$charts$2f$widgets$2f$BaseWidget$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/charts/widgets/BaseWidget.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$chartUtils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/chartUtils.ts [app-client] (ecmascript)");
;
;
class ICTSessionsPlugin extends __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$charts$2f$widgets$2f$BaseWidget$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["BaseWidget"] {
    constructor(settings){
        // BaseWidget expects initialData
        super({
            settings,
            sessions: [],
            lastCandleTime: undefined,
            timeframe: undefined
        });
    }
    updateSessions(sessions) {
        if (sessions.length > 0) {
            console.log(`[ICTPlugin] Updated Sessions: ${sessions.length}`, sessions[0]);
        }
        this._data.sessions = sessions;
        this.requestUpdate();
    }
    /**
     * Updates the plugin with the timestamp (seconds) of the latest known candle.
     * This is crucial to snap active sessions to the data edge, avoiding whitespace extension.
     */ updateCurrentTime(time) {
        // time is strictly seconds (Unix Timestamp)
        if (this._data.lastCandleTime !== time) {
            this._data.lastCandleTime = time;
            this.requestUpdate();
        }
    }
    updateSettings(settings) {
        this._data.settings = settings;
        this.requestUpdate();
    }
    updateTimeframe(timeframe) {
        if (this._data.timeframe !== timeframe) {
            this._data.timeframe = timeframe;
            this.requestUpdate();
        }
    }
    // --- ISeriesPrimitive Implementation ---
    updateGeometry(timeScale, series) {
    // No complex geometry caching needed for this simple overlay
    }
    applyDrag(target, newPoint) {
    // No dragging
    }
    // Override hitTest to disable interaction/dragging for this indicator
    hitTestBody(point) {
        return false;
    }
    getLineDash(style) {
        switch(style){
            case 'Solid':
                return [];
            case 'Dotted':
                return [
                    2,
                    2
                ];
            case 'Dashed':
                return [
                    5,
                    5
                ];
            default:
                return [
                    5,
                    5
                ];
        }
    }
    drawBody(ctx) {
        const { sessions, settings, lastCandleTime, timeframe } = this._data;
        if (!this._chart || !this._series || sessions.length === 0) return;
        // Check Max Timeframe
        if (timeframe && settings.max_timeframe) {
            const currentSec = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$chartUtils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getTimeframeSeconds"])(timeframe);
            const maxSec = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$chartUtils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getTimeframeSeconds"])(settings.max_timeframe);
            if (currentSec > maxSec) return;
        }
        const timeScale = this._chart.timeScale();
        const nowSeconds = Date.now() / 1000;
        // Define comparison time: Use lastCandleTime if available, else Date.now()
        // FIX: Ensure strict clamping to lastCandleTime if available to avoid future overflow.
        // If lastCandleTime is missing/invalid, fallback to nowSeconds but treat it cautiously.
        const comparisonTime = lastCandleTime && lastCandleTime > 0 ? lastCandleTime : nowSeconds;
        ctx.save();
        // 1. Boxes & Lines
        // Filter sessions by history_count if set
        let sessionsToDraw = sessions;
        if (settings.history_count && settings.history_count > 0) {
            sessionsToDraw = sessions.slice(-settings.history_count);
        }
        for(let i = 0; i < sessionsToDraw.length; i++){
            const session = sessionsToDraw[i];
            if (!session.start_time) continue;
            // Find NEXT session of same type for limiting
            let nextSessionStart = Infinity;
            if (settings.limit_to_next_session) {
                // BUG FIX: We must search in the FULL sessions array, not relative to the sliced loop index 'i'
                const realIndex = sessions.indexOf(session);
                if (realIndex !== -1) {
                    for(let j = realIndex + 1; j < sessions.length; j++){
                        if (sessions[j].session_type === session.session_type) {
                            nextSessionStart = sessions[j].start_time / 1000;
                            break;
                        }
                    }
                }
            }
            const timeS = session.start_time / 1000;
            const timeE = session.end_time ? session.end_time / 1000 : null;
            const nominalEnd = timeE ? timeE : nowSeconds;
            // --- CORE LOGIC ---
            // Clamp the drawing end to the 'active' edge of the chart (comparisonTime).
            // If the session is historic (nominalEnd < comparisonTime), we draw to nominalEnd.
            // If the session is active/future (nominalEnd > comparisonTime), we draw ONLY to comparisonTime (Latest Candle).
            let effectiveEnd = Math.min(nominalEnd, comparisonTime);
            // FIX: Ensure effectiveEnd is never BEFORE start time (prevents backward draw)
            effectiveEnd = Math.max(effectiveEnd, timeS);
            // Calculate coordinates
            const x1 = timeScale.timeToCoordinate(timeS);
            // Logic for x2 (End Coordinate)
            // If the session is fully complete (nominalEnd <= comparisonTime), we must treat nominalEnd as EXCLUSIVE.
            // Example: Session ends 03:00. Candle 03:00 exists. We must NOT draw on 03:00. We stop at 02:45.
            let x2 = timeScale.timeToCoordinate(effectiveEnd);
            const isSessionComplete = comparisonTime >= nominalEnd;
            if (isSessionComplete && x2 !== null) {
                // If we mapped strictly to a coordinate, we might be on the "exclusive" boundary candle.
                // We need to back off 1 logical index.
                const tsApi = timeScale; // Cast to access logical methods if not on interface
                if (tsApi.coordinateToLogical && tsApi.logicalToCoordinate) {
                    const logicIdx = tsApi.coordinateToLogical(x2);
                    if (logicIdx !== null) {
                        // Logic: If effectiveEnd is exactly the session end, exclude it using -1 logical
                        // However, lightweight-charts coordinates are centers. 
                        // If we found a valid candle at effectiveEnd, we back off to the previous one.
                        const prevLogicIdx = logicIdx - 1;
                        const prevX = tsApi.logicalToCoordinate(prevLogicIdx);
                        if (prevX !== null) {
                            x2 = prevX;
                        }
                    }
                }
            }
            // Valid X1
            const validX1 = x1 !== null ? x1 : -100;
            // Valid X2
            let validX2;
            if (x2 !== null) {
                validX2 = x2;
            } else {
                // If effectiveEnd (LatestBar) has no coordinate in LWC, it usually means 
                // it is offscreen left or we have a gap.
                // Fallback check against Visible Range
                const visibleRange = timeScale.getVisibleRange();
                if (!visibleRange) {
                    validX2 = -100;
                } else {
                    // If effectiveEnd is > VisibleFrom, it SHOULD be on screen or right edge
                    if (effectiveEnd >= visibleRange.from) {
                        // It's conceptually on screen (just map failure?). Snap to Right Edge.
                        // This handles the "Hot Candle" case where maybe it hasn't indexed yet?
                        // Or simply use timeScale width as a safe Right Anchor if we know we are 'active'
                        const rightEdgeX = timeScale.timeToCoordinate(visibleRange.to);
                        validX2 = rightEdgeX !== null ? rightEdgeX : timeScale.width();
                    } else {
                        // Truly past
                        validX2 = -100;
                    }
                }
            }
            // If both offscreen left, skip
            if (validX1 === -100 && validX2 === -100) continue;
            // Calculate Y coords
            const yHigh = this._series.priceToCoordinate(session.high);
            const yLow = this._series.priceToCoordinate(session.low);
            if (yHigh === null || yLow === null) continue;
            const sessionColor = this.getColorForSession(session.session_type, settings);
            const boxColor = this.hexToRgba(sessionColor, settings.box_transparency || 0.1);
            const width = validX2 - validX1;
            const height = yLow - yHigh; // High price has lower Y value
            // DRAW BOX
            ctx.fillStyle = boxColor;
            ctx.fillRect(validX1, yHigh, width, height);
            // DRAW PIVOTS (Hi/Lo)
            ctx.beginPath();
            ctx.strokeStyle = sessionColor;
            ctx.lineWidth = settings.linewidth || 1;
            // High Pivot
            const highMitigatedWait = settings.mitigation_enabled && session.mitigated_at_high;
            // Base End: If mitigated, stop there. Else, go to 'Now' (comparisonTime).
            let highEndTs = highMitigatedWait ? session.mitigated_at_high / 1000 : comparisonTime;
            // Limit Rule: Stop at next session start if configured
            highEndTs = Math.min(highEndTs, nextSessionStart);
            // Global Clamp: Never draw past the 'Latest Candle' (comparisonTime)
            let effectiveHighEnd = Math.min(highEndTs, comparisonTime);
            // FIX: Ensure it doesn't go backwards
            effectiveHighEnd = Math.max(effectiveHighEnd, timeS);
            const xLineEndHigh = timeScale.timeToCoordinate(effectiveHighEnd);
            const safeXLineEndHigh = xLineEndHigh !== null ? xLineEndHigh : validX2; // Fallback to box end if line end is null
            ctx.setLineDash(this.getLineDash(settings.high_line_style || 'Dashed'));
            ctx.moveTo(validX1, yHigh);
            // If safeXLineEndHigh < validX1, we might still draw backwards if coordinate mapping is weird.
            // Force Math.max for coordinates too if needed, but time clamp should suffice.
            const drawnXHigh = Math.max(validX1, safeXLineEndHigh);
            ctx.lineTo(drawnXHigh, yHigh);
            ctx.stroke();
            // Low Pivot
            const lowMitigatedWait = settings.mitigation_enabled && session.mitigated_at_low;
            let lowEndTs = lowMitigatedWait ? session.mitigated_at_low / 1000 : comparisonTime;
            lowEndTs = Math.min(lowEndTs, nextSessionStart);
            let effectiveLowEnd = Math.min(lowEndTs, comparisonTime);
            // FIX: Ensure it doesn't go backwards
            effectiveLowEnd = Math.max(effectiveLowEnd, timeS);
            const xLineEndLow = timeScale.timeToCoordinate(effectiveLowEnd);
            const safeXLineEndLow = xLineEndLow !== null ? xLineEndLow : validX2;
            ctx.beginPath(); // New path for low
            ctx.setLineDash(this.getLineDash(settings.low_line_style || 'Dashed'));
            ctx.strokeStyle = sessionColor; // Reset stroke just in case
            ctx.moveTo(validX1, yLow);
            const drawnXLow = Math.max(validX1, safeXLineEndLow);
            ctx.lineTo(drawnXLow, yLow);
            ctx.stroke();
            // DRAW LABELS
            if (settings.show_labels) {
                const text = session.session_type;
                const lines = text.split(' ');
                const margin = 10;
                const safeWidth = Math.abs(width) - margin;
                const safeHeight = Math.abs(height) - margin;
                if (safeWidth > 10 && safeHeight > 5) {
                    ctx.save();
                    // Use paler color for text (35% opacity based on session color)
                    ctx.fillStyle = this.hexToRgba(sessionColor, 0.35);
                    // 1. Measure text at Reference Size
                    const refSize = 20;
                    ctx.font = `bold ${refSize}px Roboto`;
                    // Measure widest line
                    let maxTextW = 0;
                    for (const line of lines){
                        const m = ctx.measureText(line);
                        if (m.width > maxTextW) maxTextW = m.width;
                    }
                    // Calculate scale to fit width
                    let scale = safeWidth / maxTextW;
                    let fontSize = refSize * scale;
                    // Check height constraint (total height of all lines)
                    // line height approx 1.2 * fontSize
                    const totalLineHeightVal = fontSize * 1.2 * lines.length;
                    if (totalLineHeightVal > safeHeight) {
                        // fontSize * 1.2 * lines.length = safeHeight
                        // fontSize = safeHeight / (1.2 * lines.length)
                        fontSize = safeHeight / (1.2 * lines.length);
                    }
                    const MIN_FONT = 8;
                    const MAX_FONT = 200;
                    fontSize = Math.max(MIN_FONT, Math.min(MAX_FONT, fontSize));
                    ctx.font = `bold ${fontSize}px Roboto`;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    const centerX = validX1 + width / 2;
                    const centerY = yHigh + height / 2;
                    const lineHeight = fontSize * 1.2;
                    // Vertical centering offset
                    // If we have N lines, total height is N * lineHeight.
                    // Start Y = CenterY - TotalHeight/2 + LineHeight/2 (since baseline is middle)
                    // Actually, if baseline is middle, the 'middle' of the block is at CenterY.
                    // Line i (0-indexed) offset: (i - (N-1)/2) * lineHeight
                    if (fontSize >= MIN_FONT) {
                        for(let i = 0; i < lines.length; i++){
                            const lineOffset = (i - (lines.length - 1) / 2) * lineHeight;
                            ctx.fillText(lines[i], centerX, centerY + lineOffset);
                        }
                    }
                    ctx.restore();
                }
            }
        }
        ctx.restore();
    }
    getColorForSession(type, settings) {
        switch(type){
            case 'ASIA':
                return settings.asia_color;
            case 'LONDON':
                return settings.london_color;
            case 'NYAM':
                return settings.nyam_color;
            case 'NYPM':
                return settings.nypm_color;
            default:
                return '#cccccc';
        }
    }
    hexToRgba(hex, alpha) {
        // Simple hex to rgba
        let r = 0, g = 0, b = 0;
        if (hex.length === 4) {
            r = parseInt(hex[1] + hex[1], 16);
            g = parseInt(hex[2] + hex[2], 16);
            b = parseInt(hex[3] + hex[3], 16);
        } else if (hex.length === 7) {
            r = parseInt(hex.substring(1, 3), 16);
            g = parseInt(hex.substring(3, 5), 16);
            b = parseInt(hex.substring(5, 7), 16);
        } else if (hex.length === 9) {
            // Hex8 #RRGGBBAA - Ignore alpha from hex, use override
            r = parseInt(hex.substring(1, 3), 16);
            g = parseInt(hex.substring(3, 5), 16);
            b = parseInt(hex.substring(5, 7), 16);
        }
        return `rgba(${r},${g},${b},${alpha})`;
    }
}
const ICTSessionsSchema = [
    {
        group: 'General',
        id: 'max_timeframe',
        type: 'select',
        title: 'Timeframe Limit',
        def: 'H1',
        options: [
            'M1',
            'M2',
            'M3',
            'M5',
            'M10',
            'M15',
            'M30',
            'H1',
            'H2',
            'H3',
            'H4',
            'H6',
            'H8',
            'H12',
            'D1',
            'W1',
            'MN1'
        ]
    },
    {
        group: 'General',
        id: 'history_count',
        type: 'number',
        title: 'History Count (0=All)',
        def: 10
    },
    {
        group: 'Asia Session',
        id: 'show_asia',
        type: 'bool',
        title: 'Enable Asia',
        def: true
    },
    {
        group: 'Asia Session',
        id: 'asia_range',
        type: 'time_range',
        title: 'Range (EST)',
        def: '2000-0000'
    },
    {
        group: 'Asia Session',
        id: 'asia_color',
        type: 'color',
        title: 'Color',
        def: '#3b82f6'
    },
    {
        group: 'London Session',
        id: 'show_london',
        type: 'bool',
        title: 'Enable London',
        def: true
    },
    {
        group: 'London Session',
        id: 'london_range',
        type: 'time_range',
        title: 'Range (EST)',
        def: '0300-0600'
    },
    {
        group: 'London Session',
        id: 'london_color',
        type: 'color',
        title: 'Color',
        def: '#22c55e'
    },
    {
        group: 'New York AM',
        id: 'show_nyam',
        type: 'bool',
        title: 'Enable NY AM',
        def: true
    },
    {
        group: 'New York AM',
        id: 'nyam_range',
        type: 'time_range',
        title: 'Range (EST)',
        def: '0930-1100'
    },
    {
        group: 'New York AM',
        id: 'nyam_color',
        type: 'color',
        title: 'Color',
        def: '#ef4444'
    },
    {
        group: 'New York PM',
        id: 'show_nypm',
        type: 'bool',
        title: 'Enable NY PM',
        def: true
    },
    {
        group: 'New York PM',
        id: 'nypm_range',
        type: 'time_range',
        title: 'Range (EST)',
        def: '1330-1600'
    },
    {
        group: 'New York PM',
        id: 'nypm_color',
        type: 'color',
        title: 'Color',
        def: '#eab308'
    },
    {
        group: 'Visuals',
        id: 'box_transparency',
        type: 'number',
        title: 'Transparency (0-1)',
        def: 0.15
    },
    {
        group: 'Visuals',
        id: 'linewidth',
        type: 'number',
        title: 'Line Width',
        def: 1
    },
    {
        group: 'Visuals',
        id: 'high_line_style',
        type: 'select',
        title: 'High Line Style',
        def: 'Dashed',
        options: [
            'Solid',
            'Dashed',
            'Dotted'
        ]
    },
    {
        group: 'Visuals',
        id: 'low_line_style',
        type: 'select',
        title: 'Low Line Style',
        def: 'Dashed',
        options: [
            'Solid',
            'Dashed',
            'Dotted'
        ]
    },
    {
        group: 'Visuals',
        id: 'show_labels',
        type: 'bool',
        title: 'Show Labels',
        def: true
    },
    {
        group: 'Logic',
        id: 'mitigation_enabled',
        type: 'bool',
        title: 'Visualize Mitigation',
        def: true
    },
    {
        group: 'Logic',
        id: 'limit_to_next_session',
        type: 'bool',
        title: 'Limit to Next Session',
        def: true
    }
];
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/components/charts/plugins/ImbalancePlugin.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ImbalancePlugin",
    ()=>ImbalancePlugin,
    "applyImbalanceTransformation",
    ()=>applyImbalanceTransformation
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$charts$2f$widgets$2f$BaseWidget$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/charts/widgets/BaseWidget.ts [app-client] (ecmascript)");
;
const applyImbalanceTransformation = (data, settings)=>{
    // Clone data to avoid mutating source
    // We create a shallow copy of the array, but we must also handle item cloning if modify
    const result = [
        ...data
    ];
    if (result.length < 3) return result;
    const { bullishColor, bearishColor, showBullish, showBearish } = settings;
    // Iterate through data (excluding first and last to check neighbors)
    // We check pattern: Prev -> Curr -> Next
    // Imbalance is identified on the 'Curr' (middle) candle.
    for(let i = 1; i < result.length - 1; i++){
        const prev = result[i - 1];
        const curr = result[i];
        const next = result[i + 1];
        let isBullishImbalance = false;
        let isBearishImbalance = false;
        // Bullish Imbalance: Middle is Bullish (Close > Open)
        // AND High of Prev < Low of Next
        if (showBullish && curr.close > curr.open) {
            if (prev.high < next.low) {
                isBullishImbalance = true;
            }
        }
        // Bearish Imbalance: Middle is Bearish (Close < Open)
        // AND Low of Prev > High of Next
        if (showBearish && curr.close < curr.open) {
            if (prev.low > next.high) {
                isBearishImbalance = true;
            }
        }
        if (isBullishImbalance || isBearishImbalance) {
            const color = isBullishImbalance ? bullishColor : bearishColor;
            // Apply color overrides to the Middle Candle
            // We create a new object for the modified candle to preserve immutability of the original data source
            result[i] = {
                ...curr,
                color: color
            };
        }
    }
    return result;
};
class ImbalancePlugin extends __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$charts$2f$widgets$2f$BaseWidget$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["BaseWidget"] {
    constructor(settings){
        super({
            settings
        });
    }
    // No-op drawing
    drawBody(ctx) {}
    // Implement required methods
    updateGeometry(timeScale, series) {}
    updateData(data) {}
    updateCandle(candle) {}
    updateSettings(settings) {}
    // Interaction methods
    hitTestBody(point) {
        return false;
    }
    applyDrag(target, newPoint) {}
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/components/charts/plugins/LevelsPlugin.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "LevelsPlugin",
    ()=>LevelsPlugin,
    "LevelsSchema",
    ()=>LevelsSchema
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$charts$2f$widgets$2f$BaseWidget$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/charts/widgets/BaseWidget.ts [app-client] (ecmascript)");
;
class LevelsPlugin extends __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$charts$2f$widgets$2f$BaseWidget$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["BaseWidget"] {
    constructor(settings){
        super({
            settings,
            levels: [],
            separators: [],
            data: [],
            timeframe: undefined
        });
    }
    updateSettings(settings) {
        this._data.settings = settings;
        this.recalculateLevels();
        this.requestUpdate();
    }
    updateTimeframe(timeframe) {
        if (this._data.timeframe !== timeframe) {
            this._data.timeframe = timeframe;
            // Recalculate if needed (often levels depend on lower timeframe data aggregation)
            this.recalculateLevels();
            this.requestUpdate();
        }
    }
    updateCurrentTime(time) {
        this._data.lastCandleTime = time;
        this.requestUpdate();
    }
    updateData(data) {
        this._data.data = data;
        this.recalculateLevels();
        this.requestUpdate();
    }
    // --- Calculation Logic ---
    recalculateLevels() {
        const { data, settings } = this._data;
        if (!data || data.length === 0) return;
        // Reset
        this._data.levels = [];
        this._data.separators = [];
        this.calculateSegments(data, settings);
    }
    calculateSegments(data, settings) {
        if (!data.length) return;
        const levels = [];
        const separators = [];
        // Active Lists for Auto-Closing
        let activeDaily = [];
        let activeWeekly = [];
        let activeMonthly = [];
        const brokerTz = settings.broker_timezone || 'UTC';
        const tdoTz = 'America/New_York'; // HARDCODED as per requirement
        // Opener State Latch (Index -> Last Day Key)
        const openerState = new Map();
        // 1. Broker Format (for D/W/M)
        const brokerFmt = new Intl.DateTimeFormat('en-US', {
            timeZone: brokerTz,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            weekday: 'short',
            hour12: false
        });
        // 2. Reference Format (for Custom Opens)
        // 2. Reference Format (for True Day Open - NY)
        const tdoFmt = new Intl.DateTimeFormat('en-US', {
            timeZone: tdoTz,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            weekday: 'short',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });
        let currentDay = null;
        let currentWeekday = null;
        let currentWeek = null;
        let currentMonth = null;
        let dayStartIdx = 0;
        let prevDayHigh = NaN, prevDayLow = NaN;
        let prevDayHighTime = NaN, prevDayLowTime = NaN;
        let weekStartIdx = 0;
        let prevWeekHigh = NaN, prevWeekLow = NaN;
        let prevWeekHighTime = NaN, prevWeekLowTime = NaN;
        let monthStartIdx = 0;
        let prevMonthHigh = NaN, prevMonthLow = NaN;
        let prevMonthHighTime = NaN, prevMonthLowTime = NaN;
        // Helpers for Level Creation
        const addLevel = (list, activeList, item)=>{
            list.push(item);
            activeList.push(item);
        };
        const closeLevels = (activeList, time)=>{
            activeList.forEach((l)=>l.endTime = time);
            activeList.length = 0; // Clear array
        };
        // We iterate through data
        for(let i = 0; i < data.length; i++){
            const candle = data[i];
            const d = new Date(candle.time * 1000);
            // --- BROKER TIME LOGIC (D/W/M) ---
            const brokerParts = brokerFmt.formatToParts(d);
            const bp = {};
            brokerParts.forEach((x)=>bp[x.type] = x.value);
            const dayKey = `${bp.year}-${bp.month}-${bp.day}`;
            const monthKey = `${bp.year}-${bp.month}`;
            // DAY CHANGE
            if (dayKey !== currentDay) {
                // Check if we are transitioning from Sun -> Mon
                const isSunToMon = currentWeekday === 'Sun' && bp.weekday === 'Mon';
                if (!isSunToMon) {
                    // 1. CLOSE Previous Day Levels
                    if (currentDay !== null) {
                        closeLevels(activeDaily, candle.time);
                        // Determine Prev Pivot Stats: DAILY
                        let dH = -Infinity, dL = Infinity;
                        let dHT = NaN, dLT = NaN;
                        const prevEnd = i - 1;
                        for(let j = dayStartIdx; j <= prevEnd; j++){
                            const barHigh = data[j].high;
                            const barLow = data[j].low;
                            const barTime = data[j].time;
                            if (barHigh > dH) {
                                dH = barHigh;
                                dHT = barTime;
                            }
                            if (barLow < dL) {
                                dL = barLow;
                                dLT = barTime;
                            }
                        }
                        prevDayHigh = dH;
                        prevDayLow = dL;
                        prevDayHighTime = dHT;
                        prevDayLowTime = dLT;
                    }
                } // End if !isSunToMon
                currentDay = dayKey;
                currentWeekday = bp.weekday;
                if (!isSunToMon) {
                    dayStartIdx = i;
                    // Separator
                    if (settings.show_d_sep) {
                        separators.push({
                            time: candle.time,
                            color: settings.d_open_color,
                            type: 'D',
                            label: settings.show_weekday_labels ? bp.weekday : undefined
                        });
                    }
                    // Daily Open
                    if (settings.show_d_open) {
                        addLevel(levels, activeDaily, {
                            type: 'D_OPEN',
                            price: candle.open,
                            startTime: candle.time,
                            endTime: Infinity,
                            color: settings.d_open_color,
                            label: settings.d_open_label,
                            style: settings.linestyle
                        });
                    }
                    // Pivots (D)
                    if (settings.show_d_hl && !isNaN(prevDayHigh)) {
                        addLevel(levels, activeDaily, {
                            type: 'PDH',
                            price: prevDayHigh,
                            startTime: prevDayHighTime,
                            endTime: Infinity,
                            color: settings.d_open_color,
                            label: 'PDH',
                            style: settings.linestyle
                        });
                        addLevel(levels, activeDaily, {
                            type: 'PDL',
                            price: prevDayLow,
                            startTime: prevDayLowTime,
                            endTime: Infinity,
                            color: settings.d_open_color,
                            label: 'PDL',
                            style: settings.linestyle
                        });
                    }
                }
                // WEEK CHANGE (Mon)
                const isMonday = bp.weekday === 'Mon';
                let isNewWeek = false;
                if (currentWeek === null) isNewWeek = true;
                else if (isMonday && dayKey !== currentWeek) isNewWeek = true;
                if (isNewWeek) {
                    // WEEK CLOSED
                    if (currentWeek !== null) {
                        closeLevels(activeWeekly, candle.time);
                        let wH = -Infinity, wL = Infinity;
                        let wHT = NaN, wLT = NaN;
                        const prevEnd = i - 1;
                        for(let j = weekStartIdx; j <= prevEnd; j++){
                            const barHigh = data[j].high;
                            const barLow = data[j].low;
                            const barTime = data[j].time;
                            if (barHigh > wH) {
                                wH = barHigh;
                                wHT = barTime;
                            }
                            if (barLow < wL) {
                                wL = barLow;
                                wLT = barTime;
                            }
                        }
                        prevWeekHigh = wH;
                        prevWeekLow = wL;
                        prevWeekHighTime = wHT;
                        prevWeekLowTime = wLT;
                    }
                    currentWeek = dayKey;
                    weekStartIdx = i;
                    if (settings.show_w_sep) separators.push({
                        time: candle.time,
                        color: settings.w_open_color,
                        type: 'W'
                    });
                    if (settings.show_w_open) {
                        addLevel(levels, activeWeekly, {
                            type: 'W_OPEN',
                            price: candle.open,
                            startTime: candle.time,
                            endTime: Infinity,
                            color: settings.w_open_color,
                            label: settings.w_open_label,
                            style: settings.linestyle
                        });
                    }
                    // Add WEEKLY PIVOTS
                    if (settings.show_w_hl && !isNaN(prevWeekHigh)) {
                        addLevel(levels, activeWeekly, {
                            type: 'PWH',
                            price: prevWeekHigh,
                            startTime: prevWeekHighTime,
                            endTime: Infinity,
                            color: settings.w_open_color,
                            label: 'PWH',
                            style: settings.linestyle
                        });
                        addLevel(levels, activeWeekly, {
                            type: 'PWL',
                            price: prevWeekLow,
                            startTime: prevWeekLowTime,
                            endTime: Infinity,
                            color: settings.w_open_color,
                            label: 'PWL',
                            style: settings.linestyle
                        });
                    }
                }
                // MONTH CHANGE
                if (monthKey !== currentMonth) {
                    // MONTH CLOSED
                    if (currentMonth !== null) {
                        closeLevels(activeMonthly, candle.time);
                        let mH = -Infinity, mL = Infinity;
                        let mHT = NaN, mLT = NaN;
                        const prevEnd = i - 1;
                        for(let j = monthStartIdx; j <= prevEnd; j++){
                            const barHigh = data[j].high;
                            const barLow = data[j].low;
                            const barTime = data[j].time;
                            if (barHigh > mH) {
                                mH = barHigh;
                                mHT = barTime;
                            }
                            if (barLow < mL) {
                                mL = barLow;
                                mLT = barTime;
                            }
                        }
                        prevMonthHigh = mH;
                        prevMonthLow = mL;
                        prevMonthHighTime = mHT;
                        prevMonthLowTime = mLT;
                    }
                    currentMonth = monthKey;
                    monthStartIdx = i;
                    if (settings.show_m_sep) separators.push({
                        time: candle.time,
                        color: settings.m_open_color,
                        type: 'M'
                    });
                    if (settings.show_m_open) {
                        addLevel(levels, activeMonthly, {
                            type: 'M_OPEN',
                            price: candle.open,
                            startTime: candle.time,
                            endTime: Infinity,
                            color: settings.m_open_color,
                            label: settings.m_open_label,
                            style: settings.linestyle
                        });
                    }
                    // Add MONTHLY PIVOTS
                    if (settings.show_m_hl && !isNaN(prevMonthHigh)) {
                        addLevel(levels, activeMonthly, {
                            type: 'PMH',
                            price: prevMonthHigh,
                            startTime: prevMonthHighTime,
                            endTime: Infinity,
                            color: settings.m_open_color,
                            label: 'PMH',
                            style: settings.linestyle
                        });
                        addLevel(levels, activeMonthly, {
                            type: 'PML',
                            price: prevMonthLow,
                            startTime: prevMonthLowTime,
                            endTime: Infinity,
                            color: settings.m_open_color,
                            label: 'PML',
                            style: settings.linestyle
                        });
                    }
                }
            }
            // --- TDO LOGIC (New York 00:00) ---
            const tdoParts = tdoFmt.formatToParts(d);
            const tp = {};
            tdoParts.forEach((x)=>tp[x.type] = x.value);
            const tdoTimeStr = `${tp.hour}:${tp.minute}`;
            const tdoDayKey = `${tp.year}-${tp.month}-${tp.day}`;
            const openers = [
                {
                    en: settings.show_tdo,
                    t: '00:00',
                    l: 'True Day Open',
                    c: settings.tdo_color
                }
            ];
            openers.forEach((opt, idx)=>{
                if (!opt.en) return;
                // Exclude Sunday (NY Time) - Market Open (17:00) should not trigger TDO (00:00)
                // This prevents "Ghost TDO" at chart start
                if (tp.weekday === 'Sun') return;
                // Latch Check
                const lastDay = openerState.get(idx);
                if (lastDay === tdoDayKey) return;
                // Time Check (First candle >= target)
                if (tdoTimeStr >= opt.t) {
                    addLevel(levels, activeDaily, {
                        type: 'CUSTOM_OPEN',
                        price: candle.open,
                        startTime: candle.time,
                        endTime: Infinity,
                        color: opt.c,
                        label: opt.l,
                        style: 'Dotted'
                    });
                    openerState.set(idx, tdoDayKey);
                }
            });
        }
        this._data.levels = levels;
        this._data.separators = separators;
    }
    // --- Drawing ---
    drawBody(ctx) {
        const { levels, separators, settings, lastCandleTime } = this._data;
        if (!this._chart || !this._series) return;
        const timeScale = this._chart.timeScale();
        const visibleRange = timeScale.getVisibleRange();
        if (!visibleRange) return;
        const rightEdgeTime = lastCandleTime || Date.now() / 1000;
        ctx.save();
        // Draw Separators
        separators.forEach((sep)=>{
            const x = timeScale.timeToCoordinate(sep.time);
            if (x === null) return;
            ctx.beginPath();
            ctx.strokeStyle = sep.color;
            ctx.lineWidth = 1;
            ctx.setLineDash([
                2,
                4
            ]);
            ctx.moveTo(x, 0);
            ctx.lineTo(x, ctx.canvas.height);
            ctx.stroke();
            // Draw Weekday Label
            if (sep.label) {
                ctx.fillStyle = sep.color; // or generic gray?
                ctx.font = '10px Roboto';
                ctx.textAlign = 'center';
                ctx.globalAlpha = 0.6;
                ctx.fillText(sep.label, x, ctx.canvas.height - 10);
                ctx.globalAlpha = 1.0;
                ctx.textAlign = 'left';
            }
        });
        // Draw Levels
        levels.forEach((lvl)=>{
            const x1 = timeScale.timeToCoordinate(lvl.startTime);
            const end = lvl.endTime === Infinity ? rightEdgeTime : lvl.endTime;
            const x2 = timeScale.timeToCoordinate(end);
            const y = this._series.priceToCoordinate(lvl.price);
            if (y === null) return;
            let drawX1 = x1;
            let drawX2 = x2;
            if (drawX1 === null) {
                if (lvl.startTime < visibleRange.from) drawX1 = -10;
                else return;
            }
            if (drawX2 === null) {
                if (end >= visibleRange.to) drawX2 = this._chart.timeScale().width();
                else return;
            }
            ctx.beginPath();
            ctx.strokeStyle = lvl.color;
            ctx.lineWidth = settings.linewidth;
            if (lvl.style === 'Dashed') ctx.setLineDash([
                5,
                5
            ]);
            else if (lvl.style === 'Dotted') ctx.setLineDash([
                2,
                2
            ]);
            else ctx.setLineDash([]);
            ctx.moveTo(drawX1, y);
            ctx.lineTo(drawX2, y);
            ctx.stroke();
            if (settings.show_labels && lvl.label) {
                ctx.fillStyle = lvl.color;
                ctx.font = '10px Roboto';
                ctx.textAlign = 'right';
                // Always draw label at the end of the line (Right Side)
                ctx.fillText(lvl.label, drawX2, y - 6);
                ctx.textAlign = 'left'; // reset
            }
        });
        ctx.restore();
    }
    // --- Hit Test ---
    hitTestBody(point) {
        return false;
    }
    applyDrag(target, newPoint) {}
    updateGeometry(timeScale, series) {}
}
const LevelsSchema = [
    {
        group: 'Settings',
        id: 'broker_timezone',
        type: 'text',
        title: 'Broker Timezone',
        def: 'Europe/Berlin'
    },
    {
        group: 'Daily',
        id: 'show_d_open',
        type: 'bool',
        title: 'Show Daily Open',
        def: true
    },
    {
        group: 'Daily',
        id: 'd_open_color',
        type: 'color',
        title: 'Daily Color',
        def: '#3b82f6'
    },
    {
        group: 'Daily',
        id: 'd_open_label',
        type: 'text',
        title: 'Label',
        def: 'D Open'
    },
    {
        group: 'Daily',
        id: 'show_d_hl',
        type: 'bool',
        title: 'Show Prev D High/Low',
        def: true
    },
    {
        group: 'Daily',
        id: 'show_d_sep',
        type: 'bool',
        title: 'Show Separators',
        def: true
    },
    {
        group: 'Daily',
        id: 'show_weekday_labels',
        type: 'bool',
        title: 'Show Weekdays',
        def: true
    },
    {
        group: 'Weekly',
        id: 'show_w_open',
        type: 'bool',
        title: 'Show Weekly Open',
        def: false
    },
    {
        group: 'Weekly',
        id: 'w_open_color',
        type: 'color',
        title: 'Weekly Color',
        def: '#10b981'
    },
    {
        group: 'Weekly',
        id: 'w_open_label',
        type: 'text',
        title: 'Label',
        def: 'W Open'
    },
    {
        group: 'Weekly',
        id: 'show_w_hl',
        type: 'bool',
        title: 'Show Prev W High/Low',
        def: false
    },
    {
        group: 'Weekly',
        id: 'show_w_sep',
        type: 'bool',
        title: 'Show Separators',
        def: false
    },
    {
        group: 'Monthly',
        id: 'show_m_open',
        type: 'bool',
        title: 'Show Monthly Open',
        def: false
    },
    {
        group: 'Monthly',
        id: 'm_open_color',
        type: 'color',
        title: 'Monthly Color',
        def: '#ef4444'
    },
    {
        group: 'Monthly',
        id: 'm_open_label',
        type: 'text',
        title: 'Label',
        def: 'M Open'
    },
    {
        group: 'Monthly',
        id: 'show_m_hl',
        type: 'bool',
        title: 'Show Prev M High/Low',
        def: false
    },
    {
        group: 'Monthly',
        id: 'show_m_sep',
        type: 'bool',
        title: 'Show Separators',
        def: false
    },
    // Custom
    {
        group: 'True Day Open',
        id: 'show_tdo',
        type: 'bool',
        title: 'Show True Day Open',
        def: true
    },
    {
        group: 'True Day Open',
        id: 'tdo_color',
        type: 'color',
        title: 'Color',
        def: '#808080'
    },
    {
        group: 'Visuals',
        id: 'linewidth',
        type: 'number',
        title: 'Line Width',
        def: 1
    },
    {
        group: 'Visuals',
        id: 'linestyle',
        type: 'select',
        title: 'Style',
        def: 'Dashed',
        options: [
            'Solid',
            'Dashed',
            'Dotted'
        ]
    },
    {
        group: 'Visuals',
        id: 'show_labels',
        type: 'bool',
        title: 'Show Labels',
        def: true
    }
];
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/components/charts/indicators/index.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "registerIndicators",
    ()=>registerIndicators
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$charts$2f$indicators$2f$IndicatorRegistry$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/charts/indicators/IndicatorRegistry.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$charts$2f$plugins$2f$ICTSessionsPlugin$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/charts/plugins/ICTSessionsPlugin.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$charts$2f$plugins$2f$ImbalancePlugin$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/charts/plugins/ImbalancePlugin.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$charts$2f$plugins$2f$LevelsPlugin$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/charts/plugins/LevelsPlugin.ts [app-client] (ecmascript)");
;
;
;
;
const registerIndicators = ()=>{
    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$charts$2f$indicators$2f$IndicatorRegistry$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["indicatorRegistry"].register({
        id: 'ict_sessions',
        name: 'Sessions & Pivots',
        description: 'Visualizes Asia, London, and NY sessions with dynamic pivot mitigation.',
        defaultSettings: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$charts$2f$plugins$2f$ICTSessionsPlugin$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ICTSessionsSchema"].reduce((acc, item)=>{
            acc[item.id] = item.def;
            return acc;
        }, {}),
        pluginFactory: (settings)=>new __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$charts$2f$plugins$2f$ICTSessionsPlugin$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ICTSessionsPlugin"](settings),
        settingsSchema: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$charts$2f$plugins$2f$ICTSessionsPlugin$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ICTSessionsSchema"],
        dataFetcher: async ({ symbol, timeframe, from, to, settings })=>{
            // Transform Flat Settings to Engine Config
            const engineSettings = {
                mitigation_enabled: settings.mitigation_enabled,
                sessions: [
                    {
                        type: 'ASIA',
                        enabled: settings.show_asia,
                        range: settings.asia_range,
                        color: settings.asia_color
                    },
                    {
                        type: 'LONDON',
                        enabled: settings.show_london,
                        range: settings.london_range,
                        color: settings.london_color
                    },
                    {
                        type: 'NYAM',
                        enabled: settings.show_nyam,
                        range: settings.nyam_range,
                        color: settings.nyam_color
                    },
                    {
                        type: 'NYPM',
                        enabled: settings.show_nypm,
                        range: settings.nypm_range,
                        color: settings.nypm_color
                    }
                ]
            };
            const params = new URLSearchParams({
                symbol,
                timeframe,
                from: from.toString(),
                to: to.toString(),
                settings: JSON.stringify(engineSettings)
            });
            const res = await fetch(`http://localhost:3005/indicators/ict-sessions?${params.toString()}`);
            const data = await res.json();
            return data.sessions || [];
        }
    });
    // Register Imbalance Indicator (Client-Side)
    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$charts$2f$indicators$2f$IndicatorRegistry$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["indicatorRegistry"].register({
        id: 'imbalance',
        name: 'Imbalances',
        description: 'Highlights bullish and bearish Fair Value Gaps (Imbalance) by coloring the middle candle body.',
        defaultSettings: {
            bullishColor: '#00BFFF',
            bearishColor: '#FF8C00',
            showBullish: true,
            showBearish: true
        },
        pluginFactory: (settings)=>new __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$charts$2f$plugins$2f$ImbalancePlugin$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ImbalancePlugin"](settings),
        settingsSchema: [
            {
                group: 'Bullish Imbalance',
                id: 'showBullish',
                type: 'bool',
                title: 'Show Bullish',
                def: true
            },
            {
                group: 'Bullish Imbalance',
                id: 'bullishColor',
                type: 'color',
                title: 'Color',
                def: '#00BFFF'
            },
            {
                group: 'Bearish Imbalance',
                id: 'showBearish',
                type: 'bool',
                title: 'Show Bearish',
                def: true
            },
            {
                group: 'Bearish Imbalance',
                id: 'bearishColor',
                type: 'color',
                title: 'Color',
                def: '#FF8C00'
            }
        ],
        dataTransformer: (data, settings)=>new __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$charts$2f$plugins$2f$ImbalancePlugin$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ImbalancePlugin"](settings).constructor['prototype'] ? __turbopack_context__.r("[project]/src/components/charts/plugins/ImbalancePlugin.ts [app-client] (ecmascript)").applyImbalanceTransformation(data, settings) : data
    });
    // Register Levels Indicator (Ported logic)
    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$charts$2f$indicators$2f$IndicatorRegistry$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["indicatorRegistry"].register({
        id: 'levels',
        name: 'Levels',
        description: 'Displays Daily, Weekly, Monthly logic and Custom Opening Prices.',
        defaultSettings: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$charts$2f$plugins$2f$LevelsPlugin$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["LevelsSchema"].reduce((acc, item)=>{
            acc[item.id] = item.def;
            return acc;
        }, {}),
        pluginFactory: (settings)=>new __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$charts$2f$plugins$2f$LevelsPlugin$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["LevelsPlugin"](settings),
        settingsSchema: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$charts$2f$plugins$2f$LevelsPlugin$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["LevelsSchema"]
    });
    console.log("[IndicatorRegistry] Registered default indicators.");
};
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/components/charts/settings/IndicatorSettingsDialog.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "IndicatorSettingsDialog",
    ()=>IndicatorSettingsDialog
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2d$dom$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react-dom/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$ColorPalettePicker$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/ui/ColorPalettePicker.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$ui$2f$usePopoverPosition$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/hooks/ui/usePopoverPosition.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature(), _s1 = __turbopack_context__.k.signature(), _s2 = __turbopack_context__.k.signature(), _s3 = __turbopack_context__.k.signature();
;
;
;
;
const IndicatorSettingsDialog = ({ isOpen, onClose, onSave, definition, currentSettings })=>{
    _s();
    const [settings, setSettings] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(currentSettings);
    // Track previous open state to only reset on OPEN event, not on prop updates while open
    const prevOpenRef = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].useRef(isOpen);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "IndicatorSettingsDialog.useEffect": ()=>{
            // Did we just open?
            if (isOpen && !prevOpenRef.current) {
                setSettings({
                    ...definition.settingsSchema.reduce({
                        "IndicatorSettingsDialog.useEffect": (acc, item)=>{
                            acc[item.id] = item.def;
                            return acc;
                        }
                    }["IndicatorSettingsDialog.useEffect"], {}),
                    ...currentSettings
                });
            }
            prevOpenRef.current = isOpen;
        }
    }["IndicatorSettingsDialog.useEffect"], [
        isOpen,
        currentSettings,
        definition
    ]);
    const handleChange = (id, value)=>{
        setSettings((prev)=>({
                ...prev,
                [id]: value
            }));
    };
    if (!isOpen) return null;
    // Group items
    const groups = {};
    const ungrouped = [];
    definition.settingsSchema.forEach((item)=>{
        if (item.group) {
            if (!groups[item.group]) groups[item.group] = [];
            groups[item.group].push(item);
        } else {
            ungrouped.push(item);
        }
    });
    const renderInput = (item)=>{
        const val = settings[item.id];
        switch(item.type){
            case 'bool':
                return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                    type: "checkbox",
                    checked: !!val,
                    onChange: (e)=>handleChange(item.id, e.target.checked),
                    className: "w-4 h-4 rounded border-slate-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-blue-500 focus:ring-blue-500 focus:ring-offset-white dark:focus:ring-offset-gray-900"
                }, void 0, false, {
                    fileName: "[project]/src/components/charts/settings/IndicatorSettingsDialog.tsx",
                    lineNumber: 73,
                    columnNumber: 21
                }, ("TURBOPACK compile-time value", void 0));
            case 'color':
                return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(ColorInput, {
                    value: val,
                    onChange: (v)=>handleChange(item.id, v)
                }, void 0, false, {
                    fileName: "[project]/src/components/charts/settings/IndicatorSettingsDialog.tsx",
                    lineNumber: 82,
                    columnNumber: 21
                }, ("TURBOPACK compile-time value", void 0));
            case 'select':
                return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                    value: val || '',
                    onChange: (e)=>handleChange(item.id, e.target.value),
                    className: "bg-white dark:bg-gray-700 border border-slate-300 dark:border-gray-600 rounded px-2 py-1 text-sm text-slate-900 dark:text-gray-200 focus:outline-none focus:border-blue-500",
                    children: item.options?.map((opt)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                            value: opt,
                            children: opt
                        }, opt, false, {
                            fileName: "[project]/src/components/charts/settings/IndicatorSettingsDialog.tsx",
                            lineNumber: 95,
                            columnNumber: 29
                        }, ("TURBOPACK compile-time value", void 0)))
                }, void 0, false, {
                    fileName: "[project]/src/components/charts/settings/IndicatorSettingsDialog.tsx",
                    lineNumber: 89,
                    columnNumber: 21
                }, ("TURBOPACK compile-time value", void 0));
            case 'time_range':
                return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(TimeRangePicker, {
                    value: val || '0930-1600',
                    onChange: (newVal)=>handleChange(item.id, newVal)
                }, void 0, false, {
                    fileName: "[project]/src/components/charts/settings/IndicatorSettingsDialog.tsx",
                    lineNumber: 101,
                    columnNumber: 21
                }, ("TURBOPACK compile-time value", void 0));
            default:
                return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                    type: item.type === 'number' ? 'number' : 'text',
                    value: val || '',
                    onChange: (e)=>handleChange(item.id, item.type === 'number' ? parseFloat(e.target.value) : e.target.value),
                    className: "bg-white dark:bg-gray-700 border border-slate-300 dark:border-gray-600 rounded px-2 py-1 text-sm text-slate-900 dark:text-gray-200 focus:outline-none focus:border-blue-500 w-full"
                }, void 0, false, {
                    fileName: "[project]/src/components/charts/settings/IndicatorSettingsDialog.tsx",
                    lineNumber: 108,
                    columnNumber: 21
                }, ("TURBOPACK compile-time value", void 0));
        }
    };
    const renderItem = (item)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "flex items-center justify-between py-2 border-b border-slate-200 dark:border-gray-800 last:border-0 hover:bg-slate-50 dark:hover:bg-gray-800/50 px-2 rounded-sm transition-colors",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex flex-col",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            className: "text-sm text-slate-700 dark:text-gray-300",
                            children: item.title
                        }, void 0, false, {
                            fileName: "[project]/src/components/charts/settings/IndicatorSettingsDialog.tsx",
                            lineNumber: 121,
                            columnNumber: 17
                        }, ("TURBOPACK compile-time value", void 0)),
                        item.tooltip && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            className: "text-[10px] text-slate-400 dark:text-gray-500",
                            children: item.tooltip
                        }, void 0, false, {
                            fileName: "[project]/src/components/charts/settings/IndicatorSettingsDialog.tsx",
                            lineNumber: 122,
                            columnNumber: 34
                        }, ("TURBOPACK compile-time value", void 0))
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/components/charts/settings/IndicatorSettingsDialog.tsx",
                    lineNumber: 120,
                    columnNumber: 13
                }, ("TURBOPACK compile-time value", void 0)),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "ml-4 w-1/2 flex justify-end",
                    children: renderInput(item)
                }, void 0, false, {
                    fileName: "[project]/src/components/charts/settings/IndicatorSettingsDialog.tsx",
                    lineNumber: 124,
                    columnNumber: 13
                }, ("TURBOPACK compile-time value", void 0))
            ]
        }, item.id, true, {
            fileName: "[project]/src/components/charts/settings/IndicatorSettingsDialog.tsx",
            lineNumber: 119,
            columnNumber: 9
        }, ("TURBOPACK compile-time value", void 0));
    const content = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/50 dark:bg-black/50 backdrop-blur-sm",
        onClick: onClose,
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "bg-white dark:bg-[#1e222d] border border-slate-300 dark:border-gray-700 rounded-lg shadow-xl w-[400px] max-h-[85vh] flex flex-col",
            onClick: (e)=>e.stopPropagation(),
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "px-4 py-3 border-b border-slate-200 dark:border-gray-700 flex justify-between items-center bg-slate-50 dark:bg-[#2a2e39] rounded-t-lg",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                            className: "text-sm font-semibold text-slate-900 dark:text-gray-200",
                            children: [
                                definition.name,
                                " Settings"
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/components/charts/settings/IndicatorSettingsDialog.tsx",
                            lineNumber: 135,
                            columnNumber: 21
                        }, ("TURBOPACK compile-time value", void 0)),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            onClick: onClose,
                            className: "text-slate-400 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white transition-colors",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                width: "20",
                                height: "20",
                                viewBox: "0 0 24 24",
                                fill: "none",
                                stroke: "currentColor",
                                strokeWidth: "2",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                    d: "M18 6L6 18M6 6l12 12"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/charts/settings/IndicatorSettingsDialog.tsx",
                                    lineNumber: 137,
                                    columnNumber: 123
                                }, ("TURBOPACK compile-time value", void 0))
                            }, void 0, false, {
                                fileName: "[project]/src/components/charts/settings/IndicatorSettingsDialog.tsx",
                                lineNumber: 137,
                                columnNumber: 25
                            }, ("TURBOPACK compile-time value", void 0))
                        }, void 0, false, {
                            fileName: "[project]/src/components/charts/settings/IndicatorSettingsDialog.tsx",
                            lineNumber: 136,
                            columnNumber: 21
                        }, ("TURBOPACK compile-time value", void 0))
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/components/charts/settings/IndicatorSettingsDialog.tsx",
                    lineNumber: 134,
                    columnNumber: 17
                }, ("TURBOPACK compile-time value", void 0)),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex-1 overflow-y-auto p-4 custom-scrollbar",
                    children: [
                        Object.keys(groups).map((groupName)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "mb-6",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h4", {
                                        className: "text-xs font-bold text-blue-500 dark:text-blue-400 uppercase tracking-wider mb-2 pb-1 border-b border-slate-200 dark:border-gray-700/50",
                                        children: groupName
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/charts/settings/IndicatorSettingsDialog.tsx",
                                        lineNumber: 146,
                                        columnNumber: 29
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "space-y-0.5",
                                        children: groups[groupName].map(renderItem)
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/charts/settings/IndicatorSettingsDialog.tsx",
                                        lineNumber: 147,
                                        columnNumber: 29
                                    }, ("TURBOPACK compile-time value", void 0))
                                ]
                            }, groupName, true, {
                                fileName: "[project]/src/components/charts/settings/IndicatorSettingsDialog.tsx",
                                lineNumber: 145,
                                columnNumber: 25
                            }, ("TURBOPACK compile-time value", void 0))),
                        ungrouped.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "mb-4 space-y-0.5",
                            children: ungrouped.map(renderItem)
                        }, void 0, false, {
                            fileName: "[project]/src/components/charts/settings/IndicatorSettingsDialog.tsx",
                            lineNumber: 155,
                            columnNumber: 25
                        }, ("TURBOPACK compile-time value", void 0))
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/components/charts/settings/IndicatorSettingsDialog.tsx",
                    lineNumber: 142,
                    columnNumber: 17
                }, ("TURBOPACK compile-time value", void 0)),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "p-4 border-t border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-[#2a2e39] rounded-b-lg flex justify-end gap-2",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            onClick: onClose,
                            className: "px-3 py-1.5 text-sm text-slate-600 dark:text-gray-300 hover:bg-slate-200 dark:hover:bg-gray-700 rounded transition-colors",
                            children: "Cancel"
                        }, void 0, false, {
                            fileName: "[project]/src/components/charts/settings/IndicatorSettingsDialog.tsx",
                            lineNumber: 163,
                            columnNumber: 21
                        }, ("TURBOPACK compile-time value", void 0)),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            onClick: ()=>onSave(settings),
                            className: "px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-500 transition-colors font-medium shadow-sm",
                            children: "Save Changes"
                        }, void 0, false, {
                            fileName: "[project]/src/components/charts/settings/IndicatorSettingsDialog.tsx",
                            lineNumber: 164,
                            columnNumber: 21
                        }, ("TURBOPACK compile-time value", void 0))
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/components/charts/settings/IndicatorSettingsDialog.tsx",
                    lineNumber: 162,
                    columnNumber: 17
                }, ("TURBOPACK compile-time value", void 0))
            ]
        }, void 0, true, {
            fileName: "[project]/src/components/charts/settings/IndicatorSettingsDialog.tsx",
            lineNumber: 132,
            columnNumber: 13
        }, ("TURBOPACK compile-time value", void 0))
    }, void 0, false, {
        fileName: "[project]/src/components/charts/settings/IndicatorSettingsDialog.tsx",
        lineNumber: 131,
        columnNumber: 9
    }, ("TURBOPACK compile-time value", void 0));
    // Render via Portal to body to escape Z-Index stacking contexts of ChartPane/Splitter
    // Ensure document is defined (client-side only check is handled by next.js normally, but safe guard)
    if (typeof document === 'undefined') return null;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2d$dom$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createPortal"])(content, document.body);
};
_s(IndicatorSettingsDialog, "cdQhURQjnjZy0GXfEAH2FmzxW98=");
_c = IndicatorSettingsDialog;
// --- Time Picker Components (Moved Outside and Improved) ---
const TimeRangePicker = ({ value, onChange })=>{
    _s1();
    // Parse "HHmm-HHmm" -> ["HH:mm", "HH:mm"]
    const parse = (v)=>{
        if (!v || !v.includes('-')) return {
            start: '09:30',
            end: '16:00'
        };
        const [s, e] = v.split('-');
        const fmt = (t)=>t.length === 4 ? `${t.substring(0, 2)}:${t.substring(2, 4)}` : t;
        return {
            start: fmt(s),
            end: fmt(e)
        };
    };
    const [times, setTimes] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(parse(value));
    // Sync with external value changes ONLY if meaningful difference
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "TimeRangePicker.useEffect": ()=>{
            const current = parse(value);
            setTimes({
                "TimeRangePicker.useEffect": (prev)=>{
                    if (prev.start !== current.start || prev.end !== current.end) {
                        return current;
                    }
                    return prev;
                }
            }["TimeRangePicker.useEffect"]);
        }
    }["TimeRangePicker.useEffect"], [
        value
    ]);
    const update = (type, newVal)=>{
        const newTimes = {
            ...times,
            [type]: newVal
        };
        setTimes(newTimes);
        // Convert "HH:mm" -> "HHmm"
        const clean = (t)=>t.replace(':', '').padStart(4, '0');
        onChange(`${clean(newTimes.start)}-${clean(newTimes.end)}`);
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "flex items-center gap-2",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(TimeInput, {
                value: times.start,
                onChange: (v)=>update('start', v)
            }, void 0, false, {
                fileName: "[project]/src/components/charts/settings/IndicatorSettingsDialog.tsx",
                lineNumber: 213,
                columnNumber: 13
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                className: "text-slate-500 dark:text-gray-500",
                children: "-"
            }, void 0, false, {
                fileName: "[project]/src/components/charts/settings/IndicatorSettingsDialog.tsx",
                lineNumber: 214,
                columnNumber: 13
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(TimeInput, {
                value: times.end,
                onChange: (v)=>update('end', v)
            }, void 0, false, {
                fileName: "[project]/src/components/charts/settings/IndicatorSettingsDialog.tsx",
                lineNumber: 215,
                columnNumber: 13
            }, ("TURBOPACK compile-time value", void 0))
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/charts/settings/IndicatorSettingsDialog.tsx",
        lineNumber: 212,
        columnNumber: 9
    }, ("TURBOPACK compile-time value", void 0));
};
_s1(TimeRangePicker, "h7gMdXCIDu+BuidcdD5h6OaYwDY=");
_c1 = TimeRangePicker;
const TimeInput = ({ value, onChange })=>{
    _s2();
    const [showDropdown, setShowDropdown] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const containerRef = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].useRef(null);
    // Split value into HH and MM for local consumption
    // Maintain local state to allow 'incomplete' typing before commit
    const parse = (v)=>{
        const p = (v || '00:00').split(':');
        return {
            hh: p[0] || '00',
            mm: p[1] || '00'
        };
    };
    const [local, setLocal] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(parse(value));
    // Sync local state when external value changes
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "TimeInput.useEffect": ()=>{
            setLocal(parse(value));
        }
    }["TimeInput.useEffect"], [
        value
    ]);
    const commit = ()=>{
        let hn = parseInt(local.hh) || 0;
        let mn = parseInt(local.mm) || 0;
        hn = Math.min(23, Math.max(0, hn));
        mn = Math.min(59, Math.max(0, mn));
        const fmt = (n)=>n.toString().padStart(2, '0');
        const formatted = `${fmt(hn)}:${fmt(mn)}`;
        onChange(formatted);
        // Force local update to formatted version
        setLocal({
            hh: fmt(hn),
            mm: fmt(mn)
        });
    };
    const handleBlur = ()=>{
        commit();
    };
    const handleInput = (type, val)=>{
        const num = val.replace(/[^0-9]/g, '');
        if (num.length > 2) return;
        setLocal((prev)=>({
                ...prev,
                [type]: num
            }));
    };
    const handleKeyDown = (e)=>{
        if (e.key === 'Enter') {
            setShowDropdown(false);
            commit();
            e.target.blur();
        }
    };
    // Close on click outside
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "TimeInput.useEffect": ()=>{
            const handleClick = {
                "TimeInput.useEffect.handleClick": (e)=>{
                    if (containerRef.current && !containerRef.current.contains(e.target)) {
                        setShowDropdown(false);
                    }
                }
            }["TimeInput.useEffect.handleClick"];
            document.addEventListener('mousedown', handleClick);
            return ({
                "TimeInput.useEffect": ()=>document.removeEventListener('mousedown', handleClick)
            })["TimeInput.useEffect"];
        }
    }["TimeInput.useEffect"], []);
    // Generate 15m intervals
    const times = [];
    for(let h = 0; h < 24; h++){
        for(let m = 0; m < 60; m += 15){
            times.push(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
        }
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "relative w-20 bg-white dark:bg-gray-700 border border-slate-300 dark:border-gray-600 rounded flex items-center px-1",
        ref: containerRef,
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                type: "text",
                value: local.hh,
                onChange: (e)=>handleInput('hh', e.target.value),
                onBlur: handleBlur,
                onFocus: ()=>setShowDropdown(true),
                onKeyDown: handleKeyDown,
                maxLength: 2,
                className: "w-7 bg-transparent text-center text-sm text-slate-900 dark:text-gray-200 focus:outline-none placeholder-slate-400 dark:placeholder-gray-500"
            }, void 0, false, {
                fileName: "[project]/src/components/charts/settings/IndicatorSettingsDialog.tsx",
                lineNumber: 291,
                columnNumber: 13
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                className: "text-slate-400 dark:text-gray-400 select-none",
                children: ":"
            }, void 0, false, {
                fileName: "[project]/src/components/charts/settings/IndicatorSettingsDialog.tsx",
                lineNumber: 301,
                columnNumber: 13
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                type: "text",
                value: local.mm,
                onChange: (e)=>handleInput('mm', e.target.value),
                onBlur: handleBlur,
                onFocus: ()=>setShowDropdown(true),
                onKeyDown: handleKeyDown,
                maxLength: 2,
                className: "w-7 bg-transparent text-center text-sm text-slate-900 dark:text-gray-200 focus:outline-none"
            }, void 0, false, {
                fileName: "[project]/src/components/charts/settings/IndicatorSettingsDialog.tsx",
                lineNumber: 302,
                columnNumber: 13
            }, ("TURBOPACK compile-time value", void 0)),
            showDropdown && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "absolute top-full left-0 mt-1 w-24 -ml-2 max-h-48 overflow-y-auto bg-white dark:bg-[#1e222d] border border-slate-300 dark:border-gray-600 rounded shadow-xl z-[99999] custom-scrollbar",
                children: times.map((t)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: `px-2 py-1 text-xs cursor-pointer hover:bg-blue-600 hover:text-white ${t === value ? 'bg-blue-600/20 text-blue-600 dark:text-blue-400' : 'text-slate-700 dark:text-gray-300'}`,
                        onMouseDown: (e)=>{
                            e.preventDefault();
                            onChange(t);
                            setShowDropdown(false);
                        },
                        children: t
                    }, t, false, {
                        fileName: "[project]/src/components/charts/settings/IndicatorSettingsDialog.tsx",
                        lineNumber: 316,
                        columnNumber: 25
                    }, ("TURBOPACK compile-time value", void 0)))
            }, void 0, false, {
                fileName: "[project]/src/components/charts/settings/IndicatorSettingsDialog.tsx",
                lineNumber: 314,
                columnNumber: 17
            }, ("TURBOPACK compile-time value", void 0))
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/charts/settings/IndicatorSettingsDialog.tsx",
        lineNumber: 290,
        columnNumber: 9
    }, ("TURBOPACK compile-time value", void 0));
};
_s2(TimeInput, "AJRlzGbYjyvfO4XpmKooXeF5How=");
_c2 = TimeInput;
const ColorInput = ({ value, onChange })=>{
    _s3();
    const [open, setOpen] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const buttonRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const { top, left, contentRef } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$ui$2f$usePopoverPosition$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["usePopoverPosition"])({
        triggerRef: buttonRef,
        isOpen: open,
        gap: 5,
        contentHeight: 380 // Estimate for initial render
    });
    // Helpers for Hex8 <-> Hex + Opacity
    const parseColor = (val)=>{
        const clean = (val || '#000000').replace('#', '');
        if (clean.length === 8) {
            return {
                hex: '#' + clean.substring(0, 6),
                opacity: Math.round(parseInt(clean.substring(6), 16) / 255 * 100)
            };
        }
        return {
            hex: '#' + clean,
            opacity: 100
        }; // Default 100%
    };
    const toHex8 = (hex, opacity)=>{
        const alpha = Math.round(opacity / 100 * 255);
        const alphaHex = alpha.toString(16).padStart(2, '0');
        return (hex.substring(0, 7) + alphaHex).toUpperCase();
    };
    const { hex, opacity } = parseColor(value);
    // Handler when Picker changes only Color
    const handleColorChange = (newHex)=>{
        onChange(toHex8(newHex, opacity));
    };
    // Handler when Picker changes only Opacity
    const handleOpacityChange = (newOpacity)=>{
        onChange(toHex8(hex, newOpacity));
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex items-center gap-2",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        ref: buttonRef,
                        onClick: ()=>setOpen(!open),
                        className: "w-8 h-8 rounded-md border border-slate-300 dark:border-gray-600 cursor-pointer hover:border-blue-500 transition-colors shadow-sm relative overflow-hidden",
                        title: "Change Color",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "absolute inset-0 z-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPjxwYXRoIGZpbGw9IiM4MDgwODAiIGQ9Ik0wIDBoNHY0SDB6bTQgNGg0djRINFoiIGZpbGwtb3BhY2l0eT0iMC4yIi8+PC9zdmc+')]"
                            }, void 0, false, {
                                fileName: "[project]/src/components/charts/settings/IndicatorSettingsDialog.tsx",
                                lineNumber: 384,
                                columnNumber: 21
                            }, ("TURBOPACK compile-time value", void 0)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "absolute inset-0 z-10",
                                style: {
                                    backgroundColor: value || '#000000'
                                }
                            }, void 0, false, {
                                fileName: "[project]/src/components/charts/settings/IndicatorSettingsDialog.tsx",
                                lineNumber: 385,
                                columnNumber: 21
                            }, ("TURBOPACK compile-time value", void 0))
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/charts/settings/IndicatorSettingsDialog.tsx",
                        lineNumber: 377,
                        columnNumber: 17
                    }, ("TURBOPACK compile-time value", void 0)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "text-xs font-mono text-slate-500 dark:text-gray-500",
                        children: value
                    }, void 0, false, {
                        fileName: "[project]/src/components/charts/settings/IndicatorSettingsDialog.tsx",
                        lineNumber: 388,
                        columnNumber: 17
                    }, ("TURBOPACK compile-time value", void 0))
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/charts/settings/IndicatorSettingsDialog.tsx",
                lineNumber: 376,
                columnNumber: 13
            }, ("TURBOPACK compile-time value", void 0)),
            open && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2d$dom$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createPortal"])(/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "fixed inset-0 z-[100000]",
                onClick: ()=>setOpen(false),
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    ref: contentRef,
                    className: "absolute",
                    style: {
                        top,
                        left
                    },
                    onClick: (e)=>e.stopPropagation(),
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$ColorPalettePicker$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ColorPalettePicker"], {
                        color: hex,
                        opacity: opacity,
                        onChange: handleColorChange,
                        onOpacityChange: handleOpacityChange
                    }, void 0, false, {
                        fileName: "[project]/src/components/charts/settings/IndicatorSettingsDialog.tsx",
                        lineNumber: 399,
                        columnNumber: 25
                    }, ("TURBOPACK compile-time value", void 0))
                }, void 0, false, {
                    fileName: "[project]/src/components/charts/settings/IndicatorSettingsDialog.tsx",
                    lineNumber: 393,
                    columnNumber: 21
                }, ("TURBOPACK compile-time value", void 0))
            }, void 0, false, {
                fileName: "[project]/src/components/charts/settings/IndicatorSettingsDialog.tsx",
                lineNumber: 392,
                columnNumber: 17
            }, ("TURBOPACK compile-time value", void 0)), document.body)
        ]
    }, void 0, true);
};
_s3(ColorInput, "lrPIgobgUsoecMXials+HMl30KY=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$ui$2f$usePopoverPosition$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["usePopoverPosition"]
    ];
});
_c3 = ColorInput;
var _c, _c1, _c2, _c3;
__turbopack_context__.k.register(_c, "IndicatorSettingsDialog");
__turbopack_context__.k.register(_c1, "TimeRangePicker");
__turbopack_context__.k.register(_c2, "TimeInput");
__turbopack_context__.k.register(_c3, "ColorInput");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/components/charts/MagnetControl.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "MagnetControl",
    ()=>MagnetControl
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$charts$2f$widgets$2f$MagnetService$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/charts/widgets/MagnetService.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$right$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronRight$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/chevron-right.js [app-client] (ecmascript) <export default as ChevronRight>");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
;
/**
 * Magnet icon SVG component.
 */ /**
 * Magnet icon SVG component.
 * "Frame" style: Outlined U-shape with pole separators.
 */ /**
 * Magnet icon SVG component.
 * "Frame" style: Outlined U-shape with pole separators.
 * Wider design: Outer 4-20, Inner 9-15.
 */ const MagnetIcon = ({ active })=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
        width: "28",
        height: "28",
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        strokeWidth: "1.5",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                d: "M4 21V10a8 8 0 0 1 16 0v11h-5V10a3 3 0 0 0-6 0v11H4z"
            }, void 0, false, {
                fileName: "[project]/src/components/charts/MagnetControl.tsx",
                lineNumber: 22,
                columnNumber: 9
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                d: "M4 16h5"
            }, void 0, false, {
                fileName: "[project]/src/components/charts/MagnetControl.tsx",
                lineNumber: 24,
                columnNumber: 9
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                d: "M15 16h5"
            }, void 0, false, {
                fileName: "[project]/src/components/charts/MagnetControl.tsx",
                lineNumber: 25,
                columnNumber: 9
            }, ("TURBOPACK compile-time value", void 0))
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/charts/MagnetControl.tsx",
        lineNumber: 20,
        columnNumber: 5
    }, ("TURBOPACK compile-time value", void 0));
_c = MagnetIcon;
/**
 * Strong Magnet icon with 'sparks'
 */ const StrongMagnetIcon = ({ active })=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
        width: "28",
        height: "28",
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        strokeWidth: "1.5",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                d: "M4 21V10a8 8 0 0 1 16 0v11h-5V10a3 3 0 0 0-6 0v11H4z"
            }, void 0, false, {
                fileName: "[project]/src/components/charts/MagnetControl.tsx",
                lineNumber: 35,
                columnNumber: 9
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                d: "M4 16h5"
            }, void 0, false, {
                fileName: "[project]/src/components/charts/MagnetControl.tsx",
                lineNumber: 37,
                columnNumber: 9
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                d: "M15 16h5"
            }, void 0, false, {
                fileName: "[project]/src/components/charts/MagnetControl.tsx",
                lineNumber: 38,
                columnNumber: 9
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                d: "M8 3l-3 4"
            }, void 0, false, {
                fileName: "[project]/src/components/charts/MagnetControl.tsx",
                lineNumber: 40,
                columnNumber: 9
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                d: "M16 3l3 4"
            }, void 0, false, {
                fileName: "[project]/src/components/charts/MagnetControl.tsx",
                lineNumber: 41,
                columnNumber: 9
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                d: "M12 2v4"
            }, void 0, false, {
                fileName: "[project]/src/components/charts/MagnetControl.tsx",
                lineNumber: 42,
                columnNumber: 9
            }, ("TURBOPACK compile-time value", void 0))
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/charts/MagnetControl.tsx",
        lineNumber: 33,
        columnNumber: 5
    }, ("TURBOPACK compile-time value", void 0));
_c1 = StrongMagnetIcon;
const MagnetControl = ({ side = 'top' })=>{
    _s();
    const [mode, setMode] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('OFF');
    const [prevActiveMode, setPrevActiveMode] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('WEAK');
    const [isMenuOpen, setIsMenuOpen] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const menuRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    // Sync with MagnetService
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "MagnetControl.useEffect": ()=>{
            setMode(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$charts$2f$widgets$2f$MagnetService$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["MagnetService"].getMode());
            const unsubscribe = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$charts$2f$widgets$2f$MagnetService$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["MagnetService"].subscribe({
                "MagnetControl.useEffect.unsubscribe": (newMode)=>{
                    setMode(newMode);
                    if (newMode !== 'OFF') {
                        setPrevActiveMode(newMode);
                    }
                }
            }["MagnetControl.useEffect.unsubscribe"]);
            return unsubscribe;
        }
    }["MagnetControl.useEffect"], []);
    // Close menu on click outside
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "MagnetControl.useEffect": ()=>{
            const handleClickOutside = {
                "MagnetControl.useEffect.handleClickOutside": (event)=>{
                    if (menuRef.current && !menuRef.current.contains(event.target)) {
                        setIsMenuOpen(false);
                    }
                }
            }["MagnetControl.useEffect.handleClickOutside"];
            document.addEventListener('mousedown', handleClickOutside);
            return ({
                "MagnetControl.useEffect": ()=>document.removeEventListener('mousedown', handleClickOutside)
            })["MagnetControl.useEffect"];
        }
    }["MagnetControl.useEffect"], []);
    const handleToggle = ()=>{
        if (mode === 'OFF') {
            __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$charts$2f$widgets$2f$MagnetService$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["MagnetService"].setMode(prevActiveMode);
        } else {
            __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$charts$2f$widgets$2f$MagnetService$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["MagnetService"].setMode('OFF');
        }
    };
    const handleSelectMode = (newMode)=>{
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$charts$2f$widgets$2f$MagnetService$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["MagnetService"].setMode(newMode);
        setIsMenuOpen(false);
    };
    const isActive = mode !== 'OFF';
    const menuClasses = side === 'right' ? "absolute left-full top-0 ml-2 w-56 bg-white dark:bg-[#1e222d] border border-slate-200 dark:border-slate-800 rounded shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-left-1" : "absolute bottom-full right-0 mb-2 w-56 bg-white dark:bg-[#1e222d] border border-slate-200 dark:border-slate-800 rounded shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-bottom-1";
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "relative flex items-center justify-center group",
        ref: menuRef,
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex items-center gap-0.5",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        onClick: handleToggle,
                        className: `
                        p-2 rounded transition-all flex items-center justify-center
                        ${isActive ? 'bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-500/30' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'}
                    `,
                        title: isActive ? `Magnet ON (${mode})` : 'Magnet OFF',
                        children: mode === 'STRONG' ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(StrongMagnetIcon, {
                            active: isActive
                        }, void 0, false, {
                            fileName: "[project]/src/components/charts/MagnetControl.tsx",
                            lineNumber: 110,
                            columnNumber: 42
                        }, ("TURBOPACK compile-time value", void 0)) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(MagnetIcon, {
                            active: isActive
                        }, void 0, false, {
                            fileName: "[project]/src/components/charts/MagnetControl.tsx",
                            lineNumber: 110,
                            columnNumber: 83
                        }, ("TURBOPACK compile-time value", void 0))
                    }, void 0, false, {
                        fileName: "[project]/src/components/charts/MagnetControl.tsx",
                        lineNumber: 100,
                        columnNumber: 17
                    }, ("TURBOPACK compile-time value", void 0)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        onClick: (e)=>{
                            e.stopPropagation();
                            setIsMenuOpen(!isMenuOpen);
                        },
                        className: `
                        absolute left-full ml-1 w-3 h-full flex items-center justify-center
                        opacity-0 group-hover:opacity-100 transition-opacity
                        text-slate-500 hover:text-blue-400 group-hover:text-blue-400 cursor-pointer
                    `,
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$right$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronRight$3e$__["ChevronRight"], {
                            size: 12
                        }, void 0, false, {
                            fileName: "[project]/src/components/charts/MagnetControl.tsx",
                            lineNumber: 126,
                            columnNumber: 21
                        }, ("TURBOPACK compile-time value", void 0))
                    }, void 0, false, {
                        fileName: "[project]/src/components/charts/MagnetControl.tsx",
                        lineNumber: 115,
                        columnNumber: 17
                    }, ("TURBOPACK compile-time value", void 0))
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/charts/MagnetControl.tsx",
                lineNumber: 97,
                columnNumber: 13
            }, ("TURBOPACK compile-time value", void 0)),
            isMenuOpen && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: menuClasses,
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "py-1",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            onClick: ()=>handleSelectMode('WEAK'),
                            className: `w-full text-left px-3 py-2 text-sm flex items-center gap-3 transition-colors ${mode === 'WEAK' ? 'bg-blue-50 dark:bg-blue-600/10 text-blue-600 dark:text-blue-400' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`,
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    className: "shrink-0",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(MagnetIcon, {
                                        active: true
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/charts/MagnetControl.tsx",
                                        lineNumber: 138,
                                        columnNumber: 56
                                    }, ("TURBOPACK compile-time value", void 0))
                                }, void 0, false, {
                                    fileName: "[project]/src/components/charts/MagnetControl.tsx",
                                    lineNumber: 138,
                                    columnNumber: 29
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    children: "Weak Magnet Mode"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/charts/MagnetControl.tsx",
                                    lineNumber: 139,
                                    columnNumber: 29
                                }, ("TURBOPACK compile-time value", void 0))
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/components/charts/MagnetControl.tsx",
                            lineNumber: 134,
                            columnNumber: 25
                        }, ("TURBOPACK compile-time value", void 0)),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            onClick: ()=>handleSelectMode('STRONG'),
                            className: `w-full text-left px-3 py-2 text-sm flex items-center gap-3 transition-colors ${mode === 'STRONG' ? 'bg-blue-50 dark:bg-blue-600/10 text-blue-600 dark:text-blue-400' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`,
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    className: "shrink-0",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(StrongMagnetIcon, {
                                        active: true
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/charts/MagnetControl.tsx",
                                        lineNumber: 145,
                                        columnNumber: 56
                                    }, ("TURBOPACK compile-time value", void 0))
                                }, void 0, false, {
                                    fileName: "[project]/src/components/charts/MagnetControl.tsx",
                                    lineNumber: 145,
                                    columnNumber: 29
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    children: "Strong Magnet Mode"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/charts/MagnetControl.tsx",
                                    lineNumber: 146,
                                    columnNumber: 29
                                }, ("TURBOPACK compile-time value", void 0))
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/components/charts/MagnetControl.tsx",
                            lineNumber: 141,
                            columnNumber: 25
                        }, ("TURBOPACK compile-time value", void 0))
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/components/charts/MagnetControl.tsx",
                    lineNumber: 133,
                    columnNumber: 21
                }, ("TURBOPACK compile-time value", void 0))
            }, void 0, false, {
                fileName: "[project]/src/components/charts/MagnetControl.tsx",
                lineNumber: 132,
                columnNumber: 17
            }, ("TURBOPACK compile-time value", void 0))
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/charts/MagnetControl.tsx",
        lineNumber: 95,
        columnNumber: 9
    }, ("TURBOPACK compile-time value", void 0));
};
_s(MagnetControl, "tBwIau9KNuDW5ql91iZtIuY6ZeU=");
_c2 = MagnetControl;
var _c, _c1, _c2;
__turbopack_context__.k.register(_c, "MagnetIcon");
__turbopack_context__.k.register(_c1, "StrongMagnetIcon");
__turbopack_context__.k.register(_c2, "MagnetControl");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/components/charts/modals/GoToDateModal.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GoToDateModal",
    ()=>GoToDateModal
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__X$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/x.js [app-client] (ecmascript) <export default as X>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$left$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronLeft$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/chevron-left.js [app-client] (ecmascript) <export default as ChevronLeft>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$right$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronRight$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/chevron-right.js [app-client] (ecmascript) <export default as ChevronRight>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$context$2f$ChartThemeContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/context/ChartThemeContext.tsx [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
;
;
;
const GoToDateModal = ({ isOpen, onClose, onGoTo })=>{
    _s();
    const { theme } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$context$2f$ChartThemeContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useChartTheme"])();
    const [activeTab, setActiveTab] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('date');
    // Date State
    const [selectedDate, setSelectedDate] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(new Date());
    const [inputDate, setInputDate] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('');
    const [inputTime, setInputTime] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('00:00');
    // Calendar View State
    const [viewDate, setViewDate] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(new Date()); // For navigating months without changing selection
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "GoToDateModal.useEffect": ()=>{
            if (isOpen) {
                const now = new Date();
                setSelectedDate(now);
                setViewDate(now);
                setInputDate(now.toISOString().split('T')[0]);
                setInputTime(now.toTimeString().slice(0, 5));
            }
        }
    }["GoToDateModal.useEffect"], [
        isOpen
    ]);
    // Update inputs when calendar selection changes
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "GoToDateModal.useEffect": ()=>{
            setInputDate(selectedDate.toISOString().split('T')[0]);
        }
    }["GoToDateModal.useEffect"], [
        selectedDate
    ]);
    // Handle Input Changes
    const handleDateInputChange = (e)=>{
        setInputDate(e.target.value);
        const d = new Date(e.target.value);
        if (!isNaN(d.getTime())) {
            setSelectedDate(d);
            setViewDate(d);
        }
    };
    const handleTimeInputChange = (e)=>{
        setInputTime(e.target.value);
    };
    const handleGoTo = ()=>{
        const [hours, minutes] = inputTime.split(':').map(Number);
        const target = new Date(selectedDate);
        target.setHours(hours, minutes, 0, 0);
        onGoTo(Math.floor(target.getTime() / 1000));
        onClose();
    };
    // Calendar Helper Functions
    const getDaysInMonth = (year, month)=>new Date(year, month + 1, 0).getDate();
    const getFirstDayOfMonth = (year, month)=>{
        const day = new Date(year, month, 1).getDay();
        return day === 0 ? 6 : day - 1; // Adjust for Monday start (0=Mon, 6=Sun)
    };
    const generateCalendarDays = ()=>{
        const year = viewDate.getFullYear();
        const month = viewDate.getMonth();
        const daysInMonth = getDaysInMonth(year, month);
        const firstDay = getFirstDayOfMonth(year, month);
        const days = [];
        // Padding for previous month
        for(let i = 0; i < firstDay; i++){
            days.push(null);
        }
        // Days of current month
        for(let i = 1; i <= daysInMonth; i++){
            days.push(i);
        }
        return days;
    };
    const changeMonth = (delta)=>{
        const newDate = new Date(viewDate);
        newDate.setMonth(newDate.getMonth() + delta);
        setViewDate(newDate);
    };
    if (!isOpen) return null;
    const days = generateCalendarDays();
    const weekDays = [
        'Mo.',
        'Di.',
        'Mi.',
        'Do.',
        'Fr.',
        'Sa.',
        'So.'
    ];
    // Format Helper
    const monthNames = [
        'Januar',
        'Februar',
        'März',
        'April',
        'Mai',
        'Juni',
        'Juli',
        'August',
        'September',
        'Oktober',
        'November',
        'Dezember'
    ];
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm",
        onClick: onClose,
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "bg-white dark:bg-[#1E222D] rounded-lg shadow-xl w-[340px] overflow-hidden border border-slate-200 dark:border-[#2A2E39]",
            onClick: (e)=>e.stopPropagation(),
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex justify-between items-center p-4 pb-2",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                            className: "text-lg font-bold text-slate-900 dark:text-[#D1D4DC]",
                            children: "Gehe zu"
                        }, void 0, false, {
                            fileName: "[project]/src/components/charts/modals/GoToDateModal.tsx",
                            lineNumber: 114,
                            columnNumber: 21
                        }, ("TURBOPACK compile-time value", void 0)),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            onClick: onClose,
                            className: "text-slate-500 dark:text-[#787B86] hover:text-slate-900 dark:hover:text-[#D1D4DC] transition-colors",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__X$3e$__["X"], {
                                size: 20
                            }, void 0, false, {
                                fileName: "[project]/src/components/charts/modals/GoToDateModal.tsx",
                                lineNumber: 116,
                                columnNumber: 25
                            }, ("TURBOPACK compile-time value", void 0))
                        }, void 0, false, {
                            fileName: "[project]/src/components/charts/modals/GoToDateModal.tsx",
                            lineNumber: 115,
                            columnNumber: 21
                        }, ("TURBOPACK compile-time value", void 0))
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/components/charts/modals/GoToDateModal.tsx",
                    lineNumber: 113,
                    columnNumber: 17
                }, ("TURBOPACK compile-time value", void 0)),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex px-4 border-b border-slate-200 dark:border-[#2A2E39] mb-4",
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        className: `pb-2 text-sm font-medium border-b-2 transition-colors mr-4 ${activeTab === 'date' ? 'text-blue-600 dark:text-[#2962FF] border-blue-600 dark:border-[#2962FF]' : 'text-slate-500 dark:text-[#D1D4DC] border-transparent hover:text-blue-600 dark:hover:text-[#2962FF]'}`,
                        onClick: ()=>setActiveTab('date'),
                        children: "Datum"
                    }, void 0, false, {
                        fileName: "[project]/src/components/charts/modals/GoToDateModal.tsx",
                        lineNumber: 122,
                        columnNumber: 21
                    }, ("TURBOPACK compile-time value", void 0))
                }, void 0, false, {
                    fileName: "[project]/src/components/charts/modals/GoToDateModal.tsx",
                    lineNumber: 121,
                    columnNumber: 17
                }, ("TURBOPACK compile-time value", void 0)),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "px-4 pb-4",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex gap-3 mb-6",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "relative flex-1",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                        type: "date",
                                        value: inputDate,
                                        onChange: handleDateInputChange,
                                        className: "w-full bg-slate-50 dark:bg-[#131722] border border-slate-300 dark:border-[#363A45] rounded px-3 py-1.5 text-sm text-slate-900 dark:text-[#D1D4DC] focus:border-blue-500 dark:focus:border-[#2962FF] focus:outline-none"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/charts/modals/GoToDateModal.tsx",
                                        lineNumber: 138,
                                        columnNumber: 29
                                    }, ("TURBOPACK compile-time value", void 0))
                                }, void 0, false, {
                                    fileName: "[project]/src/components/charts/modals/GoToDateModal.tsx",
                                    lineNumber: 137,
                                    columnNumber: 25
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "relative w-24",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                        type: "time",
                                        value: inputTime,
                                        onChange: handleTimeInputChange,
                                        className: "w-full bg-slate-50 dark:bg-[#131722] border border-slate-300 dark:border-[#363A45] rounded px-3 py-1.5 text-sm text-slate-900 dark:text-[#D1D4DC] focus:border-blue-500 dark:focus:border-[#2962FF] focus:outline-none"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/charts/modals/GoToDateModal.tsx",
                                        lineNumber: 147,
                                        columnNumber: 29
                                    }, ("TURBOPACK compile-time value", void 0))
                                }, void 0, false, {
                                    fileName: "[project]/src/components/charts/modals/GoToDateModal.tsx",
                                    lineNumber: 146,
                                    columnNumber: 25
                                }, ("TURBOPACK compile-time value", void 0))
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/components/charts/modals/GoToDateModal.tsx",
                            lineNumber: 136,
                            columnNumber: 21
                        }, ("TURBOPACK compile-time value", void 0)),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex justify-between items-center mb-4 text-slate-900 dark:text-[#D1D4DC]",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    onClick: ()=>changeMonth(-1),
                                    className: "p-1 hover:bg-slate-100 dark:hover:bg-[#2A2E39] rounded text-slate-500 dark:text-[#787B86] hover:text-slate-900 dark:hover:text-[#D1D4DC]",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$left$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronLeft$3e$__["ChevronLeft"], {
                                        size: 20
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/charts/modals/GoToDateModal.tsx",
                                        lineNumber: 159,
                                        columnNumber: 29
                                    }, ("TURBOPACK compile-time value", void 0))
                                }, void 0, false, {
                                    fileName: "[project]/src/components/charts/modals/GoToDateModal.tsx",
                                    lineNumber: 158,
                                    columnNumber: 25
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    className: "font-medium",
                                    children: [
                                        monthNames[viewDate.getMonth()],
                                        " ",
                                        viewDate.getFullYear()
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/components/charts/modals/GoToDateModal.tsx",
                                    lineNumber: 161,
                                    columnNumber: 25
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    onClick: ()=>changeMonth(1),
                                    className: "p-1 hover:bg-slate-100 dark:hover:bg-[#2A2E39] rounded text-slate-500 dark:text-[#787B86] hover:text-slate-900 dark:hover:text-[#D1D4DC]",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$right$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronRight$3e$__["ChevronRight"], {
                                        size: 20
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/charts/modals/GoToDateModal.tsx",
                                        lineNumber: 165,
                                        columnNumber: 29
                                    }, ("TURBOPACK compile-time value", void 0))
                                }, void 0, false, {
                                    fileName: "[project]/src/components/charts/modals/GoToDateModal.tsx",
                                    lineNumber: 164,
                                    columnNumber: 25
                                }, ("TURBOPACK compile-time value", void 0))
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/components/charts/modals/GoToDateModal.tsx",
                            lineNumber: 157,
                            columnNumber: 21
                        }, ("TURBOPACK compile-time value", void 0)),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "grid grid-cols-7 gap-1 text-center mb-2",
                            children: weekDays.map((day)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "text-xs text-slate-500 dark:text-[#787B86] py-1 bg-slate-100 dark:bg-[#2A2E39]/30 rounded-sm",
                                    children: day
                                }, day, false, {
                                    fileName: "[project]/src/components/charts/modals/GoToDateModal.tsx",
                                    lineNumber: 172,
                                    columnNumber: 29
                                }, ("TURBOPACK compile-time value", void 0)))
                        }, void 0, false, {
                            fileName: "[project]/src/components/charts/modals/GoToDateModal.tsx",
                            lineNumber: 170,
                            columnNumber: 21
                        }, ("TURBOPACK compile-time value", void 0)),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "grid grid-cols-7 gap-1 text-center",
                            children: days.map((day, idx)=>{
                                if (day === null) return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {}, `empty-${idx}`, false, {
                                    fileName: "[project]/src/components/charts/modals/GoToDateModal.tsx",
                                    lineNumber: 179,
                                    columnNumber: 54
                                }, ("TURBOPACK compile-time value", void 0));
                                const isSelected = day === selectedDate.getDate() && viewDate.getMonth() === selectedDate.getMonth() && viewDate.getFullYear() === selectedDate.getFullYear();
                                const isToday = day === new Date().getDate() && viewDate.getMonth() === new Date().getMonth() && viewDate.getFullYear() === new Date().getFullYear();
                                return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    onClick: ()=>{
                                        const newD = new Date(viewDate);
                                        newD.setDate(day);
                                        setSelectedDate(newD);
                                    },
                                    className: `
                                        text-sm py-1.5 rounded transition-colors
                                        ${isSelected ? 'bg-blue-600 dark:bg-white text-white dark:text-black font-bold' : 'text-slate-700 dark:text-[#D1D4DC] hover:bg-slate-100 dark:hover:bg-[#2A2E39]'}
                                        ${isToday && !isSelected ? 'underline decoration-blue-500 dark:decoration-[#2962FF] underline-offset-4' : ''}
                                    `,
                                    children: day
                                }, day, false, {
                                    fileName: "[project]/src/components/charts/modals/GoToDateModal.tsx",
                                    lineNumber: 192,
                                    columnNumber: 33
                                }, ("TURBOPACK compile-time value", void 0));
                            })
                        }, void 0, false, {
                            fileName: "[project]/src/components/charts/modals/GoToDateModal.tsx",
                            lineNumber: 177,
                            columnNumber: 21
                        }, ("TURBOPACK compile-time value", void 0))
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/components/charts/modals/GoToDateModal.tsx",
                    lineNumber: 134,
                    columnNumber: 17
                }, ("TURBOPACK compile-time value", void 0)),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex justify-end gap-3 p-4 border-t border-slate-200 dark:border-[#2A2E39]",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            onClick: onClose,
                            className: "px-4 py-2 text-sm font-medium text-slate-600 dark:text-[#D1D4DC] border border-slate-300 dark:border-[#363A45] rounded hover:bg-slate-100 dark:hover:bg-[#2A2E39] transition-colors",
                            children: "Abbrechen"
                        }, void 0, false, {
                            fileName: "[project]/src/components/charts/modals/GoToDateModal.tsx",
                            lineNumber: 217,
                            columnNumber: 21
                        }, ("TURBOPACK compile-time value", void 0)),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            onClick: handleGoTo,
                            className: "px-4 py-2 text-sm font-medium bg-blue-600 dark:bg-white hover:bg-blue-500 dark:hover:bg-slate-200 text-white dark:text-black rounded transition-colors font-bold",
                            children: "Gehe zu"
                        }, void 0, false, {
                            fileName: "[project]/src/components/charts/modals/GoToDateModal.tsx",
                            lineNumber: 223,
                            columnNumber: 21
                        }, ("TURBOPACK compile-time value", void 0))
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/components/charts/modals/GoToDateModal.tsx",
                    lineNumber: 216,
                    columnNumber: 17
                }, ("TURBOPACK compile-time value", void 0))
            ]
        }, void 0, true, {
            fileName: "[project]/src/components/charts/modals/GoToDateModal.tsx",
            lineNumber: 108,
            columnNumber: 13
        }, ("TURBOPACK compile-time value", void 0))
    }, void 0, false, {
        fileName: "[project]/src/components/charts/modals/GoToDateModal.tsx",
        lineNumber: 107,
        columnNumber: 9
    }, ("TURBOPACK compile-time value", void 0));
};
_s(GoToDateModal, "aSR+FGfwfIe0nQZTgZjqvehfdJc=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$context$2f$ChartThemeContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useChartTheme"]
    ];
});
_c = GoToDateModal;
var _c;
__turbopack_context__.k.register(_c, "GoToDateModal");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=src_components_charts_6a97ee2f._.js.map
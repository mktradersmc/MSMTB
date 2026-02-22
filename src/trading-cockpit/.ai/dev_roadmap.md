# TradingView Implementation Roadmap (LWC Wrapper)

## Core Controller (`ChartWidget`)
- [x] `createShape(point, options)` - The factory for drawings.
- [x] `createMultipointShape(points, options)` - For lines/trendlines.
- [x] `removeEntity(id)` - Deleting objects.
- [x] `removeAllShapes()` - Clear chart.
- [ ] `getShapeById(id)` - Selection logic.
- [ ] `setSymbol(symbol, interval)` - Changing the main chart data.

## Drawing Tools (Implemented as `ISeriesPrimitive`)
- [ ] **LineTool** (Simple Trendline)
- [ ] **RayTool** (Extended Line)
- [x] **PositionTool** (Long/Short - In Progress)
- [ ] **FibonacciRetracement** (Complex Math + Drawing)
- [ ] **TextTool** (Canvas Text Rendering)
- [ ] **BrushTool** (Freehand Drawing - Hardest)

## Indicators / Studies (`StudyEngine`)
- [ ] `createStudy(name, inputs, overrides)` - Wrapper around technicalindicators lib.
- [ ] `removeStudy(id)`
- [ ] `getStudyById(id)`

## Data & State
- [ ] `save()` - Returns JSON with all shapes, studies, and symbol info.
- [ ] `load(json)` - Reconstructs the chart from JSON.
- [ ] `onVisibleRangeChanged` - Infinite scrolling / Lazy Loading history.

## UI / Interaction
- [ ] **Magnet Mode** (Snap to OHLC) - Defined in architecture, needs implementation.
- [ ] **Crosshair Sync** (If multiple panes used).
- [ ] **Screenshot** (`takeClientScreenshot`).
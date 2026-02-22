# Trade Panel & Widget Specification

## 1. Widget Components & State
The `LongShortPosition` widget consists of four primary reactive elements:
- **Entry Level** (Price)
- **Stop Loss (SL)** (Price)
- **Take Profit (TP)** (Price)
- **Risk/Reward (RR)** (Ratio)

### 1.1 State Properties
Each instance maintains:
- `entryPrice`, `stopLossPrice`, `takeProfitPrice` (Numbers)
- `riskReward` (Number, derived or fixed)
- `fixedStates`: `{ tp: boolean, sl: boolean, entry: boolean, rr: boolean }`
- `orderType`: `'MARKET' | 'LIMIT'`
- `anchors`: `{ slAnchor: AnchorInfo, tpAnchor: AnchorInfo }` (Nullable)

---

## 2. Interaction Rules (The "Physics")

### 2.1 Fixation Logic
Users can "fix" specific parameters to prevent them from changing during calculations.
- **Toggle Fix:** Double-click on a handle (Ball) or the RR Panel to toggle its fixed state.
- **Visual Feedback:**
    - Fixed Price Level: Thicker line (3px), solid opacity.
    - Fixed RR: Panel has a solid dark border.

### 2.2 Mutual Exclusivity & Priority
To prevent logical deadlocks, the following priority rules apply:

1.  **Price Level Priority:** Fixed Price Levels (SL, TP) have priority over a Fixed Ratio (RR).
2.  **Auto-Unfix RR:** If **SL** and **TP** are both set to `fixed = true`, the system **automatically sets `rr.fixed = false`**.
    - *Rationale:* Mathematically, if certain prices are locked, the ratio is a result, not a driver.
3.  **Override Exception:** If (theoretically) SL, TP, and RR are all fixed (e.g. during a drag operation):
    - Moving **SL** or **TP** is allowed.
    - This action **breaks the RR fix** (recalculates RR) to ensure the explicitly moved price level stays where the user put it.

### 2.3 Dragging Behavior (Calculation Logic)
- **Floating (Body Move):** Dragging the entire widget moves Entry, SL, and TP by the same delta. RR remains constant. Anchors are cleared.
- **Entry Move:**
    - If `RR` **Fixed**: SL and TP move to maintain ratio relative to new Entry.
    - If `RR` **Unfixed**: SL and TP stay (if fixed) or ratio changes.
- **SL Move:**
    - If `RR` **Fixed**: TP moves to maintain ratio relative to Entry.
    - If `RR` **Unfixed**: TP stays, RR recalculates.
- **TP Move:**
    - If `RR` **Fixed**: SL moves to maintain ratio relative to Entry.
    - If `RR` **Unfixed**: SL stays, RR recalculates.

---

## 3. Order Modes & Execution

### 3.1 Market Mode
- **Toggle:** User switches to 'MARKET' via button.
- **Behavior:**
    - **Entry Sync:** The Entry Level automatically follows the live market price (Tick Data).
    - **Trade Object:** `entry` is sent as `0`.
    - **Visuals:** Toggle button is **Amber**.
    - **Exception:** If user manually drags Entry while in Market mode, it temporarily detaches or switches to Limit (implementation choice: usually just syncs on next tick unless dragging).

### 3.2 Pending Mode (Limit/Stop)
- **Toggle:** User switches to 'LIMIT' (default state if not Market).
- **Label Logic:** The UI label dynamically changes based on `Entry` vs `Market Price`:
    - **Long:**
        - Entry < Market: **LIMIT** (Buy Dip)
        - Entry > Market: **STOP** (Buy Breakout)
    - **Short:**
        - Entry > Market: **LIMIT** (Sell Rally)
        - Entry < Market: **STOP** (Sell Breakdown)
- **Trade Object:** `entry` is the specific fixed price.
- **Visuals:** Toggle button is **Gray/Slate**.

### 3.3 UI Layout (Context-Sensitive)
To prevent mis-clicks:
- **Long Position:** **EXECUTE** button is at the **TOP**, **Mode Toggle** at the **BOTTOM**.
- **Short Position:** **Mode Toggle** at the **TOP**, **EXECUTE** button at the **BOTTOM**.

---

## 4. Smart Anchors & Magnet

### 4.1 Magnet Functionality
When a handle (SL/TP) is snapped to a candle shortly using the Magnet tool:
- The system captures an **Anchor Object**:
    ```typescript
    interface AnchorInfo {
        time: number;       // Server timestamp of the candle
        price: number;      // Exact OHLC price
        type: 'open' | 'high' | 'low' | 'close';
        timeframe: string;  // e.g., 'M5', 'H1'
    }
    ```
- **Persistence:** This anchor is stored in the widget state.
- **Usage:** Bots use this data to place orders at the exact server-side candle level, avoiding timezone/interpolation issues.
- **Clearing:** If the user drags the widget body ("Floating"), specific candle anchors are cleared as the level is no longer semantically tied to that specific candle.

---

## 5. Data Export (Trade Object)
When "EXECUTE" is clicked, the following object is generated:

```json
{
  "symbol": "EURUSD",
  "isLong": true,
  "entry": 0,             // 0 if Market, Price if Pending
  "sl": 1.0500,
  "tp": 1.0600,
  "rr": 2.0,
  "fixed": "sl",          // Which leg is visually primary (legacy/display)
  "time": 1735000000,     // Time index of entry
  "slAnchor": { ... },    // Defined above, or null
  "tpAnchor": { ... }     // Defined above, or null
}
```

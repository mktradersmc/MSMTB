async function run() {
    try {
        const res = await fetch('http://localhost:3005/api/indicators/divergence?symbol=EURUSD&timeframe=M15&limit=1000&settings={"timeframes":["D1","H4"],"other_symbols":["GBPUSD"]}');
        console.log(await res.json());
    } catch (e) {
        console.error(e);
    }
}
run();

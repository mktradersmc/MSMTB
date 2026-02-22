"use client";

import React, { useEffect, useRef, useMemo } from "react";
import ReactECharts from "echarts-for-react";
import * as echarts from "echarts";

interface ChartDataPoint {
    time: string; // ISO String or readable date for axis
    open: number;
    high: number;
    low: number;
    close: number;
    timestamp: number; // For logic
}

interface CorrelationPoint {
    time: string;
    value: number;
}

interface SignalChartProps {
    symbol: string;
    data: ChartDataPoint[]; // Main Asset Candles
    correlationData?: CorrelationPoint[]; // Correlated Asset Line
    correlationSymbol?: string;
    divergences?: {
        start: { time: string; value: number };
        end: { time: string; value: number };
        type: "bullish" | "bearish";
        label?: string;
    }[];
}

const SignalChart: React.FC<SignalChartProps> = ({ symbol, data, correlationData, correlationSymbol, divergences }) => {

    const option = useMemo(() => {
        const dates = data.map(item => item.time);
        const candleValues = data.map(item => [item.open, item.close, item.low, item.high]);

        const markLines = divergences?.map(d => ({
            data: [
                { name: d.label, xAxis: d.start.time, yAxis: d.start.value },
                { xAxis: d.end.time, yAxis: d.end.value }
            ],
            lineStyle: {
                color: d.type === 'bullish' ? '#00FF00' : '#FF0000',
                width: 2,
                type: 'solid'
            },
            label: {
                show: true,
                position: 'middle',
                formatter: d.label
            }
        })) || [];

        return {
            title: {
                text: symbol,
                left: 10
            },
            tooltip: {
                trigger: 'axis',
                axisPointer: {
                    type: 'cross'
                }
            },
            legend: {
                data: [symbol, correlationSymbol || 'Correlation']
            },
            grid: {
                left: '10%',
                right: '10%',
                bottom: '15%'
            },
            xAxis: {
                type: 'category',
                data: dates,
                scale: true,
                boundaryGap: false,
                axisLine: { onZero: false },
                splitLine: { show: false },
                min: 'dataMin',
                max: 'dataMax'
            },
            yAxis: [
                {
                    scale: true,
                    splitArea: {
                        show: true
                    }
                },
                {
                    scale: true,
                    gridIndex: 0,
                    splitNumber: 2,
                    axisLabel: { show: false },
                    axisLine: { show: false },
                    axisTick: { show: false },
                    splitLine: { show: false }
                }
            ],
            dataZoom: [
                {
                    type: 'inside',
                    start: 50,
                    end: 100
                },
                {
                    show: true,
                    type: 'slider',
                    top: '90%',
                    start: 50,
                    end: 100
                }
            ],
            series: [
                {
                    name: symbol,
                    type: 'candlestick',
                    data: candleValues,
                    itemStyle: {
                        color: '#00da3c',
                        color0: '#ec0000',
                        borderColor: '#00da3c',
                        borderColor0: '#ec0000'
                    },
                    markLine: {
                        data: markLines.flatMap(m => m.data), // Simplify for now, echarts structure is specific
                        symbol: ['none', 'none'],
                        // Note: correctly implementing arbitrary markLines across series needs careful data structure or separate series. 
                        // Ideally we use a 'lines' series for arbitrary drawing if markLine on candlestick is limited.
                        // But markLine on series is standard.
                    }
                },
                correlationData && correlationData.length > 0 ? {
                    name: correlationSymbol || 'Correlation',
                    type: 'line',
                    yAxisIndex: 1, // Use secondary axis
                    data: correlationData.map(d => d.value),
                    showSymbol: false,
                    lineStyle: {
                        width: 1,
                        opacity: 0.7
                    }
                } : null
            ].filter(Boolean)
        };
    }, [symbol, data, correlationData, correlationSymbol, divergences]);

    return (
        <div className="w-full h-[500px] bg-white rounded-lg shadow-md p-4">
            <ReactECharts option={option} style={{ height: '100%', width: '100%' }} />
        </div>
    );
};

export default SignalChart;

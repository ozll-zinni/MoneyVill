import React, { useEffect, useRef, useState } from "react";
import {
  ChartCanvas,
  Chart as FinancialChart,
  CandlestickSeries,
  BarSeries,
  LineSeries,
  XAxis,
  YAxis,
  CrossHairCursor,
  MouseCoordinateX,
  MouseCoordinateY,
  EdgeIndicator,
} from "react-financial-charts";
import { ema, elderRay, discontinuousTimeScaleProviderBuilder } from "react-financial-charts";
import { format } from "d3-format";
import { timeFormat } from "d3-time-format";
import { CandleData } from "../../types/types";

interface ChartProps {
  data: CandleData[];
  height: number;
}
interface ChartData extends CandleData {
  ema12?: number;
  ema26?: number;
  elderRay?: {
    bullPower: number;
    bearPower: number;
  };
  volume?: number;
}

const ChartComponent: React.FC<ChartProps> = ({ data, height }) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState<number>(window.innerWidth);

  useEffect(() => {
    const updateChartSize = () => {
      if (chartRef.current) {
        setWidth(chartRef.current.clientWidth);
      }
    };

    updateChartSize();

    const resizeObserver = new ResizeObserver(() => {
      updateChartSize();
    });

    if (chartRef.current) {
      resizeObserver.observe(chartRef.current);
    }

    window.addEventListener("resize", updateChartSize);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", updateChartSize);
    };
  }, []);

  const sortedData = data
    .filter((d) => d.date instanceof Date && !isNaN(d.date.getTime()))
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  if (sortedData.length === 0) {
    console.warn("No valid data available for the chart.");
    return <div>No valid data available for the chart.</div>;
  }

  const ema12 = ema()
    .id(1)
    .options({ windowSize: 12 })
    .merge((d: ChartData, c: number) => {
      d.ema12 = c;
    })
    .accessor((d: ChartData) => d.ema12);

  const ema26 = ema()
    .id(2)
    .options({ windowSize: 26 })
    .merge((d: ChartData, c: number) => {
      d.ema26 = c;
    })
    .accessor((d: ChartData) => d.ema26);

  const elder = elderRay();

  const calculatedData = elder(ema26(ema12(sortedData)));

  const ScaleProvider = discontinuousTimeScaleProviderBuilder().inputDateAccessor(
    (d) => d.date
  );
  const { data: chartData, xScale, xAccessor, displayXAccessor } = ScaleProvider(
    calculatedData
  );

  const xExtents = [
    xAccessor(chartData[0]),
    xAccessor(chartData[chartData.length - 2])
  ];

  const pricesDisplayFormat = format(".0f");
  const volumeFormat = format(".2s"); 
  const timeDisplayFormat = timeFormat("%Y-%m-%d");

  const volumeColor = (d: ChartData) => (d.close > d.open ? "rgba(38, 166, 154, 0.3)" : "rgba(239, 83, 80, 0.3)");

  return (
    <div ref={chartRef} style={{ width: "100%", height: `${height}px` }}>
      <ChartCanvas
        height={height}
        width={width}
        ratio={1}
        margin={{ left: 0, right: 60, top: 10, bottom: 30 }}
        data={chartData}
        seriesName="Data"
        xScale={xScale}
        xAccessor={xAccessor}
        displayXAccessor={displayXAccessor}
        xExtents={xExtents}
      >
        <FinancialChart id={1} height={height * 0.7} yExtents={(d) => [d.high, d.low]}>
          <XAxis showGridLines />
          <YAxis showGridLines tickFormat={pricesDisplayFormat} />
          <CandlestickSeries 
            stroke={d => d.close > d.open ? "#EA455D" : "#3FA2F6"} 
            wickStroke={d => d.close > d.open ? "#EA455D" : "#3FA2F6"} 
            fill={d => d.close > d.open ? "#EA455D" : "#3FA2F6"} 
          />
          <LineSeries yAccessor={ema12.accessor()} strokeStyle="#EA455D" />
          <LineSeries yAccessor={ema26.accessor()} strokeStyle="#3FA2F6" />
          <MouseCoordinateX displayFormat={timeDisplayFormat} />
          <MouseCoordinateY displayFormat={pricesDisplayFormat} /> 
          <EdgeIndicator
            itemType="last"
            rectWidth={50}
            fill={(d) => (d.close > d.open ? "#EA455D" : "#3FA2F6")}
            yAccessor={(d) => d.close}
            displayFormat={pricesDisplayFormat}
          />
        </FinancialChart>

        {/* Volume Chart (30% of height) */}
        <FinancialChart id={2} origin={(w, h) => [0, h - height * 0.3]} height={height * 0.3} yExtents={(d) => d.volume}>
          <YAxis tickFormat={volumeFormat} /> {/* 거래량 Y축 형식 지정 */}
          <BarSeries fillStyle={volumeColor} yAccessor={(d) => d.volume} />
          <MouseCoordinateY displayFormat={volumeFormat} />
        </FinancialChart>

        <CrossHairCursor />
      </ChartCanvas>
    </div>
  );
};

export default ChartComponent;

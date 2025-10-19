import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
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
  // SSR-safe client detection
  const [isClientRendered, setIsClientRendered] = useState(false);
  useEffect(() => {
    setIsClientRendered(true);
  }, []);

  // width state + refs for RAF + current cached width
  const [width, setWidth] = useState<number>(0);
  const widthRef = useRef<number>(0);
  const rafRef = useRef<number | null>(null);
  const chartRef = useRef<HTMLDivElement | null>(null);

  // Measure & update width using RAF + value comparison
  useLayoutEffect(() => {
    if (!isClientRendered) return;

    const getDeviceRatio = () => (typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1);

    const scheduleUpdate = () => {
      // cancel previously scheduled RAF
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }

      rafRef.current = requestAnimationFrame(() => {
        if (!chartRef.current) return;
        const rect = chartRef.current.getBoundingClientRect();
        const newW = Math.floor(rect.width || 0);

        if (newW && newW !== widthRef.current) {
          widthRef.current = newW;
          setWidth(newW);
        }
      });
    };

    // initial measurement (useLayoutEffect runs before paint)
    scheduleUpdate();

    const ro = new ResizeObserver(() => {
      scheduleUpdate();
    });

    if (chartRef.current) ro.observe(chartRef.current);
    window.addEventListener("resize", scheduleUpdate);

    return () => {
      ro.disconnect();
      window.removeEventListener("resize", scheduleUpdate);
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [isClientRendered]);

  // Prepare and validate data
  const sortedData = data
    .filter((d) => d.date instanceof Date && !isNaN(d.date.getTime()))
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  if (sortedData.length === 0 || !isClientRendered || width === 0) {
    return <div ref={chartRef} style={{ width: "100%", height: `${height}px` }}>Loading...</div>;
  }

  // Indicators and calculations
  const ema12 = ema()
    .id(1)
    .options({ windowSize: 12 })
    .merge((d: ChartData, c: number) => { d.ema12 = c; })
    .accessor((d: ChartData) => d.ema12);

  const ema26 = ema()
    .id(2)
    .options({ windowSize: 26 })
    .merge((d: ChartData, c: number) => { d.ema26 = c; })
    .accessor((d: ChartData) => d.ema26);

  const elder = elderRay();
  const calculatedData = elder(ema26(ema12(sortedData as ChartData[])));

  const ScaleProvider = discontinuousTimeScaleProviderBuilder()
    .inputDateAccessor((d: any) => d.date);

  const { data: chartData, xScale, xAccessor, displayXAccessor } = ScaleProvider(calculatedData);

  const xExtents = [
    xAccessor(chartData[0]),
    xAccessor(chartData[chartData.length - 2]),
  ];

  const pricesDisplayFormat = format(".0f");
  const volumeFormat = format(".2s");
  const timeDisplayFormat = timeFormat("%Y-%m-%d");

  const volumeColor = (d: ChartData) => (
    d.close > d.open ? "rgba(38, 166, 154, 0.3)" : "rgba(239, 83, 80, 0.3)"
  );

  const ratio = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;

  return (
    <div ref={chartRef} style={{ width: "100%", height: `${height}px` }}>
      <ChartCanvas
        height={height}
        width={width}
        ratio={ratio}
        margin={{ left: 0, right: 60, top: 10, bottom: 30 }}
        data={chartData}
        seriesName="Data"
        xScale={xScale}
        xAccessor={xAccessor}
        displayXAccessor={displayXAccessor}
        xExtents={xExtents}
      >
        <FinancialChart id={1} height={height * 0.7} yExtents={(d: any) => [d.high, d.low]}>
          <XAxis showGridLines />
          <YAxis showGridLines tickFormat={pricesDisplayFormat} />
          <CandlestickSeries
            stroke={(d: any) => d.close > d.open ? "#EA455D" : "#3FA2F6"}
            wickStroke={(d: any) => d.close > d.open ? "#EA455D" : "#3FA2F6"}
            fill={(d: any) => d.close > d.open ? "#EA455D" : "#3FA2F6"}
          />
          <LineSeries yAccessor={ema12.accessor()} strokeStyle="#EA455D" />
          <LineSeries yAccessor={ema26.accessor()} strokeStyle="#3FA2F6" />
          <MouseCoordinateX displayFormat={timeDisplayFormat} />
          <MouseCoordinateY displayFormat={pricesDisplayFormat} />
          <EdgeIndicator
            itemType="last"
            rectWidth={50}
            fill={(d: any) => (d.close > d.open ? "#EA455D" : "#3FA2F6")}
            yAccessor={(d: any) => d.close}
            displayFormat={pricesDisplayFormat}
          />
        </FinancialChart>

        <FinancialChart
          id={2}
          origin={(w, h) => [0, h - height * 0.3]}
          height={height * 0.3}
          yExtents={(d: any) => d.volume}
        >
          <YAxis tickFormat={volumeFormat} />
          <BarSeries fillStyle={volumeColor as any} yAccessor={(d: any) => d.volume} />
          <MouseCoordinateY displayFormat={volumeFormat} />
        </FinancialChart>

        <CrossHairCursor />
      </ChartCanvas>
    </div>
  );
};

export default ChartComponent;
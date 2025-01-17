import React, { useEffect, useRef, useState, useLayoutEffect } from "react";
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
  const [dimensions, setDimensions] = useState({ width: 0, height });
  const [isClientRendered, setIsClientRendered] = useState(false);

  // 클라이언트 사이드 렌더링 확인
  useEffect(() => {
    setIsClientRendered(true);
  }, []);

  // useLayoutEffect를 사용하여 DOM 업데이트 전에 크기 계산
  useLayoutEffect(() => {
    if (!isClientRendered) return;

    const updateChartSize = () => {
      if (chartRef.current) {
        const { width } = chartRef.current.getBoundingClientRect();
        setDimensions(prev => ({
          ...prev,
          width: Math.floor(width)  // 정수값으로 반올림하여 사용
        }));
      }
    };

    // 초기 크기 설정
    updateChartSize();

    // ResizeObserver 설정
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width } = entry.contentRect;
        setDimensions(prev => ({
          ...prev,
          width: Math.floor(width)
        }));
      }
    });

    if (chartRef.current) {
      resizeObserver.observe(chartRef.current);
    }

    // 윈도우 리사이즈 이벤트 리스너
    window.addEventListener('resize', updateChartSize);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateChartSize);
    };
  }, [isClientRendered]);

  // 데이터 처리 및 계산 로직
  const sortedData = data
    .filter((d) => d.date instanceof Date && !isNaN(d.date.getTime()))
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  if (sortedData.length === 0 || !isClientRendered || dimensions.width === 0) {
    return <div ref={chartRef} style={{ width: "100%", height: `${height}px` }}>Loading...</div>;
  }

  // 기존의 차트 계산 로직...
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
  const calculatedData = elder(ema26(ema12(sortedData)));

  const ScaleProvider = discontinuousTimeScaleProviderBuilder()
    .inputDateAccessor((d) => d.date);
    
  const { data: chartData, xScale, xAccessor, displayXAccessor } = ScaleProvider(calculatedData);

  const xExtents = [
    xAccessor(chartData[0]),
    xAccessor(chartData[chartData.length - 2])
  ];

  const pricesDisplayFormat = format(".0f");
  const volumeFormat = format(".2s");
  const timeDisplayFormat = timeFormat("%Y-%m-%d");

  const volumeColor = (d: ChartData) => (
    d.close > d.open ? "rgba(38, 166, 154, 0.3)" : "rgba(239, 83, 80, 0.3)"
  );

  return (
    <div ref={chartRef} style={{ width: "100%", height: `${height}px` }}>
      <ChartCanvas
        height={height}
        width={dimensions.width}
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
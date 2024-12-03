// Chart.tsx
import React, { useEffect, useRef, useState } from 'react';
import {
  ChartCanvas,
  Chart as FinancialChart,
  CandlestickSeries,
  XAxis,
  YAxis,
  CrossHairCursor,
  MouseCoordinateX,
  MouseCoordinateY,
} from 'react-financial-charts';
import { scaleTime, scaleLinear } from 'd3-scale';
import { format } from 'd3-format';
import { extent } from 'd3-array';
import { timeFormat } from 'd3-time-format';
import { CandleData } from '../../types/types';

interface ChartProps {
  data: CandleData[];
  height: number;
}

const ChartComponent: React.FC<ChartProps> = ({ data, height }) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState<number>(window.innerWidth);

  // Handle responsiveness using ResizeObserver
  useEffect(() => {
    const handleResize = (entries: ResizeObserverEntry[]) => {
      for (let entry of entries) {
        if (entry.target === chartRef.current && entry.contentRect.width) {
          setWidth(entry.contentRect.width);
        }
      }
    };

    const resizeObserver = new ResizeObserver(handleResize);
    if (chartRef.current) {
      resizeObserver.observe(chartRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  // Sort the data by date to ensure chronological order and filter out invalid dates
  const sortedData = [...data]
    .filter(d => d.date instanceof Date && !isNaN(d.date.getTime()))
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  if (sortedData.length === 0) {
    console.warn('No valid data available for the chart.');
    return <div>No valid data available for the chart.</div>;
  }

  // Define scales
  const xScale = scaleTime();
  const yScale = scaleLinear();

  // Determine the extents for the x-axis
  const xExtents = extent(sortedData, (d) => d.date) as [Date, Date];

  return (
    <div ref={chartRef} style={{ width: '100%', height: `${height}px` }}>
      <ChartCanvas
        height={height}
        width={width}
        ratio={1}
        margin={{ left: 50, right: 50, top: 10, bottom: 30 }}
        data={sortedData}
        seriesName="Data"
        xAccessor={(d) => d.date}
        xScale={xScale}
        xExtents={xExtents}
      >
        <FinancialChart id={1} yExtents={[20000, 100000]}>
          <XAxis />
          <YAxis />
          <MouseCoordinateX displayFormat={timeFormat('%Y-%m-%d')} />
          <MouseCoordinateY displayFormat={format('.2f')} />
          <CandlestickSeries />
        </FinancialChart>
        <CrossHairCursor />
      </ChartCanvas>
    </div>
  );
};

export default ChartComponent;

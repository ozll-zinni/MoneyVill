export interface CandleData {
    date: Date;
    open: number;
    high: number;
    low: number;
    close: number;
  }
  
  export interface ChartDataType {
    일자: string; // 'YYYY-MM-DD' 형식 또는 원하는 형식
    종가: number; // 종가
  }
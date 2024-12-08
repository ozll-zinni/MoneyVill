import React, { ChangeEvent, useEffect, useRef, useState } from 'react';
import MobileInfo from './MobileInfo';
import NewsModal from './NewsModal';
import {
  useDeleteStockMutation,
  useLazyGetStockQuery,
  useLazyGetStockSelectQuery,
  usePostStockMutation,
} from 'Store/api';
import { EventSourcePolyfill } from 'event-source-polyfill';
import ChartComponent from './Chart';
import { useAppDispatch, useAppSelector } from 'Store/hooks';
import { toast } from 'react-toastify';
import CountdownTimeMinute from './CountdownTimeMinute';
import CountdownTimer from './CountdownTimer';
import IRModal from './IRModal';
import StockTradeModal from './StockTradeModal';
import Loading from 'Components/Common/Loading';
// Firebase imports
import { dbService } from '../../firebase';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';

// Interface for Candle Data used in Chart.tsx
interface CandleData {
  date: Date;
  open: number;
  high: number;
  low: number;
  close: number;
}

// Interface for Stock Data received from SSE
interface SelectDataType {
  changeRate: number;
  companyId: number;
  date: string;
  id: number;
  priceBefore: number;
  priceEnd: number;
  stockHigh: number;
  stockLow: number;
  stockDividend: number;
}

// Interface for SSE Data
interface SseDataType {
  stockId: number;
  amount: number;
  average: number;
  rate: number;
  stockChartResDto: SelectDataType[];
}

// Interface for Modal Data
interface TradeStockModalType {
  amount: number;
  dealType: string;
  kind: string;
  price: number;
}

// Interface for Chart Data expected by MobileInfo
interface ChartDataType {
  일자: string; // Date in 'YYYY-MM-DD' format or any preferred format
  종가: number; // Closing price
}

function Exchange(): JSX.Element {
  const dispatch = useAppDispatch();
  const irData = require('./ir_data.json'); // Ensure this JSON has correct structure
  const inputRef = useRef<HTMLInputElement>(null);
  const inputRef2 = useRef<HTMLInputElement>(null);

  // RTK Query Hooks
  const [lazyGetStock, { isLoading: isLoading1, isError: isError1 }] = useLazyGetStockQuery();
  const [getStockSelect, { isLoading: isLoading2, isError: isError2 }] = useLazyGetStockSelectQuery();
  const [postStock, { isLoading: isLoading3, isError: isError3 }] = usePostStockMutation();
  const [deleteStock, { isLoading: isLoading4, isError: isError4 }] = useDeleteStockMutation();

  // Redux Selectors
  const currentMoney = useAppSelector((state) => state.currentMoneyStatus);
  const clickSound = useAppSelector((state) => state.clickBtn);
  const cancelClickSound = useAppSelector((state) => state.cancelClick);
  const successFx = useAppSelector((state) => state.successFx);
  const errorFx = useAppSelector((state) => state.errorFx);

  // Audio Effects
  const clickBtn = new Audio(clickSound);
  const cancelClickBtn = new Audio(cancelClickSound);
  const successFxSound = new Audio(successFx);
  const errorFxSound = new Audio(errorFx);

  // State Variables
  const [isPossibleStockTime, setIsPossibleStockTime] = useState<boolean>(false);
  const [isNewsClick, setIsNewsClick] = useState<boolean>(false);
  const [isMobileInfo, setIsMobileInfo] = useState<boolean>(false);
  const [isIRClick, setIsIRClick] = useState<boolean>(false);
  const [stockTrade, setStockTrade] = useState<any>();
  const [afterMoney, setAfterMoney] = useState<string>('0');
  const [lazyGetStockData, setLazyGetStockData] = useState<any>();
  const [selectRevenueData, setSelectRevenueData] = useState<number>(0);
  const [selectCurrentData, setSelectCurrentData] = useState<SelectDataType>({
    changeRate: 0,
    companyId: 0,
    date: '',
    id: 0,
    priceBefore: 0,
    priceEnd: 0,
    stockHigh: 0,
    stockLow: 0,
    stockDividend: 0,
  });

  // Chart Data States
  const [selectChartData, setSelectChartData] = useState<CandleData[]>([]);
  const [oilData, setOilData] = useState<ChartDataType[]>([]);
  const [goldData, setGoldData] = useState<ChartDataType[]>([]);
  const [euroData, setEuroData] = useState<ChartDataType[]>([]);
  const [jypData, setJypData] = useState<ChartDataType[]>([]);
  const [usdData, setUsdData] = useState<ChartDataType[]>([]);

  const [clickNational, setClickNational] = useState<number>(0);
  const [clickNationalName, setClickNationalName] = useState<string>('');

  const [sseData, setSseData] = useState<SseDataType>();
  const [eventSource, setEventSource] = useState<EventSourcePolyfill | undefined>(undefined);
  const [selectIRData, SetSelectIRData] = useState<any>({
    'key services': [''],
    name: '',
    'operating gain': 0,
    'operating revenue': 0,
    plan: [''],
    'total equity': 0,
    'total liabilities': 0,
  });

  // ===========================
  // Transformation Function
  // ===========================
  const transformChartDataTypeToCandleData = (data: ChartDataType[]): CandleData[] => {
    return data.map((item) => ({
      date: new Date(item.일자),
      open: item.종가,
      high: item.종가,
      low: item.종가,
      close: item.종가,
    }));
  };

  // ===========================
  // SSE Setup and Event Handling
  // ===========================
  useEffect(() => {
    // Clean up existing EventSource
    if (eventSource) {
      eventSource.close();
      setEventSource(undefined);
    }

    const token = localStorage.getItem('accessToken');
    if (!token) {
      toast.error('Access token not found.');
      return;
    }

    const newEventSource = new EventSourcePolyfill(`${process.env.REACT_APP_API_URL}/stock/connect`, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Access-Control-Allow-Origin': '*',
        Authorization: `Bearer ${token}`,
        'Cache-Control': 'no-cache',
      },
      heartbeatTimeout: 300000,
      withCredentials: true,
    });

    setEventSource(newEventSource);

    return () => {
      newEventSource.close();
      setEventSource(undefined);
    };
  }, []); // Empty dependency array ensures this runs once on mount

  useEffect(() => {
    if (eventSource) {
      eventSource.onmessage = (event: any) => {
        setSseData(JSON.parse(event.data));
      };

      eventSource.onerror = () => {
        eventSource.close();
        toast.error('Connection lost. Attempting to reconnect...');
        // Reinitialize EventSource on error
        const token = localStorage.getItem('accessToken');
        if (!token) {
          toast.error('Access token not found.');
          return;
        }

        const newEventSource = new EventSourcePolyfill(`${process.env.REACT_APP_API_URL}/stock/connect`, {
          headers: {
            'Content-Type': 'text/event-stream',
            'Access-Control-Allow-Origin': '*',
            Authorization: `Bearer ${token}`,
            'Cache-Control': 'no-cache',
          },
          heartbeatTimeout: 300000,
          withCredentials: true,
        });

        setEventSource(newEventSource);
      };
    }
  }, [eventSource]);

  // ===========================
  // Button Event Handlers
  // ===========================
  const clickButtonEvent = (number: number) => {
    if (inputRef.current) {
      if (inputRef.current.value !== '') {
        const intValue = parseInt(inputRef.current.value.replace(/,/g, ''));
        const newValue = intValue + number;
        const checkMoney: number = selectCurrentData.priceEnd * newValue;
        setAfterMoney(checkMoney.toLocaleString());
        inputRef.current.value = newValue.toLocaleString();
      } else {
        inputRef.current.value = `${number}`;
        const checkMoney: number = selectCurrentData.priceEnd * number;
        setAfterMoney(checkMoney.toLocaleString());
      }
    }
  };

  const clickButtonEventM = (number: number) => {
    if (inputRef2.current) {
      if (inputRef2.current.value !== '') {
        const intValue = parseInt(inputRef2.current.value.replace(/,/g, ''));
        const newValue = intValue + number;
        const checkMoney: number = selectCurrentData.priceEnd * newValue;
        setAfterMoney(checkMoney.toLocaleString());
        inputRef2.current.value = newValue.toLocaleString();
      } else {
        inputRef2.current.value = `${number}`;
        const checkMoney: number = selectCurrentData.priceEnd * number;
        setAfterMoney(checkMoney.toLocaleString());
      }
    }
  };

  // ===========================
  // Modal States
  // ===========================
  const [isShowStockModal, setIsShowStockModal] = useState<boolean>(false);
  const [tradeStockModalData, setTradeStockModalData] = useState<TradeStockModalType>();

  // ===========================
  // Click Events Handler
  // ===========================
  const click = (e: React.MouseEvent) => {
    const ariaLabel = e.currentTarget.getAttribute('aria-label');
    if (!ariaLabel) return;

    switch (ariaLabel) {
      case '1개':
        clickBtn.play();
        clickButtonEvent(1);
        break;
      case '10개':
        clickBtn.play();
        clickButtonEvent(10);
        break;
      case '100개':
        clickBtn.play();
        clickButtonEvent(100);
        break;
      case '1000개':
        clickBtn.play();
        clickButtonEvent(1000);
        break;
      case '1개M':
        clickBtn.play();
        clickButtonEventM(1);
        break;
      case '10개M':
        clickBtn.play();
        clickButtonEventM(10);
        break;
      case '100개M':
        clickBtn.play();
        clickButtonEventM(100);
        break;
      case '1000개M':
        clickBtn.play();
        clickButtonEventM(1000);
        break;
      case '신문':
        clickBtn.play();
        setIsNewsClick((prev) => !prev);
        break;
      case '정보':
        clickBtn.play();
        setIsMobileInfo((prev) => !prev);
        break;
      case '기업활동':
        clickBtn.play();
        setIsIRClick((prev) => !prev);
        break;
      case '미국':
      case '일본':
      case '유럽연합':
        clickBtn.play();
        setClickNational(
          ariaLabel === '미국' ? 0 : ariaLabel === '일본' ? 1 : 2
        );
        break;
      case '매수':
      case '매수2':
        handleBuyStock(ariaLabel === '매수' ? inputRef : inputRef2);
        break;
      case '매도':
      case '매도2':
        handleSellStock(ariaLabel === '매도' ? inputRef : inputRef2);
        break;
      default:
        break;
    }
  };

  // ===========================
  // Handle Buy Stock
  // ===========================
  const handleBuyStock = (ref: React.RefObject<HTMLInputElement>) => {
    if (ref.current) {
      const stockAmount = parseInt(ref.current.value.replace(/,/g, ''));
      if (stockAmount === 0 || isNaN(stockAmount)) {
        toast.error('매수할 개수를 입력해주세요!');
        return;
      }

      const body = {
        stockAmount,
        stockId: sseData?.stockId,
      };

      const postBuyStock = async () => {
        try {
          const { data, result } = await postStock(body).unwrap();
          if (result === 'SUCCESS') {
            setTradeStockModalData(data);
            setIsShowStockModal(true);
            // Add system message to Firebase
            await addDoc(collection(dbService, 'system'), {
              nickname: localStorage.getItem('nickname'),
              content: `누군가 ${data.kind}의 주식을 ${data.amount.toLocaleString()}개 매수하셨습니다`,
              createdAt: serverTimestamp(),
            });
            toast.success('매수 완료하였습니다!');
            successFxSound.play();
          } else {
            throw new Error('매수 실패');
          }
          if (ref.current) {
            ref.current.value = '0';
          }
          setAfterMoney('0');
        } catch {
          errorFxSound.play();
          toast.error('매수할 수 있는 개수를 초과했습니다!');
        }
      };

      postBuyStock();
    }
  };

  // ===========================
  // Handle Sell Stock
  // ===========================
  const handleSellStock = (ref: React.RefObject<HTMLInputElement>) => {
    if (ref.current) {
      const stockAmount = parseInt(ref.current.value.replace(/,/g, ''));
      if (stockAmount === 0 || isNaN(stockAmount)) {
        toast.error('매도할 개수를 입력해주세요!');
        return;
      }

      const body = {
        stockAmount,
        stockId: sseData?.stockId,
      };

      const postSellStock = async () => {
        try {
          const { data, result } = await deleteStock(body).unwrap();
          if (result === 'SUCCESS') {
            setTradeStockModalData(data);
            setIsShowStockModal(true);
            // Add system message to Firebase
            await addDoc(collection(dbService, 'system'), {
              nickname: localStorage.getItem('nickname'),
              content: `누군가 ${data.kind}의 주식을 ${data.amount.toLocaleString()}개 매도하셨습니다`,
              createdAt: serverTimestamp(),
            });
            toast.success('매도를 완료하였습니다!');
            successFxSound.play();
          } else {
            throw new Error('매도 실패');
          }
          if (ref.current) {
            ref.current.value = '0';
          }
          setAfterMoney('0');
        } catch {
          errorFxSound.play();
          toast.error('요청에 문제가 생겼습니다!');
        }
      };

      postSellStock();
    }
  };

  // ===========================
  // Input Validation
  // ===========================
  const isValidInput = (input: string) => {
    const regex = /^[0-9,]*$/;
    return regex.test(input);
  };

  // ===========================
  // Handle Input Change
  // ===========================
  const change = (e: ChangeEvent<HTMLInputElement>) => {
    const target = e.currentTarget;
    const ariaLabel = target.getAttribute('aria-label');
    if (!ariaLabel) return;

    const ref = ariaLabel === '입력' ? inputRef : inputRef2;
    const setAfter = setAfterMoney;

    if (ref.current) {
      if (target.value !== '') {
        if (isValidInput(target.value)) {
          const intValue = parseInt(target.value.replace(/,/g, ''));
          const checkMoney = selectCurrentData.priceEnd * intValue;
          setAfter(checkMoney.toLocaleString());
          ref.current.value = intValue.toLocaleString();
        } else {
          const sanitizedValue = target.value.replace(/[^0-9]/g, '');
          const intValue = parseInt(sanitizedValue.slice(0, -1).replace(/,/g, ''));
          ref.current.value = isNaN(intValue) ? '0' : intValue.toLocaleString();
        }
      } else {
        setAfter('0');
      }
    }
  };

  // ===========================
  // Fetch Initial Stock Data
  // ===========================
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const { data, result } = await lazyGetStock('').unwrap();
        setLazyGetStockData(data);
        if (data.stockList.length > 0) {
          await selectStockData(data.stockList[0].stockId);
          const firstDataName = data.stockList[0].kind;
          SetSelectIRData(irData[firstDataName]);
          setClickNationalName(data.stockList[0].companyName);
        }
      } catch (error) {
        toast.error('주식 데이터를 불러오는 데 실패했습니다.');
      }
    };
    fetchInitialData();
  }, [lazyGetStock, irData]);

  // ===========================
  // Select Stock Data
  // ===========================
  const selectStockData = async (stockId: number) => {
    try {
      const { data, result } = await getStockSelect(stockId).unwrap();
      if (result === 'SUCCESS') {
        // Handle successful data fetch if necessary
      }
    } catch (error) {
      console.error('Error selecting stock data:', error);
    }
  };

  const clickStock = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    // 가져온 stockId를 파싱
    const stockId = parseInt(e.currentTarget.getAttribute('aria-label') || '0');
    if (stockId && lazyGetStockData?.stockList) {
      // 해당 stockId와 매칭되는 주식을 찾음
      const selectedStock = lazyGetStockData.stockList.find(
        (stock: any) => stock.stockId === stockId
      );
      
      if (selectedStock) {
        // companyName을 설정
        setClickNationalName(selectedStock.companyName);
        
        // 추가적으로 필요한 작업 수행
        await selectStockData(stockId);
      }
    }
  };
  

  // ===========================
  // Tag Setting for Display
  // ===========================
  const TagSetting = (data: ChartDataType[]) => {
    if (data.length < 2) return null;
    const latest = data[data.length - 1];
    const prev = data[data.length - 2];
    const change = latest.종가 - prev.종가;
    const isPositive = change > 0;

    return (
      <div>
        <span className="text-[1.25rem]">{latest.종가.toLocaleString()}</span>
        <span className="text-[1.25rem]">원</span>
        <span className={`text-[0.9rem] ${isPositive ? 'text-red-500' : 'text-blue-500'}`}>
          &nbsp;({isPositive ? '+' : ''}
          {change.toLocaleString()})
        </span>
      </div>
    );
  };

  // ===========================
  // Handle SSE Data Updates
  // ===========================
  useEffect(() => {
    if (sseData) {
      // Reset input fields
      if (inputRef.current) inputRef.current.value = '0';
      if (inputRef2.current) inputRef2.current.value = '0';
      setAfterMoney('0');

      const { stockId, amount, average, rate, stockChartResDto } = sseData;

      // Update IR Data if national name is selected
      if (clickNationalName !== '') {
        SetSelectIRData(irData[clickNationalName]);
      }

      // Calculate revenue
      if (stockChartResDto.length > 1) {
        const latest = stockChartResDto[stockChartResDto.length - 1];
        const prev = stockChartResDto[stockChartResDto.length - 2];
        setSelectRevenueData((latest.priceEnd - average) * amount);
        setSelectCurrentData(latest);
      } else if (stockChartResDto.length === 1) {
        const latest = stockChartResDto[0];
        setSelectRevenueData((latest.priceBefore - average) * amount);
        setSelectCurrentData(latest);
      }

      // Prepare candlestick data for the main chart
      const candleData: CandleData[] = stockChartResDto.map((data: SelectDataType) => ({
        date: new Date(data.date),
        open: data.priceBefore || 0,  // Use 0 or other fallback if null
        high: data.stockHigh || data.priceEnd,  // Fallback to priceEnd if stockHigh is null
        low: data.stockLow || data.priceEnd,    // Fallback to priceEnd if stockLow is null
        close: data.priceEnd
      }));
  
      setSelectChartData(candleData);

      // Define date range for auxiliary data
      const startDate = new Date(stockChartResDto[0].date);
      const endDate = new Date(stockChartResDto[stockChartResDto.length - 1].date);
      const { euro, gold, jyp, oil, stockList, usd } = lazyGetStockData;

      // Prepare auxiliary data
      const prepareAuxiliaryData = (dataList: any[]): ChartDataType[] => {
        return dataList
          .filter((data) => {
            const date = new Date(data.date);
            return startDate <= date && date <= endDate;
          })
          .map((data) => ({
            일자: data.date, // Format as needed, e.g., new Date(data.date).toLocaleDateString()
            종가: data.price,
          }));
      };

      setOilData(prepareAuxiliaryData(oil));
      setGoldData(prepareAuxiliaryData(gold));
      setEuroData(prepareAuxiliaryData(euro));
      setJypData(prepareAuxiliaryData(jyp));
      setUsdData(prepareAuxiliaryData(usd));

      // If no national name is set, default to the first in the list
      if (clickNationalName === '' && stockList.length > 0) {
        setClickNationalName(stockList[0].companyName);
      }
    }
  }, [sseData, clickNationalName, lazyGetStockData, irData]);

  return (
    <>
      {/* Stock Trade Modal */}
      {isShowStockModal && (
        <StockTradeModal
          tradeStockModalData={tradeStockModalData}
          isShowStockModal={isShowStockModal}
          setIsShowStockModal={setIsShowStockModal}
        />
      )}

      {/* Loading State */}
      {isLoading1 || isLoading2 || isLoading3 || isLoading4 ? (
        <Loading />
      ) : (
        <>
          {/* IR Modal */}
          {isIRClick && (
            <IRModal
              isIRClick={isIRClick}
              setIsIRClick={setIsIRClick}
              selectIRData={selectIRData}
              date={selectCurrentData.date.split('-')}
              clickBtn={clickBtn}
              cancelClickBtn={cancelClickBtn}
            />
          )}

          {/* News Modal */}
          {isNewsClick && (
            <NewsModal
              isNewsClick={isNewsClick}
              setIsNewsClick={setIsNewsClick}
              clickBtn={clickBtn}
              cancelClickBtn={cancelClickBtn}
            />
          )}

          {/* Mobile Info */}
          {isMobileInfo && (
            <MobileInfo
              isMobileInfo={isMobileInfo}
              setIsMobileInfo={setIsMobileInfo}
              oilData={oilData}
              goldData={goldData}
              usdData={usdData}
              jypData={jypData}
              euroData={euroData}
            />
          )}

          {/* Main Content */}
          <div className="flex flex-col items-center justify-center w-full h-full pt-[12vh] md:pt-[10vh]">
            {/* Header */}
            <div className="flex justify-between w-full border-b-4">
              {/* Stock List */}
              <div className="flex justify-start items-end w-3/5 text-[1rem] md:text-[1.2rem] lg:text-[1.7rem] space-x-3 font-black">
                {lazyGetStockData?.stockList.map((stock: any) => (
                  <div
                    key={stock.stockId}
                    aria-label={`${stock.stockId}`}
                    className="px-3 transition-all duration-300 cursor-pointer hover:scale-105"
                    onClick={clickStock}
                  >
                    {stock.kind}
                  </div>
                ))}
              </div>

              {/* Current Date */}
              <div className="flex items-end justify-end w-2/5">
                <div className="flex flex-col items-end text-[0.68rem] lg:text-[1rem]">
                  <span className="font-semibold leading-[0.6rem]">날짜</span>
                  <span className="text-[0.9rem] lg:text-[1.5rem] font-bold">{selectCurrentData.date}</span>
                </div>
              </div>
            </div>

            {/* Stock Data and Chart */}
            <div className="flex items-start justify-between w-full pt-2 lg:pt-5">
              {/* Left Side - Chart and Investment Status */}
              <div className="hidden flex-col justify-center px-2 w-[70%] lg:flex">
                <div className="flex flex-col w-full px-5 transition-all duration-300 bg-white rounded-lg hover:scale-[1.02] border-2 border-white hover:border-blue-200 shadow-md shadow-gray-300">
                  {/* Investment Header */}
                  <div className="flex items-end justify-between w-full pt-2 font-bold">
                    <div className="flex items-end space-x-3">
                      <span className="text-[1.7rem]">나의 투자 현황</span>
                      <span className="text-[1.3rem]">{clickNationalName}</span>
                      {/* 시세 손익 */}
                      <div className={`flex items-end space-x-1 ${selectRevenueData > 0 ? 'text-red-500' : 'text-blue-500'}`}>
                        <span className={`text-[1.3rem]`}>{selectRevenueData.toLocaleString()}원</span>
                        <span className="text-[0.9rem]">({sseData?.rate.toFixed(2)}%)</span>
                      </div>
                    </div>
                    <div className="flex items-end space-x-2">
                    {/* 배당금 표시 영역 */}
                      <span className="text-[1rem]">주당 배당금: </span>
                      <span className="text-[1rem] font-bold text-[#2C94EA]">
                        {(
                          sseData?.stockChartResDto[sseData.stockChartResDto.length - 1]?.stockDividend || 0
                        ).toLocaleString()}원
                      </span>
                    </div>
                  </div>

                  {/* Investment Data */}
                  <div className="flex items-end justify-between w-full text-[#9B9B9B] font-bold">
                    <div className="flex space-x-3 items-end text-[1.5rem]">
                      {sseData && sseData.amount > 0 && (
                        <>
                          <div className="flex items-center space-x-1">
                            <span className="text-[0.9rem]">보유수량</span>
                            <span className="text-black text-[1.2rem]">{sseData.amount.toLocaleString()}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <span className="text-[0.9rem]">평균단가</span>
                            <span className="text-black text-[1.2rem]">{sseData.average.toLocaleString()}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <span className="text-[0.9rem]">예상 배당금</span>
                            <span className="text-black text-[1.2rem]">  
                            {(
                              (sseData?.stockChartResDto[sseData.stockChartResDto.length - 1]?.stockDividend || 0) * 
                              (sseData?.amount || 0)
                              ).toLocaleString()}원
                            </span>
                          </div>
                        </>
                      )}
                    </div>

                    <div className="flex items-center space-x-1">
                      <span className="text-[0.9rem]">현재가</span>
                      <span className={`text-black text-[1.3rem]`}>{selectCurrentData.priceEnd.toLocaleString()}</span>
                      <span className="text-black text-[1.3rem]">원</span>
                      {/* Price Change */}
                      {sseData && sseData.stockChartResDto.length === 1 && (
                        <span
                          className={`text-[1rem] flex pt-2 items-end ${
                            selectCurrentData.priceEnd - sseData.stockChartResDto[0].priceBefore > 0
                              ? 'text-red-500'
                              : 'text-blue-500'
                          }`}
                        >
                          (
                          {selectCurrentData.priceEnd - sseData.stockChartResDto[0].priceBefore > 0
                            ? (selectCurrentData.priceEnd - sseData.stockChartResDto[0].priceBefore).toLocaleString()
                            : `-${Math.abs(selectCurrentData.priceEnd - sseData.stockChartResDto[0].priceBefore).toLocaleString()}`}
                          )
                        </span>
                      )}
                      {sseData && sseData.stockChartResDto.length > 1 && (
                        <span
                          className={`text-[1rem] flex pt-2 items-end ${
                            selectCurrentData.priceEnd - sseData.stockChartResDto[sseData.stockChartResDto.length - 2].priceEnd > 0
                              ? 'text-red-500'
                              : 'text-blue-500'
                          }`}
                        >
                          (
                          {selectCurrentData.priceEnd - sseData.stockChartResDto[sseData.stockChartResDto.length - 2].priceEnd < 0
                            ? `-${Math.abs(selectCurrentData.priceEnd - sseData.stockChartResDto[sseData.stockChartResDto.length - 2].priceEnd).toLocaleString()}`
                            : (selectCurrentData.priceEnd - sseData.stockChartResDto[sseData.stockChartResDto.length - 2].priceEnd).toLocaleString()}
                          )
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Candlestick Chart */}
                  <div className="w-full h-[28rem] text-[0.6rem] bg-white font-semibold">
                    <ChartComponent data={selectChartData} height={400} />
                  </div>
                </div>
                {/* Additional Charts (Oil, Gold, etc.) can be added here if needed */}
              </div>

              {/* Right Side - Trading and Auxiliary Charts */}
              <div className="hidden flex-col w-[28%] space-y-3 justify-end items-start lg:flex">
                {/* 갱신 시간 (Update Time) */}
                <div className="flex flex-col w-full py-1 text-white bg-black rounded-lg">
                  <div className="flex justify-between w-full text-[1.2rem] px-[5%] font-semibold">
                    <div className="w-1/2 text-center">
                      <span className="text-[#FF5151]">종목 갱신</span>
                    </div>
                    <div className="w-1/2 text-center">
                      <span className="text-[#00A3FF]">날짜 갱신</span>
                    </div>
                  </div>
                  <div className="flex justify-between w-full text-[1.6rem] font-bold px-[5%]">
                    <div className="flex items-start justify-center w-1/2">
                      <CountdownTimer
                        setIsPossibleStockTime={setIsPossibleStockTime}
                        isPossibleStockTime={isPossibleStockTime}
                      />
                    </div>
                    <div className="flex items-start justify-center w-1/2">
                      <CountdownTimeMinute />
                    </div>
                  </div>
                  <div className="flex justify-between w-full text-[0.7rem] text-[#FFFFFF] px-[5%] font-semibold">
                    <div className="flex justify-center w-1/2 text-center space-x-9">
                      <span>시간&nbsp;</span>
                      <span>분&nbsp;</span>
                      <span>초&nbsp;</span>
                    </div>
                    <div className="flex justify-center w-1/2 text-center space-x-9">
                      <span>&ensp;분&nbsp;</span>
                      <span>초&nbsp;</span>
                    </div>
                  </div>
                </div>
                {/* 주식 거래 (Stock Trading) */}
                {isPossibleStockTime ? (
                  <div className="flex flex-col items-start justify-start w-full px-3 py-1 space-y-1 lg:space-y-2">
                    {/* Trading Header */}
                    <div className="flex items-end justify-between w-full font-extrabold">
                      <span className="text-[1rem] lg:text-[1.5rem]">주식 거래</span>
                      <span className="text-[0.8rem]">금액: {afterMoney}원</span>
                    </div>

                    {/* Trading Input for Desktop */}
                    <div className="hidden lg:flex justify-end items-center w-full bg-[#FFF2F0] border-[#ECB7BB] border-2 rounded-md pr-3">
                      <input
                        ref={inputRef}
                        aria-label="입력"
                        className="py-2 pr-1 text-end w-full bg-[#FFF2F0] outline-none"
                        type="text"
                        placeholder="0"
                        maxLength={6}
                        onChange={change}
                      />
                      <span>개</span>
                    </div>

                    {/* Trading Buttons */}
                    <div className="flex items-center w-full text-center justify-evenly text-[0.6rem] lg:text-[1rem] text-[#464646]">
                      <div
                        aria-label="1개"
                        className="w-1/4 duration-200 border-r-2 hover:rounded-md hover:transition hover:scale-105 hover:font-bold hover:bg-[#EA455D] hover:text-white cursor-pointer"
                        onClick={click}
                      >
                        <span>+1개</span>
                      </div>
                      <div
                        aria-label="10개"
                        className="w-1/4 duration-200 border-r-2 hover:rounded-md hover:transition hover:scale-105 hover:font-bold hover:bg-[#EA455D] hover:text-white cursor-pointer"
                        onClick={click}
                      >
                        <span>+10개</span>
                      </div>
                      <div
                        aria-label="100개"
                        className="w-1/4 duration-200 border-r-2 hover:rounded-md hover:transition hover:scale-105 hover:font-bold hover:bg-[#EA455D] hover:text-white cursor-pointer"
                        onClick={click}
                      >
                        <span>+100개</span>
                      </div>
                      <div
                        aria-label="1000개"
                        className="w-1/4 duration-200 hover:rounded-md hover:transition hover:scale-105 hover:font-bold hover:bg-[#EA455D] hover:text-white cursor-pointer"
                        onClick={click}
                      >
                        <span>+1000개</span>
                      </div>
                    </div>

                    {/* Buy and Sell Buttons */}
                    <div className="flex items-center justify-between w-full text-center text-[1rem] lg:text-[1.5rem] text-white font-semibold pt-1">
                      {/* 매도 (Sell) */}
                      <div
                        aria-label="매도"
                        className={`w-[45%] py-1 bg-[#2C94EA] shadow-md rounded-xl shadow-gray-400 ${
                          sseData && sseData.amount > 0 && inputRef.current && inputRef.current.value !== '0'
                            ? 'cursor-pointer hover:bg-[#1860ef] hover:scale-105 transition-all duration-300'
                            : 'disabled cursor-not-allowed'
                        }`}
                        onClick={click}
                      >
                        <span>매도</span>
                      </div>

                      {/* 매수 (Buy) */}
                      <div
                        aria-label="매수"
                        className={`w-[45%] py-1 bg-[#EA455D] shadow-md rounded-xl shadow-gray-400 ${
                          parseInt(afterMoney.replace(/,/g, '')) <= parseInt(currentMoney.replace(/,/g, '')) &&
                          inputRef.current &&
                          inputRef.current.value !== '0'
                            ? 'cursor-pointer hover:bg-[#f90025fd] hover:scale-105 transition-all duration-300'
                            : 'disabled cursor-not-allowed'
                        }`}
                        onClick={click}
                      >
                        <span>매수</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  // Trading Disabled State
                  <div className="h-[11.35rem] w-full flex justify-center items-center bg-white rounded-lg">
                    <div className="flex flex-col items-center justify-center w-full h-full font-semibold">
                      <span className="text-[1.3rem] space-x-1">
                        <span className="text-blue-500">매도</span>&nbsp;/<span className="text-red-500">매수</span> 가능 시간
                      </span>
                      <span className="text-[1.7rem]">AM 10:00 ~ PM 10:00</span>
                    </div>
                  </div>
                )}

                {/* International Market Exchange Rates */}
                <div className="h-[300px] flex flex-col items-start w-full text-[1.4rem] bg-white mr-[2%] px-5 font-semibold drop-shadow-lg rounded-lg hover:scale-[1.02] border-2 border-white hover:border-blue-200 transition-all duration-300">
                  <div className="flex flex-col items-end justify-between w-full py-2">
                    {/* Header */}
                    <div className="flex justify-between w-full">
                      <span>국제시장 환율</span>

                      {/* Display Current Rate based on Selected National */}
                      {clickNational === 0 && TagSetting(usdData)}
                      {clickNational === 1 && TagSetting(jypData)}
                      {clickNational === 2 && TagSetting(euroData)}
                    </div>

                    {/* National Selection Buttons */}
                    <div className="flex justify-evenly w-full text-center border-2 rounded-md bg-[#EDEDED] text-[1.1rem] space-x-1 mt-1">
                      <div
                        aria-label="미국"
                        className={`w-1/3 transition-all duration-300 rounded-md border-2 ${
                          clickNational === 0 ? 'bg-white scale-105' : 'bg-[#EDEDED] scale-100'
                        } hover:bg-white hover:scale-105 cursor-pointer border-[#EDEDED] hover:border-[#EDEDED]`}
                        onClick={click}
                      >
                        <span>미국</span>
                      </div>
                      <div
                        aria-label="일본"
                        className={`w-1/3 transition-all duration-300 rounded-md border-2 ${
                          clickNational === 1 ? 'bg-white scale-105' : 'bg-[#EDEDED] scale-100'
                        } hover:bg-white hover:scale-105 cursor-pointer border-[#EDEDED] hover:border-[#EDEDED]`}
                        onClick={click}
                      >
                        <span>일본</span>
                      </div>
                      <div
                        aria-label="유럽연합"
                        className={`w-1/3 transition-all duration-300 rounded-md border-2 ${
                          clickNational === 2 ? 'bg-white scale-105' : 'bg-[#EDEDED] scale-100'
                        } hover:bg-white hover:scale-105 cursor-pointer border-[#EDEDED] hover:border-[#EDEDED]`}
                        onClick={click}
                      >
                        <span>유럽연합</span>
                      </div>
                    </div>
                  </div>

                  {/* Chart for Selected National */}
                  <div className="w-full h-[9rem] text-[0.75rem] font-medium">
                    {clickNational === 0 && <ChartComponent data={transformChartDataTypeToCandleData(usdData)} height={200} />}
                    {clickNational === 1 && <ChartComponent data={transformChartDataTypeToCandleData(jypData)} height={200} />}
                    {clickNational === 2 && <ChartComponent data={transformChartDataTypeToCandleData(euroData)} height={200} />}
                  </div>
                </div>
              </div>
              {/* Mobile View */}
              <div className="flex flex-col w-[32%] space-y-3 justify-end items-start lg:hidden">
                {/* Company Info, News, and Other Information */}
                <div className="flex items-center w-full font-bold text-center bg-white border-2 rounded-md justify-evenly">
                  <div
                    aria-label="기업활동"
                    className="w-[40%] border-r-2 text-[0.9rem] md:text-[1rem] transition-all duration-300 hover:scale-105 active:bg-[#EA455D] active:text-white hover:bg-[#EA455D] cursor-pointer hover:text-white hover:rounded-md"
                    onClick={click}
                  >
                    <span>기업활동</span>
                  </div>
                  <div
                    aria-label="신문"
                    className="w-[30%] border-r-2 text-[0.9rem] md:text-[1rem] transition-all duration-300 hover:scale-105 active:bg-[#EA455D] active:text-white hover:bg-[#EA455D] cursor-pointer hover:text-white hover:rounded-md"
                    onClick={click}
                  >
                    <span>신문</span>
                  </div>
                  <div
                    aria-label="정보"
                    className="w-[30%] text-[0.9rem] md:text-[1rem] transition-all duration-300 hover:scale-105 active:bg-[#EA455D] active:text-white hover:bg-[#EA455D] cursor-pointer hover:text-white hover:rounded-md"
                    onClick={click}
                  >
                    <span>정보</span>
                  </div>
                </div>

                {/* 갱신 시간 (Update Time) */}
                <div className="flex flex-col w-full py-1 text-white bg-black rounded-lg">
                  <div className="flex justify-between w-full text-[0.85rem] px-[5%] font-semibold">
                    <div className="w-1/2 text-center">
                      <span className="text-[#FF5151]">종목 갱신</span>
                    </div>
                    <div className="w-1/2 text-center">
                      <span className="text-[#00A3FF]">날짜 갱신</span>
                    </div>
                  </div>
                  <div className={`flex justify-between w-full font-bold px-[5%] text-[1rem]`}>
                    <div className="flex items-start justify-center w-1/2">
                      <CountdownTimer
                        setIsPossibleStockTime={setIsPossibleStockTime}
                        isPossibleStockTime={isPossibleStockTime}
                      />
                    </div>
                    <div className="flex items-start justify-center w-1/2">
                      <CountdownTimeMinute />
                    </div>
                  </div>
                  <div className="flex justify-between w-full text-[0.6rem] text-[#FFFFFF] px-[5%] font-semibold">
                    <div className="flex justify-center w-1/2 space-x-4 text-center">
                      <span>시간</span>
                      <span>&nbsp;분&ensp;</span>
                      <span>초&ensp;</span>
                    </div>
                    <div className="flex justify-center w-1/2 space-x-4 text-center">
                      <span>&ensp;분&ensp;</span>
                      <span>초&nbsp;</span>
                    </div>
                  </div>
                </div>
                {/* 주식 거래 (Stock Trading) */}
                {isPossibleStockTime ? (
                  <div className="flex flex-col items-start justify-start w-full px-3 py-1 space-y-1 lg:space-y-2">
                    {/* Trading Header */}
                    <div className="flex items-end justify-between w-full font-extrabold">
                      <span className="text-[1rem] lg:text-[1.5rem]">주식 거래</span>
                      <span className="text-[0.7rem]">금액: {afterMoney}원</span>
                    </div>

                    {/* Trading Input for Mobile */}
                    <div className="flex lg:hidden justify-end items-center w-full bg-[#FFF2F0] border-[#ECB7BB] border-2 rounded-md pr-3">
                      <input
                        ref={inputRef2}
                        aria-label="입력모바일"
                        className="py-2 pr-1 text-end w-full bg-[#FFF2F0] outline-none"
                        type="text"
                        placeholder="0"
                        maxLength={6}
                        onChange={change}
                      />
                      <span>개</span>
                    </div>

                    {/* Trading Buttons */}
                    <div className="flex items-center w-full text-center justify-evenly text-[0.6rem] lg:text-[1rem] text-[#464646]">
                      <div
                        aria-label="1개M"
                        className="w-1/4 duration-200 border-r-2 hover:rounded-md hover:transition hover:scale-105 hover:font-bold hover:bg-[#EA455D] hover:text-white cursor-pointer"
                        onClick={click}
                      >
                        <span>+1개</span>
                      </div>
                      <div
                        aria-label="10개M"
                        className="w-1/4 duration-200 border-r-2 hover:rounded-md hover:transition hover:scale-105 hover:font-bold hover:bg-[#EA455D] hover:text-white cursor-pointer"
                        onClick={click}
                      >
                        <span>+10개</span>
                      </div>
                      <div
                        aria-label="100개M"
                        className="w-1/4 duration-200 border-r-2 hover:rounded-md hover:transition hover:scale-105 hover:font-bold hover:bg-[#EA455D] hover:text-white cursor-pointer"
                        onClick={click}
                      >
                        <span>+100개</span>
                      </div>
                      <div
                        aria-label="1000개M"
                        className="w-1/4 duration-200 hover:rounded-md hover:transition hover:scale-105 hover:font-bold hover:bg-[#EA455D] hover:text-white cursor-pointer"
                        onClick={click}
                      >
                        <span>+1000개</span>
                      </div>
                    </div>

                    {/* Buy and Sell Buttons */}
                    <div className="flex items-center justify-between w-full text-center text-[1rem] lg:text-[1.5rem] text-white font-semibold pt-1">
                      {/* 매도 (Sell) */}
                      <div
                        aria-label="매도2"
                        className={`w-[45%] py-1 bg-[#2C94EA] shadow-md rounded-xl shadow-gray-400 ${
                          sseData && sseData.amount > 0 && inputRef.current && inputRef.current.value !== '0'
                            ? 'cursor-pointer hover:bg-[#1860ef] hover:scale-105 transition-all duration-300'
                            : 'disabled cursor-not-allowed'
                        }`}
                        onClick={click}
                      >
                        <span>매도</span>
                      </div>

                      {/* 매수 (Buy) */}
                      <div
                        aria-label="매수2"
                        className={`w-[45%] py-1 bg-[#EA455D] shadow-md rounded-xl shadow-gray-400 ${
                          parseInt(afterMoney.replace(/,/g, '')) <= parseInt(currentMoney.replace(/,/g, '')) &&
                          inputRef.current &&
                          inputRef.current.value !== '0'
                            ? 'cursor-pointer hover:bg-[#f90025fd] hover:scale-105 transition-all duration-300'
                            : 'disabled cursor-not-allowed'
                        }`}
                        onClick={click}
                      >
                        <span>매수</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  // Trading Disabled State
                  <div className="h-[8.7rem] md:h-[9.2rem] w-full flex justify-center items-center bg-white rounded-lg">
                    <div className="flex flex-col items-center justify-center w-full h-full font-semibold">
                      <span className="text-[1rem] md:text-[1.1rem] space-x-1">
                        <span className="text-blue-500">매도</span>&nbsp;/<span className="text-red-500">매수</span> 가능 시간
                      </span>
                      <span className="text-[1.1rem] md:text-[1.3rem]">AM 10:00 ~ PM 10:00</span>
                    </div>
                  </div>
                )}

                {/* International Market Exchange Rates */}
                <div className="flex flex-col items-start w-full text-[1.4rem] bg-white mr-[2%] px-5 font-semibold drop-shadow-lg rounded-lg hover:scale-[1.02] border-2 border-white hover:border-blue-200 transition-all duration-300">
                  <div className="flex flex-col items-end justify-between w-full py-2">
                    {/* Header */}
                    <div className="flex justify-between w-full">
                      <span>국제시장 환율</span>
                      {clickNational === 0 && TagSetting(usdData)}
                      {clickNational === 1 && TagSetting(jypData)}
                      {clickNational === 2 && TagSetting(euroData)}
                    </div>

                    {/* National Selection Buttons */}
                    <div className="flex justify-evenly w-full text-center border-2 rounded-md bg-[#EDEDED] text-[1.1rem] space-x-1 mt-1">
                      <div
                        aria-label="미국"
                        className={`w-1/3 transition-all duration-300 rounded-md border-2 ${
                          clickNational === 0 ? 'bg-white scale-105' : 'bg-[#EDEDED] scale-100'
                        } hover:bg-white hover:scale-105 cursor-pointer border-[#EDEDED] hover:border-[#EDEDED]`}
                        onClick={click}
                      >
                        <span>미국</span>
                      </div>
                      <div
                        aria-label="일본"
                        className={`w-1/3 transition-all duration-300 rounded-md border-2 ${
                          clickNational === 1 ? 'bg-white scale-105' : 'bg-[#EDEDED] scale-100'
                        } hover:bg-white hover:scale-105 cursor-pointer border-[#EDEDED] hover:border-[#EDEDED]`}
                        onClick={click}
                      >
                        <span>일본</span>
                      </div>
                      <div
                        aria-label="유럽연합"
                        className={`w-1/3 transition-all duration-300 rounded-md border-2 ${
                          clickNational === 2 ? 'bg-white scale-105' : 'bg-[#EDEDED] scale-100'
                        } hover:bg-white hover:scale-105 cursor-pointer border-[#EDEDED] hover:border-[#EDEDED]`}
                        onClick={click}
                      >
                        <span>유럽연합</span>
                      </div>
                    </div>
                  </div>

                  {/* Chart for Selected National */}
                  <div className="w-full h-[9rem] text-[0.75rem] font-medium">
                    {clickNational === 0 && <ChartComponent data={transformChartDataTypeToCandleData(usdData)} height={200} />}
                    {clickNational === 1 && <ChartComponent data={transformChartDataTypeToCandleData(jypData)} height={200} />}
                    {clickNational === 2 && <ChartComponent data={transformChartDataTypeToCandleData(euroData)} height={200} />}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}

export default Exchange;
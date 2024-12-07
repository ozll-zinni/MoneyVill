import { ChangeEvent, useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import { usePostLoanMutation } from 'Store/api';

interface BankSectionProps {
  setIsClick: React.Dispatch<React.SetStateAction<boolean>>;
  currentMoney: string;
  IntAfterCurrentMoney: number;
  clickBtn: HTMLAudioElement;
  cancelClickBtn: HTMLAudioElement;
  successFxSound: HTMLAudioElement;
  errorFxSound: HTMLAudioElement;
}

function BankSection3({
  setIsClick,
  currentMoney,
  IntAfterCurrentMoney,
  clickBtn,
  cancelClickBtn,
  successFxSound,
  errorFxSound
}: BankSectionProps): JSX.Element {
  const ref = useRef<HTMLInputElement>(null);
  const [loanAmount, setLoanAmount] = useState<string>('0');
  const [isValid, setIsValid] = useState<boolean>(false);
  const [postLoan, { isLoading }] = usePostLoanMutation();

  const nickname = localStorage.getItem('nickname');
  
  useEffect(() => {
    setLoanAmount('0');
    setIsValid(false);
  }, []);

  const handleLoan = async (amount: number) => {
    if (amount <= 0) {
      errorFxSound.play();
      toast.error('유효한 금액을 입력하세요!');
      return;
    }

    try {
      await postLoan({ amount }).unwrap();
      successFxSound.play();
      toast.success('대출 요청이 완료되었습니다!');
      setIsClick(false);
    } catch (error:any) {
      errorFxSound.play();
      const errorMessage = error?.data?.message||'대출 요청에 실패했습니다.'
      toast.error(errorMessage);
    }
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/,/g, '');
    if (/^\d*$/.test(value)) {
      const amount = parseInt(value || '0');
      setLoanAmount(amount.toLocaleString());
      setIsValid(amount > 0);
    }
  };

  const handlePresetClick = (amount: number) => {
    clickBtn.play();
    const currentAmount = parseInt(loanAmount.replace(/,/g, '') || '0');
    const newAmount = currentAmount + amount;
    setLoanAmount(newAmount.toLocaleString());
    setIsValid(newAmount > 0);
  };

  const formatKoreanAmount = (amount: number): string => {
    return `${amount / 10000}만원`;
  };

  return (
    <div className="flex flex-col justify-center bg-white border drop-shadow-2xl w-[75%] max-w-[28rem] md:w-[65%] md:max-w-[29rem] lg:w-[42%] lg:max-w-[35rem] px-7 rounded-xl">
      <div className="flex flex-col items-center w-full pt-3">
        <span className="font-extrabold text-[1.8rem] lg:text-[2.5rem] text-[#748DA6]">대출</span>
        <span className="lg:text-[1rem] text-[0.8rem]">필요한 금액을 입력하고 대출을 신청하세요.</span>
      </div>
      <div className="flex flex-col w-full py-2 lg:py-3">
        <div className="flex justify-between w-full pb-2">
          <div className="flex items-end space-x-2">
            <span className="text-[1.2rem] lg:text-[1.5rem] font-extrabold">대출 금액</span>
          </div>
          <div className="flex items-end space-x-2">
              <span className="text-[0.8rem] lg:text-[0.9rem] pb-[2px]">예금주:</span>
              <span className="font-extrabold text-[1.05rem] lg:text-[1.1rem]">{nickname}</span>
            </div>
        </div>
        <div className="flex flex-col w-full">
          <div className="flex flex-col w-full py-4 bg-[#F0F8FF] rounded-tl-lg rounded-tr-lg">
            <div className="text-[#686868] text-[0.7rem] lg:text-[0.8rem] px-2 flex justify-between">
              <span>대출 요청 금액</span>
              <div
                aria-label="지우기"
                className="transition-all duration-300 cursor-pointer hover:scale-110 active:scale-110"
                onClick={() => {
                  clickBtn.play();
                  setLoanAmount('0');
                  setIsValid(false);
                }}>
                ◀️
              </div>
            </div>
            <div className="flex w-full justify-end pr-2 font-extrabold text-[1.2rem] lg:text-[1.4rem] py-1 space-x-1">
              <input
                ref={ref}
                aria-label="대출 입력"
                maxLength={15}
                className="text-right outline-none placeholder:text-[1.2rem] placeholder:lg:text-[1.4rem] placeholder:text-black bg-[#F0F8FF]"
                type="text"
                placeholder="0"
                value={loanAmount}
                onChange={handleInputChange}
              />
              <span>원</span>
            </div>
          </div>
          <div className="flex w-full justify-end py-[0.75rem] lg:py-[0.79rem] px-2 bg-[#D7E9F7] text-[#464646] text-[0.7rem] lg:text-[0.8rem] rounded-bl-lg rounded-br-lg">
            {[10000, 50000, 100000, 1000000, 10000000].map((amount) => (
              <div
                key={amount}
                aria-label={formatKoreanAmount(amount)}
                className="transition-all duration-150 cursor-pointer hover:scale-105"
                onClick={() => handlePresetClick(amount)}>
                <span className="px-2 border-r-2">+{formatKoreanAmount(amount)}</span>
              </div>
            ))}
            <div
              aria-label="전액"
              className="transition-all duration-150 cursor-pointer hover:scale-105"
              onClick={() => {
                clickBtn.play();
                setLoanAmount(IntAfterCurrentMoney.toLocaleString());
              }}>
              <span className="px-2">전액</span>
            </div>
          </div>
        </div>
      </div>
      <div className="flex justify-center pb-4 space-x-3 font-bold text-white text-[0.8rem] lg:text-[1rem] pt-1 lg:pt-0 mt-1">
        <div
          className="bg-[#B2B9C2] px-8 lg:px-10 rounded-full drop-shadow-lg py-1 hover:scale-105 transition-all duration-300 cursor-pointer"
          onClick={() => {
            cancelClickBtn.play();
            setIsClick((pre) => !pre);
          }}>
          <span>닫기</span>
        </div>
        <div
          aria-label="대출 신청"
          className={`${
            isValid ? 'bg-[#2C94EA]' : 'bg-gray-400'
          } px-8 lg:px-10 rounded-full drop-shadow-lg py-1 hover:scale-105 transition-all duration-300 cursor-pointer`}
          onClick={() => {
            const amount = parseInt(loanAmount.replace(/,/g, '') || '0');
            handleLoan(amount);
          }}>
          <span>대출 신청</span>
        </div>
      </div>
    </div>
  );
}

export default BankSection3;

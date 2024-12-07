import { useGetLoanListQuery, usePostRepaymentMutation } from 'Store/api';
import { toast } from 'react-toastify';

interface BankSectionProps {
  setIsClick: React.Dispatch<React.SetStateAction<boolean>>;
  currentMoney: string;
  IntAfterCurrentMoney: number;
  clickBtn: HTMLAudioElement;
  cancelClickBtn: HTMLAudioElement;
  successFxSound: HTMLAudioElement;
  errorFxSound: HTMLAudioElement;
}

function BankSection4({
  setIsClick,
  currentMoney,
  IntAfterCurrentMoney,
  clickBtn,
  cancelClickBtn,
  successFxSound,
  errorFxSound,
}: BankSectionProps): JSX.Element {
  const { data: loanListResponse, refetch } = useGetLoanListQuery('');
  const [postRepayment, { isLoading: isRepaying }] = usePostRepaymentMutation();

  const handleRepayment = async (loanId: number) => {
    try {
      await postRepayment({ loanId }).unwrap();
      successFxSound.play();
      toast.success('상환이 완료되었습니다!');
      refetch(); // 데이터 새로고침
    } catch (error) {
      errorFxSound.play();
      toast.error('상환 요청에 실패했습니다.');
    }
  };

  return (
    <div className="flex flex-col w-[75%] max-w-[28rem] bg-white px-7 py-5 rounded-xl shadow-xl">
      <h2 className="text-center font-bold text-lg mb-4">대출 상환</h2>
      <ul>
        {loanListResponse?.data?.length ? (
          loanListResponse.data.map((loan) => (
            <li key={loan.id} className="mb-4 border-b pb-4">
              <div className="flex flex-col items-center bg-[#D4EEC1]/60 border-[#92C47E]/60 border-2 rounded-xl p-4 mb-4">
                <div className="text-[#92C47E] text-lg font-extrabold">상환하기</div>
                <p className="text-sm text-[#707070] mt-2">대출 금액과 상환 상태를 확인하세요.</p>
                <div className="flex justify-between items-center w-full mt-4">
                  <span className="font-medium text-base">대출 금액: {loan.amount.toLocaleString()}원</span>
                  <button
                    className="px-6 py-2 text-white bg-[#6EB871]/60 rounded-full font-semibold hover:bg-[#6EB871]/80 transition-all duration-300"
                    onClick={() => handleRepayment(loan.id)}
                    disabled={isRepaying}>
                    {isRepaying ? '상환 중...' : '상환하기'}
                  </button>
                </div>
              </div>
            </li>
          ))
        ) : (
          <li className="flex flex-col items-center bg-[#E2F5E6]/60 border-[#A1D8A5]/60 border-2 rounded-xl p-4 mb-4">
            <div className="text-[#6EB871] text-lg font-extrabold">대출 내역이 없습니다.</div>
          </li>
        )}
      </ul>
      <button
        className="mt-4 bg-[#6EB871]/60 text-white px-4 py-2 rounded w-full hover:bg-[#6EB871]/80 transition-all duration-300"
        onClick={() => {
          setIsClick(false);
          cancelClickBtn.play();
        }}>
        닫기
      </button>
    </div>
  );
}

export default BankSection4;

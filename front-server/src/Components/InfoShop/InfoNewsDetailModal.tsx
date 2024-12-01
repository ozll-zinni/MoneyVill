import { Dialog, Transition } from '@headlessui/react';
import { Fragment, useEffect, useState } from 'react';

interface ModalInterFace {
  propsData: { color: string; content: string; date: string; kind: string };
  closeModal: () => void;
  isOpen: boolean;
}

export default function InfoNewsDetailModal({ closeModal, propsData, isOpen }: ModalInterFace) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [src, setSrc] = useState('');

  // 이미지 로딩상태 체크
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      setIsLoaded(true);
      setSrc('/images/icons/newspaper2.png');
    };
    img.src = '/images/icons/newspaper2.png';
  }, []);

  return (
    <>
      {isLoaded && (
        <Transition appear show={isOpen} as={Fragment}>
          <Dialog as="div" className="relative z-[70]" onClose={closeModal}>
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100"
              leaveTo="opacity-0">
              <div className="fixed inset-0 bg-black bg-opacity-50 " />
            </Transition.Child>

            <div className="fixed inset-0 overflow-y-auto">
              <div className="flex items-center justify-center min-h-full text-center">
                <Transition.Child
                  as={Fragment}
                  enter="ease-out duration-300"
                  enterFrom="opacity-0 scale-0"
                  enterTo="opacity-100 scale-100"
                  leave="ease-in duration-200"
                  leaveFrom="opacity-100 scale-100"
                  leaveTo="opacity-0 scale-0">
                  <Dialog.Panel className="w-full max-w-[70vw] p-4 pt-6 overflow-hidden align-middle transition-all transform bg-white shadow-xl lg:p-6 lg:pt-10 lg:max-w-xl rounded-2xl">
                    <img
                      aria-label="나가기"
                      onClick={closeModal}
                      src={'images/chatting/cancelBlack.png'}
                      className="absolute w-4 h-4 cursor-pointer opacity-60 lg:w-6 lg:h-6 top-2 right-2 hover:opacity-80"
                      alt="cancelBlack"
                    />
                    {/* <div className="flex items-end justify-between h-fit">
                      <span className={`${propsData.color} text-white w-1/6 font-medium lg:font-bold`}>
                        {propsData.kind}
                      </span>
                      <span>{propsData.date}</span>
                    </div> */}
                    <div className="flex justify-center w-full">
                      <div className="relative">
                        <img className="w-full h-auto" src={src} alt="news" />
                        <div className="absolute top-1/3 left-12 px-4 text-l text-gray-600 break-keep lg:text-2l">{propsData.kind}</div>
                        <div className="absolute top-1/3 right-12 px-4 text-l text-gray-600 break-keep lg:text-2l">{propsData.date}</div>
                        <div className="w-1/2 absolute top-1/2 left-1/4 px-4 text-xl text-gray-600 break-keep lg:text-2xl">{propsData.content}</div>
                      </div>
                    </div>
                  </Dialog.Panel>
                </Transition.Child>
              </div>
            </div>
          </Dialog>
        </Transition>
      )}
    </>
  );
}

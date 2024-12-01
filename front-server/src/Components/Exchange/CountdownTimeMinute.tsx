// import { useEffect, useState } from 'react';

// function CountdownTimeMinute(): JSX.Element {
//   const date = new Date();
//   // const [time, setTime] = useState<{ minutes: number; seconds: number }>({
//   //   minutes: 4 - ((date.getMinutes() % 4) % 4) - 1,
//   //   seconds: 60 - date.getSeconds() - 1
//   // });
//   const [time, setTime] = useState<{ seconds: number }>({
//     seconds: 30 - date.getSeconds() - 1
//   });
//   const day = date.getDay();

//   useEffect(() => {
//     const date = new Date();
//     const hours = date.getHours();
//     const minutes = date.getMinutes();
//     if (day === 0) {
//       setTime({ seconds: 0 });
//     } else {
//       if (hours >= 23) {
//         setTime({  seconds: 0 });
//       } else {
//         setTime({
//           seconds: 30 - date.getSeconds() - 1
//         });
//         const intervalId = setInterval(() => {
//           setTime((preTime) => {
//             const { seconds } = preTime;
//             if (seconds === 0) {
//               return { seconds: 29 };
//             } else {
//               return { minutes: minutes, seconds: seconds - 1 };
//             }
//           });
//         }, 1000);
//         return () => clearInterval(intervalId);
//       }
//     }
//   }, []);
//   return (
//     <>
//       {time.seconds.toString().padStart(2, '0')}
//     </>
//   );
// }

// export default CountdownTimeMinute;


import { useEffect, useState } from 'react';

function CountdownTimeMinute(): JSX.Element {
  const date = new Date();
  const [time, setTime] = useState<{ seconds: number }>({
    seconds: 60 - date.getSeconds() - 1
  });
  const day = date.getDay();

  useEffect(() => {
    const date = new Date();
    setTime({
      seconds: (60 - date.getSeconds() - 1)%30
    });
    const intervalId = setInterval(() => {
      setTime((preTime) => {
        const { seconds } = preTime;
        if (seconds === 0) {
          return { seconds: 29 };
        } else {
          return { seconds: seconds - 1 };
        }
      });
    }, 1000);
    return () => clearInterval(intervalId);
  }, []);
  return (
    <>
      {time.seconds.toString().padStart(2, '0')}
    </>
  );
}

export default CountdownTimeMinute;
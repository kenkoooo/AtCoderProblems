import React, { useEffect, useState } from "react";
import { formatDuration } from "../utils/DateUtil";

export default (props: { remain: number }) => {
  const [timeLeft, setTimeLeft] = useState(props.remain);
  useEffect(() => {
    if (timeLeft <= 0) {
      return;
    }
    const intervalId = setInterval(() => {
      setTimeLeft(timeLeft - 1);
    }, 1000);
    return () => clearInterval(intervalId);
  }, [timeLeft]);
  if (timeLeft <= 0) {
    return null;
  }
  return <span>{formatDuration(timeLeft)}</span>;
};

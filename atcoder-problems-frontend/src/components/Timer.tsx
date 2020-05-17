import React, { useEffect, useState } from "react";
import { formatDuration } from "../utils/DateUtil";

interface Props {
  remain: number;
}

export const Timer: React.FC<Props> = (props) => {
  const [timeLeft, setTimeLeft] = useState(props.remain);
  useEffect(() => {
    if (timeLeft <= 0) {
      return;
    }
    const intervalId = setInterval(() => {
      setTimeLeft(timeLeft - 1);
    }, 1000);
    return (): void => clearInterval(intervalId);
  }, [timeLeft]);
  if (timeLeft <= 0) {
    return null;
  }
  return <span>{formatDuration(timeLeft)}</span>;
};

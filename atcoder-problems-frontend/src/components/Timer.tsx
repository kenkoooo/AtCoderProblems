import React, { useEffect, useState } from "react";
import { formatDuration, getNowMillis } from "../utils/DateUtil";

interface Props {
  end: number;
}

export const Timer: React.FC<Props> = (props) => {
  const [timeLeft, setTimeLeft] = useState(props.end - getNowMillis());
  useEffect(() => {
    if (timeLeft <= 0) {
      return;
    }
    const intervalId = setInterval(() => {
      setTimeLeft(props.end - getNowMillis());
    }, 1000);
    return (): void => clearInterval(intervalId);
  }, [timeLeft, props.end]);
  if (timeLeft <= 0) {
    return null;
  }
  return <span>{formatDuration(timeLeft)}</span>;
};

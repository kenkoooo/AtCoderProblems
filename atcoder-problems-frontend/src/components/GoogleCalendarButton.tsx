import React from "react";
import { Button } from "reactstrap";

interface Props {
  contestId: string;
  title: string;
  startEpochSecond: number;
  endEpochSecond: number;
}

/**
 * Google Calendar accepts a subset of ISO 8601 combined date and time.
 * Ref. https://stackoverflow.com/a/41733538
 * @param epochSeconds Date to format in epoch seconds.
 * @return Date formatted to generate Google Calendar URL.
 */
const formatDateForGoogleCalendar = (epochSeconds: number): string =>
  new Date(epochSeconds * 1000).toISOString().replace(/[^0-9TZ]/g, "");

export const GoogleCalendarButton: React.FC<Props> = (props) => {
  const internalUrl = `https://kenkoooo.com/atcoder/#/contest/show/${props.contestId}`;
  const startDate = formatDateForGoogleCalendar(props.startEpochSecond);
  const endDate = formatDateForGoogleCalendar(props.endEpochSecond);
  const shareUrl = `https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
    props.title
  )}&dates=${startDate}/${endDate}&location=${encodeURIComponent(internalUrl)}`;
  return (
    <Button
      href={shareUrl}
      rel="noopener noreferrer"
      target="_blank"
      color="primary"
    >
      Add to Google Calendar
    </Button>
  );
};

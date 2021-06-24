import useSWR, { SWRConfiguration, useSWRInfinite } from "swr";

export const useSWRData = <T>(
  url: string,
  fetcher: (url: string) => Promise<T>,
  config: SWRConfiguration<T> = {}
) => {
  return useSWR(url, fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    refreshWhenHidden: true,
    ...config,
  });
};

export const useSWRDataInfinite = <T>(
  getKey: (pageIndex: number, previousData: T | null) => string | null,
  fetcher: (url: string) => Promise<T>,
  initialSize: number,
  config: SWRConfiguration<T[]> = {}
) => {
  return useSWRInfinite(getKey, fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    refreshWhenHidden: true,
    initialSize: initialSize,
    ...config,
  });
};

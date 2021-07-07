import useSWR, { SWRConfiguration } from "swr";

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

export const typeCastFetcher = <T>(url: string) =>
  fetch(url)
    .then((response) => response.json())
    .then((response) => response as T);

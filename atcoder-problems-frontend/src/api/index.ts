import useSWR, { SWRConfiguration } from "swr";

export const useSWRData = <T>(
  url: string,
  fetcher: (url: string) => Promise<T>,
  config: SWRConfiguration<T> = {}
) => {
  const response = useSWR(url, fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    ...config,
  });
  const failed = !!response.error;
  const fulfilled = !!response.data || !!response.error;
  return { failed, fulfilled, ...response };
};

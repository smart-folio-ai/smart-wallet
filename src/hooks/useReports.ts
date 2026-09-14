import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {reportsService, type ReportFormat, type ReportFrequency, type ReportKind} from '@/server/api/api';

const SCHEDULES_KEY = ['report-schedules'] as const;

function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

/** Nome vem do Content-Disposition do server; sem ele, monta um previsível. */
function filenameFrom(disposition: string | undefined, fallback: string) {
  const match = disposition?.match(/filename="?([^";]+)"?/);
  return match?.[1] ?? fallback;
}

export function useDownloadReport() {
  return useMutation({
    mutationFn: async ({kind, format, year}: {kind: ReportKind; format: ReportFormat; year: number}) => {
      const response = await reportsService.download(kind, format, year);
      saveBlob(response.data, filenameFrom(response.headers?.['content-disposition'], `${kind}-${year}.${format}`));
    },
  });
}

export function useReportSchedules() {
  return useQuery({
    queryKey: SCHEDULES_KEY,
    queryFn: async () => (await reportsService.listSchedules()).data,
  });
}

export function useCreateReportSchedule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {kind: ReportKind; format: ReportFormat; frequency: ReportFrequency}) =>
      reportsService.createSchedule(data),
    onSuccess: () => queryClient.invalidateQueries({queryKey: SCHEDULES_KEY}),
  });
}

export function useSetReportScheduleStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({id, status}: {id: string; status: 'active' | 'paused'}) =>
      reportsService.setScheduleStatus(id, status),
    onSuccess: () => queryClient.invalidateQueries({queryKey: SCHEDULES_KEY}),
  });
}

export function useDeleteReportSchedule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => reportsService.deleteSchedule(id),
    onSuccess: () => queryClient.invalidateQueries({queryKey: SCHEDULES_KEY}),
  });
}

/** Mensagem da API (400/409) para o toast, quando houver. */
export async function apiErrorMessage(error: unknown): Promise<string | undefined> {
  const data = (error as {response?: {data?: unknown}})?.response?.data;
  // Download pede blob: o erro também chega como blob JSON.
  let payload = data;
  if (data instanceof Blob) {
    try {
      payload = JSON.parse(await data.text());
    } catch {
      payload = undefined;
    }
  }
  const message = (payload as {message?: string | string[]} | undefined)?.message;
  return Array.isArray(message) ? message[0] : message;
}

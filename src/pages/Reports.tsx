import {useReducer, useState, type CSSProperties} from 'react';
import {Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle} from '@/components/ui/dialog';
import {badgeStyle} from '@/components/shared/badge-style';
import useAppToast from '@/hooks/use-app-toast';
import {useCurrentUserProfile} from '@/hooks/useCurrentUserProfile';
import {
  apiErrorMessage,
  useCreateReportSchedule,
  useDeleteReportSchedule,
  useDownloadReport,
  useReportSchedules,
  useSetReportScheduleStatus,
} from '@/hooks/useReports';
import type {ReportFormat, ReportFrequency, ReportKind, ReportSchedule} from '@/server/api/api';
import {
  FREQUENCY_LABELS,
  REPORT_TYPES,
  defaultYearFor,
  formatLabel,
  reportTypeOf,
  type ReportTint,
  type ReportType,
} from '@/services/reports/report-catalog';

const TINT: Record<ReportTint, {bg: string; border: string; color: string}> = {
  pos: {bg: 'rgba(47,214,163,0.14)', border: 'rgba(47,214,163,0.30)', color: 'var(--pos)'},
  warn: {bg: 'rgba(240,179,46,0.14)', border: 'rgba(240,179,46,0.30)', color: 'var(--warn)'},
  accent: {bg: 'rgba(152,160,171,0.14)', border: 'rgba(152,160,171,0.30)', color: 'var(--color-accent-200)'},
};

const cardStyle: CSSProperties = {border: '1px solid var(--hair)', borderRadius: 8, background: 'var(--nk-card)'};
const fieldStyle: CSSProperties = {
  height: 34,
  padding: '0 11.2px',
  border: '1px solid var(--hair)',
  borderRadius: 8,
  background: 'rgba(var(--rgb-bg),0.6)',
  color: 'var(--color-text)',
  fontFamily: 'var(--font-body)',
  fontSize: 12.5,
  width: '100%',
};

function ReportCard({type}: {type: ReportType}) {
  const toast = useAppToast();
  const [format, setFormat] = useState<ReportFormat>(type.formats[0]);
  const download = useDownloadReport();
  const year = defaultYearFor(type);

  const generate = () =>
    download.mutate(
      {kind: type.kind, format, year},
      {
        onSuccess: () => toast.success(`${type.title} pronto`, `Arquivo ${formatLabel(format)} de ${year} baixado.`),
        onError: async (error) =>
          toast.error('Não foi possível gerar o relatório', (await apiErrorMessage(error)) ?? 'Tente novamente em instantes.'),
      },
    );

  const tint = TINT[type.tint];
  return (
    <section style={{...cardStyle, padding: 16.8, display: 'flex', flexDirection: 'column'}} data-testid={`report-${type.kind}`}>
      <div style={{display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 11.2}}>
        <div style={{width: 34, height: 34, borderRadius: 8, background: tint.bg, border: `1px solid ${tint.border}`, display: 'grid', placeItems: 'center'}}>
          <i className={type.icon} style={{fontSize: 16, color: tint.color}} aria-hidden />
        </div>
        <div role="group" aria-label={`Formato de ${type.title}`} style={{display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--color-neutral-600)'}}>
          {type.formats.map((option, index) => (
            <span key={option} style={{display: 'contents'}}>
              {index > 0 && <span aria-hidden>·</span>}
              {type.formats.length > 1 ? (
                <button
                  type="button"
                  aria-pressed={format === option}
                  onClick={() => setFormat(option)}
                  style={{border: 'none', background: 'transparent', padding: 0, cursor: 'pointer', font: 'inherit', letterSpacing: 'inherit', textTransform: 'inherit', color: format === option ? 'var(--color-accent-200)' : 'var(--color-neutral-600)', fontWeight: format === option ? 600 : 400}}>
                  {formatLabel(option)}
                </button>
              ) : (
                <span>{formatLabel(option)}</span>
              )}
            </span>
          ))}
        </div>
      </div>
      <h2 style={{fontFamily: 'var(--font-heading)', fontSize: 15, fontWeight: 600, margin: '14px 0 0'}}>{type.title}</h2>
      <div style={{fontSize: 12, color: 'var(--color-neutral-400)', marginTop: 5.6, lineHeight: 1.55, minHeight: 54}}>{type.body}</div>
      <button
        type="button"
        onClick={generate}
        disabled={download.isPending}
        className={type.primary ? 'hover:brightness-[1.08]' : 'hover:bg-[rgba(152,160,171,0.12)]'}
        style={{
          marginTop: 14,
          height: 34,
          borderRadius: 8,
          cursor: download.isPending ? 'progress' : 'pointer',
          fontFamily: 'var(--font-body)',
          fontSize: 12,
          fontWeight: type.primary ? 600 : 500,
          ...(download.isPending ? {animation: 'pulse 1.1s ease-in-out infinite'} : {}),
          ...(type.primary
            ? {border: 'none', background: 'var(--grad-violet)', color: 'var(--sunk)'}
            : {border: '1px solid var(--color-accent-700)', background: 'transparent', color: 'var(--color-accent-200)'}),
        }}>
        {download.isPending ? 'Gerando…' : 'Gerar agora'}
      </button>
    </section>
  );
}

interface ScheduleForm {
  kind: ReportKind;
  format: ReportFormat;
  frequency: ReportFrequency;
}

type ScheduleFormAction = {type: 'kind'; kind: ReportKind} | {type: 'format'; format: ReportFormat} | {type: 'frequency'; frequency: ReportFrequency};

const initialScheduleForm: ScheduleForm = {kind: 'portfolio', format: 'pdf', frequency: 'monthly'};

function scheduleFormReducer(state: ScheduleForm, action: ScheduleFormAction): ScheduleForm {
  switch (action.type) {
    case 'kind':
      // Troca o formato junto: nem todo relatório tem o formato escolhido antes.
      return {...state, kind: action.kind, format: reportTypeOf(action.kind).formats[0]};
    case 'format':
      return {...state, format: action.format};
    case 'frequency':
      return {...state, frequency: action.frequency};
  }
}

function NewScheduleDialog({open, onOpenChange, email}: {open: boolean; onOpenChange: (open: boolean) => void; email?: string}) {
  const toast = useAppToast();
  const [form, dispatch] = useReducer(scheduleFormReducer, initialScheduleForm);
  const create = useCreateReportSchedule();

  const submit = () =>
    create.mutate(form, {
      onSuccess: () => {
        toast.success('Agendamento criado', `${reportTypeOf(form.kind).title} · ${FREQUENCY_LABELS[form.frequency]}.`);
        onOpenChange(false);
      },
      onError: async (error) =>
        toast.error('Não foi possível agendar', (await apiErrorMessage(error)) ?? 'Tente novamente em instantes.'),
    });

  const label = (text: string) => <span style={{fontSize: 11.5, color: 'var(--color-neutral-400)'}}>{text}</span>;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Novo agendamento</DialogTitle>
          <DialogDescription>
            O relatório chega por e-mail{email ? ` em ${email}` : ''}, com o arquivo anexo, às 08:00.
          </DialogDescription>
        </DialogHeader>
        <div style={{display: 'flex', flexDirection: 'column', gap: 11.2}}>
          <label style={{display: 'flex', flexDirection: 'column', gap: 5.6}}>
            {label('Relatório')}
            <select aria-label="Relatório" value={form.kind} onChange={(e) => dispatch({type: 'kind', kind: e.target.value as ReportKind})} style={fieldStyle}>
              {REPORT_TYPES.map((type) => (
                <option key={type.kind} value={type.kind}>
                  {type.title}
                </option>
              ))}
            </select>
          </label>
          <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 11.2}}>
            <label style={{display: 'flex', flexDirection: 'column', gap: 5.6}}>
              {label('Formato')}
              <select aria-label="Formato" value={form.format} onChange={(e) => dispatch({type: 'format', format: e.target.value as ReportFormat})} style={fieldStyle}>
                {reportTypeOf(form.kind).formats.map((format) => (
                  <option key={format} value={format}>
                    {formatLabel(format)}
                  </option>
                ))}
              </select>
            </label>
            <label style={{display: 'flex', flexDirection: 'column', gap: 5.6}}>
              {label('Frequência')}
              <select aria-label="Frequência" value={form.frequency} onChange={(e) => dispatch({type: 'frequency', frequency: e.target.value as ReportFrequency})} style={fieldStyle}>
                {(Object.keys(FREQUENCY_LABELS) as ReportFrequency[]).map((frequency) => (
                  <option key={frequency} value={frequency}>
                    {FREQUENCY_LABELS[frequency]}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div style={{fontSize: 11, color: 'var(--color-neutral-500)', lineHeight: 1.5}}>
            Semanal às segundas, mensal no dia 1, trimestral no início do trimestre e anual em 5 de janeiro, com o ano fechado.
          </div>
          <button
            type="button"
            onClick={submit}
            disabled={create.isPending}
            className="hover:brightness-[1.08] disabled:opacity-60"
            style={{height: 34, borderRadius: 8, border: 'none', background: 'var(--grad-violet)', color: 'var(--sunk)', fontFamily: 'var(--font-body)', fontSize: 12.5, fontWeight: 600, cursor: 'pointer'}}>
            {create.isPending ? 'Agendando…' : 'Agendar'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

const shortDate = (iso: string) => new Date(iso).toLocaleDateString('pt-BR', {day: '2-digit', month: '2-digit'});

function ScheduleRow({schedule, email}: {schedule: ReportSchedule; email?: string}) {
  const toast = useAppToast();
  const setStatus = useSetReportScheduleStatus();
  const remove = useDeleteReportSchedule();
  const paused = schedule.status === 'paused';
  const failed = !paused && Boolean(schedule.lastError);

  const meta = paused
    ? `pausado por você em ${shortDate(schedule.pausedAt ?? new Date().toISOString())}`
    : failed
      ? 'a última entrega falhou — tentamos de novo na próxima data'
      : `${formatLabel(schedule.format)} para ${email ?? 'o e-mail da conta'}`;

  const iconButton: CSSProperties = {width: 26, height: 26, borderRadius: 6, border: '1px solid var(--hair)', background: 'transparent', color: 'var(--color-neutral-400)', cursor: 'pointer', display: 'grid', placeItems: 'center'};

  return (
    <div style={{display: 'flex', alignItems: 'center', gap: 11.2, padding: '9.8px 16.8px'}} data-testid="report-schedule">
      <i className={paused ? 'ph ph-calendar-blank' : failed ? 'ph ph-calendar-x' : 'ph ph-calendar-check'} style={{fontSize: 15, color: 'var(--color-accent-300)'}} aria-hidden />
      <div style={{flex: 1, minWidth: 0}}>
        <div style={{fontSize: 12.5, color: 'var(--color-neutral-200)'}}>
          {schedule.title} · {FREQUENCY_LABELS[schedule.frequency]}
        </div>
        <div style={{fontSize: 10.5, color: 'var(--color-neutral-600)', marginTop: 2}}>{meta}</div>
      </div>
      <span style={{fontSize: 11, color: 'var(--color-neutral-500)', fontVariantNumeric: 'tabular-nums'}}>
        {schedule.nextRunAt ? shortDate(schedule.nextRunAt) : '—'}
      </span>
      <span style={badgeStyle(paused ? 'info' : failed ? 'warn' : 'ok')}>{paused ? 'Pausado' : failed ? 'Atenção' : 'Ativo'}</span>
      <button
        type="button"
        aria-label={paused ? `Retomar ${schedule.title}` : `Pausar ${schedule.title}`}
        disabled={setStatus.isPending}
        onClick={() => setStatus.mutate({id: schedule.id, status: paused ? 'active' : 'paused'})}
        className="hover:text-[color:var(--color-neutral-100)]"
        style={iconButton}>
        <i className={paused ? 'ph ph-play' : 'ph ph-pause'} style={{fontSize: 12}} aria-hidden />
      </button>
      <button
        type="button"
        aria-label={`Apagar ${schedule.title}`}
        disabled={remove.isPending}
        onClick={() =>
          remove.mutate(schedule.id, {
            onSuccess: () => toast.success('Agendamento apagado', `${schedule.title} não será mais enviado.`),
            onError: () => toast.error('Não foi possível apagar', 'Tente novamente em instantes.'),
          })
        }
        className="hover:text-[color:var(--neg)]"
        style={iconButton}>
        <i className="ph ph-trash" style={{fontSize: 12}} aria-hidden />
      </button>
    </div>
  );
}

/** Relatórios — bloco `isReports` de design_handoff_trackerr/Trackerr App.dc.html. */
export default function Reports() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const schedules = useReportSchedules();
  const profile = useCurrentUserProfile();
  const email = (profile.data as {email?: string} | undefined)?.email;

  return (
    <div style={{display: 'flex', flexDirection: 'column', gap: 16.8}}>
      <div className="grid grid-cols-1 gap-[16.8px] md:grid-cols-2 xl:grid-cols-3">
        {REPORT_TYPES.map((type) => (
          <ReportCard key={type.kind} type={type} />
        ))}
      </div>

      <section style={cardStyle}>
        <div style={{padding: '14px 16.8px', borderBottom: '1px solid var(--hair-soft)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 11.2}}>
          <div>
            <h2 style={{fontFamily: 'var(--font-heading)', fontSize: 14, fontWeight: 600, margin: 0}}>Agendamentos e entregas</h2>
            <div style={{fontSize: 11, color: 'var(--color-neutral-600)', marginTop: 2}}>Relatórios que chegam por e-mail sem você pedir</div>
          </div>
          <button
            type="button"
            onClick={() => setDialogOpen(true)}
            className="hover:bg-[rgba(152,160,171,0.12)]"
            style={{height: 30, padding: '0 11.2px', borderRadius: 8, border: '1px solid var(--color-accent-700)', background: 'transparent', color: 'var(--color-accent-200)', fontFamily: 'var(--font-body)', fontSize: 11.5, cursor: 'pointer'}}>
            Novo agendamento
          </button>
        </div>
        <div style={{padding: '5.6px 0'}}>
          {schedules.isLoading && <div style={{padding: '9.8px 16.8px', fontSize: 12, color: 'var(--color-neutral-500)'}}>Carregando agendamentos…</div>}
          {schedules.isError && (
            <div style={{padding: '9.8px 16.8px', fontSize: 12, color: 'var(--neg)'}}>
              Não foi possível carregar os agendamentos.{' '}
              <button type="button" onClick={() => schedules.refetch()} style={{border: 'none', background: 'transparent', color: 'var(--color-accent-200)', cursor: 'pointer', padding: 0, font: 'inherit'}}>
                Tentar de novo
              </button>
            </div>
          )}
          {schedules.data?.length === 0 && (
            <div style={{padding: '9.8px 16.8px', fontSize: 12, color: 'var(--color-neutral-500)'}}>
              Nenhum agendamento ainda. Receba a carteira todo mês ou a apuração fiscal ao fechar o ano.
            </div>
          )}
          {schedules.data?.map((schedule) => (
            <ScheduleRow key={schedule.id} schedule={schedule} email={email} />
          ))}
        </div>
      </section>

      <NewScheduleDialog open={dialogOpen} onOpenChange={setDialogOpen} email={email} />
    </div>
  );
}

import {useReducer, useRef, useState, type ChangeEvent} from 'react';
import {z} from 'zod';
import useAppToast from '@/hooks/use-app-toast';
import {
  useAccountSettings,
  useSavePersonalData,
  useUploadAvatar,
} from '@/hooks/useAccountSettings';
import type {PersonalData} from '@/services/settings/account-settings';
import {
  ACCENT_SMALL_BUTTON_CLASS,
  ACCENT_SMALL_BUTTON_STYLE,
  CARD_STYLE,
  INPUT_STYLE,
  OUTLINE_BUTTON_CLASS,
  OUTLINE_BUTTON_STYLE,
  PRIMARY_BUTTON_CLASS,
  PRIMARY_BUTTON_STYLE,
  SettingsCardHeader,
} from './settings-ui';

const MAX_AVATAR_BYTES = 5 * 1024 * 1024;

const personalDataSchema = z.object({
  firstName: z.string().trim().min(2, 'Digite um nome válido'),
  lastName: z.string().trim().min(2, 'Digite um sobrenome válido'),
  email: z.string().trim().email('Digite um e-mail válido'),
});

type AddressField = keyof PersonalData['address'];
type TopField = 'firstName' | 'lastName' | 'email';

type FormAction =
  | {type: 'field'; field: TopField; value: string}
  | {type: 'address'; field: AddressField; value: string}
  | {type: 'reset'; value: PersonalData};

function formReducer(state: PersonalData, action: FormAction): PersonalData {
  switch (action.type) {
    case 'field':
      return {...state, [action.field]: action.value};
    case 'address':
      return {...state, address: {...state.address, [action.field]: action.value}};
    case 'reset':
      return action.value;
  }
}

const formatCpf = (value: string) =>
  value
    .replace(/\D/g, '')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})/, '$1-$2')
    .replace(/(-\d{2})\d+?$/, '$1');

const formatZipCode = (value: string) =>
  value
    .replace(/\D/g, '')
    .replace(/(\d{5})(\d)/, '$1-$2')
    .replace(/(-\d{3})\d+?$/, '$1');

const formatMemberSince = (iso: string) =>
  new Date(iso).toLocaleDateString('pt-BR', {month: 'long', year: 'numeric'});

interface FieldProps {
  id: string;
  label: string;
  hint?: string;
  value: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  type?: string;
  wide?: boolean;
}

function Field({id, label, hint, value, onChange, disabled, placeholder, type = 'text', wide}: FieldProps) {
  return (
    <label htmlFor={id} style={{display: 'flex', flexDirection: 'column', gap: 5.6, gridColumn: wide ? '1 / -1' : undefined}}>
      <span style={{fontSize: 11.5, color: 'var(--color-neutral-400)'}}>{label}</span>
      <input
        id={id}
        type={type}
        value={value}
        disabled={disabled}
        placeholder={placeholder}
        onChange={(event) => onChange?.(event.target.value)}
        style={{...INPUT_STYLE, opacity: disabled ? 0.7 : 1}}
      />
      {hint ? <span style={{fontSize: 10.5, color: 'var(--color-neutral-600)'}}>{hint}</span> : null}
    </label>
  );
}

function AvatarButton({initials}: {initials: string}) {
  const toast = useAppToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const upload = useUploadAvatar();

  const handleFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (file.size > MAX_AVATAR_BYTES) {
      toast.error('Arquivo muito grande', 'A imagem deve ter no máximo 5MB.');
      return;
    }
    setPreview(URL.createObjectURL(file));
    upload.mutate(file, {onError: () => setPreview(null)});
  };

  return (
    <>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={upload.isPending}
        className={ACCENT_SMALL_BUTTON_CLASS}
        style={ACCENT_SMALL_BUTTON_STYLE}>
        <span
          aria-hidden="true"
          style={{width: 18, height: 18, borderRadius: '50%', overflow: 'hidden', display: 'grid', placeItems: 'center', fontSize: 8.5, fontWeight: 600, background: 'rgba(var(--rgb-bg),0.6)', border: '1px solid var(--hair)'}}>
          {preview ? <img src={preview} alt="" style={{width: '100%', height: '100%', objectFit: 'cover'}} /> : initials}
        </span>
        {upload.isPending ? 'Enviando…' : 'Alterar foto'}
      </button>
      <input
        ref={inputRef}
        type="file"
        aria-label="Foto de perfil"
        accept="image/jpg,image/jpeg,image/png,image/webp"
        style={{display: 'none'}}
        onChange={handleFile}
      />
    </>
  );
}

function PersonalDataForm({initial}: {initial: PersonalData}) {
  const toast = useAppToast();
  const [form, dispatch] = useReducer(formReducer, initial);
  const save = useSavePersonalData();
  const isDirty = JSON.stringify(form) !== JSON.stringify(initial);

  const setField = (field: TopField) => (value: string) => dispatch({type: 'field', field, value});
  const setAddress = (field: AddressField, format?: (v: string) => string) => (value: string) =>
    dispatch({type: 'address', field, value: format ? format(value) : value});

  const handleSave = () => {
    const parsed = personalDataSchema.safeParse(form);
    if (!parsed.success) {
      toast.error('Revise seus dados', parsed.error.issues[0]?.message);
      return;
    }
    const {street, number, city, state, zipCode} = form.address;
    const addressValues = [street, number, city, state, zipCode];
    if (addressValues.some(Boolean) && !addressValues.every(Boolean)) {
      toast.error('Endereço incompleto', 'Preencha rua, número, cidade, estado e CEP.');
      return;
    }
    save.mutate(form);
  };

  return (
    <>
      <div style={{padding: 16.8, display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 14}}>
        <Field id="settings-first-name" label="Nome" value={form.firstName} onChange={setField('firstName')} />
        <Field id="settings-last-name" label="Sobrenome" value={form.lastName} onChange={setField('lastName')} />
        <Field id="settings-email" label="E-mail" type="email" hint="usado no login e nos avisos por e-mail" value={form.email} onChange={setField('email')} />
        <Field id="settings-cpf" label="CPF" hint="não pode ser alterado por aqui" value={formatCpf(form.cpf)} disabled />
        <Field id="settings-street" label="Rua" wide value={form.address.street} onChange={setAddress('street')} />
        <Field id="settings-number" label="Número" value={form.address.number} onChange={setAddress('number')} />
        <Field id="settings-complement" label="Complemento" hint="opcional" value={form.address.complement} onChange={setAddress('complement')} />
        <Field id="settings-city" label="Cidade" value={form.address.city} onChange={setAddress('city')} />
        <Field id="settings-state" label="Estado" placeholder="SP" value={form.address.state} onChange={setAddress('state')} />
        <Field id="settings-zip" label="CEP" value={form.address.zipCode} onChange={setAddress('zipCode', formatZipCode)} />
      </div>
      <div style={{display: 'flex', gap: 8.4, padding: '0 16.8px 16.8px'}}>
        <button type="button" onClick={handleSave} disabled={save.isPending} className={PRIMARY_BUTTON_CLASS} style={PRIMARY_BUTTON_STYLE}>
          {save.isPending ? 'Salvando…' : 'Salvar dados'}
        </button>
        <button
          type="button"
          onClick={() => dispatch({type: 'reset', value: initial})}
          disabled={!isDirty || save.isPending}
          className={OUTLINE_BUTTON_CLASS}
          style={OUTLINE_BUTTON_STYLE}>
          Descartar alterações
        </button>
      </div>
    </>
  );
}

export function PersonalDataCard() {
  const {data, isLoading, isError} = useAccountSettings();
  const initials = data
    ? `${data.personalData.firstName[0] ?? ''}${data.personalData.lastName[0] ?? ''}`.toUpperCase() || '?'
    : '?';

  return (
    <section style={CARD_STYLE}>
      <SettingsCardHeader
        title="Dados pessoais"
        subtitle={data?.memberSince ? `Membro desde ${formatMemberSince(data.memberSince)}` : 'Nome, e-mail e endereço da conta'}
        action={data ? <AvatarButton initials={initials} /> : null}
      />
      {data ? (
        // A chave remonta o formulário quando o servidor devolve dados novos,
        // sem precisar sincronizar estado local com efeito.
        <PersonalDataForm key={JSON.stringify(data.personalData)} initial={data.personalData} />
      ) : (
        <div style={{padding: 16.8, fontSize: 12, color: 'var(--color-neutral-500)'}}>
          {isLoading && !isError ? 'Carregando seus dados…' : 'Não foi possível carregar seus dados agora. Tente novamente em instantes.'}
        </div>
      )}
    </section>
  );
}

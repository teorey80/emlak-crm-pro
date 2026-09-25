import { getGoogleDriveToken } from './googleWorkspaceService';

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  webViewLink: string;
  thumbnailLink?: string;
  size?: string;
}

type PickerFile = { id: string; name: string; mimeType: string };
type PickerData = { action: string; docs?: PickerFile[] };
type PickerApi = {
  Action: { PICKED: string; CANCEL: string };
  ViewId: { DOCS: string };
  PickerBuilder: new () => {
    addView: (view: string) => PickerBuilder;
    setOAuthToken: (token: string) => PickerBuilder;
    setDeveloperKey: (key: string) => PickerBuilder;
    setAppId: (id: string) => PickerBuilder;
    setCallback: (callback: (data: PickerData) => void) => PickerBuilder;
    build: () => { setVisible: (visible: boolean) => void };
  };
};
type PickerBuilder = InstanceType<PickerApi['PickerBuilder']>;

declare global { interface Window { gapi?: { load: (modules: string, callback: () => void) => void } } }

let pickerLoader: Promise<PickerApi> | null = null;
function loadPicker(): Promise<PickerApi> {
  if (pickerLoader) return pickerLoader;
  pickerLoader = new Promise((resolve, reject) => {
    const api = () => (window as unknown as { google?: { picker?: PickerApi } }).google?.picker;
    if (api()) { resolve(api()!); return; }
    const script = document.createElement('script');
    script.src = 'https://apis.google.com/js/api.js';
    script.async = true;
    script.onload = () => window.gapi?.load('picker', () => api() ? resolve(api()!) : reject(new Error('Google Drive seçici açılmadı.')));
    script.onerror = () => { pickerLoader = null; reject(new Error('Google Drive seçici yüklenemedi.')); };
    document.head.appendChild(script);
  });
  return pickerLoader;
}

async function getFile(token: string, id: string): Promise<DriveFile> {
  const response = await fetch(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(id)}?fields=id,name,mimeType,webViewLink,thumbnailLink,size`, { headers: { Authorization: `Bearer ${token}` } });
  if (!response.ok) throw new Error(`Drive dosyası okunamadı (${response.status}).`);
  const file = await response.json() as DriveFile;
  return { ...file, webViewLink: file.webViewLink || `https://drive.google.com/file/d/${file.id}/view` };
}

export async function pickDriveFile(): Promise<DriveFile | null> {
  const token = await getGoogleDriveToken();
  const api = await loadPicker();
  const key = import.meta.env.VITE_GOOGLE_API_KEY;
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  if (!key || !clientId) throw new Error('Google Drive seçici anahtarları eksik.');
  return new Promise((resolve, reject) => {
    const builder = new api.PickerBuilder()
      .addView(api.ViewId.DOCS)
      .setOAuthToken(token)
      .setDeveloperKey(key)
      .setAppId(clientId.split('-')[0])
      .setCallback(data => {
        if (data.action === api.Action.CANCEL) resolve(null);
        if (data.action === api.Action.PICKED && data.docs?.[0]) getFile(token, data.docs[0].id).then(resolve).catch(reject);
      });
    builder.build().setVisible(true);
  });
}

export async function uploadDriveFile(file: File): Promise<DriveFile> {
  const token = await getGoogleDriveToken();
  const boundary = `emlakcrm_${crypto.randomUUID()}`;
  const metadata = JSON.stringify({ name: file.name, mimeType: file.type || 'application/octet-stream' });
  const body = new Blob([
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metadata}\r\n`,
    `--${boundary}\r\nContent-Type: ${file.type || 'application/octet-stream'}\r\n\r\n`,
    file,
    `\r\n--${boundary}--`,
  ]);
  const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,webViewLink,thumbnailLink,size', {
    method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': `multipart/related; boundary=${boundary}` }, body,
  });
  if (!response.ok) throw new Error(`Drive'a yüklenemedi (${response.status}): ${(await response.text()).slice(0, 200)}`);
  const uploaded = await response.json() as DriveFile;
  return { ...uploaded, webViewLink: uploaded.webViewLink || `https://drive.google.com/file/d/${uploaded.id}/view` };
}

export const DOCUMENT_TYPES = [
  { value: 'kira_kontrati', label: 'Kira Kontratı', icon: '📄' },
  { value: 'satis_sozlesmesi', label: 'Satış Sözleşmesi', icon: '📝' },
  { value: 'yetki_belgesi', label: 'Yetki Belgesi', icon: '✍️' },
  { value: 'kapora_sozlesmesi', label: 'Kapora Sözleşmesi', icon: '💰' },
  { value: 'tapu', label: 'Tapu Senedi', icon: '🏠' },
  { value: 'kimlik', label: 'Kimlik Fotokopisi', icon: '🪪' },
  { value: 'iskan', label: 'İskan Belgesi', icon: '🏗️' },
  { value: 'imar', label: 'İmar Durumu', icon: '📋' },
  { value: 'ekspertiz', label: 'Ekspertiz Raporu', icon: '📊' },
  { value: 'diger', label: 'Diğer', icon: '📎' },
];

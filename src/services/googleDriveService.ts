// Google Drive Service for Document Management
// Uses Google Drive API with OAuth 2.0

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_API_KEY || '';
const SCOPES = 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive.readonly';
const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest';

let tokenClient: any = null;
let gapiInited = false;
let gisInited = false;

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  webViewLink: string;
  webContentLink?: string;
  thumbnailLink?: string;
  iconLink?: string;
  size?: string;
  createdTime?: string;
  modifiedTime?: string;
}

// Initialize the Google API client
export const initGoogleDrive = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    // Check if API keys are configured
    if (!GOOGLE_CLIENT_ID || !GOOGLE_API_KEY) {
      reject(new Error('Google API anahtarlari eksik'));
      return;
    }

    let resolved = false;
    const tryResolve = () => {
      if (resolved) return;
      if (gapiInited && gisInited) {
        resolved = true;
        resolve();
      }
    };

    const handleError = (msg: string) => {
      if (!resolved) {
        resolved = true;
        reject(new Error(msg));
      }
    };

    // Timeout after 10 seconds
    setTimeout(() => {
      if (!resolved) {
        handleError('Google API zaman asimi');
      }
    }, 10000);

    // Load GAPI
    const gapiScript = document.createElement('script');
    gapiScript.src = 'https://apis.google.com/js/api.js';
    gapiScript.async = true;
    gapiScript.defer = true;
    gapiScript.onerror = () => handleError('Google API script yuklenemedi');
    gapiScript.onload = () => {
      (window as any).gapi.load('client:picker', async () => {
        try {
          await (window as any).gapi.client.init({
            apiKey: GOOGLE_API_KEY,
            discoveryDocs: [DISCOVERY_DOC],
          });
          gapiInited = true;
          tryResolve();
        } catch (err: any) {
          handleError(err?.message || 'GAPI init hatasi');
        }
      });
    };
    document.body.appendChild(gapiScript);

    // Load GIS (Google Identity Services)
    const gisScript = document.createElement('script');
    gisScript.src = 'https://accounts.google.com/gsi/client';
    gisScript.async = true;
    gisScript.defer = true;
    gisScript.onerror = () => handleError('Google Identity script yuklenemedi');
    gisScript.onload = () => {
      try {
        tokenClient = (window as any).google.accounts.oauth2.initTokenClient({
          client_id: GOOGLE_CLIENT_ID,
          scope: SCOPES,
          callback: '', // Will be set later
        });
        gisInited = true;
        tryResolve();
      } catch (err: any) {
        handleError(err?.message || 'GIS init hatasi');
      }
    };
    document.body.appendChild(gisScript);
  });
};

// Check if user is signed in
export const isSignedIn = (): boolean => {
  return !!(window as any).gapi?.client?.getToken();
};

// Get access token
export const getAccessToken = (): string | null => {
  const token = (window as any).gapi?.client?.getToken();
  return token?.access_token || null;
};

// Sign in to Google
export const signInToGoogle = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (!tokenClient) {
      reject(new Error('Google API not initialized'));
      return;
    }

    tokenClient.callback = (response: any) => {
      if (response.error) {
        reject(response);
      } else {
        resolve();
      }
    };

    if ((window as any).gapi?.client?.getToken() === null) {
      // First time - show consent screen
      tokenClient.requestAccessToken({ prompt: 'consent' });
    } else {
      // Skip consent if already authorized
      tokenClient.requestAccessToken({ prompt: '' });
    }
  });
};

// Sign out from Google
export const signOutFromGoogle = (): void => {
  const token = (window as any).gapi?.client?.getToken();
  if (token) {
    (window as any).google.accounts.oauth2.revoke(token.access_token);
    (window as any).gapi.client.setToken('');
  }
};

// Open Google Picker to select files
export const openFilePicker = (callback: (files: DriveFile[]) => void): void => {
  const accessToken = getAccessToken();
  if (!accessToken) {
    console.error('Not signed in to Google');
    return;
  }

  const picker = new (window as any).google.picker.PickerBuilder()
    .addView((window as any).google.picker.ViewId.DOCS)
    .addView((window as any).google.picker.ViewId.RECENTLY_PICKED)
    .setOAuthToken(accessToken)
    .setDeveloperKey(GOOGLE_API_KEY)
    .setCallback((data: any) => {
      if (data.action === (window as any).google.picker.Action.PICKED) {
        const files: DriveFile[] = data.docs.map((doc: any) => ({
          id: doc.id,
          name: doc.name,
          mimeType: doc.mimeType,
          webViewLink: doc.url,
          iconLink: doc.iconUrl,
        }));
        callback(files);
      }
    })
    .setTitle('Dokuman Secin')
    .build();

  picker.setVisible(true);
};

// Upload file to Google Drive
export const uploadFileToDrive = async (
  file: File,
  folderId?: string
): Promise<DriveFile> => {
  const accessToken = getAccessToken();
  if (!accessToken) {
    throw new Error('Not signed in to Google');
  }

  const metadata: any = {
    name: file.name,
    mimeType: file.type,
  };

  if (folderId) {
    metadata.parents = [folderId];
  }

  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  form.append('file', file);

  const response = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,webViewLink,webContentLink,thumbnailLink,iconLink,size,createdTime',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: form,
    }
  );

  if (!response.ok) {
    throw new Error('Failed to upload file');
  }

  return response.json();
};

// Get file details from Drive
export const getFileDetails = async (fileId: string): Promise<DriveFile> => {
  const accessToken = getAccessToken();
  if (!accessToken) {
    throw new Error('Not signed in to Google');
  }

  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}?fields=id,name,mimeType,webViewLink,webContentLink,thumbnailLink,iconLink,size,createdTime,modifiedTime`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error('Failed to get file details');
  }

  return response.json();
};

// Create folder in Drive
export const createFolder = async (folderName: string, parentId?: string): Promise<string> => {
  const accessToken = getAccessToken();
  if (!accessToken) {
    throw new Error('Not signed in to Google');
  }

  const metadata: any = {
    name: folderName,
    mimeType: 'application/vnd.google-apps.folder',
  };

  if (parentId) {
    metadata.parents = [parentId];
  }

  const response = await fetch(
    'https://www.googleapis.com/drive/v3/files',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(metadata),
    }
  );

  if (!response.ok) {
    throw new Error('Failed to create folder');
  }

  const data = await response.json();
  return data.id;
};

// Get embed URL for preview
export const getEmbedUrl = (fileId: string): string => {
  return `https://drive.google.com/file/d/${fileId}/preview`;
};

// Get thumbnail URL
export const getThumbnailUrl = (fileId: string, size: number = 200): string => {
  return `https://drive.google.com/thumbnail?id=${fileId}&sz=w${size}`;
};

// Document types for real estate
export const DOCUMENT_TYPES = [
  { value: 'kira_kontrati', label: 'Kira Kontrati', icon: '📄' },
  { value: 'satis_sozlesmesi', label: 'Satis Sozlesmesi', icon: '📝' },
  { value: 'yetki_belgesi', label: 'Yetki Belgesi', icon: '✍️' },
  { value: 'kapora_sozlesmesi', label: 'Kapora Sozlesmesi', icon: '💰' },
  { value: 'tapu', label: 'Tapu Senedi', icon: '🏠' },
  { value: 'kimlik', label: 'Kimlik Fotokopisi', icon: '🪪' },
  { value: 'iskan', label: 'Iskan Belgesi', icon: '🏗️' },
  { value: 'imar', label: 'Imar Durumu', icon: '📋' },
  { value: 'ekspertiz', label: 'Ekspertiz Raporu', icon: '📊' },
  { value: 'diger', label: 'Diger', icon: '📎' },
];

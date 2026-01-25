import React, { useState, useEffect } from 'react';
import {
  FileText, Trash2, Eye, Download, FolderOpen,
  Plus, X, ExternalLink, RefreshCw, Link
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Document } from '../types';
import { useData } from '../context/DataContext';
import { supabase } from '../services/supabaseClient';
import { DOCUMENT_TYPES, getEmbedUrl } from '../services/googleDriveService';

interface DocumentManagerProps {
  entityType: 'property' | 'customer' | 'sale';
  entityId: string;
  entityName?: string;
}

const DocumentManager: React.FC<DocumentManagerProps> = ({ entityType, entityId, entityName }) => {
  const { userProfile, session } = useData();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showPreview, setShowPreview] = useState<Document | null>(null);
  const [selectedDocType, setSelectedDocType] = useState('');
  const [uploadNotes, setUploadNotes] = useState('');
  const [manualUrl, setManualUrl] = useState('');
  const [manualFileName, setManualFileName] = useState('');

  // Fetch documents for this entity
  useEffect(() => {
    fetchDocuments();
  }, [entityType, entityId]);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        const docs: Document[] = data.map((d: any) => ({
          id: d.id,
          entityType: d.entity_type,
          entityId: d.entity_id,
          documentType: d.document_type,
          fileName: d.file_name,
          fileId: d.file_id,
          mimeType: d.mime_type,
          webViewLink: d.web_view_link,
          webContentLink: d.web_content_link,
          thumbnailLink: d.thumbnail_link,
          fileSize: d.file_size,
          uploadedBy: d.uploaded_by,
          uploadedByName: d.uploaded_by_name,
          createdAt: d.created_at,
          notes: d.notes
        }));
        setDocuments(docs);
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await signInToGoogle();
      setGoogleSignedIn(true);
      toast.success('Google Drive baglantisi basarili!');
    } catch (err) {
      console.error('Google sign in error:', err);
      toast.error('Google Drive baglantisi basarisiz');
    }
  };

  const handleGoogleSignOut = () => {
    signOutFromGoogle();
    setGoogleSignedIn(false);
    toast.success('Google Drive baglantisi kesildi');
  };

  // Extract file ID from Google Drive URL
  const extractDriveFileId = (url: string): string | null => {
    const patterns = [
      /\/file\/d\/([a-zA-Z0-9_-]+)/,
      /id=([a-zA-Z0-9_-]+)/,
      /\/d\/([a-zA-Z0-9_-]+)/
    ];
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  };

  const handleAddDocument = async () => {
    if (!selectedDocType) {
      toast.error('Lutfen dokuman tipi secin');
      return;
    }
    if (!manualUrl) {
      toast.error('Lutfen dokuman linkini girin');
      return;
    }
    if (!manualFileName) {
      toast.error('Lutfen dosya adini girin');
      return;
    }

    try {
      const fileId = extractDriveFileId(manualUrl) || manualUrl;

      const docData = {
        entity_type: entityType,
        entity_id: entityId,
        document_type: selectedDocType,
        file_name: manualFileName,
        file_id: fileId,
        mime_type: 'application/octet-stream',
        web_view_link: manualUrl,
        web_content_link: null,
        thumbnail_link: null,
        file_size: null,
        uploaded_by: session?.user?.id,
        uploaded_by_name: userProfile?.name,
        notes: uploadNotes,
        office_id: userProfile?.officeId
      };

      const { error } = await supabase.from('documents').insert([docData]);
      if (error) throw error;

      toast.success('Dokuman eklendi!');
      setShowUploadModal(false);
      setSelectedDocType('');
      setUploadNotes('');
      setManualUrl('');
      setManualFileName('');
      fetchDocuments();
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Dokuman kaydedilemedi');
    }
  };

  const handleDeleteDocument = async (doc: Document) => {
    if (!confirm(`"${doc.fileName}" dokumanini silmek istediginize emin misiniz?`)) return;

    try {
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', doc.id);

      if (error) throw error;

      toast.success('Dokuman silindi');
      setDocuments(documents.filter(d => d.id !== doc.id));
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Silme basarisiz');
    }
  };

  const getDocTypeInfo = (type: string) => {
    return DOCUMENT_TYPES.find(t => t.value === type) || { label: type, icon: '📄' };
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-100 dark:border-slate-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h3 className="font-bold text-slate-800 dark:text-white">Dokumanlar</h3>
            <span className="text-xs bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full">
              {documents.length}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowUploadModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Dokuman Ekle
            </button>
          </div>
        </div>
      </div>

      {/* Document List */}
      <div className="divide-y divide-gray-100 dark:divide-slate-700">
        {loading ? (
          <div className="p-8 text-center text-gray-400">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
            Yukleniyor...
          </div>
        ) : documents.length === 0 ? (
          <div className="p-8 text-center">
            <FileText className="w-12 h-12 text-gray-300 dark:text-slate-600 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-slate-400">Henuz dokuman eklenmemis</p>
            <button
              onClick={() => setShowUploadModal(true)}
              className="mt-3 text-blue-600 dark:text-blue-400 text-sm font-medium hover:underline"
            >
              Ilk dokumaninizi ekleyin
            </button>
          </div>
        ) : (
          documents.map(doc => {
            const typeInfo = getDocTypeInfo(doc.documentType);
            return (
              <div key={doc.id} className="p-4 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                <div className="flex items-start gap-3">
                  {/* Icon/Thumbnail */}
                  <div className="w-12 h-12 bg-gray-100 dark:bg-slate-700 rounded-lg flex items-center justify-center text-2xl flex-shrink-0">
                    {doc.thumbnailLink ? (
                      <img src={doc.thumbnailLink} alt="" className="w-full h-full object-cover rounded-lg" />
                    ) : (
                      typeInfo.icon
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-slate-800 dark:text-white truncate">{doc.fileName}</h4>
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-xs text-gray-500 dark:text-slate-400">
                      <span className="bg-gray-100 dark:bg-slate-700 px-2 py-0.5 rounded">{typeInfo.label}</span>
                      {doc.fileSize && <span>{formatFileSize(doc.fileSize)}</span>}
                      <span>{new Date(doc.createdAt).toLocaleDateString('tr-TR')}</span>
                    </div>
                    {doc.notes && (
                      <p className="text-xs text-gray-400 dark:text-slate-500 mt-1 truncate">{doc.notes}</p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setShowPreview(doc)}
                      className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                      title="Onizle"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <a
                      href={doc.webViewLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 text-gray-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-lg transition-colors"
                      title="Drive'da Ac"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                    {doc.webContentLink && (
                      <a
                        href={doc.webContentLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/30 rounded-lg transition-colors"
                        title="Indir"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                    )}
                    <button
                      onClick={() => handleDeleteDocument(doc)}
                      className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                      title="Sil"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowUploadModal(false)}>
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-100 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white">Dokuman Ekle</h3>
                <button onClick={() => setShowUploadModal(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {/* Document Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                  Dokuman Tipi *
                </label>
                <select
                  value={selectedDocType}
                  onChange={e => setSelectedDocType(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 p-2.5 text-gray-900 dark:text-white"
                >
                  <option value="">Secin...</option>
                  {DOCUMENT_TYPES.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.icon} {type.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* File Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                  Dosya Adi *
                </label>
                <input
                  type="text"
                  value={manualFileName}
                  onChange={e => setManualFileName(e.target.value)}
                  placeholder="ornek: Kira_Sozlesmesi_2024.pdf"
                  className="w-full rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 p-2.5 text-gray-900 dark:text-white"
                />
              </div>

              {/* URL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                  Dokuman Linki * <span className="text-xs text-gray-400">(Google Drive, Dropbox, vb.)</span>
                </label>
                <input
                  type="text"
                  value={manualUrl}
                  onChange={e => setManualUrl(e.target.value)}
                  placeholder="https://drive.google.com/file/d/..."
                  className="w-full rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 p-2.5 text-gray-900 dark:text-white"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                  Not (Opsiyonel)
                </label>
                <input
                  type="text"
                  value={uploadNotes}
                  onChange={e => setUploadNotes(e.target.value)}
                  placeholder="Dokuman hakkinda kisa not..."
                  className="w-full rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 p-2.5 text-gray-900 dark:text-white"
                />
              </div>

              {/* Submit Button */}
              <button
                onClick={handleAddDocument}
                disabled={!selectedDocType || !manualFileName || !manualUrl}
                className="w-full py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Dokuman Ekle
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setShowPreview(null)}>
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b border-gray-100 dark:border-slate-700 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-800 dark:text-white">{showPreview.fileName}</h3>
                <p className="text-xs text-gray-500 dark:text-slate-400">
                  {getDocTypeInfo(showPreview.documentType).label} - {new Date(showPreview.createdAt).toLocaleDateString('tr-TR')}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={showPreview.webViewLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Drive'da Ac
                </a>
                <button onClick={() => setShowPreview(null)} className="p-2 text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="h-[70vh]">
              <iframe
                src={getEmbedUrl(showPreview.fileId)}
                className="w-full h-full"
                allow="autoplay"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentManager;

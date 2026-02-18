import React, { useState, useEffect } from 'react';
import { X, FileText, Download, Eye, Loader2, Calendar, AlertCircle } from 'lucide-react';
import { PDFViewer, pdf } from '@react-pdf/renderer';
import OwnerReportPDF from './OwnerReportPDF';
import { getPortfolioWeeklyReport, WeeklyReportData } from '../../services/reportService';
import { Activity } from '../../types';

interface GenerateReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  propertyId: string;
  propertyTitle: string;
  userId: string;
  activities: Activity[];
}

const GenerateReportModal: React.FC<GenerateReportModalProps> = ({
  isOpen,
  onClose,
  propertyId,
  propertyTitle,
  userId,
  activities
}) => {
  // Default to last 7 days
  const today = new Date();
  const lastWeek = new Date(today);
  lastWeek.setDate(lastWeek.getDate() - 7);

  const [startDate, setStartDate] = useState(lastWeek.toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(today.toISOString().split('T')[0]);
  const [evaluation, setEvaluation] = useState('');
  const [reportData, setReportData] = useState<WeeklyReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [downloading, setDownloading] = useState(false);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setReportData(null);
      setShowPreview(false);
      setError(null);
    }
  }, [isOpen]);

  const fetchReportData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Filter activities by date range
      const filteredActivities = activities.filter(a => {
        const actDate = a.date;
        return actDate >= startDate && actDate <= endDate;
      });

      const data = await getPortfolioWeeklyReport(propertyId, startDate, endDate, userId, filteredActivities);

      if (data) {
        setReportData(data);
        return data;
      } else {
        setError('Rapor verileri yüklenemedi. Lütfen tekrar deneyin.');
        return null;
      }
    } catch (err) {
      console.error('Error fetching report data:', err);
      setError('Bir hata oluştu. Lütfen tekrar deneyin.');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = async () => {
    const data = await fetchReportData();
    if (data) {
      setShowPreview(true);
    }
  };

  const handleDownload = async () => {
    setDownloading(true);

    try {
      let data = reportData;
      if (!data) {
        data = await fetchReportData();
      }

      if (!data) {
        setDownloading(false);
        return;
      }

      // Generate PDF blob
      const blob = await pdf(
        <OwnerReportPDF data={data} evaluation={evaluation} />
      ).toBlob();

      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;

      // Generate filename
      const dateStr = new Date().toISOString().split('T')[0];
      const sanitizedTitle = propertyTitle
        .replace(/[^a-zA-Z0-9\u00C0-\u024F]/g, '_')
        .substring(0, 30);
      link.download = `Haftalik_Rapor_${sanitizedTitle}_${dateStr}.pdf`;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error downloading PDF:', err);
      setError('PDF indirme sırasında hata oluştu.');
    } finally {
      setDownloading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className={`bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full transition-all duration-300 ${showPreview ? 'max-w-6xl h-[90vh]' : 'max-w-lg'}`}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                Mal Sahibi Haftalık Raporu
              </h2>
              <p className="text-sm text-gray-500 dark:text-slate-400 truncate max-w-xs">
                {propertyTitle}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-slate-400" />
          </button>
        </div>

        <div className={`flex ${showPreview ? 'h-[calc(90vh-80px)]' : ''}`}>
          {/* Form Section */}
          <div className={`p-6 ${showPreview ? 'w-80 border-r border-gray-200 dark:border-slate-700 overflow-y-auto' : 'w-full'}`}>
            {/* Date Range */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                <Calendar className="w-4 h-4 inline mr-2" />
                Tarih Aralığı
              </label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 dark:text-slate-400 mb-1">Başlangıç</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 dark:text-slate-400 mb-1">Bitiş</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Evaluation Textarea */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                Genel Değerlendirme (Opsiyonel)
              </label>
              <textarea
                value={evaluation}
                onChange={(e) => setEvaluation(e.target.value)}
                placeholder="Mal sahibine iletmek istediğiniz genel değerlendirmenizi buraya yazabilirsiniz. Örn: Bu hafta yoğun bir ilgi gördük, fiyat konusunda pazarlık yapılabilir..."
                rows={4}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col gap-3">
              <button
                onClick={handlePreview}
                disabled={loading}
                className="flex items-center justify-center gap-2 w-full py-3 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-700 dark:text-slate-200 rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
                {loading ? 'Yükleniyor...' : 'Raporu Önizle'}
              </button>

              <button
                onClick={handleDownload}
                disabled={downloading || loading}
                className="flex items-center justify-center gap-2 w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                {downloading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Download className="w-5 h-5" />
                )}
                {downloading ? 'İndiriliyor...' : 'PDF İndir'}
              </button>
            </div>

            {/* Info Note */}
            <p className="mt-4 text-xs text-gray-500 dark:text-slate-400 text-center">
              Bu rapor mal sahibine iletilmek üzere hazırlanmıştır.
              <br />
              Müşteri bilgileri gizlilik nedeniyle dahil edilmez.
            </p>
          </div>

          {/* Preview Section */}
          {showPreview && reportData && (
            <div className="flex-1 bg-gray-100 dark:bg-slate-900 overflow-hidden">
              <PDFViewer
                style={{ width: '100%', height: '100%', border: 'none' }}
                showToolbar={true}
              >
                <OwnerReportPDF data={reportData} evaluation={evaluation} />
              </PDFViewer>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GenerateReportModal;

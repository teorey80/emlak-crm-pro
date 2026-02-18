import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font
} from '@react-pdf/renderer';
import { WeeklyReportData, formatDateTurkish, getActivityTypeLabel } from '../../services/reportService';

// Register a font that supports Turkish characters
Font.register({
  family: 'Roboto',
  fonts: [
    {
      src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-regular-webfont.ttf',
      fontWeight: 'normal'
    },
    {
      src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-bold-webfont.ttf',
      fontWeight: 'bold'
    }
  ]
});

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Roboto',
    fontSize: 10,
    color: '#1f2937'
  },
  header: {
    marginBottom: 30,
    borderBottomWidth: 2,
    borderBottomColor: '#3b82f6',
    paddingBottom: 15
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10
  },
  logoPlaceholder: {
    width: 60,
    height: 60,
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center'
  },
  logoText: {
    color: 'white',
    fontSize: 8,
    fontWeight: 'bold'
  },
  headerTitle: {
    flex: 1,
    marginLeft: 15
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e40af',
    marginBottom: 5
  },
  subtitle: {
    fontSize: 11,
    color: '#6b7280'
  },
  dateInfo: {
    textAlign: 'right',
    fontSize: 9,
    color: '#6b7280'
  },
  section: {
    marginBottom: 20
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1e40af',
    marginBottom: 10,
    paddingBottom: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb'
  },
  propertyInfo: {
    backgroundColor: '#f8fafc',
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  propertyRow: {
    flexDirection: 'row',
    marginBottom: 6
  },
  propertyLabel: {
    width: 100,
    fontWeight: 'bold',
    color: '#4b5563'
  },
  propertyValue: {
    flex: 1,
    color: '#1f2937'
  },
  priceValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#059669'
  },
  summaryBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#eff6ff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15
  },
  summaryItem: {
    alignItems: 'center',
    flex: 1
  },
  summaryNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e40af'
  },
  summaryLabel: {
    fontSize: 8,
    color: '#6b7280',
    marginTop: 3,
    textAlign: 'center'
  },
  activityGroup: {
    marginBottom: 15
  },
  activityGroupTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#374151',
    backgroundColor: '#f3f4f6',
    padding: 8,
    borderRadius: 4,
    marginBottom: 8
  },
  activityItem: {
    paddingLeft: 10,
    paddingVertical: 6,
    borderLeftWidth: 2,
    borderLeftColor: '#3b82f6',
    marginBottom: 6
  },
  activityDate: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#4b5563',
    marginBottom: 2
  },
  activityDescription: {
    fontSize: 9,
    color: '#1f2937',
    lineHeight: 1.4
  },
  activityStatus: {
    fontSize: 8,
    color: '#6b7280',
    marginTop: 2,
    fontStyle: 'italic'
  },
  evaluationSection: {
    backgroundColor: '#fef3c7',
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fcd34d',
    minHeight: 80
  },
  evaluationTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#92400e',
    marginBottom: 8
  },
  evaluationText: {
    fontSize: 10,
    color: '#78350f',
    lineHeight: 1.5
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 10
  },
  footerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  footerLeft: {
    fontSize: 8,
    color: '#6b7280'
  },
  footerRight: {
    fontSize: 8,
    color: '#6b7280',
    textAlign: 'right'
  },
  consultantInfo: {
    backgroundColor: '#f0fdf4',
    padding: 12,
    borderRadius: 8,
    marginBottom: 15
  },
  consultantTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#166534',
    marginBottom: 5
  },
  consultantDetail: {
    fontSize: 9,
    color: '#15803d'
  },
  noActivity: {
    padding: 20,
    textAlign: 'center',
    color: '#6b7280',
    fontStyle: 'italic'
  }
});

interface OwnerReportPDFProps {
  data: WeeklyReportData;
  evaluation?: string;
}

const OwnerReportPDF: React.FC<OwnerReportPDFProps> = ({ data, evaluation }) => {
  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('tr-TR').format(price) + ' ' + currency;
  };

  const getStatusText = (status: string): string => {
    const statusMap: Record<string, string> = {
      'Olumlu': 'Olumlu geri donus',
      'Olumsuz': 'Olumsuz geri donus',
      'Dusunuyor': 'Degerlendirilecek',
      'Tamamlandi': 'Tamamlandi',
      'Planlandi': 'Planlandi'
    };
    return statusMap[status] || status;
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.logoPlaceholder}>
              <Text style={styles.logoText}>{data.office.name?.substring(0, 2).toUpperCase() || 'OF'}</Text>
            </View>
            <View style={styles.headerTitle}>
              <Text style={styles.title}>HAFTALIK PORTFOY RAPORU</Text>
              <Text style={styles.subtitle}>{data.office.name || 'Emlak Ofisi'}</Text>
            </View>
            <View style={styles.dateInfo}>
              <Text>Rapor Donemi:</Text>
              <Text style={{ fontWeight: 'bold' }}>
                {formatDateTurkish(data.dateRange.startDate)} - {formatDateTurkish(data.dateRange.endDate)}
              </Text>
              <Text style={{ marginTop: 5 }}>
                Olusturulma: {formatDateTurkish(data.generatedAt)}
              </Text>
            </View>
          </View>
        </View>

        {/* Consultant Info */}
        <View style={styles.consultantInfo}>
          <Text style={styles.consultantTitle}>Danisman Bilgileri</Text>
          <Text style={styles.consultantDetail}>
            {data.consultant.name}
            {data.consultant.phone && ` | Tel: ${data.consultant.phone}`}
            {data.consultant.email && ` | ${data.consultant.email}`}
          </Text>
        </View>

        {/* Property Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Portfoy Bilgileri</Text>
          <View style={styles.propertyInfo}>
            <View style={styles.propertyRow}>
              <Text style={styles.propertyLabel}>Referans No:</Text>
              <Text style={styles.propertyValue}>{data.property.id}</Text>
            </View>
            <View style={styles.propertyRow}>
              <Text style={styles.propertyLabel}>Ilan Basligi:</Text>
              <Text style={styles.propertyValue}>{data.property.title}</Text>
            </View>
            <View style={styles.propertyRow}>
              <Text style={styles.propertyLabel}>Adres:</Text>
              <Text style={styles.propertyValue}>{data.property.address || '-'}</Text>
            </View>
            <View style={styles.propertyRow}>
              <Text style={styles.propertyLabel}>Tip / Oda:</Text>
              <Text style={styles.propertyValue}>
                {data.property.type} {data.property.rooms && `/ ${data.property.rooms}`}
              </Text>
            </View>
            <View style={styles.propertyRow}>
              <Text style={styles.propertyLabel}>Alan:</Text>
              <Text style={styles.propertyValue}>{data.property.area} m2</Text>
            </View>
            <View style={styles.propertyRow}>
              <Text style={styles.propertyLabel}>Fiyat:</Text>
              <Text style={styles.priceValue}>
                {formatPrice(data.property.price, data.property.currency)}
              </Text>
            </View>
            <View style={styles.propertyRow}>
              <Text style={styles.propertyLabel}>Durum:</Text>
              <Text style={styles.propertyValue}>{data.property.status}</Text>
            </View>
          </View>
        </View>

        {/* Activity Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bu Hafta Aktivite Ozeti</Text>
          <View style={styles.summaryBox}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryNumber}>{data.summary.totalActivities}</Text>
              <Text style={styles.summaryLabel}>Toplam Aktivite</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryNumber}>{data.summary.totalCalls}</Text>
              <Text style={styles.summaryLabel}>Telefon Gorusmesi</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryNumber}>{data.summary.totalShowings}</Text>
              <Text style={styles.summaryLabel}>Yer Gosterimi</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryNumber}>{data.summary.positiveOutcomes}</Text>
              <Text style={styles.summaryLabel}>Olumlu Geri Donus</Text>
            </View>
          </View>
        </View>

        {/* Activity Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Aktivite Detaylari</Text>

          {data.activityGroups.length === 0 ? (
            <Text style={styles.noActivity}>
              Bu donemde herhangi bir aktivite kaydedilmemistir.
            </Text>
          ) : (
            data.activityGroups.map((group, groupIndex) => (
              <View key={groupIndex} style={styles.activityGroup}>
                <Text style={styles.activityGroupTitle}>
                  {getActivityTypeLabel(group.type)} ({group.count} adet)
                </Text>
                {group.activities.map((activity, actIndex) => (
                  <View key={actIndex} style={styles.activityItem}>
                    <Text style={styles.activityDate}>
                      {formatDateTurkish(activity.date)}
                      {activity.time && ` - ${activity.time}`}
                    </Text>
                    {activity.description && (
                      <Text style={styles.activityDescription}>
                        {activity.description}
                      </Text>
                    )}
                    {activity.status && (
                      <Text style={styles.activityStatus}>
                        Sonuc: {getStatusText(activity.status)}
                      </Text>
                    )}
                  </View>
                ))}
              </View>
            ))
          )}
        </View>

        {/* Evaluation Section */}
        {evaluation && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Genel Degerlendirme</Text>
            <View style={styles.evaluationSection}>
              <Text style={styles.evaluationText}>{evaluation}</Text>
            </View>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.footerContent}>
            <View>
              <Text style={styles.footerLeft}>
                Bu rapor {data.office.name || 'Emlak Ofisi'} tarafindan hazirlanmistir.
              </Text>
              {data.office.phone && (
                <Text style={styles.footerLeft}>Tel: {data.office.phone}</Text>
              )}
            </View>
            <View>
              <Text style={styles.footerRight}>
                Rapor Tarihi: {formatDateTurkish(data.generatedAt)}
              </Text>
              <Text style={styles.footerRight}>Sayfa 1 / 1</Text>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
};

export default OwnerReportPDF;

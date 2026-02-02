# Emlak CRM Pro - SaaS Dönüşüm Uygulama Planı

**Tarih:** 2026-02-02
**Versiyon:** 2.0
**Durum:** Planlama Aşaması

---

## İçindekiler

1. [Vizyon ve Hedefler](#1-vizyon-ve-hedefler)
2. [Kullanıcı Tipleri ve Paketler](#2-kullanıcı-tipleri-ve-paketler)
3. [Kritik Mimari Değişiklikler](#3-kritik-mimari-değişiklikler)
4. [Veritabanı Değişiklikleri](#4-veritabanı-değişiklikleri)
5. [RLS Politikaları](#5-rls-politikaları)
6. [Ofis Geçiş Sistemi](#6-ofis-geçiş-sistemi)
7. [Eşleştirme ve Bildirim Sistemi](#7-eşleştirme-ve-bildirim-sistemi)
8. [UI/UX Değişiklikleri](#8-uiux-değişiklikleri)
9. [Uygulama Adımları](#9-uygulama-adımları)
10. [Test Senaryoları](#10-test-senaryoları)

---

## 1. Vizyon ve Hedefler

### Ana Vizyon
Emlak sektöründe bireysel danışmandan büyük ofislere kadar herkesin kullanabileceği, veri taşınabilirliği olan, güvenli ve ölçeklenebilir bir SaaS platformu.

### Temel İlkeler

| İlke | Açıklama |
|------|----------|
| **Veri Sahipliği** | Kullanıcı verisinin gerçek sahibidir. Ofis değişse bile veri kullanıcıyla gider. |
| **Müşteri Gizliliği** | Müşteri bilgileri sadece sahibi tarafından görülür. Ofis arkadaşları bile göremez. |
| **Portföy Şeffaflığı** | Ofis içinde portföyler görünür olmalı ki eşleştirme çalışsın. |
| **Kolay Geçiş** | Ofise katılma/ayrılma tek tıkla olmalı, veri kaybı olmamalı. |

---

## 2. Kullanıcı Tipleri ve Paketler

### 2.1 Kullanıcı Tipleri

```
┌─────────────────────────────────────────────────────────┐
│                    KULLANICI TİPLERİ                    │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  BİREYSEL KULLANICI          OFİS KULLANICISI          │
│  ──────────────────          ────────────────          │
│  • office_id = NULL          • office_id = UUID        │
│  • Kendi başına çalışır      • Ekip içinde çalışır     │
│  • Tüm özellikleri kullanır  • Rol bazlı yetkiler      │
│                                                         │
│                              ┌─────────┐                │
│                              │ BROKER  │ (Ofis Sahibi) │
│                              └────┬────┘                │
│                                   │                     │
│                         ┌────────┴────────┐            │
│                         │                 │            │
│                    ┌────┴────┐      ┌────┴────┐       │
│                    │CONSULTANT│      │CONSULTANT│       │
│                    └─────────┘      └─────────┘       │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 2.2 Rol Yetkileri

| Yetki | Bireysel | Danışman | Broker |
|-------|----------|----------|--------|
| Kendi portföyünü yönet | ✅ | ✅ | ✅ |
| Kendi müşterilerini yönet | ✅ | ✅ | ✅ |
| Kendi taleplerini yönet | ✅ | ✅ | ✅ |
| Ofis portföylerini gör | - | ✅ | ✅ |
| Ofis taleplerini gör | - | ✅ | ✅ |
| Ekip performansını gör | - | ❌ | ✅ |
| Ekip satışlarını gör | - | ❌ | ✅ |
| Danışman davet et | - | ❌ | ✅ |
| Rol değiştir | - | ❌ | ✅ |
| Ofis ayarlarını yönet | - | ❌ | ✅ |

### 2.3 Paketler ve Limitler

| Özellik | Free | Pro (199₺/ay) |
|---------|------|---------------|
| Portföy Limiti | 20 | Sınırsız |
| Müşteri Limiti | 50 | Sınırsız |
| Aktivite Takibi | ✅ | ✅ |
| Talep Yönetimi | ✅ | ✅ |
| Eşleştirme | ✅ | ✅ |
| Web Sitesi | ✅ | ✅ |
| Raporlar | Temel | Gelişmiş |
| Öncelikli Destek | ❌ | ✅ |

---

## 3. Kritik Mimari Değişiklikler

### 3.1 Veri Sahipliği Modeli Değişikliği

**ESKİ MODEL (Sorunlu):**
```sql
-- Veri ofise bağlı, kullanıcı ayrılınca veri geride kalıyor
properties.office_id = 'ofis-uuid'  -- SABİT, değişmiyor
```

**YENİ MODEL (Taşınabilir):**
```sql
-- Veri kullanıcıya bağlı, görünürlük dinamik
properties.user_id = 'kullanici-uuid'  -- ASLA DEĞİŞMEZ

-- Görünürlük = Sahibin GÜNCEL office_id'si
-- profiles tablosundan JOIN ile alınır
```

### 3.2 Müşteri Gizliliği

**KURAL:** Müşteri verileri ASLA ofis içinde paylaşılmaz.

```sql
-- Müşteri erişimi SADECE:
customers WHERE user_id = auth.uid()

-- Ofis arkadaşları bile göremez!
-- Eşleştirmede sadece "alıcı var" bilgisi paylaşılır, kim olduğu değil.
```

### 3.3 Portföy Paylaşımı

**KURAL:** Portföyler ofis içinde görünür, ama müşteri bilgisi (mal sahibi) gizli.

```sql
-- Portföy listesinde görünen:
title, price, location, rooms, area, images, features

-- Portföy listesinde GİZLİ:
owner_name, owner_phone, owner_email (customers tablosundan gelen)
```

---

## 4. Veritabanı Değişiklikleri

### 4.1 Yeni Tablolar

```sql
-- Ofis davet linkleri
CREATE TABLE office_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  office_id UUID REFERENCES offices(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  role TEXT DEFAULT 'consultant' CHECK (role IN ('consultant', 'broker')),
  expires_at TIMESTAMP WITH TIME ZONE,
  max_uses INTEGER DEFAULT 1,
  current_uses INTEGER DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ofis geçiş geçmişi (audit log)
CREATE TABLE office_membership_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  old_office_id UUID REFERENCES offices(id),
  new_office_id UUID REFERENCES offices(id),
  action TEXT CHECK (action IN ('joined', 'left', 'transferred')),
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bildirimler
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'match_found', 'portfolio_interest', 'team_joined', etc.
  title TEXT NOT NULL,
  message TEXT,
  data JSONB, -- İlgili entity ID'leri
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Eşleşmeler
CREATE TABLE matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id TEXT REFERENCES requests(id),
  property_id TEXT REFERENCES properties(id),
  request_owner_id UUID REFERENCES auth.users(id),
  property_owner_id UUID REFERENCES auth.users(id),
  score INTEGER, -- Eşleşme skoru (0-100)
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'contacted', 'viewing', 'closed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 4.2 Mevcut Tablo Değişiklikleri

```sql
-- profiles tablosuna eklemeler
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS joined_office_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS invited_by UUID REFERENCES auth.users(id);

-- properties tablosundan office_id'yi KALDIRMIYORUZ ama anlamını değiştiriyoruz
-- office_id artık "hangi ofiste oluşturuldu" değil, cache/performans için
-- Gerçek görünürlük profiles.office_id'den gelecek

-- customers tablosu - office_id GEREKSİZ hale geliyor
-- Müşteri sadece user_id ile erişilecek, ofis bazlı paylaşım yok
```

### 4.3 Index'ler

```sql
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX idx_matches_request_owner ON matches(request_owner_id);
CREATE INDEX idx_matches_property_owner ON matches(property_owner_id);
CREATE INDEX idx_office_invitations_token ON office_invitations(token);
```

---

## 5. RLS Politikaları

### 5.1 Müşteriler (Tam Gizlilik)

```sql
-- Müşteriler SADECE sahibi tarafından görülebilir
CREATE POLICY "customers_strict_owner_only" ON customers
FOR ALL USING (user_id = auth.uid());

-- Ofis arkadaşları bile göremez!
```

### 5.2 Portföyler (Ofis İçi Paylaşım)

```sql
-- Yardımcı fonksiyon: Kullanıcının güncel ofisini al
CREATE OR REPLACE FUNCTION get_user_office_id(uid UUID DEFAULT auth.uid())
RETURNS UUID AS $$
  SELECT office_id FROM profiles WHERE id = uid
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Portföy görünürlüğü
CREATE POLICY "properties_office_visibility" ON properties
FOR SELECT USING (
  -- Kendi portföylerim
  user_id = auth.uid()
  OR
  -- Aynı ofisteki arkadaşların portföyleri (dinamik!)
  EXISTS (
    SELECT 1 FROM profiles owner_profile
    WHERE owner_profile.id = properties.user_id
    AND owner_profile.office_id IS NOT NULL
    AND owner_profile.office_id = get_user_office_id()
  )
  OR
  -- Public site için yayınlanmış
  COALESCE("publishedOnPersonalSite", false) = true
);
```

### 5.3 Talepler (Ofis İçi Görünür, Eşleştirme İçin)

```sql
CREATE POLICY "requests_office_visibility" ON requests
FOR SELECT USING (
  user_id = auth.uid()
  OR
  EXISTS (
    SELECT 1 FROM profiles owner_profile
    WHERE owner_profile.id = requests.user_id
    AND owner_profile.office_id IS NOT NULL
    AND owner_profile.office_id = get_user_office_id()
  )
);
```

### 5.4 Satışlar (Broker Tam Görür, Danışman Kendi)

```sql
CREATE POLICY "sales_role_based" ON sales
FOR SELECT USING (
  user_id = auth.uid()
  OR
  -- Broker tüm ofis satışlarını görür
  EXISTS (
    SELECT 1 FROM profiles broker
    WHERE broker.id = auth.uid()
    AND broker.role = 'broker'
    AND broker.office_id = (
      SELECT office_id FROM profiles WHERE id = sales.user_id
    )
  )
);
```

---

## 6. Ofis Geçiş Sistemi

### 6.1 Davet Linki Oluşturma (Broker)

```typescript
// services/officeService.ts

export async function createInviteLink(officeId: string, role: 'consultant' | 'broker' = 'consultant') {
  const token = crypto.randomUUID();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 gün geçerli

  const { data, error } = await supabase
    .from('office_invitations')
    .insert({
      office_id: officeId,
      token,
      role,
      expires_at: expiresAt.toISOString(),
      created_by: (await supabase.auth.getUser()).data.user?.id
    })
    .select()
    .single();

  if (error) throw error;

  // Davet linki: https://app.emlakcrm.com/#/join/TOKEN
  return `${window.location.origin}/#/join/${token}`;
}
```

### 6.2 Ofise Katılma

```typescript
// pages/JoinOffice.tsx

export async function joinOffice(token: string) {
  // 1. Daveti doğrula
  const { data: invitation, error } = await supabase
    .from('office_invitations')
    .select('*, offices(*)')
    .eq('token', token)
    .single();

  if (error || !invitation) {
    throw new Error('Geçersiz veya süresi dolmuş davet linki');
  }

  if (invitation.expires_at && new Date(invitation.expires_at) < new Date()) {
    throw new Error('Davet linkinin süresi dolmuş');
  }

  if (invitation.max_uses && invitation.current_uses >= invitation.max_uses) {
    throw new Error('Davet linki kullanım limitine ulaşmış');
  }

  const userId = (await supabase.auth.getUser()).data.user?.id;

  // 2. Geçmiş kaydı oluştur
  const { data: currentProfile } = await supabase
    .from('profiles')
    .select('office_id')
    .eq('id', userId)
    .single();

  await supabase.from('office_membership_history').insert({
    user_id: userId,
    old_office_id: currentProfile?.office_id,
    new_office_id: invitation.office_id,
    action: currentProfile?.office_id ? 'transferred' : 'joined'
  });

  // 3. Profili güncelle
  await supabase
    .from('profiles')
    .update({
      office_id: invitation.office_id,
      role: invitation.role,
      joined_office_at: new Date().toISOString(),
      invited_by: invitation.created_by
    })
    .eq('id', userId);

  // 4. Davet kullanım sayısını artır
  await supabase
    .from('office_invitations')
    .update({ current_uses: invitation.current_uses + 1 })
    .eq('id', invitation.id);

  // 5. Bildirim gönder (broker'a)
  await supabase.from('notifications').insert({
    user_id: invitation.created_by,
    type: 'team_joined',
    title: 'Yeni Ekip Üyesi',
    message: `Yeni bir danışman ekibinize katıldı.`,
    data: { new_member_id: userId }
  });

  return invitation.offices;
}
```

### 6.3 Ofisten Ayrılma

```typescript
export async function leaveOffice() {
  const userId = (await supabase.auth.getUser()).data.user?.id;

  const { data: currentProfile } = await supabase
    .from('profiles')
    .select('office_id, role')
    .eq('id', userId)
    .single();

  if (!currentProfile?.office_id) {
    throw new Error('Zaten bir ofiste değilsiniz');
  }

  // Broker tek başına ayrılamaz (önce başka broker atamalı)
  if (currentProfile.role === 'broker') {
    const { count } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('office_id', currentProfile.office_id)
      .eq('role', 'broker');

    if (count === 1) {
      throw new Error('Ofisten ayrılmadan önce başka bir broker atamalısınız');
    }
  }

  // Geçmiş kaydı
  await supabase.from('office_membership_history').insert({
    user_id: userId,
    old_office_id: currentProfile.office_id,
    new_office_id: null,
    action: 'left'
  });

  // Profili güncelle
  await supabase
    .from('profiles')
    .update({
      office_id: null,
      role: 'consultant', // Bireysel olunca varsayılan
      joined_office_at: null,
      invited_by: null
    })
    .eq('id', userId);

  return true;
}
```

---

## 7. Eşleştirme ve Bildirim Sistemi

### 7.1 Eşleştirme Algoritması

```typescript
// services/matchingService.ts (güncelleme)

export interface MatchResult {
  requestId: string;
  propertyId: string;
  score: number;
  requestOwnerId: string;
  propertyOwnerId: string;
  isCrossConsultant: boolean; // Farklı danışmanlar mı?
}

export async function findMatches(requestId: string): Promise<MatchResult[]> {
  // Talebi al
  const { data: request } = await supabase
    .from('requests')
    .select('*, profiles!user_id(office_id)')
    .eq('id', requestId)
    .single();

  if (!request) return [];

  // Uygun portföyleri bul (ofis içi + kendi)
  let query = supabase
    .from('properties')
    .select('*, profiles!user_id(id, office_id, full_name)')
    .eq('listing_status', 'Aktif');

  // Filtreler
  if (request.requestType) {
    query = query.eq('status', request.requestType);
  }
  if (request.minPrice) {
    query = query.gte('price', request.minPrice);
  }
  if (request.maxPrice) {
    query = query.lte('price', request.maxPrice);
  }
  if (request.city) {
    query = query.ilike('location', `%${request.city}%`);
  }
  if (request.propertyType) {
    query = query.eq('type', request.propertyType);
  }
  if (request.minRooms) {
    query = query.gte('rooms', request.minRooms);
  }

  const { data: properties } = await query;

  if (!properties) return [];

  // Skorla ve filtrele
  const matches: MatchResult[] = properties
    .map(property => {
      const score = calculateMatchScore(request, property);
      return {
        requestId,
        propertyId: property.id,
        score,
        requestOwnerId: request.user_id,
        propertyOwnerId: property.user_id,
        isCrossConsultant: request.user_id !== property.user_id
      };
    })
    .filter(m => m.score >= 60) // Minimum %60 eşleşme
    .sort((a, b) => b.score - a.score);

  return matches;
}

function calculateMatchScore(request: any, property: any): number {
  let score = 0;
  let factors = 0;

  // Fiyat uyumu (40 puan)
  if (request.minPrice && request.maxPrice) {
    if (property.price >= request.minPrice && property.price <= request.maxPrice) {
      score += 40;
    } else if (property.price <= request.maxPrice * 1.1) {
      score += 20; // %10 tolerans
    }
    factors++;
  }

  // Konum uyumu (30 puan)
  if (request.city && property.location?.includes(request.city)) {
    score += 30;
    factors++;
  }

  // Oda sayısı uyumu (15 puan)
  if (request.minRooms) {
    if (property.rooms >= request.minRooms) {
      score += 15;
    }
    factors++;
  }

  // Tip uyumu (15 puan)
  if (request.propertyType && property.type === request.propertyType) {
    score += 15;
    factors++;
  }

  return factors > 0 ? Math.round((score / (factors * 25)) * 100) : 0;
}
```

### 7.2 Bildirim Gönderme

```typescript
// services/notificationService.ts

export async function notifyMatch(match: MatchResult) {
  const { data: request } = await supabase
    .from('requests')
    .select('*, customers(name)')
    .eq('id', match.requestId)
    .single();

  const { data: property } = await supabase
    .from('properties')
    .select('title, location, price, profiles!user_id(full_name)')
    .eq('id', match.propertyId)
    .single();

  // 1. Talep sahibine bildir
  await supabase.from('notifications').insert({
    user_id: match.requestOwnerId,
    type: 'match_found',
    title: '🎯 Eşleşme Bulundu!',
    message: `${request.customers?.name || 'Müşteriniz'} için uygun ilan: ${property.title}`,
    data: {
      request_id: match.requestId,
      property_id: match.propertyId,
      score: match.score,
      property_owner: property.profiles?.full_name
    }
  });

  // 2. Portföy sahibine bildir (farklı kişiyse)
  if (match.isCrossConsultant) {
    await supabase.from('notifications').insert({
      user_id: match.propertyOwnerId,
      type: 'portfolio_interest',
      title: '🔔 Portföyünüze İlgi Var!',
      message: `${property.title} için potansiyel alıcı bulundu.`,
      data: {
        request_id: match.requestId,
        property_id: match.propertyId,
        score: match.score,
        request_owner: request.profiles?.full_name
      }
    });
  }

  // 3. Eşleşme kaydı oluştur
  await supabase.from('matches').insert({
    request_id: match.requestId,
    property_id: match.propertyId,
    request_owner_id: match.requestOwnerId,
    property_owner_id: match.propertyOwnerId,
    score: match.score
  });
}
```

### 7.3 Bildirim Komponenti

```typescript
// components/NotificationBell.tsx (güncelleme)

export const NotificationBell: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    loadNotifications();

    // Realtime subscription
    const channel = supabase
      .channel('notifications')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`
      }, (payload) => {
        setNotifications(prev => [payload.new as Notification, ...prev]);
        setUnreadCount(c => c + 1);
        // Toast göster
        toast(payload.new.title, { icon: '🔔' });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  // ... render
};
```

---

## 8. UI/UX Değişiklikleri

### 8.1 Yeni Sayfalar

| Sayfa | Yol | Açıklama |
|-------|-----|----------|
| JoinOffice | `/join/:token` | Davet linki ile ofise katılma |
| TeamInvite | `/team/invite` | Broker için davet linki oluşturma |
| Notifications | `/notifications` | Bildirim merkezi |
| MatchCenter | `/matches` | Eşleşme yönetimi |

### 8.2 Sidebar Değişiklikleri

```typescript
// Broker için ek menü öğeleri
const brokerMenuItems = [
  { path: '/team/invite', label: 'Davet Linki', icon: UserPlus },
  { path: '/team/performance', label: 'Performans', icon: TrendingUp },
];

// Bildirim sayısı badge
<NotificationBell />
```

### 8.3 Portföy Listesi Değişiklikleri

```typescript
// PropertyList.tsx - Ofis içi görünümde müşteri bilgisi gizli
<PropertyCard
  property={property}
  showOwnerInfo={property.user_id === currentUserId} // Sadece kendi portföyünde
  showConsultantName={true} // Kimin portföyü olduğunu göster
/>
```

### 8.4 Settings Sayfası - Ofis Bölümü

```typescript
// Settings.tsx - Yeni bölüm
<section>
  <h3>Ofis Üyeliği</h3>
  {userProfile.officeId ? (
    <>
      <p>Ofis: {office.name}</p>
      <p>Rol: {userProfile.role === 'broker' ? 'Broker' : 'Danışman'}</p>
      <p>Katılım: {formatDate(userProfile.joinedOfficeAt)}</p>
      <Button variant="danger" onClick={handleLeaveOffice}>
        Ofisten Ayrıl
      </Button>
    </>
  ) : (
    <p>Bireysel kullanıcı olarak çalışıyorsunuz.</p>
  )}
</section>
```

---

## 9. Uygulama Adımları

### Faz 1: Veritabanı Hazırlığı (1-2 gün)
- [ ] Yeni tabloları oluştur (office_invitations, notifications, matches, office_membership_history)
- [ ] RLS politikalarını güncelle (müşteri gizliliği, portföy paylaşımı)
- [ ] Index'leri ekle
- [ ] Mevcut veriyi doğrula

### Faz 2: Backend Servisleri (2-3 gün)
- [ ] officeService.ts - Davet linki oluşturma, ofise katılma, ayrılma
- [ ] notificationService.ts - Bildirim gönderme, realtime subscription
- [ ] matchingService.ts güncelle - Cross-consultant eşleştirme
- [ ] DataContext.tsx güncelle - Bildirim state, ofis state

### Faz 3: UI Geliştirme (3-4 gün)
- [ ] JoinOffice.tsx - Davet linki sayfası
- [ ] TeamInvite.tsx - Broker için davet yönetimi
- [ ] NotificationBell.tsx güncelle - Realtime bildirimler
- [ ] NotificationCenter.tsx - Tüm bildirimler sayfası
- [ ] MatchCenter.tsx - Eşleşme yönetimi
- [ ] Settings.tsx güncelle - Ofis üyeliği bölümü
- [ ] PropertyList.tsx güncelle - Müşteri bilgisi gizleme
- [ ] Sidebar.tsx güncelle - Broker menüleri

### Faz 4: Test ve İyileştirme (2-3 gün)
- [ ] Birim testleri
- [ ] Entegrasyon testleri
- [ ] Kullanıcı kabul testleri
- [ ] Performans optimizasyonu

---

## 10. Test Senaryoları

### Senaryo 1: Bireysel Kayıt ve Kullanım
```
1. Landing page'den kayıt ol
2. Portföy ekle (20'ye kadar)
3. Müşteri ekle (50'ye kadar)
4. Talep oluştur
5. Eşleşme bul
6. Web sitesi oluştur
```

### Senaryo 2: Ofise Katılım
```
1. Broker davet linki oluşturur
2. Bireysel kullanıcı linke tıklar
3. Ofis bilgilerini görür, onaylar
4. Profil güncellenir (office_id, role)
5. Mevcut portföyler ofis arkadaşlarına görünür olur
6. Müşteriler hala gizli kalır
```

### Senaryo 3: Cross-Consultant Eşleşme
```
1. Danışman A talep oluşturur
2. Sistem Danışman B'nin portföyüyle eşleşme bulur
3. Danışman A'ya bildirim: "Uygun ilan bulundu"
4. Danışman B'ye bildirim: "Portföyünüze ilgi var"
5. Her iki danışman da birbirinin adını görür
6. Müşteri bilgileri gizli kalır
```

### Senaryo 4: Ofisten Ayrılma
```
1. Danışman ofisten ayrılma isteği yapar
2. Sistem onay ister
3. Profil güncellenir (office_id = null)
4. Tüm verileri onunla gider
5. Eski ofis arkadaşları artık portföylerini göremez
6. Bireysel olarak çalışmaya devam eder
```

### Senaryo 5: Ofis Değişikliği
```
1. Danışman başka ofisten davet alır
2. Linke tıklar
3. "Mevcut ofisten ayrılacaksınız" uyarısı
4. Onaylar
5. Yeni ofise katılır
6. Tüm verileri yeni ofiste görünür
```

---

## Özet

Bu plan, Emlak CRM Pro'yu tam teşekküllü bir SaaS platformuna dönüştürür:

1. **Veri taşınabilirliği** - Kullanıcı nereye giderse verisi onunla gider
2. **Müşteri gizliliği** - Müşteri bilgileri sadece sahibine ait
3. **Ofis içi işbirliği** - Portföyler ve talepler paylaşılır, eşleşmeler bulunur
4. **Kolay geçiş** - Tek linkle ofise katılma/ayrılma
5. **Bildirim sistemi** - Anlık eşleşme ve aktivite bildirimleri

Uygulama tahmini süre: **8-12 gün**

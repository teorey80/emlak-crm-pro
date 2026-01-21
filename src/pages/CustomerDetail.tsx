import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Briefcase, Building2, Calendar, CheckCircle, Clock, Dog, Edit, Home, Info, Mail, MapPin, MessageSquare, MoreHorizontal, Phone, PlusCircle, Trash2, User, XCircle } from 'lucide-react';
import AddToCalendarButton from '../components/AddToCalendarButton';
import DocumentManager from '../components/DocumentManager';
import { useData } from '../context/DataContext';

const CustomerDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { customers, properties, activities, requests, deleteCustomer } = useData();
    const customer = customers.find(c => c.id === id);

    if (!customer) {
        return <div className="p-10 text-center text-gray-500 dark:text-slate-400">Müşteri bulunamadı.</div>;
    }

    const handleDelete = async () => {
        if (window.confirm('Bu müşteriyi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.')) {
            await deleteCustomer(customer.id);
            navigate('/customers');
        }
    };

    // filter activities
    const scheduledActivities = activities
        .filter(a => a.customerId === id && a.status === 'Planlandı')
        .sort((a, b) => new Date(`${a.date}T${a.time || '00:00'}`).getTime() - new Date(`${b.date}T${b.time || '00:00'}`).getTime());

    const pastActivities = activities
        .filter(a => a.customerId === id && a.status !== 'Planlandı')
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Function to get icon based on activity type
    const getActivityIcon = (type: string) => {
        switch (type) {
            case 'Telefon Görüşmesi': return <Phone className="w-4 h-4" />;
            case 'E-posta': return <Mail className="w-4 h-4" />;
            case 'Yer Gösterimi': return <MapPin className="w-4 h-4" />;
            case 'Ofis Toplantısı': return <Briefcase className="w-4 h-4" />;
            default: return <MessageSquare className="w-4 h-4" />;
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'Olumlu': return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400">Olumlu</span>;
            case 'Olumsuz': return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400">Olumsuz</span>;
            case 'Düşünüyor': return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400">Düşünüyor</span>;
            default: return null;
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Breadcrumb & Back */}
            <button onClick={() => navigate(-1)} className="flex items-center text-gray-500 dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 transition-colors text-sm mb-2">
                <ArrowLeft className="w-4 h-4 mr-1" />
                Listeye Dön
            </button>

            <div className="flex flex-col lg:flex-row gap-8">
                {/* Main Content Left Column (History) */}
                <div className="flex-1 space-y-6 order-2 lg:order-1">

                    {/* Upcoming Appointments */}
                    {scheduledActivities.length > 0 && (
                        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-l-4 border-l-[#1193d4] border-gray-100 dark:border-slate-700 transition-colors">
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                                <Calendar className="w-5 h-5 text-[#1193d4]" />
                                Yaklaşan Randevular
                            </h3>
                            <div className="space-y-4">
                                {scheduledActivities.map(activity => (
                                    <div key={activity.id} className="bg-sky-50 dark:bg-sky-900/10 p-4 rounded-xl border border-sky-100 dark:border-sky-800/30">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="font-bold text-slate-800 dark:text-slate-200">{activity.type}</span>
                                                    <span className="text-xs bg-sky-100 text-sky-700 px-2 py-0.5 rounded-full font-medium">Planlandı</span>
                                                </div>
                                                <div className="text-sm text-gray-600 dark:text-slate-400 mb-2">
                                                    {activity.date} - {activity.time || 'Sat Belirtilmedi'}
                                                </div>
                                                {activity.propertyTitle && (
                                                    <div className="text-xs font-medium text-gray-500 mb-2">
                                                        İlgili: {activity.propertyTitle}
                                                    </div>
                                                )}
                                                <p className="text-sm text-gray-700 dark:text-slate-300">{activity.description}</p>
                                            </div>
                                            <AddToCalendarButton
                                                title={`Emlak Randevusu: ${activity.type} - ${customer.name}`}
                                                date={activity.date}
                                                time={activity.time}
                                                description={`${activity.description} \n\nMüşteri: ${customer.name} \nTel: ${customer.phone}`}
                                                location={activity.propertyTitle || 'Ofis'}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Followed Matches Section */}
                    {(() => {
                        const customerRequests = requests.filter(r => r.customerId === id && r.status === 'Aktif');
                        if (customerRequests.length === 0) return null;

                        // Find matching properties unique by ID
                        const textToNumber = (val: number | string) => typeof val === 'string' ? parseFloat(val.replace(/[^\d.-]/g, '')) : val;

                        const matches = Array.from(new Set(
                            customerRequests.flatMap(req =>
                                properties.filter(p => {
                                    // Price check (if set)
                                    if (req.minPrice && textToNumber(p.price) < req.minPrice) return false;
                                    if (req.maxPrice && textToNumber(p.price) > req.maxPrice) return false;

                                    // Type check
                                    if (req.type && p.type !== req.type) return false;
                                    if (req.requestType === 'Satılık' && p.status !== 'Satılık') return false;
                                    if (req.requestType === 'Kiralık' && p.status !== 'Kiralık') return false;

                                    // Location check (fuzzy)
                                    if (req.city && p.city && !p.city.includes(req.city)) return false;
                                    if (req.district && p.district && !p.district.includes(req.district) && req.district !== 'Tümü') return false;

                                    // Room check (exact match for now, could be improved)
                                    if (req.minRooms && p.rooms && p.rooms !== req.minRooms) return false;

                                    return true;
                                })
                            )
                        ));

                        if (matches.length === 0) return null;

                        return (
                            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-l-4 border-l-emerald-500 border-gray-100 dark:border-slate-700 transition-colors">
                                <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                                    <CheckCircle className="w-5 h-5 text-emerald-500" />
                                    Takip Edilen Eşleşmeler ({matches.length})
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {matches.map(property => (
                                        <Link to={`/properties/${property.id}`} key={property.id} className="group block bg-white dark:bg-slate-700 rounded-xl border border-gray-200 dark:border-slate-600 overflow-hidden hover:shadow-md transition-all">
                                            <div className="relative h-32">
                                                <img src={property.images[0] || 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'} alt={property.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                                <div className="absolute top-2 right-2 bg-white/90 dark:bg-slate-900/90 backdrop-blur px-2 py-1 rounded text-xs font-bold text-slate-800 dark:text-white">
                                                    {property.price.toLocaleString()} {property.currency}
                                                </div>
                                            </div>
                                            <div className="p-3">
                                                <h4 className="font-semibold text-slate-800 dark:text-white text-sm line-clamp-1 group-hover:text-[#1193d4] transition-colors">{property.title}</h4>
                                                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-1">
                                                    <span>{property.city}/{property.district}</span>
                                                    <span>•</span>
                                                    <span>{property.rooms}</span>
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        );
                    })()}

                    {/* Timeline Section */}
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 transition-colors">
                        <div className="flex justify-between items-center mb-6 border-b border-gray-100 dark:border-slate-700 pb-4">
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white">Müşteri Aktiviteleri</h3>
                            <Link to="/activities/new" className="flex items-center text-sm text-white bg-[#1193d4] hover:bg-sky-700 px-3 py-1.5 rounded-lg font-medium transition-colors shadow-sm">
                                <PlusCircle className="w-4 h-4 mr-1.5" />
                                Yeni Aktivite Ekle
                            </Link>
                        </div>

                        {pastActivities.length === 0 && scheduledActivities.length === 0 ? (
                            <div className="text-center py-10 text-gray-400 dark:text-slate-500">
                                <Clock className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                <p>Henüz kaydedilmiş bir aktivite yok.</p>
                                <p className="text-sm mt-2">Sağ üstteki butondan yeni bir yer gösterimi veya görüşme ekleyebilirsiniz.</p>
                            </div>
                        ) : (
                            <ol className="relative border-l border-gray-200 dark:border-slate-700 ml-3 space-y-8">
                                {pastActivities.map((activity) => (
                                    <li key={activity.id} className="ml-6">
                                        <span className="absolute flex items-center justify-center w-8 h-8 bg-sky-100 dark:bg-sky-900/50 rounded-full -left-4 ring-4 ring-white dark:ring-slate-800 text-sky-600 dark:text-sky-400">
                                            {getActivityIcon(activity.type)}
                                        </span>
                                        <div className="p-4 bg-gray-50 dark:bg-slate-700 rounded-xl border border-gray-100 dark:border-slate-600 shadow-sm hover:bg-sky-50/30 dark:hover:bg-sky-900/20 transition-colors">
                                            <div className="flex flex-col sm:flex-row justify-between items-start mb-2 gap-2">
                                                <div className="flex items-center gap-2">
                                                    <h4 className="text-sm font-bold text-gray-900 dark:text-slate-200">{activity.type}</h4>
                                                    {getStatusBadge(activity.status)}
                                                </div>
                                                <time className="text-xs font-normal text-gray-500 dark:text-slate-400 bg-white dark:bg-slate-800 px-2 py-1 rounded border border-gray-200 dark:border-slate-600">{activity.date}</time>
                                            </div>

                                            {activity.propertyTitle && (
                                                <Link to={`/properties/${activity.propertyId}`} className="block mb-2 text-xs font-semibold text-[#1193d4] hover:underline">
                                                    İlgili Emlak: {activity.propertyTitle}
                                                </Link>
                                            )}

                                            <p className="text-sm text-gray-600 dark:text-slate-300 leading-relaxed">{activity.description}</p>
                                        </div>
                                    </li>
                                ))}
                                {/* Creation Event */}
                                <li className="ml-6">
                                    <span className="absolute flex items-center justify-center w-8 h-8 bg-emerald-100 dark:bg-emerald-900/50 rounded-full -left-4 ring-4 ring-white dark:ring-slate-800 text-emerald-600 dark:text-emerald-400">
                                        <PlusCircle className="w-4 h-4" />
                                    </span>
                                    <div className="p-4 bg-white dark:bg-slate-800">
                                        <h4 className="text-sm font-bold text-gray-900 dark:text-slate-200">Müşteri Oluşturuldu</h4>
                                        <time className="block mb-2 text-xs font-normal text-gray-400 dark:text-slate-500">{customer.createdAt}</time>
                                        <p className="text-sm text-gray-500 dark:text-slate-400">Müşteri kaydı {customer.source} kaynağı üzerinden sisteme eklendi.</p>
                                    </div>
                                </li>
                            </ol>
                        )}
                    </div>

                    {/* Documents Section */}
                    <DocumentManager
                        entityType="customer"
                        entityId={customer.id}
                        entityName={customer.name}
                    />
                </div>

                {/* Profile Sidebar Right Column */}
                <div className="w-full lg:w-96 space-y-6 order-1 lg:order-2">
                    {/* Customer Card */}
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 transition-colors">
                        <div className="text-center mb-6">
                            <div className="w-20 h-20 bg-sky-100 dark:bg-sky-900/50 text-sky-600 dark:text-sky-400 rounded-full mx-auto flex items-center justify-center text-2xl font-bold mb-3">
                                {customer.name.charAt(0)}
                            </div>
                            <h1 className="text-xl font-bold text-slate-800 dark:text-white">{customer.name}</h1>
                            <span className={`mt-2 inline-block px-3 py-1 rounded-full text-xs font-medium ${customer.status === 'Aktif' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' :
                                customer.status === 'Potansiyel' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' :
                                    'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                                } `}>
                                {customer.status}
                            </span>
                        </div>

                        <div className="space-y-4 border-t border-gray-100 dark:border-slate-700 pt-6">
                            <div className="flex items-center gap-3 text-gray-600 dark:text-slate-400">
                                <Phone className="w-5 h-5 text-gray-400 dark:text-slate-500" />
                                <span className="text-sm">{customer.phone}</span>
                            </div>
                            <div className="flex items-center gap-3 text-gray-600 dark:text-slate-400">
                                <Mail className="w-5 h-5 text-gray-400 dark:text-slate-500" />
                                <span className="text-sm">{customer.email}</span>
                            </div>
                            <div className="flex items-center gap-3 text-gray-600 dark:text-slate-400">
                                <Calendar className="w-5 h-5 text-gray-400 dark:text-slate-500" />
                                <span className="text-sm">Kayıt: {customer.createdAt}</span>
                            </div>

                            {/* Professional Info */}
                            {(customer.occupation || customer.company) && (
                                <div className="flex items-start gap-3 text-gray-600 dark:text-slate-400 border-t border-gray-50 dark:border-slate-700/50 pt-3 mt-3">
                                    <Briefcase className="w-5 h-5 text-gray-400 dark:text-slate-500 mt-0.5" />
                                    <div className="text-sm">
                                        <div className="font-medium text-slate-700 dark:text-slate-300">İş / Meslek</div>
                                        {customer.occupation && <div>{customer.occupation}</div>}
                                        {customer.company && <div className="text-gray-400 text-xs">{customer.company}</div>}
                                    </div>
                                </div>
                            )}

                            {/* Personal Info */}
                            {(customer.birthDate || customer.maritalStatus) && (
                                <div className="flex items-start gap-3 text-gray-600 dark:text-slate-400 border-t border-gray-50 dark:border-slate-700/50 pt-3 mt-3">
                                    <User className="w-5 h-5 text-gray-400 dark:text-slate-500 mt-0.5" />
                                    <div className="text-sm">
                                        <div className="font-medium text-slate-700 dark:text-slate-300">Kişisel Bilgiler</div>
                                        {customer.birthDate && <div>Doğum: {customer.birthDate}</div>}
                                        {customer.maritalStatus && <div>Durum: {customer.maritalStatus}</div>}
                                    </div>
                                </div>
                            )}

                            {/* Extended Info */}
                            {(customer.currentRegion || customer.currentHousingStatus) && (
                                <div className="flex items-start gap-3 text-gray-600 dark:text-slate-400 border-t border-gray-50 dark:border-slate-700/50 pt-3 mt-3">
                                    <Home className="w-5 h-5 text-gray-400 dark:text-slate-500 mt-0.5" />
                                    <div className="text-sm">
                                        <div className="font-medium text-slate-700 dark:text-slate-300">Yaşam Alanı</div>
                                        {customer.currentRegion && <div>{customer.currentRegion}</div>}
                                        {customer.currentHousingStatus && <div className="text-gray-400 text-xs">({customer.currentHousingStatus})</div>}
                                    </div>
                                </div>
                            )}

                            {customer.hasPets && (
                                <div className="flex items-start gap-3 text-gray-600 dark:text-slate-400 pt-1">
                                    <Dog className="w-5 h-5 text-gray-400 dark:text-slate-500 mt-0.5" />
                                    <div className="text-sm">
                                        <div className="font-medium text-slate-700 dark:text-slate-300">Evcil Hayvan</div>
                                        <div>{customer.petDetails || 'Var'}</div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="mt-8 grid grid-cols-2 gap-3">
                            <Link to={`/customers/edit/${id}`} className="w-full py-2.5 rounded-lg bg-sky-600 text-white text-sm font-medium hover:bg-sky-700 transition-colors flex items-center justify-center">
                                <Edit className="w-4 h-4 mr-2" />
                                Düzenle
                            </Link>
                            <button
                                onClick={handleDelete}
                                className="w-full py-2.5 rounded-lg border border-red-200 dark:border-red-900/30 bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 text-sm font-medium hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors flex items-center justify-center"
                            >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Sil
                            </button>
                        </div>
                    </div>

                    {/* Quick Notes */}
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 transition-colors">
                        <h3 className="font-bold text-slate-800 dark:text-white mb-3">Notlar</h3>
                        <div className="text-sm text-gray-600 dark:text-amber-200 bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg border border-amber-100 dark:border-amber-900/30">
                            {customer.notes || "Bu müşteri için henüz özel bir not eklenmemiş."}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CustomerDetail;
import React from 'react';
import Layout from '../components/Layout';

const CONTACT_INFO = [
    { label: 'Điện thoại', value: '028 3736 0889' },
    { label: 'Fax', value: '028 3736 0890' },
    { label: 'E-mail', value: 'shtplabs@shtplabs.org' },
    { label: 'Website', value: 'http://shtplabs.org', isLink: true },
    { label: 'Địa chỉ', value: 'Lô I3 đường N2, Khu Công nghệ cao, Phường Tăng Nhơn Phú, Thành Phố Hồ Chí Minh' },
];

const Contact: React.FC = () => {
    const [mapLoaded, setMapLoaded] = React.useState(false);
    return (
        <Layout>
            <div className="bg-gray-50 min-h-screen flex flex-col font-sans">
                {/* Block thông tin liên hệ căn giữa, giảm margin top */}
                <div className="flex justify-center w-full px-2 mt-12">
                    <div className="bg-white rounded-2xl shadow p-6 md:p-10 w-full max-w-6xl border border-gray-200">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {/* Cột 1: Thông tin chung */}
                            <div>
                                <div className="flex flex-row items-center justify-center gap-4 md:gap-6 mb-4">
                                    <img src="/images/logo.png" alt="HTPLabs Logo" className="h-14 md:h-16 object-contain" />
                                    <img src="/images/hcld.png" alt="HCLD" className="h-8 md:h-10 object-contain" />
                                </div>
                                <h3 className="font-bold text-lg mb-3 text-gray-900">Thông tin chung</h3>
                                <div className="text-gray-800 text-sm leading-relaxed space-y-1">
                                    <div><span className="font-bold">Trung tâm Nghiên cứu Triển khai Khu CNC TP.HCM</span></div>
                                    <div>Số điện thoại liên hệ: <span className="font-medium">(+84-8)37360889</span></div>
                                    <div>E-mail: <span className="font-medium">shptlabs@shtplabs.org</span></div>
                                    <div>Mã số thuế: <span className="font-medium">0309552616</span></div>
                                    <div>Fax: <span className="font-medium">028 3736 0890</span></div>
                                    <div>
                                        <span className="font-medium">Website:</span> <a href="http://shtplabs.org" className="text-blue-700 hover:underline" target="_blank" rel="noopener noreferrer">http://shtplabs.org</a>
                                    </div>
                                    <div>
                                        <span className="font-medium">Trụ sở:</span> Lô I3 đường N2, Khu Công nghệ cao, Phường Tăng Nhơn Phú, Thành phố Chí Minh
                                    </div>
                                </div>
                            </div>
                            {/* Map chiếm 2 cột trên desktop, 1 cột trên mobile */}
                            <div className="md:col-span-2 flex flex-col h-full">
                                <div className="flex-1 relative" style={{ minHeight: 260 }}>
                                    {!mapLoaded && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-2xl animate-pulse z-10">
                                            <span className="text-gray-400">Đang tải bản đồ...</span>
                                        </div>
                                    )}
                                    <iframe
                                        title="R&D Center, Saigon High Tech Park"
                                        src="https://www.google.com/maps?q=R%26D+Center,+Saigon+High+Tech+Park,+Lot+I3,+N2+street,+Ho+Chi+Minh+City,+Vietnam&hl=vi&z=17&output=embed"
                                        width="100%"
                                        height="360"
                                        style={{ border: 0, borderRadius: '16px', minHeight: '260px' }}
                                        allowFullScreen={true}
                                        loading="lazy"
                                        referrerPolicy="no-referrer-when-downgrade"
                                        onLoad={() => setMapLoaded(true)}
                                    ></iframe>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default Contact; 
import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import Modal from '../components/Modal';
import { authService } from '../services/authService';
import { fetchNewsList, createNews, uploadNewsImage, updateNews, deleteNews } from '../services/dataApi';

const News: React.FC = () => {
    const [newsList, setNewsList] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedNews, setSelectedNews] = useState<null | any>(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editNews, setEditNews] = useState<null | any>(null);
    const [addForm, setAddForm] = useState({ title: '', summary: '', content: '', image: '' });
    const [addLoading, setAddLoading] = useState(false);
    const [addError, setAddError] = useState<string | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [addImageFile, setAddImageFile] = useState<File | null>(null);
    const [editForm, setEditForm] = useState({ title: '', summary: '', content: '', image: '' });
    const [editLoading, setEditLoading] = useState(false);
    const [editError, setEditError] = useState<string | null>(null);
    const [editImagePreview, setEditImagePreview] = useState<string | null>(null);
    const [editImageFile, setEditImageFile] = useState<File | null>(null);
    const user = authService.getCurrentUser();
    const isAdminOrManager = user && user.role && (user.role.toLowerCase() === 'admin' || user.role.toLowerCase() === 'manager');
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 6;
    const totalPages = Math.ceil(newsList.length / pageSize);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [newsToDelete, setNewsToDelete] = useState<any>(null);

    useEffect(() => {
        setLoading(true);
        fetchNewsList()
            .then(data => {
                setNewsList(Array.isArray(data) ? data : []);
                setLoading(false);
            })
            .catch(err => {
                setError('Không thể tải danh sách tin tức.');
                setLoading(false);
            });
    }, []);

    // Hàm upload ảnh lên server (dùng API mới)
    async function handleImageUpload(file: File) {
        return await uploadNewsImage(file);
    }

    useEffect(() => {
        if (editNews) {
            setEditForm({
                title: editNews.Title || '',
                summary: editNews.Summary || '',
                content: editNews.Content || '',
                image: editNews.Image || ''
            });
            setEditImagePreview(null);
            setEditImageFile(null);
            setEditError(null);
        }
    }, [editNews]);

    // Thêm hàm formatDate
    function formatDate(dateStr: string) {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        const day = d.getDate().toString().padStart(2, '0');
        const month = (d.getMonth() + 1).toString().padStart(2, '0');
        const year = d.getFullYear();
        return `${day}/${month}/${year}`;
    }

    const sortedNews = [...newsList].sort((a, b) => new Date(b.CreatedAt).getTime() - new Date(a.CreatedAt).getTime());
    const paginatedNews = sortedNews.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    return (
        <Layout>
            <div className="container mx-auto p-6 bg-gray-50 min-h-screen">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold text-gray-800">Tin tức</h1>
                    {isAdminOrManager && (
                        <button
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                            onClick={() => setIsAddModalOpen(true)}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                            </svg>
                            Thêm tin tức mới
                        </button>
                    )}
                </div>
                {loading ? (
                    <div>Đang tải tin tức...</div>
                ) : error ? (
                    <div className="text-red-500">{error}</div>
                ) : (
                    <>
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {paginatedNews.map((news, idx) => (
                                <div
                                    key={news.Id || idx}
                                    className="bg-white rounded-lg shadow-md p-0 hover:shadow-lg transition-shadow cursor-pointer flex flex-col group"
                                    onClick={() => setSelectedNews(news)}
                                >
                                    <div className="w-full h-40 bg-gray-200 rounded-t-lg flex items-center justify-center overflow-hidden relative">
                                        {news.Image ? (
                                            <img
                                                src={
                                                    news.Image.startsWith('http')
                                                        ? news.Image
                                                        : `/api${news.Image}`
                                                }
                                                alt={news.Title}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <span className="text-gray-400">Không có ảnh</span>
                                        )}
                                        {isAdminOrManager && (
                                            <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                                                <button
                                                    className="w-8 h-8 rounded-full bg-yellow-100 text-yellow-600 hover:bg-yellow-200 flex items-center justify-center"
                                                    title="Sửa tin"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setEditNews(news);
                                                    }}
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L16.732 3.732z" />
                                                    </svg>
                                                </button>
                                                <button
                                                    className="w-8 h-8 rounded-full bg-red-100 text-red-600 hover:bg-red-200 flex items-center justify-center"
                                                    title="Xóa tin"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setNewsToDelete(news);
                                                        setShowDeleteModal(true);
                                                    }}
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                                    </svg>
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-5 flex-1 flex flex-col">
                                        <h2 className="text-xl font-semibold text-black mb-2">{news.Title}</h2>
                                        <p className="text-gray-500 text-sm mb-2">{news.CreatedAt ? formatDate(news.CreatedAt) : ''}</p>
                                        <p className="text-gray-700">{news.Summary}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        {totalPages > 1 && (
                            <div className="flex justify-center mt-6 gap-2">
                                <button
                                    className="px-3 py-1 rounded bg-gray-200"
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                >
                                    Trước
                                </button>
                                {[...Array(totalPages)].map((_, i) => (
                                    <button
                                        key={i}
                                        className={`px-3 py-1 rounded ${currentPage === i + 1 ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                                        onClick={() => setCurrentPage(i + 1)}
                                    >
                                        {i + 1}
                                    </button>
                                ))}
                                <button
                                    className="px-3 py-1 rounded bg-gray-200"
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                >
                                    Sau
                                </button>
                            </div>
                        )}
                    </>
                )}
                <Modal isOpen={!!selectedNews} onClose={() => setSelectedNews(null)} showCloseButton={true}>
                    {selectedNews && (
                        <div className="w-[80vw] max-w-[1200px] p-8" style={{ maxHeight: '80vh', overflowY: 'auto' }}>
                            <div className="w-full flex justify-center mb-6">
                                <div className="inline-block rounded-2xl overflow-hidden bg-gray-100">
                                    {selectedNews.Image ? (
                                        <img
                                            src={selectedNews.Image.startsWith('http') ? selectedNews.Image : `/api${selectedNews.Image}`}
                                            alt={selectedNews.Title}
                                            className="block rounded-2xl"
                                            style={{ maxWidth: '100%', height: 'auto', display: 'block' }}
                                        />
                                    ) : (
                                        <span className="text-gray-400">Không có ảnh</span>
                                    )}
                                </div>
                            </div>
                            <h2 className="text-2xl font-bold text-black mb-2">{selectedNews.Title}</h2>
                            <p className="text-gray-500 text-sm mb-4">{selectedNews.CreatedAt ? formatDate(selectedNews.CreatedAt) : ''}</p>
                            <div className="text-gray-800 text-base whitespace-pre-line">{selectedNews.Content}</div>
                        </div>
                    )}
                </Modal>
                <Modal isOpen={isAddModalOpen} onClose={() => { setIsAddModalOpen(false); setAddForm({ title: '', summary: '', content: '', image: '' }); setAddError(null); setImagePreview(null); setAddImageFile(null); }} showCloseButton={true}>
                    <div className="w-[90vw] max-w-[500px] p-6">
                        <h2 className="text-xl font-bold mb-4">Thêm tin tức mới</h2>
                        <form
                            onSubmit={async (e) => {
                                e.preventDefault();
                                setAddLoading(true);
                                setAddError(null);
                                try {
                                    let imageUrl = '';
                                    if (addImageFile) {
                                        imageUrl = await handleImageUpload(addImageFile);
                                    }
                                    if (!addForm.title || !addForm.content) {
                                        setAddError('Tiêu đề và nội dung là bắt buộc.');
                                        setAddLoading(false);
                                        return;
                                    }
                                    const res = await createNews({ ...addForm, image: imageUrl });
                                    if (res && res.success) {
                                        setIsAddModalOpen(false);
                                        setAddForm({ title: '', summary: '', content: '', image: '' });
                                        setAddError(null);
                                        setImagePreview(null);
                                        setAddImageFile(null);
                                        setLoading(true);
                                        fetchNewsList().then(data => {
                                            setNewsList(Array.isArray(data) ? data : []);
                                            setLoading(false);
                                        });
                                    } else {
                                        setAddError(res?.message || 'Thêm tin tức thất bại.');
                                    }
                                } catch (err) {
                                    setAddError('Thêm tin tức thất bại.');
                                }
                                setAddLoading(false);
                            }}
                        >
                            <div className="mb-3">
                                <label className="block font-medium mb-1">Ảnh minh họa</label>
                                <div className="rounded-lg border border-gray-300 bg-gray-50 p-4 flex flex-col items-center gap-2 shadow-sm">
                                    <div className="flex items-center gap-4 w-full">
                                        <label
                                            htmlFor="news-image-upload"
                                            className="cursor-pointer px-4 py-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 flex items-center gap-2 transition"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5" />
                                            </svg>
                                            {addForm.image ? "Đổi ảnh" : "Chọn ảnh"}
                                            <input
                                                id="news-image-upload"
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0];
                                                    if (file) {
                                                        setImagePreview(URL.createObjectURL(file));
                                                        setAddImageFile(file);
                                                        setAddForm(f => ({ ...f, image: '' }));
                                                    } else {
                                                        setImagePreview(null);
                                                        setAddImageFile(null);
                                                        setAddForm(f => ({ ...f, image: '' }));
                                                    }
                                                }}
                                            />
                                        </label>
                                        {addForm.image && (
                                            <button
                                                type="button"
                                                className="text-red-500 hover:text-red-700 text-sm"
                                                onClick={() => {
                                                    setImagePreview(null);
                                                    setAddImageFile(null);
                                                    setAddForm(f => ({ ...f, image: '' }));
                                                }}
                                            >
                                                Xóa ảnh
                                            </button>
                                        )}
                                    </div>
                                    {imagePreview && (
                                        <img
                                            src={imagePreview}
                                            alt="Preview"
                                            className="mt-2 max-h-40 rounded-lg border border-gray-200 shadow hover:shadow-lg transition w-full object-cover"
                                        />
                                    )}
                                </div>
                            </div>
                            <div className="mb-3">
                                <label className="block font-medium mb-1">Tiêu đề *</label>
                                <input type="text" className="w-full border rounded px-3 py-2" value={addForm.title} onChange={e => setAddForm(f => ({ ...f, title: e.target.value }))} required />
                            </div>
                            <div className="mb-3">
                                <label className="block font-medium mb-1">Tóm tắt</label>
                                <input type="text" className="w-full border rounded px-3 py-2" value={addForm.summary} onChange={e => setAddForm(f => ({ ...f, summary: e.target.value }))} />
                            </div>
                            <div className="mb-3">
                                <label className="block font-medium mb-1">Nội dung *</label>
                                <textarea className="w-full border rounded px-3 py-2" rows={5} value={addForm.content} onChange={e => setAddForm(f => ({ ...f, content: e.target.value }))} required />
                            </div>
                            {addError && <div className="text-red-500 mb-2">{addError}</div>}
                            <div className="flex justify-end gap-2">
                                <button type="button" className="px-4 py-2 bg-gray-200 rounded" onClick={() => { setIsAddModalOpen(false); setAddForm({ title: '', summary: '', content: '', image: '' }); setAddError(null); setImagePreview(null); setAddImageFile(null); }}>Hủy</button>
                                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700" disabled={addLoading}>{addLoading ? 'Đang lưu...' : 'Lưu'}</button>
                            </div>
                        </form>
                    </div>
                </Modal>
                <Modal isOpen={!!editNews} onClose={() => {
                    setEditNews(null);
                    setEditForm({ title: '', summary: '', content: '', image: '' });
                    setEditError(null);
                    setEditImagePreview(null);
                    setEditImageFile(null);
                }} showCloseButton={true}>
                    <div className="w-[90vw] max-w-[500px] p-6">
                        <h2 className="text-xl font-bold mb-4">Sửa tin tức</h2>
                        {editNews && (
                            <form
                                onSubmit={async (e) => {
                                    e.preventDefault();
                                    setEditLoading(true);
                                    setEditError(null);
                                    try {
                                        let imageUrl = editForm.image;
                                        if (editImageFile) {
                                            imageUrl = await handleImageUpload(editImageFile);
                                        }
                                        if (!editForm.title || !editForm.content) {
                                            setEditError('Tiêu đề và nội dung là bắt buộc.');
                                            setEditLoading(false);
                                            return;
                                        }
                                        const res = await updateNews(editNews.Id, { ...editForm, image: imageUrl });
                                        if (res && res.success) {
                                            setEditNews(null);
                                            setEditForm({ title: '', summary: '', content: '', image: '' });
                                            setEditError(null);
                                            setEditImagePreview(null);
                                            setEditImageFile(null);
                                            setLoading(true);
                                            fetchNewsList().then(data => {
                                                setNewsList(Array.isArray(data) ? data : []);
                                                setLoading(false);
                                            });
                                        } else {
                                            setEditError(res?.message || 'Cập nhật tin tức thất bại.');
                                        }
                                    } catch (err) {
                                        setEditError('Cập nhật tin tức thất bại.');
                                    }
                                    setEditLoading(false);
                                }}
                            >
                                <div className="mb-3">
                                    <label className="block font-medium mb-1">Ảnh minh họa</label>
                                    <div className="rounded-lg border border-gray-300 bg-gray-50 p-4 flex flex-col items-center gap-2 shadow-sm">
                                        <div className="flex items-center gap-4 w-full">
                                            <label
                                                htmlFor="edit-news-image-upload"
                                                className="cursor-pointer px-4 py-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 flex items-center gap-2 transition"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5" />
                                                </svg>
                                                {editForm.image ? "Đổi ảnh" : "Chọn ảnh"}
                                                <input
                                                    id="edit-news-image-upload"
                                                    type="file"
                                                    accept="image/*"
                                                    className="hidden"
                                                    onChange={(e) => {
                                                        const file = e.target.files?.[0];
                                                        if (file) {
                                                            setEditImagePreview(URL.createObjectURL(file));
                                                            setEditImageFile(file);
                                                            setEditForm(f => ({ ...f, image: '' }));
                                                        } else {
                                                            setEditImagePreview(null);
                                                            setEditImageFile(null);
                                                            setEditForm(f => ({ ...f, image: '' }));
                                                        }
                                                    }}
                                                />
                                            </label>
                                            {editForm.image && (
                                                <button
                                                    type="button"
                                                    className="text-red-500 hover:text-red-700 text-sm"
                                                    onClick={() => {
                                                        setEditImagePreview(null);
                                                        setEditImageFile(null);
                                                        setEditForm(f => ({ ...f, image: '' }));
                                                    }}
                                                >
                                                    Xóa ảnh
                                                </button>
                                            )}
                                        </div>
                                        {(editImagePreview || editForm.image) && (
                                            <img
                                                src={editImagePreview || (editForm.image.startsWith('http') ? editForm.image : `/api${editForm.image}`)}
                                                alt="Preview"
                                                className="mt-2 max-h-40 rounded-lg border border-gray-200 shadow hover:shadow-lg transition w-full object-cover"
                                            />
                                        )}
                                    </div>
                                </div>
                                <div className="mb-3">
                                    <label className="block font-medium mb-1">Tiêu đề *</label>
                                    <input type="text" className="w-full border rounded px-3 py-2" value={editForm.title} onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))} required />
                                </div>
                                <div className="mb-3">
                                    <label className="block font-medium mb-1">Tóm tắt</label>
                                    <input type="text" className="w-full border rounded px-3 py-2" value={editForm.summary} onChange={e => setEditForm(f => ({ ...f, summary: e.target.value }))} />
                                </div>
                                <div className="mb-3">
                                    <label className="block font-medium mb-1">Nội dung *</label>
                                    <textarea className="w-full border rounded px-3 py-2" rows={5} value={editForm.content} onChange={e => setEditForm(f => ({ ...f, content: e.target.value }))} required />
                                </div>
                                {editError && <div className="text-red-500 mb-2">{editError}</div>}
                                <div className="flex justify-end gap-2">
                                    <button type="button" className="px-4 py-2 bg-gray-200 rounded" onClick={() => {
                                        setEditNews(null);
                                        setEditForm({ title: '', summary: '', content: '', image: '' });
                                        setEditError(null);
                                        setEditImagePreview(null);
                                        setEditImageFile(null);
                                    }}>Hủy</button>
                                    <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700" disabled={editLoading}>{editLoading ? 'Đang lưu...' : 'Lưu'}</button>
                                </div>
                            </form>
                        )}
                    </div>
                </Modal>
                <Modal isOpen={showDeleteModal} onClose={() => { setShowDeleteModal(false); setNewsToDelete(null); }} showCloseButton={true}>
                    <div className="p-8 max-w-sm text-center rounded-xl bg-white">
                        <div className="flex flex-col items-center mb-4">
                            <div className="bg-red-100 rounded-full p-3 mb-2">
                                <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z" />
                                </svg>
                            </div>
                            <div className="mb-2 text-lg font-bold text-gray-800">Xác nhận xóa tin tức</div>
                            <div className="mb-2 text-gray-600">Bạn có chắc chắn muốn xóa tin này?</div>
                            <div className="mb-4 text-base font-semibold text-red-600 truncate max-w-xs">{newsToDelete?.Title}</div>
                        </div>
                        <div className="flex justify-center gap-4">
                            <button
                                className="px-5 py-2 bg-gray-100 rounded-lg text-gray-700 font-medium hover:bg-gray-200 transition"
                                onClick={() => { setShowDeleteModal(false); setNewsToDelete(null); }}
                            >
                                Hủy
                            </button>
                            <button
                                className="px-5 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition shadow"
                                onClick={async () => {
                                    if (!newsToDelete) return;
                                    setShowDeleteModal(false);
                                    setLoading(true);
                                    try {
                                        await deleteNews(newsToDelete.Id);
                                        const data = await fetchNewsList();
                                        setNewsList(Array.isArray(data) ? data : []);
                                    } catch (err) {
                                        alert('Xóa tin thất bại!');
                                    }
                                    setLoading(false);
                                    setNewsToDelete(null);
                                }}
                            >
                                Xóa
                            </button>
                        </div>
                    </div>
                </Modal>
            </div>
        </Layout>
    );
};

export default News; 
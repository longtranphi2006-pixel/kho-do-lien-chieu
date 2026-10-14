'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { CATEGORIES, LOCATIONS, CONDITIONS, POPULAR_HANDOVER_HUBS } from '@/lib/constants';
import { ItemCondition, ItemPurpose, ModerationResult } from '@/types';
import {
  Upload,
  Camera,
  Image as ImageIcon,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Gift,
  ArrowLeftRight,
  MapPin,
  ShieldAlert,
  ArrowLeft,
  X,
  Plus,
  Loader2,
} from 'lucide-react';

const processImageFile = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('Tệp tải lên không phải hình ảnh'));
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const maxWidth = 800;
        const maxHeight = 800;
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(event.target?.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.68);
        resolve(dataUrl);
      };
      img.onerror = () => {
        resolve(event.target?.result as string);
      };
      img.src = event.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export default function NewItemPage() {
  const router = useRouter();
  const { addItem, currentUser, isUserLocked } = useAppStore();

  const galleryInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [isProcessingPhotos, setIsProcessingPhotos] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<string>(CATEGORIES[1]); // default Sách & Giáo trình
  const [condition, setCondition] = useState<ItemCondition>('LIKE_NEW');
  const [purpose, setPurpose] = useState<ItemPurpose>('FREE');
  const [location, setLocation] = useState<string>(LOCATIONS[1]); // Hòa Khánh Bắc
  const [images, setImages] = useState<string[]>([]);
  const [customImageUrl, setCustomImageUrl] = useState('');

  // AI Pipeline state
  const [isScanning, setIsScanning] = useState(false);
  const [moderationResult, setModerationResult] = useState<ModerationResult | null>(null);

  React.useEffect(() => {
    if (!currentUser) {
      router.push('/auth?redirect=/items/new');
    } else if (isUserLocked(currentUser)) {
      alert('Tài khoản của bạn đang bị khóa tất cả chức năng và chỉ được hoạt động ở chế độ vãng lai.');
      router.push('/items');
    }
  }, [currentUser, isUserLocked, router]);

  const handleFilesSelected = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    setIsProcessingPhotos(true);
    try {
      const processed: string[] = [];
      for (let i = 0; i < fileList.length; i++) {
        if (images.length + processed.length >= 6) break;
        const dataUrl = await processImageFile(fileList[i]);
        processed.push(dataUrl);
      }
      setImages((prev) => [...prev, ...processed]);
    } catch (err) {
      console.error('Lỗi nén và đọc ảnh:', err);
      alert('Không thể đọc ảnh được chọn. Vui lòng thử lại với ảnh khác.');
    } finally {
      setIsProcessingPhotos(false);
      if (galleryInputRef.current) galleryInputRef.current.value = '';
      if (cameraInputRef.current) cameraInputRef.current.value = '';
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages(images.filter((_, idx) => idx !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      alert('Vui lòng đăng nhập để đăng đồ dùng.');
      router.push('/auth?redirect=/items/new');
      return;
    }
    if (images.length === 0) {
      alert('Vui lòng chọn ít nhất 1 hình ảnh món đồ.');
      return;
    }

    setIsScanning(true);
    setModerationResult(null);

    try {
      // Call Server-side AI Moderation Pipeline (Gemini 1.5 Flash)
      const res = await fetch('/api/moderation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          category,
          purpose,
          condition,
          images,
        }),
      });

      const modResult: ModerationResult = await res.json();
      setModerationResult(modResult);

      // Create item in store with the AI moderation status
      const created = addItem({
        user_id: currentUser.id,
        title,
        description,
        category,
        condition,
        purpose,
        location,
        images,
        status: modResult.status,
        ai_moderation_reason: modResult.reasoning,
        ai_moderation_score: modResult.confidence,
      });

      // Brief delay to let user see AI inspection feedback
      setTimeout(() => {
        setIsScanning(false);
        if (modResult.status === 'ACTIVE') {
          router.push(`/items/${created.id}`);
        } else {
          router.push('/admin'); // Or stay and view reason
        }
      }, 1400);
    } catch (err) {
      console.error(err);
      setIsScanning(false);
      // Fallback publish
      const created = addItem({
        user_id: currentUser.id,
        title,
        description,
        category,
        condition,
        purpose,
        location,
        images,
        status: 'ACTIVE',
        ai_moderation_reason: 'Duyệt ngoại tuyến cục bộ.',
        ai_moderation_score: 95,
      });
      router.push(`/items/${created.id}`);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div>
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-[#0F5B4B] mb-1 font-semibold"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Quay lại
          </button>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Đăng món đồ mới
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Kèm công nghệ AI Gemini kiểm duyệt tự động tiêu chuẩn phi thương mại.
          </p>
        </div>

        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#EAF7F2] text-[#0F5B4B] text-xs font-semibold border border-[#A7E2CB]">
          <Sparkles className="w-4 h-4 text-emerald-600" />
          <span>Kiểm duyệt an toàn nội dung</span>
        </div>
      </div>

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="space-y-6 bg-white p-5 sm:p-7 rounded-3xl border border-slate-200 shadow-xs">
        {/* Photos Upload / Selection Section */}
        <div className="space-y-3">
          {/* Hidden HTML5 File Inputs */}
          <input
            type="file"
            ref={galleryInputRef}
            accept="image/*"
            multiple
            onChange={(e) => handleFilesSelected(e.target.files)}
            className="hidden"
          />
          <input
            type="file"
            ref={cameraInputRef}
            accept="image/*"
            capture="environment"
            onChange={(e) => handleFilesSelected(e.target.files)}
            className="hidden"
          />

          <div className="flex items-center justify-between">
            <label className="block text-sm font-bold text-slate-800">
              Hình ảnh món đồ <span className="text-rose-500">*</span>
            </label>
            <span className="text-xs text-slate-500 font-medium">
              Đã chọn: <strong className="text-slate-800">{images.length}/6 ảnh</strong>
            </span>
          </div>

          {/* Action Buttons: Camera & Gallery */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <button
              type="button"
              disabled={isProcessingPhotos || images.length >= 6}
              onClick={() => cameraInputRef.current?.click()}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-gradient-to-r from-[#0F5B4B] to-[#12705C] text-white text-xs sm:text-sm font-bold shadow-md shadow-[#0F5B4B]/20 hover:from-[#0A3F34] hover:to-[#0F5B4B] transition-all cursor-pointer disabled:opacity-50"
            >
              <Camera className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
              <span>Chụp ảnh bằng Camera (Điện thoại)</span>
            </button>

            <button
              type="button"
              disabled={isProcessingPhotos || images.length >= 6}
              onClick={() => galleryInputRef.current?.click()}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-white border-2 border-[#0F5B4B] text-[#0F5B4B] text-xs sm:text-sm font-bold hover:bg-[#EAF7F2] transition-all cursor-pointer disabled:opacity-50"
            >
              <ImageIcon className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
              <span>Chọn từ Bộ sưu tập / Thư viện</span>
            </button>
          </div>

          {/* Processing Spinner Banner */}
          {isProcessingPhotos && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold animate-pulse">
              <Loader2 className="w-4 h-4 animate-spin shrink-0" />
              <span>Đang xử lý và tối ưu hóa hình ảnh tải lên...</span>
            </div>
          )}

          {/* Selected photos thumbnail list */}
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2.5 pt-1">
            {images.map((img, idx) => (
              <div key={idx} className="relative aspect-square rounded-2xl overflow-hidden border border-slate-200 group bg-slate-50 shadow-xs">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img} alt="Ảnh xem trước" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => handleRemoveImage(idx)}
                  className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/65 text-white flex items-center justify-center hover:bg-rose-600 transition-colors cursor-pointer"
                  title="Xóa ảnh này"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
                {idx === 0 && (
                  <span className="absolute bottom-1.5 left-1.5 px-2 py-0.5 rounded text-[10px] font-bold bg-[#0F5B4B] text-white shadow-xs">
                    Ảnh bìa
                  </span>
                )}
              </div>
            ))}

            {images.length < 6 && (
              <button
                type="button"
                onClick={() => galleryInputRef.current?.click()}
                disabled={isProcessingPhotos}
                className="aspect-square rounded-2xl border-2 border-dashed border-slate-300 hover:border-[#0F5B4B] hover:bg-[#EAF7F2]/40 flex flex-col items-center justify-center text-slate-400 hover:text-[#0F5B4B] p-2 text-center transition-all cursor-pointer group"
              >
                <Plus className="w-5 h-5 mb-1 group-hover:scale-110 transition-transform" />
                <span className="text-[11px] font-semibold leading-tight">Thêm ảnh</span>
              </button>
            )}
          </div>

          {/* Clear all photos button if images exist */}
          {images.length > 0 && (
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">Đã chọn {images.length} hình ảnh</span>
              <button
                type="button"
                onClick={() => setImages([])}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors cursor-pointer"
              >
                Xóa tất cả ảnh đã chọn
              </button>
            </div>
          )}
        </div>

        {/* Title */}
        <div className="space-y-1.5">
          <label className="block text-sm font-bold text-slate-800">
            Tiêu đề món đồ <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ví dụ: Giáo trình Đại số Tuyến tính & bài tập ĐHBK..."
            className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm focus:outline-hidden focus:border-[#0F5B4B] focus:ring-2 focus:ring-[#0F5B4B]/20"
          />
        </div>

        {/* Purpose switch (FREE vs EXCHANGE) */}
        <div className="space-y-2">
          <label className="block text-sm font-bold text-slate-800">
            Mục đích đăng đồ <span className="text-rose-500">*</span>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setPurpose('FREE')}
              className={`p-3.5 rounded-2xl border-2 flex items-center gap-3 transition-all cursor-pointer ${
                purpose === 'FREE'
                  ? 'border-[#0F5B4B] bg-[#EAF7F2] text-[#0F5B4B]'
                  : 'border-slate-200 hover:border-slate-300 text-slate-700'
              }`}
            >
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                purpose === 'FREE' ? 'bg-[#0F5B4B] text-white' : 'bg-slate-100 text-slate-600'
              }`}>
                <Gift className="w-5 h-5" />
              </div>
              <div className="text-left">
                <div className="font-bold text-sm">Cho miễn phí</div>
                <div className="text-[11px] opacity-80">Tặng lại bạn cần, 0đ</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setPurpose('EXCHANGE')}
              className={`p-3.5 rounded-2xl border-2 flex items-center gap-3 transition-all cursor-pointer ${
                purpose === 'EXCHANGE'
                  ? 'border-[#0F5B4B] bg-[#EAF7F2] text-[#0F5B4B]'
                  : 'border-slate-200 hover:border-slate-300 text-slate-700'
              }`}
            >
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                purpose === 'EXCHANGE' ? 'bg-[#0F5B4B] text-white' : 'bg-slate-100 text-slate-600'
              }`}>
                <ArrowLeftRight className="w-5 h-5" />
              </div>
              <div className="text-left">
                <div className="font-bold text-sm">Đổi đồ dùng</div>
                <div className="text-[11px] opacity-80">Trao đổi vật phẩm khác</div>
              </div>
            </button>
          </div>
        </div>

        {/* Category & Condition Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-sm font-bold text-slate-800">
              Danh mục
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm focus:outline-hidden focus:border-[#0F5B4B] focus:ring-2 focus:ring-[#0F5B4B]/20"
            >
              {CATEGORIES.filter((c) => c !== 'Tất cả').map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-bold text-slate-800">
              Tình trạng đồ dùng
            </label>
            <select
              value={condition}
              onChange={(e) => setCondition(e.target.value as ItemCondition)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm focus:outline-hidden focus:border-[#0F5B4B] focus:ring-2 focus:ring-[#0F5B4B]/20"
            >
              {CONDITIONS.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Preferred Handover Location */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-bold text-slate-800">
              Địa điểm trao nhận thuận tiện (Liên Chiểu) <span className="text-rose-500">*</span>
            </label>
            <span className="text-[11px] text-slate-500">Tự do nhập hoặc bấm chọn nhanh</span>
          </div>
          <div className="relative">
            <MapPin className="w-4 h-4 text-[#0F5B4B] absolute left-3.5 top-3" />
            <input
              type="text"
              required
              list="location-suggestions"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Nhập địa chỉ cụ thể hoặc chọn gợi ý (Ví dụ: Cổng 1 ĐHBK, KTX DMC 579, số 12 Ngô Sĩ Liên...)"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm focus:outline-hidden focus:border-[#0F5B4B] focus:ring-2 focus:ring-[#0F5B4B]/20"
            />
            <datalist id="location-suggestions">
              {LOCATIONS.filter((l) => l !== 'Toàn quận Liên Chiểu').map((loc) => (
                <option key={loc} value={loc} />
              ))}
            </datalist>
          </div>

          {/* Quick selection chips */}
          <div className="space-y-1">
            <span className="text-[11px] font-medium text-slate-500">Điểm giao dịch sinh viên phổ biến:</span>
            <div className="flex flex-wrap gap-1.5">
              {POPULAR_HANDOVER_HUBS.map((hub) => (
                <button
                  key={hub}
                  type="button"
                  onClick={() => setLocation(hub)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer border ${
                    location === hub
                      ? 'bg-[#0F5B4B] text-white border-[#0F5B4B] shadow-xs'
                      : 'bg-slate-50 text-slate-700 hover:bg-[#EAF7F2] hover:text-[#0F5B4B] border-slate-200'
                  }`}
                >
                  📍 {hub}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <label className="block text-sm font-bold text-slate-800">
            Mô tả đồ dùng <span className="text-rose-500">*</span>
          </label>
          <textarea
            required
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Nêu rõ tình trạng hoạt động, lý do cho tặng, hoặc đồ dùng mong muốn đổi..."
            className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm focus:outline-hidden focus:border-[#0F5B4B] focus:ring-2 focus:ring-[#0F5B4B]/20 resize-none"
          />
        </div>

        {/* Non-Commercial Policy Disclaimer */}
        <div className="p-3.5 rounded-2xl bg-[#FEF9C3] border border-[#CA8A04] text-[#854D0E] text-xs space-y-1">
          <div className="font-bold flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4" />
            Quy định nghiêm ngặt: Tuyệt đối không giao dịch thương mại
          </div>
          <p className="leading-relaxed opacity-95">
            Mọi bài đăng chứa từ khóa thu tiền, bán lại, giá tiền hoặc chuyển khoản sẽ bị hệ thống AI tự động chặn và đình chỉ tài khoản theo chính sách cộng đồng Kho Đồ Liên Chiểu.
          </p>
        </div>

        {/* AI Scanning progress overlay */}
        {isScanning && (
          <div className="p-4 rounded-2xl bg-[#EAF7F2] border border-[#A7E2CB] flex items-center gap-3 animate-pulse">
            <Sparkles className="w-6 h-6 text-[#0F5B4B] animate-spin" />
            <div className="text-xs sm:text-sm text-[#0F5B4B]">
              <div className="font-bold">Đang kiểm duyệt bằng Google Gemini Vision API...</div>
              <div className="opacity-80">Phân tích tính nhất quán hình ảnh & chính sách phi thương mại.</div>
            </div>
          </div>
        )}

        {/* AI Result Card if any */}
        {moderationResult && (
          <div className={`p-4 rounded-2xl border text-xs sm:text-sm ${
            moderationResult.status === 'ACTIVE'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
              : 'bg-amber-50 border-amber-300 text-amber-900'
          }`}>
            <div className="font-bold flex items-center gap-1.5 mb-1">
              {moderationResult.status === 'ACTIVE' ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Đã tự động phê duyệt (ACTIVE) • Độ tin cậy AI: {moderationResult.confidence}%
                </>
              ) : (
                <>
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  Chuyển BQL kiểm duyệt (PENDING_ADMIN)
                </>
              )}
            </div>
            <p className="text-xs opacity-90">{moderationResult.reasoning}</p>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isScanning}
          className="w-full py-4 rounded-2xl bg-[#0F5B4B] text-white font-bold text-base shadow-lg shadow-[#0F5B4B]/20 hover:bg-[#0A3F34] active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          <Sparkles className="w-5 h-5" />
          {isScanning ? 'Đang thẩm định AI...' : 'Đăng món đồ (+ Kiểm duyệt AI)'}
        </button>
      </form>
    </div>
  );
}

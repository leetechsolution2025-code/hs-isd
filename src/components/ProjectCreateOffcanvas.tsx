"use client";
import React, { useState, useEffect } from 'react';
import { X, PencilRuler } from 'lucide-react';
import AutocompleteInput from './AutocompleteInput';
import { createProject } from '../app/actions';
import { toast } from 'react-hot-toast';

const VIETNAM_PROVINCES = [
  "An Giang", "Bà Rịa - Vũng Tàu", "Bạc Liêu", "Bắc Giang", "Bắc Kạn", "Bắc Ninh", "Bến Tre", "Bình Dương", "Bình Định", "Bình Phước", "Bình Thuận", "Cà Mau", "Cao Bằng", "Cần Thơ", "Đà Nẵng", "Đắk Lắk", "Đắk Nông", "Điện Biên", "Đồng Nai", "Đồng Tháp", "Gia Lai", "Hà Giang", "Hà Nam", "Hà Nội", "Hà Tĩnh", "Hải Dương", "Hải Phòng", "Hậu Giang", "Hòa Bình", "Hưng Yên", "Khánh Hòa", "Kiên Giang", "Kon Tum", "Lai Châu", "Lạng Sơn", "Lào Cai", "Lâm Đồng", "Long An", "Nam Định", "Nghệ An", "Ninh Bình", "Ninh Thuận", "Phú Thọ", "Phú Yên", "Quảng Bình", "Quảng Nam", "Quảng Ngãi", "Quảng Ninh", "Quảng Trị", "Sóc Trăng", "Sơn La", "Tây Ninh", "Thái Bình", "Thái Nguyên", "Thanh Hóa", "Thừa Thiên Huế", "Tiền Giang", "TP. Hồ Chí Minh", "Trà Vinh", "Tuyên Quang", "Vĩnh Long", "Vĩnh Phúc", "Yên Bái"
];

interface ProjectCreateOffcanvasProps {
  isOpen: boolean;
  onClose: () => void;
  phases: any[];
  users?: any[];
  onSuccess?: () => void;
  editProject?: any;
  onDesign?: () => void;
}

export default function ProjectCreateOffcanvas({ isOpen, onClose, phases, users = [], onSuccess, editProject, onDesign }: ProjectCreateOffcanvasProps) {
  const isEditing = !!editProject;
  const [initialCrops, setInitialCrops] = useState<any[]>([]);
  const [slide, setSlide] = useState<'headworks' | 'canals'>('headworks');
  const [show, setShow] = useState(false);
  const [cropCount, setCropCount] = useState<number>(0);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => setShow(true), 10);
      if (editProject) {
        setSlide(editProject.type === 'CANAL' ? 'canals' : 'headworks');
        if (editProject.cropCount) {
          setCropCount(editProject.cropCount);
          try {
            if (editProject.irrigationCoefficient) {
              const crops = JSON.parse(editProject.irrigationCoefficient);
              setInitialCrops(crops);
            }
          } catch(e) {}
        }
      }
    } else {
      setShow(false);
      setTimeout(() => {
        setSlide('headworks');
        setCropCount(0);
        setInitialCrops([]);
      }, 300);
    }
  }, [isOpen, editProject]);

  // Handle fully unmounting after animation
  const [render, setRender] = useState(false);
  useEffect(() => {
    if (isOpen) setRender(true);
    else {
      const timer = setTimeout(() => setRender(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!render) return null;

  async function handleSubmit(formData: FormData) {
    const res = await createProject(formData);
    if (res.success && res.project) {
      toast.success((isEditing ? "Đã cập nhật dự án: " : "Đã tạo dự án thành công: ") + res.project.code);
      onClose();
      onSuccess?.();
    } else {
      toast.error("Lỗi: " + res.error);
    }
  }

  return (
    <>
      <div 
        className={`fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40 transition-opacity duration-300 ${show ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
      />
      
      <div 
        className={`fixed inset-y-0 right-0 z-50 w-[400px] bg-white shadow-2xl border-l border-slate-200 flex flex-col transform transition-transform duration-300 ease-in-out ${show ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-800">{isEditing ? "Cập nhật dự án" : "Thêm dự án mới"}</h2>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex px-6 pt-4 border-b border-slate-100 relative">
          <button
            className={`pb-3 text-[13px] font-semibold border-b-2 px-2 transition-colors z-10 ${
              slide === 'headworks' 
                ? 'border-blue-600 text-blue-600' 
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
            onClick={() => setSlide('headworks')}
          >
            Công trình Đầu mối
          </button>
          <button
            className={`pb-3 text-[13px] font-semibold border-b-2 px-2 ml-6 transition-colors z-10 ${
              slide === 'canals' 
                ? 'border-blue-600 text-blue-600' 
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
            onClick={() => setSlide('canals')}
          >
            Hệ thống kênh
          </button>
          <div className="absolute bottom-0 left-0 right-0 border-b-2 border-slate-100 z-0" />
        </div>

        <div className="flex-1 overflow-hidden relative">
          <div 
            className="flex w-[200%] h-full transition-transform duration-300 ease-in-out"
            style={{ transform: slide === 'headworks' ? 'translateX(0)' : 'translateX(-50%)' }}
          >
            {/* Slide 1: Đầu mối */}
            <div className="w-1/2 flex-shrink-0 p-6 overflow-y-auto flex flex-col h-full">
              <form key={editProject?.id || "new-headworks"} action={handleSubmit} id="form-headworks" className="space-y-4 flex-1 flex flex-col">
{isEditing && <input type="hidden" name="id" value={editProject.id} />}
                <input type="hidden" name="type" value="HEADWORKS" />
                <div>
                  <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Tên công trình <span className="text-red-500">*</span></label>
                  <input name="name" defaultValue={editProject?.name} required type="text" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 text-sm transition-all" placeholder="Ví dụ: Hồ chứa nước..." />
                </div>
                <div className="flex gap-4 relative z-20">
                  <div className="flex-1">
                    <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Hạng mục</label>
                    <input name="category" defaultValue={editProject?.category} type="text" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 text-sm transition-all" placeholder="Nhập hạng mục..." />
                  </div>
                  <div className="w-2/5">
                    <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Địa điểm xây dựng</label>
                    <AutocompleteInput name="location" defaultValue={editProject?.location} options={VIETNAM_PROVINCES} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 text-sm transition-all pr-8" placeholder="Tỉnh/Thành..." />
                  </div>
                </div>
                <div className="relative z-10">
                  <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Giai đoạn</label>
                  <div className="relative">
                    <select name="phaseId" defaultValue={editProject?.phaseId || ""} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 text-sm transition-all appearance-none bg-white">
                      <option value="">Chọn giai đoạn</option>
                      {phases?.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                    <div className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Tóm tắt nhiệm vụ</label>
                  <textarea name="summary" defaultValue={editProject?.summary} rows={4} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 text-sm resize-none transition-all" placeholder="Mô tả các nhiệm vụ chính của dự án..."></textarea>
                </div>
              </form>
            </div>

            {/* Slide 2: Kênh */}
            <div className="w-1/2 flex-shrink-0 p-6 overflow-y-auto flex flex-col h-full">
              <form key={editProject?.id || "new-canals"} action={handleSubmit} id="form-canals" className="space-y-4 flex-1 flex flex-col">
{isEditing && <input type="hidden" name="id" value={editProject.id} />}
                 <input type="hidden" name="type" value="CANAL" />
                 <div>
                  <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Tên dự án <span className="text-red-500">*</span></label>
                  <input name="name" defaultValue={editProject?.name} required type="text" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 text-sm transition-all" placeholder="Ví dụ: Kênh chính Tả..." />
                </div>
                <div className="flex gap-4 relative z-20">
                  <div className="flex-1">
                    <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Hạng mục</label>
                    <input name="category" defaultValue={editProject?.category} type="text" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 text-sm transition-all" placeholder="Nhập hạng mục..." />
                  </div>
                  <div className="w-2/5">
                    <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Địa điểm xây dựng</label>
                    <AutocompleteInput name="location" defaultValue={editProject?.location} options={VIETNAM_PROVINCES} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 text-sm transition-all pr-8" placeholder="Tỉnh/Thành..." />
                  </div>
                </div>
                <div className="flex gap-4 relative z-10">
                  <div className="flex-1">
                    <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Giai đoạn</label>
                    <div className="relative">
                      <select name="phaseId" defaultValue={editProject?.phaseId || ""} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 text-sm transition-all appearance-none bg-white">
                        <option value="">Chọn giai đoạn</option>
                        {phases?.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                      <div className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                      </div>
                    </div>
                  </div>
                  <div className="w-2/5">
                    <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Ngày tạo</label>
                    <input name="createdAt" defaultValue={editProject?.createdAt ? new Date(editProject.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]} type="date" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 text-sm transition-all text-slate-600" />
                  </div>
                </div>
                <div>
                  <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Chủ đầu tư</label>
                  <input name="investor" defaultValue={editProject?.investor} type="text" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 text-sm transition-all" placeholder="Tên chủ đầu tư..." />
                </div>
                <div>
                  <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Loại công trình</label>
                  <div className="flex items-center gap-6 mt-1">
                    <label className="flex items-center gap-2 text-[13px] text-slate-700 cursor-pointer">
                      <input type="radio" name="canalType" value="open" className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-slate-300" defaultChecked={!isEditing || editProject?.canalType === "open"} />
                      Kênh hở
                    </label>
                    <label className="flex items-center gap-2 text-[13px] text-slate-700 cursor-pointer">
                      <input type="radio" name="canalType" value="pipe" className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-slate-300" defaultChecked={isEditing && editProject?.canalType === "pipe"} />
                      Đường ống có áp
                    </label>
                  </div>
                </div>
                <div className="flex gap-4 relative z-[5]">
                  <div className="flex-1">
                    <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Chủ nhiệm dự án</label>
                    <AutocompleteInput name="managerName" defaultValue={users.find((u: any) => u.id === editProject?.managerId)?.fullName} options={users.map((u: any) => u.fullName)} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 text-sm transition-all pr-8" placeholder="Chọn chủ nhiệm..." />
                  </div>
                  <div className="w-1/3">
                    <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Số loại cây trồng</label>
                    <input 
                      name="cropCount"
                      type="number" 
                      min="0" 
                      max="4" 
                      step="1"
                      value={cropCount || ''}
                      onChange={(e) => {
                        let val = parseInt(e.target.value) || 0;
                        if (val > 4) val = 4;
                        if (val < 0) val = 0;
                        setCropCount(val);
                      }}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 text-sm transition-all" 
                      placeholder="Tối đa 4" 
                    />
                  </div>
                </div>
                {cropCount > 0 && (
                  <div className="space-y-3">
                    <label className="block text-[13px] font-semibold text-slate-700">Dữ liệu hệ số tưới</label>
                    {Array.from({ length: cropCount }).map((_, i) => (
                      <div key={i} className="flex gap-4">
                        <div className="flex-1">
                          <input name={`cropName_${i}`} defaultValue={initialCrops[i]?.name} type="text" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 text-sm transition-all" placeholder={`Loại cây trồng ${i + 1}...`} />
                        </div>
                        <div className="w-1/3 relative">
                          <input name={`cropCoef_${i}`} defaultValue={initialCrops[i]?.coef} type="number" step="0.01" className="w-full pl-3 pr-14 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 text-sm transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" placeholder="Hệ số..." />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[13px] text-slate-500 pointer-events-none">l/s-ha</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                 <div>
                  <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Tóm tắt dự án</label>
                  <textarea name="summary" defaultValue={editProject?.summary} rows={4} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 text-sm resize-none transition-all" placeholder="Nội dung tóm tắt..."></textarea>
                </div>
              </form>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-slate-100 flex justify-between items-center bg-slate-50/80">
          <div>
            {isEditing && (
              <button
                type="button"
                onClick={() => onDesign?.()}
                className="px-5 py-2 text-sm font-medium text-rose-600 bg-rose-50 border border-rose-200 rounded-lg hover:bg-rose-100 transition-colors shadow-sm flex items-center gap-2"
              >
                <PencilRuler size={16} />
                Thiết kế
              </button>
            )}
          </div>
          <div className="flex gap-3">
            <button 
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 hover:text-slate-800 transition-colors"
            >
              Hủy
            </button>
            <button 
              form={slide === 'headworks' ? 'form-headworks' : 'form-canals'}
              type="submit"
              className="px-5 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
            >
              {isEditing ? "Cập nhật" : "Lưu dự án"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

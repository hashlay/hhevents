import React, { useState, useRef } from 'react';
import {
  Upload,
  Image as ImageIcon,
  CheckCircle2,
  Trash2,
  RefreshCw,
  Eye,
  Camera,
  FolderOpen,
  ArrowRight,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { useVenuePhotos } from '../../hooks/useVenuePhotos';
import { saveRealPhoto, removeRealPhoto } from '../../services/photoStorage';
import { useToast } from '../../context/ToastContext';
import { GALLERY_ITEMS } from '../../services/hallData';

interface PhotoSlotDefinition {
  id: string;
  label: string;
  category: string;
  recommendedAspect: string;
  description: string;
}

const PHOTO_SLOTS: PhotoSlotDefinition[] = [
  {
    id: 'hero',
    label: 'Hero Section Background',
    category: 'Core Venue Views',
    recommendedAspect: '16:9 Landscape',
    description: 'The primary grand interior photograph shown behind the homepage headline.',
  },
  {
    id: 'hall1',
    label: 'Hall 1 (Single Hall Section)',
    category: 'Core Venue Views',
    recommendedAspect: '4:3 or 16:9',
    description: 'Photograph of Hall 1 independent section.',
  },
  {
    id: 'hall2',
    label: 'Hall 2 (Single Hall Section)',
    category: 'Core Venue Views',
    recommendedAspect: '4:3 or 16:9',
    description: 'Photograph of Hall 2 independent section.',
  },
  {
    id: 'combined',
    label: 'Full Hall (Combined Gents & Ladies)',
    category: 'Core Venue Views',
    recommendedAspect: '16:9 Wide',
    description: 'Wide panorama showing both halls combined for large conventions.',
  },
  {
    id: 'dining',
    label: 'Banquet Dining Hall Wing',
    category: 'Dining & Kitchen',
    recommendedAspect: '4:3 or 16:9',
    description: 'Photograph of the dining facility and feast wing.',
  },
  ...GALLERY_ITEMS.map((item) => ({
    id: item.id,
    label: `${item.title}`,
    category: 'Gallery Showcase',
    recommendedAspect: '16:9 Landscape',
    description: item.description,
  })),
];

interface RealPhotoManagerProps {
  onClose?: () => void;
  standalone?: boolean;
}

export const RealPhotoManager: React.FC<RealPhotoManagerProps> = ({ onClose, standalone = false }) => {
  const { photos } = useVenuePhotos();
  const { showToast } = useToast();
  const [selectedSlot, setSelectedSlot] = useState<string>('hero');
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'individual' | 'batch'>('individual');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const batchInputRef = useRef<HTMLInputElement>(null);

  // Group slots by category
  const categories = Array.from(new Set(PHOTO_SLOTS.map((s) => s.category)));

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, targetSlotId: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Please select a valid image file (JPG, PNG, WebP).', 'error');
      return;
    }

    setIsUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const dataUrl = reader.result as string;
        await saveRealPhoto(targetSlotId, file.name, dataUrl);
        showToast(`Real photo saved for ${PHOTO_SLOTS.find((s) => s.id === targetSlotId)?.label || targetSlotId}!`, 'success');
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      showToast('Failed to read image file: ' + (err?.message || 'Unknown error'), 'error');
      setIsUploading(false);
    }
  };

  const handleBatchUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    let uploadedCount = 0;

    // Ordered slot list for batch mapping: hero first, then hall1, hall2, dining, then gal-01 to gal-15
    const batchTargets = ['hero', 'hall1', 'hall2', 'dining', ...GALLERY_ITEMS.map((g) => g.id)];

    for (let i = 0; i < Math.min(files.length, batchTargets.length); i++) {
      const file = files[i];
      if (!file.type.startsWith('image/')) continue;

      const slotId = batchTargets[i];
      await new Promise<void>((resolve) => {
        const reader = new FileReader();
        reader.onload = async () => {
          const dataUrl = reader.result as string;
          await saveRealPhoto(slotId, file.name, dataUrl);
          uploadedCount++;
          resolve();
        };
        reader.readAsDataURL(file);
      });
    }

    setIsUploading(false);
    showToast(`Successfully assigned ${uploadedCount} real photos across venue slots!`, 'success');
  };

  const handleRemovePhoto = async (slotId: string) => {
    await removeRealPhoto(slotId);
    showToast('Photo removed from this slot.', 'info');
  };

  const currentSlotDef = PHOTO_SLOTS.find((s) => s.id === selectedSlot) || PHOTO_SLOTS[0];
  const currentPhoto = photos[selectedSlot];

  return (
    <div className={`space-y-6 ${standalone ? 'p-6 bg-white rounded-2xl shadow-sm border border-slate-200' : ''}`}>
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center font-bold">
              <Camera className="w-4 h-4" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 font-serif-heading">
              Official Real Hall Photos Manager
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Assign your actual photographed files directly into each venue section. Live updates reflect immediately across the entire website.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('individual')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'individual'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Assign by Slot
          </button>
          <button
            onClick={() => setActiveTab('batch')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'batch'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Batch Import All Photos
          </button>
          {onClose && (
            <Button onClick={onClose} variant="outline" size="sm">
              Done
            </Button>
          )}
        </div>
      </div>

      {activeTab === 'batch' ? (
        /* Batch Upload Mode */
        <div className="space-y-6 bg-slate-50 rounded-2xl p-6 border-2 border-dashed border-amber-300">
          <div className="text-center max-w-lg mx-auto space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
              <FolderOpen className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 font-serif-heading">
              Batch Import Real Photos
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Select multiple photos from your device at once. They will be sequentially assigned to the Homepage Hero, Hall 1, Hall 2, Dining Hall, and the 15 Gallery slots.
            </p>

            <div className="pt-2">
              <input
                ref={batchInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={handleBatchUpload}
                className="hidden"
              />
              <Button
                onClick={() => batchInputRef.current?.click()}
                variant="gold"
                size="md"
                isLoading={isUploading}
                leftIcon={<Upload className="w-4 h-4" />}
              >
                Select Photos from Device
              </Button>
            </div>
            <p className="text-[11px] text-slate-400">Supported formats: JPG, PNG, WebP (high resolution)</p>
          </div>
        </div>
      ) : (
        /* Individual Slot Assignment Mode */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Slot Selector List */}
          <div className="lg:col-span-5 space-y-4 max-h-[600px] overflow-y-auto pr-2">
            {categories.map((category) => (
              <div key={category} className="space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block px-1">
                  {category}
                </span>
                <div className="space-y-1.5">
                  {PHOTO_SLOTS.filter((s) => s.category === category).map((slot) => {
                    const hasPhoto = !!photos[slot.id];
                    const isSelected = selectedSlot === slot.id;

                    return (
                      <button
                        key={slot.id}
                        onClick={() => setSelectedSlot(slot.id)}
                        className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-all border ${
                          isSelected
                            ? 'bg-amber-500 text-slate-950 border-amber-600 font-bold shadow-xs'
                            : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold ${
                              isSelected
                                ? 'bg-slate-950 text-amber-400'
                                : hasPhoto
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-slate-100 text-slate-500'
                            }`}
                          >
                            {hasPhoto ? <CheckCircle2 className="w-4 h-4" /> : <ImageIcon className="w-4 h-4" />}
                          </div>
                          <div className="min-w-0">
                            <span className="text-xs truncate block">{slot.label}</span>
                            <span
                              className={`text-[10px] block ${
                                isSelected ? 'text-slate-900' : 'text-slate-400'
                              }`}
                            >
                              {slot.recommendedAspect}
                            </span>
                          </div>
                        </div>

                        {hasPhoto && (
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-semibold shrink-0 ${
                              isSelected
                                ? 'bg-slate-950 text-emerald-400'
                                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            }`}
                          >
                            Assigned
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Right: Slot Editor & Photo Preview */}
          <div className="lg:col-span-7 bg-slate-50 rounded-2xl p-6 border border-slate-200 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className="text-xs font-semibold text-amber-700 uppercase tracking-wider">
                    {currentSlotDef.category}
                  </span>
                  <h3 className="text-lg font-bold text-slate-900 font-serif-heading mt-0.5">
                    {currentSlotDef.label}
                  </h3>
                  <p className="text-xs text-slate-600 mt-1">{currentSlotDef.description}</p>
                </div>
              </div>

              {/* Photo Preview Canvas */}
              <div className="relative aspect-16/10 bg-slate-950 rounded-xl overflow-hidden border border-slate-300 flex items-center justify-center">
                {currentPhoto?.url ? (
                  <>
                    <img
                      src={currentPhoto.url}
                      alt={currentSlotDef.label}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-3 left-3 flex items-center gap-2">
                      {currentPhoto.uploadedAt === 'system-default' ? (
                        <span className="bg-emerald-950/85 backdrop-blur-xs text-emerald-300 text-xs font-bold px-2.5 py-1 rounded border border-emerald-700">
                          Default Venue Photo Active
                        </span>
                      ) : (
                        <span className="bg-sky-950/85 backdrop-blur-xs text-sky-300 text-xs font-bold px-2.5 py-1 rounded border border-sky-700">
                          Custom Admin Photo Active
                        </span>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="text-center p-6 space-y-2">
                    <div className="w-12 h-12 rounded-full bg-slate-900 text-slate-400 flex items-center justify-center mx-auto border border-slate-800">
                      <ImageIcon className="w-6 h-6" />
                    </div>
                    <p className="text-xs font-semibold text-slate-300">
                      No real photo assigned yet for this slot
                    </p>
                    <p className="text-[11px] text-slate-500 max-w-xs">
                      Click "Upload Photo" below to choose the actual photograph from your device.
                    </p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, currentSlotDef.id)}
                    className="hidden"
                  />
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    variant="gold"
                    size="sm"
                    isLoading={isUploading}
                    leftIcon={<Upload className="w-4 h-4" />}
                  >
                    {currentPhoto && currentPhoto.uploadedAt !== 'system-default'
                      ? 'Replace Custom Photo'
                      : 'Upload Custom Override'}
                  </Button>

                  {currentPhoto && currentPhoto.uploadedAt !== 'system-default' && (
                    <Button
                      onClick={() => handleRemovePhoto(currentSlotDef.id)}
                      variant="outline"
                      size="sm"
                      className="text-rose-600 border-rose-200 hover:bg-rose-50"
                      leftIcon={<Trash2 className="w-4 h-4" />}
                    >
                      Reset to Venue Default
                    </Button>
                  )}
                </div>

                {currentPhoto?.filename && (
                  <span className="text-[11px] text-slate-400 truncate max-w-xs">
                    File: {currentPhoto.filename}
                  </span>
                )}
              </div>
            </div>

            {/* Quick Status Bar */}
            <div className="mt-6 pt-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
              <span>
                Total Real Photos Assigned:{' '}
                <strong className="text-slate-900">{Object.keys(photos).length}</strong>
              </span>
              <span className="text-amber-700 font-medium">Auto-synced across website</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

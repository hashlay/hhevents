import React, { useState } from 'react';
import { Camera, Upload, X, ChevronRight, ChevronLeft, ArrowRight } from 'lucide-react';
import { GALLERY_ITEMS } from '../../services/hallData';
import { Button } from '../../components/ui/Button';
import { BackButton } from '../../components/ui/BackButton';
import { useVenuePhotos } from '../../hooks/useVenuePhotos';
import { RealPhotoManager } from '../../components/photos/RealPhotoManager';

interface GalleryPageProps {
  navigate: (path: string) => void;
}

export const GalleryPage: React.FC<GalleryPageProps> = ({ navigate }) => {
  const { getPhotoUrl } = useVenuePhotos();
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [activePhotoIndex, setActivePhotoIndex] = useState<number | null>(null);
  const [showPhotoManagerModal, setShowPhotoManagerModal] = useState<boolean>(false);

  const categories = ['All', 'Main Hall', 'Dining Wings', 'Stage & Dais', 'Exterior', 'Lawn & Open Air'];

  const filteredItems =
    selectedCategory === 'All'
      ? GALLERY_ITEMS
      : GALLERY_ITEMS.filter((item) => item.category.toLowerCase() === selectedCategory.toLowerCase());

  const activePhoto = activePhotoIndex !== null ? filteredItems[activePhotoIndex] : null;

  const handleNextPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (activePhotoIndex !== null) {
      setActivePhotoIndex((activePhotoIndex + 1) % filteredItems.length);
    }
  };

  const handlePrevPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (activePhotoIndex !== null) {
      setActivePhotoIndex((activePhotoIndex - 1 + filteredItems.length) % filteredItems.length);
    }
  };

  return (
    <div className="space-y-16 pb-24 bg-[#F5F1E8] text-[#252525]">
      {/* Photo Manager Modal */}
      {showPhotoManagerModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="relative max-w-4xl w-full bg-white rounded-3xl p-6 sm:p-8 shadow-2xl max-h-[90vh] overflow-y-auto border border-[#E2DACB]">
            <RealPhotoManager standalone onClose={() => setShowPhotoManagerModal(false)} />
          </div>
        </div>
      )}

      {/* Header Banner */}
      <section className="bg-gradient-to-b from-[#FAF8F5] via-[#FFFDF9] to-[#FAF8F5] py-14 sm:py-18 border-b border-[#E2DACB]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <BackButton fallback="/" variant="light" />
          </div>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="max-w-3xl space-y-4">
              <span className="text-xs uppercase font-bold tracking-widest text-[#173D35] bg-[#F5F1E8] px-3.5 py-1.5 rounded-full border border-[#E2DACB] inline-flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5 text-[#C9AA72]" />
                Verified Visual Showcase
              </span>
              <h1 className="text-4xl sm:text-5xl font-bold text-[#252525] tracking-tight font-serif-heading">
                H H Events Visual Gallery
              </h1>
              <p className="text-base sm:text-lg text-[#4A4A4A] leading-relaxed">
                Authentic photographs of H H Events &amp; Conventions in Panemangalore — featuring the air-conditioned Main Convention Hall, golden banquet seating, covered feast dining wings, outdoor courtyard, and illuminated entrance portico.
              </p>
              <div className="pt-1 flex items-center gap-3 text-xs text-[#4A4A4A] font-semibold">
                <span className="bg-[#F5F1E8] text-[#173D35] px-3.5 py-1 rounded-full border border-[#E2DACB]">
                  15 Authentic Photographs
                </span>
                <span>&bull;</span>
                <span>Opposite Juma Masjid, Panemangalore</span>
              </div>
            </div>

            <div className="shrink-0 flex flex-col sm:flex-row gap-3">
              <Button
                onClick={() => setShowPhotoManagerModal(true)}
                variant="outline"
                size="md"
                leftIcon={<Upload className="w-4 h-4" />}
              >
                Manage Venue Photos
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Filter Tabs & Count */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E2DACB] pb-4">
          <div className="flex flex-wrap items-center gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-[#C9AA72] text-white shadow-xs'
                    : 'bg-[#FAF8F5] text-[#4A4A4A] hover:bg-[#EDE6D8] border border-[#E2DACB]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <span className="text-xs text-[#737373] font-medium">
            Showing {filteredItems.length} Photographs
          </span>
        </div>
      </section>

      {/* Photos Masonry/Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item, index) => {
            const photoUrl = getPhotoUrl(item.id);

            return (
              <div
                key={item.id}
                onClick={() => setActivePhotoIndex(index)}
                className="group relative bg-white rounded-2xl border border-[#E2DACB] overflow-hidden shadow-2xs hover:shadow-md transition-all duration-300 cursor-pointer flex flex-col justify-between"
              >
                <div className="relative aspect-4/3 bg-[#FAF8F5] overflow-hidden">
                  {photoUrl ? (
                    <img
                      src={photoUrl}
                      alt={item.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center text-[#737373]">
                      <Camera className="w-10 h-10 text-[#C9AA72] mb-2" />
                      <h4 className="font-bold text-sm text-[#252525]">{item.title}</h4>
                      <p className="text-xs">{item.category}</p>
                    </div>
                  )}

                  <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-md text-[10px] font-bold text-[#252525] shadow-2xs border border-[#E2DACB]">
                    {item.category}
                  </div>
                </div>

                <div className="p-4 space-y-1">
                  <h3 className="font-bold text-sm text-[#252525] group-hover:text-[#C9AA72] transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-xs text-[#4A4A4A] line-clamp-2 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Lightbox Modal */}
      {activePhoto && activePhotoIndex !== null && (
        <div
          onClick={() => setActivePhotoIndex(null)}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-5xl w-full bg-white rounded-3xl overflow-hidden shadow-2xl border border-[#E2DACB]"
          >
            {/* Top Bar */}
            <div className="p-4 border-b border-[#E2DACB] flex items-center justify-between bg-[#FAF8F5]">
              <div>
                <h3 className="text-lg font-bold text-[#252525] font-serif-heading">
                  {activePhoto.title}
                </h3>
                <span className="text-xs text-[#C9AA72] font-semibold">
                  {activePhoto.category} &bull; Photo {activePhotoIndex + 1} of {filteredItems.length}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setActivePhotoIndex(null)}
                className="p-2 rounded-xl bg-white border border-[#E2DACB] text-[#4A4A4A] hover:text-[#252525] cursor-pointer"
                aria-label="Close Lightbox"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Photo View */}
            <div className="relative max-h-[70vh] bg-black flex items-center justify-center overflow-hidden">
              {getPhotoUrl(activePhoto.id) ? (
                <img
                  src={getPhotoUrl(activePhoto.id)!}
                  alt={activePhoto.title}
                  className="max-h-[70vh] w-auto max-w-full object-contain"
                />
              ) : (
                <div className="p-16 text-center text-white">
                  <Camera className="w-12 h-12 text-[#D9C194] mx-auto mb-2" />
                  <p>{activePhoto.title}</p>
                </div>
              )}

              {/* Navigation Arrows */}
              <button
                type="button"
                onClick={handlePrevPhoto}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/60 hover:bg-black/80 text-white transition-colors cursor-pointer"
                aria-label="Previous image"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                type="button"
                onClick={handleNextPhoto}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/60 hover:bg-black/80 text-white transition-colors cursor-pointer"
                aria-label="Next image"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>

            {/* Photo Caption & CTA */}
            <div className="p-5 bg-white border-t border-[#E2DACB] flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-xs sm:text-sm text-[#4A4A4A] max-w-2xl leading-relaxed">
                {activePhoto.description}
              </p>
              <Button
                onClick={() => {
                  setActivePhotoIndex(null);
                  navigate('/book');
                }}
                variant="gold"
                size="sm"
                className="shrink-0"
              >
                Reserve Venue
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

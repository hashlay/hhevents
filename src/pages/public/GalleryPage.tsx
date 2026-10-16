import React, { useState } from 'react';
import { Camera, X, ChevronRight, ChevronLeft, ArrowRight } from 'lucide-react';
import { GALLERY_ITEMS } from '../../services/hallData';
import { Button } from '../../components/ui/Button';
import { BackButton } from '../../components/ui/BackButton';
import { useVenuePhotos } from '../../hooks/useVenuePhotos';

interface GalleryPageProps {
  navigate: (path: string) => void;
}

export const GalleryPage: React.FC<GalleryPageProps> = ({ navigate }) => {
  const { getPhotoUrl } = useVenuePhotos();
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [activePhotoIndex, setActivePhotoIndex] = useState<number | null>(null);

  const categories = [
    'All',
    'Venue Exterior',
    'Event Halls',
    'Dining Facilities',
    'Architectural Concepts',
  ];

  const filteredItems =
    selectedCategory === 'All'
      ? GALLERY_ITEMS
      : GALLERY_ITEMS.filter((item) => item.category === selectedCategory);

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
                Venue Showcase
              </span>
              <h1 className="text-4xl sm:text-5xl font-bold text-[#252525] tracking-tight font-serif-heading">
                Venue Gallery
              </h1>
              <p className="text-base sm:text-lg text-[#4A4A4A] leading-relaxed">
                Explore the authentic photographs of H H Events &amp; Conventions in Panemangalore — showcasing our building exterior, event halls, and covered dining wings.
              </p>
              <div className="pt-1 flex items-center gap-3 text-xs text-[#4A4A4A] font-semibold">
                <span className="bg-[#F5F1E8] text-[#173D35] px-3.5 py-1 rounded-full border border-[#E2DACB]">
                  Authentic Venue Imagery
                </span>
                <span>&bull;</span>
                <span>Opposite Juma Masjid, Panemangalore</span>
              </div>
            </div>

            <div className="shrink-0 flex flex-col sm:flex-row gap-3">
              <Button
                onClick={() => navigate('/book')}
                variant="gold"
                size="md"
              >
                Book This Venue
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
                    ? 'bg-[#173D35] text-white shadow-xs'
                    : 'bg-[#FAF8F5] text-[#4A4A4A] hover:bg-[#EDE6D8] border border-[#E2DACB]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <span className="text-xs text-[#737373] font-medium">
            Showing {filteredItems.length} Photographs &amp; Concepts
          </span>
        </div>
      </section>

      {/* Photos Masonry/Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item, index) => {
            const photoUrl = getPhotoUrl(item.id, item.imageUrl);

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

                  {/* Category Pill */}
                  <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-md text-[10px] font-bold text-[#252525] shadow-2xs border border-[#E2DACB]">
                    {item.category}
                  </div>

                  {/* Concept Badge (If architectural render) */}
                  {item.isConcept && (
                    <div className="absolute bottom-3 left-3 right-3 bg-amber-950/85 backdrop-blur-md px-2.5 py-1 rounded-md text-[10.5px] font-semibold text-amber-200 border border-amber-600/50 text-center">
                      Architectural Visualization &bull; Not Actual Photograph
                    </div>
                  )}
                </div>

                <div className="p-4 space-y-1.5">
                  <h3 className="font-bold text-sm text-[#252525] group-hover:text-[#173D35] transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-xs text-[#4A4A4A] line-clamp-2 leading-relaxed">
                    {item.description}
                  </p>
                  {item.note && (
                    <p className="text-[10px] text-amber-800 font-medium italic pt-0.5">
                      * {item.note}
                    </p>
                  )}
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
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-[#252525] font-serif-heading">
                    {activePhoto.title}
                  </h3>
                  {activePhoto.isConcept && (
                    <span className="bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded text-[10px] font-bold uppercase">
                      Concept Render
                    </span>
                  )}
                </div>
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
              <img
                src={getPhotoUrl(activePhoto.id, activePhoto.imageUrl) || activePhoto.imageUrl}
                alt={activePhoto.title}
                className="max-h-[70vh] w-auto max-w-full object-contain"
              />

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
              <div className="space-y-1 max-w-2xl">
                <p className="text-xs sm:text-sm text-[#4A4A4A] leading-relaxed">
                  {activePhoto.description}
                </p>
                {activePhoto.isConcept && (
                  <p className="text-xs text-amber-800 font-semibold">
                    Notice: This is a computer-generated architectural visualization. It is not an authentic photograph of the completed facility.
                  </p>
                )}
                {activePhoto.note && (
                  <p className="text-xs text-amber-800 italic">
                    * {activePhoto.note}
                  </p>
                )}
              </div>
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

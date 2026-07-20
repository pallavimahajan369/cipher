import { useState, useEffect } from "react";
import { ArrowRight, Sparkles } from "lucide-react";

const CAROUSEL_SLIDES = [
  {
    title: "Onyx & Obsidian Space",
    subtitle: "LIMITED EDITION SERIES",
    description: "Architectural silhouettes meet tactile precision. Discover our mid-season hot-swappable mechanical keys and custom-milled brass patinas.",
    buttonText: "Shop the Drop",
    categoryTarget: "Minimalist Tech",
    image: "https://images.unsplash.com/photo-1547082299-de196ea013d6?auto=format&fit=crop&q=80&w=1200",
  },
  {
    title: "Heavy French Terry & Wool",
    subtitle: "NORDIC STRUCTURED LUXURY",
    description: "Meticulously stitched 450gsm loopback organic cotton sweaters and fine thermal insulating Merino fibers.",
    buttonText: "Browse Garments",
    categoryTarget: "Lifestyle & Apparel",
    image: "https://images.unsplash.com/photo-1556905200-279565513a2d?auto=format&fit=crop&q=80&w=1200",
  },
  {
    title: "Hand-Thrown Ceramic Living",
    subtitle: "ARTISANAL EARTHEN VESSELS",
    description: "Infuse modern quarters with raw textured stoneware cups and Japanese soy cylinders poured in small workshops.",
    buttonText: "Acquire Vessels",
    categoryTarget: "Curated Home",
    image: "https://images.unsplash.com/photo-1612196808214-b8e1d6145a8c?auto=format&fit=crop&q=80&w=1200",
  }
];

export default function BannerCarousel({ onCategorySelect, onOpenAdvisor }) {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % CAROUSEL_SLIDES.length);
    }, 9000);
    return () => clearInterval(timer);
  }, []);

  const slide = CAROUSEL_SLIDES[currentSlide];

  return (
    <div id="banner-carousel-container" className="relative w-full h-[380px] sm:h-[440px] md:h-[500px] bg-[#0A0A0A] rounded-none overflow-hidden border border-white/10 shadow-2xl">
      
      {/* Background Image with elegant sliding crossfade mask */}
      <div 
        className="absolute inset-0 transition-all duration-1000 ease-out scale-105 bg-cover bg-center opacity-40 filter grayscale contrast-125"
        style={{ backgroundImage: `url(${slide.image})` }}
      />
      
      {/* Gradient Vignette Mask depending on slide theme */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0af2] via-[#0a0a0aa6] to-[#0a0a0a20]" />
      
      {/* Delicate line patterns to simulate architectural drawing lines */}
      <div className="absolute inset-y-0 right-1/3 w-px bg-white/5 pointer-events-none hidden md:block"></div>
      <div className="absolute inset-y-0 right-2/3 w-px bg-white/5 pointer-events-none hidden md:block"></div>

      {/* Content overlays */}
      <div className="absolute inset-0 flex items-center z-10">
        <div className="max-w-2xl px-6 sm:px-12 md:px-16 py-6 flex flex-col justify-center">
          
          <span className="text-[#C5A059] text-[10px] sm:text-xs font-bold uppercase tracking-[0.3em] mb-3">
            {slide.subtitle}
          </span>
          
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-serif leading-[1.1] text-white italic font-normal tracking-tight mb-4 animate-fadeIn">
            {slide.title.split("&").map((part, index, arr) => (
              <span key={index}>
                {index > 0 && " & "}
                <span className={index === 1 ? "not-italic text-[#C5A059] font-medium" : ""}>
                  {part}
                </span>
              </span>
            ))}
          </h1>
          
          <p className="text-xs sm:text-sm leading-relaxed text-white/50 max-w-md mb-8 font-sans">
            {slide.description}
          </p>

          <div className="flex flex-wrap items-center gap-4">
            <button
              id={`carousel-cta-${currentSlide}`}
              onClick={() => onCategorySelect(slide.categoryTarget)}
              className="bg-white hover:bg-[#C5A059] hover:text-black text-black px-8 py-3.5 text-xs font-bold uppercase tracking-widest transition-colors duration-300"
            >
              <span className="flex items-center gap-2">
                {slide.buttonText}
                <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </button>

            <button
              id={`carousel-assistant-cta-${currentSlide}`}
              onClick={onOpenAdvisor}
              className="border border-white/20 text-white/80 hover:text-white hover:bg-white/5 px-6 py-3.5 text-xs font-bold uppercase tracking-widest transition-all duration-300 flex items-center gap-2"
            >
              <Sparkles className="h-3.5 w-3.5 text-[#C5A059]" />
              <span>Consult AI Advisor</span>
            </button>
          </div>
        </div>
      </div>

      {/* Manual Slide Dots Indication in the corner */}
      <div className="absolute bottom-6 right-8 flex gap-3 z-10">
        {CAROUSEL_SLIDES.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentSlide(idx)}
            className={`h-1.5 transition-all duration-500 rounded-none ${
              idx === currentSlide 
                ? "w-8 bg-[#C5A059]" 
                : "w-2 bg-white/20 hover:bg-white/40"
            }`}
            title={`Slide ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

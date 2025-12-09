import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '@/hooks/useStore';
import { MapPin, Search, X, Star, ChevronLeft, ChevronRight, Flame, TrendingUp, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

// Horizontal Scrollable Row with Navigation Arrows
function SwimLane({
  title,
  icon: Icon,
  posts,
  onPostClick,
  gradient
}: {
  title: string;
  icon: React.ElementType;
  posts: any[];
  onPostClick: (post: any) => void;
  gradient?: string;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 10);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    checkScroll();
    const ref = scrollRef.current;
    if (ref) {
      ref.addEventListener('scroll', checkScroll);
      return () => ref.removeEventListener('scroll', checkScroll);
    }
  }, [posts]);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 200;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  if (posts.length === 0) return null;

  return (
    <div className="mb-6">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", gradient || "bg-gray-100")}>
            <Icon size={16} className="text-white" />
          </div>
          <h3 className="font-bold text-gray-900">{title}</h3>
        </div>

        {/* Navigation Arrows */}
        <div className="flex gap-1">
          <button
            onClick={() => scroll('left')}
            disabled={!canScrollLeft}
            className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center transition-all",
              canScrollLeft
                ? "bg-gray-100 hover:bg-gray-200 text-gray-700"
                : "bg-gray-50 text-gray-300 cursor-not-allowed"
            )}
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={() => scroll('right')}
            disabled={!canScrollRight}
            className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center transition-all",
              canScrollRight
                ? "bg-gray-100 hover:bg-gray-200 text-gray-700"
                : "bg-gray-50 text-gray-300 cursor-not-allowed"
            )}
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Horizontal Scroll */}
      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 snap-x snap-mandatory scrollbar-hide"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {posts.map((post, index) => (
          <motion.div
            key={post.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onPostClick(post)}
            className="flex-shrink-0 w-40 snap-start cursor-pointer"
          >
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
              {/* Thumbnail */}
              <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-50 relative">
                {post.image_data || post.thumbnailUrl ? (
                  <img
                    src={post.image_data || post.thumbnailUrl}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
                    <span className="text-2xl font-bold text-gray-300">{post.currency || 'USD'}</span>
                  </div>
                )}
                {/* Rate Badge */}
                {post.rate && (
                  <div className="absolute top-2 right-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-lg shadow-sm">
                    {post.rate}
                  </div>
                )}
                {/* Type Badge */}
                {post.type && (
                  <div className={cn(
                    "absolute top-2 left-2 text-xs font-medium px-2 py-1 rounded-lg",
                    post.type === 'buy' ? "bg-blue-500 text-white" : "bg-orange-500 text-white"
                  )}>
                    {post.type === 'buy' ? 'Куплю' : 'Продам'}
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="p-3">
                <p className="text-sm font-medium text-gray-900 line-clamp-2 mb-2 min-h-[40px]">
                  {post.description?.slice(0, 40) || post.buy_description?.slice(0, 40) || 'Обмен валюты'}
                </p>
                <div className="flex items-center justify-between">
                  {post.location && (
                    <div className="flex items-center gap-1 text-xs text-gray-400">
                      <MapPin size={10} />
                      <span className="truncate max-w-[60px]">{post.location}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-0.5">
                    <Star size={10} className="text-yellow-400 fill-yellow-400" />
                    <span className="text-xs text-gray-500">5.0</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// Animated Banner Carousel
function BannerCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);
  const banners = [
    { id: 1, gradient: 'from-blue-500 to-purple-600', title: 'Лучшие курсы', subtitle: 'Обмен без комиссии' },
    { id: 2, gradient: 'from-orange-400 to-pink-500', title: 'Быстро и надёжно', subtitle: 'Проверенные обменники' },
    { id: 3, gradient: 'from-green-400 to-teal-500', title: 'NellX', subtitle: 'P2P обмен валют' },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % banners.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="mb-6">
      <div className="relative overflow-hidden rounded-2xl">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeIndex}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
            className={cn(
              "w-full h-32 bg-gradient-to-r p-5 flex flex-col justify-end",
              banners[activeIndex].gradient
            )}
          >
            <motion.h2
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="text-white text-xl font-bold"
            >
              {banners[activeIndex].title}
            </motion.h2>
            <motion.p
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-white/80 text-sm"
            >
              {banners[activeIndex].subtitle}
            </motion.p>
          </motion.div>
        </AnimatePresence>

        {/* Navigation arrows */}
        <button
          onClick={() => setActiveIndex((prev) => (prev - 1 + banners.length) % banners.length)}
          className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
        >
          <ChevronLeft size={18} className="text-white" />
        </button>
        <button
          onClick={() => setActiveIndex((prev) => (prev + 1) % banners.length)}
          className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
        >
          <ChevronRight size={18} className="text-white" />
        </button>
      </div>

      {/* Dots */}
      <div className="flex justify-center gap-1.5 mt-3">
        {banners.map((_, i) => (
          <button
            key={i}
            onClick={() => setActiveIndex(i)}
            className={cn(
              "h-2 rounded-full transition-all duration-300",
              i === activeIndex ? "bg-gray-900 w-6" : "bg-gray-300 w-2"
            )}
          />
        ))}
      </div>
    </div>
  );
}

export function Feed() {
  const {
    searchQuery,
    setSearchQuery,
    getFilteredPosts
  } = useStore();

  const navigate = useNavigate();
  const [localSearch, setLocalSearch] = useState(searchQuery);

  // Get posts - AppShell already fetches them

  useEffect(() => {
    const timer = setTimeout(() => setSearchQuery(localSearch), 250);
    return () => clearTimeout(timer);
  }, [localSearch, setSearchQuery]);

  const allPosts = getFilteredPosts();

  // Split posts into categories
  const hotPosts = allPosts.slice(0, 8);
  const topRatedPosts = allPosts.slice(0, 10);
  const featuredPosts = allPosts.slice(0, 6);

  const handlePostClick = (post: any) => {
    navigate(`/post/${post.id}`);
  };

  const handleClearSearch = () => {
    setLocalSearch('');
    setSearchQuery('');
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className="space-y-2 pb-20"
    >
      {/* Search Bar */}
      <div className="relative mb-4">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
          placeholder="Поиск..."
          className="w-full pl-11 pr-10 py-3 bg-gray-100 border-0 rounded-xl text-sm focus:ring-2 focus:ring-gray-900/10 focus:bg-white transition-all"
        />
        {localSearch && (
          <button onClick={handleClearSearch} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
            <X size={16} />
          </button>
        )}
      </div>

      {/* Banner Carousel */}
      <BannerCarousel />

      {/* Hot Deals - Horizontal Swimlane */}
      <SwimLane
        title="Горячие предложения"
        icon={Flame}
        posts={hotPosts}
        onPostClick={handlePostClick}
        gradient="bg-gradient-to-br from-orange-500 to-red-500"
      />

      {/* Top Rated - Horizontal Swimlane */}
      <SwimLane
        title="Лучший курс"
        icon={TrendingUp}
        posts={topRatedPosts}
        onPostClick={handlePostClick}
        gradient="bg-gradient-to-br from-green-500 to-emerald-500"
      />

      {/* Featured - Horizontal Swimlane */}
      <SwimLane
        title="Рекомендуемые"
        icon={Sparkles}
        posts={featuredPosts}
        onPostClick={handlePostClick}
        gradient="bg-gradient-to-br from-purple-500 to-pink-500"
      />

      {allPosts.length === 0 && (
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Search size={24} className="text-gray-400" />
          </div>
          <p className="text-gray-500">Пока нет постов</p>
          <p className="text-sm text-gray-400 mt-1">Станьте первым обменником!</p>
        </div>
      )}
    </motion.div>
  );
}

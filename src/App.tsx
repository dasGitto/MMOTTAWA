/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from 'motion/react';
import { MessageSquare, Heart, X, ChevronLeft, ChevronRight, Maximize2, ArrowLeft, ArrowRight, Package, Plus, MapPin, Layers, LayoutGrid, ChevronDown } from 'lucide-react';
import { CardData, MOCK_CARDS } from './types';

const TABLE_WIDTH = 3000;
const TABLE_HEIGHT = 3000;

const NEIGHBORHOODS = ['Ottawa', 'Alta Vista', 'Orleans', 'Glebe', 'Nepean', 'Kanata', 'Barrhaven'];
const CATEGORIES = Array.from(new Set(MOCK_CARDS.map(c => c.category)));

export default function App() {
  const [cards, setCards] = useState<CardData[]>(MOCK_CARDS);
  const [activeView, setActiveView] = useState<'full-pile' | 'my-pile' | 'free-pile'>('full-pile');
  const [zoomedCardInfo, setZoomedCardInfo] = useState<{ id: string, pile: 'full' | 'free' | 'my' } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragAction, setDragAction] = useState<'keep' | 'discard' | 'message' | null>(null);
  const [range, setRange] = useState(5);
  const [isStacked, setIsStacked] = useState(false);
  const [isSortedByDistance, setIsSortedByDistance] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedNeighborhood, setSelectedNeighborhood] = useState('Ottawa');
  const [isNeighborhoodMenuOpen, setIsNeighborhoodMenuOpen] = useState(false);
  
  const tableRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Camera position
  const cameraX = useMotionValue(0);
  const cameraY = useMotionValue(0);

  const zoomedCard = zoomedCardInfo ? cards.find(c => c.id === zoomedCardInfo.id) : null;

  const handleAction = (cardId: string, action: 'keep' | 'discard' | 'message') => {
    setCards(prev => prev.map(card => {
      if (card.id === cardId) {
        if (action === 'keep') {
          // When keeping, we might want to randomize position slightly in the new pile
          return { 
            ...card, 
            status: 'my-pile',
            x: 100 + Math.random() * (window.innerWidth - 400),
            y: 100 + Math.random() * (window.innerHeight - 500)
          };
        }
        if (action === 'discard') return { ...card, status: 'not-interested' };
        return card;
      }
      return card;
    }));
    setZoomedCardInfo(null);
  };

  const panTo = (view: 'full-pile' | 'my-pile' | 'free-pile') => {
    setActiveView(view);
    let targetX = 0;
    let targetY = 0;

    if (view === 'my-pile') {
      targetX = -window.innerWidth;
    } else if (view === 'free-pile') {
      targetY = window.innerHeight; // Pan UP means table moves DOWN
    }

    animate(cameraX, targetX, { type: 'spring', damping: 20, stiffness: 150 });
    animate(cameraY, targetY, { type: 'spring', damping: 20, stiffness: 150 });
  };

  const updateCardPosition = (id: string, x: number, y: number, pile: 'full' | 'free' | 'my') => {
    setCards(prev => prev.map(c => {
      if (c.id === id) {
        if (pile === 'free') return { ...c, freeX: x, freeY: y };
        return { ...c, x, y };
      }
      return c;
    }));
  };

  const bringToFront = (id: string) => {
    setCards(prev => {
      const cardIndex = prev.findIndex(c => c.id === id);
      if (cardIndex === -1) return prev;
      const newCards = [...prev];
      const [card] = newCards.splice(cardIndex, 1);
      newCards.push(card);
      return newCards;
    });
  };

  const toggleStack = () => {
    setIsStacked(!isStacked);
    setIsSortedByDistance(false);
    setSelectedCategory(null);
  };

  const toggleDistanceSort = () => {
    setIsSortedByDistance(!isSortedByDistance);
    setIsStacked(false);
    setSelectedCategory(null);
  };

  const selectCategory = (category: string) => {
    if (selectedCategory === category) {
      setSelectedCategory(null);
    } else {
      const isMobile = window.innerWidth < 768;
      const screenW = window.innerWidth;
      
      // When selecting a category, we snap the cards to their grid positions in the state
      // so they can be freely moved from those positions.
      const cardsInCat = cards.filter(c => c.category === category && c.status === 'full-pile');
      setCards(prev => prev.map(c => {
        if (c.category === category && c.status === 'full-pile') {
          const index = cardsInCat.findIndex(card => card.id === c.id);
          const cols = isMobile ? 2 : 3;
          const cardW = isMobile ? 144 : 208;
          const spacingX = isMobile ? 160 : 240;
          const spacingY = isMobile ? 220 : 340;
          
          // Center the grid horizontally
          const gridW = (Math.min(cardsInCat.length, cols) - 1) * spacingX;
          const startX = (screenW - gridW - cardW) / 2;
          const startY = isMobile ? 80 : 120;

          return {
            ...c,
            x: startX + (index % cols) * spacingX,
            y: startY + Math.floor(index / cols) * spacingY
          };
        }
        return c;
      }));
      setSelectedCategory(category);
    }
  };

  const getCardTransform = (card: CardData) => {
    if (card.status !== 'full-pile') return { x: card.x, y: card.y, opacity: 1, scale: 1 };

    const isMobile = window.innerWidth < 768;
    const screenW = window.innerWidth;
    const screenH = window.innerHeight;

    if (isSortedByDistance) {
      const sortedCards = [...cards]
        .filter(c => c.status === 'full-pile')
        .sort((a, b) => a.distance - b.distance);
      const index = sortedCards.findIndex(c => c.id === card.id);
      
      const cols = isMobile ? 2 : 4;
      const cardW = isMobile ? 144 : 208;
      const spacingX = isMobile ? 160 : 240;
      const spacingY = isMobile ? 220 : 340;

      // Center horizontally
      const gridW = (Math.min(sortedCards.length, cols) - 1) * spacingX;
      const startX = (screenW - gridW - cardW) / 2;
      const startY = isMobile ? 80 : 120;
      
      return {
        x: startX + (index % cols) * spacingX,
        y: startY + Math.floor(index / cols) * spacingY,
        opacity: 1,
        scale: isMobile ? 0.8 : 1
      };
    }

    if (isStacked) {
      const catIndex = CATEGORIES.indexOf(card.category);
      
      if (selectedCategory) {
        if (card.category === selectedCategory) {
          // Use the card's actual position (which was initialized to the grid)
          return {
            x: card.x,
            y: card.y,
            opacity: 1,
            scale: 1 // Normal size when browsing
          };
        } else {
          // Push away and hide
          return {
            x: screenW * 1.2,
            y: screenH * 1.2,
            opacity: 0,
            scale: 0.5
          };
        }
      }

      // Overview Stack View - Line up within screen
      const cols = isMobile ? 2 : 3;
      const cardW = isMobile ? 144 : 208;
      const cardH = cardW * 1.5;
      
      // Constrain to a safe area within the screen
      const safePaddingX = isMobile ? 60 : 150;
      const safePaddingY = isMobile ? 100 : 150;
      
      const availableW = screenW - safePaddingX * 2;
      const availableH = screenH - safePaddingY * 2;
      
      const spacingX = availableW / (cols - 1 || 1);
      const rows = Math.ceil(CATEGORIES.length / cols);
      const spacingY = availableH / (rows - 1 || 1);
      
      const stackX = safePaddingX + (catIndex % cols) * spacingX - (cardW * 0.5);
      const stackY = safePaddingY + Math.floor(catIndex / cols) * spacingY - (cardH * 0.5);

      const cardsInCat = cards.filter(c => c.category === card.category && c.status === 'full-pile');
      const index = cardsInCat.findIndex(c => c.id === card.id);
      return {
        x: stackX + index * 4,
        y: stackY + index * 4,
        opacity: 1,
        scale: isMobile ? 0.45 : 0.6 // Slightly smaller to ensure fit
      };
    }

    return { x: card.x, y: card.y, opacity: 1, scale: 1 };
  };

  return (
    <div className="relative w-screen h-screen bg-[#1a120b] overflow-hidden font-sans touch-none select-none">
      {/* Woodgrain Background */}
      <div 
        className="absolute inset-0 opacity-40 pointer-events-none" 
        style={{ 
          backgroundImage: 'url("https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&w=2000&q=80")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'contrast(1.2) brightness(0.8)'
        }} 
      />
      
      {/* Workspace Border / Table Surface */}
      <div className="absolute inset-4 md:inset-8 border border-white/5 rounded-[2rem] md:rounded-[3rem] pointer-events-none z-0 bg-black/10 backdrop-blur-[2px]" />

      {/* Background Grid Accent */}
      <div className="absolute inset-0 opacity-5 pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

      {/* Table Container */}
      <motion.div 
        ref={tableRef}
        className="absolute top-0 left-0"
        style={{ 
          width: TABLE_WIDTH, 
          height: TABLE_HEIGHT,
          x: cameraX,
          y: cameraY
        }}
      >
        {/* Full Pile Section */}
        <div className="absolute top-0 left-0 w-screen h-screen flex flex-col items-center justify-center pointer-events-none">
          <h1 className="text-6xl font-display italic opacity-20 select-none uppercase">{selectedNeighborhood} PILE</h1>
          
          {/* Category Titlebars when stacked */}
          <AnimatePresence>
            {isStacked && activeView === 'full-pile' && (
              <div className="absolute inset-0 pointer-events-none">
                {CATEGORIES.map((cat, i) => {
                  const stackX = 200 + (i % 3) * 400;
                  const stackY = 200 + Math.floor(i / 3) * 500;
                  const isSelected = selectedCategory === cat;
                  
                  return (
                    <motion.div
                      key={cat}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ 
                        opacity: selectedCategory && !isSelected ? 0 : 1, 
                        x: isSelected ? 200 : stackX,
                        y: isSelected ? 100 : stackY - 40,
                        scale: isSelected ? 1.2 : 1
                      }}
                      exit={{ opacity: 0 }}
                      className="absolute pointer-events-auto z-30"
                    >
                      <button
                        onClick={() => selectCategory(cat)}
                        className={`px-4 py-2 rounded-t-lg font-mono text-[10px] uppercase tracking-widest transition-colors shadow-2xl border-x border-t border-white/30 ${
                          isSelected ? 'bg-emerald-500 text-white' : 'bg-[#2a2a2a] text-white/90 hover:text-white hover:bg-[#333333]'
                        }`}
                      >
                        {cat} ({cards.filter(c => c.category === cat && c.status === 'full-pile').length})
                      </button>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </AnimatePresence>
        </div>

        {/* Free Pile Section (Above) */}
        <div className="absolute top-[-100vh] left-0 w-screen h-screen flex flex-col items-center justify-center border-b border-white/10 bg-emerald-900/[0.02] pointer-events-none">
          <h1 className="text-6xl font-display italic opacity-20 select-none">FREE PILE</h1>
          
          {/* Distance Filter UI */}
          <div className="absolute top-12 right-12 flex items-center gap-4 bg-black/80 backdrop-blur-xl p-4 rounded-2xl border border-white/40 shadow-2xl pointer-events-auto">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold font-mono text-white/60 uppercase tracking-widest">Radius</span>
              <div className="flex items-center gap-2">
                <MapPin size={16} className="text-emerald-400" />
                <span className="text-2xl font-display italic text-white">{range} km</span>
              </div>
            </div>
            <button 
              onClick={() => setRange(prev => prev + 1)}
              className="w-12 h-12 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors border border-white/20"
            >
              <Plus size={24} />
            </button>
          </div>

          {/* Independent Free Pile Cards */}
          {cards
            .filter(c => c.isFree && c.status === 'full-pile' && c.distance <= range)
            .map((card) => (
              <DraggableCard 
                key={`free-${card.id}`} 
                card={{ ...card, x: card.freeX || 0, y: card.freeY || 0 }} 
                onZoom={() => setZoomedCardInfo({ id: card.id, pile: 'free' })}
                onPositionChange={(x, y) => updateCardPosition(card.id, x, y, 'free')}
                onDragStart={() => {
                  setIsDragging(true);
                  bringToFront(card.id);
                }}
                onDragEnd={(action: 'keep' | 'discard' | 'message' | null) => {
                  setIsDragging(false);
                  setDragAction(null);
                  if (action) handleAction(card.id, action);
                }}
                onDragUpdate={(action: 'keep' | 'discard' | 'message' | null) => setDragAction(action)}
                viewOffset={0}
                verticalOffset={-window.innerHeight}
                isStacked={false}
                selectedCategory={null}
                stackTransform={{ x: card.freeX || 0, y: card.freeY || 0, opacity: 1, scale: 1 }}
                currentAction={dragAction}
                pileType="free"
              />
            ))}
        </div>

        {/* My Pile Section */}
        <div className="absolute top-0 left-[100vw] w-screen h-screen flex flex-col items-center justify-center border-l border-white/10 bg-white/[0.02] pointer-events-none">
          <h1 className="text-6xl font-display italic opacity-20 select-none">MY PILE</h1>
          
          {/* My Pile Cards */}
          {cards
            .filter(c => c.status === 'my-pile')
            .map((card) => (
              <DraggableCard 
                key={`my-${card.id}`} 
                card={card} 
                onZoom={() => setZoomedCardInfo({ id: card.id, pile: 'my' })}
                onPositionChange={(x, y) => updateCardPosition(card.id, x, y, 'my')}
                onDragStart={() => {
                  setIsDragging(true);
                  bringToFront(card.id);
                }}
                onDragEnd={(action: 'keep' | 'discard' | 'message' | null) => {
                  setIsDragging(false);
                  setDragAction(null);
                  if (action) handleAction(card.id, action);
                }}
                onDragUpdate={(action: 'keep' | 'discard' | 'message' | null) => setDragAction(action)}
                viewOffset={window.innerWidth}
                verticalOffset={0}
                isStacked={false}
                selectedCategory={null}
                stackTransform={{ x: card.x, y: card.y, opacity: 1, scale: 1 }}
                currentAction={dragAction}
                pileType="my"
              />
            ))}
        </div>

        {/* Ottawa Pile Cards */}
        {cards
          .filter(c => c.status === 'full-pile')
          .map((card) => {
            const transform = getCardTransform(card);
            return (
              <DraggableCard 
                key={`full-${card.id}`} 
                card={card} 
                onZoom={() => setZoomedCardInfo({ id: card.id, pile: 'full' })}
                onPositionChange={(x, y) => updateCardPosition(card.id, x, y, 'full')}
                onDragStart={() => {
                  setIsDragging(true);
                  bringToFront(card.id);
                }}
                onDragEnd={(action: 'keep' | 'discard' | 'message' | null) => {
                  setIsDragging(false);
                  setDragAction(null);
                  if (action) handleAction(card.id, action);
                }}
                onDragUpdate={(action: 'keep' | 'discard' | 'message' | null) => setDragAction(action)}
                viewOffset={0}
                verticalOffset={0}
                isStacked={isStacked}
                selectedCategory={selectedCategory}
                stackTransform={transform}
                currentAction={dragAction}
                pileType="full"
              />
            );
          })}
      </motion.div>

      {/* Navigation Controls */}
      <div className="absolute bottom-8 left-4 right-4 md:left-1/2 md:-translate-x-1/2 flex flex-wrap justify-center gap-2 md:gap-4 z-40">
        <div className="flex bg-black/90 backdrop-blur-xl rounded-full border border-white/40 p-1.5 shadow-2xl">
          <button 
            onClick={toggleStack}
            className={`px-5 py-2.5 rounded-full transition-all flex items-center gap-2 text-xs md:text-sm font-bold ${
              isStacked 
              ? 'bg-emerald-500 text-white shadow-lg' 
              : 'text-white/90 hover:text-white'
            }`}
          >
            <Layers size={16} />
            Category
          </button>
          <button 
            onClick={toggleDistanceSort}
            className={`px-5 py-2.5 rounded-full transition-all flex items-center gap-2 text-xs md:text-sm font-bold ${
              isSortedByDistance 
              ? 'bg-emerald-500 text-white shadow-lg' 
              : 'text-white/90 hover:text-white'
            }`}
          >
            <MapPin size={16} />
            Distance
          </button>
        </div>

        <div className="hidden md:block w-px h-12 bg-white/30 mx-1" />

        <button 
          onClick={() => panTo('free-pile')}
          className={`px-5 md:px-8 py-2.5 md:py-4 rounded-full border transition-all flex items-center gap-2 text-xs md:text-base font-bold shadow-2xl ${
            activeView === 'free-pile' 
            ? 'bg-white text-black border-white' 
            : 'bg-black/90 text-white border-white/40 hover:border-white/60'
          }`}
        >
          <Package size={18} />
          Free
        </button>
        <button 
          onClick={() => panTo('full-pile')}
          className={`px-5 md:px-8 py-2.5 md:py-4 rounded-full border transition-all flex items-center gap-2 text-xs md:text-base font-bold shadow-2xl ${
            activeView === 'full-pile' 
            ? 'bg-white text-black border-white' 
            : 'bg-black/90 text-white border-white/40 hover:border-white/60'
          }`}
        >
          <Maximize2 size={18} />
          {selectedNeighborhood} - {range}km
        </button>

        <div className="relative">
          <button 
            onClick={() => setIsNeighborhoodMenuOpen(!isNeighborhoodMenuOpen)}
            className="px-5 md:px-8 py-2.5 md:py-4 rounded-full border bg-black/90 text-white border-white/40 hover:border-white/60 transition-all flex items-center gap-2 text-xs md:text-base font-bold shadow-2xl"
          >
            <MapPin size={18} />
            Change Area
            <ChevronDown size={16} className={`transition-transform ${isNeighborhoodMenuOpen ? 'rotate-180' : ''}`} />
          </button>

          <AnimatePresence>
            {isNeighborhoodMenuOpen && (
              <motion.div 
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute bottom-full mb-4 left-0 md:left-auto md:right-0 bg-[#111111] border border-white/40 rounded-2xl shadow-2xl p-2 min-w-[180px] grid grid-cols-1 gap-1 z-50"
              >
                {NEIGHBORHOODS.map(n => (
                  <button
                    key={n}
                    onClick={() => {
                      setSelectedNeighborhood(n);
                      setIsNeighborhoodMenuOpen(false);
                      panTo('full-pile');
                    }}
                    className={`px-4 py-3 rounded-xl text-left text-xs md:text-sm font-bold transition-colors ${
                      selectedNeighborhood === n 
                      ? 'bg-emerald-500 text-white' 
                      : 'text-white/80 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <button 
          onClick={() => panTo('my-pile')}
          className={`relative px-5 md:px-8 py-2.5 md:py-4 rounded-full border transition-all flex items-center gap-2 relative text-xs md:text-base font-bold shadow-2xl ${
            activeView === 'my-pile' 
            ? 'bg-white text-black border-white' 
            : 'bg-black/90 text-white border-white/40 hover:border-white/60'
          }`}
        >
          <Heart size={18} className={activeView === 'my-pile' ? 'fill-black' : ''} />
          Mine
          {cards.filter(c => c.status === 'my-pile').length > 0 && (
            <motion.span 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              key={cards.filter(c => c.status === 'my-pile').length}
              className="absolute -top-1.5 -right-1.5 w-6 h-6 bg-emerald-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-2xl border border-white/20"
            >
              {cards.filter(c => c.status === 'my-pile').length}
            </motion.span>
          )}
        </button>
      </div>

      {/* Action Zones (Visible during drag) */}
      <AnimatePresence>
        {isDragging && (
          <>
            {/* Top: Message Owner */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={`absolute top-0 left-0 right-0 h-48 flex items-center justify-center z-40 pointer-events-none transition-colors duration-500 ${
                dragAction === 'message' ? 'bg-blue-500/10' : 'bg-transparent'
              }`}
            >
              <div className={`flex flex-col items-center gap-3 transition-all duration-300 ${dragAction === 'message' ? 'scale-110 opacity-100' : 'scale-90 opacity-70'}`}>
                <div className={`p-4 rounded-full border-2 ${dragAction === 'message' ? 'border-blue-400 bg-blue-400/20' : 'border-white/40 bg-white/10'}`}>
                  <MessageSquare className={dragAction === 'message' ? 'text-blue-400' : 'text-white'} size={32} />
                </div>
                <span className={`font-mono text-[10px] tracking-[0.3em] uppercase font-bold ${dragAction === 'message' ? 'text-blue-400' : 'text-white'}`}>Message Owner</span>
              </div>
            </motion.div>

            {/* Left: Not Interested */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={`absolute top-0 bottom-0 left-0 w-48 flex items-center justify-center z-40 pointer-events-none transition-colors duration-500 ${
                dragAction === 'discard' ? 'bg-red-500/10' : 'bg-transparent'
              }`}
            >
              <div className={`flex flex-col items-center gap-3 -rotate-90 transition-all duration-300 ${dragAction === 'discard' ? 'scale-110 opacity-100' : 'scale-90 opacity-70'}`}>
                <div className={`p-4 rounded-full border-2 ${dragAction === 'discard' ? 'border-red-400 bg-red-400/20' : 'border-white/40 bg-white/10'}`}>
                  <X className={dragAction === 'discard' ? 'text-red-400' : 'text-white'} size={32} />
                </div>
                <span className={`font-mono text-[10px] tracking-[0.3em] uppercase font-bold ${dragAction === 'discard' ? 'text-red-400' : 'text-white'}`}>Not Interested</span>
              </div>
            </motion.div>

            {/* Right: Keep for My Pile */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={`absolute top-0 bottom-0 right-0 w-48 flex items-center justify-center z-40 pointer-events-none transition-colors duration-500 ${
                dragAction === 'keep' ? 'bg-emerald-500/10' : 'bg-transparent'
              }`}
            >
              <div className={`flex flex-col items-center gap-3 rotate-90 transition-all duration-300 ${dragAction === 'keep' ? 'scale-110 opacity-100' : 'scale-90 opacity-70'}`}>
                <div className={`p-4 rounded-full border-2 ${dragAction === 'keep' ? 'border-emerald-400 bg-emerald-400/20' : 'border-white/40 bg-white/10'}`}>
                  <Heart className={dragAction === 'keep' ? 'text-emerald-400' : 'text-white'} size={32} />
                </div>
                <span className={`font-mono text-[10px] tracking-[0.3em] uppercase font-bold ${dragAction === 'keep' ? 'text-emerald-400' : 'text-white'}`}>Keep for My Pile</span>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Zoomed View */}
      <AnimatePresence>
        {zoomedCard && zoomedCardInfo && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-xl p-8"
          >
            <motion.div 
              layoutId={`card-${zoomedCard.id}-${zoomedCardInfo.pile}`}
              className="relative w-full max-w-4xl bg-[#1a1a1a] rounded-3xl overflow-hidden flex flex-col md:flex-row shadow-2xl border border-white/10"
            >
              <button 
                onClick={() => setZoomedCardInfo(null)}
                className="absolute top-6 right-6 p-2 rounded-full bg-black/50 text-white hover:bg-white hover:text-black transition-colors z-10"
              >
                <X size={24} />
              </button>

              <div className="w-full md:w-1/2 h-[400px] md:h-auto">
                <img 
                  src={zoomedCard.imageUrl} 
                  alt={zoomedCard.title} 
                  draggable="false"
                  className="w-full h-full object-cover select-none"
                  referrerPolicy="no-referrer"
                />
              </div>

              <div className="w-full md:w-1/2 p-12 flex flex-col justify-between">
                <div>
                  <span className="text-xs font-mono text-white/40 uppercase tracking-[0.2em] mb-4 block">Owner: {zoomedCard.owner}</span>
                  <h2 className="text-5xl font-display italic text-white mb-6">{zoomedCard.title}</h2>
                  <p className="text-lg text-white/60 leading-relaxed font-sans">{zoomedCard.description}</p>
                </div>

                <div className="grid grid-cols-3 gap-4 mt-12">
                  <button 
                    onClick={() => {
                      handleAction(zoomedCard.id, 'discard');
                      setZoomedCardInfo(null);
                    }}
                    className="flex flex-col items-center gap-2 p-4 rounded-2xl border border-white/10 hover:bg-red-500/10 hover:border-red-500/50 transition-all group"
                  >
                    <X className="text-white/40 group-hover:text-red-400" size={24} />
                    <span className="text-[10px] font-mono uppercase tracking-widest text-white/40 group-hover:text-red-400">Discard</span>
                  </button>
                  <button 
                    onClick={() => {
                      handleAction(zoomedCard.id, 'message');
                      setZoomedCardInfo(null);
                    }}
                    className="flex flex-col items-center gap-2 p-4 rounded-2xl border border-white/10 hover:bg-blue-500/10 hover:border-blue-500/50 transition-all group"
                  >
                    <MessageSquare className="text-white/40 group-hover:text-blue-400" size={24} />
                    <span className="text-[10px] font-mono uppercase tracking-widest text-white/40 group-hover:text-blue-400">Message</span>
                  </button>
                  <button 
                    onClick={() => {
                      handleAction(zoomedCard.id, 'keep');
                      setZoomedCardInfo(null);
                    }}
                    className="flex flex-col items-center gap-2 p-4 rounded-2xl border border-white/10 hover:bg-emerald-500/10 hover:border-emerald-500/50 transition-all group"
                  >
                    <Heart className="text-white/40 group-hover:text-emerald-400" size={24} />
                    <span className="text-[10px] font-mono uppercase tracking-widest text-white/40 group-hover:text-emerald-400">Keep</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface DraggableCardProps {
  card: CardData;
  onZoom: () => void;
  onPositionChange: (x: number, y: number) => void;
  onDragStart: () => void;
  onDragEnd: (action: 'keep' | 'discard' | 'message' | null) => void;
  onDragUpdate: (action: 'keep' | 'discard' | 'message' | null) => void;
  viewOffset: number;
  verticalOffset: number;
  isStacked: boolean;
  selectedCategory: string | null;
  stackTransform: { x: number, y: number, opacity: number, scale: number };
  currentAction: 'keep' | 'discard' | 'message' | null;
  pileType: 'full' | 'free' | 'my';
}

const DraggableCard: React.FC<DraggableCardProps> = ({ 
  card, 
  onZoom, 
  onPositionChange, 
  onDragStart, 
  onDragEnd, 
  onDragUpdate, 
  viewOffset, 
  verticalOffset, 
  isStacked, 
  selectedCategory, 
  stackTransform, 
  currentAction,
  pileType
}) => {
  const x = useMotionValue(card.x + viewOffset);
  const y = useMotionValue(card.y + verticalOffset);
  
  const pointerStartTime = useRef(0);
  const dragActive = useRef(false);
  const wasJustDragging = useRef(false);

  // Sync motion values when card data or view offset changes
  useEffect(() => {
    // Don't fight with active dragging
    if (dragActive.current) return;

    if (isStacked && pileType === 'full') {
      animate(x, stackTransform.x, { type: 'spring', damping: 25, stiffness: 120 });
      animate(y, stackTransform.y, { type: 'spring', damping: 25, stiffness: 120 });
    } else {
      animate(x, card.x + viewOffset, { type: 'spring', damping: 25, stiffness: 120 });
      animate(y, card.y + verticalOffset, { type: 'spring', damping: 25, stiffness: 120 });
    }
  }, [card.x, card.y, viewOffset, verticalOffset, isStacked, stackTransform.x, stackTransform.y, pileType]);
  
  const rotate = useTransform(x, [0, TABLE_WIDTH], [-5, 5]);
  const scale = useMotionValue(1);

  // Magnetic tilt based on current action
  const magneticRotate = useMotionValue(0);
  useEffect(() => {
    let targetRotate = 0;
    // Only tilt if THIS card is being dragged
    if (dragActive.current) {
      if (currentAction === 'keep') targetRotate = 12;
      if (currentAction === 'discard') targetRotate = -12;
    }
    
    animate(magneticRotate, targetRotate, { type: 'spring', damping: 20, stiffness: 200 });
  }, [currentAction]);

  const combinedRotate = useTransform([rotate, magneticRotate], ([r, mr]) => (r as number) + (mr as number));

  const handleDragEnd = (_: any, info: any) => {
    // Allow dragging if not stacked OR if it's the selected category
    const canDrag = !isStacked || (pileType === 'full' && card.category === selectedCategory);
    if (!canDrag) return;
    
    const threshold = 120; // Slightly more generous
    const velocityThreshold = 400; // Lower velocity threshold for easier flicking
    
    let action: 'keep' | 'discard' | 'message' | null = null;

    const screenX = info.point.x;
    const screenY = info.point.y;

    if (screenX < threshold || info.velocity.x < -velocityThreshold) {
      action = 'discard';
    } else if (screenX > window.innerWidth - threshold || info.velocity.x > velocityThreshold) {
      action = 'keep';
    } else if (screenY < threshold || info.velocity.y < -velocityThreshold) {
      action = 'message';
    }

    // Reset drag active immediately so useEffect can run for the final position
    dragActive.current = false;

    if (action) {
      onDragEnd(action);
    } else {
      onDragEnd(null);
      onPositionChange(x.get() - viewOffset, y.get() - verticalOffset);
    }
    scale.set(1);
    
    // Set a separate ref for tap protection
    wasJustDragging.current = true;
    setTimeout(() => { wasJustDragging.current = false; }, 100);
  };

  const handleDrag = (_: any, info: any) => {
    const threshold = 120;
    const velocityThreshold = 400;
    
    const screenX = info.point.x;
    const screenY = info.point.y;

    let action: 'keep' | 'discard' | 'message' | null = null;

    if (screenX < threshold || info.velocity.x < -velocityThreshold) {
      action = 'discard';
    } else if (screenX > window.innerWidth - threshold || info.velocity.x > velocityThreshold) {
      action = 'keep';
    } else if (screenY < threshold || info.velocity.y < -velocityThreshold) {
      action = 'message';
    }

    onDragUpdate(action);
  };

  return (
    <motion.div
      layoutId={`card-${card.id}-${pileType}`}
      drag={!isStacked || (pileType === 'full' && card.category === selectedCategory)}
      dragMomentum={false}
      initial={false}
      animate={{ 
        opacity: isStacked && pileType === 'full' ? stackTransform.opacity : 1,
        scale: isStacked && pileType === 'full' ? stackTransform.scale : scale.get() 
      }}
      onPointerDown={() => {
        pointerStartTime.current = Date.now();
        dragActive.current = false;
      }}
      onDragStart={() => {
        dragActive.current = true;
        onDragStart();
        scale.set(1.05);
      }}
      onDrag={handleDrag}
      onDragEnd={handleDragEnd}
      onTap={() => {
        const duration = Date.now() - pointerStartTime.current;
        // Only zoom if it was a quick tap AND no drag was active/recent
        if (duration < 250 && !dragActive.current && !wasJustDragging.current) {
          onZoom();
        }
      }}
      style={{ x, y, rotate: combinedRotate, scale }}
      className="absolute w-36 md:w-52 aspect-[2/3] cursor-grab active:cursor-grabbing z-10"
    >
      <div className="w-full h-full bg-[#1a1a1a] rounded-2xl overflow-hidden shadow-xl border border-white/10 group">
        <div className="h-2/3 w-full overflow-hidden bg-black/20">
          <img 
            src={card.imageUrl} 
            alt={card.title} 
            draggable="false"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 select-none pointer-events-none brightness-90 contrast-110 grayscale-[0.2] sepia-[0.1]"
            referrerPolicy="no-referrer"
          />
        </div>
        <div className="p-4 flex flex-col justify-between h-1/3">
          <div>
            <div className="flex justify-between items-start">
              <h3 className="text-white font-display italic text-lg leading-tight mb-1">{card.title}</h3>
              {card.isFree && (
                <span className="text-[8px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded font-mono uppercase">Free</span>
              )}
            </div>
            <p className="text-white/40 text-[10px] font-mono uppercase tracking-widest">By {card.owner} • {card.distance}km</p>
          </div>
          <div className="flex justify-between items-center text-white/20">
            <MessageSquare size={14} />
            <Heart size={14} />
          </div>
        </div>
      </div>
    </motion.div>
  );
};

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { BackgroundType } from '../store/backgroundStore';

interface BackgroundProps {
  type: BackgroundType;
}

// Pre-generierte Partikel-Positionen für bessere Performance
const generateParticleData = (count: number) => {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    top: Math.random() * 100,
    duration: Math.random() * 10 + 10,
    delay: Math.random() * 10,
  }));
};

const DEFAULT_PARTICLES = generateParticleData(15);
const COSMIC_STARS = generateParticleData(50);
const GEOMETRIC_SHAPES = generateParticleData(20);
const PARTICLE_COUNT = generateParticleData(100).map(particle => ({
  ...particle,
  xOffset: Math.random() * 100 - 50,
}));

export function BackgroundRenderer({ type }: BackgroundProps) {
  switch (type) {
    case 'minimal':
      return <MinimalBackground />;
    case 'cosmic':
      return <CosmicBackground />;
    case 'geometric':
      return <GeometricBackground />;
    case 'particles':
      return <ParticlesBackground />;
    case 'gradient':
      return <GradientBackground />;
    default:
      return <DefaultBackground />;
  }
}

function DefaultBackground() {
  return (
    <div className="fixed inset-0 overflow-hidden -z-10">
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900" />
      
      {/* Floating Orbs */}
      <motion.div 
        className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl"
        animate={{ 
          scale: [1, 1.2, 1],
          opacity: [0.4, 0.7, 0.4],
          x: [0, 50, 0],
          y: [0, -30, 0]
        }}
        transition={{ 
          duration: 12,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      
      <motion.div 
        className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-3xl"
        animate={{ 
          scale: [1.1, 1, 1.1],
          opacity: [0.5, 0.3, 0.5],
          x: [0, -40, 0],
          y: [0, 40, 0]
        }}
        transition={{ 
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 2
        }}
      />

      {/* Floating Particles */}
      {DEFAULT_PARTICLES.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute w-2 h-2 bg-blue-400/30 dark:bg-blue-300/30 rounded-full"
          style={{
            left: `${particle.left}%`,
            top: `${particle.top}%`,
          }}
          animate={{
            y: [0, -100, 0],
            opacity: [0, 1, 0],
            scale: [0, 1, 0]
          }}
          transition={{
            duration: particle.duration,
            repeat: Infinity,
            delay: particle.delay,
            ease: "easeInOut"
          }}
        />
      ))}
    </div>
  );
}

function MinimalBackground() {
  return (
    <div className="fixed inset-0 overflow-hidden -z-10">
      <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900" />
    </div>
  );
}

function CosmicBackground() {
  return (
    <div className="fixed inset-0 overflow-hidden -z-10">
      {/* Dark cosmic background */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-indigo-900 to-black" />
      
      {/* Stars */}
      {COSMIC_STARS.map((star) => (
        <motion.div
          key={star.id}
          className="absolute w-1 h-1 bg-white rounded-full"
          style={{
            left: `${star.left}%`,
            top: `${star.top}%`,
          }}
          animate={{
            opacity: [0, 1, 0],
            scale: [0, 1, 0]
          }}
          transition={{
            duration: star.duration,
            repeat: Infinity,
            delay: star.delay,
            ease: "easeInOut"
          }}
        />
      ))}

      {/* Nebula */}
      <motion.div 
        className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-br from-purple-500/30 to-pink-500/30 rounded-full blur-3xl"
        animate={{ 
          scale: [1, 1.3, 1],
          opacity: [0.3, 0.6, 0.3],
          rotate: [0, 180, 360]
        }}
        transition={{ 
          duration: 20,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
    </div>
  );
}

function GeometricBackground() {
  return (
    <div className="fixed inset-0 overflow-hidden -z-10">
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 to-cyan-50 dark:from-emerald-900 dark:to-cyan-900" />
      
      {/* Geometric shapes */}
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute border-2 border-emerald-400/20 dark:border-emerald-300/20"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            width: `${Math.random() * 100 + 50}px`,
            height: `${Math.random() * 100 + 50}px`,
            borderRadius: Math.random() > 0.5 ? '50%' : '0%'
          }}
          animate={{
            rotate: [0, 360],
            scale: [1, 1.2, 1]
          }}
          transition={{
            duration: Math.random() * 10 + 10,
            repeat: Infinity,
            ease: "linear"
          }}
        />
      ))}
    </div>
  );
}

function ParticlesBackground() {
  return (
    <div className="fixed inset-0 overflow-hidden -z-10">
      <div className="absolute inset-0 bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900 dark:to-red-900" />
      
      {/* Many particles */}
      {PARTICLE_COUNT.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute w-1 h-1 bg-orange-400/40 dark:bg-orange-300/40 rounded-full"
          style={{
            left: `${particle.left}%`,
            top: `${particle.top}%`,
          }}
          animate={{
            y: [0, -200, 0],
            x: [0, particle.xOffset, 0],
            opacity: [0, 1, 0],
            scale: [0, 1, 0]
          }}
          transition={{
            duration: particle.duration,
            repeat: Infinity,
            delay: particle.delay,
            ease: "easeInOut"
          }}
        />
      ))}
    </div>
  );
}

function GradientBackground() {
  return (
    <div className="fixed inset-0 overflow-hidden -z-10">
      <motion.div 
        className="absolute inset-0 bg-gradient-to-br from-pink-400 via-purple-500 to-indigo-600"
        animate={{
          background: [
            'linear-gradient(135deg, #f472b6, #a855f7, #4f46e5)',
            'linear-gradient(135deg, #ec4899, #8b5cf6, #6366f1)',
            'linear-gradient(135deg, #db2777, #7c3aed, #5b21b6)',
            'linear-gradient(135deg, #f472b6, #a855f7, #4f46e5)'
          ]
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent dark:from-black/20 dark:to-transparent" />
    </div>
  );
}

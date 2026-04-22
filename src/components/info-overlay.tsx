"use client";

import { useState } from 'react';
import Image from 'next/image';

export default function InfoOverlay() {
  const [isOpen, setIsOpen] = useState(false);

  const openOverlay = () => setIsOpen(true);
  const closeOverlay = () => setIsOpen(false);

  return (
    <>
      {/* Info Button - Desktop Only */}
      <button
        onClick={openOverlay}
        className="hidden md:block fixed bottom-6 right-6 z-50 p-3 hover:bg-white/20 transition-all duration-300 group"
        aria-label="About creator"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="info-icon"
        >
          <circle
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="2"
          />
          <path
            d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M12 17h.01"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-end"
          onClick={closeOverlay}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/20" />

          {/* Bottom Right Overlay Content */}
          <div
            className="relative bg-white/10 backdrop-blur-xl rounded-tl-2xl rounded-tr-2xl shadow-lg border border-white/20 p-3 w-full max-w-xs mr-3 mb-0 animate-in slide-in-from-bottom-4 duration-300"
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.15) 100%)',
              backdropFilter: 'blur(12px) saturate(120%)',
              WebkitBackdropFilter: 'blur(12px) saturate(120%)',
              boxShadow: '0 4px 16px 0 rgba(31, 38, 135, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.15)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={closeOverlay}
              className="absolute top-2 right-2 p-1.5 hover:bg-white/20 rounded-full transition-colors"
              aria-label="Close"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="text-gray-700 dark:text-gray-300"
              >
                <path
                  d="M18 6L6 18"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M6 6l12 12"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>

            {/* Navigation */}
            <div className="flex items-center justify-between border-b border-white/20 pb-2 mb-3">
              <div className="flex space-x-1">
                <button
                  className="px-2 py-1 text-xs transition-colors relative font-medium"
                  style={{ color: 'var(--foreground)' }}
                >
                  About
                  <div className="absolute -bottom-2 left-0 right-0 h-0.5" style={{ backgroundColor: 'var(--foreground)' }}></div>
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="overflow-hidden">
              {/* About Section */}
              <div className="space-y-3">
                  {/* Header with Photo */}
                  <div className="flex items-center space-x-2">
                    {/* Creator Photo */}
                    <div className="flex-shrink-0">
                      <div className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-white/40 shadow-md">
                        <Image
                          src="/Taizun.PNG"
                          alt="Taizun - Creator"
                          fill
                          className="object-cover"
                          priority
                        />
                      </div>
                    </div>

                    {/* Name and Title */}
                    <div className="flex-1">
                      <h3 className="text-sm font-bold mb-0.5" style={{ color: 'var(--foreground)' }}>Taizun</h3>
                      <p className="text-xs font-medium" style={{ color: 'var(--foreground)', opacity: 0.8 }}>AI Developer</p>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="space-y-1.5" style={{ color: 'var(--foreground)' }}>
                    <p className="text-xs leading-tight">
                      I'm a BTech CSE 2nd Year Student at Medicaps University, Indore.
                    </p>
                    <p className="text-xs leading-tight">
                      Founder of <a href="https://medinotes.in" target="_blank" rel="noopener noreferrer" className="font-medium hover:opacity-70 transition-opacity">MediNotes</a> - an online study platform for Medicaps University students providing notes, previous year question papers (PYQs), and study materials with instant AI tutoring support.
                    </p>
                    <p className="text-xs leading-tight">
                      Creator of this AI-powered code compiler and passionate about building innovative educational solutions.
                    </p>
                  </div>

                  {/* Social Links */}
                  <div className="flex items-center justify-center space-x-2 pt-2">
                    {/* LinkedIn */}
                    <a
                      href="https://www.linkedin.com/in/taizuns/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 hover:bg-white/20 rounded-full transition-colors group"
                      aria-label="LinkedIn Profile"
                    >
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        style={{ color: 'var(--foreground)' }}
                        className="group-hover:text-blue-600 transition-colors"
                      >
                        <path
                          d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <rect
                          x="2"
                          y="9"
                          width="4"
                          height="12"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <circle
                          cx="4"
                          cy="4"
                          r="2"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </a>

                    {/* GitHub */}
                    <a
                      href="https://github.com/t4zn/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 hover:bg-white/20 rounded-full transition-colors group"
                      aria-label="GitHub Profile"
                    >
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        style={{ color: 'var(--foreground)' }}
                        className="transition-colors"
                      >
                        <path
                          d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </a>

                    {/* Website */}
                    <a
                      href="https://t4z.in"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 hover:bg-white/20 rounded-full transition-colors group"
                      aria-label="Website"
                    >
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        style={{ color: 'var(--foreground)' }}
                        className="group-hover:text-blue-500 transition-colors"
                      >
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <line x1="2" y1="12" x2="22" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </a>

                    {/* Instagram */}
                    <a
                      href="https://instagram.com/t4zun"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 hover:bg-white/20 rounded-full transition-colors group"
                      aria-label="Instagram Profile"
                    >
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        style={{ color: 'var(--foreground)' }}
                        className="group-hover:text-pink-600 transition-colors"
                      >
                        <rect x="2" y="2" width="20" height="20" rx="5" ry="5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </a>

                  </div>
                </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

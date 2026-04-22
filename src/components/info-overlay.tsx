"use client";

import { useState } from 'react';
import Image from 'next/image';

export default function InfoOverlay() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('about');

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
                  onClick={() => setActiveSection('about')}
                  className={`px-2 py-1 text-xs transition-colors relative ${activeSection === 'about'
                    ? 'text-black dark:text-white font-medium'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                >
                  About
                  {activeSection === 'about' && (
                    <div className="absolute -bottom-2 left-0 right-0 h-0.5 bg-black dark:bg-white"></div>
                  )}
                </button>
                <button
                  onClick={() => setActiveSection('pricing')}
                  className={`px-2 py-1 text-xs transition-colors relative ${activeSection === 'pricing'
                    ? 'text-black dark:text-white font-medium'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                >
                  Pricing
                  {activeSection === 'pricing' && (
                    <div className="absolute -bottom-2 left-0 right-0 h-0.5 bg-black dark:bg-white"></div>
                  )}
                </button>
                <button
                  onClick={() => setActiveSection('contact')}
                  className={`px-2 py-1 text-xs transition-colors relative ${activeSection === 'contact'
                    ? 'text-black dark:text-white font-medium'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                >
                  Contact
                  {activeSection === 'contact' && (
                    <div className="absolute -bottom-2 left-0 right-0 h-0.5 bg-black dark:bg-white"></div>
                  )}
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="overflow-hidden">
              {/* About Section */}
              {activeSection === 'about' && (
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
                      <h3 className="text-sm font-bold text-gray-900 dark:text-gray-200 mb-0.5">Taizun</h3>
                      <p className="text-xs text-gray-800 dark:text-gray-400 font-medium">AI Developer</p>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="space-y-1.5 text-gray-900 dark:text-gray-300">
                    <p className="text-xs leading-tight">
                      I am a BTech CSE 2nd Year Student at Medicaps University, Indore.
                    </p>
                    <p className="text-xs leading-tight">
                      Creator of this AI platform and Founder of Drapels - a comprehensive AI learning ecosystem offering interactive tutorials, hands-on projects, and cutting-edge resources to empower the next generation of AI developers.
                    </p>
                    <p className="text-xs leading-tight">
                      Passionate about democratizing AI education and building innovative solutions.
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
                        className="text-gray-600 dark:text-white group-hover:text-blue-600 transition-colors"
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
                        className="text-gray-600 dark:text-white group-hover:text-gray-800 transition-colors"
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

                    {/* LeetCode */}
                    <a
                      href="https://leetcode.com/t4zn/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 hover:bg-white/20 rounded-full transition-colors group"
                      aria-label="LeetCode Profile"
                    >
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="text-gray-600 dark:text-white group-hover:text-orange-500 transition-colors"
                      >
                        <path
                          d="M22 14.355c0-.742-.564-1.346-1.26-1.346H10.676c-.696 0-1.26.604-1.26 1.346s.563 1.346 1.26 1.346H20.74c.696.001 1.26-.603 1.26-1.346z"
                          fill="currentColor"
                        />
                        <path
                          d="M3.482 18.187l4.313 4.361c.973.986 2.727.986 3.7 0l8.21-8.31c.472-.477.472-1.251 0-1.728-.473-.477-1.24-.477-1.713 0l-8.21 8.31c-.14.141-.369.141-.509 0L5.196 16.46c-.473-.477-1.24-.477-1.713 0-.473.476-.473 1.251-.001 1.727z"
                          fill="currentColor"
                        />
                        <path
                          d="M18.6 6.953c.473-.477.473-1.251 0-1.728L14.287.864c-.973-.986-2.727-.986-3.7 0l-8.21 8.31c-.472.477-.472 1.251 0 1.728.473.477 1.24.477 1.713 0l8.21-8.31c.14-.141.369-.141.509 0l4.313 4.361c.473.476 1.24.476 1.678.001z"
                          fill="currentColor"
                        />
                      </svg>
                    </a>

                    {/* Product Hunt */}
                    <a
                      href="https://www.producthunt.com/@taizun"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 hover:bg-white/20 rounded-full transition-colors group"
                      aria-label="Product Hunt Profile"
                    >
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="text-gray-600 dark:text-white group-hover:text-orange-600 transition-colors"
                      >
                        <circle cx="12" cy="12" r="12" fill="currentColor" />
                        <path
                          d="M9 8h4.5c1.38 0 2.5 1.12 2.5 2.5S14.88 13 13.5 13H11v3H9V8zm2 2v1.5h2.5c.28 0 .5-.22.5-.5s-.22-.5-.5-.5H11z"
                          fill="white"
                        />
                      </svg>
                    </a>

                  </div>
                </div>
              )}

              {/* Pricing Section */}
              {activeSection === 'pricing' && (
                <div className="space-y-3">
                  <div className="text-center">
                    <h3 className="text-sm font-bold text-gray-900 dark:text-gray-200 mb-2">AI Compiler Plans</h3>
                  </div>
                  <div className="space-y-1.5">
                    <div className="p-2 bg-white/10 rounded border border-white/20">
                      <div className="flex justify-between items-center mb-1">
                        <h4 className="text-xs font-semibold text-gray-900 dark:text-gray-200">Basic</h4>
                        <span className="text-xs font-bold text-gray-900 dark:text-gray-200">$9.99</span>
                      </div>
                      <div className="text-xs text-gray-800 dark:text-gray-300 space-y-0.5">
                        <div>100 AI code fixes</div>
                        <div>Basic error detection</div>
                        <div>5 languages supported</div>
                      </div>
                    </div>
                    <div className="p-2 bg-white/15 rounded border border-white/30">
                      <div className="flex justify-between items-center mb-1">
                        <h4 className="text-xs font-semibold text-gray-900 dark:text-gray-200">Pro</h4>
                        <span className="text-xs font-bold text-gray-900 dark:text-gray-200">$19.99</span>
                      </div>
                      <div className="text-xs text-gray-800 dark:text-gray-300 space-y-0.5">
                        <div>500 AI code fixes</div>
                        <div>Advanced error analysis</div>
                        <div>All languages supported</div>
                        <div>Code optimization tips</div>
                      </div>
                    </div>
                    <div className="p-2 bg-white/20 rounded border border-white/40">
                      <div className="flex justify-between items-center mb-1">
                        <h4 className="text-xs font-semibold text-gray-900 dark:text-gray-200">Enterprise</h4>
                        <span className="text-xs font-bold text-gray-900 dark:text-gray-200">$49.99</span>
                      </div>
                      <div className="text-xs text-gray-800 dark:text-gray-300 space-y-0.5">
                        <div>Unlimited AI fixes</div>
                        <div>Custom AI models</div>
                        <div>Priority support</div>
                        <div>Team collaboration</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Contact Section */}
              {activeSection === 'contact' && (
                <div className="space-y-3">
                  <div className="text-center">
                    <h3 className="text-sm font-bold text-gray-900 dark:text-gray-200 mb-2">Contact</h3>
                  </div>
                  <div className="space-y-2 text-gray-800 dark:text-gray-300">
                    <p className="text-xs text-center leading-tight">
                      Ready to upgrade? Contact me to purchase your premium subscription!
                    </p>

                    {/* Plan Selection */}
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-gray-800 dark:text-gray-300">Select Plan:</label>
                      <select
                        id="planSelect"
                        className="w-full text-xs p-1.5 bg-transparent border-none outline-none text-gray-900 dark:text-gray-200 focus:outline-none"
                        defaultValue="basic"
                      >
                        <option value="basic">Basic - $9.99 (100 AI fixes, 5 languages)</option>
                        <option value="pro">Pro - $19.99 (500 AI fixes, all languages)</option>
                        <option value="enterprise">Enterprise - $49.99 (unlimited fixes, custom AI)</option>
                      </select>
                    </div>

                    {/* Contact Button */}
                    <div className="pt-4 flex justify-center">
                      <button
                        onClick={() => {
                          const select = document.getElementById('planSelect') as HTMLSelectElement;
                          const selectedPlan = select.options[select.selectedIndex].text;
                          const subject = encodeURIComponent('Premium Subscription Purchase Request');
                          const body = encodeURIComponent(
                            `Hi Taizun,

I would like to purchase the following premium subscription:

${selectedPlan}

Please let me know the next steps for payment and activation.

Thank you!`
                          );
                          const mailtoUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=taizun8@gmail.com&su=${subject}&body=${body}`;
                          window.open(mailtoUrl, '_blank');
                        }}
                        className="bg-black dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-200 border border-black dark:border-white rounded-full px-4 py-1 text-xs font-medium text-white dark:text-black transition-colors flex items-center justify-center"
                      >
                        <span>Contact</span>
                      </button>
                    </div>

                    {/* Additional Contact Info */}
                    <div className="pt-2">
                      <p className="text-xs text-gray-800 dark:text-gray-300 text-center leading-tight">
                        You will receive a reply within 24 hours
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

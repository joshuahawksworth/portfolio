/**
 * Particle configuration for floating background effect
 */
export const PARTICLE_POSITIONS = [
  { left: 15, top: 20 },
  { left: 85, top: 15 },
  { left: 45, top: 60 },
  { left: 70, top: 80 },
  { left: 25, top: 40 },
  { left: 90, top: 50 },
  { left: 10, top: 70 },
  { left: 55, top: 25 },
  { left: 35, top: 85 },
  { left: 75, top: 35 },
  { left: 20, top: 90 },
  { left: 60, top: 10 },
  { left: 40, top: 55 },
  { left: 80, top: 70 },
  { left: 50, top: 45 }
];

/**
 * Calculate parallax offset based on mouse position
 * @param mouseX - Current mouse X position
 * @param mouseY - Current mouse Y position
 * @param speed - Multiplier for parallax effect intensity
 * @returns Object with x and y offset values
 */
export const calculateParallax = (
  mouseX: number,
  mouseY: number,
  speed: number
): { x: number; y: number } => {
  const centerX = window.innerWidth / 2;
  const centerY = window.innerHeight / 2;
  
  return {
    x: (mouseX - centerX) * speed,
    y: (mouseY - centerY) * speed
  };
};

/**
 * Check if device is desktop (for enabling mouse effects)
 * @returns Boolean indicating if viewport is desktop size
 */
export const isDesktop = (): boolean => {
  return window.matchMedia('(min-width: 1024px)').matches;
};

/**
 * Smooth scroll to element by ID
 * @param elementId - ID of target element
 */
export const smoothScrollToElement = (elementId: string): void => {
  const element = document.getElementById(elementId);
  if (element) {
    element.scrollIntoView({ behavior: 'smooth' });
  }
};
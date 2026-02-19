// IntraMap - Icon Library
// SVG icons for common places in indoor maps

const Icons = {
  // Restaurant/Food icon
  restaurant: `<svg viewBox="0 0 24 24" fill="currentColor">
    <path d="M11 9H9V2H7v7H5V2H3v7c0 2.12 1.66 3.84 3.75 3.97V22h2.5v-9.03C11.34 12.84 13 11.12 13 9V2h-2v7zm5-3v8h2.5v8H21V2c-2.76 0-5 2.24-5 4z"/>
  </svg>`,

  // Restroom icon - Simplified and cleaner
  restroom: `<svg viewBox="0 0 24 24" fill="currentColor">
    <path d="M5.5 2c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm1.5 18h-4V9h4v11zm8.5-18c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm2.5 18H14v-6h-2V8c0-.55.45-1 1-1h4c.55 0 1 .45 1 1v6h-2v6z"/>
  </svg>`,

  // Exit/Emergency icon - Professional exit sign with running person and arrow
  exit: `<svg viewBox="0 0 24 24" fill="currentColor">
    <path d="M14 2H2v20h12V2zm-4 17H4V5h6v14zm10 0.5l-2.5-2.5L20 14.5V11h-6V8.5l4.5 4.5L16 15.5l4 4z"/>
    <path d="M6 8h4v1.5H6V8zm0 2.5h4V12H6v-1.5zm0 2.5h4v1.5H6V13z"/>
  </svg>`,

  // Stairs icon - With actual stair steps (vertical and horizontal lines)
  stairs: `<svg viewBox="0 0 24 24" fill="currentColor">
    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-1 16h-3v-3h-3v-3h-3v-3H6V7h3v3h3v3h3v3h3v3z"/>
  </svg>`,

  // Elevator icon - Only up and down arrows, no plus
  elevator: `<svg viewBox="0 0 24 24" fill="currentColor">
    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14l-4-4h8l-4 4zm0-10l4 4H8l4-4z"/>
  </svg>`,

  // ATM icon
  atm: `<svg viewBox="0 0 24 24" fill="currentColor">
    <path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z"/>
    <circle cx="12" cy="12" r="2"/>
  </svg>`,

  // Parking icon
  parking: `<svg viewBox="0 0 24 24" fill="currentColor">
    <path d="M13 3H6v18h4v-6h3c3.31 0 6-2.69 6-6s-2.69-6-6-6zm.2 8H10V7h3.2c1.1 0 2 .9 2 2s-.9 2-2 2z"/>
  </svg>`,

  // Information icon
  info: `<svg viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
  </svg>`,

  // Shop/Store icon
  shop: `<svg viewBox="0 0 24 24" fill="currentColor">
    <path d="M20 4H4v2h16V4zm1 10v-2l-1-5H4l-1 5v2h1v6h10v-6h4v6h2v-6h1zm-9 4H6v-4h6v4z"/>
  </svg>`,

  // Cafe/Coffee icon
  cafe: `<svg viewBox="0 0 24 24" fill="currentColor">
    <path d="M20 3H4v10c0 2.21 1.79 4 4 4h6c2.21 0 4-1.79 4-4v-3h2c1.11 0 2-.89 2-2V5c0-1.11-.89-2-2-2zm0 5h-2V5h2v3zM2 21h18v-2H2v2z"/>
  </svg>`,

  // Medical/First Aid icon
  medical: `<svg viewBox="0 0 24 24" fill="currentColor">
    <path d="M19 3H5c-1.1 0-1.99.9-1.99 2L3 19c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-1 11h-4v4h-4v-4H6v-4h4V6h4v4h4v4z"/>
  </svg>`,

  // Security icon
  security: `<svg viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/>
  </svg>`,

  // Help/Customer Service icon
  help: `<svg viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z"/>
  </svg>`
};

// Icon metadata with categories and colors
const IconMetadata = {
  restaurant: { category: 'food', color: '#3B82F6', label: 'Restaurant' },
  cafe: { category: 'food', color: '#3B82F6', label: 'Cafe' },
  restroom: { category: 'restroom', color: '#10B981', label: 'Restroom' },
  exit: { category: 'exit', color: '#DC2626', label: 'Exit' },
  stairs: { category: 'navigation', color: '#6B7280', label: 'Stairs' },
  elevator: { category: 'navigation', color: '#6B7280', label: 'Elevator' },
  atm: { category: 'service', color: '#F59E0B', label: 'ATM' },
  parking: { category: 'service', color: '#6B7280', label: 'Parking' },
  info: { category: 'service', color: '#F59E0B', label: 'Information' },
  shop: { category: 'shop', color: '#6B7280', label: 'Shop' },
  medical: { category: 'service', color: '#EF4444', label: 'Medical' },
  security: { category: 'service', color: '#6B7280', label: 'Security' },
  help: { category: 'service', color: '#F59E0B', label: 'Help Desk' }
};

// Helper function to create icon element
function createIconElement(iconName, size = 24, color = null) {
  const container = document.createElement('div');
  container.innerHTML = Icons[iconName] || Icons.info;
  const svg = container.firstElementChild;
  
  svg.setAttribute('width', size);
  svg.setAttribute('height', size);
  
  if (color) {
    svg.style.color = color;
  } else if (IconMetadata[iconName]) {
    svg.style.color = IconMetadata[iconName].color;
  }
  
  return svg;
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { Icons, IconMetadata, createIconElement };
}

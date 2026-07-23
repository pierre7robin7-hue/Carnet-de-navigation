// Petite bibliothèque d'icônes SVG maison (style trait, cohérente avec le thème maritime).
function makeIcon(children) {
  return function IconCmp({ size = 20, className = '', strokeWidth = 1.8 }) {
    return (
      <svg
        width={size} height={size} viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"
        className={className}
      >
        {children}
      </svg>
    );
  };
}

const Icon = {
  Anchor: makeIcon(<>
    <circle cx="12" cy="5" r="2" />
    <line x1="12" y1="7" x2="12" y2="21" />
    <path d="M5 12h14" />
    <path d="M5 12c0 4.5 3 7.5 7 8.5" />
    <path d="M19 12c0 4.5-3 7.5-7 8.5" />
  </>),
  Compass: makeIcon(<>
    <circle cx="12" cy="12" r="9" />
    <path d="M15 9l-2 5-5 2 2-5z" />
  </>),
  Sailboat: makeIcon(<>
    <path d="M4 19h16" />
    <path d="M6 19l1.5-6h9L18 19" />
    <path d="M11 13V4c3 1 4.5 4.5 4.5 9" />
    <path d="M10 13V6c-2.2 1-3.4 3.8-3.6 7" />
  </>),
  Wind: makeIcon(<>
    <path d="M3 8h10a2.5 2.5 0 1 0-2.5-2.5" />
    <path d="M3 13h14a2.5 2.5 0 1 1-2.5 2.5" />
    <path d="M3 18h7a2 2 0 1 0-2-2" />
  </>),
  Waves: makeIcon(<>
    <path d="M2 8c1.5-2 3.5-2 5 0s3.5 2 5 0 3.5-2 5 0 3.5 2 5 0" />
    <path d="M2 14c1.5-2 3.5-2 5 0s3.5 2 5 0 3.5-2 5 0 3.5 2 5 0" />
    <path d="M2 20c1.5-2 3.5-2 5 0s3.5 2 5 0 3.5-2 5 0 3.5 2 5 0" />
  </>),
  Map: makeIcon(<>
    <path d="M9 4L3 6v14l6-2 6 2 6-2V4l-6 2-6-2z" />
    <path d="M9 4v14" />
    <path d="M15 6v14" />
  </>),
  MapPin: makeIcon(<>
    <path d="M12 21s7-6.5 7-12a7 7 0 1 0-14 0c0 5.5 7 12 7 12z" />
    <circle cx="12" cy="9" r="2.5" />
  </>),
  Home: makeIcon(<>
    <path d="M4 11.5L12 4l8 7.5" />
    <path d="M6 10v10h12V10" />
    <path d="M10 20v-6h4v6" />
  </>),
  List: makeIcon(<>
    <line x1="9" y1="6" x2="21" y2="6" />
    <line x1="9" y1="12" x2="21" y2="12" />
    <line x1="9" y1="18" x2="21" y2="18" />
    <circle cx="4.5" cy="6" r="1" fill="currentColor" stroke="none" />
    <circle cx="4.5" cy="12" r="1" fill="currentColor" stroke="none" />
    <circle cx="4.5" cy="18" r="1" fill="currentColor" stroke="none" />
  </>),
  Plus: makeIcon(<>
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </>),
  Pencil: makeIcon(<>
    <path d="M4 20l1-4.2L15.5 5.3a1.5 1.5 0 0 1 2.1 0l1.1 1.1a1.5 1.5 0 0 1 0 2.1L8.2 19 4 20z" />
    <line x1="14" y1="6.8" x2="17.2" y2="10" />
  </>),
  Trash: makeIcon(<>
    <line x1="4" y1="7" x2="20" y2="7" />
    <path d="M6 7l1 13h10l1-13" />
    <path d="M9 7V4h6v3" />
    <line x1="10" y1="11" x2="10" y2="17" />
    <line x1="14" y1="11" x2="14" y2="17" />
  </>),
  Calendar: makeIcon(<>
    <rect x="3.5" y="5" width="17" height="16" rx="2" />
    <line x1="3.5" y1="10" x2="20.5" y2="10" />
    <line x1="8" y1="3" x2="8" y2="7" />
    <line x1="16" y1="3" x2="16" y2="7" />
  </>),
  Clock: makeIcon(<>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3.5 2" />
  </>),
  Users: makeIcon(<>
    <circle cx="9" cy="8" r="3" />
    <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" />
    <circle cx="17.5" cy="9" r="2.3" />
    <path d="M15.5 14c2.9.3 5 2.7 5 6" />
  </>),
  ChevronLeft: makeIcon(<polyline points="15 18 9 12 15 6" />),
  ChevronRight: makeIcon(<polyline points="9 18 15 12 9 6" />),
  X: makeIcon(<>
    <line x1="6" y1="6" x2="18" y2="18" />
    <line x1="18" y1="6" x2="6" y2="18" />
  </>),
  Filter: makeIcon(<path d="M4 5h16l-6 8v6l-4-2v-4z" />),
  Route: makeIcon(<>
    <circle cx="5" cy="18" r="2.3" />
    <circle cx="19" cy="6" r="2.3" />
    <path d="M7 18h6a4 4 0 0 0 4-4V9a4 4 0 0 1 2-3.5" />
  </>),
  Gauge: makeIcon(<>
    <circle cx="12" cy="13" r="8" />
    <path d="M12 13l3.5-3.5" />
    <path d="M8 4.5A8 8 0 0 1 16 4.5" strokeDasharray="0" />
  </>),
  BarChart: makeIcon(<>
    <line x1="4" y1="20" x2="20" y2="20" />
    <rect x="6" y="12" width="3" height="8" />
    <rect x="11" y="7" width="3" height="13" />
    <rect x="16" y="15" width="3" height="5" />
  </>),
  Notebook: makeIcon(<>
    <rect x="5" y="3" width="15" height="18" rx="2" />
    <line x1="9" y1="3" x2="9" y2="21" />
    <line x1="2" y1="7" x2="5" y2="7" />
    <line x1="2" y1="12" x2="5" y2="12" />
    <line x1="2" y1="17" x2="5" y2="17" />
  </>),
  ArrowLeft: makeIcon(<>
    <line x1="19" y1="12" x2="5" y2="12" />
    <polyline points="11 6 5 12 11 18" />
  </>),
  Download: makeIcon(<>
    <path d="M12 3v13" />
    <polyline points="6 11 12 17 18 11" />
    <line x1="4" y1="21" x2="20" y2="21" />
  </>),
  Upload: makeIcon(<>
    <path d="M12 20V7" />
    <polyline points="6 12 12 6 18 12" />
    <line x1="4" y1="21" x2="20" y2="21" />
  </>),
  Printer: makeIcon(<>
    <path d="M6 9V4h12v5" />
    <rect x="4" y="9" width="16" height="8" rx="1.5" />
    <path d="M6 14h12v7H6z" />
  </>),
  Sun: makeIcon(<>
    <circle cx="12" cy="12" r="4.5" />
    <line x1="12" y1="2.5" x2="12" y2="5" />
    <line x1="12" y1="19" x2="12" y2="21.5" />
    <line x1="4.2" y1="4.2" x2="6" y2="6" />
    <line x1="18" y1="18" x2="19.8" y2="19.8" />
    <line x1="2.5" y1="12" x2="5" y2="12" />
    <line x1="19" y1="12" x2="21.5" y2="12" />
    <line x1="4.2" y1="19.8" x2="6" y2="18" />
    <line x1="18" y1="6" x2="19.8" y2="4.2" />
  </>),
  Moon: makeIcon(<path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5z" />),
  Camera: makeIcon(<>
    <path d="M4 8h3l1.5-2.5h7L17 8h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z" />
    <circle cx="12" cy="14" r="3.5" />
  </>),
  CloudOff: makeIcon(<>
    <path d="M3 3l18 18" />
    <path d="M9.5 6.2A5 5 0 0 1 19 8a4 4 0 0 1-.5 8H8" />
    <path d="M5.6 8.6A4 4 0 0 0 6 16.5" />
  </>),
  CloudCheck: makeIcon(<>
    <path d="M6.5 17a4 4 0 0 1 .3-8 5 5 0 0 1 9.7-1.5A4 4 0 0 1 18.5 15" />
    <path d="M9.5 15l1.8 1.8L15 13.2" />
  </>),
};

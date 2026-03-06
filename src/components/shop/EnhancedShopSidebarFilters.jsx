import React, { useMemo, useState } from 'react';
import { useGetFieldValuesQuery } from '@/redux/api/apiSlice';

/* Enhanced filter configuration with accordion support */
const FIELD_FILTERS = [
  { key: 'category', label: 'CATEGORIES', searchable: false, limit: 8, defaultOpen: true },
  { key: 'color', label: 'COLOR', searchable: true, limit: 12, defaultOpen: true }, // Increased limit for colors
  { key: 'content', label: 'CONTENT', searchable: true, limit: 8, defaultOpen: false },
  { key: 'design', label: 'DESIGN', searchable: true, limit: 8, defaultOpen: false },
  { key: 'structure', label: 'STRUCTURE', searchable: true, limit: 8, defaultOpen: false },
  { key: 'finish', label: 'FINISH', searchable: true, limit: 8, defaultOpen: false },
  { key: 'motif', label: 'MOTIF', searchable: true, limit: 8, defaultOpen: false },
];

export const FIELD_FILTERS_MAP = Object.fromEntries(FIELD_FILTERS.map((f) => [f.key, f]));

const UI = {
  pink: 'var(--tp-theme-primary)',
  text: 'var(--tp-text-1)',
  muted: 'var(--tp-text-2)',
  border: 'var(--tp-grey-2)',
  bg: 'var(--tp-common-white)',
  lightBg: 'var(--tp-grey-1)',
};

const COLOR_MAP = {
  Red: '#ff0000',
  Blue: '#0074d9',
  Green: '#2ecc40',
  Yellow: '#ffdc00',
  Black: '#111111',
  White: '#ffffff',
  Grey: '#808080',
  Gray: '#808080',
  Brown: '#a52a2a',
  Orange: '#ff851b',
  Purple: '#b10dc9',
  Pink: '#ff69b4',
  Maroon: '#800000',
  Navy: '#001f3f',
  Teal: '#39cccc',
  Beige: '#f5f5dc',
  Olive: '#808000',
  Cream: '#fffdd0',
  Charcoal: '#36454f',
};

// Function to get hex color for a color name
function getColorHex(colorName) {
  // First check if it's a direct match in COLOR_MAP
  if (COLOR_MAP[colorName]) {
    return COLOR_MAP[colorName];
  }
  
  // Check case-insensitive match
  const lowerName = colorName.toLowerCase();
  for (const [key, value] of Object.entries(COLOR_MAP)) {
    if (key.toLowerCase() === lowerName) {
      return value;
    }
  }
  
  // Enhanced color mapping for common fabric colors
  const fabricColorMap = {
    'lemon yellow': '#FFFACD',
    'lemon': '#FFFACD',
    'bold teal': '#008B8B',
    'bottle green': '#006A4E',
    'bright orange': '#FF8C00',
    'butter yellow': '#FFDB58',
    'camel': '#C19A6B',
    'caramel': '#AF6F09',
    'chocolate brown': '#7B3F00',
    'forest green': '#228B22',
    'royal blue': '#4169E1',
    'navy blue': '#000080',
    'sky blue': '#87CEEB',
    'mint green': '#98FB98',
    'coral': '#FF7F50',
    'salmon': '#FA8072',
    'lavender': '#E6E6FA',
    'peach': '#FFCBA4',
    'ivory': '#FFFFF0',
    'khaki': '#F0E68C',
    'burgundy': '#800020',
    'wine': '#722F37',
    'mustard': '#FFDB58',
    'rust': '#B7410E',
    'sage': '#9CAF88',
    'slate': '#708090',
    'charcoal': '#36454F',
    'steel': '#4682B4',
    'copper': '#B87333',
    'bronze': '#CD7F32',
    'gold': '#FFD700',
    'silver': '#C0C0C0',
    'rose': '#FF66CC',
    'blush': '#DE5D83',
    'mauve': '#E0B0FF',
    'plum': '#8E4585',
    'emerald': '#50C878',
    'jade': '#00A86B',
    'turquoise': '#40E0D0',
    'aqua': '#00FFFF',
    'lime': '#00FF00',
    'olive': '#808000',
    'tan': '#D2B48C',
    'sand': '#C2B280',
    'stone': '#928E85',
    'ash': '#B2BEB5',
  };
  
  // Check fabric color map
  if (fabricColorMap[lowerName]) {
    return fabricColorMap[lowerName];
  }
  
  // Check if color name contains keywords
  for (const [keyword, hex] of Object.entries(fabricColorMap)) {
    if (lowerName.includes(keyword) || keyword.includes(lowerName)) {
      return hex;
    }
  }
  
  // Default fallback
  return '#C9C9CF';
}

function normalizeOptions(rawValues) {
  const arr = Array.isArray(rawValues) ? rawValues : [];
  return arr
    .map((v) => {
      if (v == null) return null;
      if (typeof v === 'string' || typeof v === 'number') return { value: String(v), count: null, hex: null };
      if (typeof v === 'object') {
        const value = v.value ?? v.name ?? v.label ?? '';
        const count = typeof v.count === 'number' ? v.count : typeof v.total === 'number' ? v.total : null;
        const hex = v.hex || null; // Extract hex value from API response
        if (!value) return null;
        return { value: String(value), count, hex };
      }
      return null;
    })
    .filter(Boolean);
}

function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M10.5 18.5a8 8 0 1 1 0-16 8 8 0 0 1 0 16Z" stroke="currentColor" strokeWidth="2" />
      <path d="M16.5 16.5 21 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function ChevronIcon({ isOpen }) {
  return (
    <svg 
      width="16" 
      height="16" 
      viewBox="0 0 24 24" 
      fill="none" 
      style={{ 
        transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
        transition: 'transform 0.2s ease'
      }}
    >
      <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export default function EnhancedShopSidebarFilters({ onFilterChange, selected = {}, onResetAll, eCatalogueProducts = [] }) {
  const [openSearch, setOpenSearch] = useState({});
  const [query, setQuery] = useState({});
  const [showAll, setShowAll] = useState({});
  
  // Initialize accordion state with default open sections
  const [accordionState, setAccordionState] = useState(() => {
    const initial = {};
    FIELD_FILTERS.forEach(filter => {
      initial[filter.key] = filter.defaultOpen || false;
    });
    return initial;
  });

  // 🎯 Extract field values from eCatalogue products
  const eCatalogueFieldValues = useMemo(() => {
    if (!Array.isArray(eCatalogueProducts) || eCatalogueProducts.length === 0) {
      return {};
    }

    const fieldValues = {};
    
    FIELD_FILTERS.forEach(filter => {
      const fieldKey = filter.key;
      const values = new Map(); // Use Map to count occurrences
      
      eCatalogueProducts.forEach(product => {
        let fieldValue = product[fieldKey];
        
        // Handle array values (like tags)
        if (Array.isArray(fieldValue)) {
          fieldValue.forEach(val => {
            if (val && String(val).trim()) {
              const normalizedVal = String(val).trim();
              values.set(normalizedVal, (values.get(normalizedVal) || 0) + 1);
            }
          });
        } else if (fieldValue && String(fieldValue).trim()) {
          const normalizedVal = String(fieldValue).trim();
          values.set(normalizedVal, (values.get(normalizedVal) || 0) + 1);
        }
      });
      
      // Convert Map to array of objects with count
      fieldValues[fieldKey] = Array.from(values.entries()).map(([value, count]) => ({
        value,
        count
      })).sort((a, b) => b.count - a.count); // Sort by count descending
    });
    
    return fieldValues;
  }, [eCatalogueProducts]);

  const totalActive = Object.values(selected).reduce(
    (sum, v) => sum + (Array.isArray(v) ? v.length : 0),
    0
  );

  const toggleAccordion = (filterKey) => {
    setAccordionState(prev => ({
      ...prev,
      [filterKey]: !prev[filterKey]
    }));
  };

  const toggleValue = (filterKey, value) => {
    const current = Array.isArray(selected?.[filterKey]) ? selected[filterKey] : [];
    const nextArr = [...current];
    const val = String(value);
    const idx = nextArr.indexOf(val);

    if (idx >= 0) nextArr.splice(idx, 1);
    else nextArr.push(val);

    const nextSelected = { ...selected };
    if (nextArr.length) nextSelected[filterKey] = nextArr;
    else delete nextSelected[filterKey];

    onFilterChange?.(nextSelected);
  };

  const clearAll = () => {
    if (typeof onResetAll === 'function') onResetAll();   // ✅ resets price too
    else onFilterChange?.({});
  };

  return (
    <aside className="myntraSidebar">
      <div className="mHeader">
        <div className="mHeaderLeft">
          <div className="mHeaderTitle">FILTERS</div>
          {totalActive > 0 && <span className="mBadge">{totalActive}</span>}
        </div>

        {totalActive > 0 && (
          <button className="mClearAll" onClick={clearAll} type="button">
            CLEAR ALL
          </button>
        )}
      </div>

      <div className="mSections">
        {FIELD_FILTERS.map((f) => {
          const isOpen = accordionState[f.key];
          const activeCount = Array.isArray(selected?.[f.key]) ? selected[f.key].length : 0;
          
          return (
            <FilterSection
              key={f.key}
              filter={f}
              selectedValues={selected?.[f.key] || []}
              openSearch={!!openSearch[f.key]}
              query={query[f.key] || ''}
              showAll={!!showAll[f.key]}
              isAccordionOpen={isOpen}
              activeCount={activeCount}
              onToggleAccordion={() => toggleAccordion(f.key)}
              setOpenSearch={(v) => setOpenSearch((p) => ({ ...p, [f.key]: v }))}
              setQuery={(v) => setQuery((p) => ({ ...p, [f.key]: v }))}
              setShowAll={(v) => setShowAll((p) => ({ ...p, [f.key]: v }))}
              onToggleValue={(val) => toggleValue(f.key, val)}
              eCatalogueFieldValues={eCatalogueFieldValues} // 🎯 Pass eCatalogue data
            />
          );
        })}
      </div>

      <style jsx global>{`
        .myntraSidebar {
          width: 100%;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          font-family: var(--tp-ff-roboto);
          box-shadow: 0 2px 12px rgba(0,0,0,0.04);
          overflow: hidden;
        }

        .mHeader {
          padding: 18px 20px;
          border-bottom: 1px solid #f1f5f9;
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: #fafbfc;
          position: sticky;
          top: 0;
          z-index: 5;
        }

        .mHeaderLeft {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .mHeaderTitle {
          font-size: 15px;
          font-weight: 700;
          letter-spacing: 0.5px;
          color: #1e293b;
        }

        .mBadge {
          background: #2c4c97;
          color: white;
          font-size: 11px;
          font-weight: 600;
          padding: 3px 8px;
          border-radius: 12px;
          line-height: 16px;
          min-width: 22px;
          text-align: center;
        }

        .mClearAll {
          border: none;
          background: #2c4c97;
          color: white;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          letter-spacing: 0.3px;
          padding: 6px 12px;
          border-radius: 8px;
          transition: background-color 0.2s ease;
        }

        .mClearAll:hover {
          background: #1e3a8a;
        }

        .mSection {
          border-bottom: 1px solid #f1f5f9;
        }

        .mSection:last-child {
          border-bottom: none;
        }

        .mSectionHead {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 20px;
          cursor: pointer;
          user-select: none;
          transition: background-color 0.2s ease;
        }

        .mSectionHead:hover {
          background: #f8fafc;
        }

        .mSectionHeadLeft {
          display: flex;
          align-items: center;
          gap: 10px;
          flex: 1;
        }

        .mSectionTitle {
          font-size: 13px;
          font-weight: 600;
          letter-spacing: 0.4px;
          color: #374151;
          text-transform: uppercase;
        }

        .mSectionBadge {
          background: #10b981;
          color: white;
          font-size: 10px;
          font-weight: 600;
          padding: 2px 6px;
          border-radius: 10px;
          line-height: 14px;
          min-width: 18px;
          text-align: center;
        }

        .mSectionActions {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .mSearchBtn {
          border: none;
          background: #f1f5f9;
          padding: 6px;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
          color: #64748b;
          transition: all 0.2s ease;
        }

        .mSearchBtn:hover {
          background: #2c4c97;
          color: white;
        }

        .mAccordionToggle {
          border: none;
          background: #f1f5f9;
          padding: 4px;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          color: #64748b;
          transition: all 0.2s ease;
          border-radius: 6px;
        }

        .mAccordionToggle:hover {
          background: #2c4c97;
          color: white;
        }

        .mSectionContent {
          overflow: hidden;
          transition: all 0.3s ease;
        }

        .mSectionContent.closed {
          max-height: 0;
          opacity: 0;
        }

        .mSectionContent.open {
          max-height: 400px;
          opacity: 1;
        }

        .mSectionInner {
          padding: 0 20px 16px;
          max-height: 350px;
          overflow-y: auto;
          overflow-x: hidden;
        }

        /* Clean scrollbar */
        .mSectionInner::-webkit-scrollbar {
          width: 6px;
        }

        .mSectionInner::-webkit-scrollbar-track {
          background: #f8fafc;
          border-radius: 3px;
        }

        .mSectionInner::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 3px;
        }

        .mSectionInner::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }

        .mSearchRow {
          margin: 0 0 16px;
        }

        .mSearchInput {
          width: 100%;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 10px 12px;
          font-size: 13px;
          outline: none;
          color: #374151;
          background: #ffffff;
          transition: border-color 0.2s ease;
        }
        
        .mSearchInput:focus{
          border-color: #2c4c97;
          box-shadow: 0 0 0 3px rgba(44, 76, 151, 0.1);
        }

        .mSearchInput::placeholder {
          color: #9ca3af;
        }

        .mList {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .mItem {
          display: flex;
          align-items: center;
          gap: 12px;
          cursor: pointer;
          user-select: none;
          color: #374151;
          font-size: 14px;
          line-height: 20px;
          padding: 6px 8px;
          transition: all 0.2s ease;
          border-radius: 6px;
        }

        .mItem:hover {
          color: #2c4c97;
          background: #f8fafc;
        }

        .mItem input {
          position: absolute;
          opacity: 0;
          pointer-events: none;
        }

        .mCheck {
          width: 18px;
          height: 18px;
          border: 2px solid #d1d5db;
          border-radius: 4px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          flex: 0 0 18px;
          background: white;
          transition: all 0.2s ease;
        }

        .mItem input:checked + .mCheck {
          border-color: #2c4c97;
          background: #2c4c97;
        }

        .mItem input:checked + .mCheck:after {
          content: "✓";
          color: white;
          font-size: 12px;
          line-height: 12px;
          font-weight: 700;
        }

        .mDot {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          border: 2px solid #e5e7eb;
          flex: 0 0 16px;
          transition: transform 0.2s ease;
        }

        .mItem:hover .mDot {
          transform: scale(1.1);
        }

        .mText {
          flex: 1;
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          font-weight: 500;
        }

        .mCount {
          color: #6b7280;
          font-size: 12px;
          flex: 0 0 auto;
          font-weight: 500;
          background: #f3f4f6;
          padding: 2px 6px;
          border-radius: 6px;
        }

        .mMore {
          margin-top: 12px;
          color: #2c4c97;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          display: inline-block;
          padding: 6px 12px;
          border-radius: 6px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          transition: all 0.2s ease;
        }

        .mMore:hover {
          background: #2c4c97;
          color: white;
          border-color: #2c4c97;
        }

        .mState {
          color: #6b7280;
          font-size: 13px;
          padding: 12px 0;
          text-align: center;
          font-style: italic;
        }

        /* Responsive */
        @media (min-width: 1200px) {
          .mList {
            gap: 8px;
          }
          
          .mItem {
            font-size: 13px;
            line-height: 18px;
            padding: 4px 6px;
          }
          
          .mSectionInner {
            padding: 0 18px 14px;
          }

          .mHeader {
            padding: 16px 18px;
          }

          .mSectionHead {
            padding: 14px 18px;
          }
        }
      `}</style>
    </aside>
  );
}

function FilterSection({
  filter,
  selectedValues,
  openSearch,
  query,
  showAll,
  isAccordionOpen,
  activeCount,
  onToggleAccordion,
  setOpenSearch,
  setQuery,
  setShowAll,
  onToggleValue,
  eCatalogueFieldValues, // 🎯 New prop for eCatalogue field values
}) {
  // 🎯 Use eCatalogue field values if available, otherwise fall back to API
  const shouldUseECatalogueData = eCatalogueFieldValues && eCatalogueFieldValues[filter.key];
  
  const { data, isLoading, error } = useGetFieldValuesQuery(filter.key, {
    skip: shouldUseECatalogueData, // Skip API call if we have eCatalogue data
  });

  const options = useMemo(() => {
    let rawValues;
    
    if (shouldUseECatalogueData) {
      // 🎯 Use eCatalogue filtered data
      rawValues = eCatalogueFieldValues[filter.key];
      } else {
      // Fall back to API data
      rawValues = data?.values || [];
      }
    
    const norm = normalizeOptions(rawValues);
    
    if (!query?.trim()) return norm;
    const q = query.trim().toLowerCase();
    return norm.filter((o) => o.value.toLowerCase().includes(q));
  }, [data, query, shouldUseECatalogueData, eCatalogueFieldValues, filter.key]);

  const limited = useMemo(() => {
    const lim = filter.limit ?? 8;
    return showAll ? options : options.slice(0, lim);
  }, [options, showAll, filter.limit]);

  const remaining = Math.max(0, options.length - limited.length);

  return (
    <section className="mSection">
      <div className="mSectionHead" onClick={onToggleAccordion}>
        <div className="mSectionHeadLeft">
          <div className="mSectionTitle">{filter.label}</div>
          {activeCount > 0 && <span className="mSectionBadge">{activeCount}</span>}
        </div>

        <div className="mSectionActions">
          {filter.searchable && (
            <button
              type="button"
              className="mSearchBtn"
              onClick={(e) => {
                e.stopPropagation();
                setOpenSearch(!openSearch);
              }}
              aria-label="Search filter options"
              title="Search"
            >
              <SearchIcon />
            </button>
          )}
          
          <button
            type="button"
            className="mAccordionToggle"
            aria-label={isAccordionOpen ? 'Collapse section' : 'Expand section'}
          >
            <ChevronIcon isOpen={isAccordionOpen} />
          </button>
        </div>
      </div>

      <div className={`mSectionContent ${isAccordionOpen ? 'open' : 'closed'}`}>
        <div className="mSectionInner">
          {filter.searchable && openSearch && (
            <div className="mSearchRow">
              <input
                className="mSearchInput"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={`Search ${filter.label.toLowerCase()}...`}
              />
            </div>
          )}

          {!shouldUseECatalogueData && isLoading && <div className="mState">Loading...</div>}
          {!shouldUseECatalogueData && error && <div className="mState">Failed to load</div>}
          {shouldUseECatalogueData && (!eCatalogueFieldValues[filter.key] || eCatalogueFieldValues[filter.key].length === 0) && (
            <div className="mState">No eCatalogue options available</div>
          )}

          {((shouldUseECatalogueData && eCatalogueFieldValues[filter.key]?.length > 0) || (!shouldUseECatalogueData && !isLoading && !error)) && (
            <>
              <div className="mList">
                {limited.map((opt) => {
                  const val = opt.value;
                  const checked = Array.isArray(selectedValues) && selectedValues.includes(String(val));

                  const isColor = filter.key === 'color';
                  // Use enhanced color mapping function
                  const dotColor = isColor ? getColorHex(val) : '#c9c9cf';
                  const needsWhiteBorder = String(val).toLowerCase().includes('white') || 
                                         dotColor.toLowerCase() === '#ffffff' ||
                                         dotColor.toLowerCase() === '#fffff0' ||
                                         dotColor.toLowerCase() === '#fffacd';

                  return (
                    <label key={val} className="mItem" title={val}>
                      <input type="checkbox" checked={checked} onChange={() => onToggleValue(val)} />
                      <span className="mCheck" aria-hidden="true" />

                      {isColor && (
                        <span
                          className="mDot"
                          style={{
                            background: dotColor,
                            borderColor: needsWhiteBorder ? '#bfc0c6' : dotColor,
                          }}
                          aria-hidden="true"
                        />
                      )}

                      <span className="mText">{val}</span>

                      {typeof opt.count === 'number' && <span className="mCount">({opt.count})</span>}
                    </label>
                  );
                })}
              </div>

              {remaining > 0 && (
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '12px' }}>
                  <span className="mMore" onClick={() => setShowAll(true)}>
                    + {remaining} more
                  </span>
                  {filter.searchable && (
                    <span 
                      className="mMore" 
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenSearch(true);
                      }}
                      style={{ fontSize: '12px', opacity: 0.7 }}
                    >
                      or search
                    </span>
                  )}
                </div>
              )}

              {showAll && options.length > (filter.limit ?? 8) && (
                <span className="mMore" onClick={() => setShowAll(false)} style={{ marginTop: '12px', display: 'block' }}>
                  Show less
                </span>
              )}
            </>
          )}
        </div>
      </div>
    </section>
  );
}

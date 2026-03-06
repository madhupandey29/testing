'use client';
import React, { useState, useRef, useEffect } from "react";
import menu_data from "@/data/menu-data";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { 
  FaIndustry, 
  FaCogs, 
  FaTools, 
  FaFlask, 
  FaAward, 
  FaChevronDown,
  FaRocket 
} from 'react-icons/fa';

const Menus = () => {
  const router = useRouter();
  const [openMegaMenu, setOpenMegaMenu] = useState(null);
  const menuTimeoutRef = useRef(null);

  // Function to get icon component by name
  const getIconComponent = (iconName) => {
    const icons = {
      FaIndustry,
      FaCogs,
      FaTools,
      FaFlask,
      FaAward
    };
    return icons[iconName] || FaIndustry;
  };

  // Function to handle mega menu close
  const handleMenuClose = () => {
    setOpenMegaMenu(null);
  };

  // Function to handle capability link click
  const handleCapabilityClick = (link, e) => {
    e.preventDefault();
    e.stopPropagation();

    // FORCE CLOSE MENU - Multiple methods to ensure it closes
    setOpenMegaMenu(null);
    
    // Clear any timeouts
    if (menuTimeoutRef.current) {
      clearTimeout(menuTimeoutRef.current);
      menuTimeoutRef.current = null;
    }
    
    // Remove all possible classes that keep menu open
    const megaMenuElement = e.target.closest('.has-mega-menu');
    if (megaMenuElement) {
      megaMenuElement.classList.remove('menu-open', 'hover');
      megaMenuElement.style.pointerEvents = 'none'; // Temporarily disable hover
      
      // Re-enable hover after a short delay
      setTimeout(() => {
        megaMenuElement.style.pointerEvents = '';
      }, 500);
    }
    
    // Force hide the dropdown with direct CSS
    const megaMenuDropdown = document.querySelector('.capabilities-mega-grid-compact.show');
    if (megaMenuDropdown) {
      megaMenuDropdown.classList.remove('show');
      megaMenuDropdown.style.opacity = '0';
      megaMenuDropdown.style.visibility = 'hidden';
      megaMenuDropdown.style.pointerEvents = 'none';
    }
    
    // Also try to find and hide any visible mega menu
    const allMegaMenus = document.querySelectorAll('.capabilities-mega-grid-compact');
    allMegaMenus.forEach(menu => {
      menu.classList.remove('show');
      menu.style.opacity = '0';
      menu.style.visibility = 'hidden';
      menu.style.pointerEvents = 'none';
    });

    // Navigate after ensuring menu is closed
    setTimeout(() => {
            
      if (link.includes('#')) {
        const [, hash] = link.split('#');
        const currentPath = window.location.pathname;
        
        if (currentPath === '/capabilities') {
          // Update URL with hash
          const newUrl = `/capabilities#${hash}`;
          window.history.pushState(null, '', newUrl);
          
          // Trigger hashchange event
          const hashChangeEvent = new Event('hashchange');
          window.dispatchEvent(hashChangeEvent);
          
          // Scroll to section
          setTimeout(() => {
            const element = document.getElementById(hash);
            if (element) {
              const headerOffset = 120;
              const elementPosition = element.offsetTop;
              const offsetPosition = elementPosition - headerOffset;
              
              window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
              });
            }
          }, 100);
        } else {
          router.push(link);
        }
      } else {
        router.push(link);
      }
    }, 100); // Increased delay to ensure menu closes
  };

  // Handle regular menu item clicks
  const handleRegularClick = () => {
    handleMenuClose();
    // Let the default Link behavior handle navigation
  };

  // Handle mouse enter for megamenu
  const handleMouseEnter = (menuId) => {
    if (menuTimeoutRef.current) {
      clearTimeout(menuTimeoutRef.current);
    }
    setOpenMegaMenu(menuId);
  };

  // Handle mouse leave for megamenu
  const handleMouseLeave = (e) => {
    // Don't close immediately if user is clicking
    if (e.relatedTarget && e.relatedTarget.nodeType === Node.ELEMENT_NODE && e.currentTarget.contains(e.relatedTarget)) {
      return;
    }
    
    menuTimeoutRef.current = setTimeout(() => {
      setOpenMegaMenu(null);
    }, 300);
  };

  // Handle click outside to close megamenu
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.has-mega-menu')) {
        setOpenMegaMenu(null);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  // Close menu when route changes
  useEffect(() => {
    const handleRouteChange = () => {
      setOpenMegaMenu(null);
    };

    // Listen for route changes
    window.addEventListener('beforeunload', handleRouteChange);
    
    return () => {
      window.removeEventListener('beforeunload', handleRouteChange);
    };
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (menuTimeoutRef.current) {
        clearTimeout(menuTimeoutRef.current);
      }
    };
  }, []);

  return (
    <ul>
      {menu_data.map((menu) =>
        menu.homes ? (
          <li key={menu.id} className="has-dropdown has-mega-menu">
            <Link href={menu.link}>{menu.title}</Link>
            <div className="home-menu tp-submenu tp-mega-menu">
              <div className="row row-cols-1 row-cols-lg-4 row-cols-xl-4">
                {menu.home_pages.map((home, i) => (
                  <div key={i} className="col">
                    <div className="home-menu-item">
                      <Link href={home.link}>
                        <div className="home-menu-thumb p-relative fix">
                          <Image src={home.img} alt="home img" />
                        </div>
                        <div className="home-menu-content">
                          <h5 className="home-menu-title">{home.title}</h5>
                        </div>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </li>
        ) : menu.capabilities ? (
          <li 
            key={menu.id} 
            className={`has-dropdown has-mega-menu ${openMegaMenu === menu.id ? 'menu-open' : ''}`}
            onMouseEnter={() => handleMouseEnter(menu.id)}
            onMouseLeave={handleMouseLeave}
          >
            <Link href={menu.link} onClick={(e) => handleCapabilityClick(menu.link, e)}>
              {menu.title}
              <FaChevronDown className="dropdown-icon" />
            </Link>
            <div 
              className={`capabilities-mega-grid-compact tp-submenu tp-mega-menu ${openMegaMenu === menu.id ? 'show' : ''}`}
              onClick={(e) => {
                // Only close if clicking on the container itself, not on links
                if (e.target === e.currentTarget) {
                  setOpenMegaMenu(null);
                }
              }}
            >
              {/* Header */}
              <div className="capabilities-header">
                <h4>Our Capabilities</h4>
              </div>
              
              {/* Main content */}
              <div className="capabilities-content">
                {/* Grid for capability items */}
                <div className="capabilities-boxes-compact-grid">
                  {menu.capability_pages.map((capability, i) => {
                    const IconComponent = getIconComponent(capability.icon);
                    return (
                      <div key={i} className="capability-compact-box">
                        <Link 
                          href={capability.link} 
                          className="capability-compact-link"
                          onClick={(e) => handleCapabilityClick(capability.link, e)}
                        >
                          <div className="capability-compact-icon">
                            <IconComponent />
                          </div>
                          <div className="capability-compact-content">
                            <h5 className="capability-compact-title">{capability.title}</h5>
                            <p className="capability-compact-desc">{capability.description}</p>
                          </div>
                        </Link>
                      </div>
                    );
                  })}
                </div>
              </div>
              
              {/* Footer CTA */}
              <div className="capabilities-footer-cta">
                <Link 
                  href="/capabilities" 
                  className="view-all-compact-btn"
                  onClick={(e) => handleCapabilityClick('/capabilities', e)}
                >
                  View All Capabilities
                </Link>
              </div>
            </div>
          </li>
        ) : menu.products ? (
          <li key={menu.id} className="has-dropdown has-mega-menu ">
            <Link href={menu.link}>{menu.title}</Link>
            <ul className="tp-submenu tp-mega-menu mega-menu-style-2">
              {menu.product_pages.map((p, i) => (
                <li key={i} className="has-dropdown">
                  <Link href={p.link} className="mega-menu-title">
                    {p.title}
                  </Link>
                  <ul className="tp-submenu">
                    {p.mega_menus.map((m, i) => (
                      <li key={i}>
                        <Link href={m.link}>{m.title}</Link>
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          </li>
        ) : menu.sub_menu ? (
          <li key={menu.id} className="has-dropdown">
            <Link href={menu.link} onClick={handleRegularClick}>{menu.title}</Link>
            <ul className="tp-submenu">
              {menu.sub_menus.map((b, i) => (
                <li key={i}>
                  <Link href={b.link} onClick={handleRegularClick}>{b.title}</Link>
                </li>
              ))}
            </ul>
          </li>
        ) : (
          <li key={menu.id}>
            <Link href={menu.link} onClick={handleRegularClick}>{menu.title}</Link>
          </li>
        )
      )}
    </ul>
  );
};

export default Menus;

 "use client";

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { FaPlay, FaDownload, FaIndustry, FaCogs, FaWarehouse, FaPhoneAlt, FaTimes, FaWhatsapp } from 'react-icons/fa';
import { useGetOfficeInformationQuery } from '@/redux/features/officeInformationApi';
import styles from './Capabilities.module.scss';

const CapabilitiesClient = () => {
  const [activeTab, setActiveTab] = React.useState('products');
  const [selectedVideo, setSelectedVideo] = React.useState(null);

  // ✅ Fetch office info for WhatsApp integration
  const { data: officeRes } = useGetOfficeInformationQuery();
  const office = officeRes?.data?.[0];

  // ✅ Helper to extract digits only
  const digitsOnly = (v) => String(v || "").replace(/[^\d]/g, "");

  // ✅ WhatsApp and Phone numbers from API (with fallbacks)
  const waDigits = digitsOnly(office?.whatsappNumber) || "919999999999";
  const phoneDigits = digitsOnly(office?.phone1) || digitsOnly(office?.phone2) || "919999999999";
  
  const whatsappHref = `https://wa.me/${waDigits}?text=Hi! I'm interested in your fabric capabilities and would like to request a sample book.`;
  const callHref = `tel:+${phoneDigits}`;

  // Handle URL hash navigation
  React.useEffect(() => {
    const handleHashChange = () => {
      if (typeof window === 'undefined') return;
      
      const hash = window.location.hash.replace('#', '');
            
      if (hash && ['products', 'process', 'machines', 'quality', 'certifications'].includes(hash)) {
                setActiveTab(hash);
        
        // Scroll to the section after a short delay to ensure content is rendered
        setTimeout(() => {
          const element = document.getElementById(hash);
          if (element) {
                        const headerOffset = 120; // Account for sticky header
            const elementPosition = element.offsetTop;
            const offsetPosition = elementPosition - headerOffset;
            
            window.scrollTo({
              top: offsetPosition,
              behavior: 'smooth'
            });
          } else {
            // Element not found - will retry after render
          }
        }, 300); // Increased delay
      } else if (hash) {
        // Unknown hash - ignore
      } else {
                setActiveTab('products'); // Default tab
      }
    };

    // Handle initial load
        handleHashChange();

    // Listen for hash changes
    if (typeof window !== 'undefined') {
      window.addEventListener('hashchange', handleHashChange);
    }
    
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('hashchange', handleHashChange);
      }
    };
  }, []);

  // Update URL when tab changes
  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    // Update URL hash without page reload
    const newUrl = `/capabilities#${tabId}`;
    if (typeof window !== 'undefined') {
      window.history.pushState(null, '', newUrl);
    }
    
    // Scroll to section
    setTimeout(() => {
      const element = document.getElementById(tabId);
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
  };

  const productCategories = [
    {
      name: 'Knit Fabrics',
      gsm: '120-280 GSM',
      width: '44"-72"',
      uses: 'T-shirts, Sportswear, Undergarments',
      finishing: 'Mercerized, Bio-polished, Anti-pilling',
      image: '/assets/img/product/knit-fabrics.jpg'
    },
    {
      name: 'Woven Fabrics',
      gsm: '100-350 GSM',
      width: '44"-60"',
      uses: 'Shirts, Trousers, Formal Wear',
      finishing: 'Sanforized, Wrinkle-free, Easy care',
      image: '/assets/img/product/woven-fabric.jpg'
    },
    {
      name: 'Denim Fabrics',
      gsm: '200-400 GSM',
      width: '58"-60"',
      uses: 'Jeans, Jackets, Casual Wear',
      finishing: 'Stone wash, Enzyme wash, Bleach',
      image: '/assets/img/product/denim-fabrics.jpg'
    },
    {
      name: 'Cotton Fabrics',
      gsm: '80-300 GSM',
      width: '44"-60"',
      uses: 'Shirts, Dresses, Home Textiles',
      finishing: 'Mercerized, Sanforized, Anti-wrinkle',
      image: '/assets/img/product/cotton-fabric.jpg'
    },
    {
      name: 'Linen Fabrics',
      gsm: '120-280 GSM',
      width: '44"-54"',
      uses: 'Summer Wear, Curtains, Table Linen',
      finishing: 'Pre-shrunk, Enzyme washed, Softened',
      image: '/assets/img/product/linen-fabric.jpg'
    },
    {
      name: 'Polyester Blends',
      gsm: '100-250 GSM',
      width: '44"-58"',
      uses: 'Formal Wear, Uniforms, Upholstery',
      finishing: 'Wrinkle-free, Stain-resistant, Durable',
      image: '/assets/img/product/mix-fabrics.jpg'
    },
    {
      name: 'Silk Fabrics',
      gsm: '60-200 GSM',
      width: '44"-54"',
      uses: 'Ethnic Wear, Scarves, Luxury Items',
      finishing: 'Degummed, Dyed, Printed',
      image: '/assets/img/product/multi-fabrics.jpg'
    }
  ];

  const manufacturingProcess = [
    { step: 1, title: 'Yarn Selection', desc: 'Quality yarn sourcing and testing' },
    { step: 2, title: 'Weaving/Knitting', desc: 'Advanced machinery for fabric production' },
    { step: 3, title: 'Dyeing & Printing', desc: 'Color matching and pattern application' },
    { step: 4, title: 'Finishing', desc: 'Special treatments and quality enhancement' },
    { step: 5, title: 'Quality Control', desc: 'Multi-stage inspection and testing' },
    { step: 6, title: 'Packaging', desc: 'Proper packaging for safe delivery' },
    { step: 7, title: 'Dispatch', desc: 'Timely delivery to customers' },
    { step: 8, title: 'Customer Satisfaction', desc: 'Ensuring complete customer happiness', icon: '😊' }
  ];

  const machines = [
    { name: 'Air Jet Looms', image: '/assets/img/machines/air-jet-loom.jpg' },
    { name: 'Rapier Looms', image: '/assets/img/machines/rapier-loom.jpg' },
    { name: 'Circular Knitting', image: '/assets/img/machines/circular-knitting.jpg' },
    { name: 'Dyeing Machines', image: '/assets/img/machines/dyeing-machine.jpg' },
    { name: 'Printing Machines', image: '/assets/img/machines/printing-machine.jpg' },
    { name: 'Finishing Lines', image: '/assets/img/machines/finishing-line.jpg' }
  ];

  const qualitySteps = [
    { 
      title: 'Raw Material Inspection', 
      desc: 'Testing yarn quality, strength, and consistency',
      image: '/assets/img/lab/raw-material-testing.jpg'
    },
    { 
      title: 'In-Process Monitoring', 
      desc: 'Continuous quality checks during production',
      image: '/assets/img/lab/in-process-monitoring.jpg'
    },
    { 
      title: 'Color Matching', 
      desc: 'Precise color matching using spectrophotometer',
      image: '/assets/img/lab/color-matching.jpg'
    },
    { 
      title: 'Physical Testing', 
      desc: 'Strength, shrinkage, and durability testing',
      image: '/assets/img/lab/physical-testing.jpg'
    },
    { 
      title: 'Final Inspection', 
      desc: 'Complete quality audit before packaging',
      image: '/assets/img/lab/final-inspection.jpg'
    },
    { 
      title: 'Chemical Analysis', 
      desc: 'Testing for harmful substances and compliance',
      image: '/assets/img/lab/chemical-analysis.jpg'
    }
  ];

  const certifications = [
    { 
      name: 'OEKO-TEX Standard 100', 
      number: 'CQ 1007/1', 
      expiry: '2025-03-15',
      image: '/assets/img/logo/confidence_Textiles.png',
      description: 'Ensures textiles are free from harmful substances'
    },
    { 
      name: 'BCI Better Cotton', 
      number: 'BC-2024-001', 
      expiry: '2025-12-31',
      image: '/assets/img/logo/BCI.png',
      description: 'Sustainable cotton sourcing certification'
    },
    { 
      name: 'Global Recycled Standard', 
      number: 'GRS-2024-789', 
      expiry: '2025-06-30',
      image: '/assets/img/logo/global.png',
      description: 'Verification of recycled content in products'
    },
    { 
      name: 'Organic Content Standard', 
      number: 'OCS-2024-456', 
      expiry: '2025-09-15',
      image: '/assets/img/logo/organic.png',
      description: 'Organic fiber content verification'
    }
  ];

  const videos = [
    { id: 1, title: 'Factory Overview', thumbnail: '/assets/img/video/factory-overview.jpg', duration: '3:45' },
    { id: 2, title: 'Weaving Process', thumbnail: '/assets/img/video/weaving-process.jpg', duration: '2:30' },
    { id: 3, title: 'Quality Control', thumbnail: '/assets/img/video/quality-control.jpg', duration: '4:15' },
    { id: 4, title: 'Warehouse Tour', thumbnail: '/assets/img/video/warehouse-tour.jpg', duration: '3:20' }
  ];

  return (
    <>
      {/* Hero Section */}
      <section className={styles.capabilitiesHeroSection}>
        <div className="container">
          <div className="row align-items-center">
            <div className="col-lg-6">
              <div className={styles.capabilitiesHeroContent}>
                <div className={styles.heroBadge}>
                  <span className={styles.badgeText}>Industry Leading</span>
                </div>
                <h1 className={styles.capabilitiesHeroTitle}>
                  Advanced Manufacturing <span className={styles.gradientText}>Capabilities</span>
                </h1>
                <p className={styles.capabilitiesHeroDesc}>
                  State-of-the-art machinery, skilled workforce, and quality systems 
                  that enable us to deliver premium fabrics with consistency and precision.
                </p>
                <div className={styles.capabilitiesHighlights}>
                  <div className={styles.highlightItem}>
                    <div className={styles.highlightIcon} style={{color: '#0989FF'}}>
                      <FaIndustry />
                    </div>
                    <div>
                      <strong>5,000,00+</strong>
                      <span>Meters/Month</span>
                    </div>
                  </div>
                  <div className={styles.highlightDivider}></div>
                  <div className={styles.highlightItem}>
                    <div className={styles.highlightIcon} style={{color: '#821F40'}}>
                      <FaCogs />
                    </div>
                    <div>
                      <strong>Latest and Advanced</strong>
                      <span> Machines</span>
                    </div>
                  </div>
                  <div className={styles.highlightDivider}></div>
                  <div className={styles.highlightItem}>
                    <div className={styles.highlightIcon} style={{color: '#678E61'}}>
                      <FaWarehouse />
                    </div>
                    <div>
                      <strong>Multiple</strong>
                      <span> offices and warehouses</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-lg-6">
              <div className={styles.capabilitiesHeroImage}>
                <div className={styles.imageWrapper}>
                  <Image
                    src="/assets/img/header/menu/cap-hero.jpg"
                    alt="Advanced Manufacturing Capabilities"
                    width={600}
                    height={400}
                    className={`img-fluid ${styles.mainImage}`}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Navigation Tabs */}
      <section className={styles.capabilitiesNavSection}>
        <div className="container">
          <div className={styles.capabilitiesNavTabs}>
            {[
              { id: 'products', label: 'Product Range' },
              { id: 'process', label: 'Manufacturing Process' },
              { id: 'machines', label: 'Machines & Technology' },
              { id: 'quality', label: 'Quality & Testing' },
              { id: 'certifications', label: 'Certifications' }
            ].map((tab) => (
              <button
                key={tab.id}
                className={`${styles.navTab} ${activeTab === tab.id ? styles.active : ''}`}
                onClick={() => handleTabChange(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Product Range */}
      {activeTab === 'products' && (
        <section id="products" className={styles.capabilitiesSection}>
          <div className="container">
            <div className="text-center mb-5">
              <h2 className={styles.sectionTitle}>Our Product Range</h2>
              <p className={styles.sectionSubtitle}>
                Comprehensive fabric categories for diverse applications
              </p>
            </div>
            <div className={styles.productsGrid}>
              {productCategories.map((product, index) => (
                <Link key={index} href="/fabric" className={styles.productCardLink}>
                  <div className={styles.productCard}>
                    <div className={styles.productImage}>
                      <Image
                        src={product.image}
                        alt={product.name}
                        width={300}
                        height={200}
                        className="img-fluid"
                      />
                    </div>
                    <div className={styles.productContent}>
                      <h4 className={styles.productName}>{product.name}</h4>
                      <div className={styles.productSpecs}>
                        <div className={styles.specItem}>
                          <strong>GSM:</strong> <span>{product.gsm}</span>
                        </div>
                        <div className={styles.specItem}>
                          <strong>Width:</strong> <span>{product.width}</span>
                        </div>
                        <div className={styles.specItem}>
                          <strong>Uses:</strong> <span>{product.uses}</span>
                        </div>
                        <div className={styles.specItem}>
                          <strong>Finishing:</strong> <span>{product.finishing}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            <div className="text-center mt-5">
              <Link href="/fabric" className={`${styles.tpBtn} ${styles.tpBtnPrimary}`}>
                View All Products
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Manufacturing Process */}
      {activeTab === 'process' && (
        <section id="process" className={styles.capabilitiesSection}>
          <div className="container">
            <div className="text-center mb-5">
              <h2 className={styles.sectionTitle}>Manufacturing Process</h2>
              <p className={styles.sectionSubtitle}>
                Step-by-step process ensuring quality at every stage
              </p>
            </div>
            <div className={styles.processFlow}>
              {manufacturingProcess.map((step, index) => (
                <React.Fragment key={index}>
                  <div className={styles.processStep}>
                    <div className={styles.stepNumber}>{step.step}</div>
                    <div className={styles.stepContent}>
                      <h4 className={styles.stepTitle}>{step.title}</h4>
                      <p className={styles.stepDesc}>{step.desc}</p>
                    </div>
                  </div>
                  {index < manufacturingProcess.length - 1 && (
                    <div className={styles.stepArrow}>→</div>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Machines & Technology */}
      {activeTab === 'machines' && (
        <section id="machines" className={styles.capabilitiesSection}>
          <div className="container">
            <div className="text-center mb-5">
              <h2 className={styles.sectionTitle}>Machines & Technology</h2>
              <p className={styles.sectionSubtitle}>
                Advanced machinery for superior fabric production
              </p>
            </div>
            <div className={styles.machinesGrid}>
              {machines.map((machine, index) => (
                <div key={index} className={styles.machineCard}>
                  <div className={styles.machineImage}>
                    <Image
                      src={machine.image}
                      alt={machine.name}
                      width={400}
                      height={300}
                      className="img-fluid"
                    />
                  </div>
                  <div className={styles.machineContent}>
                    <h4 className={styles.machineName}>{machine.name}</h4>
                  </div>
                </div>
              ))}
            </div>
            <div className={styles.videosSection}>
              <h3 className="text-center mb-4">Production Videos</h3>
              <div className={styles.videosGrid}>
                {videos.map((video) => (
                  <div key={video.id} className={styles.videoCard} onClick={() => setSelectedVideo(video)}>
                    <div className={styles.videoThumbnail}>
                      <Image
                        src={video.thumbnail}
                        alt={video.title}
                        width={300}
                        height={200}
                        className="img-fluid"
                      />
                      <div className={styles.playButton}>
                        <FaPlay />
                      </div>
                      <div className={styles.videoDuration}>{video.duration}</div>
                    </div>
                    <div className={styles.videoTitle}>{video.title}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Quality & Testing */}
      {activeTab === 'quality' && (
        <section id="quality" className={styles.capabilitiesSection}>
          <div className="container">
            <div className="text-center mb-5">
              <h2 className={styles.sectionTitle}>Quality & Testing</h2>
              <p className={styles.sectionSubtitle}>
                Our state-of-the-art testing laboratory
              </p>
            </div>
            
            {/* Lab Images Gallery */}
            <div className={styles.labGallery}>
              {qualitySteps.map((step, index) => (
                <div key={index} className={styles.labImageCard}>
                  <div className={styles.labImage}>
                    <Image
                      src={step.image}
                      alt={step.title}
                      width={400}
                      height={300}
                      className="img-fluid"
                    />
                  </div>
                  <div className={styles.labImageTitle}>
                    <h4>{step.title}</h4>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Certifications */}
      {activeTab === 'certifications' && (
        <section id="certifications" className={styles.capabilitiesSection}>
          <div className="container">
            <div className="text-center mb-5">
              <h2 className={styles.sectionTitle}>Certifications & Compliance</h2>
              <p className={styles.sectionSubtitle}>
                International certifications ensuring quality and sustainability
              </p>
            </div>
            <div className={styles.certificationsGrid}>
              {certifications.map((cert, index) => (
                <div key={index} className={styles.certificationCard}>
                  <div className={styles.certImage}>
                    <Image src={cert.image} alt={cert.name} width={100} height={100} />
                  </div>
                  <div className={styles.certContent}>
                    <h4 className={styles.certName}>{cert.name}</h4>
                    <p className={styles.certDesc}>{cert.description}</p>
                    <div className={styles.certDetails}>
                      <div className={styles.certNumber}>
                        <strong>Certificate No:</strong> {cert.number}
                      </div>
                      <div className={styles.certExpiry}>
                        <strong>Valid Until:</strong> {cert.expiry}
                      </div>
                    </div>
                    <button className={styles.certDownload}>
                      <FaDownload /> Download PDF
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className={styles.ctaSection}>
        <div className="container">
          <div className={styles.ctaContent}>
            <h2 className={styles.ctaTitle}>Ready to explore our fabrics?</h2>
            <p className={styles.ctaDesc}>
              Get in touch with our team to discuss your requirements and see how we can help.
            </p>
            <div className={styles.ctaActions}>
              <a 
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className={`${styles.tpBtn} ${styles.tpBtnPrimary}`}
              >
                <FaWhatsapp className="me-2" />
                Request Sample Book
              </a>
              <Link href="/contact" className={`${styles.tpBtn} ${styles.tpBtnOutline}`}>
                Get Quote
              </Link>
              <a 
                href={callHref}
                className={`${styles.tpBtn} ${styles.tpBtnSecondary}`}
              >
                <FaPhoneAlt className="me-2" />
                Talk to Us
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Video Modal */}
      {selectedVideo && (
        <div className={styles.videoModal} onClick={() => setSelectedVideo(null)}>
          <div className={styles.videoModalContent} onClick={(e) => e.stopPropagation()}>
            <button className={styles.videoClose} onClick={() => setSelectedVideo(null)}>
              <FaTimes />
            </button>
            <h3>{selectedVideo.title}</h3>
            <div className={styles.videoPlaceholder}>
              <div className={styles.videoPlayIcon}>
                <FaPlay />
              </div>
              <p>Video Player Placeholder</p>
              <p>Duration: {selectedVideo.duration}</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CapabilitiesClient;
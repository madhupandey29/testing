'use client';
import React, { useState } from 'react';

const ContactMap = () => {
  const [mapError, setMapError] = useState(false);
  
  const gmapSrc =
    'https://maps.google.com/maps?width=100%25&height=600&hl=en&q=Safal%20Prelude,%20404,%204th%20Floor,%20Corporate%20Road,%20Prahlad%20Nagar,%20Ahmedabad,%20Gujarat%20380015&t=&z=14&ie=UTF8&iwloc=B&output=embed';

  const directionsLink =
    'https://www.google.com/maps/dir/?api=1&destination=4TH+FLOOR,+Safal+Prelude,+404,+Corporate+Rd,+near+YMCA+CLUB,+Prahlad+Nagar,+Ahmedabad,+Gujarat+380015';

  const viewLink =
    'https://www.google.com/maps/place/4TH+FLOOR,+Safal+Prelude,+404,+Corporate+Rd,+near+YMCA+CLUB,+Prahlad+Nagar,+Ahmedabad,+Gujarat+380015';

  const handleMapError = () => {
    setMapError(true);
  };

  return (
    <section className="map-block">
      <div className="wrap">
        {/* Map */}
        <div className="frame" role="region" aria-label="Office location on Google Maps">
          {!mapError ? (
            <iframe
              src={gmapSrc}
              width="100%"
              height="100%"
              style={{ border: 0 }}
              loading="lazy"
              allowFullScreen
              referrerPolicy="no-referrer-when-downgrade"
              title="Amrita Global – Safal Prelude"
              onError={handleMapError}
            />
          ) : (
            <div className="map-fallback">
              <div className="fallback-content">
                <h4>Map Temporarily Unavailable</h4>
                <p>{`We're`} experiencing technical difficulties with the map display.</p>
                <div className="fallback-links">
                  <a href={viewLink} target="_blank" rel="noopener noreferrer" className="fallback-btn">
                    View on Google Maps
                  </a>
                  <a href={directionsLink} target="_blank" rel="noopener noreferrer" className="fallback-btn">
                    Get Directions
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Info-window style card */}
        <aside className="info-window" aria-label="Office address">
          <h4 className="iw-title">Amrita Global Enterprises</h4>
          <p className="iw-address">
            404, 4th Floor, Safal Prelude,<br />
            Behind YMCA Club, Corporate Road,<br />
            Prahlad Nagar, Ahmedabad, Gujarat 380015
          </p>

          <div className="iw-links">
            <a href={directionsLink} target="_blank" rel="noopener noreferrer" className="iw-link">
              Directions
            </a>
            <a href={viewLink} target="_blank" rel="noopener noreferrer" className="iw-link">
              View larger map
            </a>
          </div>
        </aside>
      </div>

      <style jsx>{`
        .map-block {
          padding: 24px 0 80px;
          background: #f7f9fc;
        }
        .wrap {
          max-width: 1160px;
          margin: 0 auto;
          padding: 0 24px;
          position: relative;
        }
        .frame {
          height: 450px;
          border-radius: 12px;
          overflow: hidden;
          background: #fff;
          box-shadow: 0 10px 30px rgba(15, 34, 53, 0.12);
          position: relative;
          display: block;
        }

        .frame iframe {
          width: 100% !important;
          height: 100% !important;
          display: block;
          margin: 0;
          padding: 0;
          border: none;
          vertical-align: top;
        }

        /* Reset any potential iframe styling */
        .frame iframe {
          min-height: 450px;
          max-height: 450px;
        }

        /* Map fallback styles */
        .map-fallback {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
          border: 2px dashed #cbd5e1;
        }
        
        .fallback-content {
          text-align: center;
          padding: 40px 20px;
        }
        
        .fallback-content h4 {
          color: #475569;
          font-size: 18px;
          font-weight: 600;
          margin: 0 0 8px;
        }
        
        .fallback-content p {
          color: #64748b;
          font-size: 14px;
          margin: 0 0 20px;
        }
        
        .fallback-links {
          display: flex;
          gap: 12px;
          justify-content: center;
          flex-wrap: wrap;
        }
        
        .fallback-btn {
          background: #2C4C97;
          color: white;
          padding: 10px 16px;
          border-radius: 6px;
          text-decoration: none;
          font-size: 13px;
          font-weight: 500;
          transition: all 0.2s ease;
        }
        
        .fallback-btn:hover {
          background: #1f3f80;
          transform: translateY(-1px);
        }

        /* Info window (Google style) - Fixed positioning and visibility */
        .info-window {
          position: absolute;
          top: 20px;
          left: 20px;
          width: 300px;
          background: #fff;
          border: 1px solid rgba(0, 0, 0, 0.2);
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          padding: 14px 16px;
          color: #202124;
          font-family: 'Inter', Roboto, Arial, sans-serif;
          z-index: 10;
          max-height: calc(100% - 40px);
          overflow: visible;
        }
        
        .iw-title {
          margin: 0 0 8px;
          font-size: 16px;
          font-weight: 700;
          color: #202124;
          line-height: 1.3;
        }
        
        .iw-address {
          margin: 0 0 12px;
          font-size: 13px;
          line-height: 1.5;
          color: #5f6368;
        }
        
        .iw-links {
          display: flex;
          gap: 16px;
          align-items: center;
          flex-wrap: wrap;
        }
        
        .iw-link {
          font-size: 14px;
          color: #1a73e8;
          text-decoration: none;
          font-weight: 500;
          padding: 2px 0;
          transition: all 0.2s ease;
        }
        
        .iw-link:hover {
          color: #1557b0;
          text-decoration: underline;
        }

        /* Responsive Design */
        @media (max-width: 768px) {
          .frame { 
            height: 380px; 
          }
          .frame iframe {
            min-height: 380px;
            max-height: 380px;
          }
          .info-window {
            top: 16px;
            left: 16px;
            right: 16px;
            width: auto;
            max-width: calc(100% - 32px);
          }
          .fallback-links {
            flex-direction: column;
            align-items: center;
          }
        }
        
        @media (max-width: 480px) {
          .frame { 
            height: 320px; 
          }
          .frame iframe {
            min-height: 320px;
            max-height: 320px;
          }
          .info-window {
            position: relative;
            top: auto; 
            left: auto;
            right: auto;
            width: 100%;
            margin-top: 16px;
            max-width: none;
          }
        }
      `}</style>
    </section>
  );
};

export default ContactMap;

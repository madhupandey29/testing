'use client';
import React from "react";
import { FaFire } from 'react-icons/fa';
import Timer from "../common/timer";
import dayjs from "dayjs";

const ProductDetailsCountdown = ({ offerExpiryTime }) => {
  return (
    <div className="tp-product-details-countdown d-flex align-items-center justify-content-between flex-wrap mt-25 mb-25">
      <h4 className="tp-product-details-countdown-title">
        <FaFire /> Flash Sale end in:{" "}
      </h4>
      <div
        className="tp-product-details-countdown-time"
      >
        {dayjs().isAfter(offerExpiryTime) ? (
          <ul>
            <li>
              <span>{0}</span> Day
            </li>
            <li>
              <span>{0}</span> Hrs
            </li>
            <li>
              <span>{0}</span> Min
            </li>
            <li>
              <span>{0}</span> Sec
            </li>
          </ul>
        ) : (
          <Timer expiryTimestamp={new Date(offerExpiryTime)} />
        )}
      </div>
    </div>
  );
};

export default ProductDetailsCountdown;

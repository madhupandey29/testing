import React from "react";
import { FaUserEdit, FaInfoCircle, FaClipboardList, FaLock } from 'react-icons/fa';

function SingleNav({ active = false, id, title, IconComponent }) {
  return (
    <button
      className={`nav-link ${active ? "active" : ""}`}
      id={`nav-${id}-tab`}
      data-bs-toggle="tab"
      data-bs-target={`#nav-${id}`}
      type="button"
      role="tab"
      aria-controls={id}
      aria-selected={active ? "true" : "false"}
    >
      <span>
        <IconComponent />
      </span>
      {title}
    </button>
  );
}

const ProfileNavTab = () => {
  return (
    <nav>
      <div
        className="nav nav-tabs tp-tab-menu flex-column"
        id="profile-tab"
        role="tablist"
      >
        <SingleNav
          active={true}
          id="profile"
          title="Profile"
          IconComponent={FaUserEdit}
        />
        <SingleNav
          id="information"
          title="Information"
          IconComponent={FaInfoCircle}
        />
        <SingleNav
          id="order"
          title="My Orders"
          IconComponent={FaClipboardList}
        />
        <SingleNav
          id="password"
          title="Change Password"
          IconComponent={FaLock}
        />
      </div>
    </nav>
  );
};

export default ProfileNavTab;

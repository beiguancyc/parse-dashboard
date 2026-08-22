import React from 'react';
import Pin from 'components/Sidebar/Pin.react';
import styles from 'components/Sidebar/Sidebar.scss';
import { formatCertDate, getSslCertStatus } from 'lib/sslCertDisplay';

const AppName = ({ name, sslCert, onClick, onPinClick }) => {
  const sslStatus = getSslCertStatus(sslCert);

  let sslLine = null;
  if (sslStatus) {
    const statusClass =
      sslStatus === 'expired'
        ? styles.sslCertExpired
        : sslStatus === 'expiring'
          ? styles.sslCertExpiring
          : styles.sslCertOk;
    sslLine = (
      <div className={`${styles.sslCertLine} ${statusClass}`}>
        HTTPS {formatCertDate(sslCert.validFrom)} ~ {formatCertDate(sslCert.validTo)}
      </div>
    );
  }

  return (
    <div>
      <div className={styles.currentApp}>
        <div className={styles.appNameRow}>
          <div className={styles.appNameContainer} onClick={onClick}>
            <div className={styles.currentAppName}>{name}</div>
          </div>
          <Pin onClick={onPinClick} />
        </div>
        {sslLine}
      </div>
    </div>
  );
};

export default AppName;

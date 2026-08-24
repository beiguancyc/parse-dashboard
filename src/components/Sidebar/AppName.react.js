import React, { useEffect, useRef, useState } from 'react';
import copy from 'copy-to-clipboard';
import Icon from 'components/Icon/Icon.react';
import Pin from 'components/Sidebar/Pin.react';
import styles from 'components/Sidebar/Sidebar.scss';
import { formatCertDate, getSslCertStatus } from 'lib/sslCertDisplay';

const AppName = ({ name, sslCert, serverURL, parseServerVersion, serverError, onClick, onPinClick }) => {
  const [copied, setCopied] = useState(false);
  const copiedTimer = useRef(null);
  const sslStatus = getSslCertStatus(sslCert);

  useEffect(() => {
    return () => {
      if (copiedTimer.current) {
        clearTimeout(copiedTimer.current);
      }
    };
  }, []);

  const handleCopyUrl = e => {
    // 点复制时不要打开 app 切换菜单
    e.stopPropagation();
    if (!serverURL) {
      return;
    }
    copy(serverURL);
    setCopied(true);
    if (copiedTimer.current) {
      clearTimeout(copiedTimer.current);
    }
    copiedTimer.current = setTimeout(() => setCopied(false), 1500);
  };

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

  const versionText = serverError
    ? `Unreachable: ${serverError.toString()}`
    : parseServerVersion || 'unknown';

  return (
    <div>
      <div className={styles.currentApp}>
        <div className={styles.appNameRow}>
          <div className={styles.appNameContainer} onClick={onClick}>
            <div className={styles.currentAppName}>{name}</div>
          </div>
          <Pin onClick={onPinClick} />
        </div>
        {serverURL && (
          <div className={styles.serverUrlLine}>
            <span className={styles.serverUrlText} title={serverURL}>
              {serverURL}
            </span>
            <button
              type="button"
              className={styles.copyUrl}
              title={copied ? 'Copied!' : 'Copy Server URL'}
              aria-label="Copy Server URL"
              onClick={handleCopyUrl}
            >
              <Icon
                name={copied ? 'check' : 'clone-icon'}
                width={12}
                height={12}
                fill={copied ? '#00db7c' : 'currentColor'}
              />
            </button>
          </div>
        )}
        <div className={styles.serverVersionLine} title={versionText}>
          Server {versionText}
        </div>
        {sslLine}
      </div>
    </div>
  );
};

export default AppName;

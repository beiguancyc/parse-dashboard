/*
 * Copyright (c) 2016-present, Parse, LLC
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */

export const SSL_WARN_DAYS = 30;

export function formatCertDate(iso) {
  const date = new Date(iso);
  if (isNaN(date.getTime())) {
    return '-';
  }
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

export function getSslCertStatus(sslCert) {
  if (!sslCert || sslCert.https === false || sslCert.error || !sslCert.validTo) {
    return null;
  }
  const daysLeft = Math.ceil((new Date(sslCert.validTo).getTime() - Date.now()) / 86400000);
  if (daysLeft < 0) {
    return 'expired';
  }
  if (daysLeft <= SSL_WARN_DAYS) {
    return 'expiring';
  }
  return 'ok';
}

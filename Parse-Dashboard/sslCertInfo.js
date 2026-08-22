'use strict';

const tls = require('tls');

const CACHE_TTL_MS = 10 * 60 * 1000;
const CONNECT_TIMEOUT_MS = 8000;

const cache = new Map();

/**
 * 从 serverURL 解析 HTTPS 握手目标。http 或非法 URL 返回 null。
 */
function parseHttpsTarget(serverURL) {
  if (!serverURL || typeof serverURL !== 'string') {
    return null;
  }
  let parsed;
  try {
    parsed = new URL(serverURL);
  } catch {
    return null;
  }
  if (parsed.protocol !== 'https:') {
    return null;
  }
  return {
    host: parsed.hostname,
    port: parsed.port ? Number(parsed.port) : 443,
  };
}

function cacheKey(target) {
  return `${target.host}:${target.port}`;
}

function getCached(key) {
  const entry = cache.get(key);
  if (!entry) {
    return null;
  }
  if (Date.now() - entry.at > CACHE_TTL_MS) {
    cache.delete(key);
    return null;
  }
  return entry.value;
}

/**
 * 对 serverURL 做 TLS 握手，读取当前证书的起止时间。
 * 不校验证书链，过期/自签也能读到日期。
 */
function fetchPeerCertificate(target) {
  return new Promise(resolve => {
    let settled = false;
    const finish = value => {
      if (settled) {
        return;
      }
      settled = true;
      resolve(value);
    };

    const socket = tls.connect(
      {
        host: target.host,
        port: target.port,
        servername: target.host,
        rejectUnauthorized: false,
      },
      () => {
        const cert = socket.getPeerCertificate();
        socket.end();
        if (!cert || !cert.valid_from || !cert.valid_to) {
          finish({ https: true, error: 'no certificate' });
          return;
        }
        const validFrom = new Date(cert.valid_from);
        const validTo = new Date(cert.valid_to);
        if (isNaN(validFrom.getTime()) || isNaN(validTo.getTime())) {
          finish({ https: true, error: 'invalid certificate dates' });
          return;
        }
        finish({
          https: true,
          validFrom: validFrom.toISOString(),
          validTo: validTo.toISOString(),
        });
      }
    );

    socket.setTimeout(CONNECT_TIMEOUT_MS, () => {
      socket.destroy();
      finish({ https: true, error: 'timeout' });
    });

    socket.on('error', err => {
      finish({ https: true, error: err.message || 'connection error' });
    });
  });
}

async function getSslCertInfo(serverURL) {
  const target = parseHttpsTarget(serverURL);
  if (!target) {
    return { https: false };
  }

  const key = cacheKey(target);
  const cached = getCached(key);
  if (cached) {
    return cached;
  }

  const value = await fetchPeerCertificate(target);
  cache.set(key, { at: Date.now(), value });
  return value;
}

function clearSslCertCache() {
  cache.clear();
}

module.exports = {
  parseHttpsTarget,
  getSslCertInfo,
  clearSslCertCache,
};

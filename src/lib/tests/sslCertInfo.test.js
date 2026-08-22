/*
 * Copyright (c) 2016-present, Parse, LLC
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */
jest.dontMock('../../../Parse-Dashboard/sslCertInfo.js');

const EventEmitter = require('events');
const tls = require('tls');
const { parseHttpsTarget, getSslCertInfo, clearSslCertCache } = require('../../../Parse-Dashboard/sslCertInfo');

describe('parseHttpsTarget', () => {
  it('parses https host and default port', () => {
    expect(parseHttpsTarget('https://api.example.com/parse')).toEqual({
      host: 'api.example.com',
      port: 443,
    });
  });

  it('parses custom port', () => {
    expect(parseHttpsTarget('https://api.example.com:8443/parse')).toEqual({
      host: 'api.example.com',
      port: 8443,
    });
  });

  it('returns null for http', () => {
    expect(parseHttpsTarget('http://localhost:1337/parse')).toBeNull();
  });

  it('returns null for invalid url', () => {
    expect(parseHttpsTarget('not-a-url')).toBeNull();
    expect(parseHttpsTarget('')).toBeNull();
    expect(parseHttpsTarget(null)).toBeNull();
  });
});

describe('getSslCertInfo', () => {
  afterEach(() => {
    clearSslCertCache();
    jest.restoreAllMocks();
  });

  it('skips tls for http urls', async () => {
    const connect = jest.spyOn(tls, 'connect');
    const info = await getSslCertInfo('http://localhost:1337/parse');
    expect(info).toEqual({ https: false });
    expect(connect).not.toHaveBeenCalled();
  });

  it('returns certificate dates from the tls handshake', async () => {
    jest.spyOn(tls, 'connect').mockImplementation((options, onSecure) => {
      const socket = new EventEmitter();
      socket.setTimeout = jest.fn();
      socket.end = jest.fn();
      socket.destroy = jest.fn();
      socket.getPeerCertificate = () => ({
        valid_from: 'Jan  1 00:00:00 2025 GMT',
        valid_to: 'Jan  1 00:00:00 2026 GMT',
      });
      process.nextTick(onSecure);
      return socket;
    });

    const info = await getSslCertInfo('https://api.example.com/parse');
    expect(info.https).toBe(true);
    expect(info.validFrom).toBe(new Date('Jan  1 00:00:00 2025 GMT').toISOString());
    expect(info.validTo).toBe(new Date('Jan  1 00:00:00 2026 GMT').toISOString());
  });

  it('reuses cache for the same host', async () => {
    const connect = jest.spyOn(tls, 'connect').mockImplementation((options, onSecure) => {
      const socket = new EventEmitter();
      socket.setTimeout = jest.fn();
      socket.end = jest.fn();
      socket.destroy = jest.fn();
      socket.getPeerCertificate = () => ({
        valid_from: 'Jan  1 00:00:00 2025 GMT',
        valid_to: 'Jan  1 00:00:00 2026 GMT',
      });
      process.nextTick(onSecure);
      return socket;
    });

    await getSslCertInfo('https://api.example.com/parse');
    await getSslCertInfo('https://api.example.com/other');
    expect(connect).toHaveBeenCalledTimes(1);
  });
});

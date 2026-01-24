/**
 * İmza Doğrulaması için Birim Testleri
 */

import { generateSignature, verifySignature } from '../utils/signature';

describe('İmza Üretimi ve Doğrulaması', () => {
  describe('generateSignature', () => {
    it('aynı girdi için tutarlı imzalar üretmeli', () => {
      const data = { version: 1, domains: ['example.com'] };
      const sig1 = generateSignature(data);
      const sig2 = generateSignature(data);
      
      expect(sig1).toBe(sig2);
      expect(typeof sig1).toBe('string');
      expect(sig1.length).toBe(64); // SHA256 hex = 64 karakter
    });

    it('farklı girdiler için farklı imzalar üretmeli', () => {
      const data1 = { version: 1, domains: ['example.com'] };
      const data2 = { version: 2, domains: ['example.com'] };
      
      const sig1 = generateSignature(data1);
      const sig2 = generateSignature(data2);
      
      expect(sig1).not.toBe(sig2);
    });

    it('string girdisini işleyebilmeli', () => {
      const str = 'test metni';
      const sig = generateSignature(str);
      
      expect(typeof sig).toBe('string');
      expect(sig.length).toBe(64);
    });

    it('nesne girdisini işleyebilmeli', () => {
      const obj = {
        version: 1,
        updatedAt: 1234567890,
        domains: ['test.com', 'example.com']
      };
      const sig = generateSignature(obj);
      
      expect(typeof sig).toBe('string');
      expect(sig.length).toBe(64);
    });
  });

  describe('verifySignature', () => {
    it('doğru imzaları doğrulamalı', () => {
      const data = { version: 1, domains: ['example.com'] };
      const signature = generateSignature(data);
      
      const isValid = verifySignature(data, signature);
      expect(isValid).toBe(true);
    });

    it('yanlış imzaları reddetmeli', () => {
      const data = { version: 1, domains: ['example.com'] };
      const correctSig = generateSignature(data);
      const wrongSig = 'a'.repeat(64); // Yanlış imza
      
      const isValid = verifySignature(data, wrongSig);
      expect(isValid).toBe(false);
    });

    it('değiştirilmiş veri için imzaları reddetmeli', () => {
      const originalData = { version: 1, domains: ['example.com'] };
      const modifiedData = { version: 1, domains: ['example.org'] };
      const signature = generateSignature(originalData);
      
      const isValid = verifySignature(modifiedData, signature);
      expect(isValid).toBe(false);
    });

    it('engel listesi yanıt yapısını işleyebilmeli', () => {
      const blocklistResponse = {
        version: 42,
        updatedAt: 1234567890,
        domains: ['bet365.com', 'betway.com', 'casino.com']
      };
      
      const signature = generateSignature(blocklistResponse);
      const isValid = verifySignature(blocklistResponse, signature);
      
      expect(isValid).toBe(true);
    });

    it('kalıp yanıt yapısını işleyebilmeli', () => {
      const patternsResponse = {
        version: 10,
        updatedAt: 1234567890,
        patterns: [
          { pattern: 'bet', type: 'contains', weight: 0.7 },
          { pattern: 'casino', type: 'contains', weight: 0.8 }
        ]
      };
      
      const signature = generateSignature(patternsResponse);
      const isValid = verifySignature(patternsResponse, signature);
      
      expect(isValid).toBe(true);
    });

    it('zamanlama saldırılarına dayanıklı olmalı', () => {
      const data = { version: 1, domains: ['example.com'] };
      const correctSig = generateSignature(data);
      const wrongSig = '0'.repeat(64);
      
      // Her ikisi de benzer süre almalı (zamanlamaya dayanıklı karşılaştırma)
      const start1 = Date.now();
      verifySignature(data, correctSig);
      const time1 = Date.now() - start1;
      
      const start2 = Date.now();
      verifySignature(data, wrongSig);
      const time2 = Date.now() - start2;
      
      // Süreler benzer olmalı (makul tolerans içinde)
      // Bu temel bir testtir - tam zamanlama saldırısı direnci için daha gelişmiş test gerekir
      expect(Math.abs(time1 - time2)).toBeLessThan(10);
    });
  });
});

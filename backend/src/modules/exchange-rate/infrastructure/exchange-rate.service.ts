import { Injectable } from '@nestjs/common';

@Injectable()
export class ExchangeRateService {
  private cachedRate: {
    rate: number;
    updatedAt: string;
    source: string;
  } | null = null;
  private lastKnownRate: number | null = null;
  private readonly cacheTime = 5 * 60 * 1000; // 5 minutes cache

  async getDolarRate(): Promise<{
    rate: number;
    updatedAt: string;
    source: string;
  }> {
    if (
      this.cachedRate &&
      Date.now() - new Date(this.cachedRate.updatedAt).getTime() <
        this.cacheTime
    ) {
      return this.cachedRate;
    }

    let rate: number | null = null;
    let source = '';

    // 1) Try pydolarve API (Venezuelan-specific, most accurate for Bs)
    try {
      const res = await fetch('https://pydolarve.org/api/v2/dollar?page=bcv');
      const data = await res.json();
      if (data?.monitors?.usd?.price) {
        rate = data.monitors.usd.price;
        source = 'pydolarve (BCV)';
      }
    } catch {
      console.error('ExchangeRateService: pydolarve.org failed');
    }

    // 2) Try dolarapi.com Venezuela endpoint
    if (!rate) {
      try {
        const res = await fetch('https://ve.dolarapi.com/v1/dolares');
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          const bcv = data.find(
            (d: any) => d.fuente === 'oficial' || d.nombre === 'Oficial',
          );
          rate = bcv ? bcv.promedio : data[0].promedio;
          source = 've.dolarapi.com';
        }
      } catch {
        console.error('ExchangeRateService: ve.dolarapi.com failed');
      }
    }

    // 3) Try exchangerate-api.com USD→VES
    if (!rate) {
      try {
        const res = await fetch(
          'https://api.exchangerate-api.com/v4/latest/USD',
        );
        const data = await res.json();
        if (data?.rates?.VES) {
          rate = data.rates.VES;
          source = 'exchangerate-api.com';
        }
      } catch {
        console.error('ExchangeRateService: exchangerate-api.com failed');
      }
    }

    // 4) Try open.er-api.com USD→VES
    if (!rate) {
      try {
        const res = await fetch('https://open.er-api.com/v6/latest/USD');
        const data = await res.json();
        if (data?.rates?.VES) {
          rate = data.rates.VES;
          source = 'open.er-api.com';
        }
      } catch {
        console.error('ExchangeRateService: open.er-api.com failed');
      }
    }

    if (rate) {
      this.lastKnownRate = rate;
      this.cachedRate = { rate, updatedAt: new Date().toISOString(), source };
      return this.cachedRate;
    }

    // Fallback to last known rate
    if (this.lastKnownRate) {
      this.cachedRate = {
        rate: this.lastKnownRate,
        updatedAt: new Date().toISOString(),
        source: 'cache',
      };
      return this.cachedRate;
    }

    // Absolute last resort - approximate BCV rate
    this.cachedRate = {
      rate: 36.5,
      updatedAt: new Date().toISOString(),
      source: 'fallback',
    };
    return this.cachedRate;
  }

  async convertPrice(
    amountInUsd: number,
  ): Promise<{ usd: number; bs: number; rate: number }> {
    const { rate } = await this.getDolarRate();
    return { usd: amountInUsd, bs: amountInUsd * rate, rate };
  }
}

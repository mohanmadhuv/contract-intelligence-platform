import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

class ContractDataService {
  constructor() {
    this.costTrends = null;
    this.vendorConcentration = null;
    this.categoryBenchmarks = null;
    this.loadSampleData();
  }

  loadSampleData() {
    try {
      const sampleDataPath = path.join(__dirname, '../../data/sample-data.json');
      if (fs.existsSync(sampleDataPath)) {
        const data = JSON.parse(fs.readFileSync(sampleDataPath, 'utf8'));
        this.costTrends = data.costTrends || {};
        this.vendorConcentration = data.vendorConcentration || {};
        this.categoryBenchmarks = data.benchmarks || {};
      } else {
        this.initializeSampleData();
      }
    } catch (error) {
      console.warn('Could not load sample data, using defaults:', error.message);
      this.initializeSampleData();
    }
  }

  initializeSampleData() {
    this.costTrends = {
      'Management Consulting': [
        { year: 2020, spend: 2100000000, contracts: 850, avgRate: 275 },
        { year: 2021, spend: 2850000000, contracts: 920, avgRate: 310 },
        { year: 2022, spend: 3600000000, contracts: 950, avgRate: 380 },
        { year: 2023, spend: 4200000000, contracts: 980, avgRate: 430 },
        { year: 2024, spend: 5100000000, contracts: 1020, avgRate: 500 },
      ],
      'IT Services': [
        { year: 2020, spend: 1800000000, contracts: 620, avgRate: 320 },
        { year: 2021, spend: 2100000000, contracts: 650, avgRate: 340 },
        { year: 2022, spend: 2500000000, contracts: 700, avgRate: 360 },
        { year: 2023, spend: 3000000000, contracts: 750, avgRate: 400 },
        { year: 2024, spend: 3400000000, contracts: 800, avgRate: 425 },
      ],
      'Engineering & Architecture': [
        { year: 2020, spend: 950000000, contracts: 280, avgRate: 340 },
        { year: 2021, spend: 1100000000, contracts: 310, avgRate: 355 },
        { year: 2022, spend: 1350000000, contracts: 340, avgRate: 395 },
        { year: 2023, spend: 1650000000, contracts: 380, avgRate: 430 },
        { year: 2024, spend: 1850000000, contracts: 420, avgRate: 440 },
      ],
    };

    this.vendorConcentration = {
      'Management Consulting': [
        { vendor: 'Deloitte', marketShare: 0.42, spend: 2142000000 },
        { vendor: 'Accenture', marketShare: 0.18, spend: 918000000 },
        { vendor: 'EY', marketShare: 0.12, spend: 612000000 },
        { vendor: 'McKinsey', marketShare: 0.08, spend: 408000000 },
        { vendor: 'Other', marketShare: 0.2, spend: 1020000000 },
      ],
      'IT Services': [
        { vendor: 'Salesforce', marketShare: 0.28, spend: 952000000 },
        { vendor: 'Microsoft Partners', marketShare: 0.24, spend: 816000000 },
        { vendor: 'IBM', marketShare: 0.16, spend: 544000000 },
        { vendor: 'Google Cloud Partners', marketShare: 0.12, spend: 408000000 },
        { vendor: 'Other', marketShare: 0.2, spend: 680000000 },
      ],
    };

    this.categoryBenchmarks = {
      'Management Consulting': {
        median: 425,
        p25: 350,
        p75: 500,
        anomalies: [
          { vendor: 'ArriveCAN Contractors', rate: 725, marketRate: 450, variance: 61 },
        ],
      },
      'IT Services': {
        median: 400,
        p25: 320,
        p75: 475,
        anomalies: [],
      },
    };
  }

  getDataSummary() {
    return {
      totalSpend2024: 19500000000,
      categories: Object.keys(this.costTrends).length,
      vendors: this.countUniqueVendors(),
      topAnomalies: this.findTopAnomalies(),
      highConcentrationCategories: this.findHighConcentration(),
    };
  }

  getCostTrends(category = null, years = 5) {
    if (category && this.costTrends[category]) {
      return this.costTrends[category].slice(-years);
    }
    return Object.entries(this.costTrends).reduce((acc, [cat, trends]) => {
      acc[cat] = trends.slice(-years);
      return acc;
    }, {});
  }

  getVendorConcentration(category = null, limit = 10) {
    if (category && this.vendorConcentration[category]) {
      return this.vendorConcentration[category].slice(0, limit);
    }
    return Object.entries(this.vendorConcentration).reduce((acc, [cat, vendors]) => {
      acc[cat] = vendors.slice(0, limit);
      return acc;
    }, {});
  }

  getBenchmarks(category = null, type = 'rates') {
    if (category && this.categoryBenchmarks[category]) {
      return this.categoryBenchmarks[category];
    }
    return this.categoryBenchmarks;
  }

  getRelevantContext(userQuery) {
    const query = userQuery.toLowerCase();
    const context = {};

    if (
      query.includes('cost') ||
      query.includes('spending') ||
      query.includes('grow') ||
      query.includes('increase')
    ) {
      context.costTrends = this.getCostTrends();
    }

    if (
      query.includes('vendor') ||
      query.includes('concentration') ||
      query.includes('deloitte') ||
      query.includes('accenture')
    ) {
      context.vendorConcentration = this.getVendorConcentration();
    }

    if (query.includes('rate') || query.includes('benchmark') || query.includes('price')) {
      context.benchmarks = this.getBenchmarks();
    }

    if (Object.keys(context).length === 0) {
      context.summary = this.getDataSummary();
      context.topTrends = this.getCostTrends();
    }

    return context;
  }

  countUniqueVendors() {
    const vendors = new Set();
    Object.values(this.vendorConcentration).forEach((categoryVendors) => {
      categoryVendors.forEach((v) => vendors.add(v.vendor));
    });
    return vendors.size;
  }

  findTopAnomalies() {
    const anomalies = [];
    Object.entries(this.categoryBenchmarks).forEach(([category, benchmarks]) => {
      if (benchmarks.anomalies) {
        benchmarks.anomalies.forEach((a) => {
          anomalies.push({ category, ...a });
        });
      }
    });
    return anomalies.sort((a, b) => b.variance - a.variance).slice(0, 5);
  }

  findHighConcentration(threshold = 0.3) {
    const highConc = [];
    Object.entries(this.vendorConcentration).forEach(([category, vendors]) => {
      const topVendor = vendors[0];
      if (topVendor && topVendor.marketShare > threshold) {
        highConc.push({
          category,
          topVendor: topVendor.vendor,
          marketShare: topVendor.marketShare,
        });
      }
    });
    return highConc;
  }
}

export const contractDataService = new ContractDataService();

import { Holding, Portfolio } from 'generated/prisma/client';

export class PortfolioCalculator {
  static calculateHoldingCurrentValue(holding) {
    return Number(holding.quantity) * Number(holding.stocks.currentPrice);
  }

  static getHoldingCost(holding) {
    return Number(holding.totalCost);
  }

  static getHoldingProfit(holding) {
    return this.calculateHoldingCurrentValue(holding) - this.getHoldingCost(holding);
  }

  static getHoldingReturn(holding) {
    const cost = this.getHoldingCost(holding);

    if (cost === 0) return 0;

    return (this.getHoldingProfit(holding) / cost) * 100;
  }

  static calculatePortfolioCost(portfolio): number {
    return portfolio?.holdings.reduce((total, holding) => total + Number(holding.totalCost), 0);
  }

  static calculatePortfolioNetWorth(portfolio): number {
    return portfolio.holdings.reduce((total, holding) => total + this.calculateHoldingCurrentValue(holding), 0);
  }

  static calculateProfitPercent(portfolioProfit: number, portfolioCost: number): number {
    return (portfolioProfit / portfolioCost) * 100;
  }

  static calculateAnnualDividend(portfolio): number {
    return portfolio.holdings.reduce((total, holding) => total + holding.stocks.annualDividend * holding.quantity, 0);
  }

  static calculatePortfolioDividendYield(portfolio): number {
    const annualDividend = this.calculateAnnualDividend(portfolio);
    const netWorth = this.calculatePortfolioNetWorth(portfolio);

    if (netWorth === 0) return 0;

    return Number(((annualDividend / netWorth) * 100).toFixed(2));
  }

  static calculateProfitLoss(portfolio){
    return portfolio.holdings.map((h) => (h.stocks.currentPrice) - Number(h.avgPrice) * Number(h.quantity));
  }
}

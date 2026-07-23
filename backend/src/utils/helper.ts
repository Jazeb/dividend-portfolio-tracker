import { Holding } from "generated/prisma/client";

export const calculatePortfolioNetWorth = (portfolio) => {
  return portfolio.holdings.reduce((total, holding) => {
    const quantity = Number(holding.quantity);
    const currentPrice = Number(holding.stocks.currentPrice);

    return Number(total + quantity * currentPrice).toFixed(2);
  }, 0);
}
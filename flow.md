
```
Portfolio
    │
    ├── Transactions (source of truth)
    │       ↓
    ├── Current Holdings (calculated)
    │       ↓
    ├── Portfolio Value (using live prices)
    │       ↓
    ├── Dividend Income (using dividend history/announcements)
    │       ↓
    └── Goals Progress
```

### Flow

1. **User creates a Portfolio**

   * Dividend Portfolio
   * Retirement Portfolio
   * House Fund

2. **User adds Transactions** to that portfolio.

   * Buy
   * Sell
   * Bonus
   * Rights
   * Split

3. **App calculates Holdings**

   * Current quantity
   * Average cost
   * Cost basis

4. **App fetches current market prices**

   * Calculates market value
   * Profit/Loss
   * Allocation

5. **App calculates dividend income**

   * Annual income
   * Monthly equivalent
   * Upcoming dividends

6. **Goals page uses all of this**

   * Current monthly dividend
   * Current portfolio value
   * Progress toward target
   * Estimated completion date

So yes, **Transactions are the source of truth**. Everything else (Holdings, Portfolio, Dividends, Analytics, Goals) is derived from them. This is the same approach used by professional portfolio management platforms.

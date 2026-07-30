// Mock dividend calendar data for Lovable preview (no VITE_API_BASE_URL).
import type {
    DividendCalendarEvent,
    DividendCalendarResponse,
    DividendCalendarParams,
    DividendEventType,
  } from "@/lib/api/calendar";
  import { holdings as seedHoldings, portfolios as seedPortfolios } from "@/lib/mock-data";
  
  const TAX_RATE = 0.15;
  const TODAY = new Date(2026, 6, 28); // Jul 28 2026 (reference "now")
  
  function toISO(d: Date) {
    return d.toISOString().slice(0, 10);
  }
  
  function hash(str: string) {
    let h = 0;
    for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0;
    return Math.abs(h);
  }
  
  function holdingsForPortfolio(portfolioId?: string) {
    if (!portfolioId || portfolioId === "all") return seedHoldings.map((h, i) => ({ h, pid: seedPortfolios[i % seedPortfolios.length].id }));
    return seedHoldings
      .map((h, i) => ({ h, pid: seedPortfolios[i % seedPortfolios.length].id }))
      .filter((x) => String(x.pid) === portfolioId);
  }
  
  /**
   * Generate all four event dates for a given holding's payout in the target month.
   * Each holding pays quarterly; we synthesize a payment date within the month
   * deterministically based on symbol hash.
   */
  function buildEventForHolding(
    holding: (typeof seedHoldings)[number],
    portfolioId: number,
    month: number,
    year: number,
    stockId: number,
  ): DividendCalendarEvent | null {
    const h = hash(holding.symbol);
    // Only ~60% of holdings pay in any given month, deterministically
    if ((h + month) % 5 === 0) return null;
  
    const payDay = ((h + month * 7) % 26) + 3; // 3..28
    const payDate = new Date(year, month - 1, payDay);
  
    const exDate = new Date(payDate);
    exDate.setDate(payDate.getDate() - 20);
    const bookStart = new Date(payDate);
    bookStart.setDate(payDate.getDate() - 18);
    const bookEnd = new Date(payDate);
    bookEnd.setDate(payDate.getDate() - 17);
    const announcementDate = new Date(payDate);
    announcementDate.setDate(payDate.getDate() - 40);
  
    const dps = +(holding.annualDividend / 4).toFixed(2);
    const gross = Math.round(dps * holding.qty);
    const tax = Math.round(gross * TAX_RATE);
    const net = gross - tax;
  
    let status: DividendCalendarEvent["status"] = "UPCOMING";
    if (payDate < TODAY) status = "PAID";
    else if (exDate < TODAY && payDate >= TODAY) status = "PROCESSING";
  
    const portfolio = seedPortfolios.find((p) => p.id === portfolioId)!;
    const holdingValue = Math.round(holding.qty * holding.currentPrice);
  
    return {
      stockId,
      symbol: holding.symbol,
      company: holding.name,
      sector: holding.sector,
      eventType: "PAYMENT",
      eventDate: toISO(payDate),
      dividendPerShare: dps,
      eligibleShares: holding.qty,
      grossDividend: gross,
      tax,
      netDividend: net,
      announcementDate: toISO(announcementDate),
      exDate: toISO(exDate),
      bookClosureStart: toISO(bookStart),
      bookClosureEnd: toISO(bookEnd),
      paymentDate: toISO(payDate),
      status,
      portfolioId: String(portfolio.id),
      portfolioName: portfolio.name,
      holdingValue,
      currentYield: holding.dividendYield,
      yieldOnCost: holding.yieldOnCost,
    };
  }
  
  export function buildMockDividendCalendar(
    params: DividendCalendarParams,
  ): DividendCalendarResponse {
    const { month, year, portfolioId, eventType = "PAYMENT", stockId, status } = params;
    const pairs = holdingsForPortfolio(portfolioId);
  
    let events: DividendCalendarEvent[] = pairs
      .map((p, idx) => buildEventForHolding(p.h, p.pid, month, year, idx + 1))
      .filter((e): e is DividendCalendarEvent => e !== null)
      .map((e) => {
        // Re-project eventDate onto the requested event type
        const dateMap: Record<DividendEventType, string> = {
          PAYMENT: e.paymentDate,
          EX_DATE: e.exDate,
          BOOK_CLOSURE: e.bookClosureStart,
          ANNOUNCEMENT: e.announcementDate,
        };
        return { ...e, eventType, eventDate: dateMap[eventType] };
      })
      // Only keep events whose eventDate falls in the requested month/year
      .filter((e) => {
        const d = new Date(e.eventDate);
        return d.getFullYear() === year && d.getMonth() + 1 === month;
      });
  
    if (stockId && stockId !== "all") {
      events = events.filter((e) => String(e.stockId) === stockId);
    }
    if (status && status !== "ALL") {
      events = events.filter((e) => e.status === status);
    }
  
    const companies = new Set(events.map((e) => e.symbol)).size;
    const expectedDividend = events.reduce((s, e) => s + e.grossDividend, 0);
  
    const sortedByDate = [...events]
      .filter((e) => new Date(e.eventDate) >= TODAY)
      .sort((a, b) => (a.eventDate < b.eventDate ? -1 : 1));
    const nextEvent = sortedByDate[0]
      ? { stock: sortedByDate[0].symbol, date: sortedByDate[0].eventDate, type: sortedByDate[0].eventType }
      : null;
  
    const largest = [...events].sort((a, b) => b.grossDividend - a.grossDividend)[0];
    const largestDividend = largest ? { stock: largest.symbol, amount: largest.grossDividend } : null;
  
    return {
      summary: { companies, expectedDividend, nextEvent, largestDividend },
      events,
    };
  }
  
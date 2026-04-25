export interface AuctionRecord {
  auctionId: string;
  listingId: string;
  sellerCompany: string;
  dCode: string;
  quantity: number;
  startPrice: number;
  topBid: number;
  topBidderCompany: string | null;
  bidCount: number;
  status: "live" | "ended" | "expired";
  startedByCompany: string;
  startedAt: string;
  expiresAt: string;
  endedAt: string | null;
  winnerCompany: string | null;
}

export interface BidRecord {
  company: string;
  amount: number;
  at: string;
}

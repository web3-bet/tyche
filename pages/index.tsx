import Head from "next/head";
import { useCallback, useEffect, useState } from "react";
import { Filter } from "../components/Filter";
import { MarketCard } from "../components/MarketCard";
import Navbar from "../components/Navbar";
import { useData } from "../contexts/DataContext";
import styles from "../styles/Home.module.css";

export interface MarketProps {
  id: string;
  title: string;
  imageHash: string | null;
  totalAmount: number;
  totalYes: number;
  totalNo: number;
  aTitle: string;
  bTitle: string;
  description: string;
}

export default function Home() {
  const { polymarket, account, loadWeb3, loading, getBets } = useData();
  const [markets, setMarkets] = useState<MarketProps[]>([]);
  const [error, setError] = useState<string | null>(null);

  const getMarkets = useCallback(async () => {
    try {
      const bets = await getBets();
      console.log("bets", bets);
      const dataArray: MarketProps[] = Object.keys(bets).map(
        (id): MarketProps => {
          const bet = bets[parseInt(id)];
          console.log("bet data for id", id, bet);
          return {
            id,
            title: bet.title,
            imageHash: bet.imageHash,
            totalAmount: bet.currentTotalAAmount + bet.currentTotalBAmount,
            totalYes: bet.currentTotalAAmount,
            totalNo: bet.currentTotalBAmount,
            aTitle: bet.optionATitle,
            bTitle: bet.optionBTitle,
            description: bet.description,
          };
        }
      );
      setMarkets(dataArray);
    } catch (err) {
      console.error("Error fetching markets:", err);
      setError("Failed to fetch markets. Please try again later.");
    }
  }, [account, polymarket]);

  useEffect(() => {
    const load = async () => {
      try {
        await loadWeb3();
        getMarkets();
      } catch (err) {
        console.error("Error loading Web3:", err);
        setError("Failed to load Web3. Please try again later.");
      }
    };

    load();
  }, [loading]);

  return (
    <div className={styles.container}>
      <Head>
        <title>Polymarket</title>
        <meta name="description" content="Generated by create next app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Navbar />
      <main className="w-full flex flex-col sm:flex-row flex-wrap sm:flex-nowrap py-4 flex-grow max-w-5xl">
        <div className="w-full flex flex-col flex-grow pt-1">
          <div className="relative text-gray-500 focus-within:text-gray-400 w-full">
            <span className="absolute inset-y-0 left-0 flex items-center px-3">
              <svg
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                className="w-5 h-5"
              >
                <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
              </svg>
            </span>
            <input
              type="search"
              name="q"
              className="w-full py-3 px-3 text-base text-gray-700 bg-gray-100 rounded-md pl-10 focus:outline-none"
              placeholder="Search markets..."
              autoComplete="off"
            />
          </div>
          <div className="flex flex-row space-x-2 md:space-x-5 items-center flex-wrap mt-4">
            <Filter
              list={["All", "Crypto", "Football", "Covid 19", "Politics"]}
              activeItem="All"
              category="Category"
              onChange={() => {}}
            />
            <Filter
              list={["Volume", "Newest", "Expiring"]}
              activeItem="Volume"
              category="Sort By"
              onChange={() => {}}
            />
          </div>
          <span className="font-bold my-3 text-lg">Market</span>
          {error ? (
            <div className="text-red-500">{error}</div>
          ) : (
            <div className="flex flex-wrap overflow-hidden sm:-mx-1 md:-mx-2">
              {markets.map((market) => (
                <MarketCard
                  id={market.id}
                  key={market.id}
                  title={market.title}
                  totalAmount={market.totalAmount}
                  totalYes={market.totalYes}
                  totalNo={market.totalNo}
                  imageHash={market.imageHash}
                  aTitle={market.aTitle}
                  bTitle={market.bTitle}
                  description={market.description}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

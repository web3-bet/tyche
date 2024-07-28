declare let window: any;
import { createContext, useCallback, useContext, useState } from "react";
import Web3 from "web3";
import _Betting from "../abis/Betting.json";
import { AbiItem } from "web3-utils";
import { toNumber } from "lodash";

const FLOAT_BUFFER = 100;
const Betting = _Betting as AbiItem[];
interface DataContextProps {
  account: string;
  loading: boolean;
  loadWeb3: () => Promise<void>;
  polymarket: any;
  getBetData: (betId: number) => Promise<BetData>;
  getBets: () => Promise<BetMap>;
  getUserBets: (
    userAddress: string
  ) => Promise<{ abets: UserBet[]; bbets: UserBet[] }>;
}
export type Bet = {
  amount: number;
  averageRatio: number;
};
export type UserBet = {
  amount: number;
  averageRatio: number;
  betId: number;
};
export type Address = string;
export type BetData = {
  currentARatio: number;
  currentBRatio: number;
  currentTotalAAmount: number;
  currentTotalBAmount: number;
  closed: boolean;
  aWon: boolean;
  imageHash: string | null;
  title: string;
  description: string;
  optionATitle: string;
  optionBTitle: string;
};
export type BetMap = { [betId: number]: BetData };
const DataContext = createContext<DataContextProps>({
  account: "",
  loading: true,
  loadWeb3: async () => {},
  polymarket: null,
  getBetData: async () => ({} as BetData),
  getBets: async () => ({} as BetMap),
  getUserBets: async () => ({ abets: [], bbets: [] }),
});

export const DataProvider: React.FC = ({ children }) => {
  const data = useProviderData();

  return <DataContext.Provider value={data}>{children}</DataContext.Provider>;
};

export const useData = () => useContext<DataContextProps>(DataContext);

export const useProviderData = () => {
  const [loading, setLoading] = useState(true);
  const [account, setAccount] = useState("");
  const [polymarket, setPolymarket] = useState<any>(null);

  const getBetData = useCallback(
    async (betId: number) => {
      const betData = (await polymarket.methods.bets(betId).call()) as BetData;
      return {
        ...betData,
        imageHash:
          betData.imageHash?.length && betData.imageHash?.length > 0
            ? betData.imageHash
            : "data:image/png;base64,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",
        currentARatio:
          toNumber(betData.currentARatio.toString()) / FLOAT_BUFFER,
        currentBRatio:
          parseInt(betData.currentBRatio.toString()) / FLOAT_BUFFER,
        currentTotalAAmount:
          parseInt(betData.currentTotalAAmount.toString()) / FLOAT_BUFFER,
        currentTotalBAmount:
          parseInt(betData.currentTotalBAmount.toString()) / FLOAT_BUFFER,
      };
    },
    [polymarket]
  );

  const getBets = useCallback(async () => {
    const retval: BetMap = {};
    const betCount = parseInt(await polymarket.methods.betCount().call()) + 1;
    console.log("betCount", betCount);
    for (let i = 1; i < betCount; i++) {
      const betData = await getBetData(i);
      retval[i] = betData;
    }
    return retval;
  }, [polymarket]);

  const getUserBets = useCallback(
    async (userAddress: Address) => {
      const userBetsA: UserBet[] = await polymarket.methods
        .getUserBets(true)
        .call({
          from: userAddress,
        });
      const userBetsB: UserBet[] = await polymarket.methods
        .getUserBets(false)
        .call({
          from: userAddress,
        });
      console.log("address", userAddress);
      console.log("userBetsA", userBetsA);
      console.log("userBetsB", userBetsB);

      return {
        abets: userBetsA.map((bet: UserBet) => ({
          amount: parseInt(bet.amount.toString()) / FLOAT_BUFFER,
          averageRatio: parseInt(bet.averageRatio.toString()) / FLOAT_BUFFER,
          betId: parseInt(bet.betId.toString()),
        })),
        bbets: userBetsB.map((bet: UserBet) => ({
          amount: parseInt(bet.amount.toString()) / FLOAT_BUFFER,
          averageRatio: parseInt(bet.averageRatio.toString()) / FLOAT_BUFFER,
          betId: parseInt(bet.betId.toString()),
        })),
      };
    },
    [polymarket]
  );

  const loadWeb3 = async () => {
    try {
      if (window.ethereum) {
        window.web3 = new Web3(window.ethereum);
        await window.ethereum.enable();
      } else if (window.web3) {
        window.web3 = new Web3(window.web3.currentProvider);
      } else {
        window.alert(
          "Non-Eth browser detected. Please consider using MetaMask."
        );
        return;
      }

      const allAccounts = await window.web3.eth.getAccounts();
      setAccount(allAccounts[0]);
      await loadBlockchainData();
    } catch (error) {
      console.error("Error loading Web3: ", error);
      window.alert("An error occurred while loading Web3. Please try again.");
      setLoading(false);
    }
  };

  const loadBlockchainData = async () => {
    try {
      const web3 = window.web3 as Web3;

      const bettingContract = new web3.eth.Contract(
        Betting,
        "0x370D4C121079c507C2d279fD03F68205E0c516b0"
      );
      setPolymarket(bettingContract);
    } catch (error) {
      console.error("Error loading blockchain data: ", error);
      window.alert(
        "An error occurred while loading blockchain data. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return {
    account,
    polymarket,
    loading,
    loadWeb3,
    getBetData,
    getBets,
    getUserBets,
  };
};

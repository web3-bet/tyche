import { toNumber } from "lodash";
import moment from "moment";
import Img from "next/image";
import React from "react";
import Web3 from "web3";

export interface MarketProps {
  id: string;
  title: string;
  aTitle: string;
  bTitle: string;
  imageHash: string;
  totalAmount: string;
  totalYes: string;
  totalNo: string;
  userYes: string;
  userNo: string;
  description: string;
  userAveragePrice: string;
}

export const PortfolioMarketCard: React.FC<MarketProps> = ({
  title,
  aTitle,
  bTitle,
  userYes,
  userNo,
  id,
  imageHash,
  totalYes,
  totalNo,
  totalAmount,
  description,
  userAveragePrice,
}) => {
  var now = moment(new Date()); //todays date
  var daysLeft = moment.duration().asDays().toFixed(0);
  return (
    <div className="w-full overflow-hidden my-2">
      <div className="flex flex-col border border-gray-300 rounded-lg p-5 hover:border-blue-700 cursor-pointer">
        <div className="flex flex-row space-x-5 pb-4">
          <div className="h-w-15">
            <Img
              src={`${imageHash}`}
              className="rounded-full"
              width={55}
              height={55}
            />
          </div>
          <span className="text-lg font-semibold">{title}</span>
          <span className="text-lg font-semibold">{description}</span>
        </div>
        <div className="flex flex-row flex-nowrap justify-between items-center">
          <div className="flex flex-col space-y-1">
            <span className="text-sm text-gray-500 font-light">Chosen</span>
            <span className="text-base">{userYes ? aTitle : bTitle}</span>
          </div>
          <div className="flex flex-col space-y-1">
            <span className="text-xs text-gray-500 font-light">
              Amount Added
            </span>
            <span className="text-base">
              {Web3.utils.fromWei(userYes ?? userNo)} ETH
            </span>
          </div>
          <div className="flex flex-col space-y-1 items-end">
            <span className="text-xs text-gray-500 font-light">
              Current Price
            </span>
            <span className="text-base">
              {(toNumber(userYes ? totalYes : totalNo) /
                (toNumber(totalYes) + toNumber(totalNo))) *
                100}{" "}
              %{" "}
            </span>
            <span className="text-xs text-gray-500 font-light">
              User Average Price
            </span>
            <span className="text-base">
              {toNumber(userAveragePrice) * 100} %{" "}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

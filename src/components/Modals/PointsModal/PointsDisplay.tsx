import { type PointsModalState } from "@src/components/Panel/hooks/usePointsModal";
import {
  HiOutlineSparkles,
  HiOutlineClock,
  HiOutlineGift,
  HiOutlineExternalLink,
} from "react-icons/hi";
import { linkButtonStyle } from "@src/components/styles/Button.styles";

interface PointsDisplayProps {
  data: NonNullable<PointsModalState["points"]>;
}

export const PointsDisplay = ({ data }: PointsDisplayProps) => {
  const {
    points,
    firstDepositPointsClaimed,
    firstWithdrawalPointsClaimed,
    dailyPointsEarned,
    lastDailyReset,
  } = data;

  // Calculate tier based on points
  const getTierInfo = (points: number) => {
    if (points >= 10000)
      return { name: "Diamond", color: "text-blue-400", icon: "💎" };
    if (points >= 5000)
      return { name: "Gold", color: "text-yellow-400", icon: "🥇" };
    if (points >= 1000)
      return { name: "Silver", color: "text-gray-300", icon: "🥈" };
    return { name: "Bronze", color: "text-orange-400", icon: "🥉" };
  };

  const tierInfo = getTierInfo(points);

  // Format last daily reset date
  const formatLastReset = (date: Date) => {
    const resetDate = new Date(date);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - resetDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    return resetDate.toLocaleDateString();
  };

  // Calculate available bonus points
  const getAvailableBonuses = () => {
    const bonuses = [];
    if (!firstDepositPointsClaimed) bonuses.push("First Deposit Bonus");
    if (!firstWithdrawalPointsClaimed)
      bonuses.push("First Full Withdrawal Bonus");
    return bonuses;
  };

  const availableBonuses = getAvailableBonuses();

  return (
    <div className="py-8 w-full">
      {/* Main Points Display */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center mb-4">
          <span className={`text-2xl font-bold ${tierInfo.color}`}>
            {tierInfo.icon} {tierInfo.name} Tier
          </span>
        </div>

        <div className="text-5xl font-bold text-white mb-2">
          {points.toLocaleString()}
        </div>
        <div className="text-gray-300 text-lg">Points</div>
      </div>

      {/* Points Information Cards */}
      <div className="space-y-4">
        {/* Daily Points Earned */}
        {dailyPointsEarned > 0 && (
          <div className="bg-white/5 rounded-lg p-4 border border-white/10">
            <div className="flex items-center mb-2">
              <HiOutlineClock className="w-5 h-5 text-blue-400 mr-2" />
              <span className="text-white font-medium">Daily Points</span>
            </div>
            <div className="text-gray-300 text-sm">
              {dailyPointsEarned.toLocaleString()} points earned today
            </div>
            <div className="text-gray-400 text-xs mt-1">
              Last reset: {formatLastReset(lastDailyReset)}
            </div>
          </div>
        )}

        {/* Available Bonuses */}
        {availableBonuses.length > 0 && (
          <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-lg p-4 border border-green-500/20">
            <div className="flex items-center mb-2">
              <HiOutlineGift className="w-5 h-5 text-green-400 mr-2" />
              <span className="text-white font-medium">Available Bonuses</span>
            </div>
            <div className="text-gray-300 text-sm space-y-1">
              {availableBonuses.map((bonus, index) => (
                <div key={index}>• {bonus}</div>
              ))}
            </div>
          </div>
        )}

        {/* Claimed Bonuses */}
        {(firstDepositPointsClaimed || firstWithdrawalPointsClaimed) && (
          <div className="bg-white/5 rounded-lg p-4 border border-white/10">
            <div className="flex items-center mb-2">
              <HiOutlineSparkles className="w-5 h-5 text-yellow-400 mr-2" />
              <span className="text-white font-medium">Claimed Bonuses</span>
            </div>
            <div className="text-gray-300 text-sm space-y-1">
              {firstDepositPointsClaimed && <div>• First Deposit Bonus ✓</div>}
              {firstWithdrawalPointsClaimed && (
                <div>• First Full Withdrawal Bonus ✓</div>
              )}
            </div>
          </div>
        )}

        {/* Progress to Next Tier */}
        {points < 10000 && (
          <div className="bg-white/5 rounded-lg p-4 border border-white/10">
            <div className="text-white font-medium mb-2">
              Progress to Next Tier
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2 mb-2">
              <div
                className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${Math.min(100, (points / (points >= 5000 ? 10000 : points >= 1000 ? 5000 : 1000)) * 100)}%`,
                }}
              ></div>
            </div>
            <div className="text-gray-300 text-sm">
              {points >= 5000
                ? `${(10000 - points).toLocaleString()} points to Diamond tier`
                : points >= 1000
                  ? `${(5000 - points).toLocaleString()} points to Gold tier`
                  : `${(1000 - points).toLocaleString()} points to Silver tier`}
            </div>
          </div>
        )}

        {/* Read More Section */}
        <div className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-lg p-4 border border-blue-500/20">
          <a
            href="https://docs.zeroledger.wtf/overview/betta-testing-points"
            target="_blank"
            rel="noopener noreferrer"
            className={linkButtonStyle}
          >
            <HiOutlineExternalLink className="w-4 h-4" />
            Learn more about Zeroledger Betta Testing Points Program
          </a>
        </div>
      </div>
    </div>
  );
};

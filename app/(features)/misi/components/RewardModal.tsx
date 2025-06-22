import { Button } from "@/components/ui/button";
import Image from "next/image";

type Mission = {
  id: string;
  name: string;
  points_reward: number;
  xp_reward: number;
  badge?: string; // Menambahkan properti badge
};

interface RewardModalProps {
  isOpen: boolean;
  onClose: () => void;
  reward: {
    item: Mission;
    scaledPoints?: number;
    scaledXP?: number;
  } | null;
}

export function RewardModal({ isOpen, onClose, reward }: RewardModalProps) {
  if (!isOpen || !reward) return null;

  const { item, scaledPoints, scaledXP } = reward;
  
  // Determine badge image based on exact mission name
  let badgeImage = "/images/mission.svg"; // Default image

  if (item.name === "Login Streak!") {
    badgeImage = "/images/Login Streak.png";
  } else if (item.name === "Dictionary Diver!") {
    badgeImage = "/images/Dictionary Diver.png";
  } else if (item.name === "Lucky draw") {
    badgeImage = "/images/Lucky Spin.png";
  } else if (item.name === "Sign Master") {
    badgeImage = "/images/Sign Master.png";
  } else if (item.name === "Level Up!") {
    badgeImage = "/images/Level Up.png";
  } else if (item.name === "Word Warrior") {
    badgeImage = "/images/Word Warrior.png";
  }

  // Use custom badge if provided
  if (item.badge) {
    badgeImage = `/images/${item.badge}`;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg max-w-sm w-full">
        <h2 className="text-xl font-bold mb-4">{item.name}</h2>
        <div className="text-center mb-4">
          <div className="flex justify-center mb-4">
            <Image 
              src={badgeImage} 
              alt="Badge Reward" 
              width={100} 
              height={100} 
              className="rounded-full border-4 border-yellow-400"
            />
          </div>
          <p className="mb-2">Selamat kamu mendapatkan</p>
          <div className="flex justify-center gap-4">
            <p>+{scaledPoints || item.points_reward} 🪙</p>
            <p>EXP +{scaledXP || item.xp_reward}</p>
          </div>
        </div>
        <Button onClick={onClose} className="w-full">
          Lanjut
        </Button>
      </div>
    </div>
  );
}

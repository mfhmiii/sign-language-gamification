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
  
  // Menentukan badge berdasarkan nama misi atau menggunakan default
  const badgeImage = item.badge || 
    (item.name.toLowerCase().includes("beginner") ? "beginner.svg" :
     item.name.toLowerCase().includes("intermediate") ? "intermediate.svg" :
     item.name.toLowerCase().includes("expert") ? "expert.svg" :
     "mission.svg");

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg max-w-sm w-full">
        <h2 className="text-xl font-bold mb-4">{item.name}</h2>
        <div className="text-center mb-4">
          <div className="flex justify-center mb-4">
            <Image 
              src={`/images/${badgeImage}`} 
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

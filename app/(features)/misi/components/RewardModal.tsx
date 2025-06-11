import { Button } from "@/components/ui/button";
import Image from "next/image";

type Mission = {
  id: string;
  name: string;
  points_reward: number;
  xp_reward: number;
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg max-w-sm w-full">
        <h2 className="text-xl font-bold mb-4">{item.name}</h2>
        <div className="text-center mb-4">
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

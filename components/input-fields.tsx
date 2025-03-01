import { ReactNode } from "react";

interface InputFieldProps {
  type: string;
  label: string;
  icon: ReactNode;
  placeholder: string;
  name: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function InputField({
  type,
  label,
  icon,
  placeholder,
  name,
  value,
  onChange,
}: InputFieldProps) {
  return (
    <div className="flex flex-col w-full">
      {/* Label outside the input box */}
      <label className="text-gray-700 font-medium mb-1">{label}</label>

      <div className="flex items-center border border-gray-300 rounded-lg px-3 focus-within:border-green-500 bg-white">
        {icon}
        <input
          type={type}
          className="w-full p-2 outline-none bg-transparent"
          name={name}
          placeholder={placeholder}
          value={onChange ? value : undefined}
          onChange={onChange ? (e) => onChange(e) : undefined} 
        />
      </div>
    </div>
  );
}

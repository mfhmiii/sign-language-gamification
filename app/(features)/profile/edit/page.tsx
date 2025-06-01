"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { User, Mail, Lock, LogOut, Camera } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { updateProfile } from "../actions";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { signOutAction } from "@/app/actions";

export default function ProfilePage() {
  const router = useRouter();
  const supabase = createClient();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  useEffect(() => {
    async function loadUserData() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/sign-in");
        return;
      }

      const { data: userData } = await supabase
        .from("users")
        .select("username, email, profile_photo")
        .eq("id", user.id)
        .single();

      if (userData) {
        setFormData((prev) => ({
          ...prev,
          name: userData.username || "",
          email: userData.email,
        }));
        if (userData.profile_photo) {
          setImagePreview(userData.profile_photo);
        }
      }
    }

    loadUserData();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError(null);
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Image size should be less than 5MB");
      return;
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formDataObj = new FormData();
    formDataObj.append("name", formData.name);
    formDataObj.append("password", formData.password);
    formDataObj.append("confirmPassword", formData.confirmPassword);

    if (imageFile) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const fileExt = imageFile.name.split(".").pop();
        const fileName = `${user.id}-${Date.now()}.${fileExt}`;

        const { error: uploadError, data } = await supabase.storage
          .from("profile.picture")
          .upload(fileName, imageFile);

        if (uploadError) {
          setError("Failed to upload image");
          return;
        }

        const {
          data: { publicUrl },
        } = supabase.storage.from("profile.picture").getPublicUrl(fileName);

        formDataObj.append("profile_photo", publicUrl);
      }
    }

    const result = await updateProfile(formDataObj);

    if (result.error) {
      setError(result.error);
    } else {
      router.push("/profile/view");
    }
  };

  // Logout confirmation modal
  const LogoutConfirmationModal = () => {
    if (!showLogoutModal) return null;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg max-w-sm w-full">
          <h2 className="text-xl font-bold mb-4">Konfirmasi Logout</h2>
          <p className="mb-6">Apakah Anda yakin ingin keluar dari aplikasi?</p>
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={() => setShowLogoutModal(false)} 
              className="w-full"
            >
              Batal
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => signOutAction()} 
              className="w-full"
            >
              Logout
            </Button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-md mx-auto p-4">
      <div className="flex flex-col items-center mb-6">
        <div className="relative w-24 h-24 rounded-full overflow-hidden bg-gray-200 mb-2">
          {imagePreview ? (
            <Image
              src={imagePreview}
              alt="Profile"
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <User size={48} className="text-gray-400" />
            </div>
          )}
          <label
            htmlFor="profile-photo"
            className="absolute bottom-0 right-0 p-1 bg-white rounded-full cursor-pointer shadow-lg hover:bg-gray-100"
          >
            <Camera size={20} className="text-gray-600" />
          </label>
          <input
            type="file"
            id="profile-photo"
            accept="image/*"
            className="hidden"
            onChange={handleImageChange}
          />
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium mb-1">
            Nama
          </label>
          <Input
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            icon={<User size={20} className="text-green-500" />}
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-1">
            Email
          </label>
          <Input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            icon={<Mail size={20} className="text-green-500" />}
            readOnly
            className="bg-gray-50"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium mb-1">
            Password Baru
          </label>
          <Input
            id="password"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            icon={<Lock size={20} className="text-green-500" />}
            showPasswordToggle
          />
        </div>

        <div>
          <label
            htmlFor="confirmPassword"
            className="block text-sm font-medium mb-1"
          >
            Ulangi Password
          </label>
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            value={formData.confirmPassword}
            onChange={handleChange}
            icon={<Lock size={20} className="text-green-500" />}
            showPasswordToggle
          />
        </div>

        <div className="pt-4">
          <Button
            className="w-full bg-green-500 hover:bg-green-600"
            type="submit"
          >
            Simpan
          </Button>
        </div>

        <div>
          <Button
            variant="outline"
            className="w-full"
            type="button"
            onClick={() => router.push("/profile/get")}
          >
            Batal
          </Button>
        </div>

        <div>
          <Button
            variant="outline"
            className="w-full text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600"
            type="button"
            onClick={() => setShowLogoutModal(true)}
          >
            <LogOut className="mr-2 h-4 w-4" /> Logout
          </Button>
        </div>
      </form>
      
      <LogoutConfirmationModal />
    </div>
  );
}

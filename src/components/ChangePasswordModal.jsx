import { useState } from "react";
import { X, Lock, Eye, EyeOff } from "lucide-react";
import { Button, TextField } from "../ui-components";
import { changePassword } from "../api/auth.api";
import { useTranslation } from "react-i18next";

export default function ChangePasswordModal({ open, onClose }) {
  const { t } = useTranslation();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (newPassword !== confirmPassword) {
      setError(t("changePassword.errorMismatch"));
      return;
    }

    if (newPassword.length < 6) {
      setError(t("changePassword.errorTooShort"));
      return;
    }

    if (newPassword === currentPassword) {
      setError(t("changePassword.errorSameAsCurrent"));
      return;
    }

    setLoading(true);
    try {
      await changePassword({
        currentPassword,
        newPassword,
      });
      setSuccess(true);
      setTimeout(() => {
        handleClose();
      }, 2000);
    } catch (err) {
      setError(err?.message || t("changePassword.errorFailed"));
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setError("");
    setSuccess(false);
    setShowCurrentPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 p-6 pb-4">
          <h2 className="text-xl font-semibold text-gray-900">{t("changePassword.title")}</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition"
            disabled={loading}
          >
            <X size={24} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Current Password */}
          <div className="relative">
            <TextField
              label={t("changePassword.currentPassword")}
              type={showCurrentPassword ? "text" : "password"}
              icon={<Lock size={18} />}
              placeholder={t("changePassword.currentPasswordPlaceholder")}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              variant={error && !success ? "error" : "default"}
            />
            <button
              type="button"
              onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              className="absolute right-3 top-10 text-gray-500 hover:text-gray-700"
            >
              {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {/* New Password */}
          <div className="relative">
            <TextField
              label={t("changePassword.newPassword")}
              type={showNewPassword ? "text" : "password"}
              icon={<Lock size={18} />}
              placeholder={t("changePassword.newPasswordPlaceholder")}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              variant={error && !success ? "error" : "default"}
            />
            <button
              type="button"
              onClick={() => setShowNewPassword(!showNewPassword)}
              className="absolute right-3 top-10 text-gray-500 hover:text-gray-700"
            >
              {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {/* Confirm Password */}
          <div className="relative">
            <TextField
              label={t("changePassword.confirmPassword")}
              type={showConfirmPassword ? "text" : "password"}
              icon={<Lock size={18} />}
              placeholder={t("changePassword.confirmPasswordPlaceholder")}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              variant={error && !success ? "error" : "default"}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-10 text-gray-500 hover:text-gray-700"
            >
              {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-600">{t("changePassword.successMessage")}</p>
            </div>
          )}

          {/* Password Requirements */}
          <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
            <p className="text-xs text-gray-600 mb-1 font-medium">{t("changePassword.requirements")}</p>
            <ul className="text-xs text-gray-500 space-y-0.5">
              <li>• {t("changePassword.reqMinLength")}</li>
              <li>• {t("changePassword.reqDifferent")}</li>
            </ul>
          </div>

          {/* Footer Buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={handleClose}
              disabled={loading}
              className="flex-1"
            >
              {t("common.cancel")}
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={loading}
              disabled={loading || !currentPassword || !newPassword || !confirmPassword || success}
              className="flex-1"
            >
              {t("changePassword.submit")}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

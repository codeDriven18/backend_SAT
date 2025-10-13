import React, { useRef, useState } from 'react';
import useAuthStore from '../store/useAuthStore';

const ProfileSettings = () => {
  const fileRef = useRef(null);
  const { user, updateProfilePicture } = useAuthStore();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const onPick = () => fileRef.current?.click();
  const onFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');
    setUploading(true);
    const res = await updateProfilePicture(file);
    if (!res.success) setError(res.error || 'Upload failed');
    setUploading(false);
  };

  const avatar = user?.profile_picture;

  return (
    <div className="max-w-md">
      <div className="flex items-center space-x-4">
        <img
          src={avatar || 'https://via.placeholder.com/80?text=Avatar'}
          alt="avatar"
          className="w-20 h-20 rounded-full object-cover border"
        />
        <div>
          <div className="font-medium">{user?.username}</div>
          <button
            type="button"
            onClick={onPick}
            className="mt-2 px-3 py-1 rounded bg-emerald-600 text-white text-sm hover:bg-emerald-700 disabled:bg-emerald-300"
            disabled={uploading}
          >
            {uploading ? 'Uploading...' : 'Change photo'}
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFile} />
        </div>
      </div>
      {error && <div className="mt-3 text-sm text-red-600">{error}</div>}
    </div>
  );
};

export default ProfileSettings;







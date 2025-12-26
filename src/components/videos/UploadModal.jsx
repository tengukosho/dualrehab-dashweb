import { useState } from 'react';
import { X, Upload } from 'lucide-react';
import { videos, categories } from '../../services/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export default function UploadModal({ isOpen, onClose }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    categoryId: '',
    difficultyLevel: 'beginner',
    duration: 0,
    instructions: '',
  });
  const [videoFile, setVideoFile] = useState(null);
  const [thumbnailFile, setThumbnailFile] = useState(null);

  const queryClient = useQueryClient();

  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categories.getAll().then(res => res.data),
  });

  const uploadMutation = useMutation({
    mutationFn: async (data) => {
      const formDataObj = new FormData();
      if (videoFile) formDataObj.append('video', videoFile);
      if (thumbnailFile) formDataObj.append('thumbnail', thumbnailFile);
      formDataObj.append('title', data.title);
      formDataObj.append('description', data.description);
      formDataObj.append('categoryId', data.categoryId);
      formDataObj.append('difficultyLevel', data.difficultyLevel);
      formDataObj.append('duration', data.duration);
      formDataObj.append('instructions', data.instructions);
      
      return videos.create(formDataObj);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['videos']);
      alert('Video uploaded successfully!');
      onClose();
      // Reset form
      setFormData({
        title: '',
        description: '',
        categoryId: '',
        difficultyLevel: 'beginner',
        duration: 0,
        instructions: '',
      });
      setVideoFile(null);
      setThumbnailFile(null);
    },
    onError: (error) => {
      alert('Upload failed: ' + (error.response?.data?.error || error.message));
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!videoFile) {
      alert('Please select a video file');
      return;
    }
    uploadMutation.mutate(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Upload Video</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            disabled={uploadMutation.isPending}
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Video File */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Video File * {videoFile && <span className="text-green-600">âœ“ {videoFile.name}</span>}
            </label>
            <input
              type="file"
              accept="video/*"
              onChange={(e) => setVideoFile(e.target.files[0])}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm file:mr-4 file:rounded-md file:border-0 file:bg-primary-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-primary-700 hover:file:bg-primary-100"
              required
              disabled={uploadMutation.isPending}
            />
          </div>

          {/* Thumbnail */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Thumbnail (optional) {thumbnailFile && <span className="text-green-600">âœ“ {thumbnailFile.name}</span>}
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setThumbnailFile(e.target.files[0])}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm file:mr-4 file:rounded-md file:border-0 file:bg-primary-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-primary-700 hover:file:bg-primary-100"
              disabled={uploadMutation.isPending}
            />
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Title *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              placeholder="e.g., Upper Body Stretching"
              required
              disabled={uploadMutation.isPending}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              placeholder="Brief description of the exercise..."
              disabled={uploadMutation.isPending}
            />
          </div>

          {/* Instructions */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Instructions</label>
            <textarea
              value={formData.instructions}
              onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
              rows={3}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              placeholder="Step-by-step instructions..."
              disabled={uploadMutation.isPending}
            />
          </div>

          {/* Category and Difficulty Row */}
          <div className="grid grid-cols-2 gap-4">
            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Category *</label>
              <select
                value={formData.categoryId}
                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                required
                disabled={uploadMutation.isPending}
              >
                <option value="">Select category</option>
                {categoriesData?.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Difficulty */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Difficulty *</label>
              <select
                value={formData.difficultyLevel}
                onChange={(e) => setFormData({ ...formData, difficultyLevel: e.target.value })}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                disabled={uploadMutation.isPending}
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
          </div>

          {/* Duration */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Duration (seconds) *</label>
            <input
              type="number"
              value={formData.duration}
              onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 0 })}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              placeholder="e.g., 300 (5 minutes)"
              min="0"
              required
              disabled={uploadMutation.isPending}
            />
            <p className="mt-1 text-xs text-gray-500">
              {formData.duration > 0 && `â‰ˆ ${Math.floor(formData.duration / 60)} min ${formData.duration % 60} sec`}
            </p>
          </div>

          {/* Buttons */}
          <div className="flex justify-end space-x-3 border-t pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              disabled={uploadMutation.isPending}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={uploadMutation.isPending}
              className="flex items-center rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
            >
              {uploadMutation.isPending ? (
                <>
                  <svg className="mr-2 h-4 w-4 animate-spin" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Video
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

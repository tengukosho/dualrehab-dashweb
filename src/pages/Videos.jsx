import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { videos, categories } from '../services/api';
import { Plus, Upload, Pencil, Trash2 } from 'lucide-react';
import UploadModal from '../components/videos/UploadModal';

export default function Videos() {
  const [showUpload, setShowUpload] = useState(false);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['videos'],
    queryFn: () => videos.getAll().then(res => res.data),
  });

  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categories.getAll().then(res => res.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => videos.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['videos']);
    },
  });

  if (isLoading) return <div className="p-8">Loading...</div>;

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Videos</h1>
        <button
          onClick={() => setShowUpload(true)}
          className="flex items-center rounded-lg bg-primary-600 px-4 py-2 text-white hover:bg-primary-700"
        >
          <Plus className="mr-2 h-5 w-5" />
          Upload Video
        </button>
      </div>

      <div className="rounded-lg bg-white shadow">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Title</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Category</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Duration</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Difficulty</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {data?.videos?.map((video) => (
                <tr key={video.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-900">{video.title}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{video.category?.name || 'N/A'}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{Math.floor(video.duration / 60)}:{String(video.duration % 60).padStart(2, '0')}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800">
                      {video.difficultyLevel}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <div className="flex space-x-2">
                      <button className="text-blue-600 hover:text-blue-800">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => deleteMutation.mutate(video.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <UploadModal isOpen={showUpload} onClose={() => setShowUpload(false)} />
    </div>
  );
}

import { useCallback, useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload as UploadIcon, X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Button } from '@/components/ui/Button';
import { supabase } from '@/lib/supabase';
import { useNavigate } from 'react-router-dom';
import AgentProfileForm from '@/components/AgentProfileForm';
import { useCallProcessing } from '@/hooks/useCallProcessing';

export default function Upload() {
  useCallProcessing(); // Add this hook to start processing calls
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [hasAgentProfile, setHasAgentProfile] = useState<boolean | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    checkAgentProfile();
  }, []);

  const checkAgentProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      const { data: agent } = await supabase
        .from('agents')
        .select('id')
        .eq('user_id', user.id)
        .single();

      setHasAgentProfile(!!agent);
    } catch (error) {
      console.error('Error checking agent profile:', error);
      setHasAgentProfile(false);
    }
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const validFiles = acceptedFiles.filter(file => 
      file.type === 'audio/wav' || file.type === 'audio/mpeg'
    );

    if (validFiles.length !== acceptedFiles.length) {
      toast.error('Some files were rejected. Only WAV and MP3 files are supported.');
    }

    setFiles(prev => [...prev, ...validFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'audio/wav': ['.wav'],
      'audio/mpeg': ['.mp3']
    },
    maxFiles: 1000
  });

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (files.length === 0) return;

    setUploading(true);
    try {
      const { data: agentData } = await supabase
        .from('agents')
        .select('id')
        .single();

      if (!agentData?.id) {
        throw new Error('Agent profile not found');
      }

      for (const file of files) {
        const fileName = `${Date.now()}-${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from('call-recordings')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { error: dbError } = await supabase
          .from('calls')
          .insert({
            agent_id: agentData.id,
            file_path: fileName,
            call_date: new Date().toISOString(),
            status: 'pending'
          });

        if (dbError) throw dbError;
      }

      toast.success('Files uploaded successfully');
      navigate('/library');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload files');
    } finally {
      setUploading(false);
    }
  };

  if (hasAgentProfile === null) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    );
  }

  if (!hasAgentProfile) {
    return (
      <div className="max-w-md mx-auto">
        <AgentProfileForm onComplete={() => setHasAgentProfile(true)} />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white shadow rounded-lg">
        <div className="p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Upload Calls</h2>
          
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center ${
              isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
            }`}
          >
            <input {...getInputProps()} />
            <UploadIcon className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-2 text-sm text-gray-600">
              Drag and drop audio files here, or click to select files
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Supports WAV and MP3 files (max 1000 files)
            </p>
          </div>

          {files.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-medium text-gray-900 mb-3">
                Selected Files ({files.length})
              </h3>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {files.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between bg-gray-50 p-2 rounded"
                  >
                    <span className="text-sm text-gray-600">{file.name}</span>
                    <button
                      onClick={() => removeFile(index)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="mt-4">
                <Button
                  onClick={handleUpload}
                  isLoading={uploading}
                  disabled={uploading}
                  className="w-full"
                >
                  Upload {files.length} {files.length === 1 ? 'file' : 'files'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
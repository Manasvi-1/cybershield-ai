import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, File, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface UploadedFile {
  file: File;
  progress: number;
  status: 'uploading' | 'processing' | 'complete' | 'error';
  result?: any;
}

interface FileUploadProps {
  onFileAnalyzed: (result: any) => void;
  accept?: Record<string, string[]>;
  maxSize?: number;
}

export function FileUpload({ 
  onFileAnalyzed, 
  accept = {
    'image/*': ['.jpg', '.jpeg', '.png', '.gif'],
    'video/*': ['.mp4', '.avi', '.mov', '.wmv']
  },
  maxSize = 100 * 1024 * 1024 // 100MB
}: FileUploadProps) {
  const [files, setFiles] = useState<UploadedFile[]>([]);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const newFiles = acceptedFiles.map(file => ({
      file,
      progress: 0,
      status: 'uploading' as const
    }));

    setFiles(prev => [...prev, ...newFiles]);

    // Process each file
    for (let i = 0; i < newFiles.length; i++) {
      const uploadedFile = newFiles[i];
      const fileIndex = files.length + i;

      try {
        // Simulate upload progress
        for (let progress = 0; progress <= 100; progress += 10) {
          await new Promise(resolve => setTimeout(resolve, 100));
          setFiles(prev => 
            prev.map((f, idx) => 
              idx === fileIndex ? { ...f, progress } : f
            )
          );
        }

        // Update status to processing
        setFiles(prev => 
          prev.map((f, idx) => 
            idx === fileIndex ? { ...f, status: 'processing' } : f
          )
        );

        // Send file for analysis
        const formData = new FormData();
        formData.append('file', uploadedFile.file);

        const response = await fetch('/api/analyze/deepfake', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error('Analysis failed');
        }

        const result = await response.json();

        // Update file status and result
        setFiles(prev => 
          prev.map((f, idx) => 
            idx === fileIndex 
              ? { ...f, status: 'complete', result } 
              : f
          )
        );

        onFileAnalyzed(result);
      } catch (error) {
        console.error('File analysis error:', error);
        setFiles(prev => 
          prev.map((f, idx) => 
            idx === fileIndex ? { ...f, status: 'error' } : f
          )
        );
      }
    }
  }, [files.length, onFileAnalyzed]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    maxSize,
    multiple: true
  });

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, idx) => idx !== index));
  };

  const getStatusColor = (status: UploadedFile['status']) => {
    switch (status) {
      case 'uploading': return 'text-primary';
      case 'processing': return 'text-warning';
      case 'complete': return 'text-success';
      case 'error': return 'text-destructive';
    }
  };

  const getStatusText = (status: UploadedFile['status']) => {
    switch (status) {
      case 'uploading': return 'Uploading...';
      case 'processing': return 'Processing...';
      case 'complete': return 'Complete';
      case 'error': return 'Error';
    }
  };

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
          isDragActive
            ? "border-primary bg-primary/10"
            : "border-gray-600 hover:border-primary"
        )}
      >
        <input {...getInputProps()} />
        <Upload className="mx-auto h-12 w-12 text-text-secondary mb-4" />
        <p className="text-text-secondary mb-2">
          {isDragActive
            ? "Drop the files here..."
            : "Drag and drop your image or video files here"
          }
        </p>
        <p className="text-sm text-text-secondary mb-4">or</p>
        <Button type="button" className="bg-primary hover:bg-primary/90">
          Browse Files
        </Button>
        <p className="text-xs text-text-secondary mt-4">
          Supported formats: JPG, PNG, MP4, AVI (Max 100MB)
        </p>
      </div>

      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((uploadedFile, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-4 bg-background rounded-lg"
            >
              <div className="flex items-center space-x-3 flex-1">
                <File className="h-5 w-5 text-primary" />
                <div className="flex-1">
                  <p className="text-sm text-white font-medium">
                    {uploadedFile.file.name}
                  </p>
                  <div className="flex items-center space-x-2 mt-1">
                    {uploadedFile.status === 'uploading' && (
                      <Progress value={uploadedFile.progress} className="w-24 h-2" />
                    )}
                    <span className={cn("text-xs", getStatusColor(uploadedFile.status))}>
                      {getStatusText(uploadedFile.status)}
                    </span>
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeFile(index)}
                className="text-text-secondary hover:text-white p-1"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

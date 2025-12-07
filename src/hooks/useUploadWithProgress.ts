import { useState, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface UploadProgress {
  progress: number;
  isUploading: boolean;
  error: string | null;
}

export function useUploadWithProgress() {
  const [uploadState, setUploadState] = useState<UploadProgress>({
    progress: 0,
    isUploading: false,
    error: null,
  });
  const abortControllerRef = useRef<AbortController | null>(null);

  const uploadFile = useCallback(async (
    bucket: string,
    path: string,
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<{ publicUrl: string } | null> => {
    setUploadState({ progress: 0, isUploading: true, error: null });
    abortControllerRef.current = new AbortController();

    try {
      // Get the upload URL and token
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;
      
      if (!accessToken) {
        throw new Error("Not authenticated");
      }

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const uploadUrl = `${supabaseUrl}/storage/v1/object/${bucket}/${path}`;

      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        
        xhr.upload.addEventListener("progress", (event) => {
          if (event.lengthComputable) {
            const percentComplete = (event.loaded / event.total) * 100;
            setUploadState(prev => ({ ...prev, progress: percentComplete }));
            onProgress?.(percentComplete);
          }
        });

        xhr.addEventListener("load", () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            // Get public URL
            const { data: { publicUrl } } = supabase.storage
              .from(bucket)
              .getPublicUrl(path);
            
            setUploadState({ progress: 100, isUploading: false, error: null });
            resolve({ publicUrl });
          } else {
            const error = `Upload failed: ${xhr.statusText}`;
            setUploadState({ progress: 0, isUploading: false, error });
            reject(new Error(error));
          }
        });

        xhr.addEventListener("error", () => {
          const error = "Upload failed";
          setUploadState({ progress: 0, isUploading: false, error });
          reject(new Error(error));
        });

        xhr.addEventListener("abort", () => {
          setUploadState({ progress: 0, isUploading: false, error: "Upload cancelled" });
          reject(new Error("Upload cancelled"));
        });

        // Store reference for cancellation
        abortControllerRef.current?.signal.addEventListener("abort", () => {
          xhr.abort();
        });

        xhr.open("POST", uploadUrl);
        xhr.setRequestHeader("Authorization", `Bearer ${accessToken}`);
        xhr.setRequestHeader("x-upsert", "false");
        xhr.send(file);
      });
    } catch (error: any) {
      setUploadState({ progress: 0, isUploading: false, error: error.message });
      throw error;
    }
  }, []);

  const cancelUpload = useCallback(() => {
    abortControllerRef.current?.abort();
  }, []);

  const resetUpload = useCallback(() => {
    setUploadState({ progress: 0, isUploading: false, error: null });
  }, []);

  return {
    ...uploadState,
    uploadFile,
    cancelUpload,
    resetUpload,
  };
}

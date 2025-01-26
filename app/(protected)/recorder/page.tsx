'use client'
import { useEffect, useRef, useState } from 'react';


import { useCurrentUser } from '@/hooks/use-current-user';

export default  function Recorder() {
  const user = useCurrentUser();
  const [isRecording, setIsRecording] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const toolbarRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let mediaRecorder: MediaRecorder | null = null;
    let recordedChunks: Blob[] = [];

    const startButton = document.getElementById('startRecording') as HTMLButtonElement;
    const stopButton = document.getElementById('stopRecording') as HTMLButtonElement;
    const videoElement = document.getElementById('playback') as HTMLVideoElement;

    const handleStartRecording = async () => {
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        mediaRecorder = new MediaRecorder(stream);

        mediaRecorder.ondataavailable = (event: BlobEvent) => {
          if (event.data.size > 0) {
            recordedChunks.push(event.data);
          }
        };

        mediaRecorder.onstop = () => {
          const blob = new Blob(recordedChunks, { type: 'video/webm' });
          const url = URL.createObjectURL(blob);
          videoElement.src = url;
          videoElement.style.display = 'block';

          const downloadLink = document.createElement('a');
          downloadLink.href = url;
          downloadLink.download = 'recording.webm';
          downloadLink.textContent = 'Download Recording';
          document.body.appendChild(downloadLink);
        };

        mediaRecorder.start();
        setIsRecording(true);
        startButton.disabled = true;
        stopButton.disabled = false;
      } catch (error) {
        console.error('Error starting recording:', error);
      }
    };

    const handleStopRecording = () => {
      if (mediaRecorder) {
        mediaRecorder.stop();
      }
      setIsRecording(false);
      startButton.disabled = false;
      stopButton.disabled = true;
    };

    startButton.addEventListener('click', handleStartRecording);
    stopButton.addEventListener('click', handleStopRecording);

    return () => {
      startButton.removeEventListener('click', handleStartRecording);
      stopButton.removeEventListener('click', handleStopRecording);
    };
  }, []);

  const handleDragStart = (e: React.MouseEvent<HTMLButtonElement>) => {
    const toolbar = toolbarRef.current;
    if (toolbar) {
      // Calculate offset between the mouse and the toolbar's top-left corner
      const rect = toolbar.getBoundingClientRect();
      setDragOffset({ x: e.clientX - rect.left, y: e.clientY - rect.top });
      setIsDragging(true);
    }
  };

  const handleDragMove = (e: MouseEvent) => {
    if (isDragging) {
      const toolbar = toolbarRef.current;
      if (toolbar) {
        toolbar.style.left = `${e.clientX - dragOffset.x}px`;
        toolbar.style.top = `${e.clientY - dragOffset.y}px`;
      }
    }
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    // Attach mousemove and mouseup handlers globally during dragging
    if (isDragging) {
      window.addEventListener('mousemove', handleDragMove);
      window.addEventListener('mouseup', handleDragEnd);
    }
    return () => {
      window.removeEventListener('mousemove', handleDragMove);
      window.removeEventListener('mouseup', handleDragEnd);
    };
  }, [isDragging, dragOffset]);

  return (
    <div className='h-[400px] w-[800px]'>
      <h1>Screen Recorder</h1>
      <button id="startRecording">Start Recording</button>
      <button id="stopRecording" disabled>
        Stop Recording
      </button>
      <video id="playback" controls style={{ display: 'none' }}></video>

      {/* Toolbar */}
      {isRecording && (
        <div
          ref={toolbarRef}
          style={{
            position: 'absolute',
            top: '50px',
            left: '50px',
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            color: 'white',
            padding: '10px',
            borderRadius: '5px',
            cursor: isDragging ? 'grabbing' : 'default',
            zIndex: 1000,
          }}
        >
          <h4>Toolbar</h4>
          <button
            onMouseDown={handleDragStart}
            style={{ cursor: 'grab' }}
          >
            Drag
          </button>
          <button onClick={() => alert('Pen Tool Selected')}>Pen</button>
          <button onClick={() => alert('Text Tool Selected')}>Text</button>
          <button onClick={() => alert('Shape Tool Selected')}>Shapes</button>
        </div>
      )}
    </div>
  );
}
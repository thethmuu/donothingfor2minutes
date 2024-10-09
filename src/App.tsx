import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AlertCircle, Volume2, VolumeX } from 'lucide-react';
import { createAudioFile } from './createAudio';

function App() {
  const [timeLeft, setTimeLeft] = useState(120); // 2 minutes in seconds
  const [isActive, setIsActive] = useState(false);
  const [hasFailed, setHasFailed] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [audioError, setAudioError] = useState(false);
  const [audioSrc, setAudioSrc] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    createAudioFile().then(setAudioSrc).catch(() => setAudioError(true));
  }, []);

  const resetTimer = useCallback(() => {
    setTimeLeft(120);
    setIsActive(false);
    setHasFailed(false);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  }, []);

  const handleFailure = useCallback(() => {
    setHasFailed(true);
    setIsActive(false);
    if (audioRef.current) {
      audioRef.current.pause();
    }
  }, []);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && isActive) {
        handleFailure();
      }
    };

    const handleMouseMove = () => {
      if (isActive) {
        handleFailure();
      }
    };

    const handleKeyDown = () => {
      if (isActive) {
        handleFailure();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isActive, handleFailure]);

  useEffect(() => {
    let interval: number | undefined;

    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((time) => time - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsActive(false);
      if (audioRef.current) {
        audioRef.current.pause();
      }
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, timeLeft]);

  const startTimer = () => {
    setIsActive(true);
    setHasFailed(false);
    if (audioRef.current && !audioError) {
      audioRef.current.play().catch(() => {
        setAudioError(true);
      });
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
    }
  };

  const handleAudioError = () => {
    setAudioError(true);
  };

  return (
    <div className="min-h-screen bg-cover bg-center flex items-center justify-center" style={{backgroundImage: 'url("https://images.pexels.com/photos/3759660/pexels-photo-3759660.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2")'}}>
      <div className="bg-white bg-opacity-80 p-8 rounded-lg shadow-md text-center">
        <h1 className="text-3xl font-bold mb-6">Do Nothing for 2 Minutes</h1>
        <div className="text-6xl font-mono mb-8">{formatTime(timeLeft)}</div>
        {!isActive && !hasFailed && timeLeft === 120 && (
          <button
            onClick={startTimer}
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
          >
            Start
          </button>
        )}
        {hasFailed && (
          <div className="text-red-500 flex items-center justify-center mb-4">
            <AlertCircle className="mr-2" />
            <span>You moved! Try again.</span>
          </div>
        )}
        {(hasFailed || timeLeft === 0) && (
          <button
            onClick={resetTimer}
            className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded"
          >
            Reset
          </button>
        )}
        {isActive && (
          <p className="text-gray-600 mt-4">Don't move your mouse or use your keyboard!</p>
        )}
        {timeLeft === 0 && (
          <p className="text-green-500 font-bold mt-4">Congratulations! You did it!</p>
        )}
        {!audioError && audioSrc && (
          <button
            onClick={toggleMute}
            className="mt-4 text-gray-500 hover:text-gray-700"
            aria-label={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
          </button>
        )}
        {audioError && (
          <p className="text-yellow-500 mt-4">Audio unavailable. Enjoy the silence!</p>
        )}
      </div>
      {audioSrc && (
        <audio
          ref={audioRef}
          src={audioSrc}
          loop
          onError={handleAudioError}
        />
      )}
    </div>
  );
}

export default App;
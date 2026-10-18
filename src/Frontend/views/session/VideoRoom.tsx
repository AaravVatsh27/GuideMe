"use client";

import { useState } from "react";
import { Mic, MicOff, Video, VideoOff, PhoneOff } from "lucide-react";
import { Button } from "@/Frontend/components/ui/button";

interface VideoRoomProps {
  sessionId: string;
}

export default function VideoRoom({ sessionId }: VideoRoomProps) {
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  void sessionId;

  return (
    <div className="relative flex flex-col h-full bg-slate-950 rounded-3xl overflow-hidden shadow-2xl">
      {/* Video Grid Placeholder */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
        <div className="relative bg-slate-900 rounded-2xl flex items-center justify-center border border-slate-800">
          <p className="text-slate-400 text-sm font-medium">Remote Participant</p>
          <div className="absolute bottom-4 left-4 flex items-center gap-2 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
            <div className="size-2 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-xs text-white">Mentor</span>
          </div>
        </div>
        
        <div className="relative bg-slate-900 rounded-2xl flex items-center justify-center border border-slate-800">
          {isVideoOff ? (
            <div className="flex flex-col items-center gap-3">
              <div className="size-20 bg-slate-800 rounded-full flex items-center justify-center">
                <VideoOff className="size-8 text-slate-500" />
              </div>
              <p className="text-slate-500 text-sm">Your camera is off</p>
            </div>
          ) : (
            <p className="text-slate-400 text-sm font-medium">Your Preview</p>
          )}
          <div className="absolute bottom-4 left-4 flex items-center gap-2 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
            <span className="text-xs text-white">You</span>
            {isMuted && <MicOff className="size-3 text-rose-500" />}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="p-6 bg-slate-900/50 backdrop-blur-xl border-t border-slate-800 flex items-center justify-center gap-4">
        <Button
          variant={isMuted ? "destructive" : "secondary"}
          size="icon"
          className="size-12 rounded-full"
          onClick={() => setIsMuted(!isMuted)}
        >
          {isMuted ? <MicOff className="size-5" /> : <Mic className="size-5" />}
        </Button>
        
        <Button
          variant={isVideoOff ? "destructive" : "secondary"}
          size="icon"
          className="size-12 rounded-full"
          onClick={() => setIsVideoOff(!isVideoOff)}
        >
          {isVideoOff ? <VideoOff className="size-5" /> : <Video className="size-5" />}
        </Button>

        <Button
          variant="destructive"
          size="lg"
          className="px-8 rounded-full bg-rose-600 hover:bg-rose-700"
        >
          <PhoneOff className="size-5 mr-2" />
          End Session
        </Button>
      </div>
    </div>
  );
}

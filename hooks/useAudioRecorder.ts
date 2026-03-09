/**
 * 오디오 녹음 훅 — MediaRecorder API 래퍼
 *
 * Phase 3.5: 마이크 버튼으로 음성 녹음 → webm/opus Blob 반환
 *
 * 기능:
 * - 녹음 시작/중지
 * - 녹음 상태 관리 (isRecording)
 * - 브라우저 마이크 권한 요청
 * - 녹음 완료 시 onComplete 콜백으로 Blob 전달
 */

import { useRef, useState, useCallback } from "react";

interface UseAudioRecorderOptions {
  onComplete: (blob: Blob) => void;
}

export function useAudioRecorder({ onComplete }: UseAudioRecorderOptions) {
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  // 녹음 시작 — 마이크 권한 요청 + MediaRecorder 생성
  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // webm/opus 우선, 미지원 시 기본 포맷
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";

      const recorder = new MediaRecorder(stream, { mimeType });
      chunksRef.current = [];

      // 녹음 데이터 청크 수집
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      // 녹음 종료 시 Blob 조합 → 콜백 호출
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        // 마이크 스트림 해제
        stream.getTracks().forEach((track) => track.stop());
        onComplete(blob);
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
    } catch (err) {
      console.error("마이크 접근 실패:", err);
    }
  }, [onComplete]);

  // 녹음 중지
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
      setIsRecording(false);
    }
  }, []);

  return { isRecording, startRecording, stopRecording };
}

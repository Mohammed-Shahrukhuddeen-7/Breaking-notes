import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { completePomodoro } from "@/lib/rewards.functions";

type Preset = 25 | 50;

type TimerCtx = {
  duration: Preset;
  remaining: number;
  running: boolean;
  setDuration: (d: Preset) => void;
  start: () => void;
  pause: () => void;
  reset: () => void;
};

const Ctx = createContext<TimerCtx | null>(null);

export function TimerProvider({ children, userId }: { children: ReactNode; userId: string }) {
  const [duration, setDurationState] = useState<Preset>(25);
  const [remaining, setRemaining] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const qc = useQueryClient();
  const completeFn = useServerFn(completePomodoro);
  const completingRef = useRef(false);

  useEffect(() => {
    if (!running) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running]);

  const handleComplete = useCallback(async () => {
    if (completingRef.current) return;
    completingRef.current = true;
    playBell();
    if (
      typeof window !== "undefined" &&
      "Notification" in window &&
      Notification.permission === "granted"
    ) {
      new Notification("Pomodoro complete! 🎉", {
        body: `You finished a ${duration}-minute session.`,
      });
    }
    try {
      const res = await completeFn({ data: { durationMinutes: duration } });
      toast.success(`+${res.points} points awarded!`, { description: "Streak updated 🔥" });
      qc.setQueryData(["sessions", userId], (current: (typeof res.session)[] | undefined) =>
        [res.session, ...(current ?? []).filter((session) => session.id !== res.session.id)].slice(
          0,
          10,
        ),
      );
      qc.invalidateQueries({ queryKey: ["sessions", userId] });
      qc.invalidateQueries({ queryKey: ["profile", userId] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save session");
    } finally {
      setRemaining(duration * 60);
      completingRef.current = false;
    }
  }, [completeFn, duration, qc, userId]);

  useEffect(() => {
    if (remaining === 0 && running) setRunning(false);
  }, [remaining, running]);

  useEffect(() => {
    if (remaining === 0 && !running) void handleComplete();
  }, [handleComplete, remaining, running]);

  function setDuration(d: Preset) {
    setDurationState(d);
    setRunning(false);
    setRemaining(d * 60);
  }

  function start() {
    if (remaining === 0) setRemaining(duration * 60);
    if (
      typeof window !== "undefined" &&
      "Notification" in window &&
      Notification.permission === "default"
    ) {
      Notification.requestPermission();
    }
    setRunning(true);
  }

  function pause() {
    setRunning(false);
  }

  function reset() {
    setRunning(false);
    setRemaining(duration * 60);
  }

  return (
    <Ctx.Provider value={{ duration, remaining, running, setDuration, start, pause, reset }}>
      {children}
    </Ctx.Provider>
  );
}

export function useTimer() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useTimer must be inside TimerProvider");
  return v;
}

function playBell() {
  try {
    const Ctor =
      (
        window as unknown as {
          AudioContext: typeof AudioContext;
          webkitAudioContext?: typeof AudioContext;
        }
      ).AudioContext ??
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctor();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.connect(g);
    g.connect(ctx.destination);
    o.type = "sine";
    o.frequency.value = 880;
    g.gain.setValueAtTime(0.0001, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.3, ctx.currentTime + 0.05);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.5);
    o.start();
    o.stop(ctx.currentTime + 1.5);
  } catch {
    /* no-op */
  }
}

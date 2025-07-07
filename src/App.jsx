import { useState, useRef, useEffect } from "react";
import "./App.css";

export default function App() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isAutoplay, setIsAutoplay] = useState(false);
  const [points, setPoints] = useState([]);
  const [title, setTitle] = useState("LET'S PLAY");
  const [pointCount, setPointCount] = useState(10);
  const [gameStartTime, setGameStartTime] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [nextExpectedId, setNextExpectedId] = useState(1);

  const gameBoardRef = useRef(null);

  const generateRandomPoints = (count, width, height) => {
    const radius = 23;
    return Array.from({ length: count }, (_, index) => ({
      id: index + 1,
      x: Math.random() * (width - 2 * radius) + radius,
      y: Math.random() * (height - 2 * radius) + radius,
      visible: true,
      countdown: null,
      startTime: null,
      clicked: false,
    }));
  };

  const handlePlay = () => {
    setIsPlaying(true);
    setTitle("LET'S PLAY");
    setNextExpectedId(1);
    setElapsedTime(0);
    const now = performance.now();
    setGameStartTime(now);

    const board = gameBoardRef.current;
    if (board) {
      const { width, height } = board.getBoundingClientRect();
      const newPoints = generateRandomPoints(pointCount, width, height);
      setPoints(newPoints);
    }
  };

  const handleClickPoint = (id) => {
    if (id !== nextExpectedId) {
      setTitle("GAME OVER");
      setIsPlaying(false);
      setIsAutoplay(false);
      return;
    }

    const start = performance.now();
    setNextExpectedId((prev) => prev + 1);

    setPoints((prevPoints) =>
      prevPoints.map((p) =>
        p.id === id
          ? {
              ...p,
              countdown: 3.0,
              startTime: start,
              clicked: true,
            }
          : p
      )
    );
  };

  useEffect(() => {
    let animationFrame;

    const updateCountdown = () => {
      setPoints((prevPoints) =>
        prevPoints.map((p) => {
          if (!p.visible || p.countdown === null) return p;

          const elapsed = (performance.now() - p.startTime) / 1000;
          const remaining = Math.max(0, 3 - elapsed);

          if (remaining <= 0) {
            return {
              ...p,
              visible: false,
              countdown: null,
              startTime: null,
              clicked: false,
            };
          }

          return { ...p, countdown: remaining };
        })
      );

      animationFrame = requestAnimationFrame(updateCountdown);
    };

    if (points.some((p) => p.countdown !== null)) {
      animationFrame = requestAnimationFrame(updateCountdown);
    }

    return () => cancelAnimationFrame(animationFrame);
  }, [points]);

  useEffect(() => {
    let animationFrame;
    const updateGameTime = () => {
      if (!isPlaying || gameStartTime === null) return;

      const now = performance.now();
      const seconds = (now - gameStartTime) / 1000;
      setElapsedTime(seconds);
      animationFrame = requestAnimationFrame(updateGameTime);
    };

    if (isPlaying) {
      animationFrame = requestAnimationFrame(updateGameTime);
    }

    return () => cancelAnimationFrame(animationFrame);
  }, [isPlaying, gameStartTime]);

  useEffect(() => {
    let autoPlayTimer;

    if (isPlaying && isAutoplay) {
      autoPlayTimer = setInterval(() => {
        const next = points.find((p) => p.visible && p.id === nextExpectedId);
        if (next) {
          handleClickPoint(next.id);
        }
      }, 500);
    }

    return () => clearInterval(autoPlayTimer);
  }, [isAutoplay, isPlaying, points, nextExpectedId]);

  useEffect(() => {
    if (isPlaying && points.length > 0 && points.every((p) => !p.visible)) {
      setTitle("ALL CLEARED");
      setIsPlaying(false);
      setIsAutoplay(false);
    }
  }, [points]);

  const getTitleColorClass = () => {
    switch (title) {
      case "ALL CLEARED":
        return "title-green";
      case "GAME OVER":
        return "title-red";
      case "LET'S PLAY":
      default:
        return "title-blue";
    }
  };

  return (
    <div className="app-wrapper">
      <div className="content-box">
        <div className="controls-section">
          <div className="title">
            <h1 className={getTitleColorClass()}>{title}</h1>
          </div>

          <div className="inputs-group">
            <div className="points-wrapper">
              <label htmlFor="point">Points: </label>
              <input
                type="text"
                id="point"
                value={pointCount}
                onChange={(e) => setPointCount(Number(e.target.value))}
                min={1}
              />
            </div>

            <div className="time-wrapper">
              <label htmlFor="time">Time: </label>
              <div className="time">{elapsedTime.toFixed(1)}</div>
            </div>
          </div>

          <div className="control-buttons">
            {!isPlaying ? (
              <button type="play" onClick={handlePlay}>
                Play
              </button>
            ) : (
              <>
                <button type="reset" onClick={handlePlay}>
                  Reset
                </button>
                {isAutoplay ? (
                  <button type="stop" onClick={() => setIsAutoplay(false)}>
                    Auto Play ON
                  </button>
                ) : (
                  <button type="autoplay" onClick={() => setIsAutoplay(true)}>
                    Auto Play OFF
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        <div className="game-board-container">
          <div className="game-board" ref={gameBoardRef}>
            {points
              .filter((p) => p.visible)
              .sort((a, b) => b.id - a.id)
              .map((p) => (
                <div
                  key={p.id}
                  className={`point ${p.clicked ? "clicked" : ""}`}
                  onClick={() => handleClickPoint(p.id)}
                  style={{
                    left: `${p.x}px`,
                    top: `${p.y}px`,
                    opacity: p.clicked ? 0 : 1,
                    transition: p.clicked
                      ? "opacity 3s ease-in-out, background-color 0.3s"
                      : "none",
                  }}>
                  <div>
                    {p.id}
                    {p.countdown !== null && (
                      <div className="countdown">{p.countdown.toFixed(2)}</div>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </div>
        <div className="next-id">Next: {isPlaying ? nextExpectedId : "-"}</div>
      </div>
    </div>
  );
}

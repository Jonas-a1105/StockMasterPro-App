import { useEffect, useState } from 'react';

const splashStyles = `
.splash-root {
  position: fixed;
  inset: 0;
  z-index: 99999;
  background-color: var(--color-dark-850);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  transition: transform 0.9s cubic-bezier(0.65, 0, 0.35, 1), opacity 1.2s cubic-bezier(0.65, 0, 0.35, 1);
}
.splash-root.hidden {
  transform: translateY(-100vh);
  opacity: 0;
  pointer-events: none;
}
.splash-inner {
  width: 100%;
  max-width: 750px;
  padding: 40px;
}
.splash-inner svg {
  width: 100%;
  height: auto;
  overflow: visible;
}
.splash-inner path.splash-stroke {
  fill: none;
  stroke: var(--color-dark-100);
  stroke-width: 3.5;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-dasharray: 1200;
  stroke-dashoffset: 1200;
  animation: splashStroke 3s cubic-bezier(0.2, 1, 0.2, 1) forwards;
}
.splash-inner text.splash-text-main {
  fill: var(--color-dark-100);
  font-size: 34px;
  font-weight: 800;
  letter-spacing: -0.01em;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
  opacity: 0;
  transform: translateY(8px);
  animation: splashReveal 0.8s cubic-bezier(0.2, 1, 0.2, 1) 1.2s forwards;
}
.splash-inner text.splash-text-pro {
  fill: var(--orange-500);
  font-size: 20px;
  font-weight: 900;
  letter-spacing: 0.1em;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
  opacity: 0;
  transform: scale(0.7);
  transform-origin: 510px 113px;
  animation: splashProPop 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) 2.4s forwards, splashGlow 2.5s ease-in-out 3s infinite alternate;
}
.splash-inner text.splash-text-tagline {
  fill: var(--gray-500);
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.44em;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
  opacity: 0;
  transform: translateY(10px);
  animation: splashReveal 0.8s cubic-bezier(0.2, 1, 0.2, 1) 1.8s forwards;
}
.splash-inner path.splash-crown {
  fill: none;
  stroke: var(--orange-500);
  stroke-width: 2.5;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-dasharray: 100;
  stroke-dashoffset: 100;
  transform-origin: 510px 65px;
  transform: translateY(-15px) scale(0.6);
  opacity: 0;
  animation: splashDrawCrown 0.6s cubic-bezier(0.2, 1, 0.2, 1) 2.5s forwards, splashCrownDrop 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) 2.6s forwards;
}
.splash-inner .splash-float {
  animation: splashFloat 4s ease-in-out 3.2s infinite alternate;
}
@keyframes splashStroke { to { stroke-dashoffset: 0; } }
@keyframes splashReveal { to { opacity: 1; transform: translateY(0); } }
@keyframes splashProPop { to { opacity: 1; transform: scale(1); } }
@keyframes splashDrawCrown { to { stroke-dashoffset: 0; } }
@keyframes splashCrownDrop { to { opacity: 1; transform: translateY(0) scale(1); } }
@keyframes splashFloat { 0% { transform: translateY(0); } 100% { transform: translateY(-5px); } }
@keyframes splashGlow { 0%, 100% { filter: drop-shadow(0 0 0px transparent); } 50% { filter: drop-shadow(0 0 8px color-mix(in srgb, var(--orange-500) 50%, transparent)); } }
`;

export function SplashScreen({ onFinish }: { onFinish: () => void }) {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setHidden(true);
      setTimeout(onFinish, 1200);
    }, 4000);
    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <div className={`splash-root ${hidden ? 'hidden' : ''}`}>
      <style>{splashStyles}</style>
      <div className="splash-inner">
        <div className="splash-float">
          <svg viewBox="0 0 620 200">
            <path
              className="splash-stroke"
              d="
              M 95 65 
              C 65 65, 65 95, 90 100 
              C 115 105, 115 135, 85 135 
              L 115 70 
              L 135 110 
              L 155 70 
              L 155 135 
              H 470 
              V 95 
              H 550 
              V 135 
              H 468
            "
            />
            <path
              className="splash-crown"
              d="
              M 482 83 
              L 476 68 
              L 493 74 
              L 510 58 
              L 527 74 
              L 544 68 
              L 538 83 
              Z
            "
            />
            <text x="180" y="123" className="splash-text-main">
              StockMaster
            </text>
            <text x="484" y="121" className="splash-text-pro">
              PRO
            </text>
            <text x="182" y="160" className="splash-text-tagline">
              INVENTORY &amp; ANALYTICS PLATFORM
            </text>
          </svg>
        </div>
      </div>
    </div>
  );
}

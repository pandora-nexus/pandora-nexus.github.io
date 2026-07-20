"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";

export default function BeeRunner() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = 800;
    canvas.height = 400;

    // Oyun değişkenleri
    let bee = { x: 100, y: 300, vy: 0, width: 40, height: 40 };
    let gravity = 0.6;
    let jumpPower = -12;
    let obstacles: { x: number; y: number; width: number; height: number }[] = [];
    let score = 0;
    let gameOver = false;
    let frameCount = 0;

    // Klavye kontrolü
    const keys: Record<string, boolean> = {};
    window.addEventListener("keydown", (e) => {
      keys[e.code] = true;
      if (e.code === "Space" && gameOver) {
        resetGame();
      }
    });
    window.addEventListener("keyup", (e) => {
      keys[e.code] = false;
    });

    function resetGame() {
      bee = { x: 100, y: 300, vy: 0, width: 40, height: 40 };
      obstacles = [];
      score = 0;
      gameOver = false;
      frameCount = 0;
    }

    function jump() {
      if (bee.y + bee.height >= canvas!.height - 50) {
        bee.vy = jumpPower;
      }
    }

    function spawnObstacle() {
      const height = 30 + Math.random() * 40;
      obstacles.push({
        x: canvas!.width,
        y: canvas!.height - 50 - height,
        width: 25,
        height: height,
      });
    }

    function drawBee() {
      // Gövde
      ctx!.fillStyle = "#facc15";
      ctx!.fillRect(bee.x, bee.y, bee.width, bee.height);

      // Çizgiler
      ctx!.fillStyle = "#000";
      ctx!.fillRect(bee.x + 5, bee.y + 10, 30, 5);
      ctx!.fillRect(bee.x + 5, bee.y + 25, 30, 5);

      // Gözler
      ctx!.fillStyle = "#fff";
      ctx!.fillRect(bee.x + 28, bee.y + 5, 8, 8);
      ctx!.fillStyle = "#000";
      ctx!.fillRect(bee.x + 31, bee.y + 7, 4, 4);

      // Kanatlar
      ctx!.fillStyle = "rgba(255,255,255,0.5)";
      const wingOffset = Math.sin(frameCount * 0.3) * 5;
      ctx!.fillRect(bee.x + 10, bee.y - 10 + wingOffset, 20, 8);
    }

    function drawObstacles() {
      ctx!.fillStyle = "#ef4444";
      for (const obs of obstacles) {
        ctx!.fillRect(obs.x, obs.y, obs.width, obs.height);
      }
    }

    function drawGround() {
      ctx!.fillStyle = "#374151";
      ctx!.fillRect(0, canvas!.height - 50, canvas!.width, 50);
      ctx!.fillStyle = "#4b5563";
      ctx!.fillRect(0, canvas!.height - 50, canvas!.width, 2);
    }

    function drawUI() {
      ctx!.fillStyle = "#fff";
      ctx!.font = "16px monospace";
      ctx!.fillText(`Score: ${score}`, 20, 30);

      if (gameOver) {
        ctx!.fillStyle = "rgba(0,0,0,0.7)";
        ctx!.fillRect(0, 0, canvas!.width, canvas!.height);
        ctx!.fillStyle = "#facc15";
        ctx!.font = "32px monospace";
        ctx!.textAlign = "center";
        ctx!.fillText("GAME OVER", canvas!.width / 2, canvas!.height / 2 - 20);
        ctx!.fillStyle = "#fff";
        ctx!.font = "16px monospace";
        ctx!.fillText(`Score: ${score} — Press SPACE to restart`, canvas!.width / 2, canvas!.height / 2 + 20);
        ctx!.textAlign = "left";
      }
    }

    function update() {
      if (gameOver) return;

      // Zıplama
      if (keys["Space"] || keys["ArrowUp"]) {
        if (bee.y + bee.height >= canvas!.height - 50) {
          jump();
        }
        keys["Space"] = false;
      }

      // Fizik
      bee.vy += gravity;
      bee.y += bee.vy;

      // Yere değme
      if (bee.y + bee.height >= canvas!.height - 50) {
        bee.y = canvas!.height - 50 - bee.height;
        bee.vy = 0;
      }

      // Engel oluşturma
      frameCount++;
      if (frameCount % 80 === 0) {
        spawnObstacle();
      }

      // Engelleri hareket ettir
      for (const obs of obstacles) {
        obs.x -= 5;
      }

      // Çarpışma kontrolü
      for (const obs of obstacles) {
        if (
          bee.x < obs.x + obs.width &&
          bee.x + bee.width > obs.x &&
          bee.y < obs.y + obs.height &&
          bee.y + bee.height > obs.y
        ) {
          gameOver = true;
        }
      }

      // Ekrandan çıkan engelleri temizle ve skor artır
      obstacles = obstacles.filter((obs) => {
        if (obs.x + obs.width < 0) {
          score += 10;
          return false;
        }
        return true;
      });
    }

    function draw() {
      ctx!.fillStyle = "#111827";
      ctx!.fillRect(0, 0, canvas!.width, canvas!.height);

      drawGround();
      drawObstacles();
      drawBee();
      drawUI();
    }

    function gameLoop() {
      update();
      draw();
      requestAnimationFrame(gameLoop);
    }

    gameLoop();

    return () => {
      window.removeEventListener("keydown", () => {});
      window.removeEventListener("keyup", () => {});
    };
  }, []);

  return (
    <div className="min-h-screen bg-black text-white font-mono p-10">
      <Link href="/studio" className="text-gray-500 hover:text-white text-sm mb-8 block">
        ← Studio
      </Link>
      <h1 className="text-4xl font-bold mb-2">🐝 BEE Runner</h1>
      <p className="text-gray-500 mb-6">Press SPACE to jump. Avoid obstacles. Collect points.</p>

      <div className="border border-gray-800 inline-block">
        <canvas
          ref={canvasRef}
          className="block"
          style={{ maxWidth: "100%" }}
        />
      </div>

      <div className="mt-6 text-sm text-gray-600">
        <p>🕹️ Controls: SPACE or ↑ to jump</p>
        <p>📊 Each obstacle passed = +10 points</p>
        <p>🔄 Press SPACE after Game Over to restart</p>
      </div>
    </div>
  );
}
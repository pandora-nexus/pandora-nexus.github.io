import { Server as HTTPServer } from "http";
import { Server as SocketIOServer } from "socket.io";

let io: SocketIOServer | null = null;

export function initSocketServer(server: HTTPServer) {
  if (io) return io;

  io = new SocketIOServer(server, {
    cors: { origin: "*", methods: ["GET", "POST"] },
  });

  io.on("connection", (socket) => {
    console.log(`🔌 Kullanıcı bağlandı: ${socket.id}`);

    // Oyun odasına katılma
    socket.on("join-room", (roomId: string, username: string) => {
      socket.join(roomId);
      socket.to(roomId).emit("user-joined", { userId: socket.id, username });
      console.log(`👤 ${username} odaya katıldı: ${roomId}`);
    });

    // Oyun odasından ayrılma
    socket.on("leave-room", (roomId: string) => {
      socket.leave(roomId);
      socket.to(roomId).emit("user-left", { userId: socket.id });
      console.log(`👋 ${socket.id} odadan ayrıldı: ${roomId}`);
    });

    // Oyun durumu güncellemesi (pozisyon, skor vb.)
    socket.on("game-update", (roomId: string, data: any) => {
      socket.to(roomId).emit("game-state", { userId: socket.id, ...data });
    });

    // Sohbet mesajı
    socket.on("chat-message", (roomId: string, message: string, username: string) => {
      io?.to(roomId).emit("chat-message", { userId: socket.id, username, message, time: new Date().toISOString() });
    });

    // Bağlantı koptu
    socket.on("disconnect", () => {
      console.log(`🔌 Kullanıcı ayrıldı: ${socket.id}`);
      io?.emit("user-disconnected", { userId: socket.id });
    });
  });

  console.log("🔌 WebSocket sunucusu başlatıldı");
  return io;
}

export function getIO(): SocketIOServer | null {
  return io;
}
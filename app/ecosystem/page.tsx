import Link from "next/link";

const products = [
  { name: "BEE", desc: "Autonomous AI assistant and development platform" },
  { name: "BEE Mobile", desc: "Mobile ecosystem" },
  { name: "BEE Studio", desc: "Game development studio" },
  { name: "BEE Robotics", desc: "Robotic control systems" },
  { name: "BEE OS", desc: "Autonomous operating system" },
  { name: "BEE Cloud", desc: "Distributed computing infrastructure" },
  { name: "BEE Academy", desc: "AI-native education platform" },
];

export default function Ecosystem() {
  return (
    <div className="min-h-screen bg-black text-white font-mono p-10">
      <Link href="/" className="text-gray-500 hover:text-white text-sm mb-8 block">
        ← Home
      </Link>
      <h1 className="text-4xl font-bold mb-10">Ecosystem (2036)</h1>
      <div className="grid md:grid-cols-2 gap-6 max-w-4xl">
        {products.map((p) => (
          <div key={p.name} className="border border-gray-800 p-6 hover:border-gray-400 transition">
            <h2 className="text-xl font-bold mb-2">{p.name}</h2>
            <p className="text-gray-500">{p.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
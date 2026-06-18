import React, { useRef } from 'react';
import { motion, useTransform, useSpring, useMotionValue } from 'framer-motion';
import personImg from "../public/midjourney-Photoroom.png"
// --- YOUR LOCAL IMAGES HERE ---
// Replace this URL with: import personImg from './assets/your-image.png';
// const personImg = "https://images.unsplash.com/photo-1614798583421-2e2e7b483c79?q=80&w=800&auto=format&fit=crop";

// --- MODERN 3D HERO COMPONENT ---
const ModernHero3D = () => {
    const containerRef = useRef(null);

    // 1. Mouse Tracking Config
    const x = useMotionValue(0);
    const y = useMotionValue(0);

    // Smooth the mouse input so it feels heavy and premium
    const mouseX = useSpring(x, { stiffness: 120, damping: 35, mass: 0.5 });
    const mouseY = useSpring(y, { stiffness: 120, damping: 35, mass: 0.5 });

    function handleMouseMove(e) {
        const { clientX, clientY } = e;
        const { innerWidth, innerHeight } = window;
        // Calculate -1 to 1 based on screen position
        const xPct = (clientX / innerWidth - 0.5) * 2;
        const yPct = (clientY / innerHeight - 0.5) * 2;
        x.set(xPct);
        y.set(yPct);
    }

    return (
        <section
            ref={containerRef}
            onMouseMove={handleMouseMove}
            className="relative w-full h-[110vh] overflow-hidden bg-[#B5927C] flex flex-col items-center justify-center"
            style={{ perspective: '1500px' }} // Deep perspective
        >
            {/* --- BACKGROUND AMBIENCE --- */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#8B5E3C] to-[#4A3225] z-0" />

            {/* Moving Light/Shadow Spot */}
            <motion.div
                style={{ x: useTransform(mouseX, [-1, 1], [50, -50]), y: useTransform(mouseY, [-1, 1], [50, -50]) }}
                className="absolute top-1/4 left-1/4 w-[800px] h-[800px] bg-orange-400/20 blur-[120px] rounded-full pointer-events-none z-0 mix-blend-screen"
            />

            {/* --- 3D STAGE CONTAINER --- */}
            <motion.div
                style={{
                    rotateY: useTransform(mouseX, [-1, 1], [-15, 15]), // Tilt Left/Right
                    rotateX: useTransform(mouseY, [-1, 1], [15, -15]), // Tilt Up/Down
                    transformStyle: "preserve-3d",
                }}
                className="relative w-full max-w-[1200px] h-full flex items-center justify-center z-10"
            >

                {/* --- TEXT LAYER (Behind Person) --- */}
                <div className="absolute  top-[1%] text-center z-0" style={{ transform: "translateZ(-100px)" }}>
                    <motion.h2
                        initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1 }}
                        className="text-white/90 text-xl tracking-[0.3em] uppercase mb-4"
                    >
                        Personalized Health
                    </motion.h2>
                    <motion.h1
                        initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, delay: 0.2 }}
                        className="text-6xl md:text-9xl font-serif text-white leading-none"
                    >
                        Find your <br /> <span className="text-[#FFE5B4] italic">baseline.</span>
                    </motion.h1>
                </div>

                {/* --- THE PERSON (CENTER ANCHOR) --- */}
                <motion.div
                    style={{
                        x: useTransform(mouseX, [-1, 1], [-20, 20]), // Moves slightly opposite to mouse
                        y: useTransform(mouseY, [-1, 1], [-20, 20]),
                        transform: "translateZ(0px)"
                    }}
                    className="relative left-1/2 transform -translate-x-1/2 w-[320px] md:w-[420px] aspect-[3/4] rounded-[40px] overflow-hidden border-[6px] border-white/10 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] z-10"
                >
                    <img src={personImg} alt="Person" className="w-full h-full object-contain" />

                    {/* Interactive Shine Effect on Image */}
                    <motion.div
                        style={{
                            background: useTransform(mouseX, [-1, 1],
                                ["linear-gradient(90deg, transparent 0%, rgba(255,255,255,0) 100%)",
                                    "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.2) 100%)"])
                        }}
                        className="absolute inset-0 z-20 pointer-events-none"
                    />

                    {/* Floating UI Inside Image */}
                    <div className="absolute bottom-6 left-6 right-6">
                        <button className="w-full bg-white/90 backdrop-blur-md text-[#5C3D26] py-4 rounded-2xl font-bold text-lg shadow-lg hover:bg-white transition-colors">
                            Start Assessment
                        </button>
                    </div>
                </motion.div>


                {/* --- FLOATING ELEMENT 1: DNA (Deep Background) --- */}
                <FloatingElement
                    depth={-200} // Far back
                    x={-300} y={-200}
                    mouseX={mouseX} mouseY={mouseY}
                    delay={0}
                >
                    <div className="w-32 h-32 bg-white/5 backdrop-blur-sm rounded-full border border-white/10 flex items-center justify-center">
                        {/* <span className="text-6xl opacity-50">🧬</span> */}
                    </div>
                </FloatingElement>

                {/* --- FLOATING ELEMENT 2: GRAPH CARD (Foreground Left) --- */}
                <FloatingElement
                    depth={150} // Very close to screen
                    x={-450} y={-50}
                    mouseX={mouseX} mouseY={mouseY}
                    delay={1}
                    className="w-64"
                >
                    <GlassCard>
                        <div className="flex justify-between items-center mb-4">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse" />
                                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Testosterone</span>
                            </div>
                            <span className="text-[#15a276] font-bold bg-green-100 px-2 py-0.5 rounded text-xs">+12%</span>
                        </div>
                        {/* Fake Graph Lines */}
                        <div className="flex items-end gap-1 h-16 w-full opacity-80">
                            {[40, 65, 50, 80, 60, 90, 100].map((h, i) => (
                                <motion.div
                                    key={i}
                                    animate={{ height: [h + '%', (h - 20) + '%', h + '%'] }}
                                    transition={{ duration: 3, repeat: Infinity, delay: i * 0.1 }}
                                    className="flex-1 bg-gradient-to-t from-[#15a276] to-[#8de2c6] rounded-t-sm"
                                />
                            ))}
                        </div>
                    </GlassCard>
                </FloatingElement>

                {/* --- FLOATING ELEMENT 3: STATUS (Foreground Right) --- */}
                <FloatingElement
                    depth={100}
                    x={-320} y={100}
                    mouseX={mouseX} mouseY={mouseY}
                    delay={2}
                    className="w-56"
                >
                    <GlassCard>
                        <div className="flex gap-4 items-center">
                            <div className="relative w-12 h-12 flex items-center justify-center">
                                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                                    <path className="text-gray-200" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" />
                                    <path className="text-orange-500" strokeDasharray="75, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" />
                                </svg>
                                <span className="absolute text-[10px] font-bold text-gray-600">75%</span>
                            </div>
                            <div>
                                <h4 className="font-bold text-gray-800 text-sm">Action Plan</h4>
                                <p className="text-xs text-gray-400">3 steps remaining</p>
                            </div>
                        </div>
                    </GlassCard>
                </FloatingElement>

                {/* --- FLOATING ELEMENT 4: SMALL BADGE (Bottom Right) --- */}
                <FloatingElement
                    depth={60}
                    x={-200} y={200}
                    mouseX={mouseX} mouseY={mouseY}
                    delay={1.5}
                >
                    <div className="px-4 py-2 bg-white/90 backdrop-blur rounded-full shadow-xl flex items-center gap-2">
                        <span className="text-xl">🛡️</span>
                        <span className="text-xs font-bold text-[#5C3D26]">Privacy Protected</span>
                    </div>
                </FloatingElement>

            </motion.div>
        </section>
    );
};

// --- SUB-COMPONENTS ---

// 1. Reusable Glass Card Style
const GlassCard = ({ children }) => (
    <div className="bg-white/80 backdrop-blur-xl border border-white/60 shadow-[0_20px_40px_rgba(0,0,0,0.1)] p-5 rounded-3xl">
        {children}
    </div>
);

// 2. Logic for Physics/Movement
const FloatingElement = ({ children, depth, x, y, mouseX, mouseY, delay, className = "" }) => {
    // Parallax logic: Elements closer (higher depth) move MORE than elements far away
    const movementStrength = depth * 0.5;

    const xMotion = useTransform(mouseX, [-1, 1], [movementStrength, -movementStrength]);
    const yMotion = useTransform(mouseY, [-1, 1], [movementStrength, -movementStrength]);

    return (
        <motion.div
            style={{
                x: xMotion, // Move based on mouse
                y: yMotion,
                z: depth,   // CSS 3D depth
                translateX: x, // Initial Position
                translateY: y,
            }}
            // Continuous "Drift" animation independent of mouse
            animate={{
                translateY: [y, y - 15, y],
                rotate: [0, 2, -2, 0]
            }}
            transition={{
                duration: 5,
                ease: "easeInOut",
                repeat: Infinity,
                repeatType: "mirror",
                delay: delay
            }}
            className={`absolute ${className}`}
        >
            {children}
        </motion.div>
    );
};

export default ModernHero3D;

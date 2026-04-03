import React, { useRef, useState, useEffect } from 'react';
import {
    motion,
    useScroll,
    useTransform,
    useSpring,
    useMotionValue,
    useMotionValueEvent // Added this to track scroll events
} from 'framer-motion';
import {
    ArrowRight,
    Zap,
    ShieldCheck,
    Smartphone,
    ChevronRight
} from 'lucide-react';

import HeroCategories from './HeroCategories';
import Hero3D from './Hero3D';
import HeroComposite from './HeroComposite';
import HeroParallax from './HeroParallax';

/* --- 1. SHARED 3D COMPONENTS --- */

// The core 3D Tilt Logic (Reused for consistent feel)
const TiltCard = ({ children, className, intensity = 20 }) => {
    const x = useMotionValue(0);
    const y = useMotionValue(0);
    const mouseX = useSpring(x, { stiffness: 400, damping: 40 });
    const mouseY = useSpring(y, { stiffness: 400, damping: 40 });

    function onMouseMove({ currentTarget, clientX, clientY }) {
        const { left, top, width, height } = currentTarget.getBoundingClientRect();
        x.set(clientX - left - width / 2);
        y.set(clientY - top - height / 2);
    }

    const rotateX = useTransform(mouseY, [-300, 300], [intensity / 2, -intensity / 2]);
    const rotateY = useTransform(mouseX, [-300, 300], [-intensity / 2, intensity / 2]);

    // Shine effect moving with mouse
    const shineX = useTransform(mouseX, [-300, 300], ["0%", "100%"]);
    const shineY = useTransform(mouseY, [-300, 300], ["0%", "100%"]);

    return (
        <motion.div
            className={className}
            onMouseMove={onMouseMove}
            onMouseLeave={() => { x.set(0); y.set(0); }}
            style={{ perspective: 1000 }}
        >
            <motion.div
                style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
                className="h-full w-full relative transition-shadow duration-500"
            >
                {children}
                {/* Dynamic Light Reflection */}
                <motion.div
                    style={{
                        background: `radial-gradient(circle at ${shineX} ${shineY}, rgba(255,255,255,0.2), transparent 60%)`
                    }}
                    className="absolute inset-0 rounded-[inherit] pointer-events-none z-20 mix-blend-overlay"
                />
            </motion.div>
        </motion.div>
    );
};


/* --- 3. GLP-1 HERO (The "Moving Human" Section) --- */

const Glp1ScrollHero = () => {
    const ref = useRef(null);
    const { scrollYProgress } = useScroll({
        target: ref,
        offset: ["start end", "end start"]
    });

    // Parallax Values for "Moving" feel
    const yMan = useTransform(scrollYProgress, [0, 1], [100, -100]); // Man moves up
    const yPills = useTransform(scrollYProgress, [0, 1], [200, -200]); // Pills move faster
    const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0]);

    return (
        <section ref={ref} className="py-20 bg-gradient-to-b from-[#C27C4E] to-[#8B5E3C] relative overflow-hidden min-h-[800px] flex items-center">

            {/* Background Text Texture */}
            <div className="absolute top-10 left-0 w-full overflow-hidden opacity-10 pointer-events-none">
                <h1 className="text-[200px] font-bold text-white whitespace-nowrap animate-marquee">
                    GLP-1 GLP-1 GLP-1 GLP-1
                </h1>
            </div>

            <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-center relative z-10">

                {/* Left: Content */}
                <motion.div style={{ opacity, y: useTransform(scrollYProgress, [0, 1], [50, -50]) }}>
                    <div className="inline-block bg-white/20 backdrop-blur rounded-full px-4 py-1 text-white text-sm font-bold mb-6 border border-white/20">
                        New Treatment
                    </div>
                    <h2 className="text-6xl md:text-8xl font-serif text-white mb-8 leading-[0.9]">
                        Access a range of <br /> GLP-1 plans
                    </h2>
                    <div className="flex flex-col sm:flex-row gap-4">
                        <button className="bg-white text-[#8B5E3C] px-8 py-4 rounded-full font-bold shadow-xl hover:bg-stone-100 transition-colors">
                            Get started
                        </button>
                        <button className="bg-transparent border border-white/30 text-white px-8 py-4 rounded-full font-bold hover:bg-white/10 transition-colors">
                            See if I'm eligible
                        </button>
                    </div>
                </motion.div>

                {/* Right: The 3D Composition */}
                <div className="relative h-[600px] w-full flex items-center justify-center">

                    {/* The Man */}
                    <motion.div style={{ y: yMan }} className="relative z-10 w-[80%] h-[80%]">
                        <img
                            src="https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&q=80&w=800"
                            alt="Man exercising"
                            className="w-full h-full object-cover rounded-[3rem] shadow-2xl border-4 border-white/20 mask-image-gradient"
                        />
                    </motion.div>

                    {/* Floating Pill Bottle (Foreground) */}
                    <motion.img
                        src="https://images.unsplash.com/photo-1585435557343-3b092031a831?auto=format&fit=crop&q=80&w=300"
                        alt="Medication"
                        style={{ y: yPills, rotate: -15 }}
                        className="absolute top-0 right-0 w-48 h-48 object-contain drop-shadow-2xl z-20 rounded-full bg-white/10 backdrop-blur-sm p-4 border border-white/20"
                    />

                    {/* Floating Sphere (Background) */}
                    <motion.div
                        style={{ y: useTransform(scrollYProgress, [0, 1], [-100, 100]) }}
                        className="absolute bottom-10 left-[-50px] w-32 h-32 bg-orange-300/30 rounded-full blur-2xl z-0"
                    />
                </div>

            </div>
        </section>
    );
};

/* --- 4. NAVIGATION (UPDATED FOR SCROLL BEHAVIOR) --- */

const Navbar = () => {
    const { scrollY } = useScroll();
    const [hidden, setHidden] = useState(false);

    useMotionValueEvent(scrollY, "change", (latest) => {
        const previous = scrollY.getPrevious();
        // If latest > previous (scrolling down) AND we have scrolled at least 150px
        if (latest > previous && latest > 150) {
            setHidden(true);
        } else {
            // If scrolling up
            setHidden(false);
        }
    });

    return (
        <motion.nav
            variants={{
                visible: { y: 0 },
                hidden: { y: "-100%" },
            }}
            animate={hidden ? "hidden" : "visible"}
            transition={{ duration: 0.35, ease: "easeInOut" }}
            className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-2 py-4 bg-[#F4F1EA]/90 backdrop-blur-md border-b border-stone-200/50"
        >
            <div className="text-l font-serif font-bold tracking-tighter text-[#2A231D]">WellnessMeds</div>
            <div className="hidden md:flex space-x-8 text-sm font-medium text-[#5C5346]">
                <a href="#" className="hover:text-black">Weight Loss</a>
                <a href="#" className="hover:text-black">Hair Loss</a>
                <a href="#" className="hover:text-black">Sexual Health</a>
                <a href="#" className="hover:text-black">About</a>
            </div>
            <div className="flex items-center space-x-3">
                <button className="text-[#2A231D] font-bold text-sm px-2">Log in</button>
                <button className="bg-[#2A231D] text-white px-2 py-2 rounded-full text-sm font-bold hover:bg-black transition-colors">
                    Get started
                </button>
            </div>
        </motion.nav>
    );
};

/* --- 5. FOOTER & EXTRAS --- */

const Footer = () => (
    <footer className="bg-[#1A1510] text-stone-500 py-20 px-6 mt-0">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
            <h2 className="text-l font-serif text-white">WellnessMeds</h2>
            <p className="text-xs">© 2026 WellnessMeds, Inc.</p>
        </div>
    </footer>
);

// --- MAIN LAYOUT COMPONENT ---

const LandingPage = () => {
    return (
        <div className="min-h-screen bg-[#F4F1EA] font-sans selection:bg-orange-200">
            <Navbar />

            {/* 1. New Top Hero (Bento Grid) */}
            {/* <HeroParallax /> */}
            <HeroCategories />

            <Hero3D />
            <HeroComposite />
            {/* 2. GLP-1 Scroll Section (Moving Human) */}
            <Glp1ScrollHero />
            <HeroParallax />

            {/* 3. The "It's Personal" Section */}
            <section className="py-24 bg-[#966F4F] text-center">
                <h2 className="text-5xl font-serif text-white mb-8">It's more than a plan, it's personal.</h2>
                <p className="text-white/80 max-w-xl mx-auto mb-10">A provider licensed in your state will review your information.</p>
                <button className="bg-white text-[#966F4F] px-8 py-4 rounded-full font-bold shadow-xl">Get started</button>
            </section>

            <Footer />
        </div>
    );
};

export default LandingPage;
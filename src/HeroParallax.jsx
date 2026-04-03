import React, { useRef, useEffect } from 'react';
import { motion, useScroll, useTransform, useInView } from 'framer-motion';
import { ChevronRight } from 'lucide-react';

// --- IMPORT YOUR VIDEOS ---
import video1 from './assets/855564-hd_1920_1080_24fps.mp4';
import video2 from './assets/video2_opt.mp4';
import video3 from './assets/video3_opt.mp4';
import video4 from './assets/video4_opt.mp4';

const StickySection = ({ videoSrc, heading, text, buttonText, index }) => {
    const containerRef = useRef(null);
    const videoRef = useRef(null);

    const isInView = useInView(containerRef, { margin: "-10% 0px -10% 0px" });

    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start end", "end start"]
    });

    const yText = useTransform(scrollYProgress, [0, 1], [100, -100]);
    const opacityText = useTransform(scrollYProgress, [0.1, 0.5, 0.9], [0, 1, 0]);

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        if (isInView) {
            // FIX: Only seek to 0 if the video is paused/stopped 
            // This prevents the 'stutter' on the first section during reload
            if (video.paused) {
                video.currentTime = 0;
                const playPromise = video.play();
                if (playPromise !== undefined) {
                    playPromise.catch(() => { });
                }
            }
        } else {
            // OPTIMIZATION: Pause video when off-screen to save GPU/CPU
            video.pause();
        }
    }, [isInView]);

    return (
        <div
            ref={containerRef}
            className="sticky top-0 h-[100dvh] w-full overflow-hidden border-t border-white/10"
            style={{
                zIndex: index + 1,
                transform: "translate3d(0,0,0)",
                willChange: "transform"
            }}
        >
            <div className="absolute inset-0 w-full h-full">
                <video
                    ref={videoRef}
                    src={videoSrc}
                    // FIX: Removed autoPlay to let JS control the start smoothly
                    muted
                    loop
                    playsInline
                    preload="auto"
                    className="w-full h-full object-cover"
                    style={{
                        transform: "translateZ(0)",
                        backfaceVisibility: "hidden"
                    }}
                />
                <div className="absolute inset-0 bg-black/40" />
            </div>

            <motion.div
                style={{ y: yText, opacity: opacityText }}
                className="relative z-10 flex flex-col items-center justify-center h-full text-center text-white px-6 max-w-4xl mx-auto"
            >
                <h2 className="text-5xl md:text-8xl font-serif font-bold tracking-tighter mb-6 drop-shadow-2xl">
                    {heading}
                </h2>
                <p className="text-lg md:text-2xl font-light tracking-wide mb-10 text-white/90 max-w-2xl leading-relaxed">
                    {text}
                </p>
                <button className="group flex items-center gap-3 bg-white text-black px-8 py-4 rounded-full font-bold transition-transform hover:scale-105 active:scale-95 shadow-xl">
                    <span className="tracking-wide uppercase text-sm">{buttonText}</span>
                    <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
            </motion.div>
        </div>
    );
};

const HeroParallax = () => {
    const sections = [
        {
            heading: "Weight Loss",
            text: "Personalized GLP-1 plans to help you lose weight and keep it off.",
            buttonText: "Find my plan",
            videoSrc: video1
        },
        {
            heading: "Sexual Health",
            text: "Hard made easy. Clinically proven treatments prescribed online.",
            buttonText: "Start consultation",
            videoSrc: video2
        },
        {
            heading: "Hair Loss",
            text: "Regrow your confidence. Customized treatments to stop hair loss.",
            buttonText: "See hair options",
            videoSrc: video4
        },
        {
            heading: "Mental Health",
            text: "Support that revolves around you. Anxiety and depression treatment.",
            buttonText: "Get support",
            videoSrc: video3
        }
    ];

    return (
        <section className="relative w-full bg-black block min-h-screen">
            {sections.map((section, index) => (
                <StickySection key={index} {...section} index={index} />
            ))}
        </section>
    );
};

export default HeroParallax;
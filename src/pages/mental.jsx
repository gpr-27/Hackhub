import React, { useState, useRef, useEffect } from "react";
import "../styles/mental.css";
import { useNavigate } from "react-router-dom";

const mentalImages = [
    {
        title: "Homefood",
        img: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&q=80",
        desc: "Nutritious home-cooked meals for a healthy mind.",
        info: {
            bullets: [
                "Rich in vitamins and minerals",
                "Helps maintain energy levels",
                "Supports brain function",
            ],
            stars: [
                "⭐ Use fresh ingredients",
                "⭐ Avoid processed foods",
                "⭐ Stay hydrated",
            ],
        },
    },
    {
        title: "Meditation",
        img: "https://images.unsplash.com/photo-1464983953574-0892a716854b?auto=format&fit=crop&w=600&q=80",
        desc: "Daily meditation to reduce stress and improve focus.",
        info: {
            bullets: [
                "Reduces anxiety and stress",
                "Improves concentration",
                "Promotes emotional health",
            ],
            stars: [
                "⭐ Practice daily for best results",
                "⭐ Find a quiet space",
                "⭐ Focus on your breath",
            ],
        },
    },
    {
        title: "Society",
        img: "https://images.unsplash.com/photo-1511988617509-a57c8a288659?auto=format&fit=crop&w=600&q=80",
        desc: "Connect with your community for better mental health.",
        info: {
            bullets: [
                "Builds a support network",
                "Encourages positive habits",
                "Reduces feelings of loneliness",
            ],
            stars: [
                "⭐ Join local groups",
                "⭐ Volunteer for causes",
                "⭐ Stay in touch with friends",
            ],
        },
    },
    {
        title: "Tips",
        img: "https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=600&q=80",
        desc: "Practical tips for a balanced and positive lifestyle.",
        info: {
            bullets: [
                "Maintain a regular sleep schedule",
                "Exercise regularly",
                "Take breaks and relax",
            ],
            stars: [
                "⭐ Set realistic goals",
                "⭐ Celebrate small wins",
                "⭐ Practice gratitude",
            ],
        },
    },
];

function Mental() {
    const [modalOpen, setModalOpen] = useState(false);
    const [modalInfo, setModalInfo] = useState(null);
    const [modalTitle, setModalTitle] = useState("");
    const [timer, setTimer] = useState(300); // 5 minutes in seconds
    const [timerActive, setTimerActive] = useState(false);
    const audioRef = useRef(null);
    const navigate = useNavigate(); // <-- Add this line

    useEffect(() => {
        let interval = null;
        if (timerActive && timer > 0) {
            interval = setInterval(() => {
                setTimer((prev) => prev - 1);
            }, 1000);
        } else if (timer === 0) {
            setTimerActive(false);
            // Play sound when timer completes
            if (audioRef.current) {
                audioRef.current.play();
            }
        }
        return () => clearInterval(interval);
    }, [timerActive, timer]);

    const openModal = (info, title) => {
        setModalInfo(info);
        setModalTitle(title);
        setModalOpen(true);
        setTimer(300);
        setTimerActive(false);
    };

    const closeModal = () => {
        setModalOpen(false);
        setModalInfo(null);
        setModalTitle("");
        setTimer(300);
        setTimerActive(false);
    };

    // Helper to format timer as mm:ss
    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60).toString().padStart(2, "0");
        const s = (seconds % 60).toString().padStart(2, "0");
        return `${m}:${s}`;
    };

    return (
        <div className="mental-container">
            <button
    onClick={() => navigate("/Dashboard")}
    style={{
        margin: "18px 0 0 18px",
        padding: "10px 28px",
        background: "linear-gradient(90deg, #00b894 60%, #55efc4 100%)",
        color: "#fff",
        border: "none",
        borderRadius: "30px",
        fontWeight: 700,
        fontSize: "1.1rem",
        cursor: "pointer",
        boxShadow: "0 2px 12px rgba(0,184,148,0.13)",
        transition: "background 0.2s, transform 0.2s",
        position: "absolute",
        left: 0,
        top: 0,
        zIndex: 10,
        display: "flex",
        alignItems: "center",
        gap: "8px"
    }}
    onMouseOver={e => e.currentTarget.style.background = "linear-gradient(90deg, #55efc4 60%, #00b894 100%)"}
    onMouseOut={e => e.currentTarget.style.background = "linear-gradient(90deg, #00b894 60%, #55efc4 100%)"}
>
    <span style={{ fontSize: "1.3rem", marginRight: "4px" }}>←</span>
    Dashboard
</button>
           
            <header className="mental-header">
                <h1>Mental Wellness</h1>
                <p>Explore resources for a healthier mind and lifestyle.</p>
            </header>

            <section className="mental-cards">
                {mentalImages.map((item, idx) => (
                    <div
                        className="mental-card"
                        key={item.title}
                        onClick={() => openModal(item.info, item.title)}
                        style={{ cursor: "pointer" }}
                        title="Click for more info"
                    >
                        <img src={item.img} alt={item.title} className="card-img" />
                        <h3>{item.title}</h3>
                        <p>{item.desc}</p>
                    </div>
                ))}
            </section>
            {modalOpen && modalInfo && (
                <div className="mental-modal-overlay" onClick={closeModal}>
                    <div className="mental-modal" onClick={e => e.stopPropagation()}>
                        <button className="modal-close-btn" onClick={closeModal}>&times;</button>
                        <h2 style={{ color: "#00b894", marginBottom: 10 }}>{modalTitle}</h2>
                        <hr style={{ border: "none", borderTop: "2px solid #00b894", margin: "10px 0 18px 0" }} />
                        <div style={{ marginBottom: 18 }}>
                            <h4 style={{ color: "#636e72", marginBottom: 8, fontWeight: 600 }}>
                                <span role="img" aria-label="info">📋</span> Why it matters
                            </h4>
                            <ul style={{ paddingLeft: 24 }}>
                                {modalInfo.bullets.map((point, i) => (
                                    <li key={i} style={{ marginBottom: 7, fontSize: "1.05rem", color: "#222" }}>
                                        <span style={{ marginRight: 8, color: "#00b894", fontWeight: 700 }}>•</span>
                                        {point}
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div style={{ marginBottom: 18 }}>
                            <h4 style={{ color: "#636e72", marginBottom: 8, fontWeight: 600 }}>
                                <span role="img" aria-label="star">🌟</span> Healthy Habits
                            </h4>
                            <ul style={{ paddingLeft: 24 }}>
                                {modalInfo.stars.map((point, i) => (
                                    <li key={i} style={{ marginBottom: 7, fontSize: "1.05rem", color: "#444" }}>
                                        <span style={{ color: "#f1c40f", marginRight: 8 }}>⭐</span>
                                        {point.replace(/^⭐\s*/, "")}
                                    </li>
                                ))}
                            </ul>
                        </div>
                        {/* Meditation timer only for Meditation card */}
                        {modalTitle === "Meditation" && (
                            <div style={{
                                background: "#eafaf1",
                                borderRadius: 8,
                                padding: "14px 14px 10px 14px",
                                color: "#009966",
                                fontWeight: 600,
                                textAlign: "center",
                                marginTop: 10,
                                fontSize: "1.07rem"
                            }}>
                                <div style={{ marginBottom: 8 }}>
                                    Ready to meditate? Choose your session and start!
                                </div>
                                <div style={{ marginBottom: 10 }}>
                                    <button
                                        onClick={() => { setTimer(120); setTimerActive(true); }}
                                        style={{
                                            background: timerActive && timer === 120 ? "#00b894" : "#fff",
                                            color: timerActive && timer === 120 ? "#fff" : "#00b894",
                                            border: "2px solid #00b894",
                                            borderRadius: "6px",
                                            padding: "6px 14px",
                                            fontSize: "1rem",
                                            cursor: "pointer",
                                            marginRight: 8,
                                            marginBottom: 4
                                        }}
                                        disabled={timerActive}
                                    >
                                        2 min
                                    </button>
                                    <button
                                        onClick={() => { setTimer(300); setTimerActive(true); }}
                                        style={{
                                            background: timerActive && timer === 300 ? "#00b894" : "#fff",
                                            color: timerActive && timer === 300 ? "#fff" : "#00b894",
                                            border: "2px solid #00b894",
                                            borderRadius: "6px",
                                            padding: "6px 14px",
                                            fontSize: "1rem",
                                            cursor: "pointer",
                                            marginRight: 8,
                                            marginBottom: 4
                                        }}
                                        disabled={timerActive}
                                    >
                                        5 min
                                    </button>
                                    <button
                                        onClick={() => { setTimer(600); setTimerActive(true); }}
                                        style={{
                                            background: timerActive && timer === 600 ? "#00b894" : "#fff",
                                            color: timerActive && timer === 600 ? "#fff" : "#00b894",
                                            border: "2px solid #00b894",
                                            borderRadius: "6px",
                                            padding: "6px 14px",
                                            fontSize: "1rem",
                                            cursor: "pointer",
                                            marginBottom: 4
                                        }}
                                        disabled={timerActive}
                                    >
                                        10 min
                                    </button>
                                </div>
                                <div style={{
                                    fontSize: "1.5rem",
                                    marginTop: 6,
                                    color: "#222",
                                    fontWeight: 700,
                                    letterSpacing: 1
                                }}>
                                    {timerActive ? formatTime(timer) : "00:00"}
                                </div>
                                {timer === 0 && (
                                    <div style={{ color: "#00b894", marginTop: 8, fontWeight: 700 }}>
                                        Well done! You completed your meditation.
                                    </div>
                                )}
                                {/* Audio element for sound */}
                                <audio ref={audioRef} src='bells-1-72261.mp3' preload="auto" />
                            </div>
                        )}

                        {/* Default message for other cards */}
                        {modalTitle !== "Meditation" && (
                            <div style={{
                                background: "#eafaf1",
                                borderRadius: 8,
                                padding: "10px 14px",
                                color: "#009966",
                                fontWeight: 600,
                                textAlign: "center",
                                marginTop: 10,
                                fontSize: "1.07rem"
                            }}>
                                Follow these tips daily to stay healthy and happy!
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default Mental;
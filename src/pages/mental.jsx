import React, { useState, useEffect } from "react";
import "../styles/mental.css";
import { useNavigate } from "react-router-dom";

const Mental = () => {
    const navigate = useNavigate();
    const [activeActivity, setActiveActivity] = useState(null);
    
    // Breathing exercise states
    const [breathingPhase, setBreathingPhase] = useState('inhale');
    const [breathingTimer, setBreathingTimer] = useState(4);
    const [breathingActive, setBreathingActive] = useState(false);
    
    // Bubble pop states
    const [bubbles, setBubbles] = useState([]);
    const [bubblesPopped, setBubblesPopped] = useState(0);
    
    // Memory game states
    const [memoryCards, setMemoryCards] = useState([]);
    const [flippedCards, setFlippedCards] = useState([]);
    const [matchedCards, setMatchedCards] = useState([]);
    
    // Focus training states
    const [focusTarget, setFocusTarget] = useState({ x: 50, y: 50 });
    const [focusScore, setFocusScore] = useState(0);
    
    // Garden states
    const [gardenPlants, setGardenPlants] = useState([]);
    
    // Healthy living states
    const [selectedHealthyTopic, setSelectedHealthyTopic] = useState('overview');
    
    // Drawing board states
    const [isDrawing, setIsDrawing] = useState(false);
    const [brushSize, setBrushSize] = useState(5);
    const [brushColor, setBrushColor] = useState('#000000');
    const [canvasRef, setCanvasRef] = useState(null);


    const activities = [
        {
            id: 'breathing',
            title: 'Calm Breathing',
            description: 'Follow the breathing circle to find inner peace',
            icon: '🫁',
            color: '#ff6b6b',
            bgColor: '#ffe0e0'
        },
        {
            id: 'garden',
            title: 'Zen Garden',
            description: 'Create a peaceful virtual garden while meditating',
            icon: '🌸',
            color: '#ff9ff3',
            bgColor: '#fff0fe'
        },
        {
            id: 'bubble',
            title: 'Stress Relief Bubbles',
            description: 'Pop floating bubbles to release tension',
            icon: '🫧',
            color: '#74b9ff',
            bgColor: '#e8f4ff'
        },
        {
            id: 'memory',
            title: 'Memory Challenge',
            description: 'Train your brain with fun memory games',
            icon: '🧠',
            color: '#fd79a8',
            bgColor: '#ffeef5'
        },
        {
            id: 'focus',
            title: 'Focus Training',
            description: 'Improve concentration with attention exercises',
            icon: '🎯',
            color: '#a29bfe',
            bgColor: '#f1f0ff'
        },
        {
            id: 'healthy',
            title: 'Healthy Living',
            description: 'Read documentation about nutrition, sleep, exercise and wellness',
            icon: '🌱',
            color: '#00b894',
            bgColor: '#e8f5f3'
        },
        {
            id: 'drawing',
            title: 'Creative Drawing',
            description: 'Express yourself through art and creativity',
            icon: '🎨',
            color: '#e17055',
            bgColor: '#ffeaa7'
        },

    ];

    // Breathing exercise logic
    useEffect(() => {
        let interval = null;
        if (breathingActive) {
            interval = setInterval(() => {
                setBreathingTimer(prev => {
                    if (prev <= 1) {
                        setBreathingPhase(current => {
                            if (current === 'inhale') {
                                return 'hold';
                            } else if (current === 'hold') {
                                return 'exhale';
                            } else {
                                return 'inhale';
                            }
                        });
                        return 4; // Reset to 4 for inhale/exhale, will be handled separately for hold
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [breathingActive]);

    // Separate effect to handle hold phase duration
    useEffect(() => {
        if (breathingPhase === 'hold') {
            setBreathingTimer(2);
        } else {
            setBreathingTimer(4);
        }
    }, [breathingPhase]);

    // Bubble generation
    useEffect(() => {
        if (activeActivity === 'bubble') {
            const interval = setInterval(() => {
                setBubbles(prev => [
                    ...prev.slice(-20),
                    {
                        id: Date.now() + Math.random(),
                        x: Math.random() * 80 + 10,
                        y: 100,
                        size: Math.random() * 30 + 20,
                        speed: Math.random() * 2 + 1
                    }
                ]);
            }, 1000);
            return () => clearInterval(interval);
        }
    }, [activeActivity]);

    // Bubble animation
    useEffect(() => {
        if (activeActivity === 'bubble') {
            const interval = setInterval(() => {
                setBubbles(prev => prev.map(bubble => ({
                    ...bubble,
                    y: bubble.y - bubble.speed
                })).filter(bubble => bubble.y > -50));
            }, 50);
            return () => clearInterval(interval);
        }
    }, [activeActivity]);





    const startActivity = (activityId) => {
        setActiveActivity(activityId);
        
        // Initialize activity-specific states
        if (activityId === 'breathing') {
            setBreathingActive(true);
            setBreathingPhase('inhale');
            setBreathingTimer(4);
        } else if (activityId === 'bubble') {
            setBubbles([]);
            setBubblesPopped(0);
        } else if (activityId === 'memory') {
            const symbols = ['🌟', '🎈', '🦋', '🌺', '🎯', '🎨', '🍀', '🎭'];
            const cards = [...symbols, ...symbols].sort(() => Math.random() - 0.5);
            setMemoryCards(cards.map((symbol, index) => ({
                id: index,
                symbol,
                isFlipped: false,
                isMatched: false
            })));
            setFlippedCards([]);
            setMatchedCards([]);
        } else if (activityId === 'focus') {
            setFocusTarget({ x: Math.random() * 70 + 15, y: Math.random() * 70 + 15 });
            setFocusScore(0);
        } else if (activityId === 'garden') {
            setGardenPlants([]);
        } else if (activityId === 'healthy') {
            setSelectedHealthyTopic('overview');
        } else if (activityId === 'drawing') {
            setIsDrawing(false);
            setBrushSize(5);
            setBrushColor('#000000');
        }
    };

    const closeActivity = () => {
        setActiveActivity(null);
        setBreathingActive(false);
    };

    const popBubble = (bubbleId) => {
        setBubbles(prev => prev.filter(b => b.id !== bubbleId));
        setBubblesPopped(prev => prev + 1);
    };

    const flipCard = (cardId) => {
        if (flippedCards.length === 2) return;
        
        setMemoryCards(prev => prev.map(card => 
            card.id === cardId ? { ...card, isFlipped: true } : card
        ));
        
        setFlippedCards(prev => {
            const newFlipped = [...prev, cardId];
            if (newFlipped.length === 2) {
                setTimeout(() => checkMatch(newFlipped), 1000);
            }
            return newFlipped;
        });
    };

    const checkMatch = (cardsToCheck = flippedCards) => {
        const [first, second] = cardsToCheck;
        
        setMemoryCards(prev => {
            const firstCard = prev.find(card => card.id === first);
            const secondCard = prev.find(card => card.id === second);
            
            if (firstCard?.symbol === secondCard?.symbol) {
                setMatchedCards(prevMatched => [...prevMatched, first, second]);
                return prev; // Cards stay flipped
            } else {
                return prev.map(card => 
                    (card.id === first || card.id === second) 
                        ? { ...card, isFlipped: false } 
                        : card
                );
            }
        });
        
        setFlippedCards([]);
    };

    const hitFocusTarget = () => {
        setFocusScore(prev => prev + 1);
        setFocusTarget({ 
            x: Math.random() * 70 + 15, 
            y: Math.random() * 70 + 15 
        });
    };

    const plantFlower = (x, y) => {
        const flowers = ['🌸', '🌺', '🌻', '🌷', '🌹', '🌼'];
        setGardenPlants(prev => [
            ...prev,
            {
                id: Date.now(),
                x,
                y,
                flower: flowers[Math.floor(Math.random() * flowers.length)]
            }
        ]);
    };

    // Drawing functions
    const startDrawing = (e) => {
        if (!canvasRef) return;
        const canvas = canvasRef;
        const ctx = canvas.getContext('2d');
        const rect = canvas.getBoundingClientRect();
        
        setIsDrawing(true);
        ctx.beginPath();
        ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    };

    const draw = (e) => {
        if (!isDrawing || !canvasRef) return;
        const canvas = canvasRef;
        const ctx = canvas.getContext('2d');
        const rect = canvas.getBoundingClientRect();
        
        ctx.lineWidth = brushSize;
        ctx.lineCap = 'round';
        ctx.strokeStyle = brushColor;
        ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    };

    const stopDrawing = () => {
        setIsDrawing(false);
    };

    const clearCanvas = () => {
        if (!canvasRef) return;
        const ctx = canvasRef.getContext('2d');
        ctx.clearRect(0, 0, canvasRef.width, canvasRef.height);
    };

    const downloadDrawing = () => {
        if (!canvasRef) return;
        const link = document.createElement('a');
        link.download = 'my-drawing.png';
        link.href = canvasRef.toDataURL();
        link.click();
    };





    const renderActivity = () => {
        const activity = activities.find(a => a.id === activeActivity);
        if (!activity) return null;

        switch (activeActivity) {
            case 'breathing':
                return (
                    <div className="activity-content breathing-content">
                        <h3>Guided Breathing Exercise</h3>
                        <div className="breathing-circle-container">
                            <div className={`breathing-circle ${breathingPhase}`}>
                                <div className="breathing-text">
                                    <div className="phase-text">{breathingPhase.toUpperCase()}</div>
                                    <div className="timer-text">{breathingTimer}</div>
                                </div>
                            </div>
                        </div>
                        <p className="breathing-instruction">
                            {breathingPhase === 'inhale' && "Breathe in slowly through your nose"}
                            {breathingPhase === 'hold' && "Hold your breath gently"}
                            {breathingPhase === 'exhale' && "Breathe out slowly through your mouth"}
                        </p>
                    </div>
                );

            case 'garden':
                return (
                    <div className="activity-content garden-content">
                        <h3>Meditation Garden</h3>
                        <p>Click anywhere to plant flowers while you meditate</p>
                        <div 
                            className="garden-area"
                            onClick={(e) => {
                                const rect = e.currentTarget.getBoundingClientRect();
                                const x = ((e.clientX - rect.left) / rect.width) * 100;
                                const y = ((e.clientY - rect.top) / rect.height) * 100;
                                plantFlower(x, y);
                            }}
                        >
                            {gardenPlants.map(plant => (
                                <div
                                    key={plant.id}
                                    className="garden-plant"
                                    style={{ left: `${plant.x}%`, top: `${plant.y}%` }}
                                >
                                    {plant.flower}
                                </div>
                            ))}
                        </div>
                    </div>
                );

            case 'bubble':
                return (
                    <div className="activity-content bubble-content">
                        <h3>Bubble Pop Therapy</h3>
                        <p>Bubbles popped: {bubblesPopped}</p>
                        <div className="bubble-area">
                            {bubbles.map(bubble => (
                                <div
                                    key={bubble.id}
                                    className="bubble"
                                    style={{
                                        left: `${bubble.x}%`,
                                        top: `${bubble.y}%`,
                                        width: `${bubble.size}px`,
                                        height: `${bubble.size}px`
                                    }}
                                    onClick={() => popBubble(bubble.id)}
                                />
                            ))}
                        </div>
                    </div>
                );

            case 'memory':
                return (
                    <div className="activity-content memory-content">
                        <h3>Memory Challenge</h3>
                        <p>Match the pairs! Click cards to flip them.</p>
                        <div className="memory-stats">
                            Matches: {matchedCards.length / 2} / {memoryCards.length / 2}
                        </div>
                        <div className="memory-grid">
                            {memoryCards.map(card => (
                                <div
                                    key={card.id}
                                    className={`memory-card ${card.isFlipped || matchedCards.includes(card.id) ? 'flipped' : ''}`}
                                    onClick={() => !card.isFlipped && !matchedCards.includes(card.id) && flipCard(card.id)}
                                >
                                    <div className="card-front">?</div>
                                    <div className="card-back">{card.symbol}</div>
                                </div>
                            ))}
                        </div>
                        {matchedCards.length === memoryCards.length && (
                            <div className="memory-complete">🎉 Congratulations! All pairs matched!</div>
                        )}
                    </div>
                );

            case 'focus':
                return (
                    <div className="activity-content focus-content">
                        <h3>Focus Training</h3>
                        <p>Click the target as fast as you can!</p>
                        <div className="focus-score">Score: {focusScore}</div>
                        <div className="focus-area">
                            <div
                                className="focus-target"
                                style={{
                                    left: `${focusTarget.x}%`,
                                    top: `${focusTarget.y}%`
                                }}
                                onClick={hitFocusTarget}
                            >
                                🎯
                            </div>
                        </div>
                    </div>
                );

            case 'healthy':
                const healthyTopics = {
                    overview: {
                        title: "🌱 Healthy Living Overview",
                        content: (
                            <div className="healthy-overview">
                                <h4>Welcome to Healthy Living!</h4>
                                <p>Discover the fundamentals of a healthy lifestyle through proper nutrition, quality sleep, regular exercise, and overall wellness practices.</p>
                                <div className="health-categories">
                                    <div className="category-card" onClick={() => setSelectedHealthyTopic('nutrition')}>
                                        <div className="category-icon">🥗</div>
                                        <h5>Nutrition</h5>
                                        <p>Learn about balanced eating</p>
                                    </div>
                                    <div className="category-card" onClick={() => setSelectedHealthyTopic('sleep')}>
                                        <div className="category-icon">😴</div>
                                        <h5>Sleep Health</h5>
                                        <p>Improve your sleep quality</p>
                                    </div>
                                    <div className="category-card" onClick={() => setSelectedHealthyTopic('exercise')}>
                                        <div className="category-icon">🏃‍♂️</div>
                                        <h5>Exercise</h5>
                                        <p>Stay active and fit</p>
                                    </div>
                                    <div className="category-card" onClick={() => setSelectedHealthyTopic('wellness')}>
                                        <div className="category-icon">🧘‍♀️</div>
                                        <h5>Mental Wellness</h5>
                                        <p>Mind-body connection</p>
                                    </div>
                                </div>
                            </div>
                        )
                    },
                    nutrition: {
                        title: "🥗 Nutrition & Food",
                        content: (
                            <div className="healthy-content">
                                <div className="healthy-nav">
                                    <button onClick={() => setSelectedHealthyTopic('overview')}>← Back to Overview</button>
                                </div>
                                <h4>Healthy Eating Habits</h4>
                                <div className="nutrition-tips">
                                    <div className="tip-card">
                                        <h5>🍎 Eat the Rainbow</h5>
                                        <p>Include a variety of colorful fruits and vegetables in your diet. Different colors provide different nutrients and antioxidants.</p>
                                    </div>
                                    <div className="tip-card">
                                        <h5>💧 Stay Hydrated</h5>
                                        <p>Drink 8-10 glasses of water daily. Start your day with a glass of water and carry a water bottle with you.</p>
                                    </div>
                                    <div className="tip-card">
                                        <h5>🍽️ Portion Control</h5>
                                        <p>Use smaller plates, eat slowly, and listen to your hunger cues. Stop eating when you feel 80% full.</p>
                                    </div>
                                    <div className="tip-card">
                                        <h5>🥜 Healthy Snacks</h5>
                                        <p>Choose nuts, fruits, vegetables with hummus, or yogurt instead of processed snacks.</p>
                                    </div>
                                </div>
                            </div>
                        )
                    },
                    sleep: {
                        title: "😴 Sleep Health",
                        content: (
                            <div className="healthy-content">
                                <div className="healthy-nav">
                                    <button onClick={() => setSelectedHealthyTopic('overview')}>← Back to Overview</button>
                                </div>
                                <h4>Better Sleep for Better Health</h4>
                                <div className="sleep-tips">
                                    <div className="tip-card">
                                        <h5>🕘 Consistent Schedule</h5>
                                        <p>Go to bed and wake up at the same time every day, even on weekends. This helps regulate your body's internal clock.</p>
                                    </div>
                                    <div className="tip-card">
                                        <h5>📱 Digital Detox</h5>
                                        <p>Avoid screens at least 1 hour before bedtime. Blue light can interfere with your natural sleep hormones.</p>
                                    </div>
                                    <div className="tip-card">
                                        <h5>🛏️ Sleep Environment</h5>
                                        <p>Keep your bedroom cool (60-67°F), dark, and quiet. Invest in comfortable bedding and pillows.</p>
                                    </div>
                                    <div className="tip-card">
                                        <h5>☕ Watch Caffeine</h5>
                                        <p>Avoid caffeine 6 hours before bedtime. This includes coffee, tea, chocolate, and some sodas.</p>
                                    </div>
                                </div>
                            </div>
                        )
                    },
                    exercise: {
                        title: "🏃‍♂️ Exercise & Movement",
                        content: (
                            <div className="healthy-content">
                                <div className="healthy-nav">
                                    <button onClick={() => setSelectedHealthyTopic('overview')}>← Back to Overview</button>
                                </div>
                                <h4>Stay Active, Stay Healthy</h4>
                                <div className="exercise-tips">
                                    <div className="tip-card">
                                        <h5>🚶‍♀️ Daily Movement</h5>
                                        <p>Aim for at least 150 minutes of moderate exercise per week. This can be broken into 30 minutes, 5 days a week.</p>
                                    </div>
                                    <div className="tip-card">
                                        <h5>💪 Strength Training</h5>
                                        <p>Include resistance exercises 2-3 times per week. This helps maintain muscle mass and bone density.</p>
                                    </div>
                                    <div className="tip-card">
                                        <h5>🤸‍♂️ Flexibility</h5>
                                        <p>Incorporate stretching or yoga into your routine. This improves flexibility and reduces injury risk.</p>
                                    </div>
                                    <div className="tip-card">
                                        <h5>🎯 Start Small</h5>
                                        <p>Begin with 10-15 minutes of activity and gradually increase. Even a short walk is better than no activity.</p>
                                    </div>
                                </div>
                            </div>
                        )
                    },
                    wellness: {
                        title: "🧘‍♀️ Mental Wellness",
                        content: (
                            <div className="healthy-content">
                                <div className="healthy-nav">
                                    <button onClick={() => setSelectedHealthyTopic('overview')}>← Back to Overview</button>
                                </div>
                                <h4>Mind-Body Connection</h4>
                                <div className="wellness-tips">
                                    <div className="tip-card">
                                        <h5>🧘‍♀️ Mindfulness</h5>
                                        <p>Practice mindfulness meditation for 5-10 minutes daily. Focus on your breath and present moment awareness.</p>
                                    </div>
                                    <div className="tip-card">
                                        <h5>📝 Gratitude Journal</h5>
                                        <p>Write down 3 things you're grateful for each day. This simple practice can improve mood and outlook.</p>
                                    </div>
                                    <div className="tip-card">
                                        <h5>🤝 Social Connection</h5>
                                        <p>Maintain strong relationships with family and friends. Social support is crucial for mental health.</p>
                                    </div>
                                    <div className="tip-card">
                                        <h5>🌿 Nature Time</h5>
                                        <p>Spend time outdoors in nature. Even 20 minutes in a park can reduce stress and improve mood.</p>
                                    </div>
                                </div>
                            </div>
                        )
                    }
                };

                return (
                    <div className="activity-content healthy-content">
                        <h3>{healthyTopics[selectedHealthyTopic].title}</h3>
                        {healthyTopics[selectedHealthyTopic].content}
                    </div>
                );

            case 'drawing':
                return (
                    <div className="activity-content drawing-content">
                        <h3>Creative Drawing Board</h3>
                        <p>Express your feelings and creativity through art!</p>
                        
                        <div className="drawing-controls">
                            <div className="control-group">
                                <label>Brush Size:</label>
                                <input
                                    type="range"
                                    min="1"
                                    max="20"
                                    value={brushSize}
                                    onChange={(e) => setBrushSize(e.target.value)}
                                    className="brush-size-slider"
                                />
                                <span>{brushSize}px</span>
                            </div>
                            
                            <div className="control-group">
                                <label>Color:</label>
                                <input
                                    type="color"
                                    value={brushColor}
                                    onChange={(e) => setBrushColor(e.target.value)}
                                    className="color-picker"
                                />
                            </div>
                            
                            <div className="color-presets">
                                <div className="preset-colors">
                                    {['#000000', '#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', '#ffa500', '#800080', '#ffc0cb'].map(color => (
                                        <div
                                            key={color}
                                            className="color-preset"
                                            style={{ backgroundColor: color }}
                                            onClick={() => setBrushColor(color)}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                        
                        <canvas
                            ref={setCanvasRef}
                            width={600}
                            height={400}
                            className="drawing-canvas"
                            onMouseDown={startDrawing}
                            onMouseMove={draw}
                            onMouseUp={stopDrawing}
                            onMouseLeave={stopDrawing}
                        />
                        
                        <div className="drawing-actions">
                            <button onClick={clearCanvas} className="clear-btn">
                                🗑️ Clear Canvas
                            </button>
                            <button onClick={downloadDrawing} className="download-btn">
                                💾 Download Art
                            </button>
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <div className="mental-container">
            <button
    onClick={() => navigate("/Dashboard")}
                className="back-button"
            >
                <span>←</span>
    Dashboard
</button>
           
            <header className="mental-header">
                <h1>🧠 Mental Wellness Activities</h1>
                <p>Interactive mini-games and exercises for your mental health</p>
            </header>

            {!activeActivity ? (
                <section className="activities-grid">
                    {activities.map((activity) => (
                        <div
                            key={activity.id}
                            className="activity-card"
                                        style={{
                                backgroundColor: activity.bgColor,
                                borderLeft: `4px solid ${activity.color}`
                            }}
                            onClick={() => startActivity(activity.id)}
                        >
                            
                            <div className="activity-icon">{activity.icon}</div>
                            <h3 style={{ color: activity.color }}>{activity.title}</h3>
                            <p>{activity.description}</p>
                                    <button
                                className="start-activity-btn"
                                style={{ backgroundColor: activity.color }}
                            >
                                {activity.id === 'healthy' ? '📖 Read Documentation' : '▶ Start Activity'}
                                    </button>
                                </div>
                    ))}
                </section>
            ) : (
                <div className="activity-modal">
                    <button className="close-activity-btn" onClick={closeActivity}>×</button>
                    {renderActivity()}
                </div>
            )}
        </div>
    );
};

export default Mental;
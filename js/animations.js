document.addEventListener("DOMContentLoaded", () => {

    // --- INTERSECTION OBSERVER FOR GENERAL ANIMATIONS ---
    const animationObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target); // Stop observing once visible
            }
        });
    }, {
        threshold: 0.1 // Trigger when 10% of the element is visible
    });

    // Observe all elements with the .animate-on-scroll class
    const elementsToAnimate = document.querySelectorAll('.animate-on-scroll');
    elementsToAnimate.forEach(el => animationObserver.observe(el));


    // --- ANIMATED COUNTER FOR ACHIEVEMENTS SECTION ---
    const counterObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const counter = entry.target;
                const targetValue = parseInt(counter.dataset.target, 10);
                let currentValue = 0;
                const duration = 2000; // 2 seconds
                const stepTime = Math.abs(Math.floor(duration / targetValue));

                const timer = setInterval(() => {
                    currentValue += 1;
                    counter.textContent = `${currentValue}+`;
                    if (currentValue === targetValue) {
                        // Handle special case for percentage
                        if (counter.dataset.suffix === '%') {
                             counter.textContent = `${targetValue}%`;
                        } else {
                             counter.textContent = `${targetValue}+`;
                        }
                        clearInterval(timer);
                    }
                }, stepTime < 1 ? 1 : stepTime); // Ensure interval is at least 1ms

                observer.unobserve(counter); // Stop observing after animation starts
            }
        });
    }, {
        threshold: 0.5 // Start when 50% is visible
    });

    // Observe all counter elements
    const counters = document.querySelectorAll('.animated-counter');
    counters.forEach(counter => counterObserver.observe(counter));
    
    // Also apply to the original achievement numbers if you keep them
    const achievementNumbers = document.querySelectorAll('.achievement-number');
    achievementNumbers.forEach(number => {
        // Set up counter for all achievement numbers
        if (number.dataset.target) {
            // If it already has data-target, observe it directly
            counterObserver.observe(number);
        } else {
            // If it doesn't have data-target, set it up from text content
            const value = parseInt(number.textContent.replace('+', '').replace('%', ''), 10);
            number.dataset.target = value;
            if(number.textContent.includes('%')) {
                number.dataset.suffix = '%';
            }
            counterObserver.observe(number);
        }
    });
}); 
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
                const targetText = counter.getAttribute('data-target') || '0';
                const targetValue = parseInt(targetText, 10);
                const suffix = counter.getAttribute('data-suffix') || '';

                // If target is 0 or invalid, just show it
                if (!targetValue) {
                    counter.textContent = targetText + suffix;
                    observer.unobserve(counter);
                    return;
                }

                let startTimestamp = null;
                const duration = 2000; // 2 seconds animation

                const step = (timestamp) => {
                    if (!startTimestamp) startTimestamp = timestamp;
                    const progress = Math.min((timestamp - startTimestamp) / duration, 1);

                    // Simple easing
                    const easeOutQuad = 1 - Math.pow(1 - progress, 3);

                    const currentValue = Math.floor(easeOutQuad * targetValue);

                    // Format output
                    if (suffix === '%') {
                        counter.textContent = `${currentValue}%`;
                    } else if (targetText.includes('+') || suffix === '+') {
                        counter.textContent = `${currentValue}+`;
                    } else {
                        counter.textContent = currentValue;
                    }

                    if (progress < 1) {
                        window.requestAnimationFrame(step);
                    } else {
                        // Ensure final value is exact
                        if (suffix === '%') {
                            counter.textContent = `${targetValue}%`;
                        } else if (targetText.includes('+') || suffix === '+') {
                            counter.textContent = `${targetValue}+`;
                        } else {
                            counter.textContent = targetValue;
                        }
                    }
                };

                window.requestAnimationFrame(step);
                observer.unobserve(counter);
            }
        });
    }, {
        threshold: 0.2 // Start when 20% is visible
    });

    // Observe all counter elements including new .stat-number
    const counters = document.querySelectorAll('.animated-counter, .achievement-number, .stat-number');
    counters.forEach(counter => {
        // If it doesn't have data-target but has text, try to parse it
        if (!counter.hasAttribute('data-target')) {
            const rawText = String(counter.textContent || '').trim();
            const value = parseInt(rawText.replace(/[^\d]/g, ''), 10) || 0;
            if (value > 0) {
                counter.setAttribute('data-target', value);
                if (rawText.includes('%')) counter.setAttribute('data-suffix', '%');
                if (rawText.includes('+')) counter.setAttribute('data-suffix', '+');
            }
        }
        counterObserver.observe(counter);
    });
}); 
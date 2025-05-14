// Scroll animations for FCSC website
document.addEventListener('DOMContentLoaded', () => {
  // Initialize Intersection Observer
  const animatedElements = document.querySelectorAll('.animate-on-scroll');
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        // Get the animation type from data attribute
        const animation = entry.target.dataset.animation || 'fade-in';
        
        // Add the animation class
        entry.target.classList.add(animation);
        entry.target.classList.add('animated');
        
        // Unobserve after animation is triggered
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.1,  // Trigger when 10% of the element is visible
    rootMargin: '0px 0px -50px 0px'  // Offset from the bottom
  });
  
  // Observe all elements with animation
  animatedElements.forEach(element => {
    observer.observe(element);
  });
  
  // Add initial animations for elements in view on page load
  setTimeout(() => {
    animatedElements.forEach(element => {
      const rect = element.getBoundingClientRect();
      if (rect.top < window.innerHeight) {
        const animation = element.dataset.animation || 'fade-in';
        element.classList.add(animation);
        element.classList.add('animated');
        observer.unobserve(element);
      }
    });
  }, 100);
});

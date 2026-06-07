import {
  ua_handlePrimaryNav,
  ua_handleSecondaryNav,
  ua_handleTitleBar
} from './minerva-3.6.3.js';
export {
  ua_handlePageSearch
} from './minerva-3.6.3.js';

/*
// Code from GPT on Legends. Somewhat more robust than the autoplay videos function below
// Needs to be reviewed and refactored to work on all autoplay videos
document.addEventListener('DOMContentLoaded', function () {
  const v = document.getElementById('heroVideo');
  if (!v) return;

  // Ensure inline + muted before any play attempt
  v.muted = true;
  v.playsInline = true;
  v.setAttribute('playsinline', '');
  v.setAttribute('webkit-playsinline', '');

  // Accessibility + interaction
  v.setAttribute('tabindex', '0');
  v.setAttribute('role', 'button');

  const togglePlay = () => (v.paused ? v.play().catch(()=>{}) : v.pause());

  // Click/tap to pause/resume AFTER autoplay
  v.addEventListener('click', (e) => { e.preventDefault(); togglePlay(); });
  v.addEventListener('touchend', (e) => { e.preventDefault(); togglePlay(); }, { passive: false });

  // Keyboard (space/enter)
  v.addEventListener('keydown', (e) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      togglePlay();
    }
  });

  // Nudge autoplay on various readiness signals (no user-gesture logic)
  const tryPlay = () => v.play().catch(()=>{});
  tryPlay();
  v.addEventListener('loadeddata', tryPlay, { once: true });
  v.addEventListener('canplay', tryPlay, { once: true });
  window.addEventListener('load', tryPlay, { once: true });
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) tryPlay();
  });
  window.addEventListener('pageshow', tryPlay, { once: true });
});
*/

function ua_handleAutoPlayVideoControls() {
  const videos = document.querySelectorAll('.wp-block-video video');

  videos.forEach(video => {
    video.addEventListener('click', () => {
      video.paused ? video.play() : video.pause();
    });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  ua_handleAutoPlayVideoControls();
  ua_handlePrimaryNav();
  ua_handleSecondaryNav();
  ua_handleTitleBar();
});

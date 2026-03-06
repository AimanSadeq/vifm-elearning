/**
 * Generates the embedded JavaScript runtime for lesson HTML files.
 * Handles: slide navigation, audio playback, auto-advance, progress, postMessage.
 */
export function getRuntimeJS(audioFiles: string[], durations: number[]): string {
  return `
<script>
(function(){
  var slides = document.querySelectorAll('.slide');
  var total = slides.length;
  var cur = 0;
  var audio = null;
  var autoAdvanceTimer = null;
  var isPlaying = false;

  // Audio file map (slide index -> filename)
  var audioFiles = ${JSON.stringify(audioFiles)};
  var durations = ${JSON.stringify(durations)};

  // DOM refs
  var prevBtn = document.getElementById('ctrl-prev');
  var nextBtn = document.getElementById('ctrl-next');
  var playBtn = document.getElementById('ctrl-play');
  var counter = document.getElementById('ctrl-counter');
  var progBar = document.getElementById('prog-fill');
  var stage = document.getElementById('stage');

  function showSlide(idx) {
    if (idx < 0 || idx >= total) return;
    // Stop current audio
    stopAudio();
    clearTimeout(autoAdvanceTimer);

    // Hide all, show target
    slides.forEach(function(s, i) {
      s.classList.remove('active');
      s.style.display = 'none';
    });
    cur = idx;

    // Clone for animation reset
    var original = slides[cur];
    var clone = original.cloneNode(true);
    original.parentNode.replaceChild(clone, original);
    slides = document.querySelectorAll('.slide');
    slides[cur].style.display = '';
    slides[cur].classList.add('active');

    // Initialize Lucide icons in the new slide
    if (typeof lucide !== 'undefined') {
      try { lucide.createIcons(); } catch(e) {}
    }

    updateUI();
    playSlideAudio();
  }

  function updateUI() {
    counter.textContent = (cur + 1) + ' / ' + total;
    progBar.style.width = ((cur + 1) / total * 100) + '%';
    prevBtn.disabled = cur === 0;
    nextBtn.disabled = cur === total - 1;

    // PostMessage progress to parent (for portal integration)
    try {
      window.parent.postMessage({
        type: 'vifm-lesson-progress',
        slideIndex: cur,
        totalSlides: total
      }, '*');
    } catch(e) {}
  }

  function playSlideAudio() {
    var file = audioFiles[cur];
    if (!file) {
      // No audio for this slide — auto-advance after duration
      isPlaying = true;
      updatePlayBtn();
      autoAdvanceTimer = setTimeout(function() {
        if (cur < total - 1) showSlide(cur + 1);
        else onLessonComplete();
      }, durations[cur] || 6500);
      return;
    }

    audio = new Audio('audio/' + file);
    audio.addEventListener('ended', function() {
      if (cur < total - 1) {
        setTimeout(function() { showSlide(cur + 1); }, 800);
      } else {
        onLessonComplete();
      }
    });
    audio.addEventListener('error', function() {
      // Fallback: advance after estimated duration
      autoAdvanceTimer = setTimeout(function() {
        if (cur < total - 1) showSlide(cur + 1);
        else onLessonComplete();
      }, durations[cur] || 6500);
    });
    audio.play().then(function() {
      isPlaying = true;
      updatePlayBtn();
    }).catch(function() {
      // Autoplay blocked — show play button
      isPlaying = false;
      updatePlayBtn();
    });
  }

  function stopAudio() {
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
      audio = null;
    }
    isPlaying = false;
    updatePlayBtn();
  }

  function togglePlay() {
    if (audio) {
      if (audio.paused) {
        audio.play();
        isPlaying = true;
      } else {
        audio.pause();
        clearTimeout(autoAdvanceTimer);
        isPlaying = false;
      }
    } else {
      // No audio — restart auto-advance or pause
      if (isPlaying) {
        clearTimeout(autoAdvanceTimer);
        isPlaying = false;
      } else {
        isPlaying = true;
        autoAdvanceTimer = setTimeout(function() {
          if (cur < total - 1) showSlide(cur + 1);
          else onLessonComplete();
        }, durations[cur] || 6500);
      }
    }
    updatePlayBtn();
  }

  function updatePlayBtn() {
    playBtn.textContent = isPlaying ? '⏸' : '▶';
    playBtn.title = isPlaying ? 'Pause' : 'Play';
  }

  function onLessonComplete() {
    isPlaying = false;
    updatePlayBtn();
    try {
      window.parent.postMessage({
        type: 'vifm-lesson-complete'
      }, '*');
    } catch(e) {}
  }

  // Event listeners
  prevBtn.addEventListener('click', function() { showSlide(cur - 1); });
  nextBtn.addEventListener('click', function() { showSlide(cur + 1); });
  playBtn.addEventListener('click', togglePlay);

  // Keyboard navigation
  document.addEventListener('keydown', function(e) {
    if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); showSlide(cur + 1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); showSlide(cur - 1); }
  });

  // Initialize
  showSlide(0);
})();
</script>`;
}

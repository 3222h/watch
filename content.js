function autoScrollYouTubeShorts() {
    let isScrolling = true;

    function getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    function scrollToNextShort() {
        if (!isScrolling) return;

        const videoContainer = document.querySelector('#shorts-container');
        if (videoContainer) {
            const downArrowEvent = new KeyboardEvent('keydown', {
                key: 'ArrowDown',
                code: 'ArrowDown',
                keyCode: 40,
                bubbles: true
            });
            videoContainer.dispatchEvent(downArrowEvent);
            console.log('Scrolled to next Short');

            setTimeout(scrollToNextShort, getRandomInt(10, 15) * 1000);
        } else {
            console.log('Shorts container not found. Stopping scroll.');
            isScrolling = false;
        }
    }

    setTimeout(scrollToNextShort, getRandomInt(10, 15) * 1000);

    window.stopScrolling = () => {
        isScrolling = false;
        console.log('Auto-scroll stopped.');
    };
}

if (location.href.includes("youtube.com/shorts")) {
    autoScrollYouTubeShorts();
}

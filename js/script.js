let currentSong = new Audio();
let songs = [];
let currFolder = '';

const play = document.querySelector("#play");
const volumeIcon = document.querySelector("#volumeIcon");
const muteIcon = document.querySelector("#muteIcon");
const volumeSlider = document.querySelector("#vol");

function secondsToMinutesSeconds(seconds) {
    if (isNaN(seconds) || seconds < 0) return "00:00";
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
}

async function getSongs(folder) {
    currFolder = folder;
    try {
        let response = await fetch(`/${folder}/`);
        if (!response.ok) throw new Error(`Network response was not ok: ${response.statusText}`);
        let text = await response.text();
        let div = document.createElement("div");
        div.innerHTML = text;
        let as = div.getElementsByTagName("a");
        songs = [];
        for (let element of as) {
            if (element.href.endsWith(".mp3")) {
                songs.push(element.href.split(`/${folder}/`)[1]);
            }
        }
        updateSongList();
    } catch (error) {
        console.error("Error fetching songs:", error);
    }
}

function updateSongList() {
    let songUL = document.querySelector(".songList ul");
    songUL.innerHTML = "";
    songs.forEach(song => {
        songUL.innerHTML += `
            <li>
                <img class="invert" src="/images/music.svg" alt="music">
                <div class="info">
                    <div>${song.replaceAll("%20", " ")}</div>
                    <div>Susmita</div>
                </div>
                <div class="playnow">
                    <span>Play Now</span>
                    <img src="/images/playnow.svg" alt="playnow">
                </div>
            </li>`;
    });

    document.querySelectorAll(".songList li").forEach(e => {
        e.addEventListener("click", () => {
            playMusic(e.querySelector(".info").firstElementChild.textContent.trim());
        });
    });
}

const playMusic = (track, pause = false) => {
    currentSong.src = `/${currFolder}/` + track;
    if (!pause) {
        currentSong.play();
        play.src = "/images/pause.svg";
    }
    document.querySelector(".songinfo").textContent = track;
    document.querySelector(".songtime").textContent = "00:00 / 00:00";
}

async function displayAlbums() {
    try {
        let response = await fetch(`/songs/`);
        if (!response.ok) throw new Error(`Network response was not ok: ${response.statusText}`);
        let text = await response.text();
        let div = document.createElement("div");
        div.innerHTML = text;
        let anchors = div.getElementsByTagName("a");
        let cardContainer = document.querySelector(".cardContainer");
        cardContainer.innerHTML = '';
        for (const e of anchors) {
            if (e.href.includes("/songs")) {
                let folder = e.href.split("/").slice(-2)[0];
                try {
                    let infoResponse = await fetch(`/songs/${folder}/info.json`);
                    if (!infoResponse.ok) throw new Error(`Network response was not ok: ${infoResponse.statusText}`);
                    let info = await infoResponse.json();
                    cardContainer.innerHTML += `
                        <div data-folder="${folder}" class="card">
                            <div class="play">
                                <svg width="40" height="40" xmlns="http://www.w3.org/2000/svg">
                                    <circle cx="20" cy="20" r="20" fill="green" />
                                    <svg x="12" y="12" width="16" height="16" xmlns="http://www.w3.org/2000/svg" fill-rule="evenodd" clip-rule="evenodd">
                                        <path d="M4 1 L14 8 L4 15 Z" fill="black" />
                                    </svg>
                                </svg>
                            </div>
                            <img src="/songs/${folder}/cover.jpg" alt="${info.title}">
                            <h3>${info.title}</h3>
                            <p>${info.description}</p>
                        </div>`;
                } catch (infoError) {
                    console.error(`Error fetching info for ${folder}:`, infoError);
                }
            }
        }

        document.querySelectorAll(".card").forEach(e => {
            e.addEventListener("click", async item => {
                const folder = item.currentTarget.dataset.folder;
                await getSongs(`songs/${folder}`);
                if (songs.length > 0) {
                    playMusic(songs[0]);
                } else {
                    console.error("No songs available to play.");
                }
            });
        });
    } catch (error) {
        console.error("Error displaying albums:", error);
    }
}

function updateVolumeColor(volumeSlider) {
    const value = volumeSlider.value;
    volumeSlider.style.background = value > 0
        ? `linear-gradient(to right, white ${value}%, gray ${value}%)`
        : 'gray';
}

async function main() {
    try {
        await getSongs("songs/happy");
        playMusic(songs[0], true);
        displayAlbums();

        play.addEventListener("click", () => {
            if (currentSong.paused) {
                currentSong.play();
                play.src = "/images/pause.svg";
            } else {
                currentSong.pause();
                play.src = "/images/play.svg";
            }
        });

        currentSong.addEventListener("timeupdate", () => {
            const currentTime = currentSong.currentTime;
            const duration = currentSong.duration;
            document.querySelector(".songtime").textContent = `${secondsToMinutesSeconds(Math.floor(currentTime))} / ${secondsToMinutesSeconds(Math.floor(duration))}`;
            document.querySelector(".circle").style.left = (currentTime / duration) * 100 + "%";
        });

        document.querySelector(".seekbar").addEventListener("click", e => {
            let percent = (e.offsetX / e.target.getBoundingClientRect().width) * 100;
            document.querySelector(".circle").style.left = percent + "%";
            currentSong.currentTime = (currentSong.duration * percent) / 100;
        });

        let isDragging = false;

        document.querySelector(".circle").addEventListener("mousedown", () => {
            isDragging = true;
        });

        document.addEventListener("mouseup", () => {
            if (isDragging) {
                isDragging = false;
            }
        });

        document.addEventListener("mousemove", (e) => {
            if (isDragging) {
                const seekbar = document.querySelector(".seekbar");
                const rect = seekbar.getBoundingClientRect();
                let percent = ((e.clientX - rect.left) / rect.width) * 100;
                percent = Math.max(0, Math.min(100, percent));
                document.querySelector(".circle").style.left = percent + "%";
                currentSong.currentTime = (currentSong.duration * percent) / 100;
            }
        });

        document.querySelector(".hamburger").addEventListener("click", () => {
            document.querySelector(".left").style.left = "0";
        });

        document.querySelector(".close").addEventListener("click", () => {
            document.querySelector(".left").style.left = "-120%";
        });

        document.querySelector("#previous").addEventListener("click", () => {
            let index = songs.indexOf(currentSong.src.split("/").slice(-1)[0]);
            if (index - 1 >= 0) {
                playMusic(songs[index - 1]);
            }
        });

        document.querySelector("#next").addEventListener("click", () => {
            let index = songs.indexOf(currentSong.src.split("/").slice(-1)[0]);
            if (index + 1 < songs.length) {
                playMusic(songs[index + 1]);
            }
        });

        volumeSlider.addEventListener("input", e => {
            currentSong.volume = e.target.value / 100;
            updateVolumeColor(volumeSlider);

            if (currentSong.volume === 0) {
                volumeIcon.style.display = "none";
                muteIcon.style.display = "block";
            } else {
                volumeIcon.style.display = "block";
                muteIcon.style.display = "none";
            }
        });

        updateVolumeColor(volumeSlider);
        volumeSlider.dispatchEvent(new Event('input'));

    } catch (error) {
        console.error("Error initializing the app:", error);
    }
}

main();

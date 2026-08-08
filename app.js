// --- DATABASE CONFIGURATION ---
const supabaseUrl = "https://wqrtiiqobomtsuxnvtbb.supabase.co";
const supabaseAnonKey = "sb_publishable_dFT0iV8_ldqKsQ1b73GHCg_Lc2KPK50";

// Use the globally loaded Supabase library
const createClient = window.supabase ? window.supabase.createClient : null;

// 1. Core Data Setup
const DEFAULT_MEMBERS_DATA = {
    shamini: {
        name: "SHAMINI",
        role: "R&D",
        bio: "Drives research and technical development pipelines. Explores experimental architectures and integrates next-generation libraries.",
        stats: { "Research": 96, "Algorithms": 90, "Prototyping": 88 },
        image: "shamini.png",
        songTitle: "Lofi Research Loop",
        songUrl: "",
        bgColor: "rgb(245, 166, 184)"
    },
    tejaswi: {
        name: "TEJASWI",
        role: "Backend",
        bio: "Builds high-performance server microservices, structures custom back-ends, and manages logic gateways. Dedicated to low-latency queries.",
        stats: { "Node.js / Go": 94, "API Design": 90, "Security": 85 },
        image: "tejaswi.png",
        songTitle: "Hyperthread Bassline",
        songUrl: "",
        bgColor: "rgb(192, 209, 206)"
    },
    sarvesh: {
        name: "SARVESH",
        role: "Database",
        bio: "Architects storage schemes, manages index files, and handles high-throughput queries. Optimizes structural integrity and query performance.",
        stats: { "SQL / NoSQL": 95, "Database Tuning": 92, "Data Security": 88 },
        image: "sarvesh.png",
        songTitle: "Relational Groove",
        songUrl: "",
        bgColor: "rgb(230, 223, 211)"
    },
    aadil: {
        name: "AADIL",
        role: "Frontend",
        bio: "Specializes in building modular UI components, optimizing frontend layouts, and managing clean state transitions. Passionate about interfaces.",
        stats: { "HTML / CSS": 96, "JavaScript": 92, "UI / UX Design": 90 },
        image: "aadil.png",
        songTitle: "Render Loop Synths",
        songUrl: "",
        bgColor: "rgb(252, 191, 41)"
    },
    pageTitle: "THE CREW",
    pageBgColor: "#0a0a0a" // Default background color
};

let MEMBERS_DATA = DEFAULT_MEMBERS_DATA;
let supabaseClient = null;
let isSupabaseActive = false;

// Initialize Supabase Client
if (supabaseUrl && supabaseAnonKey && supabaseUrl !== "YOUR_SUPABASE_URL") {
    try {
        supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
        isSupabaseActive = true;
        console.log("Supabase initialized successfully. Real-time syncing is online.");
    } catch (err) {
        console.error("Supabase failed to initialize:", err);
    }
}

// 2. Dynamic Audio Synth Loop Generator
let synthInterval = null;
let audioCtx = null;

function stopSynthMelody() {
    if (synthInterval) {
        clearInterval(synthInterval);
        synthInterval = null;
    }
}

function playSynthMelody(memberId) {
    stopSynthMelody();
    
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }

    const melodies = {
        shamini: [261.63, 293.66, 329.63, 392.00], 
        tejaswi: [220.00, 261.63, 293.66, 349.23], 
        sarvesh: [196.00, 220.00, 261.63, 293.66], 
        aadil: [293.66, 329.63, 392.00, 440.00]    
    };

    const notes = melodies[memberId] || melodies.shamini;
    let step = 0;

    synthInterval = setInterval(() => {
        if (!audioCtx || audioCtx.state === 'suspended') return;
        try {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(notes[step % notes.length], audioCtx.currentTime);
            
            gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
            
            osc.start();
            osc.stop(audioCtx.currentTime + 0.35);
            step++;
        } catch (e) {
            console.warn(e);
        }
    }, 400);
}

// 3. Initialize Page & Apply Saved Data
function initPage() {
    // Update main page title
    const titleEl = document.getElementById("page-title");
    if (titleEl) {
        titleEl.textContent = MEMBERS_DATA.pageTitle || "THE CREW";
    }

    // Apply global background color
    if (MEMBERS_DATA.pageBgColor) {
        document.body.style.backgroundColor = MEMBERS_DATA.pageBgColor;
    }

    Object.keys(MEMBERS_DATA).forEach(id => {
        if (id === "pageTitle" || id === "pageBgColor") return;
        const data = MEMBERS_DATA[id];
        
        // Update names
        const nameEl = document.querySelector(`[data-member="${id}"][data-field="name"]`);
        if (nameEl) nameEl.textContent = data.name;

        // Update roles
        const roleEl = document.querySelector(`[data-member="${id}"][data-field="role"]`);
        if (roleEl) roleEl.textContent = data.role;

        // Update images
        const imgEl = document.getElementById(`img-${id}`);
        if (imgEl) imgEl.src = data.image;

        // Apply background color dynamically
        const capsuleEl = document.getElementById(`capsule-${id}`);
        if (capsuleEl && data.bgColor) {
            capsuleEl.style.backgroundColor = data.bgColor;
        }
    });
}

// 4. Save Changes (Local Storage fallback vs Supabase update)
async function saveChange(memberId, field, value) {
    if (memberId === "global") {
        MEMBERS_DATA[field] = value;
    } else {
        MEMBERS_DATA[memberId][field] = value;
    }
    
    if (isSupabaseActive && supabaseClient) {
        const { error } = await supabaseClient
            .from('team_directory')
            .upsert({ id: 1, data: MEMBERS_DATA });
        if (error) {
            console.error("Supabase update failed:", error);
        } else {
            console.log("Supabase cloud update successful.");
        }
    } else {
        localStorage.setItem("team_data", JSON.stringify(MEMBERS_DATA));
        console.log("Local storage update complete.");
    }
}

// 5. Interactive Detail Drawer Logic
let activeMemberId = null;

function selectMember(id) {
    activeMemberId = id;
    const data = MEMBERS_DATA[id];
    if (!data) return;

    // Stop previous audio
    const audioPlayer = document.getElementById("drawer-audio-element");
    audioPlayer.pause();
    stopSynthMelody();

    // Populate drawer elements
    document.getElementById("drawer-img").src = data.image;
    
    const nameEl = document.getElementById("drawer-name");
    const roleEl = document.getElementById("drawer-role");
    const bioEl = document.getElementById("drawer-bio");
    const audioTitleEl = document.getElementById("drawer-audio-title");

    nameEl.textContent = data.name;
    nameEl.setAttribute("data-member", id);

    roleEl.textContent = data.role;
    roleEl.setAttribute("data-member", id);

    bioEl.textContent = data.bio;
    bioEl.setAttribute("data-member", id);

    audioTitleEl.textContent = data.songTitle;
    audioTitleEl.setAttribute("data-member", id);

    // Setup Audio Player Source
    if (data.songUrl) {
        audioPlayer.src = data.songUrl;
        audioPlayer.style.display = "block";
    } else {
        audioPlayer.src = "";
        audioPlayer.style.display = "none";
    }

    renderDrawerStats(id, data);

    document.getElementById("drawer-overlay").classList.add("active");
}

function renderDrawerStats(id, data) {
    const statsContainer = document.getElementById("drawer-stats");
    statsContainer.innerHTML = "";

    Object.entries(data.stats).forEach(([skill, value]) => {
        const statWrapper = document.createElement("div");
        statWrapper.innerHTML = `
            <div class="skill-row">
                <div class="skill-row-left">
                    <button class="delete-skill-btn" data-member="${id}" data-skill="${skill}" title="Delete skill">✕</button>
                    <span class="editable-skill-name" data-member="${id}" data-skill="${skill}">${skill}</span>
                </div>
                <span class="editable-skill-val" data-member="${id}" data-skill="${skill}" data-field="skill-val">${value}%</span>
            </div>
            <div class="stat-bar" data-member="${id}" data-skill="${skill}">
                <div class="stat-fill" id="fill-${skill.replace(/[^a-zA-Z0-9]/g, '')}"></div>
            </div>
        `;

        // Handle clicking on progress bar to change values
        const progressBar = statWrapper.querySelector(".stat-bar");
        progressBar.addEventListener("click", (e) => {
            const rect = progressBar.getBoundingClientRect();
            const clickPosition = (e.clientX - rect.left) / rect.width;
            const newPercentage = Math.round(clickPosition * 100);
            
            data.stats[skill] = newPercentage;
            saveChange(id, "stats", data.stats);
            renderDrawerStats(id, data);
        });

        // Handle delete skill button
        const delBtn = statWrapper.querySelector(".delete-skill-btn");
        delBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            delete data.stats[skill];
            saveChange(id, "stats", data.stats);
            renderDrawerStats(id, data);
        });

        statsContainer.appendChild(statWrapper);

        // Animate the fill
        setTimeout(() => {
            const el = document.getElementById(`fill-${skill.replace(/[^a-zA-Z0-9]/g, '')}`);
            if (el) el.style.width = `${value}%`;
        }, 100);
    });

    bindEditableElements();
}

// Add a new skill
window.addNewSkill = function() {
    if (!activeMemberId) return;
    const skillName = prompt("Enter name of new skill:");
    if (!skillName) return;
    
    const data = MEMBERS_DATA[activeMemberId];
    if (data.stats[skillName] !== undefined) {
        alert("Skill already exists!");
        return;
    }

    data.stats[skillName] = 50; 
    saveChange(activeMemberId, "stats", data.stats);
    renderDrawerStats(activeMemberId, data);
};

window.closeDrawer = function() {
    document.getElementById("drawer-overlay").classList.remove("active");
    const audioPlayer = document.getElementById("drawer-audio-element");
    audioPlayer.pause();
    stopSynthMelody();
    activeMemberId = null;
};

// Custom manual play triggers for synth if no custom track is loaded
const audioPlayerEl = document.getElementById("drawer-audio-element");
audioPlayerEl.addEventListener("play", () => {
    if (!audioPlayerEl.src) {
        playSynthMelody(activeMemberId);
    }
});
audioPlayerEl.addEventListener("pause", () => {
    stopSynthMelody();
});

// 6. In-place Editing Event Binding (Right-Click & Hold)
let touchTimer = null;
let uploadTargetMember = null;
const imageUploader = document.getElementById("image-uploader");
const audioUploader = document.getElementById("audio-uploader");

function enableTextEditing(element) {
    element.contentEditable = "true";
    element.focus();

    const range = document.createRange();
    range.selectNodeContents(element);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);

    function finishEdit() {
        element.contentEditable = "false";
        const val = element.textContent.trim();
        const memberId = element.getAttribute("data-member");
        const field = element.getAttribute("data-field");
        const oldSkillName = element.getAttribute("data-skill");

        if (memberId) {
            if (oldSkillName) {
                const stats = MEMBERS_DATA[memberId].stats;
                if (field === "skill-val") {
                    const num = parseInt(val.replace("%", "")) || 0;
                    stats[oldSkillName] = Math.max(0, Math.min(100, num));
                    saveChange(memberId, "stats", stats);
                    renderDrawerStats(memberId, MEMBERS_DATA[memberId]);
                } else {
                    const value = stats[oldSkillName];
                    delete stats[oldSkillName];
                    stats[val] = value;
                    saveChange(memberId, "stats", stats);
                    renderDrawerStats(memberId, MEMBERS_DATA[memberId]);
                }
            } else if (field) {
                saveChange(memberId, field.replace("drawer-", ""), val);
                
                if (field.startsWith("drawer-")) {
                    const targetField = field.replace("drawer-", "");
                    const syncEl = document.querySelector(`[data-member="${memberId}"][data-field="${targetField}"]`);
                    if (syncEl) syncEl.textContent = val;
                } else {
                    const syncEl = document.getElementById(`drawer-${field}`);
                    if (syncEl && activeMemberId === memberId) syncEl.textContent = val;
                }
            }
        }
        
        element.removeEventListener("blur", finishEdit);
        element.removeEventListener("keydown", keyHandler);
    }

    function keyHandler(e) {
        if (e.key === "Enter") {
            e.preventDefault();
            element.blur();
        }
    }

    element.addEventListener("blur", finishEdit);
    element.addEventListener("keydown", keyHandler);
}

function triggerImageUpload(memberId) {
    uploadTargetMember = memberId;
    imageUploader.click();
}

function triggerAudioUpload(memberId) {
    uploadTargetMember = memberId;
    audioUploader.click();
}

function extractDominantColor(dataUrl, callback) {
    const img = new Image();
    img.onload = function() {
        const canvas = document.createElement("canvas");
        canvas.width = 1;
        canvas.height = 1;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, 1, 1);
        const pixel = ctx.getImageData(0, 0, 1, 1).data;
        const rgb = `rgb(${pixel[0]}, ${pixel[1]}, ${pixel[2]})`;
        callback(rgb);
    };
    img.src = dataUrl;
}

function compressImage(dataUrl, callback) {
    const img = new Image();
    img.onload = function() {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        
        // Resize to a maximum dimension of 600px
        const maxDim = 600;
        let width = img.width;
        let height = img.height;
        
        if (width > height) {
            if (width > maxDim) {
                height = Math.round((height * maxDim) / width);
                width = maxDim;
            }
        } else {
            if (height > maxDim) {
                width = Math.round((width * maxDim) / height);
                height = maxDim;
            }
        }
        
        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);
        
        // Compress to JPEG at 75% quality (reduces size from 5MB to ~50KB)
        const compressedData = canvas.toDataURL("image/jpeg", 0.75);
        callback(compressedData);
    };
    img.src = dataUrl;
}

// Convert uploaded image
imageUploader.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file && uploadTargetMember) {
        const reader = new FileReader();
        reader.onload = function(evt) {
            const rawDataUrl = evt.target.result;
            
            // Compress the image first
            compressImage(rawDataUrl, (compressedDataUrl) => {
                const imgEl = document.getElementById(`img-${uploadTargetMember}`);
                if (imgEl) imgEl.src = compressedDataUrl;
                
                const drawerImg = document.getElementById("drawer-img");
                if (drawerImg && activeMemberId === uploadTargetMember) drawerImg.src = compressedDataUrl;

                saveChange(uploadTargetMember, "image", compressedDataUrl);

                extractDominantColor(compressedDataUrl, (color) => {
                    saveChange(uploadTargetMember, "bgColor", color);
                    const capsuleEl = document.getElementById(`capsule-${uploadTargetMember}`);
                    if (capsuleEl) {
                        capsuleEl.style.backgroundColor = color;
                    }
                });
            });
        };
        reader.readAsDataURL(file);
    }
});

// Convert uploaded audio
audioUploader.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file && uploadTargetMember) {
        const reader = new FileReader();
        reader.onload = function(evt) {
            const dataUrl = evt.target.result;
            
            saveChange(uploadTargetMember, "songUrl", dataUrl);
            saveChange(uploadTargetMember, "songTitle", file.name);

            if (activeMemberId === uploadTargetMember) {
                const audioTitle = document.getElementById("drawer-audio-title");
                if (audioTitle) audioTitle.textContent = file.name;
                
                const audioPlayer = document.getElementById("drawer-audio-element");
                audioPlayer.src = dataUrl;
                audioPlayer.style.display = "block";
                audioPlayer.play();
            }
        };
        reader.readAsDataURL(file);
    }
});

// Interactive background color changer
function triggerBgColorChange() {
    const newColor = prompt("Enter a background color (Hex or CSS name, e.g. #0a0a0a, #112233, slateblue):", MEMBERS_DATA.pageBgColor || "#0a0a0a");
    if (newColor !== null && newColor.trim() !== "") {
        document.body.style.backgroundColor = newColor.trim();
        saveChange("global", "pageBgColor", newColor.trim());
    }
}

function bindEditableElements() {
    document.querySelectorAll(".member-name, .member-role, .member-image, #drawer-name, #drawer-role, #drawer-bio, #drawer-audio-title, .drawer-audio-section, .editable-skill-name, .editable-skill-val, .main-page-title").forEach(el => {
        
        const newEl = el.cloneNode(true);
        el.parentNode.replaceChild(newEl, el);

        newEl.addEventListener("contextmenu", (e) => {
            e.preventDefault();
            e.stopPropagation();

            const memberId = newEl.getAttribute("data-member") || activeMemberId;
            
            if (newEl.tagName === "IMG") {
                triggerImageUpload(memberId);
            } else if (newEl.classList.contains("drawer-audio-section") || newEl.id === "drawer-audio-title") {
                triggerAudioUpload(memberId);
            } else {
                enableTextEditing(newEl);
            }
        });

        // Hold Detection
        const startHold = (e) => {
            touchTimer = setTimeout(() => {
                e.preventDefault();
                e.stopPropagation();
                const memberId = newEl.getAttribute("data-member") || activeMemberId;
                
                if (newEl.tagName === "IMG") {
                    triggerImageUpload(memberId);
                } else if (newEl.classList.contains("drawer-audio-section") || newEl.id === "drawer-audio-title") {
                    triggerAudioUpload(memberId);
                } else {
                    enableTextEditing(newEl);
                }
            }, 600);
        };

        const cancelHold = () => {
            if (touchTimer) clearTimeout(touchTimer);
        };

        newEl.addEventListener("mousedown", startHold);
        newEl.addEventListener("mouseup", cancelHold);
        newEl.addEventListener("mouseleave", cancelHold);
        newEl.addEventListener("touchstart", startHold, { passive: true });
        newEl.addEventListener("touchend", cancelHold);
        newEl.addEventListener("touchmove", cancelHold);
    });
}

// Main card capsule click logic
document.querySelectorAll(".capsule").forEach(capsule => {
    capsule.addEventListener("click", (e) => {
        if (e.target.hasAttribute("contenteditable") && e.target.contentEditable === "true") {
            return;
        }
        
        const nameEl = capsule.querySelector(".member-name");
        if (nameEl && nameEl.contentEditable !== "true") {
            const id = nameEl.getAttribute("data-member");
            selectMember(id);
        }
    });
});

// Setup Background click/hold events
document.body.addEventListener("contextmenu", (e) => {
    // Only prompt if right-clicking the background itself
    if (e.target === document.body || e.target.classList.contains("team-container") || e.target.classList.contains("team-layout-wrapper")) {
        e.preventDefault();
        triggerBgColorChange();
    }
});

let bgTouchTimer = null;
const startBgHold = (e) => {
    if (e.target === document.body || e.target.classList.contains("team-container") || e.target.classList.contains("team-layout-wrapper")) {
        bgTouchTimer = setTimeout(() => {
            e.preventDefault();
            triggerBgColorChange();
        }, 800);
    }
};
const cancelBgHold = () => {
    if (bgTouchTimer) clearTimeout(bgTouchTimer);
};

document.body.addEventListener("mousedown", startBgHold);
document.body.addEventListener("mouseup", cancelBgHold);
document.body.addEventListener("mouseleave", cancelBgHold);
document.body.addEventListener("touchstart", startBgHold, { passive: true });
document.body.addEventListener("touchend", cancelBgHold);
document.body.addEventListener("touchmove", cancelBgHold);

// 7. Load Initial Data & Subscribe (Supabase vs LocalStorage)
async function initDatabase() {
    if (isSupabaseActive && supabaseClient) {
        const { data, error } = await supabaseClient
            .from('team_directory')
            .select('data')
            .eq('id', 1)
            .single();

        if (error || !data) {
            console.log("No data found on Supabase. Seeding default data...");
            const { error: seedError } = await supabaseClient
                .from('team_directory')
                .upsert({ id: 1, data: DEFAULT_MEMBERS_DATA });
            if (seedError) console.error("Database seeding failed:", seedError);
            MEMBERS_DATA = DEFAULT_MEMBERS_DATA;
        } else {
            MEMBERS_DATA = data.data;
        }

        initPage();

        supabaseClient
            .channel('realtime:team_directory')
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'team_directory' }, payload => {
                console.log("Real-time cloud sync event triggered.");
                if (payload.new && payload.new.data) {
                    MEMBERS_DATA = payload.new.data;
                    initPage();
                    
                    if (activeMemberId) {
                        const updatedMember = MEMBERS_DATA[activeMemberId];
                        document.getElementById("drawer-img").src = updatedMember.image;
                        document.getElementById("drawer-name").textContent = updatedMember.name;
                        document.getElementById("drawer-role").textContent = updatedMember.role;
                        document.getElementById("drawer-bio").textContent = updatedMember.bio;
                        document.getElementById("drawer-audio-title").textContent = updatedMember.songTitle;
                        renderDrawerStats(activeMemberId, updatedMember);
                    }
                }
            })
            .subscribe();

    } else {
        // Offline Local Storage fallback
        let localData = JSON.parse(localStorage.getItem("team_data"));
        if (!localData) {
            localData = DEFAULT_MEMBERS_DATA;
            localStorage.setItem("team_data", JSON.stringify(localData));
        }
        MEMBERS_DATA = localData;
        initPage();
    }
    bindEditableElements();
}

initDatabase();

const originalPlay = HTMLMediaElement.prototype.play;
HTMLMediaElement.prototype.play = function() {
    if (this.id === "drawer-audio-element" && !this.src) {
        playSynthMelody(activeMemberId);
        return Promise.resolve();
    }
    return originalPlay.apply(this, arguments);
};
